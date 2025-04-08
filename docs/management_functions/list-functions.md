# List Functions

The list-functions edge function provides functionality to list all available edge functions.

## Features

- List all deployed functions
- Filter by status/category
- Detailed function metadata
- Pagination support

## Configuration

Required environment variables:
```
SUPABASE_ACCESS_TOKEN=your_access_token
```

## Usage

```bash
# List all functions
curl https://your-project.supabase.co/functions/v1/list-functions \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}"

# List with filters
curl https://your-project.supabase.co/functions/v1/list-functions?status=active \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}"
```

## API Reference

### Endpoints

GET `/list-functions`

Query parameters:
- `status`: Filter by status (active, inactive)
- `category`: Filter by category (agent, management, communication, integration, utility)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

Response:
```json
{
  "functions": [
    {
      "id": "string",
      "name": "string",
      "category": "string",
      "status": "string",
      "lastDeployed": "string",
      "version": "string"
    }
  ],
  "total": 0,
  "page": 1,
  "limit": 10
}