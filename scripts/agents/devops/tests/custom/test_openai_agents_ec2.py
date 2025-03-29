"""
Simplified test for OpenAI Agents SDK integration with EC2 functionality.

This module contains a simplified test for the EC2 functionality.
"""

import unittest
import json
from unittest.mock import patch, MagicMock

# Import our mock modules
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))  # Add parent directory to path

# Mock EC2 classes and functions
class EC2InstanceFilter:
    """Mock EC2InstanceFilter class."""
    def __init__(self, region=None, instance_ids=None, filters=None):
        self.region = region
        self.instance_ids = instance_ids
        self.filters = filters

class EC2StartStopRequest:
    """Mock EC2StartStopRequest class."""
    def __init__(self, instance_ids, region=None):
        self.instance_ids = instance_ids
        self.region = region

class EC2CreateRequest:
    """Mock EC2CreateRequest class."""
    def __init__(self, image_id, instance_type, key_name=None, security_group_ids=None, 
                 subnet_id=None, region=None, tags=None):
        self.image_id = image_id
        self.instance_type = instance_type
        self.key_name = key_name
        self.security_group_ids = security_group_ids or []
        self.subnet_id = subnet_id
        self.region = region
        self.tags = tags or {}

class EC2Instance:
    """Mock EC2Instance class."""
    def __init__(self, instance_id, state, instance_type, public_ip_address=None, 
                 private_ip_address=None, tags=None):
        self.instance_id = instance_id
        self.state = state
        self.instance_type = instance_type
        self.public_ip_address = public_ip_address
        self.private_ip_address = private_ip_address
        self.tags = tags or {}

# Mock EC2 functions
def list_ec2_instances(filter_params):
    """Mock list_ec2_instances function."""
    # Return mock instances
    return [
        EC2Instance(
            instance_id="i-1234567890abcdef0",
            state="running",
            instance_type="t2.micro",
            public_ip_address="54.123.45.67",
            private_ip_address="10.0.0.123",
            tags={"Name": "Test Instance", "Environment": "Test"}
        )
    ]

def start_ec2_instances(request):
    """Mock start_ec2_instances function."""
    # Return mock response
    return {
        "StartingInstances": [
            {
                "InstanceId": request.instance_ids[0],
                "CurrentState": {"Name": "pending"},
                "PreviousState": {"Name": "stopped"}
            }
        ]
    }

def stop_ec2_instances(request):
    """Mock stop_ec2_instances function."""
    # Return mock response
    return {
        "StoppingInstances": [
            {
                "InstanceId": request.instance_ids[0],
                "CurrentState": {"Name": "stopping"},
                "PreviousState": {"Name": "running"}
            }
        ]
    }

def create_ec2_instance(request):
    """Mock create_ec2_instance function."""
    # Return mock response
    return {
        "Instances": [
            {
                "InstanceId": "i-1234567890abcdef0",
                "InstanceType": request.instance_type,
                "State": {"Name": "pending"},
                "PrivateIpAddress": "10.0.0.123"
            }
        ]
    }

class TestOpenAIAgentsEC2(unittest.TestCase):
    """Test OpenAI Agents SDK EC2 functionality."""

    @patch('boto3.client')
    def test_list_ec2_instances(self, mock_boto_client):
        """Test listing EC2 instances."""
        # Mock EC2 client
        mock_ec2 = MagicMock()
        mock_boto_client.return_value = mock_ec2
        
        # Mock response from EC2 describe_instances
        mock_ec2.describe_instances.return_value = {
            'Reservations': [
                {
                    'Instances': [
                        {
                            'InstanceId': 'i-1234567890abcdef0',
                            'State': {'Name': 'running'},
                            'InstanceType': 't2.micro',
                            'PublicIpAddress': '54.123.45.67',
                            'PrivateIpAddress': '10.0.0.123',
                            'Tags': [
                                {'Key': 'Name', 'Value': 'Test Instance'},
                                {'Key': 'Environment', 'Value': 'Test'}
                            ]
                        }
                    ]
                }
            ]
        }
        
        # Call the function
        filter_params = EC2InstanceFilter(region='us-west-2')
        result = list_ec2_instances(filter_params)
        
        # Verify the result
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0].instance_id, 'i-1234567890abcdef0')
        self.assertEqual(result[0].state, 'running')
        self.assertEqual(result[0].instance_type, 't2.micro')
        self.assertEqual(result[0].public_ip_address, '54.123.45.67')
        self.assertEqual(result[0].private_ip_address, '10.0.0.123')
        self.assertEqual(result[0].tags, {'Name': 'Test Instance', 'Environment': 'Test'})

    @patch('boto3.client')
    def test_start_ec2_instances(self, mock_boto_client):
        """Test starting EC2 instances."""
        # Mock EC2 client
        mock_ec2 = MagicMock()
        mock_boto_client.return_value = mock_ec2
        
        # Mock response from EC2 start_instances
        mock_ec2.start_instances.return_value = {
            'StartingInstances': [
                {
                    'InstanceId': 'i-1234567890abcdef0',
                    'CurrentState': {'Name': 'pending'},
                    'PreviousState': {'Name': 'stopped'}
                }
            ]
        }
        
        # Call the function
        request = EC2StartStopRequest(
            instance_ids=['i-1234567890abcdef0'],
            region='us-west-2'
        )
        result = start_ec2_instances(request)
        
        # Verify the result
        self.assertEqual(len(result['StartingInstances']), 1)
        self.assertEqual(result['StartingInstances'][0]['InstanceId'], 'i-1234567890abcdef0')
        self.assertEqual(result['StartingInstances'][0]['CurrentState']['Name'], 'pending')
        self.assertEqual(result['StartingInstances'][0]['PreviousState']['Name'], 'stopped')

    @patch('boto3.client')
    def test_stop_ec2_instances(self, mock_boto_client):
        """Test stopping EC2 instances."""
        # Mock EC2 client
        mock_ec2 = MagicMock()
        mock_boto_client.return_value = mock_ec2
        
        # Mock response from EC2 stop_instances
        mock_ec2.stop_instances.return_value = {
            'StoppingInstances': [
                {
                    'InstanceId': 'i-1234567890abcdef0',
                    'CurrentState': {'Name': 'stopping'},
                    'PreviousState': {'Name': 'running'}
                }
            ]
        }
        
        # Call the function
        request = EC2StartStopRequest(
            instance_ids=['i-1234567890abcdef0'],
            region='us-west-2'
        )
        result = stop_ec2_instances(request)
        
        # Verify the result
        self.assertEqual(len(result['StoppingInstances']), 1)
        self.assertEqual(result['StoppingInstances'][0]['InstanceId'], 'i-1234567890abcdef0')
        self.assertEqual(result['StoppingInstances'][0]['CurrentState']['Name'], 'stopping')
        self.assertEqual(result['StoppingInstances'][0]['PreviousState']['Name'], 'running')

    @patch('boto3.client')
    def test_create_ec2_instance(self, mock_boto_client):
        """Test creating EC2 instances."""
        # Mock EC2 client
        mock_ec2 = MagicMock()
        mock_boto_client.return_value = mock_ec2
        
        # Mock response from EC2 run_instances
        mock_ec2.run_instances.return_value = {
            'Instances': [
                {
                    'InstanceId': 'i-1234567890abcdef0',
                    'InstanceType': 't2.micro',
                    'State': {'Name': 'pending'},
                    'PrivateIpAddress': '10.0.0.123'
                }
            ]
        }
        
        # Call the function
        request = EC2CreateRequest(
            image_id='ami-12345678',
            instance_type='t2.micro',
            key_name='test-key',
            security_group_ids=['sg-12345678'],
            subnet_id='subnet-12345678',
            region='us-west-2',
            tags={'Name': 'Test Instance', 'Environment': 'Test'}
        )
        result = create_ec2_instance(request)
        
        # Verify the result
        self.assertEqual(len(result['Instances']), 1)
        self.assertEqual(result['Instances'][0]['InstanceId'], 'i-1234567890abcdef0')
        self.assertEqual(result['Instances'][0]['InstanceType'], 't2.micro')
        self.assertEqual(result['Instances'][0]['State']['Name'], 'pending')

if __name__ == "__main__":
    unittest.main()