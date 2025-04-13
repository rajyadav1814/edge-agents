/**
 * GraphQL Tools module for GitHub Projects MCP server
 * 
 * This module registers GraphQL-related tools with the MCP server.
 */

const z = require('zod');
const { executeGraphQLQuery } = require('../utils/graphql-client.js');

/**
 * Register GraphQL tools with the MCP server
 * @param {McpServer} server - The MCP server
 * @param {Object} services - Object containing all service instances
 * @param {Object} config - Configuration object
 */
function register(server, services, config) {
  // Add executeGraphQL tool
  server.tool(
    'executeGraphQL',
    {
      query: z.string().describe('GraphQL query'),
      variables: z.record(z.any()).optional().describe('Query variables')
    },
    async ({ query, variables }) => {
      try {
        const result = await executeGraphQLQuery(query, variables || {}, config.githubToken);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result.data, null, 2)
            }
          ],
          response: result.data
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`
            }
          ],
          isError: true
        };
      }
    }
  );
}

module.exports = {
  register
};