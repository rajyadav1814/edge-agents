# Gemini Tumbler Tests

This directory contains tests for the Gemini Tumbler service.

## Multi-Key Test

The `multi-key-test.ts` script tests the GoogleGeminiClient with multiple API keys and key rotation functionality.

### Features Tested

- Loading multiple API keys from environment variables
- Initializing the GoogleGeminiClient with multiple keys
- Generating responses using the client
- Automatic key rotation when making multiple requests
- Fallback to alternative keys if one fails

### Running the Test

```bash
# Make sure you have API keys in your .env file
# GEMINI_API_KEY=your_primary_key
# GEMINI_API_KEY_2=your_second_key
# GEMINI_API_KEY_3=your_third_key

# Run the test
deno run --allow-env --allow-net --allow-read tests/multi-key-test.ts
```

### Expected Output

The test will:
1. Load API keys from environment variables
2. Initialize the client with the available keys
3. Send a test prompt about quantum computing
4. Display the response and token usage
5. Make additional requests to demonstrate key rotation
6. Show which key was used for each request

## Multi-Service Test

The `multi-service-test.ts` script tests multiple Google AI services using the GoogleAIServiceFactory.

### Features Tested

- Creating clients for different Google AI services
- Testing Gemini text generation
- Testing Natural Language API sentiment analysis
- Key rotation across services
- Service capabilities and usage limits

### Running the Test

```bash
# Make sure you have API keys and project ID in your .env file
# GEMINI_API_KEY=your_primary_key
# GEMINI_API_KEY_2=your_second_key
# GOOGLE_PROJECT_ID=your_google_cloud_project_id

# Run the test
deno run --allow-env --allow-net --allow-read tests/multi-service-test.ts
```

### Expected Output

The test will:
1. Load API keys and project ID from environment variables
2. Create and test the Gemini service
   - Display service capabilities and limits
   - Generate a response to a test prompt
   - Show token usage
3. Create and test the Natural Language service (if project ID is available)
   - Display service capabilities and limits
   - Analyze sentiment of a test text
   - Show token usage

## Implementation Details

### GoogleGeminiClient

The multi-key functionality is implemented in the `GoogleGeminiClient` class, which:

1. Accepts multiple API keys in its constructor
2. Initializes a separate model instance for each key
3. Rotates through available keys when making requests
4. Automatically tries alternative keys if one fails
5. Provides detailed logging about which key is being used

### GoogleAIServiceFactory

The multi-service functionality is implemented in the `GoogleAIServiceFactory` class, which:

1. Creates appropriate client instances based on service type
2. Configures each client with the correct parameters
3. Provides information about available services
4. Defines default capabilities and usage limits for each service

### Service Clients

Each service has its own client implementation that follows the `GoogleAIClient` interface:

- `GoogleGeminiClient`: For text generation with Gemini models
- `VertexAIClient`: For accessing Vertex AI services
- `NaturalLanguageClient`: For natural language processing tasks
- `DocumentAIClient`: For document processing and OCR

This approach provides several benefits:
- Higher throughput by distributing requests across multiple keys
- Improved reliability through automatic fallback
- Better rate limit management
- Unified interface for accessing different AI services
- Simplified key rotation for production environments