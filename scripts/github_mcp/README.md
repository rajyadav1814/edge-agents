# GitHub MCP Server

This is a local copy of the GitHub Model Control Panel (MCP) server, which provides a standardized interface for AI models to interact with GitHub repositories and perform various operations.

## Overview

The GitHub MCP Server implements the Model Control Panel (MCP) protocol, allowing AI assistants to:

- Access GitHub repository content
- Search code within repositories
- Create and modify files
- Open and manage pull requests
- Access GitHub issues and discussions

## Directory Structure

```
github_mcp/
├── cmd/                    # Command-line executables
│   ├── github-mcp-server/  # Main MCP server executable
│   └── mcpcurl/            # Utility for testing MCP endpoints
├── pkg/                    # Core packages
│   ├── github/             # GitHub API integration
│   ├── log/                # Logging utilities
│   └── translations/       # Internationalization support
├── conformance/            # Conformance tests
├── script/                 # Utility scripts
├── third-party/            # Third-party dependencies
├── run-mcp-server.sh       # Script to build and run the server
├── run-docker.sh           # Script to run the server in Docker
└── test-mcp-server.sh      # Script to test server functionality
```

## Getting Started

### Prerequisites

- Go 1.19 or higher
- Docker (optional, for containerized deployment)
- GitHub Personal Access Token with appropriate permissions

### Environment Setup

Set your GitHub token as an environment variable:

```bash
export GITHUB_TOKEN=your_github_token_here
```

### Running the Server

#### Option 1: Direct Execution

```bash
./run-mcp-server.sh
```

This will build and run the server on port 3000.

#### Option 2: Docker Container

```bash
./run-docker.sh
```

This will build a Docker image and run the server in a container on port 3000.

### Testing the Server

To verify the server is running correctly:

```bash
./test-mcp-server.sh
```

You can also specify a custom server URL:

```bash
./test-mcp-server.sh http://localhost:8080
```

## Usage with AI Assistants

The GitHub MCP Server can be integrated with AI assistants that support the MCP protocol. Configure your assistant to use the following endpoint:

```
http://localhost:3000
```

## Configuration

The server can be configured through environment variables:

- `GITHUB_TOKEN`: GitHub Personal Access Token (required)
- `MCP_PORT`: Port to run the server on (default: 3000)
- `LOG_LEVEL`: Logging level (default: info)

## License

See the LICENSE file for details.
