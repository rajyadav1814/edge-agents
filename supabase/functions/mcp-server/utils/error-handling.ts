import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

/**
 * Type guard to check if an object is an Error
 */
function isError(obj: unknown): obj is Error {
  return obj instanceof Error;
}

/**
 * Type guard to check if an object is an McpError
 */
function isMcpError(obj: unknown): obj is McpError {
  return obj instanceof McpError;
}

/**
 * Handles an error and returns an appropriate HTTP response
 * 
 * @param error - The error to handle
 * @returns An HTTP response with the error details
 */
export function handleError(error: unknown): Response {
  console.error('Error:', error);
  
  if (isMcpError(error)) {
    return new Response(JSON.stringify({ 
      error: error.message,
      code: error.code
    }), {
      status: getStatusCodeForErrorCode(error.code),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
  
  return new Response(JSON.stringify({ 
    error: isError(error) ? error.message : 'Internal server error',
    code: ErrorCode.InternalError
  }), {
    status: 500,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

/**
 * Maps an MCP error code to an HTTP status code
 * 
 * @param errorCode - The MCP error code
 * @returns The corresponding HTTP status code
 */
function getStatusCodeForErrorCode(errorCode: ErrorCode): number {
  switch (errorCode) {
    case ErrorCode.InvalidRequest:
      return 400;
    case ErrorCode.Unauthorized:
      return 401;
    case ErrorCode.Forbidden:
      return 403;
    case ErrorCode.NotFound:
      return 404;
    case ErrorCode.MethodNotFound:
      return 404;
    case ErrorCode.InvalidParams:
      return 400;
    case ErrorCode.InternalError:
      return 500;
    default:
      return 500;
  }
}