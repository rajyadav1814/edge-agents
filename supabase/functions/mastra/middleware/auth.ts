/**
 * Authentication middleware for Supabase Edge Functions
 * 
 * This module provides authentication handling for the Mastra AI agent.
 */

import { config } from "../config/index.ts";
import { ErrorResponse } from "../types/index.ts";

/**
 * Middleware function to handle authentication
 * 
 * @param req The incoming request object
 * @returns A Response object for unauthorized requests or null to continue processing
 */
export const authMiddleware = (req: Request): Response | null => {
  // Skip authentication if no token is configured (for development)
  if (!config.auth.isConfigured()) {
    console.warn("Authentication is not configured. Running in insecure mode.");
    return null;
  }

  // Get the Authorization header
  const authHeader = req.headers.get("Authorization");
  
  // Check if the Authorization header exists
  if (!authHeader) {
    return createErrorResponse("Unauthorized: Missing Authorization header", 401);
  }
  
  // Validate the token format
  if (!authHeader.startsWith("Bearer ")) {
    return createErrorResponse("Unauthorized: Invalid Authorization format", 401);
  }
  
  // Extract the token
  const token = authHeader.substring(7); // Remove "Bearer " prefix
  
  // Validate the token
  if (!isValidToken(token)) {
    return createErrorResponse("Unauthorized: Invalid token", 401);
  }
  
  // Authentication successful, continue processing
  return null;
};

/**
 * Validates if the provided token is valid
 * 
 * @param token The token to validate
 * @returns True if the token is valid, false otherwise
 */
const isValidToken = (token: string): boolean => {
  // Compare with the expected token from environment variables
  const expectedToken = config.auth.token;
  
  // Simple equality check (in a production environment, you might want to use a more secure method)
  return token === expectedToken;
};

/**
 * Creates an error response with the specified message and status code
 * 
 * @param message The error message
 * @param status The HTTP status code
 * @returns A Response object with the error details
 */
const createErrorResponse = (message: string, status: number): Response => {
  const errorResponse: ErrorResponse = {
    error: message
  };
  
  return new Response(
    JSON.stringify(errorResponse),
    {
      status,
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
};

export default authMiddleware;