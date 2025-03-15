/**
 * E2B Default Export Example
 * 
 * This script demonstrates how to use the default export from the E2B SDK
 * to execute code in a secure environment.
 */

// Import the default export from the E2B SDK
import e2b from "npm:@e2b/code-interpreter";

// Log the structure of the imported module
console.log("E2B SDK type:", typeof e2b);
console.log("E2B SDK properties:", Object.keys(e2b));

// Get API key from environment variable
const apiKey = Deno.env.get("E2B_API_KEY");
if (!apiKey) {
  console.error("Error: E2B_API_KEY environment variable is required");
  Deno.exit(1);
}

async function runExample() {
  console.log("Testing E2B SDK...");
  
  try {
    // Check if there's a default export that's a function
    if (typeof e2b.default === 'function') {
      console.log("Using e2b.default function");
      const result = await e2b.default({ apiKey });
      console.log("Result:", result);
    } 
    // Check if Sandbox is a constructor
    else if (typeof e2b.Sandbox === 'function') {
      console.log("Using e2b.Sandbox constructor");
      try {
        const sandbox = new e2b.Sandbox({ apiKey, sandboxId: "test" });
        console.log("Sandbox created:", sandbox);
      } catch (error) {
        console.error("Error creating sandbox:", error);
      }
    }
    // Try other potential ways to use the SDK
    else {
      console.log("Trying other approaches...");
      
      // Try to find any function that might be used to create a sandbox
      const functionProps = Object.keys(e2b).filter(key => typeof e2b[key] === 'function');
      console.log("Available functions:", functionProps);
      
      for (const prop of functionProps) {
        try {
          console.log(`Trying e2b.${prop}...`);
          const result = await e2b[prop]({ apiKey });
          console.log(`Result from e2b.${prop}:`, result);
          break;
        } catch (error) {
          console.error(`Error using e2b.${prop}:`, error);
        }
      }
    }
  } catch (error: unknown) {
    console.error("Error:", error instanceof Error ? error.message : String(error));
  }
}

// Run the example
runExample();