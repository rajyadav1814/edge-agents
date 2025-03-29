/**
 * Tests for the anonymizer module
 * Run with: deno test anonymizer.test.ts
 */

import { assertEquals, assertNotEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { 
  createHash, 
  anonymizeUserData, 
  AnonymizerConfig, 
  UserData 
} from "./anonymizer.ts";

// Test createHash function
Deno.test("createHash - generates consistent hashes", async () => {
  const input = "test-input";
  const hash1 = await createHash(input);
  const hash2 = await createHash(input);
  
  assertEquals(hash1, hash2, "Hash should be consistent for the same input");
  assertEquals(hash1.length, 64, "SHA-256 hash should be 64 characters in hex format");
});

Deno.test("createHash - different inputs produce different hashes", async () => {
  const input1 = "test-input-1";
  const input2 = "test-input-2";
  
  const hash1 = await createHash(input1);
  const hash2 = await createHash(input2);
  
  assertNotEquals(hash1, hash2, "Different inputs should produce different hashes");
});

Deno.test("createHash - salt changes the hash", async () => {
  const input = "test-input";
  const salt = "test-salt";
  
  const hashWithoutSalt = await createHash(input);
  const hashWithSalt = await createHash(input, salt);
  
  assertNotEquals(hashWithoutSalt, hashWithSalt, "Adding salt should change the hash");
});

Deno.test("createHash - empty input returns empty string", async () => {
  const hash = await createHash("");
  assertEquals(hash, "", "Empty input should return empty string");
});

// Test anonymizeUserData function
Deno.test("anonymizeUserData - anonymizes all fields when enabled", async () => {
  const userData: UserData = {
    userId: "user-123",
    ipAddress: "192.168.1.1",
    geolocation: {
      latitude: 37.7749,
      longitude: -122.4194,
      country: "US",
      region: "CA"
    },
    userAgent: "Mozilla/5.0",
    additionalField: "should remain unchanged"
  };
  
  const config: AnonymizerConfig = {
    enabled: true,
    salt: "test-salt",
    fields: {
      userId: true,
      ipAddress: true,
      geolocation: true,
      userAgent: true
    }
  };
  
  const anonymizedData = await anonymizeUserData(userData, config);
  
  // Check that fields were anonymized
  assertNotEquals(anonymizedData.userIdHash, userData.userId, "User ID should be anonymized");
  assertNotEquals(anonymizedData.ipHash, userData.ipAddress, "IP address should be anonymized");
  assertNotEquals(anonymizedData.geoHash, JSON.stringify(userData.geolocation), "Geolocation should be anonymized");
  assertNotEquals(anonymizedData.userAgentHash, userData.userAgent, "User agent should be anonymized");
  
  // Check that additional fields were preserved
  assertEquals(anonymizedData.additionalField, userData.additionalField, "Additional fields should be preserved");
  
  // Check that timestamp was added
  assertEquals(typeof anonymizedData.timestamp, "number", "Timestamp should be added");
});

Deno.test("anonymizeUserData - skips disabled fields", async () => {
  const userData: UserData = {
    userId: "user-123",
    ipAddress: "192.168.1.1",
    userAgent: "Mozilla/5.0"
  };
  
  const config: AnonymizerConfig = {
    enabled: true,
    salt: "test-salt",
    fields: {
      userId: true,
      ipAddress: false,
      geolocation: true,
      userAgent: false
    }
  };
  
  const anonymizedData = await anonymizeUserData(userData, config);
  
  // Check that only enabled fields were anonymized
  assertNotEquals(anonymizedData.userIdHash, userData.userId, "User ID should be anonymized");
  assertEquals(anonymizedData.ipHash, undefined, "IP address should not be anonymized");
  assertEquals(anonymizedData.userAgentHash, undefined, "User agent should not be anonymized");
});

Deno.test("anonymizeUserData - returns original data when disabled", async () => {
  const userData: UserData = {
    userId: "user-123",
    ipAddress: "192.168.1.1"
  };
  
  const config: AnonymizerConfig = {
    enabled: false,
    salt: "test-salt",
    fields: {
      userId: true,
      ipAddress: true,
      geolocation: true,
      userAgent: true
    }
  };
  
  const anonymizedData = await anonymizeUserData(userData, config);
  
  // Check that original data was preserved
  assertEquals(anonymizedData.userId, userData.userId, "User ID should be preserved");
  assertEquals(anonymizedData.ipAddress, userData.ipAddress, "IP address should be preserved");
  
  // Check that timestamp was added
  assertEquals(typeof anonymizedData.timestamp, "number", "Timestamp should be added");
});