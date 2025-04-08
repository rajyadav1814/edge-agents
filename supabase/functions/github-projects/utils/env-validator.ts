/**
 * Environment validation module
 * Validates and provides access to environment variables
 */

export interface EnvConfig {
  githubToken: string;
  githubOrg: string;
  githubApiVersion: string;
  webhookSecret?: string;
  cacheTtl: number;
}

/**
 * Validates environment variables and returns a configuration object
 * @throws Error if required environment variables are missing or invalid
 * @returns Environment configuration object
 */
export function validateEnv(): EnvConfig {
  // Check for either GITHUB_TOKEN or GITHUB_PERSONAL_ACCESS_TOKEN
  let githubToken = Deno.env.get('GITHUB_TOKEN');
  if (!githubToken) {
    githubToken = Deno.env.get('GITHUB_PERSONAL_ACCESS_TOKEN');
  }
  
  if (!githubToken) {
    throw new Error('Either GITHUB_TOKEN or GITHUB_PERSONAL_ACCESS_TOKEN environment variable is required');
  }

  const githubOrg = Deno.env.get('GITHUB_ORG');
  if (!githubOrg) {
    throw new Error('GITHUB_ORG environment variable is required');
  }

  const githubApiVersion = Deno.env.get('GITHUB_API_VERSION') || 'v3';
  const webhookSecret = Deno.env.get('GITHUB_WEBHOOK_SECRET');
  
  const cacheTtlStr = Deno.env.get('CACHE_TTL') || '300';
  const cacheTtl = parseInt(cacheTtlStr);
  
  if (isNaN(cacheTtl)) {
    throw new Error('CACHE_TTL must be a valid number');
  }

  return {
    githubToken,
    githubOrg,
    githubApiVersion,
    webhookSecret,
    cacheTtl
  };
}

/**
 * Logs environment configuration status
 * @param config Environment configuration
 */
export function logEnvStatus(config: EnvConfig): void {
  console.log('GitHub API Integration Environment:');
  console.log(`- GitHub Organization: ${config.githubOrg}`);
  console.log(`- GitHub API Version: ${config.githubApiVersion}`);
  console.log(`- GitHub Token: ${config.githubToken ? '[Set]' : '[Missing]'}`);
  console.log(`- Webhook Secret: ${config.webhookSecret ? '[Set]' : '[Not Set]'}`);
  console.log(`- Cache TTL: ${config.cacheTtl} seconds`);
}