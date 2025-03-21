# DevOps Agent: Quick Start Guide

This guide will help you get started with the DevOps Agent, a modular tool for managing cloud infrastructure across multiple providers with GitHub integration.

## Prerequisites

Before you begin, make sure you have:

1. Python 3.8 or higher installed
2. AWS account with programmatic access
3. GitHub account with a personal access token
4. Basic knowledge of AWS services and GitHub

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/devops-agent.git
cd devops-agent
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure credentials

Copy the example environment file and edit it with your credentials:

```bash
cp env.example .env
```

Edit the `.env` file with your AWS and GitHub credentials:

```
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_REGION=us-east-1
GITHUB_TOKEN=your-github-personal-access-token
```

## Basic Usage Examples

### Using the CLI

The DevOps Agent includes a command-line interface for common operations:

#### List EC2 Instances

```bash
python -m src.cli ec2 list-instances
```

#### Get GitHub Repository Information

```bash
python -m src.cli github get-repo owner/repo-name
```

#### Deploy from GitHub to EC2

```bash
python -m src.cli deploy github-to-ec2 --repo owner/repo-name --instance-id i-1234567890abcdef0
```

### Using as a Python Library

You can also use the DevOps Agent as a Python library in your scripts:

```python
from devops_agent.aws.ec2 import EC2Service
from devops_agent.github.github import GitHubService
from devops_agent.core.credentials import get_credential_manager

# Get credentials
cred_manager = get_credential_manager()
aws_creds = cred_manager.get_aws_credentials()
github_creds = cred_manager.get_github_credentials()

# Initialize services
ec2 = EC2Service(credentials=aws_creds)
github = GitHubService(token=github_creds.token)

# List EC2 instances
instances = ec2.list_instances(filters=[{'Name': 'instance-state-name', 'Values': ['running']}])
for instance in instances:
    print(f"Instance ID: {instance['InstanceId']}")

# Get GitHub repository details
repo = github.get_repository("owner/repo-name")
print(f"Repository: {repo['full_name']}")
print(f"Description: {repo['description']}")
```

## Common Tasks

### Managing EC2 Instances

```bash
# List running instances
python -m src.cli ec2 list-instances --state running

# Create a new instance
python -m src.cli ec2 create-instance --name web-server --type t2.micro --ami-id ami-0c55b159cbfafe1f0

# Stop an instance
python -m src.cli ec2 stop-instance i-1234567890abcdef0

# Start an instance
python -m src.cli ec2 start-instance i-1234567890abcdef0
```

### Working with GitHub

```bash
# List repositories in an organization
python -m src.cli github list-repos --org your-organization

# Get README content
python -m src.cli github get-readme owner/repo-name

# List branches
python -m src.cli github list-branches owner/repo-name
```

### Deployment Workflows

```bash
# Deploy from GitHub to EC2
python -m src.cli deploy github-to-ec2 --repo owner/repo-name --instance-id i-1234567890abcdef0 --path /var/www/html
```

## Troubleshooting

### Debug Mode

Enable debug logging to see more detailed output:

```bash
python -m src.cli --debug ec2 list-instances
```

### Environment Variables

The DevOps Agent uses the following environment variables:

- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key
- `AWS_REGION`: Default AWS region
- `GITHUB_TOKEN`: GitHub personal access token
- `GITHUB_ORG`: Default GitHub organization

### Common Issues

1. **Authentication Failures**: Ensure your AWS credentials and GitHub token are correct and have necessary permissions.

2. **Missing Dependencies**: Verify all required Python packages are installed with `pip install -r requirements.txt`.

3. **Region Issues**: If you're getting region-related errors, explicitly specify the region with the `--region` parameter.

## Next Steps

- Explore advanced deployment workflows
- Set up automated infrastructure management
- Create custom scripts using the DevOps Agent library
- Contribute to the project by adding support for additional AWS services or cloud providers

For more information, see the full documentation and service definitions in the `docs` and `services` directories.