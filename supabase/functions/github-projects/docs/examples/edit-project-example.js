/**
 * GitHub Projects MCP Edit and Delete Example
 * 
 * This example demonstrates how to use the GitHub Projects MCP server
 * to edit and delete projects and project items.
 */

// Import the MCP client
const { McpClient } = require('@modelcontextprotocol/sdk/client/mcp.js');
const { HttpClientTransport } = require('@modelcontextprotocol/sdk/client/http.js');

// Configuration
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:3000';
const GITHUB_ORG = process.env.GITHUB_ORG || 'agenticsorg';

async function main() {
  try {
    console.log('GitHub Projects MCP Edit/Delete Example');
    console.log('--------------------------------------');
    
    // Create MCP client
    const transport = new HttpClientTransport(MCP_SERVER_URL);
    const client = new McpClient(transport);
    
    // Connect to the MCP server
    await client.connect();
    console.log(`Connected to MCP server at ${MCP_SERVER_URL}`);
    
    // Step 1: Create a new project for demonstration
    console.log('\n1. Creating a new project...');
    const createResult = await client.callTool('createProject', {
      organization: GITHUB_ORG,
      title: 'Test Project for Edit/Delete Demo'
    });
    
    if (!createResult.project) {
      throw new Error('Failed to create project');
    }
    
    const projectId = createResult.project.id;
    const projectNumber = createResult.project.number;
    console.log(`Project created with ID: ${projectId}`);
    console.log(`Project number: ${projectNumber}`);
    
    // Step 2: Edit the project
    console.log('\n2. Editing the project...');
    const editResult = await client.callTool('editProject', {
      projectId: projectId,
      title: 'Updated Project Title',
      description: 'This is an updated description for the project',
      public: true
    });
    
    console.log('Project updated:');
    console.log(`- Title: ${editResult.project.title}`);
    console.log(`- Description: ${editResult.project.shortDescription}`);
    console.log(`- Public: ${editResult.project.public}`);
    
    // Step 3: Create a project item
    console.log('\n3. Creating a project item...');
    const createItemResult = await client.callTool('createProjectItem', {
      projectId: projectId,
      title: 'Test Item',
      body: 'This is a test item for the demo'
    });
    
    if (!createItemResult.item) {
      throw new Error('Failed to create project item');
    }
    
    const itemId = createItemResult.item.id;
    console.log(`Project item created with ID: ${itemId}`);
    
    // Step 4: Edit the project item
    console.log('\n4. Editing the project item...');
    const editItemResult = await client.callTool('editProjectItem', {
      itemId: itemId,
      title: 'Updated Item Title',
      body: 'This is an updated description for the item'
    });
    
    console.log('Project item updated:');
    console.log(`- Title: ${editItemResult.item.title}`);
    console.log(`- Body: ${editItemResult.item.body}`);
    
    // Step 5: Delete the project item
    console.log('\n5. Deleting the project item...');
    const deleteItemResult = await client.callTool('deleteProjectItem', {
      itemId: itemId,
      projectId: projectId
    });
    
    console.log(`Project item deleted: ${deleteItemResult.result.success}`);
    
    // Step 6: Delete the project
    console.log('\n6. Deleting the project...');
    const deleteResult = await client.callTool('deleteProject', {
      projectId: projectId
    });
    
    console.log(`Project deleted: ${deleteResult.result.success}`);
    
    console.log('\nExample completed successfully!');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run the example
main().catch(console.error);