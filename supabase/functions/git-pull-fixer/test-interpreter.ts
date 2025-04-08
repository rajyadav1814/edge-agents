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

// Test code interpreter directly
async function testCodeInterpreter(code: string, modelName = "o3-mini-high"): Promise<string> {
  try {
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
    
    return analysis;
  } catch (error) {
    console.error("Error testing code:", error);
    throw error;
  }
}

// CLI interface
async function main() {
  const args = Deno.args;
  
  if (args.length < 1) {
    console.log("Usage: deno run test-interpreter.ts <code> [model_name]");
    console.log("Default model: o3-mini-high");
    Deno.exit(1);
  }
  
  const code = args[0];
  const modelName = args[1] || "o3-mini-high";
  
  try {
    const result = await testCodeInterpreter(code, modelName);
    console.log(result);
  } catch (error) {
    console.error("Error:", error);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  await main();
}

export { testCodeInterpreter };