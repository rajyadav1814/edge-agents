# Agent Beta

## Overview

Agent Beta is an enhanced agent implementation that builds upon the foundation of Agent Alpha with additional capabilities and improved reasoning. It provides a more sophisticated agent experience with better context handling, memory management, and decision-making abilities.

## Architecture

Agent Beta follows a request-response architecture with enhanced internal processing:

```
┌─────────────┐     ┌─────────────────────────────────────┐     ┌─────────────┐
│             │     │              Agent Beta             │     │             │
│   Client    │────▶│                                     │────▶│  OpenRouter │
│             │     │ ┌─────────┐ ┌────────┐ ┌─────────┐ │     │     API     │
└─────────────┘     │ │ Context │ │ Memory │ │ Planner │ │     │             │
       ▲            │ │ Manager │ │ Manager│ │         │ │     └─────────────┘
       │            │ └─────────┘ └────────┘ └─────────┘ │            │
       │            │                                     │            │
       │            └─────────────────────────────────────┘            │
       │                              │                                │
       └──────────────────────────────┴────────────────────────────────┘
                                 Response
```

## Features

- **Enhanced Reasoning**: Improved reasoning capabilities for more complex tasks
- **Context Management**: Better handling of conversation context and history
- **Memory Management**: Ability to store and retrieve information from previous interactions
- **Planning**: Advanced planning capabilities for multi-step tasks
- **Tool Usage**: Support for using external tools and APIs
- **Error Handling**: Robust error handling and recovery mechanisms
- **Streaming Support**: Optional support for streaming responses
- **Customizable Behavior**: Configurable parameters for tailoring agent behavior

## Implementation Details

### Request Processing

The agent processes incoming HTTP requests, extracting the necessary information for generating a response:

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
    
    // Process the request
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

### Message Processing

The agent processes messages using a sophisticated reasoning system:

```typescript
async function processMessages(messages) {
  // Prepare the context from the messages
  const context = prepareContext(messages);
  
  // Retrieve relevant information from memory
  const memoryItems = await retrieveFromMemory(context);
  
  // Create a plan for responding
  const plan = createPlan(context, memoryItems);
  
  // Generate the response using the LLM
  const response = await generateResponse(context, plan);
  
  // Store the interaction in memory
  await storeInMemory(context, response);
  
  return response;
}
```

### LLM Integration

The agent integrates with the OpenRouter API to access large language models:

```typescript
async function generateResponse(context, plan) {
  console.log(`[${AGENT_NAME}] Calling OpenRouter API with model: ${MODEL}`);
  
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`
    },
    body: JSON.stringify({
      model: MODEL,
      messages: context.messages,
      temperature: 0.7,
      max_tokens: 1500
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenRouter API error: ${error.message || response.statusText}`);
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}
```

### Memory Management

The agent includes a memory management system for storing and retrieving information:

```typescript
async function storeInMemory(context, response) {
  // Extract key information from the interaction
  const keyInfo = extractKeyInformation(context, response);
  
  // Store in Supabase database
  await supabase
    .from("agent_memory")
    .insert({
      agent_id: AGENT_NAME,
      user_id: context.userId,
      interaction_id: context.interactionId,
      key_info: keyInfo,
      timestamp: new Date().toISOString()
    });
}

async function retrieveFromMemory(context) {
  // Query relevant memory items
  const { data, error } = await supabase
    .from("agent_memory")
    .select("*")
    .eq("agent_id", AGENT_NAME)
    .eq("user_id", context.userId)
    .order("timestamp", { ascending: false })
    .limit(10);
  
  if (error) {
    console.error("Memory retrieval error:", error);
    return [];
  }
  
  return data;
}
```

## Configuration

Agent Beta can be configured using environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENROUTER_API_KEY` | API key for OpenRouter | Required |
| `MODEL` | LLM model to use | "openai/gpt-4-turbo" |
| `AGENT_NAME` | Name of the agent | "agent_beta" |
| `SUPABASE_URL` | URL for Supabase | Required |
| `SUPABASE_SERVICE_KEY` | Service key for Supabase | Required |
| `MAX_HISTORY` | Maximum number of messages to keep in context | 10 |
| `TEMPERATURE` | Temperature parameter for the LLM | 0.7 |
| `MAX_TOKENS` | Maximum tokens for the response | 1500 |

## Usage

### Standard Request Format

```json
{
  "messages": [
    {"role": "system", "content": "You are Agent Beta, an advanced AI assistant."},
    {"role": "user", "content": "Hello, can you help me with a complex task?"}
  ]
}
```

### Streaming Request Format

```json
{
  "messages": [
    {"role": "system", "content": "You are Agent Beta, an advanced AI assistant."},
    {"role": "user", "content": "Hello, can you help me with a complex task?"}
  ],
  "stream": true
}
```

### Response Format

```json
{
  "role": "assistant",
  "content": "Hello! I'm Agent Beta, and I'd be happy to help you with your complex task. Could you please provide more details about what you need assistance with? I'm equipped with advanced reasoning capabilities and can help with multi-step problems, planning, and more."
}
```

## Error Handling

The agent handles various error scenarios:

- **Invalid Input**: Returns a 400 error if the input format is invalid
- **API Errors**: Returns a 500 error with details if the OpenRouter API fails
- **Memory Errors**: Logs memory-related errors but continues processing
- **Rate Limiting**: Implements exponential backoff for API rate limits

## Deployment

Deploy Agent Beta as a Supabase Edge Function:

```bash
# Deploy the function
supabase functions deploy agent_beta

# Set environment variables
supabase secrets set OPENROUTER_API_KEY=your-openrouter-api-key
supabase secrets set SUPABASE_URL=your-supabase-url
supabase secrets set SUPABASE_SERVICE_KEY=your-supabase-service-key
```

## Testing

Test Agent Beta locally:

```bash
# Serve the function locally
supabase functions serve agent_beta --env-file .env.local

# Test with curl
curl -X POST http://localhost:54321/functions/v1/agent_beta \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "system", "content": "You are Agent Beta, an advanced AI assistant."},
      {"role": "user", "content": "Hello, can you help me with a complex task?"}
    ]
  }'
```

## Security Considerations

- **API Key Protection**: The OpenRouter API key is stored as an environment variable and never exposed to clients
- **Input Validation**: All inputs are validated to prevent injection attacks
- **Error Handling**: Error messages are sanitized to prevent information leakage
- **Rate Limiting**: Implements rate limiting to prevent abuse

## Limitations

- **Model Limitations**: Subject to the limitations of the underlying LLM model
- **Context Window**: Limited by the context window of the LLM
- **API Dependency**: Requires a connection to the OpenRouter API
- **Memory Capacity**: Limited by the database storage capacity

## Integration with Other Functions

Agent Beta can be integrated with other edge functions:

```typescript
// Example of calling Agent Beta from another function
async function callAgentBeta(messages) {
  const response = await fetch("https://your-project-ref.supabase.co/functions/v1/agent_beta", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${supabaseAnonKey}`
    },
    body: JSON.stringify({ messages })
  });
  
  return await response.json();
}
```

---

Created by rUv, Agentics Foundation founder.