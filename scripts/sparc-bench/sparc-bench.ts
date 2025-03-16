#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-net

/**
 * SPARC-Bench Main Entry Point
 * 
 * This module serves as the main entry point for the SPARC-Bench framework,
 * providing a unified interface for running benchmarks, configuring the system,
 * and generating reports.
 */

import { loadConfig } from "./src/utils/config-parser.ts";
import { AgenticEvaluator } from "./src/metrics/agentic-evaluator.ts";
import { SecurityEvaluator } from "./src/metrics/security-evaluator.ts";
import { renderAgenticResults } from "./src/cli/renderer.ts"; 
import { AgenticBenchmarkConfig } from "./src/types/types.ts";
import { OutputFormat } from "./src/types/types.ts";
import { runCli } from "./src/cli/cli.ts";
import { handleError, tryExec, SparcBenchError, ErrorCodes } from "./src/utils/error-handler.ts";

/**
 * Main function to run the SPARC-Bench framework
 * @param configPath Path to the configuration file
 * @param options Additional options for the benchmark
 * @returns Results of the benchmark
 */
export async function runSparcBench(
  configPath: string,
  options: {
    outputFormat?: OutputFormat;
    outputFile?: string;
    verbose?: boolean;
    benchmarkName?: string;
    benchmarkType?: string;
  } = {}
) {
  return await tryExec(async () => {
    // Parse configuration
    const config = await tryExec(
      () => loadConfig(configPath),
      `Failed to load configuration from ${configPath}`,
      options.verbose
    );
    
    // Initialize evaluators
    const agenticEvaluator = new AgenticEvaluator(config);
    const securityEvaluator = new SecurityEvaluator(config.security);
    
    // Run agentic evaluator
    console.log("Running agentic evaluator...");
    const agenticResults = await tryExec(
      () => agenticEvaluator.runSuite(),
      "Failed to run agentic evaluator",
      options.verbose
    );
    
    // Run security evaluation
    console.log("Running security evaluation...");
    const securityResults = await tryExec(
      () => securityEvaluator.runAdversarialTests(config.security.adversarialTests),
      "Failed to run security evaluation",
      options.verbose
    );
    
    const securityScore = securityEvaluator.calculateSecurityScore(securityResults);
    
    // Combine results
    const combinedResults = {
      benchmarks: agenticResults,
      security: {
        securityScore,
        testResults: securityResults
      },
      timestamp: new Date().toISOString(),
      config: config
    };
    
    // Render results
    if (options.outputFormat) {
      renderAgenticResults(agenticResults, options.outputFormat);
    }
    
    // Write results to file if specified
    if (options.outputFile) {
      await tryExec(
        () => Deno.writeTextFile(
          options.outputFile!,
          JSON.stringify(combinedResults, null, 2)
        ),
        `Failed to write results to ${options.outputFile}`,
        options.verbose
      );
      
      if (options.verbose) {
        console.log(`Results written to ${options.outputFile}`);
      }
    }
    
    return combinedResults;
  }, "Failed to run SPARC-Bench", options.verbose);
}

/**
 * Command-line interface for SPARC-Bench
 */
if (import.meta.main) {
  runCli().catch(console.error);
}