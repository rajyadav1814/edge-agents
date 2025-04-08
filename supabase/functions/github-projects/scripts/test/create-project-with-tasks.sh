#!/bin/bash

# Script to create a GitHub project and add tasks to it

# Configuration
GITHUB_TOKEN=${GITHUB_TOKEN:-""}
GITHUB_ORG=${GITHUB_ORG:-"agenticsorg"}
API_URL="https://api.github.com/graphql"

# Check if token is provided
if [ -z "$GITHUB_TOKEN" ]; then
  echo "Error: GITHUB_TOKEN environment variable is required"
  echo "Usage: GITHUB_TOKEN=your_token ./create-project-with-tasks.sh"
  exit 1
fi

echo "GitHub API - Create Project with Tasks"
echo "====================================="

# Step 1: Get organization ID
echo "Getting organization ID..."
ORG_QUERY='{
  "query": "query { organization(login: \"'$GITHUB_ORG'\") { id } }"
}'

ORG_RESPONSE=$(curl -s -X POST \
  -H "Authorization: bearer ${GITHUB_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "${ORG_QUERY}" \
  "${API_URL}")

ORG_ID=$(echo "${ORG_RESPONSE}" | jq -r '.data.organization.id')

if [ "${ORG_ID}" = "null" ]; then
  echo "Error: Could not get organization ID. Check your token permissions."
  exit 1
fi

echo "Organization ID: ${ORG_ID}"
echo

# Step 2: Create a new project
PROJECT_TITLE="Development Tasks $(date +%Y%m%d%H%M%S)"
echo "Creating project: ${PROJECT_TITLE}..."

PROJECT_QUERY='{
  "query": "mutation($ownerId: ID!, $title: String!) { createProjectV2(input: {ownerId: $ownerId, title: $title}) { projectV2 { id title number url } } }",
  "variables": {
    "ownerId": "'"${ORG_ID}"'",
    "title": "'"${PROJECT_TITLE}"'"
  }
}'

PROJECT_RESPONSE=$(curl -s -X POST \
  -H "Authorization: bearer ${GITHUB_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "${PROJECT_QUERY}" \
  "${API_URL}")

if echo "${PROJECT_RESPONSE}" | jq -e '.errors' > /dev/null; then
  echo "Error creating project:"
  echo "${PROJECT_RESPONSE}" | jq '.errors'
  exit 1
fi

PROJECT_ID=$(echo "${PROJECT_RESPONSE}" | jq -r '.data.createProjectV2.projectV2.id')
PROJECT_NUMBER=$(echo "${PROJECT_RESPONSE}" | jq -r '.data.createProjectV2.projectV2.number')
PROJECT_URL=$(echo "${PROJECT_RESPONSE}" | jq -r '.data.createProjectV2.projectV2.url')

echo "Project created successfully:"
echo "- ID: ${PROJECT_ID}"
echo "- Number: ${PROJECT_NUMBER}"
echo "- URL: ${PROJECT_URL}"
echo

# Step 3: Create draft issues as tasks
echo "Adding tasks to the project..."

# Function to add a draft issue to the project
add_draft_issue() {
  local project_id=$1
  local title=$2
  local body=$3
  
  DRAFT_ISSUE_QUERY='{
    "query": "mutation($projectId: ID!, $title: String!, $body: String) { addProjectV2DraftIssue(input: {projectId: $projectId, title: $title, body: $body}) { projectItem { id } } }",
    "variables": {
      "projectId": "'"${project_id}"'",
      "title": "'"${title}"'",
      "body": "'"${body}"'"
    }
  }'
  
  DRAFT_RESPONSE=$(curl -s -X POST \
    -H "Authorization: bearer ${GITHUB_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "${DRAFT_ISSUE_QUERY}" \
    "${API_URL}")
  
  if echo "${DRAFT_RESPONSE}" | jq -e '.errors' > /dev/null; then
    echo "Error adding draft issue '${title}':"
    echo "${DRAFT_RESPONSE}" | jq '.errors'
    return 1
  fi
  
  ITEM_ID=$(echo "${DRAFT_RESPONSE}" | jq -r '.data.addProjectV2DraftIssue.projectItem.id')
  echo "Added task: ${title} (ID: ${ITEM_ID})"
  return 0
}

# Add several tasks
add_draft_issue "${PROJECT_ID}" "Implement user authentication" "Create a secure authentication system with JWT tokens and refresh token rotation."
add_draft_issue "${PROJECT_ID}" "Design database schema" "Create an efficient and normalized database schema for the application."
add_draft_issue "${PROJECT_ID}" "Set up CI/CD pipeline" "Configure GitHub Actions for continuous integration and deployment."
add_draft_issue "${PROJECT_ID}" "Create API documentation" "Document all API endpoints using OpenAPI/Swagger."
add_draft_issue "${PROJECT_ID}" "Implement unit tests" "Achieve at least 80% code coverage with unit tests."

echo
echo "Project creation and task addition completed."
echo "View your project at: ${PROJECT_URL}"