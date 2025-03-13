// Supabase Edge Function to send contact form notification emails using Resend API
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

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
  // Get CORS headers with the appropriate origin
  const origin = req.headers.get('origin') || 'https://agentics.org';
  const responseHeaders = {
    ...corsHeaders,
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin
  };
  
  try {
    // Handle OPTIONS request (preflight)
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: responseHeaders });
    }
    
    // Get the expected anon key from environment variables
    const expectedAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!expectedAnonKey) {
      console.error('SUPABASE_ANON_KEY not set in environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: responseHeaders }
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
      if (anonKey === expectedAnonKey) {
        isAuthorized = true;
      }
    }
    
    // If not authorized, return 401 with debugging information
    if (!isAuthorized) {
      // Mask keys for security (show only first 10 chars)
      const maskKey = (key: string | null) => key ? `${key.substring(0, 10)}...` : 'undefined';
      
      // Get the token from the Authorization header if present
      const authToken = authHeader ? authHeader.replace('Bearer ', '') : null;
      const authTokenMasked = maskKey(authToken);
      
      // Get the anon_key from query parameter if present
      const url = new URL(req.url);
      const queryAnonKey = url.searchParams.get('anon_key');
      const queryAnonKeyMasked = maskKey(queryAnonKey);
      
      // Debug information
      const debugInfo = {
        error: 'Unauthorized - Invalid authentication',
        debug: {
          expectedKeyMasked: maskKey(expectedAnonKey),
          authHeaderPresent: !!authHeader,
          authTokenMasked: authHeader ? authTokenMasked : null,
          queryAnonKeyPresent: !!queryAnonKey,
          queryAnonKeyMasked: queryAnonKey ? queryAnonKeyMasked : null,
          authHeaderMatches: authToken === expectedAnonKey,
          queryAnonKeyMatches: queryAnonKey === expectedAnonKey
        }
      };
      
      console.error('Authentication failed');
      
      return new Response(
        JSON.stringify(debugInfo),
        { status: 401, headers: responseHeaders }
      );
    }

    // Parse request body
    const { recipients, subject, formData } = await req.json() as EmailRequest;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: responseHeaders }
      );
    }

    if (!recipients || !recipients.length || !formData) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: responseHeaders }
      );
    }

    // Validate recipients
    if (recipients.length > 5) {
      return new Response(
        JSON.stringify({ error: 'Too many recipients (max 5)' }),
        { status: 400, headers: responseHeaders }
      );
    }

    // Get Resend API key from environment variables
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'contact@agentics.org';

    if (!resendApiKey) {
      console.error('Resend API key missing');
      return new Response(
        JSON.stringify({ 
          error: 'Resend API key missing',
          emailSaved: true 
        }),
        { status: 500, headers: responseHeaders }
      );
    }

    // Format HTML email
    const escapeHtml = (str: string) => {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

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
              <span class="label">Name:</span> ${escapeHtml(formData.name)}
            </div>
            
            <div class="info">
              <span class="label">Email:</span> <a href="mailto:${escapeHtml(formData.email)}">${escapeHtml(formData.email)}</a>
            </div>
            
            <div class="info">
              <span class="label">Interests:</span> ${escapeHtml(formData.interests || 'Not specified')}
            </div>
            
            ${formData.message ? `
            <div class="info">
              <span class="label">Message:</span> ${escapeHtml(formData.message)}
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration missing for database operations');
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error - database connection',
          emailSent: false
        }),
        { status: 500, headers: responseHeaders }
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

    // Check if any emails failed to send
    const failedEmails = emailResults.filter(result => !result.success);
    if (failedEmails.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Failed to send some emails', failedEmails }),
        { status: 500, headers: responseHeaders }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailsSent: emailResults.length,
        contactId
      }),
      { headers: responseHeaders }
    );
  } catch (error) {
    console.error('Error sending email:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: responseHeaders }
    );
  }
});
