// @ts-ignore - Deno modules
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore - Supabase client
import { createClient } from "https://esm.sh/@supabase/supabase-js";

// Environment variables
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("API_URL") || Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SERVICE_KEY") || Deno.env.get("SUPABASE_SERVICE_KEY")!;
// Email configuration
const DEFAULT_RECIPIENT = Deno.env.get("DEFAULT_RECIPIENT") || "user@example.com";
const NOTIFICATION_FROM_EMAIL = Deno.env.get("NOTIFICATION_FROM_EMAIL") || "notifications@agentics.org";
const FEEDBACK_FROM_EMAIL = Deno.env.get("FEEDBACK_FROM_EMAIL") || "feedback@agentics.org";
const FEEDBACK_REPLY_TO_DOMAIN = Deno.env.get("FEEDBACK_REPLY_TO_DOMAIN") || "agentics.org";

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Message types
enum MessageType {
  QUERY = 'query',
  RESPONSE = 'response',
  COMMAND = 'command',
  NOTIFICATION = 'notification',
  STATUS = 'status',
  ERROR = 'error',
  HUMAN_FEEDBACK = 'human_feedback'
}

const handler = async (req: Request): Promise<Response> => {
  // Check if it's a POST request
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  
  try {
    // Parse the request body
    const { agentName, message, recipient, action } = await req.json();
    
    if (!agentName || !message) {
      return new Response("Missing required fields: agentName, message", { status: 400 });
    }
    
    // Default recipient if not provided
    const emailRecipient = recipient || DEFAULT_RECIPIENT;
    
    // Check if RESEND_API_KEY is set
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not set");
      return new Response("Server configuration error: RESEND_API_KEY is not set", { status: 500 });
    }
    
    // Determine the action to take
    if (action === "notify") {
      // Send an email notification about the agent's message
      await sendEmailNotification(agentName, message, emailRecipient);
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Email notification sent successfully" 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } else if (action === "request_feedback") {
      // Send an email requesting human feedback
      await sendFeedbackRequest(agentName, message, emailRecipient);
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Feedback request sent successfully" 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } else {
      // Default to sending a notification
      await sendEmailNotification(agentName, message, emailRecipient);
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Email notification sent successfully" 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
  } catch (error) {
    console.error("Error:", error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

// Function to send an email notification
async function sendEmailNotification(agentName: string, message: string, recipient: string): Promise<void> {
  // Create HTML content for the email
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3a86ff;">Message from ${agentName}</h2>
      <div style="border-left: 4px solid #3a86ff; padding-left: 15px; margin: 20px 0;">
        <p style="color: #333;">${message}</p>
      </div>
      <p style="color: #666; font-size: 14px;">This is an automated notification from the Agentic Inbox system.</p>
      <p style="color: #666; font-size: 14px;">To respond, reply to this email or use the CLI client.</p>
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999;">
        <p>Agentic Inbox System - ${new Date().toISOString()}</p>
      </div>
    </div>
  `;
  
  // Send the email using Resend API
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`
    },
    body: JSON.stringify({
      from: `Agentic Inbox <${NOTIFICATION_FROM_EMAIL}>`,
      to: [recipient],
      subject: `[Agentic Inbox] New message from ${agentName}`,
      html: htmlContent,
    })
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(`Failed to send email: ${JSON.stringify(errorData)}`);
  }
  
  // Log the notification in the database
  await supabase
    .from("agentic_inbox.agent_logs")
    .insert({
      agent_id: agentName,
      action_type: "email_notification",
      details: { message, recipient }
    });
}

// Function to send a feedback request
async function sendFeedbackRequest(agentName: string, message: string, recipient: string): Promise<void> {
  // Generate a unique token for this feedback request
  const feedbackToken = crypto.randomUUID();
  
  // Store the feedback request in the database
  await supabase
    .from("agentic_inbox.feedback_requests")
    .insert({
      token: feedbackToken,
      agent_id: agentName,
      message,
      recipient,
      status: "pending"
    });
  
  // Create HTML content for the email with feedback buttons
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3a86ff;">Feedback Request from ${agentName}</h2>
      <div style="border-left: 4px solid #3a86ff; padding-left: 15px; margin: 20px 0;">
        <p style="color: #333;">${message}</p>
      </div>
      <p style="color: #666;">Please provide your feedback by clicking one of the options below:</p>
      
      <div style="margin: 30px 0; text-align: center;">
        <a href="${SUPABASE_URL}/functions/v1/feedback?token=${feedbackToken}&response=approve" style="display: inline-block; background-color: #4caf50; color: white; padding: 10px 20px; margin: 0 10px; text-decoration: none; border-radius: 4px;">Approve</a>
        <a href="${SUPABASE_URL}/functions/v1/feedback?token=${feedbackToken}&response=reject" style="display: inline-block; background-color: #f44336; color: white; padding: 10px 20px; margin: 0 10px; text-decoration: none; border-radius: 4px;">Reject</a>
        <a href="${SUPABASE_URL}/functions/v1/feedback?token=${feedbackToken}&response=modify" style="display: inline-block; background-color: #2196f3; color: white; padding: 10px 20px; margin: 0 10px; text-decoration: none; border-radius: 4px;">Modify</a>
      </div>
      
      <p style="color: #666; font-size: 14px;">You can also reply to this email with your detailed feedback.</p>
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999;">
        <p>Agentic Inbox System - ${new Date().toISOString()}</p>
      </div>
    </div>
  `;
  
  // Send the email using Resend API
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`
    },
    body: JSON.stringify({
      from: `Agentic Inbox <${FEEDBACK_FROM_EMAIL}>`,
      to: [recipient],
      subject: `[Agentic Inbox] Feedback requested by ${agentName}`,
      html: htmlContent,
      reply_to: `feedback+${feedbackToken}@${FEEDBACK_REPLY_TO_DOMAIN}`
    })
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(`Failed to send email: ${JSON.stringify(errorData)}`);
  }
  
  // Log the feedback request in the database
  await supabase
    .from("agentic_inbox.agent_logs")
    .insert({
      agent_id: agentName,
      action_type: "feedback_request",
      details: { message, recipient, feedbackToken }
    });
}

// Start the server
serve(handler);