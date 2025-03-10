/**
 * AuthManager class for handling authentication in the MCP server
 * This class provides methods for validating tokens and verifying requests
 */
export class AuthManager {
  private secretKey: string;
  
  /**
   * Create a new AuthManager instance
   * @param secretKey The secret key to use for authentication. If not provided, it will use the MCP_SECRET_KEY environment variable.
   */
  constructor(secretKey: string) {
    if (!secretKey) {
      throw new Error("Secret key is required");
    }
    this.secretKey = secretKey;
  }
  
  /**
   * Validate a token against the secret key
   * @param token The token to validate
   * @returns True if the token is valid, false otherwise
   */
  validateToken(token: string): boolean {
    if (!token) {
      return false;
    }
    return token === this.secretKey;
  }
  
  /**
   * Verify a request by checking the Authorization header
   * @param request The request to verify
   * @returns True if the request is authenticated, false otherwise
   */
  verifyRequest(request: Request): boolean {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return false;
    }
    
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!match) {
      return false;
    }
    
    const token = match[1];
    return this.validateToken(token);
  }
}