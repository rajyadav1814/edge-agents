/**
 * SPARC 2.0 Agentic Benchmarking Suite Evaluator
 * Coordinates the benchmarking process
 */

import { AgenticBenchmarkConfig, BenchmarkTask, AgentStep, BenchmarkResult, AgentSize, StatisticalSignificance } from "../types/types.ts";
import { AgenticMetricsCollector } from "./metrics-collector.ts";
import { SecurityEvaluator } from "./security-evaluator.ts";

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
   * Tasks to run
   */
  private tasks: BenchmarkTask[] = [];
  
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
   * Gets the configuration
   * 
   * @returns AgenticBenchmarkConfig - The configuration
   */
  getConfig(): AgenticBenchmarkConfig {
    return this.config;
  }
  
  /**
   * Sets the tasks to run
   * 
   * @param tasks - Tasks to run
   */
  setTasks(tasks: BenchmarkTask[]): void {
    this.tasks = tasks;
  }
  
  /**
   * Runs the benchmarking suite
   * 
   * @param tasks - Tasks to run
   * @returns Promise<BenchmarkResult[]> - Results of the benchmarking
   */
  async runSuite(tasks?: BenchmarkTask[]): Promise<BenchmarkResult[]> {
    const results: BenchmarkResult[] = [];

    // Use provided tasks or fall back to stored tasks
    const tasksToRun = tasks && tasks.length > 0 
      ? tasks 
      : this.tasks;
    
    // Generate step ranges
    const stepRanges = this.generateStepRanges();
    
    // Run tasks for each agent size and step range
    for (const size of this.config.agent.sizes) {
      for (const steps of stepRanges) {
        // Run tasksToRun with the current configuration
        const taskResults = await this.runTasks(tasksToRun, size, steps);
        results.push(...taskResults);
      }
    }
    
    // Apply statistical analysis
    const analyzedResults = this.applyStatisticalAnalysis(results);
    
    return analyzedResults;
  }
  
  /**
   * Gets the tasks
   * 
   * @returns BenchmarkTask[] - The tasks
   */
  getTasks(): BenchmarkTask[] {
    return this.tasks;
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
    
    // Default to sequential processing
    let processingMode = "sequential";
    
    // Check if execution config is provided
    if (this.config.execution && this.config.execution.processing) {
      processingMode = this.config.execution.processing;
    }
    
    // Process based on mode
    switch (processingMode) {
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
        throw new Error(`Unknown processing mode: ${processingMode}`);
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
      output = `Error: ${error instanceof Error ? error.message : String(error)}`;
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
      const securityResults = await this.securityEvaluator.runAdversarialTests(this.config.security.adversarialTests);
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

/**
 * Creates a new AgenticEvaluator with the specified configuration
 * 
 * @param config - Configuration for the benchmarking process
 * @returns AgenticEvaluator - The evaluator
 */
export function createEvaluator(config: AgenticBenchmarkConfig): AgenticEvaluator {
  return new AgenticEvaluator(config);
}
