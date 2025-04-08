/**
 * Project Delete Service
 * 
 * Service for deleting GitHub Projects and Project Items
 */

import { executeGraphQLQuery } from '../utils/graphql-client.ts';
import { DELETE_PROJECT_MUTATION, DELETE_PROJECT_ITEM_MUTATION } from './graphql/mutations.ts';
import { GitHubError } from '../utils/error-handler.ts';

/**
 * Service for deleting GitHub Projects and Project Items
 */
export class ProjectDeleteService {
  private config: any;

  /**
   * Create a new ProjectDeleteService
   * @param config Configuration object with GitHub token
   */
  constructor(config: any) {
    this.config = config;
  }

  /**
   * Delete a GitHub Project
   * @param projectId Project ID
   * @returns Success status
   */
  async deleteProject(projectId: string): Promise<{ success: boolean; projectId: string }> {
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
          `GraphQL Error: ${response.errors.map((e: any) => e.message).join(', ')}`,
          500
        );
      }
      
      return { success: true, projectId };
    } catch (error: any) {
      if (error instanceof GitHubError) {
        throw error;
      }
      throw new GitHubError(`Failed to delete project: ${error.message || error}`, 500);
    }
  }
  
  /**
   * Delete a GitHub Project item
   * @param itemId Item ID
   * @param projectId Project ID
   * @returns Success status
   */
  async deleteProjectItem(itemId: string, projectId: string): Promise<{ success: boolean; itemId: string }> {
    if (!itemId) {
      throw new GitHubError('Item ID is required', 400);
    }
    
    if (!projectId) {
      throw new GitHubError('Project ID is required', 400);
    }
    
    try {
      const response = await executeGraphQLQuery(
        DELETE_PROJECT_ITEM_MUTATION,
        { itemId, projectId },
        this.config.githubToken
      );
      
      if (response.errors && response.errors.length > 0) {
        throw new GitHubError(
          `GraphQL Error: ${response.errors.map((e: any) => e.message).join(', ')}`,
          500
        );
      }
      
      return { success: true, itemId };
    } catch (error: any) {
      if (error instanceof GitHubError) {
        throw error;
      }
      throw new GitHubError(`Failed to delete project item: ${error.message || error}`, 500);
    }
  }
}