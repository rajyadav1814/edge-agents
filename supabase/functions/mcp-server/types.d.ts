// Type definitions for the MCP server

// Tool handler type definition
export interface ToolHandler {
  name: string;
  description: string;
  inputSchema: any;
  handler: (args: any) => Promise<any>;
}

// MCP SDK types (these will be available at runtime from the SDK)
declare module '@modelcontextprotocol/sdk/types' {
  export enum ErrorCode {
    ParseError = -32700,
    InvalidRequest = -32600,
    MethodNotFound = -32601,
    InvalidParams = -32602,
    InternalError = -32603,
    ServerError = -32000,
  }

  export class McpError extends Error {
    constructor(code: ErrorCode, message: string);
    code: ErrorCode;
  }

  export const CallToolRequestSchema: {
    method: string;
    params: {
      name: string;
      arguments: any;
    };
  };

  export const ListToolsRequestSchema: {
    method: string;
  };

  export const ListResourcesRequestSchema: {
    method: string;
  };

  export const ListResourceTemplatesRequestSchema: {
    method: string;
  };

  export const ReadResourceRequestSchema: {
    method: string;
    params: {
      uri: string;
    };
  };
}

// Supabase types
declare module '@supabase/supabase-js' {
  export function createClient(url: string, key: string): SupabaseClient;

  export interface SupabaseClient {
    from: (table: string) => QueryBuilder;
    channel: (name: string) => RealtimeChannel;
  }

  export interface QueryBuilder {
    select: (columns?: string) => QueryBuilder;
    eq: (column: string, value: any) => QueryBuilder;
    limit: (count: number) => Promise<{ data: any; error: any }>;
    insert: (data: any) => QueryBuilder;
    update: (data: any) => QueryBuilder;
  }

  export interface RealtimeChannel {
    subscribe: () => Promise<void>;
    send: (data: any) => Promise<void>;
  }
}