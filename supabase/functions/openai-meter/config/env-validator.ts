/**
 * Environment Validator
 * Validates environment variables and provides configuration
 */

/**
 * Environment configuration
 */
export interface EnvironmentConfig {
  OPENAI_API_KEY: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  PRICE_ID_CHAT_REQUESTS: string;
  RATE_LIMIT_MAX_REQUESTS: number;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_WINDOW: number; // Alias for RATE_LIMIT_WINDOW_MS for backward compatibility
  CORS_ALLOWED_ORIGINS: string[];
  NODE_ENV: string;
}

/**
 * Environment validator
 * Validates environment variables and provides configuration
 */
export class EnvironmentValidator {
  private static config: EnvironmentConfig | null = null;
  
  /**
   * Validate environment variables
   * @throws Error if required environment variables are missing
   */
  public static validateEnvironment(): void {
    const requiredVars = [
      "OPENAI_API_KEY",
      "STRIPE_SECRET_KEY",
    ];
    
    const missingVars = requiredVars.filter(
      (varName) => !Deno.env.get(varName)
    );
    
    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(", ")}`
      );
    }
  }
  
  /**
   * Get environment configuration
   * @returns Environment configuration
   */
  public static getConfig(): EnvironmentConfig {
    // Return cached config if available
    if (this.config !== null) {
      return this.config;
    }
    
    // Validate environment variables
    this.validateEnvironment();
    
    // Parse CORS allowed origins
    const corsAllowedOrigins = Deno.env.get("CORS_ALLOWED_ORIGINS") || "*";
    let parsedCorsOrigins: string[];
    
    if (corsAllowedOrigins === "*") {
      parsedCorsOrigins = ["*"];
    } else {
      parsedCorsOrigins = corsAllowedOrigins.split(",").map((origin) => origin.trim());
    }
    
    // Create and cache config
    const rateLimitWindowMs = parseInt(Deno.env.get("RATE_LIMIT_WINDOW_MS") || "60000");
    
    this.config = {
      OPENAI_API_KEY: Deno.env.get("OPENAI_API_KEY") || "",
      STRIPE_SECRET_KEY: Deno.env.get("STRIPE_SECRET_KEY") || "",
      STRIPE_WEBHOOK_SECRET: Deno.env.get("STRIPE_WEBHOOK_SECRET") || "",
      PRICE_ID_CHAT_REQUESTS: Deno.env.get("PRICE_ID_CHAT_REQUESTS") || "price_chat_requests",
      RATE_LIMIT_MAX_REQUESTS: parseInt(Deno.env.get("RATE_LIMIT_MAX_REQUESTS") || "100"),
      RATE_LIMIT_WINDOW_MS: rateLimitWindowMs,
      RATE_LIMIT_WINDOW: rateLimitWindowMs, // Alias for backward compatibility
      CORS_ALLOWED_ORIGINS: parsedCorsOrigins,
      NODE_ENV: Deno.env.get("NODE_ENV") || "development",
    };
    
    return this.config;
  }
  
  /**
   * Reset cached configuration
   * Useful for testing
   */
  public static resetConfig(): void {
    this.config = null;
  }
  
  /**
   * Check if environment is production
   * @returns True if production, false otherwise
   */
  public static isProduction(): boolean {
    return this.getConfig().NODE_ENV === "production";
  }
  
  /**
   * Check if environment is development
   * @returns True if development, false otherwise
   */
  public static isDevelopment(): boolean {
    return this.getConfig().NODE_ENV === "development";
  }
  
  /**
   * Check if environment is test
   * @returns True if test, false otherwise
   */
  public static isTest(): boolean {
    return this.getConfig().NODE_ENV === "test";
  }
}