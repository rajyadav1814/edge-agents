#!/usr/bin/env deno run --allow-net --allow-env --allow-read

/**
 * Test script for the email-service.ts module
 * 
 * This script tests the email-service.ts module by sending a test email.
 * 
 * Usage:
 * deno run --allow-net --allow-env --allow-read test-email.ts <recipient_email>
 */

import { sendEmail } from "./email-service.ts";
import { load } from "https://deno.land/std@0.215.0/dotenv/mod.ts";

// Load environment variables from .env file
await load({ export: true });

// Check if RESEND_API_KEY is set
const apiKey = Deno.env.get("RESEND_API_KEY");
if (!apiKey) {
  console.error("Error: RESEND_API_KEY is required in .env file");
  Deno.exit(1);
}

// Get recipient email from command line arguments
const args = Deno.args;
if (args.length < 1) {
  console.error("Error: Recipient email is required");
  console.error("Usage: deno run --allow-net --allow-env --allow-read test-email.ts <recipient_email>");
  Deno.exit(1);
}

const recipient = args[0];

console.log(`Sending test email to ${recipient}...`);

// Send test email
const success = await sendEmail(
  "Security Scanner Test",
  `
  <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
    <h1 style="color: #333;">Security Scanner Email Test</h1>
    <p style="color: #666;">This is a test email from the Security Scanner.</p>
    <p>If you're receiving this email, the email-service.ts module is working correctly.</p>
    <p>Timestamp: ${new Date().toISOString()}</p>
  </div>
  `,
  recipient,
  "notify"
);

if (success) {
  console.log("Email sent successfully!");
} else {
  console.error("Failed to send email.");
  Deno.exit(1);
}
