# SPARC 2.0 Tests

This directory contains tests for the SPARC 2.0 CLI and related functionality.

## Test Structure

- `cli-test.ts`: Tests the basic CLI commands in parallel
- `humaneval-test.ts`: Tests HumanEval tasks in parallel
- `run-tests.ts`: Main entry point that runs all tests in parallel

## Running Tests

To run all tests in parallel:

```bash
deno run --allow-read --allow-write --allow-env --allow-net --allow-run run-tests.ts
```

To run individual test files:

```bash
# Run CLI tests
deno run --allow-read --allow-write --allow-env --allow-net --allow-run cli-test.ts

# Run HumanEval tests
deno run --allow-read --allow-write --allow-env --allow-net --allow-run humaneval-test.ts
```

## Test Configuration

The tests use the configuration in the `config` directory. Make sure the `agent-config.toml` file exists in the `config` directory before running the tests.

## Adding New Tests

To add new tests:

1. Create a new test file in the `tests` directory
2. Import the necessary modules
3. Implement the test functions
4. Add the test file to `run-tests.ts` to include it in the parallel test execution