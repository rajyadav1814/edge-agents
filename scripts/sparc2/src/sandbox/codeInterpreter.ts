/**
 * CodeInterpreter module for SPARC 2.0
 * Provides a secure sandbox for executing code using the E2B Code Interpreter SDK
 */

import { logMessage } from "../logger.ts";

// Define interfaces for the E2B Code Interpreter SDK
// These are based on the E2B SDK documentation
interface CodeInterpreterOptions {
  apiKey?: string;
}

interface ExecCellOptions {
  onStdout?: (msg: string) => void;
  onStderr?: (msg: string) => void;
}

interface ExecutionResult {
  text: string;
  results: any[];
  error?: Error;
  logs: {
    stdout: string[];
    stderr: string[];
  };
}

interface Notebook {
  execCell: (code: string, options?: ExecCellOptions) => Promise<ExecutionResult>;
}

interface Filesystem {
  write: (path: string, content: string) => Promise<void>;
  read: (path: string) => Promise<string>;
  list: (path: string) => Promise<string[]>;
}

interface CodeInterpreter {
  notebook: Notebook;
  filesystem: Filesystem;
  close: () => Promise<void>;
}

// Mock implementation for CodeInterpreter SDK
// In a real implementation, this would be imported from the E2B SDK
const CodeInterpreterSDK = {
  create: async (options: CodeInterpreterOptions): Promise<CodeInterpreter> => {
    // This is a placeholder for the actual SDK
    // In production, replace with: import { CodeInterpreter } from "@e2b/code-interpreter";
    throw new Error("E2B SDK not available in this environment. This is a mock implementation.");
  }
};

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
    // In production, this would use the actual SDK
    // For now, we'll use our mock implementation
    let interpreter: CodeInterpreter;
    
    try {
      // Try to import the actual SDK
      const { CodeInterpreter } = await import("@e2b/code-interpreter");
      interpreter = await CodeInterpreter.create({ apiKey });
    } catch (error: unknown) {
      // If the import fails, use our mock implementation
      const errorMessage = error instanceof Error ? error.message : String(error);
      await logMessage("error", "Failed to import E2B SDK, using mock implementation", { error: errorMessage });
      interpreter = await CodeInterpreterSDK.create({ apiKey });
    }
    
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
    
    // Add language-specific execution wrapper if needed
    if (options.language === "python" && !code.trim().startsWith("!pip") && !code.trim().startsWith("import")) {
      // For Python, ensure basic imports are available
      preparedCode = "import sys\nimport os\n" + preparedCode;
    }
    
    // Set up execution options
    const execOptions: ExecCellOptions = {};
    if (options.stream) {
      execOptions.onStdout = (msg: string) => console.log("[stdout]", msg);
      execOptions.onStderr = (msg: string) => console.error("[stderr]", msg);
    }
    
    // Execute the code with timeout
    const executionPromise = sandbox.notebook.execCell(preparedCode, execOptions);
    
    // Handle timeout if specified
    let execution: ExecutionResult;
    if (options.timeout) {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Execution timed out after ${options.timeout}ms`)), options.timeout);
      });
      execution = await Promise.race([executionPromise, timeoutPromise]) as ExecutionResult;
    } else {
      execution = await executionPromise;
    }
    
    // Log the execution result
    await logMessage(
      execution.error ? "error" : "info",
      `Code execution ${execution.error ? "failed" : "completed"}`,
      {
        error: execution.error?.message,
        outputLength: execution.text.length,
        resultsCount: execution.results.length
      }
    );
    
    return execution;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logMessage("error", "Code execution failed", { error: errorMessage });
    throw error;
  } finally {
    // Always close the sandbox to free resources
    await sandbox.close();
  }
}

/**
 * Execute a file in the sandbox
 * @param filePath Path to the file to execute
 * @param options Options for execution
 * @returns The execution result
 */
export async function executeFile(
  filePath: string,
  options: {
    stream?: boolean;
    language?: "python" | "javascript" | "typescript";
    timeout?: number;
  } = {}
): Promise<ExecutionResult> {
  try {
    // Read the file
    const code = await Deno.readTextFile(filePath);
    
    // Determine language from file extension if not specified
    if (!options.language) {
      const extension = filePath.split(".").pop()?.toLowerCase();
      if (extension === "py") {
        options.language = "python";
      } else if (extension === "js") {
        options.language = "javascript";
      } else if (extension === "ts") {
        options.language = "typescript";
      }
    }
    
    // Execute the code
    return await executeCode(code, options);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logMessage("error", `Failed to execute file ${filePath}`, { error: errorMessage });
    throw error;
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
      installCommand = `!npm install ${packages.join(" ")}`;
    } else {
      throw new Error(`Unsupported language: ${language}`);
    }
    
    const execution = await sandbox.notebook.execCell(installCommand, {
      onStdout: (msg: string) => console.log("[stdout]", msg),
      onStderr: (msg: string) => console.error("[stderr]", msg)
    });
    
    await logMessage(
      execution.error ? "error" : "info",
      `Package installation ${execution.error ? "failed" : "completed"}`,
      {
        packages,
        language,
        error: execution.error?.message
      }
    );
    
    return execution;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logMessage("error", "Package installation failed", { error: errorMessage, packages, language });
    throw error;
  } finally {
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