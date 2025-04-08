/**
 * Benchmark Manager
 * 
 * This module provides a centralized manager for running different types of benchmarks.
 * It handles the selection and execution of benchmark runners based on the benchmark type.
 */

import { BenchmarkConfig, BenchmarkResult, BenchmarkOptions, BenchmarkType } from "./types.ts";
import { runHumanEval } from "./humaneval-runner.ts";
import { runSWEBench } from "./swebench-runner.ts";
import { runRedCode } from "./redcode-runner.ts";

/**
 * Benchmark Manager class
 * 
 * Manages the execution of different benchmark types and provides a unified interface
 * for running benchmarks.
 */
export class BenchmarkManager {
  /**
   * Available benchmark runners
   */
  private runners: Record<BenchmarkType, (config: BenchmarkConfig, options?: BenchmarkOptions) => Promise<BenchmarkResult>> = {
    "humaneval": runHumanEval,
    "swebench": runSWEBench,
    "redcode": runRedCode
  };

  /**
   * Run a benchmark with the appropriate runner
   * @param config Benchmark configuration
   * @param options Benchmark options
   * @returns Promise resolving to the benchmark result
   */
  async runBenchmark(
    config: BenchmarkConfig, 
    options: BenchmarkOptions = {}
  ): Promise<BenchmarkResult> {
    console.log(`Running benchmark: ${config.name} (${config.type})`);
    
    const runner = this.runners[config.type];
    if (!runner) {
      throw new Error(`No runner available for benchmark type: ${config.type}`);
    }
    
    return await runner(config, options);
  }

  /**
   * Run multiple benchmarks in sequence
   * @param configs Array of benchmark configurations
   * @param options Benchmark options
   * @returns Promise resolving to an array of benchmark results
   */
  async runBenchmarks(
    configs: BenchmarkConfig[], 
    options: BenchmarkOptions = {}
  ): Promise<BenchmarkResult[]> {
    console.log(`Running ${configs.length} benchmarks`);
    
    const results: BenchmarkResult[] = [];
    
    for (const config of configs) {
      try {
        const result = await this.runBenchmark(config, options);
        results.push(result);
        
        if (options.verbose) {
          console.log(`Benchmark ${config.name} completed: ${result.passedTests}/${result.totalTests} tests passed`);
        }
      } catch (error) {
        console.error(`Error running benchmark ${config.name}:`, error);
        
        // Add a failed result
        results.push({
          benchmarkType: config.type,
          benchmarkName: config.name,
          totalTests: config.testCases.length,
          passedTests: 0,
          failedTests: config.testCases.length,
          skippedTests: 0,
          metrics: {
            accuracy: 0,
            efficiency: 0,
            safety: 0,
            adaptability: 0
          },
          testResults: []
        });
      }
    }
    
    return results;
  }

  /**
   * Run benchmarks in parallel
   * @param configs Array of benchmark configurations
   * @param options Benchmark options
   * @param maxConcurrent Maximum number of concurrent benchmarks
   * @returns Promise resolving to an array of benchmark results
   */
  async runBenchmarksParallel(
    configs: BenchmarkConfig[], 
    options: BenchmarkOptions = {},
    maxConcurrent = 2
  ): Promise<BenchmarkResult[]> {
    console.log(`Running ${configs.length} benchmarks in parallel (max ${maxConcurrent} concurrent)`);
    
    const results: BenchmarkResult[] = [];
    const queue = [...configs];
    const running: Promise<void>[] = [];
    
    while (queue.length > 0 || running.length > 0) {
      // Fill up to maxConcurrent
      while (running.length < maxConcurrent && queue.length > 0) {
        const config = queue.shift()!;
        
        const promise = this.runBenchmark(config, options)
          .then(result => {
            results.push(result);
            if (options.verbose) {
              console.log(`Benchmark ${config.name} completed: ${result.passedTests}/${result.totalTests} tests passed`);
            }
          })
          .catch(error => {
            console.error(`Error running benchmark ${config.name}:`, error);
            
            // Add a failed result
            results.push({
              benchmarkType: config.type,
              benchmarkName: config.name,
              totalTests: config.testCases.length,
              passedTests: 0,
              failedTests: config.testCases.length,
              skippedTests: 0,
              metrics: {
                accuracy: 0,
                efficiency: 0,
                safety: 0,
                adaptability: 0
              },
              testResults: []
            });
          });
        
        running.push(promise);
      }
      
      // Wait for one to complete
      if (running.length > 0) {
        await Promise.race(running);
        // Create a new array of pending promises
        const pendingPromises = [];
        for (const promise of running) {
          // Check if the promise is still pending
          const status = await Promise.race([
            promise.then(() => "fulfilled"),
            Promise.resolve("pending")
          ]);
          if (status === "pending") {
            pendingPromises.push(promise);
          }
        }
        running.length = 0; // Clear the array
        running.push(...pendingPromises); // Add back only pending promises
      }
    }
    
    return results;
  }

  /**
   * Generate a summary report from benchmark results
   * @param results Array of benchmark results
   * @returns Summary report as a string
   */
  generateSummaryReport(results: BenchmarkResult[]): string {
    if (results.length === 0) {
      return "No benchmark results to report.";
    }
    
    let report = "# Benchmark Summary Report\n\n";
    
    // Overall statistics
    const totalTests = results.reduce((sum, r) => sum + r.totalTests, 0);
    const passedTests = results.reduce((sum, r) => sum + r.passedTests, 0);
    const failedTests = results.reduce((sum, r) => sum + r.failedTests, 0);
    const skippedTests = results.reduce((sum, r) => sum + r.skippedTests, 0);
    
    report += `## Overall Statistics\n\n`;
    report += `- Total Benchmarks: ${results.length}\n`;
    report += `- Total Tests: ${totalTests}\n`;
    report += `- Passed Tests: ${passedTests} (${(passedTests / totalTests * 100).toFixed(2)}%)\n`;
    report += `- Failed Tests: ${failedTests} (${(failedTests / totalTests * 100).toFixed(2)}%)\n`;
    report += `- Skipped Tests: ${skippedTests} (${(skippedTests / totalTests * 100).toFixed(2)}%)\n\n`;
    
    // Average metrics
    const avgAccuracy = results.reduce((sum, r) => sum + r.metrics.accuracy, 0) / results.length;
    const avgEfficiency = results.reduce((sum, r) => sum + r.metrics.efficiency, 0) / results.length;
    const avgSafety = results.reduce((sum, r) => sum + r.metrics.safety, 0) / results.length;
    const avgAdaptability = results.reduce((sum, r) => sum + r.metrics.adaptability, 0) / results.length;
    
    report += `## Average Metrics\n\n`;
    report += `- Accuracy: ${(avgAccuracy * 100).toFixed(2)}%\n`;
    report += `- Efficiency: ${(avgEfficiency * 100).toFixed(2)}%\n`;
    report += `- Safety: ${(avgSafety * 100).toFixed(2)}%\n`;
    report += `- Adaptability: ${(avgAdaptability * 100).toFixed(2)}%\n\n`;
    
    // Individual benchmark results
    report += `## Individual Benchmark Results\n\n`;
    
    for (const result of results) {
      report += `### ${result.benchmarkName} (${result.benchmarkType})\n\n`;
      report += `- Tests: ${result.passedTests}/${result.totalTests} passed`;
      if (result.skippedTests > 0) {
        report += `, ${result.skippedTests} skipped`;
      }
      report += `\n`;
      report += `- Accuracy: ${(result.metrics.accuracy * 100).toFixed(2)}%\n`;
      report += `- Efficiency: ${(result.metrics.efficiency * 100).toFixed(2)}%\n`;
      report += `- Safety: ${(result.metrics.safety * 100).toFixed(2)}%\n`;
      report += `- Adaptability: ${(result.metrics.adaptability * 100).toFixed(2)}%\n\n`;
    }
    
    return report;
  }

  /**
   * Save benchmark results to a file
   * @param results Array of benchmark results
   * @param outputPath Path to save the results
   */
  async saveResults(results: BenchmarkResult[], outputPath: string): Promise<void> {
    const jsonResults = JSON.stringify(results, null, 2);
    await Deno.writeTextFile(outputPath, jsonResults);
    console.log(`Benchmark results saved to ${outputPath}`);
  }

  /**
   * Save a summary report to a file
   * @param results Array of benchmark results
   * @param outputPath Path to save the report
   */
  async saveSummaryReport(results: BenchmarkResult[], outputPath: string): Promise<void> {
    const report = this.generateSummaryReport(results);
    await Deno.writeTextFile(outputPath, report);
    console.log(`Benchmark summary report saved to ${outputPath}`);
  }
}

/**
 * Create a new benchmark manager
 * @returns A new BenchmarkManager instance
 */
export function createBenchmarkManager(): BenchmarkManager {
  return new BenchmarkManager();
}