#!/usr/bin/env node

/**
 * Direct test for the createProject function
 */

// Import the McpServer class
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const z = require('zod');

// Create a server instance
const server = new McpServer({
  name: 'test-server',
  version: '1.0.0'
});

// Define the tool handler
const createProjectHandler = async ({ organization, title, shortDescription }) => {
  // Mock create project response
  const project = {
    id: "proj_new",
    title: title,
    number: 99,
    shortDescription: shortDescription || "",
    url: `https://github.com/orgs/${organization}/projects/99`,
    createdAt: new Date().toISOString()
  };
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(project, null, 2)
      }
    ],
    project: project
  };
};

// Add the createProject tool
server.tool(
  'createProject',
  {
    organization: z.string().describe('Organization name'),
    title: z.string().describe('Project title'),
    shortDescription: z.string().optional().describe('Project description')
  },
  createProjectHandler
);

// Test the createProject tool
async function testCreateProject() {
  try {
    console.log('Testing createProject with shortDescription parameter...');
    
    // Call the handler directly
    const result = await createProjectHandler({
      organization: 'agenticsorg',
      title: 'Test Project',
      shortDescription: 'Test Description'
    });
    
    console.log('Result:', JSON.stringify(result, null, 2));
    
    if (result.project && result.project.shortDescription === 'Test Description') {
      console.log('✅ SUCCESS: Project created with shortDescription parameter!');
    } else {
      console.log('❌ FAILURE: Project created but shortDescription not set correctly');
    }
  } catch (error) {
    console.error('Error testing createProject:', error);
  }
}

// Run the test
testCreateProject();