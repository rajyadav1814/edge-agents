# Agentic Evaluator Implementation Plan

## Overview

The `agentic-evaluator.ts` file is responsible for coordinating the benchmarking process. It runs tasks, collects metrics, and applies statistical analysis to results. This component is the central orchestrator of the SPARC-Bench benchmarking suite.

## Requirements

1. Initialize and configure the benchmarking process
2. Run tasks with different agent configurations
3. Collect metrics during task execution
4. Apply statistical analysis to results
5. Support different processing modes (parallel, sequential, etc.)

## Implementation Details

### Imports and Dependencies

```typescript
import { AgenticBenchmarkConfig, BenchmarkTask, AgentStep, BenchmarkResult, AgentSize, StatisticalSignificance } from "../types/types.ts";
import { AgenticMetricsCollector } from "./metrics-collector.ts";
import { SecurityEvaluator } from "./security-evaluator.ts";
```

### Main Class

```typescript
/**
 * AgenticEvaluator - Coordinates the benchmarking process
 * 
 * This class is responsible for running tasks, collecting metrics,
 * and applying statistical analysis to results.
 */
export class AgenticEvaluator {
  /**
   * Configuration for the benchmarking process
   */
  private config: AgenticBenchmarkConfig;
  
  /**
   * Metrics collector
   */
  private metricsCollector: AgenticMetricsCollector;
  
  /**
   * Security evaluator
   */
  private securityEvaluator: SecurityEvaluator;
  
  /**
   * Creates a new AgenticEvaluator instance
   * 
   * @param config - Configuration for the benchmarking process
   */
  constructor(config: AgenticBenchmarkConfig) {
    this.config = config;
    this.metricsCollector = new AgenticMetricsCollector();
    this.securityEvaluator = new SecurityEvaluator({
      level: config.security.level,
      adversarialTests: config.security.adversarialTests
    });
  }
  
  /**
   * Runs the benchmarking suite
   * 
   * @param tasks - Tasks to run
   * @returns Promise<BenchmarkResult[]> - Results of the benchmarking
   */
  async runSuite(tasks: BenchmarkTask[]): Promise<BenchmarkResult[]> {
    const results: BenchmarkResult[] = [];
    
    // Generate step ranges
    const stepRanges = this.generateStepRanges();
    
    // Run tasks for each agent size and step range
    for (const size of this.config.agent.sizes) {
      for (const steps of stepRanges) {
        // Run tasks with the current configuration
        const taskResults = await this.runTasks(tasks, size, steps);
        results.push(...taskResults);
      }
    }
    
    // Apply statistical analysis
    const analyzedResults = this.applyStatisticalAnalysis(results);
    
    return analyzedResults;
  }
  
  /**
   * Generates step ranges based on the configuration
   * 
   * @returns number[] - Step ranges
   */
  private generateStepRanges(): number[] {
    const { min, max, increment } = this.config.steps;
    const ranges: number[] = [];
    
    for (let i = min; i <= max; i += increment) {
      ranges.push(i);
    }
    
    return ranges;
  }
  
  /**
   * Runs tasks with the specified configuration
   * 
   * @param tasks - Tasks to run
   * @param agentSize - Size of the agent
   * @param stepCount - Number of steps
   * @returns Promise<BenchmarkResult[]> - Results of the tasks
   */
  private async runTasks(tasks: BenchmarkTask[], agentSize: AgentSize, stepCount: number): Promise<BenchmarkResult[]> {
    const results: BenchmarkResult[] = [];
    
    // Determine processing mode
    switch (this.config.execution.processing) {
      case "parallel":
        // Run tasks in parallel
        const parallelResults = await Promise.all(
          tasks.map(task => this.runTask(task, agentSize, stepCount))
        );
        results.push(...parallelResults);
        break;
        
      case "sequential":
        // Run tasks sequentially
        for (const task of tasks) {
          const result = await this.runTask(task, agentSize, stepCount);
          results.push(result);
        }
        break;
        
      case "concurrent":
        // Run tasks concurrently with a limit
        const concurrentResults = await this.runTasksConcurrently(tasks, agentSize, stepCount);
        results.push(...concurrentResults);
        break;
        
      case "swarm":
        // Run tasks with a swarm of agents
        const swarmResults = await this.runTasksWithSwarm(tasks, agentSize, stepCount);
        results.push(...swarmResults);
        break;
        
      default:
        throw new Error(`Unknown processing mode: ${this.config.execution.processing}`);
    }
    
    return results;
  }
  
  /**
   * Runs a single task
   * 
   * @param task - Task to run
   * @param agentSize - Size of the agent
   * @param stepCount - Number of steps
   * @returns Promise<BenchmarkResult> - Result of the task
   */
  private async runTask(task: BenchmarkTask, agentSize: AgentSize, stepCount: number): Promise<BenchmarkResult> {
    console.log(`Running task ${task.id} with agent size ${agentSize} and ${stepCount} steps`);
    
    // Reset metrics collector
    this.metricsCollector = new AgenticMetricsCollector();
    
    // Start timing
    const startTime = performance.now();
    
    // Execute the task
    const steps: AgentStep[] = [];
    let success = false;
    let output = "";
    
    try {
      // This would be replaced with actual agent execution
      // For now, we'll simulate it
      for (let i = 0; i < stepCount; i++) {
        // Check if we should stop early based on dependencies
        if (i >= task.stepDependencies.length) {
          break;
        }
        
        // Create a step
        const step: AgentStep = {
          number: i + 1,
          duration: Math.random() * 1000 + 500, // Random duration between 500-1500ms
          tokenCount: Math.random() * 1000 + 500, // Random token count between 500-1500
          tools: task.stepDependencies[i].requiredTools.map(tool => ({
            name: tool,
            success: Math.random() > 0.1 // 90% success rate
          })),
          safetyFlags: Math.random() > 0.9 ? ["potential_harmful_output"] : [] // 10% chance of safety flag
        };
        
        // Track step performance
        this.metricsCollector.trackStepPerformance(step);
        
        // Add step to the list
        steps.push(step);
      }
      
      // Generate output
      output = `Task ${task.id} completed successfully`;
      
      // Check if the output is valid
      success = task.validationFn(output);
    } catch (error) {
      console.error(`Error running task ${task.id}:`, error);
      output = `Error: ${error.message}`;
      success = false;
    }
    
    // End timing
    const endTime = performance.now();
    const executionTime = endTime - startTime;
    
    // Calculate metrics
    const metrics = this.metricsCollector.calculateOverallMetrics(steps);
    
    // Run security evaluation if enabled
    let security = undefined;
    if (this.config.security.adversarialTests.length > 0) {
      const securityResults = await this.securityEvaluator.runAdversarialTests();
      const securityScore = this.securityEvaluator.calculateSecurityScore(securityResults);
      security = {
        securityScore,
        testResults: securityResults
      };
    }
    
    // Create result
    const result: BenchmarkResult = {
      taskId: task.id,
      agentSize,
      stepCount,
      stepsCompleted: steps.length,
      tokensUsed: steps.reduce((sum, step) => sum + step.tokenCount, 0),
      executionTime,
      success,
      metrics,
      security
    };
    
    return result;
  }
  
  /**
   * Runs tasks concurrently with a limit
   * 
   * @param tasks - Tasks to run
   * @param agentSize - Size of the agent
   * @param stepCount - Number of steps
   * @returns Promise<BenchmarkResult[]> - Results of the tasks
   */
  private async runTasksConcurrently(tasks: BenchmarkTask[], agentSize: AgentSize, stepCount: number): Promise<BenchmarkResult[]> {
    const results: BenchmarkResult[] = [];
    const maxConcurrent = this.config.agent.maxParallelAgents;
    
    // Process tasks in chunks
    for (let i = 0; i < tasks.length; i += maxConcurrent) {
      const chunk = tasks.slice(i, i + maxConcurrent);
      const chunkResults = await Promise.all(
        chunk.map(task => this.runTask(task, agentSize, stepCount))
      );
      results.push(...chunkResults);
    }
    
    return results;
  }
  
  /**
   * Runs tasks with a swarm of agents
   * 
   * @param tasks - Tasks to run
   * @param agentSize - Size of the agent
   * @param stepCount - Number of steps
   * @returns Promise<BenchmarkResult[]> - Results of the tasks
   */
  private async runTasksWithSwarm(tasks: BenchmarkTask[], agentSize: AgentSize, stepCount: number): Promise<BenchmarkResult[]> {
    // This would be a more complex implementation that coordinates multiple agents
    // For now, we'll just use the concurrent implementation
    return this.runTasksConcurrently(tasks, agentSize, stepCount);
  }
  
  /**
   * Applies statistical analysis to results
   * 
   * @param results - Results to analyze
   * @returns BenchmarkResult[] - Analyzed results
   */
  private applyStatisticalAnalysis(results: BenchmarkResult[]): BenchmarkResult[] {
    // Group results by task and agent size
    const groupedResults = new Map<string, BenchmarkResult[]>();
    
    for (const result of results) {
      const key = `${result.taskId}-${result.agentSize}`;
      if (!groupedResults.has(key)) {
        groupedResults.set(key, []);
      }
      groupedResults.get(key)!.push(result);
    }
    
    // Apply statistical analysis to each group
    const analyzedResults: BenchmarkResult[] = [];
    
    for (const groupResults of groupedResults.values()) {
      // Sort by step count
      groupResults.sort((a, b) => a.stepCount - b.stepCount);
      
      // Calculate statistical significance
      for (let i = 1; i < groupResults.length; i++) {
        const prevResult = groupResults[i - 1];
        const currResult = groupResults[i];
        
        // Calculate Wilcoxon signed-rank test
        // This is a simplified version
        const wilcoxonPValue = this.calculateWilcoxonPValue(prevResult, currResult);
        const effectSize = this.calculateEffectSize(prevResult, currResult);
        
        currResult.statistics = {
          wilcoxonPValue,
          effectSize
        };
      }
      
      analyzedResults.push(...groupResults);
    }
    
    return analyzedResults;
  }
  
  /**
   * Calculates the p-value for the Wilcoxon signed-rank test
   * 
   * @param prevResult - Previous result
   * @param currResult - Current result
   * @returns number - P-value
   */
  private calculateWilcoxonPValue(prevResult: BenchmarkResult, currResult: BenchmarkResult): number {
    // This would be a proper implementation of the Wilcoxon signed-rank test
    // For now, we'll just return a random value
    return Math.random() * 0.1; // Random p-value between 0 and 0.1
  }
  
  /**
   * Calculates the effect size
   * 
   * @param prevResult - Previous result
   * @param currResult - Current result
   * @returns number - Effect size
   */
  private calculateEffectSize(prevResult: BenchmarkResult, currResult: BenchmarkResult): number {
    // This would be a proper implementation of the effect size calculation
    // For now, we'll just return a random value
    return Math.random() * 0.5 + 0.3; // Random effect size between 0.3 and 0.8
  }
}
```

### Helper Functions

```typescript
/**
 * Creates a new AgenticEvaluator with the specified configuration
 * 
 * @param config - Configuration for the benchmarking process
 * @returns AgenticEvaluator - The evaluator
 */
export function createEvaluator(config: AgenticBenchmarkConfig): AgenticEvaluator {
  return new AgenticEvaluator(config);
}
```

## Testing

The `AgenticEvaluator` should be tested to ensure it correctly runs tasks and collects metrics:

```typescript
Deno.test("AgenticEvaluator - generateStepRanges", () => {
  const config: AgenticBenchmarkConfig = {
    benchmark: { name: "Test", version: "1.0.0" },
    steps: { min: 1, max: 5, increment: 2 },
    agent: { sizes: ["small"], tokenCacheEnabled: false, maxParallelAgents: 1 },
    metrics: { include: [] },
    security: { level: "strict", adversarialTests: [] },
    execution: { processing: "sequential" }
  };
  
  const evaluator = new AgenticEvaluator(config);
  const ranges = evaluator["generateStepRanges"](); // Access private method for testing
  
  assertEquals(ranges, [1, 3, 5]);
});

Deno.test("AgenticEvaluator - runTask", async () => {
  const config: AgenticBenchmarkConfig = {
    benchmark: { name: "Test", version: "1.0.0" },
    steps: { min: 1, max: 5, increment: 2 },
    agent: { sizes: ["small"], tokenCacheEnabled: false, maxParallelAgents: 1 },
    metrics: { include: [] },
    security: { level: "strict", adversarialTests: [] },
    execution: { processing: "sequential" }
  };
  
  const task: BenchmarkTask = {
    id: "test-task",
    description: "Test task",
    prompt: "Test prompt",
    validationFn: () => true,
    language: "javascript",
    safetyCritical: false,
    stepDependencies: [
      { stepNumber: 1, requiredTools: ["read_file"], maxTokens: 1000 },
      { stepNumber: 2, requiredTools: ["write_file"], maxTokens: 1000 }
    ]
  };
  
  const evaluator = new AgenticEvaluator(config);
  const result = await evaluator["runTask"](task, "small", 2); // Access private method for testing
  
  assertEquals(result.taskId, "test-task");
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
  
  const tasks: BenchmarkTask[] = [
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
  
  const evaluator = new AgenticEvaluator(config);
  const results = await evaluator.runSuite(tasks);
  
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
```

## Integration

The `AgenticEvaluator` will be used by the main entry point (`sparc-bench.ts`) to run the benchmarking suite. It will be initialized with the configuration loaded by the `ConfigParser` and will run the tasks specified by the user.