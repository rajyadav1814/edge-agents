/**
 * Unit tests for the response formatting module
 */

import { assertEquals } from "https://deno.land/std@0.177.0/testing/asserts.ts";
import { 
  extractRateLimitInfo, 
  extractPaginationInfo, 
  createSuccessResponse, 
  createEmptyResponse,
  createRedirectResponse
} from "../../utils/response-formatter.ts";

Deno.test("extractRateLimitInfo - extracts rate limit information from headers", () => {
  // Arrange
  const now = Math.floor(Date.now() / 1000);
  const resetTime = now + 3600; // 1 hour from now
  const headers = new Headers({
    "X-RateLimit-Limit": "5000",
    "X-RateLimit-Remaining": "4999",
    "X-RateLimit-Reset": resetTime.toString()
  });
  
  // Act
  const rateLimitInfo = extractRateLimitInfo(headers);
  
  // Assert
  assertEquals(rateLimitInfo.limit, 5000);
  assertEquals(rateLimitInfo.remaining, 4999);
  assertEquals(rateLimitInfo.reset, resetTime);
  assertEquals(typeof rateLimitInfo.resetDate, "string");
});

Deno.test("extractRateLimitInfo - handles missing headers", () => {
  // Arrange
  const headers = new Headers();
  
  // Act
  const rateLimitInfo = extractRateLimitInfo(headers);
  
  // Assert
  assertEquals(rateLimitInfo.limit, 0);
  assertEquals(rateLimitInfo.remaining, 0);
  assertEquals(rateLimitInfo.reset, 0);
  assertEquals(typeof rateLimitInfo.resetDate, "string");
});

Deno.test("extractPaginationInfo - extracts pagination information from Link header", () => {
  // Arrange
  const headers = new Headers({
    "Link": '<https://api.github.com/orgs/mock-org/repos?page=2>; rel="next", <https://api.github.com/orgs/mock-org/repos?page=3>; rel="last"'
  });
  const url = new URL("https://api.github.com/orgs/mock-org/repos?page=1&per_page=30");
  
  // Act
  const paginationInfo = extractPaginationInfo(headers, url);
  
  // Assert
  assertEquals(paginationInfo?.page, 2);
  assertEquals(paginationInfo?.perPage, 30);
  assertEquals(paginationInfo?.hasNextPage, true);
  assertEquals(paginationInfo?.hasPreviousPage, false);
  assertEquals(paginationInfo?.totalItems, undefined);
  assertEquals(paginationInfo?.totalPages, undefined);
});

Deno.test("extractPaginationInfo - handles missing Link header", () => {
  // Arrange
  const headers = new Headers();
  const url = new URL("https://api.github.com/orgs/mock-org/repos");
  
  // Act
  const paginationInfo = extractPaginationInfo(headers, url);
  
  // Assert
  assertEquals(paginationInfo, undefined);
});

Deno.test("extractPaginationInfo - handles prev link", () => {
  // Arrange
  const headers = new Headers({
    "Link": '<https://api.github.com/orgs/mock-org/repos?page=1>; rel="prev", <https://api.github.com/orgs/mock-org/repos?page=3>; rel="next", <https://api.github.com/orgs/mock-org/repos?page=4>; rel="last"'
  });
  const url = new URL("https://api.github.com/orgs/mock-org/repos?page=2&per_page=30");
  
  // Act
  const paginationInfo = extractPaginationInfo(headers, url);
  
  // Assert
  assertEquals(paginationInfo?.page, 2);
  assertEquals(paginationInfo?.perPage, 30);
  assertEquals(paginationInfo?.hasNextPage, true);
  assertEquals(paginationInfo?.hasPreviousPage, true);
});

Deno.test("createSuccessResponse - formats response with data and metadata", async () => {
  // Arrange
  const data = { foo: "bar" };
  const headers = new Headers({
    "X-RateLimit-Limit": "5000",
    "X-RateLimit-Remaining": "4999",
    "X-RateLimit-Reset": "1609459200"
  });
  const url = new URL("https://api.github.com/orgs/mock-org/repos");
  const cacheTtl = 600;
  
  // Act
  const response = createSuccessResponse(data, headers, url, cacheTtl);
  
  // Assert
  assertEquals(response.status, 200);
  assertEquals(response.headers.get("Content-Type"), "application/json");
  assertEquals(response.headers.get("Cache-Control"), "public, max-age=600");
  // Headers are not forwarded in the response
  assertEquals(response.headers.get("X-RateLimit-Limit"), null);
  
  const body = await response.json();
  assertEquals(body.data, data);
  assertEquals(body.meta.rateLimit.limit, 5000);
  assertEquals(body.meta.rateLimit.remaining, 4999);
  assertEquals(body.meta.pagination, undefined);
});

Deno.test("createSuccessResponse - includes pagination info when available", async () => {
  // Arrange
  const data = { foo: "bar" };
  const headers = new Headers({
    "X-RateLimit-Limit": "5000",
    "X-RateLimit-Remaining": "4999",
    "X-RateLimit-Reset": "1609459200",
    "Link": '<https://api.github.com/orgs/mock-org/repos?page=2>; rel="next"'
  });
  const url = new URL("https://api.github.com/orgs/mock-org/repos?page=1&per_page=30");
  
  // Act
  const response = createSuccessResponse(data, headers, url);
  
  // Assert
  const body = await response.json();
  assertEquals(body.meta.pagination?.page, 2);
  assertEquals(body.meta.pagination?.perPage, 30);
  assertEquals(body.meta.pagination?.hasNextPage, true);
});

Deno.test("createEmptyResponse - returns 204 No Content response", async () => {
  // Act
  const response = createEmptyResponse();
  
  // Assert
  assertEquals(response.status, 204);
  assertEquals(await response.text(), "");
  assertEquals(response.headers.get("Access-Control-Allow-Origin"), "*");
});

Deno.test("createRedirectResponse - creates temporary redirect by default", () => {
  // Arrange
  const location = "https://example.com/new-location";
  
  // Act
  const response = createRedirectResponse(location);
  
  // Assert
  assertEquals(response.status, 302);
  assertEquals(response.headers.get("Location"), location);
  assertEquals(response.headers.get("Access-Control-Allow-Origin"), "*");
});

Deno.test("createRedirectResponse - creates permanent redirect when specified", () => {
  // Arrange
  const location = "https://example.com/new-location";
  
  // Act
  const response = createRedirectResponse(location, true);
  
  // Assert
  assertEquals(response.status, 301);
  assertEquals(response.headers.get("Location"), location);
});