/**
 * Mock ConnectionManager for testing
 */
class ConnectionManager {
  constructor() {
    this.getClient = jest.fn();
    this.getAllClients = jest.fn();
    this.reconnect = jest.fn().mockResolvedValue(undefined);
    this.disconnect = jest.fn().mockResolvedValue(undefined);
    this.calculateBackoffDelay = jest.fn().mockReturnValue(1000);
  }
}

module.exports = {
  ConnectionManager
};