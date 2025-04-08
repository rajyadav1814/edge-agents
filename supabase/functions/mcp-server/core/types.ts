/**
 * JSON-RPC 2.0 Types for MCP Server
 */

export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: string;
  method: string;
  params?: any;
}

export interface JsonRpcSuccessResponse {
  jsonrpc: "2.0";
  id: string;
  result: any;
}

export interface JsonRpcErrorResponse {
  jsonrpc: "2.0";
  id: string | null;
  error: {
    code: number;
    message: string;
    data?: any;
  };
}

export type JsonRpcResponse = JsonRpcSuccessResponse | JsonRpcErrorResponse;

// Tool Use Types
export interface ToolUseRequest {
  command: string;
  arguments?: Record<string, unknown>;
}

export interface ToolUseResponse {
  type: "tool_use";
  command: string;
  result: {
    output: string;
  };
}

// Resource Access Types
export interface ResourceAccessRequest {
  resourceId: string;
  parameters?: Record<string, unknown>;
}

export interface ResourceAccessResponse {
  type: "resource_access";
  resourceId: string;
  contentType: string;
  data: Record<string, unknown>;
}

// Prompt Use Types
export interface PromptUseRequest {
  prompt: string;
  options?: Record<string, unknown>;
}

export interface PromptUseResponse {
  type: "prompt_use";
  messages: Array<{
    role: string;
    content: string;
  }>;
}

// Error Codes
export enum ErrorCode {
  ParseError = -32700,
  InvalidRequest = -32600,
  MethodNotFound = -32601,
  InvalidParams = -32602,
  InternalError = -32603,
  ServerError = -32000
}