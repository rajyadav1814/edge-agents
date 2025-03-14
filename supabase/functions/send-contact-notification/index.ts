// Supabase Edge Function to send contact form notification emails using Resend API
// @ts-ignore - Deno modules
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

interface ContactFormData {
  name: string;
  email: string;
  interests: string;
  message?: string;
}

interface EmailRequest {
  recipients: string[];
  subject: string;
  content?: string;
  formData: ContactFormData;
}

serve(async (req) => {
  try {
    // Set CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
    };
    
    // Handle OPTIONS request (preflight)
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }
    
    // Get the expected anon key from environment variables
    const expectedAnonKey = Deno.env.get('VITE_SUPABASE_ANON_KEY');
    
    if (!expectedAnonKey) {
      console.error('VITE_SUPABASE_ANON_KEY not set in environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      );
    }
    
    // Check authorization
    // First try to get from Authorization header
    const authHeader = req.headers.get('Authorization');
    let isAuthorized = false;
    
    if (authHeader) {
      // Extract the token from the Authorization header
      const token = authHeader.replace('Bearer ', '');
      isAuthorized = token === expectedAnonKey;
    }
    
    // If not authorized by header, check for anon_key query parameter
    if (!isAuthorized) {
      const url = new URL(req.url);
      const anonKey = url.searchParams.get('anon_key');
      
      if (anonKey && anonKey === expectedAnonKey) {
        isAuthorized = true;
      }
    }
    
    // If not authorized, return 401
    if (!isAuthorized) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid authentication' }),
        { 
          status: 401, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      );
    }

    // Parse request body
    const { recipients, subject, formData } = await req.json() as EmailRequest;

    if (!recipients || !recipients.length || !formData) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
          } 
        }
      );
    }

    // Get Resend API key from environment variables
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'contact@example.com';

    if (!resendApiKey) {
      console.error('Resend API key missing');
      return new Response(
        JSON.stringify({ 
          error: 'Resend API key missing',
          emailSaved: true 
        }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
          } 
        }
      );
    }

    // Format HTML email
    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            h1 { color: #2563eb; }
            .info { margin-bottom: 10px; }
            .label { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>New Contact Form Submission</h1>
            <p>A new contact form has been submitted on the Agentics Membership page:</p>
            
            <div class="info">
              <span class="label">Name:</span> ${formData.name}
            </div>
            
            <div class="info">
              <span class="label">Email:</span> <a href="mailto:${formData.email}">${formData.email}</a>
            </div>
            
            <div class="info">
              <span class="label">Interests:</span> ${formData.interests || 'Not specified'}
            </div>
            
            ${formData.message ? `
            <div class="info">
              <span class="label">Message:</span> ${formData.message}
            </div>
            ` : ''}
            
            <div class="info">
              <span class="label">Source:</span> Membership Page
            </div>
            
            <div class="info">
              <span class="label">Date:</span> ${new Date().toLocaleString()}
            </div>
            
            <p>This information has been saved to the Supabase contacts table.</p>
          </div>
        </body>
      </html>
    `;

    // Create plain text version
    const textContent = `
New Contact Form Submission

A new contact form has been submitted on the Agentics Membership page:

Name: ${formData.name}
Email: ${formData.email}
Interests: ${formData.interests || 'Not specified'}
${formData.message ? `Message: ${formData.message}\n` : ''}
Source: Membership Page
Date: ${new Date().toLocaleString()}

This information has been saved to the Supabase contacts table.
    `;

    // Get Supabase client for database operations
    const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('VITE_SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration missing for database operations');
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error - database connection',
          emailSent: false
        }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      );
    }
    
    // Save contact to database
    let contactId = null;
    try {
      // Get request metadata
      const url = new URL(req.url);
      const headers = req.headers;
      const userAgent = headers.get('user-agent') || '';
      const referer = headers.get('referer') || '';
      const forwardedFor = headers.get('x-forwarded-for') || '';
      const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : '';
      
      // Call the Supabase function to save the contact
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/save_contact_form`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          interests: formData.interests || '',
          message: formData.message || '',
          source: 'membership_page',
          page_url: referer,
          user_agent: userAgent,
          ip_address: ipAddress
        })
      });
      
      if (response.ok) {
        contactId = await response.json();
        console.log('Contact saved with ID:', contactId);
      } else {
        const errorText = await response.text();
        console.error('Error saving contact to database:', errorText);
      }
    } catch (dbError) {
      console.error('Exception saving contact to database:', dbError);
    }

    // Send email to all recipients using Resend API
    const emailResults = await Promise.all(
      recipients.map(async (recipient) => {
        try {
          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: fromEmail,
              to: recipient,
              subject: subject,
              html: htmlContent,
              text: textContent,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error(`Error sending to ${recipient}:`, errorData);
            return { recipient, success: false, error: errorData };
          }

          const data = await response.json();
          return { recipient, success: true, data };
        } catch (error) {
          console.error(`Exception sending to ${recipient}:`, error);
          return { recipient, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
      })
    );

    return new Response(
      JSON.stringify({ 
        success: true, 
        recipients,
        contactSaved: contactId !== null,
        contactId
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
        } 
      }
    );
  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
        } 
      }
    );
  }
});
