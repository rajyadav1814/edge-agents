/**
 * Service Manager module for GitHub Projects MCP server
 * 
 * This module initializes and provides access to all service instances.
 */

const { ProjectEditService } = require('./project-edit-service.js');
const { ProjectDeleteService } = require('./project-delete-service.js');
const { GitHubProjectService } = require('./github-project-service.js');
const { GitHubIssueService } = require('./github-issue-service.js');
const { SSHAuthService } = require('./ssh-auth-service.js');

/**
 * Initialize all services with the provided configuration
 * @param {Object} config - Configuration object
 * @returns {Object} Object containing all service instances
 */
function initializeServices(config) {
  const services = {
    projectEditService: new ProjectEditService(config),
    projectDeleteService: new ProjectDeleteService(config),
    githubProjectService: new GitHubProjectService(config),
    githubIssueService: new GitHubIssueService(config),
    sshAuthService: new SSHAuthService(config)
  };
  
  return services;
}

module.exports = {
  initializeServices
};