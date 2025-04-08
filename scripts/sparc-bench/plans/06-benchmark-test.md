# Benchmark Test Implementation Plan

## Overview

The `benchmark-test.ts` file contains tests for the SPARC-Bench benchmarking suite. It ensures that metrics are calculated correctly and that the suite works with different configurations.

## Requirements

1. Test the metrics collector
2. Test the security evaluator
3. Test the agentic evaluator
4. Test the config parser
5. Test the end-to-end benchmarking process

## Implementation Details

### Imports and Dependencies

```typescript
import { assertEquals, assertNotEquals, assertThrows, assert } from "https://deno.land/std/testing/asserts.ts";
import { AgenticMetricsCollector } from "../metrics/metrics-collector.ts";
import { SecurityEvaluator } from "../metrics/security-evaluator.ts";
import { AgenticEvaluator } from "../metrics/agentic-evaluator.ts";
import { ConfigParser } from "../utils/config-parser.ts";
import { AgenticBenchmarkConfig, BenchmarkTask, AgentStep, BenchmarkResult, AgentSize } from "../types/types.ts";
```

### Test Data

```typescript
/**
 * Mock agent step for testing
 */
const mockStep: AgentStep = {
  number: 1,
  duration: 1000,
  tokenCount: 500,
  tools: [
    { name: "read_file", success: true },
    { name: "write_file", success: false }
  ],
  safetyFlags: []
};

/**
 * Mock benchmark task for testing
 */
const mockTask: BenchmarkTask = {
  id: "test-task",
  description: "Test task",
  prompt: "Test prompt",
  validationFn: (output: string) => output.includes("success"),
  language: "javascript",
  safetyCritical: false,
  stepDependencies: [
    { stepNumber: 1, requiredTools: ["read_file"], maxTokens: 1000 },
    { stepNumber: 2, requiredTools: ["write_file"], maxTokens: 1000 }
  ]
};

/**
 * Mock configuration for testing
 */
const mockConfig: AgenticBenchmarkConfig = {
  benchmark: {
    name: "Test Benchmark",
    version: "1.0.0"
  },
  steps: {
    min: 1,
    max: 3,
    increment: 1
  },
  agent: {
    sizes: ["small", "medium"],
    tokenCacheEnabled: false,
    maxParallelAgents: 2
  },
  metrics: {
    include: [
      "step_completion",
      "tool_accuracy",
      "token_efficiency",
      "trajectory_optimality"
    ]
  },
  security: {
    level: "strict",
    adversarialTests: ["code_injection", "prompt_leakage"]
  },
  execution: {
    processing: "sequential"
  }
};
```

### Metrics Collector Tests

```typescript
Deno.test("AgenticMetricsCollector - trackStepPerformance", () => {
  const collector = new AgenticMetricsCollector();
  collector.trackStepPerformance(mockStep);
  
  // Check that the step was tracked
  const metrics = collector.calculateOverallMetrics([mockStep]);
  assertNotEquals(metrics, undefined);
});

Deno.test("AgenticMetricsCollector - calculateOverallMetrics", () => {
  const collector = new AgenticMetricsCollector();
  
  // Track two steps
  collector.trackStepPerformance({
    ...mockStep,
    number: 1
  });
  
  collector.trackStepPerformance({
    ...mockStep,
    number: 2
  });
  
  // Calculate metrics for three steps (only two completed)
  const steps: AgentStep[] = [
    { ...mockStep, number: 1 },
    { ...mockStep, number: 2 },
    { ...mockStep, number: 3 }
  ];
  
  const metrics = collector.calculateOverallMetrics(steps);
  
  // Check step completion (2/3)
  assertEquals(metrics.stepCompletion, 2/3);
  
  // Check other metrics
  assert(metrics.toolAccuracy >= 0 && metrics.toolAccuracy <= 1);
  assert(metrics.tokenEfficiency > 0);
  assert(metrics.trajectoryOptimality >= 0 && metrics.trajectoryOptimality <= 1);
});

Deno.test("AgenticMetricsCollector - calculateToolAccuracy", () => {
  const collector = new AgenticMetricsCollector();
  
  // Create a step with 2 tools, one successful and one failed
  const step: AgentStep = {
    ...mockStep,
    tools: [
      { name: "read_file", success: true },
      { name: "write_file", success: false }
    ]
  };
  
  // Calculate tool accuracy
  const accuracy = collector["calculateToolAccuracy"](step); // Access private method for testing
  
  // Check accuracy (1/2)
  assertEquals(accuracy, 0.5);
});

Deno.test("AgenticMetricsCollector - calculateTrajectoryScore", () => {
  const collector = new AgenticMetricsCollector();
  
  // Create steps
  const steps: AgentStep[] = [
    { ...mockStep, number: 1 },
    { ...mockStep, number: 2 },
    { ...mockStep, number: 3 }
  ];
  
  // Calculate trajectory score
  const score = collector["calculateTrajectoryScore"](steps); // Access private method for testing
  
  // Check score
  assert(score >= 0 && score <= 1);
});
```

### Security Evaluator Tests

```typescript
Deno.test("SecurityEvaluator - runAdversarialTests", async () => {
  const evaluator = new SecurityEvaluator({
    level: "strict",
    adversarialTests: ["code_injection", "prompt_leakage"]
  });
  
  const results = await evaluator.runAdversarialTests();
  
  // Check that all tests were run
  assertEquals(results.length, 2);
  assertEquals(results[0].testName, "code_injection");
  assertEquals(results[1].testName, "prompt_leakage");
  
  // Check result structure
  for (const result of results) {
    assert(typeof result.result === "boolean");
    assert(typeof result.vulnerabilityScore === "number");
    assert(result.vulnerabilityScore >= 0 && result.vulnerabilityScore <= 100);
  }
});

Deno.test("SecurityEvaluator - calculateSecurityScore", () => {
  const evaluator = new SecurityEvaluator({
    level: "strict",
    adversarialTests: []
  });
  
  // Create test results
  const results = [
    {
      testName: "code_injection",
      result: true,
      vulnerabilityScore: 50
    },
    {
      testName: "prompt_leakage",
      result: false,
      vulnerabilityScore: 10
    }
  ];
  
  // Calculate security score
  const score = evaluator.calculateSecurityScore(results);
  
  // Check score (100 - (60/200)*100 = 70)
  assertEquals(score, 70);
});

Deno.test("SecurityEvaluator - testVector", async () => {
  const evaluator = new SecurityEvaluator({
    level: "strict",
    adversarialTests: []
  });
  
  // Test a vector
  const result = await evaluator["testVector"]("console.log('test')"); // Access private method for testing
  
  // Check result
  assert(typeof result.vulnerable === "boolean");
  assert(typeof result.score === "number");
});
```

### Agentic Evaluator Tests

```typescript
Deno.test("AgenticEvaluator - generateStepRanges", () => {
  const evaluator = new AgenticEvaluator({
    ...mockConfig,
    steps: {
      min: 1,
      max: 5,
      increment: 2
    }
  });
  
  const ranges = evaluator["generateStepRanges"](); // Access private method for testing
  
  // Check ranges
  assertEquals(ranges, [1, 3, 5]);
});

Deno.test("AgenticEvaluator - runTask", async () => {
  const evaluator = new AgenticEvaluator(mockConfig);
  
  const result = await evaluator["runTask"](mockTask, "small", 2); // Access private method for testing
  
  // Check result
  assertEquals(result.taskId, "test-task");
  assertEquals(result.agentSize, "small");
  assertEquals(result.stepCount, 2);
  assertEquals(result.stepsCompleted, 2);
  assert(result.tokensUsed > 0);
  assert(result.executionTime > 0);
  assert(typeof result.success === "boolean");
  assert(result.metrics.stepCompletion > 0);
});

Deno.test("AgenticEvaluator - runTasksConcurrently", async () => {
  const evaluator = new AgenticEvaluator({
    ...mockConfig,
    agent: {
      ...mockConfig.agent,
      maxParallelAgents: 2
    }
  });
  
  const tasks = [mockTask, { ...mockTask, id: "test-task-2" }];
  
  const results = await evaluator["runTasksConcurrently"](tasks, "small", 2); // Access private method for testing
  
  // Check results
  assertEquals(results.length, 2);
  assertEquals(results[0].taskId, "test-task");
  assertEquals(results[1].taskId, "test-task-2");
});

Deno.test("AgenticEvaluator - applyStatisticalAnalysis", () => {
  const evaluator = new AgenticEvaluator(mockConfig);
  
  // Create results
  const results: BenchmarkResult[] = [
    {
      taskId: "test-task",
      agentSize: "small",
      stepCount: 1,
      stepsCompleted: 1,
      tokensUsed: 500,
      executionTime: 1000,
      success: true,
      metrics: {
        stepCompletion: 1,
        toolAccuracy: 0.8,
        tokenEfficiency: 500,
        trajectoryOptimality: 0.9
      }
    },
    {
      taskId: "test-task",
      agentSize: "small",
      stepCount: 2,
      stepsCompleted: 2,
      tokensUsed: 1000,
      executionTime: 2000,
      success: true,
      metrics: {
        stepCompletion: 1,
        toolAccuracy: 0.7,
        tokenEfficiency: 500,
        trajectoryOptimality: 0.8
      }
    }
  ];
  
  const analyzedResults = evaluator["applyStatisticalAnalysis"](results); // Access private method for testing
  
  // Check that statistics were added
  assertEquals(analyzedResults.length, 2);
  assertEquals(analyzedResults[0].statistics, undefined);
  assertNotEquals(analyzedResults[1].statistics, undefined);
  assert(analyzedResults[1].statistics!.wilcoxonPValue >= 0 && analyzedResults[1].statistics!.wilcoxonPValue <= 1);
  assert(analyzedResults[1].statistics!.effectSize >= 0 && analyzedResults[1].statistics!.effectSize <= 1);
});
```

### Config Parser Tests

```typescript
Deno.test("ConfigParser - loadConfig", async () => {
  // Create a temporary config file
  const tempFile = await Deno.makeTempFile({ suffix: ".toml" });
  
  try {
    // Write config to the file
    await Deno.writeTextFile(tempFile, `
      [benchmark]
      name = "Test Benchmark"
      version = "1.0.0"
      
      [steps]
      min = 1
      max = 3
      increment = 1
      
      [agent]
      sizes = ["small", "medium"]
      token_cache_enabled = false
      max_parallel_agents = 2
      
      [metrics]
      include = ["step_completion", "tool_accuracy"]
      
      [security]
      level = "strict"
      adversarial_tests = ["code_injection"]
      
      [execution]
      processing = "sequential"
    `);
    
    // Load config
    const parser = new ConfigParser(tempFile);
    const config = await parser.loadConfig();
    
    // Check config
    assertEquals(config.benchmark.name, "Test Benchmark");
    assertEquals(config.steps.min, 1);
    assertEquals(config.steps.max, 3);
    assertEquals(config.agent.sizes, ["small", "medium"]);
    assertEquals(config.metrics.include, ["step_completion", "tool_accuracy"]);
    assertEquals(config.security.level, "strict");
    assertEquals(config.security.adversarialTests, ["code_injection"]);
    assertEquals(config.execution.processing, "sequential");
  } finally {
    // Clean up
    await Deno.remove(tempFile);
  }
});

Deno.test("ConfigParser - validateConfig", () => {
  const parser = new ConfigParser();
  
  // Invalid config
  const invalidConfig: AgenticBenchmarkConfig = {
    ...mockConfig,
    steps: {
      min: 0, // Invalid: must be at least 1
      max: 3,
      increment: 1
    }
  };
  
  // Check that validation throws
  assertThrows(() => parser["validateConfig"](invalidConfig)); // Access private method for testing
  
  // Valid config
  const validConfig: AgenticBenchmarkConfig = {
    ...mockConfig,
    steps: {
      min: 1,
      max: 3,
      increment: 1
    }
  };
  
  // Check that validation doesn't throw
  parser["validateConfig"](validConfig); // Access private method for testing
});
```

### End-to-End Tests

```typescript
Deno.test("End-to-End - Run benchmark", async () => {
  // Create a temporary config file
  const tempFile = await Deno.makeTempFile({ suffix: ".toml" });
  
  try {
    // Write config to the file
    await Deno.writeTextFile(tempFile, `
      [benchmark]
      name = "Test Benchmark"
      version = "1.0.0"
      
      [steps]
      min = 1
      max = 1
      increment = 1
      
      [agent]
      sizes = ["small"]
      token_cache_enabled = false
      max_parallel_agents = 1
      
      [metrics]
      include = ["step_completion", "tool_accuracy"]
      
      [security]
      level = "strict"
      adversarial_tests = []
      
      [execution]
      processing = "sequential"
    `);
    
    // Load config
    const parser = new ConfigParser(tempFile);
    const config = await parser.loadConfig();
    
    // Create evaluator
    const evaluator = new AgenticEvaluator(config);
    
    // Run benchmark
    const results = await evaluator.runSuite([mockTask]);
    
    // Check results
    assertEquals(results.length, 1);
    assertEquals(results[0].taskId, "test-task");
    assertEquals(results[0].agentSize, "small");
    assertEquals(results[0].stepCount, 1);
    assert(results[0].stepsCompleted > 0);
    assert(results[0].tokensUsed > 0);
    assert(results[0].executionTime > 0);
    assert(typeof results[0].success === "boolean");
    assert(results[0].metrics.stepCompletion > 0);
  } finally {
    // Clean up
    await Deno.remove(tempFile);
  }
});
```

## Integration

The benchmark tests will be run as part of the CI/CD pipeline to ensure that the SPARC-Bench benchmarking suite works correctly. They will also be used during development to verify that changes to the codebase don't break existing functionality.