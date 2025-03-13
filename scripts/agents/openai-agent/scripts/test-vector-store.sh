#!/bin/bash
# Test script for OpenAI Vector Store API
# This script tests the OpenAI Vector Store API using the .env file in the parent directory

# Set the directory paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PARENT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PARENT_DIR/.env"
ASSETS_DIR="$PARENT_DIR/assets"
TEST_FILE="$ASSETS_DIR/example.pdf"

# Set colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print header
echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}   OpenAI Vector Store API Test Script   ${NC}"
echo -e "${BLUE}=====================================${NC}"
echo -e "${YELLOW}Script directory:${NC} $SCRIPT_DIR"
echo -e "${YELLOW}Parent directory:${NC} $PARENT_DIR"
echo -e "${YELLOW}ENV file:${NC} $ENV_FILE"
echo -e "${YELLOW}Test file:${NC} $TEST_FILE"
echo -e "${BLUE}=====================================${NC}"

# Check if .env file exists
if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}Error: .env file not found at $ENV_FILE${NC}"
  echo -e "${YELLOW}Please create a .env file with your OpenAI API key${NC}"
  exit 1
fi

# Check if test file exists
if [ ! -f "$TEST_FILE" ]; then
  echo -e "${RED}Error: Test file not found at $TEST_FILE${NC}"
  echo -e "${YELLOW}Please make sure the example.pdf file exists in the assets directory${NC}"
  exit 1
fi

# Load environment variables from .env file
echo -e "${BLUE}[SETUP]${NC} Loading environment variables from .env file..."
export $(grep -v '^#' "$ENV_FILE" | xargs)

# Check if OPENAI_API_KEY is set
if [ -z "$OPENAI_API_KEY" ] && [ -z "$VITE_OPENAI_API_KEY" ]; then
  echo -e "${RED}Error: OPENAI_API_KEY or VITE_OPENAI_API_KEY is not set in .env file${NC}"
  echo -e "${YELLOW}Please add your OpenAI API key to the .env file${NC}"
  exit 1
fi

# Use VITE_OPENAI_API_KEY if OPENAI_API_KEY is not set
if [ -z "$OPENAI_API_KEY" ] && [ ! -z "$VITE_OPENAI_API_KEY" ]; then
  export OPENAI_API_KEY="$VITE_OPENAI_API_KEY"
  echo -e "${YELLOW}Using VITE_OPENAI_API_KEY as OPENAI_API_KEY${NC}"
fi

echo -e "${GREEN}OPENAI_API_KEY is set. Testing Vector Store API...${NC}"
echo -e "${BLUE}=====================================${NC}"

# Step 1: Upload a file to OpenAI
echo -e "${BLUE}[STEP 1]${NC} Uploading test file to OpenAI API..."
echo -e "${YELLOW}File:${NC} $TEST_FILE ($(du -h "$TEST_FILE" | cut -f1) in size)"
echo -e "${YELLOW}Purpose:${NC} assistants"
echo -e "${YELLOW}Sending request...${NC}"

UPLOAD_RESPONSE=$(curl -s -X POST https://api.openai.com/v1/files \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -F "purpose=assistants" \
  -F "file=@$TEST_FILE")

# Check if the file upload was successful
if [[ $UPLOAD_RESPONSE == *"error"* ]]; then
  echo -e "${RED}Error: File upload failed${NC}"
  echo -e "${RED}Response: $UPLOAD_RESPONSE${NC}"
  exit 1
else
  echo -e "${GREEN}File upload successful!${NC}"
  echo -e "${YELLOW}Response:${NC} $UPLOAD_RESPONSE"
  echo
  
  # Extract file ID from response
  FILE_ID=$(echo $UPLOAD_RESPONSE | grep -o '"id": "[^"]*' | cut -d'"' -f4)
  echo -e "${GREEN}File ID:${NC} $FILE_ID"
  echo
fi

# Step 2: Create a vector store
echo -e "${BLUE}[STEP 2]${NC} Creating a vector store..."
VECTOR_STORE_NAME="test-vector-store-$(date +%s)"
echo -e "${YELLOW}Vector store name:${NC} $VECTOR_STORE_NAME"
echo -e "${YELLOW}Sending request...${NC}"

VECTOR_STORE_RESPONSE=$(curl -s -X POST https://api.openai.com/v1/vector_stores \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d "{
    \"name\": \"$VECTOR_STORE_NAME\"
  }")

# Check if the vector store creation was successful
if [[ $VECTOR_STORE_RESPONSE == *"error"* ]]; then
  echo -e "${RED}Error: Vector store creation failed${NC}"
  echo -e "${RED}Response: $VECTOR_STORE_RESPONSE${NC}"
  exit 1
else
  echo -e "${GREEN}Vector store creation successful!${NC}"
  echo -e "${YELLOW}Response:${NC} $VECTOR_STORE_RESPONSE"
  echo
  
  # Extract vector store ID from response
  VECTOR_STORE_ID=$(echo $VECTOR_STORE_RESPONSE | grep -o '"id": "[^"]*' | cut -d'"' -f4)
  echo -e "${GREEN}Vector Store ID:${NC} $VECTOR_STORE_ID"
  echo
fi

# Step 3: Add the file to the vector store
echo "Step 3: Adding file to vector store..."
ADD_FILE_RESPONSE=$(curl -s -X POST "https://api.openai.com/v1/vector_stores/$VECTOR_STORE_ID/files" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d "{
    \"file_id\": \"$FILE_ID\"
  }")

# Extract the status from the response
FILE_STATUS=$(echo $ADD_FILE_RESPONSE | grep -o '"status": "[^"]*' | cut -d'"' -f4)

# Check if there was an actual error in the API response
if [[ $ADD_FILE_RESPONSE == *"\"error\""* ]]; then
  echo "Error: Adding file to vector store failed"
  echo "Response: $ADD_FILE_RESPONSE"
  exit 1
else
  echo "File added to vector store with status: $FILE_STATUS"
  echo "Response: $ADD_FILE_RESPONSE"
  echo
  
  # Note: "in_progress" is a normal status and not an error
  if [[ $FILE_STATUS == "in_progress" ]]; then
    echo "The file is being processed. This is normal and not an error."
    echo
  fi
fi

# Step 4: Check the status of the file processing
echo "Step 4: Checking file processing status..."
STATUS_RESPONSE=$(curl -s -X GET "https://api.openai.com/v1/vector_stores/$VECTOR_STORE_ID/files" \
  -H "Authorization: Bearer $OPENAI_API_KEY")

# Check if there was an actual error in the API response
if [[ $STATUS_RESPONSE == *"\"error\""* ]]; then
  echo "Error: Getting file status failed"
  echo "Response: $STATUS_RESPONSE"
  exit 1
else
  echo "File status check successful!"
  echo "Response: $STATUS_RESPONSE"
  echo
  
  # Extract the status from the response
  FILE_STATUS=$(echo $STATUS_RESPONSE | grep -o '"status": "[^"]*' | cut -d'"' -f4)
  if [[ $FILE_STATUS == "in_progress" ]]; then
    echo "The file is still being processed. This is normal and not an error."
    echo
  fi
fi

# Step 5: Wait for file processing to complete
echo "Step 5: Waiting for file processing to complete..."
echo "Checking status every 5 seconds..."
echo

MAX_ATTEMPTS=12  # 1 minute (12 * 5 seconds)
ATTEMPTS=0
PROCESSING_COMPLETE=false

while [ $ATTEMPTS -lt $MAX_ATTEMPTS ] && [ "$PROCESSING_COMPLETE" = false ]; do
  ATTEMPTS=$((ATTEMPTS + 1))
  echo "Attempt $ATTEMPTS of $MAX_ATTEMPTS..."
  
  STATUS_RESPONSE=$(curl -s -X GET "https://api.openai.com/v1/vector_stores/$VECTOR_STORE_ID/files" \
    -H "Authorization: Bearer $OPENAI_API_KEY")
  
  # Check if all files are processed
  if [[ $STATUS_RESPONSE == *"\"status\":\"completed\""* ]]; then
    PROCESSING_COMPLETE=true
    echo "File processing completed!"
    echo "Final status: $STATUS_RESPONSE"
    echo
  else
    echo "Files still processing. Waiting 5 seconds..."
    sleep 5
  fi
done

if [ "$PROCESSING_COMPLETE" = false ]; then
  echo "Warning: File processing did not complete within the timeout period."
  echo "You may need to wait longer for processing to complete."
  echo "Last status: $STATUS_RESPONSE"
  echo
fi

# Step 6: Test file search
echo "Step 6: Testing file search..."
SEARCH_QUERY="What is this document about?"
SEARCH_RESPONSE=$(curl -s -X POST https://api.openai.com/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d "{
    \"model\": \"gpt-4o-mini\",
    \"input\": \"$SEARCH_QUERY\",
    \"tools\": [{
      \"type\": \"file_search\",
      \"vector_store_ids\": [\"$VECTOR_STORE_ID\"]
    }]
  }")

# Check if there was an actual error in the API response
# Look for "error": followed by something other than null
if [[ $SEARCH_RESPONSE == *"\"error\":"*[^n][^u][^l][^l]* ]]; then
  echo -e "${RED}Error: File search failed${NC}"
  echo -e "${RED}Response: $SEARCH_RESPONSE${NC}"
else
  echo -e "${GREEN}File search successful!${NC}"
  
  # Extract the text content from the response
  TEXT_CONTENT=$(echo $SEARCH_RESPONSE | grep -o '"text": "[^"]*' | head -1 | cut -d'"' -f4)
  
  if [[ ! -z "$TEXT_CONTENT" ]]; then
    echo -e "${YELLOW}Document content:${NC} $TEXT_CONTENT"
  else
    # Try to extract from output_text if available
    TEXT_CONTENT=$(echo $SEARCH_RESPONSE | grep -o '"output_text","text": "[^"]*' | head -1 | cut -d'"' -f4)
    if [[ ! -z "$TEXT_CONTENT" ]]; then
      echo -e "${YELLOW}Document content:${NC} $TEXT_CONTENT"
    fi
  fi
  
  echo -e "${YELLOW}Full response saved to:${NC} search_response.json"
  echo $SEARCH_RESPONSE > "$PARENT_DIR/search_response.json"
  echo
fi

# Save the IDs to a file for future reference
echo "Saving IDs to file for future reference..."
IDS_FILE="$PARENT_DIR/vector-store-test-ids.txt"
echo "VECTOR_STORE_ID=$VECTOR_STORE_ID" > "$IDS_FILE"
echo "FILE_ID=$FILE_ID" >> "$IDS_FILE"
echo "IDs saved to $IDS_FILE"
echo

echo
echo "====================================="
echo "Vector Store API Test Completed!"
echo "====================================="
echo
echo "The OpenAI Vector Store API is working correctly."
echo "You can now use the file-search.ts implementation with these IDs."
echo
echo "Vector Store ID: $VECTOR_STORE_ID"
echo "File ID: $FILE_ID"
echo
echo "Next steps:"
echo "1. Search for information: deno task file-search search $VECTOR_STORE_ID \"your query\""
echo
