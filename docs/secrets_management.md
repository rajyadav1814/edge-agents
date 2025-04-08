# Secrets Management in Supabase Edge Functions

## Overview

Secrets management is a critical aspect of developing secure applications with Supabase Edge Functions. This document outlines the best practices, methods, and tools for managing secrets and environment variables in your edge functions.

## Environment Variables

Supabase Edge Functions support environment variables for storing configuration values and secrets. These variables are accessible within your edge functions using the Deno standard library.

### Accessing Environment Variables

In Deno, environment variables can be accessed using the `Deno.env` API:

```typescript
// Access an environment variable
const apiKey = Deno.env.get("API_KEY");
const databaseUrl = Deno.env.get("DATABASE_URL");

// Provide a default value if the environment variable is not set
const region = Deno.env.get("REGION") || "us-east-1";
```

### Docker Compose Environment Variables

When using Docker Compose, environment variables can be set in the `docker-compose.yml` file. However, it's important to follow these security best practices:

```yaml
services:
  app:
    image: my-app
    environment:
      # Good practice - use environment variables without defaults for sensitive data
      DB_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      
      # Good practice - use environment variables with defaults for non-sensitive data
      LOG_LEVEL: ${LOG_LEVEL:-info}
      PORT: ${PORT:-3000}
      
      # Bad practice - NEVER hardcode sensitive values
      # DB_PASSWORD: password123  # NEVER do this
```

For sensitive information like passwords and secrets, never provide default values in the Docker Compose file. This ensures that the application will fail to start if the required environment variables are not set, rather than using insecure default values.

### Setting Environment Variables

Environment variables can be set in several ways:

#### 1. Supabase Dashboard

Environment variables can be set through the Supabase Dashboard:

1. Navigate to your project in the Supabase Dashboard
2. Go to Settings > API
3. Scroll down to the "Environment Variables" section
4. Add your environment variables

#### 2. Supabase CLI

Environment variables can also be set using the Supabase CLI:

```bash
# Set an environment variable
supabase secrets set MY_API_KEY=your-api-key

# Set multiple environment variables
supabase secrets set MY_API_KEY=your-api-key OTHER_SECRET=another-secret

# Set environment variables from a .env file
supabase secrets set --env-file .env
```

#### 3. Local Development

For local development, you can use a `.env` file with the Supabase CLI:

```bash
# Create a .env file
echo "MY_API_KEY=your-api-key" > .env
echo "DATABASE_URL=postgres://user:password@localhost:5432/db" >> .env

# Start the local development server with environment variables
supabase start --env-file .env
```

## Secret Types

Different types of secrets require different handling approaches:

### API Keys

API keys should always be stored as environment variables and never hardcoded in your source code:

```typescript
// Good practice
const apiKey = Deno.env.get("API_KEY");
if (!apiKey) {
  throw new Error("API_KEY environment variable is required");
}

// Bad practice - NEVER do this
const apiKey = "sk_live_1234567890abcdefghijklmnopqrstuvwxyz";
```

### Database Credentials

Database credentials should be stored as environment variables:

```typescript
const databaseUrl = Deno.env.get("DATABASE_URL");
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Create a database client
const client = createClient(databaseUrl);
```

### JWT Secrets

JWT secrets should be stored as environment variables:

```typescript
const jwtSecret = Deno.env.get("JWT_SECRET");
if (!jwtSecret) {
  throw new Error("JWT_SECRET environment variable is required");
}

// Verify a JWT token
const payload = await verifyJWT(token, jwtSecret);
```

### Service Account Credentials

Service account credentials for external services should be stored as environment variables:

```typescript
const serviceAccountKey = Deno.env.get("SERVICE_ACCOUNT_KEY");
if (!serviceAccountKey) {
  throw new Error("SERVICE_ACCOUNT_KEY environment variable is required");
}

// Parse the service account key
const serviceAccount = JSON.parse(serviceAccountKey);
```

## Best Practices

### 1. Never Hardcode Secrets

Never hardcode secrets in your source code or configuration files. Always use environment variables:

```typescript
// Good practice
const apiKey = Deno.env.get("API_KEY");

// Bad practice in code - NEVER do this
const apiKey = "sk_live_1234567890abcdefghijklmnopqrstuvwxyz";
```

```yaml
# Bad practice in Docker Compose - NEVER do this
environment:
  DB_PASSWORD: postgres
  JWT_SECRET: supersecretkey

# Good practice in Docker Compose
environment:
  DB_PASSWORD: ${DB_PASSWORD}
  JWT_SECRET: ${JWT_SECRET}
```

### 2. Validate Environment Variables

Always validate that required environment variables are set:

```typescript
const apiKey = Deno.env.get("API_KEY");
if (!apiKey) {
  throw new Error("API_KEY environment variable is required");
}
```

### 3. Use Different Secrets for Different Environments

Use different secrets for development, staging, and production environments:

```typescript
const environment = Deno.env.get("ENVIRONMENT") || "development";
const apiKey = Deno.env.get(`${environment.toUpperCase()}_API_KEY`);
```

### 4. Rotate Secrets Regularly

Rotate secrets regularly to minimize the impact of potential leaks:

```typescript
// Check if the secret is expired
const secretExpiry = Deno.env.get("SECRET_EXPIRY");
if (secretExpiry && new Date(secretExpiry) < new Date()) {
  console.warn("Secret is expired. Please rotate the secret.");
}
```

### 5. Limit Secret Access

Limit access to secrets to only the functions that need them:

```typescript
// Only load the API key if the function needs it
if (functionName === "api-function") {
  const apiKey = Deno.env.get("API_KEY");
  // Use the API key
}
```

### 6. Log Secret Usage

Log when secrets are used, but never log the secrets themselves:

```typescript
// Good practice
console.log("Using API key for service XYZ");

// Bad practice - NEVER do this
console.log(`Using API key: ${apiKey}`);
```

### 7. Use Secret Management Services

For more complex applications, consider using dedicated secret management services like HashiCorp Vault, AWS Secrets Manager, or Google Secret Manager:

```typescript
// Example using a hypothetical secret management service
const secretManager = createSecretManager({
  region: Deno.env.get("REGION") || "us-east-1",
  credentials: {
    accessKeyId: Deno.env.get("AWS_ACCESS_KEY_ID"),
    secretAccessKey: Deno.env.get("AWS_SECRET_ACCESS_KEY"),
  },
});

const apiKey = await secretManager.getSecret("API_KEY");
```

## Environment-Specific Configuration

Different environments (development, staging, production) often require different configuration values. Here's how to handle environment-specific configuration:

```typescript
// Get the current environment
const environment = Deno.env.get("ENVIRONMENT") || "development";

// Load environment-specific configuration
const config = {
  development: {
    apiUrl: "https://dev-api.example.com",
    logLevel: "debug",
  },
  staging: {
    apiUrl: "https://staging-api.example.com",
    logLevel: "info",
  },
  production: {
    apiUrl: "https://api.example.com",
    logLevel: "warn",
  },
}[environment];

// Use the configuration
console.log(`Using API URL: ${config.apiUrl}`);
console.log(`Log level: ${config.logLevel}`);
```

## Security Considerations

### 1. Docker Compose Security

When using Docker Compose, be aware of these security considerations:

1. **Never commit `.env` files to version control**
2. **Never provide default values for sensitive environment variables in docker-compose.yml**
3. **Use separate docker-compose files for different environments**
4. **Consider using Docker secrets for sensitive information in production**

```bash
# Example of using Docker secrets
echo "my_secret_password" | docker secret create db_password -

# Reference the secret in docker-compose.yml
services:
  app:
    secrets:
      - db_password
    environment:
      DB_PASSWORD_FILE: /run/secrets/db_password

secrets:
  db_password:
    external: true
```

### 2. Encryption

Sensitive environment variables should be encrypted at rest:

```typescript
// Example of decrypting an encrypted environment variable
const encryptedApiKey = Deno.env.get("ENCRYPTED_API_KEY");
if (!encryptedApiKey) {
  throw new Error("ENCRYPTED_API_KEY environment variable is required");
}

const encryptionKey = Deno.env.get("ENCRYPTION_KEY");
if (!encryptionKey) {
  throw new Error("ENCRYPTION_KEY environment variable is required");
}

const apiKey = decrypt(encryptedApiKey, encryptionKey);
```

### 3. Least Privilege

Follow the principle of least privilege when setting up service accounts and API keys:

```typescript
// Example of using a service account with limited permissions
const serviceAccount = JSON.parse(Deno.env.get("SERVICE_ACCOUNT") || "{}");
if (!serviceAccount.project_id) {
  throw new Error("SERVICE_ACCOUNT environment variable is required");
}

// Check if the service account has the required permissions
if (!serviceAccount.permissions.includes("storage.objects.read")) {
  throw new Error("Service account does not have required permissions");
}
```

### 4. Secret Scanning

Implement secret scanning in your CI/CD pipeline to prevent accidental secret leaks:

```bash
# Example of using a secret scanning tool in a CI/CD pipeline
npm install -g secret-scanner
secret-scanner scan --path ./src
```

## Troubleshooting

### 1. Environment Variables Not Available

If environment variables are not available in your edge function, check the following:

1. Verify that the environment variables are set in the Supabase Dashboard or using the Supabase CLI
2. Check for typos in the environment variable names
3. Ensure that the environment variables are set for the correct environment

### 2. Environment Variables Not Updating

If environment variables are not updating after changes, try the following:

1. Redeploy the edge function
2. Restart the local development server
3. Clear the browser cache

## Resources

- [Deno Environment Variables Documentation](https://deno.land/manual/runtime/environment_variables)
- [Supabase CLI Documentation](https://supabase.com/docs/reference/cli)
- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)

---

Created by rUv, Agentics Foundation founder.