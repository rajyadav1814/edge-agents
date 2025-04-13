/**
 * Project Tools module for GitHub Projects MCP server
 * 
 * This module registers project-related tools with the MCP server.
 */

const z = require('zod');
const { executeGraphQLQuery } = require('../utils/graphql-client.js');

/**
 * Register project tools with the MCP server
 * @param {McpServer} server - The MCP server
 * @param {Object} services - Object containing all service instances
 * @param {Object} config - Configuration object
 */
function register(server, services, config) {
  // Add listProjects tool
  server.tool(
    'listProjects',
    {
      organization: z.string().describe('Organization name'),
      limit: z.number().optional().default(10).describe('Maximum number of projects to return')
    },
    async ({ organization, limit }) => {
      try {
        // GraphQL query to list projects
        const query = `
          query ListProjects($org: String!, $first: Int!) {
            organization(login: $org) {
              projectsV2(first: $first) {
                nodes {
                  id
                  title
                  number
                  shortDescription
                  public
                  url
                  closed
                  createdAt
                  updatedAt
                }
              }
            }
          }
        `;
        
        const variables = { org: organization, first: limit };
        const result = await executeGraphQLQuery(query, variables, config.githubToken);
        
        if (!result.data || !result.data.organization) {
          throw new Error(`Organization ${organization} not found or not accessible`);
        }
        
        const projects = result.data.organization.projectsV2.nodes;
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(projects, null, 2)
            }
          ],
          projects: projects
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

  // Add getProject tool
  server.tool(
    'getProject',
    {
      organization: z.string().describe('Organization name'),
      projectNumber: z.number().describe('Project number')
    },
    async ({ organization, projectNumber }) => {
      try {
        // GraphQL query to get project details
        const query = `
          query GetProject($org: String!, $number: Int!) {
            organization(login: $org) {
              projectV2(number: $number) {
                id
                title
                number
                shortDescription
                public
                url
                closed
                createdAt
                updatedAt
                fields(first: 20) {
                  nodes {
                    ... on ProjectV2Field {
                      id
                      name
                    }
                    ... on ProjectV2IterationField {
                      id
                      name
                      configuration {
                        iterations {
                          startDate
                          id
                        }
                      }
                    }
                    ... on ProjectV2SingleSelectField {
                      id
                      name
                      options {
                        id
                        name
                      }
                    }
                  }
                }
              }
            }
          }
        `;
        
        const variables = { org: organization, number: projectNumber };
        const result = await executeGraphQLQuery(query, variables, config.githubToken);
        
        if (!result.data || !result.data.organization || !result.data.organization.projectV2) {
          throw new Error(`Project #${projectNumber} not found in organization ${organization}`);
        }
        
        const project = result.data.organization.projectV2;
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(project, null, 2)
            }
          ],
          project: project
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

  // Add createProject tool
  server.tool(
    'createProject',
    {
      organization: z.string().describe('Organization name'),
      title: z.string().describe('Project title')
    },
    async ({ organization, title }) => {
      try {
        // First get the organization ID
        const orgQuery = `
          query GetOrganizationId($login: String!) {
            organization(login: $login) {
              id
            }
          }
        `;
        
        const orgResult = await executeGraphQLQuery(orgQuery, { login: organization }, config.githubToken);
        
        if (!orgResult.data || !orgResult.data.organization || !orgResult.data.organization.id) {
          throw new Error(`Organization ${organization} not found or not accessible`);
        }
        
        // Create the project
        const createQuery = `
          mutation CreateProject($ownerId: ID!, $title: String!) {
            createProjectV2(
              input: {
                ownerId: $ownerId,
                title: $title
              }
            ) {
              projectV2 {
                id
                title
                number
                shortDescription
                url
                createdAt
              }
            }
          }
        `;
        
        const createVariables = {
          ownerId: orgResult.data.organization.id,
          title
        };
        
        const createResult = await executeGraphQLQuery(createQuery, createVariables, config.githubToken);
        
        if (!createResult.data || !createResult.data.createProjectV2 || !createResult.data.createProjectV2.projectV2) {
          throw new Error('Failed to create project');
        }
        
        const project = createResult.data.createProjectV2.projectV2;
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(project, null, 2)
            }
          ],
          project: project
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

  // Add createProjectItem tool
  server.tool(
    'createProjectItem',
    {
      projectId: z.string().describe('Project ID'),
      title: z.string().describe('Item title'),
      body: z.string().optional().describe('Item body/description')
    },
    async ({ projectId, title, body }) => {
      try {
        // Create a draft issue in the project
        const createQuery = `
          mutation CreateDraftIssue($projectId: ID!, $title: String!, $body: String) {
            addProjectV2DraftIssue(
              input: {
                projectId: $projectId,
                title: $title,
                body: $body
              }
            ) {
              projectItem {
                id
                databaseId
                type
                content {
                  ... on DraftIssue {
                    id
                    title
                    body
                  }
                }
              }
            }
          }
        `;
        
        const variables = { 
          projectId,
          title,
          body: body || ""
        };
        
        const result = await executeGraphQLQuery(createQuery, variables, config.githubToken);
        
        if (!result.data || !result.data.addProjectV2DraftIssue || !result.data.addProjectV2DraftIssue.projectItem) {
          throw new Error('Failed to create project item');
        }
        
        const item = result.data.addProjectV2DraftIssue.projectItem;
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(item, null, 2)
            }
          ],
          item: item
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

  // Add getProjectItems tool
  server.tool(
    'getProjectItems',
    {
      projectId: z.string().describe('Project ID'),
      limit: z.number().optional().default(20).describe('Maximum number of items to return')
    },
    async ({ projectId, limit }) => {
      try {
        // GraphQL query to get project items
        const query = `
          query GetProjectItems($projectId: ID!, $first: Int!) {
            node(id: $projectId) {
              ... on ProjectV2 {
                items(first: $first) {
                  nodes {
                    id
                    content {
                      ... on Issue {
                        id
                        title
                        number
                        url
                      }
                      ... on PullRequest {
                        id
                        title
                        number
                        url
                      }
                      ... on DraftIssue {
                        id
                        title
                        body
                      }
                    }
                  }
                }
              }
            }
          }
        `;
        
        const variables = { projectId, first: limit };
        const result = await executeGraphQLQuery(query, variables, config.githubToken);
        
        if (!result.data || !result.data.node) {
          throw new Error(`Project with ID ${projectId} not found`);
        }
        
        const items = result.data.node.items.nodes;
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(items, null, 2)
            }
          ],
          items: items
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

  // Add editProject tool
  server.tool(
    'editProject',
    {
      projectId: z.string().describe('ID of the project to edit'),
      title: z.string().optional().describe('New title for the project'),
      description: z.string().optional().describe('New description for the project'),
      public: z.boolean().optional().describe('Whether the project should be public')
    },
    async ({ projectId, title, description, public: isPublic }) => {
      try {
        const updatedProject = await services.projectEditService.editProject(projectId, {
          title,
          description,
          public: isPublic
        });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(updatedProject, null, 2)
            }
          ],
          project: updatedProject
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

  // Add deleteProject tool
  server.tool(
    'deleteProject',
    {
      projectId: z.string().describe('ID of the project to delete')
    },
    async ({ projectId }) => {
      try {
        const result = await services.projectDeleteService.deleteProject(projectId);
        
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

  // Add editProjectItem tool
  server.tool(
    'editProjectItem',
    {
      itemId: z.string().describe('ID of the item to edit'),
      title: z.string().optional().describe('New title for the item'),
      body: z.string().optional().describe('New body content for the item')
    },
    async ({ itemId, title, body }) => {
      try {
        const updatedItem = await services.projectEditService.editProjectItem(itemId, {
          title,
          body
        });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(updatedItem, null, 2)
            }
          ],
          item: updatedItem
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

  // Add deleteProjectItem tool
  server.tool(
    'deleteProjectItem',
    {
      itemId: z.string().describe('ID of the item to delete'),
      projectId: z.string().describe('ID of the project containing the item')
    },
    async ({ itemId, projectId }) => {
      try {
        const result = await services.projectDeleteService.deleteProjectItem(itemId, projectId);
        
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

  // Add updateProjectFieldValue tool
  server.tool(
    'updateProjectFieldValue',
    {
      itemId: z.string().describe('Project item ID'),
      fieldId: z.string().describe('Field ID'),
      value: z.string().describe('New value')
    },
    async ({ itemId, fieldId, value }) => {
      try {
        const result = await services.githubIssueService.updateProjectFieldValue(itemId, fieldId, value);
        
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

  // Add addItemToProject tool
  server.tool(
    'addItemToProject',
    {
      projectId: z.string().describe('Project ID'),
      contentId: z.string().describe('Issue or PR ID')
    },
    async ({ projectId, contentId }) => {
      try {
        const result = await services.githubIssueService.addItemToProject(projectId, contentId);
        
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