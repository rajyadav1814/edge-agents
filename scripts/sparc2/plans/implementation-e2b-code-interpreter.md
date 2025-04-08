# E2B Code Interpreter Implementation Plan

## Overview

This document outlines the plan to replace the mock implementation of the E2B Code Interpreter with a fully functional implementation that connects to the actual E2B service using the API key from the environment variables.

## Current Status

The current implementation in `src/sandbox/codeInterpreter.ts` uses a mock implementation that simulates code execution but doesn't actually run any code. The tests are written to work with this mock implementation, using stubs and spies to verify the behavior.

## Implementation Goals

1. Implement a real E2B Code Interpreter SDK client
2. Maintain the existing API surface to ensure compatibility with the rest of the codebase
3. Use the E2B API key from the environment variables
4. Ensure all tests continue to pass with the new implementation

## Implementation Steps

### 1. Install E2B SDK

The E2B SDK needs to be installed as a dependency. Since the project is using Deno, we'll need to use the appropriate import syntax.

```typescript
// Import the E2B SDK
import { CodeInterpreter } from "https://esm.sh/@e2b/sdk";
```

### 2. Update the createSandbox Function

Replace the mock implementation with a real implementation that connects to the E2B service.

```typescript
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
```

### 3. Update the executeCode Function

Update the executeCode function to use the real E2B Code Interpreter API.

```typescript
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
    const execOptions: any = {};
    if (options.stream) {
      execOptions.onStdout = (msg: string) => console.log("[stdout]", msg);
      execOptions.onStderr = (msg: string) => console.error("[stderr]", msg);
    }
    
    // Execute the code with timeout
    let execution: ExecutionResult;
    if (options.timeout) {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Execution timed out after ${options.timeout}ms`)), options.timeout);
      });
      
      execution = await Promise.race([
        sandbox.notebook.execCell(preparedCode, execOptions),
        timeoutPromise
      ]) as ExecutionResult;
    } else {
      execution = await sandbox.notebook.execCell(preparedCode, execOptions);
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
```

### 4. Update the File Operations Functions

Update the file operations functions to use the real E2B filesystem API.

```typescript
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
```

### 5. Update the installPackages Function

Update the installPackages function to use the real E2B API.

```typescript
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
```

## Testing Strategy

1. Update the test file to use the real E2B SDK for integration tests
2. Add a flag to switch between mock and real implementations for testing
3. Ensure all tests pass with both the mock and real implementations

## Deployment Considerations

1. Ensure the E2B_API_KEY environment variable is set in all environments
2. Monitor usage and costs associated with the E2B service
3. Implement rate limiting and caching if necessary to reduce costs

## Fallback Strategy

If the E2B service is unavailable or the API key is invalid, the system should fall back to a degraded mode where code execution is disabled but other functionality continues to work.