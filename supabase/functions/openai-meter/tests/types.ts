export enum ErrorTypes {
  METHOD_NOT_ALLOWED = "method_not_allowed",
  MISSING_API_KEY = "missing_api_key",
  INVALID_API_KEY = "invalid_api_key",
  INVALID_REQUEST = "invalid_request",
  MISSING_FIELD = "missing_field",
  INVALID_MODEL = "invalid_model",
  PROVIDER_ERROR = "provider_error",
  RATE_LIMIT_ERROR = "rate_limit_error",
  SUBSCRIPTION_ERROR = "subscription_error",
  TIMEOUT = "timeout",
  INTERNAL_ERROR = "internal_error",
  OPENAI_ERROR = "openai_error",
  AZURE_ERROR = "azure_error",
  STREAM_ERROR = "stream_error",
  CONFIGURATION_ERROR = "configuration_error",
  USAGE_ERROR = "usage_error",
  METERING_ERROR = "metering_error",
  AUTHENTICATION_ERROR = "authentication_error",
  INACTIVE_SUBSCRIPTION = "inactive_subscription",
}

export class APIError extends Error {
  constructor(
    public type: ErrorTypes,
    override message: string,
    public status: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "APIError";
  }

  toJSON(): { error: { type: ErrorTypes; message: string; details?: Record<string, unknown> } } {
    return {
      error: {
        type: this.type,
        message: this.message,
        ...(this.details && { details: this.details }),
      },
    };
  }

  static fromUnknown(error: unknown, defaultType = ErrorTypes.INTERNAL_ERROR): APIError {
    if (error instanceof APIError) {
      return error;
    }

    const message = error instanceof Error ? error.message : String(error);
    return new APIError(defaultType, message);
  }
}

export interface CompletionRequest {
  model: string;
  messages?: Array<{ role: string; content: string }>;
  prompt?: string;
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface ResponseFormat {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    text?: string;
    message?: {
      role: string;
      content: string;
    };
    finish_reason: string | null;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface StreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    text?: string;
    delta?: {
      role?: string;
      content?: string;
    };
    finish_reason: string | null;
  }>;
}

export interface MeteringProvider {
  validateApiKey(apiKey: string): Promise<boolean>;
  recordUsage(params: { customerId: string; quantity: number; timestamp: Date }): Promise<void>;
}

export interface AIProvider {
  createCompletion(request: CompletionRequest): Promise<ResponseFormat>;
  createChatCompletion(request: CompletionRequest): Promise<ResponseFormat>;
  streamCompletion(request: CompletionRequest): AsyncGenerator<StreamChunk>;
}

export interface RequestBody extends CompletionRequest {
  api_key?: string;
  organization_id?: string;
  user_id?: string;
}

// Type guard for CompletionRequest
export function isCompletionRequest(obj: unknown): obj is CompletionRequest {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "model" in obj &&
    typeof (obj as CompletionRequest).model === "string"
  );
}

// Type guard for APIError
export function isAPIError(error: unknown): error is APIError {
  return error instanceof APIError;
}