#!/bin/bash
# Shell script to run the file search test

# Ensure script exits on error
set -e

# Print header
echo "====================================="
echo "Running File Search Test"
echo "====================================="

# Check if OPENAI_API_KEY is set
if [ -z "$OPENAI_API_KEY" ]; then
  # Try to load from .env file if it exists
  if [ -f .env ]; then
    echo "Loading OPENAI_API_KEY from .env file..."
    export $(grep -v '^#' .env | xargs)
  fi
  
  # Check again after trying to load from .env
  if [ -z "$OPENAI_API_KEY" ]; then
    echo "Error: OPENAI_API_KEY is not set"
    echo "Please set the OPENAI_API_KEY environment variable or add it to the .env file"
    exit 1
  fi
fi

echo "OPENAI_API_KEY is set. Running test..."
echo

# Run the test script
deno run --allow-net --allow-env --allow-read --allow-write test-file-search.ts

# Check if the test was successful
if [ $? -eq 0 ]; then
  echo
  echo "====================================="
  echo "Test completed successfully!"
  echo "====================================="
  
  # Check if the IDs file was created
  if [ -f file-search-test-ids.txt ]; then
    echo
    echo "Vector store and file IDs:"
    cat file-search-test-ids.txt
    echo
    echo "You can now search the vector store with:"
    VECTOR_STORE_ID=$(grep VECTOR_STORE_ID file-search-test-ids.txt | cut -d= -f2)
    echo "deno task file-search search $VECTOR_STORE_ID \"your search query\""
  fi
else
  echo
  echo "====================================="
  echo "Test failed!"
  echo "====================================="
  exit 1
fi
