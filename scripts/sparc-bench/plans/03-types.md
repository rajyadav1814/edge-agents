# Types Implementation Plan

## Overview

The `types.ts` file defines the data structures used throughout the SPARC-Bench benchmarking suite. It includes interfaces for configuration, tasks, steps, results, and other components of the system.

## Requirements

1. Define interfaces for configuration objects
2. Define interfaces for benchmark tasks and steps
3. Define interfaces for metrics and results
4. Define interfaces for security evaluation
5. Define utility types and enums

## Implementation Details

### Configuration Interfaces

```typescript
/**
 * Configuration for the benchmarking suite
 */
export interface AgenticBenchmarkConfig {
  /**
   * Benchmark name and version
   */
  benchmark: {
    name: string;
    version: string;
  };
  
  /**
   * Step configuration
   */
  steps: {
    min: number;
    max: number;
    increment: number;
  };
  
  /**
   * Agent configuration
   */
  agent: {
    sizes: AgentSize[];
    tokenCacheEnabled: boolean;
    maxParallelAgents: number;
  };
  
  /**
   * Metrics configuration
   */
  metrics: {
    include: string[];
  };
  
  /**
   * Security configuration
   */
  security: {
    level: SecurityLevel;
    adversarialTests: string[];
  };
}

/**
 * Agent size options
 */
export type AgentSize = "small" | "medium" | "large";

/**
 * Security level options
 */
export type SecurityLevel = "strict" | "moderate" | "permissive";

/**
 * Output format options
 */
export type OutputFormat = "table" | "json" | "csv" | "github-annotation";

/**
 * CLI options
 */
export interface CliOptions {
  config: string;
  output: OutputFormat;
  security: SecurityLevel;
  steps: number[];
  agentSize?: AgentSize;
  tokenCache?: boolean;
}
```

### Benchmark Task Interfaces

```typescript
/**
 * Benchmark task definition
 */
export interface BenchmarkTask {
  /**
   * Unique identifier for the task
   */
  id: string;
  
  /**
   * Human-readable description of the task
   */
  description: string;
  
  /**
   * Prompt to send to the agent
   */
  prompt: string;
  
  /**
   * Function to validate the agent's output
   */
  validationFn: (output: string) => boolean;
  
  /**
   * Programming language for the task
   */
  language: string;
  
  /**
   * Whether the task is safety-critical
   */
  safetyCritical: boolean;
  
  /**
   * Dependencies between steps
   */
  stepDependencies: StepDependency[];
}

/**
 * Step dependency definition
 */
export interface StepDependency {
  /**
   * Step number
   */
  stepNumber: number;
  
  /**
   * Required tools for the step
   */
  requiredTools: string[];
  
  /**
   * Maximum tokens allowed for the step
   */
  maxTokens: number;
}

/**
 * Agent step definition
 */
export interface AgentStep {
  /**
   * Step number
   */
  number: number;
  
  /**
   * Duration of the step in milliseconds
   */
  duration: number;
  
  /**
   * Number of tokens used in the step
   */
  tokenCount: number;
  
  /**
   * Tools used in the step
   */
  tools?: {
    name: string;
    success: boolean;
  }[];
  
  /**
   * Safety flags raised during the step
   */
  safetyFlags: string[];
  
  /**
   * Output of the step
   */
  output?: string;
}
```

### Metrics and Results Interfaces

```typescript
/**
 * Benchmark result
 */
export interface BenchmarkResult {
  /**
   * Task ID
   */
  taskId: string;
  
  /**
   * Agent size
   */
  agentSize: AgentSize;
  
  /**
   * Number of steps
   */
  stepCount: number;
  
  /**
   * Steps completed
   */
  stepsCompleted: number;
  
  /**
   * Total tokens used
   */
  tokensUsed: number;
  
  /**
   * Total execution time in milliseconds
   */
  executionTime: number;
  
  /**
   * Whether the task was completed successfully
   */
  success: boolean;
  
  /**
   * Metrics for the task
   */
  metrics: BenchmarkMetrics;
  
  /**
   * Security results
   */
  security?: SecurityResults;
  
  /**
   * Statistical significance
   */
  statistics?: StatisticalSignificance;
}

/**
 * Benchmark metrics
 */
export interface BenchmarkMetrics {
  /**
   * Percentage of steps completed
   */
  stepCompletion: number;
  
  /**
   * Accuracy of tool usage
   */
  toolAccuracy: number;
  
  /**
   * Token efficiency (tokens per step)
   */
  tokenEfficiency: number;
  
  /**
   * Safety score
   */
  safetyScore?: number;
  
  /**
   * Trajectory optimality
   */
  trajectoryOptimality: number;
}

/**
 * Security results
 */
export interface SecurityResults {
  /**
   * Overall security score
   */
  securityScore: number;
  
  /**
   * Results of individual tests
   */
  testResults: AdversarialTestResult[];
}

/**
 * Adversarial test result
 */
export interface AdversarialTestResult {
  /**
   * Test name
   */
  testName: string;
  
  /**
   * Whether the test found a vulnerability
   */
  result: boolean;
  
  /**
   * Vulnerability score (0-100, higher is more vulnerable)
   */
  vulnerabilityScore: number;
  
  /**
   * Additional details about the test
   */
  details?: string;
}

/**
 * Statistical significance
 */
export interface StatisticalSignificance {
  /**
   * P-value from Wilcoxon signed-rank test
   */
  wilcoxonPValue: number;
  
  /**
   * Effect size
   */
  effectSize: number;
}
```

### Utility Types

```typescript
/**
 * Function to calculate trajectory score
 */
export type TrajectoryScoreFunction = (steps: AgentStep[]) => number;

/**
 * Function to calculate tool accuracy
 */
export type ToolAccuracyFunction = (step: AgentStep) => number;

/**
 * Function to render benchmark results
 */
export type ResultRenderer = (results: BenchmarkResult[], format: OutputFormat) => string;
```

## Usage Examples

### Configuration Example

```typescript
const config: AgenticBenchmarkConfig = {
  benchmark: {
    name: "SPARC 2.0 Agentic Suite",
    version: "2.3.1"
  },
  steps: {
    min: 1,
    max: 10,
    increment: 2
  },
  agent: {
    sizes: ["small", "medium", "large"],
    tokenCacheEnabled: true,
    maxParallelAgents: 5
  },
  metrics: {
    include: [
      "step_completion",
      "tool_accuracy",
      "token_efficiency",
      "safety_score",
      "trajectory_optimality"
    ]
  },
  security: {
    level: "strict",
    adversarialTests: ["code_injection", "prompt_leakage"]
  }
};
```

### Task Example

```typescript
const task: BenchmarkTask = {
  id: "fix-multiply-bug",
  description: "Fix a bug in the multiply function",
  prompt: "The multiply function has a bug. It's adding instead of multiplying. Fix it.",
  validationFn: (output: string) => output.includes("return a * b"),
  language: "javascript",
  safetyCritical: false,
  stepDependencies: [
    {
      stepNumber: 1,
      requiredTools: ["read_file"],
      maxTokens: 1000
    },
    {
      stepNumber: 2,
      requiredTools: ["apply_diff"],
      maxTokens: 1500
    }
  ]
};
```

### Result Example

```typescript
const result: BenchmarkResult = {
  taskId: "fix-multiply-bug",
  agentSize: "medium",
  stepCount: 3,
  stepsCompleted: 3,
  tokensUsed: 2500,
  executionTime: 1200,
  success: true,
  metrics: {
    stepCompletion: 1.0,
    toolAccuracy: 0.95,
    tokenEfficiency: 833.33,
    trajectoryOptimality: 0.87
  },
  security: {
    securityScore: 95,
    testResults: [
      {
        testName: "code_injection",
        result: false,
        vulnerabilityScore: 5,
        details: "No code injection vulnerabilities found"
      },
      {
        testName: "prompt_leakage",
        result: false,
        vulnerabilityScore: 5,
        details: "No prompt leakage vulnerabilities found"
      }
    ]
  },
  statistics: {
    wilcoxonPValue: 0.032,
    effectSize: 0.45
  }
};
```

## Integration

The types defined in this file will be used throughout the SPARC-Bench benchmarking suite. They provide a common language for all components to communicate and ensure type safety across the codebase.