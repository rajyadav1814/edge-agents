/**
 * Example 8: SPARC2 Vector Store Implementation
 * 
 * This example demonstrates the full implementation of the vector store functionality
 * for the SPARC2 framework, replacing the mock implementation with a real one.
 */

import OpenAI from "jsr:@openai/openai";
import { load } from "https://deno.land/std@0.215.0/dotenv/mod.ts";
import { LogEntry } from "../../scripts/sparc2/src/logger.ts";
import { 
  DiffEntry, 
  VectorSearchResult 
} from "../../scripts/sparc2/src/vector/vectorStore.ts";

// Load environment variables
await load({ export: true, allowEmptyValues: true });
const apiKey = Deno.env.get("OPENAI_API_KEY");

if (!apiKey) {
  console.error("Error: OPENAI_API_KEY is required in .env file");
  Deno.exit(1);
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey,
}) as any; // Use 'any' type to avoid TypeScript errors with vectorStores

// Store ID for the vector store
let vectorStoreId: string | null = null;

/**
 * Initialize the vector store
 * @param name Name for the vector store
 * @returns The vector store ID
 */
async function initializeVectorStore(name: string = "sparc2-vector-store"): Promise<string> {
  try {
    if (vectorStoreId !== null) {
      console.log(`Using existing vector store with ID: ${vectorStoreId}`);
      return vectorStoreId;
    }
    
    console.log(`Creating vector store with name: ${name}...`);
    
    const vectorStore = await openai.vectorStores.create({ name });
    vectorStoreId = vectorStore.id;
    
    console.log(`Vector store initialized successfully with ID: ${vectorStoreId}`);
    
    return vectorStoreId;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to initialize vector store: ${errorMessage}`);
    throw error;
  }
}

/**
 * Store a log entry in the vector database
 * @param entry Log entry to store
 */
async function vectorStoreLog(entry: LogEntry): Promise<void> {
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
      file_id: uploadedFile.id,
    });
    
    console.log(`Log entry stored in vector database: ${entry.message.substring(0, 50)}${entry.message.length > 50 ? "..." : ""}`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to store log entry in vector database: ${errorMessage}`);
    throw error;
  }
}

/**
 * Index a diff entry in the vector database
 * @param entry Diff entry to index
 */
async function indexDiffEntry(entry: DiffEntry): Promise<void> {
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
      file_id: uploadedFile.id,
    });
    
    console.log(`Diff entry indexed in vector database: ${entry.file} (${entry.id})`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to index diff entry in vector database: ${errorMessage}`);
    throw error;
  }
}

/**
 * Search for diff entries similar to the query
 * @param query Search query
 * @param maxResults Maximum number of results to return
 * @returns Array of matching diff entries with similarity scores
 */
async function searchDiffEntries(
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
    });
    
    // Transform the results into the expected format
    const results: VectorSearchResult[] = searchResponse.data.map((result: any) => {
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
        } as DiffEntry,
        score: result.score || 0
      };
    });
    
    console.log(`Searched for diff entries with query: "${query}", found ${results.length} results`);
    
    return results;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to search diff entries: ${errorMessage}`);
    
    // Return empty array on error
    return [];
  }
}

/**
 * Search for log entries similar to the query
 * @param query Search query
 * @param maxResults Maximum number of results to return
 * @returns Array of matching log entries with similarity scores
 */
async function searchLogEntries(
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
    });
    
    // Transform the results into the expected format
    const results: VectorSearchResult[] = searchResponse.data.map((result: any) => {
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
        } as LogEntry,
        score: result.score || 0
      };
    });
    
    console.log(`Searched for log entries with query: "${query}", found ${results.length} results`);
    
    return results;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to search log entries: ${errorMessage}`);
    
    // Return empty array on error
    return [];
  }
}

/**
 * Clear all entries from the vector store
 * Useful for testing or resetting the database
 */
async function clearVectorStore(): Promise<void> {
  try {
    // If no vector store ID is set, there's nothing to clear
    if (!vectorStoreId) {
      console.log("No vector store to clear");
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
    
    console.log("Cleared all entries from vector store");
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to clear vector store: ${errorMessage}`);
    throw error;
  }
}

// Main execution - Test the implementation
try {
  console.log("Testing SPARC2 Vector Store Implementation");
  
  // Step 1: Initialize vector store
  await initializeVectorStore("sparc2-test-store");
  
  // Step 2: Clear any existing entries
  await clearVectorStore();
  
  // Step 3: Re-initialize vector store
  await initializeVectorStore("sparc2-test-store");
  
  // Step 4: Store a log entry
  const logEntry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: "info",
    message: "This is a test log entry for the SPARC2 vector store implementation",
    metadata: {
      test: true,
      component: "vector-store",
      version: "1.0.0"
    }
  };
  
  await vectorStoreLog(logEntry);
  
  // Step 5: Store a diff entry
  const diffEntry: DiffEntry = {
    id: `test-${Date.now()}`,
    file: "src/vector/vectorStore.ts",
    diff: `- // In a real implementation, this would search the vector store for diff entries
+ // Search the vector store using OpenAI's API
+ const searchResponse = await openai.vectorStores.search(vectorStoreId, {
+   query,
+   max_num_results: maxResults,
+   filters: {
+     metadata: {
+       type: "diff"
+     }
+   }
+ });`,
    metadata: {
      test: true,
      component: "vector-store",
      author: "SPARC2 Test"
    }
  };
  
  await indexDiffEntry(diffEntry);
  
  // Wait for indexing to complete
  console.log("Waiting for indexing to complete...");
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Step 6: Search for log entries
  const logSearchResults = await searchLogEntries("test log entry");
  console.log(`Found ${logSearchResults.length} log entries`);
  
  // Step 7: Search for diff entries
  const diffSearchResults = await searchDiffEntries("search vector store");
  console.log(`Found ${diffSearchResults.length} diff entries`);
  
  // Step 8: Display search results
  if (logSearchResults.length > 0) {
    console.log("\nLog Search Results:");
    console.log("==================");
    logSearchResults.forEach((result, index) => {
      const entry = result.entry as LogEntry;
      console.log(`\nResult ${index + 1} (Score: ${result.score.toFixed(4)}):`);
      console.log(`Level: ${entry.level}`);
      console.log(`Message: ${entry.message}`);
      console.log(`Metadata: ${JSON.stringify(entry.metadata, null, 2)}`);
    });
  }
  
  if (diffSearchResults.length > 0) {
    console.log("\nDiff Search Results:");
    console.log("===================");
    diffSearchResults.forEach((result, index) => {
      const entry = result.entry as DiffEntry;
      console.log(`\nResult ${index + 1} (Score: ${result.score.toFixed(4)}):`);
      console.log(`File: ${entry.file}`);
      console.log(`ID: ${entry.id}`);
      console.log(`Diff:\n${entry.diff}`);
    });
  }
  
  console.log("\nTest completed successfully!");
} catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`Error in example: ${errorMessage}`);
}

// Export the functions for use in the SPARC2 framework
export {
  initializeVectorStore,
  vectorStoreLog,
  indexDiffEntry,
  searchDiffEntries,
  searchLogEntries,
  clearVectorStore
};