-- Migration: Create scans table for storing website scan results
-- AgentVisible.ai - Task 004: Supabase Database

-- Create scans table
CREATE TABLE IF NOT EXISTS scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT NOT NULL,
    domain TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    overall_score FLOAT NOT NULL,
    rating TEXT NOT NULL,
    modules JSONB NOT NULL,
    top_fixes JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_scans_slug ON scans(slug);
CREATE INDEX IF NOT EXISTS idx_scans_domain ON scans(domain);
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans(created_at DESC);

-- Add constraints
ALTER TABLE scans ADD CONSTRAINT IF NOT EXISTS scans_rating_check
    CHECK (rating IN ('Critical', 'Weak', 'Moderate', 'Strong'));

ALTER TABLE scans ADD CONSTRAINT IF NOT EXISTS scans_score_check
    CHECK (overall_score >= 0 AND overall_score <= 100);

-- Comment on table and columns
COMMENT ON TABLE scans IS 'Website AI agent readiness scan results';
COMMENT ON COLUMN scans.url IS 'Original URL that was scanned';
COMMENT ON COLUMN scans.domain IS 'Domain extracted from URL for grouping';
COMMENT ON COLUMN scans.slug IS 'Unique identifier for public report URLs';
COMMENT ON COLUMN scans.overall_score IS 'Weighted overall score (0-100)';
COMMENT ON COLUMN scans.rating IS 'Score rating: Critical, Weak, Moderate, Strong';
COMMENT ON COLUMN scans.modules IS 'JSON array of module results with scores and checks';
COMMENT ON COLUMN scans.top_fixes IS 'JSON array of top 3 priority fixes';

-- Row Level Security (RLS) - enable for security
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous reads for public reports
CREATE POLICY IF NOT EXISTS "Allow anonymous read access" ON scans
    FOR SELECT USING (true);

-- Policy: Allow anonymous inserts for new scans
CREATE POLICY IF NOT EXISTS "Allow anonymous insert access" ON scans
    FOR INSERT WITH CHECK (true);

-- Note: In production, you might want more restrictive policies
-- For example, rate limiting at the database level or user-specific access