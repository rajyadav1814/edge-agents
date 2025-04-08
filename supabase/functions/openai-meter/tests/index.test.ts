import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { handler } from "../index.ts";
import {
  setupTestEnvironment,
  cleanupTestEnvironment,
  createTestRequest,
  mockOpenAIRequest,
  mockOpenAIResponse,
  testHeaders,
  assertErrorResponse,
  mockFetch,
  testMessages,
} from "./test_context.ts";
import { StatusCodes, ErrorTypes, OpenAIRequest, ChatMessage } from "../api-contract.ts";

let originalFetch: typeof fetch;

Deno.test({
  name: "OpenAI Proxy Tests",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async (t) => {
    // Setup test environment
    setupTestEnvironment();

    await t.step("should handle CORS preflight", async () => {
      const req = new Request("http://localhost:8000/openai-meter", {
        method: "OPTIONS",
        headers: testHeaders.validOrigin,
      });
      const response = await handler(req);
      assertEquals(response.status, StatusCodes.NO_CONTENT);
      assertEquals(
        response.headers.get("Access-Control-Allow-Origin"),
        "http://localhost:3000"
      );
    });

    await t.step("should validate request method", async () => {
      const req = new Request("http://localhost:8000/openai-meter", {
        method: "GET",
      });
      const response = await handler(req);
      assertErrorResponse(
        response,
        StatusCodes.METHOD_NOT_ALLOWED,
        ErrorTypes.METHOD_NOT_ALLOWED
      );
    });

    await t.step("should handle successful request", async () => {
      // Save original fetch
      originalFetch = globalThis.fetch;
      // Mock OpenAI response
      mockFetch(new Response(JSON.stringify(mockOpenAIResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }));

      const req = createTestRequest("POST", mockOpenAIRequest, testHeaders.validAuth);
      const response = await handler(req);
      assertEquals(response.status, StatusCodes.OK);

      // Reset fetch
      globalThis.fetch = originalFetch;
    });

    await t.step("should handle invalid JSON", async () => {
      const req = new Request("http://localhost:8000/openai-meter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: "invalid json",
      });
      const response = await handler(req);
      assertErrorResponse(
        response,
        StatusCodes.BAD_REQUEST,
        ErrorTypes.VALIDATION_ERROR
      );
    });

    await t.step("should validate request payload", async () => {
      const invalidRequest: OpenAIRequest = {
        model: "invalid",
        messages: [] as ChatMessage[], // Empty messages array should fail validation
      };
      const req = createTestRequest("POST", invalidRequest, testHeaders.validAuth);
      const response = await handler(req);
      assertErrorResponse(
        response,
        StatusCodes.BAD_REQUEST,
        ErrorTypes.VALIDATION_ERROR
      );
    });

    await t.step("should validate message format", async () => {
      const invalidRequest: OpenAIRequest = {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "invalid" as "user", // Type assertion to satisfy compiler
            content: "test",
          },
        ],
      };
      const req = createTestRequest("POST", invalidRequest, testHeaders.validAuth);
      const response = await handler(req);
      assertErrorResponse(
        response,
        StatusCodes.BAD_REQUEST,
        ErrorTypes.VALIDATION_ERROR
      );
    });

    await t.step("should handle OpenAI errors", async () => {
      // Mock OpenAI error response
      originalFetch = globalThis.fetch;
      mockFetch(new Response(JSON.stringify({
        error: { message: "OpenAI error" },
      }), { status: 400 }));

      const req = createTestRequest("POST", mockOpenAIRequest, testHeaders.validAuth);
      const response = await handler(req);
      assertErrorResponse(
        response,
        StatusCodes.INTERNAL_SERVER_ERROR,
        ErrorTypes.INTERNAL_ERROR
      );

      // Reset fetch
      globalThis.fetch = originalFetch;
    });

    // Cleanup test environment
    cleanupTestEnvironment();
  },
});
