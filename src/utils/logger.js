/**
 * Logger utility for the MCP server
 * 
 * This module provides standardized logging functions with different severity levels.
 * It uses environment variables to control log levels and output format.
 * 
 * @module logger
 */

// Get log level from environment or use default
const LOG_LEVEL = process.env.MCP_LOG_LEVEL || 'info';

// Log levels with numeric values for comparison
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

// Convert string log level to numeric value
const currentLogLevel = LOG_LEVELS[LOG_LEVEL.toLowerCase()] || LOG_LEVELS.info;

/**
 * Format log message with timestamp and metadata
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} [metadata] - Additional metadata
 * @returns {string} Formatted log message
 */
function formatLogMessage(level, message, metadata = {}) {
  const timestamp = new Date().toISOString();
  const metadataStr = Object.keys(metadata).length > 0 
    ? ` ${JSON.stringify(metadata)}`
    : '';
  
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metadataStr}`;
}

/**
 * Log error message
 * @param {string} message - Error message
 * @param {Object} [metadata] - Additional metadata
 */
function error(message, metadata = {}) {
  if (currentLogLevel >= LOG_LEVELS.error) {
    console.error(formatLogMessage('error', message, metadata));
  }
}

/**
 * Log warning message
 * @param {string} message - Warning message
 * @param {Object} [metadata] - Additional metadata
 */
function warn(message, metadata = {}) {
  if (currentLogLevel >= LOG_LEVELS.warn) {
    console.warn(formatLogMessage('warn', message, metadata));
  }
}

/**
 * Log info message
 * @param {string} message - Info message
 * @param {Object} [metadata] - Additional metadata
 */
function info(message, metadata = {}) {
  if (currentLogLevel >= LOG_LEVELS.info) {
    console.info(formatLogMessage('info', message, metadata));
  }
}

/**
 * Log debug message
 * @param {string} message - Debug message
 * @param {Object} [metadata] - Additional metadata
 */
function debug(message, metadata = {}) {
  if (currentLogLevel >= LOG_LEVELS.debug) {
    console.debug(formatLogMessage('debug', message, metadata));
  }
}

module.exports = {
  error,
  warn,
  info,
  debug
};