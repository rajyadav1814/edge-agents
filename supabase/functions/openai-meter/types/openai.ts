/**
 * HTTP Status Codes
 */
export enum StatusCodes {
  OK = 200,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
}

/**
 * OpenAI Error Types
 */
export enum ErrorTypes {
  VALIDATION_ERROR = "validation_error",
  AUTHENTICATION_ERROR = "authentication_error",
  RATE_LIMIT_ERROR = "rate_limit_error",
  OPENAI_ERROR = "openai_error",
  STRIPE_ERROR = "stripe_error",
  INTERNAL_ERROR = "server_error",
}

/**
 * Chat Role Types
 */
export type ChatRole = "system" | "user" | "assistant" | "function";

/**
 * Chat Message Format
 */
export interface ChatMessage {
  role: ChatRole;
  content: string;
  name?: string;
  function_call?: {
    name: string;
    arguments: string;
  };
}

/**
 * Chat Completion Request Format
 */
export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  top_p?: number;
  n?: number;
  stream?: boolean;
  stop?: string | string[];
  max_tokens?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  logit_bias?: Record<string, number>;
  user?: string;
  functions?: Array<{
    name: string;
    description?: string;
    parameters: Record<string, unknown>;
  }>;
  function_call?: "auto" | "none" | { name: string };
}

/**
 * Chat Completion Response Choice
 */
export interface ChatCompletionChoice {
  index: number;
  message: ChatMessage;
  finish_reason: string | null;
}

/**
 * Chat Completion Response Format
 */
export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  metering?: {
    model: string;
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    cost: number;
  };
}

/**
 * Chat Completion Stream Delta
 */
export interface ChatCompletionStreamDelta {
  role?: ChatRole;
  content?: string;
  function_call?: {
    name?: string;
    arguments?: string;
  };
}

/**
 * Chat Completion Stream Choice
 */
export interface ChatCompletionStreamChoice {
  index: number;
  delta: ChatCompletionStreamDelta;
  finish_reason: string | null;
}

/**
 * Chat Completion Stream Response
 */
export interface ChatCompletionStreamResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: ChatCompletionStreamChoice[];
  metering?: {
    model: string;
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    cost: number;
  };
}

/**
 * OpenAI Error Response
 */
export interface OpenAIErrorResponse {
  error: {
    message: string;
    type: string;
    param?: string;
    code?: string;
  };
}

/**
 * Stripe Metering Response
 */
export interface StripeMeteringResponse {
  id: string;
  object: string;
  livemode: boolean;
  quantity: number;
  subscription_item: string;
  timestamp: number;
  action: string;
}

/**
 * Stripe Error Response
 */
export interface StripeErrorResponse {
  error: {
    message: string;
    type: string;
    code?: string;
  };
}