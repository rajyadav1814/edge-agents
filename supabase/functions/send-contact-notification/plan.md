# OpenAI File Search API Overview

The File Search API is a powerful tool available in OpenAI's Responses API that enables models to retrieve information from previously uploaded files through semantic and keyword search. This feature allows you to augment AI models with external knowledge bases without implementing complex retrieval systems yourself.

## Core Functionality

File Search works by creating vector stores and uploading files to them. Once uploaded, files are automatically:
- Parsed into appropriate formats
- Chunked into manageable segments
- Embedded using OpenAI's embedding models
- Made searchable through both semantic and keyword search

This is a fully hosted tool managed by OpenAI, meaning when the model decides to use it, it automatically calls the tool, retrieves relevant information, and incorporates it into responses[1].

## Setup Process

### 1. Create a Vector Store

```typescript
const vectorStore = await openai.vectorStores.create({
  name: "knowledge_base",
});
console.log(vectorStore.id);
```

### 2. Upload Files

Files can be uploaded from local storage or URLs:

```typescript
async function createFile(filePath) {
  let result;
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    // Download from URL
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
    // Handle local file
    const fileContent = fs.createReadStream(filePath);
    result = await openai.files.create({
      file: fileContent,
      purpose: "assistants",
    });
  }
  return result.id;
}
```

### 3. Add Files to Vector Store

```typescript
await openai.vectorStores.files.create(
  vectorStore.id,
  {
    file_id: fileId,
  }
);
```

### 4. Check Processing Status

Before using the files, verify they've been fully processed:

```typescript
const result = await openai.vectorStores.files.list({
  vector_store_id: vectorStore.id,
});
console.log(result);
```

## Using File Search

Once your knowledge base is set up, you can use the file search tool in your API calls:

```typescript
const response = await openai.responses.create({
  model: "gpt-4o-mini",
  input: "What is deep research by OpenAI?",
  tools: [{
    type: "file_search",
    vector_store_ids: [""],
  }],
});
```

The response will include:
- A `file_search_call` output item containing the ID of the search call
- A `message` output item with the model's response and file citations[1][5]

## Advanced Features

### Limiting Search Results

Control the number of results retrieved to reduce token usage and latency:

```typescript
const response = await openai.responses.create({
  model: "gpt-4o-mini",
  input: "What is deep research by OpenAI?",
  tools: [{
    type: "file_search",
    vector_store_ids: [""],
    max_num_results: 2,
  }],
});
```

### Including Search Results in Response

View the actual search results by using the `include` parameter:

```typescript
const response = await openai.responses.create({
  model: "gpt-4o-mini",
  input: "What is deep research by OpenAI?",
  tools: [{
    type: "file_search",
    vector_store_ids: [""],
  }],
  include: ["output[*].file_search_call.search_results"],
});
```

### Metadata Filtering

Filter search results based on file metadata:

```typescript
const response = await openai.responses.create({
  model: "gpt-4o-mini",
  input: "What is deep research by OpenAI?",
  tools: [{
    type: "file_search",
    vector_store_ids: [""],
    filters: {
      type: "eq",
      key: "type",
      value: "blog"
    }
  }],
});
```

### Customizing Chunking Strategy

Adjust how files are split into chunks for indexing:

```typescript
// When adding files to vector store
client.vectorStores.files.create(vectorStoreId, {
  file_id: fileId,
  chunking_strategy: {
    max_chunk_size_tokens: 1000,
    chunk_overlap_tokens: 200
  }
});
```

The default settings are:
- `max_chunk_size_tokens`: 800
- `chunk_overlap_tokens`: 400[8]

Limitations:
- `max_chunk_size_tokens` must be between 100 and 4096
- `chunk_overlap_tokens` must be non-negative and not exceed half of `max_chunk_size_tokens`[8]

### Chunk Ranking Options

Improve result relevance by configuring the ranking system:

```typescript
const assistant = await openai.beta.assistants.create({
  instructions: "You are a helpful assistant.",
  model: "gpt-4o",
  tools: [{ 
    type: "file_search",
    ranking_options: {
      ranker: "default_2024_08_21",
      score_threshold: 0.8
    }
  }],
});
```

Options include:
- `ranker`: Choose between `auto` (latest) or specific versions like `default_2024_08_21`
- `score_threshold`: Value between 0.0 and 1.0, with higher values ensuring only highly relevant chunks are used[8]

### Managing Costs with Expiration Policies

Set expiration policies to control storage costs:

```typescript
let vectorStore = await openai.vectorStores.create({
  name: "rag-store",
  file_ids: ['file_1', 'file_2', 'file_3', 'file_4', 'file_5'],
  expires_after: {
    anchor: "last_active_at",
    days: 7
  }
});
```

Vector stores created using thread helpers have a default expiration policy of 7 days after last activity[8].

## Supported File Types

The File Search API supports numerous file formats, including:

- Text files (.txt, .md)
- Code files (.py, .js, .ts, .c, .cpp, .cs, .java, .rb, .go)
- Documents (.pdf, .doc, .docx, .pptx)
- Web formats (.html, .css)
- Data formats (.json)
- And more[1][5]

For text MIME types, encoding must be utf-8, utf-16, or ASCII.

## System Limitations

- Projects are limited to 100GB total size for all files
- Vector stores are limited to 10,000 files
- Individual files can be max 512MB (approximately 5M tokens per file)[1][5]
- Default token budgets:
  - 4,000 tokens for gpt-3.5-turbo
  - 16,000 tokens for gpt-4 and o-series models[8]

## Pricing

- First 1GB of vector storage is free
- Beyond that, usage is billed at $0.10/GB/day of vector storage
- No additional costs for vector store operations[8]

The File Search API represents a significant advancement in RAG (Retrieval-Augmented Generation) capabilities, allowing developers to easily incorporate knowledge retrieval into their AI applications without building complex infrastructure.

Citations:
[1] https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/2592765/b7aa18b9-180c-4950-bda2-c80fcab910e2/paste.txt
[2] https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/file-search
[3] https://cookbook.openai.com/examples/file_search_responses
[4] https://voicebot.ai/2024/04/17/openai-enhances-assistants-api-with-advanced-file-management-and-cost-control-features/
[5] https://platform.openai.com/docs/guides/tools-file-search
[6] https://platform.openai.com/docs/assistants/whats-new
[7] https://sdtimes.com/softwaredev/openais-assistants-api-update-adds-new-file-search-tool-and-ability-to-set-maximum-token-limits/
[8] https://platform.openai.com/docs/assistants/tools/file-search
[9] https://community.openai.com/t/how-does-openai-assistant-handle-the-data-given-to-in-file-search/733908
[10] https://www.youtube.com/watch?v=xToKwLY03F0
[11] https://platform.openai.com/docs/api-reference/files/retrieve-contents
[12] https://community.openai.com/t/new-tools-for-building-agents-responses-api-web-search-file-search-computer-use-and-agents-sdk/1140896
[13] https://community.openai.com/t/openai-assistants-v2-file-search-tool/817943
[14] https://platform.openai.com/docs/advanced-usage
[15] https://community.openai.com/t/how-to-get-specific-response-type-with-file-search/723292
[16] https://platform.openai.com/docs/api-reference
[17] https://platform.openai.com/docs/assistants/deep-dive
[18] https://community.openai.com/t/embedding-based-search-vs-assistant-file-search/743932
[19] https://community.openai.com/t/assistants-api-file-search-and-vector-stores/863944
[20] https://community.openai.com/t/confused-about-how-to-use-file-search-effectively-with-my-assistant/949811
[21] https://community.openai.com/t/improving-file-search-specificity-w-assistant-for-accurate-document-processing/786327
[22] https://www.youtube.com/watch?v=nHLDNv8r1I0
[23] https://community.openai.com/t/make-assistant-use-file-search-more-pro-actively/763897
[24] https://openai.com/index/new-tools-for-building-agents/
[25] https://www.youtube.com/watch?v=OlwKP62XuAg
[26] https://simonwillison.net/2024/Aug/30/openai-file-search/

