/**
 * SPARC 2.0 Agentic Benchmarking Suite Renderer
 * Renders benchmark results
 */

import { BenchmarkResult } from "../types/types.ts";

/**
 * Output format
 */
export type OutputFormat = "table" | "json" | "csv" | "github-annotation";

/**
 * Render agentic results
 * @param results Benchmark results
 * @param format Output format
 */
export function renderAgenticResults(results: BenchmarkResult[], format: OutputFormat): void {
  switch (format) {
    case "table":
      renderTable(results);
      break;
    case "json":
      renderJson(results);
      break;
    case "csv":
      renderCsv(results);
      break;
    case "github-annotation":
      renderGithubAnnotation(results);
      break;
    default:
      console.error(`Unknown output format: ${format}`);
      break;
  }
}

/**
 * Render table
 * @param results Benchmark results
 */
function renderTable(results: BenchmarkResult[]): void {
  console.log("\n=== SPARC 2.0 Agentic Benchmark Results ===\n");
  
  // Print header
  console.log("Task ID | Agent Size | Steps | Completion | Tokens | Time (ms) | Safety | Tool Accuracy | Token Efficiency | Trajectory");
  console.log("--------|------------|-------|------------|--------|-----------|--------|---------------|-----------------|----------");
  
  // Print results
  for (const result of results) {
    console.log(
      `${result.taskId.padEnd(8)} | ` +
      `${result.agentSize.padEnd(10)} | ` +
      `${result.stepCount.toString().padEnd(5)} | ` +
      `${(result.stepsCompleted / result.stepCount * 100).toFixed(0).padEnd(10)}% | ` +
      `${Math.round(result.tokensUsed).toString().padEnd(6)} | ` +
      `${Math.round(result.executionTime).toString().padEnd(9)} | ` +
      `${(result.metrics.safetyScore || 0).toFixed(1).padEnd(6)} | ` +
      `${result.metrics.toolAccuracy.toFixed(2).padEnd(13)} | ` +
      `${result.metrics.tokenEfficiency.toFixed(2).padEnd(15)} | ` +
      `${result.metrics.trajectoryOptimality.toFixed(2)}`
    );
  }
  
  // Print summary
  if (results.length > 0) {
    const avgSafety = results.reduce((acc, r) => acc + (r.metrics.safetyScore || 0), 0) / results.length;
    const avgToolAccuracy = results.reduce((acc, r) => acc + r.metrics.toolAccuracy, 0) / results.length;
    const avgTokenEfficiency = results.reduce((acc, r) => acc + r.metrics.tokenEfficiency, 0) / results.length;
    const avgTrajectory = results.reduce((acc, r) => acc + r.metrics.trajectoryOptimality, 0) / results.length;
    
    console.log("--------|------------|-------|------------|--------|-----------|--------|---------------|-----------------|----------");
    console.log(
      `AVERAGE  | ` +
      `${"-".padEnd(10)} | ` +
      `${"-".padEnd(5)} | ` +
      `${"-".padEnd(10)} | ` +
      `${"-".padEnd(6)} | ` +
      `${"-".padEnd(9)} | ` +
      `${avgSafety.toFixed(1).padEnd(6)} | ` +
      `${avgToolAccuracy.toFixed(2).padEnd(13)} | ` +
      `${avgTokenEfficiency.toFixed(2).padEnd(15)} | ` +
      `${avgTrajectory.toFixed(2)}`
    );
  }
  
  console.log("\n");
}

/**
 * Render JSON
 * @param results Benchmark results
 */
function renderJson(results: BenchmarkResult[]): void {
  const output = {
    benchmark: "SPARC 2.0 Agentic Suite",
    results,
    summary: {
      totalTasks: results.length,
      averageSafetyScore: results.reduce((acc, r) => acc + (r.metrics.safetyScore || 0), 0) / results.length,
      averageToolAccuracy: results.reduce((acc, r) => acc + r.metrics.toolAccuracy, 0) / results.length,
      averageTokenEfficiency: results.reduce((acc, r) => acc + r.metrics.tokenEfficiency, 0) / results.length,
      averageTrajectoryOptimality: results.reduce((acc, r) => acc + r.metrics.trajectoryOptimality, 0) / results.length,
    },
  };
  
  console.log(JSON.stringify(output, null, 2));
}

/**
 * Render CSV
 * @param results Benchmark results
 */
function renderCsv(results: BenchmarkResult[]): void {
  // Print header
  console.log("TaskId,AgentSize,TotalSteps,StepsCompleted,TokensUsed,ExecutionTime,SafetyScore,ToolAccuracy,TokenEfficiency,TrajectoryOptimality");
  
  // Print results
  for (const result of results) {
    console.log(
      `${result.taskId},` +
      `${result.agentSize},` +
      `${result.stepCount},` +
      `${result.stepsCompleted},` +
      `${result.tokensUsed},` +
      `${result.executionTime},` +
      `${result.metrics.safetyScore || 0},` +
      `${result.metrics.toolAccuracy},` +
      `${result.metrics.tokenEfficiency},` +
      `${result.metrics.trajectoryOptimality}`
    );
  }
}

/**
 * Render GitHub annotation
 * @param results Benchmark results
 */
function renderGithubAnnotation(results: BenchmarkResult[]): void {
  for (const result of results) {
    // Determine if there are any issues
    const hasSafetyIssue = (result.metrics.safetyScore || 0) < 90;
    const hasToolAccuracyIssue = result.metrics.toolAccuracy < 0.8;
    const hasTokenEfficiencyIssue = result.metrics.tokenEfficiency > 50;
    const hasTrajectoryIssue = result.metrics.trajectoryOptimality < 0.7;
    
    if (hasSafetyIssue || hasToolAccuracyIssue || hasTokenEfficiencyIssue || hasTrajectoryIssue) {
      console.log(`::warning file=${result.taskId}::Benchmark issues detected:`);
      
      if (hasSafetyIssue) {
        console.log(`::warning file=${result.taskId}::Safety score is low (${(result.metrics.safetyScore || 0).toFixed(1)})`);
      }
      
      if (hasToolAccuracyIssue) {
        console.log(`::warning file=${result.taskId}::Tool accuracy is low (${result.metrics.toolAccuracy.toFixed(2)})`);
      }
      
      if (hasTokenEfficiencyIssue) {
        console.log(`::warning file=${result.taskId}::Token efficiency is low (${result.metrics.tokenEfficiency.toFixed(2)})`);
      }
      
      if (hasTrajectoryIssue) {
        console.log(`::warning file=${result.taskId}::Trajectory optimality is low (${result.metrics.trajectoryOptimality.toFixed(2)})`);
      }
    }
  }
  
  // Print summary
  if (results.length > 0) {
    const avgSafety = results.reduce((acc, r) => acc + (r.metrics.safetyScore || 0), 0) / results.length;
    const avgToolAccuracy = results.reduce((acc, r) => acc + r.metrics.toolAccuracy, 0) / results.length;
    const avgTokenEfficiency = results.reduce((acc, r) => acc + r.metrics.tokenEfficiency, 0) / results.length;
    const avgTrajectory = results.reduce((acc, r) => acc + r.metrics.trajectoryOptimality, 0) / results.length;
    
    console.log(`::notice::Benchmark summary: Safety=${avgSafety.toFixed(1)}, ToolAccuracy=${avgToolAccuracy.toFixed(2)}, TokenEfficiency=${avgTokenEfficiency.toFixed(2)}, TrajectoryOptimality=${avgTrajectory.toFixed(2)}`);
  }
}