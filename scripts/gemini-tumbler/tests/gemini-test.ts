/**
 * Test script for Gemini service with multiple API keys
 */

import { load } from "dotenv";
import { GoogleAIServiceFactory } from "../src/agent/googleAIServiceFactory.ts";

// Load environment variables with correct options
await load({ 
  export: true, 
  allowEmptyValues: true,
  examplePath: null // Don't validate against example file
});

console.log("Testing Gemini Service with Multiple API Keys");

// Get API keys from environment
const apiKeys: string[] = [];

// Primary key
const primaryKey = Deno.env.get("GEMINI_API_KEY");
if (primaryKey) {
  apiKeys.push(primaryKey);
  console.log("Found primary API key");
}

// Additional keys
for (let i = 2; i <= 10; i++) {
  const additionalKey = Deno.env.get(`GEMINI_API_KEY_${i}`);
  if (additionalKey) {
    apiKeys.push(additionalKey);
    console.log(`Found additional API key ${i}`);
  }
}

if (apiKeys.length === 0) {
  console.error("No API keys found in environment variables");
  Deno.exit(1);
}

// Test Gemini service with multiple prompts to demonstrate key rotation
async function testGeminiService() {
  try {
    // Create Gemini client
    const geminiClient = GoogleAIServiceFactory.createClient({
      serviceType: 'gemini',
      apiKeys,
      parameters: {
        modelName: "gemini-1.5-pro",
        temperature: 0.7,
        maxOutputTokens: 1024
      }
    });
    
    console.log(`\nService type: ${geminiClient.getServiceType()}`);
    console.log(`Capabilities: ${geminiClient.getCapabilities().join(", ")}`);
    console.log(`Usage limits: ${JSON.stringify(geminiClient.getUsageLimits())}`);
    console.log(`Available keys: ${geminiClient.getKeyCount()}`);
    
    // Test prompts
    const prompts = [
      "Explain quantum computing in 3 sentences.",
      "Write a short poem about artificial intelligence.",
      "What are the three laws of robotics?",
      "Explain the concept of blockchain in simple terms."
    ];
    
    // Process each prompt to demonstrate key rotation
    for (let i = 0; i < prompts.length; i++) {
      const prompt = prompts[i];
      console.log(`\n=== Request ${i+1} ===`);
      console.log(`Prompt: "${prompt}"`);
      
      const { result, usage } = await geminiClient.process(prompt);
      
      console.log("\nResponse:");
      console.log("=========");
      console.log(result);
      console.log("\nToken Usage:");
      console.log(`Prompt tokens: ${usage.promptTokens}`);
      console.log(`Completion tokens: ${usage.completionTokens}`);
      console.log(`Total tokens: ${usage.totalTokens}`);
    }
    
    console.log("\nAll tests completed successfully!");
  } catch (error) {
    console.error("Error during tests:", error);
  }
}

// Run the tests
await testGeminiService();