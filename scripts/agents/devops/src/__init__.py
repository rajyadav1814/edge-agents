"""
DevOps Agent Package - Provides functionality for DevOps operations with OpenAI Agents SDK.

This package includes modules for AWS services, GitHub integration, and other DevOps
tools, designed to be used with the OpenAI Agents SDK.
"""

from .aws import (
    # EC2 Models
    EC2InstanceFilter,
    EC2StartStopRequest,
    EC2CreateRequest,
    EC2Instance,
    
    # EC2 Tools
    list_ec2_instances,
    start_ec2_instances,
    stop_ec2_instances,
    create_ec2_instance
)

from .github import (
    # GitHub Models
    GitHubRepoRequest,
    GitHubIssueRequest,
    GitHubCreateIssueRequest,
    GitHubPRRequest,
    GitHubRepository,
    GitHubIssue,
    GitHubPullRequest,
    
    # GitHub Tools
    get_repository,
    list_issues,
    create_issue,
    list_pull_requests
)

from .core import (
    # Context
    DevOpsContext,
    
    # Config
    get_config,
    get_config_value,
    set_config_value,
    load_config,
    
    # Credentials
    AWSCredentials,
    GitHubCredentials,
    CredentialManager,
    get_credential_manager,
    set_credential_manager,
    
    # Guardrails
    security_guardrail,
    sensitive_info_guardrail,
    SecurityCheckOutput,
    SensitiveInfoOutput
)

__all__ = [
    # AWS EC2
    'EC2InstanceFilter',
    'EC2StartStopRequest',
    'EC2CreateRequest',
    'EC2Instance',
    'list_ec2_instances',
    'start_ec2_instances',
    'stop_ec2_instances',
    'create_ec2_instance',
    
    # GitHub
    'GitHubRepoRequest',
    'GitHubIssueRequest',
    'GitHubCreateIssueRequest',
    'GitHubPRRequest',
    'GitHubRepository',
    'GitHubIssue',
    'GitHubPullRequest',
    'get_repository',
    'list_issues',
    'create_issue',
    'list_pull_requests',
    
    # Core
    'DevOpsContext',
    'get_config',
    'get_config_value',
    'set_config_value',
    'load_config',
    'AWSCredentials',
    'GitHubCredentials',
    'CredentialManager',
    'get_credential_manager',
    'set_credential_manager',
    'security_guardrail',
    'sensitive_info_guardrail',
    'SecurityCheckOutput',
    'SensitiveInfoOutput'
]

# Version
__version__ = '0.1.0'