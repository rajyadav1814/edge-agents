/**
 * SPARC-Bench CLI Integration
 * 
 * This module integrates the main entry point with the CLI interface.
 */

import { Command } from "https://deno.land/x/cliffy@v1.0.0-rc.3/command/mod.ts";
import { runSparcBench } from "../../sparc-bench.ts";
import { OutputFormat } from "../types/types.ts";
import { handleError, SparcBenchError, ErrorCodes } from "../utils/error-handler.ts";

/**
 * Run the CLI
 */
export async function runCli(): Promise<void> {
  // Add benchmark command
  const command = new Command()
    .name("sparc-bench")
    .version("2.3.1")
    .description("SPARC-Bench Framework CLI - A comprehensive benchmarking tool for SPARC2 agent systems")
    .command("run")
    .description("Run benchmarks on SPARC2 agent systems")
    .option("-c, --config <file:string>", "Path to configuration file (TOML format)", { default: "./config.toml" })
    .option("-o, --output <format:string>", "Output format for results (table, json, csv, github)", { default: "table" })
    .option("-f, --file <file:string>", "Path to output file for saving results")
    .option("-v, --verbose", "Enable verbose output for detailed logging")
    .option("-b, --benchmark <name:string>", "Name of the specific benchmark to run")
    .option("-t, --type <type:string>", "Type of benchmark to run (humaneval, swebench, redcode)")
    .option("-p, --parallel", "Run benchmarks in parallel mode for faster execution")
    .option("-m, --max-concurrent <number:number>", "Maximum number of concurrent benchmark runs", { default: 2 })
    .option("-r, --results-dir <dir:string>", "Directory to save benchmark results", { default: "./results" })
    .option("--timeout <ms:number>", "Timeout in milliseconds for each benchmark run", { default: 60000 })
    .option("--no-cache", "Disable result caching for fresh benchmark runs")
    .option("--force", "Force run even if cached result exists in the results directory")
    .option("--all", "Run all available benchmarks in the configuration")
    .option("--model <name:string>", "Specify the model to use for benchmarking (e.g., gpt-4o, claude-3-opus)")
    .option("--temperature <value:number>", "Set the temperature for model generation (0.0-1.0)", { default: 0.2 })
    .option("--max-tokens <number:number>", "Maximum tokens for model generation", { default: 4096 })
    .option("--data <path:string>", "Path to benchmark dataset file (e.g., humaneval.jsonl)")
    .example(
      "Basic benchmark run",
      "sparc-bench run -t humaneval -b my-benchmark -o json -f results.json"
    )
    .example(
      "Run with custom model and temperature",
      "sparc-bench run -t humaneval --model gpt-4o --temperature 0.3"
    )
    .example(
      "Run all benchmarks in parallel",
      "sparc-bench run --all -p --max-concurrent 4"
    )
    .action(async (options) => {
      // Run the benchmark
      await runSparcBench(options.config, {
        outputFormat: options.output as OutputFormat,
        outputFile: options.file,
        verbose: options.verbose,
        benchmarkName: options.benchmark,
        benchmarkType: options.type,
        parallel: options.parallel,
        maxConcurrent: options.maxConcurrent,
        resultsDir: options.resultsDir,
        timeout: options.timeout,
        useCache: options.cache !== false,
        forceRun: options.force,
        runAll: options.all,
        model: options.model,
        temperature: options.temperature,
        maxTokens: options.maxTokens,
        dataPath: options.data
      }).catch(error => handleError(error, options.verbose));
      
      console.log("Benchmark completed successfully!");
    });

  // Parse arguments
  try {
    await command.parse(Deno.args);
  } catch (error) {
    handleError(
      new SparcBenchError(
        `Failed to parse command line arguments: ${error instanceof Error ? error.message : String(error)}`,
        ErrorCodes.CONFIG_ERROR
      ),
      false
    );
  }
}

// Run CLI if this is the main module
if (import.meta.main) {
  runCli().catch(error => handleError(error, false));
}