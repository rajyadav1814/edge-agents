import { assertEquals, assertRejects } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { OpenAIProxy } from "../services/openai-proxy.ts";
import { EnvironmentValidator } from "../config/env-validator.ts";
import { APIError, StatusCodes, OpenAIRequest, ChatMessage } from "../api-contract.ts";

// Helper function to convert string to Uint8Array
function stringToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

Deno.test("OpenAI Proxy - successful request", async () => {
  // Setup
  EnvironmentValidator.resetConfig();
  Deno.env.set("OPENAI_API_KEY", "test-key");
  Deno.env.set("STRIPE_SECRET_KEY", "sk_test");
  Deno.env.set("SUPABASE_URL", "https://test.supabase.co");
  Deno.env.set("SUPABASE_ANON_KEY", "test-key");

  const proxy = new OpenAIProxy();
  const mockRequest: OpenAIRequest = {
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "user",
        content: "Hello, world!",
      },
    ],
  };

  const mockResponse = new Response(
    JSON.stringify({
      id: "test-id",
      object: "chat.completion",
      created: Date.now(),
      model: "gpt-3.5-turbo",
      usage: {
        prompt_tokens: 10,
        completion_tokens: 20,
        total_tokens: 30,
      },
      choices: [
        {
          message: {
            role: "assistant",
            content: "Hello! How can I help you today?",
          },
          finish_reason: "stop",
          index: 0,
        },
      ],
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  // Mock fetch
  globalThis.fetch = async () => mockResponse;

  // Test
  const response = await proxy.handleRequest(
    new Request("http://localhost", {
      method: "POST",
      headers: {
        "Authorization": "Bearer test-token",
        "Content-Type": "application/json",
      },
    }),
    mockRequest
  );

  // Assert
  assertEquals(response.status, 200);
  const data = await response.json();
  assertEquals(data.choices[0].message.content, "Hello! How can I help you today?");
});

Deno.test("OpenAI Proxy - streaming request", async () => {
  // Setup
  EnvironmentValidator.resetConfig();
  Deno.env.set("OPENAI_API_KEY", "test-key");
  Deno.env.set("STRIPE_SECRET_KEY", "sk_test");
  Deno.env.set("SUPABASE_URL", "https://test.supabase.co");
  Deno.env.set("SUPABASE_ANON_KEY", "test-key");

  const proxy = new OpenAIProxy();
  const streamRequest: OpenAIRequest = {
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "user",
        content: "Hello, world!",
      },
    ],
    stream: true,
  };

  const mockResponse = new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(stringToUint8Array('data: {"choices":[{"delta":{"content":"Hello"},"index":0}]}\n\n'));
        controller.enqueue(stringToUint8Array('data: {"choices":[{"delta":{"content":"!"},"index":0}]}\n\n'));
        controller.enqueue(stringToUint8Array('data: [DONE]\n\n'));
        controller.close();
      },
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
      },
    }
  );

  // Mock fetch
  globalThis.fetch = async () => mockResponse;

  // Test
  const response = await proxy.handleRequest(
    new Request("http://localhost", {
      method: "POST",
      headers: {
        "Authorization": "Bearer test-token",
        "Content-Type": "application/json",
      },
    }),
    streamRequest
  );

  // Assert
  assertEquals(response.status, 200);
  assertEquals(response.headers.get("Content-Type"), "text/event-stream");

  // Read and verify stream content
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Response body is null");
  }

  const chunks: string[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(new TextDecoder().decode(value));
  }

  const streamContent = chunks.join("");
  assertEquals(streamContent.includes('"content":"Hello"'), true);
  assertEquals(streamContent.includes('"content":"!"'), true);
  assertEquals(streamContent.includes("[DONE]"), true);
});

Deno.test("OpenAI Proxy - rate limit error", async () => {
  // Setup
  EnvironmentValidator.resetConfig();
  Deno.env.set("OPENAI_API_KEY", "test-key");
  Deno.env.set("STRIPE_SECRET_KEY", "sk_test");
  Deno.env.set("SUPABASE_URL", "https://test.supabase.co");
  Deno.env.set("SUPABASE_ANON_KEY", "test-key");
  Deno.env.set("RATE_LIMIT_MAX_REQUESTS", "1");

  const proxy = new OpenAIProxy();
  const mockRequest: OpenAIRequest = {
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "user",
        content: "Hello, world!",
      },
    ],
  };

  // First request should succeed
  await proxy.handleRequest(
    new Request("http://localhost", {
      method: "POST",
      headers: {
        "Authorization": "Bearer test-token",
        "Content-Type": "application/json",
      },
    }),
    mockRequest
  );

  // Second request should fail
  await assertRejects(
    async () =>
      await proxy.handleRequest(
        new Request("http://localhost", {
          method: "POST",
          headers: {
            "Authorization": "Bearer test-token",
            "Content-Type": "application/json",
          },
        }),
        mockRequest
      ),
    APIError,
    "Rate limit exceeded"
  );
});

Deno.test("OpenAI Proxy - OpenAI API error", async () => {
  // Setup
  EnvironmentValidator.resetConfig();
  Deno.env.set("OPENAI_API_KEY", "test-key");
  Deno.env.set("STRIPE_SECRET_KEY", "sk_test");
  Deno.env.set("SUPABASE_URL", "https://test.supabase.co");
  Deno.env.set("SUPABASE_ANON_KEY", "test-key");

  const proxy = new OpenAIProxy();
  const mockRequest: OpenAIRequest = {
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "user",
        content: "Hello, world!",
      },
    ],
  };

  // Mock fetch to return error
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        error: {
          message: "Invalid API key",
          type: "invalid_request_error",
        },
      }),
      {
        status: 401,
      }
    );

  // Test & Assert
  await assertRejects(
    async () =>
      await proxy.handleRequest(
        new Request("http://localhost", {
          method: "POST",
          headers: {
            "Authorization": "Bearer test-token",
            "Content-Type": "application/json",
          },
        }),
        mockRequest
      ),
    APIError,
    "Invalid API key"
  );
});