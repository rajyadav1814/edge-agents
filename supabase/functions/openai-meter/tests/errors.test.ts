import { assertEquals, assertExists } from "https://deno.land/std@0.140.0/testing/asserts.ts";
import { handleRequest } from "./index.ts";
import { TestConfig } from "./test.config.ts";
import {
  setupTestEnv,
  cleanupTestEnv,
  createTestRequest,
  MockAIProvider,
} from "./test_utils.ts";

Deno.test("Error Handling Tests", async (t) => {
  setupTestEnv();

  await t.step("Authentication errors", async (t) => {
    await t.step("returns 401 for missing API key", async () => {
      const request = createTestRequest()
        .withJsonBody({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: "test" }],
        })
        .build();

      const response = await handleRequest(request);
      const data = await response.json();

      assertEquals(response.status, 401);
      assertEquals(data.error.type, "authentication_error");
      assertEquals(data.error.message, "Missing API key");
    });

    await t.step("returns 401 for invalid API key", async () => {
      const request = createTestRequest()
        .withAuth("invalid_key")
        .withJsonBody({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: "test" }],
        })
        .build();

      const response = await handleRequest(request);
      const data = await response.json();

      assertEquals(response.status, 401);
      assertEquals(data.error.type, "authentication_error");
      assertEquals(data.error.message, "Invalid API key");
    });
  });

  await t.step("Request validation errors", async (t) => {
    await t.step("returns 400 for missing model", async () => {
      const request = createTestRequest()
        .withAuth(TestConfig.env.required.OPENAI_API_KEY)
        .withJsonBody({
          messages: [{ role: "user", content: "test" }],
        } as any)
        .build();

      const response = await handleRequest(request);
      const data = await response.json();

      assertEquals(response.status, 400);
      assertEquals(data.error.type, "validation_error");
      assertEquals(data.error.message, "Missing required field: model");
    });

    await t.step("returns 400 for missing messages", async () => {
      const request = createTestRequest()
        .withAuth(TestConfig.env.required.OPENAI_API_KEY)
        .withJsonBody({
          model: "gpt-3.5-turbo",
        } as any)
        .build();

      const response = await handleRequest(request);
      const data = await response.json();

      assertEquals(response.status, 400);
      assertEquals(data.error.type, "validation_error");
      assertEquals(data.error.message, "Missing required field: messages");
    });

    await t.step("returns 400 for invalid message format", async () => {
      const request = createTestRequest()
        .withAuth(TestConfig.env.required.OPENAI_API_KEY)
        .withJsonBody({
          model: "gpt-3.5-turbo",
          messages: [{ content: "test" }], // Missing role
        } as any)
        .build();

      const response = await handleRequest(request);
      const data = await response.json();

      assertEquals(response.status, 400);
      assertEquals(data.error.type, "validation_error");
      assertEquals(data.error.message, "Invalid message format");
    });
  });

  await t.step("Provider errors", async (t) => {
    await t.step("handles provider error gracefully", async () => {
      const mockProvider = new MockAIProvider(true); // Enable error mode
      const request = createTestRequest()
        .withAuth(TestConfig.env.required.OPENAI_API_KEY)
        .withJsonBody({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: "test" }],
        })
        .build();

      const response = await handleRequest(request);
      const data = await response.json();

      assertEquals(response.status, 500);
      assertEquals(data.error.type, "provider_error");
      assertExists(data.error.message);
    });

    await t.step("handles streaming provider error gracefully", async () => {
      const mockProvider = new MockAIProvider(true); // Enable error mode
      const request = createTestRequest()
        .withAuth(TestConfig.env.required.OPENAI_API_KEY)
        .withJsonBody({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: "test" }],
          stream: true,
        })
        .build();

      const response = await handleRequest(request);
      const data = await response.json();

      assertEquals(response.status, 500);
      assertEquals(data.error.type, "provider_error");
      assertExists(data.error.message);
    });
  });

  await t.step("Rate limiting errors", async (t) => {
    await t.step("returns 429 when rate limit exceeded", async () => {
      // Make requests until rate limit is hit
      const requests = Array(TestConfig.performance.maxRequestsPerMinute + 1)
        .fill(null)
        .map(() => createTestRequest()
          .withAuth(TestConfig.env.required.OPENAI_API_KEY)
          .withJsonBody({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: "test" }],
          })
          .build()
        );

      const responses = await Promise.all(requests.map(r => handleRequest(r)));
      const rateLimited = responses.find(r => r.status === 429);

      assertExists(rateLimited);
      const data = await rateLimited.json();
      assertEquals(data.error.type, "rate_limit_error");
      assertExists(data.error.message);
    });
  });

  cleanupTestEnv();
});