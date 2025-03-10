# Supabase Real-time Channels

## Overview

Supabase Real-time Channels provide a mechanism for real-time communication between clients and servers. They enable bidirectional communication, allowing for instant updates and notifications without the need for polling. Real-time Channels are built on top of Phoenix Channels and WebSockets, providing a reliable and scalable solution for real-time applications.

## Key Features

- **Bidirectional Communication**: Two-way communication between clients and servers
- **Low Latency**: Instant updates with minimal delay
- **Scalable Architecture**: Designed to handle thousands of concurrent connections
- **Secure Authentication**: JWT-based authentication for secure connections
- **Presence Tracking**: Track online users and their state
- **Broadcast Capabilities**: Send messages to multiple clients simultaneously
- **Database Integration**: Subscribe to database changes in real-time
- **Edge Function Integration**: Trigger edge functions from real-time events

## Architecture

Supabase Real-time Channels are built on a publish-subscribe model. Clients subscribe to channels, and servers publish messages to those channels. When a message is published to a channel, all subscribed clients receive the message.

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │
│   Client    │◄───▶│  Supabase   │◄───▶│  Database   │
│             │     │  Real-time  │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
       ▲                   ▲                   ▲
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │
│   Client    │◄───▶│   Channel   │◄───▶│    Edge     │
│             │     │             │     │  Function   │
└─────────────┘     └─────────────┘     └─────────────┘
```

## Channel Types

Supabase Real-time Channels support several types of channels:

### Presence Channels

Presence channels track the online status and state of connected clients. They are useful for building features like online indicators, typing indicators, and user activity tracking.

```typescript
// Subscribe to a presence channel
const channel = supabase.channel('room:123', {
  config: {
    presence: {
      key: user.id,
    },
  },
});

// Track presence changes
channel.on('presence', { event: 'sync' }, () => {
  const state = channel.presenceState();
  console.log('Current state:', state);
});

// Update presence state
channel.track({ user_id: user.id, status: 'online' });
```

### Broadcast Channels

Broadcast channels allow clients to send messages to all other connected clients. They are useful for building chat applications, collaborative editing, and real-time notifications.

```typescript
// Subscribe to a broadcast channel
const channel = supabase.channel('room:123');

// Listen for broadcast messages
channel.on('broadcast', { event: 'message' }, (payload) => {
  console.log('Received message:', payload);
});

// Send a broadcast message
channel.send({
  type: 'broadcast',
  event: 'message',
  payload: { text: 'Hello, world!' },
});
```

### Database Channels

Database channels allow clients to subscribe to database changes. They are useful for building real-time dashboards, activity feeds, and collaborative applications.

```typescript
// Subscribe to database changes
const channel = supabase
  .channel('db-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'messages',
    },
    (payload) => {
      console.log('Change received:', payload);
    }
  )
  .subscribe();
```

## Integration with Edge Functions

Real-time Channels can be integrated with Edge Functions to create powerful real-time applications. Edge Functions can subscribe to channels, process messages, and publish responses.

```typescript
// In an Edge Function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  // Subscribe to a channel
  const channel = supabaseClient.channel('room:123');
  
  // Listen for messages
  channel.on('broadcast', { event: 'message' }, async (payload) => {
    // Process the message
    const response = await processMessage(payload);
    
    // Send a response
    channel.send({
      type: 'broadcast',
      event: 'response',
      payload: response,
    });
  });
  
  // Subscribe to the channel
  channel.subscribe();
  
  return new Response(
    JSON.stringify({ message: "Subscribed to channel" }),
    { headers: { "Content-Type": "application/json" } }
  );
});
```

## Authentication

Real-time Channels support JWT-based authentication. Clients can authenticate using a Supabase JWT token, which is automatically handled by the Supabase client library.

```typescript
// Create a Supabase client with authentication
const supabase = createClient(
  'https://your-project-ref.supabase.co',
  'your-anon-key',
  {
    auth: {
      persistSession: true,
    },
  }
);

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password',
});

// After authentication, channels will use the JWT token
const channel = supabase.channel('room:123');
```

## Error Handling

Real-time Channels provide error handling mechanisms to handle connection issues, authentication failures, and other errors.

```typescript
// Handle channel errors
channel.on('system', { event: 'error' }, (error) => {
  console.error('Channel error:', error);
});

// Handle disconnections
channel.on('system', { event: 'disconnect' }, () => {
  console.log('Disconnected from channel');
});

// Handle reconnections
channel.on('system', { event: 'reconnect' }, () => {
  console.log('Reconnected to channel');
});
```

## Best Practices

- **Use Presence for User Status**: Leverage presence channels for tracking user status and activity
- **Implement Retry Logic**: Handle disconnections and implement retry logic for reliable connections
- **Optimize Payload Size**: Keep message payloads small for better performance
- **Use Appropriate Channel Types**: Choose the right channel type for your use case
- **Implement Error Handling**: Handle errors and disconnections gracefully
- **Secure Your Channels**: Use row-level security and proper authentication
- **Monitor Channel Usage**: Keep track of channel usage and performance

## Limitations

- **Message Size**: Maximum message size is 8KB
- **Rate Limiting**: Channels are subject to rate limiting
- **Connection Limits**: There are limits on the number of concurrent connections
- **Persistence**: Messages are not persisted by default

## Resources

- [Supabase Real-time Documentation](https://supabase.com/docs/guides/realtime)
- [Phoenix Channels Documentation](https://hexdocs.pm/phoenix/Phoenix.Channel.html)
- [WebSocket API Reference](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)

---

Created by rUv, Agentics Foundation founder.