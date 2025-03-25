#!/usr/bin/env node

/**
 * SPARC2-MCP Analyze File
 * 
 * This script uses the SPARC2-MCP server to analyze a file.
 * Usage: node analyze-file.js <file-path>
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Get the file path from the command line arguments
const filePath = process.argv[2];

if (!filePath) {
  console.error(`${colors.red}Error: No file path provided${colors.reset}`);
  console.error(`Usage: node analyze-file.js <file-path>${colors.reset}`);
  process.exit(1);
}

// Resolve the file path
const resolvedFilePath = path.resolve(process.cwd(), filePath);

console.log(`${colors.blue}Analyzing file: ${resolvedFilePath}${colors.reset}`);

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

// Main function to analyze the file
async function analyzeFile() {
  try {
    const request = {
      jsonrpc: '2.0',
      id: 'analyze_request',
      method: 'call_tool',
      params: {
        name: 'analyze',
        arguments: {
          files: [resolvedFilePath]
        }
      }
    };
    
    console.log(`${colors.cyan}Sending request:${colors.reset}`, JSON.stringify(request, null, 2));
    
    const response = await runMcpRequest(request);
    
    console.log(`${colors.green}Response received:${colors.reset}`, JSON.stringify(response, null, 2));
    
    // Validate the response
    if (!response.result || !response.result.content || !Array.isArray(response.result.content)) {
      throw new Error('Invalid response format: missing content array');
    }
    
    // Parse the content
    const content = response.result.content[0];
    if (!content || content.type !== 'text' || !content.text) {
      throw new Error('Invalid content format');
    }
    
    // Parse the analysis result
    const analysisResult = JSON.parse(content.text);
    
    // Validate the analysis result
    if (!analysisResult.status || analysisResult.status !== 'success') {
      throw new Error('Analysis failed: ' + (analysisResult.message || 'unknown error'));
    }
    
    // Print the analysis results
    console.log(`\n${colors.bright}${colors.magenta}=== Analysis Results ===${colors.reset}`);
    
    const results = analysisResult.results || [];
    for (const result of results) {
      console.log(`\n${colors.cyan}File: ${result.file}${colors.reset}`);
      
      if (result.issues && result.issues.length > 0) {
        console.log(`${colors.yellow}Issues:${colors.reset}`);
        for (const issue of result.issues) {
          console.log(`  ${colors.yellow}[${issue.type}] ${issue.message}${colors.reset}`);
          if (issue.line) {
            console.log(`    Line ${issue.line}: ${issue.code || ''}`);
          }
        }
      } else {
        console.log(`${colors.green}No issues found${colors.reset}`);
      }
      
      if (result.suggestions && result.suggestions.length > 0) {
        console.log(`${colors.blue}Suggestions:${colors.reset}`);
        for (const suggestion of result.suggestions) {
          console.log(`  ${colors.blue}[${suggestion.type}] ${suggestion.message}${colors.reset}`);
        }
      }
    }
    
    console.log(`\n${colors.green}Analysis completed successfully${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Error analyzing file: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Run the analysis
analyzeFile();
