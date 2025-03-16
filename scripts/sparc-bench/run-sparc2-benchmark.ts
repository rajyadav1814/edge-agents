/**
 * SPARC2 Benchmark Runner
 * 
 * This script runs benchmarks against the SPARC2 system and generates a report.
 */

import { 
  sparc2HumanEvalBenchmark, 
  sparc2SWEBenchmark, 
  sparc2RedCodeBenchmark 
} from "./samples/sparc2-benchmark.ts";
import { BenchmarkResult } from "./src/benchmarks/types.ts";
import { load } from "https://deno.land/std@0.215.0/dotenv/mod.ts";
import { createOptimizedBenchmarkManager } from "./src/benchmarks/optimized-benchmark-manager.ts";

// Load environment variables
await load({ export: true, envPath: "../sparc2/.env" });

// Create optimized benchmark manager with custom options
const benchmarkManager = createOptimizedBenchmarkManager({
  maxConcurrent: 2, // Limit to 2 concurrent benchmarks for better resource management
  useCache: true,
  defaultTimeout: 60000, // 1 minute timeout
  autoSave: true,
  resultsDir: "./results"
});

console.log("Running SPARC2 benchmarks with optimized benchmark manager...");

// Run all benchmarks in parallel with controlled concurrency
const results = await benchmarkManager.runBenchmarks([
  sparc2HumanEvalBenchmark,
  sparc2SWEBenchmark,
  sparc2RedCodeBenchmark
], {
  verbose: true,
  outputFile: "./results/benchmark-results.json"
});

// Generate summary report
console.log("\n=== Generating Summary Report ===");
const summaryReport = benchmarkManager.generateSummaryReport(results);

// Save the summary report
try {
  await Deno.writeTextFile("./results/benchmark-summary.md", summaryReport);
} catch (error) {
  console.error(`Error saving summary report: ${error}`);
}

// Save all results to a single file
try {
  await benchmarkManager.saveResults(results, "./results/all-benchmark-results.json");
  console.log("All benchmark results saved to ./results/all-benchmark-results.json");
} catch (error) {
  console.error(`Error saving all results: ${error}`);
}

// Calculate average metrics
const avgAccuracy = results.reduce((sum, r) => sum + r.metrics.accuracy, 0) / results.length;
const avgEfficiency = results.reduce((sum, r) => sum + r.metrics.efficiency, 0) / results.length;
const avgSafety = results.reduce((sum, r) => sum + r.metrics.safety, 0) / results.length;
const avgAdaptability = results.reduce((sum, r) => sum + r.metrics.adaptability, 0) / results.length;

console.log("\n=== Benchmark Results ===");
console.log(`Total benchmarks: ${results.length}`);
console.log(`Total tests: ${results.reduce((sum, r) => sum + r.totalTests, 0)}`);
console.log(`Passed tests: ${results.reduce((sum, r) => sum + r.passedTests, 0)}`);
console.log(`Failed tests: ${results.reduce((sum, r) => sum + r.failedTests, 0)}`);
console.log(`Skipped tests: ${results.reduce((sum, r) => sum + r.skippedTests, 0)}`);

console.log("\n=== Average Metrics ===");
console.log(`Accuracy: ${(avgAccuracy * 100).toFixed(2)}%`);
console.log(`Efficiency: ${(avgEfficiency * 100).toFixed(2)}%`);
console.log(`Safety: ${(avgSafety * 100).toFixed(2)}%`);
console.log(`Adaptability: ${(avgAdaptability * 100).toFixed(2)}%`);

console.log("\nBenchmark summary report saved to ./results/benchmark-summary.md");
console.log("All results saved to ./results/benchmark-results.json");