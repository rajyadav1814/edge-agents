# GitHub API Token Troubleshooting

## Issue Identified

We've identified that the GitHub API integration is failing with an "Unauthorized" error. This is because the GitHub token being used is not valid or doesn't have the necessary permissions.

## Testing Results

We created a test script (`test-token.ts`) to directly test the GitHub API with the provided token, and it confirmed that the token is not valid:

```
Response status: 401 Unauthorized
Error: Unauthorized
Response body: {"message":"Bad credentials","documentation_url":"https://docs.github.com/graphql","status":"401"}
```

## How to Fix

To fix this issue, you need to create a valid GitHub Personal Access Token with the appropriate permissions:

1. Go to your GitHub account settings
2. Navigate to Developer settings > Personal access tokens > Tokens (classic)
3. Click "Generate new token"
4. Give it a descriptive name
5. Select the following scopes:
   - `repo` (Full control of private repositories)
   - `read:org` (Read organization membership)
   - `read:user` (Read user profile data)
   - `read:project` (Read project data)
6. Click "Generate token"
7. Copy the token and update your environment variables

## Setting Up Environment Variables

Once you have a valid token, you can set it up in your environment:

```bash
# For local development
export GITHUB_TOKEN=your_new_token_here
export GITHUB_ORG=your_organization_name

# For Supabase deployment
supabase secrets set GITHUB_TOKEN=your_new_token_here
supabase secrets set GITHUB_ORG=your_organization_name
```

## Token Format Examples

For reference, here are examples of valid GitHub token formats:

1. Classic Personal Access Token (40 characters):
   ```
   bfaf456533376f6a8eb5a2aec05b64fcca812810
   ```

2. Fine-grained Personal Access Token:
   ```
   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
   ```

3. OAuth Token:
   ```
   gho_baf7ad57ea1b93b8b80a5dcc48ba884a627b
   ```

## Verifying Your Token

You can verify your token is working correctly by running the test script:

```bash
export GITHUB_TOKEN=your_new_token_here
deno run --allow-net --allow-env test-token.ts
```

A successful response will show your GitHub username and user information.

## Additional Resources

- [GitHub API Documentation](https://docs.github.com/en/rest)
- [Creating a Personal Access Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [GitHub GraphQL API](https://docs.github.com/en/graphql)