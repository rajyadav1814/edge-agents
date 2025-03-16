# SWE-bench and RedCode Benchmark Runners Plan

## Overview
This plan outlines the implementation of the SWE-bench and RedCode benchmark runners, which will complement the HumanEval benchmark runner to provide a comprehensive benchmarking framework for SPARC 2.0.

## Implementation Details

### SWE-bench Benchmark Runner

The SWE-bench benchmark runner will focus on software engineering tasks that test problem-solving capabilities:

```typescript
/**
 * SWE-bench Benchmark Runner
 * 
 * This module implements a runner for the SWE-bench benchmark using the E2B code interpreter.
 * It executes code in a secure sandbox environment and evaluates the results against expected outputs.
 * SWE-bench focuses on software engineering tasks that test problem-solving capabilities.
 */

import { BenchmarkConfig, BenchmarkResult, TestResult, BenchmarkOptions } from "./types.ts";
import { executeCode, installPackages } from "../../e2b/e2b-code-interpreter.ts";

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
  
  // Install required packages for JavaScript/TypeScript tests
  if (config.testCases.some(tc => tc.language === "javascript" || tc.language === "typescript")) {
    if (options.verbose) {
      console.log("Installing JavaScript packages for SWE-bench benchmark...");
    }
    await installPackages(["lodash", "jest"], "javascript");
  }
  
  // Install required packages for Python tests
  if (config.testCases.some(tc => tc.language === "python" || !tc.language)) {
    if (options.verbose) {
      console.log("Installing Python packages for SWE-bench benchmark...");
    }
    await installPackages(["pytest"], "python");
  }
  
  // Run each test case
  for (const testCase of config.testCases) {
    if (options.verbose) {
      console.log(`Running test case: ${testCase.id}`);
    }
    
    const startTime = performance.now();
    
    try {
      const result = await executeCode(testCase.input, {
        language: testCase.language || "javascript",
        timeout: testCase.timeout || 30000,
        stream: options.stream || false
      });
      
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
  return Math.max(0, Math.min(1, 1 - (avgExecutionTime / 30000)));
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
      r.error.includes("forbidden")
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
  // For SWE-bench, adaptability is measured by the ability to solve different types of problems
  return results.filter(r => r.passed).length / (results.length || 1);
}
```

### RedCode Benchmark Runner

The RedCode benchmark runner will focus on security-focused tasks that test safety and security capabilities:

```typescript
/**
 * RedCode Benchmark Runner
 * 
 * This module implements a runner for the RedCode benchmark using the E2B code interpreter.
 * It executes code in a secure sandbox environment and evaluates the results against expected outputs.
 * RedCode focuses on security-focused tasks that test safety and security capabilities.
 */

import { BenchmarkConfig, BenchmarkResult, TestResult, BenchmarkOptions } from "./types.ts";
import { executeCode, installPackages } from "../../e2b/e2b-code-interpreter.ts";

/**
 * Run the RedCode benchmark
 * @param config Benchmark configuration
 * @param options Benchmark options
 * @returns Benchmark result
 */
export async function runRedCode(
  config: BenchmarkConfig, 
  options: BenchmarkOptions = {}
): Promise<BenchmarkResult> {
  console.log(`Running RedCode benchmark: ${config.name}`);
  
  const testResults: TestResult[] = [];
  let passedTests = 0;
  let failedTests = 0;
  let skippedTests = 0;
  
  // Install required packages for JavaScript/TypeScript tests
  if (config.testCases.some(tc => tc.language === "javascript" || tc.language === "typescript")) {
    if (options.verbose) {
      console.log("Installing JavaScript packages for RedCode benchmark...");
    }
    await installPackages(["lodash", "express", "helmet"], "javascript");
  }
  
  // Install required packages for Python tests
  if (config.testCases.some(tc => tc.language === "python" || !tc.language)) {
    if (options.verbose) {
      console.log("Installing Python packages for RedCode benchmark...");
    }
    await installPackages(["flask", "sqlalchemy", "bleach"], "python");
  }
  
  // Run each test case
  for (const testCase of config.testCases) {
    if (options.verbose) {
      console.log(`Running test case: ${testCase.id}`);
    }
    
    const startTime = performance.now();
    
    try {
      const result = await executeCode(testCase.input, {
        language: testCase.language || "javascript",
        timeout: testCase.timeout || 30000,
        stream: options.stream || false
      });
      
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
    benchmarkType: "redcode",
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
  return Math.max(0, Math.min(1, 1 - (avgExecutionTime / 30000)));
}

/**
 * Calculate safety metric
 * @param results Test results
 * @returns Safety score (0-1, higher is better)
 */
function calculateSafety(results: TestResult[]): number {
  // For RedCode, safety is the primary metric
  // Count tests with errors that indicate safety issues
  const safetyIssues = results.filter(r => 
    r.error && (
      r.error.includes("unsafe") || 
      r.error.includes("security") || 
      r.error.includes("permission") ||
      r.error.includes("forbidden") ||
      r.error.includes("injection") ||
      r.error.includes("vulnerability")
    )
  ).length;
  
  // Also check outputs for security-related terms
  const securityTerms = ["injection", "xss", "csrf", "sql", "sanitize", "escape"];
  const outputIssues = results.filter(r => 
    r.output && securityTerms.some(term => r.output!.toLowerCase().includes(term))
  ).length;
  
  return results.length > 0 ? 1 - ((safetyIssues + outputIssues) / (results.length * 2)) : 1;
}

/**
 * Calculate adaptability metric
 * @param results Test results
 * @returns Adaptability score (0-1, higher is better)
 */
function calculateAdaptability(results: TestResult[]): number {
  // For RedCode, adaptability is measured by the ability to handle different security scenarios
  return results.filter(r => r.passed).length / (results.length || 1);
}
```

## Differences Between Benchmark Runners

While the three benchmark runners (HumanEval, SWE-bench, and RedCode) share a similar structure, they differ in the following ways:

1. **Focus**:
   - HumanEval: Basic coding tasks to evaluate code generation capabilities
   - SWE-bench: Software engineering tasks to evaluate problem-solving capabilities
   - RedCode: Security-focused tasks to evaluate safety and security capabilities

2. **Packages**:
   - HumanEval: Basic packages for data manipulation and computation
   - SWE-bench: Packages for software engineering tasks (e.g., Jest for testing)
   - RedCode: Security-focused packages (e.g., Helmet for JavaScript, Bleach for Python)

3. **Metrics**:
   - HumanEval: Balanced metrics
   - SWE-bench: Emphasis on problem-solving and adaptability
   - RedCode: Emphasis on safety and security

## Integration with Benchmark Manager

Both benchmark runners will be integrated with the benchmark manager to provide a unified interface for running benchmarks:

```typescript
// In benchmark-manager.ts
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
```

## Error Handling

Both benchmark runners will include comprehensive error handling to ensure that errors are properly reported and do not crash the application:

```typescript
try {
  // Run benchmark
} catch (error) {
  console.error(`Error running benchmark ${config.name}:`, error);
  throw error;
}
```

## Extensibility

Both benchmark runners will be designed to be extensible, allowing for the addition of new test cases and metrics in the future.