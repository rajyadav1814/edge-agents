# Main Entry Point Plan

## Overview
This plan outlines the implementation of the main entry point for the SPARC-Bench framework. The main entry point will provide a unified interface for running benchmarks, configuring the system, and generating reports.

## Implementation Details

### Main Entry Point (sparc-bench.ts)

The main entry point will serve as the primary interface for the SPARC-Bench framework, integrating all components and providing a unified API.

```typescript
/**
 * SPARC-Bench Main Entry Point
 * 
 * This module serves as the main entry point for the SPARC-Bench framework,
 * providing a unified interface for running benchmarks, configuring the system,
 * and generating reports.
 */

import { parseConfig } from "./src/utils/config-parser.ts";
import { AgenticEvaluator } from "./src/metrics/agentic-evaluator.ts";
import { SecurityEvaluator } from "./src/metrics/security-evaluator.ts";
import { renderResults } from "./src/cli/renderer.ts";
import { BenchmarkManager } from "./src/benchmarks/benchmark-manager.ts";
import { AgenticBenchmarkConfig } from "./src/types/types.ts";

/**
 * Main function to run the SPARC-Bench framework
 * @param configPath Path to the configuration file
 * @param options Additional options for the benchmark
 * @returns Results of the benchmark
 */
export async function runSparcBench(
  configPath: string,
  options: {
    outputFormat?: "table" | "json" | "csv" | "github";
    outputFile?: string;
    verbose?: boolean;
    benchmarkName?: string;
    benchmarkType?: string;
  } = {}
) {
  // Parse configuration
  const config = await parseConfig(configPath);
  
  // Initialize benchmark manager
  const benchmarkManager = new BenchmarkManager();
  
  // Initialize evaluators
  const agenticEvaluator = new AgenticEvaluator(config);
  const securityEvaluator = new SecurityEvaluator(config.security);
  
  // Run benchmarks
  let results = [];
  
  if (options.benchmarkName) {
    // Run a specific benchmark
    results = [await benchmarkManager.runBenchmark(options.benchmarkName)];
  } else if (options.benchmarkType) {
    // Run all benchmarks of a specific type
    results = await benchmarkManager.runBenchmarksByType(options.benchmarkType);
  } else {
    // Run all benchmarks
    results = await benchmarkManager.runAllBenchmarks();
  }
  
  // Run security evaluation
  const securityResults = await securityEvaluator.evaluateSecurity();
  
  // Combine results
  const combinedResults = {
    benchmarks: results,
    security: securityResults,
    timestamp: new Date().toISOString(),
    config: config
  };
  
  // Render results
  if (options.outputFormat) {
    renderResults(combinedResults, options.outputFormat);
  }
  
  // Write results to file if specified
  if (options.outputFile) {
    await Deno.writeTextFile(
      options.outputFile,
      JSON.stringify(combinedResults, null, 2)
    );
    
    if (options.verbose) {
      console.log(`Results written to ${options.outputFile}`);
    }
  }
  
  return combinedResults;
}

/**
 * Command-line interface for SPARC-Bench
 */
if (import.meta.main) {
  const { args } = Deno;
  
  // Parse command-line arguments
  const configPath = args[0] || "./config.toml";
  const outputFormat = args[1] as "table" | "json" | "csv" | "github" || "table";
  const outputFile = args[2];
  const verbose = args.includes("--verbose");
  const benchmarkName = args.includes("--benchmark") ? args[args.indexOf("--benchmark") + 1] : undefined;
  const benchmarkType = args.includes("--type") ? args[args.indexOf("--type") + 1] : undefined;
  
  // Run the benchmark
  runSparcBench(configPath, {
    outputFormat,
    outputFile,
    verbose,
    benchmarkName,
    benchmarkType
  }).catch(console.error);
}
```

### CLI Integration

The main entry point will be integrated with the CLI to provide a command-line interface for running benchmarks:

```typescript
// src/cli/cli.ts
import { Command } from "../../deps.ts";
import { runSparcBench } from "../../sparc-bench.ts";

// Add benchmark command
await new Command()
  // ... existing commands ...
  .command("run")
  .description("Run benchmarks")
  .option("-c, --config <file>", "Configuration file", { default: "./config.toml" })
  .option("-o, --output <format>", "Output format (table, json, csv, github)", { default: "table" })
  .option("-f, --file <file>", "Output file")
  .option("-v, --verbose", "Verbose output")
  .option("-b, --benchmark <name>", "Benchmark name")
  .option("-t, --type <type>", "Benchmark type")
  .action(async (options) => {
    await runSparcBench(options.config, {
      outputFormat: options.output,
      outputFile: options.file,
      verbose: options.verbose,
      benchmarkName: options.benchmark,
      benchmarkType: options.type
    });
  })
  .parse(Deno.args);
```

## Integration with Other Components

The main entry point will integrate with the following components:

1. **Config Parser**: To parse the configuration file
2. **Benchmark Manager**: To run benchmarks
3. **Agentic Evaluator**: To evaluate agentic metrics
4. **Security Evaluator**: To evaluate security metrics
5. **Renderer**: To render results in different formats

## Error Handling

The main entry point will include comprehensive error handling to ensure that errors are properly reported and do not crash the application:

```typescript
try {
  // Run benchmarks
} catch (error) {
  console.error("Error running benchmarks:", error);
  Deno.exit(1);
}
```

## Extensibility

The main entry point will be designed to be extensible, allowing for the addition of new benchmark types, metrics, and output formats in the future.