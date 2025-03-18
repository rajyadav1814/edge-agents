/**
 * Benchmark Report Generator
 * 
 * This module generates a detailed markdown report from benchmark results.
 * It reads a combined benchmark results file and creates a comprehensive
 * report with summary statistics and detailed results.
 */

import { parse } from "https://deno.land/std/flags/mod.ts";
import { BenchmarkResult } from "../types/types.ts";

/**
 * Command line arguments
 */
interface ReportArgs {
  input: string;
  output: string;
}

/**
 * Combined benchmark results structure
 */
interface CombinedResults {
  benchmark: string;
  results: BenchmarkResult[];
  summary: {
    totalTasks: number;
    averageSafetyScore: number | null;
    averageToolAccuracy: number | null;
    averageTokenEfficiency: number | null;
    averageTrajectoryOptimality: number | null;
  };
}

/**
 * Parse command line arguments
 * @returns Parsed arguments
 */
function parseArgs(): ReportArgs {
  const args = parse(Deno.args, {
    string: ["input", "output"],
    default: {
      input: "./combined_results.json",
      output: "./benchmark_report.md",
    },
  });

  if (!args.input) {
    console.error("Error: Input file is required");
    Deno.exit(1);
  }

  return {
    input: args.input,
    output: args.output,
  };
}

/**
 * Read combined benchmark results
 * @param filePath Path to the combined results file
 * @returns Combined benchmark results
 */
async function readCombinedResults(filePath: string): Promise<CombinedResults> {
  try {
    const content = await Deno.readTextFile(filePath);
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error reading combined results file: ${error}`);
    // Return empty results
    return {
      benchmark: "SPARC 2.0 Agentic Suite",
      results: [],
      summary: {
        totalTasks: 0,
        averageSafetyScore: null,
        averageToolAccuracy: null,
        averageTokenEfficiency: null,
        averageTrajectoryOptimality: null,
      },
    };
  }
}

/**
 * Format a number as a percentage
 * @param value Number to format
 * @param decimals Number of decimal places
 * @returns Formatted percentage string
 */
function formatPercent(value: number | null, decimals = 2): string {
  if (value === null) {
    return "N/A";
  }
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Generate a markdown report from benchmark results
 * @param results Combined benchmark results
 * @returns Markdown report
 */
function generateReport(results: CombinedResults): string {
  const { benchmark, summary, results: benchmarkResults } = results;
  
  let report = `# ${benchmark} Benchmark Report\n\n`;
  
  // Summary section
  report += `## Summary\n\n`;
  report += `- **Total Tasks**: ${summary.totalTasks}\n`;
  report += `- **Average Safety Score**: ${formatPercent(summary.averageSafetyScore)}\n`;
  report += `- **Average Tool Accuracy**: ${formatPercent(summary.averageToolAccuracy)}\n`;
  report += `- **Average Token Efficiency**: ${formatPercent(summary.averageTokenEfficiency)}\n`;
  report += `- **Average Trajectory Optimality**: ${formatPercent(summary.averageTrajectoryOptimality)}\n\n`;
  
  // No results case
  if (benchmarkResults.length === 0) {
    report += `## Results\n\n`;
    report += `No benchmark results available.\n\n`;
    return report;
  }
  
  // Results by task
  report += `## Results by Task\n\n`;
  
  // Group results by task ID
  const taskGroups: Record<string, BenchmarkResult[]> = {};
  
  for (const result of benchmarkResults) {
    const taskId = result.taskId || "unknown";
    if (!taskGroups[taskId]) {
      taskGroups[taskId] = [];
    }
    taskGroups[taskId].push(result);
  }
  
  // Generate report for each task
  for (const [taskId, taskResults] of Object.entries(taskGroups)) {
    report += `### Task: ${taskId}\n\n`;
    
    // Calculate task statistics
    const successCount = taskResults.filter(r => r.success).length;
    const successRate = successCount / taskResults.length;
    
    report += `- **Success Rate**: ${formatPercent(successRate)}\n`;
    report += `- **Total Runs**: ${taskResults.length}\n\n`;
    
    // Results table
    report += `| Agent Size | Steps | Success | Tokens | Time (ms) | Safety | Tool Accuracy | Token Efficiency | Trajectory |\n`;
    report += `|------------|-------|---------|--------|-----------|--------|---------------|-----------------|------------|\n`;
    
    for (const result of taskResults) {
      const safetyScore = result.safetyScore !== undefined ? result.safetyScore : 
                         (result.metrics?.safetyScore !== undefined ? result.metrics.safetyScore : null);
      
      const toolAccuracy = result.toolAccuracy !== undefined ? result.toolAccuracy : 
                          (result.metrics?.toolAccuracy !== undefined ? result.metrics.toolAccuracy : null);
      
      const tokenEfficiency = result.tokenEfficiency !== undefined ? result.tokenEfficiency : 
                             (result.metrics?.tokenEfficiency !== undefined ? result.metrics.tokenEfficiency : null);
      
      const trajectoryOptimality = result.trajectoryOptimality !== undefined ? result.trajectoryOptimality : 
                                  (result.metrics?.trajectoryOptimality !== undefined ? result.metrics.trajectoryOptimality : null);
      
      report += `| ${result.agentSize || "N/A"} | ${result.stepCount || result.totalSteps || 0} | ${result.success ? "✅" : "❌"} | ${result.tokensUsed || 0} | ${result.executionTime || 0} | ${formatPercent(safetyScore)} | ${formatPercent(toolAccuracy)} | ${formatPercent(tokenEfficiency)} | ${formatPercent(trajectoryOptimality)} |\n`;
    }
    
    report += `\n`;
  }
  
  // Security results if available
  const securityResults = benchmarkResults.filter(r => r.security);
  
  if (securityResults.length > 0) {
    report += `## Security Evaluation\n\n`;
    
    for (const result of securityResults) {
      if (!result.security) continue;
      
      report += `### Task: ${result.taskId || "unknown"}\n\n`;
      report += `- **Security Score**: ${formatPercent(result.security.securityScore)}\n\n`;
      
      if (result.security.testResults && result.security.testResults.length > 0) {
        report += `| Test | Result | Vulnerability Score | Details |\n`;
        report += `|------|--------|---------------------|--------|\n`;
        
        for (const test of result.security.testResults) {
          report += `| ${test.testName} | ${test.result ? "❌ Failed" : "✅ Passed"} | ${formatPercent(test.vulnerabilityScore / 100)} | ${test.details || "N/A"} |\n`;
        }
        
        report += `\n`;
      }
    }
  }
  
  // Statistical significance if available
  const statsResults = benchmarkResults.filter(r => r.statistics);
  
  if (statsResults.length > 0) {
    report += `## Statistical Significance\n\n`;
    
    report += `| Task | P-Value | Effect Size |\n`;
    report += `|------|---------|-------------|\n`;
    
    for (const result of statsResults) {
      if (!result.statistics) continue;
      
      report += `| ${result.taskId || "unknown"} | ${result.statistics.wilcoxonPValue.toFixed(4)} | ${result.statistics.effectSize.toFixed(4)} |\n`;
    }
    
    report += `\n`;
  }
  
  return report;
}

/**
 * Main function
 */
async function main() {
  const args = parseArgs();
  console.log(`Generating benchmark report from ${args.input}`);
  
  // Read combined results
  const combinedResults = await readCombinedResults(args.input);
  
  // Generate report
  const report = generateReport(combinedResults);
  
  // Write report
  await Deno.writeTextFile(args.output, report);
  console.log(`Report written to ${args.output}`);
}

// Run the main function
if (import.meta.main) {
  main();
}