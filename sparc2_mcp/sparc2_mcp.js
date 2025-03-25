#!/usr/bin/env node
/**
 * SPARC2 MCP Server
 * 
 * This file implements a Model Context Protocol (MCP) server for the SPARC2 framework,
 * enabling code analysis, modification, execution, and version control through a
 * standardized interface.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ChildProcessServerTransport } from '@modelcontextprotocol/sdk/server/child-process.js';
import { SPARC2Agent } from '@agentics.org/sparc2';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import { execSync } from 'child_process';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, 'config', '.env') });

// Initialize the SPARC2 agent
const sparc2Agent = new SPARC2Agent({
  model: process.env.SPARC2_MODEL || 'gpt-4o',
  mode: process.env.SPARC2_MODE || 'automatic',
  diffMode: process.env.SPARC2_DIFF_MODE || 'file',
  processing: process.env.SPARC2_PROCESSING || 'sequential',
  vectorStoreEnabled: process.env.VECTOR_STORE_ENABLED === 'true',
  vectorStorePath: process.env.VECTOR_STORE_PATH || './data/vector-store'
});

/**
 * Read a file from the filesystem
 * @param {string} filePath - Path to the file
 * @returns {Promise<string>} - File content
 */
export async function readFile(filePath) {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    throw new Error(`Failed to read file: ${error.message}`);
  }
}

/**
 * Write content to a file
 * @param {string} filePath - Path to the file
 * @param {string} content - Content to write
 * @returns {Promise<void>}
 */
export async function writeFile(filePath, content) {
  try {
    await fs.writeFile(filePath, content, 'utf-8');
    return `File ${filePath} written successfully`;
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error);
    throw new Error(`Failed to write file: ${error.message}`);
  }
}

/**
 * Execute code in a sandbox environment
 * @param {string} code - Code to execute
 * @param {string} language - Programming language
 * @returns {Promise<string>} - Execution result
 */
export async function executeCode(code, language) {
  try {
    const result = await sparc2Agent.executeCode(code, language);
    return result;
  } catch (error) {
    console.error('Error executing code:', error);
    throw new Error(`Failed to execute code: ${error.message}`);
  }
}

/**
 * Create a checkpoint (commit) for the current state
 * @param {string} message - Checkpoint message
 * @returns {Promise<string>} - Result message
 */
export async function createCheckpoint(message) {
  try {
    const result = await sparc2Agent.createCheckpoint(message);
    return `Created checkpoint: ${result}`;
  } catch (error) {
    console.error('Error creating checkpoint:', error);
    throw new Error(`Failed to create checkpoint: ${error.message}`);
  }
}

/**
 * Roll back to a previous checkpoint
 * @param {string} checkpoint - Checkpoint ID to roll back to
 * @returns {Promise<string>} - Result message
 */
export async function rollback(checkpoint) {
  try {
    const result = await sparc2Agent.rollback(checkpoint);
    return `Rolled back to checkpoint: ${result}`;
  } catch (error) {
    console.error('Error rolling back:', error);
    throw new Error(`Failed to roll back: ${error.message}`);
  }
}

/**
 * Analyze code for bugs, performance issues, and potential improvements
 * @param {string[]} files - Array of file paths to analyze
 * @param {string} task - Description of the analysis task
 * @returns {Promise<Array>} - Analysis results
 */
export async function analyzeCode(files, task) {
  try {
    const results = [];
    
    for (const file of files) {
      const content = await readFile(file);
      const analysis = await sparc2Agent.analyzeCode(content, file, task);
      
      results.push({
        file,
        issues: analysis.issues,
        suggestions: analysis.suggestions
      });
    }
    
    return results;
  } catch (error) {
    console.error('Error analyzing code:', error);
    throw new Error(`Failed to analyze code: ${error.message}`);
  }
}

/**
 * Modify code based on suggestions
 * @param {string[]} files - Array of file paths to modify
 * @param {string} suggestions - Description of the suggested modifications
 * @returns {Promise<Array>} - Modification results
 */
export async function modifyCode(files, suggestions) {
  try {
    const results = [];
    
    for (const file of files) {
      const content = await readFile(file);
      const modified = await sparc2Agent.modifyCode(content, file, suggestions);
      
      if (modified.content !== content) {
        await writeFile(file, modified.content);
        results.push({
          file,
          modified: true,
          changes: modified.changes
        });
      } else {
        results.push({
          file,
          modified: false,
          message: 'No changes needed'
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error modifying code:', error);
    throw new Error(`Failed to modify code: ${error.message}`);
  }
}

/**
 * Create and start the MCP server
 */
async function startServer() {
  // Create a server transport
  const transport = new ChildProcessServerTransport();
  
  // Create an MCP server
  const server = new Server(transport, {
    name: 'SPARC2 MCP',
    description: 'SPARC2 Model Context Protocol Server',
    secretKey: process.env.MCP_SECRET_KEY
  });
  
  // Register tools
  server.registerTool({
    name: 'analyze_code',
    description: 'Analyzes code for bugs, performance issues, and potential improvements',
    parameters: {
      files: {
        type: 'array',
        description: 'Array of file paths to analyze',
        items: {
          type: 'string'
        }
      },
      task: {
        type: 'string',
        description: 'Description of the analysis task'
      }
    },
    handler: async ({ files, task }) => {
      try {
        const results = await analyzeCode(files, task);
        return {
          content: [
            {
              type: 'text',
              text: `Analyzed ${files.length} file(s)`
            },
            {
              type: 'json',
              json: results
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error analyzing code: ${error.message}`
            }
          ]
        };
      }
    }
  });
  
  server.registerTool({
    name: 'modify_code',
    description: 'Modifies code based on suggestions',
    parameters: {
      files: {
        type: 'array',
        description: 'Array of file paths to modify',
        items: {
          type: 'string'
        }
      },
      suggestions: {
        type: 'string',
        description: 'Description of the suggested modifications'
      }
    },
    handler: async ({ files, suggestions }) => {
      try {
        const results = await modifyCode(files, suggestions);
        return {
          content: [
            {
              type: 'text',
              text: `Modified ${results.filter(r => r.modified).length} of ${files.length} file(s)`
            },
            {
              type: 'json',
              json: results
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error modifying code: ${error.message}`
            }
          ]
        };
      }
    }
  });
  
  server.registerTool({
    name: 'execute_code',
    description: 'Executes code in a secure sandbox',
    parameters: {
      code: {
        type: 'string',
        description: 'Code to execute'
      },
      language: {
        type: 'string',
        description: 'Programming language (javascript, typescript, python)',
        enum: ['javascript', 'typescript', 'python']
      }
    },
    handler: async ({ code, language }) => {
      try {
        const result = await executeCode(code, language);
        return {
          content: [
            {
              type: 'text',
              text: `Code executed successfully:\n\n${result}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error executing code: ${error.message}`
            }
          ]
        };
      }
    }
  });
  
  server.registerTool({
    name: 'create_checkpoint',
    description: 'Creates a checkpoint (commit) for the current state',
    parameters: {
      message: {
        type: 'string',
        description: 'Checkpoint message'
      }
    },
    handler: async ({ message }) => {
      try {
        const result = await createCheckpoint(message);
        return {
          content: [
            {
              type: 'text',
              text: result
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error creating checkpoint: ${error.message}`
            }
          ]
        };
      }
    }
  });
  
  server.registerTool({
    name: 'rollback',
    description: 'Rolls back to a previous checkpoint',
    parameters: {
      checkpoint: {
        type: 'string',
        description: 'Checkpoint ID to roll back to'
      }
    },
    handler: async ({ checkpoint }) => {
      try {
        const result = await rollback(checkpoint);
        return {
          content: [
            {
              type: 'text',
              text: result
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error rolling back: ${error.message}`
            }
          ]
        };
      }
    }
  });
  
  // Start the server
  await server.start();
  console.log('SPARC2 MCP server started');
}

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer().catch(error => {
    console.error('Error starting server:', error);
    process.exit(1);
  });
}