#!/bin/bash

# Script to publish the SPARC2 package to npm
# Usage: ./publish.sh

# Check if NPM_TOKEN is already set in the environment
if [ -z "$NPM_TOKEN" ]; then
  # If not set, prompt the user to enter it
  echo "NPM_TOKEN environment variable is not set."
  
  # Check if the token was provided as an argument
  if [ -n "$1" ]; then
    export NPM_TOKEN="$1"
    echo "Using provided NPM token"
  else
  # Otherwise prompt for it
  echo "Please enter your NPM token for publishing to @agentics.org/sparc2:"
  read -s NPM_TOKEN
  export NPM_TOKEN
  
  if [ -z "$NPM_TOKEN" ]; then
    echo "Error: NPM_TOKEN is required for publishing."
    exit 1
  fi
  
  echo "NPM_TOKEN has been set for this session."
  fi
fi

# Ensure the script exits if any command fails
set -e

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Change to the script directory
echo "Changing to directory: $SCRIPT_DIR"
cd "$SCRIPT_DIR"

echo "Installing dependencies..."
deno cache --reload src/**/*.ts

echo "Building the package (skipping type checking)..."
# Modify the build command to skip type checking
deno task fmt && deno compile --allow-read --allow-write --allow-env --allow-net --allow-run --no-check src/cli/cli.ts -o build/cli/cli.js

echo "Publishing to npm registry under @agentics.org/sparc2..."
npm publish --access public

echo "Package published successfully!"