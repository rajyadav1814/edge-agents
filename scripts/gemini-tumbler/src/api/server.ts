/**
 * API server for the gemini-tumbler service
 */

import { Application, Router } from "oak";
import { TumblerService } from "../agent/tumblerService.ts";
import { TumblerConfig, TumblerRequest, ContributionFeedback } from "../types/index.ts";

// Custom error interface
interface ApiError extends Error {
  status?: number;
  code?: string;
}

export class TumblerServer {
  private app: Application;
  private router: Router;
  private tumblerService: TumblerService;
  private port: number;

  constructor(config: TumblerConfig, port = 3000) {
    this.tumblerService = new TumblerService(config);
    this.port = port;
    
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
      ctx.response.body = {
        models: this.tumblerService.getAvailableModels()
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
   * Start the server
   */
  async start(): Promise<void> {
    console.log(`Starting server on port ${this.port}...`);
    await this.app.listen({ port: this.port });
  }
}