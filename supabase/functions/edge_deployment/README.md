# Edge Deployment Function

A Supabase Edge Function for managing other Edge Functions programmatically. This function provides a RESTful API for listing, creating, updating, and deleting Edge Functions in your Supabase project.

## Features

- List all Edge Functions in your Supabase project
- Get details of a specific Edge Function
- Get the body (code) of a specific Edge Function
- Create a new Edge Function
- Update an existing Edge Function
- Delete an Edge Function

## Prerequisites

- [Deno](https://deno.land/#installation)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- Supabase project with Edge Functions enabled

## Environment Variables

The function requires the following environment variables:

- `VITE_SUPABASE_PROJECT_ID`: Your Supabase project ID
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_KEY`: Your Supabase service role key (for authentication)

## Installation

1. Clone this repository
2. Navigate to the function directory: `cd supabase/functions/edge_deployment`
3. Build the function: `./build.sh`
4. Deploy the function: `./build.sh --deploy`

## API Endpoints

### List all Edge Functions

```
GET /edge_deployment/list
```

Returns a list of all Edge Functions in your Supabase project.

### Get details of a specific Edge Function

```
GET /edge_deployment/get/{slug}
```

Returns details of the specified Edge Function.

### Get the body of a specific Edge Function

```
GET /edge_deployment/body/{slug}
```

Returns the body (code) of the specified Edge Function.

### Create a new Edge Function

```
POST /edge_deployment/create
```

Creates a new Edge Function with the specified details.

Request body:
```json
{
  "slug": "function-name",
  "name": "Function Name",
  "code": "// Function code here",
  "verify_jwt": false
}
```

### Update an existing Edge Function

```
POST /edge_deployment/update
```

Updates an existing Edge Function with the specified details.

Request body:
```json
{
  "slug": "function-name",
  "name": "New Function Name",
  "code": "// Updated function code here",
  "verify_jwt": true
}
```

### Delete an Edge Function

```
GET /edge_deployment/delete/{slug}
```

Deletes the specified Edge Function.

### Help

```
GET /edge_deployment/help
```

Returns information about the available endpoints.

## Development

### Project Structure

- `src/`: Source code directory
  - `config.ts`: Configuration and environment variables
  - `api-client.ts`: API client for interacting with the Supabase Edge Function API
  - `commands.ts`: Command handlers for the Edge Function API
  - `index.ts`: Main entry point for the Edge Function
- `index.ts`: Entry point for the Edge Function
- `deno.json`: Deno configuration file
- `import_map.json`: Import map for dependencies
- `build.sh`: Build script for bundling and deploying the Edge Function

### Building and Deploying

To build the function:

```bash
./build.sh
```

To build and deploy the function:

```bash
./build.sh --deploy
```

## License

MIT
