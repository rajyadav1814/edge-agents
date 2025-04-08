#!/bin/bash

# SPARC2 SSE Example Runner
# This script runs the SSE streaming example for SPARC2

# Set strict mode
set -e

# Change to the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/.."

echo "SPARC2 SSE Streaming Example"
echo "============================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is required to run this example."
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if the example file exists
EXAMPLE_FILE="examples/sse-streaming.js"
if [ ! -f "$EXAMPLE_FILE" ]; then
    echo "Error: Example file not found: $EXAMPLE_FILE"
    exit 1
fi

echo "Starting SSE streaming server..."
echo "This will start two servers:"
echo "1. SPARC2 API server on port 3001"
echo "2. SSE wrapper server on port 3002"
echo ""
echo "Open http://localhost:3002 in your browser to see the example"
echo ""
echo "Press Ctrl+C to stop the servers"
echo ""

# Run the example
node "$EXAMPLE_FILE"