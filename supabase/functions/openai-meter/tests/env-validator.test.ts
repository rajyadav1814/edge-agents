import { assertEquals, assertThrows } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { EnvironmentValidator } from "../config/env-validator.ts";
import { APIError } from "../api-contract.ts";

Deno.test("EnvironmentValidator - required variables", () => {
  // Setup
  EnvironmentValidator.resetConfig();
  Deno.env.set("OPENAI_API_KEY", "test-key");
  Deno.env.set("STRIPE_SECRET_KEY", "sk_test");
  Deno.env.set("SUPABASE_URL", "https://test.supabase.co");
  Deno.env.set("SUPABASE_ANON_KEY", "test-key");

  // Test
  const config = EnvironmentValidator.getConfig();

  // Assert
  assertEquals(config.OPENAI_API_KEY, "test-key");
  assertEquals(config.STRIPE_SECRET_KEY, "sk_test");
  assertEquals(config.SUPABASE_URL, "https://test.supabase.co");
  assertEquals(config.SUPABASE_ANON_KEY, "test-key");
});

Deno.test("EnvironmentValidator - missing required variable", () => {
  // Setup
  EnvironmentValidator.resetConfig();
  Deno.env.delete("OPENAI_API_KEY");

  // Test & Assert
  assertThrows(
    () => EnvironmentValidator.getConfig(),
    APIError,
    "Missing required environment variable: OPENAI_API_KEY"
  );
});

Deno.test("EnvironmentValidator - default rate limit values", () => {
  // Setup
  EnvironmentValidator.resetConfig();
  Deno.env.set("OPENAI_API_KEY", "test-key");
  Deno.env.set("STRIPE_SECRET_KEY", "sk_test");
  Deno.env.set("SUPABASE_URL", "https://test.supabase.co");
  Deno.env.set("SUPABASE_ANON_KEY", "test-key");

  // Test
  const config = EnvironmentValidator.getConfig();

  // Assert
  assertEquals(config.RATE_LIMIT_WINDOW, 60000); // 1 minute
  assertEquals(config.RATE_LIMIT_MAX_REQUESTS, 60);
});

Deno.test("EnvironmentValidator - custom rate limit values", () => {
  // Setup
  EnvironmentValidator.resetConfig();
  Deno.env.set("OPENAI_API_KEY", "test-key");
  Deno.env.set("STRIPE_SECRET_KEY", "sk_test");
  Deno.env.set("SUPABASE_URL", "https://test.supabase.co");
  Deno.env.set("SUPABASE_ANON_KEY", "test-key");
  Deno.env.set("RATE_LIMIT_WINDOW", "120000");
  Deno.env.set("RATE_LIMIT_MAX_REQUESTS", "100");

  // Test
  const config = EnvironmentValidator.getConfig();

  // Assert
  assertEquals(config.RATE_LIMIT_WINDOW, 120000);
  assertEquals(config.RATE_LIMIT_MAX_REQUESTS, 100);
});

Deno.test("EnvironmentValidator - invalid rate limit window", () => {
  // Setup
  EnvironmentValidator.resetConfig();
  Deno.env.set("OPENAI_API_KEY", "test-key");
  Deno.env.set("STRIPE_SECRET_KEY", "sk_test");
  Deno.env.set("SUPABASE_URL", "https://test.supabase.co");
  Deno.env.set("SUPABASE_ANON_KEY", "test-key");
  Deno.env.set("RATE_LIMIT_WINDOW", "500"); // Less than minimum 1000ms

  // Test & Assert
  assertThrows(
    () => EnvironmentValidator.getConfig(),
    APIError,
    "Invalid RATE_LIMIT_WINDOW value. Must be at least 1000ms."
  );
});

Deno.test("EnvironmentValidator - invalid rate limit max requests", () => {
  // Setup
  EnvironmentValidator.resetConfig();
  Deno.env.set("OPENAI_API_KEY", "test-key");
  Deno.env.set("STRIPE_SECRET_KEY", "sk_test");
  Deno.env.set("SUPABASE_URL", "https://test.supabase.co");
  Deno.env.set("SUPABASE_ANON_KEY", "test-key");
  Deno.env.set("RATE_LIMIT_MAX_REQUESTS", "0"); // Less than minimum 1

  // Test & Assert
  assertThrows(
    () => EnvironmentValidator.getConfig(),
    APIError,
    "Invalid RATE_LIMIT_MAX_REQUESTS value. Must be at least 1."
  );
});

Deno.test("EnvironmentValidator - default CORS allowed origins", () => {
  // Setup
  EnvironmentValidator.resetConfig();
  Deno.env.set("OPENAI_API_KEY", "test-key");
  Deno.env.set("STRIPE_SECRET_KEY", "sk_test");
  Deno.env.set("SUPABASE_URL", "https://test.supabase.co");
  Deno.env.set("SUPABASE_ANON_KEY", "test-key");

  // Test
  const config = EnvironmentValidator.getConfig();

  // Assert
  assertEquals(config.CORS_ALLOWED_ORIGINS, ["*"]);
});

Deno.test("EnvironmentValidator - custom CORS allowed origins", () => {
  // Setup
  EnvironmentValidator.resetConfig();
  Deno.env.set("OPENAI_API_KEY", "test-key");
  Deno.env.set("STRIPE_SECRET_KEY", "sk_test");
  Deno.env.set("SUPABASE_URL", "https://test.supabase.co");
  Deno.env.set("SUPABASE_ANON_KEY", "test-key");
  Deno.env.set("CORS_ALLOWED_ORIGINS", "https://example.com, https://test.com");

  // Test
  const config = EnvironmentValidator.getConfig();

  // Assert
  assertEquals(config.CORS_ALLOWED_ORIGINS, ["https://example.com", "https://test.com"]);
});