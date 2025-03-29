#!/bin/bash
# Example 8: Running an MCP Server
# This example demonstrates how to run a Model Context Protocol (MCP) server

# Set the current directory to the script directory
cd "$(dirname "$0")"
cd ..

echo "=== SPARC2 MCP Server Example ==="
echo "Starting an MCP server on port 3001..."

# Run the MCP server
./sparc mcp --port 3001 --model gpt-4o --mode automatic

# Note: This will start a long-running server process
# To interact with the server, you can use curl or any HTTP client:
#
# Example curl commands:
#
# 1. List available tools:
# curl http://localhost:3001/list_tools
#
# 2. Analyze code:
# curl -X POST http://localhost:3001/analyze \
#   -H "Content-Type: application/json" \
#   -d '{"files": ["path/to/file.js"], "task": "Find bugs"}'
#
# 3. Modify code:
# curl -X POST http://localhost:3001/modify \
#   -H "Content-Type: application/json" \
#   -d '{"files": ["path/to/file.js"], "task": "Fix bugs"}'
#
# 4. Execute code:
# curl -X POST http://localhost:3001/execute \
#   -H "Content-Type: application/json" \
#   -d '{"code": "console.log(\"Hello, world!\")", "language": "javascript"}'