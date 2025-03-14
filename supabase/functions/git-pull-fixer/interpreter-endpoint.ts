import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { load } from "https://deno.land/std@0.215.0/dotenv/mod.ts";
import OpenAI from "jsr:@openai/openai";

// Load environment variables
await load({ export: true });
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

if (!OPENAI_API_KEY) {
  console.error("Error: OPENAI_API_KEY is required in .env file");
  Deno.exit(1);
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { code, modelName = "o3-mini-high" } = await req.json();

    if (!code) {
      return new Response(
        JSON.stringify({ error: "Code is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create an assistant with Code Interpreter
    const assistant = await openai.beta.assistants.create({
      name: "Code Tester",
      instructions: `
        You are a code testing assistant. Execute the provided code and return the results.
        Be precise and thorough in your analysis.
      `,
      model: modelName,
      tools: [{ type: "code_interpreter" }],
    });
    
    // Create a thread
    const thread = await openai.beta.threads.create();
    
    // Add code to the thread
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: `Please execute and analyze this code:\n\n\`\`\`\n${code}\n\`\`\``,
    });
    
    // Run the assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistant.id,
    });
    
    // Poll for completion
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    while (runStatus.status !== "completed" && runStatus.status !== "failed") {
      console.log(`Run status: ${runStatus.status}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }
    
    if (runStatus.status === "failed") {
      throw new Error(`Analysis failed: ${runStatus.last_error}`);
    }
    
    // Get the messages
    const messages = await openai.beta.threads.messages.list(thread.id);
    const latestMessage = messages.data.filter(m => m.role === "assistant")[0];
    
    if (!latestMessage) {
      throw new Error("No response from assistant");
    }
    
    // Extract analysis
    let analysis = "";
    for (const contentPart of latestMessage.content) {
      if (contentPart.type === "text") {
        analysis += contentPart.text.value + "\n\n";
      }
    }
    
    return new Response(
      JSON.stringify({ result: analysis }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});