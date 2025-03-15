/**
 * E2B Sandbox Example
 * 
 * This script demonstrates how to use the E2B Sandbox class directly
 * to execute code in a secure environment.
 */

// Import the Sandbox class from the E2B SDK
import CodeInterpreter from "npm:@e2b/code-interpreter";
const { Sandbox } = CodeInterpreter;

// Get API key from environment variable
const apiKey = Deno.env.get("E2B_API_KEY");
if (!apiKey) {
  console.error("Error: E2B_API_KEY environment variable is required");
  Deno.exit(1);
}

async function runExample() {
  console.log("Creating E2B Sandbox instance...");
  
  try {
    // Create a new Sandbox instance
    const sandbox = new Sandbox({ apiKey });
    console.log("Sandbox created successfully");
    
    // Log the sandbox object to see its structure
    console.log("Sandbox properties:", Object.getOwnPropertyNames(sandbox));
    console.log("Sandbox methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(sandbox)));
    
    // Try to execute a simple Python code
    console.log("\nExecuting Python code...");
    const process = await sandbox.process.start({
      cmd: "python3 -c 'print(\"Hello from E2B Sandbox!\")'",
    });
    
    const output = await process.wait();
    console.log("Output:", output);
    
    // Close the sandbox
    await sandbox.close();
    console.log("Sandbox closed");
    
  } catch (error: unknown) {
    console.error("Error:", error instanceof Error ? error.message : String(error));
  }
}

// Run the example
runExample();