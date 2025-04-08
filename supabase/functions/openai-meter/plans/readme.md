# Building a ChatGPT Proxy with Stripe Metering in Deno and TypeScript

This comprehensive guide outlines the architecture and implementation of a service that acts as a proxy for OpenAI's ChatGPT API while integrating Stripe for usage-based billing. This system allows you to resell access to OpenAI's APIs with your own pricing model, authentication, and usage tracking.

## Architecture Overview

The system consists of several key components:

1. **Deno Server**: A TypeScript-based server running on Deno runtime
2. **OpenAI Proxy**: Forwards requests to OpenAI and returns responses 
3. **Stripe Metering**: Tracks API usage and handles billing
4. **Authentication System**: Validates API keys and manages access
5. **Rate Limiting**: Controls request frequency per user
6. **Usage Tracking**: Records token consumption for billing

![Architecture Diagram](https://mermaid.ink/img/eyJjb2RlIjoiZ3JhcGggVERcbiAgICBBW0NsaWVudF0gLS0-IEJbRGVubyBTZXJ2ZXJdXG4gICAgQiAtLT4gQ1tBdXRoIE1pZGRsZXdhcmVdXG4gICAgQyAtLT4gRFtSYXRlIExpbWl0ZXJdXG4gICAgRCAtLT4gRVtPcGVuQUkgUHJveHldXG4gICAgRSAtLT4gRltPcGVuQUkgQVBJXVxuICAgIEUgLS0-IEdbU3RyaXBlIE1ldGVyaW5nXVxuICAgIEcgLS0-IEhbU3RyaXBlIEFQSV1cbiAgICBCIC0tPiBJW1dlYmhvb2sgSGFuZGxlcl1cbiAgICBJIC0tPiBIIiwibWVybWFpZCI6eyJ0aGVtZSI6ImRlZmF1bHQifSwidXBkYXRlRWRpdG9yIjpme/Folder Structure

```
/
├── .env                      # Environment variables
├── deno.json                 # Deno configuration
├── import_map.json           # Import map for dependencies
├── deps.ts                   # Centralized dependencies
├── main.ts                   # Entry point
├── src/
│   ├── config/
│   │   ├── openai.ts         # OpenAI configuration
│   │   └── stripe.ts         # Stripe configuration
│   ├── middleware/
│   │   ├── auth.ts           # Authentication middleware
│   │   ├── rate-limiter.ts   # Rate limiting middleware
│   │   └── error-handler.ts  # Error handling middleware
│   ├── models/
│   │   ├── user.ts           # User model
│   │   └── usage.ts          # Usage tracking model
│   ├── routes/
│   │   ├── chat.ts           # Chat route handlers
│   │   ├── billing.ts        # Billing route handlers
│   │   └── webhook.ts        # Webhook handler for Stripe
│   ├── services/
│   │   ├── openai.ts         # OpenAI service
│   │   ├── stripe.ts         # Stripe service for metering
│   │   └── user.ts           # User service
│   └── utils/
│       └── helpers.ts        # Helper functions
└── tests/                    # Tests for the application
```

## Environment Setup

Create a `.env` file with the following variables:

```
# OpenAI API Configuration
OPENAI_API_KEY=sk-your-openai-api-key

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-stripe-webhook-secret

# Server Configuration
PORT=8000
HOST=localhost
ENV=development

# Metering Configuration
PRICE_ID_CHAT_REQUESTS=price_1234567890
```

## Implementation

### 1. Deno Configuration

Create a `deno.json` file:

```json
{
  "tasks": {
    "dev": "deno run --allow-net --allow-env --allow-read --watch main.ts"
  },
  "imports": {
    "stripe": "npm:stripe@^13.0.0",
    "openai": "npm:openai@^4.0.0",
    "std/": "https://deno.land/std@0.178.0/",
    "oak": "https://deno.land/x/oak@v11.1.0/mod.ts"
  }
}
```

### 2. Dependencies

Create `deps.ts` to centralize all dependencies:

```typescript
// Standard library
export * as log from "std/log/mod.ts";
export * as path from "std/path/mod.ts";
export * as fs from "std/fs/mod.ts";

// Third-party
export { Application, Router, Context } from "oak";
export type { RouterContext, Next } from "oak";
export { load } from "https://deno.land/std@0.178.0/dotenv/mod.ts";

// Import Stripe
export { default as Stripe } from "stripe";

// Import OpenAI
export { default as OpenAI } from "openai";
```

### 3. Main Entry Point

Create `main.ts`:

```typescript
import { Application, Router, log, load } from "./deps.ts";
import { authMiddleware } from "./src/middleware/auth.ts";
import { rateLimiterMiddleware } from "./src/middleware/rate-limiter.ts";
import { errorHandler } from "./src/middleware/error-handler.ts";
import chatRouter from "./src/routes/chat.ts";
import billingRouter from "./src/routes/billing.ts";
import webhookRouter from "./src/routes/webhook.ts";

// Load environment variables
await load({ export: true });

// Initialize logger
log.setup({
  handlers: {
    console: new log.handlers.ConsoleHandler("DEBUG"),
  },
  loggers: {
    default: {
      level: "DEBUG",
      handlers: ["console"],
    },
  },
});

const logger = log.getLogger();

// Create application
const app = new Application();
const router = new Router();

// Error handling
app.use(errorHandler);

// Global middleware
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx.response.headers.set("X-Response-Time", `${ms}ms`);
  logger.info(`${ctx.request.method} ${ctx.request.url.pathname} - ${ms}ms`);
});

// Set up routes
router.get("/", (ctx) => {
  ctx.response.body = { message: "OpenAI Proxy API with Stripe Metering" };
});

// Apply routers
app.use(chatRouter.routes());
app.use(chatRouter.allowedMethods());
app.use(billingRouter.routes());
app.use(billingRouter.allowedMethods());
app.use(webhookRouter.routes());
app.use(webhookRouter.allowedMethods());
app.use(router.routes());
app.use(router.allowedMethods());

// Start server
const port = parseInt(Deno.env.get("PORT") || "8000");
const host = Deno.env.get("HOST") || "localhost";

logger.info(`Server running on http://${host}:${port}`);
await app.listen({ port, hostname: host });
```

### 4. Stripe Configuration

Create `src/config/stripe.ts`:

```typescript
import { Stripe } from "../../deps.ts";

// Initialize Stripe client
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is required");
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-08-16",
});

export const PRICE_ID_CHAT_REQUESTS = Deno.env.get("PRICE_ID_CHAT_REQUESTS") || "";
```

### 5. OpenAI Configuration

Create `src/config/openai.ts`:

```typescript
import { OpenAI } from "../../deps.ts";

// Initialize OpenAI client
const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
if (!openaiApiKey) {
  throw new Error("OPENAI_API_KEY is required");
}

export const openai = new OpenAI({
  apiKey: openaiApiKey,
});

export const DEFAULT_MODEL = "gpt-3.5-turbo";
```

### 6. Authentication Middleware

Create `src/middleware/auth.ts`:

```typescript
import { Context, Next } from "../../deps.ts";
import { getUserFromToken } from "../services/user.ts";

export async function authMiddleware(ctx: Context, next: Next) {
  const authHeader = ctx.request.headers.get("Authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    ctx.response.status = 401;
    ctx.response.body = { error: "Unauthorized - Missing or invalid token" };
    return;
  }

  const token = authHeader.split(" ")[1];
  const user = await getUserFromToken(token);
  
  if (!user) {
    ctx.response.status = 401;
    ctx.response.body = { error: "Unauthorized - Invalid token" };
    return;
  }
  
  // Attach user to context state for later use
  ctx.state.user = user;
  await next();
}
```

### 7. Rate Limiter Middleware

Create `src/middleware/rate-limiter.ts`:

```typescript
import { Context, Next } from "../../deps.ts";

// Simple in-memory rate limiter
const ipRequests = new Map();

export async function rateLimiterMiddleware(ctx: Context, next: Next) {
  const ip = ctx.request.ip;
  const now = Date.now();
  
  // Get current state for this IP
  const current = ipRequests.get(ip) || { count: 0, resetAt: now + 60000 }; // Reset after 1 minute
  
  // Reset if needed
  if (current.resetAt  limit) {
    ctx.response.status = 429;
    ctx.response.body = { error: "Too many requests. Please try again later." };
    return;
  }
  
  // Add rate limit headers
  ctx.response.headers.set("X-RateLimit-Limit", limit.toString());
  ctx.response.headers.set("X-RateLimit-Remaining", (limit - current.count).toString());
  ctx.response.headers.set("X-RateLimit-Reset", current.resetAt.toString());
  
  await next();
}
```

### 8. Error Handler Middleware

Create `src/middleware/error-handler.ts`:

```typescript
import { Context, Next, log } from "../../deps.ts";

const logger = log.getLogger();

export async function errorHandler(ctx: Context, next: Next) {
  try {
    await next();
  } catch (error) {
    logger.error(`Error: ${error.message}`);
    
    ctx.response.status = error.status || 500;
    ctx.response.body = {
      error: error.message || "Internal Server Error",
      ...(Deno.env.get("ENV") === "development" && { stack: error.stack }),
    };
  }
}
```

### 9. User Service

Create `src/services/user.ts`:

```typescript
import { stripe } from "../config/stripe.ts";
import { log } from "../../deps.ts";

const logger = log.getLogger();

// In a real app, this would interact with a database
const users = new Map();

// For demo purposes - add a test user
users.set("user_123", {
  id: "user_123",
  email: "test@example.com",
  customerId: "cus_123456789",
  apiKey: "sk_test_user123456789",
});

// Just a simple example - in a real application, you would use a proper authentication system
export async function getUserFromToken(token: string) {
  // Find user by API key
  for (const user of users.values()) {
    if (user.apiKey === token) {
      return user;
    }
  }
  return null;
}

export async function getUserSubscription(customerId: string) {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    
    return subscriptions.data[0] || null;
  } catch (error) {
    logger.error(`Error fetching subscription: ${error.message}`);
    return null;
  }
}

export async function createCheckoutSession(customerId: string, priceId: string) {
  try {
    return await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${Deno.env.get("FRONTEND_URL") || "http://localhost:3000"}/success`,
      cancel_url: `${Deno.env.get("FRONTEND_URL") || "http://localhost:3000"}/cancel`,
    });
  } catch (error) {
    logger.error(`Error creating checkout session: ${error.message}`);
    throw error;
  }
}
```

### 10. OpenAI Service

Create `src/services/openai.ts`:

```typescript
import { openai, DEFAULT_MODEL } from "../config/openai.ts";
import { trackUsage } from "./stripe.ts";
import { log } from "../../deps.ts";

const logger = log.getLogger();

interface ChatCompletionOptions {
  messages: Array;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  userId: string;
}

export async function createChatCompletion({
  messages,
  model = DEFAULT_MODEL,
  temperature = 0.7,
  max_tokens = 1000,
  stream = false,
  userId,
}: ChatCompletionOptions) {
  try {
    logger.info(`Creating chat completion for user: ${userId}`);
    
    // Record request start time for usage measurement
    const startTime = Date.now();
    
    // Make request to OpenAI
    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens,
      stream,
    });
    
    // Calculate input and output tokens
    let inputTokens = 0;
    let outputTokens = 0;
    
    if (!stream && "usage" in completion) {
      inputTokens = completion.usage?.prompt_tokens || 0;
      outputTokens = completion.usage?.completion_tokens || 0;
    }
    
    // Track usage for billing
    await trackUsage({
      userId,
      inputTokens,
      outputTokens,
      model,
      requestDuration: Date.now() - startTime,
    });
    
    return completion;
  } catch (error) {
    logger.error(`OpenAI API error: ${error.message}`);
    throw error;
  }
}
```

### 11. Stripe Service for Metering

Create `src/services/stripe.ts`:

```typescript
import { stripe, PRICE_ID_CHAT_REQUESTS } from "../config/stripe.ts";
import { log } from "../../deps.ts";

const logger = log.getLogger();

// Keep track of usage for reporting to Stripe
interface UsageEvent {
  userId: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
  requestDuration: number;
}

// Track usage for billing
export async function trackUsage({
  userId,
  inputTokens,
  outputTokens,
  model,
  requestDuration,
}: UsageEvent) {
  try {
    logger.info(`Tracking usage for user: ${userId}, input tokens: ${inputTokens}, output tokens: ${outputTokens}`);
    
    // Get user's subscription item
    const user = await getUserSubscriptionItem(userId);
    
    if (!user || !user.subscriptionItemId) {
      logger.warning(`User ${userId} does not have an active subscription item`);
      return;
    }
    
    // Calculate total tokens (input + output)
    const totalTokens = inputTokens + outputTokens;
    
    // Report usage to Stripe
    await stripe.subscriptionItems.createUsageRecord(
      user.subscriptionItemId,
      {
        quantity: totalTokens,
        timestamp: Math.floor(Date.now() / 1000),
        action: "increment",
      }
    );
    
    logger.info(`Reported ${totalTokens} tokens for user ${userId}`);
  } catch (error) {
    logger.error(`Error tracking usage: ${error.message}`);
    // Don't throw - we don't want to break the main flow if usage tracking fails
  }
}

// Get subscription item ID for a user
async function getUserSubscriptionItem(userId: string) {
  // In a real application, you would look this up from your database
  // This is just a placeholder
  return {
    userId,
    subscriptionItemId: "si_123456789",
  };
}

// Create a usage subscription for a new customer
export async function createUsageSubscription(customerId: string) {
  try {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price: PRICE_ID_CHAT_REQUESTS,
        },
      ],
      payment_behavior: "default_incomplete",
      expand: ["latest_invoice.payment_intent"],
    });
    
    return subscription;
  } catch (error) {
    logger.error(`Error creating subscription: ${error.message}`);
    throw error;
  }
}
```

### 12. Chat Routes

Create `src/routes/chat.ts`:

```typescript
import { Router, RouterContext } from "../../deps.ts";
import { authMiddleware } from "../middleware/auth.ts";
import { rateLimiterMiddleware } from "../middleware/rate-limiter.ts";
import { createChatCompletion } from "../services/openai.ts";

const router = new Router();

// Apply middleware to all chat routes
router.use(authMiddleware);
router.use(rateLimiterMiddleware);

// Route prefix
const prefix = "/v1/chat";

// Chat completion endpoint (compatible with OpenAI API)
router.post(`${prefix}/completions`, async (ctx: RouterContext) => {
  // Get user from context (set by auth middleware)
  const user = ctx.state.user;
  
  // Get request body
  const body = await ctx.request.body().value;
  
  // Extract parameters from request
  const {
    messages,
    model = "gpt-3.5-turbo",
    temperature,
    max_tokens,
    stream = false,
  } = body;
  
  // Validate request
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    ctx.response.status = 400;
    ctx.response.body = { error: "messages are required and must be an array" };
    return;
  }
  
  try {
    // Handle streaming response
    if (stream) {
      const completion = await createChatCompletion({
        messages,
        model,
        temperature,
        max_tokens,
        stream: true,
        userId: user.id,
      });
      
      // Set up SSE response
      ctx.response.type = "text/event-stream";
      ctx.response.headers.set("Cache-Control", "no-cache");
      ctx.response.headers.set("Connection", "keep-alive");
      
      // Create readable stream
      const encoder = new TextEncoder();
      const stream = new TransformStream();
      const writer = stream.writable.getWriter();
      
      // Start sending the response
      ctx.response.body = stream.readable;
      
      // Process each chunk from OpenAI
      for await (const chunk of completion) {
        const data = `data: ${JSON.stringify(chunk)}\n\n`;
        await writer.write(encoder.encode(data));
      }
      
      // Send the end marker and close
      await writer.write(encoder.encode("data: [DONE]\n\n"));
      await writer.close();
    } else {
      // Handle regular response
      const completion = await createChatCompletion({
        messages,
        model,
        temperature,
        max_tokens,
        stream: false,
        userId: user.id,
      });
      
      ctx.response.body = completion;
    }
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = {
      error: {
        message: error.message,
        type: error.type || "internal_server_error",
        param: error.param,
        code: error.code,
      },
    };
  }
});

export default router;
```

### 13. Billing Routes

Create `src/routes/billing.ts`:

```typescript
import { Router, RouterContext } from "../../deps.ts";
import { authMiddleware } from "../middleware/auth.ts";
import { createCheckoutSession } from "../services/user.ts";
import { createUsageSubscription } from "../services/stripe.ts";
import { PRICE_ID_CHAT_REQUESTS } from "../config/stripe.ts";

const router = new Router();

// Apply middleware
router.use(authMiddleware);

// Route prefix
const prefix = "/billing";

// Create checkout session for subscription
router.post(`${prefix}/create-checkout-session`, async (ctx: RouterContext) => {
  const user = ctx.state.user;
  
  try {
    const session = await createCheckoutSession(user.customerId, PRICE_ID_CHAT_REQUESTS);
    
    ctx.response.body = { sessionId: session.id };
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = { error: error.message };
  }
});

// Create usage subscription directly
router.post(`${prefix}/create-usage-subscription`, async (ctx: RouterContext) => {
  const user = ctx.state.user;
  
  try {
    const subscription = await createUsageSubscription(user.customerId);
    
    ctx.response.body = { 
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
    };
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = { error: error.message };
  }
});

// Get usage for current billing period
router.get(`${prefix}/usage`, async (ctx: RouterContext) => {
  const user = ctx.state.user;
  
  // In a real app, you would fetch this from your database or from Stripe
  // This is just a placeholder
  ctx.response.body = {
    currentUsage: {
      tokens: 12345,
      cost: 0.25, // in dollars
      period: {
        start: "2025-04-01T00:00:00Z",
        end: "2025-05-01T00:00:00Z",
      },
    },
  };
});

export default router;
```

### 14. Webhook Routes

Create `src/routes/webhook.ts`:

```typescript
import { Router, RouterContext } from "../../deps.ts";
import { stripe } from "../config/stripe.ts";
import { log } from "../../deps.ts";

const logger = log.getLogger();
const router = new Router();

// Route prefix
const prefix = "/webhook";

// Handle Stripe webhook events
router.post(`${prefix}/stripe`, async (ctx: RouterContext) => {
  const signature = ctx.request.headers.get("stripe-signature");
  
  if (!signature) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Missing stripe-signature header" };
    return;
  }
  
  try {
    // Get the raw body
    const body = await ctx.request.body({ type: "text" }).value;
    
    // Verify webhook signature
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
    
    // Handle different event types
    switch (event.type) {
      case "invoice.paid":
        const invoice = event.data.object;
        logger.info(`Invoice paid: ${invoice.id}`);
        // Update user's subscription status
        break;
        
      case "customer.subscription.created":
        const subscription = event.data.object;
        logger.info(`Subscription created: ${subscription.id}`);
        // Provision resources for the new subscription
        break;
        
      case "customer.subscription.deleted":
        const cancelledSubscription = event.data.object;
        logger.info(`Subscription cancelled: ${cancelledSubscription.id}`);
        // Clean up resources when subscription is cancelled
        break;
        
      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }
    
    ctx.response.body = { received: true };
  } catch (error) {
    logger.error(`Webhook error: ${error.message}`);
    ctx.response.status = 400;
    ctx.response.body = { error: `Webhook error: ${error.message}` };
  }
});

export default router;
```

## Setting Up Stripe Metering

### 1. Create a Stripe Product

First, create a product in the Stripe dashboard for your API usage:

1. Go to Stripe Dashboard > Products
2. Create a new product (e.g., "API Usage")
3. Set up a metered price:
   - Pricing model: "Usage-based"
   - Unit price: Set your price per 1000 tokens
   - Billing period: Monthly
   - Aggregation method: "Sum of usage during period"
4. Save the product and note the Price ID to use in your `.env` file

### 2. Configure Webhooks

In the Stripe Dashboard:

1. Go to Developers > Webhooks
2. Add an endpoint (your server's webhook URL, e.g., `https://your-domain.com/webhook/stripe`)
3. Select events to listen for:
   - `invoice.paid`
   - `customer.subscription.created`
   - `customer.subscription.deleted`
4. Get the webhook signing secret and add it to your `.env` file

## Running the Application

1. Make sure you have Deno installed (version 1.28 or later)[1]
2. Set up the environment variables in `.env`
3. Create the Stripe product and webhooks as described above
4. Run the application:

```bash
deno task dev
```

## Usage Examples

### Creating a customer and subscription

```bash
# Create a Stripe customer first
curl -X POST https://api.stripe.com/v1/customers \
  -H "Authorization: Bearer YOUR_STRIPE_SECRET_KEY" \
  -d email="customer@example.com" \
  -d name="Test Customer"

# Add a payment method, etc.
```

### Making requests to your proxy

```bash
# Using curl
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk_test_user123456789" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {
        "role": "user",
        "content": "Hello, who are you?"
      }
    ]
  }'
```

### Using with OpenAI client libraries

Since the API is compatible with OpenAI's format, you can use official client libraries by changing the base URL:

```typescript
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: "sk_test_user123456789", // Your proxy API key
  baseURL: "http://localhost:8000/v1", // Your proxy URL
});

const completion = await openai.chat.completions.create({
  model: "gpt-3.5-turbo",
  messages: [{ role: "user", content: "Hello world" }],
});

console.log(completion.choices[0].message);
```

## Conclusion

This implementation provides a complete architecture for creating a ChatGPT proxy with Stripe metering integration using Deno and TypeScript. The system is designed to be scalable, maintainable, and compatible with existing OpenAI client libraries.

Key highlights of this implementation:

1. Fully TypeScript-based with Deno's built-in TS support
2. Compatible with OpenAI's API format
3. Usage-based billing through Stripe metering
4. Rate limiting and authentication
5. Webhook support for Stripe events
6. Error handling and logging

In a production environment, you would want to add database integration for user management and usage tracking, as well as additional security measures like HTTPS, more sophisticated rate limiting, and comprehensive monitoring.
 