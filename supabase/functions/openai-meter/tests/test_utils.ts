import { TestConfig } from "./test.config.ts";
import { CompletionRequest, ResponseFormat, StreamChunk, MeteringProvider, AIProvider } from "./types.ts";

interface DeltaContent {
  content: string;
}

interface DeltaWithRole extends DeltaContent {
  role: string;
}

interface StreamChoice {
  delta: {
    content?: string;
    role?: string;
  };
  finish_reason: string | null;
}

interface StreamResponse {
  choices: StreamChoice[];
}

/**
 * Type guard for delta with role
 */
function hasDeltaRole(delta: DeltaContent | DeltaWithRole): delta is DeltaWithRole {
  return 'role' in delta;
}

/**
 * Test request builder
 */
export class TestRequestBuilder {
  private request: Request;
  private headers: Headers;
  private body: string | null;

  constructor() {
    this.headers = new Headers();
    this.body = null;
    this.request = new Request("http://localhost:8000", {
      method: "POST",
    });
  }

  withMethod(method: string): TestRequestBuilder {
    this.request = new Request(this.request, { method });
    return this;
  }

  withAuth(token: string): TestRequestBuilder {
    this.headers.set("Authorization", `Bearer ${token}`);
    return this;
  }

  withHeaders(headers: Headers): TestRequestBuilder {
    for (const [key, value] of headers.entries()) {
      this.headers.set(key, value);
    }
    return this;
  }

  withJsonBody(body: CompletionRequest): TestRequestBuilder {
    this.headers.set("Content-Type", "application/json");
    this.body = JSON.stringify(body);
    return this;
  }

  withBody(body: string): TestRequestBuilder {
    this.body = body;
    return this;
  }

  build(): Request {
    return new Request(this.request, {
      method: this.request.method,
      headers: this.headers,
      body: this.body,
    });
  }
}

/**
 * Mock Stripe metering provider
 */
export class MockStripeMetering implements MeteringProvider {
  private rateLimitCounter: Map<string, number>;
  private rateLimitWindow: number;
  private maxRequestsPerWindow: number;

  constructor() {
    this.rateLimitCounter = new Map();
    this.rateLimitWindow = TestConfig.mockProviders.stripe.rateLimitWindow;
    this.maxRequestsPerWindow = TestConfig.mockProviders.stripe.maxRequestsPerWindow;
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    await this.simulateLatency();
    return apiKey !== "invalid_subscription";
  }

  async recordUsage(params: { customerId: string; quantity: number; timestamp: Date }): Promise<void> {
    await this.simulateLatency();
    
    const count = this.rateLimitCounter.get(params.customerId) || 0;
    if (count >= this.maxRequestsPerWindow) {
      throw new Error("Rate limit exceeded");
    }
    
    this.rateLimitCounter.set(params.customerId, count + 1);
    
    // Reset counter after window
    setTimeout(() => {
      this.rateLimitCounter.delete(params.customerId);
    }, this.rateLimitWindow);
  }

  private async simulateLatency(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, TestConfig.mockProviders.stripe.defaultLatencyMs));
  }
}

/**
 * Mock AI provider
 */
export class MockAIProvider implements AIProvider {
  private latencyMs: number;
  private errorMode: boolean;

  constructor(errorMode = false, latencyMs = TestConfig.mockProviders.openai.defaultLatencyMs) {
    this.errorMode = errorMode;
    this.latencyMs = latencyMs;
  }

  async createCompletion(request: CompletionRequest): Promise<ResponseFormat> {
    await this.simulateLatency();
    
    if (this.errorMode) {
      throw new Error("Provider error");
    }

    return {
      id: "mock-completion-id",
      object: "text_completion",
      created: Date.now(),
      model: request.model,
      choices: [...TestConfig.mocks.provider.completion.choices].map(choice => ({
        text: choice.text,
        index: choice.index,
        logprobs: choice.logprobs,
        finish_reason: choice.finish_reason,
      })),
      usage: {
        prompt_tokens: 10,
        completion_tokens: 20,
        total_tokens: 30,
      },
    };
  }

  async createChatCompletion(request: CompletionRequest): Promise<ResponseFormat> {
    await this.simulateLatency();
    
    if (this.errorMode) {
      throw new Error("Provider error");
    }

    return {
      id: "mock-chat-id",
      object: "chat.completion",
      created: Date.now(),
      model: request.model,
      choices: [...TestConfig.mocks.provider.chat.choices].map(choice => ({
        message: {
          role: choice.message.role,
          content: choice.message.content,
        },
        index: choice.index,
        finish_reason: choice.finish_reason,
      })),
      usage: {
        prompt_tokens: 15,
        completion_tokens: 25,
        total_tokens: 40,
      },
    };
  }

  async *streamCompletion(request: CompletionRequest): AsyncGenerator<StreamChunk> {
    if (this.errorMode) {
      throw new Error("Provider error");
    }

    for (const chunk of TestConfig.mocks.provider.stream.chunks as StreamResponse[]) {
      await this.simulateLatency(TestConfig.mockProviders.openai.streamChunkIntervalMs);
      
      const choice = chunk.choices[0];
      const delta = {
        content: choice.delta.content || "",
        ...(choice.delta.role && { role: choice.delta.role }),
      };

      yield {
        id: "mock-stream-id",
        object: "text_completion",
        created: Date.now(),
        model: request.model,
        choices: [{
          delta,
          finish_reason: choice.finish_reason,
        }],
      };
    }
  }

  private async simulateLatency(ms = this.latencyMs): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Test environment setup and cleanup
 */
export interface TestEnvConfig {
  [key: string]: string;
}

export function setupTestEnv(config?: TestEnvConfig): void {
  // Set provided environment variables
  if (config) {
    for (const [key, value] of Object.entries(config)) {
      Deno.env.set(key, value);
    }
  }

  // Set required environment variables if not provided
  for (const [key, value] of Object.entries(TestConfig.env.required)) {
    if (!Deno.env.get(key)) {
      Deno.env.set(key, value);
    }
  }

  // Set optional environment variables if not provided
  for (const [key, value] of Object.entries(TestConfig.env.optional)) {
    if (!Deno.env.get(key)) {
      Deno.env.set(key, value);
    }
  }
}

export function cleanupTestEnv(): void {
  // Remove test environment variables
  for (const key of Object.keys(TestConfig.env.required)) {
    Deno.env.delete(key);
  }

  for (const key of Object.keys(TestConfig.env.optional)) {
    Deno.env.delete(key);
  }
}

/**
 * Test request creation helper
 */
export function createTestRequest(): TestRequestBuilder {
  return new TestRequestBuilder();
}