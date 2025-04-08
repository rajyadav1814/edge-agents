#!/bin/bash
set -e

# Create auth schema
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE SCHEMA IF NOT EXISTS auth;
    CREATE SCHEMA IF NOT EXISTS storage;
    CREATE SCHEMA IF NOT EXISTS public;
    
    GRANT USAGE ON SCHEMA auth TO postgres;
    GRANT USAGE ON SCHEMA storage TO postgres;
    GRANT USAGE ON SCHEMA public TO postgres;
    
    GRANT ALL PRIVILEGES ON SCHEMA auth TO postgres;
    GRANT ALL PRIVILEGES ON SCHEMA storage TO postgres;
    GRANT ALL PRIVILEGES ON SCHEMA public TO postgres;
    
    ALTER DATABASE postgres SET search_path TO public, auth, storage;
EOSQL

echo "Schemas created successfully"
