# GitHub Projects Field Update API

This document describes the API for updating field values in GitHub Projects items, such as changing the status of an item.

## Overview

GitHub Projects (v2) allows you to add custom fields to your projects, such as:
- Status fields (To Do, In Progress, Done)
- Priority fields
- Date fields
- Number fields
- Text fields
- Single select fields

This API provides functionality to update these field values programmatically.

## Field Types

The current implementation supports updating single select fields (like Status). Future updates may add support for other field types.

## GraphQL Mutations

The following GraphQL mutation is used to update a field value:

```graphql
mutation UpdateProjectFieldValue($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
  updateProjectV2ItemFieldValue(
    input: {
      projectId: $projectId,
      itemId: $itemId,
      fieldId: $fieldId,
      value: {
        singleSelectOptionId: $optionId
      }
    }
  ) {
    projectV2Item {
      id
    }
  }
}
```

## MCP Tool: updateProjectFieldValue

### Description
Updates a field value for a project item (e.g., status)

### Parameters
- `projectId` (string, required): ID of the project
- `itemId` (string, required): ID of the project item
- `fieldId` (string, required): ID of the field to update
- `optionId` (string, required): ID of the single select option to set

### Returns
- The updated project item

### Example

```javascript
const result = await client.useTool('updateProjectFieldValue', {
  projectId: 'PVT_kwDOABCD',
  itemId: 'PVTI_lMDExMjM',
  fieldId: 'PVTF_lMDExMjM',
  optionId: 'f75ad846'
});
```

## Finding Field and Option IDs

To use this API, you need to know the IDs of:
1. The project
2. The item you want to update
3. The field you want to update
4. The option value you want to set

You can find these IDs using the `getProject` and `getProjectItems` tools:

```javascript
// Get project details including fields
const projectResult = await client.useTool('getProject', {
  organization: 'your-org',
  projectNumber: 1
});

// Find the Status field and its options
const statusField = projectResult.project.fields.nodes.find(field => 
  field.name === 'Status' && field.options
);

// Get the "Done" option
const doneOption = statusField.options.find(option => option.name === 'Done');

// Get project items
const itemsResult = await client.useTool('getProjectItems', {
  projectId: projectResult.project.id
});

// Update an item's status
await client.useTool('updateProjectFieldValue', {
  projectId: projectResult.project.id,
  itemId: itemsResult.items[0].id,
  fieldId: statusField.id,
  optionId: doneOption.id
});
```

See the [update-field-example.js](./examples/update-field-example.js) file for a complete example.

## Error Handling

The API will return appropriate error messages if:
- Any required parameters are missing
- The project, item, field, or option IDs are invalid
- You don't have permission to update the project
- The GitHub API returns an error

## Future Enhancements

Future versions of this API may include:
- Support for updating other field types (date, number, text)
- Batch updates for multiple items
- Field value validation
