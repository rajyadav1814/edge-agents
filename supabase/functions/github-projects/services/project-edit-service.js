/**
 * Project Edit Service
 * 
 * Service for editing GitHub Projects and Project Items
 */

const { executeGraphQLQuery } = require('../utils/graphql-client.js');
const { UPDATE_PROJECT_MUTATION, UPDATE_PROJECT_ITEM_MUTATION } = require('./graphql/mutations.js');
const { GitHubError } = require('../utils/error-handler.js');

/**
 * Service for editing GitHub Projects and Project Items
 */
class ProjectEditService {
  /**
   * Create a new ProjectEditService
   * @param {object} config Configuration object with GitHub token
   */
  constructor(config) {
    this.config = config;
  }

  /**
   * Edit a GitHub Project
   * @param {string} projectId Project ID
   * @param {object} updates Project updates (title, description, public)
   * @returns {Promise<object>} Updated project
   */
  async editProject(projectId, updates) {
    if (!projectId) {
      throw new GitHubError('Project ID is required', 400);
    }
    
    if (!updates || Object.keys(updates).length === 0) {
      throw new GitHubError('At least one update field is required', 400);
    }
    
    try {
      const response = await executeGraphQLQuery(
        UPDATE_PROJECT_MUTATION,
        {
          projectId,
          title: updates.title,
          description: updates.description,
          public: updates.public
        },
        this.config.githubToken
      );
      
      if (response.errors && response.errors.length > 0) {
        throw new GitHubError(
          `GraphQL Error: ${response.errors.map(e => e.message).join(', ')}`,
          500
        );
      }
      
      if (!response.data?.updateProjectV2?.projectV2) {
        throw new GitHubError('Failed to update project', 500);
      }
      
      return response.data.updateProjectV2.projectV2;
    } catch (error) {
      if (error instanceof GitHubError) {
        throw error;
      }
      throw new GitHubError(`Failed to update project: ${error.message || error}`, 500);
    }
  }
  
  /**
   * Edit a GitHub Project item
   * @param {string} itemId Item ID
   * @param {object} updates Item updates (title, body)
   * @returns {Promise<object>} Updated item
   */
  async editProjectItem(itemId, updates) {
    if (!itemId) {
      throw new GitHubError('Item ID is required', 400);
    }
    
    if (!updates || Object.keys(updates).length === 0) {
      throw new GitHubError('At least one update field is required', 400);
    }
    
    try {
      // First, get the item details to determine what type of content it has
      const getItemQuery = `
        query GetProjectItem($id: ID!) {
          node(id: $id) {
            __typename
            ... on ProjectV2Item {
              id
              type
              content {
                __typename
                ... on DraftIssue {
                  id
                  title
                  body
                }
                ... on Issue {
                  id
                  title
                  body
                  number
                  repository {
                    name
                    owner {
                      login
                    }
                  }
                }
                ... on PullRequest {
                  id
                  title
                  body
                  number
                  repository {
                    name
                    owner {
                      login
                    }
                  }
                }
              }
            }
          }
        }
      `;
      
      const itemResult = await executeGraphQLQuery(
        getItemQuery,
        { id: itemId },
        this.config.githubToken
      );
      
      if (itemResult.errors && itemResult.errors.length > 0) {
        throw new GitHubError(
          `GraphQL Error: ${itemResult.errors.map(e => e.message).join(', ')}`,
          500
        );
      }
      
      if (!itemResult.data?.node) {
        throw new GitHubError(`Item with ID ${itemId} not found`, 404);
      }
      
      const item = itemResult.data.node;
      
      if (item.__typename !== 'ProjectV2Item') {
        throw new GitHubError(`ID ${itemId} is not a valid project item`, 400);
      }
      
      if (!item.content) {
        throw new GitHubError(`Project item ${itemId} has no content to edit`, 400);
      }
      
      const contentType = item.content.__typename;
      
      // Handle different content types
      if (contentType === 'DraftIssue') {
        // For draft issues, use the updateProjectV2DraftIssue mutation
        const updateDraftQuery = `
          mutation UpdateDraftIssue($draftIssueId: ID!, $title: String, $body: String) {
            updateProjectV2DraftIssue(
              input: {
                draftIssueId: $draftIssueId,
                title: $title,
                body: $body
              }
            ) {
              draftIssue {
                id
                title
                body
              }
            }
          }
        `;
        
        const updateResult = await executeGraphQLQuery(
          updateDraftQuery,
          {
            draftIssueId: item.content.id,
            title: updates.title,
            body: updates.body
          },
          this.config.githubToken
        );
        
        if (updateResult.errors && updateResult.errors.length > 0) {
          throw new GitHubError(
            `GraphQL Error: ${updateResult.errors.map(e => e.message).join(', ')}`,
            500
          );
        }
        
        if (!updateResult.data?.updateProjectV2DraftIssue?.draftIssue) {
          throw new GitHubError('Failed to update draft issue', 500);
        }
        
        return updateResult.data.updateProjectV2DraftIssue.draftIssue;
      } else if (contentType === 'Issue' || contentType === 'PullRequest') {
        // For issues and PRs, we need to use the updateIssue or updatePullRequest mutations
        // This is more complex and requires additional permissions
        throw new GitHubError(
          `Editing ${contentType} items is not supported in this version. Only DraftIssue items can be edited directly.`,
          400
        );
      } else {
        throw new GitHubError(`Cannot edit item of type ${contentType}`, 400);
      }
    } catch (error) {
      if (error instanceof GitHubError) {
        throw error;
      }
      throw new GitHubError(`Failed to update project item: ${error.message || error}`, 500);
    }
  }
}

module.exports = {
  ProjectEditService
};