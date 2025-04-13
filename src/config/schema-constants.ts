/**
 * Schema validation constants
 * 
 * This module centralizes all schema validation constants used throughout the application.
 * Moving these values from hardcoded arrays in validation functions to a central configuration
 * improves maintainability and allows for easier updates.
 * 
 * @module schema-constants
 */

/**
 * Connection status values
 */
export const CONNECTION_STATUS_VALUES = ['connected', 'rejected', 'pending'];

/**
 * Session creation status values
 */
export const SESSION_CREATION_STATUS_VALUES = ['created', 'rejected', 'pending'];

/**
 * Session join status values
 */
export const SESSION_JOIN_STATUS_VALUES = ['joined', 'rejected', 'pending'];

/**
 * Token refresh status values
 */
export const TOKEN_REFRESH_STATUS_VALUES = ['accepted', 'rejected'];

/**
 * Default export of all constants
 */
export default {
  CONNECTION_STATUS_VALUES,
  SESSION_CREATION_STATUS_VALUES,
  SESSION_JOIN_STATUS_VALUES,
  TOKEN_REFRESH_STATUS_VALUES
};