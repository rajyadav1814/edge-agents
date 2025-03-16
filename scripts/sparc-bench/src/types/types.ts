/**
 * Core types for SPARC-Bench
 * 
 * This file defines the core types used throughout the SPARC-Bench benchmarking suite.
 */

/**
 * Agent size options
 */
export type AgentSize = "small" | "medium" | "large";

/**
 * Security level options
 */
export type SecurityLevel = "strict" | "moderate" | "permissive";

/**
 * Processing mode options
 */
export type ProcessingMode = "parallel" | "sequential" | "concurrent" | "swarm";

/**
 * Benchmark configuration
 */
export interface AgenticBenchmarkConfig {
  benchmark: {
    name: string;
    version: string;
  };
  steps: {
    min: number;
    max: number;
    increment: number;
  };
  agent: {
    sizes: AgentSize[];
    tokenCacheEnabled: boolean;
    maxParallelAgents: number;
    // For backward compatibility
    tokenCache?: boolean;
    maxParallel?: number;
  };
  metrics: {
    include: string[];
  };
  security: {
    level: SecurityLevel;
    adversarialTests: string[];
  };
  execution: {
    processing: ProcessingMode;
  };
}

/**
 * Benchmark task
 */
export interface BenchmarkTask {
  id: string;
  description: string;
  prompt: string;
  validationFn: (output: string) => boolean;
  language: string;
  safetyCritical: boolean;
  stepDependencies: StepDependency[];
}

/**
 * Step dependency
 */
export interface StepDependency {
  stepNumber: number;
  requiredTools: string[];
  maxTokens: number;
}

/**
 * Agent step
 */
export interface AgentStep {
  number: number;
  duration: number;
  tokenCount: number;
  tools: ToolUsage[];
  safetyFlags: string[];
  output?: string;
  toolsUsed?: string[]; // For backward compatibility
}

/**
 * Tool usage
 */
export interface ToolUsage {
  name: string;
  success: boolean;
}

/**
 * Benchmark result
 */
export interface BenchmarkResult {
  taskId: string;
  agentSize: AgentSize;
  stepCount: number;
  stepsCompleted: number;
  tokensUsed: number;
  executionTime: number;
  success: boolean;
  metrics: BenchmarkMetrics;
  security?: SecurityResult;
  statistics?: StatisticalSignificance;
  
  // For backward compatibility
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
  stepCompletion: number;
  toolAccuracy: number;
  tokenEfficiency: number;
  trajectoryOptimality: number;
}

/**
 * Security result
 */
export interface SecurityResult {
  securityScore: number;
  testResults: AdversarialTestResult[];
}

/**
 * Security evaluation result
 */
export interface SecurityEvaluationResult {
  score: number;
  issues: SecurityIssue[];
  // For backward compatibility with AdversarialTestResult
  testName?: string;
  result?: boolean;
  vulnerabilityScore?: number;
}

/**
 * Security issue
 */
export interface SecurityIssue {
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  location?: string;
}

/**
 * Adversarial test result
 */
export interface AdversarialTestResult {
  testName: string;
  result: boolean;
  vulnerabilityScore: number;
}

/**
 * Statistical significance
 */
export interface StatisticalSignificance {
  wilcoxonPValue: number;
  effectSize: number;
}

/**
 * Vector test result
 */
export interface VectorTestResult {
  vulnerable: boolean;
  score: number;
}