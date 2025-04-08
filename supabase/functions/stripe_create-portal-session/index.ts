// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.land/manual/examples/deploy_node_server

// @ts-ignore - Deno modules
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
// @ts-ignore - Stripe module
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno';

// Get the Stripe secret key from environment variables
// @ts-ignore - Deno is available in Supabase Edge Functions
// These environment variables should be set in the Supabase dashboard
const DEFAULT_RETURN_URL = Deno.env.get('DEFAULT_RETURN_URL') || 'https://agentics.org/dashboard/membership';
const DEFAULT_TEST_EMAIL = Deno.env.get('DEFAULT_TEST_EMAIL') || 'test@example.com';
const DEFAULT_TEST_NAME = Deno.env.get('DEFAULT_TEST_NAME') || 'Test Customer';

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || '';

// Check if we're in test mode
const isTestMode = stripeSecretKey.startsWith('sk_test_');

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse the request body
    const { customerId, returnUrl, userEmail } = await req.json();

    // Validate the request
    if (!customerId) {
      return new Response(JSON.stringify({ error: 'Customer ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate customer ID format
    // Special case for 'cus_invalid' which is our signal to use email lookup
    const isInvalidCustomerId = customerId === 'cus_invalid';
    const isInvalidFormat = !customerId.startsWith('cus_') || 
                           customerId.startsWith('cus_live') || 
                           customerId.startsWith('cus_17');
                           
    if (isInvalidCustomerId || isInvalidFormat) {
      console.log('Invalid or placeholder customer ID detected:', customerId);
      
      // If user email is provided, try to look up the customer by email
      if (userEmail) {
        console.log('Attempting to find customer by email:', userEmail);
        
        try {
          // Search for customers with the provided email
          const customers = await stripe.customers.list({
            email: userEmail,
            limit: 1
          });
          
          // If a customer is found, use that customer ID
          if (customers.data.length > 0) {
            const validCustomerId = customers.data[0].id;
            console.log(`Found customer with email ${userEmail}: ${validCustomerId}`);
            
            // Create a portal session with the found customer ID
            const session = await stripe.billingPortal.sessions.create({
              customer: validCustomerId,
              return_url: returnUrl || DEFAULT_RETURN_URL,
            });
            
            return new Response(JSON.stringify({ 
              url: session.url,
              note: 'Used customer ID found by email lookup',
              customer_id: validCustomerId
            }), {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          } else {
            console.log(`No customer found with email: ${userEmail}`);
          }
        } catch (lookupError) {
          console.error('Error looking up customer by email:', lookupError);
        }
      }
      
      // Special handling for test mode
      if (isTestMode && customerId === 'cus_live') {
        return new Response(JSON.stringify({ 
          error: 'Test mode detected with production customer ID', 
          details: 'You are using a test API key with a production customer ID. In test mode, customer IDs should start with "cus_test_".',
          suggestion: 'Create a test customer in the Stripe dashboard or use the Stripe API to create one.'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({ 
        error: 'Invalid customer ID format. Expected a valid Stripe customer ID starting with "cus_".' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create a billing portal session
    try {
      // Get or create a portal configuration
      let configurationId;
      const configurations = await stripe.billingPortal.configurations.list();
      
      if (configurations.data.length === 0) {
        const configuration = await stripe.billingPortal.configurations.create({
          business_profile: {
            headline: 'Agentics Membership',
          },
          features: {
            subscription_cancel: {
              enabled: true,
              mode: 'at_period_end',
              proration_behavior: 'none',
            },
            subscription_pause: {
              enabled: false,
            },
          },
        });
        configurationId = configuration.id;
      } else {
        configurationId = configurations.data[0].id;
      }

      // Create the portal session
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        ...(configurationId && { configuration: configurationId }),
        return_url: returnUrl || DEFAULT_RETURN_URL,
      });

      // Return the portal URL
      return new Response(JSON.stringify({ url: session.url }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (stripeError: any) {
      console.error('Stripe error:', stripeError);
      
      // Handle specific Stripe errors
      if (stripeError.type === 'StripeInvalidRequestError') {
        if (stripeError.message.includes('No such customer')) {
          // If we're in test mode and the customer doesn't exist, create a test customer
          if (isTestMode) {
            try {
              console.log('Creating test customer with ID:', customerId);
              
              // Create a test customer with the provided ID
              const customer = await stripe.customers.create({
                email: DEFAULT_TEST_EMAIL,
                name: DEFAULT_TEST_NAME,
                metadata: {
                  source: 'agentics_edge_function',
                  created_at: new Date().toISOString()
                }
              });
              
              console.log('Created test customer:', customer.id);
              
              // Create a portal session with the new customer
              const session = await stripe.billingPortal.sessions.create({
                customer: customer.id,
                return_url: returnUrl || DEFAULT_RETURN_URL,
              });
              
              return new Response(JSON.stringify({ 
                url: session.url,
                note: 'Created new test customer since the provided ID did not exist'
              }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              });
            } catch (createError) {
              console.error('Error creating test customer:', createError);
            }
          }
          
          // Special handling for test mode
          if (isTestMode) {
            return new Response(JSON.stringify({ 
              error: 'Customer not found in Stripe test mode', 
              details: stripeError.message,
              suggestion: 'Create a test customer in the Stripe dashboard or use the Stripe API to create one.',
              debug_info: {
                customer_id: customerId,
                is_test_mode: isTestMode,
                stripe_key_prefix: stripeSecretKey.substring(0, 7)
              }
            }), {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          
          return new Response(JSON.stringify({ error: 'Customer not found in Stripe' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }
      
      return new Response(JSON.stringify({ 
        error: 'Failed to create portal session', 
        details: stripeError.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ 
      error: 'An unexpected error occurred', 
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

