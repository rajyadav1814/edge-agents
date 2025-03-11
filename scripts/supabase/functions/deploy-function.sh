#!/bin/bash

# Source environment variables from root .env
source "/workspaces/edge-agents/.env"

# Check if required environment variables are set
if [ -z "$SUPABASE_PROJECT_ID" ] || [ -z "$SB_ACCESS_TOKEN" ]; then
  echo "Error: Required environment variables SUPABASE_PROJECT_ID and SB_ACCESS_TOKEN must be set"
  exit 1
fi

# Check if function slug and file path are provided
if [ -z "$1" ] || [ -z "$2" ]; then
  echo "Usage: $0 <function-slug> <function-file-path>"
  echo "Example: $0 hello-world supabase/functions/hello-world/index.ts"
  exit 1
fi

FUNCTION_SLUG=$1
FUNCTION_FILE=$2

# Check if file exists
if [ ! -f "$FUNCTION_FILE" ]; then
  echo "Error: Function file not found at $FUNCTION_FILE"
  exit 1
fi

# Deploy the function
echo "Deploying function $FUNCTION_SLUG..."

curl --request POST \
  --url "https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_ID}/functions/deploy?slug=${FUNCTION_SLUG}" \
  --header "Authorization: Bearer ${SB_ACCESS_TOKEN}" \
  --header "content-type: multipart/form-data" \
  --form "metadata={ \"entrypoint_path\": \"index.ts\", \"name\": \"${FUNCTION_SLUG}\" }" \
  --form "file=@${FUNCTION_FILE}"
