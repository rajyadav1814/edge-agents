// Test script for file-search.ts
// This script demonstrates the file search functionality by:
// 1. Creating a vector store
// 2. Uploading the example.pdf file
// 3. Adding the file to the vector store
// 4. Checking the status of the file processing

import {
  createVectorStore,
  uploadFile,
  addFileToVectorStore,
  checkFileStatus,
} from "./file-search.ts";

// Configuration
const ASSETS_DIR = "./assets";
const TEST_FILE = `${ASSETS_DIR}/example.pdf`;
const STORE_NAME = "test-knowledge-base";

// Helper function to wait between API calls
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Main test function
async function runTest() {
  try {
    console.log("Starting file search test...");
    console.log("----------------------------");
    
    // Step 1: Create a vector store
    console.log(`\n1. Creating vector store "${STORE_NAME}"...`);
    const vectorStoreId = await createVectorStore(STORE_NAME);
    console.log(`Vector store created with ID: ${vectorStoreId}`);
    
    // Wait a moment before next API call
    await wait(1000);
    
    // Step 2: Upload the example.pdf file
    console.log(`\n2. Uploading file "${TEST_FILE}"...`);
    const fileId = await uploadFile(TEST_FILE);
    console.log(`File uploaded with ID: ${fileId}`);
    
    // Wait a moment before next API call
    await wait(1000);
    
    // Step 3: Add the file to the vector store
    console.log(`\n3. Adding file to vector store...`);
    await addFileToVectorStore(vectorStoreId, fileId);
    console.log(`File ${fileId} added to vector store ${vectorStoreId}`);
    
    // Wait a moment before next API call
    await wait(1000);
    
    // Step 4: Check the status of the file processing
    console.log(`\n4. Checking file processing status...`);
    const status = await checkFileStatus(vectorStoreId);
    console.log("File processing status:");
    console.log(JSON.stringify(status, null, 2));
    
    // Wait a moment and check status again (files may still be processing)
    console.log("\nWaiting 10 seconds for processing to progress...");
    await wait(10000);
    
    console.log("\n5. Checking file processing status again...");
    const updatedStatus = await checkFileStatus(vectorStoreId);
    console.log("Updated file processing status:");
    console.log(JSON.stringify(updatedStatus, null, 2));
    
    console.log("\n----------------------------");
    console.log("Test completed successfully!");
    console.log("\nNext steps:");
    console.log(`1. Search the vector store: deno run --allow-net --allow-env --allow-read file-search.ts search ${vectorStoreId} "your search query"`);
    console.log(`2. Start the HTTP server: deno run --allow-net --allow-env --allow-read file-search.ts serve`);
    
    // Return the IDs for reference
    return { vectorStoreId, fileId };
  } catch (error) {
    console.error("Error during test:", error);
    throw error;
  }
}

// Run the test if this script is executed directly
if (import.meta.main) {
  runTest()
    .then(({ vectorStoreId, fileId }) => {
      // Save the IDs to a file for future reference
      const idsData = `VECTOR_STORE_ID=${vectorStoreId}\nFILE_ID=${fileId}\n`;
      Deno.writeTextFileSync("./file-search-test-ids.txt", idsData);
      console.log("\nIDs saved to file-search-test-ids.txt for future reference");
    })
    .catch(error => {
      console.error("Test failed:", error);
      Deno.exit(1);
    });
}

// Export the test function for use in other scripts
export { runTest };
