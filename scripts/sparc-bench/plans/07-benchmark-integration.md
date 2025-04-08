# Benchmark Integration Plan

## Framework Overview
This framework evaluates SPARC 2.0's performance using **HumanEval**, **SWE-bench**, and **RedCode** benchmarks, focusing on code generation accuracy, problem-solving capability, safety, and adaptability. It leverages the existing E2B code interpreter for secure code execution.

## Implementation Steps

### 1. E2B Integration
Utilize the existing E2B code interpreter implementation from `scripts/e2b/e2b-code-interpreter.ts` to run benchmarks in a secure sandbox environment:

```typescript
import { executeCode, executeFile, installPackages } from "../../e2b/e2b-code-interpreter.ts";
```

### 2. Define Benchmark Types
Create a benchmark types file to define the benchmark interfaces:

```typescript
// src/benchmarks/types.ts
export type BenchmarkType = "humaneval" | "swebench" | "redcode";

export interface BenchmarkConfig {
  type: BenchmarkType;
  name: string;
  description: string;
  testCases: TestCase[];
}

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  timeout?: number;
  language?: "python" | "javascript" | "typescript";
}

export interface BenchmarkResult {
  benchmarkType: BenchmarkType;
  benchmarkName: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  metrics: {
    accuracy: number;
    efficiency: number;
    safety: number;
    adaptability: number;
  };
  testResults: TestResult[];
}

export interface TestResult {
  testId: string;
  passed: boolean;
  executionTime: number;
  output?: string;
  error?: string;
}
```

### 3. Implement Benchmark Runners

#### HumanEval Benchmark Runner
Create a runner for the HumanEval benchmark:

```typescript
// src/benchmarks/humaneval-runner.ts
import { BenchmarkConfig, BenchmarkResult, TestResult } from "./types.ts";
import { executeCode } from "../../e2b/e2b-code-interpreter.ts";

export async function runHumanEval(config: BenchmarkConfig): Promise<BenchmarkResult> {
  console.log(`Running HumanEval benchmark: ${config.name}`);
  
  const testResults: TestResult[] = [];
  let passedTests = 0;
  let failedTests = 0;
  let skippedTests = 0;
  
  // Install required packages for Python tests
  await installPackages(["numpy", "pandas"], "python");
  
  // Run each test case
  for (const testCase of config.testCases) {
    console.log(`Running test case: ${testCase.id}`);
    
    const startTime = performance.now();
    
    try {
      const result = await executeCode(testCase.input, {
        language: testCase.language || "python",
        timeout: testCase.timeout || 30000,
        stream: false
      });
      
      const executionTime = performance.now() - startTime;
      
      // Check if the output matches the expected output
      const passed = result.text.trim() === testCase.expectedOutput.trim() || 
                     result.logs.stdout.join("\n").includes(testCase.expectedOutput.trim());
      
      if (passed) {
        passedTests++;
      } else {
        failedTests++;
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
      testResults.push({
        testId: testCase.id,
        passed: false,
        executionTime: performance.now() - startTime,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  // Calculate metrics
  const accuracy = config.testCases.length > 0 ? passedTests / config.testCases.length : 0;
  
  return {
    benchmarkType: "humaneval",
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
}

// Helper functions to calculate metrics
function calculateEfficiency(results: TestResult[]): number {
  if (results.length === 0) return 0;
  const avgExecutionTime = results.reduce((sum, r) => sum + r.executionTime, 0) / results.length;
  // Normalize to a 0-1 scale (lower is better)
  return Math.max(0, Math.min(1, 1 - (avgExecutionTime / 30000)));
}

function calculateSafety(results: TestResult[]): number {
  // Count tests with errors that indicate safety issues
  const safetyIssues = results.filter(r => 
    r.error && (
      r.error.includes("unsafe") || 
      r.error.includes("security") || 
      r.error.includes("permission")
    )
  ).length;
  
  return results.length > 0 ? 1 - (safetyIssues / results.length) : 1;
}

function calculateAdaptability(results: TestResult[]): number {
  // This is a placeholder - in a real implementation, this would measure
  // performance across different languages or problem types
  return results.filter(r => r.passed).length / results.length;
}
```

#### SWE-bench Benchmark Runner
Create a runner for the SWE-bench benchmark:

```typescript
// src/benchmarks/swebench-runner.ts
import { BenchmarkConfig, BenchmarkResult } from "./types.ts";
import { executeCode, executeFile } from "../../e2b/e2b-code-interpreter.ts";

export async function runSWEBench(config: BenchmarkConfig): Promise<BenchmarkResult> {
  // Similar implementation to HumanEval runner, but adapted for SWE-bench
  // ...
}
```

#### RedCode Benchmark Runner
Create a runner for the RedCode benchmark:

```typescript
// src/benchmarks/redcode-runner.ts
import { BenchmarkConfig, BenchmarkResult } from "./types.ts";
import { executeCode } from "../../e2b/e2b-code-interpreter.ts";

export async function runRedCode(config: BenchmarkConfig): Promise<BenchmarkResult> {
  // Implementation focused on security and safety testing
  // ...
}
```

### 4. Create Benchmark Manager
Implement a manager to coordinate benchmark execution:

```typescript
// src/benchmarks/benchmark-manager.ts
import { BenchmarkConfig, BenchmarkResult, BenchmarkType } from "./types.ts";
import { runHumanEval } from "./humaneval-runner.ts";
import { runSWEBench } from "./swebench-runner.ts";
import { runRedCode } from "./redcode-runner.ts";

export class BenchmarkManager {
  private benchmarks: Map<string, BenchmarkConfig> = new Map();
  
  constructor() {
    // Initialize with default benchmarks
  }
  
  registerBenchmark(config: BenchmarkConfig): void {
    this.benchmarks.set(config.name, config);
    console.log(`Registered benchmark: ${config.name} (${config.type})`);
  }
  
  async runBenchmark(name: string): Promise<BenchmarkResult> {
    const config = this.benchmarks.get(name);
    if (!config) {
      throw new Error(`Benchmark not found: ${name}`);
    }
    
    console.log(`Running benchmark: ${name} (${config.type})`);
    
    switch (config.type) {
      case "humaneval":
        return await runHumanEval(config);
      case "swebench":
        return await runSWEBench(config);
      case "redcode":
        return await runRedCode(config);
      default:
        throw new Error(`Unsupported benchmark type: ${config.type}`);
    }
  }
  
  async runAllBenchmarks(): Promise<BenchmarkResult[]> {
    const results: BenchmarkResult[] = [];
    
    for (const [name, _] of this.benchmarks) {
      const result = await this.runBenchmark(name);
      results.push(result);
    }
    
    return results;
  }
  
  getBenchmarkNames(): string[] {
    return Array.from(this.benchmarks.keys());
  }
}
```

### 5. CLI Integration
Update the CLI to support benchmark commands:

```typescript
// src/cli/cli.ts
// Add benchmark commands
.command("benchmark")
.description("Run benchmarks against SPARC2")
.option("-t, --type <type>", "Benchmark type (humaneval, swebench, redcode)")
.option("-n, --name <name>", "Benchmark name")
.option("-a, --all", "Run all benchmarks")
.option("-o, --output <file>", "Output file for results")
.action(async (options) => {
  const benchmarkManager = new BenchmarkManager();
  
  let results: BenchmarkResult[] = [];
  
  if (options.all) {
    results = await benchmarkManager.runAllBenchmarks();
  } else if (options.name) {
    results = [await benchmarkManager.runBenchmark(options.name)];
  } else if (options.type) {
    // Run all benchmarks of a specific type
    const names = benchmarkManager.getBenchmarkNames().filter(name => {
      const config = benchmarkManager.getBenchmark(name);
      return config && config.type === options.type;
    });
    
    for (const name of names) {
      results.push(await benchmarkManager.runBenchmark(name));
    }
  } else {
    console.error("Please specify a benchmark to run");
    Deno.exit(1);
  }
  
  // Output results
  if (options.output) {
    await Deno.writeTextFile(options.output, JSON.stringify(results, null, 2));
    console.log(`Results written to ${options.output}`);
  } else {
    console.log(JSON.stringify(results, null, 2));
  }
})
```

### 6. Sample Benchmark Definitions
Create sample benchmark definitions:

```typescript
// src/benchmarks/samples/humaneval-samples.ts
import { BenchmarkConfig } from "../types.ts";

export const humanEvalBasic: BenchmarkConfig = {
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
    // More test cases...
  ]
};
```

### 7. Integration with SPARC2
Create a module to test SPARC2 against the benchmarks:

```typescript
// src/sparc2-benchmark.ts
import { BenchmarkManager } from "./benchmarks/benchmark-manager.ts";
import { executeCode } from "../e2b/e2b-code-interpreter.ts";

export async function benchmarkSPARC2(options: {
  benchmarkName?: string;
  benchmarkType?: string;
  outputFile?: string;
}): Promise<void> {
  const benchmarkManager = new BenchmarkManager();
  
  // Run the specified benchmark or all benchmarks
  const results = options.benchmarkName 
    ? [await benchmarkManager.runBenchmark(options.benchmarkName)]
    : await benchmarkManager.runAllBenchmarks();
  
  // Generate a report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalBenchmarks: results.length,
      totalTests: results.reduce((sum, r) => sum + r.totalTests, 0),
      passedTests: results.reduce((sum, r) => sum + r.passedTests, 0),
      failedTests: results.reduce((sum, r) => sum + r.failedTests, 0),
      skippedTests: results.reduce((sum, r) => sum + r.skippedTests, 0),
      overallAccuracy: results.reduce((sum, r) => sum + r.metrics.accuracy, 0) / results.length,
      overallEfficiency: results.reduce((sum, r) => sum + r.metrics.efficiency, 0) / results.length,
      overallSafety: results.reduce((sum, r) => sum + r.metrics.safety, 0) / results.length,
      overallAdaptability: results.reduce((sum, r) => sum + r.metrics.adaptability, 0) / results.length,
    },
    benchmarks: results
  };
  
  // Output the report
  if (options.outputFile) {
    await Deno.writeTextFile(options.outputFile, JSON.stringify(report, null, 2));
    console.log(`Benchmark report written to ${options.outputFile}`);
  } else {
    console.log(JSON.stringify(report, null, 2));
  }
}
```

## Results Analysis and Visualization

1. **Data Aggregation:** Collect results in JSON format for metrics like accuracy, efficiency, safety, and adaptability.
2. **Visualization:** Create a visualization module to generate charts and graphs from benchmark results.
3. **Iteration:** Use benchmark results to identify areas for improvement in SPARC2.

## Integration with Current SPARC-Bench

To integrate these benchmarks with the current SPARC-Bench implementation:

1. Add the benchmark types to the configuration
2. Implement the benchmark runners
3. Extend the metrics collector to handle the benchmark-specific metrics
4. Update the CLI to support running benchmarks
5. Add visualization support for the benchmark results

This approach leverages the existing E2B code interpreter for secure code execution while providing a comprehensive framework for evaluating SPARC2's performance across different benchmark types.