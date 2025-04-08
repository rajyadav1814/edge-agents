# OpenAI Proxy with Stripe Metering - Test Suite

This document describes the test suite for the OpenAI proxy with Stripe metering edge function.

## Test Coverage

The test suite aims for a minimum of 80% code coverage and includes:

- Unit tests for individual components
- Integration tests for full request flow
- Performance tests for critical paths
- CORS handling tests
- Error handling tests

## Test Files

1. `index.test.ts` - Main request handling tests
   - Request validation
   - API key validation
   - Request body validation
   - Success cases
   - Error handling

2. `providers.test.ts` - Provider implementation tests
   - OpenAI provider
   - Azure provider
   - Provider selection
   - Error handling

3. `stripe.test.ts` - Stripe metering tests
   - API key validation
   - Usage recording
   - Subscription validation
   - Rate limiting

4. `cors.test.ts` - CORS handling tests
   - Preflight requests
   - CORS headers
   - Different origins
   - Different methods

5. `performance.test.ts` - Performance requirement tests
   - Latency tests
   - Concurrency tests
   - Memory usage
   - Token limits

## Running Tests

### Prerequisites

1. Deno installed (version >= 1.30.0)
2. Required environment variables:
   ```bash
   OPENAI_API_KEY=your_openai_key
   STRIPE_SECRET_KEY=your_stripe_key
   AZURE_ENDPOINT=your_azure_endpoint
   AZURE_API_KEY=your_azure_key
   ```

### Commands

Run all tests:
```bash
deno task test
```

Run specific test file:
```bash
deno test --allow-read --allow-env --allow-net path/to/test.ts
```

Run tests with coverage:
```bash
deno task test:coverage
```

### Test Runner

The `run-tests.ts` script provides a comprehensive test runner that:
- Runs all test files
- Generates coverage reports
- Validates coverage threshold
- Provides test summary

Run with:
```bash
deno run --allow-read --allow-write --allow-env --allow-net run-tests.ts
```

## Test Configuration

Test configuration is managed in `test.config.ts` and includes:

- Performance thresholds
- Coverage requirements
- Mock data
- Environment variables
- Timeouts and retries

## Mocking

The test suite uses mocks for:
- External API calls
- Environment variables
- Stripe responses
- Provider responses

## Coverage Reports

Coverage reports are generated in multiple formats:
- LCOV (coverage/lcov.info)
- HTML (coverage/html/index.html)
- Console summary

## Continuous Integration

Tests are automatically run in CI/CD pipeline with:
- Coverage validation
- Performance validation
- Error reporting
- Test summary generation

## Test Categories

### Unit Tests
- Provider implementations
- Stripe metering
- Request handling
- Error handling

### Integration Tests
- Full request flow
- Provider selection
- Metering integration
- Error propagation

### Performance Tests
- Latency requirements
- Concurrency handling
- Memory usage
- Token limits

### CORS Tests
- Preflight handling
- Header validation
- Origin handling
- Method validation

## Debugging Tests

1. Enable verbose logging:
   ```bash
   deno test --allow-all --log-level=debug
   ```

2. Run single test:
   ```bash
   deno test --filter="test name" test_file.ts
   ```

3. Debug with Visual Studio Code:
   - Set breakpoints
   - Use "Deno: Debug Test" configuration
   - Step through test execution

## Adding New Tests

1. Create test file following naming convention: `feature.test.ts`
2. Import required modules and test utilities
3. Add test cases following TDD approach
4. Update test configuration if needed
5. Verify coverage meets requirements

## Best Practices

1. Write failing test first
2. Keep tests focused and isolated
3. Use descriptive test names
4. Mock external dependencies
5. Validate edge cases
6. Clean up test environment
7. Maintain test documentation