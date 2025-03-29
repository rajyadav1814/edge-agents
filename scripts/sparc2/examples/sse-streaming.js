/**
 * SPARC2 Server-Sent Events (SSE) Example
 * 
 * This example demonstrates how to implement SSE streaming for SPARC2 operations.
 * It creates a simple HTTP server that wraps the SPARC2 API and adds SSE support
 * for streaming real-time updates during code analysis and modification.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import net from 'net';

// Get the directory of this script
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SSE_PORT = 3002;
const SPARC2_API_PORT_START = 3001;
let SPARC2_API_PORT = SPARC2_API_PORT_START;
const SPARC2_CLI_PATH = path.resolve(__dirname, '../src/cli/cli.ts');

// Get the file paths
const SAMPLE_TEST_FILE_RELATIVE = 'sample-test-file.js';
const SAMPLE_TEST_FILE_ABSOLUTE = path.resolve(__dirname, '..', SAMPLE_TEST_FILE_RELATIVE);

// Store active SSE connections
const clients = new Map();
let clientId = 0;

// Check if a port is in use
async function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    
    server.listen(port);
  });
}

// Find an available port
async function findAvailablePort(startPort, maxAttempts = 10) {
  let port = startPort;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const inUse = await isPortInUse(port);
    if (!inUse) {
      return port;
    }
    port++;
    attempts++;
  }
  
  throw new Error(`Could not find an available port after ${maxAttempts} attempts`);
}

// Start the SPARC2 API server
async function startSPARC2API() {
  console.log('Finding available port for SPARC2 API server...');
  
  // Find an available port
  SPARC2_API_PORT = await findAvailablePort(SPARC2_API_PORT_START);
  console.log(`Starting SPARC2 API server on port ${SPARC2_API_PORT}...`);
  
  const denoProcess = spawn('deno', [
    'run',
    '--allow-read',
    '--allow-write',
    '--allow-env',
    '--allow-net',
    '--allow-run',
    SPARC2_CLI_PATH,
    'api',
    '--port', SPARC2_API_PORT.toString()
  ], {
    stdio: 'pipe',
    cwd: path.resolve(__dirname, '..') // Set working directory to SPARC2 root
  });

  denoProcess.stdout.on('data', (data) => {
    const message = data.toString().trim();
    console.log(`[SPARC2 API] ${message}`);
    
    // Broadcast log messages to all connected clients
    broadcastToAll({
      type: 'log',
      message
    });
  });

  denoProcess.stderr.on('data', (data) => {
    const message = data.toString().trim();
    console.log(`[SPARC2 API Error] ${message}`);
    
    // Broadcast error messages to all connected clients
    broadcastToAll({
      type: 'error',
      message
    });
  });

  // Wait for the API server to start
  return new Promise((resolve, reject) => {
    const maxAttempts = 30;
    let attempts = 0;
    
    const checkServer = () => {
      attempts++;
      http.get(`http://localhost:${SPARC2_API_PORT}/discover`, (res) => {
        if (res.statusCode === 200) {
          console.log(`SPARC2 API server is running on port ${SPARC2_API_PORT}`);
          resolve();
        } else if (attempts < maxAttempts) {
          setTimeout(checkServer, 1000);
        } else {
          reject(new Error(`SPARC2 API server failed to start after ${maxAttempts} attempts`));
        }
      }).on('error', (err) => {
        if (attempts < maxAttempts) {
          setTimeout(checkServer, 1000);
        } else {
          reject(new Error(`SPARC2 API server failed to start: ${err.message}`));
        }
      });
    };
    
    // Give the server a moment to start
    setTimeout(checkServer, 2000);
    
    // Handle process exit
    denoProcess.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`SPARC2 API server exited with code ${code}`));
      }
    });
  });
}

// Send SSE message to a client
function sendSSE(res, data) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

// Broadcast message to all connected clients
function broadcastToAll(data) {
  clients.forEach((res) => {
    sendSSE(res, data);
  });
}

// Create HTTP server with SSE support
async function createServer() {
  try {
    // Verify the sample test file exists
    try {
      await fs.promises.access(SAMPLE_TEST_FILE_ABSOLUTE, fs.constants.F_OK);
      console.log(`Sample test file found at: ${SAMPLE_TEST_FILE_ABSOLUTE}`);
      
      // Copy the sample file to the SPARC2 root directory for easier access
      const sparc2RootDir = path.resolve(__dirname, '..');
      const targetPath = path.join(sparc2RootDir, SAMPLE_TEST_FILE_RELATIVE);
      
      // Only copy if it doesn't exist in the target location
      try {
        await fs.promises.access(targetPath, fs.constants.F_OK);
        console.log(`Sample test file already exists in SPARC2 root directory: ${targetPath}`);
      } catch (e) {
        await fs.promises.copyFile(SAMPLE_TEST_FILE_ABSOLUTE, targetPath);
        console.log(`Copied sample test file to SPARC2 root directory: ${targetPath}`);
      }
    } catch (error) {
      console.error(`Sample test file not found: ${SAMPLE_TEST_FILE_ABSOLUTE}`);
      console.error('Please make sure sample-test-file.js exists in the examples directory');
      process.exit(1);
    }

    // Start the SPARC2 API server first
    await startSPARC2API();
    
    // Find an available port for the SSE server
    const ssePort = await findAvailablePort(SSE_PORT);
    
    // Create HTTP server
    const server = http.createServer(async (req, res) => {
      // Set CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      
      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }
      
      // Handle SSE endpoint
      if (req.url === '/events' && req.method === 'GET') {
        // Set SSE headers
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        });
        
        // Send initial connection message
        const id = clientId++;
        sendSSE(res, { 
          type: 'connected', 
          id,
          message: `Connected to SPARC2 SSE server. API running on port ${SPARC2_API_PORT}`
        });
        
        // Store the client connection
        clients.set(id, res);
        
        // Handle client disconnect
        req.on('close', () => {
          clients.delete(id);
          console.log(`Client ${id} disconnected`);
        });
        
        console.log(`Client ${id} connected`);
        return;
      }
      
      // Handle HTML page request
      if (req.url === '/' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>SPARC2 SSE Example</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
              h1 { color: #333; }
              #output { background: #f5f5f5; border: 1px solid #ddd; padding: 10px; height: 300px; overflow-y: auto; }
              .form-group { margin-bottom: 15px; }
              label { display: block; margin-bottom: 5px; }
              input[type="text"], textarea { width: 100%; padding: 8px; }
              button { background: #4CAF50; color: white; border: none; padding: 10px 15px; cursor: pointer; }
              .log { color: #333; }
              .error { color: #f44336; }
              .result { color: #2196F3; }
              .connected { color: #9C27B0; font-weight: bold; }
            </style>
          </head>
          <body>
            <h1>SPARC2 SSE Streaming Example</h1>
            <p>SPARC2 API running on port: <strong>${SPARC2_API_PORT}</strong></p>
            
            <div class="form-group">
              <label for="files">Files to analyze (comma-separated):</label>
              <input type="text" id="files" value="${SAMPLE_TEST_FILE_RELATIVE}" />
            </div>
            
            <div class="form-group">
              <label for="task">Task description:</label>
              <textarea id="task" rows="3">Analyze this code for potential improvements</textarea>
            </div>
            
            <div class="form-group">
              <button id="analyzeBtn">Analyze Code</button>
              <button id="modifyBtn">Modify Code</button>
            </div>
            
            <h3>Real-time Output:</h3>
            <div id="output"></div>
            
            <script>
              const output = document.getElementById('output');
              const filesInput = document.getElementById('files');
              const taskInput = document.getElementById('task');
              const analyzeBtn = document.getElementById('analyzeBtn');
              const modifyBtn = document.getElementById('modifyBtn');
              
              // Connect to SSE stream
              const eventSource = new EventSource('/events');
              
              // Handle SSE messages
              eventSource.onmessage = function(event) {
                const data = JSON.parse(event.data);
                
                let messageClass = 'log';
                if (data.type === 'error') messageClass = 'error';
                if (data.type === 'result') messageClass = 'result';
                if (data.type === 'connected') messageClass = 'connected';
                
                output.innerHTML += \`<div class="\${messageClass}">\${data.message || JSON.stringify(data)}</div>\`;
                output.scrollTop = output.scrollHeight;
              };
              
              // Handle connection open
              eventSource.onopen = function() {
                appendToOutput('Connected to server', 'log');
              };
              
              // Handle connection error
              eventSource.onerror = function() {
                appendToOutput('Connection error', 'error');
              };
              
              // Append message to output
              function appendToOutput(message, type) {
                output.innerHTML += \`<div class="\${type}">\${message}</div>\`;
                output.scrollTop = output.scrollHeight;
              }
              
              // Analyze code
              analyzeBtn.addEventListener('click', async function() {
                const files = filesInput.value.split(',').map(f => f.trim());
                const task = taskInput.value;
                
                if (!files.length || !task) {
                  appendToOutput('Please provide files and task description', 'error');
                  return;
                }
                
                appendToOutput('Sending analysis request...', 'log');
                
                try {
                  const response = await fetch('/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ files, task })
                  });
                  
                  const result = await response.json();
                  appendToOutput('Analysis complete!', 'result');
                } catch (error) {
                  appendToOutput(\`Request error: \${error.message}\`, 'error');
                }
              });
              
              // Modify code
              modifyBtn.addEventListener('click', async function() {
                const files = filesInput.value.split(',').map(f => f.trim());
                const task = taskInput.value;
                
                if (!files.length || !task) {
                  appendToOutput('Please provide files and task description', 'error');
                  return;
                }
                
                appendToOutput('Sending modification request...', 'log');
                
                try {
                  const response = await fetch('/modify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ files, task })
                  });
                  
                  const result = await response.json();
                  appendToOutput('Modification complete!', 'result');
                } catch (error) {
                  appendToOutput(\`Request error: \${error.message}\`, 'error');
                }
              });
            </script>
          </body>
          </html>
        `);
        return;
      }
      
      // Handle analyze endpoint
      if (req.url === '/analyze' && req.method === 'POST') {
        let body = '';
        
        req.on('data', chunk => {
          body += chunk.toString();
        });
        
        req.on('end', async () => {
          try {
            const { files, task } = JSON.parse(body);
            
            if (!files || !Array.isArray(files) || files.length === 0) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Files array is required' }));
              return;
            }
            
            // Broadcast start message
            broadcastToAll({
              type: 'log',
              message: `Starting analysis of ${files.join(', ')} with task: ${task}`
            });
            
            // Forward request to SPARC2 API
            const apiReq = http.request({
              hostname: 'localhost',
              port: SPARC2_API_PORT,
              path: '/analyze',
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              }
            }, (apiRes) => {
              let apiData = '';
              
              apiRes.on('data', (chunk) => {
                apiData += chunk;
              });
              
              apiRes.on('end', () => {
                // Send response to client
                res.writeHead(apiRes.statusCode, { 'Content-Type': 'application/json' });
                res.end(apiData);
                
                // Broadcast completion message
                try {
                  const result = JSON.parse(apiData);
                  broadcastToAll({
                    type: 'result',
                    message: `Analysis completed with ${result.length} results`
                  });
                } catch (e) {
                  broadcastToAll({
                    type: 'error',
                    message: `Error parsing analysis results: ${e.message}`
                  });
                }
              });
            });
            
            apiReq.on('error', (error) => {
              // Send error response to client
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: `API request failed: ${error.message}` }));
              
              // Broadcast error message
              broadcastToAll({
                type: 'error',
                message: `API request failed: ${error.message}`
              });
            });
            
            // Send request body to API
            apiReq.write(JSON.stringify({ files, task }));
            apiReq.end();
          } catch (error) {
            // Send error response to client
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: `Invalid request: ${error.message}` }));
            
            // Broadcast error message
            broadcastToAll({
              type: 'error',
              message: `Invalid request: ${error.message}`
            });
          }
        });
        
        return;
      }
      
      // Handle modify endpoint
      if (req.url === '/modify' && req.method === 'POST') {
        let body = '';
        
        req.on('data', chunk => {
          body += chunk.toString();
        });
        
        req.on('end', async () => {
          try {
            const { files, task } = JSON.parse(body);
            
            if (!files || !Array.isArray(files) || files.length === 0) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Files array is required' }));
              return;
            }
            
            // Broadcast start message
            broadcastToAll({
              type: 'log',
              message: `Starting modification of ${files.join(', ')} with task: ${task}`
            });
            
            // Forward request to SPARC2 API
            const apiReq = http.request({
              hostname: 'localhost',
              port: SPARC2_API_PORT,
              path: '/modify',
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              }
            }, (apiRes) => {
              let apiData = '';
              
              apiRes.on('data', (chunk) => {
                apiData += chunk;
              });
              
              apiRes.on('end', () => {
                // Send response to client
                res.writeHead(apiRes.statusCode, { 'Content-Type': 'application/json' });
                res.end(apiData);
                
                // Broadcast completion message
                try {
                  const result = JSON.parse(apiData);
                  const modifiedCount = result.filter(r => r.modified).length;
                  broadcastToAll({
                    type: 'result',
                    message: `Modification completed with ${modifiedCount} files modified`
                  });
                } catch (e) {
                  broadcastToAll({
                    type: 'error',
                    message: `Error parsing modification results: ${e.message}`
                  });
                }
              });
            });
            
            apiReq.on('error', (error) => {
              // Send error response to client
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: `API request failed: ${error.message}` }));
              
              // Broadcast error message
              broadcastToAll({
                type: 'error',
                message: `API request failed: ${error.message}`
              });
            });
            
            // Send request body to API
            apiReq.write(JSON.stringify({ files, task }));
            apiReq.end();
          } catch (error) {
            // Send error response to client
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: `Invalid request: ${error.message}` }));
            
            // Broadcast error message
            broadcastToAll({
              type: 'error',
              message: `Invalid request: ${error.message}`
            });
          }
        });
        
        return;
      }
      
      // Handle unknown endpoints
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Endpoint not found' }));
    });
    
    // Start the server
    server.listen(ssePort, () => {
      console.log(`SSE server running on http://localhost:${ssePort}`);
      console.log(`Open http://localhost:${ssePort} in your browser to see the example`);
    });
  } catch (error) {
    console.error('Error starting server:', error.message);
    process.exit(1);
  }
}

// Start the server
createServer().catch(error => {
  console.error('Error starting server:', error);
  process.exit(1);
});