/**
 * GitHub Status Service
 * 
 * This service provides functionality for working with GitHub commit statuses
 * using the REST API since this functionality is not available in GraphQL.
 */

class GitHubStatusService {
  constructor(config) {
    this.config = config;
    this.githubToken = config.githubToken;
  }

  /**
   * Create a commit status
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {string} sha - Commit SHA
   * @param {string} state - Status state (success, error, failure, pending)
   * @param {string} description - Status description
   * @param {string} targetUrl - URL to link with this status
   * @param {string} context - Context for this status
   * @returns {Promise<object>} - Status creation result
   */
  async createCommitStatus(owner, repo, sha, state, description, targetUrl, context) {
    try {
      const url = `https://api.github.com/repos/${owner}/${repo}/statuses/${sha}`;
      console.error(`Creating commit status: POST ${url}`);
      
      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Agentics-Supabase-Edge-Function',
        'Authorization': `token ${this.githubToken}`
      };
      
      const body = {
        state,
        description,
        target_url: targetUrl,
        context
      };
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GitHub API error: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating commit status:', error);
      throw error;
    }
  }

  /**
   * Get commit statuses
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {string} sha - Commit SHA
   * @returns {Promise<Array>} - List of statuses
   */
  async getCommitStatuses(owner, repo, sha) {
    try {
      const url = `https://api.github.com/repos/${owner}/${repo}/commits/${sha}/statuses`;
      console.error(`Getting commit statuses: GET ${url}`);
      
      const headers = {
        'Accept': 'application/json',
        'User-Agent': 'Agentics-Supabase-Edge-Function',
        'Authorization': `token ${this.githubToken}`
      };
      
      const response = await fetch(url, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GitHub API error: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting commit statuses:', error);
      throw error;
    }
  }

  /**
   * Get combined status for a commit
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {string} sha - Commit SHA
   * @returns {Promise<object>} - Combined status
   */
  async getCombinedStatus(owner, repo, sha) {
    try {
      const url = `https://api.github.com/repos/${owner}/${repo}/commits/${sha}/status`;
      console.error(`Getting combined status: GET ${url}`);
      
      const headers = {
        'Accept': 'application/json',
        'User-Agent': 'Agentics-Supabase-Edge-Function',
        'Authorization': `token ${this.githubToken}`
      };
      
      const response = await fetch(url, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GitHub API error: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting combined status:', error);
      throw error;
    }
  }
}

module.exports = { GitHubStatusService };
