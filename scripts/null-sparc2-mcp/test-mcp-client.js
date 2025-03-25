#!/usr/bin/env node

/**
 * Test MCP Client
 * 
 * This script tests the SPARC2-MCP server by sending requests to it.
 */

// Function to send a request to the MCP server
async function sendRequest(request) {
  return new Promise((resolve, reject) => {
    // Send the request to stdout (which is connected to the server's stdin)
    process.stdout.write(JSON.stringify(request) + '\n');
    
    // Listen for the response on stdin
    const onData = (data) => {
      try {
        const response = JSON.parse(data.toString().trim());
        if (response.id === request.id) {
          process.stdin.removeListener('data', onData);
          resolve(response);
        }
      } catch (error) {
        console.error('Error parsing response:', error);
      }
    };
    
    process.stdin.on('data', onData);
    
    // Set a timeout to prevent hanging
    setTimeout(() => {
      process.stdin.removeListener('data', onData);
      reject(new Error('Request timed out'));
    }, 5000);
  });
}

// Main function
async function main() {
  try {
    console.log('Testing SPARC2-MCP server...');
    
    // Test 1: List tools
    console.log('\n--- Test 1: List tools ---');
    const listToolsRequest = {
      id: 'list_tools',
      method: 'list_tools',
      params: {}
    };
    
    const listToolsResponse = await sendRequest(listToolsRequest);
    console.log('Available tools:', JSON.stringify(listToolsResponse, null, 2));
    
    // Test 2: Call analyze tool
    console.log('\n--- Test 2: Call analyze tool ---');
    const analyzeRequest = {
      id: 'analyze_test',
      method: 'call_tool',
      params: {
        name: 'analyze',
        arguments: {
          files: ['/workspaces/edge-agents/scripts/sparc2-mcp/test-mcp-client.js']
        }
      }
    };
    
    const analyzeResponse = await sendRequest(analyzeRequest);
    console.log('Analyze result:', JSON.stringify(analyzeResponse, null, 2));
    
    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Run the main function
main().catch(console.error);