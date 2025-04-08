#!/bin/bash

# SPARC2 Example 3: Checkpointing and Version Control
# This example shows how to create checkpoints and manage code versions

# Set strict mode
set -e

# Change to the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/.."

echo "SPARC2 Example 3: Checkpointing and Version Control"
echo "================================================="
echo ""

# Use the same example file from previous examples
EXAMPLE_FILE="test-file.js"

echo "Creating a checkpoint for $EXAMPLE_FILE..."
echo ""

# Create a checkpoint with a descriptive message
deno run --allow-read --allow-write --allow-env --allow-net --allow-run src/cli/cli.ts checkpoint \
  --message "Fixed multiply function and improved divide function"

echo ""
echo "Checkpoint created. This saves our changes in git and the vector database."
echo ""

# Make another change to the file for demonstration
echo "Let's make another change to the file..."
echo ""

# Append a new function to the file
cat >> $EXAMPLE_FILE << EOL

/**
 * Calculates the power of a number
 * @param {number} base - The base number
 * @param {number} exponent - The exponent
 * @returns {number} The result of base raised to the power of exponent
 */
function power(base, exponent) {
  return Math.pow(base, exponent);
}
EOL

echo "Added a new power function to $EXAMPLE_FILE."
echo ""

# Create another checkpoint
echo "Creating another checkpoint..."
deno run --allow-read --allow-write --allow-env --allow-net --allow-run src/cli/cli.ts checkpoint \
  --message "Added power function"

echo ""
echo "Second checkpoint created."
echo ""

# List the configuration to see checkpointing settings
echo "Checkpoint configuration:"
deno run --allow-read --allow-write --allow-env --allow-net --allow-run src/cli/cli.ts config \
  --action get --key "rollback.checkpoint_enabled"

echo ""
echo "You can now use the rollback command to return to previous versions."
echo "See the next example for rollback functionality."