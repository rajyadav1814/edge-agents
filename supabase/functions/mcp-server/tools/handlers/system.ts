// tools/handlers/system.ts
import { systemInfoSchema } from '../schemas.ts';
import { ToolHandler } from '../registry.ts';

// Get system info handler
async function getSystemInfo(args: any): Promise<any> {
  const { type } = args;
  
  try {
    const info: any = {};
    
    if (type === 'memory' || type === 'all') {
      // Get memory info
      try {
        // @ts-ignore - Deno is available in Supabase Edge Functions
        const memoryInfo = {
          total: (Deno as any).systemMemoryInfo().total,
          available: (Deno as any).systemMemoryInfo().available,
          used: (Deno as any).systemMemoryInfo().total - (Deno as any).systemMemoryInfo().available,
        };
        
        info.memory = memoryInfo;
      } catch (error) {
        info.memory = { error: "Memory info not available" };
      }
    }
    
    if (type === 'cpu' || type === 'all') {
      // Get CPU info
      try {
        const cpuInfo = {
          cores: navigator.hardwareConcurrency,
        };
        
        info.cpu = cpuInfo;
      } catch (error) {
        info.cpu = { error: "CPU info not available" };
      }
    }
    
    return info;
  } catch (error) {
    throw new Error(`Error getting system info: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Get server status handler
async function getServerStatus(): Promise<any> {
  try {
    const status = {
      uptime: performance.now(),
      timestamp: Date.now(),
      status: 'running',
    };
    
    return status;
  } catch (error) {
    throw new Error(`Error getting server status: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Export all system tools
export const systemTools: ToolHandler[] = [
  {
    name: 'get_system_info',
    description: 'Get system information',
    inputSchema: systemInfoSchema,
    handler: getSystemInfo
  },
  {
    name: 'get_server_status',
    description: 'Get server status',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
    handler: getServerStatus
  }
];