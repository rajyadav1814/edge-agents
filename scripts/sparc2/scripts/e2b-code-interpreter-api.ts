/**
 * E2B Code Interpreter API Example
 * 
 * This script demonstrates how to use the E2B Code Interpreter API
 * to execute code in a secure sandbox environment.
 */

import { CodeInterpreter } from "npm:@e2b/code-interpreter-api";

// Define interfaces for the code interpreter
interface ExecutionResult {
  text: string;
  results: any[];
  error?: {
    type: string;
    value: string;
  };
  logs: {
    stdout: string[];
    stderr: string[];
  };
}

/**
 * Execute code in a sandbox
 * @param code The code to execute
 * @param apiKey The E2B API key
 * @returns The execution result
 */
export async function executeCode(
  code: string,
  apiKey: string
): Promise<ExecutionResult> {
  try {
    // Create a new code interpreter instance
    const interpreter = new CodeInterpreter({
      apiKey,
    });

    // Execute the code
    const result = await interpreter.runCode({
      code,
      language: "python",
    });

    // Return the execution result
    return {
      text: result.output || "",
      results: result.artifacts || [],
      error: result.error ? { type: "error", value: result.error } : undefined,
      logs: {
        stdout: result.output ? result.output.split("\n") : [],
        stderr: result.error ? result.error.split("\n") : []
      }
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error executing code:", errorMessage);
    
    // Return an error result
    return {
      text: "",
      results: [],
      error: {
        type: "error",
        value: errorMessage
      },
      logs: {
        stdout: [],
        stderr: [errorMessage]
      }
    };
  }
}

// Example usage
if (import.meta.main) {
  const apiKey = Deno.env.get("E2B_API_KEY");
  if (!apiKey) {
    console.error("Error: E2B_API_KEY environment variable is required");
    Deno.exit(1);
  }

  const pythonCode = `
import math

def calculate_circle_area(radius):
    return math.pi * radius ** 2

# Calculate area for different radii
radii = [1, 2, 3, 4, 5]
areas = [calculate_circle_area(r) for r in radii]

print("Circle Areas:")
for r, a in zip(radii, areas):
    print(f"Radius: {r}, Area: {a:.2f}")
  `;

  console.log("Executing Python code...");
  const result = await executeCode(pythonCode, apiKey);
  console.log("Execution completed");
  console.log("Output:", result.text);
}