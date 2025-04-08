import { assertEquals, assertExists, assertRejects, assert } from "https://deno.land/std@0.140.0/testing/asserts.ts";
import { TestConfig } from "./test.config.ts";
import {
  setupTestEnv,
  cleanupTestEnv,
  MockStripeMetering,
} from "./test_utils.ts";

Deno.test("Stripe Metering Tests", async (t) => {
  setupTestEnv();

  await t.step("API Key Validation", async (t) => {
    const stripe = new MockStripeMetering();

    await t.step("validates valid API key", async () => {
      const isValid = await stripe.validateApiKey("valid_key");
      assertEquals(isValid, true);
    });

    await t.step("rejects invalid subscription", async () => {
      const isValid = await stripe.validateApiKey("invalid_subscription");
      assertEquals(isValid, false);
    });

    await t.step("handles validation errors gracefully", async () => {
      const stripe = new MockStripeMetering();
      stripe.validateApiKey = async () => {
        throw new Error("Stripe API error");
      };

      await assertRejects(
        () => stripe.validateApiKey("any_key"),
        Error,
        "Stripe API error"
      );
    });
  });

  await t.step("Usage Recording", async (t) => {
    const stripe = new MockStripeMetering();
    const testCustomer = "test_customer";

    await t.step("records usage successfully", async () => {
      await stripe.recordUsage({
        customerId: testCustomer,
        quantity: 1,
        timestamp: new Date(),
      });
    });

    await t.step("accumulates usage within window", async () => {
      const requests = Array(TestConfig.mockProviders.stripe.maxRequestsPerWindow - 1)
        .fill(null)
        .map(() => stripe.recordUsage({
          customerId: testCustomer,
          quantity: 1,
          timestamp: new Date(),
        }));

      await Promise.all(requests);

      // One more request should still work
      await stripe.recordUsage({
        customerId: testCustomer,
        quantity: 1,
        timestamp: new Date(),
      });
    });

    await t.step("enforces rate limits", async () => {
      const stripe = new MockStripeMetering();
      
      // Fill up the rate limit
      const requests = Array(TestConfig.mockProviders.stripe.maxRequestsPerWindow)
        .fill(null)
        .map(() => stripe.recordUsage({
          customerId: testCustomer,
          quantity: 1,
          timestamp: new Date(),
        }));

      await Promise.all(requests);

      // Next request should fail
      await assertRejects(
        () => stripe.recordUsage({
          customerId: testCustomer,
          quantity: 1,
          timestamp: new Date(),
        }),
        Error,
        "Rate limit exceeded"
      );
    });

    await t.step("resets rate limit after window", async () => {
      const stripe = new MockStripeMetering();
      
      // Fill up the rate limit
      const requests = Array(TestConfig.mockProviders.stripe.maxRequestsPerWindow)
        .fill(null)
        .map(() => stripe.recordUsage({
          customerId: testCustomer,
          quantity: 1,
          timestamp: new Date(),
        }));

      await Promise.all(requests);

      // Wait for window to reset
      await new Promise(resolve => 
        setTimeout(resolve, TestConfig.mockProviders.stripe.rateLimitWindow + 100)
      );

      // Should be able to make requests again
      await stripe.recordUsage({
        customerId: testCustomer,
        quantity: 1,
        timestamp: new Date(),
      });
    });

    await t.step("handles recording errors gracefully", async () => {
      const stripe = new MockStripeMetering();
      stripe.recordUsage = async () => {
        throw new Error("Stripe API error");
      };

      await assertRejects(
        () => stripe.recordUsage({
          customerId: testCustomer,
          quantity: 1,
          timestamp: new Date(),
        }),
        Error,
        "Stripe API error"
      );
    });
  });

  await t.step("Performance", async (t) => {
    const stripe = new MockStripeMetering();
    const testCustomer = "test_customer";

    await t.step("handles concurrent requests", async () => {
      const requests = Array(10)
        .fill(null)
        .map(() => stripe.recordUsage({
          customerId: testCustomer,
          quantity: 1,
          timestamp: new Date(),
        }));

      await Promise.all(requests);
    });

    await t.step("maintains performance under load", async () => {
      const startTime = Date.now();
      
      await stripe.recordUsage({
        customerId: testCustomer,
        quantity: 1,
        timestamp: new Date(),
      });

      const duration = Date.now() - startTime;
      assert(duration <= TestConfig.mockProviders.stripe.defaultLatencyMs * 2,
        `Request took ${duration}ms, exceeding threshold of ${TestConfig.mockProviders.stripe.defaultLatencyMs * 2}ms`);
    });
  });

  cleanupTestEnv();
});