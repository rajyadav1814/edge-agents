#!/bin/bash

# GitHub MCP Server Docker Compose Runner Script
# This script runs the GitHub MCP server using Docker Compose

# Function to validate environment variables
validate_env_vars() {
  local missing_vars=()
  
  # Check for required environment variables
  if [ -z "$GITHUB_TOKEN" ]; then
    missing_vars+=("GITHUB_TOKEN")
  fi
  
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

# Function to check Docker and Docker Compose installation
check_docker() {
  if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed or not in PATH."
    echo "Please install Docker before running this script."
    exit 1
  fi
  
  if ! command -v docker-compose &> /dev/null; then
    if ! docker compose version &> /dev/null; then
      echo "ERROR: Docker Compose is not installed or not in PATH."
      echo "Please install Docker Compose before running this script."
      exit 1
    else
      # Docker Compose V2 is available as a docker plugin
      DOCKER_COMPOSE="docker compose"
    fi
  else
    # Docker Compose V1 is available as a standalone command
    DOCKER_COMPOSE="docker-compose"
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

# Function to create required directories
create_directories() {
  # Create logs directory if it doesn't exist
  mkdir -p "${LOG_DIR:-./logs}"
  
  # Create certs directory if TLS is enabled
  if [ "${ENABLE_TLS:-false}" = "true" ]; then
    mkdir -p "${TLS_CERT_PATH%/*}"
    if [ ! -f "${TLS_CERT_PATH}" ] || [ ! -f "${TLS_KEY_PATH}" ]; then
      echo "WARNING: TLS is enabled but certificate files not found."
      echo "You need to provide valid certificate files at:"
      echo "  - ${TLS_CERT_PATH}"
      echo "  - ${TLS_KEY_PATH}"
    fi
  fi
}

# Load environment variables from .env file if it exists
load_env_file

# Validate environment variables
validate_env_vars

# Check Docker and Docker Compose installation
check_docker

# Create required directories
create_directories

# Set default version if not provided
VERSION=${VERSION:-latest}

echo "Starting GitHub MCP Server using Docker Compose..."
echo "Server will be available at http://localhost:${MCP_PORT:-3000}"

# Run Docker Compose
$DOCKER_COMPOSE up -d

# Check if containers started successfully
if [ $? -eq 0 ]; then
  echo "✅ Containers started successfully!"
  echo "To view logs, run: $DOCKER_COMPOSE logs -f"
  echo "To stop the server, run: $DOCKER_COMPOSE down"
else
  echo "❌ Failed to start containers. Check the error message above."
fi