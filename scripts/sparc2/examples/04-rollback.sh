#!/bin/bash

# SPARC2 Example 4: Rollback Functionality
# This example shows how to rollback to previous code versions

# Set strict mode
set -e

# Change to the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/.."

echo "SPARC2 Example 4: Rollback Functionality"
echo "======================================"
echo ""

# Use the same example file from previous examples
EXAMPLE_FILE="test-file.js"

# First, let's get information about our checkpoints
echo "Getting information about existing checkpoints..."
echo "(In a real scenario, you would use git log to see the commit hashes)"
echo ""

# For demonstration, we'll use a placeholder hash 
# In a real scenario, you would get this from git log
CHECKPOINT_HASH="YOUR_CHECKPOINT_HASH"
echo "For this example, replace YOUR_CHECKPOINT_HASH with an actual commit hash from git log"
echo ""

echo "Current state of $EXAMPLE_FILE:"
cat $EXAMPLE_FILE
echo ""

echo "Rolling back to previous checkpoint..."
echo "In a real run, execute:"
echo "deno run --allow-read --allow-write --allow-env --allow-net --allow-run src/cli/cli.ts rollback --commit \$CHECKPOINT_HASH"
echo ""

echo "After rollback, you can verify the file has been restored to its previous state."
echo ""

echo "SPARC2 also supports rollback by date:"
echo "deno run --allow-read --allow-write --allow-env --allow-net --allow-run src/cli/cli.ts rollback --commit \"2023-03-25\""
echo ""

echo "This feature allows you to easily manage code versions and revert changes when needed."