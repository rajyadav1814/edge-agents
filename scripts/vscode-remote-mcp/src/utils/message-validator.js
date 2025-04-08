/**
 * Message Validator for VSCode Remote MCP
 * 
 * This module provides validation functions for MCP messages
 * to ensure they conform to the expected format and structure.
 */

const { MESSAGE_TYPES } = require('./message-types');

/**
 * Validate a message
 * @param {Object} message - The message to validate
 * @returns {Object} Validation result with valid flag and errors array
 */
function validateMessage(message) {
  const result = {
    valid: true,
    errors: []
  };

  // Check if message is an object
  if (!message || typeof message !== 'object') {
    result.valid = false;
    result.errors.push('Message must be an object');
    return result;
  }

  // Check required fields
  if (!message.type) {
    result.valid = false;
    result.errors.push('Message type is required');
  }

  if (!message.id) {
    result.valid = false;
    result.errors.push('Message id is required');
  }

  if (message.timestamp === undefined) {
    result.valid = false;
    result.errors.push('Message timestamp is required');
  } else if (typeof message.timestamp !== 'number') {
    result.valid = false;
    result.errors.push('Message timestamp must be a number');
  }

  if (!message.payload) {
    result.valid = false;
    result.errors.push('Message payload is required');
  } else if (typeof message.payload !== 'object') {
    result.valid = false;
    result.errors.push('Message payload must be an object');
  }

  // Validate message type if present
  if (message.type && !isValidMessageType(message.type)) {
    result.valid = false;
    result.errors.push(`Invalid message type: ${message.type}`);
  }

  return result;
}

/**
 * Validate a message based on its type
 * @param {Object} message - The message to validate
 * @returns {Object} Validation result with valid flag and errors array
 */
function validateMessageType(message) {
  const result = {
    valid: true,
    errors: []
  };

  // Basic validation first
  const basicValidation = validateMessage(message);
  if (!basicValidation.valid) {
    return basicValidation;
  }

  // Type-specific validation
  switch (message.type) {
    case 'client_hello':
      if (!message.payload.clientId) {
        result.valid = false;
        result.errors.push('client_hello message requires clientId in payload');
      }
      if (!message.payload.version) {
        result.valid = false;
        result.errors.push('client_hello message requires version in payload');
      }
      break;
    case 'server_hello':
      if (!message.payload.serverId) {
        result.valid = false;
        result.errors.push('server_hello message requires serverId in payload');
      }
      if (!message.payload.version) {
        result.valid = false;
        result.errors.push('server_hello message requires version in payload');
      }
      if (!message.payload.sessionId) {
        result.valid = false;
        result.errors.push('server_hello message requires sessionId in payload');
      }
      break;
    case 'auth_request':
      if (!message.payload.authType) {
        result.valid = false;
        result.errors.push('auth_request message requires authType in payload');
      } else if (!['token', 'basic', 'oauth'].includes(message.payload.authType)) {
        result.valid = false;
        result.errors.push('auth_request message requires valid authType (token, basic, oauth)');
      }
      break;
    // Add more message type validations as needed
  }

  return result;
}

/**
 * Check if a message type is valid
 * @param {string} type - The message type to check
 * @returns {boolean} True if valid, false otherwise
 */
function isValidMessageType(type) {
  if (typeof type !== 'string') return false;
  return Object.values(MESSAGE_TYPES).includes(type);
}

/**
 * Validate required fields in an object
 * @param {Object} obj - The object to validate
 * @param {string[]} requiredFields - Array of required field names
 * @returns {string[]} Array of error messages, empty if valid
 */
function validateRequiredFields(obj, requiredFields) {
  const errors = [];
  
  if (!obj || typeof obj !== 'object') {
    errors.push('Object must be a non-null object');
    return errors;
  }
  
  for (const field of requiredFields) {
    if (obj[field] === undefined) {
      errors.push(`${field} is required`);
    }
  }
  
  return errors;
}

module.exports = {
  validateMessage,
  validateMessageType,
  isValidMessageType,
  validateRequiredFields
};
