/**
 * CLI Test Script for SPARC 2.0
 * Tests the basic functionality of the CLI
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

// Write the test file
await Deno.writeTextFile(testFilePath, testFileContent);
console.log(`Created test file: ${testFilePath}`);

// Test the CLI commands
try {
  // Test the analyze command
  console.log("\n=== Testing analyze command ===");
  await main(["analyze", "--files", testFilePath]);
  
  // Test the execute command
  console.log("\n=== Testing execute command ===");
  await main(["execute", "--file", testFilePath]);
  
  // Test the config command
  console.log("\n=== Testing config command ===");
  await main(["config", "--action", "list"]);
  
  // Test the help command
  console.log("\n=== Testing help command ===");
  await main(["--help"]);
  
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