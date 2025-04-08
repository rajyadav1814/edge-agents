/**
 * Email service for the security scanner
 * Integrates the resend functionality directly into the security scanner
 */

import { logger } from "./logger.ts";

// Define Deno namespace for TypeScript
declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
  }
  export const env: Env;
}

// Environment variables for email configuration
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("API_URL") || Deno.env.get("SUPABASE_URL") || Deno.env.get("VITE_SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SERVICE_KEY") || Deno.env.get("SUPABASE_SERVICE_KEY") || Deno.env.get("VITE_SUPABASE_SERVICE_KEY");
// Email configuration
const DEFAULT_RECIPIENT = Deno.env.get("DEFAULT_RECIPIENT") || "user@example.com";
const NOTIFICATION_FROM_EMAIL = Deno.env.get("NOTIFICATION_FROM_EMAIL") || "notifications@agentics.org";
const FEEDBACK_FROM_EMAIL = Deno.env.get("FEEDBACK_FROM_EMAIL") || "feedback@agentics.org";
const FEEDBACK_REPLY_TO_DOMAIN = Deno.env.get("FEEDBACK_REPLY_TO_DOMAIN") || "agentics.org";

// Import Supabase client at the top level
import { createClient } from "https://esm.sh/@supabase/supabase-js";

// Create Supabase client if needed
let supabase: any = null;
try {
  if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  }
} catch (error) {
  logger.error("Failed to initialize Supabase client:", error);
}

/**
 * Send an email notification using the Resend API
 * @param agentName Name of the agent sending the message
 * @param message Content of the message
 * @param recipient Email recipient (defaults to DEFAULT_RECIPIENT env var)
 * @returns Promise<boolean> Success status
 */
export async function sendEmailNotification(
  agentName: string, 
  message: string, 
  recipient: string = DEFAULT_RECIPIENT
): Promise<boolean> {
  logger.info(`Sending email notification from ${agentName} to ${recipient}`);
  
  try {
    // Check if RESEND_API_KEY is set
    if (!RESEND_API_KEY) {
      logger.error("RESEND_API_KEY is not set");
      return false;
    }
    
    // Create HTML content for the email
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3a86ff;">Message from ${agentName}</h2>
        <div style="border-left: 4px solid #3a86ff; padding-left: 15px; margin: 20px 0;">
          ${message}
        </div>
        <p style="color: #666; font-size: 14px;">This is an automated notification from the Security Scanner.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999;">
          <p>Security Scanner - ${new Date().toISOString()}</p>
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
        from: `Security Scanner <${NOTIFICATION_FROM_EMAIL}>`,
        to: [recipient],
        subject: `[Security Scanner] Report from ${agentName}`,
        html: htmlContent,
      })
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      logger.error(`Failed to send email: ${JSON.stringify(errorData)}`);
      return false;
    }
    
    // Log the notification in the database if Supabase is available
    if (supabase) {
      try {
        await supabase
          .from("security_scanner.email_logs")
          .insert({
            agent_id: agentName,
            action_type: "email_notification",
            details: { message, recipient }
          });
      } catch (error) {
        logger.error("Failed to log notification in database:", error);
        // Continue even if logging fails
      }
    }
    
    logger.success(`Email notification sent successfully to ${recipient}`);
    return true;
  } catch (error) {
    logger.error("Error sending email notification:", error);
    return false;
  }
}

/**
 * Send a feedback request email using the Resend API
 * @param agentName Name of the agent requesting feedback
 * @param message Content of the message
 * @param recipient Email recipient (defaults to DEFAULT_RECIPIENT env var)
 * @returns Promise<boolean> Success status
 */
export async function sendFeedbackRequest(
  agentName: string, 
  message: string, 
  recipient: string = DEFAULT_RECIPIENT
): Promise<boolean> {
  logger.info(`Sending feedback request from ${agentName} to ${recipient}`);
  
  try {
    // Check if RESEND_API_KEY is set
    if (!RESEND_API_KEY) {
      logger.error("RESEND_API_KEY is not set");
      return false;
    }
    
    // Generate a unique token for this feedback request
    const feedbackToken = crypto.randomUUID();
    
    // Store the feedback request in the database if Supabase is available
    if (supabase) {
      try {
        await supabase
          .from("security_scanner.feedback_requests")
          .insert({
            token: feedbackToken,
            agent_id: agentName,
            message,
            recipient,
            status: "pending"
          });
      } catch (error) {
        logger.error("Failed to store feedback request in database:", error);
        // Continue even if storage fails
      }
    }
    
    // Create HTML content for the email with feedback buttons
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3a86ff;">Feedback Request from ${agentName}</h2>
        <div style="border-left: 4px solid #3a86ff; padding-left: 15px; margin: 20px 0;">
          ${message}
        </div>
        <p style="color: #666;">Please provide your feedback by clicking one of the options below:</p>
        
        <div style="margin: 30px 0; text-align: center;">
          <a href="${SUPABASE_URL}/functions/v1/feedback?token=${feedbackToken}&response=approve" style="display: inline-block; background-color: #4caf50; color: white; padding: 10px 20px; margin: 0 10px; text-decoration: none; border-radius: 4px;">Approve</a>
          <a href="${SUPABASE_URL}/functions/v1/feedback?token=${feedbackToken}&response=reject" style="display: inline-block; background-color: #f44336; color: white; padding: 10px 20px; margin: 0 10px; text-decoration: none; border-radius: 4px;">Reject</a>
          <a href="${SUPABASE_URL}/functions/v1/feedback?token=${feedbackToken}&response=modify" style="display: inline-block; background-color: #2196f3; color: white; padding: 10px 20px; margin: 0 10px; text-decoration: none; border-radius: 4px;">Modify</a>
        </div>
        
        <p style="color: #666; font-size: 14px;">You can also reply to this email with your detailed feedback.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999;">
          <p>Security Scanner - ${new Date().toISOString()}</p>
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
        from: `Security Scanner <${FEEDBACK_FROM_EMAIL}>`,
        to: [recipient],
        subject: `[Security Scanner] Feedback requested by ${agentName}`,
        html: htmlContent,
        reply_to: `feedback+${feedbackToken}@${FEEDBACK_REPLY_TO_DOMAIN}`
      })
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      logger.error(`Failed to send email: ${JSON.stringify(errorData)}`);
      return false;
    }
    
    // Log the feedback request in the database if Supabase is available
    if (supabase) {
      try {
        await supabase
          .from("security_scanner.email_logs")
          .insert({
            agent_id: agentName,
            action_type: "feedback_request",
            details: { message, recipient, feedbackToken }
          });
      } catch (error) {
        logger.error("Failed to log feedback request in database:", error);
        // Continue even if logging fails
      }
    }
    
    logger.success(`Feedback request sent successfully to ${recipient}`);
    return true;
  } catch (error) {
    logger.error("Error sending feedback request:", error);
    return false;
  }
}

/**
 * Send an email based on the specified action
 * @param agentName Name of the agent sending the message
 * @param message Content of the message
 * @param recipient Email recipient (defaults to DEFAULT_RECIPIENT env var)
 * @param action Action to take ("notify" or "request_feedback", defaults to "notify")
 * @returns Promise<boolean> Success status
 */
export async function sendEmail(
  agentName: string,
  message: string,
  recipient: string = DEFAULT_RECIPIENT,
  action: string = "notify"
): Promise<boolean> {
  if (action === "request_feedback") {
    return await sendFeedbackRequest(agentName, message, recipient);
  } else {
    return await sendEmailNotification(agentName, message, recipient);
  }
}
