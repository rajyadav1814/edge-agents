import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { OpenAIRequest, OpenAIResponse, ChatMessage } from "../api-contract.ts";

/**
 * Test Environment Setup
 */
export function setupTestEnvironment() {
  // Set required environment variables
  Deno.env.set("OPENAI_API_KEY", "test-openai-key");
  Deno.env.set("STRIPE_SECRET_KEY", "test-stripe-key");
  Deno.env.set("SUPABASE_URL", "https://test.supabase.co");
  Deno.env.set("SUPABASE_ANON_KEY", "test-anon-key");
  
  // Set optional variables
  Deno.env.set("RATE_LIMIT_WINDOW", "1000");
  Deno.env.set("RATE_LIMIT_MAX_REQUESTS", "5");
  Deno.env.set("CORS_ALLOWED_ORIGINS", "http://localhost:3000,https://test.com");
}

/**
 * Test Request Builders
 */
export function createTestRequest(
  method = "POST",
  body: OpenAIRequest | null = null,
  headers: Record<string, string> = {}
): Request {
  const url = "http://localhost:8000/openai-meter";
  const init: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (body) {
    init.body = JSON.stringify(body);
  }

  return new Request(url, init);
}

/**
 * Sample Messages
 */
export const testMessages: ChatMessage[] = [
  {
    role: "system",
    content: "You are a helpful assistant.",
  },
  {
    role: "user",
    content: "Hello, how are you?",
  },
];

/**
 * Sample OpenAI Request
 */
export const mockOpenAIRequest: OpenAIRequest = {
  model: "gpt-3.5-turbo",
  messages: testMessages,
  temperature: 0.7,
  max_tokens: 150,
};

/**
 * Sample OpenAI Response
 */
export const mockOpenAIResponse: OpenAIResponse = {
  id: "test-response-id",
  object: "chat.completion",
  created: Date.now(),
  model: "gpt-3.5-turbo",
  choices: [
    {
      index: 0,
      message: {
        role: "assistant",
        content: "Hello! I'm doing well, thank you for asking. How can I help you today?",
      },
      finish_reason: "stop",
    },
  ],
  usage: {
    prompt_tokens: 20,
    completion_tokens: 15,
    total_tokens: 35,
  },
};

/**
 * Mock Stripe Subscription
 */
export const mockSubscription = {
  id: "test-sub-id",
  customer: "test-customer-id",
  status: "active",
  items: {
    data: [
      {
        id: "test-item-id",
        price: {
          lookup_key: "pro",
        },
      },
    ],
  },
};

/**
 * Test Helpers
 */
export function assertErrorResponse(
  response: Response,
  expectedStatus: number,
  expectedType: string,
  expectedMessage?: string
) {
  const body = JSON.parse(response.body as unknown as string);
  assertEquals(response.status, expectedStatus);
  assertEquals(body.error.type, expectedType);
  if (expectedMessage) {
    assertEquals(body.error.message, expectedMessage);
  }
}

/**
 * Mock Headers for Testing
 */
export const testHeaders = {
  validAuth: { "Authorization": "Bearer test-token" },
  invalidAuth: { "Authorization": "Invalid" },
  validOrigin: { "Origin": "http://localhost:3000" },
  invalidOrigin: { "Origin": "http://evil.com" },
};

/**
 * Mock Fetch Implementation
 */
export function mockFetch(response: Response | Error) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = response instanceof Error
    ? () => Promise.reject(response)
    : () => Promise.resolve(response);
  return originalFetch;
}

/**
 * Reset Fetch to Original
 */
export function resetFetch(originalFetch: typeof fetch) {
  globalThis.fetch = originalFetch;
}

/**
 * Clean Up Test Environment
 */
export function cleanupTestEnvironment() {
  const vars = [
    "OPENAI_API_KEY",
    "STRIPE_SECRET_KEY",
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "RATE_LIMIT_WINDOW",
    "RATE_LIMIT_MAX_REQUESTS",
    "CORS_ALLOWED_ORIGINS",
  ];

  for (const key of vars) {
    Deno.env.delete(key);
  }
}