/**
 * Configuration module for the Mastra AI agent
 * 
 * This module centralizes all configuration settings and environment variable access.
 * It provides default values for all settings and loads values from environment variables when available.
 */

/**
 * Agent configuration settings
 */
export const agentConfig = {
  /**
   * Name of the Mastra AI agent
   */
  name: Deno.env.get("AGENT_NAME") || "MastraAgent",
  
  /**
   * Instructions for the Mastra AI agent's behavior
   */
  instructions: Deno.env.get("AGENT_INSTRUCTIONS") || 
    "You are a helpful assistant that provides information and assistance.",
};

/**
 * Authentication configuration settings
 */
export const authConfig = {
  /**
   * Authentication token for API access
   */
  token: Deno.env.get("AUTH_TOKEN"),
  
  /**
   * Validates if the authentication token is properly configured
   * @returns True if the token is configured, false otherwise
   */
  isConfigured(): boolean {
    return !!this.token;
  }
};

/**
 * API keys for external services
 */
interface ApiKeys {
  weatherApiKey: string | undefined | null;
  isConfigured(key: keyof Omit<ApiKeys, 'isConfigured'>): boolean;
}

export const apiKeys: ApiKeys = {
  /**
   * Weather API key for weather service integration
   */
  weatherApiKey: Deno.env.get("WEATHER_API_KEY") || null,
  
  /**
   * Validates if a specific API key is properly configured
   * @param key The name of the API key to check
   * @returns True if the key is configured, false otherwise
   */
  isConfigured(key: keyof Omit<ApiKeys, 'isConfigured'>): boolean {
    return !!(this[key]);
  }
};

/**
 * Supabase configuration settings
 */
export const supabaseConfig = {
  /**
   * Supabase project URL
   */
  url: Deno.env.get("SUPABASE_URL"),
  
  /**
   * Supabase anonymous key for public API access
   */
  anonKey: Deno.env.get("SUPABASE_ANON_KEY"),
  
  /**
   * Validates if Supabase is properly configured
   * @returns True if Supabase is configured, false otherwise
   */
  isConfigured(): boolean {
    return !!(this.url && this.anonKey);
  }
};

/**
 * Logging configuration settings
 */
export const loggingConfig = {
  /**
   * Log level (debug, info, warn, error)
   */
  level: Deno.env.get("LOG_LEVEL") || "info",
};

/**
 * Combined configuration object
 */
export const config = {
  agent: agentConfig,
  auth: authConfig,
  api: apiKeys,
  supabase: supabaseConfig,
  logging: loggingConfig,
};

export default config;