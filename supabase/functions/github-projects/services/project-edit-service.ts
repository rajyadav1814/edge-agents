/**
 * Project Edit Service
 * 
 * Service for editing GitHub Projects and Project Items
 */

import { executeGraphQLQuery } from '../utils/graphql-client.ts';
import { UPDATE_PROJECT_MUTATION, UPDATE_PROJECT_ITEM_MUTATION } from './graphql/mutations.ts';
import { GitHubError } from '../utils/error-handler.ts';

/**
 * Service for editing GitHub Projects and Project Items
 */
export class ProjectEditService {
  private config: any;

  /**
   * Create a new ProjectEditService
   * @param config Configuration object with GitHub token
   */
  constructor(config: any) {
    this.config = config;
  }

  /**
   * Edit a GitHub Project
   * @param projectId Project ID
   * @param updates Project updates (title, description, public)
   * @returns Updated project
   */
  async editProject(projectId: string, updates: {
    title?: string;
    description?: string;
    public?: boolean;
  }): Promise<any> {
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
          `GraphQL Error: ${response.errors.map((e: any) => e.message).join(', ')}`,
          500
        );
      }
      
      if (!response.data?.updateProjectV2?.projectV2) {
        throw new GitHubError('Failed to update project', 500);
      }
      
      return response.data.updateProjectV2.projectV2;
    } catch (error: any) {
      if (error instanceof GitHubError) {
        throw error;
      }
      throw new GitHubError(`Failed to update project: ${error.message || error}`, 500);
    }
  }
  
  /**
   * Edit a GitHub Project item
   * @param itemId Item ID
   * @param updates Item updates (title, body)
   * @returns Updated item
   */
  async editProjectItem(itemId: string, updates: {
    title?: string;
    body?: string;
  }): Promise<any> {
    if (!itemId) {
      throw new GitHubError('Item ID is required', 400);
    }
    
    if (!updates || Object.keys(updates).length === 0) {
      throw new GitHubError('At least one update field is required', 400);
    }
    
    try {
      const response = await executeGraphQLQuery(
        UPDATE_PROJECT_ITEM_MUTATION,
        {
          itemId,
          title: updates.title,
          body: updates.body
        },
        this.config.githubToken
      );
      
      if (response.errors && response.errors.length > 0) {
        throw new GitHubError(
          `GraphQL Error: ${response.errors.map((e: any) => e.message).join(', ')}`,
          500
        );
      }
      
      if (!response.data?.updateProjectV2DraftIssue?.draftIssue) {
        throw new GitHubError('Failed to update project item', 500);
      }
      
      return response.data.updateProjectV2DraftIssue.draftIssue;
    } catch (error: any) {
      if (error instanceof GitHubError) {
        throw error;
      }
      throw new GitHubError(`Failed to update project item: ${error.message || error}`, 500);
    }
  }
}