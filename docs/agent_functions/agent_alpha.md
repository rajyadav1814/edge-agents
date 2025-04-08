# Agent Alpha

## Overview

Agent Alpha is a foundational agent implementation that serves as the base model for the agent ecosystem. It implements the ReAct (Reasoning + Acting) pattern, enabling the agent to reason about problems and take actions in an iterative manner. This approach allows for more structured problem-solving and better handling of complex tasks.

## Architecture

Agent Alpha follows a state-based architecture using LangChain's StateGraph:

```
┌─────────────┐     ┌─────────────────────────────────────┐     ┌─────────────┐
│             │     │             Agent Alpha             │     │             │
│   Client    │────▶│                                     │────▶│  OpenRouter │
│             │     │ ┌─────────┐ ┌────────┐ ┌─────────┐ │     │     API     │
└─────────────┘     │ │ Thought │ │ Action │ │ Observe │ │     │             │
       ▲            │ │  State  │ │ State  │ │  State  │ │     └─────────────┘
       │            │ └─────────┘ └────────┘ └─────────┘ │            │
       │            │                                     │            │
       │            └─────────────────────────────────────┘            │
       │                              │                                │
       └──────────────────────────────┴────────────────────────────────┘
                                 Response
```

## Features

- **ReAct Pattern**: Implements the Reasoning + Acting pattern for structured problem-solving
- **State-Based Processing**: Uses LangChain's StateGraph for managing agent states
- **Thought-Action-Observation Cycle**: Follows a three-step cycle for processing queries
- **Tool Usage**: Supports the use of tools to interact with external systems
- **Memory Management**: Maintains context across multiple interactions
- **Structured Output**: Produces well-formatted, consistent responses
- **Error Handling**: Robust error handling and recovery mechanisms
- **Customizable Behavior**: Configurable parameters for tailoring agent behavior

## Implementation Details

### State Graph Setup

The agent sets up a state graph to manage the reasoning process:

```typescript
// Create a new state graph
const workflow = new StateGraph({
  channels: {
    thought: {
      value: "",
    },
    action: {
      value: "",
    },
    observation: {
      value: "",
    },
    answer: {
      value: "",
    },
  },
});

// Define the states
workflow.addNode("thought", thoughtState);
workflow.addNode("action", actionState);
workflow.addNode("observation", observationState);
workflow.addNode("answer", answerState);

// Connect the states
workflow.addEdge({
  from: "thought",
  to: "action",
  condition: (data) => !data.answer.value,
});

workflow.addEdge({
  from: "action",
  to: "observation",
});

workflow.addEdge({
  from: "observation",
  to: "thought",
  condition: (data) => !data.answer.value,
});

workflow.addEdge({
  from: "thought",
  to: "answer",
  condition: (data) => !!data.answer.value,
});

workflow.addEdge({
  from: "answer",
  to: END,
});

// Compile the graph
const app = workflow.compile();
```

### Thought State

The thought state is responsible for reasoning about the current problem:

```typescript
const thoughtState = {
  async invoke({ thought, action, observation }, { state }) {
    // Prepare the messages for the LLM
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: state.query }
    ];
    
    // Add previous interactions to the context
    if (thought.value) {
      messages.push({ role: "assistant", content: `Thought: ${thought.value}` });
    }
    
    if (action.value) {
      messages.push({ role: "assistant", content: `Action: ${action.value}` });
    }
    
    if (observation.value) {
      messages.push({ role: "user", content: `Observation: ${observation.value}` });
    }
    
    // Call the LLM to generate a thought
    const response = await callOpenRouter(messages);
    
    // Parse the response to extract thought and potential answer
    const { thought: newThought, answer } = parseThoughtResponse(response);
    
    return {
      thought: { value: newThought },
      answer: { value: answer || "" }
    };
  }
};
```

### Action State

The action state determines what action to take based on the current thought:

```typescript
const actionState = {
  async invoke({ thought }, { state }) {
    // Prepare the messages for the LLM
    const messages = [
      { role: "system", content: ACTION_PROMPT },
      { role: "user", content: state.query },
      { role: "assistant", content: `Thought: ${thought.value}` }
    ];
    
    // Call the LLM to generate an action
    const response = await callOpenRouter(messages);
    
    // Parse the response to extract the action
    const action = parseActionResponse(response);
    
    return {
      action: { value: action }
    };
  }
};
```

### Observation State

The observation state executes the action and observes the result:

```typescript
const observationState = {
  async invoke({ action }, { state }) {
    // Parse the action to determine what to do
    const { tool, args } = parseAction(action.value);
    
    let observation = "";
    
    try {
      // Execute the appropriate tool
      switch (tool) {
        case "search":
          observation = await executeSearch(args.query);
          break;
        case "calculator":
          observation = await executeCalculation(args.expression);
          break;
        case "weather":
          observation = await getWeather(args.location);
          break;
        default:
          observation = `Error: Unknown tool "${tool}"`;
      }
    } catch (error) {
      observation = `Error executing tool "${tool}": ${error.message}`;
    }
    
    return {
      observation: { value: observation }
    };
  }
};
```

### Answer State

The answer state formats the final response:

```typescript
const answerState = {
  async invoke({ answer }, { state }) {
    // Format the answer
    const formattedAnswer = formatAnswer(answer.value, state.query);
    
    return {
      answer: { value: formattedAnswer }
    };
  }
};
```

### OpenRouter API Integration

The agent integrates with the OpenRouter API to access large language models:

```typescript
async function callOpenRouter(messages) {
  console.log(`[${AGENT_NAME}] Calling OpenRouter API with model: ${MODEL}, message count: ${messages.length}`);
  
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`
    },
    body: JSON.stringify({
      model: MODEL,
      messages: messages,
      temperature: 0.7,
      max_tokens: 1500
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenRouter API error: ${error.message || response.statusText}`);
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}
```

## Configuration

Agent Alpha can be configured using environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENROUTER_API_KEY` | API key for OpenRouter | Required |
| `MODEL` | LLM model to use | "openai/gpt-4-turbo" |
| `AGENT_NAME` | Name of the agent | "agent_alpha" |
| `MAX_ITERATIONS` | Maximum number of thought-action-observation cycles | 5 |
| `TEMPERATURE` | Temperature parameter for the LLM | 0.7 |
| `MAX_TOKENS` | Maximum tokens for the response | 1500 |

## Usage

### Request Format

```json
{
  "messages": [
    {"role": "system", "content": "You are Agent Alpha, an AI assistant that uses the ReAct pattern."},
    {"role": "user", "content": "What is the capital of France and what is its population?"}
  ]
}
```

### Response Format

```json
{
  "role": "assistant",
  "content": "The capital of France is Paris. Paris has a population of approximately 2.16 million people within the city limits. The greater Paris metropolitan area has a population of about 12.4 million people, making it one of the largest metropolitan areas in Europe.",
  "reasoning": [
    {
      "thought": "I need to find the capital of France and its population. The capital of France is Paris. Now I need to find the population of Paris.",
      "action": "search(\"population of Paris France\")",
      "observation": "Paris has a population of 2.16 million people within the city limits. The greater Paris metropolitan area has a population of about 12.4 million people."
    }
  ]
}
```

## System Prompts

The agent uses carefully crafted system prompts to guide its behavior:

### Thought Prompt

```
You are Agent Alpha, an AI assistant that follows the ReAct (Reasoning + Acting) pattern.

When presented with a query, you will:
1. Think about how to approach the problem
2. Decide on an action to take
3. Observe the result of that action
4. Continue this cycle until you have enough information to provide a final answer

Your thought process should be clear, logical, and focused on solving the user's query.
If you have enough information to answer the query directly, provide your answer in the format:
ANSWER: [Your comprehensive answer here]
```

### Action Prompt

```
Based on your thought, determine the most appropriate action to take.
Choose from the following tools:
- search(query): Search for information on the web
- calculator(expression): Evaluate a mathematical expression
- weather(location): Get the current weather for a location

Format your action as:
ACTION: tool_name({"param1": "value1", "param2": "value2"})
```

## Error Handling

The agent handles various error scenarios:

- **Invalid Input**: Returns a 400 error if the input format is invalid
- **API Errors**: Returns a 500 error with details if the OpenRouter API fails
- **Tool Execution Errors**: Captures and reports errors during tool execution
- **Maximum Iterations**: Prevents infinite loops by limiting the number of iterations
- **Timeout Handling**: Implements timeouts for external API calls

## Deployment

Deploy Agent Alpha as a Supabase Edge Function:

```bash
# Deploy the function
supabase functions deploy agent_alpha

# Set environment variables
supabase secrets set OPENROUTER_API_KEY=your-openrouter-api-key
```

## Testing

Test Agent Alpha locally:

```bash
# Serve the function locally
supabase functions serve agent_alpha --env-file .env.local

# Test with curl
curl -X POST http://localhost:54321/functions/v1/agent_alpha \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "system", "content": "You are Agent Alpha, an AI assistant that uses the ReAct pattern."},
      {"role": "user", "content": "What is the capital of France and what is its population?"}
    ]
  }'
```

## Security Considerations

- **API Key Protection**: The OpenRouter API key is stored as an environment variable and never exposed to clients
- **Input Validation**: All inputs are validated to prevent injection attacks
- **Error Handling**: Error messages are sanitized to prevent information leakage
- **Rate Limiting**: Implements rate limiting to prevent abuse
- **Tool Restrictions**: Tools have appropriate restrictions to prevent misuse

## Limitations

- **Model Limitations**: Subject to the limitations of the underlying LLM model
- **Tool Availability**: Limited to the tools that have been implemented
- **Context Window**: Limited by the context window of the LLM
- **API Dependency**: Requires a connection to the OpenRouter API
- **Iteration Limit**: May not solve extremely complex problems that require many iterations

## Integration with Other Functions

Agent Alpha can be integrated with other edge functions:

```typescript
// Example of calling Agent Alpha from another function
async function callAgentAlpha(query) {
  const response = await fetch("https://your-project-ref.supabase.co/functions/v1/agent_alpha", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${supabaseAnonKey}`
    },
    body: JSON.stringify({
      messages: [
        { role: "system", content: "You are Agent Alpha, an AI assistant that uses the ReAct pattern." },
        { role: "user", content: query }
      ]
    })
  });
  
  return await response.json();
}
```

---

Created by rUv, Agentics Foundation founder.