/**
 * GitHub Project Service
 * 
 * Provides functionality for creating and managing GitHub Projects
 * using the GitHub GraphQL API.
 */

const { executeGraphQLQuery } = require('../utils/graphql-client.js');

class GitHubProjectService {
  constructor(config) {
    this.config = config;
  }

  /**
   * Create a new GitHub Project
   * @param {string} ownerId - Repository or organization ID
   * @param {string} title - Project title
   * @returns {Promise<object>} - Created project
   */
  async createProject(ownerId, title) {
    const query = `
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
    
    const variables = {
      ownerId,
      title
    };
    
    const result = await executeGraphQLQuery(query, variables, this.config.githubToken);
    
    if (!result.data || !result.data.createProjectV2 || !result.data.createProjectV2.projectV2) {
      throw new Error('Failed to create project');
    }
    
    return result.data.createProjectV2.projectV2;
  }

  /**
   * Add an issue or pull request to a project
   * @param {string} projectId - Project ID
   * @param {string} contentId - Issue or PR ID
   * @returns {Promise<object>} - Added item
   */
  async addItemToProject(projectId, contentId) {
    const query = `
      mutation AddItemToProject($projectId: ID!, $contentId: ID!) {
        addProjectV2ItemById(
          input: {
            projectId: $projectId,
            contentId: $contentId
          }
        ) {
          item {
            id
            content {
              ... on Issue {
                id
                title
                number
              }
              ... on PullRequest {
                id
                title
                number
              }
            }
          }
        }
      }
    `;
    
    const variables = {
      projectId,
      contentId
    };
    
    const result = await executeGraphQLQuery(query, variables, this.config.githubToken);
    
    if (!result.data || !result.data.addProjectV2ItemById || !result.data.addProjectV2ItemById.item) {
      throw new Error('Failed to add item to project');
    }
    
    return result.data.addProjectV2ItemById.item;
  }

  /**
   * Create a regular issue in a repository
   * @param {string} repositoryId - Repository ID
   * @param {string} title - Issue title
   * @param {string} body - Issue body
   * @returns {Promise<object>} - Created issue
   */
  async createIssue(repositoryId, title, body) {
    const query = `
      mutation CreateIssue($repositoryId: ID!, $title: String!, $body: String!) {
        createIssue(
          input: {
            repositoryId: $repositoryId,
            title: $title,
            body: $body
          }
        ) {
          issue {
            id
            title
            number
            url
            body
          }
        }
      }
    `;
    
    const variables = {
      repositoryId,
      title,
      body: body || ''
    };
    
    const result = await executeGraphQLQuery(query, variables, this.config.githubToken);
    
    if (!result.data || !result.data.createIssue || !result.data.createIssue.issue) {
      throw new Error('Failed to create issue');
    }
    
    return result.data.createIssue.issue;
  }

  /**
   * Create a sub-issue linked to a parent issue
   * @param {string} repositoryId - Repository ID
   * @param {string} title - Issue title
   * @param {string} body - Issue body
   * @param {string} parentIssueUrl - URL of the parent issue to reference
   * @returns {Promise<object>} - Created issue
   */
  async createSubIssue(repositoryId, title, body, parentIssueUrl) {
    // Add reference to parent in the body
    const bodyWithReference = parentIssueUrl 
      ? `${body || ''}\n\nRelated to: ${parentIssueUrl}` 
      : body;
    
    const query = `
      mutation CreateSubIssue($repositoryId: ID!, $title: String!, $body: String!) {
        createIssue(
          input: {
            repositoryId: $repositoryId,
            title: $title,
            body: $body
          }
        ) {
          issue {
            id
            title
            number
            url
            body
          }
        }
      }
    `;
    
    const variables = {
      repositoryId,
      title,
      body: bodyWithReference
    };
    
    const result = await executeGraphQLQuery(query, variables, this.config.githubToken);
    
    if (!result.data || !result.data.createIssue || !result.data.createIssue.issue) {
      throw new Error('Failed to create sub-issue');
    }
    
    return result.data.createIssue.issue;
  }

  /**
   * Update a project field value
   * @param {string} itemId - Project item ID
   * @param {string} fieldId - Field ID
   * @param {string} value - New value
   * @returns {Promise<object>} - Updated item
   */
  async updateFieldValue(itemId, fieldId, value) {
    const query = `
      mutation UpdateFieldValue($itemId: ID!, $fieldId: ID!, $value: String!) {
        updateProjectV2ItemFieldValue(
          input: {
            projectV2ItemId: $itemId,
            fieldId: $fieldId,
            value: {text: $value}
          }
        ) {
          projectV2Item {
            id
          }
        }
      }
    `;
    
    const variables = {
      itemId,
      fieldId,
      value
    };
    
    const result = await executeGraphQLQuery(query, variables, this.config.githubToken);
    
    if (!result.data || !result.data.updateProjectV2ItemFieldValue || !result.data.updateProjectV2ItemFieldValue.projectV2Item) {
      throw new Error('Failed to update field value');
    }
    
    return result.data.updateProjectV2ItemFieldValue.projectV2Item;
  }

  /**
   * Get repository ID by owner and name
   * @param {string} owner - Repository owner
   * @param {string} name - Repository name
   * @returns {Promise<string>} - Repository ID
   */
  async getRepositoryId(owner, name) {
    const query = `
      query GetRepositoryId($owner: String!, $name: String!) {
        repository(owner: $owner, name: $name) {
          id
        }
      }
    `;
    
    const variables = {
      owner,
      name
    };
    
    const result = await executeGraphQLQuery(query, variables, this.config.githubToken);
    
    if (!result.data || !result.data.repository || !result.data.repository.id) {
      throw new Error(`Repository ${owner}/${name} not found or not accessible`);
    }
    
    return result.data.repository.id;
  }
}

module.exports = { GitHubProjectService };