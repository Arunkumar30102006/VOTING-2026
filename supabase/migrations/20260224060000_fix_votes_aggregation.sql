-- Fix Voting Aggregation & Real-time Sync
-- 1. Fix Case Sensitivity in Votes Table
ALTER TABLE public.votes 
DROP CONSTRAINT IF EXISTS votes_vote_value_check;

ALTER TABLE public.votes 
ADD CONSTRAINT votes_vote_value_check 
CHECK (vote_value IN ('for', 'against', 'abstain', 'FOR', 'AGAINST', 'ABSTAIN'));

-- 2. Create a dynamic (Standard) View for Voting Stats
-- Standard views are ALWAYS up to date and fast enough for thousands of votes.
-- They replace the need for "REFRESH MATERIALIZED VIEW" which was manually required before.
DROP VIEW IF EXISTS public.vote_stats;
CREATE OR REPLACE VIEW public.vote_stats AS
SELECT
    resolution_id,
    COUNT(*) FILTER (WHERE UPPER(vote_value) = 'FOR') AS for_count,
    COUNT(*) FILTER (WHERE UPPER(vote_value) = 'AGAINST') AS against_count,
    COUNT(*) FILTER (WHERE UPPER(vote_value) = 'ABSTAIN') AS abstain_count,
    COUNT(*) AS total_votes,
    now() AS last_updated
FROM
    public.votes
GROUP BY
    resolution_id;

-- 3. Cleanup stale materialized view (from scalability.sql) if it exists
DROP MATERIALIZED VIEW IF EXISTS public.vote_stats_mat;

-- 4. Permissions
GRANT SELECT ON public.vote_stats TO authenticated;
GRANT SELECT ON public.vote_stats TO anon;
