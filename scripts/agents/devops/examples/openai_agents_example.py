"""
OpenAI Agents SDK Example - Demonstrates the usage of the DevOps agent with OpenAI Agents SDK.

This example shows how to create agents for EC2 and GitHub operations, set up guardrails,
and orchestrate them using the OpenAI Agents SDK.
"""

import os
import asyncio
from pydantic import BaseModel, Field

from agents import Agent, Runner, GuardrailFunctionOutput, InputGuardrail
from agents.types import RunContext

from src.core import DevOpsContext, security_guardrail, sensitive_info_guardrail
from src.aws import (
    list_ec2_instances,
    start_ec2_instances,
    stop_ec2_instances,
    create_ec2_instance
)
from src.github import (
    get_repository,
    list_issues,
    create_issue,
    list_pull_requests
)


async def main():
    """Run the example."""
    # Set up the OpenAI API key
    if "OPENAI_API_KEY" not in os.environ:
        print("Please set the OPENAI_API_KEY environment variable")
        return
    
    # Create a DevOps context
    context = DevOpsContext(
        user_id="example-user",
        aws_region="us-west-2",
        github_org="example-org"
    )
    
    # Create specialized agents
    ec2_agent = Agent(
        name="EC2 Agent",
        instructions="""
        You are an EC2 management agent that helps users manage their EC2 instances.
        You can list, start, stop, and create EC2 instances.
        Always confirm operations before performing them, especially destructive ones.
        """,
        tools=[list_ec2_instances, start_ec2_instances, stop_ec2_instances, create_ec2_instance],
        model="gpt-4o"
    )
    
    github_agent = Agent(
        name="GitHub Agent",
        instructions="""
        You are a GitHub management agent that helps users manage their GitHub repositories.
        You can get repository details, list issues, create issues, and list pull requests.
        Always provide clear information about GitHub resources.
        """,
        tools=[get_repository, list_issues, create_issue, list_pull_requests],
        model="gpt-4o"
    )
    
    # Create an orchestrator agent with handoffs to specialized agents
    orchestrator_agent = Agent(
        name="DevOps Orchestrator",
        instructions="""
        You are a DevOps orchestrator that helps users with various DevOps tasks.
        You can delegate tasks to specialized agents for EC2 and GitHub operations.
        Help users understand what operations are available and guide them through the process.
        """,
        handoffs=[
            {
                "agent": ec2_agent,
                "description": "Handles EC2 instance management tasks"
            },
            {
                "agent": github_agent,
                "description": "Handles GitHub repository management tasks"
            }
        ],
        input_guardrails=[security_guardrail],
        output_guardrails=[sensitive_info_guardrail],
        model="gpt-4o"
    )
    
    # Run the orchestrator agent with a user query
    print("Running orchestrator agent...")
    result = await Runner.run(
        orchestrator_agent,
        "I want to list my EC2 instances in us-west-2 and then check for open issues in my example-org/example-repo GitHub repository.",
        context=context
    )
    
    # Print the result
    print("\nFinal output:")
    print(result.final_output)


if __name__ == "__main__":
    asyncio.run(main())