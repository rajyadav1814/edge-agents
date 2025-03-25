import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ErrorCode,
  McpError
} from '@modelcontextprotocol/sdk/types.js';

import { MCPServerConfig, MCPTool, Context } from '../types/index.js';
import { MCPContext } from './context.js';
import { ToolRegistry } from './tools/registry.js';

// Import the tools adapter that will relay calls to the SPARC2Agent
import { 
  AnalyzeTool, 
  ModifyTool, 
  ExecuteTool, 
  CheckpointTool, 
  RollbackTool, 
  SearchTool, 
  ConfigTool 
} from './tools/adapters.js';

/**
 * SPARC2MCPServer provides an MCP interface for the SPARC2 agent
 */
export class SPARC2MCPServer {
  private server: Server;
  private toolRegistry: ToolRegistry;
  private tracingEnabled: boolean;
  private tracingLevel: string;
  private config: MCPServerConfig;

  /**
   * Create a new SPARC2MCPServer
   * @param config Server configuration
   */
  constructor(config: MCPServerConfig) {
    this.config = config;
    this.server = new Server(
      {
        name: config.name,
        version: config.version,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.toolRegistry = new ToolRegistry();
    this.tracingEnabled = config.tracing?.enabled || false;
    this.tracingLevel = config.tracing?.level || 'info';

    // Initialize tools based on configuration
    this.initializeTools(config);

    // Set up request handlers
    this.setupRequestHandlers();

    // Set up error handling
    this.setupErrorHandling();
  }

  /**
   * Log a message if tracing is enabled
   * @param level Log level
   * @param args Arguments to log
   */
  private log(level: string, ...args: any[]): void {
    if (!this.tracingEnabled) return;
    
    const levels = {
      debug: 0,
      info: 1,
      error: 2
    };
    
    const currentLevel = levels[this.tracingLevel as keyof typeof levels] || 1;
    const msgLevel = levels[level as keyof typeof levels] || 1;
    
    if (msgLevel >= currentLevel) {
      console.error(`[SPARC2-MCP ${level.toUpperCase()}]`, ...args);
    }
  }

  /**
   * Initialize tools based on configuration
   * @param config Server configuration
   */
  private initializeTools(config: MCPServerConfig): void {
    this.log('debug', 'Initializing tools with config:', {
      enabled: config.tools.enabled,
      openai: !!config.openai.apiKey,
      e2b: !!config.e2b.apiKey
    });

    // Common tool parameters
    const toolParams = {
      openaiApiKey: config.openai.apiKey,
      openaiModel: config.openai.defaultModel,
      e2bApiKey: config.e2b.apiKey,
      configPath: config.configPath,
      agentConfigPath: config.agentConfigPath
    };

    for (const toolName of config.tools.enabled) {
      this.log('debug', `Attempting to register tool: ${toolName}`);

      try {
        switch (toolName) {
          case 'analyze':
            this.toolRegistry.registerTool(new AnalyzeTool(toolParams));
            break;
          case 'modify':
            this.toolRegistry.registerTool(new ModifyTool(toolParams));
            break;
          case 'execute':
            this.toolRegistry.registerTool(new ExecuteTool(toolParams));
            break;
          case 'checkpoint':
            this.toolRegistry.registerTool(new CheckpointTool(toolParams));
            break;
          case 'rollback':
            this.toolRegistry.registerTool(new RollbackTool(toolParams));
            break;
          case 'search':
            this.toolRegistry.registerTool(new SearchTool(toolParams));
            break;
          case 'config':
            this.toolRegistry.registerTool(new ConfigTool(toolParams));
            break;
          default:
            this.log('error', `Unknown tool: ${toolName}`);
        }

        this.log('debug', `Successfully registered tool: ${toolName}`);
      } catch (error) {
        this.log('error', `Failed to register tool ${toolName}:`, error);
      }
    }

    this.log('info', 'Registered tools:', this.toolRegistry.listTools().map(t => t.name));
  }

  /**
   * Set up request handlers
   */
  private setupRequestHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = this.toolRegistry.listTools();
      this.log('debug', 'Available tools:', tools.map(t => t.name));
      return { tools };
    });

    // Execute tool
    this.server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
      this.log('debug', 'Executing tool request:', {
        name: request.params.name,
        arguments: request.params.arguments
      });
      
      const context = new MCPContext();

      try {
        // Initialize workflow if not exists
        if (!context.getWorkflowId()) {
          context.initializeWorkflow();
          this.log('debug', `Initialized workflow: ${context.getWorkflowId()}`);
        }

        // Validate tool exists
        if (!request.params.name) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Tool name is required'
          );
        }

        // Execute tool with validation
        const result = await this.toolRegistry.executeToolWithValidation(
          request.params.name,
          request.params.arguments,
          context
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result)
            }
          ]
        };
      } catch (error: any) {
        const errorMessage = error?.message || 'Unknown error';
        
        if (error instanceof McpError) {
          throw error;
        }

        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${errorMessage}`
        );
      }
    });
  }

  /**
   * Set up error handling
   */
  private setupErrorHandling(): void {
    this.server.onerror = (error: Error) => {
      this.log('error', 'MCP Error:', error);
    };
  }

  /**
   * Register a tool with the server
   * @param tool Tool to register
   */
  public registerTool(tool: MCPTool): void {
    this.toolRegistry.registerTool(tool);
  }

  /**
   * Start serving on stdio
   */
  public async serve(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    this.log('info', `${this.config.name} MCP server running on stdio`);

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }
}