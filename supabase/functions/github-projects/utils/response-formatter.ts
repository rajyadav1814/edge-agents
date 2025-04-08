/**
 * Response formatting module
 * Provides standardized response formatting for the API
 */

import { corsHeaders } from "../../_shared/cors.ts";

export interface PaginationInfo {
  next?: string;
  prev?: string;
  last?: string;
  first?: string;
  page?: number;
  perPage?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  totalItems?: number;
  totalPages?: number;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  resetDate: string;
  used?: number;
}

export interface ResponseMetadata {
  pagination?: PaginationInfo;
  rateLimit?: RateLimitInfo;
}

/**
 * Extracts rate limit information from response headers
 * @param headers Response headers from GitHub API
 * @returns Rate limit information or undefined if not available
 */
export function extractRateLimitInfo(headers: Headers): RateLimitInfo {
  const limit = headers.get("X-RateLimit-Limit");
  const remaining = headers.get("X-RateLimit-Remaining");
  const reset = headers.get("X-RateLimit-Reset");
  const used = headers.get("X-RateLimit-Used");

  if (!limit || !remaining || !reset) {
    return {
      limit: 0,
      remaining: 0,
      reset: 0,
      resetDate: new Date().toISOString()
    };
  }

  const resetTime = parseInt(reset);
  const resetDate = new Date(resetTime * 1000).toISOString();

  return {
    limit: parseInt(limit),
    remaining: parseInt(remaining),
    reset: resetTime,
    resetDate,
    ...(used ? { used: parseInt(used) } : {})
  };
}

/**
 * Extracts pagination information from Link header
 * @param headers Response headers from GitHub API
 * @param urlString Current request URL (optional)
 * @returns Pagination information or undefined if not available
 */
export function extractPaginationInfo(headers: Headers, urlString?: string | URL): PaginationInfo | undefined {
  const linkHeader = headers.get("Link");
  if (!linkHeader) {
    return undefined;
  }

  const links: Record<string, string> = {};
  const pagination: PaginationInfo = {};
  const linkParts = linkHeader.split(",");

  for (const part of linkParts) {
    const match = part.match(/<([^>]+)>;\s*rel="([^"]+)"/);
    if (match) {
      const linkUrl = match[1];
      const rel = match[2];
      links[rel] = linkUrl;
      
      // Add to pagination info for standard link relations
      if (rel === 'next') {
        pagination.next = linkUrl;
      } else if (rel === 'prev') {
        pagination.prev = linkUrl;
      } else if (rel === 'first') {
        pagination.first = linkUrl;
      } else if (rel === 'last') {
        pagination.last = linkUrl;
      }
    }
  }

  // Extract page information from URLs if available
  if (links.next || links.prev || urlString) {
    const urlToCheck = links.next || links.prev || urlString;
    if (urlToCheck) {
      try {
        const urlObj = typeof urlToCheck === 'string' ? new URL(urlToCheck) : urlToCheck;
        const page = parseInt(urlObj.searchParams.get("page") || "1");
        const perPage = parseInt(urlObj.searchParams.get("per_page") || "30");
        
        pagination.page = links.prev ? page - 1 : page;
        pagination.perPage = perPage;
        pagination.hasNextPage = !!links.next;
        pagination.hasPreviousPage = links.prev ? true : false;
      } catch (e) {
        // Ignore URL parsing errors
      }
    }
  }

  return pagination;
}

/**
 * Creates a standardized success response
 * @param data Response data
 * @param headers Response headers or metadata
 * @param urlString Current request URL (optional)
 * @param cacheTtl Cache time-to-live in seconds (optional)
 * @returns Response object with data and metadata
 */
export function createSuccessResponse(
  data: unknown,
  headers?: Headers | ResponseMetadata,
  urlString?: string | URL,
  cacheTtl?: number
): Response {
  let metadata: ResponseMetadata = {};
  
  // If headers is a Headers object, extract metadata
  if (headers instanceof Headers) {
    metadata = {
      rateLimit: extractRateLimitInfo(headers),
      pagination: extractPaginationInfo(headers, urlString)
    };
  } else if (headers) {
    // If headers is already a ResponseMetadata object
    metadata = headers;
  }

  return new Response(
    JSON.stringify({
      data,
      meta: {
        rateLimit: metadata.rateLimit,
        pagination: metadata.pagination,
        timestamp: new Date().toISOString()
      }
    }),
    {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': cacheTtl ? `public, max-age=${cacheTtl}` : 'public, max-age=60'
      }
    }
  );
}

/**
 * Creates an empty response (204 No Content)
 * @returns Response object with 204 status
 */
export function createEmptyResponse(): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

/**
 * Creates a redirect response
 * @param url URL to redirect to
 * @param permanent Whether the redirect is permanent (301) or temporary (302)
 * @returns Response object with redirect status and Location header
 */
export function createRedirectResponse(url: string, permanent = false): Response {
  return new Response(null, {
    status: permanent ? 301 : 302,
    headers: {
      ...corsHeaders,
      'Location': url
    }
  });
}