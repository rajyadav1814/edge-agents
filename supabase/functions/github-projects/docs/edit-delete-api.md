 item# GitHub Projects Edit and Delete API

This document describes the edit and delete capabilities of the GitHub Projects API.

## Edit Project

Edit an existing GitHub Project.

### Tool: `editProject`

#### Parameters

- `projectId` (string, required): ID of the project to edit
- `title` (string, optional): New title for the project
- `description` (string, optional): New description for the project
- `public` (boolean, optional): Whether the project should be public

#### Example

```javascript
const result = await mcpClient.callTool('editProject', {
  projectId: 'PVT_kwDOC6dDnM4A2KkE',
  title: 'Updated Project Title',
  description: 'Updated project description'
});
```

## Delete Project

Delete a GitHub Project.

### Tool: `deleteProject`

#### Parameters

- `projectId` (string, required): ID of the project to delete

#### Example

```javascript
const result = await mcpClient.callTool('deleteProject', {
  projectId: 'PVT_kwDOC6dDnM4A2KkE'
});
```

## Edit Project Item

Edit an item in a GitHub Project.

### Tool: `editProjectItem`

#### Parameters

- `itemId` (string, required): ID of the project item to edit (ProjectV2Item ID)
- `title` (string, optional): New title for the item
- `body` (string, optional): New body content for the item

#### Important Notes

- Currently, only Draft Issues can be edited directly
- The `itemId` must be the ProjectV2Item ID (starts with `PVTI_`)
- The service will automatically retrieve the content ID for editing
- Regular Issues and Pull Requests cannot be edited with this tool

#### Example

```javascript
const result = await mcpClient.callTool('editProjectItem', {
  itemId: 'PVTI_lADOABCD123',
  title: 'Updated Item Title',
  body: 'Updated item description'
});
```

## Delete Project Item

Delete an item from a GitHub Project.

### Tool: `deleteProjectItem`

#### Parameters

- `itemId` (string, required): ID of the item to delete (ProjectV2Item ID)
- `projectId` (string, required): ID of the project containing the item

#### Example

```javascript
const result = await mcpClient.callTool('deleteProjectItem', {
  itemId: 'PVTI_lADOABCD123',
  projectId: 'PVT_kwDOC6dDnM4A2KkE'
});
```

## Response Format

All edit and delete operations return a standardized response format:

### Edit Operations

```javascript
{
  content: [
    {
      type: 'text',
      text: '...' // JSON string of the updated entity
    }
  ],
  project: { ... } // For editProject
  item: { ... }    // For editProjectItem
}
```

### Delete Operations

```javascript
{
  content: [
    {
      type: 'text',
      text: '...' // JSON string of the result
    }
  ],
  result: {
    success: true,
    projectId: '...' // For deleteProject
    itemId: '...'    // For deleteProjectItem
  }
}
```

## Error Handling

If an operation fails, the response will include an error message:

```javascript
{
  content: [
    {
      type: 'text',
      text: 'Error: [error message]'
    }
  ],
  isError: true
}
```

Common error scenarios:

1. Item not found: `Error: Item with ID PVTI_xxx not found`
2. Invalid item type: `Error: Editing PullRequest items is not supported in this version. Only DraftIssue items can be edited directly.`
3. Missing required fields: `Error: At least one update field is required`
4. Permission issues: `Error: GraphQL Error: Resource not accessible by integration`

## Implementation Notes

- All edit operations require at least one field to update
- Delete operations are permanent and cannot be undone
- You must have appropriate permissions in the GitHub organization to perform these operations
- The GitHub token used must have the `project` scope
- For editing regular Issues or Pull Requests, you would need to use the GitHub Issues API directly
- The service performs validation to ensure the item exists and is of the correct type before attempting to edit or delete it

## Troubleshooting

If you encounter issues with editing project items, check the following:

1. Make sure you're using the ProjectV2Item ID (starts with `PVTI_`), not the content ID
2. Verify that the item is a Draft Issue, as only Draft Issues can be edited directly
3. Ensure your GitHub token has the necessary permissions
4. Check that the item still exists and hasn't been deleted

For delete operations, both the item ID and project ID must be valid and the item must belong to the specified project.
