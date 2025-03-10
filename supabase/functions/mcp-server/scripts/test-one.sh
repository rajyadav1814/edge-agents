#!/bin/bash
# scripts/test-one.sh
# This script runs one test at a time with automatic timeout

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Default timeout in seconds
TIMEOUT=30

# Function to run a test with timeout
run_test_with_timeout() {
    local test_path=$1
    local timeout=$2
    
    echo -e "${BLUE}Running test: ${test_path}${NC}"
    
    # Run the test with timeout
    timeout $timeout deno test --allow-net --allow-env --allow-read "$test_path"
    local exit_code=$?
    
    if [ $exit_code -eq 124 ]; then
        echo -e "${RED}Test timed out after ${timeout} seconds${NC}"
        return 1
    elif [ $exit_code -ne 0 ]; then
        echo -e "${RED}Test failed with exit code ${exit_code}${NC}"
        return 1
    else
        echo -e "${GREEN}Test passed!${NC}"
        return 0
    fi
}

# Navigate to the project root
cd "$(dirname "$0")/../.."

# Check if Deno is installed
if ! command -v deno &> /dev/null; then
    echo -e "${RED}Error: Deno is not installed${NC}"
    echo "Please install Deno from https://deno.land/#installation"
    exit 1
fi

# Check if timeout command is available
if ! command -v timeout &> /dev/null; then
    echo -e "${RED}Error: 'timeout' command not found${NC}"
    echo "Please install coreutils package"
    exit 1
fi

# Load environment variables for testing
if [ -f test/.env.test ]; then
    source test/.env.test
    echo -e "${GREEN}Loaded test environment variables from test/.env.test${NC}"
elif [ -f .env ]; then
    source .env
    echo -e "${YELLOW}Warning: Using production environment variables from .env${NC}"
else
    echo -e "${YELLOW}Warning: No environment variables found${NC}"
fi

# Get test path from argument or use default order
TEST_PATH=$1

if [ -z "$TEST_PATH" ]; then
    echo -e "${YELLOW}No test path provided, running tests in default order${NC}"
    
    # Define test paths in order of dependency
    TEST_PATHS=(
        # Core tests first
        "supabase/functions/mcp-server/tests/core/auth.test.ts"
        "supabase/functions/mcp-server/tests/core/server.test.ts"
        
        # Tools tests
        "supabase/functions/mcp-server/tests/tools/registry.test.ts"
        "supabase/functions/mcp-server/tests/tools/handlers.test.ts"
        
        # Resources tests
        "supabase/functions/mcp-server/tests/resources/registry.test.ts"
        "supabase/functions/mcp-server/tests/resources/handlers.test.ts"
        
        # Integration tests last
        "supabase/functions/mcp-server/tests/integration/end-to-end.test.ts"
    )
    
    # Run each test with timeout
    for test_path in "${TEST_PATHS[@]}"; do
        if [ -f "$test_path" ]; then
            run_test_with_timeout "$test_path" $TIMEOUT
            if [ $? -ne 0 ]; then
                echo -e "${RED}Test failed: ${test_path}${NC}"
                echo -e "${YELLOW}Fix this test before proceeding to the next one${NC}"
                exit 1
            fi
        else
            echo -e "${YELLOW}Test file not found: ${test_path}${NC}"
        fi
    done
    
    echo -e "${GREEN}All tests passed!${NC}"
else
    # Run the specified test
    if [ -f "$TEST_PATH" ]; then
        run_test_with_timeout "$TEST_PATH" $TIMEOUT
        if [ $? -ne 0 ]; then
            echo -e "${RED}Test failed: ${TEST_PATH}${NC}"
            exit 1
        fi
    elif [ -d "$TEST_PATH" ]; then
        echo -e "${BLUE}Running all tests in directory: ${TEST_PATH}${NC}"
        
        # Find all test files in the directory
        TEST_FILES=$(find "$TEST_PATH" -name "*.test.ts")
        
        # Run each test with timeout
        for test_file in $TEST_FILES; do
            run_test_with_timeout "$test_file" $TIMEOUT
            if [ $? -ne 0 ]; then
                echo -e "${RED}Test failed: ${test_file}${NC}"
                echo -e "${YELLOW}Fix this test before proceeding to the next one${NC}"
                exit 1
            fi
        done
        
        echo -e "${GREEN}All tests in ${TEST_PATH} passed!${NC}"
    else
        echo -e "${RED}Test path not found: ${TEST_PATH}${NC}"
        exit 1
    fi
fi

# Run local server for manual testing
if [ "$2" == "--serve" ]; then
    echo -e "${BLUE}Starting local MCP server for manual testing...${NC}"
    echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
    
    # Create a temporary .env file for the server if it doesn't exist
    if [ ! -f .env ] && [ ! -f supabase/functions/mcp-server/.env ]; then
        echo -e "${YELLOW}Creating temporary .env file for the server${NC}"
        echo "SUPABASE_URL=http://localhost:54321" > supabase/functions/mcp-server/.env
        echo "SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSJ9.vI9obAHOGyVVKa3pD--kJlyxp-Z2zV9UUMAhKpNLAcU" >> supabase/functions/mcp-server/.env
        echo "MCP_SECRET_KEY=$(openssl rand -hex 32)" >> supabase/functions/mcp-server/.env
    fi
    
    # Start the server with a timeout
    timeout 300 deno run --allow-net --allow-env --allow-read supabase/functions/mcp-server/index.ts
    
    # Check if server was terminated by timeout
    if [ $? -eq 124 ]; then
        echo -e "${YELLOW}Server automatically stopped after 5 minutes${NC}"
    fi
fi