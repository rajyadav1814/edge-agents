/**
 * Mock ClientStateModel for testing
 */
class ClientStateModel {
  constructor() {
    this.getClientState = jest.fn();
    this.updateConnectionState = jest.fn().mockResolvedValue(undefined);
    this.updateSessionState = jest.fn().mockResolvedValue(undefined);
    this.removeClient = jest.fn().mockResolvedValue(undefined);
  }
}

module.exports = {
  ClientStateModel
};