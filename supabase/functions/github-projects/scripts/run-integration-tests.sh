#!/bin/bash
# Run integration tests with environment variables from .env file

# Colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}GitHub API Edge Function - Integration Tests${NC}"

# Check if .env file exists
if [ ! -f .env ]; then
  echo -e "${RED}Error: .env file not found${NC}"
  exit 1
fi

# Load environment variables from .env file
echo "Loading environment variables from .env file..."
export $(grep -v '^#' .env | xargs)

# Display the environment variables (mask the token)
echo -e "${GREEN}Environment variables loaded:${NC}"
echo "GITHUB_ORG: $GITHUB_ORG"
echo "GITHUB_API_VERSION: $GITHUB_API_VERSION"
echo "CACHE_TTL: $CACHE_TTL"

# Mask the token for display
if [ -n "$GITHUB_TOKEN" ]; then
  TOKEN_PREVIEW="${GITHUB_TOKEN:0:4}...${GITHUB_TOKEN: -4}"
  echo "GITHUB_TOKEN: $TOKEN_PREVIEW"
else
  echo -e "${RED}GITHUB_TOKEN is not set${NC}"
  exit 1
fi

# Create a modified version of the integration tests that use index-test.ts
echo -e "\n${YELLOW}Creating modified integration test files...${NC}"

# Create a temporary directory for modified tests
TEMP_DIR="tests/temp"
mkdir -p $TEMP_DIR

# Copy and modify the integration test files
for TEST_FILE in tests/integration/*.test.ts; do
  FILENAME=$(basename $TEST_FILE)
  TEMP_FILE="$TEMP_DIR/$FILENAME"
  
  # Copy the file
  cp $TEST_FILE $TEMP_FILE
  
  # Replace import statements to use index-test.ts instead of index.ts
  sed -i 's/import { handleRequest } from "..\/..\/index.ts";/import { handleRequest } from "..\/..\/index-test.ts";/g' $TEMP_FILE
  
  echo "Modified $FILENAME"
done

# Run the tests
echo -e "\n${GREEN}Running integration tests...${NC}"
deno test --allow-net --allow-env $TEMP_DIR/*.test.ts

# Clean up
echo -e "\n${YELLOW}Cleaning up temporary files...${NC}"
rm -rf $TEMP_DIR

echo -e "\n${GREEN}Integration tests completed${NC}"