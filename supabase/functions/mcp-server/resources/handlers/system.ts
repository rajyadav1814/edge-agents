// resources/handlers/system.ts
import { ResourceHandler } from '../registry.ts';
import { McpError, ErrorCode } from 'https://esm.sh/@modelcontextprotocol/sdk/types.js';

// System info resource handler
async function handleSystemInfo(): Promise<any> {
  try {
    const info = {
      memory: {
        // @ts-ignore - Deno is available in Supabase Edge Functions
        total: (Deno as any).systemMemoryInfo().total,
        // @ts-ignore - Deno is available in Supabase Edge Functions
        available: (Deno as any).systemMemoryInfo().available,
        // @ts-ignore - Deno is available in Supabase Edge Functions
        used: (Deno as any).systemMemoryInfo().total - (Deno as any).systemMemoryInfo().available,
      },
      cpu: {
        cores: navigator.hardwareConcurrency,
      },
      timestamp: Date.now(),
    };
    
    return info;
  } catch (error: any) {
    throw new McpError(ErrorCode.InternalError, `Error getting system info: ${error.message}`);
  }
}

// Server status resource handler
async function handleServerStatus(): Promise<any> {
  try {
    const status = {
      uptime: performance.now(),
      timestamp: Date.now(),
      status: 'running',
    };
    
    return status;
  } catch (error: any) {
    throw new McpError(ErrorCode.InternalError, `Error getting server status: ${error.message}`);
  }
}

// Export system resources
export const systemResources: ResourceHandler[] = [
  {
    uri: 'supabase://system/info',
    name: 'System Information',
    mimeType: 'application/json',
    description: 'System information including memory and CPU',
    handler: handleSystemInfo
  },
  {
    uri: 'supabase://system/status',
    name: 'Server Status',
    mimeType: 'application/json',
    description: 'Server status information',
    handler: handleServerStatus
  }
];