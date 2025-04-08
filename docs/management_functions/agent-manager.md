# Agent Manager

## Overview

The Agent Manager function provides a centralized system for managing and orchestrating multiple agents. It handles agent registration, discovery, communication, and lifecycle management, enabling complex multi-agent systems to operate efficiently.

## Architecture

The Agent Manager follows a hub-and-spoke architecture where it acts as the central hub for all agent communications and management operations. Agents register with the manager and communicate through it.

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │
│   Agent 1   │◄───▶│    Agent    │◄───▶│   Agent 2   │
│             │     │   Manager   │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
                          ▲
                          │
                          ▼
                    ┌─────────────┐
                    │             │
                    │   Agent 3   │
                    │             │
                    └─────────────┘
```

## Features

- **Agent Registration**: Register new agents with the system
- **Agent Discovery**: Find agents based on capabilities or metadata
- **Message Routing**: Route messages between agents
- **Lifecycle Management**: Start, stop, and monitor agents
- **Capability Management**: Track and query agent capabilities
- **State Management**: Maintain agent state information
- **Error Handling**: Handle agent failures and errors
- **Logging**: Comprehensive logging for debugging and monitoring

## Implementation Details

### Request Processing

The Agent Manager processes incoming HTTP requests, routing them to the appropriate handler based on the request path:

```typescript
serve(async (req) => {
  // Enable CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.split("/").pop();

  try {
    // Route request to appropriate handler
    switch (path) {
      case "register":
        return await handleRegister(req);
      case "discover":
        return await handleDiscover(req);
      case "send-message":
        return await handleSendMessage(req);
      case "status":
        return await handleStatus(req);
      default:
        return new Response(JSON.stringify({ error: "Invalid endpoint" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    // Handle errors
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

### Agent Registration

The Agent Manager allows agents to register their capabilities and metadata:

```typescript
async function handleRegister(req) {
  const { id, name, capabilities, endpoint } = await req.json();
  
  // Validate inputs
  if (!id || !name || !capabilities || !endpoint) {
    throw new Error("Missing required fields: id, name, capabilities, endpoint");
  }
  
  // Register agent in database
  const { data, error } = await supabaseClient
    .from("agents")
    .upsert({
      id,
      name,
      capabilities,
      endpoint,
      status: "active",
      last_seen: new Date().toISOString()
    });
  
  if (error) {
    throw new Error(`Failed to register agent: ${error.message}`);
  }
  
  return new Response(JSON.stringify({ success: true, agent: data[0] }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
```

### Agent Discovery

The Agent Manager allows clients to discover agents based on capabilities or other criteria:

```typescript
async function handleDiscover(req) {
  const { capabilities, status } = await req.json();
  
  // Build query
  let query = supabaseClient.from("agents").select("*");
  
  // Filter by capabilities if provided
  if (capabilities && capabilities.length > 0) {
    query = query.contains("capabilities", capabilities);
  }
  
  // Filter by status if provided
  if (status) {
    query = query.eq("status", status);
  }
  
  // Execute query
  const { data, error } = await query;
  
  if (error) {
    throw new Error(`Failed to discover agents: ${error.message}`);
  }
  
  return new Response(JSON.stringify({ agents: data }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
```

### Message Routing

The Agent Manager routes messages between agents:

```typescript
async function handleSendMessage(req) {
  const { from, to, message } = await req.json();
  
  // Validate inputs
  if (!from || !to || !message) {
    throw new Error("Missing required fields: from, to, message");
  }
  
  // Get recipient agent
  const { data: agent, error } = await supabaseClient
    .from("agents")
    .select("endpoint")
    .eq("id", to)
    .single();
  
  if (error || !agent) {
    throw new Error(`Recipient agent not found: ${to}`);
  }
  
  // Forward message to recipient
  const response = await fetch(agent.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      message
    })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to deliver message: ${response.statusText}`);
  }
  
  // Record message in database
  await supabaseClient
    .from("messages")
    .insert({
      from_agent: from,
      to_agent: to,
      content: message,
      timestamp: new Date().toISOString()
    });
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
```

### Agent Status

The Agent Manager provides status information about registered agents:

```typescript
async function handleStatus(req) {
  const { id } = await req.json();
  
  // If ID is provided, get status for specific agent
  if (id) {
    const { data, error } = await supabaseClient
      .from("agents")
      .select("id, name, status, last_seen")
      .eq("id", id)
      .single();
    
    if (error || !data) {
      throw new Error(`Agent not found: ${id}`);
    }
    
    return new Response(JSON.stringify({ agent: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  
  // Otherwise, get status for all agents
  const { data, error } = await supabaseClient
    .from("agents")
    .select("id, name, status, last_seen");
  
  if (error) {
    throw new Error(`Failed to get agent status: ${error.message}`);
  }
  
  return new Response(JSON.stringify({ agents: data }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
```

## Database Schema

The Agent Manager uses the following database schema:

### Agents Table

```sql
CREATE TABLE agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  capabilities JSONB NOT NULL,
  endpoint TEXT NOT NULL,
  status TEXT NOT NULL,
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Messages Table

```sql
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  from_agent TEXT NOT NULL REFERENCES agents(id),
  to_agent TEXT NOT NULL REFERENCES agents(id),
  content JSONB NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'delivered'
);
```

## Configuration

The Agent Manager can be configured using environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `SUPABASE_URL` | URL of the Supabase project | Required |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for Supabase | Required |
| `HEARTBEAT_INTERVAL` | Interval for agent heartbeats in seconds | 60 |

## Usage

### Agent Registration

```json
{
  "id": "agent-123",
  "name": "Data Processing Agent",
  "capabilities": ["data-processing", "text-analysis"],
  "endpoint": "https://your-project-ref.supabase.co/functions/v1/agent_alpha"
}
```

### Agent Discovery

```json
{
  "capabilities": ["text-analysis"],
  "status": "active"
}
```

### Send Message

```json
{
  "from": "agent-123",
  "to": "agent-456",
  "message": {
    "type": "request",
    "action": "process-data",
    "data": {
      "text": "Hello, world!"
    }
  }
}
```

### Get Agent Status

```json
{
  "id": "agent-123"
}
```

## Error Handling

The Agent Manager handles various error scenarios:

- **Invalid Input**: Returns a 400 error if the input format is invalid
- **Agent Not Found**: Returns a 404 error if the requested agent is not found
- **Message Delivery Failure**: Returns a 500 error if a message cannot be delivered
- **Database Errors**: Returns a 500 error with details if database operations fail

## Deployment

Deploy the Agent Manager as a Supabase Edge Function:

```bash
# Deploy the function
supabase functions deploy agent-manager

# Set environment variables
supabase secrets set SUPABASE_URL=your-supabase-url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Testing

Test the Agent Manager locally:

```bash
# Serve the function locally
supabase functions serve agent-manager --env-file .env.local

# Test agent registration
curl -X POST http://localhost:54321/functions/v1/agent-manager/register \
  -H "Content-Type: application/json" \
  -d '{
    "id": "agent-123",
    "name": "Test Agent",
    "capabilities": ["test"],
    "endpoint": "http://localhost:54321/functions/v1/agent_alpha"
  }'
```

## Security Considerations

- **Authentication**: Consider implementing authentication for agent registration and message sending
- **Input Validation**: All inputs are validated to prevent injection attacks
- **Rate Limiting**: Consider implementing rate limiting to prevent abuse
- **Message Encryption**: Consider encrypting sensitive message content

## Integration with Other Functions

The Agent Manager can be integrated with other edge functions to create a multi-agent system:

```typescript
// Example of registering an agent
async function registerAgent(id, name, capabilities, endpoint) {
  const response = await fetch("https://your-project-ref.supabase.co/functions/v1/agent-manager/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${supabaseAnonKey}`
    },
    body: JSON.stringify({
      id,
      name,
      capabilities,
      endpoint
    })
  });
  
  return await response.json();
}

// Example of sending a message to another agent
async function sendMessage(from, to, message) {
  const response = await fetch("https://your-project-ref.supabase.co/functions/v1/agent-manager/send-message", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${supabaseAnonKey}`
    },
    body: JSON.stringify({
      from,
      to,
      message
    })
  });
  
  return await response.json();
}
```

---

Created by rUv, Agentics Foundation founder.