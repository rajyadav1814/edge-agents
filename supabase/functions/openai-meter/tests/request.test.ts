import { assertEquals, assertExists, assertRejects } from "https://deno.land/std@0.140.0/testing/asserts.ts";
import { handleRequest } from "./index.ts";
import { TestConfig } from "./test.config.ts";
import {
  setupTestEnv,
  cleanupTestEnv,
  createTestRequest,
} from "./test_utils.ts";

Deno.test("Request Handling Tests", async (t) => {
  setupTestEnv();

  await t.step("Request Validation", async (t) => {
    await t.step("validates required fields", async () => {
      const request = createTestRequest()
        .withAuth(TestConfig.env.required.OPENAI_API_KEY)
        .withJsonBody({} as any)
        .build();

      const response = await handleRequest(request);
      const data = await response.json();

      assertEquals(response.status, 400);
      assertEquals(data.error.type, "validation_error");
      assertExists(data.error.message);
    });

    await t.step("validates message format", async () => {
      const request = createTestRequest()
        .withAuth(TestConfig.env.required.OPENAI_API_KEY)
        .withJsonBody({
          model: "gpt-3.5-turbo",
          messages: [{ content: "Invalid message" }], // Missing role
        } as any)
        .build();

      const response = await handleRequest(request);
      const data = await response.json();

      assertEquals(response.status, 400);
      assertEquals(data.error.type, "validation_error");
      assertEquals(data.error.message, "Invalid message format");
    });

    await t.step("validates model selection", async () => {
      const request = createTestRequest()
        .withAuth(TestConfig.env.required.OPENAI_API_KEY)
        .withJsonBody({
          model: "invalid-model",
          messages: [{ role: "user", content: "test" }],
        })
        .build();

      const response = await handleRequest(request);
      const data = await response.json();

      assertEquals(response.status, 400);
      assertEquals(data.error.type, "validation_error");
      assertEquals(data.error.message, "Invalid model selection");
    });
  });

  await t.step("Authentication", async (t) => {
    await t.step("requires API key", async () => {
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

    await t.step("validates API key format", async () => {
      const request = createTestRequest()
        .withAuth("invalid-format-key")
        .withJsonBody({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: "test" }],
        })
        .build();

      const response = await handleRequest(request);
      const data = await response.json();

      assertEquals(response.status, 401);
      assertEquals(data.error.type, "authentication_error");
      assertEquals(data.error.message, "Invalid API key format");
    });
  });

  await t.step("Error Handling", async (t) => {
    await t.step("handles invalid JSON", async () => {
      const request = createTestRequest()
        .withAuth(TestConfig.env.required.OPENAI_API_KEY)
        .withBody("invalid json")
        .build();

      const response = await handleRequest(request);
      const data = await response.json();

      assertEquals(response.status, 400);
      assertEquals(data.error.type, "invalid_request");
      assertEquals(data.error.message, "Invalid JSON payload");
    });

    await t.step("handles provider errors", async () => {
      const request = createTestRequest()
        .withAuth(TestConfig.env.required.OPENAI_API_KEY)
        .withJsonBody({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: "trigger_error" }],
        })
        .build();

      const response = await handleRequest(request);
      const data = await response.json();

      assertEquals(response.status, 500);
      assertEquals(data.error.type, "provider_error");
      assertExists(data.error.message);
    });

    await t.step("handles rate limiting", async () => {
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

  await t.step("Successful Requests", async (t) => {
    await t.step("handles completion requests", async () => {
      const request = createTestRequest()
        .withAuth(TestConfig.env.required.OPENAI_API_KEY)
        .withJsonBody({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: "test" }],
        })
        .build();

      const response = await handleRequest(request);
      const data = await response.json();

      assertEquals(response.status, 200);
      assertExists(data.choices);
      assertExists(data.usage);
    });

    await t.step("handles streaming requests", async () => {
      const request = createTestRequest()
        .withAuth(TestConfig.env.required.OPENAI_API_KEY)
        .withJsonBody({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: "test" }],
          stream: true,
        })
        .build();

      const response = await handleRequest(request);
      assertEquals(response.status, 200);
      assertEquals(response.headers.get("content-type"), "text/event-stream");

      const reader = response.body?.getReader();
      assertExists(reader);

      let receivedData = false;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) receivedData = true;
      }

      assertEquals(receivedData, true);
    });
  });

  cleanupTestEnv();
});