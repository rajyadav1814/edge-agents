# Agentic Inbox Agent

## Overview

Agentic Inbox Agent is a specialized agent implementation designed to manage message inboxes and provide intelligent responses to incoming messages. It serves as a virtual assistant that can process, categorize, and respond to messages in a conversational manner, helping users manage their communication more efficiently.

## Architecture

Agentic Inbox Agent follows a message processing architecture:

```
┌─────────────┐     ┌─────────────────────────────────────┐     ┌─────────────┐
│             │     │        Agentic Inbox Agent          │     │             │
│   Message   │────▶│                                     │────▶│  OpenRouter │
│   Source    │     │ ┌─────────┐ ┌────────┐ ┌─────────┐ │     │     API     │
└─────────────┘     │ │ Message │ │Analysis│ │Response │ │     │             │
       ▲            │ │Processor│ │ Engine │ │Generator│ │     └─────────────┘
       │            │ └─────────┘ └────────┘ └─────────┘ │            │
       │            │                                     │            │
       │            └─────────────────────────────────────┘            │
       │                              │                                │
       └──────────────────────────────┴────────────────────────────────┘
                                 Response
```

## Features

- **Message Processing**: Processes incoming messages from various sources
- **Context Awareness**: Maintains context across multiple messages in a conversation
- **Intent Recognition**: Identifies the intent behind messages
- **Prioritization**: Prioritizes messages based on importance and urgency
- **Automated Responses**: Generates appropriate responses to common queries
- **Follow-up Management**: Tracks and manages follow-up actions
- **Categorization**: Organizes messages into categories
- **Summarization**: Provides summaries of message threads
- **Personalization**: Adapts responses based on user preferences
- **Multi-channel Support**: Handles messages from different communication channels

## Implementation Details

### Message Processing

The agent processes incoming messages and extracts relevant information:

```typescript
async function processMessage(message) {
  // Extract message metadata
  const {
    sender,
    recipient,
    subject,
    content,
    timestamp,
    channel,
    threadId
  } = extractMessageMetadata(message);
  
  // Log the incoming message
  console.log(`Processing message from ${sender} to ${recipient} via ${channel}`);
  
  // Analyze the message content
  const analysis = await analyzeMessage(content, subject);
  
  // Generate a response based on the analysis
  const response = await generateResponse(analysis, sender, recipient);
  
  // Store the interaction in the database
  await storeInteraction({
    sender,
    recipient,
    subject,
    content,
    analysis,
    response,
    timestamp,
    channel,
    threadId
  });
  
  return response;
}
```

### Message Analysis

The agent analyzes messages to understand their intent and content:

```typescript
async function analyzeMessage(content, subject) {
  // Prepare the messages for the LLM
  const messages = [
    {
      role: "system",
      content: "You are an AI assistant that analyzes messages. Extract the following information: intent, priority, sentiment, key topics, and any action items."
    },
    {
      role: "user",
      content: `Subject: ${subject}\n\nMessage: ${content}`
    }
  ];
  
  // Call the LLM to analyze the message
  const response = await callOpenRouter(messages);
  
  // Parse the response to extract the analysis
  const analysis = parseAnalysisResponse(response);
  
  return {
    intent: analysis.intent,
    priority: analysis.priority,
    sentiment: analysis.sentiment,
    topics: analysis.topics,
    actionItems: analysis.actionItems,
    requiresResponse: analysis.requiresResponse
  };
}
```

### Response Generation

The agent generates appropriate responses based on the message analysis:

```typescript
async function generateResponse(analysis, sender, recipient) {
  // Check if a response is required
  if (!analysis.requiresResponse) {
    return null;
  }
  
  // Prepare the messages for the LLM
  const messages = [
    {
      role: "system",
      content: `You are an AI assistant that generates responses to messages. Your name is ${AGENT_NAME}. You are responding on behalf of ${recipient} to ${sender}.`
    },
    {
      role: "user",
      content: `Generate a response to a message with the following analysis:\n\nIntent: ${analysis.intent}\nPriority: ${analysis.priority}\nSentiment: ${analysis.sentiment}\nTopics: ${analysis.topics.join(", ")}\nAction Items: ${analysis.actionItems.join(", ")}`
    }
  ];
  
  // Call the LLM to generate a response
  const response = await callOpenRouter(messages);
  
  return {
    content: response,
    timestamp: new Date().toISOString(),
    sender: recipient,
    recipient: sender
  };
}
```

### OpenRouter API Integration

The agent integrates with the OpenRouter API to access large language models:

```typescript
async function callOpenRouter(messages) {
  console.log(`[${AGENT_NAME}] Calling OpenRouter API with model: ${MODEL}, message count: ${messages.length}`);
  
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
  return data.choices[0].message.content;
}
```

### Database Integration

The agent stores interactions in a database for future reference:

```typescript
async function storeInteraction(interaction) {
  try {
    // Create a Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    // Insert the interaction into the database
    const { data, error } = await supabase
      .from("inbox_interactions")
      .insert([
        {
          sender: interaction.sender,
          recipient: interaction.recipient,
          subject: interaction.subject,
          content: interaction.content,
          analysis: interaction.analysis,
          response: interaction.response,
          timestamp: interaction.timestamp,
          channel: interaction.channel,
          thread_id: interaction.threadId
        }
      ]);
    
    if (error) {
      console.error("Error storing interaction:", error);
      return false;
    }
    
    console.log("Interaction stored successfully:", data);
    return true;
  } catch (error) {
    console.error("Unexpected error storing interaction:", error);
    return false;
  }
}
```

## Configuration

Agentic Inbox Agent can be configured using environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENROUTER_API_KEY` | API key for OpenRouter | Required |
| `MODEL` | LLM model to use | "openai/gpt-4-turbo" |
| `AGENT_NAME` | Name of the agent | "Agentic Inbox Agent" |
| `SUPABASE_URL` | URL for Supabase | Required |
| `SUPABASE_SERVICE_KEY` | Service key for Supabase | Required |
| `DEFAULT_RESPONSE_TEMPLATE` | Template for default responses | "Thank you for your message. I'll get back to you soon." |
| `TEMPERATURE` | Temperature parameter for the LLM | 0.7 |
| `MAX_TOKENS` | Maximum tokens for the response | 1500 |

## Usage

### Processing a Message

```json
{
  "message": {
    "sender": "john.doe@example.com",
    "recipient": "support@agentics.org",
    "subject": "Question about subscription",
    "content": "Hi, I'm having trouble with my subscription. It says it expired, but I just renewed it yesterday. Can you help?",
    "timestamp": "2023-01-01T12:00:00Z",
    "channel": "email",
    "threadId": "thread-123"
  }
}
```

### Response Format

```json
{
  "response": {
    "content": "Hi John,\n\nThank you for reaching out about your subscription issue. I understand how frustrating it can be when things don't work as expected, especially right after renewal.\n\nI've checked your account, and I can confirm that your payment was successfully processed yesterday. There might be a delay in our system updating your subscription status. This typically resolves within 24 hours.\n\nIn the meantime, I've manually updated your subscription status to active, so you should have full access now. Please try logging in again and let me know if you're still experiencing any issues.\n\nIf you have any other questions, feel free to reply to this email.\n\nBest regards,\nSupport Team",
    "timestamp": "2023-01-01T12:05:00Z",
    "sender": "support@agentics.org",
    "recipient": "john.doe@example.com"
  },
  "analysis": {
    "intent": "support_request",
    "priority": "medium",
    "sentiment": "frustrated",
    "topics": ["subscription", "renewal", "technical_issue"],
    "actionItems": ["check_subscription_status", "verify_payment", "update_subscription"],
    "requiresResponse": true
  }
}
```

## Message Analysis Categories

The agent categorizes messages based on various factors:

### Intent Categories

- **Information Request**: Seeking information about products, services, etc.
- **Support Request**: Requesting technical or customer support
- **Feedback**: Providing feedback or suggestions
- **Complaint**: Expressing dissatisfaction
- **Inquiry**: General questions
- **Transaction**: Purchase, subscription, or payment related
- **Introduction**: Initial contact or introduction
- **Follow-up**: Following up on a previous interaction
- **Scheduling**: Scheduling a meeting or appointment
- **Other**: Miscellaneous intents

### Priority Levels

- **Urgent**: Requires immediate attention
- **High**: Important but not urgent
- **Medium**: Standard priority
- **Low**: Can be addressed later
- **None**: No action required

### Sentiment Analysis

- **Positive**: Expressing satisfaction, happiness, or gratitude
- **Neutral**: Neutral or factual tone
- **Negative**: Expressing dissatisfaction, frustration, or anger
- **Mixed**: Containing both positive and negative sentiments

## Error Handling

The agent handles various error scenarios:

- **Invalid Input**: Returns a 400 error if the input format is invalid
- **API Errors**: Returns a 500 error with details if the OpenRouter API fails
- **Database Errors**: Logs database errors and continues processing
- **Message Processing Errors**: Captures and reports errors during message processing
- **Rate Limiting**: Implements rate limiting for API calls

## Deployment

Deploy Agentic Inbox Agent as a Supabase Edge Function:

```bash
# Deploy the function
supabase functions deploy agentic_inbox_agent

# Set environment variables
supabase secrets set OPENROUTER_API_KEY=your-openrouter-api-key
supabase secrets set SUPABASE_URL=your-supabase-url
supabase secrets set SUPABASE_SERVICE_KEY=your-supabase-service-key
```

## Testing

Test Agentic Inbox Agent locally:

```bash
# Serve the function locally
supabase functions serve agentic_inbox_agent --env-file .env.local

# Test with curl
curl -X POST http://localhost:54321/functions/v1/agentic_inbox_agent \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "sender": "john.doe@example.com",
      "recipient": "support@agentics.org",
      "subject": "Question about subscription",
      "content": "Hi, I am having trouble with my subscription. It says it expired, but I just renewed it yesterday. Can you help?",
      "timestamp": "2023-01-01T12:00:00Z",
      "channel": "email",
      "threadId": "thread-123"
    }
  }'
```

## Security Considerations

- **API Key Protection**: The OpenRouter API key is stored as an environment variable and never exposed to clients
- **Input Validation**: All inputs are validated to prevent injection attacks
- **Error Handling**: Error messages are sanitized to prevent information leakage
- **Rate Limiting**: Implements rate limiting to prevent abuse
- **Data Privacy**: Ensures sensitive information is handled securely
- **Authentication**: Requires authentication for accessing the agent

## Limitations

- **Model Limitations**: Subject to the limitations of the underlying LLM model
- **Context Window**: Limited by the context window of the LLM
- **API Dependency**: Requires a connection to the OpenRouter API
- **Language Support**: May have limited support for non-English languages
- **Complex Queries**: May struggle with highly complex or ambiguous messages
- **Domain Knowledge**: Limited to the knowledge encoded in the LLM

## Integration with Other Functions

Agentic Inbox Agent can be integrated with other edge functions:

```typescript
// Example of calling Agentic Inbox Agent from another function
async function processInboxMessage(message) {
  const response = await fetch("https://your-project-ref.supabase.co/functions/v1/agentic_inbox_agent", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${supabaseAnonKey}`
    },
    body: JSON.stringify({ message })
  });
  
  return await response.json();
}
```

---

Created by rUv, Agentics Foundation founder.