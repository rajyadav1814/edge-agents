#!/usr/bin/env node

/**
 * Test script for the GitHub Projects MCP stdio server
 * This script tests the createProject tool with the shortDescription parameter
 */

const { spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

// Test data
const testData = {
  organization: 'agenticsorg',
  title: `Test Project ${Date.now()}`,
  shortDescription: 'This is a test project created via MCP stdio test'
};

// Function to run the test
async function testStdioMcp() {
  console.log('Testing MCP stdio server with shortDescription parameter...');
  
  // Path to the MCP stdio server
  const mcpServerPath = path.resolve(__dirname, 'dist/mcp-stdio-server.js');
  
  // Make sure the script is executable
  fs.chmodSync(mcpServerPath, '755');
  
  // Start the MCP stdio server process
  const mcpProcess = spawn('node', [mcpServerPath], {
    env: {
      ...process.env,
      GITHUB_TOKEN: process.env.GITHUB_TOKEN || '',
      GITHUB_ORG: process.env.GITHUB_ORG || 'agenticsorg'
    },
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  // Set up error handling
  mcpProcess.stderr.on('data', (data) => {
    console.error(`MCP Server Error: ${data.toString()}`);
  });
  
  // Set up a promise to handle the response
  const responsePromise = new Promise((resolve, reject) => {
    let responseData = '';
    
    mcpProcess.stdout.on('data', (data) => {
      responseData += data.toString();
      
      try {
        // Try to parse the response as JSON
        const jsonData = JSON.parse(responseData);
        resolve(jsonData);
      } catch (error) {
        // Not valid JSON yet, continue collecting data
      }
    });
    
    // Handle process exit
    mcpProcess.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`MCP server exited with code ${code}`));
      }
    });
    
    // Set a timeout
    setTimeout(() => {
      reject(new Error('Timeout waiting for MCP server response'));
    }, 10000);
  });
  
  // Send the createProject request to the MCP stdio server
  const request = {
    jsonrpc: '2.0',
    id: '1',
    method: 'mcp.tools.call',
    params: {
      name: 'createProject',
      arguments: testData
    }
  };
  
  // Write the request to the MCP server's stdin
  mcpProcess.stdin.write(JSON.stringify(request) + '\n');
  
  try {
    // Wait for the response
    const response = await responsePromise;
    
    console.log('Response:', JSON.stringify(response, null, 2));
    
    // Check if the response contains the expected data
    if (response.result && 
        response.result.content && 
        response.result.project && 
        response.result.project.shortDescription === testData.shortDescription) {
      console.log('✅ SUCCESS: Project created with shortDescription parameter!');
      console.log(`Project title: ${response.result.project.title}`);
      console.log(`Project description: ${response.result.project.shortDescription}`);
      process.exit(0);
    } else {
      console.log('❌ FAILURE: Project created but shortDescription not set correctly');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error testing MCP stdio server:', error.message);
    process.exit(1);
  } finally {
    // Make sure to kill the MCP process
    mcpProcess.kill();
  }
}

// Run the test
testStdioMcp();