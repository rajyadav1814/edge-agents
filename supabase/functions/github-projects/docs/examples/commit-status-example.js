/**
 * GitHub Commit Status Example
 * 
 * This example demonstrates how to use the GitHub Status Service to create and retrieve commit statuses.
 * Note: Commit statuses are only available through the REST API, not GraphQL.
 */

// Import the GitHub Status Service
const { GitHubStatusService } = require('../../services/github-status-service.js');

// Configuration
const config = {
  githubToken: process.env.GITHUB_TOKEN || process.env.GITHUB_PERSONAL_ACCESS_TOKEN
};

// Initialize the service
const githubStatusService = new GitHubStatusService(config);

/**
 * Create a commit status
 */
async function createCommitStatus() {
  try {
    // Replace these values with your actual repository and commit details
    const owner = 'agenticsorg';
    const repo = 'edge-agents';
    const sha = '7638417db6d59f3c431d3e1f261cc637155684cd'; // Replace with an actual commit SHA
    
    const result = await githubStatusService.createCommitStatus(
      owner,
      repo,
      sha,
      'success', // State: success, error, failure, pending
      'Build succeeded!', // Description
      'https://example.com/build/status', // Target URL
      'continuous-integration/example' // Context
    );
    
    console.log('Commit status created:', result);
    return result;
  } catch (error) {
    console.error('Error creating commit status:', error.message);
    throw error;
  }
}

/**
 * Get commit statuses
 */
async function getCommitStatuses() {
  try {
    // Replace these values with your actual repository and commit details
    const owner = 'agenticsorg';
    const repo = 'edge-agents';
    const sha = '7638417db6d59f3c431d3e1f261cc637155684cd'; // Replace with an actual commit SHA
    
    const statuses = await githubStatusService.getCommitStatuses(owner, repo, sha);
    
    console.log('Commit statuses:', statuses);
    return statuses;
  } catch (error) {
    console.error('Error getting commit statuses:', error.message);
    throw error;
  }
}

/**
 * Get combined status
 */
async function getCombinedStatus() {
  try {
    // Replace these values with your actual repository and commit details
    const owner = 'agenticsorg';
    const repo = 'edge-agents';
    const sha = '7638417db6d59f3c431d3e1f261cc637155684cd'; // Replace with an actual commit SHA
    
    const status = await githubStatusService.getCombinedStatus(owner, repo, sha);
    
    console.log('Combined status:', status);
    return status;
  } catch (error) {
    console.error('Error getting combined status:', error.message);
    throw error;
  }
}

/**
 * Run the examples
 */
async function runExamples() {
  try {
    console.log('Creating commit status...');
    await createCommitStatus();
    
    console.log('\nGetting commit statuses...');
    await getCommitStatuses();
    
    console.log('\nGetting combined status...');
    await getCombinedStatus();
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Check if this file is being run directly
if (require.main === module) {
  // Make sure GitHub token is set
  if (!config.githubToken) {
    console.error('GitHub token is required. Set GITHUB_TOKEN or GITHUB_PERSONAL_ACCESS_TOKEN environment variable.');
    process.exit(1);
  }
  
  // Run the examples
  runExamples();
}

// Export the functions for use in other modules
module.exports = {
  createCommitStatus,
  getCommitStatuses,
  getCombinedStatus
};
