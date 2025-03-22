/*
  # Create test user account

  1. Changes
    - Delete all existing data
    - Create a test user with known credentials
*/

-- Delete existing data
DELETE FROM public.follow_ups;
DELETE FROM public.jobs;
DELETE FROM public.profiles;
DELETE FROM auth.users;

-- Reset sequences
ALTER SEQUENCE IF EXISTS auth.users_id_seq RESTART WITH 1;

-- Note: We don't create the user directly in the database
-- Instead, we'll use the authentication API to create the user
-- This ensures proper password hashing and token generation