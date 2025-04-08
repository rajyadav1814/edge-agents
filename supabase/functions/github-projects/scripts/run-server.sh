#!/bin/bash
# Run GitHub API server with real GitHub API

# Colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Define port
PORT=8001

echo -e "${YELLOW}GitHub API Edge Function - Live Server${NC}"

# Check if .env file exists
if [ ! -f .env ]; then
  echo -e "${RED}Error: .env file not found${NC}"
  echo "Creating a sample .env file..."
  
  # Create a sample .env file
  cat > .env << EOL
# GitHub API Edge Function - Environment Variables
GITHUB_TOKEN=your_github_token_here
GITHUB_ORG=ruvnet
GITHUB_API_VERSION=v3
CACHE_TTL=300
EOL
  
  echo -e "${GREEN}Sample .env file created${NC}"
  echo -e "${YELLOW}Please edit the .env file with your actual GitHub token${NC}"
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

# Test the GitHub token with a simple API call
echo -e "\n${YELLOW}Testing GitHub token...${NC}"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user)

if [ "$RESPONSE" -eq 200 ]; then
  echo -e "${GREEN}GitHub token is valid!${NC}"
else
  echo -e "${RED}GitHub token is invalid (HTTP $RESPONSE)${NC}"
  echo "Please check your token and try again"
  exit 1
fi

# Create a temporary file with modified port
echo -e "\n${YELLOW}Creating temporary server file with port $PORT...${NC}"
TEMP_FILE="index-server.ts"

# Copy the index-test.ts file
cat index-test.ts > $TEMP_FILE

# Replace the port in the serve function call
sed -i "s/serve(handleRequest)/serve(handleRequest, { port: $PORT })/g" $TEMP_FILE

# Run the server
echo -e "\n${GREEN}Starting GitHub API server on port $PORT...${NC}"
echo "Press Ctrl+C to stop the server"
echo -e "${YELLOW}Server will be available at http://localhost:$PORT/github-api/${NC}\n"

# Kill any existing Deno processes on this port
echo "Stopping any existing Deno processes on port $PORT..."
lsof -ti:$PORT | xargs kill -9 2>/dev/null || true

# Run the server with the environment variables
deno run --allow-net --allow-env --allow-read $TEMP_FILE

# Clean up the temporary file when done
rm $TEMP_FILE