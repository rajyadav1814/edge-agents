#!/usr/bin/env deno

/**
 * Configuration parser for the SPARC 2.0 Agentic Benchmark Suite
 * 
 * This module provides functionality to load and parse configuration from TOML files
 * and environment variables. It merges configurations from different sources and
 * provides default values for missing configuration options.
 */

import { parse as parseToml } from "https://deno.land/std/toml/mod.ts";
import { AgenticBenchmarkConfig, SecurityLevel, AgentSize } from "../types/types.ts";

/**
 * Type for partial configuration objects
 */
interface PartialConfig {
  benchmark?: Partial<AgenticBenchmarkConfig['benchmark']>;
  steps?: Partial<AgenticBenchmarkConfig['steps']>;
  agent?: Partial<AgenticBenchmarkConfig['agent']>;
  metrics?: Partial<AgenticBenchmarkConfig['metrics']>;
  security?: Partial<AgenticBenchmarkConfig['security']>;
  execution?: any;
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: AgenticBenchmarkConfig = {
  benchmark: {
    name: "SPARC 2.0 Agentic Suite",
    version: "1.0.0"
  },
  steps: {
    min: 1,
    max: 5,
    increment: 1
  },
  agent: {
    sizes: ["medium"],
    tokenCacheEnabled: false,
    maxParallelAgents: 1
  },
  metrics: {
    include: [
      "step_completion",
      "tool_accuracy",
      "token_efficiency",
      "trajectory_optimality"
    ]
  },
  security: {
    level: "strict",
    adversarialTests: ["code_injection", "prompt_leakage"]
  }
};

/**
 * Merges two configuration objects
 * 
 * @param target - The target configuration object
 * @param source - The source configuration object
 * @returns The merged configuration object
 */
function mergeConfigs(target: AgenticBenchmarkConfig, source: PartialConfig): AgenticBenchmarkConfig {
  const result = structuredClone(target);
  
  // Only merge defined properties to avoid overriding defaults with undefined values
  if (source.benchmark) {
    if (source.benchmark.name !== undefined) {
      result.benchmark.name = source.benchmark.name;
    }
    if (source.benchmark.version !== undefined) {
      result.benchmark.version = source.benchmark.version;
    }
  }
  
  if (source.steps) {
    if (source.steps.min !== undefined) {
      result.steps.min = source.steps.min;
    }
    if (source.steps.max !== undefined) {
      result.steps.max = source.steps.max;
    }
    if (source.steps.increment !== undefined) {
      result.steps.increment = source.steps.increment;
    }
  }
  
  if (source.agent) {
    if (source.agent.sizes) {
      result.agent.sizes = [...source.agent.sizes];
    }
    if (source.agent.tokenCacheEnabled !== undefined) {
      result.agent.tokenCacheEnabled = source.agent.tokenCacheEnabled;
    }
    if (source.agent.maxParallelAgents !== undefined) {
      result.agent.maxParallelAgents = source.agent.maxParallelAgents;
    }
  }
  
  if (source.metrics) {
    if (source.metrics.include !== undefined) {
      result.metrics.include = [...source.metrics.include];
    }
  }
  
  if (source.security) {
    if (source.security.level !== undefined) {
      result.security.level = source.security.level;
    }
    if (source.security.adversarialTests !== undefined) {
      result.security.adversarialTests = [...source.security.adversarialTests];
    }
  }
  
  if (source.execution) {
    if (!result.execution) {
      result.execution = {
        processing: "parallel"
      };
    }
    
    if (source.execution.processing) {
      result.execution.processing = source.execution.processing;
    }
  }
  
  return result;
}

/**
 * ConfigParser - Loads and parses configuration from TOML files and environment variables
 * 
 * This class is responsible for loading configuration from various sources,
 * merging them together, and providing default values for missing options.
 */
export class ConfigParser {
  /**
   * Path to the configuration file
   */
  private configPath: string;
  
  /**
   * Creates a new ConfigParser instance
   * 
   * @param configPath - Path to the configuration file (optional)
   */
  constructor(configPath?: string) {
    this.configPath = configPath || Deno.env.get("SPARC2_CONFIG_PATH") || "config.toml";
  }
  
  /**
   * Loads and parses the configuration
   * 
   * @returns Promise<AgenticBenchmarkConfig> - The parsed configuration
   */
  async loadConfig(): Promise<AgenticBenchmarkConfig> {
    // Start with default configuration
    let config = structuredClone(DEFAULT_CONFIG);
    
    // Load configuration from file
    try {
      const fileConfig = await this.loadConfigFromFile();
      config = mergeConfigs(config, fileConfig);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`Warning: Could not load configuration from file: ${errorMessage}`);
    }
    
    // Load configuration from environment variables
    const envConfig = this.loadConfigFromEnv();
    config = mergeConfigs(config, envConfig);
    
    // Validate the configuration
    this.validateConfig(config);
    
    return config;
  }
  
  /**
   * Loads configuration from a TOML file
   * 
   * @returns Promise<PartialConfig> - The parsed configuration
   */
  private async loadConfigFromFile(): Promise<PartialConfig> {
    try {
      const content = await Deno.readTextFile(this.configPath);
      const parsedToml = parseToml(content) as any;
      
      // Create a partial config object
      const fileConfig: PartialConfig = {};
      
      // Copy benchmark section
      if (parsedToml.benchmark) {
        fileConfig.benchmark = { ...parsedToml.benchmark };
      }
      
      // Copy steps section
      if (parsedToml.steps) {
        fileConfig.steps = { ...parsedToml.steps };
      }
      
      // Copy agent section with camelCase conversion
      if (parsedToml.agent) {
        fileConfig.agent = {
          sizes: parsedToml.agent.sizes ? [...parsedToml.agent.sizes] as AgentSize[] : undefined,
          tokenCacheEnabled: parsedToml.agent.token_cache_enabled,
          maxParallelAgents: parsedToml.agent.max_parallel_agents
        };
      }
      
      // Copy metrics section
      if (parsedToml.metrics) {
        fileConfig.metrics = { ...parsedToml.metrics };
      }
      
      // Copy security section
      if (parsedToml.security) {
        fileConfig.security = { ...parsedToml.security };
      }
      
      // Copy execution section
      if (parsedToml.execution) {
        fileConfig.execution = { ...parsedToml.execution };
        
        // Handle specific execution properties
        if (parsedToml.execution.processing) {
          fileConfig.execution.processing = parsedToml.execution.processing;
        }
      }
      
      return fileConfig;
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        const errorMsg = `Configuration file not found: ${this.configPath}`;
        throw new Error(errorMsg);
      }
      throw error;
    }
  }
  
  /**
   * Loads configuration from environment variables
   * 
   * @returns PartialConfig - The parsed configuration
   */
  private loadConfigFromEnv(): PartialConfig {
    const config: PartialConfig = {
      benchmark: {}, 
      steps: {}, 
      agent: {}, 
      metrics: {}, 
      security: {},
      execution: {}
    };
    
    // Benchmark configuration
    if (Deno.env.get("SPARC2_BENCHMARK_NAME")) {
      config.benchmark!.name = Deno.env.get("SPARC2_BENCHMARK_NAME")!;
    }
    
    if (Deno.env.get("SPARC2_BENCHMARK_VERSION")) {
      config.benchmark!.version = Deno.env.get("SPARC2_BENCHMARK_VERSION")!;
    }
    
    // Steps configuration
    if (Deno.env.get("SPARC2_STEPS_MIN")) {
      config.steps!.min = parseInt(Deno.env.get("SPARC2_STEPS_MIN")!);
    }
    
    if (Deno.env.get("SPARC2_STEPS_MAX")) {
      config.steps!.max = parseInt(Deno.env.get("SPARC2_STEPS_MAX")!);
    }
    
    if (Deno.env.get("SPARC2_STEPS_INCREMENT")) {
      config.steps!.increment = parseInt(Deno.env.get("SPARC2_STEPS_INCREMENT")!);
    }
    
    // Agent configuration
    if (Deno.env.get("SPARC2_AGENT_SIZES")) {
      config.agent!.sizes = Deno.env.get("SPARC2_AGENT_SIZES")!.split(",") as AgentSize[];
    }
    
    if (Deno.env.get("SPARC2_AGENT_TOKEN_CACHE")) {
      config.agent!.tokenCacheEnabled = Deno.env.get("SPARC2_AGENT_TOKEN_CACHE") === "true";
    }
    
    if (Deno.env.get("SPARC2_AGENT_MAX_PARALLEL")) {
      config.agent!.maxParallelAgents = parseInt(Deno.env.get("SPARC2_AGENT_MAX_PARALLEL")!);
    }
    
    // Metrics configuration
    if (Deno.env.get("SPARC2_METRICS_INCLUDE")) {
      config.metrics!.include = Deno.env.get("SPARC2_METRICS_INCLUDE")!.split(",");
    }
    
    // Security configuration
    if (Deno.env.get("SPARC2_SECURITY_LEVEL")) {
      config.security!.level = Deno.env.get("SPARC2_SECURITY_LEVEL") as SecurityLevel;
    }
    
    if (Deno.env.get("SPARC2_SECURITY_TESTS")) {
      config.security!.adversarialTests = Deno.env.get("SPARC2_SECURITY_TESTS")!.split(",");
    }

    // Execution configuration
    if (Deno.env.get("SPARC2_EXECUTION_PROCESSING")) {
      config.execution!.processing = Deno.env.get("SPARC2_EXECUTION_PROCESSING");
    }
    
    return config;
  }
  
  /**
   * Validates the configuration
   * 
   * @param config - The configuration to validate
   * @throws Error if the configuration is invalid
   */
  private validateConfig(config: AgenticBenchmarkConfig): void {
    // Validate agent sizes
    const validSizes: AgentSize[] = ["small", "medium", "large"];
    for (const size of config.agent.sizes) {
      if (!validSizes.includes(size)) {
        throw new Error(`Invalid agent size: ${size}`);
      }
    }
    
    // Validate steps
    if (config.steps.min < 1) {
      throw new Error("Steps min must be at least 1");
    }
    
    if (config.steps.max < config.steps.min) {
      throw new Error("Steps max must be greater than or equal to steps min");
    }
    
    if (config.steps.increment < 1) {
      throw new Error("Steps increment must be at least 1");
    }

    // Validate security level
    const validLevels: SecurityLevel[] = ["strict", "moderate", "permissive"];
    if (!validLevels.includes(config.security.level)) {
      throw new Error(`Invalid security level: ${config.security.level}`);
    }
    
    // Validate max parallel agents
    if (config.agent.maxParallelAgents < 1) {
      throw new Error("Max parallel agents must be at least 1");
    }
  }
}

/**
 * Loads the configuration from the specified path
 * 
 * @param configPath - Path to the configuration file (optional)
 * @returns Promise<AgenticBenchmarkConfig> - The parsed configuration
 */
export async function loadConfig(configPath?: string): Promise<AgenticBenchmarkConfig> {
  const parser = new ConfigParser(configPath);
  return await parser.loadConfig();
}