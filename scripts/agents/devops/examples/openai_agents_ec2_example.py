"""
Example implementation of EC2 operations using OpenAI Agents SDK.

This example demonstrates how to implement EC2 operations using the OpenAI Agents SDK.
It shows how to create function tools for EC2 operations and use them with an agent.
"""

import os
import json
from typing import List, Dict, Any, Optional
import boto3
from pydantic import BaseModel, Field

# Import OpenAI Agents SDK
from agents import Agent, Runner, function_tool
from agents.tracing import set_tracing_disabled

# Disable tracing for this example
set_tracing_disabled(True)

# Set OpenAI API key from environment variable
if "OPENAI_API_KEY" not in os.environ:
    raise ValueError("OPENAI_API_KEY environment variable is required")

# Define Pydantic models for EC2 operations
class EC2Instance(BaseModel):
    """Model representing an EC2 instance."""
    instance_id: str = Field(..., description="The ID of the EC2 instance")
    state: str = Field(..., description="The current state of the instance")
    instance_type: str = Field(..., description="The type of the instance")
    public_ip_address: Optional[str] = Field(None, description="The public IP address of the instance")
    private_ip_address: Optional[str] = Field(None, description="The private IP address of the instance")
    tags: Dict[str, str] = Field(default_factory=dict, description="Tags associated with the instance")

class EC2InstanceFilter(BaseModel):
    """Model for filtering EC2 instances."""
    instance_ids: Optional[List[str]] = Field(None, description="List of instance IDs to filter by")
    filters: Optional[List[Dict[str, Any]]] = Field(None, description="AWS filters to apply")
    region: str = Field("us-east-1", description="AWS region to query")

class EC2StartStopRequest(BaseModel):
    """Model for starting or stopping EC2 instances."""
    instance_ids: List[str] = Field(..., description="List of instance IDs to start or stop")
    region: str = Field("us-east-1", description="AWS region where the instances are located")

class EC2CreateRequest(BaseModel):
    """Model for creating an EC2 instance."""
    image_id: str = Field(..., description="The ID of the AMI to use")
    instance_type: str = Field(..., description="The type of instance to launch")
    key_name: Optional[str] = Field(None, description="The name of the key pair to use")
    security_group_ids: Optional[List[str]] = Field(None, description="The IDs of the security groups")
    subnet_id: Optional[str] = Field(None, description="The ID of the subnet to launch the instance into")
    region: str = Field("us-east-1", description="AWS region to create the instance in")
    tags: Optional[Dict[str, str]] = Field(None, description="Tags to apply to the instance")

# Create EC2 function tools
@function_tool()
def list_ec2_instances(filter_params: EC2InstanceFilter) -> List[EC2Instance]:
    """
    List EC2 instances based on the provided filters.
    
    Args:
        filter_params: Parameters for filtering EC2 instances
        
    Returns:
        List of EC2 instances matching the filters
    """
    # Create EC2 client
    ec2 = boto3.client('ec2', region_name=filter_params.region)
    
    # Prepare parameters for describe_instances
    params = {}
    if filter_params.instance_ids:
        params['InstanceIds'] = filter_params.instance_ids
    if filter_params.filters:
        params['Filters'] = filter_params.filters
    
    # Call describe_instances
    response = ec2.describe_instances(**params)
    
    # Process response
    instances = []
    for reservation in response.get('Reservations', []):
        for instance in reservation.get('Instances', []):
            # Extract tags
            tags = {}
            for tag in instance.get('Tags', []):
                tags[tag.get('Key')] = tag.get('Value')
            
            # Create EC2Instance object
            instances.append(EC2Instance(
                instance_id=instance.get('InstanceId'),
                state=instance.get('State', {}).get('Name', 'unknown'),
                instance_type=instance.get('InstanceType'),
                public_ip_address=instance.get('PublicIpAddress'),
                private_ip_address=instance.get('PrivateIpAddress'),
                tags=tags
            ))
    
    return instances

@function_tool()
def start_ec2_instances(request: EC2StartStopRequest) -> Dict[str, Any]:
    """
    Start EC2 instances.
    
    Args:
        request: Parameters for starting EC2 instances
        
    Returns:
        Result of the start operation
    """
    # Create EC2 client
    ec2 = boto3.client('ec2', region_name=request.region)
    
    # Start instances
    response = ec2.start_instances(InstanceIds=request.instance_ids)
    
    # Process response
    result = {
        "StartingInstances": [
            {
                "InstanceId": instance.get('InstanceId'),
                "CurrentState": instance.get('CurrentState', {}).get('Name'),
                "PreviousState": instance.get('PreviousState', {}).get('Name')
            }
            for instance in response.get('StartingInstances', [])
        ]
    }
    
    return result

@function_tool()
def stop_ec2_instances(request: EC2StartStopRequest) -> Dict[str, Any]:
    """
    Stop EC2 instances.
    
    Args:
        request: Parameters for stopping EC2 instances
        
    Returns:
        Result of the stop operation
    """
    # Create EC2 client
    ec2 = boto3.client('ec2', region_name=request.region)
    
    # Stop instances
    response = ec2.stop_instances(InstanceIds=request.instance_ids)
    
    # Process response
    result = {
        "StoppingInstances": [
            {
                "InstanceId": instance.get('InstanceId'),
                "CurrentState": instance.get('CurrentState', {}).get('Name'),
                "PreviousState": instance.get('PreviousState', {}).get('Name')
            }
            for instance in response.get('StoppingInstances', [])
        ]
    }
    
    return result

@function_tool()
def create_ec2_instance(request: EC2CreateRequest) -> Dict[str, Any]:
    """
    Create a new EC2 instance.
    
    Args:
        request: Parameters for creating an EC2 instance
        
    Returns:
        Result of the create operation
    """
    # Create EC2 client
    ec2 = boto3.client('ec2', region_name=request.region)
    
    # Prepare parameters for run_instances
    params = {
        'ImageId': request.image_id,
        'InstanceType': request.instance_type,
        'MinCount': 1,
        'MaxCount': 1
    }
    
    # Add optional parameters
    if request.key_name:
        params['KeyName'] = request.key_name
    if request.security_group_ids:
        params['SecurityGroupIds'] = request.security_group_ids
    if request.subnet_id:
        params['SubnetId'] = request.subnet_id
    
    # Add tags if provided
    if request.tags:
        params['TagSpecifications'] = [
            {
                'ResourceType': 'instance',
                'Tags': [{'Key': k, 'Value': v} for k, v in request.tags.items()]
            }
        ]
    
    # Create instance
    response = ec2.run_instances(**params)
    
    # Process response
    instances = []
    for instance in response.get('Instances', []):
        instances.append({
            'InstanceId': instance.get('InstanceId'),
            'InstanceType': instance.get('InstanceType'),
            'State': instance.get('State', {}).get('Name'),
            'PrivateIpAddress': instance.get('PrivateIpAddress'),
            'PublicIpAddress': instance.get('PublicIpAddress')
        })
    
    return {'Instances': instances}

# Create EC2 agent
ec2_agent = Agent(
    name="EC2 Agent",
    instructions="""
    You are an EC2 management agent that helps users manage their EC2 instances.
    You can list, start, stop, and create EC2 instances.
    
    When listing instances, provide a clear summary of each instance including its ID, state, type, and IP addresses.
    When starting or stopping instances, confirm the action and report the result.
    When creating instances, guide the user through the required parameters and confirm the creation.
    
    Always be cautious about security and cost implications of EC2 operations.
    Warn users about potential costs when creating new instances.
    """,
    tools=[list_ec2_instances, start_ec2_instances, stop_ec2_instances, create_ec2_instance],
    model="gpt-4o"
)

# Example usage
def run_ec2_agent_example():
    """Run an example conversation with the EC2 agent."""
    # Define a context object (can be any type)
    context = {}
    
    # Run the agent with a user query
    result = Runner.run_sync(
        ec2_agent,
        "List all my EC2 instances in us-west-2 region",
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
    run_ec2_agent_example()