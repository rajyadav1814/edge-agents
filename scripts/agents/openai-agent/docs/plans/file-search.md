# Deno File Search API Implementation

```markdown
# File Search Tool README

This document explains how to use the File Search tool available in the Responses API. This tool allows models to search your files for relevant information before generating a response by leveraging semantic and keyword search over a knowledge base of previously uploaded files.

---

## Overview

The File Search tool enables the following:
- **Semantic and Keyword Search:** Retrieve information from a knowledge base of files.
- **Vector Stores:** Augment the model's inherent knowledge by creating and querying vector stores.
- **Automated Execution:** The tool is hosted and managed by OpenAI; when the model decides to use it, the tool is automatically called.
- **Citations and Output:** The response includes file citations and optional search result details.

For more background on vector stores and semantic search, refer to the [Retrieval Guide](https://platform.openai.com/docs/guides/retrieval).

---

## Implementation Details

### Step 1: Upload a File
Files can be uploaded either from a URL or a local file path. The following code snippet demonstrates the process:

```javascript
import fs from "fs";
import OpenAI from "openai";
const openai = new OpenAI();

async function createFile(filePath) {
  let result;
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    // Download the file content from the URL
    const res = await fetch(filePath);
    const buffer = await res.arrayBuffer();
    const urlParts = filePath.split("/");
    const fileName = urlParts[urlParts.length - 1];
    const file = new File([buffer], fileName);
    result = await openai.files.create({
      file: file,
      purpose: "assistants",
    });
  } else {
    // Handle local file path
    const fileContent = fs.createReadStream(filePath);
    result = await openai.files.create({
      file: fileContent,
      purpose: "assistants",
    });
  }
  return result.id;
}

// Replace with your own file path or URL
const fileId = await createFile("https://cdn.openai.com/API/docs/deep_research_blog.pdf");
console.log(fileId);
```

### Step 2: Create a Vector Store
A vector store serves as the knowledge base. Create one as shown below:

```javascript
const vectorStore = await openai.vectorStores.create({
    name: "knowledge_base",
});
console.log(vectorStore.id);
```

### Step 3: Add the File to the Vector Store
After creating the vector store, add your file:

```javascript
await openai.vectorStores.files.create(
    vectorStore.id,
    {
        file_id: fileId,
    }
);
```

### Step 4: Check File Status
Run the following code until the file's status is "completed":

```javascript
const result = await openai.vectorStores.files.list({
    vector_store_id: vectorStore.id,
});
console.log(result);
```

---

## File Search Tool Usage

Once your knowledge base is set up, include the file search tool in the list of tools when calling the Responses API.

### Basic File Search
```javascript
import OpenAI from "openai";
const openai = new OpenAI();

const response = await openai.responses.create({
    model: "gpt-4o-mini",
    input: "What is deep research by OpenAI?",
    tools: [{
        type: "file_search",
        vector_store_ids: ["<vector_store_id>"],
    }],
});
console.log(response);
```

### Customization Options

#### Limiting the Number of Results
Reducing the number of search results can decrease token usage and latency.

```javascript
const response = await openai.responses.create({
    model: "gpt-4o-mini",
    input: "What is deep research by OpenAI?",
    tools: [{
        type: "file_search",
        vector_store_ids: ["<vector_store_id>"],
        max_num_results: 2,
    }],
});
console.log(response);
```

#### Including Search Results in the Response
To include search results in the response output, use the `include` parameter:

```javascript
const response = await openai.responses.create({
    model: "gpt-4o-mini",
    input: "What is deep research by OpenAI?",
    tools: [{
        type: "file_search",
        vector_store_ids: ["<vector_store_id>"],
    }],
    include: ["output[*].file_search_call.search_results"],
});
console.log(response);
```

#### Metadata Filtering
Filter search results based on file metadata. For example, to retrieve only files of type "blog":

```javascript
const response = await openai.responses.create({
    model: "gpt-4o-mini",
    input: "What is deep research by OpenAI?",
    tools: [{
        type: "file_search",
        vector_store_ids: ["<vector_store_id>"],
        filters: {
            type: "eq",
            key: "type",
            value: "blog"
        }
    }]
});
console.log(response);
```

---

## Supported Files

The following table outlines the supported file formats and their MIME types:

| File Format | MIME Type                                                                                              |
|-------------|--------------------------------------------------------------------------------------------------------|
| .c          | text/x-c                                                                                               |
| .cpp        | text/x-c++                                                                                             |
| .cs         | text/x-csharp                                                                                          |
| .css        | text/css                                                                                               |
| .doc        | application/msword                                                                                     |
| .docx       | application/vnd.openxmlformats-officedocument.wordprocessingml.document                                |
| .go         | text/x-golang                                                                                          |
| .html       | text/html                                                                                              |
| .java       | text/x-java                                                                                            |
| .js         | text/javascript                                                                                        |
| .json       | application/json                                                                                       |
| .md         | text/markdown                                                                                          |
| .pdf        | application/pdf                                                                                        |
| .php        | text/x-php                                                                                             |
| .pptx       | application/vnd.openxmlformats-officedocument.presentationml.presentation                              |
| .py         | text/x-python or text/x-script.python                                                                  |
| .rb         | text/x-ruby                                                                                            |
| .sh         | application/x-sh                                                                                       |
| .tex        | text/x-tex                                                                                             |
| .ts         | application/typescript                                                                                 |
| .txt        | text/plain                                                                                             |

*Note:* For text-based MIME types, the file encoding must be one of utf-8, utf-16, or ascii.

---

## Usage Limitations

The following limitations apply to file search usage:

| Limitation                                             | Description                                                       |
|--------------------------------------------------------|-------------------------------------------------------------------|
| **Project Total Size**                                 | Limited to 100GB for all files per project.                       |
| **Vector Store File Limit**                            | Each vector store can hold a maximum of 10,000 files.             |
| **Individual File Size**                               | Maximum file size is 512MB (approximately 5M tokens per file).      |

---

## File Search Response Format

When the file search tool is used, the response includes:
- A `file_search_call` object that provides the ID and status of the file search.
- A `message` object containing the response text and file citations.

Example Response:
```json
{
  "output": [
    {
      "type": "file_search_call",
      "id": "fs_67c09ccea8c48191ade9367e3ba71515",
      "status": "completed",
      "queries": ["What is deep research?"],
      "search_results": null
    },
    {
      "id": "msg_67c09cd3091c819185af2be5d13d87de",
      "type": "message",
      "role": "assistant",
      "content": [
        {
          "type": "output_text",
          "text": "Deep research is a sophisticated capability that allows for extensive inquiry...",
          "annotations": [
            {
              "type": "file_citation",
              "index": 992,
              "file_id": "file-2dtbBZdjtDKS8eqWxqbgDi",
              "filename": "deep_research_blog.pdf"
            }
          ]
        }
      ]
    }
  ]
}
```

---

## Summary

- **Setup:** Create a vector store, upload files, and add files to the vector store.
- **Usage:** Invoke the file search tool using the Responses API with options for limiting results, including search results, and metadata filtering.
- **Output:** The response includes both a file search call and a message with file citations.
- **Limitations:** Ensure adherence to project and file size limits as outlined.


```
## agent.ts

```typescript
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
async function createVectorStore(name: string): Promise {
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
async function uploadFile(filePath: string): Promise {
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
      fileContent = await Deno.readFile(filePath);
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
async function addFileToVectorStore(vectorStoreId: string, fileId: string): Promise {
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
async function checkFileStatus(vectorStoreId: string): Promise {
  try {
    const result = await openai.vectorStores.files.list({
      vector_store_id: vectorStoreId,
    });
    console.log("File processing status:", result);
    return result;
  } catch (error) {
    console.error("Error checking file status:", error);
    throw error;
  }
}

// Perform file search
async function searchFiles(vectorStoreId: string, query: string, maxResults = 5): Promise {
  try {
    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: query,
      tools: [{
        type: "file_search",
        vector_store_ids: [vectorStoreId],
        max_num_results: maxResults,
      }],
      include: ["output[*].file_search_call.search_results"],
    });
    
    return response;
  } catch (error) {
    console.error("Error searching files:", error);
    throw error;
  }
}

// Main function to demonstrate the API usage
async function main() {
  // Parse command line arguments
  const args = Deno.args;
  
  if (args.length ");
    console.log("  Upload file: deno run --allow-read --allow-env --allow-net agent.ts upload-file ");
    console.log("  Add file to store: deno run --allow-read --allow-env --allow-net agent.ts add-file  ");
    console.log("  Check status: deno run --allow-read --allow-env --allow-net agent.ts check-status ");
    console.log("  Search: deno run --allow-read --allow-env --allow-net agent.ts search  ");
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
      const results = await searchFiles(args[1], args[2]);
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
```

## .env file

Create a `.env` file in the same directory as `agent.ts`:

```
OPENAI_API_KEY=your_openai_api_key_here
```

## Usage Instructions

1. **Create a vector store**:
   ```bash
   deno run --allow-read --allow-env --allow-net agent.ts create-store my-knowledge-base
   ```

2. **Upload a file**:
   ```bash
   deno run --allow-read --allow-env --allow-net agent.ts upload-file ./documents/sample.pdf
   ```

3. **Add file to vector store**:
   ```bash
   deno run --allow-read --allow-env --allow-net agent.ts add-file vector_store_id file_id
   ```

4. **Check processing status**:
   ```bash
   deno run --allow-read --allow-env --allow-net agent.ts check-status vector_store_id
   ```

5. **Search files**:
   ```bash
   deno run --allow-read --allow-env --allow-net agent.ts search vector_store_id "your search query here"
   ```

This implementation provides a complete command-line interface for working with OpenAI's file search API in Deno. It handles environment variables, file uploads (both local and remote), vector store creation, and searching through documents using natural language queries.

Citations:
[1] https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/2592765/b7aa18b9-180c-4950-bda2-c80fcab910e2/paste.txt
[2] https://www.sitepoint.com/deno-file-system/
[3] https://github.com/xataio/mdx-blog/blob/main/semantic-search-openai-typescript-deno.mdx
[4] https://discordeno.js.org/docs/beginner/env
[5] https://jsr.io/@openai/openai
[6] https://stackoverflow.com/questions/78382957/deno-env-get-not-loading-envs-from-env-file
[7] https://deno.land/std@0.215.0/dotenv/mod.ts?s=load
[8] https://ultimatecourses.com/blog/environment-variables-deno
[9] https://docs.deno.com/runtime/reference/env_variables/
[10] https://docs.deno.com/examples/
[11] https://docs.deno.com/runtime/fundamentals/typescript/
[12] https://docs.deno.com/deploy/api/runtime-fs/
[13] https://developers.lseg.com/en/article-catalog/article/developing-typescript-http-rest-api-application-with-deno-runtim
[14] https://github.com/openai/openai-deno-build
[15] https://xata.io/blog/semantic-search-openai-typescript-deno
[16] https://deno.land/x/openai/resources/beta/mod.ts?s=Assistant.ToolResources
[17] https://stackoverflow.com/questions/51941064/how-do-i-read-a-local-file-in-deno
[18] https://deno.com/blog/build-chatgpt-doc-search-with-supabase-fresh
[19] https://deno.com/blog/build-api-express-typescript
[20] https://www.npmjs.com/package/openai
[21] https://blog.ferretdb.io/build-restful-api-deno-oak-ferretdb/
[22] https://www.danielcorin.com/til/deno/intro/
[23] https://github.com/LSEG-API-Samples/Article.RDP.TypeScript.Deno.HTTPRestAPI
[24] https://docs.astro.build/en/guides/environment-variables/
[25] https://docs.deno.com/runtime/reference/cli/repl/
[26] https://blog.hyper.io/loading-dotenv-files-with-deno/
[27] https://docs.deno.com/examples/environment_variables/
[28] https://www.reddit.com/r/Deno/comments/yquzdf/testing_how_do_i_set_environment_variables_for/
[29] https://github.com/denoland/deno/issues/5894
[30] https://community.openai.com/t/best-practices-for-pdf-parsing-with-assistants-api-and-file-search-tool/1105328
[31] https://deno.com/blog/openai_sdk_deno
[32] https://questions.deno.com/m/1307059083224027167
[33] https://stackoverflow.com/questions/62193819/deno-env-is-not-a-function
 