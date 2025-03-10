# Deployment Guide for Agentic Edge Functions

This guide provides detailed instructions for deploying edge functions to production environments. It covers various deployment strategies, best practices, and troubleshooting tips.

## Deployment Options

### 1. Supabase Dashboard Deployment

The simplest way to deploy edge functions is through the Supabase Dashboard:

1. Navigate to your project in the [Supabase Dashboard](https://app.supabase.com)
2. Go to the "Edge Functions" section
3. Click "New Function" or select an existing function to update
4. Upload your function code or use the built-in editor
5. Configure environment variables
6. Deploy the function

### 2. Supabase CLI Deployment

For more control and automation, use the Supabase CLI:

```bash
# Deploy a specific function
supabase functions deploy function-name

# Deploy all functions
supabase functions deploy

# Deploy with specific environment variables
supabase functions deploy function-name --env-file .env.production
```

### 3. CI/CD Pipeline Deployment

For automated deployments, integrate with CI/CD pipelines:

#### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy Edge Functions

on:
  push:
    branches:
      - main
    paths:
      - 'supabase/functions/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest
      
      - name: Login to Supabase
        run: supabase login --token ${{ secrets.SUPABASE_ACCESS_TOKEN }}
      
      - name: Link project
        run: supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
      
      - name: Deploy functions
        run: supabase functions deploy
      
      - name: Set secrets
        run: |
          supabase secrets set \
            API_KEY=${{ secrets.API_KEY }} \
            DATABASE_URL=${{ secrets.DATABASE_URL }}
```

#### GitLab CI Example

```yaml
# .gitlab-ci.yml
stages:
  - deploy

deploy_edge_functions:
  stage: deploy
  image: node:16
  script:
    - npm install -g supabase
    - supabase login --token $SUPABASE_ACCESS_TOKEN
    - supabase link --project-ref $SUPABASE_PROJECT_REF
    - supabase functions deploy
    - supabase secrets set API_KEY=$API_KEY DATABASE_URL=$DATABASE_URL
  only:
    - main
    - changes:
      - supabase/functions/**/*
```

## Environment Configuration

### Production Environment Variables

Set environment variables for production:

```bash
# Set production environment variables
supabase secrets set --env-file .env.production

# Set individual variables
supabase secrets set API_KEY=your-production-api-key
```

### Environment-Specific Configuration

Create environment-specific configuration files:

```
.env.development
.env.staging
.env.production
```

Example `.env.production`:

```
API_KEY=your-production-api-key
DATABASE_URL=your-production-database-url
LOG_LEVEL=warn
DEBUG=false
```

## Deployment Strategies

### 1. Blue-Green Deployment

Blue-green deployment involves maintaining two identical production environments (blue and green). At any time, only one environment is live and serving production traffic.

1. Deploy to the inactive environment (e.g., green)
2. Test the new deployment
3. Switch traffic from the active environment (blue) to the newly deployed environment (green)
4. The previously active environment (blue) becomes inactive

This approach minimizes downtime and provides a quick rollback option.

### 2. Canary Deployment

Canary deployment involves gradually rolling out changes to a small subset of users before deploying to the entire infrastructure.

1. Deploy the new version alongside the old version
2. Route a small percentage of traffic to the new version
3. Monitor for any issues
4. Gradually increase traffic to the new version
5. Once confident, route all traffic to the new version

This approach reduces risk by limiting the impact of potential issues.

### 3. Feature Flags

Use feature flags to control the availability of features in production:

```typescript
// Example of using feature flags
const isFeatureEnabled = async (featureName: string): Promise<boolean> => {
  const featureFlags = JSON.parse(Deno.env.get("FEATURE_FLAGS") || "{}");
  return featureFlags[featureName] === true;
};

serve(async (req) => {
  // Check if a feature is enabled
  if (await isFeatureEnabled("new-algorithm")) {
    // Use new algorithm
    return newAlgorithm(req);
  } else {
    // Use old algorithm
    return oldAlgorithm(req);
  }
});
```

## Monitoring and Observability

### 1. Logging

Implement structured logging for better observability:

```typescript
// Structured logging
const logger = {
  info: (message: string, data?: any) => {
    console.log(JSON.stringify({
      level: "info",
      timestamp: new Date().toISOString(),
      message,
      ...data
    }));
  },
  error: (message: string, error?: Error, data?: any) => {
    console.error(JSON.stringify({
      level: "error",
      timestamp: new Date().toISOString(),
      message,
      error: error?.message,
      stack: error?.stack,
      ...data
    }));
  }
};

serve(async (req) => {
  try {
    logger.info("Request received", { path: new URL(req.url).pathname });
    // Process request
    return new Response("Success");
  } catch (error) {
    logger.error("Error processing request", error);
    return new Response("Error", { status: 500 });
  }
});
```

### 2. Metrics

Collect and monitor metrics for your edge functions:

```typescript
// Simple metrics collection
const metrics = {
  requestCount: 0,
  errorCount: 0,
  latencies: [] as number[],
  
  recordRequest: () => {
    metrics.requestCount++;
  },
  
  recordError: () => {
    metrics.errorCount++;
  },
  
  recordLatency: (latency: number) => {
    metrics.latencies.push(latency);
  },
  
  getMetrics: () => {
    const totalLatency = metrics.latencies.reduce((sum, latency) => sum + latency, 0);
    const avgLatency = metrics.latencies.length > 0 ? totalLatency / metrics.latencies.length : 0;
    
    return {
      requestCount: metrics.requestCount,
      errorCount: metrics.errorCount,
      errorRate: metrics.requestCount > 0 ? metrics.errorCount / metrics.requestCount : 0,
      avgLatency
    };
  }
};

serve(async (req) => {
  metrics.recordRequest();
  const startTime = Date.now();
  
  try {
    // Process request
    const response = new Response("Success");
    metrics.recordLatency(Date.now() - startTime);
    return response;
  } catch (error) {
    metrics.recordError();
    metrics.recordLatency(Date.now() - startTime);
    return new Response("Error", { status: 500 });
  }
});
```

### 3. Health Checks

Implement health checks for your edge functions:

```typescript
serve(async (req) => {
  const url = new URL(req.url);
  
  // Health check endpoint
  if (url.pathname === "/health") {
    // Check dependencies
    const databaseOk = await checkDatabase();
    const apiOk = await checkExternalApi();
    
    const status = databaseOk && apiOk ? 200 : 503;
    
    return new Response(
      JSON.stringify({
        status: status === 200 ? "ok" : "degraded",
        database: databaseOk ? "ok" : "error",
        api: apiOk ? "ok" : "error",
        version: "1.0.0",
        timestamp: new Date().toISOString()
      }),
      { 
        status,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
  
  // Regular request handling
  // ...
});

async function checkDatabase() {
  try {
    // Check database connection
    // ...
    return true;
  } catch (error) {
    return false;
  }
}

async function checkExternalApi() {
  try {
    // Check external API
    // ...
    return true;
  } catch (error) {
    return false;
  }
}
```

## Performance Optimization

### 1. Caching

Implement caching to improve performance:

```typescript
// Simple in-memory cache
const cache = new Map<string, { data: any, expiry: number }>();

async function cachedFetch(url: string, options?: RequestInit, ttl: number = 60000) {
  const cacheKey = `${url}:${JSON.stringify(options)}`;
  
  // Check cache
  const cachedItem = cache.get(cacheKey);
  if (cachedItem && cachedItem.expiry > Date.now()) {
    return cachedItem.data;
  }
  
  // Fetch data
  const response = await fetch(url, options);
  const data = await response.json();
  
  // Cache data
  cache.set(cacheKey, {
    data,
    expiry: Date.now() + ttl
  });
  
  return data;
}
```

### 2. Compression

Use compression for responses:

```typescript
import { compress } from "https://deno.land/x/compression@v0.1.0/mod.ts";

serve(async (req) => {
  // Generate response data
  const data = { /* large data object */ };
  
  // Compress response
  const compressed = await compress(JSON.stringify(data));
  
  return new Response(compressed, {
    headers: {
      "Content-Type": "application/json",
      "Content-Encoding": "gzip"
    }
  });
});
```

### 3. Lazy Loading

Implement lazy loading for expensive operations:

```typescript
// Lazy loading example
let expensiveResource: any = null;

async function getExpensiveResource() {
  if (!expensiveResource) {
    // Initialize the resource only when needed
    expensiveResource = await initializeExpensiveResource();
  }
  return expensiveResource;
}

async function initializeExpensiveResource() {
  // Expensive initialization
  // ...
  return { /* resource */ };
}
```

## Security Considerations

### 1. Authentication and Authorization

Implement proper authentication and authorization:

```typescript
serve(async (req) => {
  // Verify JWT token
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 });
  }
  
  const token = authHeader.split(" ")[1];
  
  try {
    // Verify token
    const payload = await verifyToken(token);
    
    // Check permissions
    if (!hasPermission(payload, "read:data")) {
      return new Response("Forbidden", { status: 403 });
    }
    
    // Process request
    // ...
    
    return new Response("Success");
  } catch (error) {
    return new Response("Unauthorized", { status: 401 });
  }
});

async function verifyToken(token: string) {
  // Verify JWT token
  // ...
  return { /* payload */ };
}

function hasPermission(payload: any, permission: string) {
  // Check if the user has the required permission
  // ...
  return true;
}
```

### 2. Input Validation

Validate all input data:

```typescript
serve(async (req) => {
  try {
    const data = await req.json();
    
    // Validate input
    if (!data.name || typeof data.name !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid name" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    
    if (!data.email || !isValidEmail(data.email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Process valid data
    // ...
    
    return new Response("Success");
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Invalid JSON" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
});

function isValidEmail(email: string) {
  // Validate email format
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
```

### 3. Rate Limiting

Implement rate limiting to prevent abuse:

```typescript
// Simple in-memory rate limiter
const rateLimiter = {
  requests: new Map<string, { count: number, resetTime: number }>(),
  
  isRateLimited: (ip: string, limit: number = 100, windowMs: number = 60000) => {
    const now = Date.now();
    const clientRequests = rateLimiter.requests.get(ip) || { count: 0, resetTime: now + windowMs };
    
    // Reset counter if the window has passed
    if (now > clientRequests.resetTime) {
      clientRequests.count = 1;
      clientRequests.resetTime = now + windowMs;
    } else {
      clientRequests.count++;
    }
    
    rateLimiter.requests.set(ip, clientRequests);
    
    return clientRequests.count > limit;
  }
};

serve(async (req) => {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  
  // Check rate limit
  if (rateLimiter.isRateLimited(ip)) {
    return new Response("Too Many Requests", { status: 429 });
  }
  
  // Process request
  // ...
  
  return new Response("Success");
});
```

## Troubleshooting

### 1. Deployment Failures

If deployment fails:

1. Check the Supabase CLI output for errors
2. Verify that your function code is valid
3. Check for syntax errors or unsupported features
4. Ensure all dependencies are properly imported
5. Verify that environment variables are correctly set

### 2. Runtime Errors

If your function throws runtime errors:

1. Check the function logs:
   ```bash
   supabase functions logs function-name
   ```
2. Add more detailed logging to your function
3. Test the function locally before deployment
4. Check for environment-specific issues

### 3. Performance Issues

If your function has performance issues:

1. Check for inefficient code or algorithms
2. Implement caching for expensive operations
3. Optimize database queries
4. Use compression for large responses
5. Monitor function execution time

## Resources

- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [Deno Deploy Documentation](https://deno.com/deploy/docs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)

---

Created by rUv, Agentics Foundation founder.