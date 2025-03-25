# SPARC2 MCP Server

A Model Context Protocol (MCP) server implementation for the SPARC2 framework, enabling code analysis, modification, execution, and version control through a standardized interface.

## Overview

The SPARC2 MCP Server integrates the powerful SPARC2 framework with the Model Context Protocol (MCP) architecture, providing a standardized way for AI agents to interact with code. This server enables:

- **Code Analysis**: Identify bugs, performance issues, and potential improvements
- **Code Modification**: Implement suggested changes with precision
- **Code Execution**: Run code in a secure sandbox environment
- **Version Control**: Create checkpoints and roll back to previous states

## Features

- **MCP-Compatible Interface**: Works with any MCP client
- **Secure Code Execution**: Uses E2B code interpreter for sandboxed execution
- **Configurable Execution Modes**: Supports automatic, semi-automatic, and manual modes
- **Vector Store Integration**: Enables semantic search across your codebase
- **Checkpoint Management**: Create and restore code checkpoints

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/sparc2-mcp.git
   cd sparc2-mcp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure the server:
   ```bash
   cp config/.env.example config/.env
   # Edit config/.env to add your API keys
   ```

## Configuration

The server is configured using TOML files and environment variables:

- `config/config.toml`: General server configuration
- `config/agent-config.toml`: Agent-specific configuration
- `config/.env`: Environment variables and API keys

### Required Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key
- `E2B_API_KEY`: Your E2B API key for code execution
- `MCP_SECRET_KEY`: Secret key for MCP authentication

## Usage

### Starting the Server

```bash
./run-sparc2-mcp.sh
```

Or manually:

```bash
node sparc2_mcp.js
```

### Testing the Server

```bash
node test-mcp.js
```

## Available Tools

The SPARC2 MCP Server provides the following tools:

### analyze_code

Analyzes code for bugs, performance issues, and potential improvements.

Parameters:
- `files`: Array of file paths to analyze
- `task`: Description of the analysis task

### modify_code

Modifies code based on suggestions.

Parameters:
- `files`: Array of file paths to modify
- `suggestions`: Description of the suggested modifications

### execute_code

Executes code in a secure sandbox.

Parameters:
- `code`: Code to execute
- `language`: Programming language (javascript, typescript, python)

### create_checkpoint

Creates a checkpoint (commit) for the current state.

Parameters:
- `message`: Checkpoint message

### rollback

Rolls back to a previous checkpoint.

Parameters:
- `checkpoint`: Checkpoint ID to roll back to

## Integration with Other Tools

The SPARC2 MCP Server can be integrated with various tools and frameworks:

- **VS Code Extensions**: Create extensions that use the MCP client to interact with the server
- **CI/CD Pipelines**: Automate code analysis and modification in your CI/CD workflow
- **Custom Agents**: Build your own AI agents that use the MCP client to interact with the server

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.