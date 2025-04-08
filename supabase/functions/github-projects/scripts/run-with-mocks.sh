#!/bin/bash
# Run GitHub API server with mock data for testing

# Colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}GitHub API Edge Function - Mock Testing Setup${NC}"

# Create a mock environment file
echo "Creating mock environment variables..."
export GITHUB_TOKEN="mock-github-token"
export GITHUB_ORG="mock-org"
export GITHUB_API_VERSION="v3"
export CACHE_TTL="300"
export USE_MOCKS="true"  # Special flag to use mock data

# Display the environment variables
echo -e "${GREEN}Mock environment variables set:${NC}"
echo "GITHUB_ORG: $GITHUB_ORG"
echo "GITHUB_API_VERSION: $GITHUB_API_VERSION"
echo "CACHE_TTL: $CACHE_TTL"
echo "GITHUB_TOKEN: [Mock Token]"
echo "USE_MOCKS: $USE_MOCKS"

# Create a temporary mock version of the server
echo -e "\n${YELLOW}Creating temporary mock server...${NC}"

# Create a temporary file
TEMP_FILE="index-mock.ts"

# Copy the index-test.ts file and modify it to use mocks
cat index-test.ts > $TEMP_FILE

# Add mock data handling to the temporary file
cat >> $TEMP_FILE << 'EOL'

// Mock data for testing
const mockData = {
  user: {
    login: "mock-user",
    name: "Mock User",
    avatar_url: "https://example.com/avatar.png"
  },
  organization: {
    login: "mock-org",
    name: "Mock Organization",
    description: "This is a mock organization for testing"
  },
  repositories: [
    {
      name: "mock-repo-1",
      full_name: "mock-org/mock-repo-1",
      description: "Mock repository 1",
      html_url: "https://github.com/mock-org/mock-repo-1"
    },
    {
      name: "mock-repo-2",
      full_name: "mock-org/mock-repo-2",
      description: "Mock repository 2",
      html_url: "https://github.com/mock-org/mock-repo-2"
    }
  ],
  projects: {
    organization: {
      projectsV2: {
        nodes: [
          {
            id: "PVT_1",
            title: "Mock Project 1",
            number: 1,
            url: "https://github.com/orgs/mock-org/projects/1"
          },
          {
            id: "PVT_2",
            title: "Mock Project 2",
            number: 2,
            url: "https://github.com/orgs/mock-org/projects/2"
          }
        ]
      }
    }
  },
  projectItems: {
    projectV2: {
      items: {
        nodes: [
          {
            id: "PVTI_1",
            content: {
              __typename: "Issue",
              title: "Mock Issue 1",
              number: 101
            }
          },
          {
            id: "PVTI_2",
            content: {
              __typename: "PullRequest",
              title: "Mock Pull Request 1",
              number: 201
            }
          }
        ]
      }
    }
  }
};

// Override the fetch function if USE_MOCKS is set
if (Deno.env.get('USE_MOCKS') === 'true') {
  const originalFetch = globalThis.fetch;
  
  // @ts-ignore - Override fetch
  globalThis.fetch = async (url: string | URL | Request, options?: RequestInit): Promise<Response> => {
    console.log(`Mock fetch called for: ${url.toString()}`);
    
    // Create mock response based on the URL
    const urlString = url.toString();
    
    // Mock GraphQL responses
    if (urlString.includes('graphql')) {
      // Parse the request body to determine what to return
      let body = {};
      if (options?.body) {
        try {
          if (typeof options.body === 'string') {
            body = JSON.parse(options.body);
          }
        } catch (e) {
          console.error('Error parsing request body:', e);
        }
      }
      
      // Check the query to determine what to return
      const query = body.query || '';
      
      if (query.includes('projectsV2')) {
        return new Response(JSON.stringify({ data: mockData.projects }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } else if (query.includes('items')) {
        return new Response(JSON.stringify({ data: mockData.projectItems }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Default GraphQL response
      return new Response(JSON.stringify({ data: { viewer: mockData.user } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Mock REST API responses
    if (urlString.includes('/user')) {
      return new Response(JSON.stringify(mockData.user), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else if (urlString.includes('/repos')) {
      return new Response(JSON.stringify(mockData.repositories), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else if (urlString.includes('/orgs')) {
      return new Response(JSON.stringify(mockData.organization), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Default response for unhandled URLs
