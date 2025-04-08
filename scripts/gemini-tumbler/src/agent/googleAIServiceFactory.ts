/**
 * Factory for creating Google AI service clients
 */

import { GoogleAIClient, ServiceConfig } from "../types/googleAIClient.ts";
import { GoogleGeminiClient } from "./googleGeminiClient.ts";
import { VertexAIClient } from "./vertexAIClient.ts";
import { NaturalLanguageClient } from "./naturalLanguageClient.ts";
import { DocumentAIClient } from "./documentAIClient.ts";

/**
 * Factory class for creating Google AI service clients
 */
export class GoogleAIServiceFactory {
  /**
   * Create a client for the specified service type
   * @param config Service configuration
   * @returns The created client
   */
  static createClient(config: ServiceConfig): GoogleAIClient {
    switch (config.serviceType) {
      case 'gemini':
        return new GoogleGeminiClient({
          apiKey: config.apiKey,
          apiKeys: config.apiKeys,
          modelName: config.parameters?.modelName || "gemini-1.5-pro",
          temperature: config.parameters?.temperature,
          topP: config.parameters?.topP,
          topK: config.parameters?.topK,
          maxOutputTokens: config.parameters?.maxOutputTokens
        });

      case 'vertex':
        return new VertexAIClient({
          apiKey: config.apiKey,
          apiKeys: config.apiKeys,
          projectId: config.projectId,
          region: config.region || "us-central1",
          modelName: config.parameters?.modelName || "gemini-1.5-pro",
          parameters: config.parameters
        });

      case 'natural-language':
        return new NaturalLanguageClient({
          apiKey: config.apiKey,
          apiKeys: config.apiKeys,
          projectId: config.projectId,
          parameters: config.parameters
        });

      case 'document-ai':
        return new DocumentAIClient({
          apiKey: config.apiKey,
          apiKeys: config.apiKeys,
          projectId: config.projectId,
          processorId: config.parameters?.processorId,
          location: config.region || "us",
          parameters: config.parameters
        });

      default:
        throw new Error(`Unsupported service type: ${config.serviceType}`);
    }
  }

  /**
   * Get the available service types
   * @returns Array of available service types
   */
  static getAvailableServiceTypes(): string[] {
    return [
      'gemini',
      'vertex',
      'natural-language',
      'document-ai'
    ];
  }

  /**
   * Get default capabilities for a service type
   * @param serviceType The service type
   * @returns Array of capabilities
   */
  static getDefaultCapabilities(serviceType: string): string[] {
    switch (serviceType) {
      case 'gemini':
        return [
          'text-generation',
          'code-generation',
          'chat',
          'reasoning'
        ];
      case 'vertex':
        return [
          'text-generation',
          'code-generation',
          'embedding',
          'chat',
          'reasoning',
          'multimodal'
        ];
      case 'natural-language':
        return [
          'entity-recognition',
          'sentiment-analysis',
          'content-classification',
          'syntax-analysis'
        ];
      case 'document-ai':
        return [
          'document-ocr',
          'form-parsing',
          'entity-extraction',
          'document-classification'
        ];
      default:
        return [];
    }
  }

  /**
   * Get default usage limits for a service type
   * @param serviceType The service type
   * @returns Usage limits
   */
  static getDefaultUsageLimits(serviceType: string): { requestsPerMinute: number; requestsPerDay: number } {
    switch (serviceType) {
      case 'gemini':
        return {
          requestsPerMinute: 15,
          requestsPerDay: 1500
        };
      case 'vertex':
        return {
          requestsPerMinute: 20,
          requestsPerDay: 2000
        };
      case 'natural-language':
        return {
          requestsPerMinute: 10,
          requestsPerDay: 1000
        };
      case 'document-ai':
        return {
          requestsPerMinute: 5,
          requestsPerDay: 500
        };
      default:
        return {
          requestsPerMinute: 10,
          requestsPerDay: 1000
        };
    }
  }
}