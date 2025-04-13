/**
 * Constants for schema validation
 * 
 * This module centralizes all schema validation constants to avoid hardcoding
 * values in validation functions.
 */

// Status values for different message types
const STATUS_VALUES = {
  CONNECTION: ['connected', 'rejected', 'pending'],
  SESSION_CREATE: ['created', 'rejected', 'pending'],
  SESSION_JOIN: ['joined', 'rejected', 'pending'],
  TOKEN_REFRESH: ['accepted', 'rejected']
};

// Regular expression patterns
const PATTERNS = {
  ISO_DATE: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/
};

module.exports = {
  STATUS_VALUES,
  PATTERNS
};