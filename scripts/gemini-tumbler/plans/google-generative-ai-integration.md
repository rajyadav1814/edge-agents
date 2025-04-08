# Google Generative AI Integration Plan

## Overview
This plan outlines the steps to integrate the official Google Generative AI JavaScript library (`@google/generative-ai`) into our Gemini Tumbler project. This will replace our current custom implementation with the official SDK, providing better support for the latest Gemini models and features.

## Goals
1. Integrate the `@google/generative-ai` library into our Deno-based project
2. Update the GeminiClient class to use the official SDK
3. Support multiple API keys for load balancing and fallback
4. Add support for the latest Gemini models (including Gemini 2.5)
5. Implement key rotation for distributing requests across multiple API keys
6. Test the implementation with real API keys

## Implementation Steps

### 1. Update Dependencies
- Add the `@google/generative-ai` library to our project
- Update the import map in deno.json

### 2. Create a New GeminiClient Implementation
- Create a new implementation of GeminiClient that uses the official SDK
- Support configuration for different models and parameters
- Implement token counting and usage tracking

### 3. Implement Multi-Key Support
- Modify the client to accept multiple API keys
- Implement a key rotation strategy
- Add fallback mechanism for when a key fails

### 4. Update TumblerService
- Update the TumblerService to work with the new GeminiClient
- Ensure compatibility with existing interfaces
- Add support for configuring multiple keys through environment variables

### 5. Testing
- Create unit tests for the new implementation
- Test with real API keys
- Verify fallback behavior when keys are invalid or rate limited

## Technical Details

### Key Rotation Strategy
We will implement a round-robin strategy for rotating between multiple API keys:
1. Store multiple keys in an array
2. Track the current key index
3. Rotate to the next key for each request
4. If a key fails, try the next key automatically

### Environment Variables
Update the .env file to support multiple keys:
```
GEMINI_API_KEY=primary_key
GEMINI_API_KEY_2=secondary_key
GEMINI_API_KEY_3=tertiary_key
```

### Model Support
Add support for the latest Gemini models:
- gemini-1.5-pro
- gemini-1.5-flash
- gemini-2.5-pro-exp-03-25 (experimental)

## Timeline
1. Library integration and basic client implementation - 2 hours
2. Multi-key support - 2 hours
3. Testing and debugging - 2 hours
4. Documentation - 1 hour

Total estimated time: 7 hours