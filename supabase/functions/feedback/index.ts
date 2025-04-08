import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

// Environment variables
const SUPABASE_URL = Deno.env.get("API_URL") || Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SERVICE_KEY") || Deno.env.get("SUPABASE_SERVICE_KEY")!;

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
  // Parse URL to get query parameters
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const response = url.searchParams.get("response");
  
  if (!token || !response) {
    return new Response("Missing required parameters: token, response", { status: 400 });
  }
  
  try {
    // Get the feedback request from the database
    const { data: feedbackRequest, error: fetchError } = await supabase
      .from("agentic_inbox.feedback_requests")
      .select("*")
      .eq("token", token)
      .single();
    
    if (fetchError || !feedbackRequest) {
      return new Response("Invalid feedback token or feedback request not found", { status: 404 });
    }
    
    // Check if the feedback has already been processed
    if (feedbackRequest.status !== "pending") {
      return new Response("This feedback request has already been processed", { status: 400 });
    }
    
    // Update the feedback request status
    const { error: updateError } = await supabase
      .from("agentic_inbox.feedback_requests")
      .update({ 
        status: "processed",
        response,
        processed_at: new Date().toISOString()
      })
      .eq("token", token);
    
    if (updateError) {
      throw new Error(`Failed to update feedback request: ${updateError.message}`);
    }
    
    // Send the feedback to the agent's channel
    const channel = supabase.channel(feedbackRequest.agent_id);
    await channel.subscribe();
    
    await channel.send({
      type: 'broadcast',
      event: 'message',
      payload: {
        sender: 'human-feedback',
        content: `Feedback on message "${feedbackRequest.message}": ${response}`,
        type: MessageType.HUMAN_FEEDBACK,
        timestamp: Date.now(),
        metadata: {
          feedbackToken: token,
          originalMessage: feedbackRequest.message,
          response
        }
      }
    });
    
    // Log the feedback in the database
    await supabase
      .from("agentic_inbox.agent_logs")
      .insert({
        agent_id: feedbackRequest.agent_id,
        action_type: "human_feedback",
        details: { 
          feedbackToken: token,
          originalMessage: feedbackRequest.message,
          response
        }
      });
    
    // Return a success page
    const htmlResponse = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Feedback Submitted</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #f9f9f9;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          h1 {
            color: #3a86ff;
          }
          .message {
            border-left: 4px solid #3a86ff;
            padding-left: 15px;
            margin: 20px 0;
          }
          .feedback {
            font-weight: bold;
            color: ${response === 'approve' ? '#4caf50' : response === 'reject' ? '#f44336' : '#2196f3'};
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Feedback Submitted</h1>
          <p>Thank you for providing feedback to ${feedbackRequest.agent_id}.</p>
          
          <div class="message">
            <p><strong>Original message:</strong> ${feedbackRequest.message}</p>
          </div>
          
          <p>Your response: <span class="feedback">${response}</span></p>
          
          <p>Your feedback has been sent to the agent and will be processed accordingly.</p>
        </div>
      </body>
      </html>
    `;
    
    return new Response(htmlResponse, {
      status: 200,
      headers: { "Content-Type": "text/html" }
    });
  } catch (error) {
    console.error("Error processing feedback:", error);
    
    return new Response(`Error processing feedback: ${error.message}`, { status: 500 });
  }
};

// Start the server
serve(handler);