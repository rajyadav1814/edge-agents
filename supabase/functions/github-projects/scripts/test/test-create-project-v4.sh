#!/bin/bash

# Test script for creating a GitHub project via the GraphQL API v4

# Configuration
API_URL="https://api.github.com/graphql"
TIMESTAMP=$(date +%Y%m%d%H%M%S)
PROJECT_TITLE="Test Project ${TIMESTAMP}"
PROJECT_BODY="This is a test project created via API at $(date)"

# Print test information
echo "GitHub GraphQL API - Project Creation Test"
echo "=========================================="
echo "Creating project with title: ${PROJECT_TITLE}"
echo "Description: ${PROJECT_BODY}"
echo

# Make the API request
echo "Sending request to: ${API_URL}"
echo

# First, get the organization ID
ORG_QUERY='{
  "query": "query { organization(login: \"agenticsorg\") { id } }"
}'

echo "Getting organization ID..."
ORG_RESPONSE=$(curl -s -X POST \
  -H "Authorization: bearer ${GITHUB_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "${ORG_QUERY}" \
  "${API_URL}")

echo "Organization response:"
echo "${ORG_RESPONSE}" | jq .
echo

# Extract the organization ID
ORG_ID=$(echo "${ORG_RESPONSE}" | jq -r '.data.organization.id')

if [ "${ORG_ID}" = "null" ]; then
  echo "Error: Could not get organization ID. Check your token permissions."
  exit 1
fi

echo "Organization ID: ${ORG_ID}"
echo

# Create the project
PROJECT_QUERY='{
  "query": "mutation($ownerId: ID!, $title: String!) { createProjectV2(input: {ownerId: $ownerId, title: $title}) { projectV2 { id title number url } } }",
  "variables": {
    "ownerId": "'"${ORG_ID}"'",
    "title": "'"${PROJECT_TITLE}"'"
  }
}'

echo "Creating project..."
PROJECT_RESPONSE=$(curl -s -X POST \
  -H "Authorization: bearer ${GITHUB_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "${PROJECT_QUERY}" \
  "${API_URL}")

echo "Project creation response:"
echo "${PROJECT_RESPONSE}" | jq .

echo
echo "Test completed"