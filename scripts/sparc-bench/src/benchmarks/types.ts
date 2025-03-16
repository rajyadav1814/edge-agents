/**
 * Benchmark Types
 * 
 * This file defines the types used for benchmarking SPARC 2.0 performance
 * across different benchmark suites.
 */

/**
 * Supported benchmark types
 */
export type BenchmarkType = "humaneval" | "swebench" | "redcode";

/**
 * Benchmark configuration
 */
export interface BenchmarkConfig {
  /** Type of benchmark */
  type: BenchmarkType;
  /** Name of the benchmark */
  name: string;
  /** Description of the benchmark */
  description: string;
  /** Test cases for the benchmark */
  testCases: TestCase[];
}

/**
 * Test case for a benchmark
 */
export interface TestCase {
  /** Unique identifier for the test case */
  id: string;
  /** Input code or data for the test */
  input: string;
  /** Expected output from the test */
  expectedOutput: string;
  /** Optional timeout in milliseconds */
  timeout?: number;
  /** Programming language for the test */
  language?: "python" | "javascript" | "typescript";
}

/**
 * Result of a benchmark run
 */
export interface BenchmarkResult {
  /** Type of benchmark */
  benchmarkType: BenchmarkType;
  /** Name of the benchmark */
  benchmarkName: string;
  /** Total number of tests in the benchmark */
  totalTests: number;
  /** Number of tests that passed */
  passedTests: number;
  /** Number of tests that failed */
  failedTests: number;
  /** Number of tests that were skipped */
  skippedTests: number;
  /** Metrics for the benchmark */
  metrics: BenchmarkMetrics;
  /** Results for individual tests */
  testResults: TestResult[];
}

/**
 * Metrics for a benchmark
 */
export interface BenchmarkMetrics {
  /** Percentage of tasks correctly completed */
  accuracy: number;
  /** Time efficiency (normalized 0-1, higher is better) */
  efficiency: number;
  /** Safety score (0-1, higher is better) */
  safety: number;
  /** Adaptability across different problems (0-1, higher is better) */
  adaptability: number;
}

/**
 * Result of an individual test
 */
export interface TestResult {
  /** Identifier for the test */
  testId: string;
  /** Whether the test passed */
  passed: boolean;
  /** Execution time in milliseconds */
  executionTime: number;
  /** Output from the test */
  output?: string;
  /** Error message if the test failed */
  error?: string;
}

/**
 * Options for running a benchmark
 */
export interface BenchmarkOptions {
  /** Whether to stream output */
  stream?: boolean;
  /** Output file for results */
  outputFile?: string;
  /** Whether to run in verbose mode */
  verbose?: boolean;
}