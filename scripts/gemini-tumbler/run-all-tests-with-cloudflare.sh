#!/bin/bash
# Script to run all tests including Cloudflare tests

# Ensure we're in the right directory
cd "$(dirname "$0")"

# Run the existing tests
echo "Running existing tests..."
./run-tests.sh

# Check if the previous tests passed
if [ $? -ne 0 ]; then
    echo "Existing tests failed. Fixing issues before proceeding to Cloudflare tests."
    exit 1
fi

# Run Cloudflare Worker tests
echo "Running Cloudflare Worker tests..."
cd src/cloudflare
./test-cloudflare-worker.sh

# Check if Cloudflare Worker tests passed
if [ $? -ne 0 ]; then
    echo "Cloudflare Worker tests failed. Fixing issues before proceeding to integration tests."
    exit 1
fi

# Run Cloudflare integration tests
echo "Running Cloudflare integration tests..."
cd ../../tests
./run-cloudflare-integration-test.sh

echo "All tests completed!"