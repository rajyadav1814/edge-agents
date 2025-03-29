# OpenAI Agents SDK Integration

This document explains how to use the OpenAI Agents SDK with the DevOps agent.

## Overview

The OpenAI Agents SDK provides a powerful framework for building AI agents that can use tools to perform tasks. By integrating this SDK with our DevOps agent, we can create more sophisticated agents that can:

- Interact with AWS services
- Manage GitHub repositories
- Orchestrate deployment workflows
- Handle complex multi-step operations

## Installation

To use the OpenAI Agents SDK with the DevOps agent, install the required dependencies:

```bash
pip install -r requirements.txt
```

Make sure your `.env` file includes the necessary configuration:

```
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4o
DEVOPS_AGENT_TRACING_ENABLED=false
DEVOPS_AGENT_DEFAULT_AGENT=devops
```

## Creating Function Tools

The DevOps agent uses function tools to interact with AWS services and GitHub. There are two ways to create function tools:

### Using the `@function_tool` Decorator

This is the recommended approach for most tools:

```python
from agents import function_tool
from pydantic import BaseModel, Field

class EC2InstanceFilter(BaseModel):
    """Filter parameters for EC2 instances."""
    region: str = Field(..., description="AWS region")
    instance_ids: list[str] = Field(default=None, description="List of instance IDs to filter by")
    filters: dict = Field(default=None, description="Additional filters")

@function_tool()
async def list_ec2_instances(filter_params: EC2InstanceFilter) -> list[EC2Instance]:
    """
    List EC2 instances based on filter parameters.
    
    Args:
        filter_params: Parameters to filter EC2 instances
        
    Returns:
        List of EC2 instances
    """
    # Implementation...
```

### Creating a FunctionTool Directly

For more complex cases, you can create a `FunctionTool` directly:

```python
from agents import FunctionTool, RunContextWrapper
from pydantic import BaseModel

class EC2InstanceFilter(BaseModel):
    region: str
    instance_ids: list[str] = None
    filters: dict = None

async def list_ec2_instances_impl(ctx: RunContextWrapper[Any], args: str) -> str:
    parsed = EC2InstanceFilter.model_validate_json(args)
    # Implementation...
    return json.dumps(result)

list_ec2_instances = FunctionTool(
    name="list_ec2_instances",
    description="List EC2 instances based on filter parameters",
    params_json_schema=EC2InstanceFilter.model_json_schema(),
    on_invoke_tool=list_ec2_instances_impl
)
```

## Creating Agents

Once you have defined your tools, you can create agents that use them:

```python
from agents import Agent

ec2_agent = Agent(
    name="EC2 Agent",
    instructions="""
    You are an EC2 management agent that helps users manage their EC2 instances.
    You can list, start, stop, and create EC2 instances.
    Always provide clear explanations of your actions and the results.
    """,
    tools=[list_ec2_instances, start_ec2_instances, stop_ec2_instances, create_ec2_instance],
    model="gpt-4o"
)
```

## Agent Orchestration

You can create a hierarchy of agents by using agents as tools:

```python
from agents import Agent, Handoff

# Create specialized agents
ec2_agent = Agent(
    name="EC2 Agent",
    instructions="You manage EC2 instances...",
    tools=[list_ec2_instances, start_ec2_instances, stop_ec2_instances, create_ec2_instance],
    model="gpt-4o"
)

github_agent = Agent(
    name="GitHub Agent",
    instructions="You manage GitHub repositories...",
    tools=[get_repository, list_issues, create_issue, list_pull_requests],
    model="gpt-4o"
)

# Create an orchestrator agent
orchestrator_agent = Agent(
    name="DevOps Orchestrator",
    instructions="""
    You are a DevOps orchestrator that helps users with various DevOps tasks.
    You can delegate to specialized agents for specific tasks.
    """,
    handoffs=[
        Handoff(agent=ec2_agent, description="Handles EC2 instance management tasks"),
        Handoff(agent=github_agent, description="Handles GitHub repository management tasks")
    ],
    model="gpt-4o"
)
```

## Running Agents

You can run agents in two ways:

### Synchronous Execution

```python
from agents import Runner

result = Runner.run_sync(
    ec2_agent,
    "List all my EC2 instances in us-west-2 region",
    context={}
)

print(result.final_output)
```

### Asynchronous Execution

```python
import asyncio
from agents import Runner

async def main():
    result = await Runner.run(
        ec2_agent,
        "List all my EC2 instances in us-west-2 region",
        context={}
    )
    
    print(result.final_output)

asyncio.run(main())
```

## Error Handling

You can provide custom error handling for function tools:

```python
def handle_ec2_error(error: Exception) -> str:
    """Handle errors in EC2 operations."""
    if isinstance(error, boto3.exceptions.Boto3Error):
        return f"AWS Error: {str(error)}"
    return f"An error occurred: {str(error)}"

@function_tool(failure_error_function=handle_ec2_error)
async def list_ec2_instances(filter_params: EC2InstanceFilter) -> list[EC2Instance]:
    # Implementation...
```

## Tracing

The OpenAI Agents SDK includes built-in tracing capabilities that collect comprehensive records of events during an agent run, including LLM generations, tool calls, handoffs, guardrails, and custom events.

### Enabling and Disabling Tracing

Tracing is enabled by default. There are two ways to disable it:

```python
# Method 1: Globally disable tracing via environment variable
os.environ["OPENAI_AGENTS_DISABLE_TRACING"] = "1"

# Method 2: Disable tracing for a single run
from agents import Runner, run

result = Runner.run_sync(
    agent,
    "List my EC2 instances",
    config=run.RunConfig(tracing_disabled=True)
)
```

For organizations operating under a Zero Data Retention (ZDR) policy using OpenAI's APIs, tracing is unavailable.

### Traces and Spans

Traces represent a single end-to-end operation of a workflow and are composed of spans:

- **Traces** have properties like:
  - `workflow_name`: The logical workflow or app (e.g., "Deployment workflow")
  - `trace_id`: A unique ID for the trace
  - `group_id`: Optional group ID to link multiple traces from the same conversation
  - `metadata`: Optional metadata for the trace

- **Spans** represent operations with start and end times, and contain information about the operation.

### Default Tracing

By default, the SDK traces:

- The entire `Runner.run()`, `Runner.run_sync()`, or `Runner.run_streamed()` call
- Each agent run
- LLM generations
- Function tool calls
- Guardrails
- Handoffs

### Creating Custom Traces

You can create custom traces to group multiple agent runs:

```python
from agents import Agent, Runner, trace

async def deploy_application():
    # Create agents
    github_agent = Agent(name="GitHub Agent", ...)
    ec2_agent = Agent(name="EC2 Agent", ...)
    
    # Create a trace for the entire deployment workflow
    with trace("Deployment Workflow"):
        # Get the latest code from GitHub
        github_result = await Runner.run(
            github_agent,
            "Get the latest commit from the main branch of myorg/myapp"
        )
        
        # Deploy to EC2
        ec2_result = await Runner.run(
            ec2_agent,
            f"Deploy commit {github_result.final_output} to instance i-1234567890abcdef0"
        )
        
        print(f"Deployment result: {ec2_result.final_output}")
```

### Handling Sensitive Data

Some spans track potentially sensitive data, such as LLM generation inputs/outputs and function call inputs/outputs. You can disable capturing this data:

```python
from agents import Runner, run

result = Runner.run_sync(
    agent,
    "List my EC2 instances",
    config=run.RunConfig(trace_include_sensitive_data=False)
)
```

### Custom Trace Processors

You can add custom trace processors to send traces to alternative or additional backends:

```python
from agents.tracing import add_trace_processor, set_trace_processors

# Add an additional trace processor
add_trace_processor(my_custom_processor)

# Replace the default processors with your own
set_trace_processors([my_custom_processor])
```

Several third-party integrations are available, including MLflow, Arize-Phoenix, LangSmith, and more.

## Examples

See the `examples/` directory for complete examples:

- `openai_agents_ec2_example.py`: Example of EC2 operations
- `openai_agents_github_example.py`: Example of GitHub operations
- `openai_agents_deployment_example.py`: Example of a deployment workflow

## Testing

To test the OpenAI Agents SDK integration, use the provided tests:

```bash
# Run the synchronous tests (these will fail due to coroutine issues)
python -m unittest tests/test_openai_agents_integration.py

# Run the asynchronous tests
python -m unittest tests/test_openai_agents_async.py
```

## Advanced Features

### Using Hosted Tools

The OpenAI Agents SDK provides hosted tools like WebSearchTool and FileSearchTool:

```python
from agents import Agent, WebSearchTool, FileSearchTool

agent = Agent(
    name="Research Agent",
    instructions="You are a research agent...",
    tools=[
        WebSearchTool(),
        FileSearchTool(
            max_num_results=3,
            vector_store_ids=["your-vector-store-id"],
        ),
    ],
    model="gpt-4o"
)
```

### Using the Computer Tool

The ComputerTool allows agents to automate computer use tasks:

```python
from agents import Agent, ComputerTool

agent = Agent(
    name="Automation Agent",
    instructions="You automate computer tasks...",
    tools=[ComputerTool()],
    model="gpt-4o"
)
```

## Best Practices

1. **Use Async/Await**: Always use async/await with function tools.
2. **Provide Clear Instructions**: Give agents clear and specific instructions.
3. **Handle Errors**: Implement proper error handling for function tools.
4. **Use Pydantic Models**: Define input parameters using Pydantic models for type safety.
5. **Document Your Tools**: Provide clear docstrings for your tools.
6. **Test Your Agents**: Write tests for your agents and tools.
7. **Use Tracing for Debugging**: Enable tracing when debugging agent execution.
8. **Protect Sensitive Data**: Disable sensitive data capture in traces when handling confidential information.
9. **Group Related Operations**: Use custom traces to group related operations.