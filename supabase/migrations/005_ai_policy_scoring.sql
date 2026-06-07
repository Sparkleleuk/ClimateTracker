-- Add AI policy score columns to candidates table
ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS ai_policy_score       integer,
  ADD COLUMN IF NOT EXISTS ai_score_updated_at   timestamp;

-- Full AI policy analysis table (Tier 1 candidates)
CREATE TABLE IF NOT EXISTS ai_analyses (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id        integer REFERENCES candidates(id),
  ai_policy_score     integer,
  ai_analysis         text,
  scores_by_dimension jsonb,
  data_sources        jsonb,
  model_version       text,
  created_at          timestamp DEFAULT now(),
  updated_at          timestamp DEFAULT now(),
  UNIQUE(candidate_id)
);

-- Lightweight AI analysis table (Tier 2 / Tier 3)
CREATE TABLE IF NOT EXISTS ai_analyses_lite (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id    integer REFERENCES candidates(id),
  ai_policy_score integer,
  ai_summary      text,
  stances         jsonb,
  score_source    text,
  data_hash       text,
  created_at      timestamp DEFAULT now(),
  updated_at      timestamp DEFAULT now(),
  UNIQUE(candidate_id)
);

-- Big Tech PAC donation cache (30-day TTL enforced in app layer)
CREATE TABLE IF NOT EXISTS big_tech_donations (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id        integer REFERENCES candidates(id),
  candidate_name      text,
  state               text,
  donation_level      text,
  donations_by_company jsonb,
  fetched_at          timestamp DEFAULT now(),
  UNIQUE(candidate_id)
);

-- AI bill co-sponsorship cache (7-day TTL enforced in app layer)
CREATE TABLE IF NOT EXISTS ai_bill_cosponsors (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_name text,
  state          text,
  bills          jsonb,
  fetched_at     timestamp DEFAULT now(),
  UNIQUE(candidate_name, state)
);

-- Add analysis_type to api_usage
ALTER TABLE api_usage
  ADD COLUMN IF NOT EXISTS analysis_type text DEFAULT 'climate';

-- Add comparison_type to comparisons
ALTER TABLE comparisons
  ADD COLUMN IF NOT EXISTS comparison_type text DEFAULT 'climate';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_analyses_candidate
  ON ai_analyses(candidate_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_lite_candidate
  ON ai_analyses_lite(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidates_ai_score
  ON candidates(ai_policy_score);
CREATE INDEX IF NOT EXISTS idx_big_tech_donations_candidate
  ON big_tech_donations(candidate_id);
