/**
 * Benchmark configuration
 */
export interface BenchmarkConfig {
  iterations: number;
  concurrency: number;
  warmup: boolean;
  timeout: number;
}

/**
 * Benchmark metrics
 */
export interface BenchmarkMetrics {
  latency: number;
  rps: number;
  successCount: number;
  errorCount: number;
  memory: {
    start: number;
    peak: number;
  };
}

/**
 * Benchmark result
 */
export interface BenchmarkResult {
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  iterations: number;
  requestCount: number;
  successCount: number;
  errorCount: number;
  metrics: BenchmarkMetrics;
  latency: {
    p50: number;
    p75: number;
    p90: number;
    p95: number;
    p99: number;
  };
  rps: number;
  memory: {
    start: number;
    peak: number;
  };
  errors: string[];
}

/**
 * Run benchmark
 */
export async function runBenchmark(params: {
  name: string;
  fn: () => Promise<void>;
  config: BenchmarkConfig;
}): Promise<BenchmarkResult> {
  const { name, fn, config } = params;
  const startTime = Date.now();
  const durations: number[] = [];
  const errors: string[] = [];
  let successCount = 0;
  let errorCount = 0;
  let peakMemory = 0;
  const startMemory = Deno.memoryUsage().heapUsed;

  // Warmup if enabled
  if (config.warmup) {
    await runWarmup(fn);
  }

  // Run iterations
  const promises: Promise<void>[] = [];
  for (let i = 0; i < config.iterations; i++) {
    if (promises.length >= config.concurrency) {
      await Promise.race(promises);
    }

    const promise = runIteration(fn, durations, errors, config.timeout)
      .then(() => {
        successCount++;
        const memory = Deno.memoryUsage().heapUsed;
        if (memory > peakMemory) peakMemory = memory;
      })
      .catch((error) => {
        errorCount++;
        errors.push(error instanceof Error ? error.message : String(error));
      });

    promises.push(promise);
  }

  // Wait for remaining promises
  await Promise.all(promises);

  // Calculate metrics
  const endTime = Date.now();
  const duration = endTime - startTime;
  const sorted = [...durations].sort((a, b) => a - b);

  return {
    name,
    startTime,
    endTime,
    duration,
    iterations: config.iterations,
    requestCount: config.iterations,
    successCount,
    errorCount,
    metrics: {
      latency: calculateAverage(durations),
      rps: (successCount / duration) * 1000,
      successCount,
      errorCount,
      memory: {
        start: startMemory,
        peak: peakMemory,
      },
    },
    latency: {
      p50: getPercentile(sorted, 50),
      p75: getPercentile(sorted, 75),
      p90: getPercentile(sorted, 90),
      p95: getPercentile(sorted, 95),
      p99: getPercentile(sorted, 99),
    },
    rps: (successCount / duration) * 1000,
    memory: {
      start: startMemory,
      peak: peakMemory,
    },
    errors,
  };
}

/**
 * Run multiple benchmarks
 */
export async function runBenchmarks(scenarios: {
  name: string;
  fn: () => Promise<void>;
  config: BenchmarkConfig;
}[]): Promise<BenchmarkResult[]> {
  const results: BenchmarkResult[] = [];
  
  for (const scenario of scenarios) {
    const result = await runBenchmark(scenario);
    results.push(result);
  }

  return results;
}

/**
 * Run warmup iterations
 */
async function runWarmup(fn: () => Promise<void>): Promise<void> {
  const warmupIterations = 3;
  for (let i = 0; i < warmupIterations; i++) {
    try {
      await fn();
    } catch (error) {
      console.warn("Warmup error:", error);
    }
  }
}

/**
 * Run single iteration
 */
async function runIteration(
  fn: () => Promise<void>,
  durations: number[],
  errors: string[],
  timeout: number
): Promise<void> {
  const start = Date.now();

  try {
    await Promise.race([
      fn(),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Timeout")), timeout);
      }),
    ]);

    const duration = Date.now() - start;
    durations.push(duration);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/**
 * Calculate average
 */
function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((a, b) => a + b, 0);
  return sum / values.length;
}

/**
 * Get percentile value
 */
function getPercentile(sorted: number[], percentile: number): number {
  if (sorted.length === 0) return 0;
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index];
}