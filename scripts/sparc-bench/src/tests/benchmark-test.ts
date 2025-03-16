/**
 * SPARC 2.0 Agentic Benchmarking Suite Tests
 * Tests for the benchmarking suite
 */

import { assertEquals, assertNotEquals, assertThrows, assert } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { AgenticEvaluator } from "../metrics/agentic-evaluator.ts";
import { AgenticMetricsCollector } from "../metrics/metrics-collector.ts";
import { SecurityEvaluator } from "../metrics/security-evaluator.ts";
import { ConfigParser } from "../utils/config-parser.ts";
import { AgenticBenchmarkConfig, BenchmarkTask, AgentStep, BenchmarkResult } from "../types/types.ts";

// Mock agent step for testing
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

// Mock benchmark task for testing
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

// Mock configuration for testing
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

// Test configuration
const TEST_CONFIG = {
  benchmark: {
    name: "Test Benchmark",
    version: "1.0.0",
  },
  steps: {
    min: 1,
    max: 3,
    increment: 1,
  },
  agent: {
    sizes: ["small" as "small"],
    tokenCache: true,
    maxParallel: 1,
    tokenCacheEnabled: true,
    maxParallelAgents: 1,
  },
  metrics: {
    include: ["step_completion", "tool_accuracy", "token_efficiency", "safety_score", "trajectory_optimality"],
  },
  security: {
    level: "strict" as "strict",
    adversarialTests: ["code_injection", "prompt_leakage"],
  },
  execution: {
    processing: "sequential" as "sequential",
  },
};

// Test tasks
const TEST_TASKS = [
  {
    id: "test1",
    description: "Test task 1",
    prompt: "Test prompt 1",
    validationFn: (output: string) => true,
    language: "javascript",
    safetyCritical: false,
    stepDependencies: [
      {
        stepNumber: 1,
        requiredTools: ["code_editor"],
        maxTokens: 100,
      },
      {
        stepNumber: 2,
        requiredTools: ["code_executor"],
        maxTokens: 200,
      },
    ],
  },
];

// Test agent step
const TEST_STEP = {
  number: 1,
  duration: 100,
  tokenCount: 50,
  tools: [
    { name: "code_editor", success: true }
  ],
  toolsUsed: ["code_editor"], // For backward compatibility
  safetyFlags: [],
  output: "Test output",
};

Deno.test("AgenticMetricsCollector", async (t) => {
  await t.step("should track step performance", () => {
    const collector = new AgenticMetricsCollector();
    collector.trackStepPerformance(TEST_STEP);
    const metrics = collector.getMetrics();
    assertEquals(metrics.length, 1);
    assertEquals(metrics[0].stepNumber, 1);
    assertEquals(metrics[0].executionTime, 100);
    assertEquals(metrics[0].tokensUsed, 50);
  });
  
  await t.step("should calculate tool accuracy", () => {
    const collector = new AgenticMetricsCollector();
    collector.trackStepPerformance(TEST_STEP);
    assertEquals(collector.getMetrics()[0].toolAccuracy, 1.0);
  });
  
  await t.step("should calculate overall metrics", () => {
    const collector = new AgenticMetricsCollector();
    collector.trackStepPerformance(TEST_STEP);
    const metrics = collector.calculateOverallMetrics([TEST_STEP]);
    assertEquals(metrics.stepCompletion, 1.0);
    assertEquals(metrics.toolAccuracy, 1.0);
    assertNotEquals(metrics.tokenEfficiency, 0);
    assertNotEquals(metrics.trajectoryOptimality, 0);
  });
  
  await t.step("should clear metrics", () => {
    const collector = new AgenticMetricsCollector();
    collector.trackStepPerformance(TEST_STEP);
    collector.clearMetrics();
    const metrics = collector.getMetrics();
    assertEquals(metrics.length, 0);
  });
});

Deno.test("SecurityEvaluator", async (t) => {
  await t.step("should run adversarial tests", async () => {
    const evaluator = new SecurityEvaluator();
    const results = await evaluator.runAdversarialTests(["code_injection", "prompt_leakage"]);
    assertEquals(results.length, 2);
    assertEquals(results[0].testName, "code_injection");
    assertEquals(results[1].testName, "prompt_leakage");
  });
  
  await t.step("should calculate security score", async () => {
    const evaluator = new SecurityEvaluator();
    const results = await evaluator.runAdversarialTests(["code_injection"]);
    const score = evaluator.calculateSecurityScore(results);
    assertNotEquals(score, 0);
    assertTrue(score >= 0 && score <= 100);
  });
  
  await t.step("should set security level", () => {
    const evaluator = new SecurityEvaluator();
    evaluator.setSecurityLevel("moderate");
    assertEquals(evaluator.getSecurityLevel(), "moderate");
  });
});

Deno.test("AgenticEvaluator", async (t) => {
  await t.step("should create evaluator with config", () => {
    const evaluator = new AgenticEvaluator(TEST_CONFIG);
    assertEquals(evaluator.getConfig(), TEST_CONFIG);
  });
  
  await t.step("should set tasks", () => {
    const evaluator = new AgenticEvaluator(TEST_CONFIG);
    evaluator.setTasks(TEST_TASKS);
    assertEquals(evaluator.getTasks(), TEST_TASKS);
  });
  
  await t.step("should run suite", async () => {
    const evaluator = new AgenticEvaluator(TEST_CONFIG);
    evaluator.setTasks(TEST_TASKS);
    const results = await evaluator.runSuite(TEST_TASKS);
    assertEquals(results.length, 3); // 3 steps (min=1, max=3, increment=1) * 1 task * 1 agent size
    assertEquals(results[0].taskId, "test1"); 
    assertEquals(results[0].agentSize, "small");
  });
});

/**
 * Assert that a value is true
 * @param value Value to check
 */
function assertTrue(value: boolean): void {
  assertEquals(value, true);
}
