# Mastra AI Agent Tests

This directory contains comprehensive tests for the Mastra AI agent Supabase Edge Function.

## Test Coverage

The tests cover the following components:

- Main index.ts file
- Authentication middleware
- CORS handling
- Weather tool implementation
- Configuration loading

## Running Tests

To run all tests:

```bash
deno test --allow-env --allow-net tests/run_tests.ts
```

To run a specific test file:

```bash
deno test --allow-env --allow-net tests/index.test.ts
```

## Test Files

- `index.test.ts` - Tests for the main handler function
- `middleware.test.ts` - Tests for authentication and CORS middleware
- `weather.test.ts` - Tests for the weather tool
- `config.test.ts` - Tests for configuration loading
- `mocks/types.ts` - Type definitions for test mocks

## Test Structure

Each test file follows a similar structure:

1. Import necessary modules
2. Define test cases using `Deno.test`
3. Use assertions from Deno's standard library
4. Mock external dependencies where needed

## Mocking

The tests use Deno's built-in mocking capabilities:

- `stub` - Replace a function with a test double
- `spy` - Monitor function calls without changing behavior

## Environment Variables

Tests are designed to work with or without environment variables. When environment variables are not set, the tests use sensible defaults.

No secrets or API keys are hardcoded in the tests.

## Adding New Tests

When adding new tests:

1. Create a new test file in the `tests` directory
2. Import it in `run_tests.ts`
3. Follow the existing test patterns
4. Ensure proper cleanup after tests

## Code Coverage

To run tests with code coverage:

```bash
deno test --coverage=coverage --allow-env --allow-net tests/run_tests.ts
deno coverage coverage
```

This will generate a coverage report showing which parts of the code are tested.