/**
 * SPARC 2.0 Agentic Benchmarking Suite Deno Type Definitions
 * Type definitions for Deno runtime
 */

declare namespace Deno {
  /**
   * Deno namespace
   */
  export interface ReadFileOptions {
    encoding?: string;
  }

  /**
   * Read file
   * @param path File path
   * @param options Read file options
   * @returns File content
   */
  export function readTextFile(path: string, options?: ReadFileOptions): Promise<string>;

  /**
   * Write file
   * @param path File path
   * @param data File content
   * @returns Promise
   */
  export function writeTextFile(path: string, data: string): Promise<void>;

  /**
   * Exit
   * @param code Exit code
   */
  export function exit(code: number): never;
}