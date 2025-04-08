/**
 * Test fixtures for OpenAI proxy tests
 */

import type { CompletionRequest } from "./types.ts";

export const Fixtures = {
  /**
   * Request fixtures
   */
  requests: {
    chat: {
      valid: {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: "Hello, how are you?",
          },
        ],
        temperature: 0.7,
        max_tokens: 100,
      } as CompletionRequest,
      streaming: {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: "Hello, how are you?",
          },
        ],
        temperature: 0.7,
        max_tokens: 100,
        stream: true,
      } as CompletionRequest,
      invalid: {
        model: "invalid-model",
        messages: "not an array",
      },
      empty: {
        model: "gpt-3.5-turbo",
        messages: [],
      },
    },
    azure: {
      valid: {
        model: "gpt-35-turbo",
        messages: [
          {
            role: "user",
            content: "Hello Azure!",
          },
        ],
        temperature: 0.7,
        max_tokens: 100,
      } as CompletionRequest,
    },
    anthropic: {
      valid: {
        model: "claude-2",
        messages: [
          {
            role: "user",
            content: "Hello Claude!",
          },
        ],
        temperature: 0.7,
        max_tokens: 100,
      } as CompletionRequest,
    },
    completion: {
      valid: {
        model: "text-davinci-003",
        prompt: "Hello, how are you?",
        temperature: 0.7,
        max_tokens: 100,
      } as CompletionRequest,
      invalid: {
        model: "invalid-model",
        prompt: 123, // Should be string
      },
      empty: {
        model: "text-davinci-003",
        prompt: "",
      },
    },
  },

  /**
   * Response fixtures
   */
  responses: {
    success: {
      chat: {
        id: "chatcmpl-123",
        object: "chat.completion",
        created: 1677652288,
        choices: [{
          index: 0,
          message: {
            role: "assistant",
            content: "Hello! I'm doing well, thank you for asking. How are you?",
          },
          finish_reason: "stop"
        }],
        usage: {
          prompt_tokens: 9,
          completion_tokens: 12,
          total_tokens: 21
        }
      },
      completion: {
        id: "cmpl-123",
        object: "text_completion",
        created: 1677652288,
        choices: [{
          text: "Hello! I'm doing well, thank you for asking. How are you?",
          index: 0,
          logprobs: null,
          finish_reason: "stop"
        }],
        usage: {
          prompt_tokens: 9,
          completion_tokens: 12,
          total_tokens: 21
        }
      },
    },
    streaming: {
      chunks: [
        {
          id: "chatcmpl-123",
          object: "chat.completion.chunk",
          created: 1677652288,
          choices: [{
            index: 0,
            delta: { role: "assistant", content: "Hello!" },
            finish_reason: null
          }],
        },
        {
          id: "chatcmpl-123",
          object: "chat.completion.chunk",
          created: 1677652288,
          choices: [{
            index: 0,
            delta: { content: " I'm" },
            finish_reason: null
          }],
        },
        {
          id: "chatcmpl-123",
          object: "chat.completion.chunk",
          created: 1677652288,
          choices: [{
            index: 0,
            delta: { content: " doing" },
            finish_reason: null
          }],
        },
        {
          id: "chatcmpl-123",
          object: "chat.completion.chunk",
          created: 1677652288,
          choices: [{
            index: 0,
            delta: { content: " well!" },
            finish_reason: "stop"
          }],
        },
      ],
    },
    error: {
      invalidRequest: {
        error: {
          message: "Invalid request",
          type: "invalid_request_error",
          code: "invalid_request",
        }
      },
      authError: {
        error: {
          message: "Invalid authentication",
          type: "authentication_error",
          code: "invalid_api_key",
        }
      },
      rateLimit: {
        error: {
          message: "Rate limit exceeded",
          type: "rate_limit_error",
          code: "rate_limit_exceeded",
        }
      },
      rateLimitExceeded: {
        error: {
          message: "Too many requests",
          type: "rate_limit_error",
          code: "too_many_requests",
        }
      },
    },
  },

  /**
   * Header fixtures
   */
  headers: {
    valid: {
      "Authorization": "Bearer test_key",
      "Content-Type": "application/json",
    },
    streaming: {
      "Authorization": "Bearer test_key",
      "Content-Type": "application/json",
      "Accept": "text/event-stream",
    },
    invalid: {
      "Authorization": "Invalid",
      "Content-Type": "application/json",
    },
    missing: {
      "Content-Type": "application/json",
    },
  },

  /**
   * Stripe fixtures
   */
  stripe: {
    events: {
      subscriptionCreated: {
        customer: "cus_123",
        subscription: "sub_123",
        status: "active",
        plan: {
          id: "plan_123",
          product: "prod_123",
          amount: 1000,
          currency: "usd",
        },
      },
      subscriptionUpdated: {
        customer: "cus_123",
        subscription: "sub_123",
        status: "active",
        plan: {
          id: "plan_456",
          product: "prod_456",
          amount: 2000,
          currency: "usd",
        },
      },
      subscriptionDeleted: {
        customer: "cus_123",
        subscription: "sub_123",
        status: "canceled",
      },
    },
    metadata: {
      validSignature: "test_signature",
      invalidSignature: "invalid_signature",
    },
  },

  /**
   * Environment fixtures
   */
  env: {
    valid: {
      OPENAI_API_KEY: "test_openai_key",
      AZURE_API_KEY: "test_azure_key",
      ANTHROPIC_API_KEY: "test_anthropic_key",
      STRIPE_SECRET_KEY: "test_stripe_key",
      STRIPE_WEBHOOK_SECRET: "test_webhook_secret",
    },
    invalid: {
      OPENAI_API_KEY: "invalid_key",
      AZURE_API_KEY: "invalid_key",
      ANTHROPIC_API_KEY: "invalid_key",
      STRIPE_SECRET_KEY: "invalid_key",
      STRIPE_WEBHOOK_SECRET: "invalid_secret",
    },
  },

  /**
   * Benchmark fixtures
   */
  benchmark: {
    configs: {
      quick: {
        name: "Quick Test",
        iterations: 10,
        concurrency: 1,
        warmup: false,
        timeout: 5000,
      },
      load: {
        name: "Load Test",
        iterations: 100,
        concurrency: 10,
        warmup: true,
        timeout: 30000,
      },
    },
    thresholds: {
      maxLatencyP95: 1000,
      minRps: 10,
      maxErrorRate: 0.01,
      maxMemoryGrowth: 100 * 1024 * 1024,
    },
  },
} as const;