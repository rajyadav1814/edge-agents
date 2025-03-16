/**
 * Optimized Benchmark Manager
 * 
 * This module provides an optimized version of the benchmark manager with improved
 * parallel execution, caching, and resource management.
 */

import { BenchmarkConfig, BenchmarkResult, BenchmarkOptions, BenchmarkType } from "./types.ts";
import { runHumanEval } from "./humaneval-runner.ts";
import { runSWEBench } from "./swebench-runner.ts";
import { runRedCode } from "./redcode-runner.ts";

/**
 * Extended benchmark options with additional properties
 */
interface ExtendedBenchmarkOptions extends BenchmarkOptions {
  /** Force run even if cached result exists */
  forceRun?: boolean;
  /** Timeout in milliseconds */
  timeout?: number;
}

/**
 * Cache for benchmark results to avoid redundant executions
 */
interface ResultCache {
  [key: string]: BenchmarkResult;
}

/**
 * Options for creating a benchmark manager
 */
export interface BenchmarkManagerOptions {
  /** Maximum number of concurrent benchmarks to run */
  maxConcurrent?: number;
  /** Whether to use caching for benchmark results */
  useCache?: boolean;
  /** Default timeout for benchmark execution in milliseconds */
  defaultTimeout?: number;
  /** Whether to automatically save results to disk */
  autoSave?: boolean;
  /** Directory to save results to */
  resultsDir?: string;
}

/**
 * Creates an optimized benchmark manager
 */
export function createOptimizedBenchmarkManager(options: BenchmarkManagerOptions = {}) {
  const {
    maxConcurrent = 3,
    useCache = true,
    defaultTimeout = 60000,
    autoSave = true,
    resultsDir = "./results"
  } = options;

  // Cache for benchmark results
  const resultCache: ResultCache = {};

  // Currently running benchmarks
  let runningCount = 0;
  const queue: Array<() => Promise<void>> = [];

  /**
   * Run a benchmark with the specified configuration
   */
  async function runBenchmark(
    config: BenchmarkConfig,
    options: ExtendedBenchmarkOptions = {}
  ): Promise<BenchmarkResult> {
    const cacheKey = `${config.type}-${config.name}`;
    
    // Check cache if enabled
    if (useCache && resultCache[cacheKey] && !options.forceRun) {
      console.log(`Using cached result for ${config.name}`);
      return resultCache[cacheKey];
    }

    // Queue the benchmark if we're at max concurrency
    if (runningCount >= maxConcurrent) {
      return new Promise((resolve) => {
        queue.push(async () => {
          const result = await executeBenchmark(config, options);
          resolve(result);
        });
      });
    }

    return executeBenchmark(config, options);
  }

  /**
   * Execute a benchmark and manage concurrency
   */
  async function executeBenchmark(
    config: BenchmarkConfig,
    options: ExtendedBenchmarkOptions
  ): Promise<BenchmarkResult> {
    runningCount++;
    
    try {
      // Set timeout
      const timeout = options.timeout || defaultTimeout;
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Benchmark ${config.name} timed out after ${timeout}ms`)), timeout);
      });

      // Run the benchmark with the appropriate runner
      const benchmarkPromise = runBenchmarkWithRunner(config, options);
      
      // Race the benchmark against the timeout
      const result = await Promise.race([benchmarkPromise, timeoutPromise]) as BenchmarkResult;
      
      // Cache the result if caching is enabled
      if (useCache) {
        resultCache[`${config.type}-${config.name}`] = result;
      }
      
      // Save the result if auto-save is enabled
      if (autoSave && options.outputFile) {
        // Check if the file exists and append to it instead of overwriting
        try {
          let existingResults: BenchmarkResult[] = [];
          try {
            const content = await Deno.readTextFile(options.outputFile);
            existingResults = JSON.parse(content);
            if (!Array.isArray(existingResults)) {
              existingResults = [existingResults]; // Convert single result to array
            }
          } catch (e) {
            // File doesn't exist or is invalid JSON, start with empty array
            existingResults = [];
          }
          
          // Add the new result
          existingResults.push(result);
          
          // Write back to file
          await Deno.writeTextFile(options.outputFile, JSON.stringify(existingResults, null, 2));
        } catch (error) {
          console.error(`Error saving result to ${options.outputFile}:`, error);
        }
      }
      
      return result;
    } finally {
      runningCount--;
      
      // Process the next item in the queue if any
      if (queue.length > 0) {
        const next = queue.shift();
        if (next) {
          next();
        }
      }
    }
  }

  /**
   * Run a benchmark with the appropriate runner based on its type
   */
  async function runBenchmarkWithRunner(
    config: BenchmarkConfig,
    options: ExtendedBenchmarkOptions
  ): Promise<BenchmarkResult> {
    switch (config.type) {
      case "humaneval":
        return await runHumanEval(config, options);
      case "swebench":
        return await runSWEBench(config, options);
      case "redcode":
        return await runRedCode(config, options);
      default:
        throw new Error(`Unsupported benchmark type: ${config.type}`);
    }
  }

  /**
   * Run multiple benchmarks in parallel with controlled concurrency
   */
  async function runBenchmarks(
    configs: BenchmarkConfig[],
    options: ExtendedBenchmarkOptions = {}
  ): Promise<BenchmarkResult[]> {
    const results: BenchmarkResult[] = [];
    
    // Create a queue of benchmark executions
    const benchmarkPromises = configs.map((config) => 
      () => runBenchmark(config, options).then(result => {
        results.push(result);
        return result;
      })
    );
    
    // Process the queue with controlled concurrency
    const queue = [...benchmarkPromises];
    const running: Promise<BenchmarkResult>[] = [];
    
    while (queue.length > 0 || running.length > 0) {
      // Fill up to max concurrent
      while (running.length < maxConcurrent && queue.length > 0) {
        const next = queue.shift();
        if (next) {
          running.push(next());
        }
      }
      
      // Wait for one to complete
      if (running.length > 0) {
        await Promise.race(running);
        
        // Remove completed promises
        for (let i = running.length - 1; i >= 0; i--) {
          const promise = running[i];
          const isCompleted = await Promise.race([
            promise.then(() => true),
            Promise.resolve(false)
          ]);
          
          if (isCompleted) {
            running.splice(i, 1);
          }
        }
      }
    }
    
    return results;
  }

  /**
   * Generate a summary report from benchmark results
   */
  function generateSummaryReport(results: BenchmarkResult[]): string {
    let report = "# Benchmark Summary Report\n\n";
    
    // Overall summary
    report += "## Overall Summary\n\n";
    report += `- Total Benchmarks: ${results.length}\n`;
    report += `- Total Tests: ${results.reduce((sum, r) => sum + r.totalTests, 0)}\n`;
    report += `- Passed Tests: ${results.reduce((sum, r) => sum + r.passedTests, 0)}\n`;
    report += `- Failed Tests: ${results.reduce((sum, r) => sum + r.failedTests, 0)}\n`;
    report += `- Skipped Tests: ${results.reduce((sum, r) => sum + r.skippedTests, 0)}\n\n`;
    
    // Average metrics
    const avgAccuracy = results.reduce((sum, r) => sum + r.metrics.accuracy, 0) / results.length;
    const avgEfficiency = results.reduce((sum, r) => sum + r.metrics.efficiency, 0) / results.length;
    const avgSafety = results.reduce((sum, r) => sum + r.metrics.safety, 0) / results.length;
    const avgAdaptability = results.reduce((sum, r) => sum + r.metrics.adaptability, 0) / results.length;
    
    report += "## Average Metrics\n\n";
    report += `- Accuracy: ${(avgAccuracy * 100).toFixed(2)}%\n`;
    report += `- Efficiency: ${(avgEfficiency * 100).toFixed(2)}%\n`;
    report += `- Safety: ${(avgSafety * 100).toFixed(2)}%\n`;
    report += `- Adaptability: ${(avgAdaptability * 100).toFixed(2)}%\n\n`;
    
    // Individual benchmark results
    report += "## Individual Benchmark Results\n\n";
    
    for (const result of results) {
      report += `### ${result.benchmarkName} (${result.benchmarkType})\n\n`;
      report += `- Total Tests: ${result.totalTests}\n`;
      report += `- Passed Tests: ${result.passedTests}\n`;
      report += `- Failed Tests: ${result.failedTests}\n`;
      report += `- Skipped Tests: ${result.skippedTests}\n`;
      report += `- Accuracy: ${(result.metrics.accuracy * 100).toFixed(2)}%\n`;
      report += `- Efficiency: ${(result.metrics.efficiency * 100).toFixed(2)}%\n`;
      report += `- Safety: ${(result.metrics.safety * 100).toFixed(2)}%\n`;
      report += `- Adaptability: ${(result.metrics.adaptability * 100).toFixed(2)}%\n\n`;
      
      // Test details
      report += "#### Test Results\n\n";
      report += "| Test ID | Status | Execution Time (ms) |\n";
      report += "|---------|--------|--------------------|\n";
      
      for (const test of result.testResults) {
        const status = test.passed ? "✅ Passed" : "❌ Failed";
        report += `| ${test.testId} | ${status} | ${test.executionTime.toFixed(2)} |\n`;
      }
      
      report += "\n";
    }
    
    return report;
  }

  /**
   * Save benchmark results to a file
   */
  async function saveResults(results: BenchmarkResult[], outputFile: string): Promise<void> {
    try {
      await Deno.writeTextFile(outputFile, JSON.stringify(results, null, 2));
      console.log(`Results saved to ${outputFile}`);
    } catch (error) {
      console.error(`Error saving results to ${outputFile}:`, error);
      throw error;
    }
  }

  /**
   * Clear the result cache
   */
  function clearCache(): void {
    Object.keys(resultCache).forEach(key => {
      delete resultCache[key];
    });
  }

  return {
    runBenchmark,
    runBenchmarks,
    generateSummaryReport,
    saveResults,
    clearCache
  };
}