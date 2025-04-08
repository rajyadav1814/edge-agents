/**
 * Error Handler for SPARC-Bench
 * 
 * This module provides comprehensive error handling for the SPARC-Bench framework.
 */

/**
 * Custom error class for SPARC-Bench
 */
export class SparcBenchError extends Error {
  /**
   * Create a new SparcBenchError
   * @param message Error message
   * @param code Error code
   */
  constructor(
    message: string,
    public code: string = "UNKNOWN_ERROR"
  ) {
    super(message);
    this.name = "SparcBenchError";
  }
}

/**
 * Handle errors in a consistent way
 * @param error Error to handle
 * @param verbose Whether to show verbose output
 */
export function handleError(error: unknown, verbose = false): never {
  if (error instanceof SparcBenchError) {
    console.error(`[${error.code}] ${error.message}`);
    
    if (verbose && error.stack) {
      console.error("\nStack trace:");
      console.error(error.stack);
    }
  } else if (error instanceof Error) {
    console.error(`[ERROR] ${error.message}`);
    
    if (verbose && error.stack) {
      console.error("\nStack trace:");
      console.error(error.stack);
    }
  } else {
    console.error("[ERROR] An unknown error occurred:", error);
  }
  
  Deno.exit(1);
}

/**
 * Try to execute a function and handle any errors
 * @param fn Function to execute
 * @param errorMessage Error message to display if the function throws
 * @param verbose Whether to show verbose output
 * @returns Result of the function
 */
export async function tryExec<T>(
  fn: () => Promise<T> | T,
  errorMessage = "An error occurred",
  verbose = false
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof SparcBenchError) {
      throw error;
    } else if (error instanceof Error) {
      throw new SparcBenchError(`${errorMessage}: ${error.message}`, "EXECUTION_ERROR");
    } else {
      throw new SparcBenchError(`${errorMessage}: ${String(error)}`, "EXECUTION_ERROR");
    }
  }
}

/**
 * Error codes for SPARC-Bench
 */
export const ErrorCodes = {
  CONFIG_ERROR: "CONFIG_ERROR",
  BENCHMARK_ERROR: "BENCHMARK_ERROR",
  EXECUTION_ERROR: "EXECUTION_ERROR",
  SECURITY_ERROR: "SECURITY_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  IO_ERROR: "IO_ERROR",
  UNKNOWN_ERROR: "UNKNOWN_ERROR"
};