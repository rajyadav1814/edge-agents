/**
 * Repository Tools module for GitHub Projects MCP server
 * 
 * This module registers repository-related tools with the MCP server.
 */

const z = require('zod');
const { callGitHubRestApi } = require('../utils/rest-api.js');

/**
 * Register repository tools with the MCP server
 * @param {McpServer} server - The MCP server
 * @param {Object} services - Object containing all service instances
 * @param {Object} config - Configuration object
 */
function register(server, services, config) {
  // Add getRepository tool
  server.tool(
    'getRepository',
    {
      owner: z.string().describe('Repository owner'),
      repo: z.string().describe('Repository name')
    },
    async ({ owner, repo }) => {
      try {
        const repoData = await callGitHubRestApi(`repos/${owner}/${repo}`, 'GET', null, config.githubToken);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(repoData, null, 2)
            }
          ],
          repository: repoData
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

  // Add getRepositoryId tool
  server.tool(
    'getRepositoryId',
    {
      owner: z.string().describe('Repository owner'),
      name: z.string().describe('Repository name')
    },
    async ({ owner, name }) => {
      try {
        const repositoryId = await services.githubIssueService.getRepositoryId(owner, name);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ id: repositoryId }, null, 2)
            }
          ],
          repositoryId
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