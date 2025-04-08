/**
 * Unit tests for the environment validation module
 */

import { assertEquals, assertThrows } from "https://deno.land/std@0.177.0/testing/asserts.ts";
import { validateEnv, logEnvStatus, EnvConfig } from "../../utils/env-validator.ts";
import { mockDenoEnv, spyOnConsole } from "../mocks/test-utils.ts";

Deno.test("validateEnv - returns correct config with valid environment", () => {
  // Arrange
  const env = {
    GITHUB_TOKEN: "test-token",
    GITHUB_ORG: "test-org",
    GITHUB_API_VERSION: "v4",
    GITHUB_WEBHOOK_SECRET: "test-secret",
    CACHE_TTL: "600"
  };
  const restoreEnv = mockDenoEnv(env);
  
  try {
    // Act
    const config = validateEnv();
    
    // Assert
    assertEquals(config.githubToken, "test-token");
    assertEquals(config.githubOrg, "test-org");
    assertEquals(config.githubApiVersion, "v4");
    assertEquals(config.webhookSecret, "test-secret");
    assertEquals(config.cacheTtl, 600);
  } finally {
    restoreEnv();
  }
});

Deno.test("validateEnv - uses default values when optional variables are missing", () => {
  // Arrange
  const env = {
    GITHUB_TOKEN: "test-token",
    GITHUB_ORG: "test-org"
    // Missing GITHUB_API_VERSION, GITHUB_WEBHOOK_SECRET, and CACHE_TTL
  };
  const restoreEnv = mockDenoEnv(env);
  
  try {
    // Act
    const config = validateEnv();
    
    // Assert
    assertEquals(config.githubToken, "test-token");
    assertEquals(config.githubOrg, "test-org");
    assertEquals(config.githubApiVersion, "v3"); // Default value
    assertEquals(config.webhookSecret, undefined); // Optional
    assertEquals(config.cacheTtl, 300); // Default value
  } finally {
    restoreEnv();
  }
});

Deno.test("validateEnv - throws error when GITHUB_TOKEN is missing", () => {
  // Arrange
  const env = {
    GITHUB_ORG: "test-org"
    // Missing GITHUB_TOKEN
  };
  const restoreEnv = mockDenoEnv(env);
  
  try {
    // Act & Assert
    assertThrows(
      () => validateEnv(),
      Error,
      "Either GITHUB_TOKEN or GITHUB_PERSONAL_ACCESS_TOKEN environment variable is required"
    );
  } finally {
    restoreEnv();
  }
});

Deno.test("validateEnv - throws error when GITHUB_ORG is missing", () => {
  // Arrange
  const env = {
    GITHUB_TOKEN: "test-token"
    // Missing GITHUB_ORG
  };
  const restoreEnv = mockDenoEnv(env);
  
  try {
    // Act & Assert
    assertThrows(
      () => validateEnv(),
      Error,
      "GITHUB_ORG environment variable is required"
    );
  } finally {
    restoreEnv();
  }
});

Deno.test("validateEnv - throws error when CACHE_TTL is not a number", () => {
  // Arrange
  const env = {
    GITHUB_TOKEN: "test-token",
    GITHUB_ORG: "test-org",
    CACHE_TTL: "not-a-number"
  };
  const restoreEnv = mockDenoEnv(env);
  
  try {
    // Act & Assert
    assertThrows(
      () => validateEnv(),
      Error,
      "CACHE_TTL must be a valid number"
    );
  } finally {
    restoreEnv();
  }
});

Deno.test("logEnvStatus - logs environment configuration correctly", () => {
  // Arrange
  const config: EnvConfig = {
    githubToken: "test-token",
    githubOrg: "test-org",
    githubApiVersion: "v4",
    webhookSecret: "test-secret",
    cacheTtl: 600
  };
  
  const consoleSpy = spyOnConsole();
  
  try {
    // Act
    logEnvStatus(config);
    
    // Assert
    assertEquals(consoleSpy.log.length, 6); // 5 config items + header
    assertEquals(consoleSpy.log[0], "GitHub API Integration Environment:");
    assertEquals(consoleSpy.log[1], "- GitHub Organization: test-org");
    assertEquals(consoleSpy.log[2], "- GitHub API Version: v4");
    assertEquals(consoleSpy.log[3], "- GitHub Token: [Set]");
    assertEquals(consoleSpy.log[4], "- Webhook Secret: [Set]");
    assertEquals(consoleSpy.log[5], "- Cache TTL: 600 seconds");
  } finally {
    consoleSpy.restore();
  }
});

Deno.test("logEnvStatus - handles missing optional values", () => {
  // Arrange
  const config: EnvConfig = {
    githubToken: "test-token",
    githubOrg: "test-org",
    githubApiVersion: "v3",
    webhookSecret: undefined,
    cacheTtl: 300
  };
  
  const consoleSpy = spyOnConsole();
  
  try {
    // Act
    logEnvStatus(config);
    
    // Assert
    assertEquals(consoleSpy.log.length, 6); // 5 config items + header
    assertEquals(consoleSpy.log[4], "- Webhook Secret: [Not Set]");
  } finally {
    consoleSpy.restore();
  }
});