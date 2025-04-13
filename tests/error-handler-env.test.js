/**
 * Environment variable tests for error-handler.js
 * 
 * This test suite focuses on ensuring proper environment variable handling
 * in the error-handler module.
 */

const errorHandler = require('../src/utils/error-handler');
const { ConnectionManager } = require('../tests/mocks/connection-manager');
const { ClientStateModel } = require('../tests/mocks/client-state-model');

// Mock environment variables
const originalEnv = process.env;

// Mock dependencies
jest.mock('../src/utils/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
}));

describe('Error Handler Environment Variables', () => {
  let connectionManager;
  let clientStateModel;
  let mockClient;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock environment
    process.env = { ...originalEnv };
    
    // Setup mock client
    mockClient = {
      id: 'client-123',
      send: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined)
    };
    
    // Setup connection manager
    connectionManager = new ConnectionManager();
    connectionManager.getClient.mockReturnValue(mockClient);
    connectionManager.getAllClients.mockReturnValue(new Map([['client-123', mockClient]]));
    
    // Setup client state model
    clientStateModel = new ClientStateModel();
    clientStateModel.getClientState.mockReturnValue({
      connectionState: {
        isConnected: true,
        lastConnected: Date.now(),
        reconnectAttempts: 0
      },
      sessionState: {
        isAuthenticated: true,
        sessionId: 'session-456',
        userId: 'user-789'
      }
    });
  });
  
  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });
  
  // Test environment variable handling for error logging
  describe('Error logging with environment variables', () => {
    test('should respect MCP_LOG_LEVEL environment variable', async () => {
      // Set environment variable
      process.env.MCP_LOG_LEVEL = 'error';
      
      const error = new Error('Test error');
      const clientId = 'client-123';
      
      await errorHandler.handleError(error, clientId, connectionManager, clientStateModel);
      
      // Verify error was logged
      expect(require('../src/utils/logger').error).toHaveBeenCalledWith(
        expect.stringContaining('Test error'),
        expect.objectContaining({ 
          clientId: 'client-123',
          logLevel: 'error' 
        })
      );
      
      // Change log level
      process.env.MCP_LOG_LEVEL = 'debug';
      
      await errorHandler.handleError(error, clientId, connectionManager, clientStateModel);
      
      // Verify debug was logged
      expect(require('../src/utils/logger').debug).toHaveBeenCalled();
    });
    
    test('should use default log level when environment variable is not set', async () => {
      // Ensure environment variable is not set
      delete process.env.MCP_LOG_LEVEL;
      
      const error = new Error('Test error');
      const clientId = 'client-123';
      
      await errorHandler.handleError(error, clientId, connectionManager, clientStateModel);
      
      // Verify error was logged with default level
      expect(require('../src/utils/logger').error).toHaveBeenCalledWith(
        expect.stringContaining('Test error'),
        expect.objectContaining({ 
          clientId: 'client-123',
          logLevel: 'info' // Default level
        })
      );
    });
  });
  
  // Test environment variable handling for authentication
  describe('Authentication with environment variables', () => {
    test('should respect MCP_AUTH_ENABLED environment variable', async () => {
      // Set environment variable to disable authentication
      process.env.MCP_AUTH_ENABLED = 'false';
      
      const error = new Error('Authentication failed');
      error.code = 'AUTH_ERROR';
      const clientId = 'client-123';
      
      await errorHandler.handleAuthError(error, clientId, connectionManager, clientStateModel);
      
      // Verify authentication was skipped
      expect(clientStateModel.updateSessionState).not.toHaveBeenCalled();
      
      // Enable authentication
      process.env.MCP_AUTH_ENABLED = 'true';
      
      await errorHandler.handleAuthError(error, clientId, connectionManager, clientStateModel);
      
      // Verify authentication was enforced
      expect(clientStateModel.updateSessionState).toHaveBeenCalledWith(
        clientId,
        expect.objectContaining({ isAuthenticated: false })
      );
    });
    
    test('should use MCP_AUTH_TOKEN environment variable for validation', async () => {
      // Set environment variable
      process.env.MCP_AUTH_TOKEN = 'test_token_123';
      process.env.MCP_AUTH_ENABLED = 'true';
      
      const error = new Error('Invalid token');
      error.code = 'INVALID_TOKEN';
      error.providedToken = 'wrong_token';
      const clientId = 'client-123';
      
      await errorHandler.handleAuthError(error, clientId, connectionManager, clientStateModel);
      
      // Verify token validation used environment variable
      expect(mockClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'auth_error',
          payload: expect.objectContaining({
            message: expect.stringContaining('Invalid token'),
            code: 'INVALID_TOKEN',
            expectedToken: 'test_token_123' // Should not expose in production!
          })
        })
      );
    });
  });
  
  // Test environment variable handling for command execution
  describe('Command execution with environment variables', () => {
    test('should respect MCP_COMMAND_TIMEOUT_MS environment variable', async () => {
      // Set environment variable
      process.env.MCP_COMMAND_TIMEOUT_MS = '5000';
      
      const error = new Error('Command execution timeout');
      error.code = 'COMMAND_TIMEOUT';
      const clientId = 'client-123';
      const requestId = 'request-789';
      
      await errorHandler.handleRequestError(error, clientId, requestId, connectionManager, clientStateModel);
      
      // Verify timeout value from environment was used
      expect(mockClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          payload: expect.objectContaining({
            message: expect.stringContaining('Command execution timeout'),
            code: 'COMMAND_TIMEOUT',
            timeoutMs: 5000
          })
        })
      );
    });
    
    test('should use default timeout when environment variable is not set', async () => {
      // Ensure environment variable is not set
      delete process.env.MCP_COMMAND_TIMEOUT_MS;
      
      const error = new Error('Command execution timeout');
      error.code = 'COMMAND_TIMEOUT';
      const clientId = 'client-123';
      const requestId = 'request-789';
      
      await errorHandler.handleRequestError(error, clientId, requestId, connectionManager, clientStateModel);
      
      // Verify default timeout was used
      expect(mockClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          payload: expect.objectContaining({
            message: expect.stringContaining('Command execution timeout'),
            code: 'COMMAND_TIMEOUT',
            timeoutMs: 30000 // Default timeout
          })
        })
      );
    });
  });
  
  // Test environment variable handling for server information
  describe('Server information with environment variables', () => {
    test('should use MCP_SERVER_NAME environment variable in error messages', async () => {
      // Set environment variable
      process.env.MCP_SERVER_NAME = 'Test MCP Server';
      
      const error = new Error('Server error');
      
      await errorHandler.handleServerError(error, connectionManager);
      
      // Verify server name from environment was used
      expect(mockClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'server_error',
          payload: expect.objectContaining({
            message: expect.stringContaining('Internal server error'),
            serverName: 'Test MCP Server'
          })
        })
      );
    });
    
    test('should use MCP_SERVER_VERSION environment variable in error messages', async () => {
      // Set environment variables
      process.env.MCP_SERVER_NAME = 'Test MCP Server';
      process.env.MCP_SERVER_VERSION = '2.0.0';
      
      const error = new Error('Server error');
      
      await errorHandler.handleServerError(error, connectionManager);
      
      // Verify server version from environment was used
      expect(mockClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'server_error',
          payload: expect.objectContaining({
            message: expect.stringContaining('Internal server error'),
            serverName: 'Test MCP Server',
            serverVersion: '2.0.0'
          })
        })
      );
    });
  });
  
  // Test environment variable handling for CORS
  describe('CORS handling with environment variables', () => {
    test('should respect MCP_CORS_ENABLED environment variable', async () => {
      // Set environment variable to enable CORS
      process.env.MCP_CORS_ENABLED = 'true';
      process.env.MCP_ALLOWED_ORIGINS = 'https://example.com,https://test.com';
      
      const error = new Error('CORS error');
      error.code = 'CORS_ERROR';
      error.origin = 'https://malicious.com';
      const clientId = 'client-123';
      
      await errorHandler.handleError(error, clientId, connectionManager, clientStateModel);
      
      // Verify CORS validation used environment variables
      expect(mockClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          payload: expect.objectContaining({
            message: expect.stringContaining('CORS error'),
            code: 'CORS_ERROR',
            allowedOrigins: ['https://example.com', 'https://test.com']
          })
        })
      );
    });
    
    test('should handle wildcard in MCP_ALLOWED_ORIGINS', async () => {
      // Set environment variable with wildcard
      process.env.MCP_CORS_ENABLED = 'true';
      process.env.MCP_ALLOWED_ORIGINS = '*';
      
      const error = new Error('CORS error');
      error.code = 'CORS_ERROR';
      error.origin = 'https://example.com';
      const clientId = 'client-123';
      
      await errorHandler.handleError(error, clientId, connectionManager, clientStateModel);
      
      // Verify wildcard was properly handled
      expect(mockClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          payload: expect.objectContaining({
            message: expect.stringContaining('CORS error'),
            code: 'CORS_ERROR',
            allowedOrigins: ['*']
          })
        })
      );
    });
  });
});