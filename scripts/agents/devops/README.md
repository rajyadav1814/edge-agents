# Agentic DevOps

A fully autonomous, AI-powered DevOps platform for managing cloud infrastructure across multiple providers, with AWS and GitHub integration, powered by OpenAI's Agents SDK.

*Created by rUv, from the Agentics Foundation*

## Introduction

Agentic DevOps represents the next evolution in infrastructure management—a fully autonomous system that doesn't just assist with DevOps tasks but can independently plan, execute, and optimize your entire infrastructure lifecycle. Built on the foundation of OpenAI's Agents SDK, this platform goes beyond traditional automation by incorporating true AI-driven decision-making capabilities.

The system can autonomously:
- Provision and configure infrastructure based on high-level requirements
- Monitor and detect anomalies across your environment
- Self-heal infrastructure issues without human intervention
- Optimize resource allocation and costs continuously
- Deploy applications with intelligent rollout strategies
- Manage complex multi-environment deployments
- Learn from past operations to improve future performance

Agentic DevOps serves as an intelligent co-pilot for your infrastructure—or even as a fully autonomous operator—understanding complex requirements, executing precise commands, adapting to changing conditions, and providing valuable insights across your entire DevOps workflow. Whether you're managing AWS resources, working with GitHub repositories, or orchestrating complex deployments, Agentic DevOps provides a unified, intelligent interface that simplifies these tasks while maintaining security and best practices.

## Overview

Agentic DevOps is designed to transform cloud infrastructure management through autonomous operation and intelligent decision-making. It provides a consistent interface for working with various cloud providers and services while adding a layer of AI-driven automation that can operate independently when needed.

Key benefits include:

- **Autonomous Operation**: Deploy infrastructure and applications with minimal human oversight
- **Self-Healing Systems**: Automatically detect and remediate issues before they impact users
- **Continuous Optimization**: Intelligently adjust resources based on actual usage patterns
- **Reduced Complexity**: Manage multiple cloud services through a single, intelligent interface
- **Increased Efficiency**: Eliminate repetitive tasks through true autonomous automation
- **Enhanced Security**: Built-in security guardrails with proactive vulnerability detection
- **Natural Language Control**: Interact with your infrastructure using plain English
- **Extensibility**: Easily add support for new services and providers
- **Comprehensive Documentation**: Detailed guides and examples for all features

## Features

### Core Capabilities

- **Autonomous Infrastructure Management**: AI-driven management of cloud resources
  - Self-provisioning infrastructure based on application requirements
  - Automatic scaling based on real-time demand
  - Intelligent resource optimization for cost efficiency
  - Anomaly detection and autonomous remediation
  - Continuous security posture improvement

- **AWS Infrastructure Management**: Comprehensive management of AWS services
  - EC2 instance lifecycle management (create, start, stop, terminate)
  - S3 bucket operations (create, list, upload, download)
  - VPC configuration and management
  - IAM role and policy management
  - CloudFormation template deployment
  - Lambda function management
  - ECS container orchestration
  - RDS database administration

- **GitHub Integration**: Seamless connection between code and infrastructure
  - Repository management
  - Issue and PR tracking
  - Code deployment pipelines
  - Webhook configuration
  - GitHub Actions integration
  - Repository statistics and analytics
  - Code scanning and security analysis

- **Autonomous Deployment**: Intelligent application deployment
  - Zero-touch continuous deployment
  - Automatic environment configuration
  - Intelligent rollback on failure detection
  - Progressive deployment with health monitoring
  - Traffic shifting based on real-time metrics
  - Deployment schedule optimization
  - Cross-environment consistency enforcement

- **Infrastructure as Code**: Deploy and manage resources from code
  - CloudFormation template generation and deployment
  - Terraform integration
  - Custom IaC template support
  - Version-controlled infrastructure
  - Drift detection and remediation

- **AI-Powered Assistance**: Leverage OpenAI's capabilities
  - Natural language infrastructure commands
  - Automated troubleshooting and diagnostics
  - Intelligent resource optimization recommendations
  - Security posture analysis
  - Cost optimization suggestions

### Advanced Features

- **Multi-Cloud Support**: Consistent interface across providers
  - AWS (primary support)
  - Azure (planned)
  - Google Cloud (planned)
  - DigitalOcean (planned)

- **Security and Compliance**:
  - Secure credential management with keyring integration
  - Least privilege access patterns
  - Compliance checking for industry standards
  - Security best practice enforcement
  - Audit logging and reporting

- **Observability and Monitoring**:
  - Resource health monitoring
  - Performance metrics collection
  - Cost tracking and optimization
  - Anomaly detection
  - Custom alerting rules

- **Deployment Automation**:
  - CI/CD pipeline integration
  - Blue/green deployment strategies
  - Canary releases
  - Rollback capabilities
  - Deployment verification

- **Disaster Recovery**:
  - Automated backup management
  - Cross-region replication
  - Recovery time objective (RTO) optimization
  - Disaster recovery testing
  - Failover automation

## Getting Started

### Prerequisites

- Python 3.8 or higher
- AWS account with programmatic access
- GitHub account (for GitHub integration features)
- OpenAI API key (for AI-powered features)
- Required Python packages (see requirements.txt)

### Installation

```bash
# Clone the repository
git clone https://github.com/agentics-foundation/agentic-devops.git
cd agentic-devops

# Install dependencies
pip install -r requirements.txt

# Configure credentials
cp env.example .env
# Edit .env with your AWS, GitHub, and OpenAI credentials
```

### Configuration

Agentic DevOps supports multiple configuration methods:

1. **Environment Variables**: Set credentials and configuration in your environment
2. **Configuration File**: Use YAML or JSON configuration files
3. **Credential Store**: Securely store credentials in your system's keyring
4. **AWS Profiles**: Leverage existing AWS CLI profiles

Example configuration file (`config.yaml`):

```yaml
aws:
  region: us-west-2
  profile: agentic-devops
  default_vpc: vpc-1234567890abcdef0
  
github:
  organization: your-organization
  default_branch: main
  
openai:
  model: gpt-4o
  temperature: 0.2
  
logging:
  level: INFO
  file: agentic-devops.log

autonomous:
  level: high  # Options: low, medium, high
  approval_required: false  # Set to true to require human approval for critical actions
  learning_enabled: true  # Enable learning from past operations
```

## Usage

### Python API

```python
from agentic_devops.aws.ec2 import EC2Service
from agentic_devops.aws.s3 import S3Service
from agentic_devops.github import GitHubService
from agentic_devops.core.context import DevOpsContext

# Initialize context
context = DevOpsContext(
    user_id="user123",
    aws_region="us-west-2",
    github_org="your-organization"
)

# Initialize services
ec2 = EC2Service(context=context)
s3 = S3Service(context=context)
github = GitHubService(context=context)

# List EC2 instances
instances = ec2.list_instances(filters=[{"Name": "instance-state-name", "Values": ["running"]}])
print(f"Found {len(instances)} running EC2 instances")

# Create S3 bucket with encryption
bucket = s3.create_bucket(
    name="my-secure-bucket",
    region="us-west-2",
    encryption={"algorithm": "AES256"},
    versioning=True
)

# Deploy from GitHub to EC2
ec2.deploy_from_github(
    instance_id="i-1234567890abcdef0",
    repository="your-org/your-repo",
    branch="main",
    deploy_path="/var/www/html",
    setup_script="scripts/setup.sh",
    environment_variables={"ENV": "production"}
)
```

### Autonomous Deployment Example

```python
from agentic_devops.autonomous import AutonomousDeployer
from agentic_devops.core.context import DevOpsContext

# Initialize context
context = DevOpsContext(
    user_id="user123",
    aws_region="us-west-2",
    github_org="your-organization"
)

# Initialize the autonomous deployer
deployer = AutonomousDeployer(context=context)

# Define high-level deployment requirements
deployment_spec = {
    "application": "web-service",
    "source": {
        "type": "github",
        "repository": "your-org/web-service",
        "branch": "main"
    },
    "target": {
        "environment": "production",
        "regions": ["us-west-2", "us-east-1"],
        "scaling": {
            "min_instances": 2,
            "max_instances": 10,
            "auto_scale": True
        }
    },
    "strategy": {
        "type": "blue-green",
        "health_check_path": "/health",
        "rollback_on_failure": True
    },
    "notifications": {
        "slack_channel": "#deployments",
        "email": "team@example.com"
    }
}

# Let the autonomous system handle the entire deployment
deployment = deployer.deploy(deployment_spec)

# Monitor the autonomous deployment
status = deployer.get_status(deployment.id)
print(f"Deployment status: {status.phase}")
print(f"Actions taken: {len(status.actions)}")
for action in status.actions:
    print(f"- {action.timestamp}: {action.description} ({action.status})")
```

### CLI Usage

Agentic DevOps provides a powerful command-line interface with rich output formatting:

```bash
# List EC2 instances with filtering and formatting
agentic-devops ec2 list-instances --state running --region us-west-2 --output table

# Create an EC2 instance with detailed configuration
agentic-devops ec2 create-instance \
  --name "web-server" \
  --type t3.medium \
  --ami-id ami-0c55b159cbfafe1f0 \
  --subnet-id subnet-1234567890abcdef0 \
  --security-group-ids sg-1234567890abcdef0 \
  --key-name my-key \
  --user-data-file startup-script.sh \
  --tags "Environment=Production,Project=Website" \
  --wait

# Get GitHub repository details with specific information
agentic-devops github get-repo your-org/your-repo --output json

# Create a GitHub issue with labels and assignees
agentic-devops github create-issue \
  --repo your-org/your-repo \
  --title "Update dependencies" \
  --body "We need to update all dependencies to the latest versions." \
  --labels "maintenance,dependencies" \
  --assignees "username1,username2"

# Autonomous deployment with high-level requirements
agentic-devops autonomous deploy \
  --app "web-service" \
  --source "github:your-org/web-service:main" \
  --environment production \
  --regions "us-west-2,us-east-1" \
  --strategy blue-green \
  --auto-scale \
  --notify "slack:#deployments,email:team@example.com"
```

## OpenAI Agents Integration

Agentic DevOps leverages OpenAI's Agents SDK to provide powerful AI-driven infrastructure management capabilities. This integration enables natural language interactions with your cloud resources, intelligent automation, and context-aware assistance.

### Key Benefits of OpenAI Agents Integration

- **Natural Language Infrastructure Control**: Manage your infrastructure using plain English commands
- **Context-Aware Operations**: The agent maintains context across interactions for more coherent workflows
- **Intelligent Automation**: Automate complex tasks with AI-driven decision making
- **Adaptive Learning**: Improve over time based on your specific infrastructure patterns
- **Multi-Step Reasoning**: Break down complex operations into logical steps
- **Guardrails and Safety**: Built-in safeguards to prevent destructive operations

### Agent Architecture

Agentic DevOps uses a modular architecture with specialized agents for different domains:

1. **EC2 Agent**: Specializes in EC2 instance management
2. **S3 Agent**: Focuses on S3 bucket operations
3. **GitHub Agent**: Handles GitHub repository management
4. **Deployment Agent**: Orchestrates deployment workflows
5. **Orchestrator Agent**: Coordinates between specialized agents

Each agent is equipped with domain-specific tools and knowledge, allowing for deep expertise in their respective areas while maintaining a unified interface for the user.

### Basic Usage Example

```python
from agents import Agent, Runner
from agentic_devops.agents.tools import (
    list_ec2_instances,
    start_ec2_instances,
    stop_ec2_instances,
    create_ec2_instance
)
from agentic_devops.core.context import DevOpsContext

# Create a context with user information
context = DevOpsContext(
    user_id="user123",
    aws_region="us-west-2",
    github_org="your-organization"
)

# Create an EC2-focused agent
ec2_agent = Agent(
    name="EC2 Assistant",
    instructions="""
    You are an EC2 management assistant that helps users manage their AWS EC2 instances.
    You can list, start, stop, and create EC2 instances based on user requests.
    Always confirm important actions before executing them and provide clear explanations.
    """,
    tools=[
        list_ec2_instances,
        start_ec2_instances,
        stop_ec2_instances,
        create_ec2_instance
    ],
    model="gpt-4o"
)

# Run the agent with a user query
result = Runner.run_sync(
    ec2_agent,
    "I need to launch 3 t2.micro instances for a web application in us-west-2. They should have the tag 'Project=WebApp'.",
    context=context
)

print(result.final_output)
```

### Advanced Agent Orchestration

For more complex workflows, you can use agent orchestration to coordinate between specialized agents:

```python
from agents import Agent, Runner, Handoff
from agentic_devops.agents.tools import (
    # EC2 tools
    list_ec2_instances,
    start_ec2_instances,
    stop_ec2_instances,
    create_ec2_instance,
    # S3 tools
    list_s3_buckets,
    create_s3_bucket,
    # GitHub tools
    get_github_repository,
    list_github_issues,
    create_github_issue,
    # Deployment tools
    deploy_to_ec2
)

# Create specialized agents
ec2_agent = Agent(
    name="EC2 Agent",
    instructions="You are an EC2 management specialist...",
    tools=[list_ec2_instances, start_ec2_instances, stop_ec2_instances, create_ec2_instance],
    model="gpt-4o"
)

s3_agent = Agent(
    name="S3 Agent",
    instructions="You are an S3 management specialist...",
    tools=[list_s3_buckets, create_s3_bucket],
    model="gpt-4o"
)

github_agent = Agent(
    name="GitHub Agent",
    instructions="You are a GitHub management specialist...",
    tools=[get_github_repository, list_github_issues, create_github_issue],
    model="gpt-4o"
)

deployment_agent = Agent(
    name="Deployment Agent",
    instructions="You are a deployment specialist...",
    tools=[deploy_to_ec2],
    model="gpt-4o"
)

# Create an orchestrator agent that can delegate to specialized agents
orchestrator = Agent(
    name="DevOps Orchestrator",
    instructions="""
    You are a DevOps orchestrator that helps users manage their cloud infrastructure and code repositories.
    You can delegate tasks to specialized agents for EC2, S3, GitHub, and deployments.
    Determine which specialized agent is best suited for each user request and hand off accordingly.
    """,
    handoffs=[
        Handoff(agent=ec2_agent, description="Handles EC2 instance management tasks"),
        Handoff(agent=s3_agent, description="Handles S3 bucket operations"),
        Handoff(agent=github_agent, description="Handles GitHub repository management"),
        Handoff(agent=deployment_agent, description="Handles deployment workflows")
    ],
    model="gpt-4o"
)

# Run the orchestrator with a complex query
result = Runner.run_sync(
    orchestrator,
    """
    I need to set up a new web application deployment:
    1. Create 2 t2.micro EC2 instances with the tag 'Project=WebApp'
    2. Create an S3 bucket for static assets with versioning enabled
    3. Clone our 'company/webapp' GitHub repository to the EC2 instances
    4. Create a GitHub issue to track this deployment
    """,
    context=context
)

print(result.final_output)
```

### Asynchronous Agent Execution

For high-performance applications, you can use asynchronous execution:

```python
import asyncio
from agents import Runner

async def run_agent_async():
    result = await Runner.run(
        ec2_agent,
        "List all my EC2 instances in us-west-2 and show their status",
        context=context
    )
    return result.final_output

# Run the agent asynchronously
response = asyncio.run(run_agent_async())
print(response)
```

### Security Guardrails

Agentic DevOps includes built-in security guardrails to prevent destructive operations:

```python
from agentic_devops.core.guardrails import (
    security_guardrail,
    sensitive_info_guardrail
)

# Apply security guardrail to check for potentially harmful operations
@security_guardrail
def perform_operation(operation_details):
    # Implementation
    pass

# Apply sensitive information guardrail to prevent leaking credentials
@sensitive_info_guardrail
def generate_response(user_query, system_data):
    # Implementation
    pass
```

### Tracing and Debugging

For debugging and monitoring agent behavior, you can use the tracing functionality:

```python
from agents.tracing import set_tracing_enabled, get_trace

# Enable tracing
set_tracing_enabled(True)

# Run the agent
result = Runner.run_sync(ec2_agent, "List my EC2 instances", context=context)

# Get the trace for analysis
trace = get_trace()
print(f"Agent took {len(trace.steps)} steps to complete the task")
for step in trace.steps:
    print(f"Step: {step.type}, Duration: {step.duration}ms")
```

## Advanced Configuration

### Credential Management

Agentic DevOps provides multiple secure options for credential management:

1. **Environment Variables**: Traditional approach using environment variables
2. **AWS Profiles**: Leverage AWS CLI profiles for credential management
3. **Keyring Integration**: Store credentials securely in your system's keyring
4. **IAM Roles**: Use IAM roles for EC2 instances or Lambda functions
5. **Secrets Manager**: Retrieve credentials from AWS Secrets Manager or similar services

Example keyring setup:

```python
from agentic_devops.core.credentials import CredentialManager

# Store credentials securely
cred_manager = CredentialManager()
cred_manager.store_aws_credentials(
    access_key="YOUR_ACCESS_KEY",
    secret_key="YOUR_SECRET_KEY",
    region="us-west-2",
    profile_name="production"
)

cred_manager.store_github_credentials(
    token="YOUR_GITHUB_TOKEN",
    username="your-username"
)

# Retrieve credentials securely
aws_creds = cred_manager.get_aws_credentials(profile_name="production")
github_creds = cred_manager.get_github_credentials()
```

### Error Handling and Logging

Agentic DevOps provides comprehensive error handling with actionable suggestions:

```python
from agentic_devops.core.logging import setup_logging
from agentic_devops.aws.base import AWSServiceError, ResourceNotFoundError

# Setup logging
logger = setup_logging(level="INFO", log_file="agentic-devops.log")

try:
    # Attempt to perform an operation
    ec2.start_instance(instance_id="i-nonexistentid")
except ResourceNotFoundError as e:
    # Handle specific error with context
    logger.error(f"Could not find instance: {e}")
    logger.info(f"Suggestion: {e.suggestion}")
    # Take remedial action
except AWSServiceError as e:
    # Handle general AWS errors
    logger.error(f"AWS operation failed: {e}")
    logger.info(f"Suggestion: {e.suggestion}")
```

### Extensibility

Agentic DevOps is designed to be easily extended with new services and providers:

1. **Service Modules**: Add new AWS services by creating new service modules
2. **Cloud Providers**: Implement new cloud providers by following the provider interface
3. **Custom Tools**: Create custom tools for specific workflows
4. **Plugins**: Develop plugins to extend functionality

Example of creating a custom service:

```python
from agentic_devops.aws.base import AWSBaseService

class CustomService(AWSBaseService):
    """Custom service implementation."""
    
    SERVICE_NAME = "custom-service"
    
    def __init__(self, credentials=None, region=None):
        super().__init__(credentials, region)
        # Initialize service-specific resources
        
    def custom_operation(self, param1, param2):
        """Implement custom operation."""
        try:
            # Implement operation logic
            result = self._client.some_operation(
                Param1=param1,
                Param2=param2
            )
            return self._format_response(result)
        except Exception as e:
            # Handle and transform errors
            self.handle_error(e, "custom_operation")
```

### Creating Custom Agent Tools

You can extend the agent's capabilities by creating custom tools:

```python
from agents import function_tool
from pydantic import BaseModel, Field
from agentic_devops.core.context import DevOpsContext, RunContextWrapper

# Define the input schema for your tool
class CustomOperationInput(BaseModel):
    resource_id: str = Field(..., description="The ID of the resource to operate on")
    operation_type: str = Field(..., description="The type of operation to perform")
    parameters: dict = Field(default={}, description="Additional parameters for the operation")

# Create a function tool
@function_tool()
async def custom_operation(
    wrapper: RunContextWrapper[DevOpsContext],
    input_data: CustomOperationInput
) -> dict:
    """
    Perform a custom operation on a specified resource.
    
    Args:
        resource_id: The ID of the resource to operate on
        operation_type: The type of operation to perform (e.g., "analyze", "optimize", "backup")
        parameters: Additional parameters specific to the operation type
        
    Returns:
        A dictionary containing the operation results
    """
    # Access the context
    context = wrapper.context
    
    # Implement your custom logic
    result = {
        "resource_id": input_data.resource_id,
        "operation_type": input_data.operation_type,
        "status": "completed",
        "details": {
            "timestamp": "2023-01-01T00:00:00Z",
            "user": context.user_id,
            "region": context.aws_region,
            "parameters": input_data.parameters
        }
    }
    
    return result
```

## Testing

Agentic DevOps includes comprehensive testing capabilities:

```bash
# Run all tests
python run_all_tests.py

# Run specific test categories
python -m pytest tests/aws/
python -m pytest tests/github/
python -m pytest tests/test_cli.py

# Run tests with specific markers
python -m pytest -m "aws"
python -m pytest -m "integration"
python -m pytest -m "unit"
```

## Project Structure

```
agentic-devops/
├── src/                      # Source code
│   ├── aws/                  # AWS provider modules
│   │   ├── base.py           # Base AWS service class
│   │   ├── ec2.py            # EC2 service module
│   │   ├── s3.py             # S3 service module
│   │   ├── vpc.py            # VPC service module
│   │   ├── iam.py            # IAM service module
│   │   ├── cloudformation.py # CloudFormation service
│   │   ├── lambda_service.py # Lambda service
│   │   ├── ecs.py            # ECS service
│   │   └── rds.py            # RDS service
│   ├── github/               # GitHub integration
│   │   ├── github.py         # GitHub service module
│   │   ├── issues.py         # Issues management
│   │   ├── repos.py          # Repository management
│   │   └── actions.py        # GitHub Actions integration
│   ├── autonomous/           # Autonomous operations
│   │   ├── deployer.py       # Autonomous deployment
│   │   ├── optimizer.py      # Resource optimization
│   │   ├── monitor.py        # Autonomous monitoring
│   │   └── learner.py        # Learning system
│   ├── agents/               # OpenAI Agents integration
│   │   ├── tools/            # Agent tools
│   │   │   ├── ec2_tools.py  # EC2 tools
│   │   │   ├── s3_tools.py   # S3 tools
│   │   │   └── github_tools.py # GitHub tools
│   │   └── agents.py         # Agent definitions
│   └── core/                 # Core functionality
│       ├── config.py         # Configuration management
│       ├── credentials.py    # Credential handling
│       ├── context.py        # Context management
│       ├── logging.py        # Logging setup
│       └── guardrails.py     # Security guardrails
├── cli/                      # Command-line interface
│   ├── __init__.py
│   ├── main.py               # CLI entry point
│   ├── ec2.py                # EC2 commands
│   ├── s3.py                 # S3 commands
│   ├── github.py             # GitHub commands
│   └── deploy.py             # Deployment commands
├── tests/                    # Test suite
│   ├── aws/                  # AWS service tests
│   ├── github/               # GitHub integration tests
│   ├── core/                 # Core functionality tests
│   ├── test_cli.py           # CLI tests
│   └── test_openai_agents.py # OpenAI Agents tests
├── examples/                 # Example scripts
│   ├── ec2_examples.py       # EC2 usage examples
│   ├── s3_examples.py        # S3 usage examples
│   ├── github_examples.py    # GitHub usage examples
│   └── openai_agents_ec2_example.py # OpenAI Agents example
└── docs/                     # Documentation
    ├── quickstart.md         # Quick start guide
    ├── advanced_usage.md     # Advanced usage guide
    ├── error_handling.md     # Error handling guide
    ├── security.md           # Security best practices
    └── services/             # Service-specific documentation
        ├── ec2.md            # EC2 service documentation
        ├── s3.md             # S3 service documentation
        └── github.md         # GitHub service documentation
```

## Contributing

Contributions are welcome! Please check out our [contributing guidelines](docs/contributing.md) for details on how to get started.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/agentics-foundation/agentic-devops.git
cd agentic-devops

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install development dependencies
pip install -r requirements-dev.txt

# Run tests
python -m pytest

# Check code style
flake8 src tests
black src tests
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.