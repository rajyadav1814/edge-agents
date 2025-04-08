/**
 * Test report generator for OpenAI proxy tests
 */

interface TestResult {
  name: string;
  duration: number;
  status: "passed" | "failed";
  error?: string;
  coverage?: number;
}

interface LoadTestResult {
  metrics: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageLatency: number;
    p95Latency: number;
    p99Latency: number;
    requestsPerSecond: number;
  };
  errors: Record<string, number>;
}

interface TestReport {
  timestamp: string;
  duration: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  coverage: number;
  results: TestResult[];
  loadTests?: LoadTestResult[];
}

/**
 * Generates HTML test report
 */
export function generateHtmlReport(report: TestReport): string {
  const passRate = ((report.passedTests / report.totalTests) * 100).toFixed(2);
  const coverageBadgeColor = report.coverage >= 80 ? "green" : "red";
  const passRateBadgeColor = Number(passRate) >= 90 ? "green" : "red";

  return `<!DOCTYPE html>
<html>
<head>
  <title>OpenAI Proxy Test Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .header { margin-bottom: 20px; }
    .badge {
      display: inline-block;
      padding: 5px 10px;
      border-radius: 3px;
      color: white;
      margin: 0 5px;
    }
    .green { background-color: #28a745; }
    .red { background-color: #dc3545; }
    .test-result {
      margin: 10px 0;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .passed { border-left: 5px solid #28a745; }
    .failed { border-left: 5px solid #dc3545; }
    .metrics { margin: 20px 0; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
  </style>
</head>
<body>
  <div class="header">
    <h1>OpenAI Proxy Test Report</h1>
    <p>Generated: ${report.timestamp}</p>
    <p>
      Coverage: <span class="badge ${coverageBadgeColor}">${report.coverage}%</span>
      Pass Rate: <span class="badge ${passRateBadgeColor}">${passRate}%</span>
    </p>
    <p>
      Total Tests: ${report.totalTests} |
      Passed: ${report.passedTests} |
      Failed: ${report.failedTests} |
      Duration: ${(report.duration / 1000).toFixed(2)}s
    </p>
  </div>

  <h2>Test Results</h2>
  ${report.results.map(result => `
    <div class="test-result ${result.status}">
      <h3>${result.name}</h3>
      <p>Status: ${result.status}</p>
      <p>Duration: ${(result.duration / 1000).toFixed(2)}s</p>
      ${result.error ? `<p>Error: ${result.error}</p>` : ''}
      ${result.coverage ? `<p>Coverage: ${result.coverage}%</p>` : ''}
    </div>
  `).join('')}

  ${report.loadTests ? `
    <h2>Load Test Results</h2>
    ${report.loadTests.map((loadTest, index) => `
      <div class="metrics">
        <h3>Load Test #${index + 1}</h3>
        <table>
          <tr>
            <th>Metric</th>
            <th>Value</th>
          </tr>
          <tr>
            <td>Total Requests</td>
            <td>${loadTest.metrics.totalRequests}</td>
          </tr>
          <tr>
            <td>Success Rate</td>
            <td>${((loadTest.metrics.successfulRequests / loadTest.metrics.totalRequests) * 100).toFixed(2)}%</td>
          </tr>
          <tr>
            <td>Average Latency</td>
            <td>${loadTest.metrics.averageLatency.toFixed(2)}ms</td>
          </tr>
          <tr>
            <td>P95 Latency</td>
            <td>${loadTest.metrics.p95Latency.toFixed(2)}ms</td>
          </tr>
          <tr>
            <td>P99 Latency</td>
            <td>${loadTest.metrics.p99Latency.toFixed(2)}ms</td>
          </tr>
          <tr>
            <td>Requests/Second</td>
            <td>${loadTest.metrics.requestsPerSecond.toFixed(2)}</td>
          </tr>
        </table>

        ${Object.keys(loadTest.errors).length > 0 ? `
          <h4>Errors</h4>
          <table>
            <tr>
              <th>Type</th>
              <th>Count</th>
            </tr>
            ${Object.entries(loadTest.errors).map(([type, count]) => `
              <tr>
                <td>${type}</td>
                <td>${count}</td>
              </tr>
            `).join('')}
          </table>
        ` : ''}
      </div>
    `).join('')}
  ` : ''}
</body>
</html>`;}

/**
 * Saves test report to file
 */
export async function saveTestReport(report: TestReport, format: "html" | "json" = "html"): Promise<void> {
  const timestamp = report.timestamp.replace(/[^0-9]/g, "_");
  const filename = `test-report-${timestamp}.${format}`;
  
  const content = format === "html" 
    ? generateHtmlReport(report)
    : JSON.stringify(report, null, 2);

  await Deno.writeTextFile(filename, content);
  console.log(`Test report saved to ${filename}`);
}