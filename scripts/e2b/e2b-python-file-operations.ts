/**
 * E2B Python File Operations Example
 * 
 * This script demonstrates how to perform file operations using Python
 * in the E2B Code Interpreter sandbox.
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

    // ===== File Operations Using Python =====
    console.log("\n===== File Operations Using Python =====");
    
    // Write a file using Python
    console.log("\nWriting file using Python...");
    // @ts-ignore - Ignore TypeScript errors for API compatibility
    const writeResult = await sandbox.runCode(`
# Write a file
with open('/tmp/data.txt', 'w') as f:
    f.write('Hello, E2B!\\nThis is a test file.')
print('File written successfully')
    `);
    console.log("Output:", writeResult.logs.stdout[0]);
    
    // Read the file using Python
    console.log("\nReading file using Python...");
    // @ts-ignore - Ignore TypeScript errors for API compatibility
    const readResult = await sandbox.runCode(`
# Read the file
with open('/tmp/data.txt', 'r') as f:
    content = f.read()
print('File content:', content)
    `);
    console.log("Output:", readResult.logs.stdout[0]);
    
    // List files using Python
    console.log("\nListing files using Python...");
    // @ts-ignore - Ignore TypeScript errors for API compatibility
    const listResult = await sandbox.runCode(`
# List files in directory
import os
files = os.listdir('/tmp')
print('Files in /tmp:', files)
    `);
    console.log("Output:", listResult.logs.stdout[0]);

    // Create a directory using Python
    console.log("\nCreating directory using Python...");
    // @ts-ignore - Ignore TypeScript errors for API compatibility
    const mkdirResult = await sandbox.runCode(`
# Create a directory
import os
os.makedirs('/tmp/test_dir', exist_ok=True)
print('Directory created successfully')
    `);
    console.log("Output:", mkdirResult.logs.stdout[0]);

    // Write multiple files using Python
    console.log("\nWriting multiple files using Python...");
    // @ts-ignore - Ignore TypeScript errors for API compatibility
    const writeMultipleResult = await sandbox.runCode(`
# Write multiple files
for i in range(3):
    with open(f'/tmp/test_dir/file_{i}.txt', 'w') as f:
        f.write(f'This is file {i}')
print('Multiple files written successfully')
    `);
    console.log("Output:", writeMultipleResult.logs.stdout[0]);

    // List files in the new directory
    console.log("\nListing files in the new directory...");
    // @ts-ignore - Ignore TypeScript errors for API compatibility
    const listDirResult = await sandbox.runCode(`
# List files in the new directory
import os
files = os.listdir('/tmp/test_dir')
print('Files in /tmp/test_dir:', files)
    `);
    console.log("Output:", listDirResult.logs.stdout[0]);

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