/**
 * Tests for the main index module
 */

import { assertEquals } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import * as SPARC2 from "./index.ts";

Deno.test("index exports all expected modules and functions", () => {
  // Configuration
  assertEquals(typeof SPARC2.loadConfig, "function", "loadConfig should be exported");
  assertEquals(typeof SPARC2.loadEnvConfig, "function", "loadEnvConfig should be exported");

  // Logging
  assertEquals(typeof SPARC2.logMessage, "function", "logMessage should be exported");
  assertEquals(typeof SPARC2.logInfo, "function", "logInfo should be exported");
  assertEquals(typeof SPARC2.logError, "function", "logError should be exported");
  assertEquals(typeof SPARC2.logDebug, "function", "logDebug should be exported");
  assertEquals(typeof SPARC2.logWarn, "function", "logWarn should be exported");

  // Vector Store
  assertEquals(typeof SPARC2.vectorStoreLog, "function", "vectorStoreLog should be exported");
  assertEquals(typeof SPARC2.indexDiffEntry, "function", "indexDiffEntry should be exported");
  assertEquals(typeof SPARC2.searchDiffEntries, "function", "searchDiffEntries should be exported");

  // Diff Tracking
  assertEquals(typeof SPARC2.computeDiff, "function", "computeDiff should be exported");

  // Git Integration
  assertEquals(typeof SPARC2.createCommit, "function", "createCommit should be exported");
  assertEquals(typeof SPARC2.rollbackChanges, "function", "rollbackChanges should be exported");

  // Code Interpreter
  assertEquals(typeof SPARC2.createSandbox, "function", "createSandbox should be exported");
  assertEquals(typeof SPARC2.executeCode, "function", "executeCode should be exported");

  // Agent
  assertEquals(typeof SPARC2.SPARC2Agent, "function", "SPARC2Agent should be exported");

  // CLI
  assertEquals(typeof SPARC2.runCli, "function", "runCli should be exported");

  // Edge Function
  assertEquals(typeof SPARC2.handleEdgeRequest, "function", "handleEdgeRequest should be exported");

  // CORS
  assertEquals(typeof SPARC2.corsHeaders, "object", "corsHeaders should be exported");
  assertEquals(typeof SPARC2.applyCorsHeaders, "function", "applyCorsHeaders should be exported");
  assertEquals(
    typeof SPARC2.createCorsPreflightResponse,
    "function",
    "createCorsPreflightResponse should be exported",
  );
  assertEquals(
    typeof SPARC2.isCorsPreflightRequest,
    "function",
    "isCorsPreflightRequest should be exported",
  );
  assertEquals(
    typeof SPARC2.handleCorsPreflightRequest,
    "function",
    "handleCorsPreflightRequest should be exported",
  );

  // Main function
  assertEquals(typeof SPARC2.main, "function", "main should be exported");
});

Deno.test("main function should import and run CLI main", async () => {
  // Create a mock for the CLI main function
  const originalRunCli = SPARC2.runCli;
  let mainCalled = false;

  try {
    // Replace the real main function with our mock
    // @ts-ignore: Overriding for test purposes
    SPARC2.runCli = () => {
      mainCalled = true;
      return Promise.resolve();
    };

    // Call the main function
    await SPARC2.main();

    // Verify that the CLI main function was called
    assertEquals(mainCalled, true, "CLI main function should be called");
  } finally {
    // Restore the original main function
    // @ts-ignore: Restoring original function after test
    SPARC2.runCli = originalRunCli;
  }
});
