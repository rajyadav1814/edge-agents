/**
 * Performance profiler for test metrics
 */

export interface PerformancePoint {
  timestamp: number;
  name: string;
  duration: number;
  memory: {
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  metadata?: Record<string, unknown>;
}

export interface PerformanceSession {
  id: string;
  startTime: number;
  endTime?: number;
  points: PerformancePoint[];
  summary?: {
    totalDuration: number;
    averageLatency: number;
    maxLatency: number;
    minLatency: number;
    p95Latency: number;
    p99Latency: number;
    memoryPeak: number;
    averageMemory: number;
  };
}

export interface PerformanceReport {
  averageLatency: number;
  p95Latency: number;
  p99Latency: number;
  averageMemory: number;
  peakMemory: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  timestamps: number[];
}

export class PerformanceProfiler {
  private sessions: Map<string, PerformanceSession> = new Map();

  /**
   * Start a new profiling session
   */
  startSession(id?: string): string {
    const sessionId = id || crypto.randomUUID();
    this.sessions.set(sessionId, {
      id: sessionId,
      startTime: performance.now(),
      points: [],
    });
    return sessionId;
  }

  /**
   * End a profiling session
   */
  endSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.endTime = performance.now();
      this.calculateSessionSummary(session);
    }
  }

  /**
   * Get a session by ID
   */
  getSession(sessionId: string): PerformanceSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Add a performance point to a session
   */
  async addPoint(
    sessionId: string,
    name: string,
    duration: number,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const stats = await Deno.memoryUsage();
    const point: PerformancePoint = {
      timestamp: performance.now(),
      name,
      duration,
      memory: {
        heapUsed: stats.heapUsed,
        heapTotal: stats.heapTotal,
        external: stats.external,
      },
      metadata,
    };

    session.points.push(point);
  }

  /**
   * Record latency for a session
   */
  recordLatency(sessionId: string, latency: number): void {
    this.addPoint(sessionId, "latency", latency);
  }

  /**
   * Record memory usage for a session
   */
  async recordMemory(sessionId: string): Promise<void> {
    const stats = await Deno.memoryUsage();
    this.addPoint(sessionId, "memory", 0, { memory: stats });
  }

  /**
   * Clear all sessions
   */
  clearSessions(): void {
    this.sessions.clear();
  }

  /**
   * Calculate percentile
   */
  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  /**
   * Calculate session summary
   */
  private calculateSessionSummary(session: PerformanceSession): void {
    const durations = session.points.map(p => p.duration);
    const memories = session.points.map(p => p.memory.heapUsed);

    session.summary = {
      totalDuration: session.endTime ? session.endTime - session.startTime : 0,
      averageLatency: durations.reduce((a, b) => a + b, 0) / durations.length,
      maxLatency: Math.max(...durations),
      minLatency: Math.min(...durations),
      p95Latency: this.calculatePercentile(durations, 95),
      p99Latency: this.calculatePercentile(durations, 99),
      memoryPeak: Math.max(...memories),
      averageMemory: memories.reduce((a, b) => a + b, 0) / memories.length,
    };
  }

  /**
   * Generate performance report
   */
  async generateReport(): Promise<PerformanceReport> {
    const allLatencies: number[] = [];
    const allMemory: number[] = [];
    const timestamps: number[] = [];
    let successfulRequests = 0;
    let failedRequests = 0;

    // Collect metrics from all sessions
    for (const session of this.sessions.values()) {
      for (const point of session.points) {
        if (point.name === "latency") {
          allLatencies.push(point.duration);
          if (point.metadata?.success) {
            successfulRequests++;
          } else {
            failedRequests++;
          }
        }
        allMemory.push(point.memory.heapUsed);
        timestamps.push(point.timestamp);
      }
    }

    return {
      averageLatency: allLatencies.reduce((a, b) => a + b, 0) / allLatencies.length,
      p95Latency: this.calculatePercentile(allLatencies, 95),
      p99Latency: this.calculatePercentile(allLatencies, 99),
      averageMemory: allMemory.reduce((a, b) => a + b, 0) / allMemory.length,
      peakMemory: Math.max(...allMemory),
      totalRequests: allLatencies.length,
      successfulRequests,
      failedRequests,
      timestamps,
    };
  }
}

// Export singleton instance
export const profiler = new PerformanceProfiler();