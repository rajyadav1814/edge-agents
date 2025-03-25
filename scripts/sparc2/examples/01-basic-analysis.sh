#!/bin/bash

# SPARC2 Example 1: Basic Code Analysis
# This example shows how to analyze a JavaScript file for issues and improvements

# Set strict mode
set -e

# Change to the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/.."

echo "SPARC2 Example 1: Basic Code Analysis"
echo "====================================="
echo ""

# First, let's make sure we have a file to analyze
EXAMPLE_FILE="test-file.js"

echo "Analyzing $EXAMPLE_FILE..."
echo ""

# Run the analysis
deno run --allow-read --allow-write --allow-env --allow-net --allow-run src/cli/cli.ts analyze --files $EXAMPLE_FILE

echo ""
echo "Analysis complete. SPARC2 has identified potential issues and improvements in the code."
echo "You can use these suggestions for the next example: code modification."