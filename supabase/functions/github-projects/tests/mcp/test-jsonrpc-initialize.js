// Test script for MCP stdio server with JSON-RPC 2.0 initialize
const { spawn } = require('child_process');
const path = require('path');

// Path to the stdio server script
const serverPath = path.join(__dirname, 'dist', 'mcp-stdio-server.js');

console.log(`Testing MCP stdio server at ${serverPath}`);

// Spawn the stdio server process
const serverProcess = spawn(serverPath, [], {
  stdio: ['pipe', 'pipe', 'pipe']
});

// Handle server stdout (messages from the server)
serverProcess.stdout.on('data', (data) => {
  const messages = data.toString().trim().split('\n');
  
  messages.forEach(message => {
    try {
      const parsedMessage = JSON.parse(message);
      console.log('Received message:', JSON.stringify(parsedMessage, null, 2));
      
      if (parsedMessage.jsonrpc === '2.0' && parsedMessage.result && parsedMessage.result.serverInfo) {
        console.log('\nJSON-RPC initialize successful');
        
        // Test a tool call using JSON-RPC
        sendJsonRpcRequest('getRepository', {
          owner: 'octocat',
          repo: 'hello-world'
        });
      } else if (parsedMessage.jsonrpc === '2.0' && parsedMessage.result && !parsedMessage.result.serverInfo) {
        console.log('\nJSON-RPC tool call successful');
        
        // Clean up and exit
        console.log('\nAll tests completed successfully');
        serverProcess.kill();
        process.exit(0);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
      console.error('Raw message:', message);
    }
  });
});

// Handle server stderr (logs from the server)
serverProcess.stderr.on('data', (data) => {
  console.error(`Server log: ${data.toString().trim()}`);
});

// Handle server exit
serverProcess.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
});

// Function to send a JSON-RPC request to the server
function sendJsonRpcRequest(method, params) {
  const request = {
    jsonrpc: '2.0',
    id: Date.now(),
    method: method,
    params: params
  };
  
  console.log(`\nSending JSON-RPC request:`, JSON.stringify(request, null, 2));
  serverProcess.stdin.write(JSON.stringify(request) + '\n');
}

// Send initialize message to start the test
console.log('Sending JSON-RPC initialize message');
sendJsonRpcRequest('initialize', {
  protocolVersion: '2024-11-05',
  capabilities: {},
  clientInfo: {
    name: 'Cline',
    version: '3.9.2'
  }
});

// Set a timeout to kill the server if the test takes too long
setTimeout(() => {
  console.error('Test timed out after 10 seconds');
  serverProcess.kill();
  process.exit(1);
}, 10000);