"""
AWS Package - Provides functionality for AWS service operations.

This package includes modules for EC2, S3, and other AWS services,
with integration for the OpenAI Agents SDK.
"""

from .ec2_models import (
    EC2InstanceFilter,
    EC2StartStopRequest,
    EC2CreateRequest,
    EC2Instance
)

from .ec2_tools import (
    list_ec2_instances,
    start_ec2_instances,
    stop_ec2_instances,
    create_ec2_instance
)

__all__ = [
    # EC2 Models
    'EC2InstanceFilter',
    'EC2StartStopRequest',
    'EC2CreateRequest',
    'EC2Instance',
    
    # EC2 Tools
    'list_ec2_instances',
    'start_ec2_instances',
    'stop_ec2_instances',
    'create_ec2_instance'
]