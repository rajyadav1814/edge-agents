/**
 * Tool Registration module for GitHub Projects MCP server
 * 
 * This module registers all tools with the MCP server.
 */

const repositoryTools = require('./repository-tools.js');
const projectTools = require('./project-tools.js');
const issueTools = require('./issue-tools.js');
const sshTools = require('./ssh-tools.js');
const graphqlTools = require('./graphql-tools.js');

/**
 * Register all tools with the MCP server
 * @param {McpServer} server - The MCP server
 * @param {Object} services - Object containing all service instances
 * @param {Object} config - Configuration object
 */
function registerTools(server, services, config) {
  // Register repository tools
  repositoryTools.register(server, services, config);
  
  // Register project tools
  projectTools.register(server, services, config);
  
  // Register issue tools
  issueTools.register(server, services, config);
  
  // Register SSH tools
  sshTools.register(server, services, config);
  
  // Register GraphQL tools
  graphqlTools.register(server, services, config);
}

module.exports = {
  registerTools
};