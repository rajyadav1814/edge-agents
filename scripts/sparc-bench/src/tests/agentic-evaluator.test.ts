/**
 * Tests for the AgenticEvaluator module
 * 
 * This file contains tests for the AgenticEvaluator class and related functions.
 */

import { assertEquals, assert } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { AgenticEvaluator, createEvaluator } from "../metrics/agentic-evaluator.ts";
import { AgenticBenchmarkConfig, BenchmarkTask } from "../types/types.ts";

// Test data
const TEST_CONFIG: AgenticBenchmarkConfig = {
  benchmark: { name: "Test", version: "1.0.0" },
  steps: { min: 1, max: 5, increment: 2 },
  agent: { sizes: ["small"], tokenCacheEnabled: false, maxParallelAgents: 1 },
  metrics: { include: [] },
  security: { level: "strict", adversarialTests: [] },
  execution: { processing: "sequential" }
};

const TEST_TASKS: BenchmarkTask[] = [
  {
    id: "test-task-1",
    description: "Test task 1",
    prompt: "Test prompt 1",
    validationFn: () => true,
    language: "javascript",
    safetyCritical: false,
    stepDependencies: [
      { stepNumber: 1, requiredTools: ["read_file"], maxTokens: 1000 },
      { stepNumber: 2, requiredTools: ["write_file"], maxTokens: 1000 }
    ]
  },
  {
    id: "test-task-2",
    description: "Test task 2",
    prompt: "Test prompt 2",
    validationFn: () => true,
    language: "javascript",
    safetyCritical: false,
    stepDependencies: [
      { stepNumber: 1, requiredTools: ["read_file"], maxTokens: 1000 },
      { stepNumber: 2, requiredTools: ["write_file"], maxTokens: 1000 }
    ]
  }
];

/**
 * Tests for the AgenticEvaluator class
 */
Deno.test("AgenticEvaluator - generateStepRanges", () => {
  const evaluator = new AgenticEvaluator(TEST_CONFIG);
  const ranges = evaluator["generateStepRanges"](); // Access private method for testing
  
  assertEquals(ranges, [1, 3, 5]);
});

Deno.test("AgenticEvaluator - runTask", async () => {
  const evaluator = new AgenticEvaluator(TEST_CONFIG);
  const task = TEST_TASKS[0];
  const result = await evaluator["runTask"](task, "small", 2); // Access private method for testing
  
  assertEquals(result.taskId, "test-task-1");
  assertEquals(result.agentSize, "small");
  assertEquals(result.stepCount, 2);
  assertEquals(result.stepsCompleted, 2);
  assert(result.tokensUsed > 0);
  assert(result.executionTime > 0);
  assertEquals(result.success, true);
  assert(result.metrics.stepCompletion > 0);
});

Deno.test("AgenticEvaluator - runSuite", async () => {
  const config: AgenticBenchmarkConfig = {
    benchmark: { name: "Test", version: "1.0.0" },
    steps: { min: 1, max: 3, increment: 2 },
    agent: { sizes: ["small", "medium"], tokenCacheEnabled: false, maxParallelAgents: 1 },
    metrics: { include: [] },
    security: { level: "strict", adversarialTests: [] },
    execution: { processing: "sequential" }
  };
  
  const evaluator = new AgenticEvaluator(config);
  evaluator.setTasks(TEST_TASKS);
  const results = await evaluator.runSuite();
  
  // 2 tasks * 2 agent sizes * 2 step ranges = 8 results
  assertEquals(results.length, 8);
  
  // Check that all combinations are present
  const combinations = new Set<string>();
  for (const result of results) {
    combinations.add(`${result.taskId}-${result.agentSize}-${result.stepCount}`);
  }
  
  assertEquals(combinations.size, 8);
  assert(combinations.has("test-task-1-small-1"));
  assert(combinations.has("test-task-1-small-3"));
  assert(combinations.has("test-task-1-medium-1"));
  assert(combinations.has("test-task-1-medium-3"));
  assert(combinations.has("test-task-2-small-1"));
  assert(combinations.has("test-task-2-small-3"));
  assert(combinations.has("test-task-2-medium-1"));
  assert(combinations.has("test-task-2-medium-3"));
});

Deno.test("AgenticEvaluator - createEvaluator helper function", () => {
  const evaluator = createEvaluator(TEST_CONFIG);
  
  assert(evaluator instanceof AgenticEvaluator);
  assertEquals(evaluator.getConfig(), TEST_CONFIG);
});

Deno.test("AgenticEvaluator - different processing modes", async () => {
  // Test sequential mode
  const sequentialConfig: AgenticBenchmarkConfig = { 
    ...TEST_CONFIG, 
    execution: { processing: "sequential" } 
  };
  const sequentialEvaluator = new AgenticEvaluator(sequentialConfig);
  const sequentialResults = await sequentialEvaluator.runSuite(TEST_TASKS.slice(0, 1));
  assertEquals(sequentialResults.length, 3); // 1 task * 1 agent size * 3 step ranges
  
  // Test parallel mode
  const parallelConfig: AgenticBenchmarkConfig = { 
    ...TEST_CONFIG, 
    execution: { processing: "parallel" } 
  };
  const parallelEvaluator = new AgenticEvaluator(parallelConfig);
  const parallelResults = await parallelEvaluator.runSuite(TEST_TASKS.slice(0, 1));
  assertEquals(parallelResults.length, 3); // 1 task * 1 agent size * 3 step ranges
  
  // Test concurrent mode
  const concurrentConfig: AgenticBenchmarkConfig = { 
    ...TEST_CONFIG, 
    execution: { processing: "concurrent" },
    agent: { ...TEST_CONFIG.agent, maxParallelAgents: 2 }
  };
  const concurrentEvaluator = new AgenticEvaluator(concurrentConfig);
  const concurrentResults = await concurrentEvaluator.runSuite(TEST_TASKS);
  assertEquals(concurrentResults.length, 6); // 2 tasks * 1 agent size * 3 step ranges
  
  // Test swarm mode
  const swarmConfig: AgenticBenchmarkConfig = { 
    ...TEST_CONFIG, 
    execution: { processing: "swarm" } 
  };
  const swarmEvaluator = new AgenticEvaluator(swarmConfig);
  const swarmResults = await swarmEvaluator.runSuite(TEST_TASKS.slice(0, 1));
  assertEquals(swarmResults.length, 3); // 1 task * 1 agent size * 3 step ranges
});