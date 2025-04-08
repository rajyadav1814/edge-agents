/**
 * Test script for Gemini 2.5 Pro using the Google Generative AI SDK
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

const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");

// Get API key from environment
const apiKey = process.env.GEMINI_API_KEY;
console.log("API Key:", apiKey ? `${apiKey.substring(0, 5)}...` : "Not found");

if (!apiKey) {
  console.error("Error: GEMINI_API_KEY environment variable is not set");
  console.error("Please set it in the .env file or as an environment variable");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
console.log("Initialized GoogleGenerativeAI");

// Initialize the model
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-pro-exp-03-25", // Using gemini-2.5-pro-exp-03-25
});
console.log("Initialized model: gemini-2.5-pro-exp-03-25");

// Configure generation parameters
const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 2048,
};
console.log("Set generation config");

async function run() {
  console.log("Starting chat session with Gemini 2.5 Pro Experimental...");
  
  try {
    // Start a chat session
    const chatSession = model.startChat({
      generationConfig,
      history: [],
    });
    console.log("Started chat session");

    // Send a message to the model
    console.log("Sending message to model...");
    const result = await chatSession.sendMessage("What are the main differences between Gemini and GPT models?");
    console.log("Received response from model");
    
    // Log the response
    console.log("Response from Gemini:");
    console.log(result.response.text());
    
    // Log token usage if available
    if (result.response.promptFeedback) {
      console.log("Prompt feedback:", result.response.promptFeedback);
    }
  } catch (error) {
    console.error("Error communicating with Gemini:", error);
  }
}

// Run the test
console.log("Running test...");
run().then(() => console.log("Test completed")).catch(err => console.error("Test failed:", err));