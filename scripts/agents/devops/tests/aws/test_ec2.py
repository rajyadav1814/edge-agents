"""
Unit tests for the EC2 service module.

These tests use the moto library to mock AWS services and test the EC2Service class
without making actual AWS API calls.
"""

import os
import pytest
import boto3
import json
from moto import mock_aws

from src.aws.ec2 import EC2Service
from src.core.credentials import AWSCredentials
from src.aws.base import ResourceNotFoundError

# Set mock AWS credentials for testing
os.environ['AWS_ACCESS_KEY_ID'] = 'testing'
os.environ['AWS_SECRET_ACCESS_KEY'] = 'testing'
os.environ['AWS_SECURITY_TOKEN'] = 'testing'
os.environ['AWS_SESSION_TOKEN'] = 'testing'
os.environ['AWS_DEFAULT_REGION'] = 'us-east-1'

# Test data
TEST_AMI_ID = 'ami-12345678'
TEST_INSTANCE_TYPE = 't2.micro'
TEST_KEY_NAME = 'test-key'
TEST_SECURITY_GROUP_NAME = 'test-sg'


@pytest.fixture
def aws_credentials():
    """Create a test AWS credentials object."""
    return AWSCredentials(
        access_key_id='testing',
        secret_access_key='testing',
        session_token='testing',
        region='us-east-1'
    )


@pytest.fixture
def ec2_service(aws_credentials):
    """Create a test EC2 service with mock credentials."""
    return EC2Service(credentials=aws_credentials, skip_verification=True)


@mock_aws
def test_list_instances_empty(ec2_service):
    """Test listing instances when none exist."""
    instances = ec2_service.list_instances()
    assert instances == []


@mock_aws
def test_create_and_list_instance(ec2_service):
    """Test creating and then listing an EC2 instance."""
    # Create a mock EC2 client to set up test data
    ec2_client = boto3.client('ec2', region_name='us-east-1')
    
    # Create a test security group
    sg_response = ec2_client.create_security_group(
        GroupName=TEST_SECURITY_GROUP_NAME,
        Description='Test security group'
    )
    sg_id = sg_response['GroupId']
    
    # Create a test key pair
    ec2_client.create_key_pair(KeyName=TEST_KEY_NAME)
    
    # Create a test AMI
    image_response = ec2_client.register_image(
        Name='test-ami',
        RootDeviceName='/dev/sda1',
        BlockDeviceMappings=[
            {
                'DeviceName': '/dev/sda1',
                'Ebs': {'VolumeSize': 8}
            }
        ]
    )
    ami_id = image_response['ImageId']
    
    # Create an instance using our service
    instance = ec2_service.create_instance(
        name='test-instance',
        instance_type=TEST_INSTANCE_TYPE,
        ami_id=ami_id,
        security_group_ids=[sg_id],
        key_name=TEST_KEY_NAME
    )
    
    # Verify instance was created
    assert instance is not None
    assert 'InstanceId' in instance
    instance_id = instance['InstanceId']
    
    # List instances and verify our instance is there
    instances = ec2_service.list_instances()
    assert len(instances) == 1
    assert instances[0]['InstanceId'] == instance_id
    
    # Get the specific instance and verify details
    fetched_instance = ec2_service.get_instance(instance_id)
    assert fetched_instance['InstanceId'] == instance_id
    assert fetched_instance['InstanceType'] == TEST_INSTANCE_TYPE
    
    # Test instance not found
    with pytest.raises(ResourceNotFoundError):
        ec2_service.get_instance('i-nonexistent')


@mock_aws
def test_instance_lifecycle(ec2_service):
    """Test the full lifecycle of an EC2 instance: create, start, stop, terminate."""
    # Create a mock EC2 client to set up test data
    ec2_client = boto3.client('ec2', region_name='us-east-1')
    
    # Create a test AMI
    image_response = ec2_client.register_image(
        Name='test-ami',
        RootDeviceName='/dev/sda1',
        BlockDeviceMappings=[
            {
                'DeviceName': '/dev/sda1',
                'Ebs': {'VolumeSize': 8}
            }
        ]
    )
    ami_id = image_response['ImageId']
    
    # Create an instance
    instance = ec2_service.create_instance(
        name='lifecycle-test',
        instance_type=TEST_INSTANCE_TYPE,
        ami_id=ami_id
    )
    instance_id = instance['InstanceId']
    
    # Verify initial state
    assert instance['State']['Name'] == 'running'
    
    # Stop the instance
    stopped_instance = ec2_service.stop_instance(instance_id)
    assert stopped_instance['State']['Name'] == 'stopped'
    
    # Start the instance
    started_instance = ec2_service.start_instance(instance_id)
    assert started_instance['State']['Name'] == 'running'
    
    # Terminate the instance
    terminated_instance = ec2_service.terminate_instance(instance_id)
    assert terminated_instance['State']['Name'] == 'terminated'


@mock_aws
def test_security_group_operations(ec2_service):
    """Test creating, listing, and deleting a security group."""
    # Create a security group
    sg = ec2_service.create_security_group(
        name='test-security-group',
        description='Test security group for unit tests',
        ingress_rules=[
            {
                'IpProtocol': 'tcp',
                'FromPort': 22,
                'ToPort': 22,
                'IpRanges': [{'CidrIp': '0.0.0.0/0'}]
            }
        ]
    )
    
    # Verify security group was created
    assert sg is not None
    assert 'GroupId' in sg
    sg_id = sg['GroupId']
    
    # List security groups and verify ours is there
    security_groups = ec2_service.list_security_groups()
    assert len(security_groups) >= 1
    assert any(sg['GroupId'] == sg_id for sg in security_groups)
    
    # Get the specific security group and verify details
    fetched_sg = ec2_service.get_security_group(sg_id)
    assert fetched_sg['GroupId'] == sg_id
    assert fetched_sg['GroupName'] == 'test-security-group'
    
    # Delete the security group
    ec2_service.delete_security_group(sg_id)
    
    # Verify deletion by attempting to fetch (should raise exception)
    with pytest.raises(ResourceNotFoundError):
        ec2_service.get_security_group(sg_id)


@mock_aws
def test_key_pair_operations(ec2_service):
    """Test creating, listing, and deleting a key pair."""
    # Create a key pair
    key_pair = ec2_service.create_key_pair(key_name='test-key-pair')
    
    # Verify key pair was created
    assert key_pair is not None
    assert 'KeyName' in key_pair
    assert key_pair['KeyName'] == 'test-key-pair'
    assert 'KeyMaterial' in key_pair  # Private key material
    
    # List key pairs and verify ours is there
    key_pairs = ec2_service.list_key_pairs()
    assert len(key_pairs) >= 1
    assert any(kp['KeyName'] == 'test-key-pair' for kp in key_pairs)
    
    # Get the specific key pair and verify details
    fetched_kp = ec2_service.get_key_pair('test-key-pair')
    assert fetched_kp['KeyName'] == 'test-key-pair'
    
    # Delete the key pair
    ec2_service.delete_key_pair('test-key-pair')
    
    # Verify deletion by attempting to fetch (should raise exception)
    with pytest.raises(ResourceNotFoundError):
        ec2_service.get_key_pair('test-key-pair')


# Note: GitHub integration tests would typically use mocks for the GitHub API
# and would be placed in a separate test file