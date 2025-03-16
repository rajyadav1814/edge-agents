/**
 * SPARC 2.0 Agentic Benchmarking Suite Config Parser
 * Parses configuration files
 */

import { parse as parseToml } from "https://deno.land/std@0.203.0/toml/mod.ts";
import { AgenticBenchmarkConfig, BenchmarkTask } from "../types/types.ts";

/**
 * Parse configuration file
 * @param path Path to configuration file
 * @returns Parsed configuration
 */
export async function parseConfig(path: string): Promise<AgenticBenchmarkConfig> {
  try {
    // Read configuration file
    const configText = await Deno.readTextFile(path);
    
    // Parse TOML
    const config = parseToml(configText) as Record<string, any>;
    
    // Convert to AgenticBenchmarkConfig
    return {
      steps: {
        min: config.steps?.min ?? 1,
        max: config.steps?.max ?? 10,
        increment: config.steps?.increment ?? 1,
      },
      agent: {
        sizes: config.agent?.sizes ?? ["small"],
        tokenCache: config.agent?.token_cache_enabled ?? false,
        maxParallel: config.agent?.max_parallel_agents ?? 1,
      },
      metrics: config.metrics?.include ?? [
        "step_completion",
        "tool_accuracy",
        "token_efficiency",
      ],
      security: {
        level: config.security?.level ?? "strict",
        adversarialTests: config.security?.adversarial_tests ?? [],
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error parsing configuration file: ${errorMessage}`);
    throw new Error(`Failed to parse configuration file: ${errorMessage}`);
  }
}

/**
 * Load configuration from environment variables
 * @returns Configuration from environment variables
 */
export function loadConfigFromEnv(): Partial<AgenticBenchmarkConfig> {
  const stepsMin = Deno.env.get("SPARC_BENCH_STEPS_MIN");
  const stepsMax = Deno.env.get("SPARC_BENCH_STEPS_MAX");
  const stepsIncrement = Deno.env.get("SPARC_BENCH_STEPS_INCREMENT");
  const agentSizes = Deno.env.get("SPARC_BENCH_AGENT_SIZES");
  const tokenCache = Deno.env.get("SPARC_BENCH_TOKEN_CACHE");
  const maxParallel = Deno.env.get("SPARC_BENCH_MAX_PARALLEL");
  const securityLevel = Deno.env.get("SPARC_BENCH_SECURITY_LEVEL");
  const adversarialTests = Deno.env.get("SPARC_BENCH_ADVERSARIAL_TESTS");
  
  return {
    steps: stepsMin || stepsMax || stepsIncrement ? {
      min: stepsMin ? Number(stepsMin) : 1,
      max: stepsMax ? Number(stepsMax) : 10,
      increment: stepsIncrement ? Number(stepsIncrement) : 1,
    } : undefined,
    agent: agentSizes || tokenCache || maxParallel ? {
      sizes: agentSizes ? agentSizes.split(",") as ("small" | "medium" | "large")[] : ["small"],
      tokenCache: tokenCache === "true",
      maxParallel: maxParallel ? Number(maxParallel) : 1,
    } : undefined,
    security: securityLevel || adversarialTests ? {
      level: (securityLevel || "strict") as "strict" | "moderate" | "permissive",
      adversarialTests: adversarialTests ? adversarialTests.split(",") : [],
    } : undefined,
  };
}

/**
 * Merge configurations
 * @param base Base configuration
 * @param override Override configuration
 * @returns Merged configuration
 */
export function mergeConfigs(base: AgenticBenchmarkConfig, override: Partial<AgenticBenchmarkConfig>): AgenticBenchmarkConfig {
  return { ...base, ...override };
}

/**
 * Load tasks from file
 * @param path Path to tasks file
 * @returns Tasks
 */
export async function loadTasks(path: string): Promise<BenchmarkTask[]> {
  const tasksText = await Deno.readTextFile(path);
  return JSON.parse(tasksText) as BenchmarkTask[];
}

/**
 * Save configuration to file
 * @param config Configuration to save
 * @param path Path to save configuration to
 */
export async function saveConfig(config: AgenticBenchmarkConfig, path: string): Promise<void> {
  await Deno.writeTextFile(path, JSON.stringify(config, null, 2));
}