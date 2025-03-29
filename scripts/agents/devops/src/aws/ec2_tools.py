"""
EC2 Tools Module - Provides function tools for EC2 operations with OpenAI Agents SDK.

This module implements function tools for listing, starting, stopping, and creating
EC2 instances, designed to be used with the OpenAI Agents SDK.
"""

import boto3
import logging
from typing import Dict, List, Any, Optional

from agents import function_tool
from agents.types import RunContext

from .ec2_models import (
    EC2InstanceFilter,
    EC2StartStopRequest,
    EC2CreateRequest,
    EC2Instance
)
from ..core.context import DevOpsContext

# Configure logging
logger = logging.getLogger(__name__)


@function_tool()
async def list_ec2_instances(
    ctx: RunContext[DevOpsContext],
    filter_params: EC2InstanceFilter
) -> List[EC2Instance]:
    """
    List EC2 instances with optional filtering.
    
    Args:
        ctx: Run context containing DevOpsContext
        filter_params: Parameters for filtering EC2 instances
        
    Returns:
        List of EC2Instance objects matching the filter criteria
    """
    logger.info(f"Listing EC2 instances in region {filter_params.region}")
    
    # Create EC2 client
    ec2_client = boto3.client("ec2", region_name=filter_params.region)
    
    # Prepare filters
    kwargs = {}
    
    # Add instance IDs if provided
    if filter_params.instance_ids:
        kwargs['InstanceIds'] = filter_params.instance_ids
    
    # Add other filters
    aws_filters = filter_params.to_aws_filters()
    if aws_filters:
        kwargs['Filters'] = aws_filters
    
    # Call AWS API
    response = ec2_client.describe_instances(**kwargs)
    
    # Process response
    instances = []
    for reservation in response.get('Reservations', []):
        for instance_data in reservation.get('Instances', []):
            instance = EC2Instance.from_aws_instance(instance_data)
            instances.append(instance)
    
    logger.info(f"Found {len(instances)} EC2 instances")
    return instances


@function_tool()
async def start_ec2_instances(
    ctx: RunContext[DevOpsContext],
    request: EC2StartStopRequest
) -> Dict[str, Any]:
    """
    Start one or more EC2 instances.
    
    Args:
        ctx: Run context containing DevOpsContext
        request: Parameters for starting EC2 instances
        
    Returns:
        AWS API response for the start operation
    """
    logger.info(f"Starting EC2 instances: {request.instance_ids}")
    
    # Create EC2 client
    ec2_client = boto3.client("ec2", region_name=request.region)
    
    # Call AWS API
    response = ec2_client.start_instances(InstanceIds=request.instance_ids)
    
    logger.info(f"Started EC2 instances: {request.instance_ids}")
    return response


@function_tool()
async def stop_ec2_instances(
    ctx: RunContext[DevOpsContext],
    request: EC2StartStopRequest
) -> Dict[str, Any]:
    """
    Stop one or more EC2 instances.
    
    Args:
        ctx: Run context containing DevOpsContext
        request: Parameters for stopping EC2 instances
        
    Returns:
        AWS API response for the stop operation
    """
    logger.info(f"Stopping EC2 instances: {request.instance_ids}")
    
    # Create EC2 client
    ec2_client = boto3.client("ec2", region_name=request.region)
    
    # Call AWS API
    response = ec2_client.stop_instances(
        InstanceIds=request.instance_ids,
        Force=request.force
    )
    
    logger.info(f"Stopped EC2 instances: {request.instance_ids}")
    return response


@function_tool()
async def create_ec2_instance(
    ctx: RunContext[DevOpsContext],
    request: EC2CreateRequest
) -> Dict[str, Any]:
    """
    Create a new EC2 instance.
    
    Args:
        ctx: Run context containing DevOpsContext
        request: Parameters for creating an EC2 instance
        
    Returns:
        AWS API response for the create operation
    """
    logger.info(f"Creating EC2 instance of type {request.instance_type} in region {request.region}")
    
    # Create EC2 client
    ec2_client = boto3.client("ec2", region_name=request.region)
    
    # Prepare run_instances parameters
    run_args = {
        'ImageId': request.image_id,
        'InstanceType': request.instance_type,
        'MinCount': 1,
        'MaxCount': 1
    }
    
    # Add optional parameters if provided
    if request.key_name:
        run_args['KeyName'] = request.key_name
        
    if request.security_group_ids:
        run_args['SecurityGroupIds'] = request.security_group_ids
        
    if request.subnet_id:
        run_args['SubnetId'] = request.subnet_id
        
    if request.user_data:
        run_args['UserData'] = request.user_data
        
    if request.iam_instance_profile:
        run_args['IamInstanceProfile'] = {
            'Name': request.iam_instance_profile
        }
        
    if request.ebs_optimized:
        run_args['EbsOptimized'] = request.ebs_optimized
        
    if request.instance_initiated_shutdown_behavior:
        run_args['InstanceInitiatedShutdownBehavior'] = request.instance_initiated_shutdown_behavior
    
    # Add tags if provided
    if request.tags:
        tag_specs = [{
            'ResourceType': 'instance',
            'Tags': [{'Key': k, 'Value': v} for k, v in request.tags.items()]
        }]
        run_args['TagSpecifications'] = tag_specs
    
    # Call AWS API
    response = ec2_client.run_instances(**run_args)
    
    logger.info(f"Created EC2 instance: {response['Instances'][0]['InstanceId']}")
    return response