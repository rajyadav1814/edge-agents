#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Script to deploy the MCP Server Edge Function
echo -e "${BLUE}Deploying MCP Server Edge Function...${NC}"

# Navigate to the project root
SCRIPT_DIR="$(dirname "$0")"
cd "$(dirname "$0")/../../.." || { echo -e "${RED}Error: Could not navigate to project root${NC}"; exit 1; }

# Load environment variables
if [ -f "$SCRIPT_DIR/.env" ]; then
    # Check for syntax errors in .env file
    if bash -n <(grep -v '^\s*#' "$SCRIPT_DIR/.env" | grep -v '^\s*$'); then
        # No syntax errors, source the file
        set -o allexport
        source "$SCRIPT_DIR/.env"
    set +o allexport
    echo -e "${GREEN}Successfully loaded environment variables from $SCRIPT_DIR/.env${NC}"
    else
        echo -e "${RED}Error: Syntax error in $SCRIPT_DIR/.env file. Using default values.${NC}"
    fi
else
    echo -e "${YELLOW}Warning: No .env file found at $SCRIPT_DIR/.env. Using default values.${NC}"
fi

# Check if required environment variables are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}Error: Missing required environment variables${NC}"
    echo -e "Please set the required environment variables manually:\n  SUPABASE_URL=your_supabase_url\n  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key"
    exit 1
fi

# Check if MCP_SECRET_KEY is set
if [ -z "$MCP_SECRET_KEY" ]; then
    echo -e "${YELLOW}Warning: MCP_SECRET_KEY is not set. Generating a random key...${NC}"
    MCP_SECRET_KEY=$(openssl rand -hex 16)
    echo -e "${GREEN}Generated MCP_SECRET_KEY: ${MCP_SECRET_KEY} (save this for future use)${NC}"
    echo -e "${YELLOW}You should add this key to your .env file for future use.${NC}"
fi

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${YELLOW}Supabase CLI not found. Installing...${NC}"
    
    # Install Supabase CLI
    if command -v brew &> /dev/null; then
        brew install supabase/tap/supabase
    else
        npm install -g supabase
    fi
fi

# Check if the MCP server function directory exists
if [ ! -d "supabase/functions/mcp-server" ]; then
    echo -e "${RED}Error: MCP server function directory not found at supabase/functions/mcp-server${NC}"
    echo -e "Please ensure the MCP server code is in the correct location."
    exit 1
fi

# Set environment variables for the MCP server
echo -e "${BLUE}Setting environment variables for the MCP server...${NC}"
supabase secrets set SUPABASE_URL="$SUPABASE_URL" SUPABASE_SERVICE_KEY="$SUPABASE_SERVICE_ROLE_KEY" MCP_SECRET_KEY="$MCP_SECRET_KEY"

# Add any additional environment variables needed by the MCP server
if [ ! -z "$OPENROUTER_API_KEY" ]; then
    echo -e "${BLUE}Setting OpenRouter API key...${NC}"
    supabase secrets set OPENROUTER_API_KEY="$OPENROUTER_API_KEY"
fi

# Deploy the MCP server function
echo -e "${BLUE}Deploying MCP server function...${NC}"
supabase functions deploy mcp-server --no-verify-jwt

# Display success message
echo -e "${GREEN}✓ MCP server deployed successfully!${NC}"
echo -e "${GREEN}You can access the MCP server at: ${SUPABASE_URL}/functions/v1/mcp-server${NC}"
echo -e "${YELLOW}Remember to use the MCP_SECRET_KEY in your authorization header when making requests:${NC}"
echo -e "${YELLOW}  Authorization: Bearer ${MCP_SECRET_KEY}${NC}"
echo -e "${BLUE}For more information, see the MCP server documentation in supabase/functions/mcp-server/README.md${NC}"

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${YELLOW}Supabase CLI not found. Installing...${NC}"
    
    # Install Supabase CLI
    if command -v brew &> /dev/null; then
        brew install supabase/tap/supabase
    else
        npm install -g supabase
    fi
fi

# Check if the MCP server function directory exists
if [ ! -d "supabase/functions/mcp-server" ]; then
    echo -e "${RED}Error: MCP server function directory not found.${NC}"
    echo "Please ensure the directory 'supabase/functions/mcp-server' exists."
    exit 1
fi

# Set environment variables for the MCP server
echo -e "${BLUE}Setting environment variables for the MCP server...${NC}"
supabase secrets set SUPABASE_URL="$SUPABASE_URL" SUPABASE_SERVICE_KEY="$SUPABASE_SERVICE_ROLE_KEY" MCP_SECRET_KEY="$MCP_SECRET_KEY"

# If OPENROUTER_API_KEY is available, set it as well
if [ ! -z "$OPENROUTER_API_KEY" ]; then
    supabase secrets set OPENROUTER_API_KEY="$OPENROUTER_API_KEY"
fi

# Deploy the MCP server function
echo -e "${BLUE}Deploying MCP server function...${NC}"
supabase functions deploy mcp-server --no-verify-jwt

echo -e "${GREEN}✓ MCP server deployed successfully!${NC}"
echo -e "${GREEN}You can access the MCP server at: ${SUPABASE_URL}/functions/v1/mcp-server${NC}"
echo -e "${BLUE}To use this MCP server with Claude or other AI assistants, add it to your MCP settings.${NC}"
echo -e "${YELLOW}Remember to keep your MCP_SECRET_KEY secure. It is required for authentication.${NC}"