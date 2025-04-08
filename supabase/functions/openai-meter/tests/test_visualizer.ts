/**
 * Test result visualizer
 */

import { profiler } from "./performance_profiler.ts";
import type { PerformanceReport, PerformanceSession } from "./performance_profiler.ts";
import type { TestResult, TestSuite } from "./types/test_types.ts";

interface VisualizerOptions {
  showMemory: boolean;
  showLatency: boolean;
  showCoverage: boolean;
  format: "text" | "json" | "html";
}

const defaultOptions: VisualizerOptions = {
  showMemory: true,
  showLatency: true,
  showCoverage: true,
  format: "text",
};

/**
 * Test result visualizer class
 */
export class TestVisualizer {
  private options: VisualizerOptions;

  constructor(options: Partial<VisualizerOptions> = {}) {
    this.options = { ...defaultOptions, ...options };
  }

  /**
   * Generate test report
   */
  async generateReport(suite: TestSuite, sessionId: string): Promise<string> {
    const performanceData = await profiler.generateReport();
    const session = profiler.getSession(sessionId);

    switch (this.options.format) {
      case "json":
        return this.generateJsonReport(suite, performanceData, session);
      case "html":
        return this.generateHtmlReport(suite, performanceData, session);
      default:
        return this.generateTextReport(suite, performanceData, session);
    }
  }

  /**
   * Generate text report
   */
  private generateTextReport(
    suite: TestSuite,
    performanceData: PerformanceReport,
    session?: PerformanceSession
  ): string {
    let report = `Test Suite: ${suite.name}\n`;
    report += "=".repeat(50) + "\n\n";

    // Summary
    report += "Summary:\n";
    report += "-".repeat(20) + "\n";
    report += `Total Tests: ${suite.summary.total}\n`;
    report += `Passed: ${suite.summary.passed}\n`;
    report += `Failed: ${suite.summary.failed}\n`;
    report += `Skipped: ${suite.summary.skipped}\n`;
    report += `Duration: ${(suite.summary.duration / 1000).toFixed(2)}s\n`;
    report += `Coverage: ${suite.summary.coverage.toFixed(1)}%\n\n`;

    // Performance
    if (this.options.showLatency || this.options.showMemory) {
      report += "Performance:\n";
      report += "-".repeat(20) + "\n";
      
      if (this.options.showLatency) {
        report += `Average Latency: ${performanceData.averageLatency.toFixed(2)}ms\n`;
        report += `P95 Latency: ${performanceData.p95Latency.toFixed(2)}ms\n`;
        report += `P99 Latency: ${performanceData.p99Latency.toFixed(2)}ms\n`;
      }

      if (this.options.showMemory) {
        report += `Average Memory: ${(performanceData.averageMemory / 1024 / 1024).toFixed(2)}MB\n`;
        report += `Peak Memory: ${(performanceData.peakMemory / 1024 / 1024).toFixed(2)}MB\n`;
      }
      report += "\n";
    }

    // Individual Tests
    report += "Test Results:\n";
    report += "-".repeat(20) + "\n";
    for (const result of suite.results) {
      const status = result.status === "passed" ? "✅" :
                    result.status === "failed" ? "❌" : "⏭️";
      
      report += `${status} ${result.name}\n`;
      if (result.error) {
        report += `   Error: ${result.error}\n`;
      }
      if (result.performance) {
        report += `   Latency: ${result.performance.latency.toFixed(2)}ms\n`;
        report += `   Memory: ${(result.performance.memory / 1024 / 1024).toFixed(2)}MB\n`;
      }
      report += "\n";
    }

    return report;
  }

  /**
   * Generate JSON report
   */
  private generateJsonReport(
    suite: TestSuite,
    performanceData: PerformanceReport,
    session?: PerformanceSession
  ): string {
    const report = {
      suite: {
        name: suite.name,
        summary: suite.summary,
      },
      performance: {
        latency: this.options.showLatency ? {
          average: performanceData.averageLatency,
          p95: performanceData.p95Latency,
          p99: performanceData.p99Latency,
        } : undefined,
        memory: this.options.showMemory ? {
          average: performanceData.averageMemory,
          peak: performanceData.peakMemory,
        } : undefined,
      },
      results: suite.results.map(result => ({
        name: result.name,
        status: result.status,
        duration: result.duration,
        error: result.error,
        performance: result.performance,
      })),
      session: session ? {
        startTime: session.startTime,
        endTime: session.endTime,
        summary: session.summary,
      } : undefined,
    };

    return JSON.stringify(report, null, 2);
  }

  /**
   * Generate HTML report
   */
  private generateHtmlReport(
    suite: TestSuite,
    performanceData: PerformanceReport,
    session?: PerformanceSession
  ): string {
    // Simple HTML template
    return `<!DOCTYPE html>
<html>
<head>
  <title>Test Report: ${suite.name}</title>
  <style>
    body { font-family: sans-serif; margin: 2em; }
    .passed { color: green; }
    .failed { color: red; }
    .skipped { color: gray; }
    .section { margin: 1em 0; }
    .error { color: red; background: #fee; padding: 0.5em; }
    table { border-collapse: collapse; }
    th, td { padding: 0.5em; border: 1px solid #ddd; }
  </style>
</head>
<body>
  <h1>Test Report: ${suite.name}</h1>
  
  <div class="section">
    <h2>Summary</h2>
    <table>
      <tr><td>Total Tests</td><td>${suite.summary.total}</td></tr>
      <tr><td>Passed</td><td class="passed">${suite.summary.passed}</td></tr>
      <tr><td>Failed</td><td class="failed">${suite.summary.failed}</td></tr>
      <tr><td>Skipped</td><td class="skipped">${suite.summary.skipped}</td></tr>
      <tr><td>Duration</td><td>${(suite.summary.duration / 1000).toFixed(2)}s</td></tr>
      <tr><td>Coverage</td><td>${suite.summary.coverage.toFixed(1)}%</td></tr>
    </table>
  </div>

  ${this.generateHtmlPerformanceSection(performanceData)}
  ${this.generateHtmlResultsSection(suite.results)}
</body>
</html>`;
  }

  /**
   * Generate HTML performance section
   */
  private generateHtmlPerformanceSection(performanceData: PerformanceReport): string {
    if (!this.options.showLatency && !this.options.showMemory) return "";

    return `
  <div class="section">
    <h2>Performance</h2>
    <table>
      ${this.options.showLatency ? `
      <tr><td>Average Latency</td><td>${performanceData.averageLatency.toFixed(2)}ms</td></tr>
      <tr><td>P95 Latency</td><td>${performanceData.p95Latency.toFixed(2)}ms</td></tr>
      <tr><td>P99 Latency</td><td>${performanceData.p99Latency.toFixed(2)}ms</td></tr>
      ` : ""}
      ${this.options.showMemory ? `
      <tr><td>Average Memory</td><td>${(performanceData.averageMemory / 1024 / 1024).toFixed(2)}MB</td></tr>
      <tr><td>Peak Memory</td><td>${(performanceData.peakMemory / 1024 / 1024).toFixed(2)}MB</td></tr>
      ` : ""}
    </table>
  </div>`;
  }

  /**
   * Generate HTML results section
   */
  private generateHtmlResultsSection(results: TestResult[]): string {
    return `
  <div class="section">
    <h2>Test Results</h2>
    <table>
      <tr>
        <th>Test</th>
        <th>Status</th>
        <th>Duration</th>
        ${this.options.showLatency ? "<th>Latency</th>" : ""}
        ${this.options.showMemory ? "<th>Memory</th>" : ""}
      </tr>
      ${results.map(result => `
      <tr class="${result.status}">
        <td>${result.name}</td>
        <td>${result.status}</td>
        <td>${result.duration.toFixed(2)}ms</td>
        ${this.options.showLatency ? `<td>${result.performance?.latency.toFixed(2)}ms</td>` : ""}
        ${this.options.showMemory ? `<td>${(result.performance?.memory || 0 / 1024 / 1024).toFixed(2)}MB</td>` : ""}
      </tr>
      ${result.error ? `
      <tr>
        <td colspan="5">
          <div class="error">Error: ${result.error}</div>
        </td>
      </tr>
      ` : ""}
      `).join("")}
    </table>
  </div>`;
  }
}

// Export singleton instance
export const visualizer = new TestVisualizer();