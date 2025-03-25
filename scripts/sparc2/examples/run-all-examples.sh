#!/bin/bash

# SPARC2 Run All Examples
# This script runs all SPARC2 examples in sequence
# It's recommended to run this in a clean environment to avoid conflicts

# Set strict mode
set -e

# Change to the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "====================================="
echo "SPARC2 Examples Runner"
echo "====================================="
echo ""
echo "This script will run all SPARC2 examples in sequence."
echo "Press Ctrl+C at any time to stop."
echo ""
echo "Examples will execute in the following order:"
echo "1. Basic Analysis"
echo "2. Code Modification"
echo "3. Checkpointing"
echo "4. Rollback"
echo "5. Code Execution"
echo "6. Vector Search and Configuration"
echo "7. Advanced Workflow"
echo ""
read -p "Press Enter to start the examples or Ctrl+C to exit..."
echo ""

# Make sure all scripts are executable
chmod +x *.sh

# Function to run an example with a pause between examples
run_example() {
    clear
    echo "====================================="
    echo "Running Example: $1"
    echo "====================================="
    echo ""
    ./$1
    echo ""
    echo "Example completed."
    echo ""
    read -p "Press Enter to continue to the next example..."
    echo ""
}

# Run each example in sequence
run_example "01-basic-analysis.sh"
run_example "02-code-modification.sh"
run_example "03-checkpointing.sh"
run_example "04-rollback.sh"
run_example "05-code-execution.sh"
run_example "06-vector-search-config.sh"
run_example "07-advanced-workflow.sh"

# Final message
clear
echo "====================================="
echo "All SPARC2 Examples Completed"
echo "====================================="
echo ""
echo "You have successfully run all SPARC2 examples."
echo "These examples demonstrated the key features of SPARC2:"
echo ""
echo "- Code Analysis: Identifying issues and improvements"
echo "- Code Modification: Applying changes based on analysis"
echo "- Checkpointing: Version control integration"
echo "- Rollback: Reverting to previous versions"
echo "- Code Execution: Running code in a secure sandbox"
echo "- Vector Search: Finding code patterns across a codebase"
echo "- Configuration Management: Customizing SPARC2 behavior"
echo "- Advanced Workflows: Complex refactoring scenarios"
echo ""
echo "For more information, refer to the SPARC2 documentation."
echo ""
echo "====================================="