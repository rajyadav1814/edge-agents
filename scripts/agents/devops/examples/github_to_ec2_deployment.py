#!/usr/bin/env python3
"""
Example script: GitHub to EC2 Deployment

This script demonstrates how to use the DevOps Agent to deploy a GitHub repository
to an EC2 instance. It shows how to initialize the EC2 and GitHub services,
fetch repository details, and deploy the code to a running EC2 instance.
"""

import os
import sys
import logging
from pathlib import Path

# Add parent directory to path to make imports work
sys.path.append(str(Path(__file__).parents[1]))

from src.aws.ec2 import EC2Service
from src.github.github import GitHubService
from src.core.credentials import get_credential_manager
from src.core.config import get_config

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def main():
    """Main function to demonstrate GitHub to EC2 deployment."""
    
    # Load configuration
    config = get_config()
    
    # Get credentials manager
    cred_manager = get_credential_manager()
    
    # Initialize AWS credentials (will try environment variables or AWS profile)
    aws_creds = cred_manager.get_aws_credentials(
        region=os.environ.get('AWS_REGION', 'us-east-1')
    )
    
    # Initialize GitHub credentials (will try environment variables or keyring)
    github_creds = cred_manager.get_github_credentials()
    
    # Initialize EC2 service
    ec2 = EC2Service(credentials=aws_creds)
    
    # Initialize GitHub service
    github = GitHubService(token=github_creds.token)
    
    # Configuration variables (replace with your actual values)
    repository = "owner/repo"  # GitHub repository in format "owner/repo"
    branch = "main"            # Branch to deploy
    instance_id = "i-0123456789abcdef0"  # EC2 instance ID
    deploy_path = "/var/www/html"        # Path on the instance to deploy to
    
    # 1. Get information about the repository
    try:
        repo_info = github.get_repository(repository)
        logger.info(f"Repository: {repo_info['full_name']}")
        logger.info(f"Description: {repo_info['description']}")
        logger.info(f"Default branch: {repo_info['default_branch']}")
        
        # Use the default branch if none specified
        if not branch:
            branch = repo_info['default_branch']
            logger.info(f"Using default branch: {branch}")
    except Exception as e:
        logger.error(f"Failed to get repository information: {e}")
        return 1
    
    # 2. List running EC2 instances if no instance_id provided
    if not instance_id:
        try:
            instances = ec2.list_instances(filters=[{
                'Name': 'instance-state-name',
                'Values': ['running']
            }])
            
            if not instances:
                logger.error("No running EC2 instances found")
                return 1
            
            logger.info(f"Found {len(instances)} running instances:")
            for i, instance in enumerate(instances):
                logger.info(f"{i+1}. {instance['InstanceId']} - {instance.get('Tags', [{'Key': 'Name', 'Value': 'Unknown'}])[0]['Value']}")
            
            # For this example, we'll just use the first instance
            instance_id = instances[0]['InstanceId']
            logger.info(f"Using instance: {instance_id}")
        except Exception as e:
            logger.error(f"Failed to list EC2 instances: {e}")
            return 1
    
    # 3. Deploy from GitHub to EC2
    try:
        logger.info(f"Deploying {repository} ({branch}) to EC2 instance {instance_id}...")
        
        result = ec2.deploy_from_github(
            instance_id=instance_id,
            repository=repository,
            branch=branch,
            deploy_path=deploy_path,
            github_token=github_creds.token
        )
        
        if result.get('status') == 'Success':
            logger.info("Deployment completed successfully!")
            logger.info(f"Output: {result.get('output', '')}")
        else:
            logger.info(f"Deployment status: {result.get('status')}")
            if result.get('method') == 'user_data':
                logger.info("Deployment initiated via user data. Check instance logs for results.")
            else:
                logger.error(f"Error: {result.get('error', 'Unknown error')}")
    except Exception as e:
        logger.error(f"Deployment failed: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())