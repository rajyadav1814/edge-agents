/**
 * Mock GitHub API responses for testing
 */

/**
 * Mock GraphQL response for listing projects
 */
export const mockListProjectsResponse = {
  data: {
    organization: {
      projectsV2: {
        nodes: [
          {
            id: "PVT_kwDOABCD123",
            title: "Test Project 1",
            shortDescription: "A test project",
            url: "https://github.com/orgs/mock-org/projects/1",
            closed: false,
            createdAt: "2023-01-01T00:00:00Z",
            updatedAt: "2023-01-02T00:00:00Z"
          },
          {
            id: "PVT_kwDOABCD456",
            title: "Test Project 2",
            shortDescription: "Another test project",
            url: "https://github.com/orgs/mock-org/projects/2",
            closed: true,
            createdAt: "2023-02-01T00:00:00Z",
            updatedAt: "2023-02-02T00:00:00Z"
          }
        ],
        pageInfo: {
          hasNextPage: false,
          endCursor: "cursor123"
        }
      }
    }
  }
};

/**
 * Mock GraphQL response for getting a single project
 */
export const mockGetProjectResponse = {
  data: {
    organization: {
      projectV2: {
        id: "PVT_kwDOABCD123",
        title: "Test Project 1",
        shortDescription: "A test project",
        url: "https://github.com/orgs/mock-org/projects/1",
        closed: false,
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-02T00:00:00Z",
        fields: {
          nodes: [
            {
              id: "PVTF_lADOABCD123",
              name: "Status"
            },
            {
              id: "PVTF_lADOABCD456",
              name: "Priority",
              options: [
                {
                  id: "PVTFO_lADOABCD123",
                  name: "High",
                  color: "RED"
                },
                {
                  id: "PVTFO_lADOABCD456",
                  name: "Medium",
                  color: "YELLOW"
                },
                {
                  id: "PVTFO_lADOABCD789",
                  name: "Low",
                  color: "GREEN"
                }
              ]
            }
          ]
        }
      }
    }
  }
};

/**
 * Mock GraphQL response for getting project items
 */
export const mockGetProjectItemsResponse = {
  data: {
    node: {
      items: {
        nodes: [
          {
            id: "PVTI_lADOABCD123",
            content: {
              id: "I_kwDOABCD123",
              title: "Test Issue 1",
              number: 1,
              state: "OPEN",
              repository: {
                name: "test-repo"
              }
            },
            fieldValues: {
              nodes: [
                {
                  text: "In Progress",
                  field: {
                    name: "Status"
                  }
                },
                {
                  name: "High",
                  field: {
                    name: "Priority"
                  }
                }
              ]
            }
          },
          {
            id: "PVTI_lADOABCD456",
            content: {
              id: "PR_kwDOABCD456",
              title: "Test Pull Request 1",
              number: 2,
              state: "OPEN",
              repository: {
                name: "test-repo"
              }
            },
            fieldValues: {
              nodes: [
                {
                  text: "In Review",
                  field: {
                    name: "Status"
                  }
                },
                {
                  name: "Medium",
                  field: {
                    name: "Priority"
                  }
                }
              ]
            }
          }
        ],
        pageInfo: {
          hasNextPage: false,
          endCursor: "cursor456"
        }
      }
    }
  }
};

/**
 * Mock GraphQL response for adding an item to a project
 */
export const mockAddItemToProjectResponse = {
  data: {
    addProjectV2ItemById: {
      item: {
        id: "PVTI_lADOABCD789"
      }
    }
  }
};

/**
 * Mock GraphQL response for updating a project item field
 */
export const mockUpdateProjectItemFieldResponse = {
  data: {
    updateProjectV2ItemFieldValue: {
      projectV2Item: {
        id: "PVTI_lADOABCD123"
      }
    }
  }
};

/**
 * Mock GraphQL error response
 */
export const mockGraphQLErrorResponse = {
  errors: [
    {
      message: "Resource not found",
      locations: [{ line: 2, column: 3 }],
      path: ["organization", "projectV2"],
      extensions: {
        code: "NOT_FOUND"
      }
    }
  ]
};

/**
 * Mock REST API error response
 */
export const mockRestApiErrorResponse = {
  message: "Not Found",
  documentation_url: "https://docs.github.com/rest"
};

/**
 * Mock rate limit headers
 */
export const mockRateLimitHeaders = {
  "X-RateLimit-Limit": "5000",
  "X-RateLimit-Remaining": "4999",
  "X-RateLimit-Reset": String(Math.floor(Date.now() / 1000) + 3600)
};

/**
 * Mock pagination headers
 */
export const mockPaginationHeaders = {
  "Link": '<https://api.github.com/orgs/mock-org/repos?page=2>; rel="next", <https://api.github.com/orgs/mock-org/repos?page=3>; rel="last"'
};