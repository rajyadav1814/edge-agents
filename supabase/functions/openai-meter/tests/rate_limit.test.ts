import { assertEquals, assertExists, assert } from "https://deno.land/std@0.140.0/testing/asserts.ts";
import { handleRequest } from "./index.ts";
import { TestConfig } from "./test.config.ts";
import {
  setupTestEnv,
  cleanupTestEnv,
  createTestRequest,
} from "./test_utils.ts";

Deno.test("Rate Limiting Tests", async (t) => {
  setupTestEnv();

  await t.step("Basic Rate Limiting", async (t) => {
    await t.step("allows requests within limit", async () => {
      const requests = Array(TestConfig.performance.maxRequestsPerMinute)
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
      responses.forEach(response => {
        assertEquals(response.status, 200);
      });
    });

    await t.step("blocks requests over limit", async () => {
      const request = createTestRequest()
        .withAuth(TestConfig.env.required.OPENAI_API_KEY)
        .withJsonBody({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: "test" }],
        })
        .build();

      const response = await handleRequest(request);
      const data = await response.json();

      assertEquals(response.status, 429);
      assertEquals(data.error.type, "rate_limit_error");
      assertExists(data.error.message);
    });
  });

  await t.step("Rate Limit Headers", async (t) => {
    await t.step("includes rate limit headers", async () => {
      const request = createTestRequest()
        .withAuth(TestConfig.env.required.OPENAI_API_KEY)
        .withJsonBody({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: "test" }],
        })
        .build();

      const response = await handleRequest(request);
      
      assertExists(response.headers.get("x-ratelimit-limit"));
      assertExists(response.headers.get("x-ratelimit-remaining"));
      assertExists(response.headers.get("x-ratelimit-reset"));
    });

    await t.step("updates remaining requests correctly", async () => {
      const request = createTestRequest()
        .withAuth(TestConfig.env.required.OPENAI_API_KEY)
        .withJsonBody({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: "test" }],
        })
        .build();

      const response1 = await handleRequest(request);
      const response2 = await handleRequest(request);

      const remaining1 = parseInt(response1.headers.get("x-ratelimit-remaining") || "0");
      const remaining2 = parseInt(response2.headers.get("x-ratelimit-remaining") || "0");

      assert(remaining1 > remaining2, "Rate limit remaining should decrease");
    });
  });

  await t.step("Rate Limit Reset", async (t) => {
    await t.step("resets after window expires", async () => {
      // Fill up rate limit
      const requests = Array(TestConfig.performance.maxRequestsPerMinute)
        .fill(null)
        .map(() => createTestRequest()
          .withAuth(TestConfig.env.required.OPENAI_API_KEY)
          .withJsonBody({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: "test" }],
          })
          .build()
        );

      await Promise.all(requests.map(r => handleRequest(r)));

      // Wait for window to reset
      await new Promise(resolve => 
        setTimeout(resolve, TestConfig.mockProviders.stripe.rateLimitWindow + 100)
      );

      // Should be able to make request again
      const request = createTestRequest()
        .withAuth(TestConfig.env.required.OPENAI_API_KEY)
        .withJsonBody({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: "test" }],
        })
        .build();

      const response = await handleRequest(request);
      assertEquals(response.status, 200);
    });

    await t.step("provides accurate reset time", async () => {
      const request = createTestRequest()
        .withAuth(TestConfig.env.required.OPENAI_API_KEY)
        .withJsonBody({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: "test" }],
        })
        .build();

      const response = await handleRequest(request);
      const resetTime = parseInt(response.headers.get("x-ratelimit-reset") || "0");
      const now = Math.floor(Date.now() / 1000);

      assert(resetTime > now, "Reset time should be in the future");
      assert(resetTime <= now + (TestConfig.mockProviders.stripe.rateLimitWindow / 1000),
        "Reset time should be within rate limit window");
    });
  });

  await t.step("Per-User Rate Limiting", async (t) => {
    await t.step("tracks limits separately per user", async () => {
      const user1Key = "user1_key";
      const user2Key = "user2_key";

      // Fill up rate limit for user1
      const user1Requests = Array(TestConfig.performance.maxRequestsPerMinute)
        .fill(null)
        .map(() => createTestRequest()
          .withAuth(user1Key)
          .withJsonBody({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: "test" }],
          })
          .build()
        );

      await Promise.all(user1Requests.map(r => handleRequest(r)));

      // User2 should still be able to make requests
      const user2Request = createTestRequest()
        .withAuth(user2Key)
        .withJsonBody({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: "test" }],
        })
        .build();

      const response = await handleRequest(user2Request);
      assertEquals(response.status, 200);
    });
  });

  cleanupTestEnv();
});