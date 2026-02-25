-- 1. Create the secure RPC function
CREATE OR REPLACE FUNCTION public.vote_summary()
RETURNS TABLE (
    resolution_id uuid,
    for_count bigint,
    against_count bigint,
    abstain_count bigint,
    total_votes bigint
)
LANGUAGE sql
SECURITY INVOKER
AS $$
    SELECT
        resolution_id,
        COUNT(*) FILTER (WHERE vote_value::text = 'FOR' OR vote_value::text = 'for') AS for_count,
        COUNT(*) FILTER (WHERE vote_value::text = 'AGAINST' OR vote_value::text = 'against') AS against_count,
        COUNT(*) FILTER (WHERE vote_value::text = 'ABSTAIN' OR vote_value::text = 'abstain') AS abstain_count,
        COUNT(*) AS total_votes
    FROM public.votes
    GROUP BY resolution_id;
$$;

-- 2. Grant Access Properly
REVOKE ALL ON FUNCTION public.vote_summary() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.vote_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION public.vote_summary() TO anon;

-- 3. Replace Old View
DROP VIEW IF EXISTS public.vote_summary;
