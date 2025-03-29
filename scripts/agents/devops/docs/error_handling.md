# Error Handling in DevOps Agent

This document describes the error handling approach used in the DevOps Agent, including common error types, how they are handled, and how to troubleshoot issues.

## Error Types

The DevOps Agent handles several types of errors:

### Credential Errors

These errors occur when the agent cannot find or validate credentials for AWS or GitHub.

Examples:
- Missing AWS credentials
- Invalid AWS credentials
- Missing GitHub token
- Invalid GitHub token

### AWS Service Errors

These errors occur when AWS API operations fail.

Examples:
- Resource not found (e.g., EC2 instance, security group)
- Permission denied
- Validation errors (invalid parameters)
- Rate limit exceeded
- Resource limit exceeded

### GitHub Errors

These errors occur when GitHub API operations fail.

Examples:
- Repository not found
- Organization not found
- Authentication failed
- Rate limit exceeded

### CLI Errors

These errors occur when using the CLI incorrectly.

Examples:
- Missing required parameters
- Invalid command syntax
- Unsupported operations

## Error Handling Approach

The DevOps Agent uses a consistent approach to error handling:

1. **Specific Error Classes**: Each type of error has its own class, making it easy to identify and handle specific error conditions.

2. **Contextual Information**: Errors include context about what operation was being performed and what resource was being accessed.

3. **Suggestions**: Most errors include suggestions on how to fix the issue.

4. **Colored Output**: The CLI uses colored output to make errors more visible and easier to understand.

## Common Errors and Solutions

### AWS Credentials Not Found

```
ERROR: AWS credentials error
Error: No AWS credentials found

SUGGESTION: Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables, 
configure AWS CLI with 'aws configure', or specify a profile.
```

**Solution**: 
- Set AWS credentials as environment variables:
  ```bash
  export AWS_ACCESS_KEY_ID=your-access-key
  export AWS_SECRET_ACCESS_KEY=your-secret-key
  export AWS_REGION=your-region
  ```
- Or configure AWS CLI:
  ```bash
  aws configure
  ```

### GitHub Token Not Found

```
ERROR: GitHub credentials error
Error: No GitHub token found

SUGGESTION: Set the GITHUB_TOKEN environment variable, configure it in your settings, 
or provide it explicitly.
```

**Solution**:
- Set GitHub token as environment variable:
  ```bash
  export GITHUB_TOKEN=your-github-token
  ```

### Resource Not Found

```
ERROR: AWS operation failed: ResourceNotFoundError
Error: get_instance failed: Resource not found

SUGGESTION: Check if the instance 'i-1234567890abcdef0' exists and you have permission to access it.
```

**Solution**:
- Verify the resource ID is correct
- Check if the resource exists in the specified region
- Ensure you have permission to access the resource

### Permission Denied

```
ERROR: AWS operation failed: PermissionDeniedError
Error: list_instances failed: Permission denied - User is not authorized to perform this operation

SUGGESTION: Check your IAM permissions and ensure your credentials have the necessary access rights.
```

**Solution**:
- Review your IAM permissions
- Request additional permissions if needed
- Use a different IAM role or user with appropriate permissions

### Rate Limit Exceeded

```
ERROR: AWS operation failed: RateLimitError
Error: create_instance failed: Rate limit exceeded - Request rate limit exceeded

SUGGESTION: Wait for 30 seconds before retrying.
```

**Solution**:
- Wait for the specified time before retrying
- Implement exponential backoff in your scripts
- Reduce the frequency of API calls

## Debugging

For more detailed error information, use the `--debug` flag:

```bash
python -m src.cli --debug ec2 list-instances
```

This will enable debug logging, which includes:
- Full error stack traces
- Request and response details
- API call parameters

## Extending Error Handling

When adding new services or commands to the DevOps Agent, follow these guidelines:

1. Use the appropriate error classes from `src.aws.base` or `src.github.github`
2. Add contextual information to error messages
3. Include suggestions for fixing common errors
4. Use the `handle_error` method in service classes to handle service-specific errors
5. Use the `handle_cli_error` function in the CLI module to handle user-facing errors