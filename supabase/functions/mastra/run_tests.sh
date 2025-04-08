#!/bin/bash
# Run all tests for the Mastra AI agent

# Set execution permissions for this script:
# chmod +x run_tests.sh

# Change to the directory containing this script
cd "$(dirname "$0")"

echo "Running Mastra AI agent tests..."

# Run the tests with necessary permissions
deno test --allow-env --allow-net --allow-read tests/run_tests.ts

# Check if tests passed
if [ $? -eq 0 ]; then
  echo "✅ All tests passed!"
  
  # Run coverage report if --coverage flag is provided
  if [ "$1" == "--coverage" ]; then
    echo "Generating coverage report..."
    deno test --coverage=coverage --allow-env --allow-net --allow-read tests/run_tests.ts
    deno coverage coverage
  fi
  
  exit 0
else
  echo "❌ Tests failed!"
  exit 1
fi