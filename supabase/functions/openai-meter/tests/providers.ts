import { AIProvider, ResponseFormat, StreamChunk, ErrorTypes, APIError, CompletionRequest } from "./types.ts";

/**
 * OpenAI Provider implementation
 */
export class OpenAIProvider implements AIProvider {
  constructor(
    private apiKey: string,
    private organization?: string,
  ) {}

  async createCompletion(body: CompletionRequest): Promise<ResponseFormat> {
    try {
      const response = await fetch("https://api.openai.com/v1/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
          ...(this.organization && { "OpenAI-Organization": this.organization }),
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new APIError(
          ErrorTypes.OPENAI_ERROR,
          await response.text(),
          response.status
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(
        ErrorTypes.PROVIDER_ERROR,
        error instanceof Error ? error.message : "Unknown error",
        500
      );
    }
  }

  async createChatCompletion(body: CompletionRequest): Promise<ResponseFormat> {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
          ...(this.organization && { "OpenAI-Organization": this.organization }),
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new APIError(
          ErrorTypes.OPENAI_ERROR,
          await response.text(),
          response.status
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(
        ErrorTypes.PROVIDER_ERROR,
        error instanceof Error ? error.message : "Unknown error",
        500
      );
    }
  }

  async *streamCompletion(body: CompletionRequest): AsyncGenerator<StreamChunk> {
    try {
      const streamBody = { ...body, stream: true } as CompletionRequest;
      const response = await fetch("https://api.openai.com/v1/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
          ...(this.organization && { "OpenAI-Organization": this.organization }),
        },
        body: JSON.stringify(streamBody),
      });

      if (!response.ok) {
        throw new APIError(
          ErrorTypes.OPENAI_ERROR,
          await response.text(),
          response.status
        );
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new APIError(
          ErrorTypes.STREAM_ERROR,
          "Failed to get stream reader",
          500
        );
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim() === "") continue;
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") return;
            yield JSON.parse(data);
          }
        }
      }
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(
        ErrorTypes.PROVIDER_ERROR,
        error instanceof Error ? error.message : "Unknown error",
        500
      );
    }
  }
}

/**
 * Azure OpenAI Provider implementation
 */
export class AzureProvider implements AIProvider {
  constructor(
    private endpoint: string,
    private apiKey: string,
  ) {}

  async createCompletion(body: CompletionRequest): Promise<ResponseFormat> {
    try {
      const response = await fetch(`${this.endpoint}/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": this.apiKey,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new APIError(
          ErrorTypes.AZURE_ERROR,
          await response.text(),
          response.status
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(
        ErrorTypes.PROVIDER_ERROR,
        error instanceof Error ? error.message : "Unknown error",
        500
      );
    }
  }

  async createChatCompletion(body: CompletionRequest): Promise<ResponseFormat> {
    try {
      const response = await fetch(`${this.endpoint}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": this.apiKey,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new APIError(
          ErrorTypes.AZURE_ERROR,
          await response.text(),
          response.status
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(
        ErrorTypes.PROVIDER_ERROR,
        error instanceof Error ? error.message : "Unknown error",
        500
      );
    }
  }

  async *streamCompletion(body: CompletionRequest): AsyncGenerator<StreamChunk> {
    try {
      const streamBody = { ...body, stream: true } as CompletionRequest;
      const response = await fetch(`${this.endpoint}/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": this.apiKey,
        },
        body: JSON.stringify(streamBody),
      });

      if (!response.ok) {
        throw new APIError(
          ErrorTypes.AZURE_ERROR,
          await response.text(),
          response.status
        );
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new APIError(
          ErrorTypes.STREAM_ERROR,
          "Failed to get stream reader",
          500
        );
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim() === "") continue;
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") return;
            yield JSON.parse(data);
          }
        }
      }
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(
        ErrorTypes.PROVIDER_ERROR,
        error instanceof Error ? error.message : "Unknown error",
        500
      );
    }
  }
}

/**
 * Provider factory
 */
export function selectProvider(model: string): AIProvider {
  // Validate environment variables
  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  const azureEndpoint = Deno.env.get("AZURE_ENDPOINT");
  const azureKey = Deno.env.get("AZURE_API_KEY");

  if (!openaiKey && !azureKey) {
    throw new APIError(
      ErrorTypes.MISSING_API_KEY,
      "No API key provided",
      401
    );
  }

  // OpenAI models
  if (model.startsWith("gpt-") || model === "text-davinci-003") {
    if (!openaiKey) {
      throw new APIError(
        ErrorTypes.MISSING_API_KEY,
        "OpenAI API key required for GPT models",
        401
      );
    }
    return new OpenAIProvider(openaiKey);
  }

  // Azure models
  if (model.startsWith("azure-")) {
    if (!azureEndpoint || !azureKey) {
      throw new APIError(
        ErrorTypes.MISSING_API_KEY,
        "Azure API key required for Azure endpoint",
        401
      );
    }
    return new AzureProvider(azureEndpoint, azureKey);
  }

  throw new APIError(
    ErrorTypes.INVALID_MODEL,
    `Unsupported model: ${model}`,
    400
  );
}