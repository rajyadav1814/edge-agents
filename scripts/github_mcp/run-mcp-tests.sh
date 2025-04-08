#!/bin/bash

# GitHub MCP Server Test Runner
# This script runs the comprehensive test suite for the GitHub MCP server

# Set default values
SERVER_URL=${MCP_SERVER_URL:-"http://localhost:3000"}
VERBOSE=${VERBOSE:-"false"}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --url=*)
      SERVER_URL="${1#*=}"
      shift
      ;;
    --token=*)
      GITHUB_TOKEN="${1#*=}"
      shift
      ;;
    --repo=*)
      TEST_REPO="${1#*=}"
      shift
      ;;
    --verbose)
      VERBOSE="true"
      shift
      ;;
    --help)
      echo "GitHub MCP Server Test Runner"
      echo ""
      echo "Usage: ./run-mcp-tests.sh [options]"
      echo ""
      echo "Options:"
      echo "  --url=URL       Set the MCP server URL (default: http://localhost:3000)"
      echo "  --token=TOKEN   Set the GitHub token for authentication"
      echo "  --repo=REPO     Set the test repository (format: owner/repo)"
      echo "  --verbose       Enable verbose output"
      echo "  --help          Show this help message"
      echo ""
      echo "Environment variables:"
      echo "  MCP_SERVER_URL  Server URL (can be used instead of --url)"
      echo "  GITHUB_TOKEN    GitHub token (can be used instead of --token)"
      echo "  TEST_REPO       Test repository (can be used instead of --repo)"
      echo "  VERBOSE         Enable verbose output (true/false)"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  echo "Error: Node.js is not installed"
  echo "Please install Node.js 14 or higher"
  exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
  echo "Error: npm is not installed"
  echo "Please install npm"
  exit 1
fi

# Set environment variables for the test script
export MCP_SERVER_URL="$SERVER_URL"
export VERBOSE="$VERBOSE"

# If GitHub token is provided, export it
if [ -n "$GITHUB_TOKEN" ]; then
  export GITHUB_TOKEN="$GITHUB_TOKEN"
fi

# If test repo is provided, export it
if [ -n "$TEST_REPO" ]; then
  export TEST_REPO="$TEST_REPO"
fi

# Navigate to the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if package.json exists, if not create it
if [ ! -f "package.json" ]; then
  echo "Creating package.json..."
  cat > package.json << EOF
{
  "name": "github-mcp-server-tests",
  "version": "1.0.0",
  "description": "Tests for GitHub MCP Server",
  "private": true,
  "dependencies": {
    "node-fetch": "^2.6.7",
    "dotenv": "^16.0.0",
    "chalk": "^4.1.2"
  }
}
EOF
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Run the test script
echo "Running GitHub MCP Server tests..."
echo "Server URL: $SERVER_URL"
echo "Verbose mode: $VERBOSE"
echo ""

node test-github-mcp-server.js

# Store the exit code
EXIT_CODE=$?

# Exit with the same code as the test script
exit $EXIT_CODE