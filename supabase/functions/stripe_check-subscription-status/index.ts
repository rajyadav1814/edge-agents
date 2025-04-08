// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.land/manual/examples/deploy_node_server

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno';

// Get the Stripe secret key from environment variables
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
    const { userEmail } = await req.json();

    // Validate the request
    if (!userEmail) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Checking subscription status for email:', userEmail);

    try {
      // Search for customers with the provided email
      const customers = await stripe.customers.list({
        email: userEmail,
        limit: 1
      });
      
      // If no customer is found, return not found status
      if (customers.data.length === 0) {
        console.log(`No customer found with email: ${userEmail}`);
        return new Response(JSON.stringify({ 
          status: 'not_found',
          hasActiveSubscription: false,
          message: 'No customer found for this email'
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get the customer ID
      const customerId = customers.data[0].id;
      console.log(`Found customer with email ${userEmail}: ${customerId}`);
      
      // Get the customer's subscriptions
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        limit: 10
      });

      // If no active subscriptions are found
      if (subscriptions.data.length === 0) {
        console.log(`No active subscriptions found for customer: ${customerId}`);
        return new Response(JSON.stringify({ 
          status: 'inactive',
          hasActiveSubscription: false,
          customerId: customerId,
          message: 'No active subscriptions found for this customer'
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Process subscription data to return relevant information
      const subscriptionDetails = subscriptions.data.map(subscription => {
        const plan = subscription.items.data[0]?.price?.product;
        let planName = 'Unknown Plan';
        
        // Try to get the plan name
        if (typeof plan === 'string') {
          planName = plan;
        } else if (plan && typeof plan === 'object' && 'name' in plan) {
          planName = plan.name;
        }

        return {
          subscriptionId: subscription.id,
          status: subscription.status,
          currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          plan: planName,
          priceId: subscription.items.data[0]?.price?.id || 'unknown',
          interval: subscription.items.data[0]?.price?.recurring?.interval || 'unknown',
          amount: subscription.items.data[0]?.price?.unit_amount || 0,
          currency: subscription.items.data[0]?.price?.currency || 'usd'
        };
      });

      // Return the subscription status and details
      return new Response(JSON.stringify({ 
        status: 'active',
        hasActiveSubscription: true,
        customerId: customerId,
        subscriptions: subscriptionDetails
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (stripeError: any) {
      console.error('Stripe error:', stripeError);
      
      return new Response(JSON.stringify({ 
        error: 'Failed to check subscription status', 
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
