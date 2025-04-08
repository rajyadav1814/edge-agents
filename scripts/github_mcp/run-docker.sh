#!/bin/bash

# GitHub MCP Server Docker Runner Script
# This script builds and runs the GitHub MCP server in a Docker container

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

# Function to check Docker installation
check_docker() {
  if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed or not in PATH."
    echo "Please install Docker before running this script."
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

# Check Docker installation
check_docker

echo "Building Docker image for GitHub MCP Server..."
docker build -t github-mcp-server .

# Set default port or use MCP_PORT if defined
MCP_PORT=${MCP_PORT:-3000}
echo "Starting GitHub MCP Server container on port $MCP_PORT..."

# Check if container already exists and remove it
if docker ps -a | grep -q github-mcp-server; then
  echo "Removing existing github-mcp-server container..."
  docker rm -f github-mcp-server > /dev/null 2>&1
fi

# Run the container with environment variables
docker run -d \
  -p $MCP_PORT:$MCP_PORT \
  -e GITHUB_PERSONAL_ACCESS_TOKEN=${GITHUB_PERSONAL_ACCESS_TOKEN:-""} \
  -e MCP_PORT=$MCP_PORT \
  -e LOG_LEVEL=${LOG_LEVEL:-"info"} \
  -e VALIDATE_TOKENS=${VALIDATE_TOKENS:-"true"} \
  -e REQUEST_TIMEOUT=${REQUEST_TIMEOUT:-30000} \
  -e GITHUB_RATE_LIMIT=${GITHUB_RATE_LIMIT:-5000} \
  --name github-mcp-server \
  github-mcp-server

# Check if container started successfully
if [ $? -eq 0 ]; then
  echo "✅ Container started successfully!"
  echo "To view logs, run: docker logs github-mcp-server"
  echo "To stop the server, run: docker stop github-mcp-server"
  echo "To remove the container, run: docker rm github-mcp-server"
else
  echo "❌ Failed to start container. Check the error message above."
fi