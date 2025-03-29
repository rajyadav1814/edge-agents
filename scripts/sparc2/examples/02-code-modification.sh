#!/bin/bash

# SPARC2 Example 2: Code Modification
# This example shows how to apply suggested modifications to code

# Set strict mode
set -e

# Change to the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/.."

echo "SPARC2 Example 2: Code Modification"
echo "=================================="
echo ""

# Use the same example file from previous example
EXAMPLE_FILE="test-file.js"

echo "Modifying $EXAMPLE_FILE..."
echo ""

# Creating a suggestion file 
SUGGESTIONS_FILE="$(mktemp)"
cat > "$SUGGESTIONS_FILE" << EOL
Fix the multiplication function bug by replacing "return a + b" with "return a * b".
Improve the divide function by removing the temporary variable and returning the result directly.
Add JSDoc comments to all functions for better documentation.
EOL

echo "Suggestions created:"
cat "$SUGGESTIONS_FILE"
echo ""

# Run the modification
deno run --allow-read --allow-write --allow-env --allow-net --allow-run src/cli/cli.ts modify \
  --files $EXAMPLE_FILE \
  --suggestions "$SUGGESTIONS_FILE"

echo ""
echo "Modification complete. Let's look at the changes:"
echo ""

# Display the updated file
cat $EXAMPLE_FILE

# Clean up
rm "$SUGGESTIONS_FILE"

echo ""
echo "These changes can be tracked and saved using checkpoints (see next example)."