export interface ToolCall {
  id?: string;
  function: {
    name: string;
    arguments: string;
  };
}

export interface Message {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

export interface Tool {
  name: string;
  description: string;
  parameters: object;
  execute: (params: any) => Promise<any>;
}

export interface Context {
  conversation: Message[];
  state: AgentState;
  parent?: Context;

  // Message Management
  addMessage(message: Message): void;
  getConversationHistory(): Message[];

  // State Management
  setState<K extends keyof AgentState>(key: K, value: AgentState[K]): void;
  getState<K extends keyof AgentState>(key: K): AgentState[K] | undefined;

  // Resource Management
  setResource(key: string, value: any): void;
  getResource(key: string): any;

  // Memory Management
  remember(key: string, value: any): void;
  recall(key: string): any;

  // Action Tracking
  trackAction(action: string): void;
  getActions(): string[];

  // Information Collection
  markCollected(field: string): void;
  isCollected(field: string): boolean;

  // Workflow Management
  initializeWorkflow(): void;
  getWorkflowId(): string | undefined;
}

export interface AgentState {
  workflow_id?: string;
  collected_info: Record<string, boolean>;
  previous_actions: string[];
  resources: Record<string, any>;
  memory: Record<string, any>;
  config?: any;
  agent_config?: any;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: object;
  execute: (params: any, context: Context) => Promise<any>;
}

export interface MCPServerConfig {
  name: string;
  version: string;
  openai: {
    apiKey: string;
    defaultModel: string;
  };
  e2b: {
    apiKey: string;
  };
  mcp: {
    secretKey?: string;
  };
  configPath: string;
  agentConfigPath: string;
  tracing?: {
    enabled: boolean;
    level: 'debug' | 'info' | 'error';
  };
  tools: {
    enabled: string[];
    config: Record<string, any>;
  };
  guardrails: {
    enabled: boolean;
    rules: any[];
  };
}

export interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params: any;
}

export interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
  };
}

export interface MCPStreamResponse {
  type: string;
  content: string;
  done: boolean;
}

export interface MCPStreamEvent {
  type: string;
  content: string;
  metadata?: Record<string, any>;
}

export interface ResourceHandler {
  get: (params: any) => Promise<any>;
  watch?: (params: any, onChange: () => void) => Promise<() => void>;
}

export interface Resource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
  handler: ResourceHandler;
}

export interface Span {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  metadata?: Record<string, any>;
}

export interface Trace {
  id: string;
  spans: Span[];
  metadata: Record<string, any>;
}

// SPARC2 specific types
export interface AnalyzeParams {
  files: string[];
  output?: string;
  model?: string;
  mode?: "automatic" | "semi" | "manual" | "custom";
  diff_mode?: "file" | "function";
  processing?: "parallel" | "sequential" | "concurrent" | "swarm";
}

export interface ModifyParams {
  files: string[];
  suggestions: string;
  model?: string;
  mode?: "automatic" | "semi" | "manual" | "custom";
  diff_mode?: "file" | "function";
  processing?: "parallel" | "sequential" | "concurrent" | "swarm";
}

export interface ExecuteParams {
  file: string;
  code?: string;
  language?: string;
  stream?: boolean;
  timeout?: number;
}

export interface CheckpointParams {
  message: string;
}

export interface RollbackParams {
  commit: string;
}

export interface SearchParams {
  query: string;
  max_results?: number;
}

export interface ConfigParams {
  action: "get" | "set" | "list";
  key?: string;
  value?: string | number | boolean | object;
}

export interface AnalysisResult {
  id: string;
  timestamp: string;
  files: string[];
  findings: {
    type: "bug" | "performance" | "security" | "style" | "other";
    file: string;
    line?: number;
    column?: number;
    message: string;
    severity: "low" | "medium" | "high" | "critical";
    suggestions?: string[];
  }[];
  summary: string;
}

export interface ModificationResult {
  id: string;
  timestamp: string;
  files: string[];
  changes: {
    file: string;
    diff: string;
    summary: string;
  }[];
  summary: string;
}

export interface ExecutionResult {
  id: string;
  timestamp: string;
  file?: string;
  code?: string;
  language: string;
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: number;
}

export interface CheckpointResult {
  id: string;
  timestamp: string;
  message: string;
  hash: string;
}

export interface RollbackResult {
  id: string;
  timestamp: string;
  from: string;
  to: string;
  files: string[];
  summary: string;
}

export interface SearchResult {
  id: string;
  timestamp: string;
  query: string;
  results: {
    score: number;
    file: string;
    snippet: string;
    line?: number;
    column?: number;
  }[];
}

export interface ConfigResult {
  action: "get" | "set" | "list";
  key?: string;
  value?: any;
  items?: Record<string, any>;
}