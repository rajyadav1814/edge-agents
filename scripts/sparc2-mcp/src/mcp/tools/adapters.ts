import { SPARC2Agent } from '../../../../scripts/sparc2/src/agent/agent.ts';
import {
  computeDiff,
  createCommit,
  rollbackChanges,
  searchDiffEntries,
  executeCode
} from '../../../../scripts/sparc2/src/index.ts';
import { loadConfig } from '../../../../scripts/sparc2/src/config.ts';
import { MCPTool, Context } from '../../types/index.js';
import { readFileSync, writeFileSync } from 'fs';
import { randomUUID } from 'crypto';

/**
 * Common parameters for all tool adapters
 */
interface ToolParams {
  openaiApiKey: string;
  openaiModel: string;
  e2bApiKey: string;
  configPath: string;
  agentConfigPath: string;
}

/**
 * Base class for all tool adapters
 */
abstract class BaseToolAdapter implements MCPTool {
  protected sparc2Agent: SPARC2Agent;
  protected config: any;
  
  abstract name: string;
  abstract description: string;
  abstract inputSchema: object;

  /**
   * Create a new tool adapter
   * @param params Tool parameters
   */
  constructor(protected params: ToolParams) {
    // Load the configuration
    this.config = loadConfig(params.configPath);
    
    // Create the SPARC2Agent
    this.sparc2Agent = new SPARC2Agent({
      openaiApiKey: params.openaiApiKey,
      model: params.openaiModel,
      e2bApiKey: params.e2bApiKey,
      config: this.config
    });
  }

  /**
   * Execute the tool
   * @param params Tool parameters
   * @param context Execution context
   */
  abstract execute(params: any, context: Context): Promise<any>;
}

/**
 * Tool for analyzing code files
 */
export class AnalyzeTool extends BaseToolAdapter {
  public name: string = 'analyze';
  public description: string = 'Analyze code files for issues and improvements';
  public inputSchema: object = {
    type: 'object',
    required: ['files'],
    properties: {
      files: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of file paths to analyze'
      },
      output: {
        type: 'string',
        description: 'Path to output file for analysis results'
      },
      model: {
        type: 'string',
        description: 'Model to use for analysis'
      },
      mode: {
        type: 'string',
        enum: ['automatic', 'semi', 'manual', 'custom'],
        description: 'Execution mode'
      },
      diff_mode: {
        type: 'string',
        enum: ['file', 'function'],
        description: 'Diff tracking mode'
      },
      processing: {
        type: 'string',
        enum: ['parallel', 'sequential', 'concurrent', 'swarm'],
        description: 'Processing mode'
      }
    }
  };

  /**
   * Execute the analyze tool
   * @param params Tool parameters
   * @param context Execution context
   * @returns Analysis result
   */
  public async execute(params: any, context: Context): Promise<any> {
    // Convert file list to array if it's a string
    const files = typeof params.files === 'string' 
      ? params.files.split(',') 
      : params.files;

    console.log(`Analyzing ${files.length} files...`);

    // Prepare files for processing
    const filesToProcess = await Promise.all(files.map(async (file: string) => {
      try {
        const content = readFileSync(file, 'utf8');
        return {
          path: file,
          content
        };
      } catch (error) {
        console.error(`Error reading file ${file}:`, error);
        throw new Error(`Failed to read file ${file}`);
      }
    }));

    // Analyze files
    const analysisResult = await this.sparc2Agent.analyzeFiles(
      filesToProcess,
      params.model || this.params.openaiModel
    );

    // Store result in context
    context.setResource('analysis_result', analysisResult);
    context.markCollected('analyzed_files');

    // Write to output file if specified
    if (params.output) {
      try {
        writeFileSync(params.output, JSON.stringify(analysisResult, null, 2));
        console.log(`Analysis result written to ${params.output}`);
      } catch (error) {
        console.error(`Error writing analysis result to ${params.output}:`, error);
      }
    }

    return {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      files: files,
      analysis: analysisResult
    };
  }
}

/**
 * Tool for modifying code files
 */
export class ModifyTool extends BaseToolAdapter {
  public name: string = 'modify';
  public description: string = 'Modify code files based on suggestions';
  public inputSchema: object = {
    type: 'object',
    required: ['files', 'suggestions'],
    properties: {
      files: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of file paths to modify'
      },
      suggestions: {
        type: 'string',
        description: 'Suggestions for modifications'
      },
      model: {
        type: 'string',
        description: 'Model to use for modifications'
      },
      mode: {
        type: 'string',
        enum: ['automatic', 'semi', 'manual', 'custom'],
        description: 'Execution mode'
      },
      diff_mode: {
        type: 'string',
        enum: ['file', 'function'],
        description: 'Diff tracking mode'
      },
      processing: {
        type: 'string',
        enum: ['parallel', 'sequential', 'concurrent', 'swarm'],
        description: 'Processing mode'
      }
    }
  };

  /**
   * Execute the modify tool
   * @param params Tool parameters
   * @param context Execution context
   * @returns Modification result
   */
  public async execute(params: any, context: Context): Promise<any> {
    // Convert file list to array if it's a string
    const files = typeof params.files === 'string' 
      ? params.files.split(',') 
      : params.files;

    console.log(`Modifying ${files.length} files...`);

    // Prepare files for processing
    const filesToProcess = await Promise.all(files.map(async (file: string) => {
      try {
        const content = readFileSync(file, 'utf8');
        return {
          path: file,
          content
        };
      } catch (error) {
        console.error(`Error reading file ${file}:`, error);
        throw new Error(`Failed to read file ${file}`);
      }
    }));

    // Modify files
    const result = await this.sparc2Agent.modifyFiles(
      filesToProcess,
      params.suggestions,
      params.model || this.params.openaiModel
    );

    // Write modifications back to files
    if (result && result.changes) {
      for (const change of result.changes) {
        try {
          if (change.newContent) {
            writeFileSync(change.file, change.newContent);
            console.log(`Modified ${change.file}`);
          }
        } catch (error) {
          console.error(`Error writing changes to ${change.file}:`, error);
        }
      }
    }

    // Store result in context
    context.setResource('modification_result', result);
    context.markCollected('modified_files');

    return {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      files: files,
      modifications: result
    };
  }
}

/**
 * Tool for executing code
 */
export class ExecuteTool extends BaseToolAdapter {
  public name: string = 'execute';
  public description: string = 'Execute code in a sandbox environment';
  public inputSchema: object = {
    type: 'object',
    required: ['file'],
    properties: {
      file: {
        type: 'string',
        description: 'File to execute'
      },
      code: {
        type: 'string',
        description: 'Code to execute (alternative to file)'
      },
      language: {
        type: 'string',
        description: 'Programming language'
      },
      stream: {
        type: 'boolean',
        description: 'Stream output'
      },
      timeout: {
        type: 'number',
        description: 'Timeout in milliseconds'
      }
    }
  };

  /**
   * Execute the execute tool
   * @param params Tool parameters
   * @param context Execution context
   * @returns Execution result
   */
  public async execute(params: any, context: Context): Promise<any> {
    let code = params.code;
    let language = params.language || 'javascript';

    // Read from file if specified
    if (params.file && !code) {
      try {
        code = readFileSync(params.file, 'utf8');
        
        // Try to determine language from file extension
        if (!params.language) {
          const ext = params.file.split('.').pop();
          if (ext === 'py') language = 'python';
          else if (ext === 'js') language = 'javascript';
          else if (ext === 'ts') language = 'typescript';
        }
      } catch (error) {
        console.error(`Error reading file ${params.file}:`, error);
        throw new Error(`Failed to read file ${params.file}`);
      }
    }

    if (!code) {
      throw new Error('Either file or code must be provided');
    }

    // Execute the code
    const result = await executeCode({
      code,
      language,
      e2bApiKey: this.params.e2bApiKey,
      stream: params.stream || false,
      timeout: params.timeout
    });

    // Store result in context
    context.setResource('execution_result', result);
    context.markCollected('executed_code');

    return {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      language,
      result
    };
  }
}

/**
 * Tool for creating a checkpoint
 */
export class CheckpointTool extends BaseToolAdapter {
  public name: string = 'checkpoint';
  public description: string = 'Create a checkpoint for the current state';
  public inputSchema: object = {
    type: 'object',
    required: ['message'],
    properties: {
      message: {
        type: 'string',
        description: 'Checkpoint message'
      }
    }
  };

  /**
   * Execute the checkpoint tool
   * @param params Tool parameters
   * @param context Execution context
   * @returns Checkpoint result
   */
  public async execute(params: any, context: Context): Promise<any> {
    console.log(`Creating checkpoint: ${params.message}...`);

    // Create the commit
    const result = await createCommit(params.message);

    // Store result in context
    context.setResource('checkpoint_result', result);
    context.markCollected('created_checkpoint');

    return {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      message: params.message,
      result
    };
  }
}

/**
 * Tool for rolling back to a previous checkpoint
 */
export class RollbackTool extends BaseToolAdapter {
  public name: string = 'rollback';
  public description: string = 'Rollback to a previous checkpoint';
  public inputSchema: object = {
    type: 'object',
    required: ['commit'],
    properties: {
      commit: {
        type: 'string',
        description: 'Commit hash or date to rollback to'
      }
    }
  };

  /**
   * Execute the rollback tool
   * @param params Tool parameters
   * @param context Execution context
   * @returns Rollback result
   */
  public async execute(params: any, context: Context): Promise<any> {
    console.log(`Rolling back to: ${params.commit}...`);

    // Rollback to the commit
    const result = await rollbackChanges(params.commit);

    // Store result in context
    context.setResource('rollback_result', result);
    context.markCollected('rolled_back');

    return {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      commit: params.commit,
      result
    };
  }
}

/**
 * Tool for searching for similar code changes
 */
export class SearchTool extends BaseToolAdapter {
  public name: string = 'search';
  public description: string = 'Search for similar code changes';
  public inputSchema: object = {
    type: 'object',
    required: ['query'],
    properties: {
      query: {
        type: 'string',
        description: 'Search query'
      },
      max_results: {
        type: 'number',
        description: 'Maximum number of results'
      }
    }
  };

  /**
   * Execute the search tool
   * @param params Tool parameters
   * @param context Execution context
   * @returns Search result
   */
  public async execute(params: any, context: Context): Promise<any> {
    console.log(`Searching for: ${params.query}...`);

    // Search for diff entries
    const maxResults = params.max_results || 5;
    const results = await searchDiffEntries(params.query, maxResults);

    // Store result in context
    context.setResource('search_result', results);
    context.markCollected('searched_diffs');

    return {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      query: params.query,
      max_results: maxResults,
      results
    };
  }
}

/**
 * Tool for managing configuration
 */
export class ConfigTool extends BaseToolAdapter {
  public name: string = 'config';
  public description: string = 'Manage configuration';
  public inputSchema: object = {
    type: 'object',
    required: ['action'],
    properties: {
      action: {
        type: 'string',
        enum: ['get', 'set', 'list'],
        description: 'Configuration action'
      },
      key: {
        type: 'string',
        description: 'Configuration key'
      },
      value: {
        type: 'string',
        description: 'Configuration value'
      }
    }
  };

  /**
   * Execute the config tool
   * @param params Tool parameters
   * @param context Execution context
   * @returns Config result
   */
  public async execute(params: any, context: Context): Promise<any> {
    console.log(`Managing configuration: ${params.action} ${params.key || ''} ${params.value || ''}...`);

    if (params.action === 'get') {
      if (!params.key) {
        throw new Error('Key is required for get action');
      }

      // Get configuration value
      const value = this.getConfigValue(params.key);
      return {
        action: 'get',
        key: params.key,
        value
      };
    } else if (params.action === 'set') {
      if (!params.key) {
        throw new Error('Key is required for set action');
      }
      if (params.value === undefined) {
        throw new Error('Value is required for set action');
      }

      // Set configuration value
      this.setConfigValue(params.key, params.value);
      return {
        action: 'set',
        key: params.key,
        value: params.value
      };
    } else if (params.action === 'list') {
      // List configuration
      return {
        action: 'list',
        items: this.config
      };
    } else {
      throw new Error(`Invalid action: ${params.action}`);
    }
  }

  /**
   * Get a configuration value
   * @param key Key to get
   * @returns Configuration value
   */
  private getConfigValue(key: string): any {
    // Split key by dots to navigate nested objects
    const parts = key.split('.');
    let value = this.config;

    for (const part of parts) {
      if (value === undefined || value === null) {
        return undefined;
      }
      value = value[part];
    }

    return value;
  }

  /**
   * Set a configuration value
   * @param key Key to set
   * @param value Value to set
   */
  private setConfigValue(key: string, value: any): void {
    // Split key by dots to navigate nested objects
    const parts = key.split('.');
    let current = this.config;

    // Navigate to the parent object
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (current[part] === undefined || current[part] === null || typeof current[part] !== 'object') {
        current[part] = {};
      }
      current = current[part];
    }

    // Set the value
    const lastPart = parts[parts.length - 1];
    current[lastPart] = value;

    // Write the configuration back to file
    writeFileSync(this.params.configPath, JSON.stringify(this.config, null, 2));
  }
}
