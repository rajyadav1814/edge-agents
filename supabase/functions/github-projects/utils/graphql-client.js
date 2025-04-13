/**
 * GraphQL Client for GitHub API
 * 
 * This module provides a function to execute GraphQL queries against the GitHub API.
 */

/**
 * Execute a GraphQL query against the GitHub API
 * @param {string} query GraphQL query string
 * @param {object} variables Query variables
 * @param {string} token GitHub API token
 * @returns {Promise<object>} Query result
 */
async function executeGraphQLQuery(query, variables, token) {
  try {
    console.error(`Executing GraphQL query with variables: ${JSON.stringify(variables)}`);
    
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Agentics-Supabase-Edge-Function',
        'Authorization': `token ${token}`,
        'X-Github-Next-Global-ID': '1' // Required for Projects V2 API
      },
      body: JSON.stringify({ query, variables })
    });

    // Handle rate limiting
    if (response.status === 403 && parseInt(response.headers.get("X-RateLimit-Remaining") || "1") === 0) {
      const rateLimit = {
        limit: parseInt(response.headers.get("X-RateLimit-Limit") || "0"),
        remaining: parseInt(response.headers.get("X-RateLimit-Remaining") || "0"),
        reset: parseInt(response.headers.get("X-RateLimit-Reset") || "0")
      };
      
      throw new Error(`GitHub API rate limit exceeded. Resets at ${new Date(rateLimit.reset * 1000).toISOString()}`);
    }

    if (!response.ok) {
      throw new Error(`Failed to execute GraphQL query: ${response.statusText}`);
    }

    const result = await response.json();

    // Check for GraphQL errors (these come with a 200 status code)
    if (result.errors && result.errors.length > 0) {
      const errorMessages = result.errors.map(err => {
        // Log detailed error information
        console.error('GraphQL error details:', JSON.stringify(err, null, 2));
        return err.message;
      }).join('; ');
      
      throw new Error(`GraphQL errors: ${errorMessages}`);
    }

    return result;
  } catch (error) {
    console.error('GraphQL query error:', error);
    throw error;
  }
}

module.exports = {
  executeGraphQLQuery
};