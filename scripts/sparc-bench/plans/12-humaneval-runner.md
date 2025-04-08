# HumanEval Benchmark Runner Plan

## Overview
This plan outlines the implementation of the HumanEval benchmark runner, which will complement the SWE-bench and RedCode benchmark runners to provide a comprehensive benchmarking framework for SPARC 2.0.

## Implementation Details

### HumanEval Benchmark Runner

The HumanEval benchmark runner will focus on basic coding tasks to evaluate code generation capabilities:

```typescript
/**
 * HumanEval Benchmark Runner
 * 
 * This module implements a runner for the HumanEval benchmark using the E2B code interpreter.
 * It executes code in a secure sandbox environment and evaluates the results against expected outputs.
 * HumanEval focuses on basic coding tasks to evaluate code generation capabilities.
 */

import { BenchmarkConfig, BenchmarkResult, TestResult, BenchmarkOptions } from "./types.ts";
import { executeCode, installPackages } from "../../e2b/e2b-code-interpreter.ts";

/**
 * Run the HumanEval benchmark
 * @param config Benchmark configuration
 * @param options Benchmark options
 * @returns Benchmark result
 */
export async function runHumanEval(
  config: BenchmarkConfig, 
  options: BenchmarkOptions = {}
): Promise<BenchmarkResult> {
  console.log(`Running HumanEval benchmark: ${config.name}`);
  
  const testResults: TestResult[] = [];
  let passedTests = 0;
  let failedTests = 0;
  let skippedTests = 0;
  
  // Install required packages for JavaScript/TypeScript tests
  if (config.testCases.some(tc => tc.language === "javascript" || tc.language === "typescript")) {
    if (options.verbose) {
      console.log("Installing JavaScript packages for HumanEval benchmark...");
    }
    await installPackages(["lodash", "mathjs"], "javascript");
  }
  
  // Install required packages for Python tests
  if (config.testCases.some(tc => tc.language === "python" || !tc.language)) {
    if (options.verbose) {
      console.log("Installing Python packages for HumanEval benchmark...");
    }
    await installPackages(["numpy", "pandas"], "python");
  }
  
  // Run each test case
  for (const testCase of config.testCases) {
    if (options.verbose) {
      console.log(`Running test case: ${testCase.id}`);
    }
    
    const startTime = performance.now();
    
    try {
      const result = await executeCode(testCase.input, {
        language: testCase.language || "python",
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
    benchmarkType: "humaneval",
    benchmarkName: config.name,
    totalTests: config.testCases.length,
    passedTests,
    failedTests,
    skippedTests,
    metrics: {
      accuracy,
      efficiency: calculateEfficiency(testResults),
      correctness: calculateCorrectness(testResults),
      completeness: calculateCompleteness(testResults)
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
 * Calculate correctness metric
 * @param results Test results
 * @returns Correctness score (0-1, higher is better)
 */
function calculateCorrectness(results: TestResult[]): number {
  // For HumanEval, correctness is measured by the number of tests that pass
  return results.filter(r => r.passed).length / (results.length || 1);
}

/**
 * Calculate completeness metric
 * @param results Test results
 * @returns Completeness score (0-1, higher is better)
 */
function calculateCompleteness(results: TestResult[]): number {
  // For HumanEval, completeness is measured by the number of tests that complete without errors
  return results.filter(r => !r.error).length / (results.length || 1);
}

/**
 * Load HumanEval dataset from a file
 * @param filePath Path to the HumanEval dataset file
 * @returns Benchmark configuration
 */
export async function loadHumanEvalDataset(filePath: string): Promise<BenchmarkConfig> {
  try {
    const content = await Deno.readTextFile(filePath);
    const dataset = JSON.parse(content);
    
    // Convert the dataset to a benchmark configuration
    const testCases = dataset.map((item: any, index: number) => ({
      id: `HE-${index.toString().padStart(3, '0')}`,
      input: item.prompt + item.canonical_solution,
      expectedOutput: item.test_cases.map((tc: any) => tc.expected_output).join('\n'),
      language: "python"
    }));
    
    return {
      type: "humaneval",
      name: "humaneval-dataset",
      description: "HumanEval dataset from OpenAI",
      testCases
    };
  } catch (error) {
    console.error(`Failed to load HumanEval dataset from ${filePath}:`, error);
    throw error;
  }
}

/**
 * Generate a HumanEval benchmark configuration
 * @returns Benchmark configuration
 */
export function generateHumanEvalBenchmark(): BenchmarkConfig {
  return {
    type: "humaneval",
    name: "humaneval-basic",
    description: "Basic HumanEval benchmark with simple coding tasks",
    testCases: [
      {
        id: "HE-001",
        input: `
def factorial(n):
    """
    Compute the factorial of n.
    """
    if n == 0:
        return 1
    return n * factorial(n - 1)

print(factorial(5))
        `,
        expectedOutput: "120",
        language: "python"
      },
      {
        id: "HE-002",
        input: `
def fibonacci(n):
    """
    Compute the nth Fibonacci number.
    """
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

print(fibonacci(10))
        `,
        expectedOutput: "55",
        language: "python"
      },
      {
        id: "HE-003",
        input: `
function isPalindrome(str) {
    /**
     * Check if a string is a palindrome.
     */
    const reversed = str.split('').reverse().join('');
    return str === reversed;
}

console.log(isPalindrome("racecar"));
        `,
        expectedOutput: "true",
        language: "javascript"
      },
      // More test cases would be added here
    ]
  };
}
```

### Integration with Benchmark Manager

The HumanEval benchmark runner will be integrated with the benchmark manager to provide a unified interface for running benchmarks:

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

### HumanEval Dataset Support

The HumanEval benchmark runner includes support for loading the official HumanEval dataset from OpenAI:

```typescript
// Load the HumanEval dataset
const benchmark = await loadHumanEvalDataset("humaneval.json");

// Run the benchmark
const result = await runHumanEval(benchmark, { verbose: true });
```

### Default HumanEval Benchmark

The HumanEval benchmark runner includes a default benchmark with basic coding tasks:

```typescript
// Generate a default HumanEval benchmark
const benchmark = generateHumanEvalBenchmark();

// Run the benchmark
const result = await runHumanEval(benchmark, { verbose: true });
```

## Metrics

The HumanEval benchmark runner includes the following metrics:

1. **Accuracy**: The percentage of tests that pass
2. **Efficiency**: A measure of how quickly the code executes
3. **Correctness**: A measure of how correct the code is
4. **Completeness**: A measure of how complete the code is

## Error Handling

The HumanEval benchmark runner includes comprehensive error handling to ensure that errors are properly reported and do not crash the application:

```typescript
try {
  // Run benchmark
} catch (error) {
  console.error(`Error running benchmark ${config.name}:`, error);
  throw error;
}
```

## Extensibility

The HumanEval benchmark runner is designed to be extensible, allowing for the addition of new test cases and metrics in the future.