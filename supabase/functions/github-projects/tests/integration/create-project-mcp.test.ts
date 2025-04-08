import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables from test .env file
const testEnvPath = path.resolve(process.cwd(), 'tests/.env');
dotenv.config({ path: testEnvPath });

describe('GitHub Projects MCP Server - createProject', () => {
  let mcpProcess: any;
  const mcpPort = 8099; // Use a different port for testing

  beforeAll(() => {
    // Start the MCP server for testing
    const mcpServerPath = path.resolve(process.cwd(), 'dist/simple-mcp-server.js');
    
    // Make sure the script is executable
    fs.chmodSync(mcpServerPath, '755');
    
    // Start the MCP server process
    mcpProcess = spawn('node', [mcpServerPath, '--port', mcpPort.toString()], {
      env: {
        ...process.env,
        PORT: mcpPort.toString(),
        GITHUB_TOKEN: process.env.GITHUB_TOKEN || '',
        GITHUB_ORG: process.env.GITHUB_ORG || 'agenticsorg'
      },
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    // Log server output for debugging
    mcpProcess.stdout.on('data', (data: Buffer) => {
      console.log(`MCP Server: ${data.toString()}`);
    });
    
    mcpProcess.stderr.on('data', (data: Buffer) => {
      console.error(`MCP Server Error: ${data.toString()}`);
    });
    
    // Wait for server to start
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 2000);
    });
  });
  
  afterAll(() => {
    // Terminate the MCP server process
    if (mcpProcess) {
      mcpProcess.kill();
    }
  });
  
  it('should create a project with shortDescription parameter', async () => {
    const projectTitle = `Test Project ${Date.now()}`;
    const projectDescription = 'This is a test project created via MCP test';
    
    const response = await fetch(`http://localhost:${mcpPort}/tools/call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'createProject',
        arguments: {
          organization: process.env.GITHUB_ORG || 'agenticsorg',
          title: projectTitle,
          shortDescription: projectDescription
        }
      })
    });
    
    expect(response.status).toBe(200);
    
    const result = await response.json();
    console.log('Create project response:', JSON.stringify(result, null, 2));
    
    // Verify the project was created with the correct shortDescription
    expect(result.project).toBeDefined();
    expect(result.project.title).toBe(projectTitle);
    expect(result.project.shortDescription).toBe(projectDescription);
    
    // Verify no error occurred
    expect(result.isError).toBeUndefined();
  }, 10000); // Increase timeout for API call
});