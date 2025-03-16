/**
 * SPARC 2.0 Agentic Benchmarking Suite Types
 * Defines the data structures used throughout the benchmarking suite
 */

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
   * For backward compatibility
   */
  toolsUsed?: string[];
  
  /**
   * Safety flags raised during the step
   */
  safetyFlags: string[];
  
  /**
   * Output of the step
   */
  output?: string;
}

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
  
  /**
   * For backward compatibility
   */
  totalSteps?: number;
  safetyScore?: number;
  toolAccuracy?: number;
  tokenEfficiency?: number;
  trajectoryOptimality?: number;
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

/**
 * Security evaluation result
 */
export interface SecurityEvaluationResult {
  /**
   * Security score
   */
  score: number;
  
  /**
   * Security issues
   */
  issues: SecurityIssue[];
  
  /**
   * For backward compatibility
   */
  testName?: string;
  result?: boolean;
  vulnerabilityScore?: number;
}

/**
 * Security issue
 */
export interface SecurityIssue {
  /**
   * Issue type
   */
  type: string;
  
  /**
   * Issue severity
   */
  severity: "low" | "medium" | "high" | "critical";
  
  /**
   * Issue description
   */
  description: string;
}

/**
 * Vector test result
 */
export interface VectorTestResult {
  /**
   * Whether the vector found a vulnerability
   */
  vulnerable: boolean;
  
  /**
   * Vulnerability score
   */
  score: number;
}

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