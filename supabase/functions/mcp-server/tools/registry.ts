// tools/registry.ts
import { 
  // @ts-ignore - MCP SDK types will be available at runtime
  CallToolRequestSchema, 
  // @ts-ignore - MCP SDK types will be available at runtime
  ListToolsRequestSchema,
  // @ts-ignore - MCP SDK types will be available at runtime
  McpError,
  // @ts-ignore - MCP SDK types will be available at runtime
  ErrorCode
} from '@modelcontextprotocol/sdk/types';
import { databaseTools } from './handlers/database.ts';
import { messagingTools } from './handlers/messaging.ts';
import { systemTools } from './handlers/system.ts';

// Tool handler type definition
export interface ToolHandler {
  name: string;
  description: string;
  inputSchema: any;
  handler: (args: any) => Promise<any>;
}

export class ToolRegistry {
  private tools: Map<string, ToolHandler> = new Map();
  
  constructor() {
    // Register all tools
    this.registerTools([
      ...databaseTools,
      ...messagingTools,
      ...systemTools
    ]);
  }
  
  // Register a single tool
  registerTool(tool: ToolHandler): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool with name '${tool.name}' already exists`);
    }
    
    this.tools.set(tool.name, tool);
  }
  
  // Register multiple tools
  registerTools(tools: ToolHandler[]): void {
    for (const tool of tools) {
      this.registerTool(tool);
    }
  }
  
  // Get a tool by name
  getTool(name: string): ToolHandler | undefined {
    return this.tools.get(name);
  }
  
  // Get all tools
  getAllTools(): ToolHandler[] {
    return Array.from(this.tools.values());
  }
  
  // Handle list tools request
  async handleListTools(): Promise<any> {
    const tools = this.getAllTools().map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema
    }));
    
    return { tools };
  }
  
  // Handle call tool request
  async handleCallTool(name: string, args: any): Promise<any> {
    const tool = this.getTool(name);
    
    if (!tool) {
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
    
    try {
      const result = await tool.handler(args);
      
      return {
        content: [
          {
            type: 'text',
            text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true
      };
    }
  }
  
  // Register request handlers with the MCP server
  registerWithServer(server: any): void {
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      return this.handleListTools();
    });
    
    server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
      const { name, arguments: args } = request.params;
      return this.handleCallTool(name, args);
    });
  }
}