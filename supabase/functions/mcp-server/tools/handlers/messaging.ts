// tools/handlers/messaging.ts
import { createClient } from '@supabase/supabase-js';
import { sendMessageSchema } from '../schemas.ts';
import { ToolHandler } from '../registry.ts';

// Get environment variables
// @ts-ignore - Deno is available in Supabase Edge Functions
const SUPABASE_URL = (Deno as any).env.get('SUPABASE_URL') || '';
// @ts-ignore - Deno is available in Supabase Edge Functions
const SUPABASE_KEY = (Deno as any).env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Send message handler
async function sendMessage(args: any): Promise<any> {
  const { agent, message } = args;
  
  try {
    // Send message to agent via Realtime channel
    const channel = supabase.channel(agent);
    await channel.subscribe();
    
    await channel.send({
      type: 'broadcast',
      event: 'message',
      payload: {
        sender: 'mcp-server',
        content: message,
        timestamp: Date.now(),
        id: crypto.randomUUID(),
      },
    });
    
    return `Message sent to agent: ${agent}`;
  } catch (error) {
    throw new Error(`Error sending message: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Broadcast message handler
async function broadcastMessage(args: any): Promise<any> {
  const { channel, message } = args;
  
  try {
    // Send message to channel via Realtime
    const realtimeChannel = supabase.channel(channel);
    await realtimeChannel.subscribe();
    
    await realtimeChannel.send({
      type: 'broadcast',
      event: 'message',
      payload: {
        sender: 'mcp-server',
        content: message,
        timestamp: Date.now(),
        id: crypto.randomUUID(),
      },
    });
    
    return `Message broadcast to channel: ${channel}`;
  } catch (error) {
    throw new Error(`Error broadcasting message: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Export all messaging tools
export const messagingTools: ToolHandler[] = [
  {
    name: 'send_message',
    description: 'Send a message to an agent',
    inputSchema: sendMessageSchema,
    handler: sendMessage
  },
  {
    name: 'broadcast_message',
    description: 'Broadcast a message to a channel',
    inputSchema: {
      type: 'object',
      properties: {
        channel: {
          type: 'string',
          description: 'Channel name',
        },
        message: {
          type: 'string',
          description: 'Message content',
        },
      },
      required: ['channel', 'message'],
    },
    handler: broadcastMessage
  }
];