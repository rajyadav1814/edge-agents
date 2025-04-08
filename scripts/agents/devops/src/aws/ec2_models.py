"""
EC2 Models Module - Provides data models for EC2 operations.

This module defines Pydantic models for EC2 instance filtering, start/stop requests,
creation requests, and instance representation for use with the OpenAI Agents SDK.
"""

from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


class EC2InstanceFilter(BaseModel):
    """
    Filter parameters for listing EC2 instances.
    """
    
    region: str = Field(
        description="AWS region to filter instances by"
    )
    
    instance_ids: Optional[List[str]] = Field(
        default=None,
        description="List of specific instance IDs to filter by"
    )
    
    state: Optional[str] = Field(
        default=None,
        description="Instance state to filter by (e.g., 'running', 'stopped')"
    )
    
    instance_type: Optional[str] = Field(
        default=None,
        description="Instance type to filter by (e.g., 't2.micro')"
    )
    
    tags: Optional[Dict[str, str]] = Field(
        default=None,
        description="Tags to filter instances by (key-value pairs)"
    )
    
    def to_aws_filters(self) -> List[Dict[str, Any]]:
        """
        Convert the filter to AWS API format.
        
        Returns:
            List of AWS filter dictionaries
        """
        filters = []
        
        if self.state:
            filters.append({
                'Name': 'instance-state-name',
                'Values': [self.state]
            })
            
        if self.instance_type:
            filters.append({
                'Name': 'instance-type',
                'Values': [self.instance_type]
            })
            
        if self.tags:
            for key, value in self.tags.items():
                filters.append({
                    'Name': f'tag:{key}',
                    'Values': [value]
                })
                
        return filters


class EC2StartStopRequest(BaseModel):
    """
    Request model for starting or stopping EC2 instances.
    """
    
    instance_ids: List[str] = Field(
        description="List of instance IDs to start or stop"
    )
    
    region: str = Field(
        description="AWS region where the instances are located"
    )
    
    force: bool = Field(
        default=False,
        description="Whether to force stop the instances (only applicable for stopping)"
    )


class EC2CreateRequest(BaseModel):
    """
    Request model for creating a new EC2 instance.
    """
    
    image_id: str = Field(
        description="AMI ID to use for the instance"
    )
    
    instance_type: str = Field(
        description="Instance type (e.g., 't2.micro')"
    )
    
    region: str = Field(
        description="AWS region to create the instance in"
    )
    
    key_name: Optional[str] = Field(
        default=None,
        description="Name of the key pair to use for SSH access"
    )
    
    security_group_ids: Optional[List[str]] = Field(
        default=None,
        description="List of security group IDs to associate with the instance"
    )
    
    subnet_id: Optional[str] = Field(
        default=None,
        description="ID of the subnet to launch the instance in"
    )
    
    user_data: Optional[str] = Field(
        default=None,
        description="User data script to run on instance launch"
    )
    
    tags: Optional[Dict[str, str]] = Field(
        default=None,
        description="Tags to apply to the instance (key-value pairs)"
    )
    
    iam_instance_profile: Optional[str] = Field(
        default=None,
        description="IAM instance profile name or ARN"
    )
    
    ebs_optimized: bool = Field(
        default=False,
        description="Whether the instance is EBS optimized"
    )
    
    instance_initiated_shutdown_behavior: Optional[str] = Field(
        default=None,
        description="Instance behavior on shutdown ('stop' or 'terminate')"
    )


class EC2Instance(BaseModel):
    """
    Model representing an EC2 instance.
    """
    
    instance_id: str = Field(
        description="Unique identifier for the EC2 instance"
    )
    
    state: str = Field(
        description="Current state of the instance (e.g., 'running', 'stopped')"
    )
    
    instance_type: str = Field(
        description="Type of the instance (e.g., 't2.micro')"
    )
    
    public_ip_address: Optional[str] = Field(
        default=None,
        description="Public IP address of the instance"
    )
    
    private_ip_address: Optional[str] = Field(
        default=None,
        description="Private IP address of the instance"
    )
    
    tags: Dict[str, str] = Field(
        default_factory=dict,
        description="Tags associated with the instance (key-value pairs)"
    )
    
    launch_time: Optional[str] = Field(
        default=None,
        description="Time when the instance was launched"
    )
    
    availability_zone: Optional[str] = Field(
        default=None,
        description="Availability zone where the instance is located"
    )
    
    vpc_id: Optional[str] = Field(
        default=None,
        description="ID of the VPC where the instance is located"
    )
    
    subnet_id: Optional[str] = Field(
        default=None,
        description="ID of the subnet where the instance is located"
    )
    
    security_groups: Optional[List[Dict[str, str]]] = Field(
        default=None,
        description="Security groups associated with the instance"
    )
    
    @classmethod
    def from_aws_instance(cls, instance: Dict[str, Any]) -> 'EC2Instance':
        """
        Create an EC2Instance from AWS API response.
        
        Args:
            instance: AWS EC2 instance dictionary
            
        Returns:
            EC2Instance model
        """
        # Extract tags
        tags = {}
        for tag in instance.get('Tags', []):
            tags[tag.get('Key')] = tag.get('Value')
            
        # Create instance
        return cls(
            instance_id=instance.get('InstanceId'),
            state=instance.get('State', {}).get('Name'),
            instance_type=instance.get('InstanceType'),
            public_ip_address=instance.get('PublicIpAddress'),
            private_ip_address=instance.get('PrivateIpAddress'),
            tags=tags,
            launch_time=instance.get('LaunchTime').isoformat() if instance.get('LaunchTime') else None,
            availability_zone=instance.get('Placement', {}).get('AvailabilityZone'),
            vpc_id=instance.get('VpcId'),
            subnet_id=instance.get('SubnetId'),
            security_groups=[
                {'id': sg.get('GroupId'), 'name': sg.get('GroupName')}
                for sg in instance.get('SecurityGroups', [])
            ]
        )