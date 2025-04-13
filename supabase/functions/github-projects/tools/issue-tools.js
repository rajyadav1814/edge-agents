/**
 * Issue Tools module for GitHub Projects MCP server
 * 
 * This module registers issue-related tools with the MCP server.
 */

const z = require('zod');

/**
 * Register issue tools with the MCP server
 * @param {McpServer} server - The MCP server
 * @param {Object} services - Object containing all service instances
 * @param {Object} config - Configuration object
 */
function register(server, services, config) {
  // Add createIssue tool
  server.tool(
    'createIssue',
    {
      repositoryOwner: z.string().describe('Repository owner'),
      repositoryName: z.string().describe('Repository name'),
      title: z.string().describe('Issue title'),
      body: z.string().optional().describe('Issue body')
    },
    async ({ repositoryOwner, repositoryName, title, body }) => {
      try {
        // First get the repository ID
        const repositoryId = await services.githubIssueService.getRepositoryId(repositoryOwner, repositoryName);
        
        // Create the issue
        const issue = await services.githubIssueService.createIssue(
          repositoryId,
          title,
          body || ''
        );
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(issue, null, 2)
            }
          ],
          issue
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

  // Add createSubIssue tool
  server.tool(
    'createSubIssue',
    {
      repositoryId: z.string().describe('Repository ID'),
      title: z.string().describe('Issue title'),
      body: z.string().optional().describe('Issue body'),
      parentIssueUrl: z.string().optional().describe('URL of the parent issue')
    },
    async ({ repositoryId, title, body, parentIssueUrl }) => {
      try {
        const issue = await services.githubIssueService.createSubIssue(
          repositoryId,
          title,
          body || '',
          parentIssueUrl
        );
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(issue, null, 2)
            }
          ],
          issue
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