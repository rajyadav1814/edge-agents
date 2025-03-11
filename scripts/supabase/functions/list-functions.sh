#!/bin/bash

# Load environment variables
source .env

# Configuration
API_URL="https://api.supabase.com/v1/projects/${VITE_SUPABASE_PROJECT_ID}/functions"

# Function to list all Edge Functions
list_functions() {
  echo "Fetching all Edge Functions for project: ${VITE_SUPABASE_PROJECT_ID}"
  
  response=$(curl --silent --location "${API_URL}" \
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

# Check if jq is installed
if ! command -v jq &> /dev/null; then
  echo "Error: jq is required but not installed. Please install jq to parse JSON responses."
  exit 1
fi

# Execute the function
list_functions