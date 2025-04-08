#!/usr/bin/env node

/**
 * GitHub MCP Server VS Code Configuration Script
 * 
 * This script automatically configures VS Code for GitHub MCP integration.
 * It creates the necessary configuration files and helps set up environment variables.
 * 
 * Usage:
 *   node configure-github-mcp.js [options]
 * 
 * Options:
 *   --port <port>       Specify the MCP server port (default: 3000)
 *   --host <host>       Specify the MCP server host (default: localhost)
 *   --secure            Enable HTTPS for the MCP server connection
 *   --help              Show this help message
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');
const os = require('os');

// Configuration defaults
const config = {
  port: 3000,
  host: 'localhost',
  secure: false,
  vscodeDir: '.vscode',
  envFile: '.env.mcp',
  githubToken: '',
  apiToken: '',
  testRepo: ''
};

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--port':
        config.port = parseInt(args[++i], 10);
        break;
      case '--host':
        config.host = args[++i];
        break;
      case '--secure':
        config.secure = true;
        break;
      case '--help':
        showHelp();
        process.exit(0);
        break;
    }
  }
}

// Show help message
function showHelp() {
  console.log(`
GitHub MCP Server VS Code Configuration Script

This script automatically configures VS Code for GitHub MCP integration.
It creates the necessary configuration files and helps set up environment variables.

Usage:
  node configure-github-mcp.js [options]

Options:
  --port <port>       Specify the MCP server port (default: 3000)
  --host <host>       Specify the MCP server host (default: localhost)
  --secure            Enable HTTPS for the MCP server connection
  --help              Show this help message
  `);
}

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Prompt user for input
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Create directory if it doesn't exist
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
}

// Generate a random token
function generateRandomToken(length = 32) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return token;
}

// Create MCP configuration file
function createMcpConfig() {
  const protocol = config.secure ? 'https' : 'http';
  const serverUrl = `${protocol}://${config.host}:${config.port}`;
  
  const mcpConfig = {
    version: '1.0.0',
    description: 'GitHub MCP Server configuration for VS Code',
    server: {
      url: '${env:MCP_SERVER_URL}',
      defaultUrl: serverUrl,
      apiBasePath: '/api',
      healthEndpoint: '/health',
      versionEndpoint: '/version'
    },
    authentication: {
      enabled: true,
      tokenVariable: 'API_TOKEN',
      headerName: 'X-API-Token'
    },
    github: {
      tokenVariable: 'GITHUB_TOKEN',
      repositories: []
    },
    endpoints: {
      search: '/api/search',
      content: '/api/content',
      modify: '/api/modify',
      pull: '/api/pull'
    },
    features: {
      codeSearch: true,
      fileAccess: true,
      codeModification: true,
      pullRequests: true
    },
    logging: {
      level: 'info',
      format: 'text'
    },
    performance: {
      requestTimeout: 30000,
      cacheEnabled: true,
      cacheTTL: 300
    }
  };
  
  // Add test repository if provided
  if (config.testRepo) {
    mcpConfig.github.repositories.push(config.testRepo);
  }
  
  const mcpConfigPath = path.join(config.vscodeDir, 'mcp.json');
  fs.writeFileSync(mcpConfigPath, JSON.stringify(mcpConfig, null, 2));
  console.log(`Created MCP configuration: ${mcpConfigPath}`);
}

// Create VS Code settings file
function createVSCodeSettings() {
  const protocol = config.secure ? 'https' : 'http';
  const serverUrl = `${protocol}://${config.host}:${config.port}`;
  
  const vsCodeSettings = {
    // GitHub MCP Server Integration Settings
    'github-mcp.server.url': serverUrl,
    'github-mcp.server.validateCertificates': config.secure,
    'github-mcp.auth.enabled': true,
    'github-mcp.auth.tokenFromEnv': true,
    'github-mcp.auth.tokenEnvVariable': 'API_TOKEN',
    'github-mcp.github.tokenFromEnv': true,
    'github-mcp.github.tokenEnvVariable': 'GITHUB_TOKEN',
    
    // Copilot Chat Integration
    'github.copilot.advanced': {
      'mcp.enabled': true,
      'mcp.serverUrl': serverUrl
    },
    
    // Terminal Settings for MCP Server
    'terminal.integrated.env.linux': {
      'MCP_SERVER_URL': serverUrl
    },
    'terminal.integrated.env.osx': {
      'MCP_SERVER_URL': serverUrl
    },
    'terminal.integrated.env.windows': {
      'MCP_SERVER_URL': serverUrl
    },
    
    // Editor Settings for MCP Integration
    'editor.suggest.showStatusBar': true,
    'editor.inlineSuggest.enabled': true,
    
    // Security Settings
    'security.workspace.trust.enabled': true,
    'security.workspace.trust.untrustedFiles': 'prompt',
    
    // File Associations for MCP Configuration
    'files.associations': {
      'mcp.json': 'jsonc',
      '.env.mcp': 'dotenv'
    },
    
    // Task Explorer Settings
    'taskExplorer.enableMcp': true,
    
    // Exclude MCP cache and logs from search
    'search.exclude': {
      '**/.mcp-cache': true,
      '**/mcp-logs': true
    },
    
    // Recommended Extensions for MCP
    'extensions.ignoreRecommendations': false
  };
  
  const settingsPath = path.join(config.vscodeDir, 'settings.json');
  
  // Check if settings file already exists
  if (fs.existsSync(settingsPath)) {
    console.log(`VS Code settings file already exists: ${settingsPath}`);
    console.log('Merging MCP settings with existing settings...');
    
    try {
      const existingSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      const mergedSettings = { ...existingSettings, ...vsCodeSettings };
      fs.writeFileSync(settingsPath, JSON.stringify(mergedSettings, null, 2));
      console.log('Successfully merged MCP settings with existing settings.');
    } catch (error) {
      console.error(`Error merging settings: ${error.message}`);
      console.log('Creating new settings file with MCP configuration...');
      fs.writeFileSync(settingsPath, JSON.stringify(vsCodeSettings, null, 2));
    }
  } else {
    fs.writeFileSync(settingsPath, JSON.stringify(vsCodeSettings, null, 2));
    console.log(`Created VS Code settings: ${settingsPath}`);
  }
}

// Create environment file
function createEnvFile() {
  const protocol = config.secure ? 'https' : 'http';
  const serverUrl = `${protocol}://${config.host}:${config.port}`;
  
  const envContent = `# GitHub MCP Server Environment Configuration
# Generated on: ${new Date().toISOString()}
# This file contains environment variables for the GitHub MCP server integration

# Server Configuration
MCP_SERVER_URL=${serverUrl}
MCP_PORT=${config.port}
MCP_HOST=${config.host}
ENABLE_TLS=${config.secure}

# Authentication
# IMPORTANT: Replace with your actual GitHub token
GITHUB_TOKEN=${config.githubToken}
API_TOKEN=${config.apiToken}

# Test Repository (for testing MCP functionality)
TEST_REPO=${config.testRepo}

# Additional Settings
LOG_LEVEL=info
VALIDATE_TOKENS=true
`;

  fs.writeFileSync(config.envFile, envContent);
  console.log(`Created environment file: ${config.envFile}`);
  console.log(`IMPORTANT: Edit ${config.envFile} to add your actual GitHub token if not provided during setup.`);
}

// Check if GitHub CLI is installed and get token if available
async function checkGitHubCLI() {
  try {
    const ghOutput = execSync('gh auth status', { stdio: 'pipe' }).toString();
    
    if (ghOutput.includes('Logged in to')) {
      console.log('GitHub CLI is installed and authenticated.');
      
      const useGhCli = await prompt('Would you like to use your GitHub CLI authentication for MCP? (y/n): ');
      
      if (useGhCli.toLowerCase() === 'y') {
        try {
          const token = execSync('gh auth token', { stdio: 'pipe' }).toString().trim();
          config.githubToken = token;
          console.log('Successfully retrieved GitHub token from GitHub CLI.');
        } catch (error) {
          console.error('Failed to retrieve GitHub token from GitHub CLI.');
        }
      }
    }
  } catch (error) {
    console.log('GitHub CLI not installed or not authenticated. You will need to provide a GitHub token manually.');
  }
}

// Main function
async function main() {
  console.log('GitHub MCP Server VS Code Configuration Script');
  console.log('=============================================');
  
  parseArgs();
  
  // Ensure .vscode directory exists
  ensureDirectoryExists(config.vscodeDir);
  
  // Check for GitHub CLI
  await checkGitHubCLI();
  
  // Get configuration from user if not already set
  if (!config.githubToken) {
    const token = await prompt('Enter your GitHub token (leave empty to configure later): ');
    config.githubToken = token.trim();
  }
  
  // Generate API token if not provided
  if (!config.apiToken) {
    const generateToken = await prompt('Would you like to generate a random API token? (y/n): ');
    
    if (generateToken.toLowerCase() === 'y') {
      config.apiToken = generateRandomToken();
      console.log(`Generated API token: ${config.apiToken}`);
    } else {
      const token = await prompt('Enter your API token (leave empty to configure later): ');
      config.apiToken = token.trim();
    }
  }
  
  // Get test repository
  const testRepo = await prompt('Enter a test repository (format: owner/repo, leave empty to skip): ');
  config.testRepo = testRepo.trim();
  
  // Create configuration files
  createMcpConfig();
  createVSCodeSettings();
  createEnvFile();
  
  // Provide instructions for next steps
  console.log('\nConfiguration complete!');
  console.log('\nNext steps:');
  console.log('1. Review and update the environment file if needed:');
  console.log(`   ${path.resolve(config.envFile)}`);
  console.log('2. Load the environment variables:');
  
  const isWindows = os.platform() === 'win32';
  if (isWindows) {
    console.log('   For Windows CMD: set /p %MCP_ENV%<.env.mcp');
    console.log('   For Windows PowerShell: Get-Content .env.mcp | ForEach-Object { $env:$($_.Split("=")[0])=$_.Split("=")[1] }');
    console.log('   For WSL: export $(cat .env.mcp | grep -v "^#" | xargs)');
  } else {
    console.log('   For Bash/Zsh: export $(cat .env.mcp | grep -v "^#" | xargs)');
    console.log('   For Fish: set -xg (cat .env.mcp | grep -v "^#")');
  }
  
  console.log('3. Start the GitHub MCP server:');
  console.log('   ./run-mcp-server.sh');
  console.log('4. Test the server connection:');
  console.log('   node test-github-mcp-server.js');
  console.log('5. Open VS Code in this directory to use the MCP integration with Copilot Chat');
  
  rl.close();
}

// Run the script
main().catch(error => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});