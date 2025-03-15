/**
 * CLI module for SPARC 2.0
 * Provides a command-line interface for the autonomous diff-based coding bot
 */

import { parse } from "https://deno.land/std@0.203.0/flags/mod.ts";
import { loadConfig, SPARCConfig } from "../config.ts";
import { SPARC2Agent, AgentOptions, FileToProcess } from "../agent/agent.ts";
import { logMessage } from "../logger.ts";

/**
 * Display help information
 */
function displayHelp(): void {
  console.log(`SPARC 2.0 CLI Help:
Usage: sparc2 [options]

Options:
  --config <path>         Specify TOML config file path. Default: ./config.toml
  --diff-mode <file|function>   Set diff logging mode. Default: file (optimal for performance)
  --mode <automatic|semi|manual|custom>  Set execution mode. Default: automatic
  --processing <parallel|sequential|concurrent|swarm>  Set task processing strategy. Default: parallel
  --rollback <target>     Rollback to a specified checkpoint or temporal identifier.
  --checkpoint <name>     Create a checkpoint with the specified name.
  --plan <description>    Provide a task description for planning and execution.
  --files <file paths>    Comma-separated list of files to process.
  --model <model name>    Override the model specified in the config.
  --execute <code>        Execute code in the sandbox.
  --language <language>   Language for code execution (python, javascript, typescript).
  --help, -h              Show this help message.

Examples:
  sparc2 --plan "Update error handling" --files "src/file1.ts,src/file2.ts"
  sparc2 --diff-mode=function --plan "Refactor authentication" --files "src/auth.ts"
  sparc2 --rollback checkpoint-123
  sparc2 --execute "console.log('Hello, world!')" --language typescript

Notes:
- Per-file diff logging is the default for best performance and error-free operation.
- Use per-function diff logging (via --diff-mode=function) for more granular change tracking.
- TOML config supports flexible execution rules for parallel, sequential, concurrent, or swarm processing.
`);
}

/**
 * Parse file paths from a comma-separated string
 * @param filesArg Comma-separated list of file paths
 * @returns Array of file paths
 */
function parseFilePaths(filesArg: string): string[] {
  return filesArg.split(",").map(path => path.trim());
}

/**
 * Read files from disk
 * @param filePaths Array of file paths
 * @returns Array of files with their content
 */
async function readFiles(filePaths: string[]): Promise<FileToProcess[]> {
  const files: FileToProcess[] = [];
  
  for (const path of filePaths) {
    try {
      const content = await Deno.readTextFile(path);
      files.push({ path, content });
    } catch (error) {
      await logMessage("error", `Failed to read file: ${path}`, { error: String(error) });
      throw new Error(`Failed to read file: ${path}`);
    }
  }
  
  return files;
}

/**
 * Main CLI function
 */
export async function main(): Promise<void> {
  const args = parse(Deno.args, {
    string: ["config", "diff-mode", "mode", "processing", "rollback", "checkpoint", "plan", "files", "model", "execute", "language"],
    boolean: ["help"],
    alias: { h: "help" }
  });
  
  // Show help if requested
  if (args.help || args.h) {
    displayHelp();
    return;
  }
  
  try {
    // Load config
    const configPath = args.config || "./config.toml";
    const tomlConfig = await loadConfig(configPath);
    
    // Create agent options
    const agentOptions: AgentOptions = {
      model: args.model || tomlConfig.models.reasoning,
      mode: (args.mode as any) || tomlConfig.execution.mode,
      diffMode: (args["diff-mode"] as any) || tomlConfig.execution.diff_mode,
      processing: (args.processing as any) || tomlConfig.execution.processing,
    };
    
    // Create and initialize agent
    const agent = new SPARC2Agent(agentOptions);
    await agent.init();
    
    // Handle rollback
    if (args.rollback) {
      const rollbackTarget = args.rollback;
      const rollbackMode = rollbackTarget.startsWith("cp") ? "checkpoint" : "temporal";
      await agent.rollback(rollbackTarget, rollbackMode);
      await logMessage("info", `Rollback to ${rollbackTarget} completed`);
      return;
    }
    
    // Handle checkpoint creation
    if (args.checkpoint) {
      const checkpointName = args.checkpoint;
      const hash = await agent.createCheckpoint(checkpointName);
      await logMessage("info", `Checkpoint ${checkpointName} created with hash ${hash}`);
      return;
    }
    
    // Handle code execution
    if (args.execute) {
      const code = args.execute;
      const language = args.language as "python" | "javascript" | "typescript" | undefined;
      
      await logMessage("info", `Executing code in ${language || "default"} mode`);
      const result = await agent.executeCode(code, { language });
      
      console.log("Execution result:");
      console.log(result.text);
      
      if (result.error) {
        console.error("Error:", result.error);
      }
      
      return;
    }
    
    // Handle planning and execution
    if (args.plan) {
      const plan = args.plan;
      
      // Check if files are provided
      if (!args.files) {
        console.error("Error: --files argument is required with --plan");
        displayHelp();
        Deno.exit(1);
      }
      
      // Parse file paths
      const filePaths = parseFilePaths(args.files);
      
      // Read files
      const files = await readFiles(filePaths);
      
      // Execute plan
      await logMessage("info", `Executing plan: ${plan}`, { fileCount: files.length });
      const results = await agent.planAndExecute(plan, files);
      
      // Display results
      console.log(`Plan execution completed. Modified ${results.length} files:`);
      for (const result of results) {
        console.log(`- ${result.path} ${result.commitHash ? `(commit: ${result.commitHash})` : ""}`);
      }
      
      return;
    }
    
    // If no command was provided, show help
    console.log("No valid command provided. Use --help for usage information.");
    displayHelp();
    
  } catch (error) {
    await logMessage("error", "CLI error", { error: String(error) });
    console.error("Error:", error instanceof Error ? error.message : String(error));
    Deno.exit(1);
  }
}

// Run main function if this is the main module
if (import.meta.main) {
  main().catch(error => {
    console.error("Unhandled error:", error);
    Deno.exit(1);
  });
}