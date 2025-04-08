/**
 * Configuration tests for the Mastra AI agent
 */

import { assertEquals } from "https://deno.land/std@0.220.1/assert/mod.ts";
import { stub } from "https://deno.land/std@0.220.1/testing/mock.ts";
import { config } from "../config/index.ts";

// Helper to mock environment variables
const mockEnv = (key: string, value: string | undefined) => {
  const originalValue = Deno.env.get(key);
  stub(Deno.env, "get", (k: string) => k === key ? value : Deno.env.get(k));
  return () => {
    // @ts-ignore: Restore original behavior
    Deno.env.get.restore();
    // Re-set the original value if needed
    if (originalValue !== undefined) {
      Deno.env.set(key, originalValue);
    }
  };
};

Deno.test("config - should have all required sections", () => {
  assertEquals(typeof config.agent, "object");
  assertEquals(typeof config.auth, "object");
  assertEquals(typeof config.api, "object");
  assertEquals(typeof config.supabase, "object");
  assertEquals(typeof config.logging, "object");
});

Deno.test("agentConfig - should use environment variables when available", async () => {
  // Set the environment variable directly
  Deno.env.set("AGENT_NAME", "TestAgent");
  
  try {
    // Re-import to get the updated config with a dynamic import
    const { config } = await import("../config/index.ts?v=" + Date.now());
    assertEquals(config.agent.name, "TestAgent");
  } finally {
    // Clean up
    Deno.env.delete("AGENT_NAME");
  }
});

Deno.test("agentConfig - should use default values when environment variables are not set", async () => {
  // Make sure the environment variable is not set
  Deno.env.delete("AGENT_NAME");
  
  try {
    // Re-import to get the updated config with a dynamic import
    const { config } = await import("../config/index.ts?v=" + Date.now());
    assertEquals(config.agent.name, "MastraAgent");
  } finally {
    // No cleanup needed as we're just ensuring the variable is not set
  }
});

Deno.test("authConfig - isConfigured should return true when token is set", () => {
  // Temporarily set the token
  Object.defineProperty(config.auth, "token", {
    value: "test-token",
    configurable: true
  });
  
  assertEquals(config.auth.isConfigured(), true);
  
  // Reset to original state
  Object.defineProperty(config.auth, "token", {
    value: undefined,
    configurable: true
  });
});

Deno.test("authConfig - isConfigured should return false when token is not set", () => {
  // Ensure the token is undefined
  Object.defineProperty(config.auth, "token", {
    value: undefined,
    configurable: true
  });
  
  assertEquals(config.auth.isConfigured(), false);
});

Deno.test("apiKeys - isConfigured should return true when specific key is set", () => {
  // Temporarily set the weatherApiKey
  Object.defineProperty(config.api, "weatherApiKey", {
    value: "test-api-key",
    configurable: true
  });
  
  assertEquals(config.api.isConfigured("weatherApiKey"), true);
  
  // Reset to original state
  Object.defineProperty(config.api, "weatherApiKey", {
    value: undefined,
    configurable: true
  });
});

Deno.test("apiKeys - isConfigured should return false when specific key is not set", () => {
  // Ensure the weatherApiKey is undefined
  Object.defineProperty(config.api, "weatherApiKey", {
    value: undefined,
    configurable: true
  });
  
  assertEquals(config.api.isConfigured("weatherApiKey"), false);
});

Deno.test("supabaseConfig - isConfigured should return true when all required values are set", () => {
  // Temporarily set the required values
  Object.defineProperty(config.supabase, "url", {
    value: "https://example.com",
    configurable: true
  });
  
  Object.defineProperty(config.supabase, "anonKey", {
    value: "test-anon-key",
    configurable: true
  });
  
  assertEquals(config.supabase.isConfigured(), true);
  
  // Reset to original state
  Object.defineProperty(config.supabase, "url", {
    value: undefined,
    configurable: true
  });
  
  Object.defineProperty(config.supabase, "anonKey", {
    value: undefined,
    configurable: true
  });
});

Deno.test("supabaseConfig - isConfigured should return false when any required value is not set", () => {
  // Set only one of the required values
  Object.defineProperty(config.supabase, "url", {
    value: "https://example.com",
    configurable: true
  });
  
  Object.defineProperty(config.supabase, "anonKey", {
    value: undefined,
    configurable: true
  });
  
  assertEquals(config.supabase.isConfigured(), false);
  
  // Reset to original state
  Object.defineProperty(config.supabase, "url", {
    value: undefined,
    configurable: true
  });
});

Deno.test("loggingConfig - should use environment variables when available", async () => {
  // Set the environment variable directly
  Deno.env.set("LOG_LEVEL", "debug");
  
  try {
    // Re-import to get the updated config with a dynamic import
    const { config } = await import("../config/index.ts?v=" + Date.now());
    assertEquals(config.logging.level, "debug");
  } finally {
    // Clean up
    Deno.env.delete("LOG_LEVEL");
  }
});

Deno.test("loggingConfig - should use default values when environment variables are not set", async () => {
  // Make sure the environment variable is not set
  Deno.env.delete("LOG_LEVEL");
  
  try {
    // Re-import to get the updated config with a dynamic import
    const { config } = await import("../config/index.ts?v=" + Date.now());
    assertEquals(config.logging.level, "info");
  } finally {
    // No cleanup needed as we're just ensuring the variable is not set
  }
});