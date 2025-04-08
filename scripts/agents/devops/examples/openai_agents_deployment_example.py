"""
Example implementation of a deployment workflow using OpenAI Agents SDK.

This example demonstrates how to implement a deployment workflow using the OpenAI Agents SDK.
It shows how to create agents for different parts of the workflow and orchestrate them.
"""

import os
import json
import time
from typing import List, Dict, Any, Optional
import boto3
from github import Github
from pydantic import BaseModel, Field

# Import OpenAI Agents SDK
from agents import Agent, Runner, function_tool, Handoff
from agents.tracing import set_tracing_disabled

# Import our EC2 and GitHub examples
from openai_agents_ec2_example import (
    list_ec2_instances, 
    start_ec2_instances,
    EC2InstanceFilter,
    EC2StartStopRequest,
    ec2_agent
)
from openai_agents_github_example import (
    get_repository,
    list_pull_requests,
    GitHubRepoRequest,
    GitHubPRRequest,
    github_agent
)

# Disable tracing for this example
set_tracing_disabled(True)

# Set OpenAI API key from environment variable
if "OPENAI_API_KEY" not in os.environ:
    raise ValueError("OPENAI_API_KEY environment variable is required")

# Define Pydantic models for deployment operations
class DeploymentConfig(BaseModel):
    """Model representing a deployment configuration."""
    repo_owner: str = Field(..., description="The owner of the repository")
    repo_name: str = Field(..., description="The name of the repository")
    branch: str = Field(..., description="The branch to deploy")
    instance_id: str = Field(..., description="The ID of the EC2 instance to deploy to")
    region: str = Field("us-east-1", description="The AWS region of the EC2 instance")
    deploy_script: str = Field("./deploy.sh", description="The deployment script to run")
    environment: str = Field("production", description="The deployment environment")

class DeploymentStatus(BaseModel):
    """Model representing the status of a deployment."""
    status: str = Field(..., description="The status of the deployment (pending, in_progress, success, failed)")
    message: str = Field(..., description="A message describing the deployment status")
    timestamp: str = Field(..., description="The timestamp of the status update")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional details about the deployment")

class DeploymentRequest(BaseModel):
    """Model for requesting a deployment."""
    repo_owner: str = Field(..., description="The owner of the repository")
    repo_name: str = Field(..., description="The name of the repository")
    branch: str = Field(..., description="The branch to deploy")
    instance_id: str = Field(..., description="The ID of the EC2 instance to deploy to")
    region: str = Field("us-east-1", description="The AWS region of the EC2 instance")
    environment: str = Field("production", description="The deployment environment")

# Create deployment function tools
@function_tool()
def check_deployment_prerequisites(request: DeploymentRequest) -> Dict[str, Any]:
    """
    Check if the prerequisites for deployment are met.
    
    Args:
        request: Parameters for the deployment
        
    Returns:
        Result of the prerequisite check
    """
    # Check if GitHub token is set
    github_token = os.environ.get("GITHUB_TOKEN")
    if not github_token:
        return {
            "prerequisites_met": False,
            "message": "GITHUB_TOKEN environment variable is not set"
        }
    
    # Check if AWS credentials are set
    aws_access_key = os.environ.get("AWS_ACCESS_KEY_ID")
    aws_secret_key = os.environ.get("AWS_SECRET_ACCESS_KEY")
    if not aws_access_key or not aws_secret_key:
        return {
            "prerequisites_met": False,
            "message": "AWS credentials are not set"
        }
    
    # Check if repository exists
    try:
        g = Github(github_token)
        repo = g.get_repo(f"{request.repo_owner}/{request.repo_name}")
    except Exception as e:
        return {
            "prerequisites_met": False,
            "message": f"Repository {request.repo_owner}/{request.repo_name} not found: {str(e)}"
        }
    
    # Check if branch exists
    try:
        branch = repo.get_branch(request.branch)
    except Exception as e:
        return {
            "prerequisites_met": False,
            "message": f"Branch {request.branch} not found: {str(e)}"
        }
    
    # Check if instance exists
    try:
        ec2 = boto3.client('ec2', region_name=request.region)
        response = ec2.describe_instances(InstanceIds=[request.instance_id])
        if not response.get('Reservations'):
            return {
                "prerequisites_met": False,
                "message": f"Instance {request.instance_id} not found"
            }
    except Exception as e:
        return {
            "prerequisites_met": False,
            "message": f"Error checking instance {request.instance_id}: {str(e)}"
        }
    
    # All prerequisites met
    return {
        "prerequisites_met": True,
        "message": "All deployment prerequisites are met",
        "details": {
            "repository": f"{request.repo_owner}/{request.repo_name}",
            "branch": request.branch,
            "instance_id": request.instance_id,
            "region": request.region,
            "environment": request.environment
        }
    }

@function_tool()
def start_deployment(request: DeploymentRequest) -> DeploymentStatus:
    """
    Start a deployment process.
    
    Args:
        request: Parameters for the deployment
        
    Returns:
        Status of the deployment
    """
    # Check prerequisites
    prereq_result = check_deployment_prerequisites(request)
    if not prereq_result.get("prerequisites_met"):
        return DeploymentStatus(
            status="failed",
            message=f"Deployment prerequisites not met: {prereq_result.get('message')}",
            timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            details=prereq_result
        )
    
    # In a real implementation, this would start the deployment process
    # For this example, we'll just simulate the deployment
    
    # Start the EC2 instance if it's not running
    try:
        ec2_request = EC2StartStopRequest(
            instance_ids=[request.instance_id],
            region=request.region
        )
        start_result = start_ec2_instances(ec2_request)
        
        # Get the latest status of the instance
        filter_params = EC2InstanceFilter(
            instance_ids=[request.instance_id],
            region=request.region
        )
        instances = list_ec2_instances(filter_params)
        instance_state = instances[0].state if instances else "unknown"
    except Exception as e:
        return DeploymentStatus(
            status="failed",
            message=f"Error starting EC2 instance: {str(e)}",
            timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            details={"error": str(e)}
        )
    
    # Get the latest commit from the branch
    try:
        g = Github(os.environ.get("GITHUB_TOKEN"))
        repo = g.get_repo(f"{request.repo_owner}/{request.repo_name}")
        branch = repo.get_branch(request.branch)
        latest_commit = branch.commit
    except Exception as e:
        return DeploymentStatus(
            status="failed",
            message=f"Error getting latest commit: {str(e)}",
            timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            details={"error": str(e)}
        )
    
    # Return deployment status
    return DeploymentStatus(
        status="in_progress",
        message=f"Deployment started for {request.repo_owner}/{request.repo_name} ({request.branch}) to instance {request.instance_id}",
        timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        details={
            "repository": f"{request.repo_owner}/{request.repo_name}",
            "branch": request.branch,
            "commit": latest_commit.sha,
            "commit_message": latest_commit.commit.message,
            "instance_id": request.instance_id,
            "instance_state": instance_state,
            "region": request.region,
            "environment": request.environment
        }
    )

@function_tool()
def check_deployment_status(request: DeploymentRequest) -> DeploymentStatus:
    """
    Check the status of a deployment.
    
    Args:
        request: Parameters for the deployment
        
    Returns:
        Status of the deployment
    """
    # In a real implementation, this would check the actual status of the deployment
    # For this example, we'll just simulate the status check
    
    # Get the status of the EC2 instance
    try:
        filter_params = EC2InstanceFilter(
            instance_ids=[request.instance_id],
            region=request.region
        )
        instances = list_ec2_instances(filter_params)
        instance_state = instances[0].state if instances else "unknown"
    except Exception as e:
        return DeploymentStatus(
            status="unknown",
            message=f"Error checking EC2 instance status: {str(e)}",
            timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            details={"error": str(e)}
        )
    
    # Simulate deployment status based on instance state
    if instance_state == "running":
        status = "success"
        message = f"Deployment completed successfully to instance {request.instance_id}"
    elif instance_state == "pending":
        status = "in_progress"
        message = f"Deployment in progress, instance {request.instance_id} is starting"
    else:
        status = "failed"
        message = f"Deployment failed, instance {request.instance_id} is in state {instance_state}"
    
    # Return deployment status
    return DeploymentStatus(
        status=status,
        message=message,
        timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        details={
            "repository": f"{request.repo_owner}/{request.repo_name}",
            "branch": request.branch,
            "instance_id": request.instance_id,
            "instance_state": instance_state,
            "region": request.region,
            "environment": request.environment
        }
    )

# Create deployment agent
deployment_agent = Agent(
    name="Deployment Agent",
    instructions="""
    You are a deployment agent that helps users deploy applications from GitHub to AWS EC2 instances.
    You can check deployment prerequisites, start deployments, and check deployment status.
    
    When checking prerequisites, verify that all required information is available and valid.
    When starting a deployment, provide clear information about the deployment process and status.
    When checking deployment status, provide the current status and any relevant details.
    
    Always be cautious about security and cost implications of deployments.
    Warn users about potential issues before starting a deployment.
    """,
    tools=[check_deployment_prerequisites, start_deployment, check_deployment_status],
    handoffs=[
        Handoff(agent=ec2_agent, description="Handles EC2 instance management tasks"),
        Handoff(agent=github_agent, description="Handles GitHub repository management tasks")
    ],
    model="gpt-4o"
)

# Create orchestrator agent
orchestrator_agent = Agent(
    name="DevOps Orchestrator",
    instructions="""
    You are a DevOps orchestrator that helps users with various DevOps tasks.
    You can delegate to specialized agents for specific tasks:
    
    - EC2 Agent: For EC2 instance management tasks
    - GitHub Agent: For GitHub repository management tasks
    - Deployment Agent: For deploying applications from GitHub to AWS EC2 instances
    
    When a user asks about EC2 instances, delegate to the EC2 Agent.
    When a user asks about GitHub repositories, delegate to the GitHub Agent.
    When a user asks about deployments, delegate to the Deployment Agent.
    
    For complex tasks that involve multiple domains, coordinate between the specialized agents.
    Always provide clear explanations and guidance to the user.
    """,
    handoffs=[
        Handoff(agent=ec2_agent, description="Handles EC2 instance management tasks"),
        Handoff(agent=github_agent, description="Handles GitHub repository management tasks"),
        Handoff(agent=deployment_agent, description="Handles deployment tasks")
    ],
    model="gpt-4o"
)

# Example usage
def run_deployment_example():
    """Run an example conversation with the deployment agent."""
    # Define a context object (can be any type)
    context = {}
    
    # Run the agent with a user query
    result = Runner.run_sync(
        orchestrator_agent,
        "I want to deploy my application from GitHub repository 'myorg/myapp' to EC2 instance 'i-1234567890abcdef0'",
        context=context
    )
    
    # Print the result
    print("Agent response:")
    print(result.final_output)
    
    # Print the conversation history
    print("\nConversation history:")
    for message in result.conversation:
        print(f"{message.role}: {message.content}")

if __name__ == "__main__":
    run_deployment_example()