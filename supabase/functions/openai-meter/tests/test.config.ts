/**
 * Test configuration for OpenAI proxy with Stripe metering
 */
export const TestConfig = {
  env: {
    required: {
      OPENAI_API_KEY: "test_openai_key",
      STRIPE_SECRET_KEY: "test_stripe_key",
      STRIPE_WEBHOOK_SECRET: "test_webhook_secret",
    },
    optional: {
      RATE_LIMIT_MAX: "100",
      RATE_LIMIT_WINDOW: "60000",
      PROVIDER_TIMEOUT: "30000",
    },
  },

  performance: {
    maxLatencyMs: 2000,
    maxStreamDurationMs: 5000,
    maxRequestsPerMinute: 100,
    concurrentRequests: 10,
  },

  mockProviders: {
    openai: {
      defaultLatencyMs: 100,
      streamChunkIntervalMs: 50,
      models: ["gpt-3.5-turbo", "gpt-4"],
    },
    stripe: {
      defaultLatencyMs: 50,
      rateLimitWindow: 60000, // 1 minute
      maxRequestsPerWindow: 100,
    },
  },

  coverage: {
    threshold: 80,
    reportDir: "coverage",
    reportFormats: ["lcov", "html", "text"],
    excludePaths: [
      "test_utils.ts",
      "test.config.ts",
      "test_fixtures.ts",
    ],
  },

  // Mock response templates
  mocks: {
    provider: {
      completion: {
        choices: [
          {
            text: "This is a test completion response",
            index: 0,
            logprobs: null,
            finish_reason: "stop",
          },
        ],
      },
      chat: {
        choices: [
          {
            message: {
              role: "assistant",
              content: "This is a test chat response",
            },
            index: 0,
            finish_reason: "stop",
          },
        ],
      },
      stream: {
        chunks: [
          {
            choices: [{
              delta: {
                content: "This ",
              },
              finish_reason: null,
            }],
          },
          {
            choices: [{
              delta: {
                content: "is ",
              },
              finish_reason: null,
            }],
          },
          {
            choices: [{
              delta: {
                content: "a ",
              },
              finish_reason: null,
            }],
          },
          {
            choices: [{
              delta: {
                content: "test ",
              },
              finish_reason: null,
            }],
          },
          {
            choices: [{
              delta: {
                content: "response",
              },
              finish_reason: "stop",
            }],
          },
        ],
      },
    },
  },
};