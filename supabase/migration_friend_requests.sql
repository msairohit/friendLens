-- ============================================================
-- Migration: Friend Request System
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add friend_tag column (nullable initially for backfill)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS friend_tag TEXT UNIQUE;

-- 2. Backfill existing users with generated tags (username#XXXX)
UPDATE profiles 
SET friend_tag = username || '#' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0')
WHERE friend_tag IS NULL;

-- 3. Make friend_tag NOT NULL after backfill
ALTER TABLE profiles ALTER COLUMN friend_tag SET NOT NULL;

-- 4. Drop unique constraint on username (username no longer needs to be unique)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_username_key;

-- 5. Rename phone_hash to phone (store plain phone numbers, no hashing)
ALTER TABLE profiles RENAME COLUMN phone_hash TO phone;
