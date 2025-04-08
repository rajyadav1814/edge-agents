#!/bin/bash
# GitHub API Edge Function Rollback Script
# This script handles rollback procedures for the GitHub API Edge Function

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

# Function to list deployment history
list_deployment_history() {
  log "Listing deployment history for GitHub API function..."
  
  # Get the function name
  FUNCTION_NAME=$(basename "$(pwd)")
  
  # List deployments
  supabase functions deploy-history "$FUNCTION_NAME"
}

# Function to rollback to a specific version
rollback_to_version() {
  VERSION=$1
  
  if [ -z "$VERSION" ]; then
    error "No version specified for rollback."
    echo "Usage: $0 --version VERSION_ID"
    exit 1
  fi
  
  log "Rolling back to version: $VERSION"
  
  # Get the function name
  FUNCTION_NAME=$(basename "$(pwd)")
  
  # Perform the rollback
  if supabase functions deploy "$FUNCTION_NAME" --version "$VERSION" --no-verify-jwt; then
    success "Rollback to version $VERSION completed successfully!"
  else
    error "Failed to rollback to version $VERSION."
    exit 1
  fi
}

# Function to rollback to the previous version
rollback_to_previous() {
  log "Rolling back to the previous version..."
  
  # Get the function name
  FUNCTION_NAME=$(basename "$(pwd)")
  
  # Get deployment history
  HISTORY=$(supabase functions deploy-history "$FUNCTION_NAME" --json)
  
  # Check if we have at least 2 deployments
  DEPLOYMENT_COUNT=$(echo "$HISTORY" | grep -o "version" | wc -l)
  
  if [ "$DEPLOYMENT_COUNT" -lt 2 ]; then
    error "Not enough deployment history to rollback. Need at least 2 deployments."
    exit 1
  fi
  
  # Get the second most recent version (previous version)
  PREVIOUS_VERSION=$(echo "$HISTORY" | grep -o '"version": "[^"]*"' | sed 's/"version": "//g' | sed 's/"//g' | sed -n '2p')
  
  if [ -z "$PREVIOUS_VERSION" ]; then
    error "Could not determine previous version."
    exit 1
  fi
  
  log "Previous version identified: $PREVIOUS_VERSION"
  
  # Perform the rollback
  if supabase functions deploy "$FUNCTION_NAME" --version "$PREVIOUS_VERSION" --no-verify-jwt; then
    success "Rollback to previous version ($PREVIOUS_VERSION) completed successfully!"
  else
    error "Failed to rollback to previous version."
    exit 1
  fi
}

# Function to verify the rollback
verify_rollback() {
  log "Verifying rollback..."
  
  # Run the verification script if it exists
  if [ -f "./verify-deployment.sh" ]; then
    log "Running verification script..."
    bash ./verify-deployment.sh --connect
  else
    warn "Verification script not found. Manual verification required."
  fi
}

# Function to create a backup of the current code
create_backup() {
  log "Creating backup of current code..."
  
  # Create a backup directory if it doesn't exist
  mkdir -p ./backups
  
  # Create a timestamped backup
  TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
  BACKUP_DIR="./backups/backup_$TIMESTAMP"
  
  mkdir -p "$BACKUP_DIR"
  
  # Copy all files except backups directory and node_modules
  find . -type f -not -path "./backups/*" -not -path "./node_modules/*" -not -path "./.git/*" -exec cp --parents {} "$BACKUP_DIR" \;
  
  success "Backup created at: $BACKUP_DIR"
}

# Function to restore from a backup
restore_from_backup() {
  BACKUP_DIR=$1
  
  if [ -z "$BACKUP_DIR" ]; then
    error "No backup directory specified."
    echo "Usage: $0 --restore ./backups/backup_TIMESTAMP"
    exit 1
  fi
  
  if [ ! -d "$BACKUP_DIR" ]; then
    error "Backup directory does not exist: $BACKUP_DIR"
    exit 1
  fi
  
  log "Restoring from backup: $BACKUP_DIR"
  
  # Create a backup of the current state before restoring
  create_backup
  
  # Restore files from the backup
  cp -r "$BACKUP_DIR"/* .
  
  success "Restore from backup completed successfully!"
}

# Function to display help message
show_help() {
  echo "GitHub API Edge Function Rollback Script"
  echo ""
  echo "Usage: $0 [OPTION]"
  echo ""
  echo "Options:"
  echo "  --list              List deployment history"
  echo "  --version VERSION   Rollback to a specific version"
  echo "  --previous          Rollback to the previous version"
  echo "  --backup            Create a backup of the current code"
  echo "  --restore DIR       Restore from a backup directory"
  echo "  --help              Display this help message"
  echo ""
}

# Main execution flow
main() {
  # Check if Supabase CLI is installed
  check_supabase_cli
  
  # Parse command line arguments
  if [ $# -eq 0 ]; then
    show_help
    exit 0
  fi
  
  case "$1" in
    --list)
      list_deployment_history
      ;;
    --version)
      rollback_to_version "$2"
      verify_rollback
      ;;
    --previous)
      rollback_to_previous
      verify_rollback
      ;;
    --backup)
      create_backup
      ;;
    --restore)
      restore_from_backup "$2"
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