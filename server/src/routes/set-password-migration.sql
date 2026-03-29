-- Migration: Add must_change_password flag to users table
-- Run this on all tenant databases AND the master database

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;
