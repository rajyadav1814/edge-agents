import { createClient } from "https://esm.sh/@supabase/supabase-js";

// Environment variables
const SUPABASE_URL = Deno.env.get("API_URL") || Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SERVICE_KEY") || Deno.env.get("SUPABASE_SERVICE_KEY")!;
const AGENT_NAME = Deno.env.get("AGENT_NAME") || "agent_websocket";
const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
const MODEL = Deno.env.get("OPENROUTER_MODEL") || "openai/o3-mini-high";

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Message types
enum MessageType {
  QUERY = 'query',
  RESPONSE = 'response',
  COMMAND = 'command',
  NOTIFICATION = 'notification',
  STATUS = 'status',
  ERROR = 'error'
}

// WebSocket server
Deno.serve((req) => {
  // Check if the request is a WebSocket upgrade request
  const upgrade = req.headers.get("upgrade") || "";
  if (upgrade.toLowerCase() !== "websocket") {
    return new Response("Request is not a WebSocket upgrade", { status: 400 });
  }

  // Create a WebSocket connection
  const { socket, response } = Deno.upgradeWebSocket(req);
  
  // Set up WebSocket event handlers
  socket.onopen = () => {
    console.log(`[${AGENT_NAME}] WebSocket connection opened`);
    
    // Send a welcome message
    socket.send(JSON.stringify({
      sender: AGENT_NAME,
      content: `Connected to ${AGENT_NAME} WebSocket server`,
      type: MessageType.STATUS,
      timestamp: Date.now()
    }));
  };
  
  socket.onmessage = async (event) => {
    console.log(`[${AGENT_NAME}] Received message: ${event.data}`);
    
    try {
      // Parse the message
      const message = JSON.parse(event.data);
      
      // Process the message
      const response = await processMessage(message);
      
      // Send the response
      socket.send(JSON.stringify(response));
      
      // Log the interaction to the database
      await supabase
        .from("agentic_inbox.agent_logs")
        .insert({
          agent_id: AGENT_NAME,
          action_type: "websocket_interaction",
          details: { message, response }
        });
    } catch (error) {
      console.error(`[${AGENT_NAME}] Error processing message:`, error);
      
      // Send an error response
      socket.send(JSON.stringify({
        sender: AGENT_NAME,
        content: `Error: ${error.message}`,
        type: MessageType.ERROR,
        timestamp: Date.now()
      }));
    }
  };
  
  socket.onerror = (error) => {
    console.error(`[${AGENT_NAME}] WebSocket error:`, error);
  };
  
  socket.onclose = () => {
    console.log(`[${AGENT_NAME}] WebSocket connection closed`);
  };
  
  return response;
});

// Process a message and return a response
async function processMessage(message: any): Promise<any> {
  // Check if OpenRouter API key is available
  if (!OPENROUTER_API_KEY) {
    return {
      sender: AGENT_NAME,
      content: "Error: OpenRouter API key is not configured. Please set the OPENROUTER_API_KEY environment variable.",
      type: MessageType.ERROR,
      timestamp: Date.now(),
      correlationId: message.id || message.correlationId
    };
  }
  
  // Call OpenRouter API
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": `${SUPABASE_URL}`,
      "X-Title": `Agent ${AGENT_NAME}`
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: `You are a helpful assistant named ${AGENT_NAME}.` },
        { role: "user", content: message.content }
      ],
      temperature: 0.7
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    return {
      sender: AGENT_NAME,
      content: `OpenRouter API error: HTTP ${response.status} - ${errorText}`,
      type: MessageType.ERROR,
      timestamp: Date.now(),
      correlationId: message.id || message.correlationId
    };
  }
  
  const data = await response.json();
  const content = data.choices[0].message.content;
  
  return {
    sender: AGENT_NAME,
    content,
    type: MessageType.RESPONSE,
    timestamp: Date.now(),
    correlationId: message.id || message.correlationId
  };
}