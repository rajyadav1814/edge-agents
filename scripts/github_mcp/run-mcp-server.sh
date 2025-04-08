#!/bin/bash

# GitHub MCP Server Runner Script
# This script builds and runs the GitHub MCP server

# Function to validate environment variables
validate_env_vars() {
  local missing_vars=()
  
  # Check for required environment variables
  if [ -z "$GITHUB_PERSONAL_ACCESS_TOKEN" ]; then
    missing_vars+=("GITHUB_PERSONAL_ACCESS_TOKEN")
  fi
  
  # Add validation for other required variables if needed
  # if [ -z "$ANOTHER_REQUIRED_VAR" ]; then
  #   missing_vars+=("ANOTHER_REQUIRED_VAR")
  # fi
  
  # If any required variables are missing, display error message
  if [ ${#missing_vars[@]} -gt 0 ]; then
    echo "ERROR: The following required environment variables are not set:"
    for var in "${missing_vars[@]}"; do
      echo "  - $var"
    done
    echo ""
    echo "Please set these variables before running this script."
    echo "You can set them by running: export VARIABLE_NAME=your_value_here"
    echo ""
    echo "Alternatively, you can create a .env file and source it before running this script:"
    echo "  1. cp .env.example .env"
    echo "  2. Edit .env with your values"
    echo "  3. source .env"
    echo ""
    
    # Ask if user wants to continue without required variables
    read -p "Do you want to continue anyway? This is not recommended for production use. (y/N): " continue_anyway
    if [[ ! "$continue_anyway" =~ ^[Yy]$ ]]; then
      echo "Exiting..."
      exit 1
    fi
    echo "Continuing with missing environment variables..."
  fi
}

# Function to check Go installation
check_go() {
  if ! command -v go &> /dev/null; then
    echo "ERROR: Go is not installed or not in PATH."
    echo "Please install Go before running this script."
    exit 1
  fi
}

# Function to load environment variables from .env file if it exists
load_env_file() {
  if [ -f .env ]; then
    echo "Loading environment variables from .env file..."
    set -a
    source .env
    set +a
  else
    echo "No .env file found. Using environment variables from current shell."
    echo "To create a .env file: cp .env.example .env and edit with your values."
  fi
}

# Load environment variables from .env file if it exists
load_env_file

# Validate environment variables
validate_env_vars

# Check Go installation
check_go

# Set default values for non-critical environment variables
MCP_PORT=${MCP_PORT:-3000}
LOG_LEVEL=${LOG_LEVEL:-"info"}
VALIDATE_TOKENS=${VALIDATE_TOKENS:-"true"}
REQUEST_TIMEOUT=${REQUEST_TIMEOUT:-30000}
GITHUB_RATE_LIMIT=${GITHUB_RATE_LIMIT:-5000}

echo "Building GitHub MCP Server..."
go build -o github-mcp-server ./cmd/github-mcp-server

echo "Starting GitHub MCP Server on port $MCP_PORT..."
echo "Note: Make sure you've set your GITHUB_PERSONAL_ACCESS_TOKEN environment variable"

# Display token status without revealing the actual token
if [ -n "$GITHUB_PERSONAL_ACCESS_TOKEN" ]; then
  TOKEN_LENGTH=${#GITHUB_PERSONAL_ACCESS_TOKEN}
  VISIBLE_CHARS=3
  HIDDEN_CHARS=$((TOKEN_LENGTH - VISIBLE_CHARS))
  HIDDEN_STRING=$(printf '%*s' "$HIDDEN_CHARS" | tr ' ' '*')
  echo "Current token status: ${GITHUB_PERSONAL_ACCESS_TOKEN:0:3}$HIDDEN_STRING (${TOKEN_LENGTH} characters)"
else
  echo "Current token status: Not set"
fi

# Export all environment variables for the server
export GITHUB_PERSONAL_ACCESS_TOKEN
export MCP_PORT
export LOG_LEVEL
export VALIDATE_TOKENS
export REQUEST_TIMEOUT
export GITHUB_RATE_LIMIT

# Run the server
./github-mcp-server

# Check if server started successfully
if [ $? -ne 0 ]; then
  echo "❌ Failed to start the server. Check the error message above."
  exit 1
fi