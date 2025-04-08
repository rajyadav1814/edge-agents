/**
 * Unit tests for TumblerService
 */

import { assertEquals, assertExists } from "std/testing/asserts.ts";
import { TumblerService } from "./tumblerService.ts";
import { TumblerConfig, TumblerRequest } from "../types/index.ts";

// Mock GeminiClient
import { GeminiClient } from "./geminiClient.ts";

// Create a spy for the GeminiClient
class MockGeminiClient extends GeminiClient {
  public generateTextCalls: Array<{prompt: string; systemPrompt?: string}> = [];
  public mockResponse = {
    text: "Mock response from Gemini",
    tokenUsage: {
      promptTokens: 10,
      completionTokens: 15,
      totalTokens: 25
    }
  };

  constructor() {
    super({
      apiKey: "mock-api-key",
      modelName: "mock-model"
    });
  }

  override async generateText(prompt: string, systemPrompt?: string) {
    this.generateTextCalls.push({ prompt, systemPrompt });
    return this.mockResponse;
  }
}

// Mock environment variables
const originalEnv = Deno.env.get;
function mockEnv() {
  Deno.env.get = (key: string) => {
    if (key === "GEMINI_API_KEY") return "mock-api-key";
    return originalEnv.call(Deno.env, key);
  };
}

function restoreEnv() {
  Deno.env.get = originalEnv;
}

// Create a test config
function createTestConfig(): TumblerConfig {
  return {
    rotationInterval: 0, // Disable auto-rotation for tests
    models: [
      {
        name: "gemini-1.5-pro",
        provider: "google",
        apiKeyEnvVar: "GEMINI_API_KEY",
        contextWindow: 32000,
        maxOutputTokens: 8192,
        capabilities: ["code", "reasoning"]
      },
      {
        name: "gemini-1.5-flash",
        provider: "google",
        apiKeyEnvVar: "GEMINI_API_KEY",
        contextWindow: 32000,
        maxOutputTokens: 8192,
        capabilities: ["fast-responses"]
      }
    ],
    defaultModel: "gemini-1.5-pro",
    anonymousContribution: false
  };
}

// Mock the client creation in TumblerService
let mockClient: MockGeminiClient;

// We need to override the private method, which is tricky in TypeScript
// For testing purposes, we'll create a test subclass
class TestTumblerService extends TumblerService {
  constructor(config: TumblerConfig) {
    super(config);
    
    // Replace the clients map with our mock
    const clientsMap = new Map<string, GeminiClient>();
    mockClient = new MockGeminiClient();
    
    // Add mock client for all models
    for (const model of config.models) {
      clientsMap.set(model.name, mockClient);
    }
    
    // @ts-ignore - accessing private property for testing
    this.clients = clientsMap;
  }
}

Deno.test("TumblerService - initialization", () => {
  mockEnv();
  
  try {
    const config = createTestConfig();
    const service = new TestTumblerService(config);
    
    // Check available models
    const models = service.getAvailableModels();
    assertEquals(models.length, 2);
    assertEquals(models[0].name, "gemini-1.5-pro");
    assertEquals(models[0].isDefault, true);
    assertEquals(models[1].name, "gemini-1.5-flash");
    assertEquals(models[1].isDefault, false);
    
    // Check contribution manager
    const contributionManager = service.getContributionManager();
    assertExists(contributionManager);
  } finally {
    restoreEnv();
  }
});

Deno.test("TumblerService - processRequest with default model", async () => {
  mockEnv();
  
  try {
    const config = createTestConfig();
    const service = new TestTumblerService(config);
    
    // Reset mock calls
    mockClient.generateTextCalls = [];
    
    // Create a request
    const request: TumblerRequest = {
      prompt: "Test prompt",
      systemPrompt: "System instructions",
      temperature: 0.5,
      maxTokens: 1000
    };
    
    // Process the request
    const response = await service.processRequest(request);
    
    // Check that the client was called correctly
    assertEquals(mockClient.generateTextCalls.length, 1);
    assertEquals(mockClient.generateTextCalls[0].prompt, "Test prompt");
    assertEquals(mockClient.generateTextCalls[0].systemPrompt, "System instructions");
    
    // Check the response
    assertEquals(response.content, "Mock response from Gemini");
    assertEquals(response.model, "gemini-1.5-pro"); // Default model
    assertEquals(response.tokenUsage.promptTokens, 10);
    assertEquals(response.tokenUsage.completionTokens, 15);
    assertEquals(response.tokenUsage.totalTokens, 25);
    assertExists(response.id);
    assertExists(response.timestamp);
    assertExists(response.processingTime);
  } finally {
    restoreEnv();
  }
});

Deno.test("TumblerService - processRequest with specified model", async () => {
  mockEnv();
  
  try {
    const config = createTestConfig();
    const service = new TestTumblerService(config);
    
    // Reset mock calls
    mockClient.generateTextCalls = [];
    
    // Create a request with specific model
    const request: TumblerRequest = {
      prompt: "Test prompt",
      model: "gemini-1.5-flash" // Specify non-default model
    };
    
    // Process the request
    const response = await service.processRequest(request);
    
    // Check the response uses the specified model
    assertEquals(response.model, "gemini-1.5-flash");
  } finally {
    restoreEnv();
  }
});

Deno.test("TumblerService - anonymous contribution", async () => {
  mockEnv();
  
  try {
    // Create config with anonymous contribution enabled
    const config = createTestConfig();
    config.anonymousContribution = true;
    
    const service = new TestTumblerService(config);
    
    // Reset mock calls
    mockClient.generateTextCalls = [];
    
    // Create a request with contribution consent
    const request: TumblerRequest = {
      prompt: "Test prompt",
      contributionConsent: true
    };
    
    // Process the request
    await service.processRequest(request);
    
    // We can't easily test the contribution storage directly
    // In a real test, we would mock the ContributionManager and verify it was called
  } finally {
    restoreEnv();
  }
});