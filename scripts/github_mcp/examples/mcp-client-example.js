/**
 * GitHub MCP Server - Client Example
 * 
 * This example demonstrates how to interact with the GitHub MCP server
 * using a simple JavaScript client.
 */

// Import required modules
const fetch = require('node-fetch');

// Configuration
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:3000';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// Validate configuration
if (!GITHUB_TOKEN) {
  console.warn('Warning: GITHUB_TOKEN environment variable is not set.');
  console.warn('Some operations may fail without proper authentication.');
}

/**
 * Send a request to the MCP server
 * @param {string} endpoint - The API endpoint
 * @param {Object} data - The request payload
 * @returns {Promise<Object>} - The response data
 */
async function mcpRequest(endpoint, data = {}) {
  const url = `${MCP_SERVER_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': GITHUB_TOKEN ? `Bearer ${GITHUB_TOKEN}` : '',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error calling MCP endpoint ${endpoint}:`, error.message);
    throw error;
  }
}

/**
 * Example: Search for code in a repository
 */
async function searchCode() {
  console.log('Searching for code...');
  
  try {
    const result = await mcpRequest('/search', {
      query: 'function',
      repo: 'owner/repo',
      path: 'src',
      language: 'javascript',
    });
    
    console.log('Search results:', result);
    return result;
  } catch (error) {
    console.error('Search failed:', error);
  }
}

/**
 * Example: Get file content from a repository
 */
async function getFileContent() {
  console.log('Getting file content...');
  
  try {
    const result = await mcpRequest('/content', {
      repo: 'owner/repo',
      path: 'src/index.js',
    });
    
    console.log('File content:', result.content);
    return result;
  } catch (error) {
    console.error('Failed to get file content:', error);
  }
}

/**
 * Run the examples
 */
async function runExamples() {
  console.log(`Connecting to MCP server at ${MCP_SERVER_URL}`);
  
  // Check server health
  try {
    const healthResponse = await fetch(`${MCP_SERVER_URL}/health`);
    if (healthResponse.ok) {
      console.log('Server is healthy!');
    } else {
      console.error('Server health check failed:', await healthResponse.text());
      return;
    }
  } catch (error) {
    console.error('Failed to connect to MCP server:', error.message);
    return;
  }
  
  // Run the examples
  await searchCode();
  await getFileContent();
  
  console.log('Examples completed!');
}

// Run the examples if this file is executed directly
if (require.main === module) {
  runExamples().catch(error => {
    console.error('Example execution failed:', error);
    process.exit(1);
  });
}

// Export functions for use in other modules
module.exports = {
  mcpRequest,
  searchCode,
  getFileContent,
};