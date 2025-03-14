# Deploy Function

The deploy-function edge function provides utilities for deploying other edge functions.

## Features

- Function deployment automation
- Environment variable management
- Deployment verification
- Rollback support

## Configuration

Required environment variables:
```
SUPABASE_ACCESS_TOKEN=your_access_token
```

## Usage

```bash
# Deploy a function
curl -X POST https://your-project.supabase.co/functions/v1/deploy-function \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -d '{"function": "hello-world"}'

# Deploy with environment variables
curl -X POST https://your-project.supabase.co/functions/v1/deploy-function \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -d '{
    "function": "hello-world",
    "env": {
      "MY_VAR": "value"
    }
  }'
```

## API Reference

### Endpoints

POST `/deploy-function`

Request body:
```json
{
  "function": "string",
  "env": {
    "key": "value"
  }
}
```

Response:
```json
{
  "success": true,
  "deploymentId": "string",
  "function": "string",
  "status": "deployed"
}