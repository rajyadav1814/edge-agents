/**
 * Middleware module index for the Mastra AI agent
 *
 * This module exports all middleware components for easy access.
 */

import { corsMiddleware, corsHeaders, addCorsHeaders } from "./cors.ts";
import { authMiddleware } from "./auth.ts";

export { corsMiddleware, corsHeaders, addCorsHeaders, authMiddleware };

/**
 * Apply all middleware to a request in sequence
 *
 * @param req The incoming request object
 * @returns A Response object if middleware processing should stop, or null to continue
 */
export const applyMiddleware = async (req: Request): Promise<Response | null> => {
  // Apply CORS middleware
  const corsResult = corsMiddleware(req);
  if (corsResult) return corsResult;
  
  // Apply authentication middleware
  const authResult = authMiddleware(req);
  if (authResult) return authResult;
  
  // All middleware passed, continue processing
  return null;
};

export default applyMiddleware;