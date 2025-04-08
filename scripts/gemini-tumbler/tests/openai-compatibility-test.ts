/**
 * Test script for OpenAI-compatible endpoints
 */

// Set up test parameters
const SERVER_URL = Deno.env.get("SERVER_URL") || "http://localhost:3000";
const TEST_PROMPT = "Explain the concept of quantum computing in simple terms.";
const TEST_SYSTEM_PROMPT = "You are a helpful assistant that explains complex topics in simple terms.";

// Test the /chat/completions endpoint
async function testChatCompletions() {
  console.log("\n=== Testing /chat/completions endpoint ===");
  
  const requestBody = {
    model: "gpt-4-turbo", // Will be mapped to gemini-2.5-pro-exp-03-25
    messages: [
      {
        role: "system",
        content: TEST_SYSTEM_PROMPT
      },
      {
        role: "user",
        content: TEST_PROMPT
      }
    ],
    temperature: 0.7,
    max_tokens: 500
  };
  
  try {
    console.log("Request:", JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(`${SERVER_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
    }
    
    const result = await response.json();
    console.log("Response status:", response.status);
    console.log("Response model:", result.model);
    console.log("Response content:", result.choices[0].message.content);
    console.log("Token usage:", result.usage);
    
    return true;
  } catch (error) {
    console.error("Error testing /chat/completions:", error);
    return false;
  }
}

// Test the /chat endpoint (alias for /chat/completions)
async function testChatEndpoint() {
  console.log("\n=== Testing /chat endpoint ===");
  
  const requestBody = {
    model: "gemini-2.5-pro-exp-03-25", // Direct model specification
    messages: [
      {
        role: "user",
        content: "What are the main differences between Gemini and GPT models?"
      }
    ],
    temperature: 0.5
  };
  
  try {
    console.log("Request:", JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(`${SERVER_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
    }
    
    const result = await response.json();
    console.log("Response status:", response.status);
    console.log("Response model:", result.model);
    console.log("Response content:", result.choices[0].message.content);
    console.log("Token usage:", result.usage);
    
    return true;
  } catch (error) {
    console.error("Error testing /chat endpoint:", error);
    return false;
  }
}

// Test the original /generate endpoint
async function testGenerateEndpoint() {
  console.log("\n=== Testing original /generate endpoint ===");
  
  const requestBody = {
    prompt: TEST_PROMPT,
    systemPrompt: TEST_SYSTEM_PROMPT,
    model: "gemini-1.5-pro", // Use gemini-1.5-pro as a fallback
    temperature: 0.7,
    maxTokens: 500
  };
  
  try {
    console.log("Request:", JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(`${SERVER_URL}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
    }
    
    const result = await response.json();
    console.log("Response status:", response.status);
    console.log("Response model:", result.model);
    console.log("Response content:", result.content);
    console.log("Token usage:", result.tokenUsage);
    
    return true;
  } catch (error) {
    console.error("Error testing /generate endpoint:", error);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log("Starting OpenAI compatibility tests...");
  console.log("Server URL:", SERVER_URL);
  
  let success = true;
  
  // Test /chat/completions endpoint
  if (!(await testChatCompletions())) {
    success = false;
  }
  
  // Test /chat endpoint
  if (!(await testChatEndpoint())) {
    success = false;
  }
  
  // Test /generate endpoint
  if (!(await testGenerateEndpoint())) {
    success = false;
  }
  
  console.log("\n=== Test Results ===");
  if (success) {
    console.log("✅ All tests passed!");
  } else {
    console.log("❌ Some tests failed. See errors above.");
  }
  
  return success;
}

// Run the tests
await runTests();