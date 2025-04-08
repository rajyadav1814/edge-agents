#!/bin/bash
# Script to run the SPARC2 MCP server directly

# Get the directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Default port
PORT=3001

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --port|-p)
      PORT="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--port PORT]"
      exit 1
      ;;
  esac
done

echo "Starting SPARC2 MCP server on port $PORT..."

# Run the MCP server using Deno directly
deno run --allow-read --allow-write --allow-env --allow-net --allow-run "$DIR/src/mcp/mcpServer-runner.ts" --port "$PORT"