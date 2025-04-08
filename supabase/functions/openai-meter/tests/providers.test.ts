import { assertEquals, assertExists, assertRejects, assert } from "https://deno.land/std@0.140.0/testing/asserts.ts";
import { TestConfig } from "./test.config.ts";
import {
  setupTestEnv,
  cleanupTestEnv,
  MockAIProvider,
} from "./test_utils.ts";

Deno.test("Provider Implementation Tests", async (t) => {
  setupTestEnv();

  await t.step("OpenAI Provider", async (t) => {
    const provider = new MockAIProvider();

    await t.step("handles completion requests", async () => {
      const response = await provider.createCompletion({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "test" }],
      });

      assertEquals(response.object, "text_completion");
      assertExists(response.choices[0].text);
      assertEquals(response.choices[0].finish_reason, "stop");
      assertEquals(response.usage.total_tokens, 30);
    });

    await t.step("handles chat completion requests", async () => {
      const response = await provider.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "test" }],
      });

      assertEquals(response.object, "chat.completion");
      assertExists(response.choices[0].message);
      assertEquals(response.choices[0].message.role, "assistant");
      assertEquals(response.choices[0].finish_reason, "stop");
      assertEquals(response.usage.total_tokens, 40);
    });

    await t.step("handles streaming requests", async () => {
      const chunks: string[] = [];
      const stream = provider.streamCompletion({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "test" }],
        stream: true,
      });

      for await (const chunk of stream) {
        assertEquals(chunk.object, "text_completion");
        assertExists(chunk.choices[0].delta);
        if (chunk.choices[0].delta.content) {
          chunks.push(chunk.choices[0].delta.content);
        }
      }

      assertEquals(chunks.join(""), "This is a test response");
    });

    await t.step("handles provider errors", async () => {
      const errorProvider = new MockAIProvider(true);

      await assertRejects(
        () => errorProvider.createCompletion({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: "test" }],
        }),
        Error,
        "Provider error"
      );

      await assertRejects(
        () => errorProvider.createChatCompletion({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: "test" }],
        }),
        Error,
        "Provider error"
      );

      const stream = errorProvider.streamCompletion({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "test" }],
        stream: true,
      });

      await assertRejects(
        () => stream.next(),
        Error,
        "Provider error"
      );
    });
  });

  await t.step("Azure Provider", async (t) => {
    // Similar tests for Azure provider
    // To be implemented when Azure provider is added
  });

  await t.step("Anthropic Provider", async (t) => {
    // Similar tests for Anthropic provider
    // To be implemented when Anthropic provider is added
  });

  await t.step("Provider Performance", async (t) => {
    const provider = new MockAIProvider();

    await t.step("completes within latency threshold", async () => {
      const startTime = Date.now();
      await provider.createCompletion({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "test" }],
      });

      const duration = Date.now() - startTime;
      assert(duration <= TestConfig.performance.maxLatencyMs, 
        `Request took ${duration}ms, exceeding threshold of ${TestConfig.performance.maxLatencyMs}ms`);
    });

    await t.step("handles concurrent requests", async () => {
      const requests = Array(TestConfig.performance.concurrentRequests)
        .fill(null)
        .map(() => provider.createCompletion({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: "test" }],
        }));

      const responses = await Promise.all(requests);
      assertEquals(responses.length, TestConfig.performance.concurrentRequests);
      responses.forEach(response => assertExists(response.choices[0].text));
    });

    await t.step("completes streaming within duration threshold", async () => {
      const startTime = Date.now();
      const stream = provider.streamCompletion({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "test" }],
        stream: true,
      });

      for await (const _ of stream) {
        const duration = Date.now() - startTime;
        assert(duration <= TestConfig.performance.maxStreamDurationMs,
          `Stream took ${duration}ms, exceeding threshold of ${TestConfig.performance.maxStreamDurationMs}ms`);
      }
    });
  });

  cleanupTestEnv();
});