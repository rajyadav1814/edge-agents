# SPARC2 Server-Sent Events (SSE) Example

This example demonstrates how to implement real-time streaming updates for SPARC2 operations using Server-Sent Events (SSE).

## What is SSE?

Server-Sent Events (SSE) is a server push technology enabling a client to receive automatic updates from a server via an HTTP connection. Unlike WebSockets, SSE is a one-way communication channel - the server can send messages to the client, but not vice versa.

SSE is simpler to implement than WebSockets and is well-suited for scenarios where you need real-time updates from the server but don't need to send data from the client to the server over the same connection.

## How This Example Works

This example creates two servers:

1. **SPARC2 API Server**: The standard SPARC2 HTTP API server (on a dynamically selected available port)
2. **SSE Wrapper Server**: A Node.js server that:
   - Forwards requests to the SPARC2 API
   - Provides an SSE endpoint for clients to connect to
   - Broadcasts real-time updates during SPARC2 operations
   - Serves a simple web UI for testing

The SSE wrapper server captures stdout/stderr output from the SPARC2 API server and broadcasts it to all connected clients, providing real-time visibility into the progress of long-running operations like code analysis and modification.

## Running the Example

To run the example:

```bash
# Make the script executable
chmod +x run-sse-example.sh

# Run the example
./run-sse-example.sh
```

Then open the URL displayed in the console (typically http://localhost:3002) in your web browser to see the example in action.

## Port Management

The example automatically handles port conflicts:

1. It first tries to find an available port for the SPARC2 API server (starting at 3001)
2. Then it finds an available port for the SSE server (starting at 3002)
3. The actual ports used will be displayed in the console and in the web UI

This ensures the example can run even if other services are using the default ports.

## Using the Web UI

The web UI provides a simple interface to:

1. Specify files to analyze/modify (comma-separated paths)
2. Enter a task description
3. Trigger code analysis or modification
4. View real-time updates during the operation

## Integrating SSE into Your Own Applications

To integrate SSE into your own applications:

1. Set up an SSE endpoint on your server:
   ```javascript
   // Set SSE headers
   res.writeHead(200, {
     'Content-Type': 'text/event-stream',
     'Cache-Control': 'no-cache',
     'Connection': 'keep-alive'
   });
   
   // Send messages
   res.write(`data: ${JSON.stringify({ type: 'log', message: 'Processing...' })}\n\n`);
   ```

2. Connect to the SSE endpoint from your client:
   ```javascript
   const eventSource = new EventSource('/events');
   
   eventSource.onmessage = function(event) {
     const data = JSON.parse(event.data);
     console.log(data.message);
   };
   ```

## Benefits of Using SSE with SPARC2

- **Improved User Experience**: Provide real-time feedback during long-running operations
- **Progress Monitoring**: Track the progress of complex code analysis and modification tasks
- **Debugging**: See logs and errors in real-time
- **Reduced Polling**: Eliminate the need for clients to poll the server for updates

## Limitations

- SSE is one-way communication (server to client only)
- Some proxies may buffer responses, affecting real-time delivery
- Limited browser support for reconnection and event IDs in older browsers

## Further Enhancements

This example could be extended to:

1. Add authentication for SSE connections
2. Implement client-specific channels for multi-user environments
3. Add more detailed progress reporting from SPARC2 operations
4. Implement reconnection handling with event IDs
5. Add support for different event types (logs, errors, progress updates, etc.)