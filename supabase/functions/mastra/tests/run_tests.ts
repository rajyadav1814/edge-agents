/**
 * Test runner for Mastra AI agent
 * 
 * This script runs all the tests for the Mastra AI agent.
 * 
 * Usage:
 * deno test --allow-env --allow-net tests/run_tests.ts
 */

import "./index.test.ts";
import "./middleware.test.ts";
import "./weather.test.ts";
import "./config.test.ts";

console.log("All tests imported successfully.");