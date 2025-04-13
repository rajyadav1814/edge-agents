/**
 * Example: Update a project item field value
 * 
 * This example demonstrates how to update a field value (like Status) for a project item.
 * It uses the updateProjectFieldValue tool to change the status of an item.
 */

// Import the MCP client
const { McpClient } = require('@modelcontextprotocol/sdk/client/mcp.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

async function main() {
  try {
    // Create an MCP client
    const client = new McpClient();
    
    // Connect to the MCP server
    const transport = new StdioClientTransport({
      command: 'node /path/to/github-projects/mcp-stdio-server.js',
      env: {
        GITHUB_TOKEN: process.env.GITHUB_TOKEN,
        GITHUB_ORG: 'agenticsorg'
      }
    });
    
    await client.connect(transport);
    console.log('Connected to GitHub Projects MCP server');
    
    // Organization name
    const organization = 'agenticsorg';
    
    // Project number (replace with your project number)
    const projectNumber = 1;
    
    // First, get the project to find its ID
    const projectResult = await client.useTool('getProject', {
      organization,
      projectNumber
    });
    
    if (!projectResult.project) {
      throw new Error(`Project #${projectNumber} not found`);
    }
    
    const projectId = projectResult.project.id;
    console.log(`Found project: ${projectResult.project.title} (ID: ${projectId})`);
    
    // Get the project fields to find the Status field and its options
    const statusField = projectResult.project.fields.nodes.find(field => 
      field.name === 'Status' && field.options
    );
    
    if (!statusField) {
      throw new Error('Status field not found in project');
    }
    
    console.log('Available status options:');
    statusField.options.forEach(option => {
      console.log(`- ${option.name} (ID: ${option.id})`);
    });
    
    // Get the "Done" option (or any other status you want to set)
    const doneOption = statusField.options.find(option => option.name === 'Done');
    
    if (!doneOption) {
      throw new Error('Done status option not found');
    }
    
    // Get project items
    const itemsResult = await client.useTool('getProjectItems', {
      projectId,
      limit: 5
    });
    
    if (!itemsResult.items || itemsResult.items.length === 0) {
      throw new Error('No items found in project');
    }
    
    // Select the first item to update
    const itemToUpdate = itemsResult.items[0];
    console.log(`Updating item: ${itemToUpdate.content.title} (ID: ${itemToUpdate.id})`);
    
    // Update the item's status field
    const updateResult = await client.useTool('updateProjectFieldValue', {
      projectId,
      itemId: itemToUpdate.id,
      fieldId: statusField.id,
      optionId: doneOption.id
    });
    
    console.log('Field value updated successfully:');
    console.log(updateResult);
    
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
