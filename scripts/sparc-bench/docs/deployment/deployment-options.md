# Deployment Options

This guide covers various deployment options for SPARC-Bench, allowing you to run benchmarks in different environments and integrate them into your workflow.

## Local Deployment

### Basic Local Setup

The simplest way to run SPARC-Bench is locally on your development machine:

1. Clone the repository:
```bash
git clone https://github.com/your-org/edge-agents.git
cd edge-agents/scripts/sparc-bench
```

2. Install dependencies:
```bash
# Make sure Deno is installed
curl -fsSL https://deno.land/x/install/install.sh | sh
```

3. Run benchmarks:
```bash
deno run --allow-read --allow-write --allow-env --allow-net sparc-bench.ts run --all
```

### Local Development Environment

For development and testing, you can set up a more comprehensive environment:

1. Create a development configuration:
```toml
# dev-config.toml
[benchmark]
name = "SPARC2 Development Benchmark Suite"
version = "1.0.0-dev"

[metrics]
include = ["accuracy", "efficiency", "safety", "adaptability"]

[agent]
sizes = ["small"]
tokenCacheEnabled = true
maxParallelAgents = 1

[execution]
processing = "sequential"
maxConcurrent = 1
cacheResults = true
cacheDir = "./dev-cache"
resultsDir = "./dev-results"

[logging]
level = "debug"
file = "./logs/dev.log"
format = "text"
colors = true
```

2. Run with the development configuration:
```bash
deno run --allow-read --allow-write --allow-env --allow-net sparc-bench.ts run --config dev-config.toml
```

## Continuous Integration

### GitHub Actions

You can integrate SPARC-Bench into your GitHub Actions workflow:

1. Create a GitHub Actions workflow file:
```yaml
# .github/workflows/benchmark.yml
name: SPARC2 Benchmarks

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 0 * * 0'  # Run weekly on Sundays

jobs:
  benchmark:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Deno
        uses: denoland/setup-deno@v1
        with:
          deno-version: v1.37.0
      
      - name: Run Benchmarks
        run: |
          cd scripts/sparc-bench
          deno run --allow-read --allow-write --allow-env --allow-net sparc-bench.ts run --all
        env:
          E2B_API_KEY: ${{ secrets.E2B_API_KEY }}
      
      - name: Upload Results
        uses: actions/upload-artifact@v3
        with:
          name: benchmark-results
          path: scripts/sparc-bench/results/
```

### GitLab CI

For GitLab CI integration:

```yaml
# .gitlab-ci.yml
stages:
  - benchmark

sparc2-benchmark:
  stage: benchmark
  image: denoland/deno:1.37.0
  script:
    - cd scripts/sparc-bench
    - deno run --allow-read --allow-write --allow-env --allow-net sparc-bench.ts run --all
  artifacts:
    paths:
      - scripts/sparc-bench/results/
  only:
    - main
    - schedules
  variables:
    E2B_API_KEY: $E2B_API_KEY
```

### Jenkins

For Jenkins integration, create a Jenkinsfile:

```groovy
// Jenkinsfile
pipeline {
    agent any
    
    environment {
        E2B_API_KEY = credentials('e2b-api-key')
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Setup') {
            steps {
                sh 'curl -fsSL https://deno.land/x/install/install.sh | sh'
                sh 'export PATH="$HOME/.deno/bin:$PATH"'
            }
        }
        
        stage('Benchmark') {
            steps {
                dir('scripts/sparc-bench') {
                    sh 'deno run --allow-read --allow-write --allow-env --allow-net sparc-bench.ts run --all'
                }
            }
        }
        
        stage('Archive Results') {
            steps {
                archiveArtifacts artifacts: 'scripts/sparc-bench/results/**/*', fingerprint: true
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
    }
}
```

## Docker Deployment

### Basic Docker Setup

You can run SPARC-Bench in a Docker container:

1. Create a Dockerfile:
```dockerfile
FROM denoland/deno:1.37.0

WORKDIR /app

# Copy necessary files
COPY scripts/sparc-bench /app
COPY scripts/e2b /app/e2b

# Create directories for results and cache
RUN mkdir -p results cache

# Set environment variables
ENV E2B_API_KEY=${E2B_API_KEY}

# Run benchmarks
CMD ["deno", "run", "--allow-read", "--allow-write", "--allow-env", "--allow-net", "sparc-bench.ts", "run", "--all"]
```

2. Build and run the Docker container:
```bash
docker build -t sparc-bench .
docker run -e E2B_API_KEY=your_api_key -v $(pwd)/results:/app/results sparc-bench
```

### Docker Compose

For a more complex setup with Docker Compose:

```yaml
# docker-compose.yml
version: '3'

services:
  sparc-bench:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      - E2B_API_KEY=${E2B_API_KEY}
    volumes:
      - ./results:/app/results
      - ./config.toml:/app/config.toml
    command: ["deno", "run", "--allow-read", "--allow-write", "--allow-env", "--allow-net", "sparc-bench.ts", "run", "--all"]
```

Run with:
```bash
E2B_API_KEY=your_api_key docker-compose up
```

## Cloud Deployment

### AWS Lambda

You can run SPARC-Bench on AWS Lambda for serverless execution:

1. Create a Lambda function handler:
```typescript
// lambda.ts
import { BenchmarkManager } from "./src/benchmarks/benchmark-manager.ts";
import { sparc2HumanEvalBenchmark } from "./samples/sparc2-benchmark.ts";

export async function handler(event: any) {
  const benchmarkManager = new BenchmarkManager();
  benchmarkManager.registerBenchmark(sparc2HumanEvalBenchmark);
  
  const result = await benchmarkManager.runBenchmark("sparc2-code-analysis");
  
  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
}
```

2. Deploy to AWS Lambda using the AWS CLI:
```bash
deno bundle lambda.ts lambda.js
zip -r lambda.zip lambda.js
aws lambda create-function \
  --function-name sparc-bench \
  --runtime nodejs18.x \
  --handler lambda.handler \
  --zip-file fileb://lambda.zip \
  --role arn:aws:iam::123456789012:role/lambda-role \
  --environment Variables={E2B_API_KEY=your_api_key}
```

### Google Cloud Functions

For Google Cloud Functions:

```typescript
// index.ts
import { BenchmarkManager } from "./src/benchmarks/benchmark-manager.ts";
import { sparc2HumanEvalBenchmark } from "./samples/sparc2-benchmark.ts";

export async function sparcBench(req: any, res: any) {
  const benchmarkManager = new BenchmarkManager();
  benchmarkManager.registerBenchmark(sparc2HumanEvalBenchmark);
  
  const result = await benchmarkManager.runBenchmark("sparc2-code-analysis");
  
  res.status(200).send(JSON.stringify(result));
}
```

Deploy with:
```bash
gcloud functions deploy sparc-bench \
  --runtime nodejs18 \
  --trigger-http \
  --entry-point sparcBench \
  --set-env-vars E2B_API_KEY=your_api_key
```

### Azure Functions

For Azure Functions:

```typescript
// function.ts
import { BenchmarkManager } from "./src/benchmarks/benchmark-manager.ts";
import { sparc2HumanEvalBenchmark } from "./samples/sparc2-benchmark.ts";

export default async function (context: any, req: any) {
  const benchmarkManager = new BenchmarkManager();
  benchmarkManager.registerBenchmark(sparc2HumanEvalBenchmark);
  
  const result = await benchmarkManager.runBenchmark("sparc2-code-analysis");
  
  context.res = {
    status: 200,
    body: JSON.stringify(result)
  };
}
```

## Scheduled Execution

### Cron Jobs

You can set up a cron job to run benchmarks on a schedule:

```bash
# Run benchmarks daily at midnight
0 0 * * * cd /path/to/sparc-bench && deno run --allow-read --allow-write --allow-env --allow-net sparc-bench.ts run --all >> /var/log/sparc-bench.log 2>&1
```

### Kubernetes CronJob

For Kubernetes:

```yaml
# cronjob.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: sparc-bench
spec:
  schedule: "0 0 * * *"  # Daily at midnight
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: sparc-bench
            image: sparc-bench:latest
            env:
            - name: E2B_API_KEY
              valueFrom:
                secretKeyRef:
                  name: e2b-secrets
                  key: api-key
            volumeMounts:
            - name: results
              mountPath: /app/results
          volumes:
          - name: results
            persistentVolumeClaim:
              claimName: sparc-bench-results
          restartPolicy: OnFailure
```

Apply with:
```bash
kubectl apply -f cronjob.yaml
```

## Monitoring and Alerting

### Prometheus Integration

You can integrate SPARC-Bench with Prometheus for monitoring:

1. Create a metrics exporter:
```typescript
// metrics-exporter.ts
import { serve } from "https://deno.land/std@0.215.0/http/server.ts";
import { BenchmarkResult } from "./src/benchmarks/types.ts";

const results: BenchmarkResult[] = [];

function generateMetrics(): string {
  let metrics = '';
  
  // Accuracy metric
  metrics += '# HELP sparc_bench_accuracy Accuracy of SPARC2 benchmarks\n';
  metrics += '# TYPE sparc_bench_accuracy gauge\n';
  
  for (const result of results) {
    metrics += `sparc_bench_accuracy{benchmark="${result.benchmarkName}",type="${result.benchmarkType}"} ${result.metrics.accuracy}\n`;
  }
  
  // Efficiency metric
  metrics += '# HELP sparc_bench_efficiency Efficiency of SPARC2 benchmarks\n';
  metrics += '# TYPE sparc_bench_efficiency gauge\n';
  
  for (const result of results) {
    metrics += `sparc_bench_efficiency{benchmark="${result.benchmarkName}",type="${result.benchmarkType}"} ${result.metrics.efficiency}\n`;
  }
  
  // Add more metrics...
  
  return metrics;
}

async function handler(req: Request): Promise<Response> {
  if (req.url.endsWith('/metrics')) {
    return new Response(generateMetrics(), {
      headers: { 'Content-Type': 'text/plain' }
    });
  }
  
  return new Response('SPARC-Bench Metrics Exporter', {
    headers: { 'Content-Type': 'text/plain' }
  });
}

serve(handler, { port: 9090 });
```

2. Run the metrics exporter:
```bash
deno run --allow-read --allow-write --allow-env --allow-net metrics-exporter.ts
```

3. Configure Prometheus to scrape the metrics:
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'sparc-bench'
    scrape_interval: 15s
    static_configs:
      - targets: ['localhost:9090']
```

### Grafana Dashboard

Create a Grafana dashboard to visualize the metrics:

```json
{
  "annotations": {
    "list": []
  },
  "editable": true,
  "gnetId": null,
  "graphTooltip": 0,
  "id": 1,
  "links": [],
  "panels": [
    {
      "aliasColors": {},
      "bars": false,
      "dashLength": 10,
      "dashes": false,
      "datasource": "Prometheus",
      "fieldConfig": {
        "defaults": {},
        "overrides": []
      },
      "fill": 1,
      "fillGradient": 0,
      "gridPos": {
        "h": 8,
        "w": 12,
        "x": 0,
        "y": 0
      },
      "hiddenSeries": false,
      "id": 2,
      "legend": {
        "avg": false,
        "current": false,
        "max": false,
        "min": false,
        "show": true,
        "total": false,
        "values": false
      },
      "lines": true,
      "linewidth": 1,
      "nullPointMode": "null",
      "options": {
        "alertThreshold": true
      },
      "percentage": false,
      "pluginVersion": "7.5.5",
      "pointradius": 2,
      "points": false,
      "renderer": "flot",
      "seriesOverrides": [],
      "spaceLength": 10,
      "stack": false,
      "steppedLine": false,
      "targets": [
        {
          "expr": "sparc_bench_accuracy",
          "interval": "",
          "legendFormat": "{{benchmark}}",
          "refId": "A"
        }
      ],
      "thresholds": [],
      "timeFrom": null,
      "timeRegions": [],
      "timeShift": null,
      "title": "SPARC2 Benchmark Accuracy",
      "tooltip": {
        "shared": true,
        "sort": 0,
        "value_type": "individual"
      },
      "type": "graph",
      "xaxis": {
        "buckets": null,
        "mode": "time",
        "name": null,
        "show": true,
        "values": []
      },
      "yaxes": [
        {
          "format": "percentunit",
          "label": null,
          "logBase": 1,
          "max": "1",
          "min": "0",
          "show": true
        },
        {
          "format": "short",
          "label": null,
          "logBase": 1,
          "max": null,
          "min": null,
          "show": true
        }
      ],
      "yaxis": {
        "align": false,
        "alignLevel": null
      }
    }
  ],
  "refresh": "5s",
  "schemaVersion": 27,
  "style": "dark",
  "tags": [],
  "templating": {
    "list": []
  },
  "time": {
    "from": "now-6h",
    "to": "now"
  },
  "timepicker": {},
  "timezone": "",
  "title": "SPARC2 Benchmarks",
  "uid": "sparc2-benchmarks",
  "version": 1
}
```

## Conclusion

SPARC-Bench can be deployed in various environments, from local development to cloud-based serverless functions. Choose the deployment option that best fits your workflow and requirements.

For more information on specific deployment options, refer to the following guides:
- [Docker Deployment](./docker-deployment.md)
- [Cloud Deployment](./cloud-deployment.md)
- [CI/CD Integration](./ci-cd-integration.md)