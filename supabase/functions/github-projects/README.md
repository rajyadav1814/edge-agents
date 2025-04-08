# Agentic GitHub Project Management

An AI-assistant-friendly GitHub Projects API with MCP and SSE integration.

## Overview

Agentic GitHub Project Management is a specialized API designed to enable AI assistants and tools to interact with GitHub Projects. It provides:

1. **AI-Assistant Integration**: MCP (Model Context Protocol) support for seamless integration with AI assistants
2. **Real-time Updates**: SSE (Server-Sent Events) for live project updates
3. **Comprehensive API**: Full access to GitHub Projects v2 features
4. **Flexible Deployment**: Run as a Supabase Edge Function or standalone server

## Features

- **AI Assistant Integration**: MCP support for AI assistants like Claude and GPT
- **REST API Proxy**: Securely proxy requests to GitHub's REST API
- **GraphQL Support**: Execute GraphQL queries against GitHub's GraphQL API
- **Projects API**: Specialized endpoints for GitHub Projects v2
- **Webhook Processing**: Handle and verify GitHub webhooks
- **MCP Integration**: MCP discovery endpoint for tool integration
- **SSE Support**: Server-Sent Events for real-time updates
- **Error Handling**: Robust error handling with detailed error messages
- **Response Formatting**: Standardized response format with metadata
- **Rate Limit Handling**: Intelligent handling of GitHub API rate limits
- **Caching**: Configurable response caching

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/agenticsorg/edge-agents.git
cd edge-agents/supabase/functions/github-projects

# Install dependencies
npm install

# Build the project
npm run build
```

### Configuration

Create a `.env` file with your GitHub credentials:

```
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_ORG=your_organization_name
```

### Running the Servers

```bash
# Run all servers
npm start

# Or run individual servers
npm run start:http  # HTTP MCP server
npm run start:stdio # Stdio MCP server
```

### Using with AI Assistants

Configure your AI assistant to use the MCP server:

```json
"githubProjects-local": {
  "command": "node",
  "args": [
    "/path/to/edge-agents/supabase/functions/github-projects/dist/mcp-stdio-server.js"
  ],
  "disabled": false,
  "autoApprove": [
    "connection",
    "disconnect",
    "tools/list",
    "tools/call",
    "discovery"
  ],
  "communication": {
    "protocol": "stdio",
    "messageFormat": "json",
    "compressionEnabled": false
  },
  "timeout": 15
}
```

## Documentation

For detailed documentation, see the [docs](./docs) directory:

- [API Reference](./docs/api-reference.md)
- [Installation & Setup](./docs/installation-setup.md)
- [MCP & SSE Options](./docs/mcp-sse-options.md)
- [MCP & SSE Examples](./docs/example-usage-mcp-sse.md)
- [Troubleshooting Guide](./docs/troubleshooting-guide.md)

## Development

### Building the Project

```bash
# Build the project
npm run build
```

### Running Tests

```bash
# Run tests
cd tests
./run-tests.sh
```

## Deployment

### Supabase Edge Function

```bash
# Deploy to Supabase
supabase functions deploy github-projects

# Set environment variables
supabase secrets set GITHUB_TOKEN=your_github_token
supabase secrets set GITHUB_ORG=your_organization_name
```

### Standalone Server

```bash
# Start the HTTP server
node dist/simple-mcp-server.js
```

## Contributing

If you'd like to contribute to this project:

1. Fork the repository on GitHub
2. Create a new branch for your feature or bugfix
3. Make your changes and ensure tests pass
4. Submit a pull request with a clear description of your changes

## License

MIT

## About Agentics.org

This project is maintained by [Agentics.org](https://agentics.org), an organization dedicated to advancing AI agent technology and integration. Visit our website to learn more about our projects and mission.