import { config } from './config.ts';

/**
 * Interface for Edge Function
 */
export interface EdgeFunction {
  version: number;
  created_at: number;
  updated_at: number;
  id: string;
  slug: string;
  name: string;
  status: string;
  verify_jwt: boolean;
  import_map: boolean;
  entrypoint_path?: string;
  import_map_path?: string;
}

/**
 * API Client for Supabase Edge Functions
 */
export class SupabaseEdgeFunctionClient {
  private apiBaseUrl: string;
  private serviceRoleKey: string;
  
  constructor() {
    this.apiBaseUrl = config.apiBaseUrl;
    this.serviceRoleKey = config.serviceRoleKey;
  }
  
  /**
   * Get headers for API requests
   */
  private getHeaders(): HeadersInit {
    return {
      'Authorization': `Bearer ${this.serviceRoleKey}`,
      'Content-Type': 'application/json',
    };
  }
  
  /**
   * List all Edge Functions
   * @returns Array of Edge Functions
   */
  async listFunctions(): Promise<EdgeFunction[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/functions`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to list functions: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error listing functions:', error);
      throw error;
    }
  }
  
  /**
   * Get a specific Edge Function by slug
   * @param slug Function slug
   * @returns Edge Function details
   */
  async getFunction(slug: string): Promise<EdgeFunction> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/functions/${slug}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get function: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error getting function ${slug}:`, error);
      throw error;
    }
  }
  
  /**
   * Get the body of a specific Edge Function
   * @param slug Function slug
   * @returns Function body as string
   */
  async getFunctionBody(slug: string): Promise<string> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/functions/${slug}/body`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get function body: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      return await response.text();
    } catch (error) {
      console.error(`Error getting function body for ${slug}:`, error);
      throw error;
    }
  }
  
  /**
   * Create a new Edge Function
   * @param slug Function slug
   * @param name Function name
   * @param body Function body
   * @param verifyJwt Whether to verify JWT
   * @returns Created Edge Function
   */
  async createFunction(
    slug: string,
    name: string,
    body: string,
    verifyJwt: boolean = false
  ): Promise<EdgeFunction> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/functions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          slug,
          name,
          body,
          verify_jwt: verifyJwt,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create function: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error creating function ${slug}:`, error);
      throw error;
    }
  }
  
  /**
   * Update an existing Edge Function
   * @param slug Function slug
   * @param updates Updates to apply
   * @returns Updated Edge Function
   */
  async updateFunction(
    slug: string,
    updates: {
      name?: string;
      body?: string;
      verify_jwt?: boolean;
    }
  ): Promise<EdgeFunction> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/functions/${slug}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update function: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error updating function ${slug}:`, error);
      throw error;
    }
  }
  
  /**
   * Delete an Edge Function
   * @param slug Function slug
   * @returns Success status
   */
  async deleteFunction(slug: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/functions/${slug}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete function: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      return true;
    } catch (error) {
      console.error(`Error deleting function ${slug}:`, error);
      throw error;
    }
  }
}

// Export a singleton instance
export const apiClient = new SupabaseEdgeFunctionClient();
