/**
 * Test helpers for OpenAI proxy tests
 */

import type {
  BenchmarkConfig,
  BenchmarkResult,
  BenchmarkMetrics,
  BenchmarkSummary,
  BenchmarkPreset,
  BenchmarkLatency,
  BenchmarkMemory,
} from "./types/benchmark.ts";

export type {
  BenchmarkConfig,
  BenchmarkResult,
  BenchmarkMetrics,
  BenchmarkSummary,
  BenchmarkPreset,
  BenchmarkLatency,
  BenchmarkMemory,
};

/**
 * Mock fetch response type
 */
type MockResponse = Response | Error;

/**
 * Mock fetch state
 */
interface MockFetchState {
  responses: MockResponse[];
  currentIndex: number;
  calls: Request[];
}

/**
 * Global mock state
 */
const mockState: MockFetchState = {
  responses: [],
  currentIndex: 0,
  calls: [],
};

/**
 * Mock fetch implementation
 */
export function mockFetch(responses: MockResponse[]): void {
  mockState.responses = responses;
  mockState.currentIndex = 0;
  mockState.calls = [];

  // Replace global fetch
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const request = input instanceof Request ? input : new Request(input.toString(), init);
    mockState.calls.push(request);

    const response = mockState.responses[mockState.currentIndex];
    mockState.currentIndex = (mockState.currentIndex + 1) % mockState.responses.length;

    if (response instanceof Error) {
      throw response;
    }
    return response;
  };
}

/**
 * Reset fetch mock
 */
export function resetFetchMock(): void {
  mockState.responses = [];
  mockState.currentIndex = 0;
  mockState.calls = [];
}

/**
 * Get mock fetch calls
 */
export function getMockFetchCalls(): Request[] {
  return [...mockState.calls];
}

/**
 * Create test request
 */
export function createTestRequest(
  method: string,
  path: string,
  body?: unknown,
  headers?: Record<string, string>
): Request {
  const url = new URL(path, "http://localhost:8000");
  const init: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (body) {
    init.body = JSON.stringify(body);
  }

  return new Request(url, init);
}

/**
 * Create Stripe event request
 */
export function createStripeEvent(
  type: string,
  data: Record<string, unknown> = {}
): Request {
  const event = {
    id: `evt_${Date.now()}`,
    object: "event",
    api_version: "2020-08-27",
    created: Math.floor(Date.now() / 1000),
    data: {
      object: data,
    },
    livemode: false,
    pending_webhooks: 0,
    request: {
      id: null,
      idempotency_key: null,
    },
    type,
  };

  return createTestRequest(
    "POST",
    "/stripe/webhook",
    event,
    {
      "Stripe-Signature": "test_signature",
    }
  );
}

/**
 * Collect stream response
 */
export async function collectStreamResponse(response: Response): Promise<unknown[]> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Response has no body");
  }

  const decoder = new TextDecoder();
  const chunks: string[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(decoder.decode(value));
  }

  return chunks
    .join("")
    .split("\n")
    .filter((line: string) => line.startsWith("data: "))
    .map((line: string) => JSON.parse(line.replace("data: ", "")))
    .filter((data: unknown) => data !== "[DONE]");
}

/**
 * Mock environment variables
 */
export function mockEnv(vars: Record<string, string> = {}): () => void {
  const original = { ...Deno.env.toObject() };
  
  // Set mock values
  Object.entries(vars).forEach(([key, value]) => {
    Deno.env.set(key, value);
  });

  // Return cleanup function
  return () => {
    // Remove mock values
    Object.keys(vars).forEach(key => {
      Deno.env.delete(key);
    });
    
    // Restore original values
    Object.entries(original).forEach(([key, value]) => {
      Deno.env.set(key, value);
    });
  };
}

/**
 * Wait for condition
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100
): Promise<void> {
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}

/**
 * Mock timer functions
 */
export function mockTimers(): () => void {
  const original = {
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
    setInterval: globalThis.setInterval,
    clearInterval: globalThis.clearInterval,
  };

  const timers = new Set<number>();
  let currentId = 1;

  // Mock setTimeout
  globalThis.setTimeout = ((fn: (...args: unknown[]) => void, delay?: number, ...args: unknown[]) => {
    const id = currentId++;
    timers.add(id);
    original.setTimeout(() => {
      if (timers.has(id)) {
        fn(...args);
        timers.delete(id);
      }
    }, delay || 0);
    return id;
  }) as typeof globalThis.setTimeout;

  // Mock clearTimeout
  globalThis.clearTimeout = ((id?: number) => {
    if (id !== undefined) {
      timers.delete(id);
      original.clearTimeout(id);
    }
  }) as typeof globalThis.clearTimeout;

  // Mock setInterval
  globalThis.setInterval = ((fn: (...args: unknown[]) => void, delay?: number, ...args: unknown[]) => {
    const id = currentId++;
    timers.add(id);
    original.setInterval(() => {
      if (timers.has(id)) {
        fn(...args);
      }
    }, delay || 0);
    return id;
  }) as typeof globalThis.setInterval;

  // Mock clearInterval
  globalThis.clearInterval = ((id?: number) => {
    if (id !== undefined) {
      timers.delete(id);
      original.clearInterval(id);
    }
  }) as typeof globalThis.clearInterval;

  // Return cleanup function
  return () => {
    Object.assign(globalThis, original);
    timers.clear();
  };
}

/**
 * Mock console methods
 */
export function mockConsole(): () => void {
  const logs: unknown[][] = [];
  const errors: unknown[][] = [];
  const warns: unknown[][] = [];

  const original = {
    log: console.log,
    error: console.error,
    warn: console.warn,
  };

  console.log = (...args: unknown[]) => {
    logs.push(args);
  };

  console.error = (...args: unknown[]) => {
    errors.push(args);
  };

  console.warn = (...args: unknown[]) => {
    warns.push(args);
  };

  return () => {
    Object.assign(console, original);
    logs.length = 0;
    errors.length = 0;
    warns.length = 0;
  };
}

/**
 * Create test context
 */
export function createTestContext(): {
  cleanup: () => Promise<void>;
  mockFetch: typeof mockFetch;
  mockEnv: typeof mockEnv;
  mockTimers: typeof mockTimers;
  mockConsole: typeof mockConsole;
  waitFor: typeof waitFor;
} {
  const cleanups: (() => void | Promise<void>)[] = [];

  return {
    cleanup: async () => {
      for (const cleanup of cleanups.reverse()) {
        await cleanup();
      }
      cleanups.length = 0;
    },
    mockFetch: (responses: MockResponse[]) => {
      mockFetch(responses);
      cleanups.push(resetFetchMock);
    },
    mockEnv: (vars: Record<string, string> = {}) => {
      const cleanup = mockEnv(vars);
      cleanups.push(cleanup);
      return cleanup;
    },
    mockTimers: () => {
      const cleanup = mockTimers();
      cleanups.push(cleanup);
      return cleanup;
    },
    mockConsole: () => {
      const cleanup = mockConsole();
      cleanups.push(cleanup);
      return cleanup;
    },
    waitFor,
  };
}