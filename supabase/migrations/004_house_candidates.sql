-- Add columns required for House candidates and AI analysis
-- Run this in the Supabase SQL Editor before running /api/sync

ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS district       TEXT,
  ADD COLUMN IF NOT EXISTS district_pvi   TEXT,
  ADD COLUMN IF NOT EXISTS is_battleground BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS tier           INTEGER,
  ADD COLUMN IF NOT EXISTS data_hash      TEXT,
  ADD COLUMN IF NOT EXISTS climate_score  INTEGER,
  ADD COLUMN IF NOT EXISTS climate_analysis TEXT,
  ADD COLUMN IF NOT EXISTS issue_tags     TEXT[] DEFAULT '{}';
