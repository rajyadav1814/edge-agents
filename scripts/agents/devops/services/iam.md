# IAM Service Module

## Overview

The IAM (Identity and Access Management) module provides capabilities for managing AWS identities, permissions, and access controls, including users, groups, roles, policies, and access keys. It also integrates with GitHub for secure access management and CI/CD workflows.

## Core Operations

### User Management

- **List Users**: Retrieve a list of all IAM users
- **User Details**: Get detailed information about a specific user
- **Create User**: Create a new IAM user
- **Delete User**: Delete an IAM user
- **Update User**: Update user attributes
- **Tag User**: Add, modify, or remove tags

### Group Management

- **List Groups**: Get a list of all IAM groups
- **Group Details**: Get detailed information about a specific group
- **Create Group**: Create a new IAM group
- **Delete Group**: Delete an IAM group
- **Add User to Group**: Add a user to a group
- **Remove User from Group**: Remove a user from a group
- **List Groups for User**: Get groups that a user belongs to

### Role Management

- **List Roles**: Get a list of all IAM roles
- **Role Details**: Get detailed information about a specific role
- **Create Role**: Create a new IAM role
- **Delete Role**: Delete an IAM role
- **Update Role**: Update role attributes
- **Create Service-Linked Role**: Create a role linked to an AWS service

### Policy Management

- **List Policies**: Get a list of IAM policies
- **Policy Details**: Get detailed information about a specific policy
- **Create Policy**: Create a new IAM policy
- **Delete Policy**: Delete an IAM policy
- **Update Policy**: Update a policy document
- **Attach Policy**: Attach a policy to a user, group, or role
- **Detach Policy**: Detach a policy from a user, group, or role
- **List Attached Policies**: Get policies attached to a user, group, or role

### Access Key Management

- **List Access Keys**: Get a list of access keys for a user
- **Create Access Key**: Create a new access key for a user
- **Delete Access Key**: Delete an access key
- **Update Access Key Status**: Activate or deactivate an access key
- **Last Used Information**: Get information about when an access key was last used

### MFA Management

- **List MFA Devices**: Get a list of MFA devices for a user
- **Enable MFA Device**: Enable an MFA device for a user
- **Deactivate MFA Device**: Deactivate an MFA device
- **Delete MFA Device**: Remove an MFA device from a user

## GitHub Integration

- **GitHub Actions Integration**: Create and manage IAM roles for GitHub Actions workflows
- **OIDC Provider Setup**: Configure OpenID Connect for GitHub Actions
- **Repository-specific Access**: Generate and manage IAM credentials for specific repositories
- **Temporary Credentials**: Issue temporary credentials for GitHub-based deployment processes
- **Permissions Boundary**: Enforce least privilege access for GitHub-initiated operations
- **Audit and Compliance**: Track GitHub-based access to AWS resources
- **Secrets Management**: Securely store and rotate AWS credentials in GitHub Secrets

## Advanced Operations

- **Credential Reports**: Generate and retrieve credential reports
- **Account Aliases**: Manage account aliases
- **SAML Providers**: Create and manage SAML identity providers
- **OpenID Connect Providers**: Manage OpenID Connect providers
- **Account Password Policy**: Configure password policies
- **Server Certificates**: Manage server certificates
- **Virtual MFA Devices**: Create and manage virtual MFA devices

## Error Handling

The module will provide detailed error handling for common IAM-related issues:

- Entity not found
- Entity already exists
- Invalid input
- Malformed policy document
- Permission denied
- Service limit exceeded
- Dependency violation

## Usage Examples

```python
# Initialize IAM service
iam_service = devops_agent.aws.iam.IAMService(credentials)

# List all users
users = iam_service.list_users()

# Create a new user
new_user = iam_service.create_user(
    user_name='john.doe',
    path='/developers/',
    tags=[{'Key': 'Department', 'Value': 'Engineering'}]
)

# Create an access key for the user
access_key = iam_service.create_access_key(user_name='john.doe')

# Create a group and add the user to it
group = iam_service.create_group(group_name='Developers')
iam_service.add_user_to_group(
    user_name='john.doe',
    group_name='Developers'
)

# Configure GitHub Actions OIDC integration
iam_service.configure_github_oidc(
    repo_name='example-org/example-repo',
    allowed_actions=['Deploy', 'ReadOnly'],
    max_session_duration=3600  # 1 hour
)

# Create IAM role for GitHub Actions
github_role = iam_service.create_github_actions_role(
    role_name='GithubActionsDeployRole',
    repo_name='example-org/example-repo',
    allowed_branches=['main', 'production'],
    policies=['AmazonS3ReadOnlyAccess', 'AmazonEC2ReadOnlyAccess']
)
```

## Implementation Plan

1. Create base IAMService class
2. Implement user management operations
3. Add group management functionality
4. Implement role management operations
5. Add policy management methods
6. Implement access key management
7. Add MFA management operations
8. Implement GitHub integration features
9. Add advanced operations
10. Create comprehensive error handling
11. Write unit and integration tests
12. Document all methods and examples