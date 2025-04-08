import { assertEquals, assertExists, assert } from "https://deno.land/std@0.140.0/testing/asserts.ts";
import { handleRequest } from "./index.ts";
import { TestConfig } from "./test.config.ts";
import {
  setupTestEnv,
  cleanupTestEnv,
  createTestRequest,
} from "./test_utils.ts";
interface BenchmarkResult {
  mean: number;
  median: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
  total: number;
  count: number;
}

function calculateStats(durations: number[]): BenchmarkResult {
  durations.sort((a, b) => a - b);
  const count = durations.length;
  const total = durations.reduce((sum, d) => sum + d, 0);
  const mean = total / count;
  const median = count % 2 === 0
    ? (durations[count / 2 - 1] + durations[count / 2]) / 2
    : durations[Math.floor(count / 2)];
  const p95 = durations[Math.floor(count * 0.95)];
  const p99 = durations[Math.floor(count * 0.99)];
  const min = durations[0];
  const max = durations[count - 1];

  return { mean, median, p95, p99, min, max, total, count };
}

Deno.test("Performance Benchmarks", async (t) => {
  setupTestEnv({
    OPENAI_API_KEY: "test_openai_key",
    STRIPE_SECRET_KEY: "test_stripe_key",
    STRIPE_WEBHOOK_SECRET: "test_webhook_secret",
    STRIPE_PRICE_ID: "test_price_id",
    RATE_LIMIT_MAX: "200",
    RATE_LIMIT_WINDOW: "60000",
    PROVIDER_TIMEOUT: "30000"
  });

  await t.step("Latency Tests", async (t) => {
    await t.step("measures completion request latency", async () => {
      const durations: number[] = [];
      const iterations = 10;
  
      for (let i = 0; i < iterations; i++) {
        const request = createTestRequest()
          .withAuth(TestConfig.env.required.OPENAI_API_KEY)
          .withJsonBody({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: "test" }],
          })
          .build();

        const start = Date.now();
        const response = await handleRequest(request);
        assertEquals(response.status, 200);
        durations.push(Date.now() - start);
      }

      const stats = calculateStats(durations);
      assert(stats.p95 <= TestConfig.performance.maxLatencyMs,
        `P95 latency ${stats.p95}ms exceeds threshold ${TestConfig.performance.maxLatencyMs}ms`);
    });

    await t.step("measures streaming request latency", async () => {
      const durations: number[] = [];
      const iterations = 5;

      for (let i = 0; i < iterations; i++) {
        const request = createTestRequest()
          .withAuth(TestConfig.env.required.OPENAI_API_KEY)
          .withJsonBody({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: "test" }],
            stream: true,
          })
          .build();

        const start = Date.now();
        const response = await handleRequest(request);
        const reader = response.body?.getReader();
        assertExists(reader);

        while (true) {
          const { done } = await reader.read();
          if (done) break;
        }

        durations.push(Date.now() - start);
      }

      const stats = calculateStats(durations);
      assert(stats.p95 <= TestConfig.performance.maxStreamDurationMs,
        `P95 stream duration ${stats.p95}ms exceeds threshold ${TestConfig.performance.maxStreamDurationMs}ms`);
    });
  });

  await t.step("Concurrency Tests", async (t) => {
    await t.step("handles concurrent requests", async () => {
      const concurrency = TestConfig.performance.concurrentRequests;
      const durations: number[] = [];

      const requests = Array(concurrency)
        .fill(null)
        .map(() => createTestRequest()
          .withAuth(TestConfig.env.required.OPENAI_API_KEY)
          .withJsonBody({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: "test" }],
          })
          .build()
        );

      const start = Date.now();
      const responses = await Promise.all(requests.map(r => handleRequest(r)));
      const totalDuration = Date.now() - start;

      responses.forEach(response => {
        assertEquals(response.status, 200);
      });

      assert(totalDuration <= TestConfig.performance.maxLatencyMs * concurrency,
        `Concurrent requests took ${totalDuration}ms, exceeding threshold ${TestConfig.performance.maxLatencyMs * concurrency}ms`);
    });

    await t.step("maintains performance under load", async () => {
      const batches = 3;
      const batchSize = 5;
      const results: BenchmarkResult[] = [];

      for (let batch = 0; batch < batches; batch++) {
        const durations: number[] = [];
        
        const requests = Array(batchSize)
          .fill(null)
          .map(() => createTestRequest()
            .withAuth(TestConfig.env.required.OPENAI_API_KEY)
            .withJsonBody({
              model: "gpt-3.5-turbo",
              messages: [{ role: "user", content: "test" }],
            })
            .build()
          );

        const start = Date.now();
        await Promise.all(requests.map(r => handleRequest(r)));
        durations.push(Date.now() - start);

        results.push(calculateStats(durations));
      }

      // Verify performance doesn't degrade
      const [first, ...rest] = results;
      rest.forEach((result, index) => {
        assert(result.p95 <= first.p95 * 1.5,
          `Performance degraded in batch ${index + 2}: P95 ${result.p95}ms vs initial ${first.p95}ms`);
      });
    });
  });

  await t.step("Memory Usage", async (t) => {
    await t.step("monitors memory consumption", async () => {
      const iterations = 50;
      const initialMemory = Deno.memoryUsage().heapUsed;
      
      for (let i = 0; i < iterations; i++) {
        const request = createTestRequest()
          .withAuth(TestConfig.env.required.OPENAI_API_KEY)
          .withJsonBody({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: "test" }],
          })
          .build();

        await handleRequest(request);
      }

      const finalMemory = Deno.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      assert(memoryIncrease <= 50 * 1024 * 1024, // 50MB limit
        `Memory usage increased by ${memoryIncrease / 1024 / 1024}MB`);
    });
  });

  cleanupTestEnv();
});