/**
 * Test script for multiple Google AI services
 */

import { load } from "dotenv";
import { GoogleAIServiceFactory } from "../src/agent/googleAIServiceFactory.ts";

// Load environment variables with correct options
await load({ 
  export: true, 
  allowEmptyValues: true,
  examplePath: null // Don't validate against example file
});

console.log("Testing Google AI Services Integration");

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

// Get project ID for services that require it
const projectId = Deno.env.get("GOOGLE_PROJECT_ID") || "";
if (!projectId) {
  console.warn("No project ID found. Some services may not work correctly.");
}

// Test each service
async function testServices() {
  try {
    // Test Gemini service
    await testGeminiService(apiKeys);
    
    // Test Natural Language service if project ID is available
    if (projectId) {
      await testNaturalLanguageService(apiKeys);
    } else {
      console.log("\nSkipping Natural Language service test (no project ID)");
    }
    
    console.log("\nAll tests completed!");
  } catch (error) {
    console.error("Error during tests:", error);
  }
}

async function testGeminiService(apiKeys: string[]) {
  console.log("\n=== Testing Gemini Service ===");
  
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
  
  console.log(`Service type: ${geminiClient.getServiceType()}`);
  console.log(`Capabilities: ${geminiClient.getCapabilities().join(", ")}`);
  console.log(`Usage limits: ${JSON.stringify(geminiClient.getUsageLimits())}`);
  console.log(`Available keys: ${geminiClient.getKeyCount()}`);
  
  // Test prompt
  const prompt = "Explain quantum computing in 3 sentences.";
  console.log(`\nSending test prompt: "${prompt}"`);
  
  const { result, usage } = await geminiClient.process(prompt);
  
  console.log("\nResponse:");
  console.log("=========");
  console.log(result);
  console.log("\nToken Usage:");
  console.log(`Prompt tokens: ${usage.promptTokens}`);
  console.log(`Completion tokens: ${usage.completionTokens}`);
  console.log(`Total tokens: ${usage.totalTokens}`);
}

async function testNaturalLanguageService(apiKeys: string[]) {
  console.log("\n=== Testing Natural Language Service ===");
  
  // Create Natural Language client
  const nlClient = GoogleAIServiceFactory.createClient({
    serviceType: 'natural-language',
    apiKeys,
    projectId
  });
  
  console.log(`Service type: ${nlClient.getServiceType()}`);
  console.log(`Capabilities: ${nlClient.getCapabilities().join(", ")}`);
  console.log(`Usage limits: ${JSON.stringify(nlClient.getUsageLimits())}`);
  console.log(`Available keys: ${nlClient.getKeyCount()}`);
  
  // Test text
  const text = "Google Cloud Platform is a suite of cloud computing services that runs on the same infrastructure that Google uses internally for its end-user products. I love using it for my projects!";
  console.log(`\nAnalyzing text: "${text.substring(0, 50)}..."`);
  
  // Test sentiment analysis
  const { result, usage } = await nlClient.process(text, { analysisType: "sentiment" });
  
  console.log("\nSentiment Analysis Result:");
  console.log("=========================");
  console.log(`Document sentiment: ${JSON.stringify(result.documentSentiment)}`);
  console.log("\nToken Usage:");
  console.log(`Prompt tokens: ${usage.promptTokens}`);
  console.log(`Completion tokens: ${usage.completionTokens}`);
  console.log(`Total tokens: ${usage.totalTokens}`);
}

// Run the tests
await testServices();