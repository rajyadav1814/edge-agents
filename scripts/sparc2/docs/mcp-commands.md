# SPARC2 MCP Commands

SPARC2 provides two different ways to use the Model Context Protocol (MCP):

## API Server

The `api` command starts an HTTP server that implements the MCP protocol over HTTP:

```bash
sparc2 api [options]
```

Options:
- `--port, -p`: Port to run the API server on (default: 3001)
- `--model`: Model to use for the agent
- `--mode`: Execution mode (automatic, semi, manual, custom, interactive)
- `--diff-mode`: Diff mode (file, function)
- `--processing`: Processing mode (sequential, parallel, concurrent, swarm)
- `--config, -c`: Path to the agent configuration file

This is useful for integrations that communicate with SPARC2 over HTTP.

## MCP Stdio Server

The `mcp` command starts a server that implements the MCP protocol over standard input/output (stdio):

```bash
sparc2 mcp [options]
```

Options:
- `--model`: Model to use for the agent
- `--mode`: Execution mode (automatic, semi, manual, custom, interactive)
- `--diff-mode`: Diff mode (file, function)
- `--processing`: Processing mode (sequential, parallel, concurrent, swarm)
- `--config, -c`: Path to the agent configuration file

This is useful for integrations with tools like VS Code extensions that communicate with SPARC2 over stdio.

## Implementation Details

The MCP stdio server uses a Node.js wrapper (`mcpServerWrapper.js`) that:

1. Starts the SPARC2 HTTP server in the background
2. Creates an MCP server that communicates over stdio
3. Forwards requests from the stdio transport to the HTTP server

The wrapper automatically detects the Deno executable in various common installation locations, making it portable across different systems.