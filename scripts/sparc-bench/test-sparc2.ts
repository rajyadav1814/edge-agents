#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-net --allow-run

/**
 * SPARC 2.0 Agentic Benchmarking Suite Test Runner
 * Tests SPARC2 functionality
 */

import { parseConfig } from "./src/utils/config-parser.ts";
import { AgenticEvaluator } from "./src/metrics/agentic-evaluator.ts";
import { renderAgenticResults } from "./src/cli/renderer.ts";

// Test configuration
const CONFIG_PATH = "./config.toml";

// Test tasks
const TEST_TASKS = [
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
  {
    id: "divide-improve",
    description: "Improve divide function in test-file.js",
    prompt: "Improve the divide function",
    validationFn: (output: string) => output.includes("return a / b"),
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

/**
 * Main function
 */
async function main() {
  try {
    console.log("Loading configuration...");
    const config = await parseConfig(CONFIG_PATH);
    
    console.log("Creating evaluator...");
    const evaluator = new AgenticEvaluator(config);
    
    console.log("Setting tasks...");
    evaluator.setTasks(TEST_TASKS);
    
    console.log("Running benchmark suite...");
    const results = await evaluator.runSuite();
    
    console.log("Rendering results...");
    renderAgenticResults(results, "table");
    
    console.log("Test completed successfully!");
  } catch (error) {
    console.error("Error running test:", error);
  }
}

// Run main function
main().catch(console.error);