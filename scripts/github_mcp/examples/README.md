# GitHub MCP Server Examples

This directory contains examples demonstrating how to use the GitHub MCP Server.

## Available Examples

### JavaScript Client Example

The `mcp-client-example.js` file demonstrates how to interact with the GitHub MCP server using a simple JavaScript client. It shows how to:

- Connect to the MCP server
- Search for code in a repository
- Get file content from a repository

## Running the Examples

### Prerequisites

- Node.js 14 or higher
- npm (Node Package Manager)
- A running GitHub MCP server (see main README for setup instructions)

### Setup

1. Set your GitHub token as an environment variable:

```bash
export GITHUB_TOKEN=your_github_token_here
```

2. Optionally, set the MCP server URL if it's not running on the default port:

```bash
export MCP_SERVER_URL=http://localhost:8080
```

### Running the JavaScript Example

You can run the JavaScript example using the provided script:

```bash
./run-example.sh
```

Or manually:

```bash
# Install dependencies
npm install

# Run the example
node mcp-client-example.js
```

## Creating Your Own Examples

Feel free to modify these examples or create your own to explore the capabilities of the GitHub MCP server. The server provides a standardized interface for AI models to interact with GitHub repositories.

Key endpoints include:

- `/search` - Search for code in repositories
- `/content` - Get file content
- `/modify` - Modify files
- `/pull` - Create pull requests

See the main README for more details on available endpoints and their parameters.