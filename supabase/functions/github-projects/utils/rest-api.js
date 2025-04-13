/**
 * GitHub REST API utility module
 * 
 * This module provides functions for making requests to the GitHub REST API.
 */

/**
 * Make a request to the GitHub REST API
 * @param {string} endpoint - API endpoint (without the base URL)
 * @param {string} method - HTTP method
 * @param {object} body - Request body for POST/PUT/PATCH requests
 * @param {string} token - GitHub API token
 * @returns {Promise<object>} - API response
 */
async function callGitHubRestApi(endpoint, method = 'GET', body = null, token) {
  try {
    const url = `https://api.github.com/${endpoint}`;
    console.error(`Calling GitHub REST API: ${method} ${url}`);
    
    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'Agentics-Supabase-Edge-Function',
      'Authorization': `token ${token}`
    };
    
    // Add content-type for requests with body
    if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
      headers['Content-Type'] = 'application/json';
    }
    
    const requestOptions = {
      method,
      headers,
      ...(body ? { body: JSON.stringify(body) } : {})
    };
    
    const response = await fetch(url, requestOptions);
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }
    
    // For 204 No Content responses, return empty object
    if (response.status === 204) {
      return {};
    }
    
    return await response.json();
  } catch (error) {
    console.error('REST API error:', error);
    throw error;
  }
}

module.exports = {
  callGitHubRestApi
};