/**
 * Test runner implementation
 */

import {
  type TestConfig,
  type TestSuite,
  type TestResult,
  type TestSummary,
  type TestCase,
  type TestContext,
  type TestHook,
  type TestEventHandler,
  type TestStatus,
} from "./types/test_types.ts";

const defaultConfig: TestConfig = {
  bail: false,
  timeout: 5000,
  parallel: false,
  retries: 0,
  coverage: true,
};

/**
 * Custom test error class
 */
class TestError extends Error {
  constructor(
    message: string,
    public readonly type: "skip" | "fail" | "timeout" = "fail"
  ) {
    super(message);
    this.name = "TestError";
  }
}

/**
 * Test runner class
 */
export class TestRunner {
  private tests: Map<string, TestCase> = new Map();
  private beforeAll: TestHook[] = [];
  private afterAll: TestHook[] = [];
  private beforeEach: TestHook[] = [];
  private afterEach: TestHook[] = [];
  private config: TestConfig;
  private eventHandlers: TestEventHandler[] = [];

  constructor(config: Partial<TestConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Add test case
   */
  test(name: string, fn: TestCase): void {
    if (this.tests.has(name)) {
      throw new TestError(`Test "${name}" already exists`);
    }
    this.tests.set(name, fn);
  }

  /**
   * Add before all hook
   */
  addBeforeAll(fn: TestHook): void {
    this.beforeAll.push(fn);
  }

  /**
   * Add after all hook
   */
  addAfterAll(fn: TestHook): void {
    this.afterAll.push(fn);
  }

  /**
   * Add before each hook
   */
  addBeforeEach(fn: TestHook): void {
    this.beforeEach.push(fn);
  }

  /**
   * Add after each hook
   */
  addAfterEach(fn: TestHook): void {
    this.afterEach.push(fn);
  }

  /**
   * Add event handler
   */
  addEventHandler(handler: TestEventHandler): void {
    this.eventHandlers.push(handler);
  }

  /**
   * Create test context
   */
  private createContext(name: string): TestContext {
    let timeoutId: number | undefined;
    const metadata: Record<string, unknown> = {};
    const marks: Record<string, number> = {};
    const measures: Record<string, { duration: number; start: string; end: string }> = {};

    return {
      name,
      skip: () => {
        throw new TestError("Test skipped", "skip");
      },
      fail: (message?: string) => {
        throw new TestError(message || "Test failed", "fail");
      },
      pass: () => {
        // Test passes
      },
      timeout: (ms: number) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
          throw new TestError(`Test "${name}" timed out after ${ms}ms`, "timeout");
        }, ms);
      },
      metadata: (data: Record<string, unknown>) => {
        Object.assign(metadata, data);
      },
      performance: {
        mark: (markName: string) => {
          marks[markName] = performance.now();
        },
        measure: (measureName: string, start: string, end: string) => {
          if (!(start in marks) || !(end in marks)) {
            throw new TestError(`Missing marks for measure "${measureName}"`);
          }
          measures[measureName] = {
            duration: marks[end] - marks[start],
            start,
            end,
          };
        },
        getEntries: () => {
          return Object.entries(measures).map(([name, data]) => ({
            name,
            entryType: "measure",
            startTime: marks[data.start],
            duration: data.duration,
          })) as PerformanceEntry[];
        },
        clearMarks: () => {
          Object.keys(marks).forEach(key => delete marks[key]);
        },
        clearMeasures: () => {
          Object.keys(measures).forEach(key => delete measures[key]);
        },
      },
    };
  }

  /**
   * Get test status from error
   */
  private getTestStatus(error: unknown): TestStatus {
    if (error instanceof TestError) {
      switch (error.type) {
        case "skip":
          return "skipped";
        case "timeout":
        case "fail":
          return "failed";
      }
    }
    return "failed";
  }

  /**
   * Format error message
   */
  private formatError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }

  /**
   * Run single test
   */
  private async runTest(name: string, fn: TestCase): Promise<TestResult> {
    const context = this.createContext(name);
    const start = performance.now();

    try {
      for (const hook of this.beforeEach) {
        await hook();
      }

      await fn(context);

      for (const hook of this.afterEach) {
        await hook();
      }

      const duration = performance.now() - start;
      return {
        name,
        status: "passed",
        duration,
        performance: {
          latency: duration,
          memory: (await Deno.memoryUsage()).heapUsed,
        },
      };
    } catch (error) {
      const duration = performance.now() - start;
      return {
        name,
        status: this.getTestStatus(error),
        duration,
        error: this.formatError(error),
        performance: {
          latency: duration,
          memory: (await Deno.memoryUsage()).heapUsed,
        },
      };
    }
  }

  /**
   * Run all tests
   */
  async run(suiteName: string): Promise<TestSuite> {
    const startTime = performance.now();
    const results: TestResult[] = [];

    this.eventHandlers.forEach(handler => 
      handler({ type: "start", suite: suiteName })
    );

    try {
      for (const hook of this.beforeAll) {
        await hook();
      }

      if (this.config.parallel) {
        const promises = Array.from(this.tests.entries()).map(
          async ([name, fn]) => {
            const result = await this.runTest(name, fn);
            results.push(result);
            this.eventHandlers.forEach(handler =>
              handler({ type: "testEnd", result })
            );
          }
        );
        await Promise.all(promises);
      } else {
        for (const [name, fn] of this.tests) {
          this.eventHandlers.forEach(handler =>
            handler({ type: "testStart", name })
          );
          const result = await this.runTest(name, fn);
          results.push(result);
          this.eventHandlers.forEach(handler =>
            handler({ type: "testEnd", result })
          );

          if (this.config.bail && result.status === "failed") {
            break;
          }
        }
      }

      for (const hook of this.afterAll) {
        await hook();
      }
    } catch (error) {
      console.error("Suite error:", this.formatError(error));
    }

    const endTime = performance.now();
    const summary: TestSummary = {
      total: results.length,
      passed: results.filter(r => r.status === "passed").length,
      failed: results.filter(r => r.status === "failed").length,
      skipped: results.filter(r => r.status === "skipped").length,
      duration: endTime - startTime,
      coverage: 0, // TODO: Implement coverage calculation
      startTime,
      endTime,
    };

    this.eventHandlers.forEach(handler =>
      handler({ type: "end", summary })
    );

    return { name: suiteName, results, summary };
  }

  /**
   * Print test results
   */
  static printResults(suite: TestSuite): void {
    console.log(`\nTest Suite: ${suite.name}`);
    console.log("=".repeat(50));

    for (const result of suite.results) {
      const symbol = result.status === "passed" ? "✓" :
                    result.status === "failed" ? "✗" : "-";
      console.log(`${symbol} ${result.name} (${result.duration.toFixed(2)}ms)`);
      
      if (result.error) {
        console.error(`  Error: ${result.error}`);
      }
    }

    console.log("\nSummary:");
    console.log(`Total: ${suite.summary.total}`);
    console.log(`Passed: ${suite.summary.passed}`);
    console.log(`Failed: ${suite.summary.failed}`);
    console.log(`Skipped: ${suite.summary.skipped}`);
    console.log(`Duration: ${(suite.summary.duration / 1000).toFixed(2)}s`);
    console.log(`Coverage: ${suite.summary.coverage.toFixed(1)}%`);
  }
}

// Export singleton instance
export const runner = new TestRunner();