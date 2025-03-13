-- Create auth schema
CREATE SCHEMA IF NOT EXISTS auth;

-- Create storage schema
CREATE SCHEMA IF NOT EXISTS storage;

-- Create public schema (if not exists)
CREATE SCHEMA IF NOT EXISTS public;

-- Grant usage to postgres user
GRANT USAGE ON SCHEMA auth TO postgres;
GRANT USAGE ON SCHEMA storage TO postgres;
GRANT USAGE ON SCHEMA public TO postgres;

-- Grant all privileges
GRANT ALL PRIVILEGES ON SCHEMA auth TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA storage TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA public TO postgres;

-- Set search path
ALTER DATABASE postgres SET search_path TO public, auth, storage;
