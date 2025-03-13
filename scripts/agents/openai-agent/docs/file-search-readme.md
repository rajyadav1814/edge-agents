# File Search Agent

A standalone implementation for OpenAI file search capabilities using Deno. This agent allows you to search through documents using OpenAI's vector store and file search functionality.

## Features

- Create vector stores for document search
- Upload files (PDF, text, etc.) to OpenAI
- Add files to vector stores
- Check file processing status
- Search for information in files using natural language queries
- Process entire directories of files
- HTTP server for API access

## Prerequisites

- Deno runtime
- OpenAI API key (set in .env file or environment variables)

## Installation

No installation is required beyond having Deno installed. The implementation uses Deno's module system to import dependencies directly from URLs.

## Configuration

Create a `.env` file in the same directory as `file-search.ts` with your OpenAI API key:

```
OPENAI_API_KEY=your_openai_api_key_here
```

Alternatively, you can set the environment variable directly when running the script:

```bash
OPENAI_API_KEY=your_openai_api_key_here deno run --allow-net --allow-env --allow-read --allow-write file-search.ts
```

## Usage

### Using Deno Tasks

The easiest way to use the file search agent is with the provided Deno tasks:

```bash
# Show help
deno task file-search

# Create a vector store
deno task file-search create-store my-knowledge-base

# Upload a file
deno task file-search upload-file ./assets/example.pdf

# Add file to vector store
deno task file-search add-file vector_store_id file_id

# Check processing status
deno task file-search check-status vector_store_id

# List all vector stores
deno task file-search list-stores

# Search for information
deno task file-search search vector_store_id "your search query"

# Process all files in a directory
deno task file-search process-directory ./assets vector_store_id

# Start the HTTP server
deno task file-search serve
```

### Direct Command Line Usage

You can also run the script directly with Deno:

```bash
# Show help
deno run --allow-net --allow-env --allow-read --allow-write file-search.ts

# Create a vector store
deno run --allow-net --allow-env --allow-read --allow-write file-search.ts create-store my-knowledge-base

# Upload a file
deno run --allow-net --allow-env --allow-read --allow-write file-search.ts upload-file ./assets/example.pdf

# Add file to vector store
deno run --allow-net --allow-env --allow-read --allow-write file-search.ts add-file vector_store_id file_id

# Check processing status
deno run --allow-net --allow-env --allow-read --allow-write file-search.ts check-status vector_store_id

# List all vector stores
deno run --allow-net --allow-env --allow-read --allow-write file-search.ts list-stores

# Search for information
deno run --allow-net --allow-env --allow-read --allow-write file-search.ts search vector_store_id "your search query"

# Process all files in a directory
deno run --allow-net --allow-env --allow-read --allow-write file-search.ts process-directory ./assets vector_store_id

# Start the HTTP server
deno run --allow-net --allow-env --allow-read --allow-write file-search.ts serve
```

## HTTP API

When running the HTTP server with the `serve` command, you can interact with the file search agent via HTTP requests:

```bash
# Start the server
deno task file-search serve
```

Then send POST requests to `http://localhost:8000` with a JSON body:

```json
{
  "input": "Your query or instruction here"
}
```

Example using curl:

```bash
curl -X POST http://localhost:8000 \
  -H "Content-Type: application/json" \
  -d '{"input": "Create a vector store named my-test-store"}'
```

The response will include:
- `result`: The final output from the agent
- `conversation`: The full conversation history
- `workflow_id`: A unique identifier for the workflow
- `actions`: A list of actions taken during the workflow

## Automated Testing

A test script is provided to automate the process of creating a vector store, uploading a file, and checking the processing status.

### Using Deno Task

```bash
# Run the test script
deno task test-file-search
```

### Using Shell Script

```bash
# Make the script executable (if not already)
chmod +x run-file-search-test.sh

# Run the test script
./run-file-search-test.sh
```

The test script performs the following steps:
1. Creates a vector store named "test-knowledge-base"
2. Uploads the example.pdf file from the assets directory
3. Adds the file to the vector store
4. Checks the initial processing status
5. Waits 10 seconds and checks the status again
6. Saves the vector store ID and file ID to a file for future reference

After running the test, you can use the generated vector store ID to search for information:

```bash
deno task file-search search vector_store_id "your search query"
```

## Manual Workflow Example

If you prefer to run the steps manually, here's a complete workflow example:

1. Create a vector store:
   ```bash
   deno task file-search create-store my-knowledge-base
   # Output: Vector store created with ID: vs_abc123
   ```

2. Upload a file:
   ```bash
   deno task file-search upload-file ./assets/example.pdf
   # Output: File uploaded with ID: file_xyz789
   ```

3. Add the file to the vector store:
   ```bash
   deno task file-search add-file vs_abc123 file_xyz789
   # Output: File file_xyz789 added to vector store vs_abc123
   ```

4. Check the file processing status:
   ```bash
   deno task file-search check-status vs_abc123
   # Output: [File processing status information]
   ```

5. Search for information:
   ```bash
   deno task file-search search vs_abc123 "What is deep research?"
   # Output: [Search results with information from the file]
   ```

## Supported File Types

The file search functionality supports various file formats including:

- PDF documents (.pdf)
- Text files (.txt)
- Markdown files (.md)
- Microsoft Word documents (.doc, .docx)
- Microsoft PowerPoint presentations (.pptx)
- Source code files (.js, .ts, .py, .java, etc.)
- HTML files (.html)
- CSS files (.css)
- JSON files (.json)

For a complete list of supported file formats, refer to the documentation in `docs/plans/file-search.md`.

## Implementation Details

The file search agent is implemented using:

- Deno runtime for TypeScript execution
- OpenAI API for vector stores and file search
- HTTP server for API access
- CLI interface for command-line usage

The implementation follows a modular approach with separate functions for:
- Vector store management
- File upload and processing
- File search
- Agent conversation handling
- CLI command processing
- HTTP API handling

## Importing as a Module

You can also import the file search functionality into your own Deno scripts:

```typescript
import {
  createVectorStore,
  uploadFile,
  addFileToVectorStore,
  checkFileStatus,
  listVectorStores,
  searchFiles,
  processDirectoryFiles,
  runFileSearchAgent,
} from "./file-search.ts";

// Example usage
const vectorStoreId = await createVectorStore("my-knowledge-base");
const fileId = await uploadFile("./assets/example.pdf");
await addFileToVectorStore(vectorStoreId, fileId);
const results = await searchFiles("What is deep research?", { vectorStoreId });
console.log(results);
```

## License

[Your License Here]
