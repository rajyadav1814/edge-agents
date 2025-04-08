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
API_URL="https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_ID}/functions/${FUNCTION_SLUG}"

# Delete function
echo "Deleting Edge Function: ${FUNCTION_SLUG}..."
response=$(curl --silent --location --request DELETE "${API_URL}" \
  --header "Authorization: Bearer ${SUPABASE_PERSONAL_ACCESS_TOKEN}")

# Check response
if [ $? -eq 0 ]; then
  echo "Function deleted successfully"
else
  echo "Error deleting function: $response"
  exit 1
fi