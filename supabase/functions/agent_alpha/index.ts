import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { StateGraph, END } from "npm:@langchain/langgraph@0.0.5";

// Environment variables
const AGENT_NAME = Deno.env.get("AGENT_NAME") || "agent-alpha";
const SUPABASE_URL = Deno.env.get("SB_URL") || "";
const SUPABASE_KEY = Deno.env.get("SB_SERVICE_KEY") || "";
console.log(`[${AGENT_NAME}] Environment: SB_URL=${SUPABASE_URL ? "set" : "not set"}, SB_SERVICE_KEY=${SUPABASE_KEY ? "set" : "not set"}`);
console.log(`[${AGENT_NAME}] Starting agent service...`);
const LOGS_CHANNEL = "agent-manager-logs";

// Get OpenRouter API key from environment variables (try both formats)
const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY") || 
                          Deno.env.get("VITE_OPENROUTER_API_KEY");
// Get model from environment variables (try both formats)
const MODEL = Deno.env.get("OPENROUTER_MODEL") || Deno.env.get("VITE_OPENROUTER_MODEL") || "openai/o3-mini-high";
console.log(`[${AGENT_NAME}] Using model: ${MODEL}, OpenRouter API key: ${OPENROUTER_API_KEY ? "set" : "not set"}`);

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Message types
enum MessageType {
  QUERY = 'query',
  RESPONSE = 'response',
  COMMAND = 'command',
  NOTIFICATION = 'notification',
  STATUS = 'status',
  ERROR = 'error'
}

// Define available tools
const tools = [
  {
    name: "Calculator",
    description: "Performs arithmetic calculations. Usage: Calculator[expression]",
    run: (input: string) => {
      // Simple safe evaluation for arithmetic expressions
      try {
        // Allow only numbers and basic math symbols in input for safety
        if (!/^[0-9.+\-*\/()\\s]+$/.test(input)) {
          return "Invalid expression";
        }
        // Evaluate the expression
        const result = Function("return (" + input + ")")();
        return String(result);
      } catch (err) {
        return "Error: " + (err as Error).message;
      }
    }
  }
];

// Create a system prompt for the ReAct agent
const toolDescriptions = tools.map(t => `${t.name}: ${t.description}`).join("\n");
const systemPrompt = `
You are a smart assistant named ${AGENT_NAME} with access to the following tools:
${toolDescriptions}

When answering the user, you may use the tools to gather information or calculate results.
Follow this format strictly:
Thought: <your reasoning here>
Action: <ToolName>[<tool input>]
Observation: <result of the tool action>
... (you can repeat Thought/Action/Observation as needed) ...
Thought: <final reasoning>
Answer: <your final answer to the user's query>

Only provide one action at a time, and wait for the observation before continuing. 
If the answer is directly known or once you have gathered enough information, output the final Answer.
`;

// Connect to the agent's inbox channel
const channel = supabase.channel(AGENT_NAME);

// Handle incoming messages
channel.on('broadcast', { event: 'message' }, async (payload) => {
  const message = payload;
  console.log(`[${AGENT_NAME}] Received message from ${message.sender}: ${message.content}`);
  
  // Skip processing messages sent by this agent to prevent loops
  if (message.sender === AGENT_NAME) {
    console.log(`[${AGENT_NAME}] Skipping message from self to prevent loops`);
    const logsChannel = supabase.channel(LOGS_CHANNEL);
    await logsChannel.subscribe();
    await logsChannel.send({
      type: 'broadcast',
      event: 'message',
      payload: { sender: AGENT_NAME, content: "Message skipped to prevent loops", type: MessageType.STATUS, timestamp: Date.now() }
    });
    return;
  }
  console.log(`[${AGENT_NAME}] Message details: ${JSON.stringify(message, null, 2)}`);
  
  // Process the message
  const response = await processMessage(message);
  
  // Send the response
  if (response) {
    // Send response to the sender's channel
    const responseChannelName = message.sender;
    
    // Also send to a dedicated response channel that agent-manager might be listening on
    // Format: agent-manager-response-{messageId}
    let responseSpecificChannel = null;
    if (message.messageId || message.correlationId) {
      const messageId = message.messageId || message.correlationId;
      responseSpecificChannel = supabase.channel(`agent-manager-response-${messageId}`);
    }
    
    const targetChannel = supabase.channel(responseChannelName);    
    await targetChannel.subscribe();
    await targetChannel.send({
      type: 'broadcast',
      event: 'message',
      payload: {
        sender: AGENT_NAME,
        content: response.content,
        type: MessageType.RESPONSE,
        timestamp: Date.now(),
        correlationId: response.correlationId
      }
    });
    console.log(`[${AGENT_NAME}] Sent response to ${responseChannelName}`);
    
    // If we have a message ID, also send to the specific response channel
    if (responseSpecificChannel) {
      await responseSpecificChannel.subscribe();
      await responseSpecificChannel.send({
        type: 'broadcast',
        event: 'message',
        payload: {
          sender: AGENT_NAME,
          content: response.content,
          type: MessageType.RESPONSE,
          timestamp: Date.now(),
          correlationId: response.correlationId
        }
      });
      console.log(`[${AGENT_NAME}] Also sent response to message-specific channel`);
    }
    
    // Also send a copy to the logs channel for monitoring
    const logsChannel = supabase.channel(LOGS_CHANNEL);
    await logsChannel.subscribe();
    await logsChannel.send({
      type: 'broadcast',
      event: 'message',
      payload: { 
        sender: AGENT_NAME,
        content: response.content,
        type: MessageType.RESPONSE,
        timestamp: Date.now(),
        correlationId: response.correlationId,
        note: `Response from ${AGENT_NAME} to ${responseChannelName}` }
    });
    console.log(`[${AGENT_NAME}] Sent copy of response to ${LOGS_CHANNEL} channel`);
  }
});

// Subscribe to the channel
const { error } = await channel.subscribe();
if (error) {
  console.error(`[${AGENT_NAME}] Failed to subscribe to channel:`, error);
  Deno.exit(1);
}

console.log(`[${AGENT_NAME}] Listening for messages...`);

// Process a message and return a response
async function processMessage(message: any): Promise<any> {
  console.log(`[${AGENT_NAME}] Processing message with ID: ${message.correlationId || message.id || "unknown"}`);
  
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
  
  // Run the ReAct agent with a timeout
  let answer;
  try {
    // Set a timeout of 25 seconds to ensure we respond before the Edge Function times out
    answer = await Promise.race([
      console.log(`[${AGENT_NAME}] Starting ReAct agent for query: ${message.content}`),
      runReActAgent(message.content),
      new Promise<string>(resolve => setTimeout(() => resolve("I apologize, but I couldn't complete the calculation in time. Please try a simpler query."), 25000))
    ]);
  } catch (error) {
    answer = `Error processing your request: ${error.message}`;
  }
  
  console.log(`[${AGENT_NAME}] Final answer: ${answer}`);
  return {
    sender: AGENT_NAME,
    content: answer,
    type: MessageType.RESPONSE,
    timestamp: Date.now(),
    correlationId: message.id || message.correlationId
  };
}

// Run the ReAct agent
async function runReActAgent(query: string): Promise<string> {
  console.log(`[${AGENT_NAME}] Running ReAct agent with query: "${query}"`);
  
  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: query }
  ];
  
  // The agent will iterate, allowing up to 10 reasoning loops
  for (let step = 0; step < 10; step++) {
    // Call the LLM via OpenRouter
    console.log(`[${AGENT_NAME}] Step ${step+1}/10: Calling OpenRouter API with ${messages.length} messages`);
    const assistantReply = await callOpenRouter(messages);
    
    // Append the assistant's reply to the message history
    messages.push({ role: "assistant", content: assistantReply });
    
    // Check if the assistant's reply contains a final answer
    const answerMatch = assistantReply.match(/Answer:\s*(.*)$/s);
    if (answerMatch) {
      // Return the text after "Answer:" as the final answer
      console.log(`[${AGENT_NAME}] Found final answer in step ${step+1}`);
      return answerMatch[1].trim();
    }
    
    // Otherwise, look for an action to perform
    const actionMatch = assistantReply.match(/Action:\s*([^\[]+)\[([^\]]+)\]/);
    if (actionMatch) {
      const toolName = actionMatch[1].trim();
      const toolInput = actionMatch[2].trim();
      console.log(`[${AGENT_NAME}] Step ${step+1}: Found action: ${toolName}[${toolInput}]`);
      
      // Find the tool by name
      const tool = tools.find(t => t.name.toLowerCase() === toolName.toLowerCase());
      let observation: string;
      
      if (!tool) {
        observation = `Tool "${toolName}" not found`;
      } else {
        try {
          const result = await tool.run(toolInput);
          observation = String(result);
          console.log(`[${AGENT_NAME}] Step ${step+1}: Tool ${toolName} result: ${observation}`);
        } catch (err) {
          observation = `Error: ${(err as Error).message}`;
          console.log(`[${AGENT_NAME}] Step ${step+1}: Tool ${toolName} error: ${observation}`);
        }
      }
      
      // Append the observation as a system message for the next LLM call
      messages.push({ role: "system", content: `Observation: ${observation}` });
      
      // Continue loop for next reasoning step
      continue;
    }
    
    console.log(`[${AGENT_NAME}] Step ${step+1}: No action or answer found in response, breaking loop`);
    // If no Action or Answer was found, break to avoid an endless loop
    return assistantReply.trim();
  }
  
  console.log(`[${AGENT_NAME}] Reached maximum steps (10) without finding an answer`);
  return "I apologize, but I was unable to reach a conclusion within the step limit.";
}

// Call OpenRouter API
async function callOpenRouter(messages: any[], maxRetries = 3): Promise<string> {
  let retryCount = 0;
  let lastError: Error | null = null;

  while (retryCount <= maxRetries) {
    try {
      if (retryCount > 0) {
        // Send notification about retry to logs channel
        await sendRetryNotification(retryCount, maxRetries, lastError?.message || "Unknown error");
        
        // Exponential backoff: wait longer between each retry
        const backoffMs = Math.min(1000 * Math.pow(2, retryCount - 1), 8000);
        console.log(`[${AGENT_NAME}] Retry ${retryCount}/${maxRetries} after ${backoffMs}ms backoff`);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }

      console.log(`[${AGENT_NAME}] Calling OpenRouter API with model: ${MODEL}, message count: ${messages.length}`);
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": `${SUPABASE_URL}`, // Optional but recommended
          "X-Title": `Agent ${AGENT_NAME}`   // Optional but recommended
        },
        body: JSON.stringify({
          model: MODEL,
          messages: messages,
          temperature: 0.0,
          stop: ["Observation:"],
          max_tokens: 1000
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        const errorMessage = `OpenRouter API error: HTTP ${response.status} - ${errorText}`;
        console.error(`[${AGENT_NAME}] ${errorMessage}`);
        lastError = new Error(errorMessage);
        retryCount++;
        continue;
      }
      
      const data = await response.json();
      const content = data.choices[0].message.content;
      return content;
    } catch (error) {
      console.error(`[${AGENT_NAME}] Error calling OpenRouter API:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      retryCount++;
    }
  }
  
  // If we've exhausted all retries, send a final notification and throw the last error
  await sendRetryNotification(retryCount, maxRetries, lastError?.message || "Unknown error", true);
  throw lastError || new Error("Failed to call OpenRouter API after multiple retries");
}

// Send notification about retry to logs channel
async function sendRetryNotification(retryCount: number, maxRetries: number, errorMessage: string, isFinal = false): Promise<void> {
  const logsChannel = supabase.channel(LOGS_CHANNEL);
  await logsChannel.subscribe();
  await logsChannel.send({
    type: 'broadcast',
    event: 'message',
    payload: {
      sender: AGENT_NAME,
      content: isFinal 
        ? `⚠️ Failed to call OpenRouter API after ${retryCount} retries. Error: ${errorMessage}`
        : `🔄 Retry ${retryCount}/${maxRetries} for OpenRouter API call. Error: ${errorMessage}`,
      type: MessageType.NOTIFICATION,
      timestamp: Date.now()
    }
  });
  console.log(`[${AGENT_NAME}] Sent retry notification to ${LOGS_CHANNEL} channel`);
}

// Start a simple HTTP server for health checks
Deno.serve({ port: 8000 }, (req) => {
  return new Response(`agent-alpha is running`, {
    headers: { "Content-Type": "text/plain" }
  });
});
