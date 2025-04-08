#!/bin/bash
# GitHub API Edge Function Verification Script
# This script verifies the deployment of the GitHub API Edge Function

set -e  # Exit immediately if a command exits with a non-zero status

# Color codes for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to display messages with timestamp
log() {
  echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

# Function to display success messages
success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Function to display warning messages
warn() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to display error messages
error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Supabase CLI is installed
check_supabase_cli() {
  if ! command -v supabase &> /dev/null; then
    error "Supabase CLI is not installed. Please install it first."
    echo "You can install it by following the instructions at: https://supabase.com/docs/guides/cli"
    exit 1
  fi
}

# Function to check if curl is installed
check_curl() {
  if ! command -v curl &> /dev/null; then
    error "curl is not installed. Please install it first."
    exit 1
  fi
}

# Function to get the function URL
get_function_url() {
  # Get the function name
  FUNCTION_NAME=$(basename "$(pwd)")
  
  # Get the Supabase project URL
  PROJECT_URL=$(supabase status | grep "API URL" | awk '{print $3}')
  
  if [ -z "$PROJECT_URL" ]; then
    error "Could not determine project URL. Make sure you're linked to a Supabase project."
    exit 1
  fi
  
  # Construct the function URL
  echo "${PROJECT_URL}/functions/v1/${FUNCTION_NAME}"
}

# Function to verify basic connectivity
verify_connectivity() {
  log "Verifying basic connectivity to the function..."
  
  FUNCTION_URL=$(get_function_url)
  
  log "Testing endpoint: $FUNCTION_URL"
  
  # Send a simple OPTIONS request to check CORS
  RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "$FUNCTION_URL")
  
  if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "204" ]; then
    success "CORS preflight check passed!"
  else
    warn "CORS preflight check returned status code: $RESPONSE"
  fi
}

# Function to verify environment variables
verify_env_vars() {
  log "Verifying environment variables..."
  
  # Get the function URL
  FUNCTION_URL=$(get_function_url)
  
  # Create a temporary test endpoint that will use the environment variables
  TMP_ENDPOINT="${FUNCTION_URL}/repos"
  
  log "Testing endpoint with environment variables: $TMP_ENDPOINT"
  
  # Send a request that will use the GitHub token and org
  RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$TMP_ENDPOINT")
  
  if [ "$RESPONSE" = "200" ]; then
    success "Environment variables check passed!"
  elif [ "$RESPONSE" = "401" ]; then
    error "Authentication failed. Check your GITHUB_TOKEN."
    exit 1
  elif [ "$RESPONSE" = "404" ]; then
    warn "Organization not found. Check your GITHUB_ORG value."
  else
    warn "Environment variables check returned status code: $RESPONSE"
  fi
}

# Function to verify GraphQL endpoint
verify_graphql() {
  log "Verifying GraphQL endpoint..."
  
  # Get the function URL
  FUNCTION_URL=$(get_function_url)
  
  # Create the GraphQL endpoint
  GRAPHQL_ENDPOINT="${FUNCTION_URL}/graphql"
  
  log "Testing GraphQL endpoint: $GRAPHQL_ENDPOINT"
  
  # Simple GraphQL query to test the endpoint
  QUERY='{
    "query": "query { viewer { login } }"
  }'
  
  # Send the GraphQL query
  RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d "$QUERY" "$GRAPHQL_ENDPOINT")
  
  # Check if the response contains "viewer"
  if echo "$RESPONSE" | grep -q "viewer"; then
    success "GraphQL endpoint check passed!"
  else
    warn "GraphQL endpoint check failed. Response: $RESPONSE"
  fi
}

# Function to verify Projects endpoint
verify_projects() {
  log "Verifying Projects endpoint..."
  
  # Get the function URL
  FUNCTION_URL=$(get_function_url)
  
  # Create the Projects endpoint
  PROJECTS_ENDPOINT="${FUNCTION_URL}/projects"
  
  log "Testing Projects endpoint: $PROJECTS_ENDPOINT"
  
  # Send a request to the Projects endpoint
  RESPONSE=$(curl -s "$PROJECTS_ENDPOINT")
  
  # Check if the response contains "organization"
  if echo "$RESPONSE" | grep -q "organization"; then
    success "Projects endpoint check passed!"
  else
    warn "Projects endpoint check failed. Response: $RESPONSE"
  fi
}

# Function to run all verification checks
run_all_checks() {
  log "Running all verification checks..."
  
  verify_connectivity
  verify_env_vars
  verify_graphql
  verify_projects
  
  success "All verification checks completed!"
}

# Function to display help message
show_help() {
  echo "GitHub API Edge Function Verification Script"
  echo ""
  echo "Usage: $0 [OPTION]"
  echo ""
  echo "Options:"
  echo "  --all       Run all verification checks"
  echo "  --connect   Verify basic connectivity"
  echo "  --env       Verify environment variables"
  echo "  --graphql   Verify GraphQL endpoint"
  echo "  --projects  Verify Projects endpoint"
  echo "  --help      Display this help message"
  echo ""
}

# Main execution flow
main() {
  # Check if required tools are installed
  check_supabase_cli
  check_curl
  
  # Parse command line arguments
  if [ $# -eq 0 ]; then
    show_help
    exit 0
  fi
  
  case "$1" in
    --all)
      run_all_checks
      ;;
    --connect)
      verify_connectivity
      ;;
    --env)
      verify_env_vars
      ;;
    --graphql)
      verify_graphql
      ;;
    --projects)
      verify_projects
      ;;
    --help)
      show_help
      ;;
    *)
      error "Unknown option: $1"
      show_help
      exit 1
      ;;
  esac
}

# Run the main function with all arguments
main "$@"