/**
 * Test utilities for GitHub API integration tests
 */

import { EnvConfig } from "../../utils/env-validator.ts";

/**
 * Creates a mock environment configuration for testing
 */
export function createMockConfig(): EnvConfig {
  return {
    githubToken: "mock-github-token",
    githubOrg: "mock-org",
    githubApiVersion: "v3",
    webhookSecret: "mock-webhook-secret",
    cacheTtl: 300
  };
}

/**
 * Creates a mock Request object for testing
 */
export function createMockRequest(
  method = "GET",
  path = "/",
  body?: unknown,
  headers: Record<string, string> = {}
): Request {
  const url = new URL(`https://example.com/github-api${path}`);
  
  const requestInit: RequestInit = {
    method,
    headers: new Headers({
      "Content-Type": "application/json",
      ...headers
    })
  };
  
  if (body) {
    requestInit.body = JSON.stringify(body);
  }
  
  return new Request(url, requestInit);
}

/**
 * Creates a mock Response object for testing
 */
export function createMockResponse(
  status = 200,
  body?: unknown,
  headers: Record<string, string> = {}
): Response {
  const responseInit: ResponseInit = {
    status,
    headers: new Headers({
      "Content-Type": "application/json",
      ...headers
    })
  };
  
  return new Response(
    body ? JSON.stringify(body) : null,
    responseInit
  );
}

/**
 * Mocks the global fetch function for testing
 */
export function mockFetch(response: Response): () => void {
  const originalFetch = globalThis.fetch;
  
  // @ts-ignore - Mocking global fetch
  globalThis.fetch = async (): Promise<Response> => {
    return response;
  };
  
  // Return a function to restore the original fetch
  return () => {
    // @ts-ignore - Restoring global fetch
    globalThis.fetch = originalFetch;
  };
}

/**
 * Spy on console methods for testing
 */
export function spyOnConsole(): { 
  log: string[], 
  error: string[], 
  restore: () => void 
} {
  const logs: string[] = [];
  const errors: string[] = [];
  
  const originalLog = console.log;
  const originalError = console.error;
  
  console.log = (...args: unknown[]) => {
    logs.push(args.map(arg => String(arg)).join(' '));
  };
  
  console.error = (...args: unknown[]) => {
    errors.push(args.map(arg => String(arg)).join(' '));
  };
  
  return {
    log: logs,
    error: errors,
    restore: () => {
      console.log = originalLog;
      console.error = originalError;
    }
  };
}

/**
 * Mock Deno.env for testing
 */
export function mockDenoEnv(env: Record<string, string>): () => void {
  const originalGet = Deno.env.get;
  
  Deno.env.get = (key: string): string | undefined => {
    return env[key];
  };
  
  return () => {
    Deno.env.get = originalGet;
  };
}