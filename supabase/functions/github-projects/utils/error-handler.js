/**
 * Error handling module for GitHub API integration
 * Provides standardized error handling and response formatting
 */

/**
 * Custom error class for GitHub API errors
 */
class GitHubError extends Error {
  /**
   * Create a new GitHubError
   * @param {string} message Error message
   * @param {number} status HTTP status code
   * @param {any} details Additional error details
   */
  constructor(message, status = 500, details) {
    super(message);
    this.name = 'GitHubError';
    this.status = status;
    this.details = details;
  }
}

/**
 * Handles rate limit errors from GitHub API
 * @param {Headers} headers Response headers from GitHub API
 * @throws {GitHubError} with rate limit information
 */
function handleRateLimitError(headers) {
  const rateLimit = {
    limit: parseInt(headers.get("X-RateLimit-Limit") || "0"),
    remaining: parseInt(headers.get("X-RateLimit-Remaining") || "0"),
    reset: parseInt(headers.get("X-RateLimit-Reset") || "0")
  };

  const resetDate = new Date(rateLimit.reset * 1000);
  throw new GitHubError(
    `GitHub API rate limit exceeded`,
    403,
    { rateLimit }
  );
}

/**
 * Creates a standardized error response
 * @param {any} error Error object
 * @returns {Response} Response object with error details
 */
function createErrorResponse(error) {
  console.error('GitHub API Error:', error);
  
  let status = 500;
  let message = 'Internal server error';
  let details = undefined;

  if (error instanceof GitHubError) {
    status = error.status;
    message = error.message;
    details = error.details;
  } else if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  }

  return new Response(
    JSON.stringify({
      error: message,
      details: details,
      timestamp: new Date().toISOString()
    }),
    {
      status,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Extracts error information from GitHub API response
 * @param {Response} response GitHub API response
 * @param {any} data Response data
 * @returns {GitHubError} with appropriate status and message
 */
async function extractGitHubError(response, data) {
  // Handle rate limiting
  if (response.status === 403 && parseInt(response.headers.get("X-RateLimit-Remaining") || "1") === 0) {
    return handleRateLimitError(response.headers);
  }

  // Parse response data if not provided
  if (!data) {
    try {
      data = await response.json();
    } catch (e) {
      // If we can't parse JSON, use the status text
      return new GitHubError(
        `GitHub API error: ${response.statusText || "Internal Server Error"}`,
        response.status
      );
    }
  }

  // Extract error message from GitHub API response
  const message = data.message || data.error || response.statusText || 'Unknown error';
  return new GitHubError(
    `GitHub API error: ${message}`,
    response.status,
    data.errors || data.documentation_url ? { 
      errors: data.errors,
      documentation: data.documentation_url
    } : undefined
  );
}

module.exports = {
  GitHubError,
  handleRateLimitError,
  createErrorResponse,
  extractGitHubError
};