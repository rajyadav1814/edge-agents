import { ErrorTypes, APIError, MeteringProvider } from "./types.ts";
import Stripe from "https://esm.sh/stripe@12.4.0?target=deno";

/**
 * Stripe Metering implementation
 */
export class StripeMetering implements MeteringProvider {
  private stripe: Stripe;
  private rateLimits: Map<string, { count: number; resetTime: number }>;

  constructor(private secretKey: string) {
    if (!secretKey) {
      throw new APIError(
        ErrorTypes.CONFIGURATION_ERROR,
        "Stripe key is required",
        500
      );
    }
    this.stripe = new Stripe(secretKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });
    this.rateLimits = new Map();
  }

  /**
   * Record usage for a customer
   */
  async recordUsage(params: {
    customerId: string;
    quantity: number;
    timestamp: Date;
  }): Promise<void> {
    try {
      if (params.quantity < 0) {
        throw new APIError(
          ErrorTypes.USAGE_ERROR,
          "Invalid usage quantity",
          400
        );
      }

      const subscriptionItem = await this.getSubscriptionItem(params.customerId);

      try {
        await this.stripe.subscriptionItems.createUsageRecord(
          subscriptionItem,
          {
            quantity: params.quantity,
            timestamp: Math.floor(params.timestamp.getTime() / 1000),
            action: "increment",
          }
        );
      } catch (error: unknown) {
        throw new APIError(
          ErrorTypes.METERING_ERROR,
          error instanceof Error ? error.message : "Failed to record usage",
          500,
          error instanceof Error ? { cause: error } : undefined
        );
      }
    } catch (error: unknown) {
      if (error instanceof APIError) throw error;
      throw new APIError(
        ErrorTypes.METERING_ERROR,
        error instanceof Error ? error.message : "Failed to record usage",
        500,
        error instanceof Error ? { cause: error } : undefined
      );
    }
  }

  /**
   * Validate API key by checking customer subscription
   */
  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      if (!this.checkRateLimit(apiKey)) {
        throw new APIError(
          ErrorTypes.RATE_LIMIT_ERROR,
          "Rate limit exceeded",
          429
        );
      }

      const isValid = await this.validateSubscription(apiKey);
      return isValid;
    } catch (error: unknown) {
      if (error instanceof APIError && error.type === ErrorTypes.RATE_LIMIT_ERROR) {
        throw error;
      }
      throw new APIError(
        ErrorTypes.AUTHENTICATION_ERROR,
        error instanceof Error ? error.message : "Failed to validate API key",
        401,
        error instanceof Error ? { cause: error } : undefined
      );
    }
  }

  /**
   * Validate customer subscription
   */
  async validateSubscription(customerId: string): Promise<boolean> {
    try {
      const customer = await this.stripe.customers.retrieve(customerId, {
        expand: ["subscriptions"],
      });

      if (!customer || customer.deleted) {
        throw new APIError(
          ErrorTypes.SUBSCRIPTION_ERROR,
          "Failed to get subscription",
          404
        );
      }

      const subscription = (customer as Stripe.Customer).subscriptions?.data[0];
      if (!subscription || subscription.status !== "active") {
        throw new APIError(
          ErrorTypes.INACTIVE_SUBSCRIPTION,
          "No active subscription found",
          403
        );
      }

      const subscriptionItem = subscription.items.data[0];
      if (!subscriptionItem) {
        throw new APIError(
          ErrorTypes.SUBSCRIPTION_ERROR,
          "No subscription item found",
          404
        );
      }

      return true;
    } catch (error: unknown) {
      if (error instanceof APIError) throw error;
      throw new APIError(
        ErrorTypes.SUBSCRIPTION_ERROR,
        error instanceof Error ? error.message : "Failed to get subscription item",
        500,
        error instanceof Error ? { cause: error } : undefined
      );
    }
  }

  /**
   * Get subscription item ID for a customer
   */
  private async getSubscriptionItem(customerId: string): Promise<string> {
    const customer = await this.stripe.customers.retrieve(customerId, {
      expand: ["subscriptions"],
    });

    if (!customer || customer.deleted) {
      throw new APIError(
        ErrorTypes.SUBSCRIPTION_ERROR,
        "Failed to get subscription",
        404
      );
    }

    const subscription = (customer as Stripe.Customer).subscriptions?.data[0];
    if (!subscription || subscription.status !== "active") {
      throw new APIError(
        ErrorTypes.INACTIVE_SUBSCRIPTION,
        "No active subscription found",
        403
      );
    }

    const subscriptionItem = subscription.items.data[0];
    if (!subscriptionItem) {
      throw new APIError(
        ErrorTypes.SUBSCRIPTION_ERROR,
        "No subscription item found",
        404
      );
    }

    return subscriptionItem.id;
  }

  /**
   * Check rate limit for a customer
   */
  private checkRateLimit(customerId: string): boolean {
    const now = Date.now();
    const limit = this.rateLimits.get(customerId);

    if (!limit || now >= limit.resetTime) {
      this.rateLimits.set(customerId, {
        count: 1,
        resetTime: now + 60000, // 1 minute
      });
      return true;
    }

    if (limit.count >= 60) { // 60 requests per minute
      return false;
    }

    limit.count++;
    return true;
  }
}