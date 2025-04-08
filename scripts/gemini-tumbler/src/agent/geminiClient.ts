/**
 * Client for interacting with the Gemini API
 */

import { GeminiConfig, TokenUsage } from "../types/index.ts";

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
    finishReason: string;
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  }>;
  promptFeedback: {
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  };
  usage?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

export class GeminiClient {
  private apiKey: string;
  private modelName: string;
  private temperature: number;
  private topP: number;
  private topK: number;
  private maxOutputTokens: number;
  private baseUrl = "https://generativelanguage.googleapis.com/v1beta";

  constructor(config: GeminiConfig) {
    if (!config.apiKey) {
      throw new Error("API key is required for GeminiClient");
    }
    this.apiKey = config.apiKey;
    this.modelName = config.modelName;
    this.temperature = config.temperature ?? 0.7;
    this.topP = config.topP ?? 0.95;
    this.topK = config.topK ?? 40;
    this.maxOutputTokens = config.maxOutputTokens ?? 2048;
  }

  /**
   * Generate a response from the Gemini model
   * @param prompt The prompt to send to the model
   * @param systemPrompt Optional system prompt
   * @returns The generated text and token usage
   */
  async generateText(prompt: string, systemPrompt?: string): Promise<{
    text: string;
    tokenUsage: TokenUsage;
  }> {
    try {
      const url = `${this.baseUrl}/models/${this.modelName}:generateContent?key=${this.apiKey}`;
      
      const requestBody: any = {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: this.temperature,
          topP: this.topP,
          topK: this.topK,
          maxOutputTokens: this.maxOutputTokens,
        }
      };
      
      // Add system prompt if provided
      if (systemPrompt) {
        requestBody.contents.unshift({
          role: "system",
          parts: [{ text: systemPrompt }]
        });
      }
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
      }
      
      const data = await response.json() as GeminiResponse;
      
      // Extract the generated text
      const text = data.candidates[0]?.content?.parts?.[0]?.text || "";
      
      // Extract token usage
      const tokenUsage: TokenUsage = {
        promptTokens: data.usage?.promptTokenCount || 0,
        completionTokens: data.usage?.candidatesTokenCount || 0,
        totalTokens: data.usage?.totalTokenCount || 0
      };
      
      return { text, tokenUsage };
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      throw error;
    }
  }

  /**
   * Estimate token count for a given text
   * This is a rough estimate as the actual tokenization depends on the model
   * @param text The text to estimate tokens for
   * @returns Estimated token count
   */
  estimateTokenCount(text: string): number {
    // A very rough estimate: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Set the model parameters
   * @param params Parameters to update
   */
  setParameters(params: Partial<{
    temperature: number;
    topP: number;
    topK: number;
    maxOutputTokens: number;
  }>): void {
    if (params.temperature !== undefined) this.temperature = params.temperature;
    if (params.topP !== undefined) this.topP = params.topP;
    if (params.topK !== undefined) this.topK = params.topK;
    if (params.maxOutputTokens !== undefined) this.maxOutputTokens = params.maxOutputTokens;
  }

  /**
   * Get the current model name
   * @returns The model name
   */
  getModelName(): string {
    return this.modelName;
  }
}