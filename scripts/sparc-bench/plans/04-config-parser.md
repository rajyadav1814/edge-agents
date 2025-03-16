# Config Parser Implementation Plan

## Overview

The `config-parser.ts` file is responsible for loading and parsing configuration from TOML files and environment variables. It merges configurations from different sources and provides default values for missing configuration options.

## Requirements

1. Load configuration from TOML files
2. Parse environment variables
3. Merge configurations from different sources
4. Provide default values for missing configuration options
5. Validate configuration values

## Implementation Details

### Imports and Dependencies

```typescript
import { parse as parseToml } from "https://deno.land/std/toml/mod.ts";
import { AgenticBenchmarkConfig, SecurityLevel, AgentSize } from "../types/types.ts";
import { deepMerge } from "https://deno.land/std/collections/deep_merge.ts";
```

### Default Configuration

```typescript
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
```

### Main Class

```typescript
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
      config = deepMerge(config, fileConfig);
    } catch (error) {
      console.warn(`Warning: Could not load configuration from file: ${error.message}`);
    }
    
    // Load configuration from environment variables
    const envConfig = this.loadConfigFromEnv();
    config = deepMerge(config, envConfig);
    
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
    const config: Partial<AgenticBenchmarkConfig> = {
      benchmark: {},
      steps: {},
      agent: {},
      metrics: {},
      security: {}
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
    
    return config;
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
```

### Helper Functions

```typescript
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
```

## Testing

The `ConfigParser` should be tested to ensure it correctly loads and parses configuration:

```typescript
Deno.test("ConfigParser - loadConfig with default values", async () => {
  // Create a temporary config file
  const tempFile = await Deno.makeTempFile({ suffix: ".toml" });
  
  try {
    // Write minimal config to the file
    await Deno.writeTextFile(tempFile, `
      [benchmark]
      name = "Test Benchmark"
    `);
    
    // Load the config
    const parser = new ConfigParser(tempFile);
    const config = await parser.loadConfig();
    
    // Check that the name was loaded from the file
    assertEquals(config.benchmark.name, "Test Benchmark");
    
    // Check that default values were applied
    assertEquals(config.steps.min, 1);
    assertEquals(config.steps.max, 5);
    assertEquals(config.agent.sizes, ["medium"]);
    assertEquals(config.security.level, "strict");
  } finally {
    // Clean up
    await Deno.remove(tempFile);
  }
});

Deno.test("ConfigParser - loadConfig with environment variables", async () => {
  // Set environment variables
  Deno.env.set("SPARC2_BENCHMARK_NAME", "Env Benchmark");
  Deno.env.set("SPARC2_STEPS_MIN", "2");
  Deno.env.set("SPARC2_AGENT_SIZES", "small,large");
  
  try {
    // Load the config
    const parser = new ConfigParser();
    const config = await parser.loadConfig();
    
    // Check that environment variables were applied
    assertEquals(config.benchmark.name, "Env Benchmark");
    assertEquals(config.steps.min, 2);
    assertEquals(config.agent.sizes, ["small", "large"]);
  } finally {
    // Clean up
    Deno.env.delete("SPARC2_BENCHMARK_NAME");
    Deno.env.delete("SPARC2_STEPS_MIN");
    Deno.env.delete("SPARC2_AGENT_SIZES");
  }
});

Deno.test("ConfigParser - validateConfig throws on invalid values", async () => {
  // Create a temporary config file with invalid values
  const tempFile = await Deno.makeTempFile({ suffix: ".toml" });
  
  try {
    // Write invalid config to the file
    await Deno.writeTextFile(tempFile, `
      [steps]
      min = 0
      max = 0
      increment = 0
      
      [agent]
      sizes = ["invalid"]
      maxParallelAgents = 0
      
      [security]
      level = "invalid"
    `);
    
    // Load the config should throw
    const parser = new ConfigParser(tempFile);
    await assertRejects(
      async () => await parser.loadConfig(),
      Error,
      "Steps min must be at least 1"
    );
  } finally {
    // Clean up
    await Deno.remove(tempFile);
  }
});
```

## Integration

The `ConfigParser` will be used by the main entry point (`sparc-bench.ts`) to load the configuration for the benchmarking suite. It will also be used by the CLI to parse command-line arguments and merge them with the configuration from the file and environment variables.