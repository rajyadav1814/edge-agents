// Test script for SSE endpoint at /sse
const http = require('http');

const MCP_URL = 'http://localhost:8002';

console.log(`Testing SSE connection to ${MCP_URL}/sse`);

// Make a request to the SSE endpoint with explicit Accept header
const req = http.request(`${MCP_URL}/sse`, {
  method: 'GET',
  headers: {
    'Accept': 'text/event-stream'
  }
}, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers, null, 2)}`);
  
  // Check if the content type is correct
  const contentType = res.headers['content-type'];
  console.log(`Content-Type: ${contentType}`);
  
  if (contentType !== 'text/event-stream') {
    console.error(`Error: Invalid content type, expected "text/event-stream", got "${contentType}"`);
    
    // Try to read the response body to see what's being returned
    let responseBody = '';
    res.on('data', (chunk) => {
      responseBody += chunk.toString();
    });
    
    res.on('end', () => {
      console.log('Response body:', responseBody);
      process.exit(1);
    });
  } else {
    console.log('Content-Type is correct!');
    
    // Handle the SSE stream
    let eventCount = 0;
    const events = {};
    
    res.on('data', (chunk) => {
      const data = chunk.toString();
      console.log(`Received SSE data: ${data}`);
      
      // Parse the SSE events
      const eventMatches = data.match(/event: ([^\n]+)\ndata: (.+)\n\n/g);
      if (eventMatches) {
        eventMatches.forEach(match => {
          const eventMatch = match.match(/event: ([^\n]+)\ndata: (.+)\n\n/);
          if (eventMatch) {
            const eventName = eventMatch[1];
            const eventData = eventMatch[2];
            
            // Track the event
            events[eventName] = events[eventName] || 0;
            events[eventName]++;
            eventCount++;
            
            console.log(`Event: ${eventName}, Data: ${eventData}`);
          }
        });
      }
    });
    
    // Set a timeout to close the connection after 10 seconds
    setTimeout(() => {
      console.log('\nTest summary:');
      console.log(`Total events received: ${eventCount}`);
      console.log('Events by type:');
      Object.keys(events).forEach(eventName => {
        console.log(`- ${eventName}: ${events[eventName]}`);
      });
      
      console.log('\nTest completed successfully');
      req.destroy();
      process.exit(0);
    }, 10000);
  }
});

req.on('error', (error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});

req.end();