#!/bin/bash

# SPARC2 Example 6: Vector Search and Configuration Management
# This example demonstrates advanced features including vector search and configuration

# Set strict mode
set -e

# Change to the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/.."

echo "SPARC2 Example 6: Vector Search and Configuration Management"
echo "========================================================="
echo ""

# First, let's look at the current configuration
echo "Current SPARC2 configuration:"
deno run --allow-read --allow-write --allow-env --allow-net --allow-run src/cli/cli.ts config --action list

echo ""
echo "We can also get specific configuration values:"
deno run --allow-read --allow-write --allow-env --allow-net --allow-run src/cli/cli.ts config --action get --key "models.reasoning"

echo ""
echo "Let's update the configuration to use a different model:"
deno run --allow-read --allow-write --allow-env --allow-net --allow-run src/cli/cli.ts config --action set --key "models.reasoning" --value "gpt-4o"

echo ""
echo "Verify the change:"
deno run --allow-read --allow-write --allow-env --allow-net --allow-run src/cli/cli.ts config --action get --key "models.reasoning"

echo ""
echo "Now, let's demonstrate vector search functionality..."
echo ""

# Create multiple files with different functionality
echo "Creating multiple files to demonstrate search across a codebase..."

# Create a math utility file
cat > "math-utils.js" << EOL
/**
 * Math utility functions
 */

/**
 * Calculates the factorial of a number
 * @param {number} n - The number to calculate factorial for
 * @returns {number} The factorial of n
 */
function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

/**
 * Checks if a number is prime
 * @param {number} n - The number to check
 * @returns {boolean} True if the number is prime, false otherwise
 */
function isPrime(n) {
  if (n <= 1) return false;
  if (n <= 3) return true;
  
  if (n % 2 === 0 || n % 3 === 0) return false;
  
  for (let i = 5; i * i <= n; i += 6) {
    if (n % i === 0 || n % (i + 2) === 0) return false;
  }
  
  return true;
}

module.exports = { factorial, isPrime };
EOL

# Create a string utility file
cat > "string-utils.js" << EOL
/**
 * String utility functions
 */

/**
 * Reverses a string
 * @param {string} str - The string to reverse
 * @returns {string} The reversed string
 */
function reverseString(str) {
  return str.split('').reverse().join('');
}

/**
 * Checks if a string is a palindrome
 * @param {string} str - The string to check
 * @returns {boolean} True if the string is a palindrome, false otherwise
 */
function isPalindrome(str) {
  const cleanStr = str.toLowerCase().replace(/[^a-z0-9]/g, '');
  return cleanStr === reverseString(cleanStr);
}

module.exports = { reverseString, isPalindrome };
EOL

echo "Created math-utils.js and string-utils.js"
echo ""

# Create checkpoints for both files
echo "Creating checkpoints for the new files..."
deno run --allow-read --allow-write --allow-env --allow-net --allow-run src/cli/cli.ts checkpoint \
  --message "Added utility files for math and string operations"

echo ""
echo "Now let's search for functions across our codebase:"
echo ""

# Search for factorial implementations
echo "Searching for 'factorial':"
deno run --allow-read --allow-write --allow-env --allow-net --allow-run src/cli/cli.ts search \
  --query "factorial function"

echo ""
echo "Searching for 'palindrome':"
deno run --allow-read --allow-write --allow-env --allow-net --allow-run src/cli/cli.ts search \
  --query "palindrome function"

echo ""
echo "Searching for 'utility functions':"
deno run --allow-read --allow-write --allow-env --allow-net --allow-run src/cli/cli.ts search \
  --query "utility functions javascript"

echo ""
echo "This example demonstrates how SPARC2's vector search can help find relevant code"
echo "across a codebase, and how configuration management allows customizing the system."
echo ""
echo "In a real project, these capabilities become increasingly valuable as the codebase grows."

# Clean up the files we created
rm -f math-utils.js string-utils.js
echo "Cleaned up example files."