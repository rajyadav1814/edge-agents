# SPARC2 Examples

This directory contains example scripts demonstrating how to use SPARC2.

## Basic Examples

- `01-basic-analysis.sh` - Basic code analysis example
- `02-code-modification.sh` - Code modification example
- `03-code-execution.sh` - Code execution example
- `04-search.sh` - Vector search example
- `05-checkpoint.sh` - Git checkpoint example
- `06-rollback.sh` - Rollback to previous checkpoint example
- `07-config.sh` - Configuration management example
- `08-mcp-server.sh` - Start the MCP server
- `09-mcp-client-test.sh` - Test the MCP client

## Advanced Examples

- `test-mcp-endpoints.sh` - Comprehensive test script for all MCP server endpoints

## Running the Examples

Most examples can be run directly:

```bash
./examples/01-basic-analysis.sh
```

## MCP Server Testing

The `test-mcp-endpoints.sh` script tests all MCP server endpoints using curl. It demonstrates how to interact with the MCP server programmatically.

### Prerequisites

1. Make sure the MCP server is running:
   ```bash
   ./scripts/sparc2/sparc mcp
   ```
   or
   ```bash
   ./scripts/sparc2/examples/08-mcp-server.sh
   ```

2. Install `jq` for JSON formatting (optional but recommended):
   ```bash
   sudo apt-get install jq  # Debian/Ubuntu
   ```

### Usage

```bash
# Run with default settings (port 3001)
./scripts/sparc2/examples/test-mcp-endpoints.sh

# Specify a different port
./scripts/sparc2/examples/test-mcp-endpoints.sh --port 3002

# Clean up Git tags before running (recommended if you get tag conflicts)
./scripts/sparc2/examples/test-mcp-endpoints.sh --clean
```

### What the Test Script Does

The script tests the following MCP endpoints:

1. `/discover` - Lists all available tools and resources
2. `/execute` - Tests code execution with both JavaScript and Python
3. `/config` - Tests configuration management
4. `/search` - Tests vector search capabilities
5. `/analyze` - Tests code analysis on a temporary file
6. `/modify` - Tests code modification on a temporary file
7. `/checkpoint` - Tests creating Git checkpoints

### Troubleshooting

If you encounter errors with the analyze or modify endpoints related to Git tags, run the script with the `--clean` option to remove existing tags:

```bash
./scripts/sparc2/examples/test-mcp-endpoints.sh --clean
```

This is particularly useful in development environments where you might run the tests multiple times.
