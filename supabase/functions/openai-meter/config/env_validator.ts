/**
 * Environment configuration validator
 * Ensures all required environment variables are present and properly formatted
 */
export class EnvValidator {
  private static readonly REQUIRED_VARS = [
    "OPENAI_API_KEY",
    "STRIPE_SECRET_KEY",
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
  ] as const;

  private static readonly OPTIONAL_VARS = [
    "RATE_LIMIT_WINDOW_MS",
    "RATE_LIMIT_MAX_REQUESTS",
    "DEFAULT_MODEL",
    "CORS_ORIGIN",
  ] as const;

  private config: Record<string, string>;

  constructor() {
    this.config = {};
  }

  /**
   * Load and validate all environment variables
   * @throws Error if required variables are missing
   */
  async validate(): Promise<void> {
    // Check required variables
    const missing = EnvValidator.REQUIRED_VARS.filter(
      (key) => !Deno.env.get(key)
    );

    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(", ")}`
      );
    }

    // Load all variables into config
    [...EnvValidator.REQUIRED_VARS, ...EnvValidator.OPTIONAL_VARS].forEach(
      (key) => {
        const value = Deno.env.get(key);
        if (value) {
          this.config[key] = value;
        }
      }
    );

    // Validate formats
    await this.validateFormats();
  }

  /**
   * Validate specific format requirements
   * @throws Error if formats are invalid
   */
  private async validateFormats(): Promise<void> {
    // Validate URL format
    const urlPattern = /^https?:\/\/.+/;
    if (!urlPattern.test(this.config.SUPABASE_URL)) {
      throw new Error("SUPABASE_URL must be a valid URL");
    }

    // Validate numeric values
    const windowMs = this.getRateLimitWindow();
    const maxRequests = this.getRateLimitMaxRequests();

    if (windowMs <= 0) {
      throw new Error("RATE_LIMIT_WINDOW_MS must be positive");
    }

    if (maxRequests <= 0) {
      throw new Error("RATE_LIMIT_MAX_REQUESTS must be positive");
    }

    // Validate API keys format
    const keyPattern = /^[a-zA-Z0-9_-]+$/;
    if (!keyPattern.test(this.config.OPENAI_API_KEY)) {
      throw new Error("OPENAI_API_KEY has invalid format");
    }
    if (!keyPattern.test(this.config.STRIPE_SECRET_KEY)) {
      throw new Error("STRIPE_SECRET_KEY has invalid format");
    }
  }

  /**
   * Get rate limit window in milliseconds
   */
  getRateLimitWindow(): number {
    return parseInt(this.config.RATE_LIMIT_WINDOW_MS || "60000", 10);
  }

  /**
   * Get maximum requests per window
   */
  getRateLimitMaxRequests(): number {
    return parseInt(this.config.RATE_LIMIT_MAX_REQUESTS || "60", 10);
  }

  /**
   * Get default OpenAI model
   */
  getDefaultModel(): string {
    return this.config.DEFAULT_MODEL || "gpt-3.5-turbo";
  }

  /**
   * Get CORS origin
   */
  getCorsOrigin(): string {
    return this.config.CORS_ORIGIN || "*";
  }

  /**
   * Get OpenAI API key
   */
  getOpenAIKey(): string {
    return this.config.OPENAI_API_KEY;
  }

  /**
   * Get Stripe secret key
   */
  getStripeKey(): string {
    return this.config.STRIPE_SECRET_KEY;
  }

  /**
   * Get Supabase URL
   */
  getSupabaseUrl(): string {
    return this.config.SUPABASE_URL;
  }

  /**
   * Get Supabase anonymous key
   */
  getSupabaseAnonKey(): string {
    return this.config.SUPABASE_ANON_KEY;
  }

  /**
   * Get all configuration as object
   */
  getConfig(): Record<string, string> {
    return { ...this.config };
  }
}