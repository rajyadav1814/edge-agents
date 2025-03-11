#!/bin/bash

# Source environment variables from root .env
source "/workspaces/edge-agents/.env"

# Check if required environment variables are set
if [ -z "$SUPABASE_PROJECT_ID" ] || [ -z "$SUPABASE_PERSONAL_ACCESS_TOKEN" ]; then
  echo "Error: Required environment variables SUPABASE_PROJECT_ID and SUPABASE_PERSONAL_ACCESS_TOKEN must be set"
  exit 1
fi

# Check if function slug is provided
if [ -z "$1" ]; then
  echo "Error: Function slug must be provided"
  echo "Usage: $0 <function-slug>"
  exit 1
fi

FUNCTION_SLUG="$1"
API_URL="https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_ID}/functions/${FUNCTION_SLUG}/body"

# Get function body
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
echo "Function Body:"
echo "$response" | jq .