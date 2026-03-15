-- Migration: Rename temp_password column to temp_password_hash
-- Run this AFTER backing up the database
-- This is safe to run multiple times (idempotent)

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'temp_password'
  ) THEN
    ALTER TABLE users RENAME COLUMN temp_password TO temp_password_hash;
    RAISE NOTICE 'Column temp_password renamed to temp_password_hash';
  ELSE
    RAISE NOTICE 'Column temp_password does not exist (already renamed or never existed)';
  END IF;
END $$;
