/**
 * VSCode Remote MCP Server - Simple Implementation
 * 
 * This script provides a simplified MCP server implementation for VSCode Remote integration.
 * It handles basic file operations and command execution through a stdio interface.
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const readline = require('readline');

// Set up readline interface for stdio communication
const rl = readline.createInterface({
  input: process.stdin,
  output: null,
  terminal: false
});

// Message ID counter
let messageIdCounter = 1;

// Request timeout in milliseconds (45 seconds)
const REQUEST_TIMEOUT = 45000;

// Active requests with their timeouts
const activeRequests = new Map();

// Heartbeat interval in milliseconds (10 seconds)
const HEARTBEAT_INTERVAL = 10000;

// Last activity timestamp
let lastActivityTime = Date.now();

// Heartbeat interval ID
let heartbeatIntervalId = null;

/**
 * Send a response message to stdout
 */
function sendResponse(id, result, error = null) {
  const response = {
    jsonrpc: '2.0',
    id,
    result: error ? null : result,
    error: error
  };
  
  console.log(JSON.stringify(response));
}

/**
 * Send a notification message to stdout
 */
function sendNotification(method, params) {
  const notification = {
    jsonrpc: '2.0',
    method,
    params
  };
  
  console.log(JSON.stringify(notification));
}

/**
 * Send a heartbeat notification to indicate the server is still alive
 */
function sendHeartbeat() {
  const now = Date.now();
  const timeSinceLastActivity = now - lastActivityTime;
  
  console.error(`[HEARTBEAT] Server is alive. Time since last activity: ${timeSinceLastActivity}ms`);
  
  // Only send a heartbeat notification if there's been no activity for a while
  if (timeSinceLastActivity > HEARTBEAT_INTERVAL) {
    sendNotification('server_heartbeat', {
      timestamp: now,
      uptime: process.uptime(),
      activeRequests: Array.from(activeRequests.keys()),
      timeSinceLastActivity
    });
  }
}

/**
 * List files in a directory
 */
async function listFiles(params, requestId) {
  if (!params.path) {
    return { error: { code: -32602, message: 'Path parameter is required' } };
  }

  try {
    const dirPath = path.resolve(params.path);
    const recursive = params.recursive === true;
    
    const files = await readDirectoryRecursive(dirPath, recursive);
    
    return {
      content: [
        {
          type: 'text',
          text: `Files in ${dirPath}:\n${files.join('\n')}`
        }
      ],
      files
    };
  } catch (error) {
    return { 
      error: { 
        code: -32603, 
        message: `Failed to list files: ${error.message}` 
      } 
    };
  }
}

/**
 * Read directory contents recursively
 */
async function readDirectoryRecursive(dirPath, recursive, prefix = '') {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    let results = [];

    for (const entry of entries) {
      const entryPath = path.join(dirPath, entry.name);
      const relativePath = path.join(prefix, entry.name);
      
      if (entry.isDirectory()) {
        results.push(`${relativePath}/`);
        if (recursive) {
          const subEntries = await readDirectoryRecursive(
            entryPath, 
            recursive, 
            relativePath
          );
          results = results.concat(subEntries);
        }
      } else {
        results.push(relativePath);
      }
    }

    return results;
  } catch (error) {
    console.error(`Error reading directory ${dirPath}: ${error.message}`);
    return [];
  }
}

/**
 * Read file contents
 */
async function readFile(params, requestId) {
  if (!params.path) {
    return { error: { code: -32602, message: 'Path parameter is required' } };
  }

  try {
    const filePath = path.resolve(params.path);
    const content = await fs.readFile(filePath, 'utf8');
    
    // Add line numbers to content
    const lines = content.split('\n');
    const numberedLines = lines.map((line, index) => `${index + 1} | ${line}`).join('\n');
    
    return {
      content: [
        {
          type: 'text',
          text: numberedLines
        }
      ],
      text: content,
      lines: lines.length
    };
  } catch (error) {
    return { 
      error: { 
        code: -32603, 
        message: `Failed to read file: ${error.message}` 
      } 
    };
  }
}

/**
 * Write content to a file
 */
async function writeFile(params, requestId) {
  if (!params.path || params.content === undefined) {
    return { error: { code: -32602, message: 'Path and content parameters are required' } };
  }

  try {
    const filePath = path.resolve(params.path);
    await fs.writeFile(filePath, params.content);
    
    return {
      content: [
        {
          type: 'text',
          text: `File written successfully: ${filePath}`
        }
      ],
      success: true,
      path: filePath
    };
  } catch (error) {
    return { 
      error: { 
        code: -32603, 
        message: `Failed to write file: ${error.message}` 
      } 
    };
  }
}

/**
 * Execute a command with timeout
 */
async function executeCommand(params, requestId) {
  if (!params.command) {
    return { error: { code: -32602, message: 'Command parameter is required' } };
  }

  return new Promise((resolve) => {
    try {
      const options = {};
      if (params.cwd) {
        options.cwd = path.resolve(params.cwd);
      }
      
      // Create a child process
      const childProcess = exec(params.command, options);
      
      let stdout = '';
      let stderr = '';
      
      childProcess.stdout.on('data', (data) => {
        stdout += data;
      });
      
      childProcess.stderr.on('data', (data) => {
        stderr += data;
      });
      
      // Set up a timeout for the command
      const timeoutId = setTimeout(() => {
        childProcess.kill();
        resolve({
          error: {
            code: -32001,
            message: `Command execution timed out after ${REQUEST_TIMEOUT / 1000} seconds`
          }
        });
      }, REQUEST_TIMEOUT - 1000); // 1 second less than request timeout
      
      childProcess.on('close', (code) => {
        clearTimeout(timeoutId);
        
        if (code === 0) {
          resolve({
            content: [
              {
                type: 'text',
                text: stdout || 'Command executed successfully with no output'
              }
            ],
            stdout,
            stderr,
            success: true
          });
        } else {
          resolve({
            content: [
              {
                type: 'text',
                text: `Command failed with exit code ${code}\n${stderr}`
              }
            ],
            stdout,
            stderr,
            success: false
          });
        }
      });
      
      childProcess.on('error', (error) => {
        clearTimeout(timeoutId);
        resolve({
          error: {
            code: -32603,
            message: `Command execution error: ${error.message}`
          }
        });
      });
    } catch (error) {
      resolve({
        error: {
          code: -32603,
          message: `Failed to execute command: ${error.message}`
        }
      });
    }
  });
}

/**
 * Greet function - simple greeting
 */
function greet(params, requestId) {
  const name = params.name || 'User';
  return {
    content: [
      {
        type: 'text',
        text: `Hello, ${name}! Welcome to the MCP world!`
      }
    ]
  };
}

/**
 * Handle discovery request
 */
function handleDiscovery() {
  return {
    server: {
      name: 'hello-world-server',  // Changed to match the working server
      version: '1.0.0',
      vendor: 'Edge Agents',
      description: 'MCP server for VSCode integration with edge agents'
    },
    capabilities: {
      tools: {
        greet: {
          description: 'Returns a greeting message'
        },
        list_files: {
          description: 'List files in a directory'
        },
        read_file: {
          description: 'Read file contents'
        },
        write_file: {
          description: 'Write content to a file'
        },
        execute_command: {
          description: 'Execute a terminal command'
        }
      }
    }
  };
}

/**
 * Handle list tools request
 */
function handleListTools() {
  return {
    tools: [
      {
        name: 'greet',
        description: 'Returns a greeting message',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Name to greet'
            }
          },
          required: ['name']
        }
      },
      {
        name: 'list_files',
        description: 'List files in a directory',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Directory path'
            },
            recursive: {
              type: 'boolean',
              description: 'Whether to list files recursively'
            }
          },
          required: ['path']
        }
      },
      {
        name: 'read_file',
        description: 'Read file contents',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'File path'
            }
          },
          required: ['path']
        }
      },
      {
        name: 'write_file',
        description: 'Write content to a file',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'File path'
            },
            content: {
              type: 'string',
              description: 'Content to write'
            }
          },
          required: ['path', 'content']
        }
      },
      {
        name: 'execute_command',
        description: 'Execute a terminal command',
        inputSchema: {
          type: 'object',
          properties: {
            command: {
              type: 'string',
              description: 'Command to execute'
            },
            cwd: {
              type: 'string',
              description: 'Working directory'
            }
          },
          required: ['command']
        }
      }
    ]
  };
}

/**
 * Set up a timeout for a request
 */
function setupRequestTimeout(id) {
  console.error(`[TIMEOUT] Setting up timeout for request ${id} (${REQUEST_TIMEOUT}ms)`);
  
  const timeoutId = setTimeout(() => {
    if (activeRequests.has(id)) {
      console.error(`[TIMEOUT] Request ${id} timed out after ${REQUEST_TIMEOUT}ms`);
      console.error(`[TIMEOUT] Active requests at timeout: ${Array.from(activeRequests.keys()).join(', ')}`);
      
      // Log system info at timeout
      console.error(`[SYSTEM] Memory usage: ${JSON.stringify(process.memoryUsage())}`);
      console.error(`[SYSTEM] Uptime: ${process.uptime()} seconds`);
      
      activeRequests.delete(id);
      sendResponse(id, null, { code: -32001, message: 'Request timed out' });
    }
  }, REQUEST_TIMEOUT);
  
  activeRequests.set(id, timeoutId);
  return timeoutId;
}

/**
 * Clear request timeout
 */
function clearRequestTimeout(id) {
  if (activeRequests.has(id)) {
    clearTimeout(activeRequests.get(id));
    activeRequests.delete(id);
  }
}

/**
 * Process incoming message
 */
async function processMessage(message) {
  // Update last activity time
  lastActivityTime = Date.now();
  
  try {
    console.error(`[RECEIVED] Processing message: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`);
    
    const startTime = Date.now();
    const parsedMessage = JSON.parse(message);
    const { id, method, params } = parsedMessage;
    
    console.error(`[REQUEST] ID: ${id}, Method: ${method}`);
    
    if (!method) {
      console.error(`[ERROR] Invalid request: missing method`);
      sendResponse(id, null, { code: -32600, message: 'Invalid request' });
      return;
    }
    
    // Set up timeout for this request
    if (id) {
      setupRequestTimeout(id);
      console.error(`[TIMEOUT] Set up timeout for request ${id}`);
    }
    
    let result;
    
    try {
      console.error(`[PROCESSING] Starting to process method: ${method}`);
      switch (method) {
        case 'initialize':
          // Handle VSCode initialize request
          console.error(`[INITIALIZE] Handling initialize request`);
          result = {
            serverInfo: {
              name: 'hello-world-server',
              version: '1.0.0',
              vendor: 'Edge Agents',
              description: 'MCP server for VSCode integration with edge agents'
            },
            capabilities: {
              tools: ['greet', 'list_files', 'read_file', 'write_file', 'execute_command']
            }
          };
          break;
        case 'mcp.discovery':
          result = handleDiscovery();
          break;
        case 'mcp.listTools':
          result = handleListTools();
          break;
        case 'mcp.callTool':
          if (!params || !params.name) {
            sendResponse(id, null, { code: -32602, message: 'Tool name is required' });
            return;
          }
          
          switch (params.name) {
            case 'greet':
              result = greet(params.arguments || {}, id);
              break;
            case 'list_files':
              result = await listFiles(params.arguments || {}, id);
              break;
            case 'read_file':
              result = await readFile(params.arguments || {}, id);
              break;
            case 'write_file':
              result = await writeFile(params.arguments || {}, id);
              break;
            case 'execute_command':
              result = await executeCommand(params.arguments || {}, id);
              break;
            default:
              sendResponse(id, null, { code: -32601, message: `Unknown tool: ${params.name}` });
              return;
          }
          break;
        case 'notifications/cancelled':
          // Handle cancellation notification
          console.error(`[CANCEL] Request cancelled: ${JSON.stringify(params)}`);
          // No response needed for notifications
          return;
        default:
          console.error(`[ERROR] Method not found: ${method}`);
          sendResponse(id, null, { code: -32601, message: `Method not found: ${method}` });
          return;
      }
    } catch (error) {
      console.error(`Error processing method ${method}:`, error);
      sendResponse(id, null, { code: -32603, message: `Internal error: ${error.message}` });
      return;
    }
    
    // Clear timeout as request completed successfully
    if (id) {
      clearRequestTimeout(id);
      console.error(`[TIMEOUT] Cleared timeout for request ${id}`);
    }
    
    // Check if result contains an error
    if (result && result.error) {
      console.error(`[ERROR] Request ${id} resulted in error: ${JSON.stringify(result.error)}`);
      sendResponse(id, null, result.error);
    } else {
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      console.error(`[SUCCESS] Request ${id} completed in ${processingTime}ms`);
      sendResponse(id, result);
    }
  } catch (error) {
    console.error(`[ERROR] Error processing message: ${error.message}`);
    console.error(error.stack);
    sendResponse(null, null, { code: -32700, message: 'Parse error' });
  }
}

/**
 * Start the server
 */
function startServer() {
  console.error('Starting VSCode Remote MCP Server...');
  
  // Initialize last activity time
  lastActivityTime = Date.now();
  
  // Send server ready notification
  sendNotification('server_ready', { timestamp: lastActivityTime });
  
  // Set up heartbeat interval
  heartbeatIntervalId = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
  
  // Set up message handler
  rl.on('line', (line) => {
    if (line.trim()) {
      processMessage(line);
    } else {
      console.error('[WARN] Received empty line');
    }
  });
  
  // Set up error handler
  rl.on('error', (error) => {
    console.error(`[ERROR] Error reading from stdin: ${error.message}`);
  });
  
  // Set up close handler
  rl.on('close', () => {
    console.error('[INFO] Input stream closed, shutting down...');
    if (heartbeatIntervalId) {
      clearInterval(heartbeatIntervalId);
    }
    process.exit(0);
  });
  
  // Set up process signal handlers for graceful shutdown
  process.on('SIGINT', () => {
    console.error('[INFO] Received SIGINT signal');
    if (heartbeatIntervalId) {
      clearInterval(heartbeatIntervalId);
    }
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.error('[INFO] Received SIGTERM signal');
    if (heartbeatIntervalId) {
      clearInterval(heartbeatIntervalId);
    }
    process.exit(0);
  });
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error(`[ERROR] Uncaught exception: ${error.message}`);
    console.error(error.stack);
    if (heartbeatIntervalId) {
      clearInterval(heartbeatIntervalId);
    }
    process.exit(1);
  });
  
  console.error(`[INFO] MCP Server started successfully on STDIO (PID: ${process.pid})`);
  console.error(`[INFO] Heartbeat interval: ${HEARTBEAT_INTERVAL}ms, Request timeout: ${REQUEST_TIMEOUT}ms`);
}

// Start the server when this script is run directly
if (require.main === module) {
  startServer();
}

// Export functions for testing
module.exports = {
  startServer,
  listFiles,
  readFile,
  writeFile,
  executeCommand,
  greet
};