/**
 * SPARC 2.0 Agentic Benchmarking Suite Config Parser Tests
 * 
 * This file contains tests for the ConfigParser class.
 */

import { assertEquals, assertRejects } from "https://deno.land/std/testing/asserts.ts";
import { ConfigParser, loadConfig } from "../utils/config-parser.ts";

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
  Deno.env.set("SPARC2_STEPS_MAX", "5"); // Ensure max >= min
  Deno.env.set("SPARC2_STEPS_INCREMENT", "1"); // Ensure increment >= 1
  
  try {
    // Load the config
    const parser = new ConfigParser();
    const config = await parser.loadConfig();
    
    // Check that environment variables were applied
    assertEquals(config.benchmark.name, "Env Benchmark");
    assertEquals(config.steps.min, 2);
    assertEquals(config.steps.max, 5);
    assertEquals(config.steps.increment, 1);
  } finally {
    // Clean up
    Deno.env.delete("SPARC2_BENCHMARK_NAME");
    Deno.env.delete("SPARC2_STEPS_MIN");
    Deno.env.delete("SPARC2_STEPS_MAX");
    Deno.env.delete("SPARC2_STEPS_INCREMENT");
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

Deno.test("loadConfig helper function", async () => {
  // Create a temporary config file
  const tempFile = await Deno.makeTempFile({ suffix: ".toml" });
  
  try {
    // Write config to the file
    await Deno.writeTextFile(tempFile, `
      [benchmark]
      name = "Helper Test"
      version = "1.2.3"
    `);
    
    // Load the config using the helper function
    const config = await loadConfig(tempFile);
    
    // Check that the config was loaded correctly
    assertEquals(config.benchmark.name, "Helper Test");
    assertEquals(config.benchmark.version, "1.2.3");
  } finally {
    // Clean up
    await Deno.remove(tempFile);
  }
});