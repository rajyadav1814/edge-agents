// Configuration for the Edge Deployment function
// This file contains environment variables and configuration settings

/**
 * Configuration interface for Supabase Edge Functions
 */
export interface SupabaseConfig {
  projectId: string;
  url: string;
  serviceRoleKey: string;
  apiBaseUrl: string;
}

/**
 * Load configuration from environment variables
 * @returns SupabaseConfig object with all required configuration
 */
export function loadConfig(): SupabaseConfig {
  // Get environment variables
  const projectId = Deno.env.get("VITE_SUPABASE_PROJECT_ID") || "";
  const url = Deno.env.get("SUPABASE_URL") || "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_KEY") || "";
  
  // Validate required environment variables
  if (!projectId) {
    throw new Error("VITE_SUPABASE_PROJECT_ID environment variable is required");
  }
  
  if (!url) {
    throw new Error("SUPABASE_URL environment variable is required");
  }
  
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_KEY environment variable is required");
  }
  
  // Construct the API base URL
  const apiBaseUrl = `https://api.supabase.com/v1/projects/${projectId}`;
  
  return {
    projectId,
    url,
    serviceRoleKey,
    apiBaseUrl,
  };
}

/**
 * Get the configuration for the current environment
 */
export const config = loadConfig();
