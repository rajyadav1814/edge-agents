#!/usr/bin/env node

/**
 * SPARC2-MCP Modify File
 * 
 * This script uses the SPARC2-MCP server to modify a file based on suggestions.
 * Usage: node modify-file.js <file-path> <suggestion-type> <suggestion-message>
 * 
 * Example: node modify-file.js test-file.js improvement "Add parameter validation to the divide function"
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const readFile = promisify(fs.readFile);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Get the file path and suggestion from the command line arguments
const filePath = process.argv[2];
const suggestionType = process.argv[3] || 'improvement';
const suggestionMessage = process.argv[4] || 'Improve code quality';

if (!filePath) {
  console.error(`${colors.red}Error: No file path provided${colors.reset}`);
  console.error(`Usage: node modify-file.js <file-path> <suggestion-type> <suggestion-message>${colors.reset}`);
  process.exit(1);
}

// Resolve the file path
const resolvedFilePath = path.resolve(process.cwd(), filePath);

console.log(`${colors.blue}Modifying file: ${resolvedFilePath}${colors.reset}`);
console.log(`${colors.blue}Suggestion type: ${suggestionType}${colors.reset}`);
console.log(`${colors.blue}Suggestion message: ${suggestionMessage}${colors.reset}`);

// Function to run the MCP server and send a request
async function runMcpRequest(request) {
  return new Promise((resolve, reject) => {
    // Start the MCP server process
    const serverProcess = spawn('node', [path.resolve(__dirname, 'mcp'), 'serve'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    serverProcess.stdout.on('data', (data) => {
      const dataStr = data.toString();
      stdout += dataStr;
      
      // Log all output
      console.log(`${colors.dim}[Server] ${dataStr.trim()}${colors.reset}`);
      
      // Check if this chunk contains a complete JSON response
      try {
        // Extract all JSON-like strings from the output
        const lines = dataStr.split('\n');
        for (const line of lines) {
          if (line.includes('"id":"' + request.id + '"') || line.includes('"id": "' + request.id + '"')) {
            try {
              // Try to find a complete JSON object in this line
              const jsonStart = line.indexOf('{');
              const jsonEnd = line.lastIndexOf('}');
              
              if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
                // Fix missing commas in the JSON string
                let jsonStr = line.substring(jsonStart, jsonEnd + 1);
                
                // Replace missing commas between properties
                jsonStr = jsonStr.replace(/"\s*"/g, '","');
                jsonStr = jsonStr.replace(/}\s*{/g, '},{');
                
                try {
                  const response = JSON.parse(jsonStr);
                  
                  if (response.id === request.id) {
                    console.log(`${colors.green}Found matching response for request ID: ${request.id}${colors.reset}`);
                    
                    if (response.error) {
                      reject(new Error(`MCP error: ${response.error.message}`));
                    } else if (response.result) {
                      resolve(response);
                      // Kill the server process since we got our response
                      serverProcess.kill();
                      return;
                    }
                  }
                } catch (jsonError) {
                  console.log(`${colors.yellow}Failed to parse fixed JSON: ${jsonError.message}${colors.reset}`);
                }
              }
            } catch (parseError) {
              console.log(`${colors.yellow}Failed to parse JSON: ${parseError.message}${colors.reset}`);
              // Continue and try again with the next line
            }
          }
        }
      } catch (error) {
        // Ignore parsing errors for incomplete chunks
        console.log(`${colors.yellow}Error processing chunk: ${error.message}${colors.reset}`);
      }
    });
    
    serverProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      // Log server messages to console
      console.log(`${colors.dim}[Server stderr] ${data.toString().trim()}${colors.reset}`);
    });
    
    serverProcess.on('error', (error) => {
      reject(new Error(`Failed to start MCP server: ${error.message}`));
    });
    
    // Send the request to the server after a short delay to allow it to initialize
    setTimeout(() => {
      serverProcess.stdin.write(JSON.stringify(request) + '\n');
    }, 1000);
    
    // Handle server exit
    serverProcess.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        reject(new Error(`Server process exited with code ${code}`));
      }
    });
    
    // Kill the server process after a timeout
    setTimeout(() => {
      serverProcess.kill();
      reject(new Error('Request timed out'));
    }, 30000); // 30 seconds timeout
  });
}

// Main function to modify the file
async function modifyFile() {
  try {
    // First, analyze the file to get a baseline
    console.log(`${colors.cyan}First analyzing the file...${colors.reset}`);
    
    const analyzeRequest = {
      jsonrpc: '2.0',
      id: 'analyze_request',
