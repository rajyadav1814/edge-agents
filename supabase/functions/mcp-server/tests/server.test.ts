import { assertEquals } from 'https://deno.land/std/testing/asserts.ts';
import { SupabaseMcpServer } from '../core/server.ts';
import { AuthManager } from '../core/auth.ts';

// Mock environment variables for testing
const TEST_SUPABASE_URL = 'https://test-project.supabase.co';
const TEST_SUPABASE_KEY = 'test-key';
const TEST_MCP_SECRET_KEY = 'test-secret-key';

Deno.test('SupabaseMcpServer - Constructor', () => {
  const server = new SupabaseMcpServer(TEST_SUPABASE_URL, TEST_SUPABASE_KEY);
  assertEquals(typeof server, 'object');
});

Deno.test('AuthManager - Constructor', () => {
  const authManager = new AuthManager(TEST_MCP_SECRET_KEY);
  assertEquals(typeof authManager, 'object');
});

Deno.test('AuthManager - validateToken', () => {
  const authManager = new AuthManager(TEST_MCP_SECRET_KEY);
  assertEquals(authManager.validateToken(TEST_MCP_SECRET_KEY), true);
  assertEquals(authManager.validateToken('invalid-token'), false);
});

Deno.test('AuthManager - verifyRequest', () => {
  const authManager = new AuthManager(TEST_MCP_SECRET_KEY);
  
  // Create a mock request with valid token
  const validRequest = new Request('https://example.com', {
    headers: {
      'Authorization': `Bearer ${TEST_MCP_SECRET_KEY}`
    }
  });
  
  // Create a mock request with invalid token
  const invalidRequest = new Request('https://example.com', {
    headers: {
      'Authorization': 'Bearer invalid-token'
    }
  });
  
  // Create a mock request with no token
  const noTokenRequest = new Request('https://example.com');
  
  assertEquals(authManager.verifyRequest(validRequest), true);
  assertEquals(authManager.verifyRequest(invalidRequest), false);
  assertEquals(authManager.verifyRequest(noTokenRequest), false);
});