# Agent Framework Implementation Plan

## Overview

This document outlines the plan to replace the placeholder implementation of the agent with a fully functional, flexible agent framework that can use multiple LLM providers and supports configurable agent flows defined in TOML.

## Current Status

The current implementation in `src/agent/agent.ts` uses a placeholder implementation that simulates agent operations but doesn't actually use the OpenAI Assistants API. It uses the OpenAI Chat Completions API as a temporary solution.

## Implementation Goals

1. Create an abstracted agent framework that can use multiple LLM providers
2. Support OpenAI Assistants API for complex agent flows
3. Support OpenRouter for simpler analysis tasks
4. Use TOML for defining agent configurations and flows
5. Maintain the existing API surface to ensure compatibility with the rest of the codebase
6. Use environment variables for API keys
7. Ensure all tests continue to pass with the new implementation

## Architecture

### 1. LLM Provider Abstraction

Create an abstraction layer for different LLM providers:

```
LLMProvider (Interface)
├── OpenAIProvider
├── OpenRouterProvider
└── MockProvider (for testing)
```

### 2. Agent Framework

Create a modular agent framework that can be configured with different providers and flows:

```
AgentFramework
├── AgentConfig (TOML-based configuration)
├── AgentFlow (Flow definition)
│   ├── Steps
│   └── Transitions
├── AgentContext (Shared context between steps)
└── AgentExecutor (Executes flows)
```

### 3. Tool Integration

Integrate with existing tools and add new ones:

```
Tools
├── CodeAnalysisTool
├── CodeModificationTool
├── VectorSearchTool
├── GitTool
└── SandboxTool
```

## Implementation Steps

### 1. Create TOML Configuration Structure

Create a TOML configuration structure for defining agents, providers, and flows:

```toml
# Example agent-config.toml

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

### 2. Create LLM Provider Interfaces and Implementations

```typescript
/**
 * Interface for LLM providers
 */
export interface LLMProvider {
  /**
   * Get the provider name
   */
  getName(): string;
  
  /**
   * Get a completion from the LLM
   * @param prompt The prompt to send to the LLM
   * @param options Options for the completion
   */
  getCompletion(prompt: string, options?: CompletionOptions): Promise<string>;
  
  /**
   * Get a chat completion from the LLM
   * @param messages The messages to send to the LLM
   * @param options Options for the chat completion
   */
  getChatCompletion(messages: ChatMessage[], options?: ChatCompletionOptions): Promise<ChatMessage>;
  
  /**
   * Check if the provider supports assistants
   */
  supportsAssistants(): boolean;
  
  /**
   * Create an assistant (if supported)
   * @param options Options for the assistant
   */
  createAssistant?(options: AssistantOptions): Promise<Assistant>;
}

/**
 * OpenAI LLM provider implementation
 */
export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;
  private defaultModel: string;
  
  constructor(options: OpenAIProviderOptions) {
    const apiKey = Deno.env.get(options.apiKeyEnv) || options.apiKey;
    if (!apiKey) {
      throw new Error(`API key not found for OpenAI provider (${options.apiKeyEnv})`);
    }
    
    this.client = new OpenAI({ apiKey });
    this.defaultModel = options.defaultModel || "gpt-4o";
  }
  
  getName(): string {
    return "openai";
  }
  
  async getCompletion(prompt: string, options?: CompletionOptions): Promise<string> {
    const response = await this.client.completions.create({
      model: options?.model || this.defaultModel,
      prompt,
      max_tokens: options?.maxTokens,
      temperature: options?.temperature
    });
    
    return response.choices[0]?.text || "";
  }
  
  async getChatCompletion(messages: ChatMessage[], options?: ChatCompletionOptions): Promise<ChatMessage> {
    const response = await this.client.chat.completions.create({
      model: options?.model || this.defaultModel,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      temperature: options?.temperature
    });
    
    return {
      role: "assistant",
      content: response.choices[0]?.message?.content || ""
    };
  }
  
  supportsAssistants(): boolean {
    return true;
  }
  
  async createAssistant(options: AssistantOptions): Promise<Assistant> {
    const assistant = await this.client.beta.assistants.create({
      name: options.name,
      description: options.description,
      model: options.model || this.defaultModel,
      instructions: options.instructions,
      tools: options.tools?.map(tool => ({
        type: "function",
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters
        }
      }))
    });
    
    return {
      id: assistant.id,
      provider: this.getName(),
      name: assistant.name,
      model: assistant.model
    };
  }
}

/**
 * OpenRouter LLM provider implementation
 */
export class OpenRouterProvider implements LLMProvider {
  private client: any; // OpenRouter client
  private defaultModel: string;
  
  constructor(options: OpenRouterProviderOptions) {
    const apiKey = Deno.env.get(options.apiKeyEnv) || options.apiKey;
    if (!apiKey) {
      throw new Error(`API key not found for OpenRouter provider (${options.apiKeyEnv})`);
    }
    
    // Initialize OpenRouter client
    this.client = {
      apiKey,
      baseURL: "https://openrouter.ai/api/v1"
    };
    
    this.defaultModel = options.defaultModel || "openai/o3-mini-high";
  }
  
  getName(): string {
    return "openrouter";
  }
  
  async getCompletion(prompt: string, options?: CompletionOptions): Promise<string> {
    const response = await fetch(`${this.client.baseURL}/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.client.apiKey}`
      },
      body: JSON.stringify({
        model: options?.model || this.defaultModel,
        prompt,
        max_tokens: options?.maxTokens,
        temperature: options?.temperature
      })
    });
    
    const data = await response.json();
    return data.choices[0]?.text || "";
  }
  
  async getChatCompletion(messages: ChatMessage[], options?: ChatCompletionOptions): Promise<ChatMessage> {
    const response = await fetch(`${this.client.baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.client.apiKey}`
      },
      body: JSON.stringify({
        model: options?.model || this.defaultModel,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        temperature: options?.temperature
      })
    });
    
    const data = await response.json();
    return {
      role: "assistant",
      content: data.choices[0]?.message?.content || ""
    };
  }
  
  supportsAssistants(): boolean {
    return false;
  }
}
```

### 3. Create Agent Configuration Parser

```typescript
/**
 * Parse a TOML configuration file for agent configuration
 * @param configPath Path to the TOML configuration file
 * @returns Parsed agent configuration
 */
export async function parseAgentConfig(configPath: string): Promise<AgentConfig> {
  try {
    // Read the TOML file
    const tomlContent = await Deno.readTextFile(configPath);
    
    // Parse the TOML content
    const config = parse(tomlContent) as RawAgentConfig;
    
    // Process the configuration (resolve variables, etc.)
    return processAgentConfig(config);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logMessage("error", "Failed to parse agent configuration", { error: errorMessage });
    throw error;
  }
}

/**
 * Process a raw agent configuration
 * @param config Raw agent configuration from TOML
 * @returns Processed agent configuration
 */
function processAgentConfig(config: RawAgentConfig): AgentConfig {
  // Create provider instances
  const providers: Record<string, LLMProvider> = {};
  
  for (const [name, providerConfig] of Object.entries(config.providers || {})) {
    switch (providerConfig.type) {
      case "openai":
        providers[name] = new OpenAIProvider({
          apiKeyEnv: providerConfig.api_key_env,
          defaultModel: providerConfig.default_model
        });
        break;
      
      case "openrouter":
        providers[name] = new OpenRouterProvider({
          apiKeyEnv: providerConfig.api_key_env,
          defaultModel: providerConfig.default_model
        });
        break;
      
      default:
        throw new Error(`Unknown provider type: ${providerConfig.type}`);
    }
  }
  
  // Process flows
  const flows: Record<string, AgentFlow> = {};
  
  for (const [name, flowConfig] of Object.entries(config.flows || {})) {
    const steps: Record<string, AgentStep> = {};
    
    for (const [stepName, stepConfig] of Object.entries(flowConfig.steps || {})) {
      // Resolve provider reference
      const providerName = stepConfig.provider;
      const provider = providers[providerName];
      
      if (!provider) {
        throw new Error(`Provider not found: ${providerName}`);
      }
      
      // Resolve model reference (if it contains a variable)
      let model = stepConfig.model;
      if (model && model.startsWith("${") && model.endsWith("}")) {
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
```

### 4. Create Agent Executor

```typescript
/**
 * Agent executor for running agent flows
 */
export class AgentExecutor {
  private config: AgentConfig;
  private assistants: Record<string, Assistant> = {};
  
  /**
   * Create a new agent executor
   * @param config Agent configuration
   */
  constructor(config: AgentConfig) {
    this.config = config;
  }
  
  /**
   * Execute an agent flow
   * @param flowName Name of the flow to execute
   * @param context Initial context for the flow
   * @returns The final context after execution
   */
  async executeFlow(flowName: string, context: AgentContext): Promise<AgentContext> {
    const flow = this.config.flows[flowName];
    
    if (!flow) {
      throw new Error(`Flow not found: ${flowName}`);
    }
    
    await logMessage("info", `Executing agent flow: ${flowName}`, {
      flowName,
      description: flow.description
    });
    
    // Start with the first step
    let currentStep = Object.keys(flow.steps)[0];
    let currentContext = { ...context };
    
    // Execute steps until we reach the end
    while (currentStep) {
      const step = flow.steps[currentStep];
      
      await logMessage("info", `Executing step: ${currentStep}`, {
        stepName: currentStep,
        description: step.description
      });
      
      // Execute the step
      currentContext = await this.executeStep(step, currentContext);
      
      // Determine the next step
      const nextStep = flow.transitions[currentStep];
      
      if (!nextStep) {
        // End of flow
        break;
      }
      
      currentStep = nextStep;
    }
    
    await logMessage("info", `Completed agent flow: ${flowName}`, {
      flowName,
      description: flow.description
    });
    
    return currentContext;
  }
  
  /**
   * Execute a single step in a flow
   * @param step The step to execute
   * @param context The current context
   * @returns The updated context
   */
  private async executeStep(step: AgentStep, context: AgentContext): Promise<AgentContext> {
    try {
      if (step.useAssistant) {
        // Use an assistant for this step
        return await this.executeAssistantStep(step, context);
      } else {
        // Use a simple LLM call for this step
        return await this.executeLLMStep(step, context);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await logMessage("error", `Failed to execute step: ${step.name}`, { error: errorMessage });
      throw error;
    }
  }
  
  /**
   * Execute a step using a simple LLM call
   * @param step The step to execute
   * @param context The current context
   * @returns The updated context
   */
  private async executeLLMStep(step: AgentStep, context: AgentContext): Promise<AgentContext> {
    const provider = step.provider;
    
    // Prepare messages
    const messages: ChatMessage[] = [];
    
    // Add system message if provided
    if (step.systemPrompt) {
      messages.push({
        role: "system",
        content: step.systemPrompt
      });
    }
    
    // Add context message
    messages.push({
      role: "user",
      content: context.input || ""
    });
    
    // Get completion from provider
    const response = await provider.getChatCompletion(messages, {
      model: step.model
    });
    
    // Update context with response
    return {
      ...context,
      output: response.content,
      [step.name]: {
        input: context.input,
        output: response.content
      }
    };
  }
  
  /**
   * Execute a step using an assistant
   * @param step The step to execute
   * @param context The current context
   * @returns The updated context
   */
  private async executeAssistantStep(step: AgentStep, context: AgentContext): Promise<AgentContext> {
    const provider = step.provider;
    
    if (!provider.supportsAssistants()) {
      throw new Error(`Provider ${provider.getName()} does not support assistants`);
    }
    
    // Get or create assistant
    let assistant = this.assistants[step.name];
    
    if (!assistant) {
      assistant = await provider.createAssistant!({
        name: `${this.config.name} - ${step.name}`,
        description: step.description || "",
        model: step.model,
        instructions: step.assistantInstructions || "",
        tools: step.tools.map(toolName => TOOL_DEFINITIONS[toolName])
      });
      
      this.assistants[step.name] = assistant;
    }
    
    // Create a thread
    const thread = await (provider as OpenAIProvider).client.beta.threads.create();
    
    // Add message to thread
    await (provider as OpenAIProvider).client.beta.threads.messages.create(thread.id, {
      role: "user",
      content: context.input || ""
    });
    
    // Run the assistant
    const run = await (provider as OpenAIProvider).client.beta.threads.runs.create(thread.id, {
      assistant_id: assistant.id
    });
    
    // Wait for the run to complete
    let runStatus = await (provider as OpenAIProvider).client.beta.threads.runs.retrieve(thread.id, run.id);
    
    while (runStatus.status !== "completed" && runStatus.status !== "failed") {
      // Check for tool calls
      if (runStatus.status === "requires_action" && runStatus.required_action?.type === "submit_tool_outputs") {
        const toolCalls = runStatus.required_action.submit_tool_outputs.tool_calls;
        const toolOutputs = [];
        
        for (const toolCall of toolCalls) {
          const output = await this.executeToolCall(toolCall, context);
          toolOutputs.push({
            tool_call_id: toolCall.id,
            output
          });
        }
        
        // Submit tool outputs
        await (provider as OpenAIProvider).client.beta.threads.runs.submitToolOutputs(thread.id, run.id, {
          tool_outputs: toolOutputs
        });
      }
      
      // Wait a bit before checking again
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check status again
      runStatus = await (provider as OpenAIProvider).client.beta.threads.runs.retrieve(thread.id, run.id);
    }
    
    if (runStatus.status === "failed") {
      throw new Error(`Assistant run failed: ${runStatus.last_error?.message || "Unknown error"}`);
    }
    
    // Get the assistant's response
    const messages = await (provider as OpenAIProvider).client.beta.threads.messages.list(thread.id);
    const assistantMessages = messages.data.filter(msg => msg.role === "assistant");
    
    if (assistantMessages.length === 0) {
      throw new Error("No response from assistant");
    }
    
    // Get the latest message
    const latestMessage = assistantMessages[0];
    let output = "";
    
    for (const content of latestMessage.content) {
      if (content.type === "text") {
        output += content.text.value;
      }
    }
    
    // Update context with response
    return {
      ...context,
      output,
      [step.name]: {
        input: context.input,
        output
      }
    };
  }
  
  /**
   * Execute a tool call
   * @param toolCall The tool call to execute
   * @param context The current context
   * @returns The tool call output
   */
  private async executeToolCall(toolCall: any, context: AgentContext): Promise<string> {
    if (toolCall.type !== "function") {
      throw new Error(`Unsupported tool call type: ${toolCall.type}`);
    }
    
    const { name, arguments: args } = toolCall.function;
    const parsedArgs = JSON.parse(args);
    
    // Execute the tool
    const tool = TOOLS[name];
    
    if (!tool) {
      throw new Error(`Unknown tool: ${name}`);
    }
    
    return await tool(parsedArgs, context);
  }
}
```

### 5. Create Tool Definitions and Implementations

```typescript
/**
 * Tool definitions for assistants
 */
export const TOOL_DEFINITIONS: Record<string, ToolDefinition> = {
  code_analysis: {
    name: "analyze_code",
    description: "Analyze code and suggest improvements",
    parameters: {
      type: "object",
      properties: {
        code: {
          type: "string",
          description: "The code to analyze"
        },
        language: {
          type: "string",
          description: "The programming language of the code"
        }
      },
      required: ["code"]
    }
  },
  
  code_execution: {
    name: "execute_code",
    description: "Execute code and return the result",
    parameters: {
      type: "object",
      properties: {
        code: {
          type: "string",
          description: "The code to execute"
        },
        language: {
          type: "string",
          description: "The programming language of the code",
          enum: ["javascript", "typescript", "python"]
        }
      },
      required: ["code", "language"]
    }
  },
  
  vector_search: {
    name: "search_similar_code",
    description: "Search for similar code in the vector store",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query"
        },
        max_results: {
          type: "number",
          description: "Maximum number of results to return"
        }
      },
      required: ["query"]
    }
  }
};

/**
 * Tool implementations
 */
export const TOOLS: Record<string, ToolFunction> = {
  analyze_code: async (args: any, context: AgentContext): Promise<string> => {
    const { code, language } = args;
    
    // Use a simple heuristic analysis for now
    const issues = [];
    
    // Check for common issues
    if (code.includes("console.log")) {
      issues.push("Code contains console.log statements, which should be removed in production code.");
    }
    
    if (code.includes("TODO")) {
      issues.push("Code contains TODO comments, which should be addressed.");
    }
    
    // Return analysis
    return JSON.stringify({
      issues,
      suggestions: issues.length > 0 ? ["Address the identified issues"] : ["No issues found"]
    });
  },
  
  execute_code: async (args: any, context: AgentContext): Promise<string> => {
    const { code, language } = args;
    
    try {
      const result = await executeCode(code, { language });
      
      return JSON.stringify({
        output: result.text,
        error: result.error ? result.error.message : null
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return JSON.stringify({
        output: "",
        error: errorMessage
      });
    }
  },
  
  search_similar_code: async (args: any, context: AgentContext): Promise<string> => {
    const { query, max_results } = args;
    
    try {
      const results = await searchDiffEntries(query, max_results || 5);
      
      return JSON.stringify({
        results: results.map(result => ({
          file: (result.entry as DiffEntry).file,
          diff: (result.entry as DiffEntry).diff,
          score: result.score
        }))
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return JSON.stringify({
        results: [],
        error: errorMessage
      });
    }
  }
};
```

### 6. Update the SPARC2Agent Class

```typescript
/**
 * SPARC2 Agent class for autonomous code analysis and modification
 */
export class SPARC2Agent {
  private executor: AgentExecutor;
  private config: AgentConfig;
  
  /**
   * Create a new SPARC2 agent
   * @param options Options for the agent
   */
  constructor(private options: AgentOptions = {}) {}
  
  /**
   * Initialize the agent
   */
  async initialize(): Promise<void> {
    try {
      // Load configuration
      const configPath = this.options.configPath || "config/agent-config.toml";
      this.config = await parseAgentConfig(configPath);
      
      // Create executor
      this.executor = new AgentExecutor(this.config);
      
      await logMessage("info", "SPARC2 Agent initialized", { 
        name: this.config.name,
        defaultFlow: this.config.defaultFlow
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await logMessage("error", "Failed to initialize SPARC2 Agent", { error: errorMessage });
      throw error;
    }
  }
  
  /**
   * Analyze code changes and suggest improvements
   * @param files Files to analyze
   * @returns Analysis results
   */
  async analyzeChanges(files: FileToProcess[]): Promise<string> {
    try {
      if (!this.executor) {
        await this.initialize();
      }
      
      // Compute diffs for all files
      const diffs: DiffResult[] = [];
      for (const file of files) {
        const diff = await computeDiff(file.path, file.originalContent, file.newContent);
        diffs.push(diff);
        
        // Index the diff in the vector store
        await indexDiffEntry({
          id: crypto.randomUUID(),
          file: file.path,
          diff: diff.diffText,
          metadata: {
            timestamp: new Date().toISOString(),
            type: "diff"
          }
        });
      }
      
      // Create input for the flow
      const diffSummary = diffs.map(diff => 
        `File: ${diff.filePath}\nDiff:\n${diff.diffText}`
      ).join("\n\n");
      
      // Execute the analysis flow
      const context = await this.executor.executeFlow(this.config.defaultFlow, {
        input: `Please analyze these code changes and suggest improvements:\n\n${diffSummary}`
      });
      
      await logMessage("info", "Code changes analyzed", { 
        fileCount: files.length,
        analysisLength: context.output?.length || 0
      });
      
      return context.output || "";
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await logMessage("error", "Failed to analyze code changes", { error: errorMessage });
      throw error;
    }
  }
  
  /**
   * Apply suggested changes to files
   * @param files Files to modify
   * @param suggestions Suggestions for modifications
   * @returns Modification results
   */
  async applyChanges(files: FileToProcess[], suggestions: string): Promise<ModificationResult[]> {
    try {
      if (!this.executor) {
        await this.initialize();
      }
      
      // Create input for the flow
      const filesSummary = files.map(file => 
        `File: ${file.path}\nContent:\n${file.originalContent}`
      ).join("\n\n");
      
      // Execute the modification flow
      const context = await this.executor.executeFlow("modify", {
        input: `Please apply these suggestions to the files:\n\nSuggestions:\n${suggestions}\n\nFiles:\n${filesSummary}`,
        files
      });
      
      // Parse the results
      const results: ModificationResult[] = [];
      
      for (const file of files) {
        const modifiedContent = context[`modify_${file.path}`]?.output;
        
        if (!modifiedContent) {
          results.push({
            path: file.path,
            success: false,
            error: "No modified content found"
          });
          continue;
        }
        
        // Compute diff
        const diff = await computeDiff(file.path, file.originalContent, modifiedContent);
        
        // Index the diff in the vector store
        await indexDiffEntry({
          id: crypto.randomUUID(),
          file: file.path,
          diff: diff.diffText,
          metadata: {
            timestamp: new Date().toISOString(),
            type: "modification"
          }
        });
        
        results.push({
          path: file.path,
          success: true,
          originalContent: file.originalContent,
          modifiedContent,
          diff: diff.diffText
        });
      }
      
      await logMessage("info", "Changes applied to files", { 
        fileCount: files.length,
        successCount: results.filter(r => r.success).length
      });
      
      return results;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await logMessage("error", "Failed to apply changes to files", { error: errorMessage });
      throw error;
    }
  }
  
  /**
   * Create a checkpoint for the current state
   * @param message Checkpoint message
   * @returns Commit hash
   */
  async createCheckpoint(message: string): Promise<string> {
    try {
      const commitHash = await createCommit(message);
      
      await logMessage("info", "Checkpoint created", { 
        message,
        commitHash
      });
      
      return commitHash;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await logMessage("error", "Failed to create checkpoint", { error: errorMessage });
      throw error;
    }
  }
  
  /**
   * Rollback to a previous checkpoint
   * @param commitHash Commit hash to rollback to
   */
  async rollbackToCheckpoint(commitHash: string): Promise<void> {
    try {
      await rollbackChanges(commitHash);
      
      await logMessage("info", "Rolled back to checkpoint", { 
        commitHash
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await logMessage("error", "Failed to rollback to checkpoint", { error: errorMessage });
      throw error;
    }
  }
  
  /**
   * Execute code in a sandbox
   * @param code Code to execute
   * @param language Programming language
   * @returns Execution result
   */
  async executeCode(code: string, language: "javascript" | "typescript" | "python"): Promise<string> {
    try {
      const result = await executeCode(code, { language });
      
      await logMessage("info", "Code executed", { 
        language,
        success: !result.error
      });
      
      return result.text;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await logMessage("error", "Failed to execute code", { error: errorMessage });
      throw error;
    }
  }
  
  /**
   * Search for similar code changes
   * @param query Search query
   * @param maxResults Maximum number of results
   * @returns Search results
   */
  async searchSimilarChanges(query: string, maxResults: number = 5): Promise<string> {
    try {
      const results = await searchDiffEntries(query, maxResults);
      
      const formattedResults = results.map((result, index) => {
        const diffEntry = result.entry as DiffEntry;
        return `Result ${index + 1} (Score: ${result.score.toFixed(2)}):\nFile: ${diffEntry.file}\nDiff:\n${diffEntry.diff}`;
      }).join("\n\n");
      
      await logMessage("info", "Searched for similar changes", { 
        query,
        resultsCount: results.length
      });
      
      return formattedResults;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await logMessage("error", "Failed to search for similar changes", { error: errorMessage });
      throw error;
    }
  }
}
```

## Testing Strategy

1. Create a mock LLM provider for testing
2. Create test TOML configurations for different scenarios
3. Test each component individually
4. Test the entire agent framework with integration tests
5. Ensure all tests pass with both mock and real providers

## Deployment Considerations

1. Ensure all required API keys are set in environment variables
2. Create default TOML configurations for common use cases
3. Monitor usage and costs associated with the LLM APIs
4. Implement rate limiting and caching if necessary to reduce costs

## Fallback Strategy

If an LLM provider is unavailable or the API key is invalid, the system should try to use an alternative provider if available, or fall back to a degraded mode where agent operations are disabled but other functionality continues to work.