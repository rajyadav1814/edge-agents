import { runBenchmark, type BenchmarkConfig, type BenchmarkResult } from "../benchmark.ts";

async function testChatCompletion() {
  const response = await fetch("http://localhost:8000/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer test_key",
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "test" }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  await response.json();
}

// Run quick CI test
const quickTest = await runBenchmark({
  name: "Quick CI Test",
  fn: testChatCompletion,
  config: {
    iterations: 10,
    concurrency: 1,
    warmup: false,
    timeout: 5000,
  }
});

// Run load CI test
const loadTest = await runBenchmark({
  name: "Load CI Test",
  fn: testChatCompletion,
  config: {
    iterations: 50,
    concurrency: 5,
    warmup: true,
    timeout: 30000,
  }
});

// Log results
console.log("\nCI Benchmark Results:");

console.log(`\n${quickTest.name}:`);
console.log(`- RPS: ${quickTest.rps.toFixed(2)}`);
console.log(`- P95 Latency: ${quickTest.latency.p95.toFixed(2)}ms`);
console.log(`- Success Rate: ${((quickTest.successCount / quickTest.requestCount) * 100).toFixed(1)}%`);
console.log(`- Memory Growth: ${((quickTest.memory.peak - quickTest.memory.start) / 1024 / 1024).toFixed(2)}MB`);

console.log(`\n${loadTest.name}:`);
console.log(`- RPS: ${loadTest.rps.toFixed(2)}`);
console.log(`- P95 Latency: ${loadTest.latency.p95.toFixed(2)}ms`);
console.log(`- Success Rate: ${((loadTest.successCount / loadTest.requestCount) * 100).toFixed(1)}%`);
console.log(`- Memory Growth: ${((loadTest.memory.peak - loadTest.memory.start) / 1024 / 1024).toFixed(2)}MB`);

// Print any errors
if (quickTest.errors.length > 0 || loadTest.errors.length > 0) {
  console.log("\nErrors:");
  if (quickTest.errors.length > 0) {
    console.log(`\n${quickTest.name} Errors:`);
    quickTest.errors.forEach((error, i) => console.log(`${i + 1}. ${error}`));
  }
  if (loadTest.errors.length > 0) {
    console.log(`\n${loadTest.name} Errors:`);
    loadTest.errors.forEach((error, i) => console.log(`${i + 1}. ${error}`));
  }
}