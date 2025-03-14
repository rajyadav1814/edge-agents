# Vector File Search Edge Function

A Supabase Edge Function that provides vector search capabilities using OpenAI's vector store API.

## Features

- Create and manage vector stores
- Upload and process files
- Vector search with customizable parameters
- Web search integration
- Hybrid search (vector + keyword)
- Chat interface with context
- Question answering

## API Endpoints

### Create Vector Store
```bash
curl -X POST http://localhost:54321/functions/v1/vector-file/create-store \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-anon-key" \
  -d '{"name": "my-store"}'
```

### Upload File
```bash
curl -X POST http://localhost:54321/functions/v1/vector-file/upload-file \
  -H "Authorization: Bearer your-anon-key" \
  -F "file=@/path/to/file.txt"
```

### Add File to Store
```bash
curl -X POST http://localhost:54321/functions/v1/vector-file/add-file \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-anon-key" \
  -d '{
    "vectorStoreId": "vs_123",
    "fileId": "file_123",
    "chunkingStrategy": {
      "max_chunk_size_tokens": 1000,
      "chunk_overlap_tokens": 200
    }
  }'
```

### Check Status
```bash
curl -X POST http://localhost:54321/functions/v1/vector-file/check-status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-anon-key" \
  -d '{"vectorStoreId": "vs_123"}'
```

### Search
```bash
curl -X POST http://localhost:54321/functions/v1/vector-file/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-anon-key" \
  -d '{
    "vectorStoreId": "vs_123",
    "query": "search query",
    "maxResults": 5,
    "webSearch": {
      "enabled": true
    },
    "hybridSearch": {
      "enabled": true,
      "vectorWeight": 0.7,
      "keywordWeight": 0.3
    }
  }'
```

### Chat
```bash
curl -X POST http://localhost:54321/functions/v1/vector-file/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-anon-key" \
  -d '{
    "vectorStoreId": "vs_123",
    "messages": [
      {
        "role": "user",
        "content": "What is in the document?"
      }
    ],
    "maxResults": 5
  }'
```

### Query
```bash
curl -X POST http://localhost:54321/functions/v1/vector-file/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-anon-key" \
  -d '{
    "vectorStoreId": "vs_123",
    "question": "What is in the document?",
    "maxResults": 5
  }'
```

## Development

1. Install dependencies:
```bash
npm install
```

2. Create .env file:
```bash
OPENAI_API_KEY=your-api-key
```

3. Run tests:
```bash
deno task test
```

4. Deploy:
```bash
deno task deploy
```

## Environment Variables

- `OPENAI_API_KEY`: OpenAI API key for vector store operations