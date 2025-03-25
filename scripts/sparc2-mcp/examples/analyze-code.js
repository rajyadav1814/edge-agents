#!/usr/bin/env node

/**
 * Example of using the SPARC2-MCP to analyze code
 * 
 * Usage:
 * node analyze-code.js path/to/file1.js [path/to/file2.js ...]
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Path to the MCP server script
const MCP_SERVER_PATH = path.resolve(__dirname, '../dist/index.js');

// Function to create a simple MCP client
async function callMcpTool(tool, args) {
  return new Promise((resolve, reject) => {
    // Start the MCP server process
    const serverProcess = spawn('node', [MCP_SERVER_PATH], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    serverProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    serverProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      // Log server messages to console
      console.error(`[Server] ${data.toString().trim()}`);
    });
    
    serverProcess.on('error', (error) => {
      reject(new Error(`Failed to start MCP server: ${error.message}`));
    });
    
    // Create MCP request
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'call_tool',
      params: {
        name: tool,
        arguments: args
      }
    };
    
    // Send the request to the server
    serverProcess.stdin.write(JSON.stringify(request) + '\n');
    
    // Handle server response
    serverProcess.stdout.on('end', () => {
      try {
        // Parse the response
        const response = JSON.parse(stdout);
        
        if (response.error) {
          reject(new Error(`MCP error: ${response.error.message}`));
        } else if (response.result) {
          // Extract the result content from the MCP response
          const resultContent = JSON.parse(response.result.content[0].text);
          resolve(resultContent);
        } else {
          reject(new Error('Invalid MCP response'));
        }
      } catch (error) {
        reject(new Error(`Failed to parse MCP response: ${error.message}\nResponse: ${stdout}`));
      }
    });
  });
}

// Main function
async function main() {
  try {
    // Get file paths from command line arguments
    const filePaths = process.argv.slice(2);
    
    if (filePaths.length === 0) {
      console.error('Please provide at least one file to analyze');
      process.exit(1);
    }
    
    // Validate that all files exist
    for (const filePath of filePaths) {
      if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        process.exit(1);
      }
    }
    
    console.log(`Analyzing ${filePaths.length} file(s): ${filePaths.join(', ')}`);
    
    // Call the analyze tool
    const result = await callMcpTool('analyze', { files: filePaths });
    
    // Print the analysis results
    console.log('\n===== Analysis Results =====\n');
    
    if (result.analysis && result.analysis.issues) {
      for (const issue of result.analysis.issues) {
        console.log(`[${issue.severity.toUpperCase()}] ${issue.file}:${issue.line || 'N/A'} - ${issue.type}`);
        console.log(`  ${issue.message}`);
        if (issue.suggestions && issue.suggestions.length > 0) {
          console.log('  Suggestions:');
          for (const suggestion of issue.suggestions) {
            console.log(`    - ${suggestion}`);
          }
        }
        console.log();
      }
      
      console.log('\n===== Summary =====\n');
      console.log(result.analysis.summary);
    } else {
      console.log('No issues found or unexpected result format.');
      console.log(JSON.stringify(result, null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run the main function
main();