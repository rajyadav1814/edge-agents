/**
 * OpenAI Proxy Service
 * Handles proxying requests to OpenAI API with metering
 */
import { OpenAIRequest, OpenAIResponse, APIError, ErrorTypes, StatusCodes } from "../api-contract.ts";
import { EnvironmentValidator } from "../config/env-validator.ts";
import { StripeMeter, MeteringOptions } from "../utils/stripe-meter.ts";
import { TokenCounter } from "../utils/token-counter.ts";

/**
 * OpenAI Proxy Service
 * Handles proxying requests to OpenAI API with metering
 */
export class OpenAIProxyService {
  private stripeMeter: StripeMeter;
  private openaiApiKey: string;
  
  /**
   * Create a new OpenAI proxy service
   */
  constructor() {
    const config = EnvironmentValidator.getConfig();
    this.stripeMeter = new StripeMeter();
    this.openaiApiKey = config.OPENAI_API_KEY;
  }
  
  /**
   * Handle a chat completion request
   * @param request OpenAI API request
   * @param apiKey API key for authentication
   * @returns OpenAI API response
   */
  public async handleChatCompletion(
    request: OpenAIRequest,
    apiKey: string
  ): Promise<OpenAIResponse> {
    try {
      // Validate subscription and check token limits
      const { subscriptionId, userId } = await this.stripeMeter.validateSubscriptionAndTokens(
        apiKey
      );
      
      // Estimate token usage for the request
      const estimatedTokens = TokenCounter.estimateRequestTokens(request);
      
      // Create metering options
      const meteringOptions: MeteringOptions = {
        subscriptionId,
        userId,
        model: request.model,
      };
      
      // Meter the request
      await this.stripeMeter.meterRequest(request, meteringOptions);
      
      // Forward the request to OpenAI
      const response = await this.forwardToOpenAI(request);
      
      // Meter the response
      await this.stripeMeter.meterResponse(response, meteringOptions);
      
      return response;
    } catch (error) {
      this.handleError(error);
    }
  }
  
  /**
   * Handle a streaming chat completion request
   * @param request OpenAI API request
   * @param apiKey API key for authentication
   * @returns ReadableStream of OpenAI API responses
   */
  public async handleStreamingChatCompletion(
    request: OpenAIRequest,
    apiKey: string
  ): Promise<ReadableStream<Uint8Array>> {
    try {
      // Validate subscription and check token limits
      const { subscriptionId, userId } = await this.stripeMeter.validateSubscriptionAndTokens(
        apiKey
      );
      
      // Ensure streaming is enabled
      request.stream = true;
      
      // Estimate token usage for the request
      const estimatedTokens = TokenCounter.estimateRequestTokens(request);
      
      // Create metering options
      const meteringOptions: MeteringOptions = {
        subscriptionId,
        userId,
        model: request.model,
      };
      
      // Meter the request
      await this.stripeMeter.meterRequest(request, meteringOptions);
      
      // Forward the request to OpenAI
      const response = await this.forwardToOpenAIStream(request);
      
      // We can't meter the response tokens accurately in streaming mode,
      // so we'll use an estimate based on the request
      await this.stripeMeter.recordUsage({
        subscription_id: subscriptionId,
        user_id: userId,
        model: request.model,
        tokens: estimatedTokens.completionTokens, // Use the completion tokens estimate
        timestamp: Date.now(),
        action: "completion",
      });
      
      return response;
    } catch (error) {
      this.handleError(error);
    }
  }
  
  /**
   * Forward a request to the OpenAI API
   * @param request OpenAI API request
   * @returns OpenAI API response
   * @private
   */
  private async forwardToOpenAI(request: OpenAIRequest): Promise<OpenAIResponse> {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.openaiApiKey}`,
        },
        body: JSON.stringify(request),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new APIError(
          errorData.error?.message || "OpenAI API error",
          ErrorTypes.OPENAI_ERROR,
          response.status as StatusCodes
        );
      }
      
      return await response.json();
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new APIError(
        `Error forwarding request to OpenAI: ${errorMessage}`,
        ErrorTypes.OPENAI_ERROR,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  /**
   * Forward a streaming request to the OpenAI API
   * @param request OpenAI API request
   * @returns ReadableStream of OpenAI API responses
   * @private
   */
  private async forwardToOpenAIStream(
    request: OpenAIRequest
  ): Promise<ReadableStream<Uint8Array>> {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.openaiApiKey}`,
        },
        body: JSON.stringify(request),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new APIError(
          errorData.error?.message || "OpenAI API error",
          ErrorTypes.OPENAI_ERROR,
          response.status as StatusCodes
        );
      }
      
      return response.body!;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new APIError(
        `Error forwarding streaming request to OpenAI: ${errorMessage}`,
        ErrorTypes.OPENAI_ERROR,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  /**
   * Get usage statistics for a subscription
   * @param apiKey API key for authentication
   * @returns Usage statistics
   */
  public async getUsageStats(apiKey: string): Promise<any> {
    try {
      return await this.stripeMeter.getUsageStats(apiKey);
    } catch (error) {
      this.handleError(error);
    }
  }
  
  /**
   * Handle errors
   * @param error Error to handle
   * @private
   */
  private handleError(error: unknown): never {
    if (error instanceof APIError) {
      throw error;
    }
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Determine error type
    let errorType = ErrorTypes.INTERNAL_ERROR;
    let statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
    
    if (errorMessage.includes("Invalid API key") || errorMessage.includes("authentication")) {
      errorType = ErrorTypes.AUTHENTICATION_ERROR;
      statusCode = StatusCodes.UNAUTHORIZED;
    } else if (errorMessage.includes("not active") || errorMessage.includes("exceeded")) {
      errorType = ErrorTypes.AUTHORIZATION_ERROR;
      statusCode = StatusCodes.FORBIDDEN;
    } else if (errorMessage.includes("limit")) {
      errorType = ErrorTypes.RATE_LIMIT_ERROR;
      statusCode = StatusCodes.TOO_MANY_REQUESTS;
    }
    
    throw new APIError(
      errorMessage,
      errorType,
      statusCode
    );
  }
}