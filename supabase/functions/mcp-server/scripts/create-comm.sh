#!/bin/bash
# Script to create inter-agent communication files
# This script helps facilitate communication between agents working on the MCP server

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Navigate to the comms directory
cd "$(dirname "$0")/../comms"

# Check if comms directory exists, if not create it
if [ ! -d "$(dirname "$0")/../comms" ]; then
  mkdir -p "$(dirname "$0")/../comms"
  echo -e "${GREEN}Created comms directory${NC}"
fi

# Function to display usage
usage() {
  echo -e "${BLUE}Inter-Agent Communication Script${NC}"
  echo -e "${YELLOW}Usage:${NC}"
  echo "  $0 from to subject"
  echo ""
  echo "Arguments:"
  echo "  from      - Your agent number (1-4)"
  echo "  to        - Recipient agent number (1-4) or 'all'"
  echo "  subject   - Brief subject of the message (use hyphens for spaces)"
  echo ""
  echo "Example:"
  echo "  $0 1 2 question-about-tools"
  echo ""
  echo "This will create a file named 'agent1-to-agent2-question-about-tools.md'"
  echo "and open it in your default editor."
  exit 1
}

# Check if correct number of arguments
if [ $# -ne 3 ]; then
  usage
fi

FROM=$1
TO=$2
SUBJECT=$3

# Validate agent numbers
if ! [[ "$FROM" =~ ^[1-4]$ ]] && [[ "$FROM" != "all" ]]; then
  echo -e "${RED}Error: 'from' must be a number between 1 and 4${NC}"
  usage
fi

if ! [[ "$TO" =~ ^[1-4]$ ]] && [[ "$TO" != "all" ]]; then
  echo -e "${RED}Error: 'to' must be a number between 1 and 4 or 'all'${NC}"
  usage
fi

# Create filename
if [[ "$TO" == "all" ]]; then
  FILENAME="agent${FROM}-to-all-${SUBJECT}.md"
else
  FILENAME="agent${FROM}-to-agent${TO}-${SUBJECT}.md"
fi

# Check if file already exists
if [ -f "$FILENAME" ]; then
  echo -e "${YELLOW}Warning: File $FILENAME already exists${NC}"
  read -p "Do you want to overwrite it? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Aborted${NC}"
    exit 1
  fi
fi

# Create the file with template
cat > "$FILENAME" << EOF
# Communication: Agent $FROM to Agent $TO

## Subject: ${SUBJECT//-/ }

## From: Agent $FROM

## To: Agent $TO

## Date: $(date +"%Y-%m-%d %H:%M:%S")

## Message:

[Your message here]

## Attachments:

[Optional: Include code snippets, diagrams, or links to relevant files]

## Action Items:

- [ ] [Action item 1]
- [ ] [Action item 2]
- [ ] [Action item 3]

## Response Needed By:

[Optional: Specify a deadline if applicable]
EOF

echo -e "${GREEN}Created communication file: ${FILENAME}${NC}"

# Try to open the file in the default editor
if [ -n "$EDITOR" ]; then
  $EDITOR "$FILENAME"
elif command -v code &> /dev/null; then
  code "$FILENAME"
elif command -v nano &> /dev/null; then
  nano "$FILENAME"
elif command -v vim &> /dev/null; then
  vim "$FILENAME"
else
  echo -e "${YELLOW}File created, but could not find a suitable editor to open it.${NC}"
  echo -e "${YELLOW}Please open ${FILENAME} manually.${NC}"
fi

echo -e "${BLUE}Communication workflow:${NC}"
echo -e "1. Edit the file with your message"
echo -e "2. Commit and push the changes"
echo -e "3. Notify the recipient agent"
echo -e "4. The recipient should create a response file using this script"