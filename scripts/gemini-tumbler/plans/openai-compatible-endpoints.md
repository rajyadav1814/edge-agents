# OpenAI-Compatible Endpoints Implementation Plan

## Overview

This plan outlines the implementation of OpenAI-compatible `/chat/completions` and `/completions` endpoints for the Gemini Tumbler service, including streaming support. This will allow applications designed for OpenAI's API to seamlessly use Google's Gemini models through our service, with a focus on using the latest gemini-2.5-pro-exp-03-25 model as the default.

## Goals

1. Implement `/chat/completions` endpoint that matches OpenAI's format
2. Implement `/completions` endpoint for text completion
3. Support streaming responses for both endpoints
4. Use gemini-2.5-pro-exp-03-25 as the default model
5. Maintain compatibility with existing Gemini Tumbler functionality
6. Add comprehensive tests for the new endpoints

## Implementation Details

### 1. API Interface Mapping

#### OpenAI Chat Completions Request Format
```typescript
interface OpenAIChatCompletionsRequest {
  model: string;
  messages: {
    role: "system" | "user" | "assistant";
    content: string;
  }[];
  temperature?: number;
  top_p?: number;
  n?: number;
  stream?: boolean;
  max_tokens?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  logit_bias?: Record<string, number>;
  user?: string;
}
```

#### OpenAI Completions Request Format
```typescript
interface OpenAICompletionsRequest {
  model: string;
  prompt: string | string[];
  suffix?: string;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  n?: number;
  stream?: boolean;
  logprobs?: number;
  echo?: boolean;
  stop?: string | string[];
  presence_penalty?: number;
  frequency_penalty?: number;
  best_of?: number;
  logit_bias?: Record<string, number>;
  user?: string;
}
```

### 2. Response Format Mapping

#### OpenAI Chat Completions Response Format
```typescript
interface OpenAIChatCompletionsResponse {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: "assistant";
      content: string;
    };
    finish_reason: "stop" | "length" | "content_filter";
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
```

#### OpenAI Completions Response Format
```typescript
interface OpenAICompletionsResponse {
  id: string;
  object: "text_completion";
  created: number;
  model: string;
  choices: {
    text: string;
    index: number;
    logprobs: null | any;
    finish_reason: "stop" | "length" | "content_filter";
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
```

### 3. Streaming Response Format

For streaming responses, we'll need to implement Server-Sent Events (SSE) that match OpenAI's format:

```
data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1694268190,"model":"gpt-3.5-turbo-0613","choices":[{"index":0,"delta":{"role":"assistant"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1694268190,"model":"gpt-3.5-turbo-0613","choices":[{"index":0,"delta":{"content":"Hello"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1694268190,"model":"gpt-3.5-turbo-0613","choices":[{"index":0,"delta":{"content":"!"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1694268190,"model":"gpt-3.5-turbo-0613","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}

data: [DONE]
```

## Implementation Steps

### Phase 1: Core Implementation

1. **Create Adapter Classes**
   - Implement `OpenAIRequestAdapter` to convert OpenAI requests to Gemini format
   - Implement `OpenAIResponseAdapter` to convert Gemini responses to OpenAI format

2. **Add New Endpoints to Server**
   - Implement `/chat/completions` endpoint
   - Implement `/completions` endpoint
   - Add proper request validation for both endpoints

3. **Implement Streaming Support**
   - Create a streaming handler for SSE responses
   - Implement chunking logic for breaking responses into tokens
   - Ensure proper event formatting according to OpenAI's specification

### Phase 2: Model Mapping and Configuration

1. **Create Model Name Mapping**
   - Map OpenAI model names to Gemini models:
     - `gpt-3.5-turbo` → `gemini-1.5-flash`
     - `gpt-4` → `gemini-1.5-pro`
     - `gpt-4-turbo` → `gemini-2.5-pro-exp-03-25`
     - `gpt-4-turbo-preview` → `gemini-2.5-pro-exp-03-25`
   - Set `gemini-2.5-pro-exp-03-25` as the default model

2. **Parameter Translation**
   - Implement translation of OpenAI-specific parameters to Gemini equivalents
   - Handle parameters that don't have direct equivalents

### Phase 3: Tumbler Integration

1. **Integrate with Tumbler Service**
   - Modify the Tumbler service to support streaming responses
   - Ensure the Tumbler's model rotation and API key management works with OpenAI endpoints
   - Implement contribution tracking for OpenAI-compatible requests

2. **Add Tumbler-Specific Features**
   - Allow access to Tumbler's model rotation through OpenAI-compatible endpoints
   - Support anonymous contribution for OpenAI-compatible requests
   - Implement rate limiting and error handling consistent with Tumbler service

### Phase 4: Testing and Documentation

1. **Create Test Suite**
   - Unit tests for request/response adapters
   - Integration tests for endpoints
   - Streaming response tests
   - Compatibility tests with OpenAI client libraries

2. **Update Documentation**
   - Add API reference for new endpoints
   - Document model mapping and parameter translation
   - Provide usage examples

## Code Examples

### Example: Chat Completions Endpoint Implementation

```typescript
// Add to server.ts
this.router.post("/chat/completions", async (ctx) => {
  if (!ctx.request.hasBody) {
    ctx.response.status = 400;
    ctx.response.body = {
      error: {
        message: "Request body is required",
        type: "invalid_request_error",
        code: 400
      }
    };
    return;
  }
  
  const body = await ctx.request.body({ type: "json" }).value as OpenAIChatCompletionsRequest;
  
  // Validate request
  if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    ctx.response.status = 400;
    ctx.response.body = {
      error: {
        message: "messages is required and must be an array",
        type: "invalid_request_error",
        code: 400
      }
    };
    return;
  }
  
  // Extract system message and user message
  const systemMessage = body.messages.find(m => m.role === "system");
  const userMessages = body.messages.filter(m => m.role === "user");
  const lastUserMessage = userMessages[userMessages.length - 1];
  
  // Map OpenAI model to Gemini model
  const geminiModel = this.mapModelName(body.model || "gpt-4-turbo");
  
  // Create Tumbler request
  const tumblerRequest: TumblerRequest = {
    prompt: lastUserMessage?.content || "",
    systemPrompt: systemMessage?.content,
    model: geminiModel,
    temperature: body.temperature,
    maxTokens: body.max_tokens,
    contributionConsent: true
  };
  
  // Check for streaming
  const isStreaming = body.stream === true;
  
  if (isStreaming) {
    // Set up streaming response
    ctx.response.type = "text/event-stream";
    ctx.response.headers.set("Cache-Control", "no-cache");
    ctx.response.headers.set("Connection", "keep-alive");
    
    const responseBody = ctx.response.body = new ReadableStream({
      async start(controller) {
        try {
          // Generate response ID and timestamp
          const responseId = `chatcmpl-${Math.random().toString(36).substring(2, 10)}`;
          const timestamp = Math.floor(Date.now() / 1000);
          
          // Send initial role message
          const initialChunk = {
            id: responseId,
            object: "chat.completion.chunk",
            created: timestamp,
            model: body.model || "gpt-4-turbo",
            choices: [{
              index: 0,
              delta: { role: "assistant" },
              finish_reason: null
            }]
          };
          controller.enqueue(`data: ${JSON.stringify(initialChunk)}\n\n`);
          
          // Process with Tumbler service
          const response = await this.tumblerService.processRequest(tumblerRequest);
          
          // Simulate streaming by breaking the response into chunks
          const content = response.content;
          const chunkSize = 5; // Characters per chunk
          
          for (let i = 0; i < content.length; i += chunkSize) {
            const chunk = content.substring(i, i + chunkSize);
            
            // Send content chunk in OpenAI format
            const openAIChunk = {
              id: responseId,
              object: "chat.completion.chunk",
              created: timestamp,
              model: body.model || "gpt-4-turbo",
              choices: [{
                index: 0,
                delta: { content: chunk },
                finish_reason: null
              }]
            };
            controller.enqueue(`data: ${JSON.stringify(openAIChunk)}\n\n`);
            
            // Add a small delay to simulate streaming
            await new Promise(resolve => setTimeout(resolve, 10));
          }
          
          // Send final chunk
          const finalChunk = {
            id: responseId,
            object: "chat.completion.chunk",
            created: timestamp,
            model: body.model || "gpt-4-turbo",
            choices: [{
              index: 0,
              delta: {},
              finish_reason: "stop"
            }]
          };
          controller.enqueue(`data: ${JSON.stringify(finalChunk)}\n\n`);
          
          // Send [DONE] message
          controller.enqueue("data: [DONE]\n\n");
          controller.close();
        } catch (error) {
          // Handle errors
          const errorResponse = {
            error: {
              message: error instanceof Error ? error.message : "An error occurred during streaming",
              type: "server_error",
              code: 500
            }
          };
          controller.enqueue(`data: ${JSON.stringify(errorResponse)}\n\n`);
          controller.close();
        }
      }
    });
  } else {
    // Non-streaming response
    try {
      // Process request with Tumbler service
      const tumblerResponse = await this.tumblerService.processRequest(tumblerRequest);
      
      // Format as OpenAI response
      ctx.response.body = {
        id: `chatcmpl-${Math.random().toString(36).substring(2, 10)}`,
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: body.model || "gpt-4-turbo",
        choices: [{
          index: 0,
          message: {
            role: "assistant",
            content: tumblerResponse.content
          },
          finish_reason: "stop"
        }],
        usage: {
          prompt_tokens: tumblerResponse.tokenUsage.promptTokens,
          completion_tokens: tumblerResponse.tokenUsage.completionTokens,
          total_tokens: tumblerResponse.tokenUsage.totalTokens
        }
      };
    } catch (error) {
      ctx.response.status = 500;
      ctx.response.body = {
        error: {
          message: error instanceof Error ? error.message : "An error occurred",
          type: "server_error",
          code: 500
        }
      };
    }
  }
});

// Helper method to map OpenAI model names to Gemini models
private mapModelName(openAIModel: string): string {
  const modelMap: Record<string, string> = {
    "gpt-3.5-turbo": "gemini-1.5-flash",
    "gpt-4": "gemini-1.5-pro",
    "gpt-4-turbo": "gemini-2.5-pro-exp-03-25",
    "gpt-4-turbo-preview": "gemini-2.5-pro-exp-03-25"
  };
  
  return modelMap[openAIModel] || "gemini-2.5-pro-exp-03-25"; // Default to gemini-2.5-pro-exp-03-25
}
```

## Testing Strategy

1. **Unit Tests**
   - Test request/response adapters with various input combinations
   - Verify correct mapping of parameters and model names
   - Test model mapping with different OpenAI model names

2. **Integration Tests**
   - Test endpoints with sample requests
   - Verify response format matches OpenAI specification
   - Test with different model selections

3. **Streaming Tests**
   - Test streaming responses with various token lengths
   - Verify correct chunking and formatting of SSE events
   - Test streaming with different models

4. **Compatibility Tests**
   - Test with OpenAI Node.js client library
   - Test with other popular OpenAI client libraries (Python, etc.)
   - Test with applications built for OpenAI's API

## Timeline

- **Week 1**: Design and implement core adapters and endpoint handlers
- **Week 2**: Implement streaming support and parameter mapping
- **Week 3**: Integrate with Tumbler service and implement model rotation
- **Week 4**: Testing and bug fixes
- **Week 5**: Documentation and final polish

## Conclusion

Implementing OpenAI-compatible endpoints with gemini-2.5-pro-exp-03-25 as the default model will significantly enhance the utility of the Gemini Tumbler service by allowing seamless integration with existing applications built for OpenAI's API. The streaming support will enable real-time applications like chat interfaces to provide a responsive user experience, while leveraging the advanced capabilities of Google's latest Gemini models.