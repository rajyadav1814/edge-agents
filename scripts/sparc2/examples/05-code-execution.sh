#!/bin/bash

# SPARC2 Example 5: Code Execution
# This example shows how to execute code in a sandbox environment

# Set strict mode
set -e

# Change to the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/.."

echo "SPARC2 Example 5: Code Execution"
echo "=============================="
echo ""

# Use the same example file from previous examples
EXAMPLE_FILE="test-file.js"

echo "Executing $EXAMPLE_FILE in a sandbox environment..."
echo ""

# Run the code execution
deno run --allow-read --allow-write --allow-env --allow-net --allow-run src/cli/cli.ts execute --file $EXAMPLE_FILE

echo ""
echo "Code execution complete. The output shows the results of the functions."
echo ""

echo "Let's create a Python example to demonstrate language flexibility..."
PYTHON_FILE="python-example.py"

# Create a simple Python example
cat > $PYTHON_FILE << EOL
def fibonacci(n):
    """Calculate the nth Fibonacci number."""
    if n <= 1:
        return n
    else:
        return fibonacci(n-1) + fibonacci(n-2)

# Test the function
for i in range(10):
    print(f"fibonacci({i}) = {fibonacci(i)}")

# Calculate a larger Fibonacci number
result = fibonacci(15)
print(f"fibonacci(15) = {result}")
EOL

echo "Created Python example file: $PYTHON_FILE"
echo ""

echo "Executing Python code..."
echo ""

# Execute Python code (Note: language parameter is required for non-JS files)
deno run --allow-read --allow-write --allow-env --allow-net --allow-run src/cli/cli.ts execute \
  --file $PYTHON_FILE \
  --language python

echo ""
echo "Python execution complete."
echo ""

echo "SPARC2 supports multiple languages through E2B's code interpreter."
echo "This provides a secure sandbox for running code during analysis and modification."