# GitHub MCP Server Test Script

This directory contains a comprehensive test script for verifying that the GitHub MCP server installation is working correctly.

## Features

The test script checks:

1. **Server Connectivity** - Verifies the server is running and accessible
2. **API Endpoints** - Tests basic API functionality
3. **Authentication** - Verifies that authentication is working properly
4. **GitHub API Integration** - Tests integration with GitHub API
5. **Error Handling** - Checks that errors are handled appropriately
6. **Performance** - Measures response times for key operations

## Prerequisites

- Node.js 14 or higher
- npm (Node Package Manager)
- A running GitHub MCP server
- GitHub Personal Access Token (for full testing)

## Installation

The test script will automatically install its dependencies when run for the first time. The required dependencies are:

- `node-fetch` - For making HTTP requests
- `dotenv` - For loading environment variables
- `chalk` - For colored console output

## Running the Tests

### Using the Shell Script

The easiest way to run the tests is using the provided shell script:

```bash
./run-mcp-tests.sh
```

This will run all tests against the default server URL (http://localhost:3000).

### Command Line Options

You can customize the test execution with the following options:

```bash
./run-mcp-tests.sh --url=http://localhost:8080 --token=your_github_token --repo=owner/repo --verbose
```

Available options:

- `--url=URL` - Set the MCP server URL (default: http://localhost:3000)
- `--token=TOKEN` - Set the GitHub token for authentication
- `--repo=REPO` - Set the test repository (format: owner/repo)
- `--verbose` - Enable verbose output
- `--help` - Show help message

### Using Environment Variables

You can also set configuration through environment variables:

```bash
export MCP_SERVER_URL=http://localhost:8080
export GITHUB_TOKEN=your_github_token
export TEST_REPO=owner/repo
export VERBOSE=true
./run-mcp-tests.sh
```

### Running Directly with Node.js

If you prefer, you can run the test script directly with Node.js:

```bash
node test-github-mcp-server.js
```

## Test Report

After running the tests, a detailed report will be displayed in the console showing:

- Total number of tests
- Number of passed, failed, and skipped tests
- Pass rate percentage
- Details of each test with status and error messages (if any)

A JSON report file is also saved in the `test-reports` directory for future reference.

## Understanding Test Results

### Passed Tests

Tests that pass indicate that the corresponding functionality is working correctly.

### Failed Tests

Failed tests indicate issues that need to be addressed. The error message will provide details about what went wrong.

### Skipped Tests

Tests may be skipped if they require certain configuration that wasn't provided (e.g., GitHub token).

## Troubleshooting

### Server Not Running

If the tests fail with connection errors, ensure that the GitHub MCP server is running and accessible at the specified URL.

### Authentication Issues

If authentication tests fail:
- Verify that your GitHub token is valid and has the required permissions
- Check that the token is being passed correctly to the test script

### GitHub API Rate Limiting

If you encounter rate limiting issues:
- Use a GitHub token with higher rate limits
- Reduce the frequency of test runs
- Configure the server with appropriate rate limiting settings

## Extending the Tests

The test script is designed to be modular and extensible. To add new tests:

1. Add a new test function in the `test-github-mcp-server.js` file
2. Register the test in the `runAllTests` function

## Security Considerations

- Never commit your GitHub token to version control
- Use environment variables or command line arguments to pass sensitive information
- Consider using a dedicated GitHub token with limited permissions for testing