/**
 * Stripe Service
 * Handles Stripe API interactions for metering and subscription validation
 */
import Stripe from "stripe";
import { EnvironmentValidator } from "../config/env-validator.ts";
import { APIError, ErrorTypes, StatusCodes } from "../api-contract.ts";

/**
 * Usage record for metering
 */
export interface UsageRecord {
  subscription_id: string;
  user_id: string;
  model: string;
  tokens: number;
  timestamp: number;
  action: "prompt" | "completion" | "chat_completion";
}

/**
 * Subscription information
 */
export interface SubscriptionInfo {
  id: string;
  user_id: string;
  active: boolean;
  plan: string;
  current_usage: number;
  usage_limit: number;
}

/**
 * Stripe Service
 * Handles Stripe API interactions for metering and subscription validation
 */
export class StripeService {
  private stripe: Stripe;
  private priceId: string;
  
  /**
   * Create a new Stripe service
   */
  constructor() {
    const config = EnvironmentValidator.getConfig();
    this.stripe = new Stripe(config.STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
    });
    this.priceId = config.PRICE_ID_CHAT_REQUESTS;
  }
  
  /**
   * Record usage for a subscription
   * @param record Usage record
   */
  public async recordUsage(record: UsageRecord): Promise<void> {
    try {
      // Get the subscription
      const subscription = await this.stripe.subscriptions.retrieve(
        record.subscription_id
      );
      
      // Find the subscription item for the price
      const subscriptionItem = subscription.items.data.find(
        (item: any) => item.price.id === this.priceId
      );
      
      if (!subscriptionItem) {
        throw new APIError(
          "Subscription does not include the required price",
          ErrorTypes.STRIPE_ERROR,
          StatusCodes.BAD_REQUEST
        );
      }
      
      // Record usage
      await this.stripe.subscriptionItems.createUsageRecord(
        subscriptionItem.id,
        {
          quantity: record.tokens,
          timestamp: Math.floor(record.timestamp / 1000),
          action: "increment",
        }
      );
      
      // Log for debugging
      console.log(`Recorded ${record.tokens} tokens for subscription ${record.subscription_id}`);
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error recording usage:", errorMessage);
      
      throw new APIError(
        "Failed to record usage",
        ErrorTypes.STRIPE_ERROR,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  /**
   * Check if a subscription has exceeded its usage limit
   * @param subscriptionId Stripe subscription ID
   * @returns True if within limits, false if exceeded
   */
  public async checkUsageLimit(subscriptionId: string): Promise<boolean> {
    try {
      const subscription = await this.validateSubscriptionById(subscriptionId);
      
      if (!subscription) {
        throw new APIError(
          "Invalid subscription ID",
          ErrorTypes.AUTHENTICATION_ERROR,
          StatusCodes.UNAUTHORIZED
        );
      }
      
      if (!subscription.active) {
        throw new APIError(
          "Subscription is not active",
          ErrorTypes.AUTHORIZATION_ERROR,
          StatusCodes.FORBIDDEN
        );
      }
      
      // If there's no usage limit, always return true
      if (subscription.usage_limit <= 0) {
        return true;
      }
      
      // Check if usage is within limits
      return subscription.current_usage < subscription.usage_limit;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error checking usage limit:", errorMessage);
      
      throw new APIError(
        "Failed to check usage limit",
        ErrorTypes.STRIPE_ERROR,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  /**
   * Get remaining tokens for a subscription
   * @param subscriptionId Stripe subscription ID
   * @returns Number of tokens remaining, or -1 if unlimited
   */
  public async getRemainingTokens(subscriptionId: string): Promise<number> {
    try {
      const subscription = await this.validateSubscriptionById(subscriptionId);
      
      if (!subscription) {
        throw new APIError(
          "Invalid subscription ID",
          ErrorTypes.AUTHENTICATION_ERROR,
          StatusCodes.UNAUTHORIZED
        );
      }
      
      if (!subscription.active) {
        throw new APIError(
          "Subscription is not active",
          ErrorTypes.AUTHORIZATION_ERROR,
          StatusCodes.FORBIDDEN
        );
      }
      
      // If there's no usage limit, return -1 (unlimited)
      if (subscription.usage_limit <= 0) {
        return -1;
      }
      
      // Calculate remaining tokens
      return Math.max(0, subscription.usage_limit - subscription.current_usage);
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error getting remaining tokens:", errorMessage);
      
      throw new APIError(
        "Failed to get remaining tokens",
        ErrorTypes.STRIPE_ERROR,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  /**
   * Validate a subscription by API key
   * @param apiKey API key to validate
   * @returns Subscription info if valid, null otherwise
   */
  public async validateSubscription(apiKey: string): Promise<SubscriptionInfo | null> {
    try {
      // In a real implementation, you would look up the API key in your database
      // and retrieve the associated subscription ID and user ID
      // For this example, we'll assume the API key is the subscription ID
      
      // This is a simplified example - in a real implementation, you would:
      // 1. Look up the API key in your database
      // 2. Verify it's valid and active
      // 3. Get the associated subscription ID and user ID
      // 4. Retrieve the subscription from Stripe
      
      // For now, we'll just validate the subscription directly
      return await this.validateSubscriptionById(apiKey);
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error validating subscription:", errorMessage);
      
      throw new APIError(
        "Failed to validate subscription",
        ErrorTypes.STRIPE_ERROR,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  /**
   * Validate a subscription by ID
   * @param subscriptionId Stripe subscription ID
   * @returns Subscription info if valid, null otherwise
   * @private
   */
  private async validateSubscriptionById(subscriptionId: string): Promise<SubscriptionInfo | null> {
    try {
      // Retrieve the subscription from Stripe
      const subscription = await this.stripe.subscriptions.retrieve(
        subscriptionId,
        {
          expand: ["items.data.price"],
        }
      );
      
      // Check if the subscription is active
      const isActive = subscription.status === "active";
      
      // Find the subscription item for the price
      const subscriptionItem = subscription.items.data.find(
        (item: any) => item.price.id === this.priceId
      );
      
      if (!subscriptionItem) {
        return null;
      }
      
      // Get the current usage
      const usageRecord = await this.stripe.subscriptionItems.listUsageRecordSummaries(
        subscriptionItem.id
      );
      
      // Calculate the current usage
      const currentUsage = usageRecord.data.reduce(
        (total: number, record: any) => total + record.total_usage,
        0
      );
      
      // Get the usage limit from the subscription metadata
      const usageLimit = parseInt(
        subscription.metadata.usage_limit || "0",
        10
      );
      
      return {
        id: subscription.id,
        user_id: subscription.customer as string,
        active: isActive,
        plan: subscription.metadata.plan || "default",
        current_usage: currentUsage,
        usage_limit: usageLimit,
      };
    } catch (error) {
      // If the subscription doesn't exist, return null
      if (error instanceof Error &&
          'code' in error &&
          error.code === "resource_missing") {
        return null;
      }
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error validating subscription by ID:", errorMessage);
      
      throw new APIError(
        "Failed to validate subscription",
        ErrorTypes.STRIPE_ERROR,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
}