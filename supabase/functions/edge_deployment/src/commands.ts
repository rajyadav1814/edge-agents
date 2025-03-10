import { apiClient, EdgeFunction } from './api-client.ts';

/**
 * Command result interface
 */
export interface CommandResult {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * List all Edge Functions
 * @returns CommandResult with list of functions
 */
export async function listFunctions(): Promise<CommandResult> {
  try {
    const functions = await apiClient.listFunctions();
    
    return {
      success: true,
      message: `Found ${functions.length} Edge Functions`,
      data: functions,
    };
  } catch (error) {
    return {
      success: false,
      message: `Error listing functions: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Get details of a specific Edge Function
 * @param slug Function slug
 * @returns CommandResult with function details
 */
export async function getFunctionDetails(slug: string): Promise<CommandResult> {
  try {
    const func = await apiClient.getFunction(slug);
    
    return {
      success: true,
      message: `Retrieved details for function: ${slug}`,
      data: func,
    };
  } catch (error) {
    return {
      success: false,
      message: `Error getting function details: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Get the body of a specific Edge Function
 * @param slug Function slug
 * @returns CommandResult with function body
 */
export async function getFunctionBody(slug: string): Promise<CommandResult> {
  try {
    const body = await apiClient.getFunctionBody(slug);
    
    return {
      success: true,
      message: `Retrieved body for function: ${slug}`,
      data: body,
    };
  } catch (error) {
    return {
      success: false,
      message: `Error getting function body: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Create a new Edge Function
 * @param slug Function slug
 * @param name Function name
 * @param body Function body
 * @param verifyJwt Whether to verify JWT
 * @returns CommandResult with created function
 */
export async function createFunction(
  slug: string,
  name: string,
  body: string,
  verifyJwt: boolean = false
): Promise<CommandResult> {
  try {
    const func = await apiClient.createFunction(slug, name, body, verifyJwt);
    
    return {
      success: true,
      message: `Created function: ${slug}`,
      data: func,
    };
  } catch (error) {
    return {
      success: false,
      message: `Error creating function: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Update an existing Edge Function
 * @param slug Function slug
 * @param updates Updates to apply
 * @returns CommandResult with updated function
 */
export async function updateFunction(
  slug: string,
  updates: {
    name?: string;
    body?: string;
    verify_jwt?: boolean;
  }
): Promise<CommandResult> {
  try {
    const func = await apiClient.updateFunction(slug, updates);
    
    return {
      success: true,
      message: `Updated function: ${slug}`,
      data: func,
    };
  } catch (error) {
    return {
      success: false,
      message: `Error updating function: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Delete an Edge Function
 * @param slug Function slug
 * @returns CommandResult with success status
 */
export async function deleteFunction(slug: string): Promise<CommandResult> {
  try {
    const success = await apiClient.deleteFunction(slug);
    
    return {
      success,
      message: success ? `Deleted function: ${slug}` : `Failed to delete function: ${slug}`,
    };
  } catch (error) {
    return {
      success: false,
      message: `Error deleting function: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Format Edge Function for display
 * @param func Edge Function to format
 * @returns Formatted string
 */
export function formatFunction(func: EdgeFunction): string {
  return `
Function: ${func.name} (${func.slug})
  ID: ${func.id}
  Status: ${func.status}
  Version: ${func.version}
  Verify JWT: ${func.verify_jwt ? 'Yes' : 'No'}
  Import Map: ${func.import_map ? 'Yes' : 'No'}
  Created: ${new Date(func.created_at).toLocaleString()}
  Updated: ${new Date(func.updated_at).toLocaleString()}
  ${func.entrypoint_path ? `Entrypoint: ${func.entrypoint_path}` : ''}
  ${func.import_map_path ? `Import Map: ${func.import_map_path}` : ''}
`;
}
