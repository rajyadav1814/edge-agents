# Vector File

The vector-file edge function provides operations for working with vector files and embeddings.

## Features

- Vector file processing
- Embedding generation
- Vector store management
- Hybrid search capabilities

## Configuration

Required environment variables:
```
OPENAI_API_KEY=your_api_key
```

## Usage

```bash
# Create a vector store
curl -X POST https://your-project.supabase.co/functions/v1/vector-file/create-store \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -d '{
    "name": "my-store",
    "expiresAfter": "30d"
  }'

# Upload a file
curl -X POST https://your-project.supabase.co/functions/v1/vector-file/upload-file \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -F "file=@path/to/file.txt"

# Add file to vector store
curl -X POST https://your-project.supabase.co/functions/v1/vector-file/add-file \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -d '{
    "vectorStoreId": "store-id",
    "fileId": "file-id"
  }'

# Search vectors
curl -X POST https://your-project.supabase.co/functions/v1/vector-file/search \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -d '{
    "vectorStoreId": "store-id",
    "query": "search text",
    "maxResults": 5,
    "hybridSearch": {
      "enabled": true,
      "vectorWeight": 0.7,
      "keywordWeight": 0.3
    }
  }'
```

## API Reference

### Endpoints

POST `/vector-file/create-store`
- Create a new vector store

POST `/vector-file/upload-file`
- Upload a file for processing

POST `/vector-file/add-file`
- Add a file to a vector store

POST `/vector-file/search`
- Search vectors with optional hybrid search

POST `/vector-file/chat`
- Chat with context from vector store and web search

POST `/vector-file/query`
- Query with context from vector store and web search

### Models

The function uses the following OpenAI models:
- gpt-4o-mini: For chat and query responses
- gpt-4o-search-preview: For web search integration