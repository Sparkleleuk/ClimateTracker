-- Add office_type column to support gubernatorial candidates
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS office_type text DEFAULT 'us_senate';
UPDATE candidates SET office_type = 'us_senate' WHERE office_type IS NULL;
