"""
Example implementation of GitHub operations using OpenAI Agents SDK.

This example demonstrates how to implement GitHub operations using the OpenAI Agents SDK.
It shows how to create function tools for GitHub operations and use them with an agent.
"""

import os
import json
from typing import List, Dict, Any, Optional
from github import Github, Repository, Issue, PullRequest
from pydantic import BaseModel, Field

# Import OpenAI Agents SDK
from agents import Agent, Runner, function_tool
from agents.tracing import set_tracing_disabled

# Disable tracing for this example
set_tracing_disabled(True)

# Set OpenAI API key from environment variable
if "OPENAI_API_KEY" not in os.environ:
    raise ValueError("OPENAI_API_KEY environment variable is required")

# Define Pydantic models for GitHub operations
class GitHubRepository(BaseModel):
    """Model representing a GitHub repository."""
    name: str = Field(..., description="The name of the repository")
    full_name: str = Field(..., description="The full name of the repository (owner/name)")
    description: Optional[str] = Field(None, description="The description of the repository")
    url: str = Field(..., description="The URL of the repository")
    default_branch: str = Field(..., description="The default branch of the repository")
    stars: int = Field(..., description="The number of stars the repository has")
    forks: int = Field(..., description="The number of forks the repository has")
    open_issues: int = Field(..., description="The number of open issues in the repository")
    language: Optional[str] = Field(None, description="The primary language of the repository")

class GitHubIssue(BaseModel):
    """Model representing a GitHub issue."""
    number: int = Field(..., description="The issue number")
    title: str = Field(..., description="The title of the issue")
    body: Optional[str] = Field(None, description="The body of the issue")
    state: str = Field(..., description="The state of the issue (open or closed)")
    created_at: str = Field(..., description="The creation date of the issue")
    updated_at: str = Field(..., description="The last update date of the issue")
    url: str = Field(..., description="The URL of the issue")
    labels: List[str] = Field(default_factory=list, description="The labels of the issue")
    assignees: List[str] = Field(default_factory=list, description="The assignees of the issue")

class GitHubPullRequest(BaseModel):
    """Model representing a GitHub pull request."""
    number: int = Field(..., description="The pull request number")
    title: str = Field(..., description="The title of the pull request")
    body: Optional[str] = Field(None, description="The body of the pull request")
    state: str = Field(..., description="The state of the pull request (open, closed, or merged)")
    created_at: str = Field(..., description="The creation date of the pull request")
    updated_at: str = Field(..., description="The last update date of the pull request")
    url: str = Field(..., description="The URL of the pull request")
    base_branch: str = Field(..., description="The base branch of the pull request")
    head_branch: str = Field(..., description="The head branch of the pull request")
    mergeable: Optional[bool] = Field(None, description="Whether the pull request is mergeable")

class GitHubRepoRequest(BaseModel):
    """Model for requesting GitHub repository operations."""
    owner: str = Field(..., description="The owner of the repository")
    repo: str = Field(..., description="The name of the repository")

class GitHubIssueRequest(BaseModel):
    """Model for requesting GitHub issue operations."""
    owner: str = Field(..., description="The owner of the repository")
    repo: str = Field(..., description="The name of the repository")
    issue_number: Optional[int] = Field(None, description="The issue number (for specific issue operations)")
    state: Optional[str] = Field(None, description="The state filter (open, closed, or all)")
    labels: Optional[List[str]] = Field(None, description="The labels filter")

class GitHubPRRequest(BaseModel):
    """Model for requesting GitHub pull request operations."""
    owner: str = Field(..., description="The owner of the repository")
    repo: str = Field(..., description="The name of the repository")
    pr_number: Optional[int] = Field(None, description="The pull request number (for specific PR operations)")
    state: Optional[str] = Field(None, description="The state filter (open, closed, or all)")

class GitHubCreateIssueRequest(BaseModel):
    """Model for creating a GitHub issue."""
    owner: str = Field(..., description="The owner of the repository")
    repo: str = Field(..., description="The name of the repository")
    title: str = Field(..., description="The title of the issue")
    body: str = Field(..., description="The body of the issue")
    labels: Optional[List[str]] = Field(None, description="The labels to apply to the issue")
    assignees: Optional[List[str]] = Field(None, description="The users to assign to the issue")

# Create GitHub function tools
@function_tool()
def get_repository(request: GitHubRepoRequest) -> GitHubRepository:
    """
    Get information about a GitHub repository.
    
    Args:
        request: Parameters for the repository request
        
    Returns:
        Repository information
    """
    # Create GitHub client
    github_token = os.environ.get("GITHUB_TOKEN")
    if not github_token:
        raise ValueError("GITHUB_TOKEN environment variable is required")
    
    g = Github(github_token)
    
    # Get repository
    repo = g.get_repo(f"{request.owner}/{request.repo}")
    
    # Create GitHubRepository object
    return GitHubRepository(
        name=repo.name,
        full_name=repo.full_name,
        description=repo.description,
        url=repo.html_url,
        default_branch=repo.default_branch,
        stars=repo.stargazers_count,
        forks=repo.forks_count,
        open_issues=repo.open_issues_count,
        language=repo.language
    )

@function_tool()
def list_issues(request: GitHubIssueRequest) -> List[GitHubIssue]:
    """
    List issues in a GitHub repository.
    
    Args:
        request: Parameters for the issue request
        
    Returns:
        List of issues
    """
    # Create GitHub client
    github_token = os.environ.get("GITHUB_TOKEN")
    if not github_token:
        raise ValueError("GITHUB_TOKEN environment variable is required")
    
    g = Github(github_token)
    
    # Get repository
    repo = g.get_repo(f"{request.owner}/{request.repo}")
    
    # Prepare parameters for get_issues
    params = {}
    if request.state:
        params['state'] = request.state
    if request.labels:
        params['labels'] = request.labels
    
    # Get issues
    issues = repo.get_issues(**params)
    
    # Create GitHubIssue objects
    result = []
    for issue in issues[:10]:  # Limit to 10 issues
        result.append(GitHubIssue(
            number=issue.number,
            title=issue.title,
            body=issue.body,
            state=issue.state,
            created_at=issue.created_at.isoformat(),
            updated_at=issue.updated_at.isoformat(),
            url=issue.html_url,
            labels=[label.name for label in issue.labels],
            assignees=[assignee.login for assignee in issue.assignees]
        ))
    
    return result

@function_tool()
def get_issue(request: GitHubIssueRequest) -> GitHubIssue:
    """
    Get a specific issue from a GitHub repository.
    
    Args:
        request: Parameters for the issue request
        
    Returns:
        Issue information
    """
    # Create GitHub client
    github_token = os.environ.get("GITHUB_TOKEN")
    if not github_token:
        raise ValueError("GITHUB_TOKEN environment variable is required")
    
    g = Github(github_token)
    
    # Get repository
    repo = g.get_repo(f"{request.owner}/{request.repo}")
    
    # Get issue
    if not request.issue_number:
        raise ValueError("issue_number is required")
    
    issue = repo.get_issue(request.issue_number)
    
    # Create GitHubIssue object
    return GitHubIssue(
        number=issue.number,
        title=issue.title,
        body=issue.body,
        state=issue.state,
        created_at=issue.created_at.isoformat(),
        updated_at=issue.updated_at.isoformat(),
        url=issue.html_url,
        labels=[label.name for label in issue.labels],
        assignees=[assignee.login for assignee in issue.assignees]
    )

@function_tool()
def create_issue(request: GitHubCreateIssueRequest) -> GitHubIssue:
    """
    Create a new issue in a GitHub repository.
    
    Args:
        request: Parameters for creating the issue
        
    Returns:
        Created issue information
    """
    # Create GitHub client
    github_token = os.environ.get("GITHUB_TOKEN")
    if not github_token:
        raise ValueError("GITHUB_TOKEN environment variable is required")
    
    g = Github(github_token)
    
    # Get repository
    repo = g.get_repo(f"{request.owner}/{request.repo}")
    
    # Create issue
    issue = repo.create_issue(
        title=request.title,
        body=request.body,
        labels=request.labels,
        assignees=request.assignees
    )
    
    # Create GitHubIssue object
    return GitHubIssue(
        number=issue.number,
        title=issue.title,
        body=issue.body,
        state=issue.state,
        created_at=issue.created_at.isoformat(),
        updated_at=issue.updated_at.isoformat(),
        url=issue.html_url,
        labels=[label.name for label in issue.labels],
        assignees=[assignee.login for assignee in issue.assignees]
    )

@function_tool()
def list_pull_requests(request: GitHubPRRequest) -> List[GitHubPullRequest]:
    """
    List pull requests in a GitHub repository.
    
    Args:
        request: Parameters for the pull request request
        
    Returns:
        List of pull requests
    """
    # Create GitHub client
    github_token = os.environ.get("GITHUB_TOKEN")
    if not github_token:
        raise ValueError("GITHUB_TOKEN environment variable is required")
    
    g = Github(github_token)
    
    # Get repository
    repo = g.get_repo(f"{request.owner}/{request.repo}")
    
    # Prepare parameters for get_pulls
    params = {}
    if request.state:
        params['state'] = request.state
    
    # Get pull requests
    pulls = repo.get_pulls(**params)
    
    # Create GitHubPullRequest objects
    result = []
    for pr in pulls[:10]:  # Limit to 10 PRs
        result.append(GitHubPullRequest(
            number=pr.number,
            title=pr.title,
            body=pr.body,
            state="merged" if pr.merged else pr.state,
            created_at=pr.created_at.isoformat(),
            updated_at=pr.updated_at.isoformat(),
            url=pr.html_url,
            base_branch=pr.base.ref,
            head_branch=pr.head.ref,
            mergeable=pr.mergeable
        ))
    
    return result

# Create GitHub agent
github_agent = Agent(
    name="GitHub Agent",
    instructions="""
    You are a GitHub management agent that helps users manage their GitHub repositories, issues, and pull requests.
    You can get repository information, list issues and pull requests, get specific issues, and create new issues.
    
    When listing issues or pull requests, provide a clear summary of each item including its number, title, state, and URL.
    When getting repository information, provide a summary of the repository including its name, description, stars, forks, and open issues.
    When creating issues, guide the user through the required parameters and confirm the creation.
    
    Always be helpful and provide clear explanations of GitHub concepts when needed.
    """,
    tools=[get_repository, list_issues, get_issue, create_issue, list_pull_requests],
    model="gpt-4o"
)

# Example usage
def run_github_agent_example():
    """Run an example conversation with the GitHub agent."""
    # Define a context object (can be any type)
    context = {}
    
    # Run the agent with a user query
    result = Runner.run_sync(
        github_agent,
        "Show me the open issues in the openai/openai-python repository",
        context=context
    )
    
    # Print the result
    print("Agent response:")
    print(result.final_output)
    
    # Print the conversation history
    print("\nConversation history:")
    for message in result.conversation:
        print(f"{message.role}: {message.content}")

if __name__ == "__main__":
    run_github_agent_example()