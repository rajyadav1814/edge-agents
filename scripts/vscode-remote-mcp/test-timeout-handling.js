/**
 * Test script for timeout handling in the MCP server
 * 
 * This script tests the timeout handling capabilities of the MCP server by:
 * 1. Sending a request that will time out (sleep command)
 * 2. Verifying that the timeout error is properly returned
 * 3. Testing that the server remains responsive after a timeout
 */

const { spawn } = require('child_process');
const path = require('path');

// Configuration
const config = {
  serverScript: path.join(__dirname, 'run-mcp-server.js'),
  timeoutCommand: 'sleep 60', // Command that will exceed the 30-second timeout
  normalCommand: 'echo "Server is still responsive"'
};

// Store server process
let serverProcess = null;
let messageIdCounter = 1;

// Track pending requests
const pendingRequests = new Map();

/**
 * Start the MCP server process
 */
function startServer() {
  console.log('Starting MCP server...');
  
  // Spawn server process with stdio pipes
  serverProcess = spawn('node', [config.serverScript], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  // Handle server output
  serverProcess.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    
    for (const line of lines) {
      if (line.trim()) {
        try {
          const message = JSON.parse(line);
          handleServerMessage(message);
        } catch (error) {
          console.log(`Server output (non-JSON): ${line}`);
        }
      }
    }
  });
  
  serverProcess.stderr.on('data', (data) => {
    console.error(`Server stderr: ${data.toString()}`);
  });
  
  serverProcess.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
  });
}

/**
 * Handle messages from the server
 */
function handleServerMessage(message) {
  // Handle notifications
  if (message.method && message.method === 'server_ready') {
    console.log('Server is ready, starting timeout test...');
    runTimeoutTest();
    return;
  }
  
  // Handle responses
  if (message.id && pendingRequests.has(message.id)) {
    const { resolve, reject, description } = pendingRequests.get(message.id);
    pendingRequests.delete(message.id);
    
    console.log(`Received response for: ${description}`);
    
    if (message.error) {
      console.log(`Error: ${JSON.stringify(message.error)}`);
      reject(message.error);
    } else {
      resolve(message.result);
    }
  }
}

/**
 * Send a request to the server
 */
function sendRequest(method, params, description) {
  return new Promise((resolve, reject) => {
    const id = messageIdCounter++;
    
    // Store the promise callbacks
    pendingRequests.set(id, { resolve, reject, description });
    
    // Create the request
    const request = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };
    
    console.log(`Sending request: ${description}`);
    serverProcess.stdin.write(JSON.stringify(request) + '\n');
  });
}

/**
 * Run the timeout test
 */
async function runTimeoutTest() {
  try {
    console.log('\n=== Test 1: Command that should time out ===');
    console.log(`Executing command that should time out: ${config.timeoutCommand}`);
    console.log('Waiting for timeout (this should take about 30 seconds)...');
    
    try {
      await sendRequest('mcp.callTool', {
        name: 'execute_command',
        arguments: {
          command: config.timeoutCommand
        }
      }, 'Command that should time out');
      
      console.log('ERROR: Command did not time out as expected');
    } catch (error) {
      console.log('Command timed out as expected:', error);
      console.log('✅ Timeout test passed');
    }
    
    console.log('\n=== Test 2: Server responsiveness after timeout ===');
    console.log('Testing if server is still responsive after timeout...');
    
    try {
      const result = await sendRequest('mcp.callTool', {
        name: 'execute_command',
        arguments: {
          command: config.normalCommand
        }
      }, 'Normal command after timeout');
      
      console.log('Server response:', result);
      console.log('✅ Server is still responsive after timeout');
    } catch (error) {
      console.log('❌ Server is not responsive after timeout:', error);
    }
    
    console.log('\n=== Timeout testing completed ===');
    
    // Clean up
    cleanup();
  } catch (error) {
    console.error('Test failed:', error);
    cleanup();
  }
}

/**
 * Clean up resources
 */
function cleanup() {
  if (serverProcess) {
    console.log('Cleaning up...');
    serverProcess.kill();
    serverProcess = null;
  }
}

// Set up cleanup on exit
process.on('SIGINT', () => {
  cleanup();
  process.exit(0);
});

// Start the server
startServer();

// Log startup message
console.log('Timeout test started. Press Ctrl+C to exit.');