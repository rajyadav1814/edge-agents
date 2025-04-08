# GitHub API Edge Function Tests

This directory contains tests for the GitHub API Edge Function. The tests are organized into unit tests and integration tests.

## Test Structure

- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test the API endpoints with mocked responses
- **Live Tests**: Test the API with real GitHub API calls

## Running Tests

### Unit Tests

Unit tests verify that individual components work correctly in isolation. They use mock data and don't make actual API calls.

```bash
# Run all unit tests
deno test tests/unit/

# Run a specific unit test file
deno test tests/unit/env-validator.test.ts
```

### Integration Tests

Integration tests verify that the API endpoints work correctly with mocked responses. They don't make actual API calls to GitHub.

```bash
# Run all integration tests
./run-integration-tests.sh

# Or manually:
deno test --allow-net --allow-env tests/integration/
```

### Live Testing

For testing with the actual GitHub API, we provide scripts to run the server and test it:

1. First, make sure you have a valid GitHub token in your `.env` file:

```
GITHUB_TOKEN=your_github_token
GITHUB_ORG=your_organization
GITHUB_API_VERSION=v3
CACHE_TTL=300
```

2. Start the server:

```bash
./run-server.sh
```

3. In another terminal, run the test script:

```bash
./test-api.sh
```

## Test Utilities

- `tests/mocks/test-utils.ts`: Contains utilities for mocking requests, responses, and environment variables
- `tests/mocks/github-responses.ts`: Contains mock GitHub API responses

## Troubleshooting

If you encounter issues with the tests:

1. Make sure your GitHub token is valid and has the necessary permissions
2. Check that the server is running on the expected port (8001)
3. Verify that the environment variables are set correctly
4. For port conflicts, modify the PORT variable in the run-server.sh script

## Adding New Tests

When adding new tests:

1. For unit tests, add them to the appropriate file in `tests/unit/`
2. For integration tests, add them to the appropriate file in `tests/integration/`
3. For testing new endpoints, add them to the `test-api.sh` script