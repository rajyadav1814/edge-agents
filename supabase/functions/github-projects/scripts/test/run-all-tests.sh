#!/bin/bash

# Script to run all GitHub API tests

# Check if GITHUB_TOKEN is set
if [ -z "$GITHUB_TOKEN" ]; then
  echo "Error: GITHUB_TOKEN environment variable is required"
  echo "Usage: GITHUB_TOKEN=your_token ./run-all-tests.sh"
  exit 1
fi

# Set default organization if not provided
GITHUB_ORG=${GITHUB_ORG:-"agenticsorg"}

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

echo "GitHub API Test Suite"
echo "====================="
echo "Organization: ${GITHUB_ORG}"
echo

# Run the tests
echo "1. Creating a simple project (GraphQL API v4)..."
${SCRIPT_DIR}/test-create-project-v4.sh
echo

echo "2. Creating a project with tasks..."
${SCRIPT_DIR}/create-project-with-tasks.sh
echo

echo "3. Cleaning up test projects..."
echo "y" | ${SCRIPT_DIR}/cleanup-test-projects.sh
echo

echo "All tests completed successfully!"