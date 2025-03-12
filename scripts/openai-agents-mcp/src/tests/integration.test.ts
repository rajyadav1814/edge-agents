import { use_mcp_tool } from '../mcp/client';
import '../types/jest';

describe('MCP Integration Tests', () => {
  describe('Research Tool', () => {
    it('should perform web search through MCP', async () => {
      const result = await use_mcp_tool({
        server_name: 'openai-agent',
        tool_name: 'research',
        arguments: {
          query: 'Latest developments in AI',
          options: {
            searchDepth: 'medium',
            location: {
              country: 'US'
            }
          }
        }
      });
      expect(result).toBeDefined();
      expect(result.metadata.model).toBe('gpt-4o-search-preview');
    });
  });

  describe('Database Tool', () => {
    it('should query database through MCP', async () => {
      const result = await use_mcp_tool({
        server_name: 'openai-agent',
        tool_name: 'database_query',
        arguments: {
          table: 'users',
          select: ['id', 'name'],
          limit: 5
        }
      });
      expect(result).toBeDefined();
      expect(result.metadata.timestamp).toBeDefined();
    });
  });

  describe('Customer Support Tool', () => {
    it('should handle support queries through MCP', async () => {
      const result = await use_mcp_tool({
        server_name: 'openai-agent',
        tool_name: 'customer_support',
        arguments: {
          query: 'How do I reset my password?',
          context: {
            userId: 'test-user',
            category: 'technical'
          },
          priority: 'medium'
        }
      });
      expect(result).toBeDefined();
      expect(result.metadata.category).toBe('technical');
    });
  });
});
