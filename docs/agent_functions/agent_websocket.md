# Agent WebSocket

## Overview

Agent WebSocket is a specialized agent implementation that provides real-time, bidirectional communication through WebSocket connections. It enables persistent connections between clients and the agent, allowing for continuous interaction without the overhead of establishing new HTTP connections for each message.

## Architecture

Agent WebSocket follows a WebSocket-based architecture that enables bidirectional communication:

```
┌─────────────┐     ┌─────────────────────────────────────┐     ┌─────────────┐
│             │     │           Agent WebSocket           │     │             │
│   Client    │◄───▶│                                     │────▶│  OpenRouter │
│  WebSocket  │     │ ┌─────────┐ ┌────────┐ ┌─────────┐ │     │     API     │
└─────────────┘     │ │ Session │ │Message │ │ Response│ │     │             │
                    │ │ Manager │ │ Handler│ │ Builder │ │     └─────────────┘
                    │ └─────────┘ └────────┘ └─────────┘ │            │
                    │                                     │            │
                    └─────────────────────────────────────┘            │
                                     ▲                                 │
                                     └─────────────────────────────────┘
                                          Response Processing
```

## Features

- **Persistent Connections**: Maintains long-lived connections with clients
- **Bidirectional Communication**: Enables both client-to-agent and agent-to-client messaging
- **Real-Time Interaction**: Provides immediate response to user inputs
- **Session Management**: Tracks and manages user sessions
- **Message Queuing**: Handles message ordering and prioritization
- **Heartbeat Mechanism**: Ensures connection health through periodic pings
- **Graceful Reconnection**: Handles connection drops and reconnections
- **Concurrent Client Support**: Manages multiple simultaneous client connections
- **Authentication**: Supports secure client authentication
- **Message Typing**: Supports different message types (query, response, notification, etc.)

## Implementation Details

### WebSocket Server Setup

The agent sets up a WebSocket server to handle client connections:

```typescript
serve(async (req) => {
  // Check if it's a WebSocket request
  if (req.headers.get("upgrade") !== "websocket") {
    return new Response("Expected WebSocket request", { status: 400 });
  }

  try {
    // Create the WebSocket pair
    const { socket, response } = Deno.upgradeWebSocket(req);
    
    // Set up WebSocket event handlers
    setupWebSocketHandlers(socket);
    
    // Return the WebSocket response
    return response;
  } catch (error) {
    console.error("WebSocket setup error:", error);
    return new Response(`WebSocket setup error: ${error.message}`, { status: 500 });
  }
});
```

### WebSocket Event Handlers

The agent sets up event handlers for the WebSocket connection:

```typescript
function setupWebSocketHandlers(socket) {
  // Generate a unique session ID for this connection
  const sessionId = crypto.randomUUID();
  
  // Store the socket in the active sessions map
  activeSessions.set(sessionId, {
    socket,
    lastActivity: Date.now(),
    messageHistory: []
  });
  
  // Handle incoming messages
  socket.onmessage = async (event) => {
    try {
      // Parse the message
      const message = JSON.parse(event.data);
      
      // Update last activity timestamp
      const session = activeSessions.get(sessionId);
      if (session) {
        session.lastActivity = Date.now();
      }
      
      // Process the message
      await handleMessage(sessionId, message);
    } catch (error) {
      console.error(`Error processing message for session ${sessionId}:`, error);
      sendErrorResponse(socket, error.message);
    }
  };
  
  // Handle connection close
  socket.onclose = () => {
    console.log(`WebSocket connection closed for session ${sessionId}`);
    activeSessions.delete(sessionId);
  };
  
  // Handle errors
  socket.onerror = (error) => {
    console.error(`WebSocket error for session ${sessionId}:`, error);
    activeSessions.delete(sessionId);
  };
  
  // Send welcome message
  socket.send(JSON.stringify({
    type: MessageType.NOTIFICATION,
    content: `Connected to Agent WebSocket. Session ID: ${sessionId}`,
    timestamp: new Date().toISOString()
  }));
  
  console.log(`New WebSocket connection established. Session ID: ${sessionId}`);
}
```

### Message Handling

The agent processes incoming messages and generates responses:

```typescript
async function handleMessage(sessionId, message) {
  const session = activeSessions.get(sessionId);
  if (!session) {
    console.error(`Session ${sessionId} not found`);
    return;
  }
  
  const { socket, messageHistory } = session;
  
  // Validate the message
  if (!message.content) {
    sendErrorResponse(socket, "Message content is required");
    return;
  }
  
  // Add user message to history
  messageHistory.push({
    role: "user",
    content: message.content,
    timestamp: new Date().toISOString()
  });
  
  // Prepare messages for the LLM
  const messages = [
    { role: "system", content: "You are Agent WebSocket, an AI assistant communicating via WebSocket." },
    ...messageHistory.map(msg => ({ role: msg.role, content: msg.content }))
  ];
  
  try {
    // Send a "thinking" notification
    socket.send(JSON.stringify({
      type: MessageType.STATUS,
      content: "Thinking...",
      timestamp: new Date().toISOString()
    }));
    
    // Call the OpenRouter API
    const response = await callOpenRouter(messages);
    
    // Add assistant response to history
    messageHistory.push({
      role: "assistant",
      content: response,
      timestamp: new Date().toISOString()
    });
    
    // Send the response
    socket.send(JSON.stringify({
      type: MessageType.RESPONSE,
      content: response,
      timestamp: new Date().toISOString()
    }));
  } catch (error) {
    console.error(`Error generating response for session ${sessionId}:`, error);
    sendErrorResponse(socket, `Failed to generate response: ${error.message}`);
  }
}
```

### OpenRouter API Integration

The agent integrates with the OpenRouter API to generate responses:

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

### Session Management

The agent includes a session management system:

```typescript
// Map to store active WebSocket sessions
const activeSessions = new Map();

// Session cleanup interval (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  const timeout = 30 * 60 * 1000; // 30 minutes
  
  for (const [sessionId, session] of activeSessions.entries()) {
    // Check if session has been inactive for too long
    if (now - session.lastActivity > timeout) {
      console.log(`Closing inactive session ${sessionId}`);
      
      try {
        // Send notification before closing
        session.socket.send(JSON.stringify({
          type: MessageType.NOTIFICATION,
          content: "Session closed due to inactivity",
          timestamp: new Date().toISOString()
        }));
        
        // Close the socket
        session.socket.close(1000, "Session timeout");
      } catch (error) {
        console.error(`Error closing session ${sessionId}:`, error);
      }
      
      // Remove from active sessions
      activeSessions.delete(sessionId);
    }
  }
}, 5 * 60 * 1000); // Run every 5 minutes
```

## Configuration

Agent WebSocket can be configured using environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENROUTER_API_KEY` | API key for OpenRouter | Required |
| `MODEL` | LLM model to use | "openai/gpt-4-turbo" |
| `AGENT_NAME` | Name of the agent | "agent_websocket" |
| `SESSION_TIMEOUT` | Session timeout in minutes | 30 |
| `MAX_HISTORY` | Maximum number of messages to keep in history | 50 |
| `TEMPERATURE` | Temperature parameter for the LLM | 0.7 |
| `MAX_TOKENS` | Maximum tokens for the response | 1500 |

## Usage

### Connecting to the WebSocket

```javascript
// Create a WebSocket connection
const socket = new WebSocket('wss://your-project-ref.supabase.co/functions/v1/agent_websocket');

// Handle connection open
socket.addEventListener('open', (event) => {
  console.log('Connected to Agent WebSocket');
});

// Handle incoming messages
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  console.log('Received message:', message);
  
  // Handle different message types
  switch (message.type) {
    case 'response':
      displayResponse(message.content);
      break;
    case 'notification':
      showNotification(message.content);
      break;
    case 'status':
      updateStatus(message.content);
      break;
    case 'error':
      showError(message.content);
      break;
  }
});

// Handle errors
socket.addEventListener('error', (event) => {
  console.error('WebSocket error:', event);
});

// Handle connection close
socket.addEventListener('close', (event) => {
  console.log('Connection closed:', event.code, event.reason);
  
  // Attempt to reconnect if the connection was closed unexpectedly
  if (event.code !== 1000) {
    setTimeout(() => {
      console.log('Attempting to reconnect...');
      // Reconnect logic here
    }, 3000);
  }
});

// Send a message
function sendMessage(content) {
  socket.send(JSON.stringify({
    type: 'query',
    content: content,
    timestamp: new Date().toISOString()
  }));
}
```

### Message Types

The agent supports different message types:

- **Query**: Messages from the client to the agent
- **Response**: Responses from the agent to the client
- **Notification**: System notifications
- **Status**: Status updates
- **Error**: Error messages
- **Command**: Special commands to the agent
- **Human Feedback**: Feedback from human users

### Message Format

```json
{
  "type": "query",
  "content": "Tell me about WebSocket technology.",
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

## Error Handling

The agent handles various error scenarios:

- **Connection Errors**: Detects and handles WebSocket connection issues
- **Message Parsing Errors**: Validates and handles malformed messages
- **API Errors**: Handles errors from the OpenRouter API
- **Session Timeout**: Manages inactive sessions
- **Rate Limiting**: Implements rate limiting for message processing
- **Memory Management**: Prevents memory leaks from abandoned connections

## Deployment

Deploy Agent WebSocket as a Supabase Edge Function:

```bash
# Deploy the function
supabase functions deploy agent_websocket

# Set environment variables
supabase secrets set OPENROUTER_API_KEY=your-openrouter-api-key
```

## Testing

Test Agent WebSocket locally:

```bash
# Serve the function locally
supabase functions serve agent_websocket --env-file .env.local

# Test with WebSocket client
# You can use tools like wscat or a browser-based WebSocket client
wscat -c ws://localhost:54321/functions/v1/agent_websocket
```

## Security Considerations

- **Authentication**: Consider implementing authentication for WebSocket connections
- **Message Validation**: Validate all incoming messages to prevent injection attacks
- **Rate Limiting**: Implement rate limiting to prevent abuse
- **Connection Limits**: Limit the number of concurrent connections per user
- **Timeout Management**: Properly close inactive connections to prevent resource exhaustion
- **Error Handling**: Sanitize error messages to prevent information leakage

## Limitations

- **Connection Stability**: WebSocket connections may be affected by network issues
- **Scalability**: Managing many concurrent WebSocket connections requires careful resource management
- **Browser Support**: Some older browsers may not fully support WebSockets
- **Proxy Compatibility**: Some proxies and firewalls may block WebSocket connections
- **Model Limitations**: Subject to the limitations of the underlying LLM model
- **API Dependency**: Requires a connection to the OpenRouter API

## Integration with Other Functions

Agent WebSocket can be integrated with other edge functions:

```typescript
// Example of sending a notification to a WebSocket client from another function
async function notifyWebSocketClient(sessionId, message) {
  // This would require a shared session management system or database
  const response = await fetch("https://your-project-ref.supabase.co/functions/v1/notify_websocket", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${supabaseAnonKey}`
    },
    body: JSON.stringify({
      sessionId,
      message
    })
  });
  
  return await response.json();
}
```

---

Created by rUv, Agentics Foundation founder.