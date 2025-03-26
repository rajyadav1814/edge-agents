# SPARC2 Examples

This directory contains example scripts that demonstrate various features of SPARC2, the Autonomous Vectorized Coding Bot.

## Running the Examples

To run all examples in sequence:

```bash
./run-all-examples.sh
```

You can also run individual examples:

```bash
./01-basic-analysis.sh
```

## Examples Overview

1. **Basic Analysis** (01-basic-analysis.sh)
   - Demonstrates how to analyze a JavaScript file for issues and improvements
   - Shows SPARC2's code analysis capabilities

2. **Code Modification** (02-code-modification.sh)
   - Shows how to apply suggested modifications to code files
   - Demonstrates SPARC2's ability to fix issues automatically

3. **Checkpointing** (03-checkpointing.sh)
   - Shows how to create Git checkpoints to track code changes
   - Demonstrates version control integration

4. **Rollback** (04-rollback.sh)
   - Demonstrates how to rollback to previous versions of code
   - Shows temporal code management capabilities

5. **Code Execution** (05-code-execution.sh)
   - Shows how to execute code in a secure sandbox
   - Demonstrates multi-language support (JavaScript and Python)

6. **Vector Search and Configuration** (06-vector-search-config.sh)
   - Demonstrates vector search capabilities across a codebase
   - Shows how to manage and customize SPARC2 configuration

7. **Advanced Workflow** (07-advanced-workflow.sh)
   - Shows a complete refactoring workflow across multiple files
   - Demonstrates advanced features like swarm processing and function-level diff tracking

8. **MCP Server** (08-mcp-server.sh)
   - Demonstrates how to run SPARC2 as a Model Context Protocol (MCP) server
   - Shows how to expose SPARC2 capabilities via a RESTful API
   - Enables integration with other tools and services

9. **MCP Client Test** (09-mcp-client-test.sh)
   - Tests the MCP server with various API calls
   - Demonstrates how to interact with the MCP server using curl
   - Includes examples for analyzing code, modifying code, executing code, and creating checkpoints

## Prerequisites

To run these examples, you need:
- Deno runtime installed
- OpenAI API key configured in your .env file
- E2B API key configured in your .env file (for code execution examples)
- jq installed (for the MCP client test example)

## Notes

- These examples are designed to run in sequence, as some examples build on the changes made in previous examples.
- For demonstration purposes, some examples include code with intentional issues to be fixed.
- The examples are self-contained and will clean up any temporary files they create.
- For the MCP server examples (08 and 09), you'll need to run the server in one terminal and the client test in another.
