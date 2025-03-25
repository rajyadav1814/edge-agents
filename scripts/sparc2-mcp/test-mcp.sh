 #!/bin/bash

# Test MCP Server
# This script tests the SPARC2-MCP server by sending requests to it

echo "Testing SPARC2-MCP server..."

# List tools request
echo -e "\n--- Test 1: List tools ---"
echo '{"id":"list_tools","method":"list_tools","params":{}}' | mcp serve

# Analyze tool request
echo -e "\n--- Test 2: Call analyze tool ---"
echo '{"id":"analyze_test","method":"call_tool","params":{"name":"analyze","arguments":{"files":["/workspaces/edge-agents/scripts/sparc2-mcp/test-mcp.sh"]}}}' | mcp serve

echo -e "\nTests completed!"