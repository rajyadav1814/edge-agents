/**
 * SPARC2 Agent
 * Main agent implementation for SPARC2
 */

import { logMessage } from "../logger.ts";
import { computeDiff } from "../diff/diffTracker.ts";
import {
  createCheckpoint,
  createCommit,
  getCurrentBranch,
  isRepoClean,
  rollbackChanges,
} from "../git/gitIntegration.ts";
import { indexDiffEntry } from "../vector/vectorStore.ts";
import { executeCode } from "../sandbox/codeInterpreter.ts";
import { parseAgentConfig } from "./config/config-parser.ts";
import { AgentExecutor } from "./executor/agent-executor.ts";
import { AgentConfig, AgentContext } from "./types.ts";

// Import OpenAI for type checking
import OpenAI from "npm:openai";

/**
 * Agent options
 */
export interface AgentOptions {
  /** Model to use for the agent */
  model?: string;
  /** Mode for the agent (automatic, interactive, etc.) */
  mode?: "automatic" | "interactive";
  /** Diff mode (file, function) */
  diffMode?: "file" | "function";
  /** Processing mode (sequential, parallel) */
  processing?: "sequential" | "parallel";
  /** Path to the agent configuration file */
  configPath?: string;
}

/**
 * File to process
 */
export interface FileToProcess {
  /** Path to the file */
  path: string;
  /** Original content of the file */
  originalContent: string;
  /** New content of the file (if modified) */
  newContent?: string;
}

/**
 * Modification result
 */
export interface ModificationResult {
  /** Path to the file */
  path: string;
  /** Whether the modification was successful */
  success: boolean;
  /** Original content of the file */
  originalContent?: string;
  /** Modified content of the file */
  modifiedContent?: string;
  /** Diff between original and modified content */
  diff?: string;
  /** Commit hash if committed */
  commitHash?: string;
  /** Error message if failed */
  error?: string;
}

/**
 * SPARC2 Agent
 * Autonomous agent for code analysis and modification
 */
export class SPARC2Agent {
  private options: AgentOptions;
  private openai: OpenAI;
  private config: AgentConfig | null = null;
  private executor: AgentExecutor | null = null;

  /**
   * Create a new SPARC2 agent
   * @param options Agent options
   */
  constructor(options: AgentOptions = {}) {
    this.options = {
      model: options.model || "gpt-4o",
      mode: options.mode || "automatic",
      diffMode: options.diffMode || "file",
      processing: options.processing || "sequential",
      configPath: options.configPath || "config/agent-config.toml",
    };

    // Initialize OpenAI client
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is required");
    }

    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Initialize the agent
   */
  async init(): Promise<void> {
    try {
      // Load configuration
      this.config = await parseAgentConfig(
        this.options.configPath ||
          "/workspaces/edge-agents/scripts/sparc2/config/agent-config.toml",
      );

      // Create executor
      this.executor = new AgentExecutor(this.config);

      await logMessage("info", "SPARC2 Agent initialized", {
        model: this.options.model,
        mode: this.options.mode,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await logMessage("error", "Failed to initialize SPARC2 Agent", { error: errorMessage });
      throw error;
    }
  }

  /**
   * Analyze and compute diff for a file
   * @param path Path to the file
   * @param oldContent Original content
   * @param newContent New content
   * @returns Diff between old and new content
   */
  async analyzeAndDiff(path: string, oldContent: string, newContent: string): Promise<string> {
    try {
      // Compute diff
      const diff = await computeDiff(oldContent, newContent, this.options.diffMode);

      // If there are no changes, return empty string
      if (diff.changedLines === 0) {
        await logMessage("info", `No changes detected for ${path}`);
        return "";
      }

      // Index the diff in the vector store
      await indexDiffEntry({
        id: crypto.randomUUID(),
        file: path,
        diff: diff.diffText,
        metadata: {
          timestamp: new Date().toISOString(),
          type: "diff",
        },
      });

      await logMessage("info", `Analyzed and computed diff for ${path}`, {
        changedLines: diff.changedLines,
        diffLength: diff.diffText.length,
      });

      return diff.diffText;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await logMessage("error", `Failed to analyze and compute diff for ${path}`, {
        error: errorMessage,
      });
      throw error;
    }
  }

  /**
   * Apply changes to a file
   * @param path Path to the file
   * @param message Commit message
   * @returns Commit hash
   */
  async applyChanges(path: string, message: string): Promise<string> {
    try {
      // Get current branch
      const branch = await getCurrentBranch();

      // Create commit
      const commitHash = await createCommit(branch, path, message);

      await logMessage("info", `Applied changes to ${path}`, {
        branch,
        commitHash,
      });

      return commitHash;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await logMessage("error", `Failed to apply changes to ${path}`, { error: errorMessage });
      throw error;
    }
  }

  /**
   * Create a checkpoint
   * @param message Checkpoint message
   * @returns Checkpoint hash
   */
  async createCheckpoint(message: string): Promise<string> {
    try {
      const hash = await createCheckpoint(message);

      await logMessage("info", "Created checkpoint", {
        message,
        hash,
      });

      return hash;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await logMessage("error", "Failed to create checkpoint", { error: errorMessage });
      throw error;
    }
  }

  /**
   * Rollback to a previous state
   * @param target Target to rollback to (commit hash, branch, etc.)
   * @param type Type of rollback (checkpoint, temporal)
   */
  async rollback(target: string, type: "checkpoint" | "temporal" = "checkpoint"): Promise<void> {
    try {
      await rollbackChanges(target, type);

      await logMessage("info", "Rolled back changes", {
        target,
        type,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await logMessage("error", "Failed to rollback changes", { error: errorMessage });
      throw error;
    }
  }

  /**
   * Check if the repository is clean
   * @returns Whether the repository is clean
   */
  async isRepoClean(): Promise<boolean> {
    return await isRepoClean();
  }

  /**
   * Plan and execute a task
   * @param task Task to execute
   * @param files Files to process
   * @returns Modification results
   */
  async planAndExecute(task: string, files: FileToProcess[]): Promise<ModificationResult[]> {
    try {
      // Check if repository is clean
      const clean = await this.isRepoClean();

      // If not clean, create a checkpoint
      if (!clean) {
        // Sanitize the message to create a valid git tag (no spaces, special characters)
        const sanitizedMessage = "Automatic_checkpoint_before_agent_execution";
        await this.createCheckpoint(sanitizedMessage);
      }

      // Initialize the agent if not already initialized
      if (!this.executor) {
        await this.init();
      }

      // Create context for the agent
      const context: AgentContext = {
        input: `Task: ${task}\n\nFiles:\n${files.map((file) => `- ${file.path}`).join("\n")}`,
        files,
      };

      // Execute the default flow
      const result = await this.executor!.executeFlow(this.config!.defaultFlow, context);

      // Process the results
      const modificationResults: ModificationResult[] = [];

      for (const file of files) {
        // Extract code blocks from the output
        const codeBlockRegex = new RegExp(
          `\`\`\`(?:typescript|javascript|ts|js)\\s*\\n([\\s\\S]*?)\\n\`\`\``,
          "g",
        );
        const matches = [...(result.output || "").matchAll(codeBlockRegex)];

        if (matches.length === 0) {
          modificationResults.push({
            path: file.path,
            success: false,
            originalContent: file.originalContent,
            error: "No code blocks found in output",
          });
          continue;
        }

        // Use the last code block as the new content
        const newContent = matches[matches.length - 1][1];

        // Compute diff
        const diff = await this.analyzeAndDiff(file.path, file.originalContent, newContent);

        // Write the new content to the file
        await Deno.writeTextFile(file.path, newContent);

        // Commit the changes
        const commitHash = await this.applyChanges(file.path, `Agent: ${task}`);

        modificationResults.push({
          path: file.path,
          success: true,
          originalContent: file.originalContent,
          modifiedContent: newContent,
          diff,
          commitHash,
        });
      }

      await logMessage("info", "Completed planning and execution", {
        task,
        fileCount: files.length,
        successCount: modificationResults.filter((r) => r.success).length,
      });

      return modificationResults;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await logMessage("error", "Failed to plan and execute task", { error: errorMessage });
      throw error;
    }
  }

  /**
   * Execute code in a sandbox
   * @param code Code to execute
   * @param language Programming language
   * @returns Execution result
   */
  async executeCode(code: string, language: "javascript" | "typescript" | "python" = "javascript") {
    try {
      const result = await executeCode(code, { language, stream: true });

      await logMessage("info", "Executed code", {
        language,
        success: !result.error,
      });

      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await logMessage("error", "Failed to execute code", { error: errorMessage });
      throw error;
    }
  }
}
