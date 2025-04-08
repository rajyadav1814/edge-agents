#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Get environment variables
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_KEY") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SENDER = Deno.env.get("AGENT_NAME") || "message-sender";
const RECIPIENT = Deno.env.get("RECIPIENT") || "agent-manager";
const MESSAGE = Deno.env.get("MESSAGE") || "Hello from message-sender! This is a test message.";
const RESPONSE_TIMEOUT = 15000; // 15 seconds timeout for response

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Error: SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables are required");
  Deno.exit(1);
}

// Message types
enum MessageType {
  QUERY = 'query',
  RESPONSE = 'response',
  COMMAND = 'command',
  NOTIFICATION = 'notification',
  STATUS = 'status',
  ERROR = 'error'
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Function to send a message to a channel and wait for response
async function sendMessage(recipient: string, content: string): Promise<string> {
  let responseReceived = false;
  console.log(`Sending message from ${SENDER} to ${recipient}: ${content}`);
  
  // Create a unique correlation ID for this message
  const correlationId = crypto.randomUUID();
  
  // Subscribe to the channel
  const channel = supabase.channel(recipient);
  const { error: subscribeError } = await channel.subscribe();
  
  if (subscribeError) {
    console.error(`Failed to subscribe to channel ${recipient}:`, subscribeError);
    Deno.exit(1);
  }
  
  // Send the message
  const { error: sendError } = await channel.send({
    type: 'broadcast',
    event: 'message',
    payload: {
      sender: SENDER,
      content,
      type: MessageType.QUERY,
      timestamp: Date.now(),
      correlationId
    }
  });
  
  if (sendError) {
    console.error(`Failed to send message to channel ${recipient}:`, sendError);
    Deno.exit(1);
  }
  
  console.log(`Successfully sent message to ${recipient}`);
  console.log(`Correlation ID: ${correlationId}`);
  
  // Wait a moment to ensure the message is sent
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Now listen for a response on our own channel
  console.log(`Listening for response on channel ${SENDER}...`);
  
  // Create a promise that will resolve when we get a response or timeout
  const responsePromise = new Promise<string>((resolve, reject) => {
    // Set up a timeout
    const timeout = setTimeout(() => {
      if (!responseReceived) {
        reject(new Error(`No response received from ${recipient} after ${RESPONSE_TIMEOUT/1000} seconds`));
      }
    }, RESPONSE_TIMEOUT);
    
    // Subscribe to our own channel to listen for responses
    const responseChannel = supabase.channel(SENDER);
    responseChannel.on('broadcast', { event: 'message' }, (payload) => {
      const response = payload.payload;
      
      // Check if this is a response to our message
      if (response.correlationId === correlationId) {
        responseReceived = true;
        clearTimeout(timeout);
        
        console.log(`Received response from ${response.sender}:`);
        console.log(`Content: ${response.content}`);
        
        // Unsubscribe from the channel
        responseChannel.unsubscribe();
        
        // Resolve the promise with the response content
        resolve(response.content);
      }
    });
    
    responseChannel.subscribe((status, err) => {
      if (err) {
        console.error(`Error subscribing to response channel: ${err.message}`);
        reject(err);
      }
    });
  });
  
  // Unsubscribe from the original channel
  channel.unsubscribe();
  
  // Return the response or throw an error if timeout
  return responsePromise;
}

// Main function
async function main() {
  try {
    // Try using the HTTP endpoint for agent-manager
    if (RECIPIENT === "agent-manager" || RECIPIENT === "agent_beta") {
      console.log(`Sending message to ${RECIPIENT} via HTTP endpoint...`);
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/${RECIPIENT}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY || SUPABASE_KEY}`
        },
        body: JSON.stringify({
          sender: SENDER,
          content: MESSAGE,
          type: MessageType.QUERY,
          timestamp: Date.now(),
          correlationId: crypto.randomUUID()
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} - ${await response.text()}`);
      }
      
      const result = await response.json();
      console.log("Response received:");
      console.log(JSON.stringify(result, null, 2));
      Deno.exit(0);
    } else {
      // Use the realtime channel method
      await sendMessage(RECIPIENT, MESSAGE);
      console.log("Message sent successfully");
      // Deno.exit(0) will be called after receiving response or timeout
    }
  } catch (error) {
    console.log("\n");
    console.error("Error sending message:", error);
    console.log({ success: false, error: error.message });
    Deno.exit(1);
  }
}

// Run the main function
await main();
