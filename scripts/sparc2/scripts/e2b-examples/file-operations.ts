/**
 * E2B File Operations Example
 * 
 * This example demonstrates how to perform file operations using the E2B Code Interpreter
 * in the SPARC2 framework.
 */

import { createSandbox, writeFile, readFile, listFiles, executeCode } from "../../src/sandbox/codeInterpreter.ts";

/**
 * Main function to run the example
 */
async function main() {
  console.log("===== E2B File Operations Example =====");
  
  // Create a sandbox instance to use for all operations
  const sandbox = await createSandbox();
  
  try {
    // 1. Write a text file
    console.log("\n1. Writing a text file...");
    const textContent = "Hello, E2B!\nThis is a sample text file created in the sandbox.\nIt demonstrates file operations.";
    await writeFile("/tmp/sample.txt", textContent, {}, sandbox);
    console.log("Text file written successfully.");
    
    // 2. Read the text file
    console.log("\n2. Reading the text file...");
    const readTextContent = await readFile("/tmp/sample.txt", {}, sandbox);
    console.log("File content:");
    console.log(readTextContent);
    
    // 3. Write a JSON file
    console.log("\n3. Writing a JSON file...");
    const jsonContent = JSON.stringify({
      name: "E2B Example",
      type: "File Operations",
      features: ["Write files", "Read files", "List files"],
      metadata: {
        created: new Date().toISOString(),
        version: "1.0.0"
      }
    }, null, 2);
    await writeFile("/tmp/data.json", jsonContent, {}, sandbox);
    console.log("JSON file written successfully.");
    
    // 4. Read the JSON file
    console.log("\n4. Reading the JSON file...");
    const readJsonContent = await readFile("/tmp/data.json", {}, sandbox);
    console.log("File content:");
    console.log(readJsonContent);
    
    // 5. Create a directory structure
    console.log("\n5. Creating a directory structure...");
    // Create a Python script
    const pythonScript = `
def greet(name):
    return f"Hello, {name}!"

if __name__ == "__main__":
    print(greet("E2B User"))
`;
    await writeFile("/tmp/project/scripts/hello.py", pythonScript, {}, sandbox);
    
    // Create a README file
    const readmeContent = `# Sample Project
    
This is a sample project created in the E2B sandbox.

## Files
- scripts/hello.py: A simple Python greeting script
- data/config.json: Configuration file
`;
    await writeFile("/tmp/project/README.md", readmeContent, {}, sandbox);
    
    // Create a config file
    const configContent = JSON.stringify({
      appName: "SampleApp",
      debug: true,
      maxRetries: 3,
      timeout: 5000
    }, null, 2);
    await writeFile("/tmp/project/data/config.json", configContent, {}, sandbox);
    
    console.log("Directory structure created successfully.");
    
    // 6. List files in the project directory
    console.log("\n6. Listing files in the project directory...");
    const projectFiles = await listFiles("/tmp/project", {}, sandbox);
    console.log("Files in /tmp/project:");
    console.log(projectFiles);
    
    // 7. List files in the scripts directory
    console.log("\n7. Listing files in the scripts directory...");
    const scriptFiles = await listFiles("/tmp/project/scripts", {}, sandbox);
    console.log("Files in /tmp/project/scripts:");
    console.log(scriptFiles);
    
    // 8. List files in the data directory
    console.log("\n8. Listing files in the data directory...");
    const dataFiles = await listFiles("/tmp/project/data", {}, sandbox);
    console.log("Files in /tmp/project/data:");
    console.log(dataFiles);
    
    // 9. Execute the Python script using the sandbox directly
    console.log("\n9. Executing the Python script...");
    const pythonCode = `
with open("/tmp/project/scripts/hello.py", "r") as f:
    code = f.read()
    exec(code)
    
# Call the greet function with a different name 
print(greet("SPARC2 User"))
`;
    
    // Execute the code directly on the sandbox instance
    // @ts-ignore - Ignore TypeScript errors for API compatibility
    const execution = await sandbox.runCode(pythonCode, { language: "python" });
    
    // Format the result
    const result = {
      text: execution.text || "",
      results: execution.results || [],
      error: execution.error ? {
        type: "error",
        value: typeof execution.error === 'string' ? execution.error : 
              JSON.stringify(execution.error)
      } : null,
      logs: {
        stdout: Array.isArray(execution.logs?.stdout) ? execution.logs.stdout : 
               (execution.logs?.stdout ? [execution.logs.stdout] : []),
        stderr: Array.isArray(execution.logs?.stderr) ? execution.logs.stderr : 
               (execution.logs?.stderr ? [execution.logs.stderr] : [])
      }
    };
    
    console.log("Execution result:");
    result.logs.stdout.forEach((line: string) => console.log(line));
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    // Always close the sandbox when done
    await sandbox.kill?.();
    console.log("\nSandbox closed.");
  }
}

// Run the example
main().catch(console.error);