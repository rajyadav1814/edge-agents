/**
 * Simple test script for Gemini 2.5 Pro Experimental (gemini-2.5-pro-exp-03-25)
 * with a very basic prompt
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

// Initialize the model - specifically gemini-2.5-pro-exp-03-25
const modelName = "gemini-2.5-pro-exp-03-25";
const model = genAI.getGenerativeModel({
  model: modelName,
});
console.log(`Initialized model: ${modelName}`);

// Configure generation parameters
const generationConfig = {
  temperature: 0.7,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 500,
};
console.log("Set generation config");

async function run() {
  console.log(`Starting content generation with ${modelName}...`);
  
  try {
    // Generate content with a very simple prompt
    console.log("Sending simple prompt to model...");
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: "Hello, what is your name?" }] }],
      generationConfig,
    });
    
    console.log("Received response from model");
    
    // Log the response
    console.log("Response from Gemini 2.5 Pro Experimental:");
    console.log(result.response.text());
    
    // Log token usage if available
    if (result.response.promptFeedback) {
      console.log("Prompt feedback:", result.response.promptFeedback);
    }
  } catch (error) {
    console.error("Error communicating with Gemini:", error);
    console.error("Error details:", error.message);
    if (error.response) {
      console.error("Response error:", error.response);
    }
  }
}

// Run the test
console.log("Running test...");
run().then(() => console.log("Test completed")).catch(err => console.error("Test failed:", err));