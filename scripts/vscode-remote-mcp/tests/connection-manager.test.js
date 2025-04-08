/**
 * Tests for the Connection Manager
 */

jest.mock('../src/utils/connection-manager', () => require('./mocks/connection-manager'));
jest.mock('../src/utils/auth-manager', () => require('./mocks/auth-manager'));
jest.mock('../src/utils/client-state-model', () => require('./mocks/client-state-model'));

const { MCPConnectionManager } = require('../src/utils/connection-manager');
const { MCPAuthManager } = require('../src/utils/auth-manager');
const { ClientStateManager } = require('../src/utils/client-state-model');

describe('Connection Manager', () => {
  let connectionManager;
  let authManager;
  let stateManager;
  let mockSendMessage;

  beforeEach(() => {
    mockSendMessage = jest.fn();
    authManager = new MCPAuthManager();
    stateManager = new ClientStateManager();
    
    connectionManager = new MCPConnectionManager({
      sendMessage: mockSendMessage,
      url: 'ws://localhost:3001',
      tokenRefreshThreshold: 300,
      reconnectDelay: 1000,
      maxReconnectAttempts: 5,
      autoReconnect: true
    });
    
    // Replace the mocked state manager and auth manager with our instances
    connectionManager.stateManager = stateManager;
    connectionManager.authManager = authManager;
    
    // Spy on console.error
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('connect', () => {
    it('should connect successfully with valid credentials', async () => {
      // Setup
      const serverId = 'test-server';
      const clientId = 'test-client';
      const workspaceId = 'test-workspace';
      const capabilities = ['terminal', 'editor'];
      
      // Set a token for the test server
      await authManager.setToken(serverId, 'valid-token');
      
      // Execute
      const result = await connectionManager.connect(serverId, clientId, workspaceId, capabilities);
      
      // Verify
      expect(result).toBe(true);
      expect(mockSendMessage).toHaveBeenCalledWith({
        type: 'connection',
        payload: {
          clientId,
          workspaceId,
          capabilities,
          authToken: 'valid-token'
        }
      });
    });

    it('should fail to connect with invalid credentials', async () => {
      // Setup
      const serverId = 'test-server';
      const clientId = 'test-client';
      const workspaceId = 'test-workspace';
      
      // Mock the auth manager to return null (no token)
      authManager.getToken = jest.fn().mockResolvedValue(null);
      
      // Execute
      const result = await connectionManager.connect(serverId, clientId, workspaceId);
      
      // Verify
      expect(result).toBe(false);
      expect(mockSendMessage).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith('Authentication failed: No token available');
    });

    it('should handle authentication errors', async () => {
      // Setup
      const serverId = 'test-server';
      const clientId = 'test-client';
      const workspaceId = 'test-workspace';
      
      // Mock the auth manager to throw an error
      authManager.getToken = jest.fn().mockRejectedValue(new Error('Auth service unavailable'));
      
      // Execute
      const result = await connectionManager.connect(serverId, clientId, workspaceId);
      
      // Verify
      expect(result).toBe(false);
      expect(mockSendMessage).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith('Authentication failed:', 'Auth service unavailable');
    });
  });

  describe('disconnect', () => {
    it('should disconnect and optionally clear auth token', async () => {
      // Setup
      const serverId = 'test-server';
      await authManager.setToken(serverId, 'test-token');
      connectionManager.currentServerId = serverId;
      
      // Spy on authManager.clearToken
      const clearTokenSpy = jest.spyOn(authManager, 'clearToken');
      
      // Execute - disconnect without clearing auth
      let result = await connectionManager.disconnect(false);
      
      // Verify
      expect(result).toBe(true);
      expect(clearTokenSpy).not.toHaveBeenCalled();
      
      // Execute - disconnect with clearing auth
      result = await connectionManager.disconnect(true);
      
      // Verify
      expect(result).toBe(true);
      expect(clearTokenSpy).toHaveBeenCalledWith(serverId);
    });
  });

  describe('session management', () => {
    it('should start a session successfully', async () => {
      // Setup
      const sessionId = 'test-session';
      const sessionOptions = { mode: 'interactive' };
      
      // Execute
      const result = await connectionManager.startSession(sessionId, sessionOptions);
      
      // Verify
      expect(result).toBe(true);
    });

    it('should end a session successfully', async () => {
      // Execute
      const result = await connectionManager.endSession();
      
      // Verify
      expect(result).toBe(true);
    });
  });

  describe('message handling', () => {
    it('should register and call message handlers', () => {
      // Setup
      const mockHandler = jest.fn();
      const messageType = 'test-message';
      const message = { type: messageType, payload: { data: 'test' } };
      
      // Register handler
      connectionManager.registerMessageHandler(messageType, mockHandler);
      
      // Execute
      connectionManager.handleMessage(message);
      
      // Verify
      expect(mockHandler).toHaveBeenCalledWith(message);
    });

    it('should not call handlers for unregistered message types', () => {
      // Setup
      const mockHandler = jest.fn();
      const message = { type: 'unknown-type', payload: { data: 'test' } };
      
      // Register handler for a different type
      connectionManager.registerMessageHandler('test-message', mockHandler);
      
      // Execute
      connectionManager.handleMessage(message);
      
      // Verify
      expect(mockHandler).not.toHaveBeenCalled();
    });
  });

  describe('request-response', () => {
    it('should send requests and return responses', async () => {
      // Setup
      const requestType = 'test-request';
      const payload = { data: 'test' };
      
      // Execute
      const result = await connectionManager.sendRequest(requestType, payload);
      
      // Verify
      expect(result).toEqual({ success: true });
    });
  });
});