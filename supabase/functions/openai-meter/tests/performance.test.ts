import { assertEquals, assertExists } from "https://deno.land/std/testing/asserts.ts";
import { Fixtures } from "./test_fixtures.ts";
import { createTestContext, type TestContext } from "./test_context.ts";
import { runBenchmark, type BenchmarkResult } from "./benchmark.ts";

/**
 * Performance thresholds
 */
const THRESHOLDS = {
  maxLatencyP95: 1000, // 1 second
  minRps: 10, // 10 requests per second
  maxErrorRate: 0.01, // 1%
  maxMemoryGrowth: 100 * 1024 * 1024, // 100MB
} as const;

/**
 * Performance tests for OpenAI proxy
 */
Deno.test("OpenAI proxy performance tests", async (t) => {
  const ctx: TestContext = createTestContext();

  // Mock environment variables
  const cleanup = ctx.mockEnv(Fixtures.env.valid);

  await t.step("chat completion performance", async () => {
    // Mock responses
    ctx.mockFetch([
      new Response(JSON.stringify(Fixtures.responses.success.chat), { status: 200 }),
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    ]);

    const result = await runBenchmark({
      name: "Chat Completion",
      fn: async () => {
        const response = await fetch("http://localhost:8000/v1/chat/completions", {
          method: "POST",
          headers: Fixtures.headers.valid,
          body: JSON.stringify(Fixtures.requests.chat.valid),
        });

        assertEquals(response.status, 200);
        await response.json();
      },
      config: {
        iterations: 100,
        concurrency: 10,
        warmup: true,
        timeout: 30000,
      }
    });

    validateBenchmarkResult(result);
  });

  await t.step("streaming performance", async () => {
    // Mock responses
    ctx.mockFetch([
      new Response(
        Fixtures.responses.streaming.chunks
          .map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`)
          .join("") + "data: [DONE]\n\n",
        {
          status: 200,
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
          },
        }
      ),
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    ]);

    const result = await runBenchmark({
      name: "Streaming",
      fn: async () => {
        const response = await fetch("http://localhost:8000/v1/chat/completions", {
          method: "POST",
          headers: {
            ...Fixtures.headers.valid,
            "Accept": "text/event-stream",
          },
          body: JSON.stringify({
            ...Fixtures.requests.chat.valid,
            stream: true,
          }),
        });

        assertEquals(response.status, 200);
        await collectStreamingResponse(response);
      },
      config: {
        iterations: 50,
        concurrency: 5,
        warmup: true,
        timeout: 60000,
      }
    });

    validateBenchmarkResult(result);
  });

  await t.step("provider fallback performance", async () => {
    // Mock responses
    ctx.mockFetch([
      new Response(JSON.stringify(Fixtures.responses.error.rateLimit), { status: 429 }),
      new Response(JSON.stringify(Fixtures.responses.success.chat), { status: 200 }),
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    ]);

    const result = await runBenchmark({
      name: "Provider Fallback",
      fn: async () => {
        const response = await fetch("http://localhost:8000/v1/chat/completions", {
          method: "POST",
          headers: Fixtures.headers.valid,
          body: JSON.stringify(Fixtures.requests.chat.valid),
        });

        assertEquals(response.status, 200);
        await response.json();
      },
      config: {
        iterations: 50,
        concurrency: 5,
        warmup: true,
        timeout: 60000,
      }
    });

    validateBenchmarkResult(result);
  });

  // Cleanup
  cleanup();
  await ctx.cleanup();
});

/**
 * Validate benchmark result
 */
function validateBenchmarkResult(result: BenchmarkResult): void {
  // Check latency
  if (result.latency.p95 > THRESHOLDS.maxLatencyP95) {
    throw new Error(
      `[${result.name}] P95 latency (${result.latency.p95.toFixed(2)}ms) exceeds threshold (${THRESHOLDS.maxLatencyP95}ms)`
    );
  }

  // Check RPS
  if (result.rps < THRESHOLDS.minRps) {
    throw new Error(
      `[${result.name}] RPS (${result.rps.toFixed(2)}) below threshold (${THRESHOLDS.minRps})`
    );
  }

  // Check error rate
  const errorRate = result.errorCount / result.requestCount;
  if (errorRate > THRESHOLDS.maxErrorRate) {
    throw new Error(
      `[${result.name}] Error rate (${(errorRate * 100).toFixed(2)}%) exceeds threshold (${(THRESHOLDS.maxErrorRate * 100).toFixed(2)}%)`
    );
  }

  // Check memory growth
  const memoryGrowth = result.memory.peak - result.memory.start;
  if (memoryGrowth > THRESHOLDS.maxMemoryGrowth) {
    throw new Error(
      `[${result.name}] Memory growth (${(memoryGrowth / 1024 / 1024).toFixed(2)}MB) exceeds threshold (${(THRESHOLDS.maxMemoryGrowth / 1024 / 1024).toFixed(2)}MB)`
    );
  }
}

/**
 * Helper to collect streaming response
 */
async function collectStreamingResponse(response: Response): Promise<unknown[]> {
  const reader = response.body?.getReader();
  assertExists(reader);

  const messages: unknown[] = [];
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split("\n");

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(5);
        if (data === "[DONE]") continue;
        messages.push(JSON.parse(data));
      }
    }
  }

  return messages;
}