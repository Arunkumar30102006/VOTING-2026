-- Scalability Optimizations (10k+ Concurrent Users)
-- Run this in Supabase SQL Editor

-- 1. Materialized View for High-Performance Aggregation
-- Rationale: Replaces "Redis" for vote counting.
-- "Real-Time" aggregation of 10k+ rows is expensive. 
-- This view caches the result and is refreshed periodically.
CREATE MATERIALIZED VIEW IF NOT EXISTS vote_stats_mat AS
SELECT
    resolution_id,
    COUNT(*) FILTER (WHERE vote_value = 'FOR'::vote_enum) AS for_count,
    COUNT(*) FILTER (WHERE vote_value = 'AGAINST'::vote_enum) AS against_count,
    COUNT(*) FILTER (WHERE vote_value = 'ABSTAIN'::vote_enum) AS abstain_count,
    COUNT(*) AS total_votes,
    now() AS last_updated
FROM
    votes
GROUP BY
    resolution_id;

-- 2. Performance Indexing
-- Allows O(1) lookup of stats by resolution_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_vote_stats_mat_resolution_id
ON vote_stats_mat(resolution_id);


-- 3. Refresh Function
-- Usage: Call this via a Cron Job (pg_cron) or Edge Function every 5-10 seconds.
-- Do NOT call this inside the vote transaction (it locks).
CREATE OR REPLACE FUNCTION refresh_vote_stats()
RETURNS void AS $$
BEGIN
    -- CONCURRENTLY allows reads to continue while refreshing
    REFRESH MATERIALIZED VIEW CONCURRENTLY vote_stats_mat;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Optimized Vote Casting (RPC)
-- Rationale: Reduces "Chatty" API calls. 
-- Instead of Client -> Check Perms -> Client -> Insert -> Client
-- We do Client -> RPC (Check & Insert) -> Client
CREATE OR REPLACE FUNCTION cast_vote(
    p_resolution_id UUID,
    p_vote_value text
)
RETURNS jsonb AS $$
DECLARE
    v_vote_enum vote_enum;
BEGIN
    -- 1. Robust Type Casting
    BEGIN
        v_vote_enum := upper(p_vote_value)::vote_enum;
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Invalid vote value. Must be FOR, AGAINST, or ABSTAIN.';
    END;

    -- 2. Insert Vote (RLS & Constraint checks apply automatically if not using SECURITY DEFINER, 
    --    but usually RPCs are SECURITY DEFINER so we rely on explicit auth.uid())
    INSERT INTO votes (shareholder_id, resolution_id, vote_value)
    VALUES (auth.uid(), p_resolution_id, v_vote_enum);

    RETURN jsonb_build_object('status', 'success', 'timestamp', now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION cast_vote(UUID, text) TO authenticated;
GRANT SELECT ON vote_stats_mat TO authenticated;
GRANT SELECT ON vote_stats_mat TO anon; -- If public need to see results
