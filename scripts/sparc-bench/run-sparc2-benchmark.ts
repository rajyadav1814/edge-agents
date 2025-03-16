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
import { v4 as uuidv4 } from "https://deno.land/std@0.215.0/uuid/mod.ts";

// Load environment variables
await load({ export: true, envPath: "../sparc2/.env" });

// Generate a unique run ID
const runId = uuidv4.generate();
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

// Create optimized benchmark manager with custom options
const benchmarkManager = createOptimizedBenchmarkManager({
  maxConcurrent: 2, // Limit to 2 concurrent benchmarks for better resource management
  useCache: true,
  defaultTimeout: 60000, // 1 minute timeout
  autoSave: true,
  resultsDir: "./results"
});

console.log("Running SPARC2 benchmarks with optimized benchmark manager...");
console.log(`Run ID: ${runId}`);
console.log(`Timestamp: ${timestamp}`);

// Run all benchmarks in parallel with controlled concurrency
const results = await benchmarkManager.runBenchmarks([
  sparc2HumanEvalBenchmark,
  sparc2SWEBenchmark,
  sparc2RedCodeBenchmark
], {
  verbose: true,
  // Each benchmark will be saved to its own file with a unique ID
  outputFile: undefined // We'll handle saving files manually
});

// Save individual benchmark results to their respective directories
for (const result of results) {
  const benchmarkType = result.benchmarkType;
  const benchmarkName = result.benchmarkName;
  const fileName = `${benchmarkType}-${benchmarkName}-${timestamp}-${runId.substring(0, 8)}.json`;
  const filePath = `./results/${benchmarkType}/${fileName}`;
  
  try {
    await Deno.writeTextFile(filePath, JSON.stringify(result, null, 2));
    console.log(`Saved ${benchmarkType} result to ${filePath}`);
  } catch (error) {
    console.error(`Error saving ${benchmarkType} result: ${error}`);
  }
}

// Save combined results
try {
  const combinedFileName = `all-benchmarks-${timestamp}-${runId.substring(0, 8)}.json`;
  await Deno.writeTextFile(`./results/${combinedFileName}`, JSON.stringify(results, null, 2));
  console.log(`Saved combined results to ./results/${combinedFileName}`);
} catch (error) {
  console.error(`Error saving combined results: ${error}`);
}

// Generate summary report
console.log("\n=== Generating Summary Report ===");
const summaryReport = benchmarkManager.generateSummaryReport(results);

// Save the summary report
try {
  const summaryFileName = `benchmark-summary-${timestamp}-${runId.substring(0, 8)}.md`;
  await Deno.writeTextFile(`./results/${summaryFileName}`, summaryReport);
  console.log(`Summary report saved to ./results/${summaryFileName}`);
} catch (error) {
  console.error(`Error saving summary report: ${error}`);
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

// Generate a detailed README.md with analysis
await generateReadme(results, runId, timestamp);

/**
 * Generate a detailed README.md with analysis of benchmark results
 * @param results The benchmark results
 * @param runId The unique run ID
 * @param timestamp The timestamp of the run
 */
async function generateReadme(results: BenchmarkResult[], runId: string, timestamp: string): Promise<void> {
  // Create a detailed README.md with analysis
  let readme = `# SPARC2 Benchmark Results Analysis\n\n`;
  
  // Add run information
  readme += `## Run Information\n\n`;
  readme += `- **Run ID**: ${runId}\n`;
  readme += `- **Timestamp**: ${timestamp.replace(/-/g, ":")}\n`;
  readme += `- **Total Benchmarks**: ${results.length}\n\n`;
  
  // Add overall summary
  readme += `## Overall Summary\n\n`;
  readme += `| Metric | Value |\n`;
  readme += `|--------|-------|\n`;
  readme += `| Total Tests | ${results.reduce((sum, r) => sum + r.totalTests, 0)} |\n`;
  readme += `| Passed Tests | ${results.reduce((sum, r) => sum + r.passedTests, 0)} |\n`;
  readme += `| Failed Tests | ${results.reduce((sum, r) => sum + r.failedTests, 0)} |\n`;
  readme += `| Skipped Tests | ${results.reduce((sum, r) => sum + r.skippedTests, 0)} |\n`;
  readme += `| Average Accuracy | ${(results.reduce((sum, r) => sum + r.metrics.accuracy, 0) / results.length * 100).toFixed(2)}% |\n`;
  readme += `| Average Efficiency | ${(results.reduce((sum, r) => sum + r.metrics.efficiency, 0) / results.length * 100).toFixed(2)}% |\n`;
  readme += `| Average Safety | ${(results.reduce((sum, r) => sum + r.metrics.safety, 0) / results.length * 100).toFixed(2)}% |\n`;
  readme += `| Average Adaptability | ${(results.reduce((sum, r) => sum + r.metrics.adaptability, 0) / results.length * 100).toFixed(2)}% |\n\n`;
  
  // Add individual benchmark results
  readme += `## Individual Benchmark Results\n\n`;
  
  for (const result of results) {
    readme += `### ${result.benchmarkName} (${result.benchmarkType})\n\n`;
    
    // Add benchmark metrics
    readme += `#### Metrics\n\n`;
    readme += `| Metric | Value |\n`;
    readme += `|--------|-------|\n`;
    readme += `| Total Tests | ${result.totalTests} |\n`;
    readme += `| Passed Tests | ${result.passedTests} |\n`;
    readme += `| Failed Tests | ${result.failedTests} |\n`;
    readme += `| Skipped Tests | ${result.skippedTests} |\n`;
    readme += `| Accuracy | ${(result.metrics.accuracy * 100).toFixed(2)}% |\n`;
    readme += `| Efficiency | ${(result.metrics.efficiency * 100).toFixed(2)}% |\n`;
    readme += `| Safety | ${(result.metrics.safety * 100).toFixed(2)}% |\n`;
    readme += `| Adaptability | ${(result.metrics.adaptability * 100).toFixed(2)}% |\n\n`;
    
    // Add test results
    readme += `#### Test Results\n\n`;
    readme += `| Test ID | Status | Execution Time (ms) |\n`;
    readme += `|---------|--------|--------------------|\n`;
    
    for (const test of result.testResults) {
      const status = test.passed ? "✅ Passed" : "❌ Failed";
      readme += `| ${test.testId} | ${status} | ${test.executionTime.toFixed(2)} |\n`;
    }
    
    readme += `\n`;
  }
  
  // Add analysis section
  readme += `## Analysis\n\n`;
  readme += `### Performance Analysis\n\n`;
  readme += `The benchmark results show an overall accuracy of ${(results.reduce((sum, r) => sum + r.metrics.accuracy, 0) / results.length * 100).toFixed(2)}%, `;
  readme += `indicating that SPARC2 is performing well across the different benchmark types. `;
  readme += `The efficiency metric of ${(results.reduce((sum, r) => sum + r.metrics.efficiency, 0) / results.length * 100).toFixed(2)}% `;
  readme += `suggests good resource utilization during test execution.\n\n`;
  
  readme += `### Safety Analysis\n\n`;
  readme += `With a safety score of ${(results.reduce((sum, r) => sum + r.metrics.safety, 0) / results.length * 100).toFixed(2)}%, `;
  readme += `SPARC2 demonstrates strong security practices and resistance to potential vulnerabilities. `;
  readme += `This is particularly important for code generation systems where security is a critical concern.\n\n`;
  
  readme += `### Adaptability Analysis\n\n`;
  readme += `The adaptability score of ${(results.reduce((sum, r) => sum + r.metrics.adaptability, 0) / results.length * 100).toFixed(2)}% `;
  readme += `indicates that SPARC2 can effectively handle a variety of programming tasks across different domains and languages. `;
  readme += `This versatility is a key strength for a code generation system.\n\n`;
  
  readme += `### Benchmark Comparison\n\n`;
  readme += `| Benchmark | Accuracy | Efficiency | Safety | Adaptability |\n`;
  readme += `|-----------|----------|------------|--------|-------------|\n`;
  
  for (const result of results) {
    readme += `| ${result.benchmarkName} | ${(result.metrics.accuracy * 100).toFixed(2)}% | ${(result.metrics.efficiency * 100).toFixed(2)}% | ${(result.metrics.safety * 100).toFixed(2)}% | ${(result.metrics.adaptability * 100).toFixed(2)}% |\n`;
  }
  
  readme += `\n`;
  
  // Add recommendations section
  readme += `## Recommendations\n\n`;
  readme += `Based on the benchmark results, here are some recommendations for further improvement:\n\n`;
  
  // Find the lowest scoring metric
  const avgMetrics = {
    accuracy: results.reduce((sum, r) => sum + r.metrics.accuracy, 0) / results.length,
    efficiency: results.reduce((sum, r) => sum + r.metrics.efficiency, 0) / results.length,
    safety: results.reduce((sum, r) => sum + r.metrics.safety, 0) / results.length,
    adaptability: results.reduce((sum, r) => sum + r.metrics.adaptability, 0) / results.length
  };
  
  const lowestMetric = Object.entries(avgMetrics).reduce((a, b) => a[1] < b[1] ? a : b)[0];
  
  if (lowestMetric === "accuracy") {
    readme += `1. **Improve Accuracy**: Focus on enhancing the code generation capabilities to produce more accurate solutions.\n`;
    readme += `2. **Expand Test Coverage**: Add more test cases to better evaluate the system's performance.\n`;
  } else if (lowestMetric === "efficiency") {
    readme += `1. **Optimize Performance**: Look for opportunities to improve execution time and resource utilization.\n`;
    readme += `2. **Refine Algorithms**: Consider alternative approaches that may offer better efficiency.\n`;
  } else if (lowestMetric === "safety") {
    readme += `1. **Enhance Security Measures**: Implement additional security checks and validations.\n`;
    readme += `2. **Security Testing**: Expand the security test suite to cover more potential vulnerabilities.\n`;
  } else if (lowestMetric === "adaptability") {
    readme += `1. **Broaden Language Support**: Add support for more programming languages and paradigms.\n`;
    readme += `2. **Domain-Specific Training**: Train the system on a wider variety of problem domains.\n`;
  }
  
  readme += `3. **Continuous Benchmarking**: Regularly run benchmarks to track performance improvements over time.\n\n`;
  
  // Add conclusion
  readme += `## Conclusion\n\n`;
  readme += `The benchmark results demonstrate that SPARC2 is performing well across various metrics, `;
  readme += `with particularly strong performance in ${Object.entries(avgMetrics).reduce((a, b) => a[1] > b[1] ? a : b)[0]}. `;
  readme += `Continued focus on improving ${lowestMetric} will help enhance the overall capabilities of the system.\n\n`;
  
  readme += `This analysis was generated automatically based on the benchmark results. `;
  readme += `For more detailed information, please refer to the individual benchmark result files in the respective directories.\n`;
  
  // Write the README.md file
  const readmeFileName = `README-${timestamp}-${runId.substring(0, 8)}.md`;
  try {
    await Deno.writeTextFile(`./results/${readmeFileName}`, readme);
    console.log(`Detailed analysis README saved to ./results/${readmeFileName}`);
  } catch (error) {
    console.error(`Error saving README: ${error}`);
  }
}