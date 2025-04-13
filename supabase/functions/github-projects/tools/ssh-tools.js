/**
 * SSH Tools module for GitHub Projects MCP server
 * 
 * This module registers SSH authentication-related tools with the MCP server.
 */

const z = require('zod');

/**
 * Register SSH tools with the MCP server
 * @param {McpServer} server - The MCP server
 * @param {Object} services - Object containing all service instances
 * @param {Object} config - Configuration object
 */
function register(server, services, config) {
  // Add addSSHKeyToAgent tool
  server.tool(
    'addSSHKeyToAgent',
    {},
    async () => {
      try {
        const result = await services.sshAuthService.addSSHKeyToAgent();
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ],
          result
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

  // Add generateSSHKey tool
  server.tool(
    'generateSSHKey',
    {
      email: z.string().describe('Email to associate with the key')
    },
    async ({ email }) => {
      try {
        const result = await services.sshAuthService.generateSSHKey(email);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ],
          result
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

  // Add updatePackageJsonRepos tool
  server.tool(
    'updatePackageJsonRepos',
    {
      packageJsonPath: z.string().describe('Path to package.json file')
    },
    async ({ packageJsonPath }) => {
      try {
        const result = await services.sshAuthService.updatePackageJsonRepos(packageJsonPath);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ],
          result
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

  // Add testGitHubConnection tool
  server.tool(
    'testGitHubConnection',
    {},
    async () => {
      try {
        const result = await services.sshAuthService.testGitHubConnection();
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ],
          result
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

  // Add setupCodespacesAuth tool
  server.tool(
    'setupCodespacesAuth',
    {},
    async () => {
      try {
        const result = await services.sshAuthService.setupCodespacesAuth();
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ],
          result
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