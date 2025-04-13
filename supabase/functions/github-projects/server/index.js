/**
 * MCP Server module for GitHub Projects API
 * 
 * This module initializes and configures the MCP server.
 */

const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');

/**
 * Create and configure an MCP server
 * @returns {McpServer} Configured MCP server
 */
function createServer() {
  const server = new McpServer({
    name: 'github-projects-mcp',
    version: '1.0.0'
  });
  
  return server;
}

/**
 * Start the MCP server with stdio transport
 * @param {McpServer} server - The MCP server to start
 * @param {Object} config - Configuration object
 * @returns {Promise<void>}
 */
async function startServer(server, config) {
  try {
    console.error('Starting GitHub Projects MCP server...');
    console.error(`GitHub Organization: ${config.githubOrg}`);
    console.error(`GitHub Token: ${config.githubToken ? '[Set]' : '[Missing]'}`);
    
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('GitHub Projects MCP server running on stdio');
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.error('Shutting down MCP server...');
      process.exit(0);
    });
  } catch (error) {
    console.error('Error starting MCP server:', error);
    process.exit(1);
  }
}

module.exports = {
  createServer,
  startServer
};