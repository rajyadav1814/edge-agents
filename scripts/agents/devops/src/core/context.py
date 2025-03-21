"""
Context Module - Provides context management for DevOps agent operations.

This module defines the DevOpsContext class which encapsulates user and environment
information for DevOps operations, ensuring consistent access to configuration
across different agent components.
"""

from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class DevOpsContext(BaseModel):
    """
    Context class for DevOps operations.
    
    Encapsulates user identity, AWS region, GitHub organization, and other
    contextual information needed for DevOps operations.
    """
    
    user_id: str = Field(
        description="Unique identifier for the user"
    )
    
    aws_region: Optional[str] = Field(
        default=None,
        description="Default AWS region for operations"
    )
    
    github_org: Optional[str] = Field(
        default=None,
        description="Default GitHub organization"
    )
    
    environment: str = Field(
        default="dev",
        description="Environment (dev, staging, prod)"
    )
    
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Additional metadata for the context"
    )
    
    def get_metadata(self, key: str, default: Any = None) -> Any:
        """
        Get a metadata value by key.
        
        Args:
            key: The metadata key
            default: Default value if key doesn't exist
            
        Returns:
            The metadata value or default
        """
        return self.metadata.get(key, default)
    
    def set_metadata(self, key: str, value: Any) -> None:
        """
        Set a metadata value.
        
        Args:
            key: The metadata key
            value: The value to set
        """
        self.metadata[key] = value
    
    def with_aws_region(self, region: str) -> 'DevOpsContext':
        """
        Create a new context with the specified AWS region.
        
        Args:
            region: AWS region
            
        Returns:
            New context with updated region
        """
        return self.model_copy(update={"aws_region": region})
    
    def with_github_org(self, org: str) -> 'DevOpsContext':
        """
        Create a new context with the specified GitHub organization.
        
        Args:
            org: GitHub organization
            
        Returns:
            New context with updated organization
        """
        return self.model_copy(update={"github_org": org})
    
    def with_environment(self, env: str) -> 'DevOpsContext':
        """
        Create a new context with the specified environment.
        
        Args:
            env: Environment name
            
        Returns:
            New context with updated environment
        """
        return self.model_copy(update={"environment": env})