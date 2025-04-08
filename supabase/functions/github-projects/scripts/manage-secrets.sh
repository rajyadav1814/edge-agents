#!/bin/bash
# GitHub API Edge Function - Secret Management Script
# This script helps manage GitHub API secrets for local development and deployment

# Colors for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to display script usage
show_usage() {
  echo -e "${BLUE}GitHub API Edge Function - Secret Management${NC}"
  echo ""
  echo "Usage: ./manage-secrets.sh [command]"
  echo ""
  echo "Commands:"
  echo "  setup-local     - Set up secrets for local development"
  echo "  setup-supabase  - Set up secrets for Supabase deployment"
  echo "  check           - Check if required secrets are set"
  echo "  help            - Show this help message"
  echo ""
  echo "Example:"
  echo "  ./manage-secrets.sh setup-local"
}

# Function to set up local environment variables
setup_local() {
  echo -e "${BLUE}Setting up local environment variables${NC}"
  echo ""
  
  # Prompt for GitHub token
  echo -e "${YELLOW}Enter your GitHub Personal Access Token:${NC}"
  read -s github_token
  echo ""
  
  if [ -z "$github_token" ]; then
    echo -e "${RED}Error: GitHub token cannot be empty${NC}"
    exit 1
  fi
  
  # Prompt for GitHub organization
  echo -e "${YELLOW}Enter your GitHub Organization name:${NC}"
  read github_org
  echo ""
  
  if [ -z "$github_org" ]; then
    echo -e "${RED}Error: GitHub organization cannot be empty${NC}"
    exit 1
  fi
  
  # Create or update .env file
  echo "# GitHub API Edge Function - Local Environment Variables" > .env
  echo "GITHUB_TOKEN=$github_token" >> .env
  echo "GITHUB_ORG=$github_org" >> .env
  echo "GITHUB_API_VERSION=v3" >> .env
  echo "CACHE_TTL=300" >> .env
  
  echo -e "${GREEN}Local environment variables saved to .env file${NC}"
  echo -e "${YELLOW}To load these variables, run:${NC}"
  echo "source .env"
}

# Function to set up Supabase secrets
setup_supabase() {
  echo -e "${BLUE}Setting up Supabase secrets${NC}"
  echo ""
  
  # Check if Supabase CLI is installed
  if ! command -v supabase &> /dev/null; then
    echo -e "${RED}Error: Supabase CLI is not installed${NC}"
    echo "Please install it first: https://supabase.com/docs/guides/cli"
    exit 1
  fi
  
  # Prompt for GitHub token
  echo -e "${YELLOW}Enter your GitHub Personal Access Token:${NC}"
  read -s github_token
  echo ""
  
  if [ -z "$github_token" ]; then
    echo -e "${RED}Error: GitHub token cannot be empty${NC}"
    exit 1
  fi
  
  # Prompt for GitHub organization
  echo -e "${YELLOW}Enter your GitHub Organization name:${NC}"
  read github_org
  echo ""
  
  if [ -z "$github_org" ]; then
    echo -e "${RED}Error: GitHub organization cannot be empty${NC}"
    exit 1
  fi
  
  # Set Supabase secrets
  echo -e "${YELLOW}Setting Supabase secrets...${NC}"
  supabase secrets set GITHUB_TOKEN="$github_token"
  supabase secrets set GITHUB_ORG="$github_org"
  supabase secrets set GITHUB_API_VERSION="v3"
  supabase secrets set CACHE_TTL="300"
  
  echo -e "${GREEN}Supabase secrets set successfully${NC}"
}

# Function to check if required secrets are set
check_secrets() {
  echo -e "${BLUE}Checking for required secrets${NC}"
  echo ""
  
  # Check local environment variables
  if [ -f .env ]; then
    echo -e "${GREEN}Found .env file${NC}"
    source .env
  fi
  
  # Check GitHub token
  if [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${RED}GITHUB_TOKEN is not set${NC}"
  else
    token_preview="${GITHUB_TOKEN:0:4}...${GITHUB_TOKEN: -4}"
    echo -e "${GREEN}GITHUB_TOKEN is set${NC} ($token_preview)"
  fi
  
  # Check GitHub organization
  if [ -z "$GITHUB_ORG" ]; then
    echo -e "${RED}GITHUB_ORG is not set${NC}"
  else
    echo -e "${GREEN}GITHUB_ORG is set${NC} ($GITHUB_ORG)"
  fi
  
  # Check API version
  if [ -z "$GITHUB_API_VERSION" ]; then
    echo -e "${YELLOW}GITHUB_API_VERSION is not set, will use default (v3)${NC}"
  else
    echo -e "${GREEN}GITHUB_API_VERSION is set${NC} ($GITHUB_API_VERSION)"
  fi
  
  # Check cache TTL
  if [ -z "$CACHE_TTL" ]; then
    echo -e "${YELLOW}CACHE_TTL is not set, will use default (300)${NC}"
  else
    echo -e "${GREEN}CACHE_TTL is set${NC} ($CACHE_TTL)"
  fi
}

# Main script logic
case "$1" in
  setup-local)
    setup_local
    ;;
  setup-supabase)
    setup_supabase
    ;;
  check)
    check_secrets
    ;;
  help)
    show_usage
    ;;
  *)
    show_usage
    ;;
esac