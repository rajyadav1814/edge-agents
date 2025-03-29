/**
 * Example implementation of OpenAI-compatible streaming with Gemini API
 * 
 * This example shows how to implement an OpenAI-compatible streaming endpoint
 * that works with Google's Gemini API and simulates Tumbler service capabilities.
 */

import { Application, Router } from "oak";
import { load as loadEnv } from "dotenv";

// Load environment variables from .env file
await loadEnv({ export: true });

// Configuration
const PORT = parseInt(Deno.env.get("PORT") || "3000", 10);
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";
const DEFAULT_MODEL = Deno.env.get("DEFAULT_MODEL") || "gemini-2.5-pro-exp-03-25";

// Check if API key is available
if (!GEMINI_API_KEY) {
  console.error("Error: GEMINI_API_KEY environment variable is not set in .env file");
  Deno.exit(1);
}

// Model mapping from OpenAI to Gemini
const MODEL_MAPPING: Record<string, string> = {
  "gpt-3.5-turbo": "gemini-1.5-flash",
  "gpt-4": "gemini-1.5-pro",
  "gpt-4-turbo": "gemini-2.5-pro-exp-03-25",
  "gpt-4-turbo-preview": "gemini-2.5-pro-exp-03-25",
};

// Type definitions
interface OpenAIRequest {
  model: string;
  messages: Array<{
    role: string;
    content: string;
  }>;
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}

interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

interface TumblerRequest {
  prompt: string;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  contributionConsent?: boolean;
}

interface TumblerResponse {
  content: string;
  model: string;
  tokenUsage: TokenUsage;
  processingTime: number;
  id: string;
  timestamp: number;
}

interface ModelConfig {
  name: string;
  provider: string;
  apiKeyEnvVar: string;
  contextWindow: number;
  maxOutputTokens: number;
  capabilities: string[];
}

// Helper function to generate a unique ID
function generateId(): string {
  return `chatcmpl-${Math.random().toString(36).substring(2, 10)}`;
}

// Simplified Tumbler service for the example
class SimpleTumblerService {
  private models: ModelConfig[];
  private defaultModel: string;
  
  constructor(models: ModelConfig[], defaultModel: string) {
    this.models = models;
    this.defaultModel = defaultModel;
  }
  
  async processRequest(request: TumblerRequest): Promise<TumblerResponse> {
    const startTime = Date.now();
    const modelName = request.model || this.defaultModel;
    
    try {
      // Prepare Gemini API request
      const geminiRequest = {
        contents: [
          ...(request.systemPrompt ? [{
            role: "user",
            parts: [{ text: `${request.systemPrompt}\n\nRemember the above instructions for all your responses.` }]
          }] : []),
          {
            role: "user",
            parts: [{ text: request.prompt }]
          }
        ],
        generationConfig: {
          temperature: request.temperature || 0.7,
          maxOutputTokens: request.maxTokens || 1024,
          responseMimeType: "text/plain",
        },
      };
      
      // Call Gemini API
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(geminiRequest)
        }
      );
      
      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }
      
      const geminiResponse = await response.json();
      const content = geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
      // Estimate token usage (simplified)
      const promptTokens = JSON.stringify(geminiRequest).length / 4;
      const completionTokens = content.length / 4;
      
      return {
        content,
        model: modelName,
        tokenUsage: {
          promptTokens: Math.ceil(promptTokens),
          completionTokens: Math.ceil(completionTokens),
          totalTokens: Math.ceil(promptTokens + completionTokens)
        },
        processingTime: Date.now() - startTime,
        id: generateId(),
        timestamp: Math.floor(Date.now() / 1000)
      };
    } catch (error) {
      console.error("Error processing request:", error);
      throw error;
    }
  }
  
  getModels(): ModelConfig[] {
    return this.models;
  }
  
  getDefaultModel(): string {
    return this.defaultModel;
  }
}

// Initialize Tumbler models
const tumblerModels: ModelConfig[] = [
  {
    name: "gemini-2.5-pro-exp-03-25",
    provider: "google",
    apiKeyEnvVar: "GEMINI_API_KEY",
    contextWindow: 32000,
    maxOutputTokens: 8192,
    capabilities: ["code", "reasoning", "math"]
  },
  {
    name: "gemini-1.5-pro",
    provider: "google",
    apiKeyEnvVar: "GEMINI_API_KEY",
    contextWindow: 32000,
    maxOutputTokens: 8192,
    capabilities: ["code", "reasoning", "math"]
  },
  {
    name: "gemini-1.5-flash",
    provider: "google",
    apiKeyEnvVar: "GEMINI_API_KEY",
    contextWindow: 32000,
    maxOutputTokens: 8192,
    capabilities: ["fast-responses", "summarization"]
  }
];

// Initialize application
const app = new Application();
const router = new Router();
const tumblerService = new SimpleTumblerService(tumblerModels, DEFAULT_MODEL);

// OpenAI-compatible /chat/completions endpoint
router.post("/chat/completions", async (ctx) => {
  try {
    // Parse request body
    const requestBody = await ctx.request.body({ type: "json" }).value as OpenAIRequest;
    
    // Validate request
    if (!requestBody.messages || !Array.isArray(requestBody.messages) || requestBody.messages.length === 0) {
      ctx.response.status = 400;
      ctx.response.body = {
        error: {
          message: "messages is required and must be an array",
          type: "invalid_request_error",
          code: 400
        }
      };
      return;
    }
    
    // Extract parameters
    const isStreaming = requestBody.stream === true;
    const temperature = requestBody.temperature ?? 0.7;
    const maxTokens = requestBody.max_tokens ?? 1024;
    const openaiModelName = requestBody.model || "gpt-4-turbo";
    
    // Map OpenAI model to Gemini model
    const geminiModelName = MODEL_MAPPING[openaiModelName] || DEFAULT_MODEL;
    
    // Extract messages
    const systemMessage = requestBody.messages.find((m) => m.role === "system");
    const userMessages = requestBody.messages.filter((m) => m.role === "user");
    const lastUserMessage = userMessages[userMessages.length - 1];
    
    // Create Tumbler request
    const tumblerRequest: TumblerRequest = {
      prompt: lastUserMessage.content,
      systemPrompt: systemMessage?.content,
      model: geminiModelName,
      temperature: temperature,
      maxTokens: maxTokens,
      contributionConsent: true
    };
    
    // Create response ID and timestamp
    const responseId = generateId();
    const timestamp = Math.floor(Date.now() / 1000);
    
    if (isStreaming) {
      // Set up streaming response
      ctx.response.type = "text/event-stream";
      ctx.response.headers.set("Cache-Control", "no-cache");
      ctx.response.headers.set("Connection", "keep-alive");
      
      // Create readable stream for SSE
      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Send initial role message
            const initialChunk = {
              id: responseId,
              object: "chat.completion.chunk",
              created: timestamp,
              model: openaiModelName,
              choices: [{
                index: 0,
                delta: { role: "assistant" },
                finish_reason: null
              }]
            };
            controller.enqueue(`data: ${JSON.stringify(initialChunk)}\n\n`);
            
            // Process with Tumbler service
            let response: TumblerResponse;
            try {
              response = await tumblerService.processRequest(tumblerRequest);
              
              // Simulate streaming by breaking the response into chunks
              const content = response.content;
              const chunkSize = 5; // Characters per chunk
              
              for (let i = 0; i < content.length; i += chunkSize) {
                const chunk = content.substring(i, i + chunkSize);
                
                // Send content chunk in OpenAI format
                const openAIChunk = {
                  id: responseId,
                  object: "chat.completion.chunk",
                  created: timestamp,
                  model: openaiModelName,
                  choices: [{
                    index: 0,
                    delta: { content: chunk },
                    finish_reason: null
                  }]
                };
                controller.enqueue(`data: ${JSON.stringify(openAIChunk)}\n\n`);
                
                // Add a small delay to simulate streaming
                await new Promise(resolve => setTimeout(resolve, 10));
              }
              
              // Send final chunk
              const finalChunk = {
                id: responseId,
                object: "chat.completion.chunk",
                created: timestamp,
                model: openaiModelName,
                choices: [{
                  index: 0,
                  delta: {},
                  finish_reason: "stop"
                }]
              };
              controller.enqueue(`data: ${JSON.stringify(finalChunk)}\n\n`);
              
              // Send [DONE] message
              controller.enqueue("data: [DONE]\n\n");
              controller.close();
            } catch (error) {
              throw error;
            }
          } catch (error) {
            console.error("Streaming error:", error);
            const errorMessage = error instanceof Error ? error.message : "An error occurred during streaming";
            const errorResponse = {
              error: {
                message: errorMessage,
                type: "server_error",
                code: 500
              }
            };
            controller.enqueue(`data: ${JSON.stringify(errorResponse)}\n\n`);
            controller.close();
          }
        }
      });
      
      ctx.response.body = stream;
    } else {
      // Non-streaming response using Tumbler service
      try {
        const response = await tumblerService.processRequest(tumblerRequest);
        
        // Format as OpenAI response
        ctx.response.body = {
          id: responseId,
          object: "chat.completion",
          created: timestamp,
          model: openaiModelName,
          choices: [{
            index: 0,
            message: {
              role: "assistant",
              content: response.content
            },
            finish_reason: "stop"
          }],
          usage: {
            prompt_tokens: response.tokenUsage.promptTokens,
            completion_tokens: response.tokenUsage.completionTokens,
            total_tokens: response.tokenUsage.totalTokens
          }
        };
      } catch (error) {
        console.error("API error:", error);
        ctx.response.status = 500;
        ctx.response.body = {
          error: {
            message: error instanceof Error ? error.message : "An error occurred",
            type: "server_error",
            code: 500
          }
        };
      }
    }
  } catch (error) {
    console.error("Request error:", error);
    ctx.response.status = 400;
    ctx.response.body = {
      error: {
        message: "Invalid request format",
        type: "invalid_request_error",
        code: 400
      }
    };
  }
});

// Add routes to application
app.use(router.routes());
app.use(router.allowedMethods());

// Start server
console.log(`Starting OpenAI-compatible server on port ${PORT}...`);
console.log(`Using default model: ${DEFAULT_MODEL}`);
console.log(`Available models: ${tumblerModels.map((m: ModelConfig) => m.name).join(", ")}`);
await app.listen({ port: PORT });