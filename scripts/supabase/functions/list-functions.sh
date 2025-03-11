#!/bin/bash

# Source environment variables from root .env
source "/workspaces/edge-agents/.env"

# Check if required environment variables are set
if [ -z "$SUPABASE_PROJECT_ID" ] || [ -z "$SUPABASE_PERSONAL_ACCESS_TOKEN" ]; then
  echo "Error: Required environment variables SUPABASE_PROJECT_ID and SUPABASE_PERSONAL_ACCESS_TOKEN must be set"
  exit 1
fi

# Check if jq is installed
if ! command -v jq &> /dev/null; then
  echo "Error: jq is required but not installed. Please install jq to parse JSON responses."
  exit 1
fi

# Function to list all Edge Functions
list_functions() {
  echo "Fetching all Edge Functions for project: ${SUPABASE_PROJECT_ID}"
  
  response=$(curl --silent --location "https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_ID}/functions" \
    --header "Authorization: Bearer ${SUPABASE_PERSONAL_ACCESS_TOKEN}" \
    --header "Content-Type: application/json")
  
  # Check if the response is valid JSON
  if ! echo "$response" | jq . > /dev/null 2>&1; then
    echo "Error: Invalid response received"
    echo "$response"
    exit 1
  fi
  
  # Pretty print the response
  echo "Edge Functions:"
  echo "$response" | jq .
  
  # Count the number of functions
  function_count=$(echo "$response" | jq '. | length')
  echo "Total functions: $function_count"
}

# Execute the function
list_functions