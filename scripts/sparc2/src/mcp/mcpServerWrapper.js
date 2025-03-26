#!/usr/bin/env node

/**
 * MCP Server Wrapper for SPARC 2.0
 * This script uses the MCP SDK to create a server that communicates over stdio
 * and forwards requests to the SPARC2 HTTP server.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { spawn } from 'child_process';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';

// Get the directory of this script
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Start the SPARC2 HTTP server
let httpServerProcess = null;

// Function to start the HTTP server
async function startHttpServer() {
  return new Promise((resolve, reject) => {
    // Get the directory of this script
    const scriptDir = path.resolve(__dirname, '../..');
    
    // Start the HTTP server using the sparc mcp command
    httpServerProcess = spawn('/home/codespace/.deno/bin/deno', [
      'run',
      '--allow-read',
      '--allow-write',
      '--allow-env',
      '--allow-net',
      '--allow-run',
      path.join(scriptDir, 'src', 'cli', 'cli.ts'),
      'mcp'
    ], {
      cwd: scriptDir,
      stdio: 'pipe'
    });

    // Handle server output
    httpServerProcess.stdout.on('data', (data) => {
      console.error(`[HTTP Server] ${data.toString().trim()}`);
      
      // Check if the server is listening
      if (data.toString().includes('Listening on http://localhost:3001')) {
        resolve();
      }
    });

    httpServerProcess.stderr.on('data', (data) => {
      console.error(`[HTTP Server Error] ${data.toString().trim()}`);
    });

    httpServerProcess.on('error', (error) => {
      console.error(`[HTTP Server Process Error] ${error.message}`);
      reject(error);
    });

    httpServerProcess.on('close', (code) => {
      console.error(`[HTTP Server Process Exited] with code ${code}`);
      httpServerProcess = null;
    });

    // Set a timeout to resolve if the server doesn't start in time
    setTimeout(() => {
      resolve();
    }, 5000);
  });
}

// Function to make an HTTP request to the SPARC2 HTTP server
async function makeHttpRequest(endpoint, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: `/${endpoint}`,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            resolve(data);
          }
        } else {
          reject(new Error(`HTTP Error: ${res.statusCode} - ${data}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

// Create the MCP server
const server = new Server(
  {
    name: 'sparc2-mcp',
    version: '2.0.5',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// Set up the ListTools request handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  try {
    // Get the tools from the HTTP server
    const response = await makeHttpRequest('discover', 'GET');
    
    return {
      tools: response.tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.parameters
      }))
    };
  } catch (error) {
    console.error(`[MCP Server Error] Failed to list tools: ${error.message}`);
    throw new McpError(ErrorCode.InternalError, `Failed to list tools: ${error.message}`);
  }
});

// Set up the CallTool request handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const toolName = request.params.name;
    const args = request.params.arguments;
    
    // Map the tool name to the corresponding HTTP endpoint
    let endpoint;
    switch (toolName) {
      case 'analyze_code':
        endpoint = 'analyze';
        break;
      case 'modify_code':
        endpoint = 'modify';
        break;
      case 'execute_code':
        endpoint = 'execute';
        break;
      case 'search_code':
        endpoint = 'search';
        break;
      case 'create_checkpoint':
        endpoint = 'checkpoint';
        break;
      case 'rollback':
        endpoint = 'rollback';
        break;
      case 'config':
        endpoint = 'config';
        break;
      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${toolName}`);
    }
    
    // Make the HTTP request to the SPARC2 HTTP server
    const response = await makeHttpRequest(endpoint, 'POST', args);
    
    // Format the response
    return {
      content: [
        {
          type: 'text',
          text: typeof response === 'string' ? response : JSON.stringify(response, null, 2),
        },
      ],
    };
  } catch (error) {
    console.error(`[MCP Server Error] Failed to call tool: ${error.message}`);
    throw new McpError(ErrorCode.InternalError, `Failed to call tool: ${error.message}`);
  }
});

// Set up error handler
server.onerror = (error) => {
  console.error(`[MCP Server Error] ${error}`);
};

// Main function
async function main() {
  try {
    // Start the HTTP server
    console.error('[MCP Wrapper] Starting HTTP server...');
    await startHttpServer();
    console.error('[MCP Wrapper] HTTP server started');
    
    // Connect to the stdio transport
    console.error('[MCP Wrapper] Connecting to stdio transport...');
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('[MCP Wrapper] SPARC2 MCP server running on stdio');
    
    // Handle process exit
    process.on('SIGINT', async () => {
      console.error('[MCP Wrapper] Shutting down...');
      if (httpServerProcess) {
        httpServerProcess.kill();
      }
      await server.close();
      process.exit(0);
    });
  } catch (error) {
    console.error(`[MCP Wrapper Error] ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error(`[MCP Wrapper Unhandled Error] ${error.message}`);
  process.exit(1);
});
