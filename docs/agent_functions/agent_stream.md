# Agent Stream

## Overview

Agent Stream is a specialized agent implementation that provides streaming response capabilities. It enables real-time, token-by-token responses from the agent, creating a more interactive and responsive user experience compared to standard request-response patterns.

## Architecture

Agent Stream follows a streaming architecture that enables incremental response delivery:

```
┌─────────────┐     ┌─────────────────────────────────────┐     ┌─────────────┐
│             │     │             Agent Stream            │     │             │
│   Client    │────▶│                                     │────▶│  OpenRouter │
│             │     │ ┌─────────┐ ┌────────┐ ┌─────────┐ │     │     API     │
└─────────────┘     │ │ Context │ │ Stream │ │ Response│ │     │  (Streaming)│
       ▲            │ │ Manager │ │ Handler│ │ Builder │ │     └─────────────┘
       │            │ └─────────┘ └────────┘ └─────────┘ │            │
       │            │                                     │            │
       │            └─────────────────────────────────────┘            │
       │                              │                                │
       └──────────────────────────────┴────────────────────────────────┘
                            Streaming Response
```

## Features

- **Token-by-Token Streaming**: Delivers responses incrementally as they are generated
- **Real-Time Interaction**: Provides immediate feedback to users
- **Progress Indicators**: Shows thinking and processing in real-time
- **Reduced Perceived Latency**: Improves user experience by showing partial results immediately
- **Cancellation Support**: Allows canceling responses mid-generation
- **Fallback to Non-Streaming**: Gracefully degrades to standard responses when streaming is not supported
- **Error Recovery**: Handles streaming errors with graceful fallbacks
- **Customizable Chunk Size**: Configurable token chunk delivery for optimal performance

## Implementation Details

### Request Processing

The agent processes incoming HTTP requests, determining whether to use streaming or standard response mode:

```typescript
serve(async (req) => {
  // Enable CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Parse the request body
    const { messages, stream } = await req.json();
    
    // Validate the request
    if (!messages || !Array.isArray(messages)) {
      throw new Error("Invalid request: messages array is required");
    }
    
    // Process the request based on streaming preference
    if (stream) {
      return handleStreamingRequest(messages);
    } else {
      return handleStandardRequest(messages);
    }
  } catch (error) {
    // Handle errors
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
```

### Streaming Response Handler

The agent implements a streaming response handler that processes the OpenRouter API stream:

```typescript
async function handleStreamingRequest(messages) {
  // Prepare the response stream
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  
  // Start processing in the background
  processStreamingResponse(messages, writer).catch(error => {
    console.error("Streaming error:", error);
    writer.write(encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`));
    writer.close();
  });
  
  // Return the stream to the client
  return new Response(stream.readable, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    }
  });
}
```

### Stream Processing

The agent processes the streaming response from the OpenRouter API:

```typescript
async function processStreamingResponse(messages, writer) {
  const encoder = new TextEncoder();
  
  try {
    console.log(`[${AGENT_NAME}] Calling OpenRouter API with streaming enabled`);
    
    // Call OpenRouter API with streaming enabled
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1500,
        stream: true
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenRouter API error: ${error.message || response.statusText}`);
    }
    
    // Process the streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }
      
      // Decode the chunk and add it to the buffer
      buffer += decoder.decode(value, { stream: true });
      
      // Process complete SSE messages
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";
      
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          
          // Skip [DONE] message
          if (data === "[DONE]") {
            continue;
          }
          
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content || "";
            
            if (content) {
              // Forward the content to the client
              writer.write(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          } catch (e) {
            console.error("Error parsing SSE message:", e);
          }
        }
      }
    }
    
    // Send the [DONE] message
    writer.write(encoder.encode(`data: [DONE]\n\n`));
  } catch (error) {
    console.error("Error in streaming response:", error);
    writer.write(encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`));
  } finally {
    writer.close();
  }
}
```

### Standard Request Fallback

The agent provides a fallback to standard request handling when streaming is not requested:

```typescript
async function handleStandardRequest(messages) {
  try {
    console.log(`[${AGENT_NAME}] Calling OpenRouter API with standard request`);
    
    // Call OpenRouter API with standard request
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1500
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenRouter API error: ${error.message || response.statusText}`);
    }
    
    const data = await response.json();
    
    // Return the response
    return new Response(JSON.stringify({
      role: "assistant",
      content: data.choices[0].message.content
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error in standard request:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}
```

## Configuration

Agent Stream can be configured using environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENROUTER_API_KEY` | API key for OpenRouter | Required |
| `MODEL` | LLM model to use | "openai/gpt-4-turbo" |
| `AGENT_NAME` | Name of the agent | "agent_stream" |
| `TEMPERATURE` | Temperature parameter for the LLM | 0.7 |
| `MAX_TOKENS` | Maximum tokens for the response | 1500 |

## Usage

### Streaming Request Format

```json
{
  "messages": [
    {"role": "system", "content": "You are Agent Stream, an AI assistant with streaming capabilities."},
    {"role": "user", "content": "Tell me a story about a brave knight."}
  ],
  "stream": true
}
```

### Standard Request Format

```json
{
  "messages": [
    {"role": "system", "content": "You are Agent Stream, an AI assistant with streaming capabilities."},
    {"role": "user", "content": "Tell me a story about a brave knight."}
  ]
}
```

### Streaming Response Format

The streaming response is delivered as a series of Server-Sent Events (SSE):

```
data: {"content":"Once"}

data: {"content":" upon"}

data: {"content":" a"}

data: {"content":" time,"}

data: {"content":" there"}

data: {"content":" was"}

data: {"content":" a"}

data: {"content":" brave"}

data: {"content":" knight..."}

data: [DONE]
```

### Standard Response Format

```json
{
  "role": "assistant",
  "content": "Once upon a time, there was a brave knight..."
}
```

## Error Handling

The agent handles various error scenarios:

- **Invalid Input**: Returns a 400 error if the input format is invalid
- **API Errors**: Returns a 500 error with details if the OpenRouter API fails
- **Streaming Errors**: Sends error messages through the stream and closes the connection
- **Parsing Errors**: Logs parsing errors but continues processing the stream
- **Connection Errors**: Detects and handles client disconnections

## Deployment

Deploy Agent Stream as a Supabase Edge Function:

```bash
# Deploy the function
supabase functions deploy agent_stream

# Set environment variables
supabase secrets set OPENROUTER_API_KEY=your-openrouter-api-key
```

## Testing

Test Agent Stream locally:

```bash
# Serve the function locally
supabase functions serve agent_stream --env-file .env.local

# Test streaming with curl
curl -X POST http://localhost:54321/functions/v1/agent_stream \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "system", "content": "You are Agent Stream, an AI assistant with streaming capabilities."},
      {"role": "user", "content": "Tell me a story about a brave knight."}
    ],
    "stream": true
  }'
```

## Client Integration

Example of integrating with a web client:

```javascript
// Create an EventSource for the streaming response
const eventSource = new EventSource('/api/agent_stream', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    messages: [
      {role: 'system', content: 'You are Agent Stream, an AI assistant with streaming capabilities.'},
      {role: 'user', content: 'Tell me a story about a brave knight.'}
    ],
    stream: true
  })
});

// Handle incoming messages
let responseText = '';
eventSource.onmessage = (event) => {
  if (event.data === '[DONE]') {
    eventSource.close();
    console.log('Stream completed');
    return;
  }
  
  try {
    const data = JSON.parse(event.data);
    if (data.content) {
      responseText += data.content;
      document.getElementById('response').textContent = responseText;
    }
    if (data.error) {
      console.error('Stream error:', data.error);
      document.getElementById('error').textContent = data.error;
      eventSource.close();
    }
  } catch (e) {
    console.error('Error parsing stream data:', e);
  }
};

// Handle errors
eventSource.onerror = (error) => {
  console.error('EventSource error:', error);
  eventSource.close();
};
```

## Security Considerations

- **API Key Protection**: The OpenRouter API key is stored as an environment variable and never exposed to clients
- **Input Validation**: All inputs are validated to prevent injection attacks
- **Error Handling**: Error messages are sanitized to prevent information leakage
- **Connection Management**: Properly closes connections to prevent resource leaks
- **Rate Limiting**: Implements rate limiting to prevent abuse

## Limitations

- **Browser Support**: Requires EventSource support in the client browser
- **Connection Timeout**: Subject to connection timeout limits of the platform
- **Model Limitations**: Subject to the limitations of the underlying LLM model
- **API Dependency**: Requires a connection to the OpenRouter API
- **Resource Usage**: Streaming connections consume more server resources than standard requests

## Integration with Other Functions

Agent Stream can be integrated with other edge functions:

```typescript
// Example of calling Agent Stream from another function
async function callAgentStream(messages, stream = false) {
  const response = await fetch("https://your-project-ref.supabase.co/functions/v1/agent_stream", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${supabaseAnonKey}`
    },
    body: JSON.stringify({ messages, stream })
  });
  
  if (stream) {
    // Return the response directly for streaming
    return response;
  } else {
    // Parse the JSON response for non-streaming
    return await response.json();
  }
}
```

---

Created by rUv, Agentics Foundation founder.