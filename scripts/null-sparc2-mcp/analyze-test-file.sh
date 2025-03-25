#!/bin/bash

# Test MCP Server - Analyze test-file.js
# This script tests the SPARC2-MCP server by analyzing the test-file.js

echo "Testing SPARC2-MCP server - Analyzing test-file.js..."

# Analyze tool request for test-file.js
echo '{"id":"analyze_test","method":"call_tool","params":{"name":"analyze","arguments":{"files":["/workspaces/edge-agents/scripts/sparc2/test-file.js"]}}}' | mcp serve

echo -e "\nAnalysis completed!"
