/**
 * E2B Code Interpreter Example
 * 
 * This script demonstrates how to use the E2B Code Interpreter API
 * to execute code in a secure sandbox environment.
 */

// Import the Sandbox class from E2B
import { Sandbox } from "npm:@e2b/code-interpreter";

// Main function to run the example
async function main() {
  try {
    // Get API key from environment variable
    const apiKey = Deno.env.get("E2B_API_KEY");
    if (!apiKey) {
      console.error("E2B_API_KEY environment variable is required");
      Deno.exit(1);
    }

    console.log("Creating code interpreter sandbox...");
    
    // Create a new sandbox instance using the factory method
    // @ts-ignore - Ignore TypeScript errors for API compatibility
    const sandbox = await Sandbox.create({ apiKey });
    console.log("Sandbox created successfully");

    // Execute a simple Python code
    console.log("\nExecuting simple Python code...");
    // @ts-ignore - Ignore TypeScript errors for API compatibility
    const result = await sandbox.runCode("print('Hello from E2B!')");
    
    // Access the stdout from the logs property
    console.log("Output:", result.logs.stdout[0]);

    // Close the sandbox
    console.log("\nClosing sandbox...");
    // @ts-ignore - Ignore TypeScript errors for API compatibility
    await sandbox.kill();
    
    console.log("Example completed successfully!");
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : String(error));
    Deno.exit(1);
  }
}

// Run the example
if (import.meta.main) {
  main();
}
