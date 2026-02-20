-- Database Optimizations for Digital Shareholder Voting System
-- Run this script in your Supabase SQL Editor

-- 1. Optimize Voting Session Lookups
-- Frequent Query: .eq("company_id", ...).eq("is_active", true)
CREATE INDEX IF NOT EXISTS idx_voting_sessions_company_active
ON voting_sessions(company_id, is_active);

-- 2. Optimize Resolution Lookups
-- Frequent Query: .eq("voting_session_id", ...)
CREATE INDEX IF NOT EXISTS idx_resolutions_session
ON resolutions(voting_session_id);

-- 3. Optimize Vote Lookups & Integrity
-- Frequent Query: .eq("shareholder_id", ...)
-- integrity: Ensure one vote per shareholder per resolution
CREATE UNIQUE INDEX IF NOT EXISTS idx_votes_unique_shareholder_resolution
ON votes(shareholder_id, resolution_id);

-- 4. Create Vote Summary View (Database-Level Aggregation)
-- Reduces frontend computation overhead for tallying votes
CREATE OR REPLACE VIEW vote_summary AS
SELECT 
    resolution_id,
    COUNT(*) FILTER (WHERE vote_value = 'FOR') AS for_count,
    COUNT(*) FILTER (WHERE vote_value = 'AGAINST') AS against_count,
    COUNT(*) FILTER (WHERE vote_value = 'ABSTAIN') AS abstain_count,
    COUNT(*) AS total_votes
FROM 
    votes
GROUP BY 
    resolution_id;

-- Comment on usage:
-- You can now fetch vote counts efficiently:
-- supabase.from('vote_summary').select('*').eq('resolution_id', 'some-id')
