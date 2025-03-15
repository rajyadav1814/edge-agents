/**
 * Config Parser
 * Loads and parses TOML configuration files
 */

import { parse } from "toml";
import { load } from "dotenv";
import { join } from "path";
import { 
  AgentConfig, 
  RawAgentConfig 
} from "../utils/types.ts";
import { ProviderFactory } from "../providers/provider-factory.ts";

/**
 * Parse a TOML configuration file for agent configuration
 * @param configPath Path to the TOML configuration file
 * @returns Parsed agent configuration
 */
export async function parseAgentConfig(configPath: string): Promise<AgentConfig> {
  try {
    // Load environment variables if not already loaded
    load({ export: true });
    
    // Check if the file exists
    try {
      // Try to get file info to check if the file exists
      await Deno.stat(configPath);
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        throw new Error(`Configuration file not found: ${configPath}`);
      }
    }
    
    // Read the TOML file
    const tomlContent = await Deno.readTextFile(configPath);
    
    // Parse the TOML content
    const config = parse(tomlContent) as RawAgentConfig;
    
    // Process the configuration (resolve variables, etc.)
    return await processAgentConfig(config);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to parse agent configuration: ${errorMessage}`);
    throw error;
  }
}

/**
 * Process a raw agent configuration
 * @param config Raw agent configuration from TOML
 * @returns Processed agent configuration
 */
async function processAgentConfig(config: RawAgentConfig): Promise<AgentConfig> {
  // Create provider factory
  const factory = new ProviderFactory();
  
  // Create provider instances
  const providers: Record<string, any> = {};
  
  for (const [name, providerConfig] of Object.entries(config.providers || {})) {
    switch (providerConfig.type) {
      case "openai":
        providers[name] = factory.createOpenAIProvider(name, {
          apiKeyEnv: providerConfig.api_key_env,
          apiKey: providerConfig.api_key,
          defaultModel: providerConfig.default_model
        });
        break;
      
      case "openrouter":
        providers[name] = factory.createOpenRouterProvider(name, {
          apiKeyEnv: providerConfig.api_key_env,
          apiKey: providerConfig.api_key,
          defaultModel: providerConfig.default_model
        });
        break;
      
      case "mock":
        providers[name] = factory.createMockProvider(name, {
          defaultModel: providerConfig.default_model
        });
        break;
      
      default:
        throw new Error(`Unknown provider type: ${providerConfig.type}`);
    }
  }
  
  // Process flows
  const flows: Record<string, any> = {};
  
  for (const [name, flowConfig] of Object.entries(config.flows || {})) {
    const steps: Record<string, any> = {};
    
    for (const [stepName, stepConfig] of Object.entries(flowConfig.steps || {})) {
      // Resolve provider reference
      const providerName = stepConfig.provider;
      const provider = providers[providerName];
      
      if (!provider) {
        throw new Error(`Provider not found: ${providerName}`);
      }
      
      // Resolve model reference (if it contains a variable)
      let model = stepConfig.model;
      if (model && typeof model === 'string' && model.startsWith("${") && model.endsWith("}")) {
        const path = model.slice(2, -1).split(".");
        let value: any = config;
        
        for (const key of path) {
          value = value[key];
          if (value === undefined) {
            throw new Error(`Variable not found: ${model}`);
          }
        }
        
        model = value;
      }
      
      steps[stepName] = {
        name: stepName,
        provider: provider,
        model: model,
        description: stepConfig.description,
        systemPrompt: stepConfig.system_prompt,
        useAssistant: stepConfig.use_assistant || false,
        assistantInstructions: stepConfig.assistant_instructions,
        tools: stepConfig.tools || []
      };
    }
    
    flows[name] = {
      name,
      description: flowConfig.description,
      steps,
      transitions: flowConfig.transitions || {}
    };
  }
  
  return {
    name: config.agent.name,
    description: config.agent.description,
    defaultFlow: config.agent.default_flow,
    providers,
    flows
  };
}