/**
 * SPARC 2.0 Agentic Benchmarking Suite CLI
 * Command-line interface for the benchmarking suite
 */

import { Command } from "https://deno.land/x/cliffy@v1.0.0-rc.3/command/mod.ts";
import { parseConfig, loadConfigFromEnv, mergeConfigs, loadTasks, saveConfig } from "../utils/config-parser.ts";
import { AgenticEvaluator } from "../metrics/agentic-evaluator.ts";
import { renderAgenticResults } from "./renderer.ts";
import { OutputFormat } from "./renderer.ts";

/**
 * CLI options
 */
interface CliOptions {
  config: string;
  output: string;
  security: "strict" | "moderate" | "permissive";
  steps?: number[][];
  agentSize: "small" | "medium" | "large";
  tokenCache: boolean;
}

/**
 * Run CLI
 */
export async function runCli(): Promise<void> {
  const command = new Command()
    .name("sparc-agent-bench")
    .version("2.3.1")
    .description("SPARC 2.0 Agentic Benchmarking CLI")
    .option("-c, --config <file:string>", "TOML config file", { required: true })
    .option("-o, --output <format:string>", "Output format", { default: "table" })
    .option("-s, --security <level:string>", "Security level", { default: "strict" })
    .option("--steps <steps:number[]>", "Step ranges to test", { collect: true })
    .option("--agent-size <size:string>", "Agent size configuration")
    .option("--token-cache [enabled:boolean]", "Enable token caching")
    .action(async (options) => {
      try {
        // Parse configuration
        const config = await parseConfig(options.config);
        
        // Load environment configuration
        const envConfig = loadConfigFromEnv();
        
        // Merge configurations
        const mergedConfig = mergeConfigs(config, envConfig);
        
        // Override with CLI options
        if (options.steps && options.steps.length > 0) {
          mergedConfig.steps = {
            // Flatten the nested array and extract min/max values
            min: Math.min(...options.steps.flat()),
            max: Math.max(...options.steps.flat()),
            increment: 1
          };
        }
        
        if (options.agentSize) {
          mergedConfig.agent.sizes = [options.agentSize as "small" | "medium" | "large"];
        }
        
        if (options.tokenCache !== undefined) {
          mergedConfig.agent.tokenCache = options.tokenCache;
        }
        
        if (options.security) {
          mergedConfig.security.level = options.security as "strict" | "moderate" | "permissive";
        }
        
        // Create evaluator
        const evaluator = new AgenticEvaluator(mergedConfig);
        
        // Load tasks
        const tasks = await loadTasks("./tasks.json").catch(() => {
          console.log("No tasks.json file found, using default tasks");
          return [
            {
              id: "multiply-bug",
              description: "Fix multiplication bug in test-file.js",
              prompt: "Fix the bug in the multiply function",
              validationFn: (output: string) => output.includes("return a * b"),
              language: "javascript",
              safetyCritical: false,
              stepDependencies: [
                {
                  stepNumber: 1,
                  requiredTools: ["code_editor"],
                  maxTokens: 100,
                },
              ],
            },
          ];
        });
        
        // Set tasks
        evaluator.setTasks(tasks);
        
        // Run suite
        console.log("Running benchmark suite...");
        const results = await evaluator.runSuite();
        
        // Render results
        renderAgenticResults(results, options.output as "table" | "json" | "csv" | "github-annotation");
        
        console.log("Benchmark completed successfully!");
      } catch (error) {
        console.error("Error running benchmark:", error);
      }
    });
  
  // Parse arguments
  await command.parse(Deno.args);
}