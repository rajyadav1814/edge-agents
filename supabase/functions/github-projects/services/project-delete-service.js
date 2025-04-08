/**
 * Project Delete Service
 * 
 * Service for deleting GitHub Projects and Project Items
 */

const { executeGraphQLQuery } = require('../utils/graphql-client.js');
const { DELETE_PROJECT_MUTATION, DELETE_PROJECT_ITEM_MUTATION } = require('./graphql/mutations.js');
const { GitHubError } = require('../utils/error-handler.js');

/**
 * Service for deleting GitHub Projects and Project Items
 */
class ProjectDeleteService {
  /**
   * Create a new ProjectDeleteService
   * @param {object} config Configuration object with GitHub token
   */
  constructor(config) {
    this.config = config;
  }

  /**
   * Delete a GitHub Project
   * @param {string} projectId Project ID
   * @returns {Promise<object>} Success status
   */
  async deleteProject(projectId) {
    if (!projectId) {
      throw new GitHubError('Project ID is required', 400);
    }
    
    try {
      const response = await executeGraphQLQuery(
        DELETE_PROJECT_MUTATION,
        { projectId },
        this.config.githubToken
      );
      
      if (response.errors && response.errors.length > 0) {
        throw new GitHubError(
          `GraphQL Error: ${response.errors.map(e => e.message).join(', ')}`,
          500
        );
      }
      
      return { success: true, projectId };
    } catch (error) {
      if (error instanceof GitHubError) {
        throw error;
      }
      throw new GitHubError(`Failed to delete project: ${error.message || error}`, 500);
    }
  }
  
  /**
   * Delete a GitHub Project item
   * @param {string} itemId Item ID
   * @param {string} projectId Project ID
   * @returns {Promise<object>} Success status
   */
  async deleteProjectItem(itemId, projectId) {
    if (!itemId) {
      throw new GitHubError('Item ID is required', 400);
    }
    
    if (!projectId) {
      throw new GitHubError('Project ID is required', 400);
    }
    
    try {
      // First, check if the item exists
      const checkItemQuery = `
        query CheckItem($id: ID!) {
          node(id: $id) {
            __typename
            ... on ProjectV2Item {
              id
              project {
                id
              }
            }
          }
        }
      `;
      
      const checkResult = await executeGraphQLQuery(
        checkItemQuery,
        { id: itemId },
        this.config.githubToken
      );
      
      if (checkResult.errors && checkResult.errors.length > 0) {
        throw new GitHubError(
          `GraphQL Error: ${checkResult.errors.map(e => e.message).join(', ')}`,
          500
        );
      }
      
      if (!checkResult.data?.node) {
        throw new GitHubError(`Item with ID ${itemId} not found`, 404);
      }
      
      const item = checkResult.data.node;
      
      // If the item is not a ProjectV2Item, throw an error
      if (item.__typename !== 'ProjectV2Item') {
        throw new GitHubError(`Item with ID ${itemId} is not a valid project item`, 400);
      }
      
      // Verify that the item belongs to the specified project
      if (item.project && item.project.id !== projectId) {
        throw new GitHubError(`Item with ID ${itemId} does not belong to project ${projectId}`, 400);
      }
      
      // Delete the item
      const response = await executeGraphQLQuery(
        DELETE_PROJECT_ITEM_MUTATION,
        { itemId, projectId },
        this.config.githubToken
      );
      
      if (response.errors && response.errors.length > 0) {
        throw new GitHubError(
          `GraphQL Error: ${response.errors.map(e => e.message).join(', ')}`,
          500
        );
      }
      
      return { success: true, itemId };
    } catch (error) {
      if (error instanceof GitHubError) {
        throw error;
      }
      throw new GitHubError(`Failed to delete project item: ${error.message || error}`, 500);
    }
  }
}

module.exports = {
  ProjectDeleteService
};