#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Running OpenAI Proxy Tests...${NC}"
echo "----------------------------------------"

# Run formatter
echo -e "\n${YELLOW}Running formatter...${NC}"
deno fmt --config=deno.test.json
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Formatting passed${NC}"
else
  echo -e "${RED}✗ Formatting failed${NC}"
  exit 1
fi

# Run linter
echo -e "\n${YELLOW}Running linter...${NC}"
deno lint --config=deno.test.json
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Linting passed${NC}"
else
  echo -e "${RED}✗ Linting failed${NC}"
  exit 1
fi

# Run type checker
echo -e "\n${YELLOW}Running type checker...${NC}"
deno check **/*.ts
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Type checking passed${NC}"
else
  echo -e "${RED}✗ Type checking failed${NC}"
  exit 1
fi

# Create coverage directory if it doesn't exist
mkdir -p coverage

# Run tests with coverage
echo -e "\n${YELLOW}Running tests with coverage...${NC}"
deno test --allow-env --allow-net --allow-read --allow-write \
  --coverage=coverage --config=deno.test.json

# Check if tests passed
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ All tests passed${NC}"
else
  echo -e "${RED}✗ Some tests failed${NC}"
  exit 1
fi

# Generate coverage report
echo -e "\n${YELLOW}Generating coverage report...${NC}"
deno coverage coverage --lcov > coverage.lcov

# Calculate coverage percentage
COVERAGE=$(deno coverage coverage | grep "cover" | awk '{print $2}' | tr -d '%')
THRESHOLD=80

echo -e "\n${GREEN}Coverage Report:${NC}"
echo "----------------------------------------"
echo -e "Total Coverage: ${YELLOW}${COVERAGE}%${NC}"

# Check coverage threshold
if (( $(echo "$COVERAGE >= $THRESHOLD" | bc -l) )); then
  echo -e "${GREEN}✓ Coverage meets minimum threshold of ${THRESHOLD}%${NC}"
else
  echo -e "${RED}✗ Coverage below minimum threshold of ${THRESHOLD}%${NC}"
  echo -e "${RED}Please add more tests to improve coverage${NC}"
  exit 1
fi

# Print test summary
echo -e "\n${GREEN}Test Summary:${NC}"
echo "----------------------------------------"
echo -e "${GREEN}✓ Formatting${NC}"
echo -e "${GREEN}✓ Linting${NC}"
echo -e "${GREEN}✓ Type Checking${NC}"
echo -e "${GREEN}✓ Tests${NC}"
echo -e "${GREEN}✓ Coverage${NC}"

echo -e "\n${GREEN}All checks passed successfully!${NC}"
exit 0