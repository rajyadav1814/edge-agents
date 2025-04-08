# Deploy Function

A Supabase Edge Function for deploying TypeScript code to Supabase Functions.

## Environment Variables Required

```bash
SUPABASE_PROJECT_ID=your_project_id
SUPABASE_PERSONAL_ACCESS_TOKEN=your_access_token
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## API Endpoints

### POST /

Accepts two types of requests:

#### 1. Direct Code Submission
Content-Type: application/json

Request body:
```json
{
  "code": "console.log('Hello')",
  "name": "function-name.ts",
  "entrypoint_path": "index.ts"
}
```

#### 2. File Upload
Content-Type: multipart/form-data

Form fields:
- file: TypeScript file
- metadata: JSON string containing:
  ```json
  {
    "name": "function-name.ts",
    "entrypoint_path": "index.ts"
  }
  ```

### Response

Success Response:
```json
{
  "success": true,
  "filename": "function-name.ts",
  "size": 123,
  "type": "application/typescript",
  "metadata": {
    "name": "function-name.ts",
    "entrypoint_path": "index.ts"
  },
  "content_preview": "first 100 characters..."
}
```

Error Response:
```json
{
  "error": "Error message"
}
```

## Local Development

1. Create a .env file with required environment variables
2. Run the function:
```bash
deno run --allow-net index.ts
```

## Testing

Test direct code submission:
```bash
curl -X POST "http://localhost:8000" \
  -H "Content-Type: application/json" \
  -d '{"code":"console.log(\"Hello\")", "name":"test.ts", "entrypoint_path":"index.ts"}'
```

Test file upload:
```bash
curl -X POST "http://localhost:8000" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/file.ts" \
  -F 'metadata={"name":"test.ts","entrypoint_path":"index.ts"}'