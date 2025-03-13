# OpenAI API Test Scripts

This directory contains test scripts for verifying the OpenAI API functionality required by the file-search.ts implementation.

## Available Scripts

### 1. test-openai-api.sh

This script tests the basic OpenAI API functionality:
- Verifies that the API key is valid
- Tests the chat completions API
- Tests the file upload API

#### Usage

```bash
# Make the script executable (if not already)
chmod +x test-openai-api.sh

# Run the script
./test-openai-api.sh
```

### 2. test-vector-store.sh

This script tests the OpenAI Vector Store API functionality:
- Uploads a file to OpenAI
- Creates a vector store
- Adds the file to the vector store
- Checks the status of the file processing
- Tests file search functionality

#### Usage

```bash
# Make the script executable (if not already)
chmod +x test-vector-store.sh

# Run the script
./test-vector-store.sh
```

## Environment Variables

Both scripts use the `.env` file in the parent directory to load the OpenAI API key. The scripts will look for either `OPENAI_API_KEY` or `VITE_OPENAI_API_KEY` in the `.env` file.

Example `.env` file:

```
OPENAI_API_KEY=your_openai_api_key_here
```

or

```
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

## Output

The scripts will output detailed information about each step of the testing process, including:
- API responses
- File IDs
- Vector store IDs
- Error messages (if any)

If the tests are successful, the scripts will save the relevant IDs to a file for future reference.

## Troubleshooting

If you encounter any errors, check the following:

1. Make sure your OpenAI API key is valid and has the necessary permissions
2. Ensure the example.pdf file exists in the assets directory
3. Check your internet connection
4. Verify that the OpenAI API endpoints are available

## Next Steps

After running the tests successfully, you can use the file-search.ts implementation with the generated IDs:

```bash
# Search for information in the vector store
deno task file-search search vector_store_id "your query"
```

The vector store ID and file ID will be saved to a file in the parent directory for easy reference.
