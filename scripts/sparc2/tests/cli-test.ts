/**
 * CLI Test Script for SPARC 2.0
 * Tests the basic functionality of the CLI with parallel execution
 */

import { main } from "../src/cli/cli.ts";

// Create a test file
const testFilePath = "test-file.js";
const testFileContent = `
function add(a, b) {
  return a + b;
}

function subtract(a, b) {
  return a - b;
}

// This function has a bug
function multiply(a, b) {
  return a + b; // Should be a * b
}

// This function could be improved
function divide(a, b) {
  if (b === 0) {
    throw new Error("Division by zero");
  }
  var result = a / b;
  return result;
}
`;

/**
 * Test the analyze command
 * @returns Promise that resolves when the test is complete
 */
async function testAnalyzeCommand(): Promise<void> {
  console.log("\n=== Testing analyze command ===");
  await main(["analyze", "--files", testFilePath]);
}

/**
 * Test the execute command
 * @returns Promise that resolves when the test is complete
 */
async function testExecuteCommand(): Promise<void> {
  console.log("\n=== Testing execute command ===");
  await main(["execute", "--file", testFilePath]);
}

/**
 * Test the config command
 * @returns Promise that resolves when the test is complete
 */
async function testConfigCommand(): Promise<void> {
  console.log("\n=== Testing config command ===");
  await main(["config", "--action", "list"]);
}

/**
 * Test the help command
 * @returns Promise that resolves when the test is complete
 */
async function testHelpCommand(): Promise<void> {
  console.log("\n=== Testing help command ===");
  await main(["--help"]);
}

/**
 * Run all tests in parallel
 */
async function runTests() {
  try {
    // Write the test file
    await Deno.writeTextFile(testFilePath, testFileContent);
    console.log(`Created test file: ${testFilePath}`);

    // Run all tests in parallel
    await Promise.all([
      testAnalyzeCommand(),
      testExecuteCommand(),
      testConfigCommand(),
      testHelpCommand(),
    ]);

    console.log("\nAll tests completed successfully!");
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    // Clean up the test file
    try {
      await Deno.remove(testFilePath);
      console.log(`Removed test file: ${testFilePath}`);
    } catch (error) {
      console.error(`Failed to remove test file: ${error}`);
    }
  }
}

// Run the tests
await runTests();