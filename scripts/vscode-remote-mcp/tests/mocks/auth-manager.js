/**
 * Mock Auth Manager for VSCode Remote MCP
 */

class MCPAuthManager {
  constructor() {
    this.tokens = new Map();
  }

  /**
   * Get a token for a server
   * @param {string} serverId - Server ID
   * @returns {Promise<string>} - Token
   */
  async getToken(serverId) {
    return this.tokens.get(serverId) || 'mock-token';
  }

  /**
   * Set a token for a server
   * @param {string} serverId - Server ID
   * @param {string} token - Token
   * @returns {Promise<void>}
   */
  async setToken(serverId, token) {
    this.tokens.set(serverId, token);
  }

  /**
   * Clear a token for a server
   * @param {string} serverId - Server ID
   * @returns {Promise<void>}
   */
  async clearToken(serverId) {
    this.tokens.delete(serverId);
  }
}

module.exports = { MCPAuthManager };