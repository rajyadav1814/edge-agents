# OpenAI Proxy with Stripe Metering - Test Suite

This directory contains comprehensive tests for the OpenAI proxy with Stripe metering edge function. The test suite covers all major components and ensures proper functionality, security, and performance.

## Test Coverage

The test suite maintains a minimum of 80% code coverage and includes:

- Unit tests for individual components
- Integration tests for full request flow
- Performance and load testing
- Error handling scenarios
- CORS and security validation

## Test Files

- `index.test.ts` - Main functionality tests
- `providers.test.ts` - AI provider implementation tests
- `errors.test.ts` - Error handling and validation tests
- `integration.test.ts` - End-to-end flow tests
- `performance.test.ts` - Performance and load tests
- `cors.test.ts` - CORS handling tests

## Running Tests

To run the complete test suite:

```bash
deno run --allow-env --allow-net --allow-read run-tests.ts
```

This will:
1. Execute all tests in parallel
2. Generate coverage reports
3. Validate coverage thresholds
4. Output test results

## Test Configuration

Test settings are managed in `test.config.ts`:

```typescript
{
  performance: {
    maxLatencyMs: 2000,
    maxRequestsPerMinute: 60,
    // ... other performance settings
  },
  coverage: {
    threshold: 80,
    // ... coverage settings
  }
}
```

## Mock Implementations

Test utilities and mocks are provided in `test_utils.ts`:

- `MockAIProvider` - Mock AI provider implementation
- `MockStripeMetering` - Mock Stripe metering implementation
- Test helpers and utilities

## Environment Setup

Tests require environment variables defined in `.env`:

```env
STRIPE_SECRET_KEY=test_stripe_key
OPENAI_API_KEY=test_openai_key
AZURE_ENDPOINT=https://test.azure.com
ANTHROPIC_API_KEY=test_anthropic_key
```

## Test Categories

### 1. Provider Tests
- OpenAI implementation
- Azure implementation
- Anthropic implementation
- Provider error handling

### 2. Metering Tests
- Stripe integration
- Usage tracking
- Subscription validation

### 3. Request Flow Tests
- Authentication
- Authorization
- Input validation
- Response formatting

### 4. Performance Tests
- Latency requirements
- Concurrent requests
- Memory usage
- Rate limiting

### 5. Security Tests
- CORS validation
- API key validation
- Error handling
- Input sanitization

## Contributing

When adding new tests:

1. Follow the existing test structure
2. Maintain type safety
3. Add proper mocks
4. Update documentation
5. Verify coverage

## Debugging

Test output and coverage reports are available in:
- `coverage/` - Coverage data
- `coverage.lcov` - LCOV format report

## Common Issues

1. **Test Timeouts**
   - Increase timeout in `TestConfig.timeouts`
   - Check for hanging promises

2. **Coverage Issues**
   - Verify included files
   - Check excluded patterns
   - Add missing test cases

3. **Mock Failures**
   - Update mock implementations
   - Check provider interfaces
   - Verify environment setup

## Best Practices

1. Write tests first (TDD)
2. Mock external dependencies
3. Test error cases
4. Maintain type safety
5. Document complex tests
6. Keep tests focused and atomic
7. Use descriptive test names
8. Clean up test resources