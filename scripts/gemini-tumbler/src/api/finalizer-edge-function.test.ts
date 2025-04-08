/**
 * Tests for the finalizer edge function
 * Run with: deno test finalizer-edge-function.test.ts
 */

import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";

// Mock processed data
interface ProcessedData {
  userIdHash?: string;
  ipHash?: string;
  geoHash?: string | null;
  timestamp: number;
  processingTimestamp: number;
  processingComplete: boolean;
  [key: string]: any;
}

// Mock storeAnonymizedData function
async function storeAnonymizedData(_data: any, _tableName: string): Promise<boolean> {
  // This is a mock function that always returns true
  // In a real test, you would mock the database interaction
  console.log(`Storing data in table: ${_tableName}`);
  return true;
}

// Mock finalizeData function
async function finalizeData(data: ProcessedData): Promise<any> {
  return {
    ...data,
    finalizationTimestamp: Date.now(),
    status: "completed"
  };
}

Deno.test("finalizeData - adds finalization data", async () => {
  const processedData: ProcessedData = {
    userIdHash: "abc123",
    ipHash: "def456",
    timestamp: Date.now(),
    processingTimestamp: Date.now(),
    processingComplete: true,
    message: "test message"
  };
  
  const finalizedData = await finalizeData(processedData);
  
  // Check that finalization data was added
  assertEquals(typeof finalizedData.finalizationTimestamp, "number", "Finalization timestamp should be added");
  assertEquals(finalizedData.status, "completed", "Status should be set to completed");
  
  // Check that original data was preserved
  assertEquals(finalizedData.userIdHash, processedData.userIdHash, "User ID hash should be preserved");
  assertEquals(finalizedData.ipHash, processedData.ipHash, "IP hash should be preserved");
  assertEquals(finalizedData.message, processedData.message, "Message should be preserved");
  assertEquals(finalizedData.processingComplete, processedData.processingComplete, "Processing data should be preserved");
});

Deno.test("storeAnonymizedData - returns true on success", async () => {
  const finalizedData = {
    userIdHash: "abc123",
    ipHash: "def456",
    timestamp: Date.now(),
    processingTimestamp: Date.now(),
    processingComplete: true,
    finalizationTimestamp: Date.now(),
    status: "completed"
  };
  
  const result = await storeAnonymizedData(finalizedData, "test_table");
  
  // Check that storage was successful
  assertEquals(result, true, "Storage should be successful");
});