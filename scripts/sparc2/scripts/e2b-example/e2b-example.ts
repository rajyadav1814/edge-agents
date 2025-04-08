/**
 * E2B Code Interpreter Example
 * 
 * This script demonstrates how to use the E2B Code Interpreter SDK with Deno.
 * It shows basic functionality like executing code, working with files, and installing packages.
 * 
 * Usage:
 * 1. Set the E2B_API_KEY environment variable
 * 2. Run with: deno run --allow-env --allow-net e2b-example.ts
 */

// Import the E2B SDK
import CodeInterpreter from "https://esm.sh/@e2b/code-interpreter";

// Get API key from environment variable
const apiKey = Deno.env.get("E2B_API_KEY");
if (!apiKey) {
  console.error("Error: E2B_API_KEY environment variable is required");
  Deno.exit(1);
}

async function runExample() {
  console.log("Creating E2B Code Interpreter instance...");
  
  // Create a new Code Interpreter instance
  const sandbox = await CodeInterpreter.create({ apiKey });
  
  try {
    // Example 1: Execute a simple Python code
    console.log("\n--- Example 1: Execute Python Code ---");
    const pythonResult = await sandbox.notebook.execCell(`
import sys
print(f"Python version: {sys.version}")
print("Hello from E2B!")
2 + 2
    `);
    
    console.log("Output:", pythonResult.text);
    console.log("Results:", pythonResult.results);
    
    // Example 2: Write and read a file
    console.log("\n--- Example 2: File Operations ---");
    await sandbox.filesystem.write("/tmp/example.txt", "Hello, E2B file system!");
    const fileContent = await sandbox.filesystem.read("/tmp/example.txt");
    console.log("File content:", fileContent);
    
    // List files in a directory
    const files = await sandbox.filesystem.list("/tmp");
    console.log("Files in /tmp:", files);
    
    // Example 3: Install and use a package
    console.log("\n--- Example 3: Install and Use Package ---");
    const installResult = await sandbox.notebook.execCell("!pip install numpy");
    console.log("Install output:", installResult.text);
    
    const numpyResult = await sandbox.notebook.execCell(`
import numpy as np
arr = np.array([1, 2, 3, 4, 5])
print(f"NumPy array: {arr}")
print(f"Mean: {np.mean(arr)}")
    `);
    
    console.log("NumPy output:", numpyResult.text);
    
  } catch (error: unknown) {
    console.error("Error:", error instanceof Error ? error.message : String(error));
  } finally {
    // Always close the interpreter to free resources
    await sandbox.close();
    console.log("\nInterpreter closed.");
  }
}

// Run the example
runExample();