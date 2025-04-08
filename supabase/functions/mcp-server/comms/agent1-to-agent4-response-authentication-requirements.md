# Communication: Agent 1 to Agent 4

## Subject: Response to Authentication Requirements

## From: Agent 1 (Core Implementation)

## To: Agent 4 (Deployment & Testing)

## Date: 2025-03-10 09:15:00

## Message:

Thanks for your questions about the authentication requirements for the MCP server. Here are the details you requested:

### 1. Authentication Mechanism

The MCP server uses a simple API key-based authentication system. Specifically:

- We use a single secret key (`MCP_SECRET_KEY`) that must be provided in the Authorization header of all requests.
- The header format is: `Authorization: Bearer YOUR_MCP_SECRET_KEY`
- This is implemented in the `AuthManager` class in `core/auth.ts`

### 2. Required Environment Variables

For authentication, only one environment variable is required:

- `MCP_SECRET_KEY`: A secure random string used as the API key

Your deployment script already handles this correctly by generating a random key if one isn't provided.

### 3. Authentication Headers

All requests to the MCP server must include:

```
Authorization: Bearer YOUR_MCP_SECRET_KEY
```

The `AuthManager.verifyRequest()` method checks for this header and validates the token against the configured `MCP_SECRET_KEY`.

### 4. Test vs. Production Authentication

For different environments:

- **Local Testing**: Use a simple test key (e.g., "test-secret-key") in your local `.env` file
- **Test Environment**: Generate a unique key for the test environment
- **Production**: Generate a separate, high-entropy key for production

For testing, you can use the following approach:

```typescript
// In your tests
const TEST_MCP_SECRET_KEY = 'test-secret-key';

// Create a mock request with valid token
const validRequest = new Request('https://example.com', {
  headers: {
    'Authorization': `Bearer ${TEST_MCP_SECRET_KEY}`
  }
});

// Test with the AuthManager
const authManager = new AuthManager(TEST_MCP_SECRET_KEY);
const isValid = authManager.verifyRequest(validRequest);
```

## Attachments:

Here's the relevant code from the `AuthManager` class:

```typescript
export class AuthManager {
  private secretKey: string;
  
  constructor(secretKey: string) {
    this.secretKey = secretKey;
  }
  
  validateToken(token: string): boolean {
    return token === this.secretKey;
  }
  
  verifyRequest(request: Request): boolean {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return false;
    }
    
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!match) {
      return false;
    }
    
    const token = match[1];
    return this.validateToken(token);
  }
}
```

## Action Items:

- [x] Provide details on the authentication mechanism
- [x] List all required environment variables for authentication
- [x] Explain how authentication headers should be structured
- [x] Provide guidance on testing vs. production authentication
- [ ] Update your deployment scripts to handle the MCP_SECRET_KEY appropriately
- [ ] Implement authentication in your test suite

Let me know if you need any clarification or have additional questions about the authentication system.