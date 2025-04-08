#!/bin/bash

# Script to clean up test projects created during testing
# This script will delete all projects with "Test Project" in the title

# Configuration
GITHUB_TOKEN=${GITHUB_TOKEN:-""}
GITHUB_ORG=${GITHUB_ORG:-"agenticsorg"}
API_URL="https://api.github.com/graphql"

# Check if token is provided
if [ -z "$GITHUB_TOKEN" ]; then
  echo "Error: GITHUB_TOKEN environment variable is required"
  echo "Usage: GITHUB_TOKEN=your_token ./cleanup-test-projects.sh"
  exit 1
fi

echo "GitHub API - Test Project Cleanup"
echo "================================="
echo "Looking for test projects in organization: ${GITHUB_ORG}"
echo

# First, list all projects
PROJECTS_QUERY='{
  "query": "query { organization(login: \"'$GITHUB_ORG'\") { projectsV2(first: 20) { nodes { id number title url } } } }"
}'

PROJECTS_RESPONSE=$(curl -s -X POST \
  -H "Authorization: bearer ${GITHUB_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "${PROJECTS_QUERY}" \
  "${API_URL}")

# Extract test projects (those with "Test Project" in the title)
TEST_PROJECTS=$(echo "${PROJECTS_RESPONSE}" | jq -r '.data.organization.projectsV2.nodes[] | select(.title | contains("Test Project")) | {id, number, title}')

if [ -z "${TEST_PROJECTS}" ]; then
  echo "No test projects found."
  exit 0
fi

echo "Found the following test projects:"
echo "${TEST_PROJECTS}" | jq -r '. | "#\(.number): \(.title)"'
echo

# Confirm deletion
read -p "Do you want to delete these test projects? (y/n): " CONFIRM
if [ "${CONFIRM}" != "y" ]; then
  echo "Deletion cancelled."
  exit 0
fi

# Delete each test project
echo "${TEST_PROJECTS}" | jq -c '.' | while read -r PROJECT; do
  PROJECT_ID=$(echo "${PROJECT}" | jq -r '.id')
  PROJECT_NUMBER=$(echo "${PROJECT}" | jq -r '.number')
  PROJECT_TITLE=$(echo "${PROJECT}" | jq -r '.title')
  
  echo "Deleting project #${PROJECT_NUMBER}: ${PROJECT_TITLE}..."
  
  DELETE_QUERY='{
    "query": "mutation($projectId: ID!) { deleteProjectV2(input: {projectId: $projectId}) { clientMutationId } }",
    "variables": {
      "projectId": "'"${PROJECT_ID}"'"
    }
  }'
  
  DELETE_RESPONSE=$(curl -s -X POST \
    -H "Authorization: bearer ${GITHUB_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "${DELETE_QUERY}" \
    "${API_URL}")
  
  if echo "${DELETE_RESPONSE}" | jq -e '.errors' > /dev/null; then
    echo "Error deleting project #${PROJECT_NUMBER}:"
    echo "${DELETE_RESPONSE}" | jq '.errors'
  else
    echo "Project #${PROJECT_NUMBER} deleted successfully."
  fi
done

echo
echo "Cleanup completed."