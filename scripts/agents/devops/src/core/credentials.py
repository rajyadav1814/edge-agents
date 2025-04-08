"""
Credentials Module - Provides secure credential management for DevOps operations.

This module defines credential models and a credential manager for securely accessing
and managing AWS, GitHub, and other service credentials.
"""

import os
import json
import logging
from typing import Dict, Optional, Any
from pathlib import Path
import boto3
from botocore.exceptions import ProfileNotFound

from pydantic import BaseModel, Field

# Configure logging
logger = logging.getLogger(__name__)


class AWSCredentials(BaseModel):
    """
    AWS credentials model.
    """
    
    access_key_id: Optional[str] = Field(
        default=None,
        description="AWS access key ID"
    )
    
    secret_access_key: Optional[str] = Field(
        default=None,
        description="AWS secret access key"
    )
    
    session_token: Optional[str] = Field(
        default=None,
        description="AWS session token for temporary credentials"
    )
    
    region: Optional[str] = Field(
        default=None,
        description="AWS region"
    )
    
    profile_name: Optional[str] = Field(
        default=None,
        description="AWS profile name"
    )


class GitHubCredentials(BaseModel):
    """
    GitHub credentials model.
    """
    
    token: str = Field(
        description="GitHub personal access token"
    )
    
    username: Optional[str] = Field(
        default=None,
        description="GitHub username"
    )


class CredentialManager:
    """
    Manager for securely accessing and managing service credentials.
    
    Supports loading credentials from environment variables, credential files,
    and AWS Secrets Manager.
    """
    
    def __init__(
        self,
        credentials_file: Optional[str] = None,
        use_env_vars: bool = True,
        use_aws_secrets: bool = False,
        aws_region: Optional[str] = None
    ):
        """
        Initialize the credential manager.
        
        Args:
            credentials_file: Path to credentials file
            use_env_vars: Whether to load credentials from environment variables
            use_aws_secrets: Whether to load credentials from AWS Secrets Manager
            aws_region: AWS region for Secrets Manager
        """
        self.credentials_file = credentials_file
        self.use_env_vars = use_env_vars
        self.use_aws_secrets = use_aws_secrets
        self.aws_region = aws_region
        
        # Load credentials from file if provided
        self.credentials: Dict[str, Any] = {}
        if credentials_file:
            self._load_credentials_file()
    
    def _load_credentials_file(self) -> None:
        """
        Load credentials from file.
        
        Raises:
            FileNotFoundError: If credentials file doesn't exist
            json.JSONDecodeError: If credentials file is not valid JSON
        """
        try:
            creds_path = Path(self.credentials_file).expanduser()
            if creds_path.exists():
                with open(creds_path, 'r') as f:
                    self.credentials = json.load(f)
                logger.info(f"Loaded credentials from {self.credentials_file}")
            else:
                logger.warning(f"Credentials file {self.credentials_file} not found")
        except (json.JSONDecodeError, IOError) as e:
            logger.error(f"Failed to load credentials file: {e}")
            raise
    
    def _get_from_env(self, prefix: str, keys: Dict[str, str]) -> Dict[str, str]:
        """
        Get credentials from environment variables.
        
        Args:
            prefix: Environment variable prefix
            keys: Mapping of credential keys to environment variable names
            
        Returns:
            Dictionary of credentials found in environment variables
        """
        result = {}
        for key, env_var in keys.items():
            full_env_var = f"{prefix}_{env_var}" if prefix else env_var
            if full_env_var in os.environ:
                result[key] = os.environ[full_env_var]
        return result
    
    def _get_from_aws_secrets(self, secret_name: str) -> Dict[str, Any]:
        """
        Get credentials from AWS Secrets Manager.
        
        Args:
            secret_name: Name of the secret
            
        Returns:
            Dictionary of credentials from the secret
            
        Raises:
            Exception: If retrieving the secret fails
        """
        if not self.use_aws_secrets:
            return {}
            
        try:
            # Create Secrets Manager client
            session = boto3.session.Session()
            client = session.client(
                service_name='secretsmanager',
                region_name=self.aws_region
            )
            
            # Get the secret
            response = client.get_secret_value(SecretId=secret_name)
            
            # Parse the secret
            if 'SecretString' in response:
                return json.loads(response['SecretString'])
            else:
                return {}
                
        except Exception as e:
            logger.error(f"Failed to get secret {secret_name}: {e}")
            return {}
    
    def get_aws_credentials(
        self,
        profile_name: Optional[str] = None,
        region: Optional[str] = None
    ) -> AWSCredentials:
        """
        Get AWS credentials.
        
        Args:
            profile_name: AWS profile name to use
            region: AWS region to use
            
        Returns:
            AWSCredentials object
            
        Raises:
            ValueError: If credentials cannot be loaded
        """
        # Start with empty credentials
        creds = AWSCredentials()
        
        # Try to load from credentials file
        if 'aws' in self.credentials:
            aws_creds = self.credentials['aws']
            creds.access_key_id = aws_creds.get('access_key_id')
            creds.secret_access_key = aws_creds.get('secret_access_key')
            creds.session_token = aws_creds.get('session_token')
            creds.region = aws_creds.get('region')
        
        # Try to load from environment variables
        if self.use_env_vars:
            env_creds = self._get_from_env('AWS', {
                'access_key_id': 'ACCESS_KEY_ID',
                'secret_access_key': 'SECRET_ACCESS_KEY',
                'session_token': 'SESSION_TOKEN',
                'region': 'REGION'
            })
            
            if env_creds.get('access_key_id'):
                creds.access_key_id = env_creds['access_key_id']
            if env_creds.get('secret_access_key'):
                creds.secret_access_key = env_creds['secret_access_key']
            if env_creds.get('session_token'):
                creds.session_token = env_creds['session_token']
            if env_creds.get('region'):
                creds.region = env_creds['region']
        
        # Try to load from AWS Secrets Manager
        if self.use_aws_secrets:
            secret_creds = self._get_from_aws_secrets('aws/credentials')
            
            if secret_creds.get('access_key_id'):
                creds.access_key_id = secret_creds['access_key_id']
            if secret_creds.get('secret_access_key'):
                creds.secret_access_key = secret_creds['secret_access_key']
            if secret_creds.get('session_token'):
                creds.session_token = secret_creds['session_token']
            if secret_creds.get('region'):
                creds.region = secret_creds['region']
        
        # Use provided profile if specified
        if profile_name:
            creds.profile_name = profile_name
            
            # Try to load from AWS profile
            try:
                session = boto3.Session(profile_name=profile_name)
                aws_creds = session.get_credentials()
                if aws_creds:
                    creds.access_key_id = aws_creds.access_key
                    creds.secret_access_key = aws_creds.secret_key
                    creds.session_token = aws_creds.token
                    
                    # Get region from session
                    if session.region_name:
                        creds.region = session.region_name
            except ProfileNotFound:
                logger.warning(f"AWS profile {profile_name} not found")
        
        # Override region if provided
        if region:
            creds.region = region
            
        # Validate credentials
        if not creds.access_key_id or not creds.secret_access_key:
            # If no explicit credentials, boto3 will use the default credential chain
            logger.info("No explicit AWS credentials provided, using default credential chain")
        
        return creds
    
    def get_github_credentials(self) -> GitHubCredentials:
        """
        Get GitHub credentials.
        
        Returns:
            GitHubCredentials object
            
        Raises:
            ValueError: If credentials cannot be loaded
        """
        # Start with empty credentials
        token = None
        username = None
        
        # Try to load from credentials file
        if 'github' in self.credentials:
            github_creds = self.credentials['github']
            token = github_creds.get('token')
            username = github_creds.get('username')
        
        # Try to load from environment variables
        if self.use_env_vars:
            if 'GITHUB_TOKEN' in os.environ:
                token = os.environ['GITHUB_TOKEN']
            if 'GITHUB_USERNAME' in os.environ:
                username = os.environ['GITHUB_USERNAME']
        
        # Try to load from AWS Secrets Manager
        if self.use_aws_secrets:
            secret_creds = self._get_from_aws_secrets('github/credentials')
            
            if secret_creds.get('token'):
                token = secret_creds['token']
            if secret_creds.get('username'):
                username = secret_creds['username']
        
        # Validate credentials
        if not token:
            raise ValueError("GitHub token is required")
        
        return GitHubCredentials(token=token, username=username)


# Global credential manager instance
_credential_manager: Optional[CredentialManager] = None


def get_credential_manager() -> CredentialManager:
    """
    Get the global credential manager instance.
    
    Returns:
        CredentialManager instance
    """
    global _credential_manager
    
    if _credential_manager is None:
        # Initialize with default settings
        credentials_file = os.environ.get('CREDENTIALS_FILE', '~/.devops/credentials.json')
        use_aws_secrets = os.environ.get('USE_AWS_SECRETS', 'false').lower() == 'true'
        aws_region = os.environ.get('AWS_REGION', 'us-west-2')
        
        _credential_manager = CredentialManager(
            credentials_file=credentials_file,
            use_env_vars=True,
            use_aws_secrets=use_aws_secrets,
            aws_region=aws_region
        )
    
    return _credential_manager


def set_credential_manager(manager: CredentialManager) -> None:
    """
    Set the global credential manager instance.
    
    Args:
        manager: CredentialManager instance to use
    """
    global _credential_manager
    _credential_manager = manager