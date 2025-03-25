#!/usr/bin/env node
/**
 * SPARC2 MCP Test Client
 * 
 * This script tests the SPARC2 MCP server by connecting to it and calling its tools.
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

// Path to the test file
const TEST_FILE_PATH = path.join(__dirname, 'test-file.js');

/**
 * Main function to run the test
 */
async function main() {
  console.log('SPARC2 MCP Test Client');
  console.log('=====================\n');
  
  try {
    // Start the SPARC2 MCP server as a child process
    console.log('Starting SPARC2 MCP server...');
    const serverProcess = spawn('node', [path.join(__dirname, 'sparc2_mcp.js')], {
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
    
    // Test analyze_code tool
    console.log('Testing analyze_code tool...');
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
    
    // Test execute_code tool
    console.log('Testing execute_code tool...');
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
    
    // Test create_checkpoint tool
    console.log('Testing create_checkpoint tool...');
    const checkpointResponse = await client.callTool('create_checkpoint', {
      message: 'Test checkpoint'
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
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the main function
main().catch(console.error);