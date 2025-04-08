"""
GitHub Tools Module - Provides function tools for GitHub operations with OpenAI Agents SDK.

This module implements function tools for getting repository details, listing issues,
creating issues, and listing pull requests, designed to be used with the OpenAI Agents SDK.
"""

import github
import logging
from typing import Dict, List, Any, Optional

from agents import function_tool
from agents.types import RunContext

from .github_models import (
    GitHubRepoRequest,
    GitHubIssueRequest,
    GitHubCreateIssueRequest,
    GitHubPRRequest,
    GitHubRepository,
    GitHubIssue,
    GitHubPullRequest
)
from ..core.context import DevOpsContext
from ..core.credentials import get_credential_manager

# Configure logging
logger = logging.getLogger(__name__)


def _get_github_client() -> github.Github:
    """
    Get an authenticated GitHub client.
    
    Returns:
        Authenticated GitHub client
    """
    # Get GitHub token from credentials manager
    cred_manager = get_credential_manager()
    github_credentials = cred_manager.get_github_credentials()
    
    # Create GitHub client
    return github.Github(github_credentials.token)


@function_tool()
async def get_repository(
    ctx: RunContext[DevOpsContext],
    request: GitHubRepoRequest
) -> GitHubRepository:
    """
    Get details for a GitHub repository.
    
    Args:
        ctx: Run context containing DevOpsContext
        request: Parameters for the repository request
        
    Returns:
        GitHubRepository object with repository details
    """
    logger.info(f"Getting repository details for {request.owner}/{request.repo}")
    
    # Get GitHub client
    g = _get_github_client()
    
    # Get repository
    repo = g.get_repo(f"{request.owner}/{request.repo}")
    
    # Convert to GitHubRepository model
    result = GitHubRepository(
        name=repo.name,
        full_name=repo.full_name,
        description=repo.description,
        url=repo.html_url,
        default_branch=repo.default_branch,
        stars=repo.stargazers_count,
        forks=repo.forks_count,
        open_issues=repo.open_issues_count,
        language=repo.language,
        private=repo.private,
        created_at=repo.created_at.isoformat() if repo.created_at else None,
        updated_at=repo.updated_at.isoformat() if repo.updated_at else None,
        topics=repo.get_topics() if hasattr(repo, 'get_topics') else None
    )
    
    logger.info(f"Retrieved repository details for {request.owner}/{request.repo}")
    return result


@function_tool()
async def list_issues(
    ctx: RunContext[DevOpsContext],
    request: GitHubIssueRequest
) -> List[GitHubIssue]:
    """
    List issues for a GitHub repository.
    
    Args:
        ctx: Run context containing DevOpsContext
        request: Parameters for the issue listing request
        
    Returns:
        List of GitHubIssue objects
    """
    logger.info(f"Listing issues for {request.owner}/{request.repo} with state={request.state}")
    
    # Get GitHub client
    g = _get_github_client()
    
    # Get repository
    repo = g.get_repo(f"{request.owner}/{request.repo}")
    
    # Prepare parameters for get_issues
    kwargs = {'state': request.state}
    
    if request.labels:
        kwargs['labels'] = request.labels
        
    if request.assignee:
        kwargs['assignee'] = request.assignee
        
    if request.creator:
        kwargs['creator'] = request.creator
        
    if request.mentioned:
        kwargs['mentioned'] = request.mentioned
        
    if request.sort:
        kwargs['sort'] = request.sort
        
    if request.direction:
        kwargs['direction'] = request.direction
        
    if request.since:
        kwargs['since'] = request.since
    
    # Get issues
    issues = repo.get_issues(**kwargs)
    
    # Convert to GitHubIssue models
    result = []
    for issue in issues:
        # Skip pull requests (GitHub considers PRs as issues)
        if issue.pull_request is not None:
            continue
            
        # Extract labels
        labels = [label.name for label in issue.labels]
        
        # Extract assignees
        assignees = [assignee.login for assignee in issue.assignees]
        
        # Create GitHubIssue model
        issue_model = GitHubIssue(
            number=issue.number,
            title=issue.title,
            body=issue.body,
            state=issue.state,
            created_at=issue.created_at.isoformat() if issue.created_at else None,
            updated_at=issue.updated_at.isoformat() if issue.updated_at else None,
            closed_at=issue.closed_at.isoformat() if issue.closed_at else None,
            url=issue.html_url,
            labels=labels,
            assignees=assignees,
            comments=issue.comments
        )
        
        result.append(issue_model)
    
    logger.info(f"Found {len(result)} issues for {request.owner}/{request.repo}")
    return result


@function_tool()
async def create_issue(
    ctx: RunContext[DevOpsContext],
    request: GitHubCreateIssueRequest
) -> GitHubIssue:
    """
    Create a new issue in a GitHub repository.
    
    Args:
        ctx: Run context containing DevOpsContext
        request: Parameters for the issue creation request
        
    Returns:
        GitHubIssue object for the created issue
    """
    logger.info(f"Creating issue in {request.owner}/{request.repo}: {request.title}")
    
    # Get GitHub client
    g = _get_github_client()
    
    # Get repository
    repo = g.get_repo(f"{request.owner}/{request.repo}")
    
    # Prepare parameters for create_issue
    kwargs = {
        'title': request.title,
        'body': request.body
    }
    
    if request.labels:
        kwargs['labels'] = request.labels
        
    if request.assignees:
        kwargs['assignees'] = request.assignees
        
    if request.milestone:
        kwargs['milestone'] = request.milestone
    
    # Create issue
    issue = repo.create_issue(**kwargs)
    
    # Extract labels
    labels = [label.name for label in issue.labels]
    
    # Extract assignees
    assignees = [assignee.login for assignee in issue.assignees]
    
    # Create GitHubIssue model
    result = GitHubIssue(
        number=issue.number,
        title=issue.title,
        body=issue.body,
        state=issue.state,
        created_at=issue.created_at.isoformat() if issue.created_at else None,
        updated_at=issue.updated_at.isoformat() if issue.updated_at else None,
        closed_at=issue.closed_at.isoformat() if issue.closed_at else None,
        url=issue.html_url,
        labels=labels,
        assignees=assignees,
        comments=issue.comments
    )
    
    logger.info(f"Created issue #{issue.number} in {request.owner}/{request.repo}")
    return result


@function_tool()
async def list_pull_requests(
    ctx: RunContext[DevOpsContext],
    request: GitHubPRRequest
) -> List[GitHubPullRequest]:
    """
    List pull requests for a GitHub repository.
    
    Args:
        ctx: Run context containing DevOpsContext
        request: Parameters for the pull request listing request
        
    Returns:
        List of GitHubPullRequest objects
    """
    logger.info(f"Listing pull requests for {request.owner}/{request.repo} with state={request.state}")
    
    # Get GitHub client
    g = _get_github_client()
    
    # Get repository
    repo = g.get_repo(f"{request.owner}/{request.repo}")
    
    # Prepare parameters for get_pulls
    kwargs = {'state': request.state}
    
    if request.sort:
        kwargs['sort'] = request.sort
        
    if request.direction:
        kwargs['direction'] = request.direction
        
    if request.base:
        kwargs['base'] = request.base
        
    if request.head:
        kwargs['head'] = request.head
    
    # Get pull requests
    pulls = repo.get_pulls(**kwargs)
    
    # Convert to GitHubPullRequest models
    result = []
    for pr in pulls:
        # Extract labels
        labels = [label.name for label in pr.labels]
        
        # Extract assignees
        assignees = [assignee.login for assignee in pr.assignees]
        
        # Extract requested reviewers
        requested_reviewers = [reviewer.login for reviewer in pr.get_review_requests()[0]]
        
        # Create GitHubPullRequest model
        pr_model = GitHubPullRequest(
            number=pr.number,
            title=pr.title,
            body=pr.body,
            state=pr.state,
            created_at=pr.created_at.isoformat() if pr.created_at else None,
            updated_at=pr.updated_at.isoformat() if pr.updated_at else None,
            closed_at=pr.closed_at.isoformat() if pr.closed_at else None,
            merged_at=pr.merged_at.isoformat() if pr.merged_at else None,
            url=pr.html_url,
            head_branch=pr.head.ref,
            base_branch=pr.base.ref,
            labels=labels,
            assignees=assignees,
            requested_reviewers=requested_reviewers,
            merged=pr.merged,
            mergeable=pr.mergeable,
            comments=pr.comments,
            commits=pr.commits,
            additions=pr.additions,
            deletions=pr.deletions,
            changed_files=pr.changed_files
        )
        
        result.append(pr_model)
    
    logger.info(f"Found {len(result)} pull requests for {request.owner}/{request.repo}")
    return result