/**
 * Gracefully shut down the server
 * @param {Map<string, Object>} clients - Map of connected clients
 * @param {string} [reason='Server is shutting down'] - Reason for shutdown
 * @param {number} [estimatedDowntime=300] - Estimated downtime in seconds
 * @param {Object} [options={}] - Additional shutdown options
 * @param {boolean} [options.plannedRestart=true] - Whether this is a planned restart
 * @param {Function} [options.cleanup] - Additional cleanup function to run before exit
 * @param {boolean} [options.exitProcess=true] - Whether to exit the process (set to false for testing)
 * @returns {Promise<Object>} Promise that resolves with the shutdown message
 */
async function shutdownGracefully(
  clients, 
  reason = 'Server is shutting down', 
  estimatedDowntime = 300,
  options = {}
) {
  console.log(`Initiating graceful shutdown: ${reason}`);
  
  // Default options
  const shutdownOptions = {
    plannedRestart: true,
    cleanup: null,
    exitProcess: true,
    ...options
  };
  
  // Create shutdown message
  const shutdownMessage = {
    type: 'server_shutdown',
    id: `shutdown-${Date.now()}`,
    payload: {
      reason,
      time: new Date().toISOString(),
      plannedRestart: shutdownOptions.plannedRestart,
      estimatedDowntime
    }
  };
  
  try {
    // Notify all clients
    await notifyClients(clients, shutdownMessage);
    console.log('All clients notified of shutdown');
    
    // Disconnect all clients
    await disconnectClients(clients);
    console.log('All clients disconnected');
    
    // Perform any additional cleanup
    if (typeof shutdownOptions.cleanup === 'function') {
      await shutdownOptions.cleanup();
    }
    console.log('Cleanup completed');
    
    // Exit process (only if not in test mode)
    if (shutdownOptions.exitProcess !== false) {
      console.log('Exiting process');
      process.exit(0);
    } else {
      console.log('Skipping process exit (test mode)');
      return shutdownMessage;
    }
  } catch (error) {
    console.error(`Error during graceful shutdown: ${error.message}`);
    console.error(error.stack);
    
    // Force exit in case of error (only if not in test mode)
    if (shutdownOptions.exitProcess !== false) {
      process.exit(1);
    } else {
      throw error;
    }
  }
  
  // Return the shutdown message (for testing)
  return shutdownMessage;
}

/**
 * Notify all clients of the shutdown
 * @param {Map<string, Object>} clients - Map of connected clients
 * @param {Object} message - Shutdown message to send
 * @returns {Promise<void>} Promise that resolves when all clients are notified
 */
async function notifyClients(clients, message) {
  const notifyPromises = [];
  
  // Send shutdown message to each client
  for (const [clientId, client] of clients.entries()) {
    console.log(`Notifying client ${clientId} of shutdown`);
    if (client && typeof client.send === 'function') {
      notifyPromises.push(client.send(message));
    }
  }
  
  // Wait for all notifications to complete
  return Promise.all(notifyPromises);
}

/**
 * Disconnect all clients
 * @param {Map<string, Object>} clients - Map of connected clients
 * @returns {Promise<void>} Promise that resolves when all clients are disconnected
 */
async function disconnectClients(clients) {
  const disconnectPromises = [];
  
  // Disconnect each client
  for (const [clientId, client] of clients.entries()) {
    if (client && typeof client.disconnect === 'function') {
      disconnectPromises.push(client.disconnect());
    }
  }
  
  // Wait for all disconnections to complete
  return Promise.all(disconnectPromises);
}

// Export the functions
module.exports = {
  shutdownGracefully,
  notifyClients,
  disconnectClients
};