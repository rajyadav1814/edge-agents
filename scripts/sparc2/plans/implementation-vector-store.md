# Vector Store Implementation Plan

## Overview

This document outlines the plan to replace the mock implementation of the Vector Store with a fully functional implementation that connects to OpenAI's vector store API, following the same approach as used in `supabase/functions/vector-file`.

## Current Status

The current implementation in `src/vector/vectorStore.ts` uses placeholder functions that simulate vector store operations but don't actually store or retrieve any data. The functions log debug messages and simulate delays to mimic asynchronous operations.

## Implementation Goals

1. Implement a real vector store client using OpenAI's API
2. Maintain the existing API surface to ensure compatibility with the rest of the codebase
3. Use the OpenAI API key from the environment variables
4. Ensure all tests continue to pass with the new implementation

## Implementation Steps

### 1. Import Required Dependencies

```typescript
import OpenAI from "npm:openai";
import { load } from "https://deno.land/std@0.215.0/dotenv/mod.ts";
import { logMessage } from "../logger.ts";
```

### 2. Initialize OpenAI Client

```typescript
// Load environment variables
const env = await load({ export: true });
const apiKey = Deno.env.get("OPENAI_API_KEY") || Deno.env.get("VITE_OPENAI_API_KEY");

if (!apiKey) {
  console.error("Error: OPENAI_API_KEY is required in .env file");
  throw new Error("OPENAI_API_KEY is required");
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey,
});

// Store ID for the vector store
let vectorStoreId: string | null = null;
```

### 3. Create Function to Initialize Vector Store

```typescript
/**
 * Initialize the vector store
 * @param name Name for the vector store
 * @returns The vector store ID
 */
export async function initializeVectorStore(name: string = "sparc2-vector-store"): Promise<string> {
  try {
    if (vectorStoreId) {
      return vectorStoreId;
    }
    
    const vectorStore = await openai.vectorStores.create({ name });
    vectorStoreId = vectorStore.id;
    
    await logMessage("info", "Vector store initialized", { id: vectorStoreId });
    
    return vectorStoreId;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logMessage("error", "Failed to initialize vector store", { error: errorMessage });
    throw error;
  }
}
```

### 4. Update the vectorStoreLog Function

```typescript
/**
 * Store a log entry in the vector database
 * @param entry Log entry to store
 */
export async function vectorStoreLog(entry: LogEntry): Promise<void> {
  try {
    // Ensure vector store is initialized
    const storeId = await initializeVectorStore();
    
    // Create a text file with the log entry
    const timestamp = new Date().toISOString();
    const content = `Log Entry (${timestamp})
Level: ${entry.level}
Message: ${entry.message}
Metadata: ${JSON.stringify(entry.metadata || {}, null, 2)}`;
    
    const file = new File(
      [content],
      `log-${Date.now()}.txt`,
      { type: 'text/plain' }
    );
    
    // Upload the file to OpenAI
    const uploadedFile = await openai.files.create({
      file,
      purpose: "assistants"
    });
    
    // Add the file to the vector store
    await openai.vectorStores.files.create(storeId, {
      file_id: uploadedFile.id
    });
    
    await logMessage("info", "Log entry stored in vector database", {
      timestamp: entry.timestamp,
      level: entry.level,
      message: entry.message.substring(0, 50) + (entry.message.length > 50 ? "..." : "")
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logMessage("error", "Failed to store log entry in vector database", { error: errorMessage });
    throw error;
  }
}
```

### 5. Update the indexDiffEntry Function

```typescript
/**
 * Index a diff entry in the vector database
 * @param entry Diff entry to index
 */
export async function indexDiffEntry(entry: DiffEntry): Promise<void> {
  try {
    // Ensure vector store is initialized
    const storeId = await initializeVectorStore();
    
    // Create a text file with the diff entry
    const content = `Diff Entry (${entry.id})
File: ${entry.file}
Diff:
${entry.diff}
Metadata: ${JSON.stringify(entry.metadata || {}, null, 2)}`;
    
    const file = new File(
      [content],
      `diff-${entry.id}.txt`,
      { type: 'text/plain' }
    );
    
    // Upload the file to OpenAI
    const uploadedFile = await openai.files.create({
      file,
      purpose: "assistants"
    });
    
    // Add the file to the vector store
    await openai.vectorStores.files.create(storeId, {
      file_id: uploadedFile.id
    });
    
    await logMessage("info", "Diff entry indexed in vector database", {
      id: entry.id,
      file: entry.file,
      diffPreview: entry.diff.substring(0, 50) + (entry.diff.length > 50 ? "..." : "")
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logMessage("error", "Failed to index diff entry in vector database", { error: errorMessage });
    throw error;
  }
}
```

### 6. Update the searchDiffEntries Function

```typescript
/**
 * Search for diff entries similar to the query
 * @param query Search query
 * @param maxResults Maximum number of results to return
 * @returns Array of matching diff entries with similarity scores
 */
export async function searchDiffEntries(
  query: string,
  maxResults: number = 5
): Promise<VectorSearchResult[]> {
  try {
    // Ensure vector store is initialized
    const storeId = await initializeVectorStore();
    
    // Search the vector store
    const searchResponse = await openai.vectorStores.search(storeId, {
      query,
      max_num_results: maxResults,
      filters: {
        metadata: {
          type: "diff"
        }
      }
    });
    
    // Transform the results into the expected format
    const results: VectorSearchResult[] = searchResponse.data.map(result => {
      // Extract diff entry information from the content
      const content = result.content[0]?.text || '';
      
      // Parse the content to extract diff entry information
      const idMatch = content.match(/Diff Entry \((.*?)\)/);
      const fileMatch = content.match(/File: (.*?)$/m);
      const diffMatch = content.match(/Diff:\n([\s\S]*?)Metadata:/);
      const metadataMatch = content.match(/Metadata: ([\s\S]*?)$/);
      
      const id = idMatch ? idMatch[1] : '';
      const file = fileMatch ? fileMatch[1] : '';
      const diff = diffMatch ? diffMatch[1].trim() : '';
      const metadata = metadataMatch ? JSON.parse(metadataMatch[1]) : {};
      
      return {
        entry: {
          id,
          file,
          diff,
          metadata
        },
        score: result.score || 0
      };
    });
    
    await logMessage("info", "Searched for diff entries", { 
      query, 
      maxResults,
      resultsCount: results.length
    });
    
    return results;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logMessage("error", "Failed to search diff entries", { error: errorMessage });
    
    // Return empty array on error
    return [];
  }
}
```

### 7. Update the searchLogEntries Function

```typescript
/**
 * Search for log entries similar to the query
 * @param query Search query
 * @param maxResults Maximum number of results to return
 * @returns Array of matching log entries with similarity scores
 */
export async function searchLogEntries(
  query: string,
  maxResults: number = 5
): Promise<VectorSearchResult[]> {
  try {
    // Ensure vector store is initialized
    const storeId = await initializeVectorStore();
    
    // Search the vector store
    const searchResponse = await openai.vectorStores.search(storeId, {
      query,
      max_num_results: maxResults,
      filters: {
        metadata: {
          type: "log"
        }
      }
    });
    
    // Transform the results into the expected format
    const results: VectorSearchResult[] = searchResponse.data.map(result => {
      // Extract log entry information from the content
      const content = result.content[0]?.text || '';
      
      // Parse the content to extract log entry information
      const timestampMatch = content.match(/Log Entry \((.*?)\)/);
      const levelMatch = content.match(/Level: (.*?)$/m);
      const messageMatch = content.match(/Message: (.*?)$/m);
      const metadataMatch = content.match(/Metadata: ([\s\S]*?)$/);
      
      const timestamp = timestampMatch ? timestampMatch[1] : new Date().toISOString();
      const level = levelMatch ? levelMatch[1] : 'info';
      const message = messageMatch ? messageMatch[1] : '';
      const metadata = metadataMatch ? JSON.parse(metadataMatch[1]) : {};
      
      return {
        entry: {
          timestamp,
          level,
          message,
          metadata
        },
        score: result.score || 0
      };
    });
    
    await logMessage("info", "Searched for log entries", { 
      query, 
      maxResults,
      resultsCount: results.length
    });
    
    return results;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logMessage("error", "Failed to search log entries", { error: errorMessage });
    
    // Return empty array on error
    return [];
  }
}
```

### 8. Update the clearVectorStore Function

```typescript
/**
 * Clear all entries from the vector store
 * Useful for testing or resetting the database
 */
export async function clearVectorStore(): Promise<void> {
  try {
    // If no vector store ID is set, there's nothing to clear
    if (!vectorStoreId) {
      await logMessage("info", "No vector store to clear");
      return;
    }
    
    // Get all files in the vector store
    const files = await openai.vectorStores.files.list(vectorStoreId);
    
    // Delete each file
    for (const file of files.data) {
      await openai.vectorStores.files.delete(vectorStoreId, file.id);
    }
    
    // Reset the vector store ID
    vectorStoreId = null;
    
    await logMessage("info", "Cleared all entries from vector store");
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logMessage("error", "Failed to clear vector store", { error: errorMessage });
    throw error;
  }
}
```

## Testing Strategy

1. Update the test file to use a test vector store for integration tests
2. Add a flag to switch between mock and real implementations for testing
3. Ensure all tests pass with both the mock and real implementations

## Deployment Considerations

1. Ensure the OpenAI API key environment variable is set in all environments
2. Monitor usage and costs associated with the OpenAI API
3. Implement rate limiting and caching if necessary to reduce costs

## Fallback Strategy

If the OpenAI API is unavailable or the API key is invalid, the system should fall back to a degraded mode where vector operations are disabled but other functionality continues to work.