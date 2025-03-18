/**
 * SPARC 2.0 - Autonomous Diff-Based Coding Bot
 * Main entry point for the application
 */

// Configuration
export { type EnvConfig, loadConfig, loadEnvConfig, type SPARCConfig } from "./config.ts";

// Logging
export {
  logDebug,
  type LogEntry,
  logError,
  logInfo,
  type LogLevel,
  logMessage,
  logWarn,
} from "./logger.ts";

// Vector Store
export {
  type DiffEntry,
  indexDiffEntry,
  searchDiffEntries,
  type VectorSearchResult,
  vectorStoreLog,
} from "./vector/vectorStore.ts";

// Diff Tracking
export { computeDiff, type DiffResult } from "./diff/diffTracker.ts";

// Git Integration
export { createCommit, rollbackChanges } from "./git/gitIntegration.ts";

// Code Interpreter
export { createSandbox, executeCode } from "./sandbox/codeInterpreter.ts";

// Agent
export {
  type AgentOptions,
  type FileToProcess,
  type ModificationResult,
  SPARC2Agent,
} from "./agent/agent.ts";

// CLI
export { main as runCli } from "./cli/cli.ts";

// Edge Function
export { handleEdgeRequest } from "./edge/edge.ts";

// CORS
export {
  applyCorsHeaders,
  corsHeaders,
  createCorsPreflightResponse,
  handleCorsPreflightRequest,
  isCorsPreflightRequest,
} from "./_shared/cors.ts";

/**
 * Main function to run the application
 * @param args Command line arguments
 */
export async function main(args: string[] = Deno.args): Promise<void> {
  // Import the CLI module and run it
  const { main: runCliMain } = await import("./cli/cli.ts");
  await runCliMain();
}

// Run the main function if this file is executed directly
if (import.meta.main) {
  main().catch((err) => {
    console.error("Error running SPARC 2.0:", err);
    Deno.exit(1);
  });
}
