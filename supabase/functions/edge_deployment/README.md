# Edge Function Deployment API

This Edge Function provides an API for deploying other Edge Functions using the Supabase Management API.

## Environment Variables

Required environment variables:

- `VITE_SUPABASE_PROJECT_ID`: Your Supabase project ID
- `SUPABASE_PERSONAL_ACCESS_TOKEN`: Your Supabase personal access token

## API Usage

Send a POST request with the following JSON body:

```json
{
  "slug": "function-name",
  "filePath": "path/to/function/index.ts"
}
```

Example using curl:

```bash
curl -X POST 'https://[project-ref].supabase.co/functions/v1/edge_deployment' \
  -H 'Authorization: Bearer [access-token]' \
  -H 'Content-Type: application/json' \
  -d '{"slug": "hello-world", "filePath": "supabase/functions/hello-world/index.ts"}'
```

## Response

Success response:

```json
{
  "id": "4be5f143-61c2-411c-9b3b-8e32a8d11062",
  "slug": "hello-world",
  "name": "hello-world",
  "version": 1,
  "status": "ACTIVE",
  "created_at": 1741704172280,
  "updated_at": 1741704172280,
  "verify_jwt": true
}
```

Error response:

```json
{
  "error": "Error message here"
}
```

## Local Development

1. Install Supabase CLI
2. Set required environment variables
3. Run `deno task start` to start the function locally
