/**
 * Config Parser
 * 
 * This module is responsible for loading and parsing configuration from TOML files and environment variables.
 * It merges configurations from different sources and provides default values for missing configuration options.
 */

import { parse as parseToml } from "https://deno.land/std/toml/mod.ts";
import { AgenticBenchmarkConfig, SecurityLevel, AgentSize } from "../types/types.ts";

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
    const config = structuredClone(DEFAULT_CONFIG);
    
    // Load configuration from file
    try {
      const fileConfig = await this.loadConfigFromFile();
      
      // Merge benchmark configuration
      if (fileConfig.benchmark) {
        if (fileConfig.benchmark.name) {
          config.benchmark.name = fileConfig.benchmark.name;
        }
        if (fileConfig.benchmark.version) {
          config.benchmark.version = fileConfig.benchmark.version;
        }
      }
      
      // Merge steps configuration
      if (fileConfig.steps) {
        if (fileConfig.steps.min !== undefined) {
          config.steps.min = fileConfig.steps.min;
        }
        if (fileConfig.steps.max !== undefined) {
          config.steps.max = fileConfig.steps.max;
        }
        if (fileConfig.steps.increment !== undefined) {
          config.steps.increment = fileConfig.steps.increment;
        }
      }
      
      // Merge agent configuration
      if (fileConfig.agent) {
        if (fileConfig.agent.sizes) {
          config.agent.sizes = fileConfig.agent.sizes;
        }
        if (fileConfig.agent.tokenCacheEnabled !== undefined) {
          config.agent.tokenCacheEnabled = fileConfig.agent.tokenCacheEnabled;
        }
        if (fileConfig.agent.maxParallelAgents !== undefined) {
          config.agent.maxParallelAgents = fileConfig.agent.maxParallelAgents;
        }
        
        // Handle snake_case properties from TOML
        const agentObj = fileConfig.agent as any;
        if (agentObj.token_cache_enabled !== undefined) {
          config.agent.tokenCacheEnabled = agentObj.token_cache_enabled;
        }
        if (agentObj.max_parallel_agents !== undefined) {
          config.agent.maxParallelAgents = agentObj.max_parallel_agents;
        }
      }
      
      // Merge metrics configuration
      if (fileConfig.metrics) {
        if (fileConfig.metrics.include) {
          config.metrics.include = fileConfig.metrics.include;
        }
      }
      
      // Merge security configuration
      if (fileConfig.security) {
        if (fileConfig.security.level) {
          config.security.level = fileConfig.security.level;
        }
        if (fileConfig.security.adversarialTests) {
          config.security.adversarialTests = fileConfig.security.adversarialTests;
        }
        
        // Handle snake_case properties from TOML
        const securityObj = fileConfig.security as any;
        if (securityObj.adversarial_tests) {
          config.security.adversarialTests = securityObj.adversarial_tests;
        }
      }
      
      // Merge execution configuration
      if (fileConfig.execution) {
        config.execution = fileConfig.execution;
      }
    } catch (error: unknown) {
      console.warn(`Warning: Could not load configuration from file: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Load configuration from environment variables
    this.applyEnvironmentVariables(config);
    
    // Validate the configuration
    this.validateConfig(config);
    
    return config;
  }
  
  /**
   * Loads configuration from a TOML file
   * 
   * @returns Promise<Partial<AgenticBenchmarkConfig>> - The parsed configuration
   */
  private async loadConfigFromFile(): Promise<Partial<AgenticBenchmarkConfig>> {
    try {
      const content = await Deno.readTextFile(this.configPath);
      return parseToml(content) as Partial<AgenticBenchmarkConfig>;
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        throw new Error(`Configuration file not found: ${this.configPath}`);
      }
      throw error;
    }
  }
  
  /**
   * Applies environment variables to the configuration
   * 
   * @param config - The configuration to apply environment variables to
   */
  private applyEnvironmentVariables(config: AgenticBenchmarkConfig): void {
    // Benchmark configuration
    if (Deno.env.get("SPARC2_BENCHMARK_NAME")) {
      config.benchmark.name = Deno.env.get("SPARC2_BENCHMARK_NAME")!;
    }
    
    if (Deno.env.get("SPARC2_BENCHMARK_VERSION")) {
      config.benchmark.version = Deno.env.get("SPARC2_BENCHMARK_VERSION")!;
    }
    
    // Steps configuration
    if (Deno.env.get("SPARC2_STEPS_MIN")) {
      config.steps.min = parseInt(Deno.env.get("SPARC2_STEPS_MIN")!);
    }
    
    if (Deno.env.get("SPARC2_STEPS_MAX")) {
      config.steps.max = parseInt(Deno.env.get("SPARC2_STEPS_MAX")!);
    }
    
    if (Deno.env.get("SPARC2_STEPS_INCREMENT")) {
      config.steps.increment = parseInt(Deno.env.get("SPARC2_STEPS_INCREMENT")!);
    }
    
    // Agent configuration
    if (Deno.env.get("SPARC2_AGENT_SIZES")) {
      config.agent.sizes = Deno.env.get("SPARC2_AGENT_SIZES")!.split(",") as AgentSize[];
    }
    
    if (Deno.env.get("SPARC2_AGENT_TOKEN_CACHE")) {
      config.agent.tokenCacheEnabled = Deno.env.get("SPARC2_AGENT_TOKEN_CACHE") === "true";
    }
    
    if (Deno.env.get("SPARC2_AGENT_MAX_PARALLEL")) {
      config.agent.maxParallelAgents = parseInt(Deno.env.get("SPARC2_AGENT_MAX_PARALLEL")!);
    }
    
    // Metrics configuration
    if (Deno.env.get("SPARC2_METRICS_INCLUDE")) {
      config.metrics.include = Deno.env.get("SPARC2_METRICS_INCLUDE")!.split(",");
    }
    
    // Security configuration
    if (Deno.env.get("SPARC2_SECURITY_LEVEL")) {
      config.security.level = Deno.env.get("SPARC2_SECURITY_LEVEL") as SecurityLevel;
    }
    
    if (Deno.env.get("SPARC2_SECURITY_TESTS")) {
      config.security.adversarialTests = Deno.env.get("SPARC2_SECURITY_TESTS")!.split(",");
    }
    
    // Execution configuration
    if (Deno.env.get("SPARC2_EXECUTION_PROCESSING")) {
      if (!config.execution) {
        config.execution = {
          processing: Deno.env.get("SPARC2_EXECUTION_PROCESSING") as "sequential" | "parallel" | "concurrent" | "swarm"
        };
      } else {
        config.execution.processing = Deno.env.get("SPARC2_EXECUTION_PROCESSING") as "sequential" | "parallel" | "concurrent" | "swarm";
      }
    }
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
    
    // Validate security level
    const validLevels: SecurityLevel[] = ["strict", "moderate", "permissive"];
    if (!validLevels.includes(config.security.level)) {
      throw new Error(`Invalid security level: ${config.security.level}`);
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