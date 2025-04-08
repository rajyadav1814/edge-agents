# Agentic GitHub Project Management

Welcome to the documentation for the Agentic GitHub Project Management API. This collection of guides and references will help you effectively implement, use, and troubleshoot this AI-assistant-friendly GitHub Projects integration.

## Documentation Overview

| Document | Description |
|----------|-------------|
| [API Reference](./api-reference.md) | Complete reference of all endpoints, parameters, and response formats |
| [Installation & Setup](./installation-setup.md) | Guide for installing, configuring, and deploying the edge function |
| [Security Best Practices](./security-best-practices.md) | Security recommendations and best practices for using the API |
| [Example Usage](./example-usage.md) | Practical examples with curl commands and response examples |
| [MCP Integration](./mcp-integration.md) | Guide for using the MCP discovery endpoint and integration |
| [MCP & SSE Options](./mcp-sse-options.md) | Detailed options for MCP and SSE integration |
| [MCP & SSE Examples](./example-usage-mcp-sse.md) | Practical examples for using MCP and SSE features |
| [Troubleshooting Guide](./troubleshooting-guide.md) | Solutions for common issues and error scenarios |
| [Token Troubleshooting](./token-troubleshooting.md) | Help with GitHub token issues and permissions |

## What is Agentic GitHub Project Management?

Agentic GitHub Project Management is a specialized API designed to enable AI assistants and tools to interact with GitHub Projects. It provides:

1. **AI-Assistant Integration**: MCP (Model Context Protocol) support for seamless integration with AI assistants
2. **Real-time Updates**: SSE (Server-Sent Events) for live project updates
3. **Comprehensive API**: Full access to GitHub Projects v2 features
4. **Flexible Deployment**: Run as a Supabase Edge Function or standalone server

## Quick Start

1. **Installation**
   
   ```bash
   # Clone the repository
   git clone https://github.com/agenticsorg/edge-agents.git
   cd edge-agents/supabase/functions/github-projects
   
   # Install dependencies
   npm install
   
   # Build the project
   node scripts/build/build.js
   
   # Deploy the function to your Supabase project
   supabase functions deploy github-api
   
   # Configure required environment variables
   supabase secrets set GITHUB_TOKEN=your_github_token
   supabase secrets set GITHUB_ORG=your_organization_name
   ```

2. **Basic Usage**

   ```bash
   # List GitHub Projects
   curl -X GET "https://your-project-ref.supabase.co/functions/v1/github-api/projects" \
     -H "Authorization: Bearer your_supabase_anon_key"
   
   # Get a specific project
   curl -X GET "https://your-project-ref.supabase.co/functions/v1/github-api/projects/1" \
     -H "Authorization: Bearer your_supabase_anon_key"
   ```

3. **MCP Integration**

   ```bash
   # Build the project (if not already built)
   cd /workspaces/edge-agents/supabase/functions/github-projects
   node scripts/build/build.js
   
   # Start the MCP server
   cd /workspaces/edge-agents/supabase/functions/github-projects
   node dist/simple-mcp-server.js
   
   # Test the MCP discovery endpoint
   curl -X GET "http://localhost:8002/.well-known/mcp.json"
   ```

4. **Next Steps**
   - See the [Installation & Setup](./installation-setup.md) guide for detailed configuration
   - Review the [API Reference](./api-reference.md) for all available endpoints
   - Check the [Example Usage](./example-usage.md) for practical implementation examples
   - Explore [MCP & SSE Options](./mcp-sse-options.md) for advanced integration options
   - Try the [MCP & SSE Examples](./example-usage-mcp-sse.md) for practical MCP and SSE usage

## Build and Run

### Building the Project

```bash
# Navigate to the project directory
cd /workspaces/edge-agents/supabase/functions/github-projects

# Install dependencies
npm install

# Build the project
node scripts/build/build.js
```

This will compile the TypeScript code and generate the JavaScript files in the `dist/` directory.

### Running the Servers

```bash
# Run the HTTP MCP server
node dist/simple-mcp-server.js

# Run the Stdio MCP server
node dist/mcp-stdio-server.js

# Run the MCP discovery server
node dist/mcp-discovery-server.js

# Run all servers (using the provided script)
./scripts/run/run-all-servers.sh
```

### The dist/ Directory

After building the project, the `dist/` directory contains all the compiled JavaScript files:

| File | Description |
|------|-------------|
| `simple-mcp-server.js` | HTTP MCP server implementation |
| `mcp-stdio-server.js` | Stdio MCP server implementation |
| `mcp-discovery-server.js` | MCP discovery server implementation |
| `index.js` | Main edge function entry point |

## Key Features

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

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `GITHUB_TOKEN` | GitHub Personal Access Token | Yes | - |
| `GITHUB_ORG` | GitHub Organization name | Yes | - |
| `GITHUB_API_VERSION` | GitHub API version | No | `v3` |
| `GITHUB_WEBHOOK_SECRET` | Secret for verifying webhook signatures | No | - |
| `CACHE_TTL` | Cache time-to-live in seconds | No | `300` |
| `MCP_PORT` | Port for the MCP HTTP server | No | `8002` |
| `SSE_ENABLED` | Enable Server-Sent Events | No | `true` |

## Contributing

If you'd like to contribute to this project:

1. Fork the repository on GitHub
2. Create a new branch for your feature or bugfix
3. Make your changes and ensure tests pass
4. Submit a pull request with a clear description of your changes

## About Agentics.org

This project is maintained by [Agentics.org](https://agentics.org), an organization dedicated to advancing AI agent technology and integration. Visit our website to learn more about our projects and mission.

## Additional Resources

- [GitHub REST API Documentation](https://docs.github.com/en/rest)
- [GitHub GraphQL API Documentation](https://docs.github.com/en/graphql)
- [GitHub Projects Documentation](https://docs.github.com/en/issues/planning-and-tracking-with-projects)
- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [MCP Specification](https://github.com/microsoft/modelcontextprotocol)
- [Server-Sent Events (SSE) MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)