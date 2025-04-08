/**
 * Test script for the multi-key Gemini client implementation
 */

import { load } from "dotenv";
import { GoogleGeminiClient } from "../src/agent/googleGeminiClient.ts";

// Load environment variables with correct options
await load({ 
  export: true, 
  allowEmptyValues: true,
  examplePath: null // Don't validate against example file
});

console.log("Testing GoogleGeminiClient with multiple API keys");

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

console.log(`Initializing client with ${apiKeys.length} API keys`);

// Create client with multiple keys
const client = new GoogleGeminiClient({
  apiKeys,
  modelName: "gemini-1.5-pro",
  temperature: 0.7,
  maxOutputTokens: 1024
});

// Test prompt
const prompt = "Explain quantum computing in 3 sentences.";

console.log(`Sending test prompt: "${prompt}"`);

try {
  // Generate response
  const { text, tokenUsage } = await client.generateText(prompt);
  
  console.log("\nResponse:");
  console.log("=========");
  console.log(text);
  console.log("\nToken Usage:");
  console.log(`Prompt tokens: ${tokenUsage.promptTokens}`);
  console.log(`Completion tokens: ${tokenUsage.completionTokens}`);
  console.log(`Total tokens: ${tokenUsage.totalTokens}`);
  
  // Test key rotation by making multiple requests
  console.log("\nTesting key rotation with multiple requests...");
  
  for (let i = 0; i < apiKeys.length; i++) {
    console.log(`\nRequest ${i + 1}:`);
    const result = await client.generateText(`Tell me a fun fact about ${i + 1}`);
    console.log(`Response: ${result.text.substring(0, 100)}...`);
  }
  
  console.log("\nAll tests completed successfully!");
} catch (error) {
  console.error("Error during test:", error);
}