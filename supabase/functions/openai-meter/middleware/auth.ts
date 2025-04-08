/**
 * Authentication Middleware
 * Handles API key validation and authentication
 */
import { APIError, ErrorTypes, StatusCodes } from "../api-contract.ts";
import { StripeMeter } from "../utils/stripe-meter.ts";

/**
 * Extract API key from request
 * @param req The request object
 * @returns API key
 * @throws APIError if API key is missing or invalid
 */
export function extractApiKey(req: Request): string {
  // Check Authorization header
  const authHeader = req.headers.get("Authorization");
  if (authHeader) {
    // Bearer token format
    if (authHeader.startsWith("Bearer ")) {
      return authHeader.substring(7);
    }
    
    // Basic auth format (not recommended for production)
    if (authHeader.startsWith("Basic ")) {
      try {
        const base64Credentials = authHeader.substring(6);
        const credentials = atob(base64Credentials);
        const [username, password] = credentials.split(":");
        
        // Use the password as the API key
        if (password) {
          return password;
        }
      } catch (error) {
        // Ignore decoding errors and continue to other methods
      }
    }
    
    // Direct API key format
    return authHeader;
  }
  
  // Check query parameter
  const url = new URL(req.url);
  const apiKey = url.searchParams.get("api_key");
  if (apiKey) {
    return apiKey;
  }
  
  // Check request body for API key
  // Note: This requires reading the request body, which can only be done once
  // So this should be used as a last resort
  if (req.method === "POST" && req.headers.get("Content-Type")?.includes("application/json")) {
    // We can't read the body here because it would consume the stream
    // This is handled in the main request handler
  }
  
  throw new APIError(
    "API key is required",
    ErrorTypes.AUTHENTICATION_ERROR,
    StatusCodes.UNAUTHORIZED,
    "missing_api_key"
  );
}

/**
 * Authenticate a request
 * @param req The request object
 * @returns API key if authentication is successful
 * @throws APIError if authentication fails
 */
export async function authenticate(req: Request): Promise<string> {
  try {
    const apiKey = extractApiKey(req);
    
    // Validate the API key with Stripe
    const stripeMeter = new StripeMeter();
    const isValid = await stripeMeter.validateSubscription(apiKey);
    
    if (!isValid) {
      throw new APIError(
        "Invalid API key",
        ErrorTypes.AUTHENTICATION_ERROR,
        StatusCodes.UNAUTHORIZED,
        "invalid_api_key"
      );
    }
    
    return apiKey;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    
    throw new APIError(
      "Authentication failed",
      ErrorTypes.AUTHENTICATION_ERROR,
      StatusCodes.UNAUTHORIZED
    );
  }
}
