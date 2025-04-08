# Building a Basic Agentic Function

In this tutorial, we'll build a basic agentic edge function that can reason about problems and take actions. This is a simplified version of the Agent Alpha implementation, designed to help you understand the core concepts of agentic functions.

## What Are Agentic Functions?

Agentic functions are edge functions that implement autonomous agent capabilities. They can:

1. Reason about problems
2. Take actions based on their reasoning
3. Observe the results of those actions
4. Continue this cycle until they have enough information to provide a final answer

This approach, known as the ReAct (Reasoning + Acting) pattern, allows for more structured problem-solving and better handling of complex tasks.

## Prerequisites

Before starting, make sure you have:

1. Completed the [Creating Your First Edge Function](./01-first-edge-function.md) tutorial
2. [OpenRouter](https://openrouter.ai/) API key (sign up for free)
3. Basic understanding of TypeScript and async/await

## Step 1: Set Up Your Project

Create a new edge function for our agent:

```bash
# Create a new edge function
supabase functions new simple-agent
```

## Step 2: Create Configuration Files

First, let's create a `deno.json` file in the `supabase/functions/simple-agent` directory:

```json
{
  "tasks": {
    "start": "deno run --allow-net --allow-env index.ts"
  },
  "importMap": "../import_map.json"
}
```

## Step 3: Write Your Agent Function

Now, let's create the agent function. Open the file `supabase/functions/simple-agent/index.ts` and add the following code:

```typescript
// Import type definitions for Supabase Edge Functions
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// Configuration
const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY") || "";
const MODEL = Deno.env.get("MODEL") || "openai/gpt-3.5-turbo";
const AGENT_NAME = "simple-agent";

// System prompts
const SYSTEM_PROMPT = `
You are a helpful AI assistant that follows the ReAct (Reasoning + Acting) pattern.

When presented with a query, you will:
1. Think about how to approach the problem
2. Decide on an action to take
3. Observe the result of that action
4. Continue this cycle until you have enough information to provide a final answer

Your thought process should be clear, logical, and focused on solving the user's query.
If you have enough information to answer the query directly, provide your answer in the format:
ANSWER: [Your comprehensive answer here]
`;

const ACTION_PROMPT = `
Based on your thought, determine the most appropriate action to take.
Choose from the following tools:
- search(query): Search for information on the web
- calculator(expression): Evaluate a mathematical expression
- weather(location): Get the current weather for a location

Format your action as:
ACTION: tool_name({"param1": "value1", "param2": "value2"})
`;

// Main handler
Deno.serve(async (req) => {
  try {
    // Parse the request body
    const { messages } = await req.json();
    
    if (!Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Invalid request format. Expected 'messages' array." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Initialize the agent state
    const state = {
      query: messages.find(m => m.role === "user")?.content || "",
      thoughts: [],
      actions: [],
      observations: [],
      answer: ""
    };
    
    // Process the query through the agent
    const result = await processQuery(state);
    
    // Return the response
    return new Response(
      JSON.stringify({
        role: "assistant",
        content: result.answer,
        reasoning: result.reasoning
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(`[${AGENT_NAME}] Error:`, error);
    
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

// Process the query through the agent
async function processQuery(state) {
  console.log(`[${AGENT_NAME}] Processing query:`, state.query);
  
  // Maximum number of iterations to prevent infinite loops
  const MAX_ITERATIONS = 3;
  
  // Initialize the reasoning array to track the agent's thought process
  const reasoning = [];
  
  // Start the thought-action-observation cycle
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    console.log(`[${AGENT_NAME}] Iteration ${i + 1}`);
    
    // Generate a thought
    const thought = await generateThought(state);
    state.thoughts.push(thought);
    
    // Check if we have an answer
    if (thought.includes("ANSWER:")) {
      const answer = thought.split("ANSWER:")[1].trim();
      state.answer = answer;
      
      // Add the final thought to the reasoning
      reasoning.push({ thought });
      
      break;
    }
    
    // Generate an action
    const action = await generateAction(state);
    state.actions.push(action);
    
    // Execute the action
    const observation = await executeAction(action);
    state.observations.push(observation);
    
    // Add this iteration to the reasoning
    reasoning.push({
      thought,
      action,
      observation
    });
  }
  
  // If we didn't get an answer after MAX_ITERATIONS, generate a final answer
  if (!state.answer) {
    const finalThought = await generateFinalAnswer(state);
    state.answer = finalThought.split("ANSWER:")[1].trim();
  }
  
  return {
    answer: state.answer,
    reasoning
  };
}

// Generate a thought based on the current state
async function generateThought(state) {
  console.log(`[${AGENT_NAME}] Generating thought`);
  
  // Prepare the messages for the LLM
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: state.query }
  ];
  
  // Add previous interactions to the context
  for (let i = 0; i < state.thoughts.length; i++) {
    messages.push({ role: "assistant", content: `Thought: ${state.thoughts[i]}` });
    
    if (state.actions[i]) {
      messages.push({ role: "assistant", content: `Action: ${state.actions[i]}` });
    }
    
    if (state.observations[i]) {
      messages.push({ role: "user", content: `Observation: ${state.observations[i]}` });
    }
  }
  
  // Call the LLM to generate a thought
  const response = await callOpenRouter(messages);
  
  return response;
}

// Generate an action based on the current thought
async function generateAction(state) {
  console.log(`[${AGENT_NAME}] Generating action`);
  
  // Prepare the messages for the LLM
  const messages = [
    { role: "system", content: ACTION_PROMPT },
    { role: "user", content: state.query },
    { role: "assistant", content: `Thought: ${state.thoughts[state.thoughts.length - 1]}` }
  ];
  
  // Call the LLM to generate an action
  const response = await callOpenRouter(messages);
  
  // Extract the action from the response
  const actionMatch = response.match(/ACTION: ([a-zA-Z_]+)\(({.*})\)/);
  
  if (!actionMatch) {
    return "search({\"query\": \"" + state.query + "\"})";
  }
  
  return `${actionMatch[1]}(${actionMatch[2]})`;
}

// Execute an action and return the observation
async function executeAction(action) {
  console.log(`[${AGENT_NAME}] Executing action:`, action);
  
  // Parse the action
  const actionMatch = action.match(/([a-zA-Z_]+)\(({.*})\)/);
  
  if (!actionMatch) {
    return "Error: Invalid action format";
  }
  
  const tool = actionMatch[1];
  let args;
  
  try {
    args = JSON.parse(actionMatch[2]);
  } catch (error) {
    return `Error parsing action arguments: ${error.message}`;
  }
  
  // Execute the appropriate tool
  switch (tool) {
    case "search":
      return await executeSearch(args.query);
    case "calculator":
      return await executeCalculation(args.expression);
    case "weather":
      return await getWeather(args.location);
    default:
      return `Error: Unknown tool "${tool}"`;
  }
}

// Generate a final answer based on the current state
async function generateFinalAnswer(state) {
  console.log(`[${AGENT_NAME}] Generating final answer`);
  
  // Prepare the messages for the LLM
  const messages = [
    { role: "system", content: `${SYSTEM_PROMPT}\n\nYou've reached the maximum number of iterations. Please provide your best answer based on the information you have.` },
    { role: "user", content: state.query }
  ];
  
  // Add all previous interactions to the context
  for (let i = 0; i < state.thoughts.length; i++) {
    messages.push({ role: "assistant", content: `Thought: ${state.thoughts[i]}` });
    
    if (state.actions[i]) {
      messages.push({ role: "assistant", content: `Action: ${state.actions[i]}` });
    }
    
    if (state.observations[i]) {
      messages.push({ role: "user", content: `Observation: ${state.observations[i]}` });
    }
  }
  
  // Call the LLM to generate a final answer
  const response = await callOpenRouter(messages);
  
  return response.includes("ANSWER:") ? response : `ANSWER: ${response}`;
}

// Call the OpenRouter API
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
      max_tokens: 1000
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenRouter API error: ${error.message || response.statusText}`);
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}

// Mock tool implementations
async function executeSearch(query) {
  // In a real implementation, this would call a search API
  return `Here are some search results for "${query}": (1) Wikipedia article on the topic, (2) Recent news about ${query}, (3) Academic papers related to ${query}.`;
}

async function executeCalculation(expression) {
  try {
    // WARNING: Using eval is generally not recommended for security reasons
    // This is a simplified example for demonstration purposes only
    // In a production environment, use a proper expression parser
    const result = eval(expression);
    return `The result of ${expression} is ${result}`;
  } catch (error) {
    return `Error calculating ${expression}: ${error.message}`;
  }
}

async function getWeather(location) {
  // In a real implementation, this would call a weather API
  return `The weather in ${location} is currently sunny with a temperature of 22°C (72°F).`;
}
```

## Step 4: Set Up Environment Variables

Create a `.env.local` file in your project root with your OpenRouter API key:

```
OPENROUTER_API_KEY=your-openrouter-api-key
MODEL=openai/gpt-3.5-turbo
```

## Step 5: Run Your Agent Locally

Now let's run the agent locally to test it:

```bash
# Start the Supabase local development environment
supabase start

# Serve your function locally with environment variables
supabase functions serve simple-agent --env-file .env.local
```

This will start your function at `http://localhost:54321/functions/v1/simple-agent`.

## Step 6: Test Your Agent

You can test your agent using `curl` or any HTTP client:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "system", "content": "You are a helpful AI assistant."},
      {"role": "user", "content": "What is the capital of France and what is its population?"}
    ]
  }' \
  http://localhost:54321/functions/v1/simple-agent
```

Expected response:
```json
{
  "role": "assistant",
  "content": "The capital of France is Paris. Paris has a population of approximately 2.16 million people within the city limits. The greater Paris metropolitan area has a population of about 12.4 million people, making it one of the largest metropolitan areas in Europe.",
  "reasoning": [
    {
      "thought": "I need to find the capital of France and its population. The capital of France is Paris. Now I need to find the population of Paris.",
      "action": "search({\"query\": \"population of Paris France\"})",
      "observation": "Here are some search results for \"population of Paris France\": (1) Wikipedia article on the topic, (2) Recent news about population of Paris France, (3) Academic papers related to population of Paris France."
    },
    {
      "thought": "Based on the search results, I can see that there should be information about the population of Paris in the Wikipedia article. Let me extract the key information about Paris's population."
    }
  ]
}
```

## Understanding the Code

Let's break down the key components of our agent:

### Agent State

The agent maintains a state that includes:
- The user's query
- A history of thoughts, actions, and observations
- The final answer

```typescript
const state = {
  query: messages.find(m => m.role === "user")?.content || "",
  thoughts: [],
  actions: [],
  observations: [],
  answer: ""
};
```

### The ReAct Pattern

The agent follows the ReAct pattern, which consists of a cycle of:
1. **Thought**: The agent reasons about the problem
2. **Action**: The agent decides on an action to take
3. **Observation**: The agent observes the result of the action

This cycle continues until the agent has enough information to provide a final answer.

```typescript
// Start the thought-action-observation cycle
for (let i = 0; i < MAX_ITERATIONS; i++) {
  // Generate a thought
  const thought = await generateThought(state);
  
  // Check if we have an answer
  if (thought.includes("ANSWER:")) {
    // ...
    break;
  }
  
  // Generate an action
  const action = await generateAction(state);
  
  // Execute the action
  const observation = await executeAction(action);
  
  // Add this iteration to the reasoning
  reasoning.push({
    thought,
    action,
    observation
  });
}
```

### Tools

The agent can use various tools to interact with the world:
- `search`: Search for information on the web
- `calculator`: Evaluate a mathematical expression
- `weather`: Get the current weather for a location

In this tutorial, we've implemented mock versions of these tools, but in a real application, you would connect them to actual APIs.

### OpenRouter Integration

The agent uses OpenRouter to access large language models:

```typescript
async function callOpenRouter(messages) {
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
      max_tokens: 1000
    })
  });
  
  // ...
  
  return data.choices[0].message.content;
}
```

## Next Steps

Congratulations! You've created a basic agentic edge function. This is a simplified version of the Agent Alpha implementation, but it demonstrates the core concepts of agentic functions.

In a real application, you would:
- Connect the tools to actual APIs
- Add more sophisticated error handling
- Implement proper authentication
- Add more tools and capabilities

To learn how to deploy your agent to production, check out the [Deploying and Testing Edge Functions](./03-deployment-and-testing.md) tutorial.

---

[Back to Tutorials](./README.md)