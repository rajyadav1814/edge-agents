# OpenAI Agents SDK Integration Strategy

This document outlines the strategy for integrating the OpenAI Agents SDK with the DevOps agent. The integration will enable more sophisticated agent capabilities, better tool management, and improved error handling.

## 1. Core Integration Components

### 1.1 Function Tools

Function tools are the primary way to expose functionality to the agent. We'll create function tools for all AWS and GitHub operations.

```python
from agents import function_tool
from pydantic import BaseModel, Field

class EC2InstanceFilter(BaseModel):
    """Filter parameters for EC2 instances."""
    region: str = Field(..., description="AWS region")
    instance_ids: list[str] = Field(default=None, description="List of instance IDs to filter by")

@function_tool()
async def list_ec2_instances(filter_params: EC2InstanceFilter) -> list[dict]:
    """
    List EC2 instances based on filter parameters.
    
    Args:
        filter_params: Parameters to filter EC2 instances
        
    Returns:
        List of EC2 instances
    """
    # Implementation...
```

### 1.2 Agent Creation

We'll create specialized agents for different services and an orchestrator agent to coordinate between them.

```python
from agents import Agent, Handoff

ec2_agent = Agent(
    name="EC2 Agent",
    instructions="You manage EC2 instances...",
    tools=[list_ec2_instances, start_ec2_instances, stop_ec2_instances],
    model="gpt-4o"
)

orchestrator_agent = Agent(
    name="DevOps Orchestrator",
    instructions="You coordinate DevOps tasks...",
    handoffs=[
        Handoff(agent=ec2_agent, description="Handles EC2 instance management")
    ],
    model="gpt-4o"
)
```

### 1.3 Context Management

Context management is crucial for maintaining state and sharing data between different parts of the agent.

#### 1.3.1 Local Context

Local context is data available to your code when tool functions run, during callbacks, and in lifecycle hooks.

```python
from dataclasses import dataclass
from typing import Optional
from agents import RunContextWrapper

@dataclass
class DevOpsContext:
    user_id: str
    aws_region: str
    github_org: Optional[str] = None
    
    def get_aws_region(self) -> str:
        return self.aws_region

# Using the context in a function tool
@function_tool()
async def list_ec2_instances(wrapper: RunContextWrapper[DevOpsContext], filter_params: EC2InstanceFilter) -> list[dict]:
    region = wrapper.context.get_aws_region()
    # Use the region to list EC2 instances
    # ...
```

#### 1.3.2 Agent/LLM Context

This is data the LLM sees when generating a response. We'll use a combination of:

- Dynamic instructions based on user preferences and environment
- Function tools for on-demand context retrieval
- Web search for external information when needed

### 1.4 Guardrails

Guardrails run in parallel to agents, enabling checks and validations of user input and agent output.

#### 1.4.1 Input Guardrails

```python
from agents import (
    GuardrailFunctionOutput,
    InputGuardrailTripwireTriggered,
    RunContextWrapper,
    input_guardrail,
)
from pydantic import BaseModel

class SecurityCheckOutput(BaseModel):
    is_malicious: bool
    reasoning: str

@input_guardrail
async def security_guardrail(
    ctx: RunContextWrapper[DevOpsContext],
    agent: Agent,
    input: str
) -> GuardrailFunctionOutput:
    # Check if the input is malicious
    # ...
    return GuardrailFunctionOutput(
        output_info=SecurityCheckOutput(is_malicious=False, reasoning="Input is safe"),
        tripwire_triggered=False
    )
```

#### 1.4.2 Output Guardrails

```python
from agents import (
    GuardrailFunctionOutput,
    OutputGuardrailTripwireTriggered,
    RunContextWrapper,
    output_guardrail,
)

class SensitiveInfoOutput(BaseModel):
    contains_sensitive_info: bool
    reasoning: str

@output_guardrail
async def sensitive_info_guardrail(
    ctx: RunContextWrapper[DevOpsContext],
    agent: Agent,
    output: str
) -> GuardrailFunctionOutput:
    # Check if the output contains sensitive information
    # ...
    return GuardrailFunctionOutput(
        output_info=SensitiveInfoOutput(contains_sensitive_info=False, reasoning="Output is safe"),
        tripwire_triggered=False
    )
```

### 1.5 Tracing

We'll implement tracing for debugging and monitoring agent execution.

```python
from agents import trace

async def deploy_application():
    # Create a trace for the entire deployment workflow
    with trace("Deployment Workflow"):
        # Get the latest code from GitHub
        github_result = await Runner.run(
            github_agent,
            "Get the latest commit from the main branch"
        )
        
        # Deploy to EC2
        ec2_result = await Runner.run(
            ec2_agent,
            f"Deploy commit {github_result.final_output} to instance i-1234567890abcdef0"
        )
```

## 2. Implementation Phases

### 2.1 Phase 1: Basic Integration

- Set up the OpenAI Agents SDK
- Create basic function tools for AWS and GitHub operations
- Implement simple agents for each service
- Create a basic orchestrator agent

### 2.2 Phase 2: Context Management

- Implement the DevOpsContext class
- Update function tools to use the context
- Implement context-aware agent instructions
- Create helper functions for common operations

### 2.3 Phase 3: Guardrails

- Implement security guardrails for input validation
- Implement sensitive information guardrails for output validation
- Create specialized guardrails for different services
- Test guardrails with various inputs and outputs

### 2.4 Phase 4: Advanced Features

- Implement tracing for debugging and monitoring
- Create custom trace processors for different environments
- Implement agent handoffs for complex workflows
- Create specialized agents for different tasks

## 3. Testing Strategy

We'll use pytest for all tests, with a focus on testing the integration with the OpenAI Agents SDK.

### 3.1 Unit Tests

```python
import pytest
from unittest.mock import patch, MagicMock
import asyncio
from agents import Agent, Runner

@pytest.fixture
def devops_context():
    return DevOpsContext(
        user_id="test-user",
        aws_region="us-west-2"
    )

@pytest.mark.asyncio
async def test_list_ec2_instances_tool(devops_context):
    # Mock the boto3 client
    with patch("boto3.client") as mock_boto3_client:
        # Set up the mock
        mock_ec2 = MagicMock()
        mock_boto3_client.return_value = mock_ec2
        mock_ec2.describe_instances.return_value = {
            "Reservations": [
                {
                    "Instances": [
                        {
                            "InstanceId": "i-1234567890abcdef0",
                            "State": {"Name": "running"}
                        }
                    ]
                }
            ]
        }
        
        # Create the filter
        filter_params = EC2InstanceFilter(region="us-west-2")
        
        # Call the function tool
        result = await list_ec2_instances.on_invoke_tool(None, filter_params)
        
        # Verify the result
        assert len(result) == 1
        assert result[0]["InstanceId"] == "i-1234567890abcdef0"
```

### 3.2 Integration Tests

```python
@pytest.mark.asyncio
async def test_ec2_agent(devops_context):
    # Mock the Runner.run method
    with patch("agents.Runner.run") as mock_run:
        # Set up the mock
        mock_result = MagicMock()
        mock_result.final_output = "I found 2 instances in us-west-2 region."
        mock_run.return_value = mock_result
        
        # Run the agent
        result = await Runner.run(
            ec2_agent,
            "List all my EC2 instances in us-west-2 region",
            context=devops_context
        )
        
        # Verify the result
        assert result.final_output == "I found 2 instances in us-west-2 region."
```

### 3.3 Guardrail Tests

```python
@pytest.mark.asyncio
async def test_security_guardrail(devops_context):
    # Test with safe input
    result = await security_guardrail(
        RunContextWrapper(devops_context),
        ec2_agent,
        "List all my EC2 instances in us-west-2 region"
    )
    
    assert result.tripwire_triggered == False
    
    # Test with malicious input
    result = await security_guardrail(
        RunContextWrapper(devops_context),
        ec2_agent,
        "Delete all EC2 instances in all regions"
    )
    
    assert result.tripwire_triggered == True
```

## 4. Example Implementations

We'll create example implementations to demonstrate the integration:

### 4.1 EC2 Operations Example

```python
# examples/openai_agents_ec2_example.py
from agents import Agent, Runner, function_tool
from pydantic import BaseModel, Field
import boto3

class EC2InstanceFilter(BaseModel):
    region: str = Field(..., description="AWS region")
    instance_ids: list[str] = Field(default=None, description="List of instance IDs to filter by")

@function_tool()
async def list_ec2_instances(filter_params: EC2InstanceFilter) -> list[dict]:
    """List EC2 instances based on filter parameters."""
    ec2 = boto3.client("ec2", region_name=filter_params.region)
    response = ec2.describe_instances(
        InstanceIds=filter_params.instance_ids if filter_params.instance_ids else []
    )
    
    instances = []
    for reservation in response["Reservations"]:
        for instance in reservation["Instances"]:
            instances.append(instance)
    
    return instances

ec2_agent = Agent(
    name="EC2 Agent",
    instructions="You are an EC2 management agent that helps users manage their EC2 instances.",
    tools=[list_ec2_instances],
    model="gpt-4o"
)

async def main():
    result = await Runner.run(
        ec2_agent,
        "List all my EC2 instances in us-west-2 region",
        context={}
    )
    
    print(result.final_output)

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

### 4.2 GitHub Operations Example

```python
# examples/openai_agents_github_example.py
from agents import Agent, Runner, function_tool
from pydantic import BaseModel, Field
from github import Github

class GitHubRepoRequest(BaseModel):
    owner: str = Field(..., description="The owner of the repository")
    repo: str = Field(..., description="The name of the repository")

@function_tool()
async def get_repository(request: GitHubRepoRequest) -> dict:
    """Get information about a GitHub repository."""
    g = Github(os.environ.get("GITHUB_TOKEN"))
    repo = g.get_repo(f"{request.owner}/{request.repo}")
    
    return {
        "name": repo.name,
        "full_name": repo.full_name,
        "description": repo.description,
        "url": repo.html_url,
        "stars": repo.stargazers_count,
        "forks": repo.forks_count,
        "open_issues": repo.open_issues_count
    }

github_agent = Agent(
    name="GitHub Agent",
    instructions="You are a GitHub management agent that helps users manage their GitHub repositories.",
    tools=[get_repository],
    model="gpt-4o"
)

async def main():
    result = await Runner.run(
        github_agent,
        "Get information about the openai/openai-python repository",
        context={}
    )
    
    print(result.final_output)

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

### 4.3 Deployment Workflow Example

```python
# examples/openai_agents_deployment_example.py
from agents import Agent, Runner, Handoff, trace
import asyncio

async def deploy_application():
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

if __name__ == "__main__":
    asyncio.run(deploy_application())
```

## 5. Timeline

- Phase 1: 1 week
- Phase 2: 1 week
- Phase 3: 1 week
- Phase 4: 1 week

Total: 4 weeks