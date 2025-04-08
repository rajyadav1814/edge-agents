/**
 * Stripe Meter Utility
 * Handles metering of token usage for Stripe billing
 */
import { OpenAIRequest } from "../api-contract.ts";
import { StripeService, UsageRecord } from "../services/stripe-service.ts";
import { TokenCounter, TokenCount } from "./token-counter.ts";

/**
 * Metering options
 */
export interface MeteringOptions {
  subscriptionId: string;
  userId: string;
  model: string;
}

/**
 * Stripe Meter
 * Handles metering of token usage for Stripe billing
 */
export class StripeMeter {
  private stripeService: StripeService;
  
  /**
   * Create a new Stripe meter
   */
  constructor() {
    this.stripeService = new StripeService();
  }
  
  /**
   * Check if a subscription has exceeded its usage limit
   * @param subscriptionId Stripe subscription ID
   * @returns True if within limits, false if exceeded
   */
  public async checkUsageLimit(subscriptionId: string): Promise<boolean> {
    return this.stripeService.checkUsageLimit(subscriptionId);
  }
  
  /**
   * Get remaining tokens for a subscription
   * @param subscriptionId Stripe subscription ID
   * @returns Number of tokens remaining, or -1 if unlimited
   */
  public async getRemainingTokens(subscriptionId: string): Promise<number> {
    return this.stripeService.getRemainingTokens(subscriptionId);
  }
  
  /**
   * Validate a subscription by API key
   * @param apiKey API key to validate
   * @returns True if valid, false otherwise
   */
  public async validateSubscription(apiKey: string): Promise<boolean> {
    const subscription = await this.stripeService.validateSubscription(apiKey);
    return subscription !== null && subscription.active;
  }
  
  /**
   * Validate subscription and check token limits
   * @param apiKey API key to validate
   * @returns Object containing subscription ID and user ID
   * @throws APIError if subscription is invalid or exceeded limits
   */
  public async validateSubscriptionAndTokens(apiKey: string): Promise<{ subscriptionId: string; userId: string }> {
    const subscription = await this.stripeService.validateSubscription(apiKey);
    
    if (!subscription) {
      throw new Error("Invalid API key or subscription");
    }
    
    if (!subscription.active) {
      throw new Error("Subscription is not active");
    }
    
    // Check if usage is within limits
    const withinLimits = await this.checkUsageLimit(subscription.id);
    if (!withinLimits) {
      throw new Error("Usage limit exceeded");
    }
    
    return {
      subscriptionId: subscription.id,
      userId: subscription.user_id,
    };
  }
  
  /**
   * Get usage statistics for a subscription
   * @param apiKey API key to validate
   * @returns Usage statistics
   */
  public async getUsageStats(apiKey: string): Promise<any> {
    const subscription = await this.stripeService.validateSubscription(apiKey);
    
    if (!subscription) {
      throw new Error("Invalid API key or subscription");
    }
    
    const remainingTokens = await this.getRemainingTokens(subscription.id);
    
    return {
      subscription_id: subscription.id,
      user_id: subscription.user_id,
      active: subscription.active,
      plan: subscription.plan,
      current_usage: subscription.current_usage,
      usage_limit: subscription.usage_limit,
      remaining_tokens: remainingTokens,
    };
  }
  
  /**
   * Meter request tokens
   * @param request OpenAI API request
   * @param options Metering options
   * @returns Estimated token count
   */
  public async meterRequest(
    request: OpenAIRequest,
    options: MeteringOptions
  ): Promise<number> {
    // Estimate token count
    const tokenResult = TokenCounter.estimateRequestTokens(request);
    const promptTokens = tokenResult.promptTokens;
    
    // Record usage
    await this.recordUsage({
      subscription_id: options.subscriptionId,
      user_id: options.userId,
      model: options.model,
      tokens: promptTokens,
      timestamp: Date.now(),
      action: "prompt",
    });
    
    return promptTokens;
  }
  
  /**
   * Meter response tokens
   * @param response OpenAI API response
   * @param options Metering options
   * @returns Token count
   */
  public async meterResponse(
    response: any,
    options: MeteringOptions
  ): Promise<TokenCount> {
    // Extract token count from response
    const completionTokens = TokenCounter.extractResponseTokens(response);
    
    // Record usage
    await this.recordUsage({
      subscription_id: options.subscriptionId,
      user_id: options.userId,
      model: options.model,
      tokens: completionTokens,
      timestamp: Date.now(),
      action: "completion",
    });
    
    // Create a TokenCount object
    const tokenCount: TokenCount = {
      promptTokens: 0, // We don't have this information here
      completionTokens,
      totalTokens: completionTokens,
      cost: 0, // Will be calculated later if needed
    };
    
    return tokenCount;
  }
  
  /**
   * Record usage
   * @param record Usage record
   */
  public async recordUsage(record: UsageRecord): Promise<void> {
    try {
      await this.stripeService.recordUsage(record);
    } catch (error) {
      // Log error but don't fail the request
      console.error("Failed to record usage:", error);
    }
  }
  
  /**
   * Calculate cost for a token count
   * @param model OpenAI model name
   * @param tokenCount Token count
   * @returns Cost in USD
   */
  public calculateCost(model: string, tokenCount: TokenCount): number {
    return TokenCounter.calculateCost(
      tokenCount.promptTokens,
      tokenCount.completionTokens,
      model
    );
  }
}