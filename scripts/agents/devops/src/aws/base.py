"""
Base AWS Service - Provides common functionality for all AWS service modules.

This module defines the base class that all AWS service implementations will inherit from,
providing consistent handling of credentials, sessions, clients, and error management.
"""

import os
import logging
import json
from typing import Dict, Any, Optional, List, Tuple, Union, Callable
import boto3
from botocore.exceptions import ClientError, NoCredentialsError

from ..core.credentials import AWSCredentials, get_credential_manager
from ..core.config import get_config

# Configure logging
logger = logging.getLogger(__name__)


class AWSServiceError(Exception):
    """Base exception for AWS service errors."""
    
    def __init__(self, message: str, suggestion: Optional[str] = None):
        """
        Initialize the AWS service error.
        
        Args:
            message: Error message
            suggestion: Optional suggestion for resolving the error
        """
        self.message = message
        self.suggestion = suggestion
        super().__init__(message)
    
    def __str__(self) -> str:
        return self.message


class ResourceNotFoundError(AWSServiceError):
    """Exception raised when a requested resource is not found."""
    
    def __init__(self, message: str, resource_type: Optional[str] = None, resource_id: Optional[str] = None):
        """
        Initialize the resource not found error.
        
        Args:
            message: Error message
            resource_type: Type of resource that was not found
            resource_id: ID of the resource that was not found
        """
        suggestion = None
        if resource_type and resource_id:
            suggestion = f"Check if the {resource_type} '{resource_id}' exists and you have permission to access it."
        elif resource_type:
            suggestion = f"Check if the {resource_type} exists and you have permission to access it."
        
        super().__init__(message, suggestion)
        self.resource_type = resource_type
        self.resource_id = resource_id


class PermissionDeniedError(AWSServiceError):
    """Exception raised when permissions are insufficient for an operation."""
    
    def __init__(self, message: str):
        suggestion = "Check your IAM permissions and ensure your credentials have the necessary access rights."
        super().__init__(message, suggestion)


class ValidationError(AWSServiceError):
    """Exception raised when input validation fails."""
    
    def __init__(self, message: str):
        super().__init__(message, "Check the input parameters and ensure they meet the requirements.")


class RateLimitError(AWSServiceError):
    """Exception raised when AWS API rate limits are exceeded."""
    
    def __init__(self, message: str, wait_time: Optional[int] = None):
        suggestion = f"Wait for {wait_time} seconds before retrying." if wait_time else "Reduce the frequency of API calls or implement exponential backoff."
        super().__init__(message, suggestion)


class ResourceLimitError(AWSServiceError):
    """Exception raised when AWS resource limits are exceeded."""
    
    def __init__(self, message: str):
        super().__init__(message, "Request a limit increase from AWS or delete unused resources.")


class AWSBaseService:
    """
    Base class for AWS services that provides common functionality.
    
    This class handles session and client management, credential validation,
    resource tagging, pagination, error handling, and other common AWS operations.
    """
    
    # AWS service name (to be overridden by subclasses)
    SERVICE_NAME = ""
    
    # Common tag keys used across AWS resources
    DEFAULT_TAGS = {
        'ManagedBy': 'DevOpsAgent',
    }
    
    def __init__(
        self,
        credentials: Optional[AWSCredentials] = None,
        region: Optional[str] = None,
        profile_name: Optional[str] = None,
        endpoint_url: Optional[str] = None
    ):
        """
        Initialize the AWS service.
        
        Args:
            credentials: AWSCredentials object. If None, credentials will be loaded
                        from the credential manager.
            region: AWS region name. If None, will use the region from credentials
                   or the AWS_REGION environment variable.
            profile_name: AWS profile name from ~/.aws/credentials. Used only if
                         credentials are not provided.
            endpoint_url: Custom endpoint URL for the service.
        
        Raises:
            AWSServiceError: If the service name is not set or credentials are invalid.
        """
        if not self.SERVICE_NAME:
            raise AWSServiceError(
                "Service name must be set by subclasses (set SERVICE_NAME class attribute)"
            )
        
        self.region = region
        self.endpoint_url = endpoint_url
        
        # Set up credentials
        if credentials:
            self.credentials = credentials
        else:
            cred_manager = get_credential_manager()
            self.credentials = cred_manager.get_aws_credentials(
                profile_name=profile_name,
                region=region
            )
        
        # Region can come from credentials if not explicitly provided
        if not self.region:
            self.region = self.credentials.region
        
        # Initialize session and clients
        self.session = self.credentials.get_session()
        self._init_clients()
        
        # Load service-specific configuration
        self.config = get_config()
        
        # Verify access by making a simple API call
        self._verify_access()
    
    def _init_clients(self) -> None:
        """Initialize service client and resource objects."""
        client_kwargs = {}
        if self.region:
            client_kwargs['region_name'] = self.region
        if self.endpoint_url:
            client_kwargs['endpoint_url'] = self.endpoint_url
        
        self.client = self.session.client(self.SERVICE_NAME, **client_kwargs)
        
        # Not all services have resource objects
        try:
            self.resource = self.session.resource(self.SERVICE_NAME, **client_kwargs)
        except:
            self.resource = None
    
    def _verify_access(self) -> None:
        """
        Verify that the credentials have access to the service.
        
        This method should be overridden by subclasses to perform a simple,
        read-only operation to verify access.
        
        Raises:
            AWSServiceError: If access verification fails.
        """
        try:
            # Default implementation uses a simple get_caller_identity from STS
            sts_client = self.session.client('sts')
            sts_client.get_caller_identity()
        except ClientError as e:
            raise AWSServiceError(f"Failed to verify AWS access: {str(e)}")
    
    def handle_error(self, error: Exception, operation: str) -> None:
        """
        Handle common AWS errors and convert to appropriate exceptions.
        
        Args:
            error: The exception that was raised.
            operation: The name of the operation that failed.
            
        Raises:
            ResourceNotFoundError: If the resource was not found.
            PermissionDeniedError: If permissions are insufficient.
            ValidationError: If input validation failed.
            RateLimitError: If rate limits were exceeded.
            ResourceLimitError: If resource limits were exceeded.
            AWSServiceError: For other AWS-related errors.
        """
        if isinstance(error, ClientError):
            error_code = error.response.get('Error', {}).get('Code', '')
            
            if error_code in ['ResourceNotFoundException', 'NoSuchEntity', 'NoSuchBucket', 
                             'NotFound', 'InvalidInstanceID.NotFound', 'InvalidGroup.NotFound',
                             'InvalidSecurityGroupID.NotFound', 'InvalidKeyPair.NotFound',
                             'InvalidKeyPair.Duplicate', 'InvalidVpcID.NotFound']:
                # Extract resource type and ID from error message if possible
                resource_type = None
                resource_id = None
                
                error_msg = error.response.get('Error', {}).get('Message', '')
                if 'instance' in error_code.lower() or 'instance' in error_msg.lower():
                    resource_type = 'instance'
                elif 'security group' in error_msg.lower():
                    resource_type = 'security group'
                elif 'key pair' in error_msg.lower():
                    resource_type = 'key pair'
                elif 'vpc' in error_code.lower() or 'vpc' in error_msg.lower():
                    resource_type = 'VPC'
                
                # Try to extract resource ID from error message
                import re
                id_match = re.search(r"'([a-zA-Z0-9-]+)'", error_msg)
                if id_match:
                    resource_id = id_match.group(1)
                
                raise ResourceNotFoundError(f"{operation} failed: Resource not found", resource_type, resource_id)
            
            elif error_code in ['AccessDenied', 'UnauthorizedOperation']:
                raise PermissionDeniedError(f"{operation} failed: Permission denied - {error.response.get('Error', {}).get('Message', '')}")
            
            elif error_code in ['ValidationError', 'InvalidParameterValue', 'MalformedQueryString']:
                raise ValidationError(f"{operation} failed: Invalid parameters - {error.response.get('Error', {}).get('Message', '')}")
            
            elif error_code in ['Throttling', 'ThrottlingException', 'RequestLimitExceeded']:
                # Try to extract wait time from error message
                import re
                wait_time_match = re.search(r"try again in (\d+) seconds", str(error))
                wait_time = int(wait_time_match.group(1)) if wait_time_match else None
                raise RateLimitError(f"{operation} failed: Rate limit exceeded - {error.response.get('Error', {}).get('Message', '')}", wait_time)
            
            elif error_code in ['LimitExceeded', 'InstanceLimitExceeded', 'ResourceLimitExceeded']:
                raise ResourceLimitError(f"{operation} failed: Resource limit exceeded - {error.response.get('Error', {}).get('Message', '')}")
            
            else:
                logger.error(f"AWS error during {operation}: {error_code} - {error}")
                suggestion = "Check the AWS documentation for this service or contact AWS support for assistance."
                raise AWSServiceError(f"{operation} failed: {error}", suggestion)
        
        elif isinstance(error, NoCredentialsError):
            raise AWSServiceError(f"{operation} failed: No valid AWS credentials found", 
                                 "Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables, "
                                 "configure AWS CLI with 'aws configure', or specify a profile.")
        
        else:
            logger.error(f"Unexpected error during {operation}: {error}")
            suggestion = None
            if "connection" in str(error).lower() or "timeout" in str(error).lower():
                suggestion = "Check your network connection and try again."
            raise AWSServiceError(f"{operation} failed: {error}", suggestion)

    def paginate(self, method: Callable, **kwargs) -> List[Dict[str, Any]]:
        """
        Handle AWS pagination for list operations.
        
        Args:
            method: The boto3 client method to call for each page.
            **kwargs: Arguments to pass to the method.
            
        Returns:
            A list of all items across all pages.
        """
        results = []
        paginator = self.client.get_paginator(method.__name__)
        
        for page in paginator.paginate(**kwargs):
            # Different APIs return results in different keys
            # Look for common result keys
            for key in ['Items', 'Contents', 'Reservations', 'DBInstances', 'TableNames', 
                       'Functions', 'Buckets', 'Vpcs', 'SecurityGroups', 'Users', 'Roles', 
                       'InstanceProfiles', 'Policies']:
                if key in page:
                    results.extend(page[key])
                    break
            else:
                # If no known keys are found, add the whole page
                # (minus pagination tokens)
                page_copy = page.copy()
                if 'NextToken' in page_copy:
                    del page_copy['NextToken']
                results.append(page_copy)
        
        return results
    
    def get_tags(self, resource_id: str) -> Dict[str, str]:
        """
        Get tags for a resource.
        
        This is a base implementation that should be overridden by 
        service-specific subclasses as tag retrieval varies by service.
        
        Args:
            resource_id: The ID of the resource.
            
        Returns:
            Dictionary of tag key-value pairs.
            
        Raises:
            NotImplementedError: If not implemented by the subclass.
        """
        raise NotImplementedError("Tag retrieval not implemented for this service")
    
    def tag_resource(
        self, 
        resource_id: str, 
        tags: Dict[str, str],
        overwrite: bool = False
    ) -> None:
        """
        Tag a resource.
        
        This is a base implementation that should be overridden by 
        service-specific subclasses as tag application varies by service.
        
        Args:
            resource_id: The ID of the resource.
            tags: Dictionary of tag key-value pairs to apply.
            overwrite: Whether to overwrite existing tags with the same keys.
            
        Raises:
            NotImplementedError: If not implemented by the subclass.
        """
        raise NotImplementedError("Resource tagging not implemented for this service")
    
    def get_regions(self) -> List[str]:
        """
        Get a list of all available AWS regions.
        
        Returns:
            List of region names.
        """
        try:
            ec2_client = self.session.client('ec2', region_name='us-east-1')
            response = ec2_client.describe_regions()
            return [region['RegionName'] for region in response['Regions']]
        except Exception as e:
            logger.warning(f"Failed to get AWS regions: {e}")
            # Return a default list of common regions
            return [
                'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
                'ca-central-1', 'eu-west-1', 'eu-west-2', 'eu-west-3',
                'eu-central-1', 'ap-northeast-1', 'ap-northeast-2',
                'ap-southeast-1', 'ap-southeast-2', 'ap-south-1',
                'sa-east-1'
            ]
    
    def wait_for(
        self,
        waiter_name: str,
        waiter_args: Dict[str, Any],
        max_attempts: int = 40,
        delay: int = 15
    ) -> None:
        """
        Wait for a specific state using a boto3 waiter.
        
        Args:
            waiter_name: Name of the waiter to use (e.g., 'instance_running').
            waiter_args: Arguments for the waiter.
            max_attempts: Maximum number of attempts.
            delay: Delay between attempts in seconds.
            
        Raises:
            AWSServiceError: If the wait operation times out or fails.
        """
        try:
            waiter = self.client.get_waiter(waiter_name)
            waiter.wait(
                WaiterConfig={
                    'Delay': delay,
                    'MaxAttempts': max_attempts
                },
                **waiter_args
            )
        except Exception as e:
            operation = f"wait_for_{waiter_name}"
            self.handle_error(e, operation)
    
    def format_resource_name(self, name_format: str, **kwargs) -> str:
        """
        Format a resource name according to a template.
        
        Args:
            name_format: Format string for the name.
            **kwargs: Values to substitute in the format string.
            
        Returns:
            Formatted resource name.
        """
        if '{random}' in name_format:
            import random
            import string
            random_str = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
            kwargs['random'] = random_str
        
        if '{timestamp}' in name_format:
            import time
            kwargs['timestamp'] = int(time.time())
        
        # Add environment and service name if not provided
        if '{env}' in name_format and 'env' not in kwargs:
            kwargs['env'] = os.environ.get('ENVIRONMENT', 'dev')
        
        if '{service}' in name_format and 'service' not in kwargs:
            kwargs['service'] = self.SERVICE_NAME
        
        return name_format.format(**kwargs)


# Common decorator for AWS operations with error handling
def aws_operation(operation_name=None):
    """
    Decorator for AWS operations that handles common errors.
    
    Args:
        operation_name: Name of the operation, defaults to the function name.
    
    Returns:
        Decorated function.
    """
    def decorator(func):
        def wrapper(self, *args, **kwargs):
            op_name = operation_name or func.__name__
            try:
                return func(self, *args, **kwargs)
            except (AWSServiceError, ResourceNotFoundError, 
                   PermissionDeniedError, ValidationError,
                   RateLimitError, ResourceLimitError) as e:
                # Re-raise known exceptions
                raise
            except Exception as e:
                # Handle and convert unknown exceptions
                if isinstance(self, AWSBaseService):
                    self.handle_error(e, op_name)
                else:
                    raise AWSServiceError(f"{op_name} failed: {e}")
        return wrapper
    return decorator