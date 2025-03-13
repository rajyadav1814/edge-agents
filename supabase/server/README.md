# Supabase Server Setup

This directory contains everything needed to set up a local Supabase instance using Docker.

## Directory Structure

- `Dockerfile`: Configuration for the PostgreSQL database with Supabase extensions
- `docker-compose.yml`: Orchestrates all Supabase services
- `sample.env`: Sample environment variables (copy to `.env` to use)
- `import-sql.sh`: Script to import SQL files into the database
- `kong.yml`: Configuration for the Kong API gateway
- `sql/`: Directory containing SQL files for database initialization
- `functions/`: Directory containing edge functions

## Getting Started

1. Copy the sample environment file:

```bash
cp sample.env .env
```

2. Edit the `.env` file to set your desired configuration values. The sample.env file includes all required variables, but you should update the following for production:
   - POSTGRES_PASSWORD (use a strong, unique password)
   - SUPABASE_JWT_SECRET (use a strong, unique secret)
   - SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY (if you want to use custom keys)
   - SMTP settings (if you want to enable email functionality)

   Note: For security reasons, sensitive information like passwords are not hardcoded in the Dockerfile but are passed at runtime through environment variables.

3. Start the Supabase services:

```bash
docker-compose up -d
```

Note: The docker-compose.yml file uses specific versions of Supabase services to ensure compatibility:
- supabase/gotrue:v2.10.0
- supabase/studio:latest
- postgrest/postgrest:v10.1.2
- supabase/realtime:v2.8.0
- supabase/storage-api:v0.40.4
- supabase/edge-runtime:v1.5.0

The `version` attribute has been removed from the docker-compose.yml file as it is obsolete in newer versions of Docker Compose.

4. Access the Supabase Studio at http://localhost:3000

## SQL Files

SQL files in the `sql/` directory are automatically imported during the initial database setup. Files are imported in alphabetical order, so you can prefix them with numbers to control the order of execution:

- `01_schema.sql`: Creates database schema, tables, and functions
- `02_sample_data.sql`: Inserts sample data

To manually import SQL files after the database is running:

```bash
docker-compose exec postgres import-sql.sh /sql
```

## Edge Functions

Edge functions are located in the `functions/` directory. Each function should be in its own file with a `.ts` extension.

To deploy a new edge function:

1. Create a new TypeScript file in the `functions/` directory
2. Implement your function using the Deno runtime
3. Restart the edge functions service:

```bash
docker-compose restart supabase-edge-functions
```

## Environment Variables

The following environment variables can be configured in the `.env` file:

### PostgreSQL Configuration
- `POSTGRES_PASSWORD`: PostgreSQL password
- `POSTGRES_USER`: PostgreSQL username
- `POSTGRES_DB`: PostgreSQL database name
- `POSTGRES_PORT`: PostgreSQL port (default: 5432)

### Supabase Configuration
- `SUPABASE_URL`: URL for the Supabase API
- `SUPABASE_ANON_KEY`: Anonymous API key
- `SUPABASE_SERVICE_ROLE_KEY`: Service role API key
- `SUPABASE_JWT_SECRET`: JWT secret for authentication

### Edge Functions Configuration
- `EDGE_FUNCTIONS_PORT`: Port for edge functions (default: 9000)

## Verifying the Setup

To verify that all services are running correctly, use the provided check script:

```bash
# Run from the supabase/server directory
cd supabase/server
./check-status.sh
```

The script will automatically:
1. Change to the script's directory
2. Load environment variables from the .env file

This script will:
1. Check if all Docker services are running
2. Verify PostgreSQL is accepting connections
3. Test the Kong API Gateway
4. Check if Supabase Studio is accessible
5. Test the Edge Functions service
6. Test the hello-world function
7. Check for any error logs
8. Provide a summary of all services

## Troubleshooting

### Database Connection Issues

If you're having trouble connecting to the database, check:

1. The PostgreSQL service is running:
```bash
docker-compose ps postgres
```

2. The database port is correctly mapped:
```bash
docker-compose port postgres 5432
```

### Edge Functions Not Working

If edge functions aren't working:

1. Check the edge functions logs:
```bash
docker-compose logs supabase-edge-functions
```

2. Verify the function file has the correct format and imports
3. Ensure the edge functions service is running:
```bash
docker-compose ps supabase-edge-functions
```

### General Troubleshooting

For a comprehensive check of all services, run the check-status.sh script:

```bash
./check-status.sh
```

If you notice services restarting or not working properly, use the check-logs.sh script to diagnose the issues:

```bash
./check-logs.sh
```

This script will:
1. Show logs for services that are having issues
2. Check for common configuration problems (e.g., JWT secret length)
3. Provide recommendations for fixing the issues

#### Common Issues and Solutions

The docker-compose.yml file has been configured to address several common issues:

1. **Auth Service Issues**:
   - Added `GOTRUE_DB_DRIVER: postgres` environment variable to fix the "required key GOTRUE_DB_DRIVER missing value" error
   - Added `DATABASE_URL` environment variable to fix the "required key DATABASE_URL missing value" error
   - Added `00_init_schemas.sql` to create the auth schema in PostgreSQL to fix the "schema 'auth' does not exist" error

2. **Storage Service Issues**:
   - Added `FILE_SIZE_LIMIT: 52428800` environment variable to fix the "FILE_SIZE_LIMIT is undefined" error
   - Added `GLOBAL_S3_BUCKET: storage` environment variable to fix the "GLOBAL_S3_BUCKET is undefined" error
   - Added `REGION: us-east-1` environment variable to fix the "REGION is undefined" error

3. **Realtime Service Issues**:
   - Added `ERL_AFLAGS: "-proto_dist inet_tcp"` to fix network distribution issues
   - Added `ENABLE_EXPERIMENTAL_REALTIME_SUBSCRIPTIONS: "true"` for better compatibility

4. **Edge Functions Issues**:
   - Added proper command `["start", "--port", "9000", "--main-service", "hello-world", "--import-map", "/supabase/functions/import_map.json"]` to correctly start the edge runtime with the main service and import map
   - Created a proper `hello-world.ts` edge function
   - Added `import_map.json` and `deno.json` configuration files for Deno

Other common issues include:
- SUPABASE_JWT_SECRET being too short (must be at least 32 characters)
- Invalid API keys
- Database connection issues
- Network port conflicts

If services are still continuously restarting after these fixes, use the restart script:
```bash
./restart.sh
```

This script will:
1. Stop all Supabase services
2. Start all services again
3. Wait for services to initialize
4. Run the status check script to verify everything is working

If you need to rebuild the containers completely:
```bash
docker-compose down -v  # Warning: This will remove volumes and data
docker-compose build --no-cache
docker-compose up -d
```

## Additional Resources

- [Supabase Documentation](https://supabase.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Deno Documentation](https://deno.land/manual)
