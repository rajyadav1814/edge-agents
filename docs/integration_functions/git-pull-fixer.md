# Git Pull Fixer

The git-pull-fixer edge function automates the process of fixing common Git pull request issues.

## Features

- Automated PR fixes
- Conflict resolution
- Branch synchronization
- Status checks management

## Configuration

Required environment variables:
```
GITHUB_TOKEN=your_github_token
```

## Usage

```bash
# Fix a pull request
curl -X POST https://your-project.supabase.co/functions/v1/git-pull-fixer \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -d '{
    "repository": "owner/repo",
    "pullRequest": 123
  }'
```

## API Reference

### Endpoints

POST `/git-pull-fixer`

Request body:
```json
{
  "repository": "string",
  "pullRequest": "number",
  "options": {
    "autoMerge": "boolean",
    "fixConflicts": "boolean",
    "syncBranch": "boolean"
  }
}
```

Response:
```json
{
  "success": true,
  "fixes": [
    {
      "type": "string",
      "description": "string",
      "status": "success | failed | skipped"
    }
  ],
  "pullRequest": {
    "number": "number",
    "status": "string",
    "mergeable": "boolean"
  }
}