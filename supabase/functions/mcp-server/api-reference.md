# Supabase Edge Functions API Reference

This document provides a reference for the Supabase Edge Functions API endpoints used in the MCP server deployment script.

## Authentication

All API requests require authentication using the Supabase service role key:

```
Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
```

## API Endpoints

### Deploy a Function

This is the recommended endpoint for deploying edge functions. It will create the function if it doesn't exist.

```
POST /v1/projects/{ref}/functions/deploy
```

#### Path Parameters
- `ref` (required): Project reference ID

#### Query Parameters
- `slug` (optional): Function slug
- `bundleOnly` (optional): Boolean

#### Request Body
Content-Type: `multipart/form-data`

- `file` (required): Array of strings
- `metadata` (required): Object containing function metadata

#### Response (201)
```json
{
  "version": 42,
  "created_at": 42,
  "updated_at": 42,
  "id": "lorem",
  "slug": "lorem",
  "name": "lorem",
  "status": "ACTIVE",
  "verify_jwt": true,
  "import_map": true,
  "entrypoint_path": "lorem",
  "import_map_path": "lorem"
}
```

### Bulk Update Functions

Updates multiple functions at once. It will create a new function or replace existing ones.

```
PUT /v1/projects/{ref}/functions
```

#### Path Parameters
- `ref` (required): Project reference ID

#### Request Body
Content-Type: `application/json`

Array of objects, each containing function details.

#### Response (200)
```json
{
  "functions": [
    {
      "version": 42,
      "created_at": 42,
      "updated_at": 42,
      "id": "lorem",
      "slug": "lorem",
      "name": "lorem",
      "status": "ACTIVE",
      "verify_jwt": true,
      "import_map": true,
      "entrypoint_path": "lorem",
      "import_map_path": "lorem"
    }
  ]
}
```

### Create a Function (Deprecated)

This endpoint is deprecated - use the deploy endpoint instead.

```
POST /v1/projects/{ref}/functions
```

#### Path Parameters
- `ref` (required): Project reference ID

#### Query Parameters
- `slug` (optional): Function slug
- `name` (optional): Function name
- `verify_jwt` (optional): Boolean
- `import_map` (optional): Boolean
- `entrypoint_path` (optional): String
- `import_map_path` (optional): String

#### Request Body
Content-Type: `application/json`

- `slug` (required): String
- `name` (required): String
- `body` (required): String
- `verify_jwt` (optional): Boolean

#### Response (201)
```json
{
  "version": 42,
  "created_at": 42,
  "updated_at": 42,
  "id": "lorem",
  "slug": "lorem",
  "name": "lorem",
  "status": "ACTIVE",
  "verify_jwt": true,
  "import_map": true,
  "entrypoint_path": "lorem",
  "import_map_path": "lorem"
}
```

### List All Functions

Returns all functions in the specified project.

```
GET /v1/projects/{ref}/functions
```

#### Path Parameters
- `ref` (required): Project reference ID

#### Response (200)
```json
[
  {
    "version": 42,
    "created_at": 42,
    "updated_at": 42,
    "id": "lorem",
    "slug": "lorem",
    "name": "lorem",
    "status": "ACTIVE",
    "verify_jwt": true,
    "import_map": true,
    "entrypoint_path": "lorem",
    "import_map_path": "lorem"
  }
]
```

### Retrieve a Function

Retrieves a function with the specified slug and project.

```
GET /v1/projects/{ref}/functions/{function_slug}
```

#### Path Parameters
- `ref` (required): Project reference ID
- `function_slug` (required): Function slug

#### Response (200)
```json
{
  "version": 42,
  "created_at": 42,
  "updated_at": 42,
  "id": "lorem",
  "slug": "lorem",
  "name": "lorem",
  "status": "ACTIVE",
  "verify_jwt": true,
  "import_map": true,
  "entrypoint_path": "lorem",
  "import_map_path": "lorem"
}
```

### Delete a Function

Deletes a function with the specified slug from the specified project.

```
DELETE /v1/projects/{ref}/functions/{function_slug}
```

#### Path Parameters
- `ref` (required): Project reference ID
- `function_slug` (required): Function slug

#### Response (200)
```json
{}