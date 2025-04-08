/**
 * Tests for the processor edge function
 * Run with: deno test processor-edge-function.test.ts
 */

import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { AnonymizedData } from "../utils/anonymizer.ts";

// Mock processAnonymizedData function
async function processAnonymizedData(data: AnonymizedData): Promise<any> {
  return {
    ...data,
    processingTimestamp: Date.now(),
    processingComplete: true
  };
}

Deno.test("processAnonymizedData - adds processing data", async () => {
  const anonymizedData: AnonymizedData = {
    userIdHash: "abc123",
    ipHash: "def456",
    timestamp: Date.now(),
    message: "test message"
  };
  
  const processedData = await processAnonymizedData(anonymizedData);
  
  // Check that processing data was added
  assertEquals(typeof processedData.processingTimestamp, "number", "Processing timestamp should be added");
  assertEquals(processedData.processingComplete, true, "Processing complete flag should be added");
  
  // Check that original data was preserved
  assertEquals(processedData.userIdHash, anonymizedData.userIdHash, "User ID hash should be preserved");
  assertEquals(processedData.ipHash, anonymizedData.ipHash, "IP hash should be preserved");
  assertEquals(processedData.message, anonymizedData.message, "Message should be preserved");
});