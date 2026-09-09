-- PostgreSQL initialization script
-- Runs once when the Docker container is first created.
-- Creates the application database if it doesn't exist.

SELECT 'CREATE DATABASE pc_platform'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'pc_platform');
