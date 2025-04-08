import { assertEquals, assertExists, assert } from "https://deno.land/std@0.140.0/testing/asserts.ts";
import { handleRequest } from "./index.ts";
import { TestConfig } from "./test.config.ts";
import { Fixtures } from "./test_fixtures.ts";
import {
  setupTestEnv,
  cleanupTestEnv,
  createTestRequest,
} from "./test_utils.ts";

interface LoadTestMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  p95Latency: number;
  p99Latency: number;
  minLatency: number;
  maxLatency: number;
  requestsPerSecond: number;
  errors: Record<string, number>;
}

async function runLoadTest(
  duration: number,
  rps: number,
  concurrent: number,
): Promise<LoadTestMetrics> {
  const startTime = Date.now();
  const metrics: LoadTestMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageLatency: 0,
    p95Latency: 0,
    p99Latency: 0,
    minLatency: Infinity,
    maxLatency: 0,
    requestsPerSecond: 0,
    errors: {},
  };

  const latencies: number[] = [];
  const interval = 1000 / rps;
  const endTime = startTime + (duration * 1000);

  while (Date.now() < endTime) {
    const batchStart = Date.now();
    const requests = Array(concurrent).fill(null).map(async () => {
      const request = createTestRequest()
        .withAuth(TestConfig.env.required.OPENAI_API_KEY)
        .withJsonBody(Fixtures.requests.chat.valid)
        .build();

      const requestStart = Date.now();
      try {
        const response = await handleRequest(request);
        const latency = Date.now() - requestStart;
        latencies.push(latency);

        metrics.totalRequests++;
        if (response.status === 200) {
          metrics.successfulRequests++;
        } else {
          metrics.failedRequests++;
          const error = await response.json();
          metrics.errors[error.error.type] = (metrics.errors[error.error.type] || 0) + 1;
        }

        metrics.minLatency = Math.min(metrics.minLatency, latency);
        metrics.maxLatency = Math.max(metrics.maxLatency, latency);
      } catch (error) {
        metrics.failedRequests++;
        metrics.errors.unexpected = (metrics.errors.unexpected || 0) + 1;
      }
    });

    await Promise.all(requests);

    const batchDuration = Date.now() - batchStart;
    if (batchDuration < interval) {
      await new Promise(resolve => setTimeout(resolve, interval - batchDuration));
    }
  }

  // Calculate final metrics
  const totalDuration = (Date.now() - startTime) / 1000;
  metrics.requestsPerSecond = metrics.totalRequests / totalDuration;

  if (latencies.length > 0) {
    latencies.sort((a, b) => a - b);
    metrics.averageLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    metrics.p95Latency = latencies[Math.floor(latencies.length * 0.95)];
    metrics.p99Latency = latencies[Math.floor(latencies.length * 0.99)];
  }

  return metrics;
}

Deno.test("Load Tests", async (t) => {
  setupTestEnv();

  await t.step("handles sustained load", async () => {
    const metrics = await runLoadTest(
      30, // 30 seconds duration
      10, // 10 requests per second
      5,  // 5 concurrent requests
    );

    // Verify throughput
    assert(
      metrics.requestsPerSecond >= 8,
      `Throughput ${metrics.requestsPerSecond} RPS below target 8 RPS`
    );

    // Verify success rate
    const successRate = (metrics.successfulRequests / metrics.totalRequests) * 100;
    assert(
      successRate >= 95,
      `Success rate ${successRate}% below target 95%`
    );

    // Verify latency
    assert(
      metrics.p95Latency <= TestConfig.performance.maxLatencyMs,
      `P95 latency ${metrics.p95Latency}ms exceeds threshold ${TestConfig.performance.maxLatencyMs}ms`
    );
  });

  await t.step("handles burst traffic", async () => {
    const metrics = await runLoadTest(
      5,   // 5 seconds duration
      50,  // 50 requests per second
      10,  // 10 concurrent requests
    );

    // Verify error handling under load
    assert(
      metrics.failedRequests / metrics.totalRequests <= 0.1,
      `Error rate ${(metrics.failedRequests / metrics.totalRequests) * 100}% exceeds threshold 10%`
    );
  });

  await t.step("maintains performance under extended load", async () => {
    const metrics1 = await runLoadTest(10, 10, 5);
    const metrics2 = await runLoadTest(10, 10, 5);

    // Verify consistent performance
    const latencyIncrease = (metrics2.averageLatency - metrics1.averageLatency) / metrics1.averageLatency;
    assert(
      latencyIncrease <= 0.2,
      `Performance degraded by ${latencyIncrease * 100}% exceeding threshold 20%`
    );
  });

  cleanupTestEnv();
});