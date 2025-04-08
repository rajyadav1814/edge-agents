import { assertEquals, assertExists, assertRejects } from "https://deno.land/std@0.140.0/testing/asserts.ts";
import { createTestContext, type TestContext } from "./test_context.ts";

Deno.test("Test Context", async (t) => {
  let context: TestContext;

  // Setup fresh context before each test
  t.beforeEach(() => {
    context = createTestContext();
  });

  // Cleanup after each test
  t.afterEach(async () => {
    await context.cleanup();
  });

  await t.step("mockFetch", async (t) => {
    await t.step("mocks successful responses", async () => {
      const mockResponse = new Response("test", { status: 200 });
      context.mockFetch([mockResponse]);

      const response = await fetch("https://test.com");
      assertEquals(response.status, 200);
      assertEquals(await response.text(), "test");
    });

    await t.step("mocks error responses", async () => {
      const error = new Error("Network error");
      context.mockFetch([error]);

      await assertRejects(
        () => fetch("https://test.com"),
        Error,
        "Network error"
      );
    });

    await t.step("tracks fetch calls", async () => {
      const mockResponse = new Response("test");
      context.mockFetch([mockResponse]);

      await fetch("https://test1.com");
      await fetch("https://test2.com");

      const calls = context.getMockFetchCalls();
      assertEquals(calls.length, 2);
      assertEquals(calls[0].url, "https://test1.com");
      assertEquals(calls[1].url, "https://test2.com");
    });

    await t.step("cycles through multiple responses", async () => {
      const responses = [
        new Response("first", { status: 200 }),
        new Response("second", { status: 201 }),
      ];
      context.mockFetch(responses);

      const response1 = await fetch("https://test.com");
      const response2 = await fetch("https://test.com");
      const response3 = await fetch("https://test.com");

      assertEquals(await response1.text(), "first");
      assertEquals(response1.status, 200);
      assertEquals(await response2.text(), "second");
      assertEquals(response2.status, 201);
      assertEquals(await response3.text(), "first");
      assertEquals(response3.status, 200);
    });
  });

  await t.step("mockEnv", async (t) => {
    await t.step("sets environment variables", () => {
      context.mockEnv({
        TEST_VAR: "test_value",
        ANOTHER_VAR: "another_value",
      });

      assertEquals(Deno.env.get("TEST_VAR"), "test_value");
      assertEquals(Deno.env.get("ANOTHER_VAR"), "another_value");
    });

    await t.step("restores original environment on cleanup", async () => {
      const originalValue = "original_value";
      Deno.env.set("EXISTING_VAR", originalValue);

      const cleanup = context.mockEnv({
        EXISTING_VAR: "new_value",
        NEW_VAR: "test_value",
      });

      assertEquals(Deno.env.get("EXISTING_VAR"), "new_value");
      assertEquals(Deno.env.get("NEW_VAR"), "test_value");

      cleanup();

      assertEquals(Deno.env.get("EXISTING_VAR"), originalValue);
      assertEquals(Deno.env.get("NEW_VAR"), null);
    });
  });

  await t.step("mockTimers", async (t) => {
    await t.step("mocks setTimeout", async () => {
      context.mockTimers();
      let called = false;

      setTimeout(() => {
        called = true;
      }, 1000);

      await new Promise(resolve => setTimeout(resolve, 1100));
      assertEquals(called, true);
    });

    await t.step("mocks setInterval", async () => {
      context.mockTimers();
      let count = 0;

      const intervalId = setInterval(() => {
        count++;
      }, 100);

      await new Promise(resolve => setTimeout(resolve, 350));
      clearInterval(intervalId);

      assertEquals(count, 3);
    });

    await t.step("cleans up timers", () => {
      const cleanup = context.mockTimers();
      const timeouts: number[] = [];

      for (let i = 0; i < 5; i++) {
        timeouts.push(setTimeout(() => {}, 1000));
      }

      cleanup();

      // Verify timers are cleaned up
      timeouts.forEach(id => {
        clearTimeout(id); // Should have no effect after cleanup
      });
    });
  });

  await t.step("waitFor", async (t) => {
    await t.step("resolves when condition is met", async () => {
      let value = false;
      setTimeout(() => {
        value = true;
      }, 100);

      await context.waitFor(() => value);
      assertEquals(value, true);
    });

    await t.step("times out when condition is not met", async () => {
      await assertRejects(
        () => context.waitFor(() => false, 100),
        Error,
        "Timeout waiting for condition after 100ms"
      );
    });

    await t.step("respects custom interval", async () => {
      let checks = 0;
      const startTime = Date.now();

      try {
        await context.waitFor(
          () => {
            checks++;
            return false;
          },
          100, // timeout
          50   // interval
        );
      } catch {
        // Expected timeout
      }

      const duration = Date.now() - startTime;
      assertEquals(checks, 2); // Should check twice with 50ms interval in 100ms timeout
      assert(duration >= 100 && duration < 150);
    });
  });
});

function assert(condition: boolean, message?: string): asserts condition {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}