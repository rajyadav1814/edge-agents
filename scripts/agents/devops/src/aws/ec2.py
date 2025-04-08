"""
EC2 Service Module - Provides functionality for managing AWS EC2 resources.

This module enables management of EC2 instances, security groups, key pairs,
AMIs, and volumes, with integration for GitHub-based deployments.
"""

import os
import time
import logging
import base64
import json
from typing import Dict, Any, Optional, List, Union

from ..core.credentials import AWSCredentials
from .base import AWSBaseService, aws_operation, ResourceNotFoundError, ValidationError
from ..core.config import get_config

# Configure logging
logger = logging.getLogger(__name__)


class EC2Service(AWSBaseService):
    """
    Service class for managing AWS EC2 resources.
    
    Provides methods for creating, configuring, and managing EC2 instances
    and related resources like security groups, key pairs, and volumes.
    """
    
    SERVICE_NAME = "ec2"
    
    def __init__(
        self,
        credentials: Optional[AWSCredentials] = None,
        region: Optional[str] = None,
        profile_name: Optional[str] = None,
        endpoint_url: Optional[str] = None,
        skip_verification: bool = False
    ):
        self.skip_verification = skip_verification
        super().__init__(credentials, region, profile_name, endpoint_url)
    
    def _verify_access(self) -> None:
        """Verify EC2 access by describing instances."""
        if not self.skip_verification:
            try:
                self.client.describe_instances(MaxResults=5)
            except Exception as e:
                self.handle_error(e, "verify_ec2_access")
    
    #
    # Instance Management
    #
    
    @aws_operation("list_instances")
    def list_instances(
        self, 
        filters: Optional[List[Dict[str, Any]]] = None,
        instance_ids: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        List EC2 instances with optional filtering.
        
        Args:
            filters: List of filters to apply. Each filter is a dict with 'Name' and 'Values' keys.
                    Example: [{'Name': 'instance-state-name', 'Values': ['running']}]
            instance_ids: Optional list of instance IDs to filter by.
            
        Returns:
            List of instance details.
        """
        kwargs = {}
        if filters:
            kwargs['Filters'] = filters
        if instance_ids:
            kwargs['InstanceIds'] = instance_ids
            
        response = self.client.describe_instances(**kwargs)
        
        instances = []
        for reservation in response.get('Reservations', []):
            for instance in reservation.get('Instances', []):
                instances.append(instance)
                
        return instances
    
    @aws_operation("get_instance")
    def get_instance(self, instance_id: str) -> Dict[str, Any]:
        """
        Get details for a specific EC2 instance.
        
        Args:
            instance_id: The ID of the instance.
            
        Returns:
            Instance details.
            
        Raises:
            ResourceNotFoundError: If the instance does not exist.
        """
        instances = self.list_instances(instance_ids=[instance_id])
        if not instances:
            raise ResourceNotFoundError(f"Instance {instance_id} not found")
        return instances[0]
    
    @aws_operation("create_instance")
    def create_instance(
        self,
        name: str,
        instance_type: str,
        ami_id: str,
        subnet_id: Optional[str] = None,
        security_group_ids: Optional[List[str]] = None,
        key_name: Optional[str] = None,
        user_data: Optional[str] = None,
        block_device_mappings: Optional[List[Dict[str, Any]]] = None,
        iam_instance_profile: Optional[str] = None,
        tags: Optional[Dict[str, str]] = None,
        wait: bool = True
    ) -> Dict[str, Any]:
        """
        Create a new EC2 instance.
        
        Args:
            name: Name tag for the instance.
            instance_type: EC2 instance type (e.g., 't2.micro').
            ami_id: ID of the AMI to use.
            subnet_id: ID of the subnet to launch the instance in.
            security_group_ids: List of security group IDs.
            key_name: Name of the key pair to use.
            user_data: String of user data to provide to the instance.
            block_device_mappings: List of block device mappings.
            iam_instance_profile: IAM instance profile name or ARN.
            tags: Dictionary of tags to apply to the instance.
            wait: Whether to wait for the instance to be running.
            
        Returns:
            Details of the created instance.
        """
        run_args = {
            'ImageId': ami_id,
            'InstanceType': instance_type,
            'MinCount': 1,
            'MaxCount': 1
        }
        
        # Add optional parameters
        if subnet_id:
            run_args['SubnetId'] = subnet_id
        
        if security_group_ids:
            run_args['SecurityGroupIds'] = security_group_ids
        
        if key_name:
            run_args['KeyName'] = key_name
        
        if user_data:
            run_args['UserData'] = base64.b64encode(user_data.encode()).decode()
        
        if block_device_mappings:
            run_args['BlockDeviceMappings'] = block_device_mappings
        
        if iam_instance_profile:
            if iam_instance_profile.startswith('arn:'):
                run_args['IamInstanceProfile'] = {'Arn': iam_instance_profile}
            else:
                run_args['IamInstanceProfile'] = {'Name': iam_instance_profile}
        
        # Prepare tags
        all_tags = self.DEFAULT_TAGS.copy()
        all_tags['Name'] = name
        if tags:
            all_tags.update(tags)
            
        tag_specs = [{
            'ResourceType': 'instance',
            'Tags': [{'Key': k, 'Value': v} for k, v in all_tags.items()]
        }]
        
        run_args['TagSpecifications'] = tag_specs
        
        # Create the instance
        response = self.client.run_instances(**run_args)
        instance_id = response['Instances'][0]['InstanceId']
        
        # Wait for the instance to be running if requested
        if wait:
            self.wait_for('instance_running', {'InstanceIds': [instance_id]})
            
        # Get full instance details
        return self.get_instance(instance_id)
    
    @aws_operation("start_instance")
    def start_instance(self, instance_id: str, wait: bool = True) -> Dict[str, Any]:
        """
        Start a stopped EC2 instance.
        
        Args:
            instance_id: The ID of the instance to start.
            wait: Whether to wait for the instance to be running.
            
        Returns:
            Updated instance details.
        """
        self.client.start_instances(InstanceIds=[instance_id])
        
        if wait:
            self.wait_for('instance_running', {'InstanceIds': [instance_id]})
            
        return self.get_instance(instance_id)
    
    @aws_operation("stop_instance")
    def stop_instance(
        self, 
        instance_id: str, 
        force: bool = False, 
        wait: bool = True
    ) -> Dict[str, Any]:
        """
        Stop a running EC2 instance.
        
        Args:
            instance_id: The ID of the instance to stop.
            force: Whether to force stop the instance.
            wait: Whether to wait for the instance to be stopped.
            
        Returns:
            Updated instance details.
        """
        self.client.stop_instances(InstanceIds=[instance_id], Force=force)
        
        if wait:
            self.wait_for('instance_stopped', {'InstanceIds': [instance_id]})
            
        return self.get_instance(instance_id)
    
    @aws_operation("terminate_instance")
    def terminate_instance(self, instance_id: str, wait: bool = True) -> Dict[str, Any]:
        """
        Terminate an EC2 instance.
        
        Args:
            instance_id: The ID of the instance to terminate.
            wait: Whether to wait for the instance to be terminated.
            
        Returns:
            Final instance details.
        """
        self.client.terminate_instances(InstanceIds=[instance_id])
        
        if wait:
            self.wait_for('instance_terminated', {'InstanceIds': [instance_id]})
            
        return self.get_instance(instance_id)
    
    @aws_operation("reboot_instance")
    def reboot_instance(self, instance_id: str) -> Dict[str, Any]:
        """
        Reboot an EC2 instance.
        
        Args:
            instance_id: The ID of the instance to reboot.
            
        Returns:
            Updated instance details.
        """
        self.client.reboot_instances(InstanceIds=[instance_id])
        
        # Wait a moment for the reboot to initiate
        time.sleep(10)
            
        return self.get_instance(instance_id)
    
    @aws_operation("resize_instance")
    def resize_instance(
        self, 
        instance_id: str, 
        instance_type: str, 
        wait: bool = True
    ) -> Dict[str, Any]:
        """
        Change the instance type (resize) of an EC2 instance.
        
        Args:
            instance_id: The ID of the instance to resize.
            instance_type: The new instance type.
            wait: Whether to wait for the modification to complete.
            
        Returns:
            Updated instance details.
        """
        # Check if the instance is running
        instance = self.get_instance(instance_id)
        was_running = instance['State']['Name'] == 'running'
        
        # Stop the instance if it's running
        if was_running:
            self.stop_instance(instance_id, wait=True)
        
        # Change the instance type
        self.client.modify_instance_attribute(
            InstanceId=instance_id,
            InstanceType={'Value': instance_type}
        )
        
        # Restart the instance if it was previously running
        if was_running:
            self.start_instance(instance_id, wait=wait)
        
        return self.get_instance(instance_id)
    
    #
    # Security Group Management
    #
    
    @aws_operation("list_security_groups")
    def list_security_groups(
        self, 
        filters: Optional[List[Dict[str, Any]]] = None,
        group_ids: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        List EC2 security groups with optional filtering.
        
        Args:
            filters: List of filters to apply.
            group_ids: Optional list of security group IDs.
            
        Returns:
            List of security group details.
        """
        kwargs = {}
        if filters:
            kwargs['Filters'] = filters
        if group_ids:
            kwargs['GroupIds'] = group_ids
            
        response = self.client.describe_security_groups(**kwargs)
        return response.get('SecurityGroups', [])
    
    @aws_operation("get_security_group")
    def get_security_group(self, group_id: str) -> Dict[str, Any]:
        """
        Get details for a specific security group.
        
        Args:
            group_id: The ID of the security group.
            
        Returns:
            Security group details.
            
        Raises:
            ResourceNotFoundError: If the security group does not exist.
        """
        groups = self.list_security_groups(group_ids=[group_id])
        if not groups:
            raise ResourceNotFoundError(f"Security group {group_id} not found")
        return groups[0]
    
    @aws_operation("create_security_group")
    def create_security_group(
        self,
        name: str,
        description: str,
        vpc_id: Optional[str] = None,
        ingress_rules: Optional[List[Dict[str, Any]]] = None,
        egress_rules: Optional[List[Dict[str, Any]]] = None,
        tags: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        Create a new EC2 security group.
        
        Args:
            name: Name for the security group.
            description: Description for the security group.
            vpc_id: ID of the VPC to create the security group in.
            ingress_rules: List of ingress rules to add.
            egress_rules: List of egress rules to add.
            tags: Dictionary of tags to apply.
            
        Returns:
            Details of the created security group.
        """
        create_args = {
            'GroupName': name,
            'Description': description
        }
        
        if vpc_id:
            create_args['VpcId'] = vpc_id
        
        # Prepare tags
        all_tags = self.DEFAULT_TAGS.copy()
        all_tags['Name'] = name
        if tags:
            all_tags.update(tags)
            
        tag_specs = [{
            'ResourceType': 'security-group',
            'Tags': [{'Key': k, 'Value': v} for k, v in all_tags.items()]
        }]
        
        create_args['TagSpecifications'] = tag_specs
        
        # Create the security group
        response = self.client.create_security_group(**create_args)
        group_id = response['GroupId']
        
        # Add ingress rules if provided
        if ingress_rules:
            self.client.authorize_security_group_ingress(
                GroupId=group_id,
                IpPermissions=ingress_rules
            )
        
        # Add egress rules if provided
        if egress_rules:
            self.client.authorize_security_group_egress(
                GroupId=group_id,
                IpPermissions=egress_rules
            )
        
        return self.get_security_group(group_id)
    
    @aws_operation("delete_security_group")
    def delete_security_group(self, group_id: str) -> None:
        """
        Delete an EC2 security group.
        
        Args:
            group_id: The ID of the security group to delete.
        """
        self.client.delete_security_group(GroupId=group_id)
    
    #
    # Key Pair Management
    #
    
    @aws_operation("list_key_pairs")
    def list_key_pairs(
        self, 
        filters: Optional[List[Dict[str, Any]]] = None,
        key_names: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        List EC2 key pairs with optional filtering.
        
        Args:
            filters: List of filters to apply.
            key_names: Optional list of key pair names.
            
        Returns:
            List of key pair details.
        """
        kwargs = {}
        if filters:
            kwargs['Filters'] = filters
        if key_names:
            kwargs['KeyNames'] = key_names
            
        response = self.client.describe_key_pairs(**kwargs)
        return response.get('KeyPairs', [])
    
    @aws_operation("get_key_pair")
    def get_key_pair(self, key_name: str) -> Dict[str, Any]:
        """
        Get details for a specific key pair.
        
        Args:
            key_name: The name of the key pair.
            
        Returns:
            Key pair details.
            
        Raises:
            ResourceNotFoundError: If the key pair does not exist.
        """
        try:
            response = self.client.describe_key_pairs(KeyNames=[key_name])
            return response['KeyPairs'][0]
        except Exception as e:
            self.handle_error(e, "get_key_pair")
    
    @aws_operation("create_key_pair")
    def create_key_pair(
        self,
        key_name: str,
        save_to_file: Optional[str] = None,
        tags: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        Create a new EC2 key pair.
        
        Args:
            key_name: Name for the key pair.
            save_to_file: If provided, save the private key to this file path.
            tags: Dictionary of tags to apply.
            
        Returns:
            Details of the created key pair, including the private key.
        """
        # Prepare tags
        all_tags = self.DEFAULT_TAGS.copy()
        if tags:
            all_tags.update(tags)
            
        tag_specs = [{
            'ResourceType': 'key-pair',
            'Tags': [{'Key': k, 'Value': v} for k, v in all_tags.items()]
        }]
        
        # Create the key pair
        response = self.client.create_key_pair(
            KeyName=key_name,
            TagSpecifications=tag_specs
        )
        
        # Save the private key to a file if requested
        if save_to_file and 'KeyMaterial' in response:
            save_path = os.path.expanduser(save_to_file)
            os.makedirs(os.path.dirname(save_path), exist_ok=True)
            
            with open(save_path, 'w') as f:
                f.write(response['KeyMaterial'])
            
            # Set correct permissions for private key
            os.chmod(save_path, 0o600)
            
            logger.info(f"Private key saved to {save_path}")
        
        return response
    
    @aws_operation("delete_key_pair")
    def delete_key_pair(self, key_name: str) -> None:
        """
        Delete an EC2 key pair.
        
        Args:
            key_name: The name of the key pair to delete.
        """
        self.client.delete_key_pair(KeyName=key_name)
    
    #
    # AMI Management
    #
    
    @aws_operation("list_amis")
    def list_amis(
        self, 
        filters: Optional[List[Dict[str, Any]]] = None,
        owners: Optional[List[str]] = None,
        image_ids: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        List AMIs with optional filtering.
        
        Args:
            filters: List of filters to apply.
            owners: Optional list of AMI owners.
            image_ids: Optional list of AMI IDs.
            
        Returns:
            List of AMI details.
        """
        kwargs = {}
        if filters:
            kwargs['Filters'] = filters
        if owners:
            kwargs['Owners'] = owners
        if image_ids:
            kwargs['ImageIds'] = image_ids
            
        response = self.client.describe_images(**kwargs)
        return response.get('Images', [])
    
    @aws_operation("get_ami")
    def get_ami(self, image_id: str) -> Dict[str, Any]:
        """
        Get details for a specific AMI.
        
        Args:
            image_id: The ID of the AMI.
            
        Returns:
            AMI details.
            
        Raises:
            ResourceNotFoundError: If the AMI does not exist.
        """
        images = self.list_amis(image_ids=[image_id])
        if not images:
            raise ResourceNotFoundError(f"AMI {image_id} not found")
        return images[0]
    
    @aws_operation("create_ami")
    def create_ami(
        self,
        instance_id: str,
        name: str,
        description: Optional[str] = None,
        no_reboot: bool = False,
        tags: Optional[Dict[str, str]] = None,
        wait: bool = True
    ) -> Dict[str, Any]:
        """
        Create an AMI from an EC2 instance.
        
        Args:
            instance_id: The ID of the instance to create the AMI from.
            name: Name for the AMI.
            description: Description for the AMI.
            no_reboot: If True, do not reboot the instance before creating the AMI.
            tags: Dictionary of tags to apply.
            wait: Whether to wait for the AMI to be available.
            
        Returns:
            Details of the created AMI.
        """
        create_args = {
            'InstanceId': instance_id,
            'Name': name,
            'NoReboot': no_reboot
        }
        
        if description:
            create_args['Description'] = description
        
        # Prepare tags
        all_tags = self.DEFAULT_TAGS.copy()
        all_tags['Name'] = name
        if tags:
            all_tags.update(tags)
            
        tag_specs = [{
            'ResourceType': 'image',
            'Tags': [{'Key': k, 'Value': v} for k, v in all_tags.items()]
        }]
        
        create_args['TagSpecifications'] = tag_specs
        
        # Create the AMI
        response = self.client.create_image(**create_args)
        image_id = response['ImageId']
        
        # Wait for the AMI to be available if requested
        if wait:
            self.wait_for('image_available', {'ImageIds': [image_id]})
            
        return self.get_ami(image_id)
    
    @aws_operation("deregister_ami")
    def deregister_ami(self, image_id: str, delete_snapshots: bool = False) -> None:
        """
        Deregister an AMI.
        
        Args:
            image_id: The ID of the AMI to deregister.
            delete_snapshots: If True, also delete the snapshots associated with the AMI.
        """
        # Get snapshot IDs if needed
        snapshot_ids = []
        if delete_snapshots:
            image = self.get_ami(image_id)
            for bdm in image.get('BlockDeviceMappings', []):
                if 'Ebs' in bdm and 'SnapshotId' in bdm['Ebs']:
                    snapshot_ids.append(bdm['Ebs']['SnapshotId'])
        
        # Deregister the AMI
        self.client.deregister_image(ImageId=image_id)
        
        # Delete associated snapshots if requested
        if delete_snapshots and snapshot_ids:
            for snapshot_id in snapshot_ids:
                try:
                    self.client.delete_snapshot(SnapshotId=snapshot_id)
                except Exception as e:
                    logger.warning(f"Failed to delete snapshot {snapshot_id}: {e}")
    
    #
    # GitHub Integration
    #
    
    @aws_operation("deploy_from_github")
    def deploy_from_github(
        self,
        instance_id: str,
        repository: str,
        branch: str = 'main',
        deploy_path: str = '/var/www/html',
        setup_script: Optional[str] = None,
        github_token: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Deploy an application from a GitHub repository to an EC2 instance.
        
        Args:
            instance_id: The ID of the EC2 instance to deploy to.
            repository: The GitHub repository (format: 'owner/repo').
            branch: The branch to deploy from.
            deploy_path: The path on the instance to deploy to.
            setup_script: Optional path to a setup script to run after deployment.
            github_token: Optional GitHub token for private repositories.
            
        Returns:
            Deployment status and details.
        """
        from ..github import GitHubService
        from ..core.credentials import get_credential_manager
        
        # Get instance details
        instance = self.get_instance(instance_id)
        
        # Create GitHub service client
        if github_token:
            github = GitHubService(token=github_token)
        else:
            cred_manager = get_credential_manager()
            github_credentials = cred_manager.get_github_credentials()
            github = GitHubService(token=github_credentials.token)
        
        # Generate the deployment script
        deploy_cmd = f"""#!/bin/bash
set -e

# Install git if not already installed
if ! command -v git &> /dev/null; then
    if command -v apt-get &> /dev/null; then
        apt-get update
        apt-get install -y git
    elif command -v yum &> /dev/null; then
        yum install -y git
    fi
fi

# Create deployment directory
mkdir -p {deploy_path}

# Clone or update the repository
if [ -d "{deploy_path}/.git" ]; then
    cd {deploy_path}
    git fetch
    git checkout {branch}
    git pull
else
    # Clone with token if provided
    {"GIT_TOKEN=" + github_token if github_token else ""}
    if [ -n "$GIT_TOKEN" ]; then
        git clone https://x-access-token:$GIT_TOKEN@github.com/{repository}.git {deploy_path}
    else
        git clone https://github.com/{repository}.git {deploy_path}
    fi
    cd {deploy_path}
    git checkout {branch}
fi

# Run setup script if provided
{f"bash {setup_script}" if setup_script else "# No setup script provided"}

echo "Deployment completed successfully"
"""
        
        # Use Systems Manager to send the command to the instance
        try:
            ssm_client = self.session.client('ssm')
            
            response = ssm_client.send_command(
                InstanceIds=[instance_id],
                DocumentName='AWS-RunShellScript',
                Parameters={'commands': [deploy_cmd]},
                Comment=f'Deploy {repository} ({branch}) to {deploy_path}'
            )
            
            command_id = response['Command']['CommandId']
            
            # Wait for the command to complete
            waiter = ssm_client.get_waiter('command_executed')
            waiter.wait(
                CommandId=command_id,
                InstanceId=instance_id
            )
            
            # Get the command output
            output = ssm_client.get_command_invocation(
                CommandId=command_id,
                InstanceId=instance_id
            )
            
            return {
                'status': output['Status'],
                'instance_id': instance_id,
                'repository': repository,
                'branch': branch,
                'deploy_path': deploy_path,
                'output': output['StandardOutputContent'],
                'error': output['StandardErrorContent'] if output['StandardErrorContent'] else None
            }
            
        except Exception as e:
            # If SSM is not available, create a deployment user data script
            logger.warning(f"SSM deployment failed: {e}. Trying user data approach.")
            
            # Create user data for an update script
            user_data = f"""#!/bin/bash
{deploy_cmd}
"""
            
            # Convert to base64
            user_data_b64 = base64.b64encode(user_data.encode()).decode()
            
            # Update instance user data
            self.client.modify_instance_attribute(
                InstanceId=instance_id,
                UserData={'Value': user_data_b64}
            )
            
            # Reboot the instance to execute the user data script
            self.reboot_instance(instance_id)
            
            return {
                'status': 'Pending',
                'instance_id': instance_id,
                'repository': repository,
                'branch': branch,
                'deploy_path': deploy_path,
                'method': 'user_data',
                'message': 'Deployment initiated via user data script. Check instance logs for results.'
            }