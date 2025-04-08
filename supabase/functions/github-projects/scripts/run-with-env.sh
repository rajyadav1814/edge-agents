#!/bin/bash
# Run GitHub API server with environment variables from .env file

# Colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}GitHub API Edge Function - Environment Setup${NC}"

# Check if .env file exists
if [ ! -f .env ]; then
  echo -e "${RED}Error: .env file not found${NC}"
  echo "Creating a sample .env file..."
  
  # Generate a mock token
  MOCK_TOKEN=$(openssl rand -hex 20)
  
  # Create a sample .env file
  cat > .env << EOL
# GitHub API Edge Function - Environment Variables
GITHUB_TOKEN=$MOCK_TOKEN
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

# Run the server
echo -e "\n${GREEN}Starting GitHub API server...${NC}"
echo "Press Ctrl+C to stop the server"
echo -e "${YELLOW}Server will be available at http://localhost:8000/github-api/${NC}\n"

# Kill any existing Deno processes
echo "Stopping any existing Deno processes..."
ps aux | grep "deno run" | awk '{print $2}' | xargs kill -9 2>/dev/null || true

# Run the server with the environment variables
deno run --allow-net --allow-env --allow-read index-test.ts