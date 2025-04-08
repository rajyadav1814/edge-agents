/**
 * This file is deprecated and no longer used.
 * 
 * The security scanner now uses the email-service.ts module directly
 * instead of making HTTP requests to the resend function.
 */

// This function is kept for backward compatibility but is no longer used
export function fixResendUrl() {
  console.warn("fixResendUrl is deprecated and no longer used");
  return "";
}
