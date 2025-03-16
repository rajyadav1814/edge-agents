# Metrics Collector Implementation Plan

## Overview

The `metrics-collector.ts` file is responsible for collecting and calculating metrics for agent performance during benchmarking. It tracks various metrics such as execution time, token usage, tool accuracy, and trajectory optimality.

## Current Implementation

The current implementation includes:

- A `AgenticMetricsCollector` class that collects metrics for each step of agent execution
- Methods for tracking step performance
- Methods for calculating overall metrics
- Methods for calculating tool accuracy and trajectory scores

However, it is missing the `stepCompletion` metric that is referenced in the benchmark tests.

## Required Changes

1. Add the `stepCompletion` metric to the `calculateOverallMetrics` method
2. Ensure the `stepCompletion` metric is properly calculated based on the number of completed steps vs. total steps

## Implementation Details

### Data Structures

```typescript
private metrics: {
  stepNumber: number;
  executionTime: number;
  tokensUsed: number;
  toolAccuracy: number;
  safetyIncidents: number;
}[] = [];
```

### Methods

#### trackStepPerformance

```typescript
trackStepPerformance(step: AgentStep): void {
  this.metrics.push({
    stepNumber: step.number,
    executionTime: step.duration,
    tokensUsed: step.tokenCount,
    toolAccuracy: this.calculateToolAccuracy(step),
    safetyIncidents: step.safetyFlags.length,
  });
}
```

#### calculateOverallMetrics

```typescript
calculateOverallMetrics(steps: AgentStep[]): {
  stepCompletion: number;  // Add this metric
  toolAccuracy: number;
  tokenEfficiency: number;
  trajectoryOptimality: number;
} {
  // Calculate step completion (completed steps / total steps)
  const completedSteps = this.metrics.length;
  const totalSteps = steps.length;
  const stepCompletion = completedSteps / totalSteps;
  
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
```

## Testing

The `calculateOverallMetrics` method should be tested to ensure it correctly calculates the `stepCompletion` metric:

```typescript
Deno.test("MetricsCollector - calculateOverallMetrics includes stepCompletion", () => {
  const collector = new AgenticMetricsCollector();
  
  // Create mock steps
  const steps = [
    { number: 1, duration: 100, tokenCount: 50, safetyFlags: [] },
    { number: 2, duration: 150, tokenCount: 75, safetyFlags: [] },
    { number: 3, duration: 200, tokenCount: 100, safetyFlags: [] },
  ];
  
  // Track performance for the first two steps only
  collector.trackStepPerformance(steps[0]);
  collector.trackStepPerformance(steps[1]);
  
  // Calculate overall metrics
  const metrics = collector.calculateOverallMetrics(steps);
  
  // Assert that stepCompletion is 2/3 = 0.6667
  assertEquals(metrics.stepCompletion, 2/3);
});
```

## Integration

The `stepCompletion` metric will be used by the `AgenticEvaluator` to determine how well an agent is performing in terms of completing all required steps. It will also be displayed in the benchmark results by the `Renderer`.