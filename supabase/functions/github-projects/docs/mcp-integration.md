# MCP Integration for GitHub Projects API

This document describes the Machine Communication Protocol (MCP) integration for the GitHub Projects API.

## Overview

The GitHub Projects API provides MCP-compatible endpoints for interacting with GitHub repositories and projects. The integration supports both HTTP and stdio interfaces, allowing for flexible integration with various MCP clients.

2. **Stdio MCP Server**: Communicates over stdin/stdout for local integration

Both servers expose the same set of tools and capabilities, allowing clients to interact with GitHub Projects data through a standardized interface.

## Available Tools

The following tools are available through the MCP interface:

| Tool Name | Description | Required Parameters |
|-----------|-------------|---------------------|
| `getRepository` | Get repository information | `owner`, `repo` |
| `listProjects` | List projects for an organization | `organization` |
| `getProject` | Get project details | `organization`, `projectNumber` |
| `executeGraphQL` | Execute a GraphQL query against the GitHub API | `query` |

## HTTP Server

The HTTP server provides the following endpoints:

- `/.well-known/mcp.json`: MCP discovery endpoint
- `/tools/list`: List available tools
- `/tools/call`: Call a specific tool
- `/sse`: Server-Sent Events (SSE) transport
- `/stream`: HTTP Stream transport

### Starting the HTTP Server

```bash
cd /workspaces/edge-agents/supabase/functions/github-projects/dist
./run-simple-mcp.sh
```

The server will start on port 8002 by default.

### Example HTTP Request

```bash
curl -X GET http://localhost:8002/.well-known/mcp.json
```

## Stdio Server

The stdio server communicates over stdin/stdout, making it suitable for integration with local tools and AI assistants. It supports both the MCP message format and JSON-RPC 2.0 protocol for maximum compatibility.

### Starting the Stdio Server

```bash
cd /workspaces/edge-agents/supabase/functions/github-projects/dist
./run-stdio-mcp.sh
```

The server will read from stdin and write to stdout.

### MCP Configuration

The stdio server is configured in the MCP configuration file (`.roo/mcp.json`) as follows:

```json
"githubProjects-local": {
  "command": "node",
  "args": [
    "/workspaces/edge-agents/supabase/functions/github-projects/dist/mcp-stdio-wrapper.js"
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
  "alwaysAllow": [
    "github-api-proxy",
    "projects-management",
    "repository-access"
  ],
  "timeout": 15
}
```

## JSON-RPC 2.0 Support

The stdio server supports JSON-RPC 2.0 protocol, which is used by tools like Cline. The following methods are available:

- `initialize`: Initialize the connection and get server capabilities
- `getRepository`: Get repository information
- `listProjects`: List projects for an organization
- `getProject`: Get project details
- `executeGraphQL`: Execute a GraphQL query against the GitHub API

### Example JSON-RPC 2.0 Initialize Request

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "clientInfo": {
      "name": "Cline",
      "version": "3.9.2"
    }
  }
}
```

## Running Both Servers

A combined script is provided to run both the HTTP and stdio servers:

```bash
cd /workspaces/edge-agents/supabase/functions/github-projects/dist
./run-mcp-servers.sh
```

## Testing

You can test the stdio server using the provided test script:

```bash
cd /workspaces/edge-agents/supabase/functions/github-projects/dist
node test-stdio-mcp.js
```

For the HTTP server, you can use curl or any HTTP client:

```bash
curl -X GET http://localhost:8002/.well-known/mcp.json
curl -X GET http://localhost:8002/tools/list
```

## Implementation Details

The MCP integration consists of the following components:

1. **HTTP Server (`simple-mcp-server.js`)**: A Node.js HTTP server that implements the MCP protocol over HTTP.
2. **Stdio Server (`mcp-stdio-server.js`)**: A Node.js script that implements the MCP protocol over stdin/stdout.
3. **Wrapper Script (`mcp-stdio-wrapper.js`)**: A simple wrapper that loads the stdio server with the correct environment.
4. **Run Scripts**: Shell scripts to start the servers with the correct configuration.
5. **Test Scripts**: Scripts to test the functionality of the servers.

The implementation follows the MCP specification and provides a consistent interface across both transport methods.