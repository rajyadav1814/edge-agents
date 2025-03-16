/**
 * SWE-bench Benchmark Runner
 * 
 * This module implements a runner for the SWE-bench benchmark using the E2B code interpreter.
 * It executes code in a secure sandbox environment and evaluates the results against expected outputs.
 */

import { BenchmarkConfig, BenchmarkResult, TestResult, BenchmarkOptions } from "./types.ts";
import { executeCode, executeFile, installPackages } from "../../../e2b/e2b-code-interpreter.ts";

/**
 * Run the SWE-bench benchmark
 * @param config Benchmark configuration
 * @param options Benchmark options
 * @returns Benchmark result
 */
export async function runSWEBench(
  config: BenchmarkConfig, 
  options: BenchmarkOptions = {}
): Promise<BenchmarkResult> {
  console.log(`Running SWE-bench benchmark: ${config.name}`);
  
  const testResults: TestResult[] = [];
  let passedTests = 0;
  let failedTests = 0;
  let skippedTests = 0;
  
  // Install required packages for the tests
  if (config.testCases.some(tc => tc.language === "python" || !tc.language)) {
    if (options.verbose) {
      console.log("Installing Python packages for SWE-bench benchmark...");
    }
    await installPackages(["pytest", "numpy", "pandas"], "python");
  }
  
  if (config.testCases.some(tc => tc.language === "javascript" || tc.language === "typescript")) {
    if (options.verbose) {
      console.log("Installing JavaScript packages for SWE-bench benchmark...");
    }
    await installPackages(["jest", "ts-jest", "typescript"], "javascript");
  }
  
  // Run each test case
  for (const testCase of config.testCases) {
    if (options.verbose) {
      console.log(`Running test case: ${testCase.id}`);
    }
    
    const startTime = performance.now();
    
    try {
      // For SWE-bench, we might need to execute a file instead of inline code
      let result;
      if (testCase.input.startsWith("file:")) {
        // Execute a file
        const filePath = testCase.input.substring(5);
        result = await executeFile(filePath, {
          language: testCase.language || "python",
          timeout: testCase.timeout || 60000,
          stream: options.stream || false
        });
      } else {
        // Execute inline code
        result = await executeCode(testCase.input, {
          language: testCase.language || "python",
          timeout: testCase.timeout || 60000,
          stream: options.stream || false
        });
      }
      
      const executionTime = performance.now() - startTime;
      
      // Check if the output matches the expected output
      const passed = result.text.trim() === testCase.expectedOutput.trim() || 
                     result.logs.stdout.join("\n").includes(testCase.expectedOutput.trim());
      
      if (passed) {
        passedTests++;
        if (options.verbose) {
          console.log(`✅ Test case ${testCase.id} passed`);
        }
      } else {
        failedTests++;
        if (options.verbose) {
          console.log(`❌ Test case ${testCase.id} failed`);
          console.log(`Expected: ${testCase.expectedOutput.trim()}`);
          console.log(`Actual: ${result.text.trim() || result.logs.stdout.join("\n")}`);
        }
      }
      
      testResults.push({
        testId: testCase.id,
        passed,
        executionTime,
        output: result.text || result.logs.stdout.join("\n"),
        error: result.error ? result.error.value : undefined
      });
    } catch (error) {
      failedTests++;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (options.verbose) {
        console.log(`❌ Test case ${testCase.id} failed with error: ${errorMessage}`);
      }
      
      testResults.push({
        testId: testCase.id,
        passed: false,
        executionTime: performance.now() - startTime,
        error: errorMessage
      });
    }
  }
  
  // Calculate metrics
  const accuracy = config.testCases.length > 0 ? passedTests / config.testCases.length : 0;
  
  const result: BenchmarkResult = {
    benchmarkType: "swebench",
    benchmarkName: config.name,
    totalTests: config.testCases.length,
    passedTests,
    failedTests,
    skippedTests,
    metrics: {
      accuracy,
      efficiency: calculateEfficiency(testResults),
      safety: calculateSafety(testResults),
      adaptability: calculateAdaptability(testResults)
    },
    testResults
  };
  
  // Output results to file if specified
  if (options.outputFile) {
    await Deno.writeTextFile(options.outputFile, JSON.stringify(result, null, 2));
    if (options.verbose) {
      console.log(`Results written to ${options.outputFile}`);
    }
  }
  
  return result;
}

/**
 * Calculate efficiency metric
 * @param results Test results
 * @returns Efficiency score (0-1, higher is better)
 */
function calculateEfficiency(results: TestResult[]): number {
  if (results.length === 0) return 0;
  const avgExecutionTime = results.reduce((sum, r) => sum + r.executionTime, 0) / results.length;
  // Normalize to a 0-1 scale (lower is better)
  return Math.max(0, Math.min(1, 1 - (avgExecutionTime / 60000)));
}

/**
 * Calculate safety metric
 * @param results Test results
 * @returns Safety score (0-1, higher is better)
 */
function calculateSafety(results: TestResult[]): number {
  // Count tests with errors that indicate safety issues
  const safetyIssues = results.filter(r => 
    r.error && (
      r.error.includes("unsafe") || 
      r.error.includes("security") || 
      r.error.includes("permission") ||
      r.error.includes("forbidden") ||
      r.error.includes("vulnerability")
    )
  ).length;
  
  return results.length > 0 ? 1 - (safetyIssues / results.length) : 1;
}

/**
 * Calculate adaptability metric
 * @param results Test results
 * @returns Adaptability score (0-1, higher is better)
 */
function calculateAdaptability(results: TestResult[]): number {
  // For SWE-bench, adaptability is measured by the ability to handle different
  // types of software engineering tasks
  return results.filter(r => r.passed).length / (results.length || 1);
}