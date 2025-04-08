# Docker Deployment for SPARC-Bench

This document outlines how to deploy SPARC-Bench using Docker.

## Prerequisites
- Install Docker on your system.
- Ensure that Deno is installed in the container or use the official Deno Docker image.

## Dockerfile Setup
Create a Dockerfile with the following content:
```dockerfile
FROM denoland/deno:1.37.0
WORKDIR /app
COPY . .
RUN mkdir -p results cache
ENV E2B_API_KEY=${E2B_API_KEY}
CMD ["deno", "run", "--allow-read", "--allow-write", "--allow-env", "--allow-net", "sparc-bench.ts", "run", "--all"]
```

## Build and Run the Container
Build the Docker image:
```bash
docker build -t sparc-bench .
```
Run the container:
```bash
docker run -e E2B_API_KEY=your_api_key -v $(pwd)/results:/app/results sparc-bench
```

## Additional Notes
- Customize the Dockerfile as necessary for your environment.
- Use Docker Compose if you need multi-container orchestration.