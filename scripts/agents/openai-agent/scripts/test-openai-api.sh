#!/bin/bash
# Test script for OpenAI API
# This script tests the OpenAI API using the .env file in the parent directory

# Set the directory paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PARENT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PARENT_DIR/.env"

# Print header
echo "====================================="
echo "OpenAI API Test Script"
echo "====================================="
echo "Script directory: $SCRIPT_DIR"
echo "Parent directory: $PARENT_DIR"
echo "ENV file: $ENV_FILE"
echo "====================================="

# Check if .env file exists
if [ ! -f "$ENV_FILE" ]; then
  echo "Error: .env file not found at $ENV_FILE"
  echo "Please create a .env file with your OpenAI API key"
  exit 1
fi

# Load environment variables from .env file
echo "Loading environment variables from .env file..."
export $(grep -v '^#' "$ENV_FILE" | xargs)

# Check if OPENAI_API_KEY is set
if [ -z "$OPENAI_API_KEY" ] && [ -z "$VITE_OPENAI_API_KEY" ]; then
  echo "Error: OPENAI_API_KEY or VITE_OPENAI_API_KEY is not set in .env file"
  echo "Please add your OpenAI API key to the .env file"
  exit 1
fi

# Use VITE_OPENAI_API_KEY if OPENAI_API_KEY is not set
if [ -z "$OPENAI_API_KEY" ] && [ ! -z "$VITE_OPENAI_API_KEY" ]; then
  export OPENAI_API_KEY="$VITE_OPENAI_API_KEY"
  echo "Using VITE_OPENAI_API_KEY as OPENAI_API_KEY"
fi

echo "OPENAI_API_KEY is set. Testing API..."
echo

# Test OpenAI API with a simple request
echo "Making a simple request to OpenAI API..."
RESPONSE=$(curl -s -X POST https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "Say hello world"}],
    "max_tokens": 1000
  }')

# Check if the request was successful
if [[ $RESPONSE == *"error"* ]]; then
  echo "Error: API request failed"
  echo "Response: $RESPONSE"
  exit 1
else
  echo "API request successful!"
  echo "Response: $RESPONSE"
  echo
fi

# Test file upload API
echo "Testing file upload API..."
echo "Creating a temporary test file..."
TEST_FILE="$SCRIPT_DIR/test-file.txt"
echo "This is a test file for OpenAI API" > "$TEST_FILE"

echo "Uploading test file to OpenAI API..."
UPLOAD_RESPONSE=$(curl -s -X POST https://api.openai.com/v1/files \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -F "purpose=assistants" \
  -F "file=@$TEST_FILE")

# Check if the file upload was successful
if [[ $UPLOAD_RESPONSE == *"error"* ]]; then
  echo "Error: File upload failed"
  echo "Response: $UPLOAD_RESPONSE"
  rm "$TEST_FILE"
  exit 1
else
  echo "File upload successful!"
  echo "Response: $UPLOAD_RESPONSE"
  echo
  
  # Extract file ID from response
  FILE_ID=$(echo $UPLOAD_RESPONSE | grep -o '"id": "[^"]*' | cut -d'"' -f4)
  echo "File ID: $FILE_ID"
  echo
fi

# Clean up
echo "Cleaning up..."
rm "$TEST_FILE"
echo "Temporary test file removed"

echo
echo "====================================="
echo "API Test Completed Successfully!"
echo "====================================="
echo
echo "The OpenAI API is working correctly."
echo "You can now use the file-search.ts implementation."
echo
echo "Next steps:"
echo "1. Create a vector store: deno task file-search create-store my-knowledge-base"
echo "2. Upload a file: deno task file-search upload-file ./assets/example.pdf"
echo "3. Add file to vector store: deno task file-search add-file vector_store_id file_id"
echo "4. Search for information: deno task file-search search vector_store_id \"your query\""
echo
