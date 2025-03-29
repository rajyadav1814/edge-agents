# Anonymizer Implementation

This document describes the technical implementation of the user anonymization system for Supabase Edge Functions using Deno.

## Overview

The anonymizer system uses a daisy-chain approach with three separate edge functions to enhance privacy and security. Each function in the chain has a specific role and limited access to data.

## Components

### 1. Anonymizer Module (`anonymizer.ts`)

The core module that provides anonymization functionality:

- **`createHash()`**: Creates a SHA-256 hash of input data with optional salt
- **`anonymizeUserData()`**: Anonymizes user data based on configuration
- **`forwardToNextFunction()`**: Forwards anonymized data to the next function

### 2. Anonymizer Edge Function (`anonymizer-edge-function.ts`)

The first function in the chain that:

1. Authenticates the user
2. Extracts user data (ID, IP, geolocation, user agent)
3. Anonymizes sensitive data
4. Forwards to the processor function

### 3. Processor Edge Function (`processor-edge-function.ts`)

The middle function that:

1. Receives anonymized data
2. Performs processing on the data
3. Forwards to the finalizer function

### 4. Finalizer Edge Function (`finalizer-edge-function.ts`)

The final function that:

1. Receives processed anonymized data
2. Stores the data in the database
3. Returns the final result

## Data Flow

```
Original Request → Anonymizer → Anonymized Data → Processor → Processed Data → Finalizer → Database
```

## Anonymization Process

The anonymization process uses SHA-256 hashing with an optional salt to create one-way hashes of sensitive data:

```typescript
export async function createHash(input: string, salt?: string): Promise<string> {
  if (!input) return "";
  
  const data = new TextEncoder().encode(salt ? `${input}:${salt}` : input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  
  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
```

## Security Considerations

### 1. Salt Management

The system uses a salt to enhance the security of the hashing process. The salt should be:

- Stored securely as an environment variable
- Unique for each deployment
- Rotated periodically

### 2. Data Isolation

Each function in the chain has access only to the data it needs:

- **Anonymizer**: Has access to original user data but immediately anonymizes it
- **Processor**: Only sees anonymized data, never the original
- **Finalizer**: Only sees processed anonymized data and handles storage

### 3. Authentication

The anonymizer function requires authentication to identify the user. This ensures that:

- Only authenticated users can use the system
- User IDs can be properly anonymized
- Requests can be traced back to users if needed (via the hashed ID)

## Implementation Details

### Anonymizer Configuration

The anonymizer can be configured to anonymize specific fields:

```typescript
export interface AnonymizerConfig {
  enabled: boolean;
  salt?: string;
  fields: {
    userId: boolean;
    ipAddress: boolean;
    geolocation: boolean;
    userAgent: boolean;
  };
  nextFunctionEndpoint?: string;
}
```

### Anonymized Data Structure

The anonymized data structure replaces sensitive fields with hashed versions:

```typescript
export interface AnonymizedData {
  userIdHash?: string;
  ipHash?: string;
  geoHash?: string | null;
  userAgentHash?: string | null;
  timestamp: number;
  [key: string]: any; // Allow additional properties
}
```

### Daisy-Chain Implementation

Each function in the chain forwards data to the next function using the `fetch` API:

```typescript
export async function forwardToNextFunction(
  data: any,
  endpoint: string,
  token?: string
): Promise<Response> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
}
```

## Testing

The system includes a test script (`test-anonymizer-chain.js`) that:

1. Sends a test request to the anonymizer function
2. Verifies that sensitive data is properly anonymized
3. Checks that the entire chain processes the request correctly

## Deployment

The deployment script (`deploy-anonymizer-chain.sh`) automates the deployment of all three functions to Supabase Edge Functions and sets up the necessary environment variables.

## Integration with Existing Systems

To integrate this anonymizer system with existing applications:

1. Replace direct API calls with calls to the anonymizer function
2. Ensure authentication is properly set up
3. Configure the processor function to handle your specific data processing needs
4. Set up the database table for storing anonymized data

## Future Enhancements

Potential enhancements to the system include:

1. **Differential Privacy**: Add noise to the data to enhance privacy
2. **Rate Limiting**: Prevent abuse by limiting requests per user
3. **Encryption**: Add encryption layers between functions
4. **Audit Logging**: Add comprehensive logging for security audits
5. **Multi-Region Deployment**: Deploy functions in different regions for enhanced privacy