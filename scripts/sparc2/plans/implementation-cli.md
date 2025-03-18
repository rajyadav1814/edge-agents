# CLI Implementation Plan

## Overview

This document outlines the plan to implement a fully functional CLI for the SPARC2 project that integrates the E2B code interpreter and agent framework implementations.

## Current Status

The current implementation in `src/cli/cli.ts` provides a basic CLI structure but relies on mock implementations for the core functionality. It needs to be updated to use the real implementations of the E2B code interpreter and agent framework.

## Implementation Goals

1. Create a comprehensive CLI that exposes all SPARC2 functionality
2. Integrate the E2B code interpreter and agent framework implementations
3. Support configuration via command-line arguments and TOML files
4. Provide clear error handling and user feedback
5. Ensure all tests continue to pass with the new implementation

## Architecture

The CLI will follow a command-based architecture:

```
sparc2
├── analyze [files...] - Analyze code files for issues and improvements
├── modify [files...] - Apply suggested modifications to code files
├── execute [file] - Execute code in a sandbox
├── search [query] - Search for similar code changes
├── checkpoint [message] - Create a git checkpoint
├── rollback [commit] - Rollback to a previous checkpoint
└── config - Manage configuration
```

## Implementation Steps

### 1. Update CLI Command Structure

```typescript
/**
 * CLI command structure
 */
interface Command {
  name: string;
  description: string;
  options: CommandOption[];
  action: (args: Record<string, any>, options: Record<string, any>) => Promise<void>;
}

/**
 * CLI command option
 */
interface CommandOption {
  name: string;
  shortName?: string;
  description: string;
  type: "string" | "boolean" | "number";
  required?: boolean;
  default?: any;
}

/**
 * CLI commands
 */
const commands: Command[] = [
  {
    name: "analyze",
    description: "Analyze code files for issues and improvements",
    options: [
      {
        name: "files",
        description: "Files to analyze",
        type: "string",
        required: true
      },
      {
        name: "output",
        shortName: "o",
        description: "Output file for analysis results",
        type: "string"
      }
    ],
    action: analyzeCommand
  },
  {
    name: "modify",
    description: "Apply suggested modifications to code files",
    options: [
      {
        name: "files",
        description: "Files to modify",
        type: "string",
        required: true
      },
      {
        name: "suggestions",
        shortName: "s",
        description: "Suggestions file or string",
        type: "string",
        required: true
      },
      {
        name: "output",
        shortName: "o",
        description: "Output directory for modified files",
        type: "string"
      }
    ],
    action: modifyCommand
  },
  {
    name: "execute",
    description: "Execute code in a sandbox",
    options: [
      {
        name: "file",
        description: "File to execute",
        type: "string",
        required: true
      },
      {
        name: "language",
        shortName: "l",
        description: "Programming language",
        type: "string",
        default: "javascript"
      }
    ],
    action: executeCommand
  },
  {
    name: "search",
    description: "Search for similar code changes",
    options: [
      {
        name: "query",
        description: "Search query",
        type: "string",
        required: true
      },
      {
        name: "max-results",
        shortName: "n",
        description: "Maximum number of results",
        type: "number",
        default: 5
      }
    ],
    action: searchCommand
  },
  {
    name: "checkpoint",
    description: "Create a git checkpoint",
    options: [
      {
        name: "message",
        shortName: "m",
        description: "Checkpoint message",
        type: "string",
        required: true
      }
    ],
    action: checkpointCommand
  },
  {
    name: "rollback",
    description: "Rollback to a previous checkpoint",
    options: [
      {
        name: "commit",
        description: "Commit hash to rollback to",
        type: "string",
        required: true
      }
    ],
    action: rollbackCommand
  },
  {
    name: "config",
    description: "Manage configuration",
    options: [
      {
        name: "action",
        description: "Configuration action (get, set, list)",
        type: "string",
        required: true
      },
      {
        name: "key",
        description: "Configuration key",
        type: "string"
      },
      {
        name: "value",
        description: "Configuration value",
        type: "string"
      }
    ],
    action: configCommand
  }
];
```

### 2. Implement Command Actions

```typescript
/**
 * Analyze command action
 */
async function analyzeCommand(args: Record<string, any>, options: Record<string, any>): Promise<void> {
  try {
    // Parse file paths
    const filePaths = args.files.split(",").map((f: string) => f.trim());
    
    // Read file contents
    const files: FileToProcess[] = [];
    for (const path of filePaths) {
      const content = await Deno.readTextFile(path);
      files.push({
        path,
        originalContent: content,
        newContent: content
      });
    }
    
    // Initialize agent
    const agent = new SPARC2Agent();
    await agent.initialize();
    
    // Analyze changes
    const analysis = await agent.analyzeChanges(files);
    
    // Output results
    if (options.output) {
      await Deno.writeTextFile(options.output, analysis);
      console.log(`Analysis written to ${options.output}`);
    } else {
      console.log("Analysis Results:");
      console.log(analysis);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${errorMessage}`);
    Deno.exit(1);
  }
}

/**
 * Modify command action
 */
async function modifyCommand(args: Record<string, any>, options: Record<string, any>): Promise<void> {
  try {
    // Parse file paths
    const filePaths = args.files.split(",").map((f: string) => f.trim());
    
    // Read file contents
    const files: FileToProcess[] = [];
    for (const path of filePaths) {
      const content = await Deno.readTextFile(path);
      files.push({
        path,
        originalContent: content,
        newContent: content
      });
    }
    
    // Read suggestions
    let suggestions = options.suggestions;
    if (suggestions.endsWith(".txt") || suggestions.endsWith(".md")) {
      suggestions = await Deno.readTextFile(suggestions);
    }
    
    // Initialize agent
    const agent = new SPARC2Agent();
    await agent.initialize();
    
    // Apply changes
    const results = await agent.applyChanges(files, suggestions);
    
    // Output results
    for (const result of results) {
      if (result.success) {
        const outputPath = options.output 
          ? `${options.output}/${result.path.split("/").pop()}`
          : result.path;
        
        await Deno.writeTextFile(outputPath, result.modifiedContent);
        console.log(`Modified ${result.path} -> ${outputPath}`);
      } else {
        console.error(`Failed to modify ${result.path}: ${result.error}`);
      }
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${errorMessage}`);
    Deno.exit(1);
  }
}

/**
 * Execute command action
 */
async function executeCommand(args: Record<string, any>, options: Record<string, any>): Promise<void> {
  try {
    // Read file content
    const code = await Deno.readTextFile(args.file);
    
    // Determine language from file extension if not specified
    let language = options.language;
    if (!language) {
      const extension = args.file.split(".").pop()?.toLowerCase();
      if (extension === "py") {
        language = "python";
      } else if (extension === "js") {
        language = "javascript";
      } else if (extension === "ts") {
        language = "typescript";
      }
    }
    
    // Execute code
    const result = await executeCode(code, { language });
    
    // Output results
    console.log("Execution Results:");
    console.log(result.text);
    
    if (result.error) {
      console.error("Error:", result.error.message);
      Deno.exit(1);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${errorMessage}`);
    Deno.exit(1);
  }
}

/**
 * Search command action
 */
async function searchCommand(args: Record<string, any>, options: Record<string, any>): Promise<void> {
  try {
    // Initialize agent
    const agent = new SPARC2Agent();
    await agent.initialize();
    
    // Search for similar changes
    const results = await agent.searchSimilarChanges(args.query, options["max-results"]);
    
    // Output results
    console.log("Search Results:");
    console.log(results);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${errorMessage}`);
    Deno.exit(1);
  }
}

/**
 * Checkpoint command action
 */
async function checkpointCommand(args: Record<string, any>, options: Record<string, any>): Promise<void> {
  try {
    // Initialize agent
    const agent = new SPARC2Agent();
    await agent.initialize();
    
    // Create checkpoint
    const commitHash = await agent.createCheckpoint(options.message);
    
    // Output results
    console.log(`Checkpoint created: ${commitHash}`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${errorMessage}`);
    Deno.exit(1);
  }
}

/**
 * Rollback command action
 */
async function rollbackCommand(args: Record<string, any>, options: Record<string, any>): Promise<void> {
  try {
    // Initialize agent
    const agent = new SPARC2Agent();
    await agent.initialize();
    
    // Rollback to checkpoint
    await agent.rollbackToCheckpoint(options.commit);
    
    // Output results
    console.log(`Rolled back to checkpoint: ${options.commit}`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${errorMessage}`);
    Deno.exit(1);
  }
}

/**
 * Config command action
 */
async function configCommand(args: Record<string, any>, options: Record<string, any>): Promise<void> {
  try {
    const action = options.action;
    
    switch (action) {
      case "get": {
        if (!options.key) {
          throw new Error("Key is required for 'get' action");
        }
        
        const value = await getConfigValue(options.key);
        console.log(`${options.key} = ${value}`);
        break;
      }
      
      case "set": {
        if (!options.key || !options.value) {
          throw new Error("Key and value are required for 'set' action");
        }
        
        await setConfigValue(options.key, options.value);
        console.log(`${options.key} set to ${options.value}`);
        break;
      }
      
      case "list": {
        const config = await getConfig();
        console.log("Configuration:");
        for (const [key, value] of Object.entries(config)) {
          console.log(`${key} = ${value}`);
        }
        break;
      }
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${errorMessage}`);
    Deno.exit(1);
  }
}
```

### 3. Implement Configuration Management

```typescript
/**
 * Get configuration
 * @returns Configuration object
 */
async function getConfig(): Promise<Record<string, any>> {
  try {
    // Check if config file exists
    const configPath = Deno.env.get("SPARC2_CONFIG_PATH") || "config/sparc2-config.toml";
    
    try {
      await Deno.stat(configPath);
    } catch {
      // Config file doesn't exist, create it
      await Deno.writeTextFile(configPath, "# SPARC2 Configuration\n");
    }
    
    // Read config file
    const configContent = await Deno.readTextFile(configPath);
    
    // Parse TOML
    return parse(configContent);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error reading configuration: ${errorMessage}`);
    return {};
  }
}

/**
 * Get configuration value
 * @param key Configuration key
 * @returns Configuration value
 */
async function getConfigValue(key: string): Promise<any> {
  const config = await getConfig();
  
  // Handle nested keys (e.g., "agent.name")
  const keys = key.split(".");
  let value: any = config;
  
  for (const k of keys) {
    if (value === undefined || value === null) {
      return undefined;
    }
    
    value = value[k];
  }
  
  return value;
}

/**
 * Set configuration value
 * @param key Configuration key
 * @param value Configuration value
 */
async function setConfigValue(key: string, value: any): Promise<void> {
  const config = await getConfig();
  
  // Handle nested keys (e.g., "agent.name")
  const keys = key.split(".");
  let current: any = config;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    
    if (current[k] === undefined || current[k] === null || typeof current[k] !== "object") {
      current[k] = {};
    }
    
    current = current[k];
  }
  
  current[keys[keys.length - 1]] = value;
  
  // Write config file
  const configPath = Deno.env.get("SPARC2_CONFIG_PATH") || "config/sparc2-config.toml";
  await Deno.writeTextFile(configPath, stringify(config));
}
```

### 4. Update Main CLI Function

```typescript
/**
 * Main CLI function
 * @param args Command line arguments
 */
export async function main(args: string[] = Deno.args): Promise<void> {
  try {
    // Parse command and options
    if (args.length === 0) {
      printHelp();
      return;
    }
    
    const commandName = args[0];
    
    if (commandName === "--help" || commandName === "-h") {
      printHelp();
      return;
    }
    
    if (commandName === "--version" || commandName === "-v") {
      console.log(`SPARC2 CLI v${VERSION}`);
      return;
    }
    
    const command = commands.find(cmd => cmd.name === commandName);
    
    if (!command) {
      console.error(`Unknown command: ${commandName}`);
      printHelp();
      Deno.exit(1);
    }
    
    // Parse command options
    const options: Record<string, any> = {};
    const commandArgs: Record<string, any> = {};
    
    for (let i = 1; i < args.length; i++) {
      const arg = args[i];
      
      if (arg.startsWith("--")) {
        // Long option
        const optionName = arg.slice(2);
        const option = command.options.find(opt => opt.name === optionName);
        
        if (!option) {
          console.error(`Unknown option: ${arg}`);
          Deno.exit(1);
        }
        
        if (option.type === "boolean") {
          options[optionName] = true;
        } else {
          if (i + 1 >= args.length) {
            console.error(`Option ${arg} requires a value`);
            Deno.exit(1);
          }
          
          options[optionName] = args[++i];
        }
      } else if (arg.startsWith("-")) {
        // Short option
        const shortName = arg.slice(1);
        const option = command.options.find(opt => opt.shortName === shortName);
        
        if (!option) {
          console.error(`Unknown option: ${arg}`);
          Deno.exit(1);
        }
        
        if (option.type === "boolean") {
          options[option.name] = true;
        } else {
          if (i + 1 >= args.length) {
            console.error(`Option ${arg} requires a value`);
            Deno.exit(1);
          }
          
          options[option.name] = args[++i];
        }
      } else {
        // Positional argument
        commandArgs[command.options[Object.keys(commandArgs).length].name] = arg;
      }
    }
    
    // Check required options
    for (const option of command.options) {
      if (option.required && !(option.name in options) && !(option.name in commandArgs)) {
        console.error(`Required option missing: ${option.name}`);
        Deno.exit(1);
      }
      
      // Set default values
      if (option.default !== undefined && !(option.name in options) && !(option.name in commandArgs)) {
        options[option.name] = option.default;
      }
    }
    
    // Execute command
    await command.action(commandArgs, options);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${errorMessage}`);
    Deno.exit(1);
  }
}

/**
 * Print help message
 */
function printHelp(): void {
  console.log(`SPARC2 CLI v${VERSION}`);
  console.log("\nUsage: sparc2 <command> [options]");
  console.log("\nCommands:");
  
  for (const command of commands) {
    console.log(`  ${command.name.padEnd(15)} ${command.description}`);
  }
  
  console.log("\nOptions:");
  console.log("  --help, -h       Show help");
  console.log("  --version, -v    Show version");
  
  console.log("\nFor command-specific help, run: sparc2 <command> --help");
}
```

### 5. Create Default Configuration Files

Create default configuration files for the CLI:

```toml
# config/sparc2-config.toml

# General configuration
version = "0.1.0"
log_level = "info"

# Agent configuration
agent_config_path = "config/agent-config.toml"

# E2B configuration
e2b_api_key_env = "E2B_API_KEY"

# Vector store configuration
vector_store_type = "openai"
openai_api_key_env = "OPENAI_API_KEY"
```

```toml
# config/agent-config.toml

[agent]
name = "SPARC2 Agent"
description = "An autonomous agent for code analysis and modification"
default_flow = "analyze_and_modify"

[providers]
  [providers.openai]
  type = "openai"
  api_key_env = "OPENAI_API_KEY"
  default_model = "gpt-4o"
  
  [providers.openrouter]
  type = "openrouter"
  api_key_env = "OPENROUTER_API_KEY"
  default_model = "openai/o3-mini-high"

[flows]
  [flows.analyze_and_modify]
  description = "Analyze code and suggest modifications"
  
  [flows.analyze_and_modify.steps]
    [flows.analyze_and_modify.steps.analyze]
    provider = "openrouter"
    model = "${providers.openrouter.default_model}"
    description = "Analyze code for issues and improvements"
    system_prompt = """
    You are a code analysis expert. Analyze the provided code and identify:
    1. Potential bugs or issues
    2. Performance improvements
    3. Readability improvements
    4. Security concerns
    
    Be specific and provide clear explanations for each issue.
    """
    
    [flows.analyze_and_modify.steps.plan]
    provider = "openai"
    model = "${providers.openai.default_model}"
    description = "Plan modifications based on analysis"
    system_prompt = """
    You are a software architect. Based on the code analysis, create a plan for modifications that will address the identified issues.
    
    For each modification:
    1. Describe what will be changed
    2. Explain why this change addresses the issue
    3. Consider any potential side effects
    
    Be specific and provide clear explanations.
    """
    
    [flows.analyze_and_modify.steps.modify]
    provider = "openai"
    use_assistant = true
    assistant_instructions = """
    You are a code modification expert. Implement the planned modifications to the code.
    
    Follow these guidelines:
    1. Make minimal changes to address the specific issues
    2. Maintain the existing code style and patterns
    3. Add comments explaining significant changes
    4. Ensure the code remains functional
    
    Provide the modified code and an explanation of the changes made.
    """
    tools = ["code_analysis", "code_execution"]
```

## Testing Strategy

1. Create unit tests for each command
2. Create integration tests for the entire CLI
3. Test with both mock and real implementations
4. Test error handling and edge cases

## Deployment Considerations

1. Ensure all required API keys are set in environment variables
2. Create a script to install the CLI globally
3. Create documentation for the CLI
4. Consider packaging the CLI as a standalone executable

## Fallback Strategy

If any of the underlying services (E2B, OpenAI, etc.) are unavailable, the CLI should provide clear error messages and fallback to a degraded mode where possible.