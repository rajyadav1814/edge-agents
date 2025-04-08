import { assertEquals, assertExists, assert } from "https://deno.land/std@0.140.0/testing/asserts.ts";
import { handleRequest } from "./index.ts";
import { TestConfig } from "./test.config.ts";
import {
  setupTestEnv,
  cleanupTestEnv,
  createTestRequest,
} from "./test_utils.ts";

Deno.test("CORS and Authentication Tests", async (t) => {
  setupTestEnv();

  await t.step("CORS Handling", async (t) => {
    await t.step("handles preflight requests", async () => {
      const request = createTestRequest()
        .withMethod("OPTIONS")
        .withHeaders(new Headers({
          "Origin": "https://example.com",
          "Access-Control-Request-Method": "POST",
          "Access-Control-Request-Headers": "Content-Type, Authorization",
        }))
        .build();

      const response = await handleRequest(request);

      assertEquals(response.status, 204);
      assertEquals(response.headers.get("access-control-allow-origin"), "*");
      assertEquals(response.headers.get("access-control-allow-methods"), "GET, POST, OPTIONS");
      assertEquals(response.headers.get("access-control-allow-headers"), "Content-Type, Authorization");
      assertEquals(response.headers.get("access-control-max-age"), "86400");
    });

    await t.step("includes CORS headers in responses", async () => {
      const request = createTestRequest()
        .withAuth(TestConfig.env.required.OPENAI_API_KEY)
        .withHeaders(new Headers({
          "Origin": "https://example.com",
        }))
        .withJsonBody({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: "test" }],
        })
        .build();

      const response = await handleRequest(request);

      assertEquals(response.headers.get("access-control-allow-origin"), "*");
      assertEquals(response.headers.get("access-control-expose-headers"),
        "x-ratelimit-limit, x-ratelimit-remaining, x-ratelimit-reset, x-usage-tokens");
    });

    await t.step("handles multiple origins", async () => {
      const origins = [
        "https://example.com",
        "https://app.example.com",
        "http://localhost:3000",
      ];

      for (const origin of origins) {
        const request = createTestRequest()
          .withAuth(TestConfig.env.required.OPENAI_API_KEY)
          .withHeaders(new Headers({
            "Origin": origin,
          }))
          .withJsonBody({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: "test" }],
          })
          .build();

        const response = await handleRequest(request);
        assertEquals(response.headers.get("access-control-allow-origin"), "*");
      }
    });
  });

  await t.step("Authentication", async (t) => {
    await t.step("requires authentication header", async () => {
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
        .withAuth("invalid-format")
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

    await t.step("validates API key with provider", async () => {
      const request = createTestRequest()
        .withAuth("invalid_subscription")
        .withJsonBody({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: "test" }],
        })
        .build();

      const response = await handleRequest(request);
      const data = await response.json();

      assertEquals(response.status, 401);
      assertEquals(data.error.type, "authentication_error");
      assertEquals(data.error.message, "Invalid subscription");
    });

    await t.step("accepts valid authentication", async () => {
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
  });

  await t.step("Security Headers", async (t) => {
    await t.step("includes security headers", async () => {
      const request = createTestRequest()
        .withAuth(TestConfig.env.required.OPENAI_API_KEY)
        .withJsonBody({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: "test" }],
        })
        .build();

      const response = await handleRequest(request);

      assertExists(response.headers.get("x-content-type-options"));
      assertExists(response.headers.get("x-frame-options"));
      assertExists(response.headers.get("x-xss-protection"));
      assertExists(response.headers.get("strict-transport-security"));
    });

    await t.step("sets appropriate content security policy", async () => {
      const request = createTestRequest()
        .withAuth(TestConfig.env.required.OPENAI_API_KEY)
        .withJsonBody({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: "test" }],
        })
        .build();

      const response = await handleRequest(request);
      const csp = response.headers.get("content-security-policy");

      assertExists(csp);
      assert(csp.includes("default-src 'none'"), "CSP should include default-src 'none'");
      assert(csp.includes("frame-ancestors 'none'"), "CSP should include frame-ancestors 'none'");
    });
  });

  cleanupTestEnv();
});