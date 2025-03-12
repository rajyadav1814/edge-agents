// supabase/functions/openai-agent-sdk/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { OpenAI } from "https://esm.sh/openai@4.20.1";

// ---------- Global Tracing Configuration ----------
const tracingEnabled =
  Deno.env.get("LLM_DEBUG") === "true" ||
  Deno.env.get("AGENT_LIFECYCLE") === "true" ||
  Deno.env.get("TOOL_DEBUG") === "true";

// ---------- Type Definitions ----------

interface ToolCall {
  id?: string;
  function: {
    name: string;
    arguments: string;
  };
}

interface Message {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
  // Present when the assistant calls a function
  tool_calls?: ToolCall[];
  // Present in a tool response to link to its tool call
  tool_call_id?: string;
}

interface Tool {
  name: string;
  description: string;
  parameters: object;
  execute: (params: any) => Promise<any>;
}

interface Guardrail {
  // Returns true if the messages pass the guardrail
  check: (msgs: Message[], context: Context) => Promise<boolean>;
  // Called if check fails; can log or throw
  onFailure: (msgs: Message[], context: Context) => void;
}

interface Agent {
  name: string;
  instructions: string;
  tools: Tool[];
  model: string;
  input_guardrails?: Guardrail[];
}

interface Context {
  conversation: Message[];
  state: Record<string, any>;
}

interface AgentRunConfig {
  run_name?: string;
  tracing_disabled?: boolean;
  trace_non_openai_generations?: boolean;
}

interface StreamEvent {
  delta: string;
  type: "partial" | "tool_call" | "final";
}

// ---------- OpenAI Client Initialization ----------
const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});

// ---------- Utility: Trace Logging ----------
function trace(message: string, data?: any, config?: AgentRunConfig) {
  if (!config?.tracing_disabled && tracingEnabled) {
    console.log(`[TRACE] ${message}`, data || "");
  }
}

// ---------- Guardrail Example Implementation ----------
const defaultGuardrail: Guardrail = {
  async check(msgs: Message[], _context: Context) {
    // Example: reject input containing "badword"
    const content = msgs.map((m) => m.content).join(" ");
    return !content.toLowerCase().includes("badword");
  },
  onFailure(msgs: Message[], _context: Context) {
    console.error("Guardrail violation with input:", msgs);
  },
};

// ---------- Core Agent Logic (Non‑streaming) ----------
async function runAgentLoop(
  agent: Agent,
  input: string,
  context: Context,
  config?: AgentRunConfig
): Promise<string> {
  // Guardrail check on user input
  if (agent.input_guardrails) {
    for (const guardrail of agent.input_guardrails) {
      const allowed = await guardrail.check([{ role: "user", content: input }], context);
      if (!allowed) {
        guardrail.onFailure([{ role: "user", content: input }], context);
        throw new Error("Guardrail triggered: Input not allowed");
      }
    }
  }

  // Record user input
  context.conversation.push({ role: "user", content: input });
  trace("User input recorded", { input }, config);

  let isComplete = false;
  let finalOutput = "";

  while (!isComplete) {
    // Build the conversation messages with system prompt
    const messages: Message[] = [
      { role: "system", content: agent.instructions },
      ...context.conversation,
    ];
    trace("Sending messages to OpenAI", { messages }, config);

    const response = await openai.chat.completions.create({
      model: agent.model,
      messages,
      ...(agent.model.includes("search") ? {
        web_search_options: {
          search_context_size: "medium"
        }
      } : {
        tools: agent.tools.map((tool) => ({
          type: "function",
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters,
          },
        })),
        tool_choice: "auto"
      }),
      // Non-streaming mode
      stream: false,
    });

    const responseMessage: Message = response.choices[0].message;
    trace("Received response", { responseMessage }, config);

    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      // Record the assistant's tool call message
      context.conversation.push({
        role: "assistant",
        content: responseMessage.content || "",
        name: agent.name,
        tool_calls: responseMessage.tool_calls,
      });
      trace("Assistant tool call recorded", { tool_calls: responseMessage.tool_calls }, config);

      // Process each tool call in order
      for (const toolCall of responseMessage.tool_calls) {
        const toolName = toolCall.function.name;
        let toolParams: any;
        try {
          toolParams = JSON.parse(toolCall.function.arguments);
        } catch (e) {
          toolParams = {};
        }
        trace("Executing tool", { toolName, toolParams }, config);

        const tool = agent.tools.find((t) => t.name === toolName);
        if (tool) {
          const toolResult = await tool.execute(toolParams);
          const toolCallId =
            toolCall.id || "tool_call_" + Math.random().toString(36).substr(2, 9);
          // Record tool result with matching call id
          context.conversation.push({
            role: "tool",
            tool_call_id: toolCallId,
            name: toolName,
            content: JSON.stringify(toolResult),
          });
          trace("Tool result recorded", { toolName, toolResult, toolCallId }, config);
        }
      }
    } else {
      // Final assistant response (no tool call needed)
      finalOutput = responseMessage.content || "";
      isComplete = true;
      context.conversation.push({
        role: "assistant",
        content: finalOutput,
        name: agent.name,
      });
      trace("Final output recorded", { finalOutput }, config);
    }
  }

  return finalOutput;
}

// ---------- Core Agent Logic (Streaming Mode) ----------
async function* runAgentLoopStreamed(
  agent: Agent,
  input: string,
  context: Context,
  config?: AgentRunConfig
): AsyncGenerator<StreamEvent, void, unknown> {
  // Guardrail check on user input
  if (agent.input_guardrails) {
    for (const guardrail of agent.input_guardrails) {
      const allowed = await guardrail.check([{ role: "user", content: input }], context);
      if (!allowed) {
        guardrail.onFailure([{ role: "user", content: input }], context);
        throw new Error("Guardrail triggered: Input not allowed");
      }
    }
  }

  // Record user input
  context.conversation.push({ role: "user", content: input });
  trace("User input recorded (stream)", { input }, config);

  let isComplete = false;
  while (!isComplete) {
    const messages: Message[] = [
      { role: "system", content: agent.instructions },
      ...context.conversation,
    ];
    trace("Sending messages to OpenAI (stream)", { messages }, config);

    const stream = await openai.chat.completions.create({
      model: agent.model,
      messages,
      ...(agent.model.includes("search") ? {
        web_search_options: {
          search_context_size: "medium"
        }
      } : {
        tools: agent.tools.map((tool) => ({
          type: "function",
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters,
          },
        })),
        tool_choice: "auto"
      }),
      stream: true,
    });

    // Process events from the stream. Each event may be a partial text delta,
    // tool call info, or a final message indicator.
    for await (const event of stream) {
      // Assume each event has: { delta?: string, type?: string, done?: boolean, tool_calls?: ToolCall[] }
      // Yield the delta if present.
      if (event.delta) {
        yield { delta: event.delta, type: (event.type as any) || "partial" };
      }
      // If the event signals a tool call, record it and execute the tool.
      if (event.tool_calls && event.tool_calls.length > 0) {
        // Record the assistant message that contains the tool call.
        context.conversation.push({
          role: "assistant",
          content: event.delta || "",
          name: agent.name,
          tool_calls: event.tool_calls,
        });
        trace("Assistant tool call recorded (stream)", { tool_calls: event.tool_calls }, config);
        for (const toolCall of event.tool_calls) {
          const toolName = toolCall.function.name;
          let toolParams: any;
          try {
            toolParams = JSON.parse(toolCall.function.arguments);
          } catch (e) {
            toolParams = {};
          }
          trace("Executing tool (stream)", { toolName, toolParams }, config);
          const tool = agent.tools.find((t) => t.name === toolName);
          if (tool) {
            const toolResult = await tool.execute(toolParams);
            const toolCallId =
              toolCall.id || "tool_call_" + Math.random().toString(36).substr(2, 9);
            context.conversation.push({
              role: "tool",
              tool_call_id: toolCallId,
              name: toolName,
              content: JSON.stringify(toolResult),
            });
            trace("Tool result recorded (stream)", { toolName, toolResult, toolCallId }, config);
            // Yield an event for the tool output.
            yield { delta: JSON.stringify(toolResult), type: "tool_call" };
          }
        }
      }
      if (event.done) {
        isComplete = true;
        yield { delta: "\n--- done ---", type: "final" };
        break;
      }
    }
  }
}

// ---------- AgentRunner Class ----------
class AgentRunner {
  static async run(
    agent: Agent,
    inputs: string[],
    config?: AgentRunConfig
  ): Promise<{ result: string; conversation: Message[] }> {
    const context: Context = { conversation: [], state: {} };
    let result = "";
    for (const input of inputs) {
      result = await runAgentLoop(agent, input, context, config);
    }
    return { result, conversation: context.conversation };
  }

  static run_streamed(
    agent: Agent,
    inputs: string[],
    config?: AgentRunConfig
  ): AsyncGenerator<StreamEvent, void, unknown> {
    const context: Context = { conversation: [], state: {} };
    // For streaming, assume a single input for simplicity; you can extend to multiple inputs if needed.
    return runAgentLoopStreamed(agent, inputs[0], context, config);
  }
}

// ---------- Tool Implementations ----------
const databaseQueryTool: Tool = {
  name: "database_query",
  description: "Query the Supabase database",
  parameters: {
    type: "object",
    properties: {
      table: {
        type: "string",
        description: "The table to query",
      },
      filter: {
        type: "object",
        description: "Filter conditions",
      },
    },
    required: ["table"],
  },
  execute: async (params) => {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_ANON_KEY") || ""
    );
    const { data, error } = await supabaseClient
      .from(params.table)
      .select("*")
      .match(params.filter || {});
    if (error) return { error: error.message };
    return { data };
  },
};

// ---------- Agent Definitions ----------
const researchAgent: Agent = {
  name: "researcher",
  instructions:
    "You are a research agent that finds information using web search and analyzes it. Be thorough and cite your sources. When providing information from web searches, include the citations in your response.",
  tools: [],
  model: "gpt-4o-search-preview",
  input_guardrails: [defaultGuardrail],
};

const databaseAgent: Agent = {
  name: "database_expert",
  instructions:
    "You are a database expert that can query and analyze data from the database. Provide clear explanations of your findings.",
  tools: [databaseQueryTool],
  model: "gpt-4o-mini",
  input_guardrails: [defaultGuardrail],
};

// ---------- Agent Orchestration Function ----------
async function orchestrateAgents(
  input: string,
  agentMap: Record<string, Agent>,
  config?: AgentRunConfig
) {
  const context: Context = { conversation: [], state: {} };

  // Determine agent by keyword matching
  let currentAgentName = "researcher";
  if (
    input.toLowerCase().includes("database") ||
    input.toLowerCase().includes("data") ||
    input.toLowerCase().includes("query")
  ) {
    currentAgentName = "database_expert";
  }
  let currentAgent = agentMap[currentAgentName];
  let result = await runAgentLoop(currentAgent, input, context, config);

  // If result indicates further database info is needed, hand off
  const needsDatabaseInfo =
    result.toLowerCase().includes("need database information") ||
    result.toLowerCase().includes("check the database");

  if (needsDatabaseInfo && currentAgentName !== "database_expert") {
    const handoffInput = `Based on the previous research: ${result}, please provide database information.`;
    result = await runAgentLoop(agentMap["database_expert"], handoffInput, context, config);
  }
  return { result, conversation: context.conversation };
}

// ---------- Main Handler for Supabase Edge Function ----------
serve(async (req) => {
  try {
    const { input, stream } = await req.json();

    if (!input) {
      return new Response(
        JSON.stringify({ error: "Input is required" }),
        { headers: { "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Agent map for routing
    const agentMap = {
      researcher: researchAgent,
      database_expert: databaseAgent,
    };

    // If streaming flag is set, use run_streamed; otherwise, use run.
    if (stream) {
      const streamIterator = AgentRunner.run_streamed(researchAgent, [input]);
      // Example: pipe streaming events back as text-delimited JSON lines.
      const encoder = new TextEncoder();
      const streamBody = new ReadableStream({
        async start(controller) {
          for await (const event of streamIterator) {
            controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
          }
          controller.close();
        },
      });
      return new Response(streamBody, {
        headers: { "Content-Type": "text/plain" },
      });
    } else {
      const result = await orchestrateAgents(input, agentMap);
      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    );
  }
});
