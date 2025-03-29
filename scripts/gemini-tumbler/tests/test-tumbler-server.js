/**
 * Test script for the Gemini Tumbler server's OpenAI-compatible endpoints
 */

console.log("Starting script...");

// Get the script directory path
const path = require('node:path');
const scriptDir = path.dirname(__filename);

// Load environment variables from .env file with relative paths
try {
  // Try multiple possible locations for the .env file
  const dotenv = require('dotenv');
  const envPaths = [
    path.join(scriptDir, '.env'),           // Same directory as script
    path.join(scriptDir, '..', '.env'),     // Parent directory
    path.join(process.cwd(), '.env'),       // Current working directory
    path.join(process.cwd(), 'scripts', 'gemini-tumbler', '.env') // Project-relative path
  ];
  
  let loaded = false;
  for (const envPath of envPaths) {
    try {
      dotenv.config({ path: envPath });
      console.log(`Loaded .env file from: ${envPath}`);
      loaded = true;
      break;
    } catch (err) {
      // Continue to next path
    }
  }
  
  if (!loaded) {
    console.log("Could not find .env file in any of the expected locations");
  }
} catch (error) {
  console.error("Error loading .env file:", error);
}

// Tumbler server URL - default to localhost:3000 if not specified
const TUMBLER_SERVER_URL = process.env.TUMBLER_SERVER_URL || 'http://localhost:3000';
console.log(`Using Tumbler server URL: ${TUMBLER_SERVER_URL}`);

// Use the global fetch API
async function testTumblerServer() {
  console.log("Testing Tumbler server's OpenAI-compatible endpoints...");
  
  try {
    // First, check if the server is running by hitting the health endpoint
    console.log("Checking server health...");
    const healthResponse = await fetch(`${TUMBLER_SERVER_URL}/health`);
    
    if (!healthResponse.ok) {
      console.error(`Server health check failed with status: ${healthResponse.status}`);
      console.error("Make sure the Tumbler server is running");
      return;
    }
    
    const healthData = await healthResponse.json();
    console.log("Server health:", healthData);
    
    // Get available models
    console.log("Getting available models...");
    const modelsResponse = await fetch(`${TUMBLER_SERVER_URL}/models`);
    
    if (!modelsResponse.ok) {
      console.error(`Failed to get models with status: ${modelsResponse.status}`);
      return;
    }
    
    const modelsData = await modelsResponse.json();
    console.log("Available models:", modelsData);
    
    // Test the OpenAI-compatible /chat/completions endpoint
    console.log("Testing /chat/completions endpoint...");
    const chatCompletionsResponse = await fetch(`${TUMBLER_SERVER_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gemini-2.5-pro-exp-03-25",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant."
          },
          {
            role: "user",
            content: "Hello, what is your name?"
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });
    
    if (!chatCompletionsResponse.ok) {
      console.error(`Chat completions request failed with status: ${chatCompletionsResponse.status}`);
      const errorText = await chatCompletionsResponse.text();
      console.error("Error:", errorText);
      return;
    }
    
    const chatCompletionsData = await chatCompletionsResponse.json();
    console.log("Chat completions response:");
    console.log(JSON.stringify(chatCompletionsData, null, 2));
    
    // Extract and display the assistant's message
    if (chatCompletionsData.choices && chatCompletionsData.choices.length > 0) {
      console.log("\nAssistant's response:");
      console.log(chatCompletionsData.choices[0].message.content);
    }
    
    console.log("\nTest completed successfully!");
  } catch (error) {
    console.error("Error testing Tumbler server:", error);
  }
}

// Run the test
console.log("Running test...");
testTumblerServer().catch(err => console.error("Test failed:", err));