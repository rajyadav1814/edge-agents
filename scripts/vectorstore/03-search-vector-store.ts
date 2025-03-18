/**
 * Example 3: Search Vector Store
 * 
 * This example demonstrates how to search for files in a vector store using the OpenAI API.
 * It creates a vector store, adds a file with sample content, and then performs a search.
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
async function initializeVectorStore(name: string = "search-example-store"): Promise<string> {
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

/**
 * Upload a file to OpenAI
 * @param content File content
 * @param filename Filename
 * @returns The uploaded file ID
 */
async function uploadFile(content: string, filename: string): Promise<string> {
  try {
    console.log(`Uploading file: ${filename}...`);
    
    const file = new File(
      [content],
      filename,
      { type: 'text/plain' }
    );
    
    const uploadedFile = await openai.files.create({
      file,
      purpose: "assistants"
    });
    
    console.log(`File uploaded successfully with ID: ${uploadedFile.id}`);
    
    return uploadedFile.id;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to upload file: ${errorMessage}`);
    throw error;
  }
}

/**
 * Add a file to a vector store
 * @param vectorStoreId Vector store ID
 * @param fileId File ID
 */
async function addFileToVectorStore(vectorStoreId: string, fileId: string): Promise<void> {
  try {
    console.log(`Adding file ${fileId} to vector store ${vectorStoreId}...`);
    
    await openai.vectorStores.files.create(vectorStoreId, {
      file_id: fileId
    });
    
    console.log(`File added to vector store successfully`);
    
    // Wait for the file to be processed
    console.log("Waiting for file to be processed...");
    await new Promise(resolve => setTimeout(resolve, 5000));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to add file to vector store: ${errorMessage}`);
    throw error;
  }
}

/**
 * Search for files in a vector store
 * @param vectorStoreId Vector store ID
 * @param query Search query
 * @param maxResults Maximum number of results to return
 * @returns Search results
 */
async function searchVectorStore(
  vectorStoreId: string,
  query: string,
  maxResults: number = 5
): Promise<any> {
  try {
    console.log(`Searching vector store ${vectorStoreId} for: "${query}"...`);
    
    const searchResponse = await openai.vectorStores.search(vectorStoreId, {
      query,
      max_num_results: maxResults
    });
    
    console.log(`Search completed with ${searchResponse.data.length} results`);
    
    return searchResponse;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to search vector store: ${errorMessage}`);
    throw error;
  }
}

// Main execution
try {
  // Step 1: Initialize vector store
  const storeId = await initializeVectorStore();
  
  // Step 2: Create sample content
  const timestamp = new Date().toISOString();
  const content = `# Machine Learning Concepts
  
## Supervised Learning
Supervised learning is a type of machine learning where the model is trained on labeled data.
Examples include:
- Classification (predicting categories)
- Regression (predicting continuous values)

## Unsupervised Learning
Unsupervised learning works with unlabeled data to find patterns.
Examples include:
- Clustering
- Dimensionality reduction

## Reinforcement Learning
Reinforcement learning involves an agent learning to make decisions by taking actions in an environment.
The agent receives rewards or penalties based on its actions.

## Deep Learning
Deep learning uses neural networks with many layers to learn from data.
Applications include:
- Computer vision
- Natural language processing
- Speech recognition

Created at: ${timestamp}
`;
  
  // Step 3: Upload file to OpenAI
  const fileId = await uploadFile(content, `ml-concepts-${Date.now()}.md`);
  
  // Step 4: Add file to vector store
  await addFileToVectorStore(storeId, fileId);
  
  // Step 5: Search the vector store
  const searchQuery = "reinforcement learning agent";
  const searchResults = await searchVectorStore(storeId, searchQuery);
  
  // Step 6: Display search results
  console.log("\nSearch Results:");
  console.log("==============");
  
  if (searchResults.data.length === 0) {
    console.log("No results found.");
  } else {
    searchResults.data.forEach((result: any, index: number) => {
      console.log(`\nResult ${index + 1} (Score: ${result.score.toFixed(4)}):`);
      console.log("-------------------------------------------");
      console.log(result.content[0]?.text || "No text content");
    });
  }
  
  console.log("\nProcess completed successfully!");
} catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`Error in example: ${errorMessage}`);
}