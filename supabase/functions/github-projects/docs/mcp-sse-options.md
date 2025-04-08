# MCP and SSE Options for GitHub Projects API

This document provides detailed information about the Model Context Protocol (MCP) and Server-Sent Events (SSE) integration options available in the GitHub Projects API.

## Overview

The GitHub Projects API offers multiple integration options:

1. **HTTP REST API**: Traditional REST endpoints for GitHub Projects operations
2. **GraphQL API**: Direct GraphQL query execution against GitHub's API
3. **MCP Integration**: Model Context Protocol support for AI assistants and tools
4. **SSE Endpoints**: Server-Sent Events for real-time updates

## Building the Project

Before using the MCP and SSE features, you need to build the project:

```bash
# Navigate to the project directory
cd /workspaces/edge-agents/supabase/functions/github-projects

# Install dependencies (if not already installed)
npm install

# Build the project
node scripts/build/build.js
```

This will compile the TypeScript code and generate the JavaScript files in the `dist/` directory. The build process includes:

1. Compiling TypeScript to JavaScript
2. Bundling dependencies
3. Creating server scripts for different integration options
4. Setting up proper permissions for executable scripts

## MCP Integration Options

### 1. HTTP MCP Server

The HTTP MCP server provides a web-accessible interface for MCP clients to interact with GitHub Projects data.

#### Key Features:
- Standard MCP discovery endpoint
- Tools for GitHub Projects operations
- Support for both synchronous and streaming responses
- Compatible with any MCP client that supports HTTP transport

#### Endpoints:
- `/.well-known/mcp.json`: MCP discovery endpoint
- `/tools/list`: List available tools
- `/tools/call`: Call a specific tool
- `/sse`: Server-Sent Events (SSE) transport
- `/stream`: HTTP Stream transport

#### Starting the HTTP Server:
```bash
# Using the run script
cd /workspaces/edge-agents/supabase/functions/github-projects
./scripts/run/run-simple-mcp.sh

# Or directly using the built file
cd /workspaces/edge-agents/supabase/functions/github-projects
node dist/simple-mcp-server.js
```

The server will start on port 8002 by default.

### 2. Stdio MCP Server

The stdio MCP server communicates over stdin/stdout, making it suitable for integration with local tools and AI assistants.

#### Key Features:
- Same tools and capabilities as the HTTP server
- Support for both MCP message format and JSON-RPC 2.0 protocol
- Ideal for integration with VS Code extensions and local AI assistants
- Low latency for local operations

#### Starting the Stdio Server:
```bash
# Using the run script
cd /workspaces/edge-agents/supabase/functions/github-projects
./scripts/run/run-stdio-mcp.sh

# Or directly using the built file
cd /workspaces/edge-agents/supabase/functions/github-projects
node dist/mcp-stdio-server.js
```

#### MCP Configuration:
The stdio server can be configured in the MCP configuration file (`.roo/mcp.json`):

```json
"githubProjects-local": {
  "command": "node",
  "args": [
    "/workspaces/edge-agents/supabase/functions/github-projects/dist/mcp-stdio-server.js"
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

### 3. MCP Discovery Server

The MCP Discovery server provides a lightweight implementation focused on the discovery endpoint, making it easy to integrate with MCP clients.

#### Key Features:
- Minimal implementation focused on discovery
- Provides tool metadata for MCP clients
- Useful for initial integration testing

#### Starting the Discovery Server:
```bash
# Using the run script
cd /workspaces/edge-agents/supabase/functions/github-projects
./scripts/run/run-mcp-discovery.sh

# Or directly using the built file
cd /workspaces/edge-agents/supabase/functions/github-projects
node dist/mcp-discovery-server.js
```

## SSE Integration Options

Server-Sent Events (SSE) provide a way to receive real-time updates from the GitHub Projects API.

### 1. SSE Endpoint

The SSE endpoint allows clients to subscribe to real-time updates for GitHub Projects data.

#### Key Features:
- Real-time updates for project changes
- Lightweight connection with minimal overhead
- Compatible with standard EventSource API in browsers
- Support for reconnection and error handling

#### Endpoint:
- `/sse`: Main SSE endpoint

#### Example Usage:
```javascript
const eventSource = new EventSource('http://localhost:8002/sse');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received update:', data);
};

eventSource.onerror = (error) => {
  console.error('SSE error:', error);
  eventSource.close();
};
```

### 2. SSE with MCP

The SSE endpoint can be used in conjunction with MCP to provide real-time updates for MCP tools.

#### Example MCP Tool with SSE:
```javascript
// First, call the MCP tool to start monitoring a project
fetch('http://localhost:8002/tools/call', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'monitorProject',
    arguments: {
      organization: 'your-org-name',
      projectNumber: 1
    }
  })
})
.then(response => response.json())
.then(data => {
  console.log('Monitoring started:', data);
  
  // Then connect to SSE to receive updates
  const eventSource = new EventSource('http://localhost:8002/sse');
  
  eventSource.onmessage = (event) => {
    const update = JSON.parse(event.data);
    console.log('Project update:', update);
  };
});
```

## Running Both Servers

A combined script is provided to run both the HTTP and stdio servers:

```bash
# Using the run script
cd /workspaces/edge-agents/supabase/functions/github-projects
./scripts/run/run-all-servers.sh

# Or directly using the built files
cd /workspaces/edge-agents/supabase/functions/github-projects
node dist/simple-mcp-server.js &
node dist/mcp-stdio-server.js
```

## The dist/ Directory

After building the project, the `dist/` directory contains all the compiled JavaScript files needed to run the servers:

### Key Files in dist/:

| File | Description |
|------|-------------|
| `simple-mcp-server.js` | HTTP MCP server implementation |
| `mcp-stdio-server.js` | Stdio MCP server implementation |
| `mcp-discovery-server.js` | MCP discovery server implementation |
| `index.js` | Main edge function entry point |
| `services/` | Directory containing service implementations |
| `utils/` | Directory containing utility functions |

### Using Files from dist/:

You can directly use the files from the `dist/` directory in your applications:

```javascript
// Node.js example
const { GitHubProjectsAPI } = require('./dist/services/github-projects');

const api = new GitHubProjectsAPI({
  token: process.env.GITHUB_TOKEN,
  organization: process.env.GITHUB_ORG
});

async function getProjects() {
  const projects = await api.listProjects();
  console.log(projects);
}

getProjects();
```

## Testing

### Testing MCP Integration

You can test the stdio server using the provided test script:

```bash
# Using the test script
cd /workspaces/edge-agents/supabase/functions/github-projects
node ./tests/mcp/test-stdio-mcp.js

# Or directly with the built file
cd /workspaces/edge-agents/supabase/functions/github-projects
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05"}}' | node dist/mcp-stdio-server.js
```

For the HTTP server, you can use curl or any HTTP client:

```bash
curl -X GET http://localhost:8002/.well-known/mcp.json
curl -X GET http://localhost:8002/tools/list
```

### Testing SSE Integration

You can test the SSE endpoint using a simple HTML page:

```html
<!DOCTYPE html>
<html>
<head>
  <title>SSE Test</title>
</head>
<body>
  <h1>SSE Test</h1>
  <div id="events"></div>
  
  <script>
    const eventsDiv = document.getElementById('events');
    const eventSource = new EventSource('http://localhost:8002/sse');
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const eventElement = document.createElement('div');
      eventElement.textContent = JSON.stringify(data);
      eventsDiv.appendChild(eventElement);
    };
    
    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      eventSource.close();
    };
  </script>
</body>
</html>
```

## Implementation Details

The MCP and SSE integration consists of the following components:

1. **HTTP Server (`simple-mcp-server.js`)**: A Node.js HTTP server that implements the MCP protocol over HTTP.
2. **Stdio Server (`mcp-stdio-server.js`)**: A Node.js script that implements the MCP protocol over stdin/stdout.
3. **SSE Endpoint**: Implemented in the HTTP server to provide real-time updates.
4. **MCP Discovery Server**: A lightweight server focused on the discovery endpoint.
5. **Run Scripts**: Shell scripts to start the servers with the correct configuration.
6. **Test Scripts**: Scripts to test the functionality of the servers.

The implementation follows the MCP specification and provides a consistent interface across all transport methods.

## Choosing the Right Integration

- **HTTP MCP Server**: Best for web applications and remote clients
- **Stdio MCP Server**: Best for local tools and AI assistants
- **MCP Discovery Server**: Best for initial integration testing
- **SSE Endpoint**: Best for real-time updates in web applications

For most use cases, the HTTP MCP server with SSE support provides the most flexibility and features.