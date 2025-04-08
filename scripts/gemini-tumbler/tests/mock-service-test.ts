/**
 * Mock test script for multiple Google AI services
 * This test doesn't make actual API calls but simulates the behavior
 */

import { GoogleAIServiceFactory } from "../src/agent/googleAIServiceFactory.ts";

console.log("Testing Google AI Services Integration (MOCK MODE)");

// Mock API keys
const apiKeys = [
  "mock-api-key-1",
  "mock-api-key-2",
  "mock-api-key-3"
];

console.log(`Found ${apiKeys.length} API keys`);

// Mock project ID
const projectId = "mock-project-id";

// Mock the process method for all clients
const originalCreateClient = GoogleAIServiceFactory.createClient;
GoogleAIServiceFactory.createClient = function(config) {
  const client = originalCreateClient(config);
  
  // Override the process method with a mock implementation
  client.process = async function(input, options) {
    console.log(`[MOCK] Processing input with ${this.getServiceType()} service`);
    console.log(`[MOCK] Input: "${input.substring(0, 50)}${input.length > 50 ? '...' : ''}"`);
    
    if (options) {
      console.log(`[MOCK] Options: ${JSON.stringify(options)}`);
    }
    
    // Simulate different responses based on service type
    let mockResult;
    
    switch (this.getServiceType()) {
      case 'gemini':
        mockResult = `This is a mock response from the Gemini service for prompt: "${input.substring(0, 30)}..."`;
        break;
      case 'vertex':
        mockResult = `This is a mock response from the Vertex AI service for prompt: "${input.substring(0, 30)}..."`;
        break;
      case 'natural-language':
        mockResult = {
          documentSentiment: {
            magnitude: 0.8,
            score: 0.5
          },
          language: "en",
          sentences: [
            {
              text: { content: input.substring(0, 50) },
              sentiment: { magnitude: 0.8, score: 0.5 }
            }
          ]
        };
        break;
      case 'document-ai':
        mockResult = {
          document: {
            text: input,
            pages: [{ pageNumber: 1 }],
            entities: [
              { type: "PERSON", mentionText: "John Doe", confidence: 0.95 },
              { type: "ORGANIZATION", mentionText: "Google", confidence: 0.98 }
            ]
          }
        };
        break;
      default:
        mockResult = "Unknown service type";
    }
    
    // Simulate token usage
    const usage = {
      promptTokens: Math.ceil(input.length / 4),
      completionTokens: typeof mockResult === 'string' 
        ? Math.ceil(mockResult.length / 4) 
        : Math.ceil(JSON.stringify(mockResult).length / 4),
      totalTokens: 0
    };
    
    usage.totalTokens = usage.promptTokens + usage.completionTokens;
    
    return { result: mockResult, usage };
  };
  
  return client;
};

// Test each service
async function testServices() {
  try {
    // Test Gemini service
    await testGeminiService(apiKeys);
    
    // Test Natural Language service
    await testNaturalLanguageService(apiKeys);
    
    // Test Vertex AI service
    await testVertexAIService(apiKeys);
    
    // Test Document AI service
    await testDocumentAIService(apiKeys);
    
    console.log("\nAll tests completed successfully!");
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

async function testVertexAIService(apiKeys: string[]) {
  console.log("\n=== Testing Vertex AI Service ===");
  
  // Create Vertex AI client
  const vertexClient = GoogleAIServiceFactory.createClient({
    serviceType: 'vertex',
    apiKeys,
    projectId,
    region: "us-central1",
    parameters: {
      modelName: "gemini-1.5-pro"
    }
  });
  
  console.log(`Service type: ${vertexClient.getServiceType()}`);
  console.log(`Capabilities: ${vertexClient.getCapabilities().join(", ")}`);
  console.log(`Usage limits: ${JSON.stringify(vertexClient.getUsageLimits())}`);
  console.log(`Available keys: ${vertexClient.getKeyCount()}`);
  
  // Test prompt
  const prompt = "Write a short poem about artificial intelligence.";
  console.log(`\nSending test prompt: "${prompt}"`);
  
  const { result, usage } = await vertexClient.process(prompt);
  
  console.log("\nResponse:");
  console.log("=========");
  console.log(result);
  console.log("\nToken Usage:");
  console.log(`Prompt tokens: ${usage.promptTokens}`);
  console.log(`Completion tokens: ${usage.completionTokens}`);
  console.log(`Total tokens: ${usage.totalTokens}`);
}

async function testDocumentAIService(apiKeys: string[]) {
  console.log("\n=== Testing Document AI Service ===");
  
  // Create Document AI client
  const docClient = GoogleAIServiceFactory.createClient({
    serviceType: 'document-ai',
    apiKeys,
    projectId,
    parameters: {
      processorId: "mock-processor-id"
    }
  });
  
  console.log(`Service type: ${docClient.getServiceType()}`);
  console.log(`Capabilities: ${docClient.getCapabilities().join(", ")}`);
  console.log(`Usage limits: ${JSON.stringify(docClient.getUsageLimits())}`);
  console.log(`Available keys: ${docClient.getKeyCount()}`);
  
  // Test document (mock base64 content)
  const mockDocument = "This is a sample document with some text that contains information about John Doe who works at Google.";
  console.log(`\nProcessing document: "${mockDocument.substring(0, 50)}..."`);
  
  const { result, usage } = await docClient.process(mockDocument, { 
    mimeType: "text/plain",
    isBase64: false
  });
  
  console.log("\nDocument Processing Result:");
  console.log("==========================");
  console.log(`Entities found: ${result.document.entities.length}`);
  console.log(`Entities: ${JSON.stringify(result.document.entities)}`);
  console.log("\nToken Usage:");
  console.log(`Prompt tokens: ${usage.promptTokens}`);
  console.log(`Completion tokens: ${usage.completionTokens}`);
  console.log(`Total tokens: ${usage.totalTokens}`);
}

// Run the tests
await testServices();