/**
 * E2B Code Interpreter Implementation
 * 
 * This script implements the E2B Code Interpreter functionality as described in
 * the implementation plan. It provides a real implementation that connects to
 * the E2B service using the API key from environment variables.
 */

import { CodeInterpreter } from "https://esm.sh/@e2b/sdk";
import { logMessage } from "../src/logger.ts";

/**
 * Type definition for execution result
 */
export interface ExecutionResult {
  /** Output text from the execution */
  text: string;
  /** Any results or artifacts generated during execution */
  results: any[];
  /** Error information if execution failed */
  error?: {
    type: string;
    value: string;
  } | null;
  /** Logs from the execution */
  logs: {
    stdout: string[];
    stderr: string[];
  };
}

/**
 * Options for creating a code interpreter sandbox
 */
export interface CodeInterpreterOptions {
  /** Optional API key to use instead of the environment variable */
  apiKey?: string;
}

/**
 * Create a new sandbox instance
 * @param options Options for the sandbox
 * @returns A CodeInterpreter instance
 */
export async function createSandbox(options: CodeInterpreterOptions = {}): Promise<CodeInterpreter> {
  const apiKey = options.apiKey || Deno.env.get("E2B_API_KEY");
  if (!apiKey) {
    throw new Error("E2B_API_KEY is required either in options or as an environment variable");
  }

  try {
    // Create a real E2B Code Interpreter instance
    const interpreter = new CodeInterpreter({ apiKey });
    await logMessage("info", "Created code interpreter sandbox");
    return interpreter;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logMessage("error", "Failed to create code interpreter sandbox", { error: errorMessage });
    throw error;
  }
}

/**
 * Execute code in the sandbox
 * @param code The code to execute
 * @param options Options for execution
 * @returns The execution result
 */
export async function executeCode(
  code: string,
  options: {
    stream?: boolean;
    language?: "python" | "javascript" | "typescript";
    timeout?: number;
  } = {}
): Promise<ExecutionResult> {
  const sandbox = await createSandbox();
  
  try {
    // Prepare the code based on the language
    let preparedCode = code;
    if (options.language === "typescript" && !code.includes("///@ts-nocheck")) {
      // Add ts-nocheck to avoid TypeScript errors in the sandbox
      preparedCode = "///@ts-nocheck\n" + code;
    }
    
    if (options.language === "python" && !code.trim().startsWith("!pip") && !code.trim().startsWith("import")) {
      // For Python, ensure basic imports are available
      preparedCode = "import sys\nimport os\n" + preparedCode;
    }
    
    // Set up execution options
    const execOptions: any = {};
    if (options.stream) {
      execOptions.onStdout = (msg: string) => console.log("[stdout]", msg);
      execOptions.onStderr = (msg: string) => console.error("[stderr]", msg);
    }
    
    // Execute the code with timeout
    let execution: any;
    if (options.timeout) {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Execution timed out after ${options.timeout}ms`)), options.timeout);
      });
      
      execution = await Promise.race([
        sandbox.notebook.execCell(preparedCode, execOptions),
        timeoutPromise
      ]);
    } else {
      execution = await sandbox.notebook.execCell(preparedCode, execOptions);
    }
    
    // Format the result to match our ExecutionResult interface
    const result: ExecutionResult = {
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
    
    // Log the execution result
    await logMessage(
      result.error ? "error" : "info",
      `Code execution ${result.error ? "failed" : "completed"}`,
      {
        error: result.error?.value,
        outputLength: result.text.length,
        resultsCount: result.results.length
      }
    );
    
    return result;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logMessage("error", "Code execution failed", { error: errorMessage });
    
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
  } finally {
    // Always close the sandbox to free resources
    await sandbox.close();
  }
}

/**
 * Write a file in the sandbox
 * @param path Path in the sandbox
 * @param content Content to write
 */
export async function writeFile(path: string, content: string): Promise<void> {
  const sandbox = await createSandbox();
  
  try {
    await sandbox.filesystem.write(path, content);
    await logMessage("info", `File written to sandbox: ${path}`, { contentLength: content.length });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logMessage("error", `Failed to write file to sandbox: ${path}`, { error: errorMessage });
    throw error;
  } finally {
    await sandbox.close();
  }
}

/**
 * Read a file from the sandbox
 * @param path Path in the sandbox
 * @returns The file content
 */
export async function readFile(path: string): Promise<string> {
  const sandbox = await createSandbox();
  
  try {
    const content = await sandbox.filesystem.read(path);
    await logMessage("info", `File read from sandbox: ${path}`, { contentLength: content.length });
    return content;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logMessage("error", `Failed to read file from sandbox: ${path}`, { error: errorMessage });
    throw error;
  } finally {
    await sandbox.close();
  }
}

/**
 * List files in the sandbox
 * @param path Path in the sandbox
 * @returns Array of file names
 */
export async function listFiles(path: string): Promise<string[]> {
  const sandbox = await createSandbox();
  
  try {
    const files = await sandbox.filesystem.list(path);
    await logMessage("info", `Listed files in sandbox: ${path}`, { fileCount: files.length });
    return files;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logMessage("error", `Failed to list files in sandbox: ${path}`, { error: errorMessage });
    throw error;
  } finally {
    await sandbox.close();
  }
}

/**
 * Install packages in the sandbox
 * @param packages Array of packages to install
 * @param language The language for which to install packages
 * @returns The execution result
 */
export async function installPackages(
  packages: string[],
  language: "python" | "javascript" | "typescript" = "python"
): Promise<ExecutionResult> {
  const sandbox = await createSandbox();
  
  try {
    let installCommand: string;
    
    if (language === "python") {
      installCommand = `!pip install ${packages.join(" ")}`;
    } else if (language === "javascript" || language === "typescript") {
      installCommand = `const { execSync } = require('child_process'); 
try {
  console.log('Installing packages: ${packages.join(", ")}');
  execSync('npm install ${packages.join(" ")}', { stdio: 'inherit' });
  console.log('Packages installed successfully');
} catch (error) {
  console.error('Failed to install packages:', error.message);
}`;
    } else {
      throw new Error(`Unsupported language: ${language}`);
    }
    
    const execution = await sandbox.notebook.execCell(installCommand, {
      onStdout: (msg: string) => console.log("[stdout]", msg),
      onStderr: (msg: string) => console.error("[stderr]", msg)
    });
    
    // Format the result to match our ExecutionResult interface
    const result: ExecutionResult = {
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
    
    const isError = result.error !== null && result.error !== undefined;
    await logMessage(
      isError ? "error" : "info",
      `Package installation ${isError ? "failed" : "completed"}`,
      {
        packages,
        language,
        error: isError && result.error ? result.error.value : undefined
      }
    );
    
    return result;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logMessage("error", "Package installation failed", { error: errorMessage, packages, language });
    
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
  } finally {
    await sandbox.close();
  }
}

/**
 * Main function to test the E2B Code Interpreter implementation
 */
async function main() {
  console.log("===== E2B Code Interpreter Test =====");
  
  // Test Python code execution
  console.log("\nTesting Python code execution...");
  const pythonResult = await executeCode(`
print("Hello from Python!")
x = 10
y = 20
print(f"The sum of {x} and {y} is {x + y}")
  `, { language: "python" });
  
  if (pythonResult.error) {
    console.error("Python execution failed:", pythonResult.error);
  } else {
    console.log("Python execution succeeded!");
    console.log("Output:");
    pythonResult.logs.stdout.forEach(line => console.log(line));
  }
  
  // Test JavaScript code execution
  console.log("\nTesting JavaScript code execution...");
  const jsResult = await executeCode(`
console.log("Hello from JavaScript!");
const x = 10;
const y = 20;
console.log(\`The sum of \${x} and \${y} is \${x + y}\`);
  `, { language: "javascript" });
  
  if (jsResult.error) {
    console.error("JavaScript execution failed:", jsResult.error);
  } else {
    console.log("JavaScript execution succeeded!");
    console.log("Output:");
    jsResult.logs.stdout.forEach(line => console.log(line));
  }
  
  // Test file operations
  console.log("\nTesting file operations...");
  try {
    // Write a file
    await writeFile("/tmp/test.txt", "Hello, E2B!");
    console.log("File written successfully");
    
    // Read the file
    const content = await readFile("/tmp/test.txt");
    console.log("File content:", content);
    
    // List files
    const files = await listFiles("/tmp");
    console.log("Files in /tmp:", files);
  } catch (error) {
    console.error("File operations failed:", error);
  }
  
  console.log("\nE2B Code Interpreter test completed!");
}

// Run the test if this script is executed directly
if (import.meta.main) {
  main().catch(console.error);
}