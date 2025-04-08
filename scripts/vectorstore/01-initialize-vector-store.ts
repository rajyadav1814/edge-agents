/**
 * Example 1: Initialize Vector Store
 * 
 * This example demonstrates how to initialize a vector store using the OpenAI API.
 * It creates a new vector store with a specified name and logs the ID.
 */

import OpenAI from "jsr:@openai/openai";
import { load } from "https://deno.land/std@0.215.0/dotenv/mod.ts";

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

/**
 * Initialize a vector store with the given name
 * @param name Name for the vector store
 * @returns The vector store ID
 */
async function initializeVectorStore(name: string = "sparc2-vector-store"): Promise<string> {
  try {
    console.log(`Creating vector store with name: ${name}...`);
    
    const vectorStore = await openai.vectorStores.create({ name });
    const vectorStoreId = vectorStore.id;
    
    console.log(`Vector store initialized successfully with ID: ${vectorStoreId}`);
    
    // Wait for a moment to ensure the vector store is available in the list
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return vectorStoreId;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to initialize vector store: ${errorMessage}`);
    throw error;
  }
}

// Main execution
try {
  const storeId = await initializeVectorStore();
  console.log(`Vector store created with ID: ${storeId}`);
  
  // Wait a moment before verification to ensure the store is available in the list
  console.log("Waiting for vector store to be available...");
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Verify the store exists by listing it
  const stores = await openai.vectorStores.list();
  const createdStore = stores.data.find((store: any) => store.id === storeId);
  
  if (createdStore) {
    console.log("Vector store verification successful!");
    console.log(`Store details: ${JSON.stringify(createdStore, null, 2)}`);
  } else {
    console.error("Vector store verification failed: Store not found in list");
  }
} catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`Error in example: ${errorMessage}`);
}