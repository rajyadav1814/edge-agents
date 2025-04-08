/**
 * Example of using the deleteProject tool
 * 
 * This example demonstrates how to delete a GitHub Project
 * using the GitHub Projects MCP server.
 */

// Import the MCP client
const { McpClient } = require('@modelcontextprotocol/sdk/client/mcp.js');
const { HttpClientTransport } = require('@modelcontextprotocol/sdk/client/http.js');

// Create an MCP client
async function main() {
  try {
    // Connect to the MCP server
    const transport = new HttpClientTransport('http://localhost:8002');
    const client = new McpClient();
    await client.connect(transport);
    
    console.log('Connected to GitHub Projects MCP server');
    
    // Get the project ID from command line arguments
    const projectId = process.argv[2];
    
    if (!projectId) {
      console.error('Project ID is required. Usage: node delete-project-example.js <projectId>');
      process.exit(1);
    }
    
    // Confirm deletion
    console.log(`WARNING: You are about to delete project with ID: ${projectId}`);
    console.log('This action cannot be undone.');
    
    // In a real application, you would add a confirmation prompt here
    
    // Delete the project
    const result = await client.callTool('deleteProject', {
      projectId: projectId
    });
    
    if (result.result && result.result.success) {
      console.log('Project deleted successfully:');
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.error('Failed to delete project:', result);
    }
    
    // Disconnect from the server
    await client.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run the example
main();