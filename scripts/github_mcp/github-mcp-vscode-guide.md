# GitHub MCP Server Integration with VS Code

This guide provides instructions for integrating the GitHub MCP (Model Control Panel) server with Visual Studio Code and Copilot Chat.

## Table of Contents

1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Configuration](#configuration)
   - [Automatic Configuration](#automatic-configuration)
   - [Manual Configuration](#manual-configuration)
5. [Using with Copilot Chat](#using-with-copilot-chat)
6. [Troubleshooting](#troubleshooting)
7. [Security Best Practices](#security-best-practices)
8. [Advanced Configuration](#advanced-configuration)

## Introduction

The GitHub MCP server provides a standardized interface for AI models to interact with GitHub repositories. By integrating it with VS Code and Copilot Chat, you can enable AI assistants to:

- Search code within your repositories
- Access and read file contents
- Create and modify files
- Open and manage pull requests
- Access GitHub issues and discussions

This integration enhances your development workflow by allowing AI assistants to have direct, controlled access to your code repositories.

## Prerequisites

Before setting up the GitHub MCP server integration with VS Code, ensure you have:

- **Visual Studio Code**: Latest stable version
- **GitHub Copilot Extension**: Installed and configured in VS Code
- **GitHub MCP Server**: Installed and running (see [GitHub MCP Server Documentation](github-mcp-server-guide.md))
- **GitHub Personal Access Token**: With appropriate permissions (repo, read:user, read:org)
- **Node.js**: Version 14 or higher (for running the configuration script)

## Installation

### 1. Install Required VS Code Extensions

Install the following VS Code extensions:

- GitHub Copilot
- GitHub Copilot Chat
- (Optional) GitHub Pull Requests and Issues

You can install these extensions from the VS Code marketplace or by running:

```bash
code --install-extension GitHub.copilot
code --install-extension GitHub.copilot-chat
code --install-extension GitHub.vscode-pull-request-github
```

### 2. Set Up GitHub MCP Server

Follow the instructions in the [GitHub MCP Server Documentation](github-mcp-server-guide.md) to install and run the GitHub MCP server.

### 3. Configure VS Code for MCP Integration

You can configure VS Code for MCP integration either automatically using the provided script or manually.

## Configuration

### Automatic Configuration

The easiest way to configure VS Code for GitHub MCP integration is to use the provided configuration script:

1. Make the script executable:

```bash
chmod +x configure-github-mcp.js
```

2. Run the configuration script:

```bash
node configure-github-mcp.js
```

3. Follow the prompts to configure the integration:
   - Enter your GitHub token (or use GitHub CLI authentication if available)
   - Choose to generate a random API token or enter your own
   - Specify a test repository (optional)

4. The script will create:
   - `.vscode/mcp.json`: MCP server configuration
   - `.vscode/settings.json`: VS Code settings for MCP integration
   - `.env.mcp`: Environment variables for MCP server

5. Load the environment variables as instructed by the script.

### Manual Configuration

If you prefer to configure the integration manually, follow these steps:

1. Create a `.vscode` directory in your project root (if it doesn't exist):

```bash
mkdir -p .vscode
```

2. Create a `.vscode/mcp.json` file with the following content:

```json
{
  "version": "1.0.0",
  "description": "GitHub MCP Server configuration for VS Code",
  "server": {
    "url": "${env:MCP_SERVER_URL}",
    "defaultUrl": "http://localhost:3000",
    "apiBasePath": "/api",
    "healthEndpoint": "/health",
    "versionEndpoint": "/version"
  },
  "authentication": {
    "enabled": true,
    "tokenVariable": "API_TOKEN",
    "headerName": "X-API-Token"
  },
  "github": {
    "tokenVariable": "GITHUB_TOKEN",
    "repositories": []
  },
  "endpoints": {
    "search": "/api/search",
    "content": "/api/content",
    "modify": "/api/modify",
    "pull": "/api/pull"
  },
  "features": {
    "codeSearch": true,
    "fileAccess": true,
    "codeModification": true,
    "pullRequests": true
  },
  "logging": {
    "level": "info",
    "format": "text"
  },
  "performance": {
    "requestTimeout": 30000,
    "cacheEnabled": true,
    "cacheTTL": 300
  }
}
```

3. Create or update `.vscode/settings.json` with MCP-specific settings:

```json
{
  "github-mcp.server.url": "http://localhost:3000",
  "github-mcp.server.validateCertificates": true,
  "github-mcp.auth.enabled": true,
  "github-mcp.auth.tokenFromEnv": true,
  "github-mcp.auth.tokenEnvVariable": "API_TOKEN",
  "github-mcp.github.tokenFromEnv": true,
  "github-mcp.github.tokenEnvVariable": "GITHUB_TOKEN",
  
  "github.copilot.advanced": {
    "mcp.enabled": true,
    "mcp.serverUrl": "http://localhost:3000"
  },
  
  "terminal.integrated.env.linux": {
    "MCP_SERVER_URL": "http://localhost:3000"
  },
  "terminal.integrated.env.osx": {
    "MCP_SERVER_URL": "http://localhost:3000"
  },
  "terminal.integrated.env.windows": {
    "MCP_SERVER_URL": "http://localhost:3000"
  }
}
```

4. Create a `.env.mcp` file with your environment variables:

```
# GitHub MCP Server Environment Configuration
MCP_SERVER_URL=http://localhost:3000
MCP_PORT=3000
MCP_HOST=localhost
ENABLE_TLS=false

# Authentication
GITHUB_TOKEN=your_github_token_here
API_TOKEN=your_api_token_here

# Test Repository
TEST_REPO=owner/repo
```

5. Load the environment variables:

For Bash/Zsh:
```bash
export $(cat .env.mcp | grep -v "^#" | xargs)
```

For Windows CMD:
```cmd
set /p %MCP_ENV%<.env.mcp
```

For Windows PowerShell:
```powershell
Get-Content .env.mcp | ForEach-Object { $env:$($_.Split("=")[0])=$_.Split("=")[1] }
```

## Using with Copilot Chat

Once you have configured the GitHub MCP server integration with VS Code, you can use it with Copilot Chat:

1. Start the GitHub MCP server:

```bash
./run-mcp-server.sh
```

2. Open VS Code in your project directory.

3. Verify the MCP server connection:

```bash
node test-github-mcp-server.js
```

4. Open Copilot Chat in VS Code (Ctrl+Shift+I or Cmd+Shift+I).

5. You can now use Copilot Chat with enhanced capabilities:

### Example Commands for Copilot Chat

- **Search for code**: "Find all functions that handle authentication in this repository"
- **Get file content**: "Show me the contents of the main.js file"
- **Modify code**: "Add error handling to the login function in auth.js"
- **Create a pull request**: "Create a pull request to fix the bug in the authentication module"

### Verifying MCP Integration

To verify that Copilot Chat is using the MCP server:

1. Ask Copilot Chat: "What MCP server are you connected to?"
2. Copilot should respond with information about the connected MCP server.

## Troubleshooting

### Common Issues

#### MCP Server Connection Issues

**Symptoms**: Copilot Chat cannot connect to the MCP server.

**Solutions**:
- Verify that the MCP server is running: `curl http://localhost:3000/health`
- Check that the server URL in VS Code settings matches the running server
- Ensure environment variables are properly loaded
- Check for firewall or network issues blocking the connection

#### Authentication Errors

**Symptoms**: Copilot Chat cannot authenticate with the MCP server.

**Solutions**:
- Verify that your GitHub token is valid and has the correct permissions
- Check that the API token is correctly set in the environment variables
- Ensure the token is being passed correctly to the server

#### Permission Errors

**Symptoms**: Copilot Chat cannot access or modify repository content.

**Solutions**:
- Check that your GitHub token has the necessary permissions for the repository
- Verify that the repository is accessible to your GitHub account
- Ensure the MCP server has the correct permissions configured

### Diagnostic Steps

1. Check MCP server logs:
```bash
cat logs/server.log
```

2. Test the MCP server connection:
```bash
node test-github-mcp-server.js
```

3. Verify environment variables:
```bash
echo $MCP_SERVER_URL
echo $GITHUB_TOKEN
```

4. Restart VS Code to reload settings and extensions.

## Security Best Practices

### Token Management

- **Never commit tokens to version control**
- Store tokens in environment variables or secure credential storage
- Use tokens with the minimum required permissions
- Rotate tokens regularly
- Consider using GitHub CLI for token management

### Server Security

- Run the MCP server locally or in a secure environment
- Enable TLS for production deployments
- Restrict CORS to specific origins
- Use API tokens for client authentication
- Keep the server and its dependencies updated

### VS Code Security

- Enable workspace trust features
- Use a separate VS Code profile for MCP integration
- Regularly review and update extensions
- Be cautious with third-party extensions that might access your tokens

## Advanced Configuration

### Custom Endpoints

You can configure custom endpoints in the `.vscode/mcp.json` file:

```json
"endpoints": {
  "search": "/api/custom/search",
  "content": "/api/custom/content",
  "modify": "/api/custom/modify",
  "pull": "/api/custom/pull"
}
```

### Repository-Specific Configuration

You can specify repositories in the `.vscode/mcp.json` file:

```json
"github": {
  "tokenVariable": "GITHUB_TOKEN",
  "repositories": [
    "owner/repo1",
    "owner/repo2"
  ]
}
```

### Performance Tuning

Adjust performance settings in the `.vscode/mcp.json` file:

```json
"performance": {
  "requestTimeout": 60000,
  "cacheEnabled": true,
  "cacheTTL": 600
}
```

### Logging Configuration

Configure logging in the `.vscode/mcp.json` file:

```json
"logging": {
  "level": "debug",
  "format": "json"
}
```

---

For more information, refer to the [GitHub MCP Server Documentation](github-mcp-server-guide.md) and the [VS Code Extension API Documentation](https://code.visualstudio.com/api).