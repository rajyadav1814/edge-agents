/**
 * SSH Authentication Service
 * 
 * This service provides methods for handling SSH authentication issues
 * with GitHub repositories, especially in Codespaces environments.
 */

const { executeCommand } = require('../utils/command-executor.js');
const fs = require('fs');
const path = require('path');

class SSHAuthService {
  /**
   * Initialize the SSH Authentication Service
   * @param {Object} config - Configuration object
   */
  constructor(config) {
    this.config = config;
  }

  /**
   * Add SSH key to SSH agent
   * @returns {Promise<Object>} - Result of the operation
   */
  async addSSHKeyToAgent() {
    try {
      // Check if key exists first
      const homeDir = process.env.HOME || process.env.USERPROFILE || '/home/codespace';
      const sshDir = path.join(homeDir, '.ssh');
      const keyPath = path.join(sshDir, 'id_rsa');
      
      if (!fs.existsSync(keyPath)) {
        return {
          success: false,
          message: 'SSH key not found. Generate a key first with generateSSHKey.'
        };
      }
      
      // Add key to SSH agent
      const result = await executeCommand(`ssh-add "${keyPath}"`);
      
      return {
        success: true,
        message: 'SSH key added to agent',
        output: result
      };
    } catch (error) {
      console.error('Error adding SSH key to agent:', error);
      return {
        success: false,
        message: `Error adding SSH key: ${error.message}`,
        error: error.toString()
      };
    }
  }

  /**
   * Generate a new SSH key for GitHub authentication
   * @param {string} email - Email to associate with the key
   * @returns {Promise<Object>} - Result of the operation
   */
  async generateSSHKey(email) {
    try {
      // Ensure we have a valid home directory
      const homeDir = process.env.HOME || process.env.USERPROFILE || '/home/codespace';
      const sshDir = path.join(homeDir, '.ssh');
      
      // Create .ssh directory if it doesn't exist
      if (!fs.existsSync(sshDir)) {
        fs.mkdirSync(sshDir, { recursive: true });
      }
      
      // Generate SSH key
      const keygenCommand = `ssh-keygen -o -t rsa -C "${email}" -f "${path.join(sshDir, 'id_rsa')}" -N ""`;
      await executeCommand(keygenCommand);
      
      // Get the public key
      const publicKey = fs.readFileSync(path.join(sshDir, 'id_rsa.pub'), 'utf8');
      
      return {
        success: true,
        message: 'SSH key generated successfully',
        publicKey,
        instructions: 'Add this public key to your GitHub account settings'
      };
    } catch (error) {
      console.error('Error generating SSH key:', error);
      return {
        success: false,
        message: `Error generating SSH key: ${error.message}`,
        error: error.toString()
      };
    }
  }

  /**
   * Update package.json to use HTTPS instead of SSH for GitHub repositories
   * @param {string} packageJsonPath - Path to package.json file
   * @returns {Promise<Object>} - Result of the operation
   */
  async updatePackageJsonRepos(packageJsonPath) {
    try {
      if (!fs.existsSync(packageJsonPath)) {
        return {
          success: false,
          message: `package.json not found at ${packageJsonPath}`
        };
      }
      
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      let changes = 0;
      
      // Convert SSH URLs to HTTPS URLs in dependencies
      if (packageJson.dependencies) {
        Object.keys(packageJson.dependencies).forEach(pkg => {
          const dep = packageJson.dependencies[pkg];
          if (typeof dep === 'string' && dep.includes('git+ssh://git@github.com')) {
            // Convert from ssh format to https format
            packageJson.dependencies[pkg] = dep.replace(
              'git+ssh://git@github.com/',
              'https://github.com/'
            );
            changes++;
          }
        });
      }
      
      // Also check devDependencies
      if (packageJson.devDependencies) {
        Object.keys(packageJson.devDependencies).forEach(pkg => {
          const dep = packageJson.devDependencies[pkg];
          if (typeof dep === 'string' && dep.includes('git+ssh://git@github.com')) {
            packageJson.devDependencies[pkg] = dep.replace(
              'git+ssh://git@github.com/',
              'https://github.com/'
            );
            changes++;
          }
        });
      }
      
      if (changes > 0) {
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
        return {
          success: true,
          message: `Updated ${changes} GitHub repository URLs to use HTTPS instead of SSH`,
          changes
        };
      } else {
        return {
          success: true,
          message: 'No SSH URLs found in package.json',
          changes: 0
        };
      }
    } catch (error) {
      console.error('Error updating package.json:', error);
      return {
        success: false,
        message: `Error updating package.json: ${error.message}`,
        error: error.toString()
      };
    }
  }

  /**
   * Test SSH connection to GitHub
   * @returns {Promise<Object>} - Result of the operation
   */
  async testGitHubConnection() {
    try {
      const result = await executeCommand('ssh -T git@github.com');
      
      // SSH command may exit with non-zero code even when authentication works
      const success = result.includes('successfully authenticated');
      
      return {
        success,
        message: success ? 'Successfully authenticated with GitHub' : 'Failed to authenticate with GitHub',
        output: result
      };
    } catch (error) {
      // Check if the error output contains successful authentication message
      if (error.stdout && error.stdout.includes('successfully authenticated')) {
        return {
          success: true,
          message: 'Successfully authenticated with GitHub (with expected error code)',
          output: error.stdout
        };
      }
      
      console.error('Error testing GitHub connection:', error);
      return {
        success: false,
        message: `Error testing GitHub connection: ${error.message}`,
        error: error.toString()
      };
    }
  }

  /**
   * Configure GitHub Codespaces for GitHub authentication
   * @returns {Promise<Object>} - Result of the operation
   */
  async setupCodespacesAuth() {
    try {
      // Set HOME environment variable if not set
      const homeDir = process.env.HOME || process.env.USERPROFILE || '/home/codespace';
      process.env.HOME = homeDir;
      
      // Configure Git to use GitHub CLI authentication
      await executeCommand('git config --global credential.helper "github"');
      
      return {
        success: true,
        message: 'Configured Codespaces for GitHub authentication',
        instructions: 'Now you can use HTTPS URLs for GitHub repositories'
      };
    } catch (error) {
      console.error('Error configuring Codespaces auth:', error);
      return {
        success: false,
        message: `Error configuring Codespaces auth: ${error.message}`,
        error: error.toString()
      };
    }
  }
}

module.exports = { SSHAuthService };
