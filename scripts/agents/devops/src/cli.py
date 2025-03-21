#!/usr/bin/env python3
"""
Command Line Interface for DevOps Agent.

This module provides a CLI for interacting with the DevOps Agent, allowing users
to perform operations on AWS services and integrate with GitHub from the command line.
"""

import os
import sys
import argparse
import logging
import json
from typing import Dict, Any, Optional, List
from pathlib import Path

from .core.config import get_config, ConfigError
from .core.credentials import get_credential_manager, CredentialError
from .aws.base import AWSServiceError, ResourceNotFoundError, PermissionDeniedError, ValidationError, RateLimitError, ResourceLimitError
from .github.github import GitHubError, AuthenticationError
from .aws.ec2 import EC2Service
from .github.github import GitHubService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('devops-agent')

# ANSI color codes for terminal output
COLORS = {
    'red': '\033[91m',
    'green': '\033[92m',
    'yellow': '\033[93m',
    'blue': '\033[94m',
    'magenta': '\033[95m',
    'cyan': '\033[96m',
    'white': '\033[97m',
    'reset': '\033[0m',
    'bold': '\033[1m'
}

def print_error(message: str, details: Optional[str] = None, suggestion: Optional[str] = None) -> None:
    """
    Print a formatted error message to the console.
    
    Args:
        message: The main error message
        details: Optional details about the error
        suggestion: Optional suggestion for resolving the error
    """
    print(f"{COLORS['red']}{COLORS['bold']}ERROR: {message}{COLORS['reset']}")
    if details:
        print(f"{details}")
    if suggestion:
        print(f"\n{COLORS['yellow']}SUGGESTION: {suggestion}{COLORS['reset']}")

def handle_cli_error(error: Exception) -> int:
    """
    Handle CLI errors with user-friendly messages.
    
    Args:
        error: The exception that was raised
        
    Returns:
        Exit code to return from the command
    """
    # Log the full error for debugging
    logger.debug(f"Error details: {error}", exc_info=True)
    
    # Handle credential errors
    if isinstance(error, CredentialError):
        # Extract error type from the message
        if "AWS" in str(error):
            error_type = "AWS credentials error"
        elif "GitHub" in str(error):
            error_type = "GitHub credentials error"
        else:
            error_type = "Credential error"
        print_error(error_type, f"Error: {error}", getattr(error, 'suggestion', None))
        return 1
    
    # Handle GitHub errors
    elif isinstance(error, GitHubError):
        if isinstance(error, AuthenticationError):
            print_error(
                "GitHub authentication failed",
                f"Error: {error}",
                "Check your GitHub token or set the GITHUB_TOKEN environment variable."
            )
        elif "Organization is required" in str(error):
            print_error(
                "GitHub organization or user required",
                f"Error: {error}",
                "Specify an organization with --org or a user with --user."
            )
        elif "Repository owner is required" in str(error):
            print_error(
                "Repository owner required",
                f"Error: {error}",
                "Specify the repository owner with --owner or use the full repository path (owner/repo)."
            )
        else:
            print_error(f"GitHub error", f"Error: {error}")
        return 1
    # Handle AWS service errors
    elif isinstance(error, AWSServiceError):
        error_type = error.__class__.__name__
        print_error(f"AWS operation failed: {error_type}", f"Error: {error}", getattr(error, 'suggestion', None))
        return 1
    
    # Handle other errors
    else:
        print_error(f"Unexpected error", f"Error: {error}")
        return 1

def setup_ec2_parser(subparsers):
    """Set up the argument parser for EC2 commands."""
    ec2_parser = subparsers.add_parser('ec2', help='EC2 operations')
    ec2_subparsers = ec2_parser.add_subparsers(dest='ec2_command', help='EC2 command')
    
    # List instances command
    list_instances_parser = ec2_subparsers.add_parser('list-instances', help='List EC2 instances')
    list_instances_parser.add_argument('--state', help='Filter by instance state (e.g., running, stopped)')
    list_instances_parser.add_argument('--region', help='AWS region')
    list_instances_parser.add_argument('--output', choices=['json', 'table'], default='table', help='Output format')
    
    # Get instance command
    get_instance_parser = ec2_subparsers.add_parser('get-instance', help='Get EC2 instance details')
    get_instance_parser.add_argument('instance_id', help='Instance ID')
    get_instance_parser.add_argument('--region', help='AWS region')
    get_instance_parser.add_argument('--output', choices=['json', 'table'], default='table', help='Output format')
    
    # Create instance command
    create_instance_parser = ec2_subparsers.add_parser('create-instance', help='Create EC2 instance')
    create_instance_parser.add_argument('--name', required=True, help='Instance name')
    create_instance_parser.add_argument('--type', required=True, help='Instance type (e.g., t2.micro)')
    create_instance_parser.add_argument('--ami-id', required=True, help='AMI ID')
    create_instance_parser.add_argument('--subnet-id', help='Subnet ID')
    create_instance_parser.add_argument('--security-group-ids', help='Security group IDs (comma-separated)')
    create_instance_parser.add_argument('--key-name', help='Key pair name')
    create_instance_parser.add_argument('--region', help='AWS region')
    create_instance_parser.add_argument('--wait', action='store_true', default=True, help='Wait for instance to be running')
    
    # Start/stop/terminate commands
    start_instance_parser = ec2_subparsers.add_parser('start-instance', help='Start EC2 instance')
    start_instance_parser.add_argument('instance_id', help='Instance ID')
    start_instance_parser.add_argument('--region', help='AWS region')
    start_instance_parser.add_argument('--wait', action='store_true', default=True, help='Wait for instance to be running')
    
    stop_instance_parser = ec2_subparsers.add_parser('stop-instance', help='Stop EC2 instance')
    stop_instance_parser.add_argument('instance_id', help='Instance ID')
    stop_instance_parser.add_argument('--force', action='store_true', help='Force stop')
    stop_instance_parser.add_argument('--region', help='AWS region')
    stop_instance_parser.add_argument('--wait', action='store_true', default=True, help='Wait for instance to be stopped')
    
    terminate_instance_parser = ec2_subparsers.add_parser('terminate-instance', help='Terminate EC2 instance')
    terminate_instance_parser.add_argument('instance_id', help='Instance ID')
    terminate_instance_parser.add_argument('--region', help='AWS region')
    terminate_instance_parser.add_argument('--wait', action='store_true', default=True, help='Wait for instance to be terminated')
    
    # Deploy from GitHub command
    deploy_parser = ec2_subparsers.add_parser('deploy-from-github', help='Deploy from GitHub to EC2')
    deploy_parser.add_argument('--instance-id', required=True, help='EC2 instance ID')
    deploy_parser.add_argument('--repo', required=True, help='GitHub repository (owner/repo)')
    deploy_parser.add_argument('--branch', default='main', help='GitHub branch')
    deploy_parser.add_argument('--path', default='/var/www/html', help='Deployment path on instance')
    deploy_parser.add_argument('--setup-script', help='Setup script to run after deployment')
    deploy_parser.add_argument('--region', help='AWS region')


def setup_github_parser(subparsers):
    """Set up the argument parser for GitHub commands."""
    github_parser = subparsers.add_parser('github', help='GitHub operations')
    github_subparsers = github_parser.add_subparsers(dest='github_command', help='GitHub command')
    
    # List repositories command
    list_repos_parser = github_subparsers.add_parser('list-repos', help='List GitHub repositories')
    list_repos_parser.add_argument('--org', help='GitHub organization')
    list_repos_parser.add_argument('--user', help='GitHub username')
    list_repos_parser.add_argument('--output', choices=['json', 'table'], default='table', help='Output format')
    
    # Get repository command
    get_repo_parser = github_subparsers.add_parser('get-repo', help='Get GitHub repository details')
    get_repo_parser.add_argument('repo', help='Repository name or full path (owner/repo)')
    get_repo_parser.add_argument('--owner', help='Repository owner')
    get_repo_parser.add_argument('--output', choices=['json', 'table'], default='table', help='Output format')
    
    # Get README command
    get_readme_parser = github_subparsers.add_parser('get-readme', help='Get README from GitHub repository')
    get_readme_parser.add_argument('repo', help='Repository name or full path (owner/repo)')
    get_readme_parser.add_argument('--owner', help='Repository owner')
    get_readme_parser.add_argument('--ref', help='Git reference (branch, tag, commit)')
    
    # List branches command
    list_branches_parser = github_subparsers.add_parser('list-branches', help='List branches in GitHub repository')
    list_branches_parser.add_argument('repo', help='Repository name or full path (owner/repo)')
    list_branches_parser.add_argument('--owner', help='Repository owner')
    list_branches_parser.add_argument('--output', choices=['json', 'table'], default='table', help='Output format')


def setup_deploy_parser(subparsers):
    """Set up the argument parser for deployment commands."""
    deploy_parser = subparsers.add_parser('deploy', help='Deployment operations')
    deploy_subparsers = deploy_parser.add_subparsers(dest='deploy_command', help='Deployment command')
    
    # GitHub to AWS EC2
    github_to_ec2_parser = deploy_subparsers.add_parser('github-to-ec2', help='Deploy from GitHub to EC2')
    github_to_ec2_parser.add_argument('--repo', required=True, help='GitHub repository (owner/repo)')
    github_to_ec2_parser.add_argument('--instance-id', required=True, help='EC2 instance ID')
    github_to_ec2_parser.add_argument('--branch', default='main', help='GitHub branch')
    github_to_ec2_parser.add_argument('--path', default='/var/www/html', help='Deployment path on instance')
    github_to_ec2_parser.add_argument('--setup-script', help='Setup script to run after deployment')
    github_to_ec2_parser.add_argument('--region', help='AWS region')
    
    # GitHub to AWS S3 (static website)
    github_to_s3_parser = deploy_subparsers.add_parser('github-to-s3', help='Deploy from GitHub to S3')
    github_to_s3_parser.add_argument('--repo', required=True, help='GitHub repository (owner/repo)')
    github_to_s3_parser.add_argument('--bucket', required=True, help='S3 bucket name')
    github_to_s3_parser.add_argument('--branch', default='main', help='GitHub branch')
    github_to_s3_parser.add_argument('--source-dir', help='Source directory in repository')
    github_to_s3_parser.add_argument('--region', help='AWS region')


def format_output(data, format_type='table'):
    """Format output data based on format type."""
    if format_type == 'json':
        return json.dumps(data, indent=2, default=str)
    
    # Simple table format for common data structures
    if isinstance(data, list) and data and isinstance(data[0], dict):
        # Get all unique keys
        keys = set()
        for item in data:
            keys.update(item.keys())
        
        # Prioritize common fields
        priority_fields = ['id', 'name', 'instanceId', 'InstanceId', 'state', 'State', 'type', 'Type']
        ordered_keys = [k for k in priority_fields if k in keys]
        ordered_keys.extend([k for k in keys if k not in ordered_keys])
        
        # Create table header
        result = ' | '.join(ordered_keys) + '\n'
        result += '-' * len(result) + '\n'
        
        # Add rows
        for item in data:
            row = []
            for key in ordered_keys:
                value = item.get(key, '')
                if isinstance(value, dict) and 'Name' in value:
                    value = value['Name']
                row.append(str(value)[:30])
            result += ' | '.join(row) + '\n'
            
        return result
    
    # For single dict objects
    elif isinstance(data, dict):
        result = ''
        for key, value in data.items():
            if isinstance(value, dict):
                value = json.dumps(value, default=str)
            result += f"{key}: {value}\n"
        return result
    
    # Default to string representation
    return str(data)


def handle_ec2_command(args):
    """Handle EC2-related commands."""
    # Get AWS credentials
    try:
        cred_manager = get_credential_manager()
        aws_creds = cred_manager.get_aws_credentials(region=args.region)
        
        # Initialize EC2 service
        ec2 = EC2Service(credentials=aws_creds)
        
        if args.ec2_command == 'list-instances':
            filters = []
            if args.state:
                filters.append({
                    'Name': 'instance-state-name',
                    'Values': [args.state]
                })
            
            instances = ec2.list_instances(filters=filters if filters else None)
            
            # Simplify instance data for output
            simplified_instances = []
            for instance in instances:
                name = 'unnamed'
                for tag in instance.get('Tags', []):
                    if tag['Key'] == 'Name':
                        name = tag['Value']
                        break
                
                simplified_instances.append({
                    'InstanceId': instance['InstanceId'],
                    'Name': name,
                    'State': instance['State']['Name'],
                    'Type': instance['InstanceType'],
                    'LaunchTime': instance['LaunchTime']
                })
            
            if not simplified_instances:
                print(f"{COLORS['yellow']}No instances found.{COLORS['reset']}")
            else:
                print(format_output(simplified_instances, args.output))
            
        elif args.ec2_command == 'get-instance':
            try:
                instance = ec2.get_instance(args.instance_id)
                print(format_output(instance, args.output))
            except ResourceNotFoundError:
                print_error(
                    f"Instance {args.instance_id} not found",
                    suggestion="Check the instance ID and region."
                )
                return 1
                
        elif args.ec2_command == 'create-instance':
            security_group_ids = None
            if args.security_group_ids:
                security_group_ids = args.security_group_ids.split(',')
                
            instance = ec2.create_instance(
                    name=args.name,
                    instance_type=args.type,
                    ami_id=args.ami_id,
                    subnet_id=args.subnet_id,
                    security_group_ids=security_group_ids,
                    key_name=args.key_name,
                    wait=args.wait
                )
            print(f"{COLORS['green']}Created instance: {instance['InstanceId']}{COLORS['reset']}")
            print(format_output(instance, 'json'))
        
        elif args.ec2_command == 'start-instance':
            instance = ec2.start_instance(args.instance_id, wait=args.wait)
            print(f"{COLORS['green']}Started instance: {instance['InstanceId']}{COLORS['reset']}")
        
        elif args.ec2_command == 'stop-instance':
            instance = ec2.stop_instance(args.instance_id, force=args.force, wait=args.wait)
            print(f"{COLORS['green']}Stopped instance: {instance['InstanceId']}{COLORS['reset']}")
        
        elif args.ec2_command == 'terminate-instance':
            instance = ec2.terminate_instance(args.instance_id, wait=args.wait)
            print(f"{COLORS['green']}Terminated instance: {instance['InstanceId']}{COLORS['reset']}")
        
        elif args.ec2_command == 'deploy-from-github':
            # Get GitHub credentials
            github_creds = cred_manager.get_github_credentials()
            
            result = ec2.deploy_from_github(
                    instance_id=args.instance_id,
                    repository=args.repo,
                    branch=args.branch,
                    deploy_path=args.path,
                    setup_script=args.setup_script,
                    github_token=github_creds.token
                )
                
            status = result.get('status', 'unknown')
            if status.lower() in ['success', 'succeeded']:
                print(f"{COLORS['green']}Deployment status: {status}{COLORS['reset']}")
            else:
                print(f"{COLORS['yellow']}Deployment status: {status}{COLORS['reset']}")
                
            if result.get('output'):
                print(f"{COLORS['cyan']}Deployment output:{COLORS['reset']}")
                print(result['output'])
            if result.get('error'):
                print(f"{COLORS['red']}Deployment error:{COLORS['reset']}")
                print(result['error'])
        
        return 0
        
    except Exception as e:
        return handle_cli_error(e)


def handle_github_command(args):
    """Handle GitHub-related commands."""
    try:
        # Get GitHub credentials
        cred_manager = get_credential_manager()
        github_creds = cred_manager.get_github_credentials()
        
        # Initialize GitHub service
        github = GitHubService(token=github_creds.token)
        
        if args.github_command == 'list-repos':
            repos = github.list_repositories(org=args.org, user=args.user)
            
            # Simplify repo data for output
            simplified_repos = []
            for repo in repos:
                simplified_repos.append({
                    'Name': repo['name'],
                    'FullName': repo['full_name'],
                    'Description': repo.get('description', ''),
                    'DefaultBranch': repo['default_branch'],
                    'Stars': repo['stargazers_count'],
                    'Forks': repo['forks_count'],
                    'Language': repo.get('language', '')
                })
            
            if not simplified_repos:
                print(f"{COLORS['yellow']}No repositories found.{COLORS['reset']}")
            else:
                print(format_output(simplified_repos, args.output))
        
        elif args.github_command == 'get-repo':
            repo = github.get_repository(args.repo, owner=args.owner)
            print(format_output(repo, args.output))
        
        elif args.github_command == 'get-readme':
            readme = github.get_readme(args.repo, owner=args.owner, ref=args.ref)
            if 'decoded_content' in readme:
                print(readme['decoded_content'])
            else:
                print(format_output(readme, 'json'))
        
        elif args.github_command == 'list-branches':
            branches = github.list_branches(args.repo, owner=args.owner)
            
            # Simplify branch data for output
            simplified_branches = []
            for branch in branches:
                simplified_branches.append({
                    'Name': branch['name'],
                    'SHA': branch['commit']['sha'],
                    'Protected': branch.get('protected', False)
                })
            
            if not simplified_branches:
                print(f"{COLORS['yellow']}No branches found.{COLORS['reset']}")
            else:
                print(format_output(simplified_branches, args.output))
        
        return 0
        
    except Exception as e:
        return handle_cli_error(e)


def handle_deploy_command(args):
    """Handle deployment commands."""
    try:
        if args.deploy_command == 'github-to-ec2':
            # Get credentials
            cred_manager = get_credential_manager()
            aws_creds = cred_manager.get_aws_credentials(region=args.region)
            github_creds = cred_manager.get_github_credentials()
            
            # Initialize services
            ec2 = EC2Service(credentials=aws_creds)
            github = GitHubService(token=github_creds.token)
            
            # Verify GitHub repository exists
            repo_info = github.get_repository(args.repo)
            logger.info(f"Deploying from repository: {repo_info['full_name']}")
            
            # Verify EC2 instance exists
            instance = ec2.get_instance(args.instance_id)
            logger.info(f"Deploying to instance: {args.instance_id}")
            
            # Deploy from GitHub to EC2
            result = ec2.deploy_from_github(
                instance_id=args.instance_id,
                repository=args.repo,
                branch=args.branch,
                deploy_path=args.path,
                setup_script=args.setup_script,
                github_token=github_creds.token
            )
            
            status = result.get('status', 'unknown')
            if status.lower() in ['success', 'succeeded']:
                print(f"{COLORS['green']}Deployment status: {status}{COLORS['reset']}")
            else:
                print(f"{COLORS['yellow']}Deployment status: {status}{COLORS['reset']}")
                
            if result.get('output'):
                print(f"{COLORS['cyan']}Deployment output:{COLORS['reset']}")
                print(result['output'])
            if result.get('error'):
                print(f"{COLORS['red']}Deployment error:{COLORS['reset']}")
                print(result['error'])
        
        elif args.deploy_command == 'github-to-s3':
            print_error(
                "S3 deployment not yet implemented",
                suggestion="This feature is planned for a future release."
            )
            return 1
            
        return 0
        
    except Exception as e:
        return handle_cli_error(e)


def main():
    """Main entry point for the CLI."""
    try:
        parser = argparse.ArgumentParser(description='DevOps Agent CLI')
        parser.add_argument('--debug', action='store_true', help='Enable debug logging')
        
        # Create subparsers for different command groups
        subparsers = parser.add_subparsers(dest='command', help='Command group')
        
        # Set up command parsers
        setup_ec2_parser(subparsers)
        setup_github_parser(subparsers)
        setup_deploy_parser(subparsers)
        
        # Parse arguments
        args = parser.parse_args()
        
        # Set up logging
        if args.debug:
            logging.getLogger().setLevel(logging.DEBUG)
        
        # Exit if no command specified
        if not args.command:
            parser.print_help()
            sys.exit(1)
        
        # Handle commands
        if args.command == 'ec2':
            if not args.ec2_command:
                parser.parse_args(['ec2', '--help'])
                sys.exit(1)
            sys.exit(handle_ec2_command(args))
        
        elif args.command == 'github':
            if not args.github_command:
                parser.parse_args(['github', '--help'])
                sys.exit(1)
            sys.exit(handle_github_command(args))
        
        elif args.command == 'deploy':
            if not args.deploy_command:
                parser.parse_args(['deploy', '--help'])
                sys.exit(1)
            sys.exit(handle_deploy_command(args))
        
        sys.exit(0)
        
    except KeyboardInterrupt:
        print("\nOperation cancelled by user")
        sys.exit(130)  # Standard exit code for SIGINT
    except Exception as e:
        print_error("Unexpected error", f"Error: {e}")
        if args and args.debug:
            import traceback
            traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()