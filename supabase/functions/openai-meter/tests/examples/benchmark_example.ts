import { runBenchmark, type BenchmarkConfig, type BenchmarkResult } from "../benchmark.ts";

// Define benchmark configuration
const config: BenchmarkConfig = {
  iterations: 10,
  concurrency: 1,
  warmup: false,
  timeout: 5000,
};

// Simple test function
async function testFunction() {
  await new Promise(resolve => setTimeout(resolve, 100));
}

// Run quick test benchmark
const quickTest = await runBenchmark({
  name: "Quick Test",
  fn: testFunction,
  config: {
    iterations: 10,
    concurrency: 1,
    warmup: false,
    timeout: 5000,
  }
});

console.log("Quick Test Result:", {
  name: quickTest.name,
  duration: quickTest.duration,
  rps: quickTest.rps,
  latency: quickTest.latency,
  successCount: quickTest.successCount,
  errorCount: quickTest.errorCount,
});

// Run load test benchmark
const loadTest = await runBenchmark({
  name: "Load Test",
  fn: async () => {
    await new Promise(resolve => setTimeout(resolve, 200));
  },
  config: {
    iterations: 100,
    concurrency: 10,
    warmup: true,
    timeout: 30000,
  }
});

console.log("Load Test Result:", {
  name: loadTest.name,
  rps: loadTest.rps,
  p95: loadTest.latency.p95,
  successRate: `${((loadTest.successCount / loadTest.requestCount) * 100).toFixed(1)}%`,
  memoryGrowth: `${((loadTest.memory.peak - loadTest.memory.start) / 1024 / 1024).toFixed(2)}MB`
});