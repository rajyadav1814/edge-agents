#!/bin/bash

# Source environment variables from root .env
source "/workspaces/edge-agents/.env"

# Check if required environment variables are set
if [ -z "$VITE_SUPABASE_PROJECT_ID" ] || [ -z "$SUPABASE_PERSONAL_ACCESS_TOKEN" ]; then
  echo "Error: Required environment variables VITE_SUPABASE_PROJECT_ID and SUPABASE_PERSONAL_ACCESS_TOKEN must be set"
  exit 1
fi

# Check if function slug and file path are provided
if [ -z "$1" ] || [ -z "$2" ]; then
  echo "Error: Function slug and file path must be provided"
  echo "Usage: $0 <function-slug> <file-path>"
  exit 1
fi

FUNCTION_SLUG="$1"
FILE_PATH="$2"
API_URL="https://api.supabase.com/v1/projects/${VITE_SUPABASE_PROJECT_ID}/functions"

# Check if file exists
if [ ! -f "$FILE_PATH" ]; then
  echo "Error: File not found: $FILE_PATH"
  exit 1
fi

# Read file content
CONTENT=$(cat "$FILE_PATH")

# Create a temporary file for the request body
REQUEST_BODY=$(mktemp)

# Create JSON request body
cat > "$REQUEST_BODY" << EOF
{
  "slug": "${FUNCTION_SLUG}",
  "name": "${FUNCTION_SLUG}",
  "body": $(jq -Rs . <<< "$CONTENT"),
  "verify_jwt": true
}
EOF

# Deploy function
response=$(curl --silent --location "${API_URL}" \
  --header "Authorization: Bearer ${SUPABASE_PERSONAL_ACCESS_TOKEN}" \
  --header "Content-Type: application/json" \
  --data @"$REQUEST_BODY")

# Check if the response is valid JSON
if ! echo "$response" | jq . > /dev/null 2>&1; then
  echo "Error: Invalid response received"
  echo "$response"
  rm "$REQUEST_BODY"
  exit 1
fi

# Pretty print the response
echo "Deployment Result:"
echo "$response" | jq .

# Clean up
rm "$REQUEST_BODY"

echo "Function deployed successfully!"