/**
 * Test reporter for OpenAI proxy tests
 */

import type { BenchmarkResult } from "./types/benchmark.ts";

/**
 * Report types
 */
export type TestReport = {
  name: string;
  duration: number;
  success: boolean;
  error?: string;
  performance?: BenchmarkResult;
};

export type TestSuiteReport = {
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  tests: TestReport[];
};

/**
 * Test reporter class
 */
export class TestReporter {
  private currentSuite: TestSuiteReport;
  private reports: TestSuiteReport[] = [];

  /**
   * Constructor
   */
  constructor() {
    this.currentSuite = this.createSuite("Default Suite");
  }

  /**
   * Start a new test suite
   */
  startSuite(name: string): void {
    this.currentSuite = this.createSuite(name);
    this.reports.push(this.currentSuite);
  }

  /**
   * End current test suite
   */
  endSuite(): void {
    this.currentSuite.endTime = Date.now();
    this.currentSuite.duration = this.currentSuite.endTime - this.currentSuite.startTime;
  }

  /**
   * Record test result
   */
  recordTest(report: TestReport): void {
    this.currentSuite.tests.push(report);
    this.currentSuite.totalTests++;

    if (report.success) {
      this.currentSuite.passedTests++;
    } else {
      this.currentSuite.failedTests++;
    }
  }

  /**
   * Skip test
   */
  skipTest(name: string): void {
    this.currentSuite.skippedTests++;
    this.currentSuite.tests.push({
      name,
      duration: 0,
      success: true,
    });
  }

  /**
   * Generate report
   */
  generateReport(): string {
    let report = "Test Report\n";
    report += "===========\n\n";

    for (const suite of this.reports) {
      report += this.formatSuite(suite);
    }

    report += this.generateSummary();
    return report;
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(): string {
    let report = "Performance Report\n";
    report += "==================\n\n";

    for (const suite of this.reports) {
      for (const test of suite.tests) {
        if (test.performance) {
          report += this.formatPerformance(test.performance);
        }
      }
    }

    return report;
  }

  /**
   * Save report to file
   */
  async saveReport(path: string): Promise<void> {
    const report = this.generateReport();
    await Deno.writeTextFile(path, report);
  }

  /**
   * Save performance report to file
   */
  async savePerformanceReport(path: string): Promise<void> {
    const report = this.generatePerformanceReport();
    await Deno.writeTextFile(path, report);
  }

  /**
   * Create new test suite
   */
  private createSuite(name: string): TestSuiteReport {
    return {
      name,
      startTime: Date.now(),
      endTime: 0,
      duration: 0,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      tests: [],
    };
  }

  /**
   * Format test suite
   */
  private formatSuite(suite: TestSuiteReport): string {
    let output = `Suite: ${suite.name}\n`;
    output += `${"=".repeat(suite.name.length + 7)}\n\n`;

    output += `Duration: ${suite.duration}ms\n`;
    output += `Total Tests: ${suite.totalTests}\n`;
    output += `Passed: ${suite.passedTests}\n`;
    output += `Failed: ${suite.failedTests}\n`;
    output += `Skipped: ${suite.skippedTests}\n\n`;

    output += "Tests:\n";
    output += "------\n";

    for (const test of suite.tests) {
      output += this.formatTest(test);
    }

    output += "\n";
    return output;
  }

  /**
   * Format test result
   */
  private formatTest(test: TestReport): string {
    const status = test.success ? "✓" : "✗";
    let output = `${status} ${test.name} (${test.duration}ms)\n`;

    if (!test.success && test.error) {
      output += `  Error: ${test.error}\n`;
    }

    return output;
  }

  /**
   * Format performance result
   */
  private formatPerformance(result: BenchmarkResult): string {
    let output = `Test: ${result.name}\n`;
    output += `-`.repeat(result.name.length + 6) + "\n";
    output += `Iterations: ${result.iterations}\n`;
    output += `Duration: ${result.duration.toFixed(2)}ms\n`;
    output += `Average Latency: ${result.metrics.latency.toFixed(2)}ms\n`;
    output += `P95 Latency: ${result.latency.p95.toFixed(2)}ms\n`;
    output += `RPS: ${result.rps.toFixed(2)}\n`;
    output += `Success Rate: ${((result.successCount / result.requestCount) * 100).toFixed(2)}%\n`;
    output += `Memory Usage: ${((result.memory.peak - result.memory.start) / 1024 / 1024).toFixed(2)}MB\n`;

    if (result.errors.length > 0) {
      output += "\nErrors:\n";
      result.errors.forEach((error, i) => {
        output += `${i + 1}. ${error}\n`;
      });
    }

    output += "\n";
    return output;
  }

  /**
   * Generate summary
   */
  private generateSummary(): string {
    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;
    let totalSkipped = 0;
    let totalDuration = 0;

    for (const suite of this.reports) {
      totalTests += suite.totalTests;
      totalPassed += suite.passedTests;
      totalFailed += suite.failedTests;
      totalSkipped += suite.skippedTests;
      totalDuration += suite.duration;
    }

    let output = "Summary\n";
    output += "-------\n\n";
    output += `Total Suites: ${this.reports.length}\n`;
    output += `Total Tests: ${totalTests}\n`;
    output += `Total Passed: ${totalPassed}\n`;
    output += `Total Failed: ${totalFailed}\n`;
    output += `Total Skipped: ${totalSkipped}\n`;
    output += `Total Duration: ${totalDuration}ms\n`;
    output += `Success Rate: ${((totalPassed / totalTests) * 100).toFixed(2)}%\n`;

    return output;
  }
}