/**
 * Example 2: Upload File to Vector Store
 * 
 * This example demonstrates how to upload a file to OpenAI and add it to a vector store.
 * It creates a text file with sample content, uploads it to OpenAI, and adds it to a vector store.
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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to add file to vector store: ${errorMessage}`);
    throw error;
  }
}

// Main execution
try {
  // Step 1: Initialize vector store
  const storeId = await initializeVectorStore("example-document-store");
  
  // Step 2: Create sample content
  const timestamp = new Date().toISOString();
  const content = `# Sample Document
  
This is a sample document created at ${timestamp}.

## Features
- Easy to read
- Contains markdown formatting
- Has multiple sections

## Code Example
\`\`\`typescript
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}
\`\`\`

## Conclusion
This document demonstrates how to upload files to a vector store for semantic search.
`;
  
  // Step 3: Upload file to OpenAI
  const fileId = await uploadFile(content, `sample-document-${Date.now()}.md`);
  
  // Step 4: Add file to vector store
  await addFileToVectorStore(storeId, fileId);
  
  console.log("Process completed successfully!");
} catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`Error in example: ${errorMessage}`);
}