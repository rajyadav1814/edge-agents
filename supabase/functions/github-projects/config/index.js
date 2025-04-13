/**
 * Configuration module for GitHub Projects MCP server
 * 
 * This module centralizes all configuration settings and provides
 * validation for required environment variables.
 */

// Load environment variables
const githubToken = process.env.GITHUB_TOKEN || process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
const githubOrg = process.env.GITHUB_ORG || 'agenticsorg';
const githubApiVersion = process.env.GITHUB_API_VERSION || 'v3';
const cacheTtl = parseInt(process.env.CACHE_TTL || '300');

/**
 * Validate required configuration
 */
function validateConfig() {
  if (!githubToken) {
    console.error('GitHub token is required. Set GITHUB_TOKEN or GITHUB_PERSONAL_ACCESS_TOKEN environment variable.');
    process.exit(1);
  }
}

/**
 * Configuration object
 */
const config = {
  githubToken,
  githubOrg,
  githubApiVersion,
  cacheTtl
};

module.exports = {
  config,
  validateConfig
};