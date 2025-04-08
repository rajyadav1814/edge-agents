#!/bin/bash

# This script runs the Edge Deployment function locally and then lists the functions

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Running Edge Deployment function locally and listing functions...${NC}"

# Check if Deno is installed
if ! command -v deno &> /dev/null; then
  echo -e "${RED}Error: Deno is not installed. Please install Deno first.${NC}"
  echo "Visit https://deno.land/#installation for installation instructions."
  exit 1
fi

# Navigate to the function directory
cd "$(dirname "$0")"

# Extract environment variables from .env file
export SUPABASE_ACCESS_TOKEN=$(grep SUPABASE_ACCESS_TOKEN /workspaces/agentics/.env | cut -d '=' -f2 | tr -d ' \t\r\n')
export VITE_SUPABASE_PROJECT_ID=$(grep VITE_SUPABASE_PROJECT_ID /workspaces/agentics/.env | cut -d '=' -f2 | tr -d ' \t\r\n')
export SUPABASE_URL=$(grep SUPABASE_URL /workspaces/agentics/.env | grep -v VITE | head -n 1 | cut -d '=' -f2 | tr -d ' \t\r\n')
export SUPABASE_SERVICE_KEY=$(grep SUPABASE_SERVICE_KEY /workspaces/agentics/.env | cut -d '=' -f2 | tr -d ' \t\r\n')

# If SUPABASE_SERVICE_KEY is not set, use VITE_SUPABASE_SERVICE_ROLE_KEY
if [ -z "$SUPABASE_SERVICE_KEY" ]; then
  export SUPABASE_SERVICE_KEY=$(grep VITE_SUPABASE_SERVICE_ROLE_KEY /workspaces/agentics/.env | cut -d '=' -f2 | tr -d ' \t\r\n')
fi

# Verify environment variables are set
if [ -z "$VITE_SUPABASE_PROJECT_ID" ] || [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ACCESS_TOKEN" ] || [ -z "$SUPABASE_SERVICE_KEY" ]; then
  echo -e "${RED}Error: Required environment variables are not set in the .env file.${NC}"
  echo "Please make sure the following variables are defined in /workspaces/agentics/.env:"
  echo "  - VITE_SUPABASE_PROJECT_ID"
  echo "  - SUPABASE_URL"
  echo "  - SUPABASE_ACCESS_TOKEN"
  echo "  - SUPABASE_SERVICE_KEY or VITE_SUPABASE_SERVICE_ROLE_KEY"
  exit 1
fi

echo -e "${YELLOW}Using Project ID: $VITE_SUPABASE_PROJECT_ID${NC}"
echo -e "${YELLOW}Using Access Token: ${SUPABASE_ACCESS_TOKEN:0:10}...${NC}"
echo -e "${YELLOW}Using Service Key: ${SUPABASE_SERVICE_KEY:0:10}...${NC}"

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Determine the terminal command to use
TERM_CMD=""
if command_exists gnome-terminal; then
  TERM_CMD="gnome-terminal --"
elif command_exists xterm; then
  TERM_CMD="xterm -e"
elif command_exists konsole; then
  TERM_CMD="konsole -e"
elif command_exists terminal; then
  TERM_CMD="terminal -e"
else
  echo -e "${YELLOW}No supported terminal emulator found. Running in current terminal with background processes.${NC}"
  TERM_CMD=""
fi

# Start the Edge Deployment function
echo -e "${GREEN}Starting Edge Deployment function...${NC}"
if [ -n "$TERM_CMD" ]; then
  $TERM_CMD bash -c "cd $(pwd) && deno run --allow-net --allow-env --allow-read src/index.ts; read -p 'Press Enter to close...'"
  
  # Give the function time to start up
  sleep 3
  
  # List the functions using the list-functions.sh script
  echo -e "${GREEN}Listing functions...${NC}"
  ./list-functions.sh
else
  # Run the function in the background
  deno run --allow-net --allow-env --allow-read src/index.ts &
  FUNCTION_PID=$!
  echo -e "${YELLOW}Edge Deployment function started with PID: $FUNCTION_PID${NC}"
  
  # Give the function time to start up
  sleep 3
  
  # List the functions using the list-functions.sh script
  echo -e "${GREEN}Listing functions...${NC}"
  ./list-functions.sh
  
  # Clean up the background process
  if [ -n "$FUNCTION_PID" ]; then
    echo -e "${YELLOW}Stopping Edge Deployment function (PID: $FUNCTION_PID)...${NC}"
    kill $FUNCTION_PID
  fi
fi

echo -e "${GREEN}Done!${NC}"
