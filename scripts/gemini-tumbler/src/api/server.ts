/**
 * API server for the gemini-tumbler service
 */

import { Application, Router, Context } from "oak";
import { TumblerService } from "../agent/tumblerService.ts";
import { TumblerConfig, TumblerRequest, ContributionFeedback } from "../types/index.ts";

// Custom error interface
interface ApiError extends Error {
  status?: number;
  code?: string;
}

// OpenAI-compatible types
interface OpenAIChatMessage {
  role: string;
  content: string;
}

interface OpenAIChatCompletionsRequest {
  model?: string;
  messages: OpenAIChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface OpenAIChatCompletionsResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: OpenAIChatMessage;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class TumblerServer {
  private app: Application;
  private router: Router;
  private tumblerService: TumblerService;
  private port: number;
  private defaultModel: string;

  constructor(config: TumblerConfig, port = 3000) {
    this.tumblerService = new TumblerService(config);
    this.port = port;
    this.defaultModel = config.defaultModel;
    
    // Initialize Oak application
    this.app = new Application();
    this.router = new Router();
    
    // Set up middleware
    this.setupMiddleware();
    
    // Set up routes
    this.setupRoutes();
  }

  /**
   * Set up middleware for the application
   */
  private setupMiddleware(): void {
    // Error handling middleware
    this.app.use(async (ctx, next) => {
      try {
        await next();
      } catch (error) {
        console.error("Error handling request:", error);
        
        const err = error as ApiError;
        ctx.response.status = err.status || 500;
        ctx.response.body = {
          error: err.message || "Internal Server Error",
          code: err.status || 500,
          details: Deno.env.get("ENVIRONMENT") === "development" ? err.stack : undefined
        };
      }
    });
    
    // Logging middleware
    this.app.use(async (ctx, next) => {
      const start = Date.now();
      await next();
      const ms = Date.now() - start;
      console.log(`${ctx.request.method} ${ctx.request.url.pathname} - ${ctx.response.status} - ${ms}ms`);
    });
    
    // CORS middleware
    this.app.use(async (ctx, next) => {
      ctx.response.headers.set("Access-Control-Allow-Origin", "*");
      ctx.response.headers.set(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      ctx.response.headers.set(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
      );
      
      if (ctx.request.method === "OPTIONS") {
        ctx.response.status = 204;
        return;
      }
      
      await next();
    });
  }

  /**
   * Set up routes for the application
   */
  private setupRoutes(): void {
    // Health check endpoint
    this.router.get("/health", (ctx) => {
      ctx.response.body = { status: "ok", timestamp: Date.now() };
    });
    
    // Models endpoint - get available models
    this.router.get("/models", (ctx) => {
      const models = this.tumblerService.getAvailableModels();
      ctx.response.body = {
        models: models.map(model => ({
          name: model.name,
          provider: model.provider,
          capabilities: model.capabilities,
          isDefault: model.name === this.defaultModel
        }))
      };
    });
    
    // Generate endpoint - process a request
    this.router.post("/generate", async (ctx) => {
      if (!ctx.request.hasBody) {
        ctx.response.status = 400;
        ctx.response.body = {
          error: "Request body is required",
          code: 400
        };
        return;
      }
      
      const body = await ctx.request.body({ type: "json" }).value as TumblerRequest;
      
      // Validate request
      if (!body.prompt) {
        ctx.response.status = 400;
        ctx.response.body = {
          error: "Prompt is required",
          code: 400
        };
        return;
      }
      
      // Process request
      const response = await this.tumblerService.processRequest(body);
      ctx.response.body = response;
    });
    
    // OpenAI-compatible /chat endpoint (alias for /chat/completions)
    this.router.post("/chat", async (ctx) => {
      await this.handleChatCompletionsRequest(ctx);
    });
    
    // OpenAI-compatible /chat/completions endpoint
    this.router.post("/chat/completions", async (ctx) => {
      await this.handleChatCompletionsRequest(ctx);
    });
    
    // Anonymous ID endpoint - generate a new anonymous ID
    this.router.get("/anonymous-id", (ctx) => {
      const contributionManager = this.tumblerService.getContributionManager();
      const anonymousId = contributionManager.generateAnonymousUserId();
      
      ctx.response.body = { anonymousId };
    });
    
    // Feedback endpoint - add feedback to a contribution
    this.router.post("/feedback/:id", async (ctx) => {
      if (!ctx.params.id) {
        ctx.response.status = 400;
        ctx.response.body = {
          error: "Contribution ID is required",
          code: 400
        };
        return;
      }
      
      if (!ctx.request.hasBody) {
        ctx.response.status = 400;
        ctx.response.body = {
          error: "Request body is required",
          code: 400
        };
        return;
      }
      
      const body = await ctx.request.body({ type: "json" }).value as ContributionFeedback;
      
      // Add feedback
      const contributionManager = this.tumblerService.getContributionManager();
      const success = await contributionManager.addFeedback(ctx.params.id, body);
      
      if (!success) {
        ctx.response.status = 404;
        ctx.response.body = {
          error: "Contribution not found",
          code: 404
        };
        return;
      }
      
      ctx.response.body = { success: true };
    });
    
    // Apply router to application
    this.app.use(this.router.routes());
    this.app.use(this.router.allowedMethods());
  }

  /**
   * Handle OpenAI-compatible chat completions request
   */
  private async handleChatCompletionsRequest(ctx: Context): Promise<void> {
    if (!ctx.request.hasBody) {
      ctx.response.status = 400;
      ctx.response.body = {
        error: {
          message: "Request body is required",
          type: "invalid_request_error",
          code: 400
        }
      };
      return;
    }
    
    const body = await ctx.request.body({ type: "json" }).value as OpenAIChatCompletionsRequest;
    
    // Validate request
    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
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
    
    // Extract system message and user message
    const systemMessage = body.messages.find(m => m.role === "system");
    const userMessages = body.messages.filter(m => m.role === "user");
    const lastUserMessage = userMessages[userMessages.length - 1];
    
    if (!lastUserMessage) {
      ctx.response.status = 400;
      ctx.response.body = {
        error: {
          message: "At least one user message is required",
          type: "invalid_request_error",
          code: 400
        }
      };
      return;
    }
    
    // Map OpenAI model to Gemini model if needed
    let modelName = body.model || this.defaultModel;
    
    // If the model name starts with "gpt-", map it to a Gemini model
    if (modelName.startsWith("gpt-")) {
      if (modelName.includes("4-turbo") || modelName.includes("4o")) {
        modelName = "gemini-1.5-pro"; // Use gemini-1.5-pro instead of gemini-2.5-pro-exp-03-25
      } else if (modelName.includes("4")) {
        modelName = "gemini-1.5-pro";
      } else {
        modelName = "gemini-1.5-flash";
      }
    }
    
    // Create Tumbler request
    const tumblerRequest: TumblerRequest = {
      prompt: lastUserMessage.content,
      systemPrompt: systemMessage?.content,
      model: modelName,
      temperature: body.temperature,
      maxTokens: body.max_tokens,
      contributionConsent: true
    };
    
    // Process request
    const response = await this.tumblerService.processRequest(tumblerRequest);
    
    // Debug response
    console.log(`TumblerService response: ${JSON.stringify(response, null, 2)}`);
    
    // Format as OpenAI response
    // Check if response.content is empty or undefined
    if (!response.content) {
      console.error("Error: Empty response content", response);
      ctx.response.status = 500;
      ctx.response.body = {
        error: {
          message: "The language model did not provide any assistant messages",
          type: "server_error",
          code: 500
        }
      };
      return;
    }
    
    // Always provide a valid response even if it contains tool code
    if (response.content.includes("<replace_in_file>") || 
        response.content.includes("<read_file>") || 
        response.content.includes("<write_to_file>") || 
        response.content.includes("<execute_command>") ||
        response.content.includes("```tool_code")) {
      console.warn("Warning: Response contains tool code or non-assistant content");
      // Keep the response as is - don't modify it
    }
    
    const openAIResponse: OpenAIChatCompletionsResponse = {
      id: response.id,
      object: "chat.completion",
      created: Math.floor(response.timestamp / 1000),
      model: body.model || this.defaultModel, // Return the requested model name
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
    
    ctx.response.body = openAIResponse;
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    // Server startup message is now handled in index.ts
    await this.app.listen({ port: this.port });
  }
}