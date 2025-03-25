#!/usr/bin/env node
/**
 * SPARC2 MCP Basic Example
 * 
 * This script demonstrates basic usage of the SPARC2 MCP client.
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { ChildProcessClientTransport } from '@modelcontextprotocol/sdk/client/child-process.js';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Path to the test file
const TEST_FILE_PATH = path.join(rootDir, 'test-file.js');

/**
 * Main function to run the example
 */
async function main() {
  console.log('SPARC2 MCP Basic Example');
  console.log('========================\n');
  
  try {
    // Start the SPARC2 MCP server as a child process
    console.log('Starting SPARC2 MCP server...');
    const serverProcess = spawn('node', [path.join(rootDir, 'sparc2_mcp.js')], {
      stdio: ['pipe', 'pipe', process.stderr]
    });
    
    // Create a client transport connected to the server process
    const transport = new ChildProcessClientTransport(serverProcess);
    
    // Create an MCP client
    const client = new Client(transport);
    
    // Connect to the server
    await client.connect();
    console.log('Connected to SPARC2 MCP server\n');
    
    // List available tools
    console.log('Available tools:');
    const toolsResponse = await client.listTools();
    for (const tool of toolsResponse.tools) {
      console.log(`- ${tool.name}: ${tool.description}`);
    }
    console.log();
    
    // Analyze code
    console.log('Analyzing code...');
    const analysisResponse = await client.callTool('analyze_code', {
      files: [TEST_FILE_PATH],
      task: 'Find bugs and performance issues'
    });
    
    console.log('Analysis results:');
    for (const content of analysisResponse.content) {
      if (content.type === 'text') {
        console.log(content.text);
      } else if (content.type === 'json') {
        console.log(JSON.stringify(content.json, null, 2));
      }
    }
    console.log();
    
    // Modify code
    console.log('Modifying code...');
    const modifyResponse = await client.callTool('modify_code', {
      files: [TEST_FILE_PATH],
      suggestions: 'Fix the divide function to handle division by zero'
    });
    
    console.log('Modification results:');
    for (const content of modifyResponse.content) {
      if (content.type === 'text') {
        console.log(content.text);
      } else if (content.type === 'json') {
        console.log(JSON.stringify(content.json, null, 2));
      }
    }
    console.log();
    
    // Execute code
    console.log('Executing code...');
    const executeResponse = await client.callTool('execute_code', {
      code: 'console.log("Hello from SPARC2 MCP!"); console.log(2 + 2);',
      language: 'javascript'
    });
    
    console.log('Execution results:');
    for (const content of executeResponse.content) {
      if (content.type === 'text') {
        console.log(content.text);
      } else if (content.type === 'json') {
        console.log(JSON.stringify(content.json, null, 2));
      }
    }
    console.log();
    
    // Create a checkpoint
    console.log('Creating checkpoint...');
    const checkpointResponse = await client.callTool('create_checkpoint', {
      message: 'Fixed bugs in test-file.js'
    });
    
    console.log('Checkpoint results:');
    for (const content of checkpointResponse.content) {
      if (content.type === 'text') {
        console.log(content.text);
      } else if (content.type === 'json') {
        console.log(JSON.stringify(content.json, null, 2));
      }
    }
    console.log();
    
    // Close the connection and terminate the server
    console.log('Closing connection...');
    await client.close();
    serverProcess.kill();
    console.log('Example completed successfully');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the main function
main().catch(console.error);