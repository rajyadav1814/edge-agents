import { MCPTool, Context } from '../../types/index.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

/**
 * Registry for MCP tools that handles registration, validation, and execution
 */
export class ToolRegistry {
  private tools: Map<string, MCPTool>;

  constructor() {
    this.tools = new Map();
  }

  /**
   * Register a tool with the registry
   * @param tool Tool to register
   * @throws Error if a tool with the same name already exists
   */
  public registerTool(tool: MCPTool): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool with name ${tool.name} already exists`);
    }
    this.tools.set(tool.name, tool);
  }

  /**
   * Get a tool by name
   * @param name Name of the tool to get
   * @returns Tool instance or undefined if not found
   */
  public getTool(name: string): MCPTool | undefined {
    return this.tools.get(name);
  }

  /**
   * List all registered tools
   * @returns Array of registered tools
   */
  public listTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Execute a tool by name with validation
   * @param name Name of the tool to execute
   * @param params Parameters to pass to the tool
   * @param context Context for the tool execution
   * @returns Result of the tool execution
   * @throws McpError if the tool is not found or execution fails
   */
  public async executeToolWithValidation(
    name: string,
    params: any,
    context: Context
  ): Promise<any> {
    const tool = this.getTool(name);
    
    if (!tool) {
      throw new McpError(
        ErrorCode.MethodNotFound,
        `Tool not found: ${name}`
      );
    }

    try {
      // Track the tool execution in the context
      context.trackAction(`execute_tool:${name}`);
      
      // Parse arguments as JSON if they're a string
      const args = typeof params === 'string' ? JSON.parse(params) : params;
      
      // Execute the tool
      return await tool.execute(args, context);
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error';
      
      throw new McpError(
        ErrorCode.InternalError,
        `Error executing tool ${name}: ${errorMessage}`
      );
    }
  }

  /**
   * Remove a tool from the registry
   * @param name Name of the tool to remove
   * @returns True if the tool was removed, false if it wasn't found
   */
  public unregisterTool(name: string): boolean {
    return this.tools.delete(name);
  }

  /**
   * Clear all tools from the registry
   */
  public clearTools(): void {
    this.tools.clear();
  }
}