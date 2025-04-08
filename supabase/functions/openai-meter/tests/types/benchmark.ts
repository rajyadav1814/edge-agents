/**
 * Benchmark types
 */

export interface BenchmarkMetrics {
  latency: number;
  memory: number;
  cpu?: number;
  network?: number;
}

export interface BenchmarkConfig {
  name: string;
  iterations: number;
  concurrency: number;
  warmup: boolean;
  timeout: number;
}

export interface BenchmarkLatency {
  p95: number;
  p99?: number;
  max?: number;
  min?: number;
}

export interface BenchmarkMemory {
  start: number;
  peak: number;
  average?: number;
}

export interface BenchmarkResult {
  name: string;
  metrics: BenchmarkMetrics;
  iterations: number;
  duration: number;
  errors: string[];
  timestamp: number;
  requestCount: number;
  successCount: number;
  errorCount: number;
  rps: number;
  latency: BenchmarkLatency;
  memory: BenchmarkMemory;
}

export interface BenchmarkSummary {
  totalDuration: number;
  totalIterations: number;
  averageLatency: number;
  averageMemory: number;
  errorRate: number;
  results: BenchmarkResult[];
}

export type BenchmarkPreset = {
  iterations: number;
  concurrency: number;
  warmup: boolean;
  timeout: number;
};