/**
 * Simple E2B Code Interpreter Example
 * 
 * This script demonstrates the basic usage of the E2B Code Interpreter SDK.
 * 
 * Usage:
 * 1. Set the E2B_API_KEY environment variable
 * 2. Run with: deno run --allow-env --allow-net e2b-simple.ts
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
  
  try {
    // Create a new Code Interpreter instance
    const sandbox = await CodeInterpreter.create({ apiKey });
    
    // Log the sandbox object to see its structure
    console.log("Sandbox created:", Object.keys(sandbox));
    
    // Try to execute a simple Python code if possible
    if (typeof sandbox.execCode === 'function') {
      console.log("Executing code using sandbox.execCode...");
      const result = await sandbox.execCode('print("Hello, World!")');
      console.log("Result:", result);
    } else if (sandbox.notebook && typeof sandbox.notebook.execCell === 'function') {
      console.log("Executing code using sandbox.notebook.execCell...");
      const result = await sandbox.notebook.execCell('print("Hello, World!")');
      console.log("Result:", result);
    } else {
      console.log("Could not find a method to execute code. Available methods:", 
        Object.getOwnPropertyNames(Object.getPrototypeOf(sandbox)));
    }
    
    // Close the sandbox if possible
    if (typeof sandbox.close === 'function') {
      await sandbox.close();
      console.log("Sandbox closed");
    } else {
      console.log("No close method found on sandbox");
    }
    
  } catch (error: unknown) {
    console.error("Error:", error instanceof Error ? error.message : String(error));
  }
}

// Run the example
runExample();