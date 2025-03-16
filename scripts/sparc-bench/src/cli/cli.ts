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
    .description("SPARC-Bench Framework CLI")
    .command("run")
    .description("Run benchmarks")
    .option("-c, --config <file:string>", "Configuration file", { default: "./config.toml" })
    .option("-o, --output <format:string>", "Output format (table, json, csv, github)", { default: "table" })
    .option("-f, --file <file:string>", "Output file")
    .option("-v, --verbose", "Verbose output")
    .option("-b, --benchmark <name:string>", "Benchmark name")
    .option("-t, --type <type:string>", "Benchmark type")
    .action(async (options) => {
      // Run the benchmark
      await runSparcBench(options.config, {
        outputFormat: options.output as OutputFormat,
        outputFile: options.file,
        verbose: options.verbose,
        benchmarkName: options.benchmark,
        benchmarkType: options.type
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