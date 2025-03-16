/**
 * SPARC 2.0 Agentic Benchmarking Suite Metrics Collector
 * Collects and calculates metrics for agent performance
 */

import { AgentStep } from "../types/types.ts";

/**
 * Metrics collector class
 * Collects and calculates metrics for agent performance
 */
export class AgenticMetricsCollector {
  private metrics: {
    stepNumber: number;
    executionTime: number;
    tokensUsed: number;
    toolAccuracy: number;
    safetyIncidents: number;
  }[] = [];
  
  /**
   * Clear metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }
  
  /**
   * Track step performance
   * @param step Agent step
   */
  trackStepPerformance(step: AgentStep): void {
    this.metrics.push({
      stepNumber: step.number,
      executionTime: step.duration,
      tokensUsed: step.tokenCount,
      toolAccuracy: this.calculateToolAccuracy(step),
      safetyIncidents: step.safetyFlags.length,
    });
  }
  
  /**
   * Calculate tool accuracy
   * @param step Agent step
   * @returns Tool accuracy
   */
  private calculateToolAccuracy(step: AgentStep): number {
    // Handle both new format (tools) and old format (toolsUsed) for backward compatibility
    if (step.tools && step.tools.length > 0) {
      // Calculate the ratio of successful tools to total tools using the new format
      const successfulTools = step.tools.filter(tool => tool.success).length;
      const totalTools = step.tools.length;
      return successfulTools / totalTools;
    } else if (step.toolsUsed && step.toolsUsed.length > 0) {
      // For backward compatibility, if using toolsUsed, assume all tools were successful
      return 1.0;
    } else {
      // If no tools were used (in either format), accuracy is 100%
      return 1.0; // If no tools were used, accuracy is 100%
    }
  }
  
  /**
   * Calculate overall metrics
   * @param steps Agent steps
   * @returns Overall metrics
   */
  calculateOverallMetrics(steps: AgentStep[]): {
    stepCompletion: number;
    toolAccuracy: number;
    tokenEfficiency: number;
    trajectoryOptimality: number;
  } {
    // Calculate step completion (completed steps / total steps)
    const stepCompletion = this.metrics.length / steps.length;
    // Calculate tool accuracy
    const toolAccuracy = this.metrics.reduce((acc, m) => acc + m.toolAccuracy, 0) / this.metrics.length;
    
    // Calculate token efficiency (tokens per step)
    const totalTokens = this.metrics.reduce((acc, m) => acc + m.tokensUsed, 0);
    const tokenEfficiency = totalTokens / this.metrics.length;
    
    // Calculate trajectory optimality
    const trajectoryOptimality = this.calculateTrajectoryScore(steps);
    
    return {
      stepCompletion,
      toolAccuracy,
      tokenEfficiency,
      trajectoryOptimality,
    };
  }
  
  /**
   * Calculate trajectory score
   * @param steps Agent steps
   * @returns Trajectory score
   */
  private calculateTrajectoryScore(steps: AgentStep[]): number {
    // In a real implementation, this would compare the agent's path with an optimal path
    // For now, we'll simulate it with a random value between 0.6 and 1.0
    return 0.6 + Math.random() * 0.4;
  }
  
  /**
   * Get metrics
   * @returns Metrics
   */
  getMetrics(): {
    stepNumber: number;
    executionTime: number;
    tokensUsed: number;
    toolAccuracy: number;
    safetyIncidents: number;
  }[] {
    return this.metrics;
  }
}