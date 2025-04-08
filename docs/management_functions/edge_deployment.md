# Edge Deployment Function

The `edge_deployment` function provides tools for deploying and managing Supabase Edge Functions.

## Overview

This function simplifies the process of deploying, updating, and managing Edge Functions in a Supabase project. It provides a command-line interface and programmatic API for common deployment tasks.

## Features

- Deploy new Edge Functions
- Update existing Edge Functions
- List deployed functions
- Get function details
- Delete functions
- Run functions locally for testing

## Architecture

The Edge Deployment function is organized into several components:

- Command-line interface
- API client for Supabase Functions API
- Configuration management
- Deployment utilities

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SUPABASE_ACCESS_TOKEN` | Supabase access token for API authentication | Required |
| `SUPABASE_PROJECT_ID` | ID of the Supabase project | Required |
| `FUNCTION_DEPLOY_PATH` | Path to the functions to deploy | `./functions` |

## Usage

### Command Line

The function provides several shell scripts for common operations:

- `build.sh`: Build functions for deployment
- `list-functions.sh`: List all deployed functions
- `run-and-list.sh`: Run a function locally and list all functions
- `run-local.sh`: Run a function locally for testing

### API

The function can also be used programmatically:

```typescript
import { deployFunction, listFunctions, deleteFunction } from './edge_deployment';

// Deploy a function
await deployFunction('my-function', './path/to/function');

// List all functions
const functions = await listFunctions();

// Delete a function
await deleteFunction('my-function');
```

## Deployment Process

1. Build the function code
2. Package the function into a deployable format
3. Upload the function to Supabase
4. Configure the function settings
5. Activate the function

## Security Considerations

- Access tokens should be kept secure
- Function code should be reviewed before deployment
- Functions should follow the principle of least privilege
- Sensitive information should be stored in environment variables, not in the function code