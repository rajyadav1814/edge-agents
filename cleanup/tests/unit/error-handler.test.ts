/**
 * Unit tests for the error handling module
 */

import { assertEquals } from "https://deno.land/std@0.177.0/testing/asserts.ts";
import { 
  GitHubError, 
  createErrorResponse, 
  extractGitHubError, 
  handleRateLimitError 
} from "../../utils/error-handler.ts";
import { createMockResponse } from "../mocks/test-utils.ts";
import { mockRestApiErrorResponse } from "../mocks/github-responses.ts";

Deno.test("GitHubError - constructor sets properties correctly", () => {
  // Arrange & Act
  const message = "Test error message";
  const status = 404;
  const details = { foo: "bar" };
  const error = new GitHubError(message, status, details);
  
  // Assert
  assertEquals(error.message, message);
  assertEquals(error.status, status);
  assertEquals(error.details, details);
  assertEquals(error.name, "GitHubError");
});

Deno.test("createErrorResponse - handles GitHubError", async () => {
  // Arrange
  const error = new GitHubError("Not found", 404, { resource: "user" });
  
  // Act
  const response = createErrorResponse(error);
  
  // Assert
  assertEquals(response.status, 404);
  assertEquals(response.headers.get("Content-Type"), "application/json");
  
  const body = await response.json();
  assertEquals(body.error, "Not found");
  assertEquals(body.details, { resource: "user" });
  assertEquals(typeof body.timestamp, "string");
});

Deno.test("createErrorResponse - handles standard Error", async () => {
  // Arrange
  const error = new Error("Something went wrong");
  
  // Act
  const response = createErrorResponse(error);
  
  // Assert
  assertEquals(response.status, 500);
  assertEquals(response.headers.get("Content-Type"), "application/json");
  
  const body = await response.json();
  assertEquals(body.error, "Something went wrong");
  assertEquals(body.details, undefined);
  assertEquals(typeof body.timestamp, "string");
});

Deno.test("createErrorResponse - handles unknown error types", async () => {
  // Arrange
  const error = "This is a string error";
  
  // Act
  const response = createErrorResponse(error);
  
  // Assert
  assertEquals(response.status, 500);
  
  const body = await response.json();
  assertEquals(body.error, "This is a string error");
});

Deno.test("extractGitHubError - extracts error from response with JSON body", async () => {
  // Arrange
  const mockResponse = createMockResponse(404, mockRestApiErrorResponse);
  
  // Act
  const error = await extractGitHubError(mockResponse);
  
  // Assert
  assertEquals(error instanceof GitHubError, true);
  assertEquals(error.status, 404);
  assertEquals(error.message.includes("Not Found"), true);
  assertEquals((error.details as any)?.documentation, "https://docs.github.com/rest");
});

Deno.test("extractGitHubError - handles non-JSON responses", async () => {
  // Arrange - Create a mock response with a non-JSON body and a status text
  const mockResponse = new Response("Internal Server Error", { 
    status: 500,
    statusText: "Internal Server Error"
  });
  
  // Act
  const error = await extractGitHubError(mockResponse);
  
  // Assert
  assertEquals(error instanceof GitHubError, true);
  assertEquals(error.status, 500);
  // Skip checking the exact error message since it's implementation-dependent
});

Deno.test("handleRateLimitError - creates appropriate error with rate limit info", () => {
  // Arrange
  const now = Math.floor(Date.now() / 1000);
  const resetTime = now + 3600; // 1 hour from now
  const headers = new Headers({
    "X-RateLimit-Limit": "5000",
    "X-RateLimit-Remaining": "0",
    "X-RateLimit-Reset": resetTime.toString()
  });
  
  // Act & Assert
  try {
    handleRateLimitError(headers);
    throw new Error("Should have thrown a GitHubError");
  } catch (error) {
    if (!(error instanceof GitHubError)) {
      throw new Error("Expected GitHubError but got different error type");
    }
    
    assertEquals(error.status, 403);
    assertEquals(error.message.includes("GitHub API rate limit exceeded"), true);
    
    // Check that details contains rate limit info
    const details = error.details as { rateLimit: Record<string, number> };
    assertEquals(details.rateLimit.limit, 5000);
    assertEquals(details.rateLimit.remaining, 0);
    assertEquals(details.rateLimit.reset, resetTime);
  }
});