/**
 * Message Validator for VSCode Remote MCP
 * 
 * This module provides validation functions for MCP messages
 * to ensure they conform to the expected format and structure.
 */

const { MESSAGE_TYPES } = require('./message-types');
const { STATUS_VALUES, PATTERNS } = require('../config/schema-constants');

/**
 * Validate a message
 * @param {Object} message - The message to validate
 * @returns {boolean} True if valid
 * @throws {Error} If validation fails
 */
function validateMessage(message) {
  if (!message || typeof message !== 'object') {
    throw new Error('Message must be a non-null object');
  }

  validateMessageType(message.type);
  validateMessagePayload(message.payload);
  
  if (message.id) {
    validateMessageId(message.id);
  }
  
  if (message.timestamp) {
    validateMessageTimestamp(message.timestamp);
  }
  
  validateMessageTypeSpecific(message);
  
  return true;
}

/**
 * Validate a message type
 * @param {string} type - The message type to validate
 * @returns {boolean} True if valid
 * @throws {Error} If validation fails
 */
function validateMessageType(type) {
  if (typeof type !== 'string' || type.trim() === '') {
    throw new Error('Message type must be a non-empty string');
  }
  return true;
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
 * Validate a message payload
 * @param {Object} payload - The payload to validate
 * @returns {boolean} True if valid
 * @throws {Error} If validation fails
 */
function validateMessagePayload(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Message payload is required');
  }
  return true;
}

/**
 * Validate a message ID
 * @param {string} id - The message ID to validate
 * @returns {boolean} True if valid
 * @throws {Error} If validation fails
 */
function validateMessageId(id) {
  if (typeof id !== 'string' || id.trim() === '') {
    throw new Error('Message ID must be a non-empty string when provided');
  }
  return true;
}

/**
 * Validate a message timestamp
 * @param {string} timestamp - The timestamp to validate
 * @returns {boolean} True if valid
 * @throws {Error} If validation fails
 */
function validateMessageTimestamp(timestamp) {
  if (typeof timestamp !== 'string') {
    throw new Error('Message timestamp must be a string when provided');
  }
  return true;
}

/**
 * Validate message based on its specific type
 * @param {Object} message - The message to validate
 * @returns {boolean} True if valid
 * @throws {Error} If validation fails
 */
function validateMessageTypeSpecific(message) {
  const { type } = message;
  
  switch (type) {
    case 'connection':
      return validateConnectionMessage(message);
    case 'disconnect':
      return validateDisconnectMessage(message);
    case 'session_create':
      return validateSessionCreateMessage(message);
    case 'session_join':
      return validateSessionJoinMessage(message);
    case 'token_refresh':
      return validateTokenRefreshMessage(message);
    case 'terminal':
      return validateTerminalMessage(message);
    case 'editor':
      return validateEditorMessage(message);
    case 'client_hello':
      validateClientHelloMessage(message);
      return true;
    case 'server_hello':
      validateServerHelloMessage(message);
      return true;
    case 'auth_request':
      validateAuthRequestMessage(message);
      return true;
    default:
      // For unknown message types, we just validate basic structure
      return true;
  }
}

/**
 * Validate a client_hello message
 * @param {Object} message - The message to validate
 * @throws {Error} If validation fails
 */
function validateClientHelloMessage(message) {
  const { payload } = message;
  
  if (!payload.clientId) {
    throw new Error('client_hello message requires clientId in payload');
  }
  
  if (!payload.version) {
    throw new Error('client_hello message requires version in payload');
  }
  
  return true;
}

/**
 * Validate a server_hello message
 * @param {Object} message - The message to validate
 * @throws {Error} If validation fails
 */
function validateServerHelloMessage(message) {
  const { payload } = message;
  
  if (!payload.serverId) {
    throw new Error('server_hello message requires serverId in payload');
  }
  
  if (!payload.version) {
    throw new Error('server_hello message requires version in payload');
  }
  
  if (!payload.sessionId) {
    throw new Error('server_hello message requires sessionId in payload');
  }
  
  return true;
}

/**
 * Validate an auth_request message
 * @param {Object} message - The message to validate
 * @throws {Error} If validation fails
 */
function validateAuthRequestMessage(message) {
  const { payload } = message;
  
  if (!payload.authType) {
    throw new Error('auth_request message requires authType in payload');
  } else if (!['token', 'basic', 'oauth'].includes(payload.authType)) {
    throw new Error('auth_request message requires valid authType (token, basic, oauth)');
  }
  
  return true;
}

/**
 * Validate a connection message
 * @param {Object} message - The message to validate
 * @returns {boolean} True if valid
 * @throws {Error} If validation fails
 */
function validateConnectionMessage(message) {
  validateConnectionPayload(message.payload);
  return true;
}

/**
 * Validate a disconnect message
 * @param {Object} message - The message to validate
 * @returns {boolean} True if valid
 * @throws {Error} If validation fails
 */
function validateDisconnectMessage(message) {
  // Disconnect messages don't have specific payload requirements
  return true;
}

/**
 * Validate a session create message
 * @param {Object} message - The message to validate
 * @returns {boolean} True if valid
 * @throws {Error} If validation fails
 */
function validateSessionCreateMessage(message) {
  const { payload } = message;
  
  validateRequiredFields(payload, ['sessionId', 'createdBy', 'workspaceId']);
  
  if (typeof payload.sessionId !== 'string') {
    throw new Error('sessionId must be a string');
  }
  
  if (typeof payload.createdBy !== 'string') {
    throw new Error('createdBy must be a string');
  }
  
  if (typeof payload.workspaceId !== 'string') {
    throw new Error('workspaceId must be a string');
  }
  
  if (payload.sessionName !== undefined && typeof payload.sessionName !== 'string') {
    throw new Error('sessionName must be a string when provided');
  }
  
  return true;
}

/**
 * Validate a session join message
 * @param {Object} message - The message to validate
 * @returns {boolean} True if valid
 * @throws {Error} If validation fails
 */
function validateSessionJoinMessage(message) {
  const { payload } = message;
  
  validateRequiredFields(payload, ['sessionId', 'clientId', 'workspaceId']);
  
  if (typeof payload.sessionId !== 'string') {
    throw new Error('sessionId must be a string');
  }
  
  if (typeof payload.clientId !== 'string') {
    throw new Error('clientId must be a string');
  }
  
  if (typeof payload.workspaceId !== 'string') {
    throw new Error('workspaceId must be a string');
  }
  
  return true;
}

/**
 * Validate a token refresh message
 * @param {Object} message - The message to validate
 * @returns {boolean} True if valid
 * @throws {Error} If validation fails
 */
function validateTokenRefreshMessage(message) {
  const { payload } = message;
  
  validateRequiredFields(payload, ['clientId', 'newToken']);
  
  if (typeof payload.clientId !== 'string') {
    throw new Error('clientId must be a string');
  }
  
  if (typeof payload.newToken !== 'string') {
    throw new Error('newToken must be a string');
  }
  
  return true;
}

/**
 * Validate a terminal message
 * @param {Object} message - The message to validate
 * @returns {boolean} True if valid
 * @throws {Error} If validation fails
 */
function validateTerminalMessage(message) {
  const { payload } = message;
  
  if (!payload.sessionId) {
    throw new Error('Terminal message must have a sessionId');
  }
  
  if (typeof payload.sessionId !== 'string') {
    throw new Error('Terminal sessionId must be a string');
  }
  
  if (!payload.terminalId) {
    throw new Error('Terminal message must have a terminalId');
  }
  
  if (typeof payload.terminalId !== 'string') {
    throw new Error('Terminal terminalId must be a string');
  }
  
  if (!payload.data) {
    throw new Error('Terminal message must have data');
  }
  
  if (typeof payload.data !== 'string') {
    throw new Error('Terminal data must be a string');
  }
  
  return true;
}

/**
 * Validate an editor message
 * @param {Object} message - The message to validate
 * @returns {boolean} True if valid
 * @throws {Error} If validation fails
 */
function validateEditorMessage(message) {
  const { payload } = message;
  
  if (!payload.sessionId) {
    throw new Error('Editor message must have a sessionId');
  }
  
  if (typeof payload.sessionId !== 'string') {
    throw new Error('Editor sessionId must be a string');
  }
  
  // Check for filePath or documentUri
  if (!payload.filePath && !payload.documentUri) {
    throw new Error('Editor message must have a filePath');
  }
  
  if (payload.filePath && typeof payload.filePath !== 'string') {
    throw new Error('Editor filePath must be a string');
  }
  
  if (payload.documentUri && typeof payload.documentUri !== 'string') {
    throw new Error('Editor documentUri must be a string');
  }
  
  if (!payload.action) {
    throw new Error('Editor message must have an action');
  }
  
  if (typeof payload.action !== 'string') {
    throw new Error('Editor action must be a string');
  }
  
  // Validate based on action type
  switch (payload.action) {
    case 'edit':
      if (!payload.changes || !Array.isArray(payload.changes)) {
        throw new Error('Editor edit message must have an array of changes');
      }
      break;
    case 'cursor':
      if (!payload.position || typeof payload.position !== 'object' || 
          payload.position.line === undefined || payload.position.character === undefined) {
        throw new Error('Editor cursor message must have a valid position object');
      }
      break;
    case 'selection':
      if (!payload.selections || !Array.isArray(payload.selections)) {
        throw new Error('Editor selection message must have an array of selections');
      }
      break;
    case 'open':
    case 'close':
      // No additional validation needed for open/close
      break;
    default:
      throw new Error(`Unknown editor action: ${payload.action}`);
  }
  
  return true;
}

/**
 * Validate a connection payload
 * @param {Object} payload - The payload to validate
 * @returns {boolean} True if valid
 * @throws {Error} If validation fails
 */
function validateConnectionPayload(payload) {
  validateRequiredFields(payload, ['clientId', 'workspaceId', 'capabilities']);
  
  if (typeof payload.clientId !== 'string') {
    throw new Error('clientId must be a string');
  }
  
  if (typeof payload.workspaceId !== 'string') {
    throw new Error('workspaceId must be a string');
  }
  
  if (!Array.isArray(payload.capabilities)) {
    throw new Error('capabilities must be an array');
  }
  
  // Optional fields
  if (payload.clientVersion !== undefined && typeof payload.clientVersion !== 'string') {
    throw new Error('clientVersion must be a string when provided');
  }
  
  if (payload.authToken !== undefined && typeof payload.authToken !== 'string') {
    throw new Error('authToken must be a string when provided');
  }
  
  return true;
}

/**
 * Validate a connection acknowledgment payload
 * @param {Object} payload - The payload to validate
 * @returns {boolean} True if valid
 * @throws {Error} If validation fails
 */
function validateConnectionAckPayload(payload) {
  validateRequiredFields(payload, ['status', 'serverTime', 'connectedClients']);
  
  if (typeof payload.status !== 'string') {
    throw new Error('status must be a string');
  }
  
  if (typeof payload.serverTime !== 'string') {
    throw new Error('serverTime must be a string');
  }
  
  if (typeof payload.connectedClients !== 'number') {
    throw new Error('connectedClients must be a number');
  }
  
  return true;
}

/**
 * Validate a session join acknowledgment payload
 * @param {Object} payload - The payload to validate
 * @returns {boolean} True if valid
 * @throws {Error} If validation fails
 */
function validateSessionJoinAckPayload(payload) {
  validateRequiredFields(payload, ['sessionId', 'status', 'participants']);
  
  if (typeof payload.sessionId !== 'string') {
    throw new Error('sessionId must be a string');
  }
  
  if (typeof payload.status !== 'string') {
    throw new Error('status must be a string');
  }
  
  if (!Array.isArray(payload.participants)) {
    throw new Error('participants must be an array');
  }
  
  // Optional fields
  if (payload.activeDocument !== undefined && typeof payload.activeDocument !== 'string') {
    throw new Error('activeDocument must be a string when provided');
  }
  
  if (payload.sharedTerminal !== undefined && typeof payload.sharedTerminal !== 'string') {
    throw new Error('sharedTerminal must be a string when provided');
  }
  
  return true;
}

/**
 * Validate a token refresh acknowledgment payload
 * @param {Object} payload - The payload to validate
 * @returns {boolean} True if valid
 * @throws {Error} If validation fails
 */
function validateTokenRefreshAckPayload(payload) {
  validateRequiredFields(payload, ['status']);
  
  if (typeof payload.status !== 'string') {
    throw new Error('status must be a string');
  }
  
  if (!STATUS_VALUES.TOKEN_REFRESH.includes(payload.status)) {
    throw new Error('status must be either "accepted" or "rejected"');
  }
  
  // Optional fields
  if (payload.message !== undefined && typeof payload.message !== 'string') {
    throw new Error('message must be a string when provided');
  }
  
  return true;
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
    throw new Error('Object must be a non-null object');
  }
  
  for (const field of requiredFields) {
    if (obj[field] === undefined) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  return errors;
}

/**
 * Validate that a string is a valid ISO 8601 timestamp
 * @param {string} timestamp - The timestamp to validate
 * @throws {Error} If the timestamp is not a valid ISO 8601 string
 */
function validateISOTimestamp(timestamp) {
  if (typeof timestamp !== 'string') {
    throw new Error(`${timestamp} must be a string`);
  }
  
  if (!PATTERNS.ISO_DATE.test(timestamp)) {
    throw new Error(`${timestamp} must be a valid ISO 8601 timestamp`);
  }
  
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      throw new Error(`${timestamp} must be a valid ISO 8601 timestamp`);
    }
  } catch (e) {
    throw new Error(`${timestamp} must be a valid ISO 8601 timestamp`);
  }
  
  return true;
}

module.exports = {
  validateMessage,
  validateMessageType,
  validateMessagePayload,
  validateMessageId,
  validateMessageTimestamp,
  validateMessageTypeSpecific,
  validateConnectionMessage,
  validateDisconnectMessage,
  validateSessionCreateMessage,
  validateSessionJoinMessage,
  validateTokenRefreshMessage,
  validateTerminalMessage,
  validateEditorMessage,
  validateConnectionPayload,
  validateConnectionAckPayload,
  validateSessionJoinAckPayload,
  validateTokenRefreshAckPayload,
  validateRequiredFields,
  validateISOTimestamp,
  isValidMessageType,
  validateClientHelloMessage,
  validateServerHelloMessage,
  validateAuthRequestMessage
};
