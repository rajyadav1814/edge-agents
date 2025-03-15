/**
 * Agent module for SPARC 2.0
 * Implements the autonomous diff-based coding bot using an abstraction over the OpenAI Agents API
 */

import { loadEnvConfig, EnvConfig } from "../config.ts";
import { logMessage } from "../logger.ts";
import { computeDiff } from "../diff/diffTracker.ts";
import { createCommit, rollbackChanges, createCheckpoint, getCurrentBranch, isRepoClean } from "../git/gitIntegration.ts";
import { indexDiffEntry } from "../vector/vectorStore.ts";
import { executeCode } from "../sandbox/codeInterpreter.ts";

// Import OpenAI client
import OpenAI from "npm:openai";

/**
 * Options for the SPARC2Agent
 */
export interface AgentOptions {
  /** The model to use for reasoning */
  model: string;
  /** The execution mode */
  mode: "automatic" | "semi" | "manual" | "custom";
  /** The diff mode */
  diffMode: "file" | "function";
  /** The processing strategy */
  processing: "parallel" | "sequential" | "concurrent" | "swarm";
}

/**
 * File to be processed by the agent
 */
export interface FileToProcess {
  /** Path to the file */
  path: string;
  /** Current content of the file */
  content: string;
}

/**
 * Result of a code modification
 */
export interface ModificationResult {
  /** Path to the modified file */
  path: string;
  /** Original content */
  originalContent: string;
  /** New content */
  newContent: string;
  /** Diff between original and new content */
  diff: string;
  /** Commit hash if committed */
  commitHash?: string;
}

/**
 * SPARC2Agent class
 * Implements the autonomous diff-based coding bot
 */
export class SPARC2Agent {
  private openai: OpenAI;
  private options: AgentOptions;
  private env: EnvConfig;

  /**
   * Create a new SPARC2Agent
   * @param options Options for the agent
   */
  constructor(options: AgentOptions) {
    this.options = options;
    // Initialize with empty env, will be populated in init()
    this.env = {
      OPENAI_API_KEY: "",
      GITHUB_TOKEN: "",
      GITHUB_ORG: "",
      EDGE_FUNCTION_URL: "",
      E2B_API_KEY: "",
      VECTOR_DB_URL: ""
    };
    this.openai = new OpenAI({ apiKey: "" }); // Will be initialized in init()
  }

  /**
   * Initialize the agent
   * Must be called before using any other methods
   */
  async init(): Promise<void> {
    this.env = await loadEnvConfig();
    this.openai = new OpenAI({ apiKey: this.env.OPENAI_API_KEY });
    await logMessage("info", "SPARC2Agent initialized", {
      model: this.options.model,
      mode: this.options.mode,
      diffMode: this.options.diffMode,
      processing: this.options.processing
    });
  }

  /**
   * Analyze code changes and generate a diff
   * @param filePath Path of the file
   * @param oldContent Previous content
   * @param newContent New content
   * @returns The diff text
   */
  async analyzeAndDiff(filePath: string, oldContent: string, newContent: string): Promise<string> {
    const diffResult = computeDiff(oldContent, newContent, this.options.diffMode);
    
    // Only index the diff if there are actual changes
    if (diffResult.changedLines > 0) {
      await indexDiffEntry({
        id: crypto.randomUUID(),
        file: filePath,
        diff: diffResult.diffText,
        metadata: { 
          mode: this.options.diffMode, 
          timestamp: new Date().toISOString(),
          changedLines: diffResult.changedLines
        }
      });
      
      await logMessage("info", `Diff computed for ${filePath}`, { 
        diff: diffResult.diffText,
        changedLines: diffResult.changedLines
      });
    } else {
      await logMessage("info", `No changes detected for ${filePath}`);
    }
    
    return diffResult.diffText;
  }

  /**
   * Apply code changes by committing them
   * @param filePath File that was modified
   * @param commitMessage Commit message
   * @param options Options for applying changes
   * @returns The commit hash
   */
  async applyChanges(
    filePath: string | string[], 
    commitMessage: string,
    options: { push?: boolean } = {}
  ): Promise<string> {
    const branch = await getCurrentBranch();
    const commitHash = await createCommit(branch, filePath, commitMessage, options);
    await logMessage("info", `Changes applied and committed for ${Array.isArray(filePath) ? filePath.join(", ") : filePath}`, {
      commitHash,
      branch
    });
    return commitHash;
  }

  /**
   * Create a checkpoint for later rollback
   * @param name Name of the checkpoint
   * @returns The commit hash of the checkpoint
   */
  async createCheckpoint(name: string): Promise<string> {
    const hash = await createCheckpoint(name);
    await logMessage("info", `Checkpoint created: ${name}`, { hash });
    return hash;
  }

  /**
   * Rollback changes using either checkpoint or temporal rollback
   * @param target Checkpoint identifier or temporal marker
   * @param mode "checkpoint" or "temporal"
   */
  async rollback(target: string, mode: "checkpoint" | "temporal"): Promise<void> {
    await rollbackChanges(target, mode);
    await logMessage("info", `Rollback executed: ${mode} target ${target}`);
  }

  /**
   * Check if the repository is clean (no uncommitted changes)
   * @returns True if the repository is clean
   */
  async isRepoClean(): Promise<boolean> {
    return await isRepoClean();
  }

  /**
   * Plan and execute code modifications using the AI agent
   * @param taskDescription Description of the task
   * @param files Array of files with their current content
   * @returns Array of modification results
   */
  async planAndExecute(
    taskDescription: string, 
    files: FileToProcess[]
  ): Promise<ModificationResult[]> {
    await logMessage("info", `Starting task: ${taskDescription}`, { 
      fileCount: files.length,
      mode: this.options.mode,
      processing: this.options.processing
    });
    
    // Check if repository is clean before making changes
    const isClean = await this.isRepoClean();
    if (!isClean) {
      await logMessage("warn", "Repository has uncommitted changes. Creating checkpoint before proceeding.");
      await this.createCheckpoint(`pre-sparc-${Date.now()}`);
    }
    
    // Create a system prompt based on the task and options
    const systemPrompt = this.createSystemPrompt(taskDescription, files);
    
    // Create an agent instance via the OpenAI Agents API
    const agentResponse = await this.createAgent(systemPrompt, taskDescription, files);
    
    // Process the agent's response based on the execution mode
    const results = await this.processAgentResponse(agentResponse, files);
    
    await logMessage("info", "Task completed", { 
      taskDescription,
      fileCount: files.length,
      modifiedFileCount: results.length
    });
    
    return results;
  }

  /**
   * Create a system prompt for the agent
   * @param taskDescription Description of the task
   * @param files Array of files with their current content
   * @returns The system prompt
   */
  private createSystemPrompt(taskDescription: string, files: FileToProcess[]): string {
    const fileList = files.map(file => `- ${file.path}`).join("\n");
    
    return `You are SPARC2.0, an autonomous diff-based coding bot. Your task is to:

1. Analyze the provided files and understand their structure and purpose.
2. Plan and execute code modifications to accomplish the following task:
   ${taskDescription}

Files to analyze:
${fileList}

Your execution mode is "${this.options.mode}" and processing strategy is "${this.options.processing}".

When modifying code:
1. Be precise and focused in your changes.
2. Maintain the existing code style and patterns.
3. Add appropriate comments for new code.
4. Ensure backward compatibility unless explicitly instructed otherwise.
5. Consider edge cases and error handling.

You should output:
1. Your analysis of the current code.
2. A plan for implementing the requested changes.
3. The modified code for each file that needs changes.

For each file, provide the complete new content, not just the changes.`;
  }

  /**
   * Create an agent using the OpenAI Agents API
   * @param systemPrompt The system prompt
   * @param taskDescription Description of the task
   * @param files Array of files with their current content
   * @returns The agent response
   */
  private async createAgent(
    systemPrompt: string, 
    taskDescription: string, 
    files: FileToProcess[]
  ): Promise<any> {
    // Prepare the files content for the agent
    const filesContent = files.map(file => `
File: ${file.path}
\`\`\`
${file.content}
\`\`\`
`).join("\n\n");
    
    // Create the agent
    try {
      // In a real implementation, this would use the OpenAI Agents API
      // For now, we'll use the chat completions API as a placeholder
      const response = await this.openai.chat.completions.create({
        model: this.options.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Task: ${taskDescription}\n\nFiles:\n${filesContent}` }
        ],
        temperature: 0.2,
        max_tokens: 4000
      });
      
      await logMessage("info", "Agent created and response received", {
        modelUsed: this.options.model,
        responseTokens: response.usage?.completion_tokens || 0
      });
      
      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await logMessage("error", "Failed to create agent", { error: errorMessage });
      throw error;
    }
  }

  /**
   * Process the agent's response based on the execution mode
   * @param agentResponse The agent's response
   * @param files Array of files with their current content
   * @returns Array of modification results
   */
  private async processAgentResponse(
    agentResponse: any, 
    files: FileToProcess[]
  ): Promise<ModificationResult[]> {
    // Extract the agent's response
    const responseContent = agentResponse.choices[0]?.message?.content || "";
    
    // Parse the response to extract modified files
    const modifiedFiles = this.parseModifiedFiles(responseContent, files);
    
    // Process the modified files based on the execution mode
    const results: ModificationResult[] = [];
    
    if (this.options.mode === "automatic") {
      // In automatic mode, apply all changes without user confirmation
      for (const modifiedFile of modifiedFiles) {
        const diff = await this.analyzeAndDiff(modifiedFile.path, modifiedFile.originalContent, modifiedFile.newContent);
        
        if (diff.trim() !== "") {
          // Write the new content to the file
          await Deno.writeTextFile(modifiedFile.path, modifiedFile.newContent);
          
          // Commit the changes
          const commitHash = await this.applyChanges(modifiedFile.path, `SPARC2: ${modifiedFile.path} - Automated change`);
          
          results.push({
            ...modifiedFile,
            diff,
            commitHash
          });
        }
      }
    } else if (this.options.mode === "semi") {
      // In semi-automatic mode, ask for user confirmation before applying changes
      for (const modifiedFile of modifiedFiles) {
        const diff = await this.analyzeAndDiff(modifiedFile.path, modifiedFile.originalContent, modifiedFile.newContent);
        
        if (diff.trim() !== "") {
          // In a real implementation, this would prompt the user for confirmation
          // For now, we'll just log the diff and apply the changes
          await logMessage("info", `Changes for ${modifiedFile.path}:`, { diff });
          
          // Write the new content to the file
          await Deno.writeTextFile(modifiedFile.path, modifiedFile.newContent);
          
          // Commit the changes
          const commitHash = await this.applyChanges(modifiedFile.path, `SPARC2: ${modifiedFile.path} - Semi-automated change`);
          
          results.push({
            ...modifiedFile,
            diff,
            commitHash
          });
        }
      }
    } else if (this.options.mode === "manual") {
      // In manual mode, just show the diffs without applying changes
      for (const modifiedFile of modifiedFiles) {
        const diff = await this.analyzeAndDiff(modifiedFile.path, modifiedFile.originalContent, modifiedFile.newContent);
        
        if (diff.trim() !== "") {
          await logMessage("info", `Proposed changes for ${modifiedFile.path}:`, { diff });
          
          results.push({
            ...modifiedFile,
            diff
          });
        }
      }
    } else if (this.options.mode === "custom") {
      // In custom mode, let the agent decide how to proceed
      // This would be implemented based on the specific custom mode
      await logMessage("info", "Custom mode execution", { 
        modifiedFileCount: modifiedFiles.length 
      });
      
      // For now, we'll just apply the changes like in automatic mode
      for (const modifiedFile of modifiedFiles) {
        const diff = await this.analyzeAndDiff(modifiedFile.path, modifiedFile.originalContent, modifiedFile.newContent);
        
        if (diff.trim() !== "") {
          // Write the new content to the file
          await Deno.writeTextFile(modifiedFile.path, modifiedFile.newContent);
          
          // Commit the changes
          const commitHash = await this.applyChanges(modifiedFile.path, `SPARC2: ${modifiedFile.path} - Custom mode change`);
          
          results.push({
            ...modifiedFile,
            diff,
            commitHash
          });
        }
      }
    }
    
    return results;
  }

  /**
   * Parse the agent's response to extract modified files
   * @param responseContent The agent's response content
   * @param originalFiles Array of original files
   * @returns Array of modified files
   */
  private parseModifiedFiles(
    responseContent: string, 
    originalFiles: FileToProcess[]
  ): ModificationResult[] {
    const modifiedFiles: ModificationResult[] = [];
    
    // Create a map of original files for easy lookup
    const originalFilesMap = new Map<string, string>();
    for (const file of originalFiles) {
      originalFilesMap.set(file.path, file.content);
    }
    
    // Extract modified files from the response
    // The response format is expected to contain code blocks with file paths
    const fileRegex = /File: ([^\n]+)\s*```(?:\w+)?\s*([\s\S]+?)```/g;
    let match;
    
    while ((match = fileRegex.exec(responseContent)) !== null) {
      const filePath = match[1].trim();
      const newContent = match[2].trim();
      
      // Check if this is an existing file
      if (originalFilesMap.has(filePath)) {
        const originalContent = originalFilesMap.get(filePath)!;
        
        // Only add to modified files if the content has changed
        if (originalContent !== newContent) {
          modifiedFiles.push({
            path: filePath,
            originalContent,
            newContent,
            diff: "" // Will be computed later
          });
        }
      }
    }
    
    return modifiedFiles;
  }

  /**
   * Execute code in the sandbox to test changes
   * @param code The code to execute
   * @param options Options for execution
   * @returns The execution result
   */
  async executeCode(
    code: string,
    options: {
      language?: "python" | "javascript" | "typescript";
      timeout?: number;
    } = {}
  ): Promise<any> {
    return await executeCode(code, { ...options, stream: true });
  }
}