#!/bin/bash

# Test MCP Server - Modify test-file.js
# This script tests the SPARC2-MCP server by modifying the test-file.js

echo "Testing SPARC2-MCP server - Modifying test-file.js..."

# Modify tool request for test-file.js
echo '{"id":"modify_test","method":"call_tool","params":{"name":"modify","arguments":{"files":["/workspaces/edge-agents/scripts/sparc2/test-file.js"],"suggestions":[{"type":"improvement","message":"Add a factorial function"}]}}}' | mcp serve

echo -e "\nModification completed!"
