/**
 * OpenAI Meter Edge Function
 * Proxies OpenAI API requests with Stripe metering
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { 
  createSuccessResponse, 
  createStreamingResponse, 
  createErrorResponse,
  APIError,
  ErrorTypes,
  StatusCodes,
  OpenAIRequest
} from "./api-contract.ts";
import { EnvironmentValidator } from "./config/env-validator.ts";
import { isPreflightRequest, handlePreflight, applyCorsHeaders } from "./_shared/cors.ts";
import { authenticate } from "./middleware/auth.ts";
import { RateLimiter } from "./utils/rate-limiter.ts";
import { OpenAIProxyService } from "./services/openai-proxy.ts";

// Initialize services
const rateLimiter = new RateLimiter();
const openaiProxy = new OpenAIProxyService();

/**
 * Handle incoming requests
 * @param req The request object
 * @returns Response object
 */
async function handler(req: Request): Promise<Response> {
  try {
    // Validate environment variables
    EnvironmentValidator.validateEnvironment();
    
    // Handle CORS preflight requests
    if (isPreflightRequest(req)) {
      return handlePreflight(req);
    }
    
    // Get request path
    const url = new URL(req.url);
    const path = url.pathname.split("/").filter(Boolean);
    
    // Handle different API endpoints
    if (path[0] === "v1") {
      // OpenAI API compatible endpoints
      if (path[1] === "chat" && path[2] === "completions") {
        return await handleChatCompletions(req);
      } else if (path[1] === "usage") {
        return await handleUsage(req);
      }
    } else if (path[0] === "health") {
      // Health check endpoint
      return createSuccessResponse({ status: "ok" });
    }
    
    // Handle unknown endpoints
    return applyCorsHeaders(
      req,
      createErrorResponse(
        "Not found",
        ErrorTypes.VALIDATION_ERROR,
        StatusCodes.NOT_FOUND
      )
    );
  } catch (error) {
    return handleError(req, error);
  }
}

/**
 * Handle chat completions endpoint
 * @param req The request object
 * @returns Response object
 */
async function handleChatCompletions(req: Request): Promise<Response> {
  try {
    // Only allow POST requests
    if (req.method !== "POST") {
      throw new APIError(
        "Method not allowed",
        ErrorTypes.VALIDATION_ERROR,
        StatusCodes.METHOD_NOT_ALLOWED
      );
    }
    
    // Parse request body
    const body = await req.json() as OpenAIRequest;
    
    // Authenticate request
    const apiKey = await authenticate(req);
    
    // Apply rate limiting
    const rateLimitInfo = rateLimiter.checkRateLimit(apiKey);
    
    // Handle streaming requests
    if (body.stream === true) {
      const stream = await openaiProxy.handleStreamingChatCompletion(
        body,
        apiKey
      );
      
      // Create streaming response
      let response = createStreamingResponse(stream);
      
      // Add rate limit headers
      response = rateLimiter.addRateLimitHeaders(response, rateLimitInfo);
      
      // Apply CORS headers
      return applyCorsHeaders(req, response);
    } else {
      // Handle non-streaming requests
      const result = await openaiProxy.handleChatCompletion(
        body,
        apiKey
      );
      
      // Create success response
      let response = createSuccessResponse(result);
      
      // Add rate limit headers
      response = rateLimiter.addRateLimitHeaders(response, rateLimitInfo);
      
      // Apply CORS headers
      return applyCorsHeaders(req, response);
    }
  } catch (error) {
    return handleError(req, error);
  }
}

/**
 * Handle usage endpoint
 * @param req The request object
 * @returns Response object
 */
async function handleUsage(req: Request): Promise<Response> {
  try {
    // Only allow GET requests
    if (req.method !== "GET") {
      throw new APIError(
        "Method not allowed",
        ErrorTypes.VALIDATION_ERROR,
        StatusCodes.METHOD_NOT_ALLOWED
      );
    }
    
    // Authenticate request
    const apiKey = await authenticate(req);
    
    // Apply rate limiting
    const rateLimitInfo = rateLimiter.checkRateLimit(apiKey);
    
    // Get usage statistics
    const usageStats = await openaiProxy.getUsageStats(apiKey);
    
    // Create success response
    let response = createSuccessResponse(usageStats);
    
    // Add rate limit headers
    response = rateLimiter.addRateLimitHeaders(response, rateLimitInfo);
    
    // Apply CORS headers
    return applyCorsHeaders(req, response);
  } catch (error) {
    return handleError(req, error);
  }
}

/**
 * Handle errors
 * @param req The request object
 * @param error The error object
 * @returns Response object
 */
function handleError(req: Request, error: unknown): Response {
  console.error("Error:", error);
  
  if (error instanceof APIError) {
    return applyCorsHeaders(
      req,
      createErrorResponse(
        error.message,
        error.type,
        error.status,
        error.param
      )
    );
  }
  
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  return applyCorsHeaders(
    req,
    createErrorResponse(
      errorMessage,
      ErrorTypes.INTERNAL_ERROR,
      StatusCodes.INTERNAL_SERVER_ERROR
    )
  );
}

// Start the server
serve(handler);

// Clean up expired rate limit entries periodically
setInterval(() => {
  rateLimiter.cleanupExpiredEntries();
}, 60000); // Every minute