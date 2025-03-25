#!/bin/bash
# Script to run SPARC2 MCP examples

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

# Check if .env file exists
if [ ! -f "$ROOT_DIR/config/.env" ]; then
  echo "No .env file found. Creating from .env.example..."
  cp "$ROOT_DIR/config/.env.example" "$ROOT_DIR/config/.env"
  echo "Please edit $ROOT_DIR/config/.env to add your API keys."
  exit 1
fi

# Make all example scripts executable
chmod +x "$SCRIPT_DIR"/*.js

# Function to run an example
run_example() {
  local example=$1
  echo "========================================"
  echo "Running example: $example"
  echo "========================================"
  node "$SCRIPT_DIR/$example"
  echo ""
  echo "Example completed."
  echo "========================================"
  echo ""
}

# Check if a specific example was requested
if [ $# -eq 1 ]; then
  if [ -f "$SCRIPT_DIR/$1" ]; then
    run_example "$1"
  else
    echo "Example $1 not found."
    exit 1
  fi
else
  # Run the basic example
  run_example "basic-example.js"
fi

echo "All examples completed successfully."