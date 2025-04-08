// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.land/manual/examples/supabase_oauth
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Environment variables
const SUPABASE_URL = Deno.env.get("SB_URL") || "";
const SUPABASE_KEY = Deno.env.get("SB_SERVICE_KEY") || "";
const AGENT_NAME = Deno.env.get("AGENT_NAME") || "agent-manager";
const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY") || "";
const LOGS_CHANNEL = "agent-manager-logs";
const MODEL = Deno.env.get("OPENROUTER_MODEL") || "openai/o3-mini-high";
const ANON_KEY = Deno.env.get("VITE_SUPABASE_ANON_KEY") || "";
const DEBUG = false; // Set to false to reduce chattiness

// List of agent functions to keep alive
const AGENT_FUNCTIONS = ["agent_alpha", "agent_beta"];

// Create Supabase client if credentials are available
let supabase: SupabaseClient | undefined;
if (SUPABASE_URL && SUPABASE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
} else {
  console.warn("Supabase credentials not available. Realtime features will be disabled.");
  console.warn("Please set SB_URL and SB_SERVICE_KEY environment variables.");
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

// Interface for agent information
interface Agent {
  name: string;
  capabilities: string[];
}

// Define available agents
const availableAgents: Agent[] = [
  {
    name: 'agent_alpha',
    capabilities: ['general_queries', 'calculations']
  },
  {
    name: 'agent_beta',
    capabilities: ['math', 'data_processing']
  }
];

// Track active channel subscriptions to prevent multiple subscriptions
const activeChannels: Record<string, boolean> = {};

// Helper function to safely subscribe to a channel only once
async function safeSubscribe(channelName: string): Promise<any> {
  if (!supabase) {
    if (DEBUG) console.log(`[${AGENT_NAME}] Cannot subscribe to channel ${channelName}: Supabase client not available`);
    return null;
  }
  
  if (activeChannels[channelName]) {
    if (DEBUG) console.log(`[${AGENT_NAME}] Channel ${channelName} already subscribed, reusing existing subscription`);
    return supabase.channel(channelName);
  }
  
  if (DEBUG) console.log(`[${AGENT_NAME}] Creating new subscription for channel ${channelName}`);
  const channel = supabase.channel(channelName);
  
  return new Promise((resolve, reject) => {
    channel.subscribe((status: string, err: Error | null) => {
      if (status === 'SUBSCRIBED') {
        if (DEBUG) console.log(`[${AGENT_NAME}] Successfully subscribed to channel ${channelName}`);
        activeChannels[channelName] = true;
        resolve(channel);
      }
      if (err) {
        console.error(`[${AGENT_NAME}] Failed to subscribe to channel ${channelName}:`, err);
        reject(err);
      }
    });
  });
}

// Helper function to send a message to a channel
async function sendToChannel(channelName: string, payload: any): Promise<boolean> {
  try {
    if (DEBUG) console.log(`[${AGENT_NAME}] Attempting to send message to channel ${channelName}`);
    
    const channel = await safeSubscribe(channelName);
    if (!channel) {
      console.error(`[${AGENT_NAME}] Failed to get channel ${channelName} for sending message`);
      return false;
    }
    
    await channel.send({
      type: 'broadcast',
      event: 'message',
      payload: payload
    });
    
    if (DEBUG) console.log(`[${AGENT_NAME}] Successfully sent message to channel ${channelName}`);
    return true;
  } catch (error) {
    console.error(`[${AGENT_NAME}] Error sending message to channel ${channelName}:`, error);
    return false;
  }
}

// Call LLM to analyze the query and generate agent commands
async function callLLM(content: string): Promise<any> {
  if (!OPENROUTER_API_KEY) {
    console.warn("OpenRouter API key not available. Using fallback response.");
    return {
      targetAgent: "agent_beta",
      command: content,
      reasoning: "Fallback due to missing API key"
    };
  }

  try {
    if (DEBUG) console.log(`[${AGENT_NAME}] Calling LLM to analyze: ${content}`);
    
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: `You are an agent coordinator. Analyze the following query and determine which agent should handle it. Available agents: ${JSON.stringify(availableAgents)}. Respond with JSON in the format: {"targetAgent": "agent_beta", "command": "specific command for the agent", "reasoning": "why you chose this agent"}` },
          { role: "user", content: content }
        ]
      })
    });
    
    const result = await response.json();
    try {
      // Extract the content from the LLM response
      const assistantMessage = result.choices[0].message.content;
      if (DEBUG) console.log(`[${AGENT_NAME}] LLM raw response: ${assistantMessage}`);
      
      // Parse the JSON response
      return JSON.parse(assistantMessage);
    } catch (parseError) {
      console.error(`[${AGENT_NAME}] Error parsing LLM response:`, parseError);
      return {
        targetAgent: "agent_beta",
        command: content,
        reasoning: "Fallback due to parsing error"
      };
    }
  } catch (error) {
    console.error(`[${AGENT_NAME}] Error calling LLM:`, error);
    return {
      targetAgent: "agent_beta",
      command: content,
      reasoning: "Fallback due to API error"
    };
  }
}

// Process a message and allocate it to an agent
async function processMessage(message: any): Promise<any> {
  const content = message?.content || '';
  const messageId = message.id || message.correlationId || Date.now().toString();
  
  if (DEBUG) console.log(`[${AGENT_NAME}] Processing message: ${content}`);
  if (DEBUG) console.log(`[${AGENT_NAME}] Full message object:`, JSON.stringify(message, null, 2));
  
  // Call LLM to analyze the query and determine which agent should handle it
  const llmResponse = await callLLM(content);
  if (DEBUG) console.log(`[${AGENT_NAME}] LLM response:`, JSON.stringify(llmResponse, null, 2));
  
  // Extract target agent and command
  const targetAgent = llmResponse.targetAgent || "agent_beta";
  const command = llmResponse.command || content;
  const reasoning = llmResponse.reasoning || "No reasoning provided";
  
  if (supabase) {
    // Create the message payload
    const messagePayload = {
      sender: AGENT_NAME,
      content: command,
      originalContent: content,
      type: MessageType.COMMAND,
      timestamp: Date.now(),
      correlationId: messageId,
      messageId: messageId
    };
    
    // Send to target agent channel
    console.log(`[${AGENT_NAME}] Sending command to ${targetAgent}: ${command}`);
    const targetSent = await sendToChannel(targetAgent, messagePayload);
    if (!targetSent) {
      console.error(`[${AGENT_NAME}] Failed to send command to ${targetAgent}`);
    }
    
    // Also send a copy of the message to the agent-manager channel for monitoring
    if (DEBUG) console.log(`[${AGENT_NAME}] Sending copy of message to manager channel`);
    const managerSent = await sendToChannel(AGENT_NAME, { ...messagePayload, note: `Command sent to ${targetAgent}` });
    if (!managerSent) {
      console.error(`[${AGENT_NAME}] Failed to send copy to ${AGENT_NAME} channel`);
    }
    
    // Also send a copy to the logs channel for monitoring
    if (DEBUG) console.log(`[${AGENT_NAME}] Sending copy to logs channel`);
    const logsSent = await sendToChannel(LOGS_CHANNEL, { ...messagePayload, note: `Command sent from ${AGENT_NAME} to ${targetAgent}` });
    if (!logsSent) {
      console.error(`[${AGENT_NAME}] Failed to send copy to logs channel`);
    }
  }
  
  // Return a response indicating the command was sent
  console.log(`[${AGENT_NAME}] Task allocated to ${targetAgent} with message ID: ${messageId}`);
  
  // Define the channels that can be monitored for this message
  const monitoringChannels = {
    agentChannel: targetAgent,                           // The agent's channel
    senderChannel: message.sender || "unknown-sender",   // The sender's channel (for responses)
    logsChannel: LOGS_CHANNEL,                           // The logs channel (for all messages)
    managerChannel: "agent-manager",                     // The manager's channel (hardcoded to ensure consistency)
    dedicatedResponseChannel: `agent-manager-response-${messageId}` // A dedicated channel for this specific message
  };
  
  return {
    success: true,
    sender: AGENT_NAME,
    targetAgent: targetAgent,
    messageId: messageId,
    originalContent: content,
    command: command,
    reasoning: reasoning,
    type: MessageType.COMMAND,
    timestamp: Date.now(),
    correlationId: message.id || message.correlationId,
    monitoringChannels: monitoringChannels,
    message: `Task successfully allocated to ${targetAgent} with message ID: ${messageId}. You can monitor the response on the following channels: ${Object.keys(monitoringChannels).join(', ')}`
  };
}

// Start the Supabase Edge Function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    });
  }

  // Handle health check requests
  if (req.method === "GET") {
    return new Response(`${AGENT_NAME} is running`, {
      headers: { 
        "Content-Type": "text/plain",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }

  // Handle API requests
  if (req.method === "POST") {
    try {
      const body = await req.json();
      console.log(`[${AGENT_NAME}] Received POST request:`, JSON.stringify(body, null, 2));
      
      const response = await processMessage(body);
      
      return new Response(JSON.stringify(response), {
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    } catch (error) {
      console.error(`[${AGENT_NAME}] Error processing POST request:`, error);
      return new Response(JSON.stringify({ 
        error: (error as Error).message,
        stack: undefined
      }), {
        status: 400,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
  }

  // Handle unsupported methods
  return new Response("Method not allowed", {
    status: 405,
    headers: { 
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*"
    }
  });
});

// Initialize Supabase realtime channel if client is available
if (supabase) {
  // Initialize Supabase realtime channel
  (async () => {
    try {
      const channel = await safeSubscribe(AGENT_NAME);
      if (!channel) {
        console.error(`[${AGENT_NAME}] Failed to subscribe to main channel ${AGENT_NAME}`);
        return;
      }

      // Listen for messages on the agent-manager channel
      // Handle incoming messages
      channel.on('broadcast', { event: 'message' }, async (payload: any) => {
        const message = payload;
        if (DEBUG) console.log(`[${AGENT_NAME}] Received message on channel:`, JSON.stringify(message, null, 2));
        
        // Handle different message structures
        let messageContent;
        let messageSender;
        let messageCorrelationId;
        
        // Check if the message has a nested payload structure
        if (message && message.payload && message.payload.payload) {
          messageContent = message.payload.payload.content;
          messageSender = message.payload.payload.sender;
          messageCorrelationId = message.payload.payload.correlationId;
          if (DEBUG) console.log(`[${AGENT_NAME}] Detected nested payload structure`);
        } 
        // Check if the message has a flat payload structure
        else if (message && message.payload && message.payload.content) {
          messageContent = message.payload.content;
          messageSender = message.payload.sender;
          messageCorrelationId = message.payload.correlationId;
          if (DEBUG) console.log(`[${AGENT_NAME}] Detected flat payload structure`);
        }
        
        // Process the message if we have valid content
        if (messageContent) {
          const response = await processMessage({
            content: messageContent,
            sender: messageSender,
            correlationId: messageCorrelationId
          });
          
          // Send the response
          if (response && messageSender) {
            // Use the same channel naming convention for all responses
            const responseChannelName = `${messageSender}`;
            const responsePayload = { ...response, sender: AGENT_NAME, timestamp: Date.now(), correlationId: messageCorrelationId };
            
            // Send to the sender's channel
            if (DEBUG) console.log(`[${AGENT_NAME}] Sending response to ${responseChannelName}`);
            const senderSent = await sendToChannel(responseChannelName, responsePayload);
            if (!senderSent) {
              console.error(`[${AGENT_NAME}] Failed to send response to ${responseChannelName}`);
            }
            
            // Also send a copy to the agent-manager channel for monitoring
            if (DEBUG) console.log(`[${AGENT_NAME}] Sending copy of response to ${AGENT_NAME} channel`);
            const managerSent = await sendToChannel(AGENT_NAME, { ...responsePayload, note: `Response sent to ${responseChannelName}` });
            if (!managerSent) {
              console.error(`[${AGENT_NAME}] Failed to send copy to ${AGENT_NAME} channel`);
            }
            
            // Also send a copy to the logs channel for monitoring
            if (DEBUG) console.log(`[${AGENT_NAME}] Sending copy of response to ${LOGS_CHANNEL} channel`);
            const logsSent = await sendToChannel(LOGS_CHANNEL, { ...responsePayload, note: `Response from ${AGENT_NAME} to ${responseChannelName}` });
            if (!logsSent) {
              console.error(`[${AGENT_NAME}] Failed to send copy to ${LOGS_CHANNEL} channel`);
            }
          }
        } else {
          console.error(`[${AGENT_NAME}] Received invalid message:`, message);
        }
      });
      
      if (DEBUG) console.log(`[${AGENT_NAME}] Successfully set up message handler for channel ${AGENT_NAME}`);
    } catch (error) {
      console.error(`[${AGENT_NAME}] Error setting up main channel:`, error);
    }
  })();
}
