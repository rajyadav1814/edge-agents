/**
 * Test client for GitHub Projects MCP server
 * 
 * This script tests the MCP server by sending requests to the stdio interface.
 */

const { spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

// Check if the MCP SDK is installed
try {
  require.resolve('@modelcontextprotocol/sdk');
} catch (e) {
  console.error('MCP SDK not found. Please run: npm install @modelcontextprotocol/sdk');
  process.exit(1);
}

// Import MCP SDK
const { McpClient } = require('@modelcontextprotocol/sdk');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk');

// Start the MCP server process
function startMcpServer() {
  console.log('Starting MCP server process...');
  
  const serverProcess = spawn('node', ['mcp-stdio-server.js'], {
    cwd: path.join(__dirname, 'dist'),
    env: {
      ...process.env,
      GITHUB_TOKEN: process.env.GITHUB_TOKEN || process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
      GITHUB_ORG: process.env.GITHUB_ORG || 'agenticsorg'
    },
    stdio: ['pipe', 'pipe', 'inherit'] // stdin, stdout, stderr
  });

  // Handle server process errors
  serverProcess.on('error', (error) => {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  });

  return serverProcess;
}

// Main function to run tests
async function runTests() {
  console.log('Starting GitHub Projects MCP test client...');
  
  // Start the MCP server
  const serverProcess = startMcpServer();
  
  // Create a client with stdio transport
  const transport = new StdioClientTransport({
    input: serverProcess.stdout,
    output: serverProcess.stdin
  });
  
  const client = new McpClient();
  
  try {
    // Connect to the server
    console.log('Connecting to MCP server...');
    await client.connect(transport);
    console.log('Connected to MCP server successfully!');
    
    // Test getRepository
    console.log('\n--- Testing getRepository ---');
    const repoResult = await client.callTool('getRepository', {
      owner: 'agenticsorg',
      repo: 'edge-agents'
    });
    console.log('Repository info:', JSON.stringify(repoResult, null, 2));
    
    // Test listProjects
    console.log('\n--- Testing listProjects ---');
    const projectsResult = await client.callTool('listProjects', {
      organization: 'agenticsorg',
      limit: 5
    });
    console.log('Projects:', JSON.stringify(projectsResult, null, 2));
    
    // If we have projects, get the first one's details
    if (projectsResult.projects && projectsResult.projects.length > 0) {
      const firstProject = projectsResult.projects[0];
      
      // Test getProject
      console.log('\n--- Testing getProject ---');
      const projectResult = await client.callTool('getProject', {
        organization: 'agenticsorg',
        projectNumber: firstProject.number
      });
      console.log('Project details:', JSON.stringify(projectResult, null, 2));
      
      // Create a new project
      console.log('\n--- Testing createProject ---');
      const newProjectResult = await client.callTool('createProject', {
        organization: 'agenticsorg',
        title: 'Test Project via MCP ' + new Date().toISOString(),
        description: 'This project was created via MCP for testing purposes'
      });
      console.log('New project:', JSON.stringify(newProjectResult, null, 2));
      
      if (newProjectResult.project && newProjectResult.project.id) {
        // Create a project item
        console.log('\n--- Testing createProjectItem ---');
        const newItemResult = await client.callTool('createProjectItem', {
          projectId: newProjectResult.project.id,
          title: 'Test Task via MCP',
          body: 'This task was created via MCP for testing purposes'
        });
        console.log('New project item:', JSON.stringify(newItemResult, null, 2));
        
        // Get project items
        console.log('\n--- Testing getProjectItems ---');
        const itemsResult = await client.callTool('getProjectItems', {
          projectId: newProjectResult.project.id,
          limit: 10
        });
        console.log('Project items:', JSON.stringify(itemsResult, null, 2));
      }
    }
    
    // Test executeGraphQL
    console.log('\n--- Testing executeGraphQL ---');
    const graphqlResult = await client.callTool('executeGraphQL', {
      query: `query { viewer { login } }`,
      variables: {}
    });
    console.log('GraphQL result:', JSON.stringify(graphqlResult, null, 2));
    
    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('Error during tests:', error);
  } finally {
    // Disconnect and clean up
    await client.disconnect();
    serverProcess.kill();
    console.log('Test client disconnected and server stopped.');
  }
}

// Run the tests
runTests().catch(console.error);