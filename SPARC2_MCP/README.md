# SPARC2_MCP

SPARC2_MCP is an integration of the SPARC2 framework with the Master Control Program (MCP) architecture, providing a unified system for autonomous code analysis, modification, and management.

## Overview

SPARC2_MCP combines the powerful code analysis and modification capabilities of SPARC2 with the task management and orchestration features of the MCP. This integration enables:

- Centralized task management through the MCP
- Improved error handling and reporting
- Structured logging with vector database integration
- Consistent API for all SPARC2 operations

## Installation

1. Clone the repository:
```bash
git clone https://github.com/agentics-org/edge-agents.git
cd edge-agents/scripts/SPARC2_MCP
```

2. Create a `.env` file in the `config` directory (you can copy from `.env.example`):
```bash
cp config/.env.example config/.env
```

3. Edit the `.env` file to add your API keys:
```
OPENAI_API_KEY=your_openai_api_key
E2B_API_KEY=your_e2b_api_key
MCP_SECRET_KEY=your_mcp_secret_key
```

## Usage

The SPARC2_MCP CLI provides a command-line interface for all SPARC2 operations:

```bash
./sparc2_mcp.js <command> [options]
```

### Commands

- `analyze <files>`: Analyze code files for issues and improvements
- `modify <files> <suggestions>`: Modify code files based on suggestions
- `execute <file> [language]`: Execute code in a sandbox environment
- `checkpoint <message>`: Create a checkpoint for the current state
- `rollback <commit>`: Rollback to a previous checkpoint
- `search <query> [max-results]`: Search for similar code changes
- `config <action> [key] [value]`: Manage configuration

### Examples

Analyze JavaScript files:
```bash
./sparc2_mcp.js analyze src/app.js,src/utils.js
```

Modify a file based on suggestions:
```bash
./sparc2_mcp.js modify src/app.js "Fix the bug in the multiply function"
```

Execute a Python file:
```bash
./sparc2_mcp.js execute script.py python
```

Create a checkpoint:
```bash
./sparc2_mcp.js checkpoint "Fixed bugs in calculation module"
```

Rollback to a previous checkpoint:
```bash
./sparc2_mcp.js rollback abc123def456
```

Search for similar code changes:
```bash
./sparc2_mcp.js search "function that calculates factorial"
```

Get a configuration value:
```bash
./sparc2_mcp.js config get models.reasoning
```

## Configuration

SPARC2_MCP uses TOML configuration files:

- `config/config.toml`: General configuration
- `config/agent-config.toml`: Agent-specific configuration

You can modify these files directly or use the `config` command to get or set values.

## Architecture

SPARC2_MCP consists of several key components:

1. **SPARC2 Agent**: Handles code analysis, modification, and execution
2. **MCP Client**: Communicates with the Master Control Program
3. **Vector Store**: Stores and indexes code changes for similarity search
4. **Configuration Manager**: Handles loading and parsing configuration files
5. **CLI**: Provides a command-line interface for all operations

## License

MIT