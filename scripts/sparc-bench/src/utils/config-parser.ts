/**
 * SPARC 2.0 Agentic Benchmarking Suite Config Parser
 * 
 * This module is responsible for loading and parsing configuration from TOML files
 * and environment variables. It merges configurations from different sources and
 * provides default values for missing configuration options.
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
    let config = structuredClone(DEFAULT_CONFIG);
    
    // Load configuration from file
    try {
      const fileConfig = await this.loadConfigFromFile();
      config = this.mergeConfigs(config, fileConfig);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`Warning: Could not load configuration from file: ${errorMessage}`);
    }
    
    // Load configuration from environment variables
    const envConfig = this.loadConfigFromEnv();
    config = this.mergeConfigs(config, envConfig);
    
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
   * Loads configuration from environment variables
   * 
   * @returns Partial<AgenticBenchmarkConfig> - The parsed configuration
   */
  private loadConfigFromEnv(): Partial<AgenticBenchmarkConfig> {
    const config: Partial<AgenticBenchmarkConfig> = {};
    
    // Initialize nested objects if needed
    if (Deno.env.get("SPARC2_BENCHMARK_NAME") || Deno.env.get("SPARC2_BENCHMARK_VERSION")) {
      config.benchmark = { name: "", version: "" };
    }
    
    if (Deno.env.get("SPARC2_STEPS_MIN") || Deno.env.get("SPARC2_STEPS_MAX") || Deno.env.get("SPARC2_STEPS_INCREMENT")) {
      config.steps = { min: 0, max: 0, increment: 0 };
    }
    
    if (Deno.env.get("SPARC2_AGENT_SIZES") || Deno.env.get("SPARC2_AGENT_TOKEN_CACHE") || Deno.env.get("SPARC2_AGENT_MAX_PARALLEL")) {
      config.agent = { sizes: [], tokenCacheEnabled: false, maxParallelAgents: 0 };
    }
    
    if (Deno.env.get("SPARC2_METRICS_INCLUDE")) {
      config.metrics = { include: [] };
    }
    
    if (Deno.env.get("SPARC2_SECURITY_LEVEL") || Deno.env.get("SPARC2_SECURITY_TESTS")) {
      config.security = { level: "strict" as SecurityLevel, adversarialTests: [] };
    }
    
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
    
    return config;
  }
  
  /**
   * Merges two configurations
   * 
   * @param base Base configuration
   * @param override Override configuration
   * @returns Merged configuration
   */
  private mergeConfigs(base: AgenticBenchmarkConfig, override: Partial<AgenticBenchmarkConfig>): AgenticBenchmarkConfig {
    const result = structuredClone(base);
    
    // Merge benchmark configuration
    if (override.benchmark) {
      result.benchmark = { ...result.benchmark, ...override.benchmark };
    }
    
    // Merge steps configuration
    if (override.steps) {
      result.steps = { ...result.steps, ...override.steps };
    }
    
    // Merge agent configuration
    if (override.agent) {
      result.agent = { ...result.agent, ...override.agent };
    }
    
    // Merge metrics configuration
    if (override.metrics) {
      result.metrics = { ...result.metrics, ...override.metrics };
    }
    
    // Merge security configuration
    if (override.security) {
      result.security = { ...result.security, ...override.security };
    }
    
    return result;
  }
  
  /**
   * Validates the configuration
   * 
   * @param config - The configuration to validate
   * @throws Error if the configuration is invalid
   */
  private validateConfig(config: AgenticBenchmarkConfig): void {
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