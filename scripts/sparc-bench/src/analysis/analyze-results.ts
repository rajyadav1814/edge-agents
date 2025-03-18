/**
 * Benchmark Results Analyzer
 * 
 * This module combines and analyzes results from multiple benchmark runs.
 * It reads benchmark result files, combines them, and outputs a single
 * consolidated result file for further analysis.
 */

import { parse } from "https://deno.land/std/flags/mod.ts";
import { BenchmarkResult } from "../types/types.ts";
import { expandGlob } from "https://deno.land/std/fs/mod.ts";

/**
 * Command line arguments
 */
interface AnalyzeArgs {
  input: string;
  output: string;
}

/**
 * Combined benchmark results
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
 * Benchmark output format
 */
interface BenchmarkOutput {
  benchmarks?: BenchmarkResult[];
  results?: BenchmarkResult[];
  taskId?: string;
  agentSize?: string;
  stepCount?: number;
  stepsCompleted?: number;
  tokensUsed?: number;
  executionTime?: number;
  success?: boolean;
  metrics?: any;
  security?: {
    securityScore: number;
    testResults: any[];
  };
  timestamp?: string;
  config?: any;
}

/**
 * Parse command line arguments
 * @returns Parsed arguments
 */
function parseArgs(): AnalyzeArgs {
  const args = parse(Deno.args, {
    string: ["input", "output"],
    default: {
      output: "./combined_results.json",
    },
  });

  if (!args.input) {
    console.error("Error: Input file pattern is required");
    Deno.exit(1);
  }

  return {
    input: args.input,
    output: args.output,
  };
}

/**
 * Read benchmark result files
 * @param pattern Glob pattern for input files
 * @returns Array of benchmark results
 */
async function readResultFiles(pattern: string): Promise<BenchmarkResult[]> {
  const results: BenchmarkResult[] = [];
  
  try {
    for await (const file of expandGlob(pattern)) {
      console.log(`Reading file: ${file.path}`);
      
      try {
        const content = await Deno.readTextFile(file.path);
        const data: BenchmarkOutput = JSON.parse(content);
        
        // Handle different result formats
        if (data.benchmarks && Array.isArray(data.benchmarks)) {
          // If the file contains a benchmarks property with an array
          results.push(...data.benchmarks);
          console.log(`Added ${data.benchmarks.length} results from benchmarks property`);
        } else if (Array.isArray(data)) {
          // If the file contains an array of results
          results.push(...data);
          console.log(`Added ${data.length} results from array`);
        } else if (data.results && Array.isArray(data.results)) {
          // If the file contains a results property with an array
          results.push(...data.results);
          console.log(`Added ${data.results.length} results from results property`);
        } else if (data.taskId && typeof data.taskId === 'string') {
          // If the file contains a single result
          results.push(data as unknown as BenchmarkResult);
          console.log(`Added single result with taskId: ${data.taskId}`);
        } else {
          console.warn(`Skipping file ${file.path}: Unknown format or empty results`);
        }
      } catch (error) {
        console.error(`Error reading file ${file.path}:`, error);
      }
    }
  } catch (error) {
    console.error("Error reading input files:", error);
    Deno.exit(1);
  }
  
  return results;
}

/**
 * Combine benchmark results
 * @param results Array of benchmark results
 * @returns Combined results
 */
function combineResults(results: BenchmarkResult[]): CombinedResults {
  // Calculate averages
  let totalSafetyScore = 0;
  let totalToolAccuracy = 0;
  let totalTokenEfficiency = 0;
  let totalTrajectoryOptimality = 0;
  let safetyCount = 0;
  let toolAccuracyCount = 0;
  let tokenEfficiencyCount = 0;
  let trajectoryOptimalityCount = 0;
  
  for (const result of results) {
    if (result.safetyScore !== undefined) {
      totalSafetyScore += result.safetyScore;
      safetyCount++;
    } else if (result.metrics?.safetyScore !== undefined) {
      totalSafetyScore += result.metrics.safetyScore;
      safetyCount++;
    }
    
    if (result.toolAccuracy !== undefined) {
      totalToolAccuracy += result.toolAccuracy;
      toolAccuracyCount++;
    } else if (result.metrics?.toolAccuracy !== undefined) {
      totalToolAccuracy += result.metrics.toolAccuracy;
      toolAccuracyCount++;
    }
    
    if (result.tokenEfficiency !== undefined) {
      totalTokenEfficiency += result.tokenEfficiency;
      tokenEfficiencyCount++;
    } else if (result.metrics?.tokenEfficiency !== undefined) {
      totalTokenEfficiency += result.metrics.tokenEfficiency;
      tokenEfficiencyCount++;
    }
    
    if (result.trajectoryOptimality !== undefined) {
      totalTrajectoryOptimality += result.trajectoryOptimality;
      trajectoryOptimalityCount++;
    } else if (result.metrics?.trajectoryOptimality !== undefined) {
      totalTrajectoryOptimality += result.metrics.trajectoryOptimality;
      trajectoryOptimalityCount++;
    }
  }
  
  return {
    benchmark: "SPARC 2.0 Agentic Suite",
    results,
    summary: {
      totalTasks: results.length,
      averageSafetyScore: safetyCount > 0 ? totalSafetyScore / safetyCount : null,
      averageToolAccuracy: toolAccuracyCount > 0 ? totalToolAccuracy / toolAccuracyCount : null,
      averageTokenEfficiency: tokenEfficiencyCount > 0 ? totalTokenEfficiency / tokenEfficiencyCount : null,
      averageTrajectoryOptimality: trajectoryOptimalityCount > 0 ? totalTrajectoryOptimality / trajectoryOptimalityCount : null,
    },
  };
}

/**
 * Main function
 */
async function main() {
  const args = parseArgs();
  console.log(`Analyzing benchmark results from ${args.input}`);
  
  // Read result files
  const results = await readResultFiles(args.input);
  console.log(`Found ${results.length} benchmark results`);
  
  if (results.length === 0) {
    console.warn("No benchmark results found");
    // Create an empty result file
    const emptyResults: CombinedResults = {
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
    
    await Deno.writeTextFile(args.output, JSON.stringify(emptyResults, null, 2));
    console.log(`Results written to ${args.output}`);
    return;
  }
  
  // Combine results
  const combinedResults = combineResults(results);
  
  // Write combined results
  await Deno.writeTextFile(args.output, JSON.stringify(combinedResults, null, 2));
  console.log(`Results written to ${args.output}`);
}

// Run the main function
if (import.meta.main) {
  main();
}