# GitHub MCP Server Documentation

## Table of Contents

1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Installation Options](#installation-options)
   - [Local Installation](#local-installation)
   - [Docker Installation](#docker-installation)
   - [Docker Compose Installation](#docker-compose-installation)
4. [Environment Configuration](#environment-configuration)
   - [Required Variables](#required-variables)
   - [Server Configuration](#server-configuration)
   - [Security Settings](#security-settings)
   - [Logging Settings](#logging-settings)
   - [Rate Limiting](#rate-limiting)
   - [Timeout Settings](#timeout-settings)
   - [Cache Settings](#cache-settings)
   - [Advanced Settings](#advanced-settings)
5. [Running the Server](#running-the-server)
   - [Local Execution](#local-execution)
   - [Docker Execution](#docker-execution)
   - [Docker Compose Execution](#docker-compose-execution)
6. [Testing the Server](#testing-the-server)
7. [VS Code Integration](#vs-code-integration)
8. [Troubleshooting](#troubleshooting)
9. [Security Best Practices](#security-best-practices)
10. [API Reference](#api-reference)

## Introduction

The GitHub Model Control Panel (MCP) server provides a standardized interface for AI models to interact with GitHub repositories. It implements the Model Control Panel (MCP) protocol, enabling AI assistants to perform various operations on GitHub repositories, including:

- Accessing repository content
- Searching code within repositories
- Creating and modifying files
- Opening and managing pull requests
- Accessing GitHub issues and discussions

The MCP server acts as a bridge between AI assistants and GitHub, providing a secure and controlled way for AI models to interact with your code repositories.

## Prerequisites

Before setting up the GitHub MCP server, ensure you have the following:

### System Requirements

- **Operating System**: Linux, macOS, or Windows with WSL
- **CPU**: 2+ cores recommended
- **Memory**: 2GB+ RAM recommended
- **Disk Space**: 500MB minimum

### Software Requirements

- **Go**: Version 1.19 or higher (for local installation)
- **Docker**: Latest stable version (for containerized deployment)
- **Docker Compose**: Latest stable version (for multi-container deployment)
- **Git**: Latest stable version
- **Node.js**: Version 14 or higher (for running examples)

### GitHub Requirements

- **GitHub Account**: Active GitHub account
- **Personal Access Token**: Token with appropriate permissions
  - Required scopes: `repo`, `read:user`, `read:org` (for organization repositories)
  - Generate at: https://github.com/settings/tokens

## Installation Options

### Local Installation

For local development and testing, you can build and run the server directly on your machine.

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/github-mcp-server.git
   cd github-mcp-server
   ```

2. Install Go dependencies:
   ```bash
   go mod download
   ```

3. Build the server:
   ```bash
   go build -o github-mcp-server ./cmd/github-mcp-server
   ```

### Docker Installation

For containerized deployment, you can use Docker to build and run the server.

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/github-mcp-server.git
   cd github-mcp-server
   ```

2. Build the Docker image:
   ```bash
   docker build -t github-mcp-server .
   ```

### Docker Compose Installation

For a more comprehensive setup with proper networking and volume management, Docker Compose is recommended.

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/github-mcp-server.git
   cd github-mcp-server
   ```

2. Create a `.env` file from the template:
   ```bash
   cp .env.example .env
   ```

3. Edit the `.env` file with your configuration values (see [Environment Configuration](#environment-configuration)).

## Environment Configuration

The GitHub MCP server is configured through environment variables. These can be set directly in your shell, in a `.env` file, or passed to Docker containers.

### Required Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `GITHUB_TOKEN` | GitHub Personal Access Token | None | Yes |

### Server Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `MCP_PORT` | Port to run the server on | `3000` | No |
| `MCP_HOST` | Host address to bind the server to | `0.0.0.0` | No |
| `API_BASE_PATH` | Base path for all API endpoints | `/api` | No |

### Security Settings

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VALIDATE_TOKENS` | Enable validation of client tokens | `true` | No |
| `API_TOKEN` | Token for API authentication | None | No |
| `CORS_ALLOWED_ORIGINS` | Allowed origins for CORS | `*` | No |
| `ENABLE_TLS` | Enable HTTPS | `false` | No |
| `TLS_CERT_PATH` | Path to TLS certificate file | None | If TLS enabled |
| `TLS_KEY_PATH` | Path to TLS private key file | None | If TLS enabled |

### Logging Settings

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `LOG_LEVEL` | Verbosity of server logs | `info` | No |
| `LOG_FORMAT` | Format of log output | `text` | No |
| `LOG_FILE` | Path to log file | None (stdout) | No |

### Rate Limiting

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `GITHUB_RATE_LIMIT` | Maximum GitHub API requests per hour | `5000` | No |
| `API_RATE_LIMIT` | Maximum API requests per minute per client | `60` | No |

### Timeout Settings

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `REQUEST_TIMEOUT` | Maximum time for API requests (ms) | `30000` | No |
| `GITHUB_API_TIMEOUT` | Maximum time for GitHub API requests (ms) | `10000` | No |

### Cache Settings

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `ENABLE_CACHE` | Enable caching of GitHub API responses | `true` | No |
| `CACHE_TTL` | Time-to-live for cached items (seconds) | `300` | No |

### Advanced Settings

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DEBUG_MODE` | Enable additional debug information | `false` | No |
| `MAX_REQUEST_SIZE` | Maximum size of request body (MB) | `5` | No |
| `WORKER_THREADS` | Number of worker threads | `0` (auto) | No |

## Running the Server

### Local Execution

To run the server locally:

1. Set the required environment variables:
   ```bash
   export GITHUB_TOKEN=your_github_token_here
   ```

2. Run the server using the provided script:
   ```bash
   ./run-mcp-server.sh
   ```

   This will build and run the server on the configured port (default: 3000).

### Docker Execution

To run the server using Docker:

1. Set the required environment variables:
   ```bash
   export GITHUB_TOKEN=your_github_token_here
   ```

2. Run the server using the provided script:
   ```bash
   ./run-docker.sh
   ```

   This will build a Docker image and run the server in a container on the configured port.

### Docker Compose Execution

To run the server using Docker Compose:

1. Ensure your `.env` file is configured with the required variables.

2. Run the server using the provided script:
   ```bash
   ./run-docker-compose.sh
   ```

   This will start the server and any associated services defined in the `docker-compose.yml` file.

## Testing the Server

To verify that the server is running correctly:

1. Use the provided test script:
   ```bash
   ./test-mcp-server.sh
   ```

   This will perform basic connectivity and functionality tests.

2. Specify a custom server URL if needed:
   ```bash
   ./test-mcp-server.sh http://localhost:8080
   ```

3. Check the server health endpoint:
   ```bash
   curl http://localhost:3000/health
   ```

   This should return a `200 OK` response if the server is running.

## VS Code Integration

The GitHub MCP server can be integrated with VS Code to enable AI assistants to interact with your repositories directly from the editor.

### Setting Up VS Code Integration

1. Install the required VS Code extension for your AI assistant.

2. Configure the extension to use the MCP server:
   - Server URL: `http://localhost:3000` (or your custom URL)
   - API Token: Your configured API token (if enabled)

3. Verify the connection by running a test command through the extension.

### Example Configuration

For a typical VS Code extension configuration:

```json
{
  "aiAssistant.mcpServer": {
    "url": "http://localhost:3000",
    "token": "your_api_token_here",
    "enabled": true
  }
}
```

## Troubleshooting

### Common Issues

#### Server Won't Start

**Symptoms**: Error messages when trying to start the server.

**Possible Solutions**:
- Check that the `GITHUB_TOKEN` environment variable is set correctly.
- Verify that the specified port is not already in use.
- Check for proper permissions in the directories being used.

#### Authentication Errors

**Symptoms**: `401 Unauthorized` responses from the server.

**Possible Solutions**:
- Verify that your GitHub token has the correct permissions.
- Check that the token is valid and not expired.
- Ensure the token is being passed correctly to the server.

#### Rate Limiting Issues

**Symptoms**: `429 Too Many Requests` responses from GitHub API.

**Possible Solutions**:
- Adjust the `GITHUB_RATE_LIMIT` to match your account's actual limit.
- Implement caching to reduce the number of API calls.
- Distribute requests across multiple tokens if available.

#### Docker Compose Errors

**Symptoms**: Errors when running with Docker Compose.

**Possible Solutions**:
- Ensure Docker and Docker Compose are installed correctly.
- Check that your `.env` file contains all required variables.
- Verify that the Docker daemon is running.

### Diagnostic Steps

1. Check server logs:
   ```bash
   # For local execution
   cat logs/server.log

   # For Docker
   docker logs github-mcp-server

   # For Docker Compose
   docker-compose logs github-mcp-server
   ```

2. Verify connectivity:
   ```bash
   curl http://localhost:3000/health
   ```

3. Test with verbose logging:
   ```bash
   LOG_LEVEL=debug ./run-mcp-server.sh
   ```

## Security Best Practices

### Token Management

- **Never commit tokens to version control**
- Use environment variables or secure secret management
- Rotate tokens regularly
- Use tokens with the minimum required permissions

### Network Security

- Run the server behind a reverse proxy in production
- Enable TLS for all production deployments
- Restrict CORS to specific origins in production
- Use API tokens for client authentication

### Container Security

- Use non-root users in containers
- Keep container images updated
- Scan images for vulnerabilities
- Use read-only file systems where possible

### Monitoring and Auditing

- Enable comprehensive logging
- Monitor for unusual access patterns
- Implement rate limiting
- Regularly review access logs

## API Reference

The GitHub MCP server provides several endpoints for interacting with GitHub repositories:

### Search Endpoint

**URL**: `/api/search`

**Method**: `POST`

**Description**: Search for code in repositories.

**Request Body**:
```json
{
  "query": "function example",
  "repo": "owner/repo",
  "path": "optional/path/filter",
  "limit": 10
}
```

**Response**:
```json
{
  "results": [
    {
      "path": "src/example.js",
      "line": 42,
      "content": "function example() { ... }"
    }
  ]
}
```

### Content Endpoint

**URL**: `/api/content`

**Method**: `POST`

**Description**: Get file content from a repository.

**Request Body**:
```json
{
  "repo": "owner/repo",
  "path": "path/to/file.js",
  "ref": "optional-branch-or-commit"
}
```

**Response**:
```json
{
  "content": "file content here...",
  "encoding": "utf-8"
}
```

### Modify Endpoint

**URL**: `/api/modify`

**Method**: `POST`

**Description**: Modify files in a repository.

**Request Body**:
```json
{
  "repo": "owner/repo",
  "path": "path/to/file.js",
  "content": "new file content",
  "message": "Update file.js",
  "branch": "optional-branch-name"
}
```

**Response**:
```json
{
  "success": true,
  "commit": "sha-of-new-commit"
}
```

### Pull Request Endpoint

**URL**: `/api/pull`

**Method**: `POST`

**Description**: Create a pull request.

**Request Body**:
```json
{
  "repo": "owner/repo",
  "title": "PR Title",
  "body": "PR Description",
  "head": "source-branch",
  "base": "target-branch"
}
```

**Response**:
```json
{
  "number": 123,
  "url": "https://github.com/owner/repo/pull/123"
}
```

For a complete API reference, see the server documentation or use the OpenAPI specification available at `/api/docs` when the server is running.