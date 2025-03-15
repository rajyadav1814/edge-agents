/**
 * SPARC2 Agent
 * Main entry point for the agent framework
 */

import { parseAgentConfig } from "../config/config-parser.ts";
import { AgentExecutor } from "../utils/agent-executor.ts";
import { 
  AgentConfig, 
  AgentOptions, 
  FileToProcess, 
  ModificationResult 
} from "../utils/types.ts";

/**
 * SPARC2 Agent class for autonomous code analysis and modification
 */
export class SPARC2Agent {
  private executor?: AgentExecutor;
  private config?: AgentConfig;
  
  /**
   * Create a new SPARC2 agent
   * @param options Options for the agent
   */
  constructor(private options: AgentOptions = {}) {}
  
  /**
   * Initialize the agent
   */
  async initialize(): Promise<void> {
    try {
      // Load configuration
      const configPath = this.options.configPath || "config/agent-config.toml";
      this.config = await parseAgentConfig(configPath);
      
      // Create executor
      this.executor = new AgentExecutor(this.config);
      
      console.log("SPARC2 Agent initialized", { 
        name: this.config.name,
        defaultFlow: this.config.defaultFlow
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Failed to initialize SPARC2 Agent", { error: errorMessage });
      throw error;
    }
  }
  
  /**
   * Analyze code changes and suggest improvements
   * @param files Files to analyze
   * @returns Analysis results
   */
  async analyzeChanges(files: FileToProcess[]): Promise<string> {
    try {
      if (!this.executor) {
        await this.initialize();
      }
      
      if (!this.executor) {
        throw new Error("Agent executor not initialized");
      }
      
      // Create input for the flow
      const filesSummary = files.map(file => 
        `File: ${file.path}\nContent:\n${file.originalContent}`
      ).join("\n\n");
      
      // Execute the analysis flow
      const context = await this.executor.executeFlow(this.config!.defaultFlow, {
        input: `Please analyze these code files and suggest improvements:\n\n${filesSummary}`
      });
      
      console.log("Code changes analyzed", { 
        fileCount: files.length,
        analysisLength: context.output?.length || 0
      });
      
      return context.output || "";
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Failed to analyze code changes", { error: errorMessage });
      throw error;
    }
  }
  
  /**
   * Apply suggested changes to files
   * @param files Files to modify
   * @param suggestions Suggestions for modifications
   * @returns Modification results
   */
  async applyChanges(files: FileToProcess[], suggestions: string): Promise<ModificationResult[]> {
    try {
      if (!this.executor) {
        await this.initialize();
      }
      
      if (!this.executor) {
        throw new Error("Agent executor not initialized");
      }
      
      // Create input for the flow
      const filesSummary = files.map(file => 
        `File: ${file.path}\nContent:\n${file.originalContent}`
      ).join("\n\n");
      
      // Execute the modification flow
      const context = await this.executor.executeFlow("modify", {
        input: `Please apply these suggestions to the files:\n\nSuggestions:\n${suggestions}\n\nFiles:\n${filesSummary}`,
        files
      });
      
      // Parse the results
      const results: ModificationResult[] = [];
      
      for (const file of files) {
        const modifiedContent = context[`modify_${file.path}`]?.output;
        
        if (!modifiedContent) {
          results.push({
            path: file.path,
            success: false,
            error: "No modified content found"
          });
          continue;
        }
        
        // Compute diff
        const diff = this.computeDiff(file.originalContent, modifiedContent);
        
        results.push({
          path: file.path,
          success: true,
          originalContent: file.originalContent,
          modifiedContent,
          diff
        });
      }
      
      console.log("Changes applied to files", { 
        fileCount: files.length,
        successCount: results.filter(r => r.success).length
      });
      
      return results;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Failed to apply changes to files", { error: errorMessage });
      throw error;
    }
  }
  
  /**
   * Compute a diff between two strings
   * @param original Original content
   * @param modified Modified content
   * @returns Diff string
   */
  private computeDiff(original: string, modified: string): string {
    // Simple line-by-line diff for now
    const originalLines = original.split("\n");
    const modifiedLines = modified.split("\n");
    
    let diff = "";
    
    // Find the longest common subsequence
    const lcs = this.longestCommonSubsequence(originalLines, modifiedLines);
    
    let originalIndex = 0;
    let modifiedIndex = 0;
    
    for (const line of lcs) {
      // Add removed lines
      while (originalIndex < originalLines.length && originalLines[originalIndex] !== line) {
        diff += `- ${originalLines[originalIndex]}\n`;
        originalIndex++;
      }
      
      // Add added lines
      while (modifiedIndex < modifiedLines.length && modifiedLines[modifiedIndex] !== line) {
        diff += `+ ${modifiedLines[modifiedIndex]}\n`;
        modifiedIndex++;
      }
      
      // Add unchanged line
      diff += `  ${line}\n`;
      originalIndex++;
      modifiedIndex++;
    }
    
    // Add remaining removed lines
    while (originalIndex < originalLines.length) {
      diff += `- ${originalLines[originalIndex]}\n`;
      originalIndex++;
    }
    
    // Add remaining added lines
    while (modifiedIndex < modifiedLines.length) {
      diff += `+ ${modifiedLines[modifiedIndex]}\n`;
      modifiedIndex++;
    }
    
    return diff;
  }
  
  /**
   * Find the longest common subsequence of two arrays
   * @param a First array
   * @param b Second array
   * @returns Longest common subsequence
   */
  private longestCommonSubsequence<T>(a: T[], b: T[]): T[] {
    const matrix: number[][] = Array(a.length + 1)
      .fill(0)
      .map(() => Array(b.length + 1).fill(0));
    
    // Fill the matrix
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        if (a[i - 1] === b[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1] + 1;
        } else {
          matrix[i][j] = Math.max(matrix[i - 1][j], matrix[i][j - 1]);
        }
      }
    }
    
    // Backtrack to find the LCS
    const result: T[] = [];
    let i = a.length;
    let j = b.length;
    
    while (i > 0 && j > 0) {
      if (a[i - 1] === b[j - 1]) {
        result.unshift(a[i - 1]);
        i--;
        j--;
      } else if (matrix[i - 1][j] > matrix[i][j - 1]) {
        i--;
      } else {
        j--;
      }
    }
    
    return result;
  }
  
  /**
   * Execute code in a sandbox
   * @param code Code to execute
   * @param language Programming language
   * @returns Execution result
   */
  async executeCode(code: string, language: "javascript" | "typescript" | "python"): Promise<string> {
    try {
      // For now, just return a mock result
      // In a real implementation, this would execute the code in a sandbox
      console.log("Code executed", { 
        language,
        success: true
      });
      
      return `Mock execution of ${language} code: ${code.substring(0, 50)}...`;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Failed to execute code", { error: errorMessage });
      throw error;
    }
  }
}