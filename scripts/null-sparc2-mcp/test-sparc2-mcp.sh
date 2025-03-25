#!/bin/bash

# Comprehensive Test for SPARC2-MCP Server
# This script tests both the analyze and modify tools of the SPARC2-MCP server

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== SPARC2-MCP Server Comprehensive Test ===${NC}"
echo -e "${BLUE}Testing both analyze and modify tools${NC}"

# File to analyze/modify
TEST_FILE="/workspaces/edge-agents/scripts/sparc2/test-file.js"

# Make a backup of the test file
cp "$TEST_FILE" "$TEST_FILE.bak"

echo -e "\n${GREEN}1. Testing 'analyze' tool${NC}"
echo -e "${BLUE}Analyzing file: $TEST_FILE${NC}"

# Run analyze tool and capture the output
ANALYZE_OUTPUT=$(echo '{"id":"analyze_test","method":"call_tool","params":{"name":"analyze","arguments":{"files":["'$TEST_FILE'"]}}}' | mcp serve)

# Display the output in a more readable format
echo -e "${GREEN}Analyze tool output:${NC}"
echo "$ANALYZE_OUTPUT" | grep -o '{.*}' | python3 -m json.tool || echo "$ANALYZE_OUTPUT"

echo -e "\n${GREEN}2. Testing 'modify' tool${NC}"
echo -e "${BLUE}Modifying file: $TEST_FILE${NC}"

# Run modify tool and capture the output
MODIFY_OUTPUT=$(echo '{"id":"modify_test","method":"call_tool","params":{"name":"modify","arguments":{"files":["'$TEST_FILE'"],"suggestions":[{"type":"improvement","message":"Add a factorial function"}]}}}' | mcp serve)

# Display the output in a more readable format
echo -e "${GREEN}Modify tool output:${NC}"
echo "$MODIFY_OUTPUT" | grep -o '{.*}' | python3 -m json.tool || echo "$MODIFY_OUTPUT"

# Check if the file was actually modified
echo -e "\n${GREEN}3. Checking if file was modified${NC}"
if diff -q "$TEST_FILE" "$TEST_FILE.bak" > /dev/null; then
    echo -e "${RED}File was NOT modified${NC}"
else
    echo -e "${GREEN}File was successfully modified${NC}"
    echo -e "${BLUE}Changes made:${NC}"
    diff "$TEST_FILE.bak" "$TEST_FILE"
fi

# Restore the original file
mv "$TEST_FILE.bak" "$TEST_FILE"

echo -e "\n${GREEN}Test completed!${NC}"
