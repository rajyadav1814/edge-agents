#!/bin/bash
# Script to run the SPARC2 MCP server

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Check if .env file exists
if [ ! -f "$SCRIPT_DIR/config/.env" ]; then
  echo "No .env file found. Creating from .env.example..."
  if [ -f "$SCRIPT_DIR/config/.env.example" ]; then
    cp "$SCRIPT_DIR/config/.env.example" "$SCRIPT_DIR/config/.env"
    echo "Please edit $SCRIPT_DIR/config/.env to add your API keys."
    exit 1
  else
    echo "No .env.example file found. Please create a .env file in the config directory."
    exit 1
  fi
fi

# Make sure the server script is executable
chmod +x "$SCRIPT_DIR/sparc2_mcp.js"

# Check if required directories exist
mkdir -p "$SCRIPT_DIR/data/vector-store"

# Run the server
echo "Starting SPARC2 MCP server..."
node "$SCRIPT_DIR/sparc2_mcp.js" "$@"