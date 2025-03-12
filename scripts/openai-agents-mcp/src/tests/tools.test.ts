jest.mock('../mcp/server');
import { OpenAIAgentMCPServer } from '../mcp/server';
import { MCPContext } from '../mcp/context';

describe('MCP Tools Tests', () => {
  let server: OpenAIAgentMCPServer;
  let context: MCPContext;

  beforeEach(() => {
    server = new OpenAIAgentMCPServer({
      name: 'test-server',
      version: '1.0.0',
      openai: {
        apiKey: process.env.OPENAI_API_KEY || 'test-key',
        defaultModel: 'gpt-4o-mini'
      },
      tracing: {
        enabled: true,
        level: 'debug'
      },
      tools: {
        enabled: ['research', 'database_query', 'customer_support'],
        config: {
          database: {
            url: process.env.SUPABASE_URL || 'test-url',
            key: process.env.SUPABASE_KEY || 'test-key'
          }
        }
      },
      guardrails: {
        enabled: true,
        rules: []
      }
    });
    context = new MCPContext();
  });

  describe('Research Tool', () => {
    it('should perform web search', async () => {
      const result = await (server as any).toolRegistry.executeToolWithValidation(
        'research',
        {
          query: 'Latest developments in AI',
          options: {
            searchDepth: 'medium',
            location: {
              country: 'US'
            }
          }
        },
        context
      );
      expect(result).toBeDefined();
      expect(result.metadata.model).toBe('gpt-4o-search-preview');
    });

    it('should handle invalid search parameters', async () => {
      await expect(
        (server as any).toolRegistry.executeToolWithValidation(
          'research',
          {
            options: {
              searchDepth: 'invalid'
            }
          },
          context
        )
      ).rejects.toThrow();
    });
  });

  describe('Database Tool', () => {
    it('should query database table', async () => {
      const result = await (server as any).toolRegistry.executeToolWithValidation(
        'database_query',
        {
          table: 'users',
          select: ['id', 'name'],
          limit: 5
        },
        context
      );
      expect(result).toBeDefined();
      expect(result.metadata.timestamp).toBeDefined();
    });

    it('should validate table name', async () => {
      await expect(
        (server as any).toolRegistry.executeToolWithValidation(
          'database_query',
          {
            table: ''
          },
          context
        )
      ).rejects.toThrow();
    });

    it('should handle complex queries', async () => {
      const result = await (server as any).toolRegistry.executeToolWithValidation(
        'database_query',
        {
          table: 'users',
          select: ['id', 'name', 'email'],
          filter: {
            role: 'admin'
          },
          order: {
            column: 'name',
            ascending: true
          },
          limit: 10
        },
        context
      );
      expect(result).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('Customer Support Tool', () => {
    it('should handle support queries', async () => {
      const result = await (server as any).toolRegistry.executeToolWithValidation(
        'customer_support',
        {
          query: 'How do I reset my password?',
          context: {
            userId: 'test-user',
            category: 'technical'
          },
          priority: 'medium'
        },
        context
      );
      expect(result).toBeDefined();
      expect(result.metadata.category).toBe('technical');
    });

    it('should validate priority levels', async () => {
      await expect(
        (server as any).toolRegistry.executeToolWithValidation(
          'customer_support',
          {
            query: 'Test query',
            priority: 'invalid'
          },
          context
        )
      ).rejects.toThrow();
    });

    it('should track support interactions', async () => {
      await (server as any).toolRegistry.executeToolWithValidation(
        'customer_support',
        {
          query: 'Test query',
          context: {
            userId: 'test-user'
          }
        },
        context
      );
      expect(context.getActions()).toContain('support_query_handled');
    });
  });

  describe('Tool Registry', () => {
    it('should list available tools', () => {
      const tools = (server as any).toolRegistry.listTools();
      expect(tools).toHaveLength(3);
      expect(tools.map((t: { name: string }) => t.name)).toContain('research');
      expect(tools.map((t: { name: string }) => t.name)).toContain('database_query');
      expect(tools.map((t: { name: string }) => t.name)).toContain('customer_support');
    });

    it('should validate tool existence', async () => {
      await expect(
        (server as any).toolRegistry.executeToolWithValidation(
          'nonexistent_tool',
          {},
          context
        )
      ).rejects.toThrow('Tool not found');
    });

    it('should validate tool parameters', async () => {
      await expect(
        (server as any).toolRegistry.executeToolWithValidation(
          'research',
          {
            invalid_param: true
          },
          context
        )
      ).rejects.toThrow();
    });
  });

  describe('Context Management', () => {
    it('should track actions', () => {
      context.trackAction('test_action');
      expect(context.getActions()).toContain('test_action');
    });

    it('should manage memory', () => {
      context.remember('test_key', 'test_value');
      expect(context.recall('test_key')).toBe('test_value');
    });

    it('should handle workflow IDs', () => {
      context.initializeWorkflow();
      expect(context.getWorkflowId()).toBeDefined();
    });
  });
});
