# GitHub MCP Server Installation Guide

This guide provides instructions for using the all-in-one installation script for the GitHub Model Control Panel (MCP) server.

## Overview

The `install-github-mcp.sh` script automates the complete setup process for the GitHub MCP server, including:

- Checking for prerequisites (Docker, Node.js, Git)
- Cloning the repository if needed
- Setting up environment variables securely
- Building and running the server using Docker or Docker Compose
- Configuring VS Code integration
- Running tests to verify the installation

## Prerequisites

Before running the installation script, ensure you have:

- **Operating System**: Linux, macOS, or Windows with WSL
- **Required Software**:
  - Git
  - Node.js (v14+)
  - Docker (for Docker or Docker Compose installation modes)
  - Docker Compose (for Docker Compose installation mode)
  - Go (v1.19+, for local installation mode)
- **GitHub Account**: Active GitHub account
- **GitHub Personal Access Token**: Token with appropriate permissions
  - Required scopes: `repo`, `read:user`, `read:org` (for organization repositories)
  - Generate at: https://github.com/settings/tokens

## Installation Options

The script supports three installation modes:

1. **Docker** (default): Runs the server in a Docker container
2. **Docker Compose**: Runs the server using Docker Compose
3. **Local**: Builds and runs the server directly on your machine

## Usage

```bash
./install-github-mcp.sh [options]
```

### Basic Examples

1. **Docker Installation (Default)**:
   ```bash
   ./install-github-mcp.sh --github-token=your_github_token
   ```

2. **Docker Compose Installation**:
   ```bash
   ./install-github-mcp.sh --install-mode=docker-compose --github-token=your_github_token
   ```

3. **Local Installation**:
   ```bash
   ./install-github-mcp.sh --install-mode=local --github-token=your_github_token
   ```

### Command-Line Options

| Option | Description | Default |
|--------|-------------|---------|
| `--help` | Show help message | |
| `--install-mode=MODE` | Installation mode: docker, docker-compose, local | docker |
| `--port=PORT` | Port to run the server on | 3000 |
| `--host=HOST` | Host to bind the server to | 0.0.0.0 |
| `--github-token=TOKEN` | GitHub Personal Access Token | |
| `--api-token=TOKEN` | API Token for server authentication | (auto-generated) |
| `--enable-tls` | Enable TLS/HTTPS | false |
| `--tls-cert=PATH` | Path to TLS certificate file | |
| `--tls-key=PATH` | Path to TLS key file | |
| `--log-level=LEVEL` | Log level: debug, info, warn, error | info |
| `--log-format=FORMAT` | Log format: text, json | text |
| `--skip-clone` | Skip repository cloning | false |
| `--skip-tests` | Skip running tests | false |
| `--skip-vscode` | Skip VS Code integration | false |
| `--repo-path=PATH` | Path to existing repository (if --skip-clone is used) | |
| `--test-repo=REPO` | Test repository in format owner/repo | |
| `--verbose` | Enable verbose output | false |

## Advanced Examples

1. **Custom Port and Host**:
   ```bash
   ./install-github-mcp.sh --port=8080 --host=127.0.0.1 --github-token=your_github_token
   ```

2. **Enable TLS**:
   ```bash
   ./install-github-mcp.sh --enable-tls --tls-cert=/path/to/cert.pem --tls-key=/path/to/key.pem --github-token=your_github_token
   ```

3. **Use Existing Repository**:
   ```bash
   ./install-github-mcp.sh --skip-clone --repo-path=/path/to/repo --github-token=your_github_token
   ```

4. **Verbose Output**:
   ```bash
   ./install-github-mcp.sh --verbose --github-token=your_github_token
   ```

## Post-Installation

After installation, the script will:

1. Display a summary of the installation
2. Provide instructions for managing the server
3. Explain how to configure VS Code for MCP integration

### VS Code Integration

To use the GitHub MCP server with VS Code:

1. Install required VS Code extensions:
   - GitHub Copilot
   - GitHub Copilot Chat
   - (Optional) GitHub Pull Requests and Issues

2. Load environment variables as instructed by the script

3. Restart VS Code to apply settings

## Troubleshooting

If you encounter issues during installation:

1. Check the logs for error messages
2. Verify that all prerequisites are installed correctly
3. Ensure your GitHub token has the necessary permissions
4. Check network connectivity if Docker or GitHub API access fails

## Security Best Practices

- **Never commit tokens to version control**
- Store tokens in environment variables or secure credential storage
- Use tokens with the minimum required permissions
- Rotate tokens regularly
- Run the server behind a reverse proxy in production
- Enable TLS for all production deployments

## Additional Resources

For more information, refer to:
- [GitHub MCP Server Documentation](github-mcp-server-guide.md)
- [VS Code Integration Guide](github-mcp-vscode-guide.md)