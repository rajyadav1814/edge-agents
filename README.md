# VSCode Remote MCP

A robust Model Control Protocol (MCP) server implementation for VSCode integration with edge agents.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Security Considerations](#security-considerations)
- [Testing](#testing)
- [Recent Improvements](#recent-improvements)
- [Future Recommendations](#future-recommendations)
- [Contributing](#contributing)
- [License](#license)

## Overview

The VSCode Remote MCP project provides a secure and efficient communication layer between VSCode and edge agents using the Model Control Protocol (MCP). It enables real-time collaboration, command execution, and file operations within VSCode while maintaining strict security controls.

### Key Features

- **Secure Communication**: Token-based authentication and strict validation of all messages
- **Real-time Collaboration**: Support for shared sessions, terminals, and editor instances
- **Command Execution**: Controlled execution of whitelisted commands
- **File Operations**: Secure file access with path restrictions
- **Error Handling**: Comprehensive error handling with recovery strategies
- **TypeScript Support**: Full TypeScript implementation with type safety

## Architecture

The VSCode Remote MCP follows a client-server architecture:

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│             │      │              │      │             │
│   VSCode    │◄────►│  MCP Server  │◄────►│ Edge Agents │
│   Client    │      │              │      │             │
│             │      │              │      │             │
└─────────────┘      └──────────────┘      └─────────────┘
```

### Core Components

1. **Message Validator**: Ensures all messages conform to the MCP protocol
2. **Connection Manager**: Handles client connections and session management
3. **Error Handler**: Provides robust error handling and recovery strategies
4. **Environment Configuration**: Centralizes all configuration with secure defaults
5. **Logger**: Structured logging with configurable levels

### Message Flow

1. Client sends a request to the MCP server
2. Server validates the message format and authentication
3. Server processes the request (file operation, command execution, etc.)
4. Server sends a response back to the client
5. Error handling occurs at each step with appropriate recovery

## Installation

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- TypeScript (v4.5 or higher)

### Setup

1. Clone the repository:

```bash
git clone https://github.com/your-org/vscode-remote-mcp.git
cd vscode-remote-mcp
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file based on the provided `.env.example`:

```bash
cp .env.example .env
```

4. Build the TypeScript code:

```bash
npm run build
```

## Configuration

The MCP server is highly configurable through environment variables. Create a `.env` file in the project root with the following settings:

### Server Configuration

```
# Server Configuration
MCP_SERVER_NAME=vscode-mcp-server
MCP_SERVER_VERSION=1.0.0
MCP_SERVER_VENDOR=Edge Agents
MCP_SERVER_DESCRIPTION=MCP server for VSCode integration with edge agents
```

### Authentication

```
# Authentication
MCP_AUTH_TOKEN=<your_secure_token>
MCP_AUTH_ENABLED=true
```

> **IMPORTANT**: Replace `<your_secure_token>` with a strong, unique token. Never commit this value to version control.

### Logging

```
# Logging
MCP_LOG_LEVEL=info  # Options: error, warn, info, debug
```

### Security

```
# Security
MCP_ALLOWED_ORIGINS=*
MCP_CORS_ENABLED=true
```

> **NOTE**: In production, replace `*` with specific allowed origins.

### Command Execution

```
# Command Execution
MCP_COMMAND_TIMEOUT_MS=30000
MCP_ALLOWED_COMMANDS=npm test,npm install,tsc,git log,git show,cd,ls,node,npm run,deno task,deno test
MCP_BLOCKED_COMMANDS=rm -rf,git push
```

### File Operations

```
# File Operations
MCP_MAX_FILE_SIZE_MB=10
MCP_ALLOWED_FILE_PATHS=./,../,src/,scripts/
```

## Usage

### Starting the Server

```bash
npm start
```

Or for development with auto-reloading:

```bash
npm run dev
```

### Running Tests

```bash
npm test
```

Or run specific test suites:

```bash
# Run initialize test
node test-initialize.js

# Run discovery test
node test-discovery.js

# Run TypeScript server test
node test-typescript-server.js

# Run multi-step test
node test-multi-step.js
```

### Client Integration

To integrate with the MCP server from a client:

```javascript
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:3000');

// Send a client_hello message
ws.on('open', () => {
  const clientHello = {
    type: 'client_hello',
    payload: {
      clientId: 'my-client-id',
      version: '1.0.0'
    }
  };
  ws.send(JSON.stringify(clientHello));
});

// Handle server messages
ws.on('message', (data) => {
  const message = JSON.parse(data);
  console.log('Received:', message);
});
```

## Security Considerations

### Authentication

The MCP server uses token-based authentication. All clients must provide a valid token in their connection request. To enhance security:

1. Use a strong, randomly generated token
2. Rotate tokens regularly
3. Use environment variables to store tokens, never hardcode them
4. Enable HTTPS in production environments

### Command Execution

The MCP server restricts command execution to a whitelist of allowed commands:

1. Only explicitly allowed commands can be executed
2. Blocked commands are rejected regardless of context
3. All commands have a configurable timeout
4. Command output is sanitized before being returned

### File Operations

File access is restricted to prevent unauthorized access:

1. Only files within allowed paths can be accessed
2. Maximum file size is enforced
3. Path traversal attacks are prevented through validation
4. File operations are logged for audit purposes

### Error Handling

The error handling system is designed to prevent information leakage:

1. Detailed error information is only logged, not sent to clients
2. Generic error messages are returned to clients
3. Authentication errors do not reveal whether the token or username was incorrect
4. Rate limiting prevents brute force attacks

## Testing

The project includes comprehensive test coverage to ensure reliability:

### Unit Tests

Run unit tests with Jest:

```bash
npm test
```

### Integration Tests

Run integration tests that verify end-to-end functionality:

```bash
./run-tests.sh
```

### Test Coverage

Generate a test coverage report:

```bash
npm run test:coverage
```

The project maintains a minimum of 80% test coverage across all critical components.

## Recent Improvements

The following improvements have been made to enhance the codebase:

1. **TypeScript Migration**: Converted the codebase from JavaScript to TypeScript for improved type safety and developer experience
2. **Enhanced Error Handling**: Implemented a comprehensive error handling system with recovery strategies
3. **Improved Authentication**: Strengthened the authentication system with token validation and session management
4. **Structured Logging**: Added structured logging with configurable levels
5. **Environment Configuration**: Centralized all configuration with secure defaults
6. **Message Validation**: Enhanced message validation to ensure protocol compliance
7. **Test Coverage**: Increased test coverage to over 80%
8. **Security Hardening**: Implemented additional security measures for command execution and file operations

## Future Recommendations

Based on our security review, we recommend the following improvements:

1. **End-to-End Encryption**: Implement end-to-end encryption for all communication
2. **OAuth Integration**: Add support for OAuth authentication
3. **Permission System**: Implement a fine-grained permission system for commands and file operations
4. **Audit Logging**: Add comprehensive audit logging for security events
5. **Rate Limiting**: Implement rate limiting to prevent abuse
6. **Container Deployment**: Provide Docker containerization for easier deployment
7. **Health Monitoring**: Add health checks and monitoring endpoints
8. **Performance Optimization**: Optimize message handling for large payloads
9. **WebSocket Compression**: Implement WebSocket compression for reduced bandwidth usage
10. **Client Libraries**: Develop official client libraries for common languages

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -am 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a pull request

Please ensure your code passes all tests and maintains the existing code style.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
