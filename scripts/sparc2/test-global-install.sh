#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Testing SPARC2 Global Installation ===${NC}"

# Uninstall any existing global installation
echo -e "${YELLOW}Uninstalling any existing global installation...${NC}"
npm uninstall -g @agentics.org/sparc2

# Install the package from npm
echo -e "${YELLOW}Installing package from npm...${NC}"
npm install -g @agentics.org/sparc2

# Copy our updated wrappers to the global installation
echo -e "${YELLOW}Copying updated wrappers to global installation...${NC}"
GLOBAL_DIR=$(npm root -g)
cp sparc2-cli-wrapper.js "$GLOBAL_DIR/@agentics.org/sparc2/"
cp sparc2-mcp-wrapper.js "$GLOBAL_DIR/@agentics.org/sparc2/"

# Run diagnostics
echo -e "${YELLOW}Running diagnostics...${NC}"
sparc2 --diagnostics

# Test basic CLI functionality
echo -e "${YELLOW}Testing basic CLI functionality...${NC}"
sparc2 --help

# Test MCP functionality
echo -e "${YELLOW}Testing MCP functionality...${NC}"
echo -e "${YELLOW}(Press Ctrl+C to exit after a few seconds)${NC}"
timeout 5 sparc2 mcp || true

echo -e "${GREEN}Test complete!${NC}"