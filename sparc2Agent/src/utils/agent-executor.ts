/**
 * Agent Executor
 * Executes agent flows and steps
 */

import { 
  AgentConfig, 
  AgentContext, 
  AgentFlow, 
  AgentStep, 
  Assistant, 
  ChatMessage,
  ToolDefinition
} from "./types.ts";

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
export const TOOLS: Record<string, (args: any, context: AgentContext) => Promise<string>> = {
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
      // For now, just return a mock result
      // In a real implementation, this would execute the code in a sandbox
      return JSON.stringify({
        output: `Mock execution of ${language} code: ${code.substring(0, 50)}...`,
        error: null
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
      // For now, just return a mock result
      // In a real implementation, this would search a vector store
      return JSON.stringify({
        results: [
          {
            file: "example.ts",
            diff: "- const x = 1;\n+ const x = 2;",
            score: 0.95
          }
        ]
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
    
    console.log(`Executing agent flow: ${flowName}`, {
      flowName,
      description: flow.description
    });
    
    // Start with the first step
    let currentStep = Object.keys(flow.steps)[0];
    let currentContext = { ...context };
    
    // Execute steps until we reach the end
    while (currentStep) {
      const step = flow.steps[currentStep];
      
      console.log(`Executing step: ${currentStep}`, {
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
    
    console.log(`Completed agent flow: ${flowName}`, {
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
      console.error(`Failed to execute step: ${step.name}`, { error: errorMessage });
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
        role: "system" as const,
        content: step.systemPrompt
      });
    }
    
    // Add context message
    messages.push({
      role: "user" as const,
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
        tools: step.tools?.map(toolName => TOOL_DEFINITIONS[toolName]) || []
      });
      
      this.assistants[step.name] = assistant;
    }
    
    // For now, just use a simple chat completion since we don't have the full OpenAI client
    // In a real implementation, this would use the OpenAI Assistants API
    const messages: ChatMessage[] = [];
    
    // Add system message with assistant instructions
    if (step.assistantInstructions) {
      messages.push({
        role: "system" as const,
        content: step.assistantInstructions
      });
    }
    
    // Add context message
    messages.push({
      role: "user" as const,
      content: context.input || ""
    });
    
    // Get completion from provider
    const response = await provider.getChatCompletion(messages, {
      model: step.model,
      tools: step.tools?.map(toolName => TOOL_DEFINITIONS[toolName]) || []
    });
    
    // Handle tool calls if any
    if (response.tool_calls && response.tool_calls.length > 0) {
      // Process tool calls
      const toolResults = [];
      
      for (const toolCall of response.tool_calls) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments);
        
        // Find the tool implementation
        const toolImpl = TOOLS[toolName];
        
        if (!toolImpl) {
          throw new Error(`Tool not found: ${toolName}`);
        }
        
        // Execute the tool
        const result = await toolImpl(toolArgs, context);
        
        toolResults.push({
          tool_call_id: toolCall.id,
          name: toolName,
          result
        });
      }
      
      // Add tool results to messages
      for (const result of toolResults) {
        messages.push({
          role: "tool" as const,
          content: result.result,
          tool_call_id: result.tool_call_id
        });
      }
      
      // Get final response from provider
      const finalResponse = await provider.getChatCompletion(messages, {
        model: step.model
      });
      
      // Update context with response
      return {
        ...context,
        output: finalResponse.content,
        [step.name]: {
          input: context.input,
          output: finalResponse.content,
          toolResults
        }
      };
    }
    
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
}