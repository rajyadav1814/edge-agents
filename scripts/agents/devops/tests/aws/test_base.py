"""
Unit tests for the AWS base service module.

These tests verify the functionality of the AWSBaseService class
without making actual AWS API calls.
"""

import os
import pytest
from unittest.mock import patch, MagicMock
import boto3
from botocore.exceptions import ClientError, NoCredentialsError

from src.aws.base import (
    AWSBaseService,
    AWSServiceError,
    ResourceNotFoundError,
    PermissionDeniedError,
    ValidationError,
    RateLimitError,
    ResourceLimitError,
    aws_operation
)
from src.core.credentials import AWSCredentials


class TestService(AWSBaseService):
    """Test implementation of AWSBaseService."""
    SERVICE_NAME = "test-service"
    
    def _verify_access(self):
        """Override to avoid actual API calls."""
        pass
    
    @aws_operation("test_operation")
    def test_operation(self, param):
        """Test operation for testing the decorator."""
        return f"Success: {param}"
    
    @aws_operation()
    def operation_with_default_name(self, param):
        """Test operation with default name from function."""
        return f"Default: {param}"


@pytest.fixture
def aws_credentials():
    """Create a test AWS credentials object."""
    return AWSCredentials(
        access_key_id="test-access-key",
        secret_access_key="test-secret-key",
        session_token="test-session-token",
        region="us-east-1"
    )


@pytest.fixture
def mock_session():
    """Create a mock boto3 session."""
    session = MagicMock()
    client = MagicMock()
    resource = MagicMock()
    session.client.return_value = client
    session.resource.return_value = resource
    return session


@pytest.fixture
def base_service(aws_credentials, mock_session):
    """Create a test service with mocked session."""
    with patch.object(AWSCredentials, 'get_session', return_value=mock_session):
        service = TestService(credentials=aws_credentials)
        return service


class TestAWSBaseService:
    """Tests for the AWSBaseService class."""
    
    def test_init(self, base_service, mock_session):
        """Test initialization of the service."""
        assert base_service.SERVICE_NAME == "test-service"
        assert base_service.session is mock_session
        mock_session.client.assert_called_once_with("test-service", region_name="us-east-1")
        mock_session.resource.assert_called_once_with("test-service", region_name="us-east-1")
    
    def test_init_with_endpoint_url(self, aws_credentials, mock_session):
        """Test initialization with custom endpoint URL."""
        with patch.object(AWSCredentials, 'get_session', return_value=mock_session):
            service = TestService(
                credentials=aws_credentials,
                endpoint_url="https://test-endpoint.example.com"
            )
            
            mock_session.client.assert_called_once_with(
                "test-service",
                region_name="us-east-1",
                endpoint_url="https://test-endpoint.example.com"
            )
    
    def test_init_missing_service_name(self):
        """Test initialization with missing service name."""
        class InvalidService(AWSBaseService):
            SERVICE_NAME = ""
            
            def _verify_access(self):
                pass
        
        with pytest.raises(AWSServiceError) as excinfo:
            InvalidService()
        
        assert "Service name must be set" in str(excinfo.value)
    
    def test_handle_error_resource_not_found(self, base_service):
        """Test handling of resource not found errors."""
        error_response = {
            "Error": {
                "Code": "ResourceNotFoundException",
                "Message": "Resource not found"
            }
        }
        error = ClientError(error_response, "test_operation")
        
        with pytest.raises(ResourceNotFoundError) as excinfo:
            base_service.handle_error(error, "test_operation")
        
        assert "Resource not found" in str(excinfo.value)
    
    def test_handle_error_permission_denied(self, base_service):
        """Test handling of permission denied errors."""
        error_response = {
            "Error": {
                "Code": "AccessDenied",
                "Message": "Access denied"
            }
        }
        error = ClientError(error_response, "test_operation")
        
        with pytest.raises(PermissionDeniedError) as excinfo:
            base_service.handle_error(error, "test_operation")
        
        assert "Permission denied" in str(excinfo.value)
    
    def test_handle_error_validation(self, base_service):
        """Test handling of validation errors."""
        error_response = {
            "Error": {
                "Code": "ValidationError",
                "Message": "Invalid parameter"
            }
        }
        error = ClientError(error_response, "test_operation")
        
        with pytest.raises(ValidationError) as excinfo:
            base_service.handle_error(error, "test_operation")
        
        assert "Invalid parameters" in str(excinfo.value)
    
    def test_handle_error_rate_limit(self, base_service):
        """Test handling of rate limit errors."""
        error_response = {
            "Error": {
                "Code": "Throttling",
                "Message": "Rate exceeded"
            }
        }
        error = ClientError(error_response, "test_operation")
        
        with pytest.raises(RateLimitError) as excinfo:
            base_service.handle_error(error, "test_operation")
        
        assert "Rate limit exceeded" in str(excinfo.value)
    
    def test_handle_error_resource_limit(self, base_service):
        """Test handling of resource limit errors."""
        error_response = {
            "Error": {
                "Code": "LimitExceeded",
                "Message": "Limit exceeded"
            }
        }
        error = ClientError(error_response, "test_operation")
        
        with pytest.raises(ResourceLimitError) as excinfo:
            base_service.handle_error(error, "test_operation")
        
        assert "Resource limit exceeded" in str(excinfo.value)
    
    def test_handle_error_other_client_error(self, base_service):
        """Test handling of other client errors."""
        error_response = {
            "Error": {
                "Code": "OtherError",
                "Message": "Some other error"
            }
        }
        error = ClientError(error_response, "test_operation")
        
        with pytest.raises(AWSServiceError) as excinfo:
            base_service.handle_error(error, "test_operation")
        
        assert "test_operation failed" in str(excinfo.value)
    
    def test_handle_error_no_credentials(self, base_service):
        """Test handling of no credentials error."""
        error = NoCredentialsError()
        
        with pytest.raises(AWSServiceError) as excinfo:
            base_service.handle_error(error, "test_operation")
        
        assert "No valid AWS credentials found" in str(excinfo.value)
    
    def test_handle_error_other_exception(self, base_service):
        """Test handling of other exceptions."""
        error = ValueError("Some value error")
        
        with pytest.raises(AWSServiceError) as excinfo:
            base_service.handle_error(error, "test_operation")
        
        assert "test_operation failed" in str(excinfo.value)
    
    def test_paginate(self, base_service):
        """Test pagination of AWS API results."""
        # Mock paginator
        paginator = MagicMock()
        base_service.client.get_paginator.return_value = paginator
        
        # Mock pages
        page1 = {"Items": [{"id": "1"}, {"id": "2"}]}
        page2 = {"Items": [{"id": "3"}, {"id": "4"}]}
        paginator.paginate.return_value = [page1, page2]
        
        # Call paginate
        method = base_service.client.list_items
        method.__name__ = "list_items"
        results = base_service.paginate(method, Param="value")
        
        # Verify results
        assert len(results) == 4
        assert results[0]["id"] == "1"
        assert results[3]["id"] == "4"
        
        # Verify paginator was called correctly
        base_service.client.get_paginator.assert_called_once_with("list_items")
        paginator.paginate.assert_called_once_with(Param="value")
    
    def test_wait_for(self, base_service):
        """Test waiting for a resource state."""
        # Mock waiter
        waiter = MagicMock()
        base_service.client.get_waiter.return_value = waiter
        
        # Call wait_for
        base_service.wait_for(
            "resource_available",
            {"ResourceId": "test-id"},
            max_attempts=10,
            delay=5
        )
        
        # Verify waiter was called correctly
        base_service.client.get_waiter.assert_called_once_with("resource_available")
        waiter.wait.assert_called_once_with(
            WaiterConfig={
                'Delay': 5,
                'MaxAttempts': 10
            },
            ResourceId="test-id"
        )
    
    def test_wait_for_error(self, base_service):
        """Test error handling during wait_for."""
        # Mock waiter to raise an exception
        waiter = MagicMock()
        waiter.wait.side_effect = ClientError(
            {
                "Error": {
                    "Code": "WaiterError",
                    "Message": "Waiter error"
                }
            },
            "wait_operation"
        )
        base_service.client.get_waiter.return_value = waiter
        
        # Call wait_for and expect exception
        with pytest.raises(AWSServiceError) as excinfo:
            base_service.wait_for("resource_available", {"ResourceId": "test-id"})
        
        assert "wait_for_resource_available failed" in str(excinfo.value)
    
    def test_format_resource_name(self, base_service):
        """Test formatting of resource names."""
        # Test with static values
        name = base_service.format_resource_name(
            "{service}-{env}-resource",
            env="dev"
        )
        assert name == "test-service-dev-resource"
        
        # Test with random string
        name = base_service.format_resource_name("{service}-{random}")
        assert name.startswith("test-service-")
        assert len(name) > len("test-service-")
        
        # Test with timestamp
        name = base_service.format_resource_name("{service}-{timestamp}")
        assert name.startswith("test-service-")
        assert len(name) > len("test-service-")


class TestAWSOperationDecorator:
    """Tests for the aws_operation decorator."""
    
    def test_operation_success(self, base_service):
        """Test successful operation with decorator."""
        result = base_service.test_operation("test")
        assert result == "Success: test"
    
    def test_operation_with_default_name(self, base_service):
        """Test operation with default name from function."""
        result = base_service.operation_with_default_name("test")
        assert result == "Default: test"
    
    @patch('src.aws.base.AWSBaseService.handle_error')
    def test_operation_error_handling(self, mock_handle_error, base_service):
        """Test error handling in decorated operation."""
        # Create a ClientError that will be raised
        error = ClientError(
            {
                "Error": {
                    "Code": "ResourceNotFoundException",
                    "Message": "Resource not found"
                }
            },
            "test_operation"
        )
        
        # Configure mock_handle_error to raise ResourceNotFoundError
        mock_handle_error.side_effect = ResourceNotFoundError("test_operation failed: Resource not found")
        
        # Configure the client to raise the ClientError
        base_service.client.describe_test = MagicMock(side_effect=error)
        
        # Define a new test operation that will use the mocked client
        @aws_operation()
        def test_op(self, param):
            self.client.describe_test(Param=param)
            return "Success"
        
        # Add the test operation to the service instance
        base_service.test_op = test_op.__get__(base_service, TestService)
        
        # Call the operation and expect ResourceNotFoundError
        with pytest.raises(ResourceNotFoundError) as excinfo:
            base_service.test_op("test")
        
        # Verify the error message
        assert "Resource not found" in str(excinfo.value)
        
        # Verify handle_error was called with the right parameters
        mock_handle_error.assert_called_once_with(error, "test_op")