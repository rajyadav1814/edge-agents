// agent.ts - File Search API implementation using OpenAI and Deno

import { load } from "https://deno.land/std@0.215.0/dotenv/mod.ts";
import OpenAI from "jsr:@openai/openai";

// Load environment variables from .env file
const env = await load({ export: true });
const apiKey = Deno.env.get("OPENAI_API_KEY");

if (!apiKey) {
  console.error("Error: OPENAI_API_KEY is required in .env file");
  Deno.exit(1);
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey,
});

// Create a vector store for file search
async function createVectorStore(name: string): Promise<string> {
  try {
    const vectorStore = await openai.vectorStores.create({
      name,
    });
    console.log(`Vector store created with ID: ${vectorStore.id}`);
    return vectorStore.id;
  } catch (error) {
    console.error("Error creating vector store:", error);
    throw error;
  }
}

// Upload a file to OpenAI
async function uploadFile(filePath: string): Promise<string> {
  try {
    let fileContent;
    
    if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
      // Handle URL file
      const response = await fetch(filePath);
      const buffer = await response.arrayBuffer();
      const urlParts = filePath.split("/");
      const fileName = urlParts[urlParts.length - 1];
      fileContent = new File([buffer], fileName);
    } else {
      // Handle local file
      const content = await Deno.readFile(filePath);
      fileContent = new File([content], filePath.split("/").pop() || "file");
    }
    
    const file = await openai.files.create({
      file: fileContent,
      purpose: "assistants",
    });
    
    console.log(`File uploaded with ID: ${file.id}`);
    return file.id;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}

// Add file to vector store
async function addFileToVectorStore(vectorStoreId: string, fileId: string): Promise<void> {
  try {
    await openai.vectorStores.files.create(vectorStoreId, {
      file_id: fileId,
    });
    console.log(`File ${fileId} added to vector store ${vectorStoreId}`);
  } catch (error) {
    console.error("Error adding file to vector store:", error);
    throw error;
  }
}

// Check file processing status
async function checkFileStatus(vectorStoreId: string): Promise<any> {
  try {
    const result = await openai.vectorStores.files.list(vectorStoreId);
    console.log("File processing status:", result);
    return result;
  } catch (error) {
    console.error("Error checking file status:", error);
    throw error;
  }
}

// Perform file search
async function searchFiles(vectorStoreId: string, query: string, maxResults = 5, useWebSearch = false): Promise<any> {
  try {
    let results: any = {
      vector_results: [],
      web_results: []
    };

    // Search vector store
    const vectorResponse = await openai.vectorStores.search(vectorStoreId, {
      query
    });

    results.vector_results = vectorResponse.data.slice(0, maxResults).map(result => ({
      type: 'vector',
      url: result.file_id,
      title: result.filename,
      content: result.content[0]?.text || ''
    }));

    // Perform web search if enabled
    if (useWebSearch) {
      const webResponse = await openai.chat.completions.create({
        model: "gpt-4o-search-preview",
        messages: [{
          role: "user",
          content: query
        }],
        web_search_options: {}
      });

      if (webResponse.choices[0]?.message?.tool_calls?.[0]) {
        results.web_results = [{
          type: 'web',
          content: webResponse.choices[0].message.content,
          annotations: webResponse.choices[0].message.annotations || [] }];
      }
    }

    return results;
  } catch (error) {
    console.error("Error searching:", error);
    throw error;
  }
}

// Main function to demonstrate the API usage
async function main() {
  // Parse command line arguments
  const args = Deno.args;
  
  if (args.length < 1) {
    console.log("Usage:");
    console.log("  Create store: deno run --allow-read --allow-env --allow-net agent.ts create-store <store-name>");
    console.log("  Upload file: deno run --allow-read --allow-env --allow-net agent.ts upload-file <file-path>");
    console.log("  Add file to store: deno run --allow-read --allow-env --allow-net agent.ts add-file <vector-store-id> <file-id>");
    console.log("  Check status: deno run --allow-read --allow-env --allow-net agent.ts check-status <vector-store-id>");
    console.log("  Search: deno run --allow-read --allow-env --allow-net agent.ts search <vector-store-id> <query> [--web]");
    Deno.exit(0);
  }

  const command = args[0];

  switch (command) {
    case "create-store":
      if (args.length < 2) {
        console.error("Error: store name is required");
        Deno.exit(1);
      }
      await createVectorStore(args[1]);
      break;
      
    case "upload-file":
      if (args.length < 2) {
        console.error("Error: file path is required");
        Deno.exit(1);
      }
      await uploadFile(args[1]);
      break;
      
    case "add-file":
      if (args.length < 3) {
        console.error("Error: vector store ID and file ID are required");
        Deno.exit(1);
      }
      await addFileToVectorStore(args[1], args[2]);
      break;
      
    case "check-status":
      if (args.length < 2) {
        console.error("Error: vector store ID is required");
        Deno.exit(1);
      }
      await checkFileStatus(args[1]);
      break;
      
    case "search":
      if (args.length < 3) {
        console.error("Error: vector store ID and query are required");
        Deno.exit(1);
      }
      const useWebSearch = args.includes("--web");
      const results = await searchFiles(args[1], args[2], 5, useWebSearch);
      console.log(JSON.stringify(results, null, 2));
      break;
      
    default:
      console.error(`Unknown command: ${command}`);
      Deno.exit(1);
  }
}

// Run the main function
if (import.meta.main) {
  await main();
}

// Export functions for use in other modules
export {
  createVectorStore,
  uploadFile,
  addFileToVectorStore,
  checkFileStatus,
  searchFiles,
};
