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
    // In a real implementation, this would compare the tools used with the required tools
    // For now, we'll simulate it with a random value between 0.7 and 1.0
    return 0.7 + Math.random() * 0.3;
  }
  
  /**
   * Calculate overall metrics
   * @param steps Agent steps
   * @returns Overall metrics
   */
  calculateOverallMetrics(steps: AgentStep[]): {
    toolAccuracy: number;
    tokenEfficiency: number;
    trajectoryOptimality: number;
  } {
    // Calculate tool accuracy
    const toolAccuracy = this.metrics.reduce((acc, m) => acc + m.toolAccuracy, 0) / this.metrics.length;
    
    // Calculate token efficiency (tokens per step)
    const totalTokens = this.metrics.reduce((acc, m) => acc + m.tokensUsed, 0);
    const tokenEfficiency = totalTokens / this.metrics.length;
    
    // Calculate trajectory optimality
    const trajectoryOptimality = this.calculateTrajectoryScore(steps);
    
    return {
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