# SPARC2 Agent Framework

A flexible agent framework that can use multiple LLM providers and supports configurable agent flows defined in TOML.

## Features

- Abstracted agent framework that can use multiple LLM providers
- Support for OpenAI API for complex agent flows
- Support for OpenRouter for simpler analysis tasks
- TOML-based configuration for defining agent configurations and flows
- Modular architecture with pluggable components

## Project Structure

```
sparc2Agent/
├── config/                 # Configuration files
│   └── agent-config.toml   # Agent configuration
├── examples/               # Example usage
│   ├── simple-analysis.ts  # Simple code analysis example
│   └── code-modification.ts # Code modification example
├── src/                    # Source code
│   ├── agent/              # Agent implementation
│   │   └── sparc2-agent.ts # Main agent class
│   ├── config/             # Configuration parsing
│   │   └── config-parser.ts # TOML configuration parser
│   ├── providers/          # LLM providers
│   │   ├── llm-provider.ts  # LLM provider interface
│   │   ├── openai-provider.ts # OpenAI provider
│   │   ├── openrouter-provider.ts # OpenRouter provider
│   │   ├── mock-provider.ts # Mock provider for testing
│   │   └── provider-factory.ts # Provider factory
│   └── utils/              # Utilities
│       ├── agent-executor.ts # Agent executor
│       └── types.ts        # Type definitions
└── README.md               # This file
```

## Getting Started

### Prerequisites

- Deno 1.37.0 or higher
- OpenAI API key (for OpenAI provider)
- OpenRouter API key (for OpenRouter provider)

### Installation

1. Clone the repository
2. Create a `.env` file with your API keys:

```
OPENAI_API_KEY=your_openai_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
```

### Usage

#### Simple Analysis

```typescript
import { SPARC2Agent } from "./src/agent/sparc2-agent.ts";

// Create and initialize the agent
const agent = new SPARC2Agent({
  configPath: "config/agent-config.toml"
});

await agent.initialize();

// Analyze code
const analysis = await agent.analyzeChanges([
  {
    path: "example.js",
    content: "function example() { console.log('Hello, world!'); }",
    originalContent: "function example() { console.log('Hello, world!'); }"
  }
]);

console.log(analysis);
```

#### Code Modification

```typescript
import { SPARC2Agent } from "./src/agent/sparc2-agent.ts";

// Create and initialize the agent
const agent = new SPARC2Agent({
  configPath: "config/agent-config.toml"
});

await agent.initialize();

// Apply changes to code
const results = await agent.applyChanges([
  {
    path: "example.js",
    content: "function example() { console.log('Hello, world!'); }",
    originalContent: "function example() { console.log('Hello, world!'); }"
  }
], "Add type annotations and improve error handling");

for (const result of results) {
  if (result.success) {
    console.log(`Modified ${result.path}:`);
    console.log(result.modifiedContent);
  } else {
    console.error(`Failed to modify ${result.path}: ${result.error}`);
  }
}
```

### Running Examples

```bash
deno run --allow-read --allow-env --allow-net examples/simple-analysis.ts
deno run --allow-read --allow-env --allow-net examples/code-modification.ts
```

## Configuration

The agent is configured using a TOML file. See `config/agent-config.toml` for an example.

### Agent Configuration

```toml
[agent]
name = "SPARC2 Agent"
description = "An autonomous agent for code analysis and modification"
default_flow = "analyze_and_modify"
```

### Provider Configuration

```toml
[providers]
  [providers.openai]
  type = "openai"
  api_key_env = "OPENAI_API_KEY"
  default_model = "gpt-4o"
  
  [providers.openrouter]
  type = "openrouter"
  api_key_env = "OPENROUTER_API_KEY"
  default_model = "openai/o3-mini-high"
```

### Flow Configuration

```toml
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
```

## License

MIT