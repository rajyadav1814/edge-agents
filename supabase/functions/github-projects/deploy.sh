#!/bin/bash
# GitHub API Edge Function Deployment Script
# This script handles the deployment of the GitHub API Edge Function to Supabase

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
  
  log "Supabase CLI is installed. Proceeding with deployment..."
}

# Function to check if required environment variables are set
check_env_vars() {
  log "Checking environment variables..."
  
  # List of required environment variables
  required_vars=("GITHUB_TOKEN" "GITHUB_ORG")
  
  # Check if each required variable is set
  missing_vars=()
  for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
      missing_vars+=("$var")
    fi
  done
  
  # If any required variables are missing, exit with an error
  if [ ${#missing_vars[@]} -gt 0 ]; then
    error "The following required environment variables are not set:"
    for var in "${missing_vars[@]}"; do
      echo "  - $var"
    done
    echo ""
    echo "Please set these variables before deploying."
    echo "You can set them using Supabase secrets:"
    echo "  supabase secrets set GITHUB_TOKEN=your_token GITHUB_ORG=your_org"
    exit 1
  fi
  
  success "All required environment variables are set."
}

# Function to validate the function before deployment
validate_function() {
  log "Validating function before deployment..."
  
  # Check if index.ts exists
  if [ ! -f "index.ts" ]; then
    error "index.ts not found. Make sure you're in the correct directory."
    exit 1
  fi
  
  # Check if import_map.json exists
  if [ ! -f "import_map.json" ]; then
    warn "import_map.json not found. This might cause issues with imports."
  fi
  
  success "Function validation passed."
}

# Function to deploy the function to Supabase
deploy_function() {
  log "Deploying GitHub API function to Supabase..."
  
  # Get the current directory name
  FUNCTION_NAME=$(basename "$(pwd)")
  
  # Deploy the function
  if supabase functions deploy "$FUNCTION_NAME" --no-verify-jwt; then
    success "Function '$FUNCTION_NAME' deployed successfully!"
  else
    error "Failed to deploy function '$FUNCTION_NAME'."
    exit 1
  fi
}

# Function to verify the deployment
verify_deployment() {
  log "Verifying deployment..."
  
  # Get the function name
  FUNCTION_NAME=$(basename "$(pwd)")
  
  # Get the Supabase project URL
  PROJECT_URL=$(supabase status | grep "API URL" | awk '{print $3}')
  
  if [ -z "$PROJECT_URL" ]; then
    warn "Could not determine project URL. Manual verification required."
    return
  fi
  
  # Construct the function URL
  FUNCTION_URL="${PROJECT_URL}/functions/v1/${FUNCTION_NAME}"
  
  log "Function URL: $FUNCTION_URL"
  log "Sending a test request to verify deployment..."
  
  # Send a test request to the function
  RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$FUNCTION_URL")
  
  if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "401" ] || [ "$RESPONSE" = "404" ]; then
    success "Deployment verification successful! Function is responding."
  else
    warn "Deployment verification returned status code: $RESPONSE"
    warn "This might not indicate a problem, but you should verify manually."
  fi
}

# Function to handle rollback if needed
rollback() {
  log "Initiating rollback procedure..."
  
  # Get the function name
  FUNCTION_NAME=$(basename "$(pwd)")
  
  # Check if we have a previous version to roll back to
  if [ -f ".previous_version" ]; then
    PREVIOUS_VERSION=$(cat .previous_version)
    log "Rolling back to previous version: $PREVIOUS_VERSION"
    
    if supabase functions deploy "$FUNCTION_NAME" --version "$PREVIOUS_VERSION" --no-verify-jwt; then
      success "Rollback successful!"
    else
      error "Failed to roll back. Manual intervention required."
      exit 1
    fi
  else
    error "No previous version found for rollback. Manual intervention required."
    exit 1
  fi
}

# Main execution flow
main() {
  log "Starting deployment process for GitHub API Edge Function..."
  
  # Store current directory
  CURRENT_DIR=$(pwd)
  
  # Check if we're in the function directory
  if [[ "$CURRENT_DIR" != *"/github-api" ]]; then
    warn "You don't seem to be in the github-api function directory."
    read -p "Do you want to continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      error "Deployment aborted."
      exit 1
    fi
  fi
  
  # Check if Supabase CLI is installed
  check_supabase_cli
  
  # Check if required environment variables are set
  check_env_vars
  
  # Validate the function
  validate_function
  
  # Store the current version for potential rollback
  FUNCTION_NAME=$(basename "$(pwd)")
  CURRENT_VERSION=$(supabase functions list | grep "$FUNCTION_NAME" | awk '{print $2}')
  if [ ! -z "$CURRENT_VERSION" ]; then
    echo "$CURRENT_VERSION" > .previous_version
    log "Stored current version ($CURRENT_VERSION) for potential rollback."
  fi
  
  # Deploy the function
  deploy_function
  
  # Verify the deployment
  verify_deployment
  
  success "Deployment process completed successfully!"
  log "You can now access your function at: https://[your-project-ref].supabase.co/functions/v1/github-api"
}

# Check if the script is being run with a rollback flag
if [ "$1" = "--rollback" ]; then
  rollback
else
  main
fi