import { assertEquals, assertExists } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { 
  vectorStoreLog, 
  indexDiffEntry, 
  searchDiffEntries, 
  searchLogEntries,
  clearVectorStore,
  type DiffEntry,
  type VectorSearchResult
} from "./vectorStore.ts";
import { type LogEntry } from "../logger.ts";

// Mock console.debug to capture calls
let debugLogs: string[] = [];
const originalConsoleDebug = console.debug;

function setupMocks() {
  debugLogs = [];
  console.debug = (...args: unknown[]) => {
    debugLogs.push(args.map(arg => String(arg)).join(" "));
  };
}

function restoreMocks() {
  console.debug = originalConsoleDebug;
}

Deno.test("vectorStoreLog stores log entries", async () => {
  setupMocks();
  
  try {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: "info",
      message: "Test log message",
      metadata: { test: true }
    };
    
    await vectorStoreLog(logEntry);
    
    // Verify that console.debug was called with the expected message
    assertEquals(debugLogs.length, 1);
    const debugMessage = debugLogs[0];
    
    // Check that the debug message contains expected information
    assertEquals(debugMessage.includes("Vector store: Storing log entry"), true);
    assertEquals(debugMessage.includes("Test log message"), true);
    assertEquals(debugMessage.includes("info"), true);
  } finally {
    restoreMocks();
  }
});

Deno.test("indexDiffEntry stores diff entries", async () => {
  setupMocks();
  
  try {
    const diffEntry: DiffEntry = {
      id: "test-id",
      file: "test-file.ts",
      diff: "- old line\n+ new line",
      metadata: { test: true }
    };
    
    await indexDiffEntry(diffEntry);
    
    // Verify that console.debug was called with the expected message
    assertEquals(debugLogs.length, 1);
    const debugMessage = debugLogs[0];
    
    // Check that the debug message contains expected information
    assertEquals(debugMessage.includes("Vector store: Indexing diff entry"), true);
    assertEquals(debugMessage.includes("test-id"), true);
    assertEquals(debugMessage.includes("test-file.ts"), true);
  } finally {
    restoreMocks();
  }
});

Deno.test("searchDiffEntries returns empty array for now", async () => {
  setupMocks();
  
  try {
    const results = await searchDiffEntries("test query");
    
    // Verify that console.debug was called with the expected message
    assertEquals(debugLogs.length, 1);
    const debugMessage = debugLogs[0];
    
    // Check that the debug message contains expected information
    assertEquals(debugMessage.includes("Vector store: Searching for diff entries"), true);
    assertEquals(debugMessage.includes("test query"), true);
    
    // Verify that the results are an empty array
    assertEquals(results, []);
  } finally {
    restoreMocks();
  }
});

Deno.test("searchLogEntries returns empty array for now", async () => {
  setupMocks();
  
  try {
    const results = await searchLogEntries("test query");
    
    // Verify that console.debug was called with the expected message
    assertEquals(debugLogs.length, 1);
    const debugMessage = debugLogs[0];
    
    // Check that the debug message contains expected information
    assertEquals(debugMessage.includes("Vector store: Searching for log entries"), true);
    assertEquals(debugMessage.includes("test query"), true);
    
    // Verify that the results are an empty array
    assertEquals(results, []);
  } finally {
    restoreMocks();
  }
});

Deno.test("clearVectorStore clears the vector store", async () => {
  setupMocks();
  
  try {
    await clearVectorStore();
    
    // Verify that console.debug was called with the expected message
    assertEquals(debugLogs.length, 1);
    const debugMessage = debugLogs[0];
    
    // Check that the debug message contains expected information
    assertEquals(debugMessage.includes("Vector store: Clearing all entries"), true);
  } finally {
    restoreMocks();
  }
});