import { createClient } from "https://esm.sh/@supabase/supabase-js";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Environment variables
const SUPABASE_URL = Deno.env.get("API_URL") || Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SERVICE_KEY") || Deno.env.get("SUPABASE_SERVICE_KEY")!;
const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
const MODEL = Deno.env.get("OPENROUTER_MODEL") || "openai/o3-mini-high";

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Handle HTTP requests
serve(async (req) => {
  // Parse URL to get query parameters
  const url = new URL(req.url);
  const prompt = url.searchParams.get("prompt");
  const agentName = url.searchParams.get("agent") || "agent_stream";
  
  if (!prompt) {
    return new Response("Missing 'prompt' query parameter", { status: 400 });
  }
  
  // Create a readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send initial message
        controller.enqueue(encodeSSE({ status: "started", message: "Processing your request..." }));
        
        // Check if OpenRouter API key is available
        if (!OPENROUTER_API_KEY) {
          controller.enqueue(encodeSSE({ 
            status: "error", 
            message: "OpenRouter API key is not configured. Please set the OPENROUTER_API_KEY environment variable." 
          }));
          controller.close();
          return;
        }
        
        // Call OpenRouter API with streaming enabled
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": `${SUPABASE_URL}`,
            "X-Title": `Agent ${agentName}`
          },
          body: JSON.stringify({
            model: MODEL,
            messages: [
              { role: "system", content: `You are a helpful assistant named ${agentName}.` },
              { role: "user", content: prompt }
            ],
            stream: true,
            temperature: 0.7
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          controller.enqueue(encodeSSE({ 
            status: "error", 
            message: `OpenRouter API error: HTTP ${response.status} - ${errorText}` 
          }));
          controller.close();
          return;
        }
        
        // Process the streaming response
        const reader = response.body?.getReader();
        if (!reader) {
          controller.enqueue(encodeSSE({ status: "error", message: "Failed to get response reader" }));
          controller.close();
          return;
        }
        
        let fullText = "";
        
        // Read chunks from the stream
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          // Convert the chunk to text
          const chunk = new TextDecoder().decode(value);
          
          // Process the chunk (OpenRouter returns data: lines similar to OpenAI)
          const lines = chunk.split("\n").filter(line => line.trim() !== "");
          
          for (const line of lines) {
            // Skip empty lines and "[DONE]" marker
            if (line === "data: [DONE]") continue;
            
            // Extract the JSON data from the "data: " prefix
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.substring(6));
                if (data.choices && data.choices[0]?.delta?.content) {
                  const token = data.choices[0].delta.content;
                  fullText += token;
                  
                  // Send the token to the client
                  controller.enqueue(encodeSSE({ 
                    status: "token", 
                    token,
                    fullText
                  }));
                }
              } catch (e) {
                console.error("Error parsing JSON:", e);
              }
            }
          }
        }
        
        // Send completion message
        controller.enqueue(encodeSSE({ 
          status: "completed", 
          message: "Response completed",
          fullText
        }));
        
        // Log the interaction to the database
        await supabase
          .from("agentic_inbox.agent_logs")
          .insert({
            agent_id: agentName,
            action_type: "stream_response",
            details: { prompt, response: fullText }
          })
          .catch(err => console.error("Error logging to database:", err));
          
      } catch (error) {
        // Send error message
        controller.enqueue(encodeSSE({ 
          status: "error", 
          message: `Error: ${error.message}` 
        }));
      } finally {
        // Close the stream
        controller.close();
      }
    }
  });
  
  // Return the stream as an SSE response
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*"
    }
  });
});

// Helper function to encode a message as an SSE event
function encodeSSE(data: any): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
}