/**
 * Logger utility for the security scanner
 * Provides formatted logging with timestamps and log levels
 */

// Logger utility for better console output
export const logger = {
  info: (message: string) => console.log(`[INFO] ${new Date().toISOString()} - ${message}`),
  warn: (message: string) => console.warn(`[WARN] ${new Date().toISOString()} - ${message}`),
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`);
    if (error) console.error(error);
  },
  success: (message: string) => console.log(`[SUCCESS] ${new Date().toISOString()} - ${message}`)
};