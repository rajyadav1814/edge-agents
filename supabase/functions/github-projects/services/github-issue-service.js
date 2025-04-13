/**
 * GitHub Issue Service
 * 
 * This service provides methods for interacting with GitHub Issues API.
 */

const { executeGraphQLQuery } = require('../utils/graphql-client.js');

class GitHubIssueService {
  /**
   * Initialize the GitHub Issue Service
   * @param {Object} config - Configuration object
   */
  constructor(config) {
    this.config = config;
  }

  /**
   * Get repository ID by owner and name
   * @param {string} owner - Repository owner
   * @param {string} name - Repository name
   * @returns {Promise<string>} - Repository ID
   */
  async getRepositoryId(owner, name) {
    try {
      const query = `
        query GetRepositoryId($owner: String!, $name: String!) {
          repository(owner: $owner, name: $name) {
            id
          }
        }
      `;
      
      const variables = { owner, name };
      const result = await executeGraphQLQuery(query, variables, this.config.githubToken);
      
      if (!result.data || !result.data.repository || !result.data.repository.id) {
        throw new Error(`Repository ${owner}/${name} not found or not accessible`);
      }
      
      return result.data.repository.id;
    } catch (error) {
      console.error('Error getting repository ID:', error);
      throw error;
    }
  }

  /**
   * Create a new issue
   * @param {string} repositoryId - Repository ID
   * @param {string} title - Issue title
   * @param {string} body - Issue body
   * @returns {Promise<Object>} - Created issue
   */
  async createIssue(repositoryId, title, body) {
    try {
      const mutation = `
        mutation CreateIssue($repositoryId: ID!, $title: String!, $body: String!) {
          createIssue(input: {
            repositoryId: $repositoryId,
            title: $title,
            body: $body
          }) {
            issue {
              id
              number
              title
              body
              url
              createdAt
            }
          }
        }
      `;
      
      const variables = { repositoryId, title, body };
      const result = await executeGraphQLQuery(mutation, variables, this.config.githubToken);
      
      if (!result.data || !result.data.createIssue || !result.data.createIssue.issue) {
        throw new Error('Failed to create issue');
      }
      
      return result.data.createIssue.issue;
    } catch (error) {
      console.error('Error creating issue:', error);
      throw error;
    }
  }

  /**
   * Create a sub-issue linked to a parent issue
   * @param {string} repositoryId - Repository ID
   * @param {string} title - Issue title
   * @param {string} body - Issue body
   * @param {string} parentIssueUrl - URL of the parent issue
   * @returns {Promise<Object>} - Created sub-issue
   */
  async createSubIssue(repositoryId, title, body, parentIssueUrl) {
    try {
      // Add reference to parent issue in the body if provided
      let issueBody = body || '';
      
      if (parentIssueUrl) {
        issueBody = `${issueBody}\n\n**Parent Issue:** ${parentIssueUrl}`;
      }
      
      // Create the issue
      const issue = await this.createIssue(repositoryId, title, issueBody);
      
      return {
        ...issue,
        isSubIssue: !!parentIssueUrl,
        parentIssueUrl: parentIssueUrl || null
      };
    } catch (error) {
      console.error('Error creating sub-issue:', error);
      throw error;
    }
  }

  /**
   * Add an item to a project
   * @param {string} projectId - Project ID
   * @param {string} contentId - Issue or PR ID
   * @returns {Promise<Object>} - Added project item
   */
  async addItemToProject(projectId, contentId) {
    try {
      const mutation = `
        mutation AddItemToProject($projectId: ID!, $contentId: ID!) {
          addProjectV2ItemById(input: {
            projectId: $projectId,
            contentId: $contentId
          }) {
            item {
              id
              type
            }
          }
        }
      `;
      
      const variables = { projectId, contentId };
      const result = await executeGraphQLQuery(mutation, variables, this.config.githubToken);
      
      if (!result.data || !result.data.addProjectV2ItemById || !result.data.addProjectV2ItemById.item) {
        throw new Error('Failed to add item to project');
      }
      
      return result.data.addProjectV2ItemById.item;
    } catch (error) {
      console.error('Error adding item to project:', error);
      throw error;
    }
  }

  /**
   * Update a project field value
   * @param {string} itemId - Project item ID
   * @param {string} fieldId - Field ID
   * @param {string} value - New value
   * @returns {Promise<Object>} - Updated field
   */
  async updateProjectFieldValue(itemId, fieldId, value) {
    try {
      const mutation = `
        mutation UpdateProjectFieldValue($itemId: ID!, $fieldId: ID!, $value: String!) {
          updateProjectV2ItemFieldValue(input: {
            projectV2ItemId: $itemId,
            fieldId: $fieldId,
            value: {text: $value}
          }) {
            projectV2Item {
              id
            }
          }
        }
      `;
      
      const variables = { itemId, fieldId, value };
      const result = await executeGraphQLQuery(mutation, variables, this.config.githubToken);
      
      if (!result.data || !result.data.updateProjectV2ItemFieldValue || !result.data.updateProjectV2ItemFieldValue.projectV2Item) {
        throw new Error('Failed to update project field value');
      }
      
      return {
        success: true,
        itemId,
        fieldId,
        value
      };
    } catch (error) {
      console.error('Error updating project field value:', error);
      throw error;
    }
  }
}

module.exports = { GitHubIssueService };