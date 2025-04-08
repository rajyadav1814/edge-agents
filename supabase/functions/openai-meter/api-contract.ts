/**
 * API Contract
 * Defines the request and response formats for the OpenAI proxy API
 */

/**
 * HTTP Status Codes
 */
export enum StatusCodes {
  OK = 200,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
}

/**
 * Error Types
 */
export enum ErrorTypes {
  AUTHENTICATION_ERROR = "authentication_error",
  AUTHORIZATION_ERROR = "authorization_error",
  VALIDATION_ERROR = "validation_error",
  RATE_LIMIT_ERROR = "rate_limit_error",
  OPENAI_ERROR = "openai_error",
  STRIPE_ERROR = "stripe_error",
  INTERNAL_ERROR = "internal_error",
}

/**
 * API Error
 */
export class APIError extends Error {
  public type: ErrorTypes;
  public status: StatusCodes;
  public param?: string;
  
  /**
   * Create a new API error
   * @param message Error message
   * @param type Error type
   * @param status HTTP status code
   * @param param Optional parameter name that caused the error
   */
  constructor(
    message: string,
    type: ErrorTypes,
    status: StatusCodes,
    param?: string
  ) {
    super(message);
    this.name = "APIError";
    this.type = type;
    this.status = status;
    this.param = param;
  }
}

/**
 * Chat Message
 */
export interface ChatMessage {
  role: string;
  content: string;
  name?: string;
  function_call?: {
    name: string;
    arguments: string;
  };
}

/**
 * OpenAI API Request
 */
export interface OpenAIRequest {
  model: string;
  messages: Array<ChatMessage>;
  functions?: Array<{
    name: string;
    description?: string;
    parameters: Record<string, any>;
  }>;
  function_call?: string | { name: string };
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
}

/**
 * OpenAI API Response
 */
export type OpenAIResponse = any;

/**
 * Error Response
 */
export interface ErrorResponse {
  error: {
    message: string;
    type: ErrorTypes;
    param?: string;
    code?: string;
  };
}

/**
 * Create a success response
 * @param data Response data
 * @returns Response object
 */
export function createSuccessResponse(data: any): Response {
  return new Response(JSON.stringify(data), {
    status: StatusCodes.OK,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

/**
 * Create a streaming response
 * @param stream ReadableStream to stream
 * @returns Response object
 */
export function createStreamingResponse(stream: ReadableStream<Uint8Array>): Response {
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}

/**
 * Create an error response
 * @param message Error message
 * @param type Error type
 * @param status HTTP status code
 * @param param Optional parameter name that caused the error
 * @returns Response object
 */
export function createErrorResponse(
  message: string,
  type: ErrorTypes,
  status: StatusCodes,
  param?: string
): Response {
  const errorResponse: ErrorResponse = {
    error: {
      message,
      type,
      param,
    },
  };
  
  return new Response(JSON.stringify(errorResponse), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}