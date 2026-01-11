-- Production Database Setup Script
-- Run this script as PostgreSQL superuser to create the production database

-- Create database
CREATE DATABASE school_emr_prod;

-- Create user (if not exists)
-- DO $$ 
-- BEGIN
--     IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'postgres') THEN
--         CREATE USER postgres WITH PASSWORD 'M@gesh@020294';
--     END IF;
-- END $$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE school_emr_prod TO postgres;

-- Connect to the database
\c school_emr_prod

-- Create schema (if needed)
CREATE SCHEMA IF NOT EXISTS public;

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Set default privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;

