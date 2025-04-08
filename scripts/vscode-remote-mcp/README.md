# VSCode Remote MCP Server

This directory contains a Model Context Protocol (MCP) server implementation for VSCode Remote integration. The server provides tools for file operations, terminal commands, and editor interactions.

## Components

- **run-mcp-server.js**: The main MCP server implementation that handles file operations and command execution.
- **stdio-mcp-client.js**: A client that connects to the server using stdio protocol and provides an interface for VSCode extensions.
- **test-mcp-client.js**: A test client that verifies the functionality of the MCP server.
- **test-timeout-handling.js**: A specialized test for verifying timeout handling.

## Features

The MCP server provides the following tools:

- **list_files**: List files in a directory with optional recursive traversal.
- **read_file**: Read file contents with line numbers.
- **write_file**: Write content to a file.
- **execute_command**: Execute terminal commands and capture output.

## Protocol

The server implements a simplified version of the Model Context Protocol (MCP) using JSON-RPC 2.0 over stdio. The protocol supports the following methods:

- **mcp.discovery**: Get server information and capabilities.
- **mcp.listTools**: List available tools and their schemas.
- **mcp.callTool**: Execute a tool with specified arguments.

## Robust Error Handling

The implementation includes comprehensive error handling:

- **Timeout Handling**: All requests have a 30-second timeout by default.
- **Command Execution Timeout**: Commands executed with `execute_command` have a timeout of 29 seconds.
- **Automatic Retries**: The client automatically retries failed requests up to 3 times.
- **Server Health Monitoring**: The client monitors server health and restarts the server if it becomes unresponsive.
- **Graceful Recovery**: The client can recover from server crashes and timeouts.

## Server Health Monitoring

The stdio-mcp-client.js includes a robust server health monitoring system:

- **Regular Health Checks**: The client sends discovery requests every 10 seconds to verify server responsiveness.
- **Automatic Server Restart**: If the server becomes unresponsive, the client automatically restarts it.
- **Request Queuing**: Requests received while the server is starting are queued and processed once the server is ready.
- **Crash Recovery**: If the server crashes, it is automatically restarted.

## Usage

### Starting the Server

```bash
node run-mcp-server.js
```

### Using the Client

```bash
node stdio-mcp-client.js
```

### Testing the Server

```bash
node test-mcp-client.js
```

### Testing Timeout Handling

```bash
node test-timeout-handling.js
```

## Integration with VSCode

The stdio-mcp-client.js script is designed to be used as a bridge between VSCode extensions and the MCP server. It:

1. Starts the MCP server as a child process
2. Forwards messages from VSCode to the server
3. Forwards responses from the server to VSCode
4. Handles timeouts and server errors gracefully
5. Automatically restarts the server if it crashes or becomes unresponsive

## Example Request

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "mcp.callTool",
  "params": {
    "name": "read_file",
    "arguments": {
      "path": "/path/to/file.txt"
    }
  }
}
```

## Example Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "1 | Line 1\n2 | Line 2\n3 | Line 3"
      }
    ],
    "text": "Line 1\nLine 2\nLine 3",
    "lines": 3
  }
}
```

## Notifications

The client sends various notifications to keep VSCode informed about the server status:

- **server_ready**: Sent when the server is ready to accept requests
- **discovery_complete**: Sent when the discovery request completes successfully
- **server_exit**: Sent when the server process exits
- **server_error**: Sent when the server process encounters an error
- **request_timeout**: Sent when a request times out
- **request_retry**: Sent when a request is being retried after a timeout
- **client_error**: Sent when the client encounters an uncaught exception

## Error Handling

Errors are returned as JSON-RPC 2.0 error objects:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32602,
    "message": "Path parameter is required"
  }
}
```

### Error Codes

- **-32700**: Parse error
- **-32600**: Invalid request
- **-32601**: Method not found
- **-32602**: Invalid params
- **-32603**: Internal error
- **-32001**: Request timeout

## Development

To extend the server with new tools:

1. Add the tool to the capabilities in the `handleDiscovery` function
2. Add the tool schema to the `handleListTools` function
3. Implement the tool function
4. Add the tool to the switch statement in the `processMessage` function

## Troubleshooting

If you encounter issues with the MCP server:

1. Check the server stderr output for error messages
2. Verify that the client and server are using compatible JSON-RPC formats
3. Ensure that file paths are valid and accessible
4. Check for timeout issues with long-running commands
5. The client will automatically restart the server if it becomes unresponsive
6. If automatic recovery fails, manually restart the client