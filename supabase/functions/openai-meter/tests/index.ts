import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { corsHeaders, getCorsHeaders } from "../../_shared/cors.ts";
import { RequestBody, ErrorTypes, APIError, StreamChunk } from "./types.ts";
import { selectProvider } from "./providers.ts";
import { StripeMetering } from "./stripe.ts";

/**
 * Validate request body
 */
function validateRequest(body: unknown): RequestBody {
  if (!body || typeof body !== "object") {
    throw new APIError(
      ErrorTypes.INVALID_REQUEST,
      "Invalid request body",
      400
    );
  }

  const request = body as RequestBody;
  
  if (!request.model) {
    throw new APIError(
      ErrorTypes.MISSING_FIELD,
      "Model is required",
      400
    );
  }

  if (!request.prompt && !request.messages) {
    throw new APIError(
      ErrorTypes.MISSING_FIELD,
      "Either prompt or messages is required",
      400
    );
  }

  return request;
}

/**
 * Validate API key from authorization header
 */
function validateApiKey(headers: Headers): string {
  const authHeader = headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new APIError(
      ErrorTypes.MISSING_API_KEY,
      "Missing or invalid authorization",
      401
    );
  }
  return authHeader.slice(7);
}

/**
 * Handle edge function request
 */
export async function handleRequest(request: Request): Promise<Response> {
  try {
    // Get origin-aware CORS headers
    const origin = request.headers.get("origin");
    const responseHeaders = getCorsHeaders(origin);

    // Handle preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: responseHeaders,
      });
    }

    // Validate request method
    if (request.method !== "POST") {
      throw new APIError(
        ErrorTypes.METHOD_NOT_ALLOWED,
        "Method not allowed",
        405
      );
    }

    // Validate API key
    const apiKey = validateApiKey(request.headers);
    const metering = new StripeMetering(apiKey);
    const isValid = await metering.validateApiKey(apiKey);
    
    if (!isValid) {
      throw new APIError(
        ErrorTypes.INVALID_API_KEY,
        "Invalid API key",
        401
      );
    }

    // Parse and validate request body
    const body = validateRequest(await request.json());

    // Get provider for model
    const provider = selectProvider(body.model);

    // Handle streaming response
    if (body.stream) {
      const stream = provider.streamCompletion(body);
      const encoder = new TextEncoder();

      const responseStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              const data = `data: ${JSON.stringify(chunk)}\n\n`;
              controller.enqueue(encoder.encode(data));
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
      });

      return new Response(responseStream, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    // Handle regular completion
    const response = body.messages
      ? await provider.createChatCompletion(body)
      : await provider.createCompletion(body);

    // Record usage
    await metering.recordUsage({
      customerId: apiKey,
      quantity: response.usage.total_tokens,
      timestamp: new Date(),
    });

    return new Response(JSON.stringify(response), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    const status = error instanceof APIError ? error.status : 500;
    const errorResponse = error instanceof APIError
      ? error.toJSON()
      : {
          error: {
            type: ErrorTypes.INTERNAL_ERROR,
            message: error instanceof Error ? error.message : "Unknown error",
          },
        };

    return new Response(JSON.stringify(errorResponse), {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
}

if (import.meta.main) {
  serve(handleRequest);
}