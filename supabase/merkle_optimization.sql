-- Merkle Tree Optimization: Database Schema & RPCs

-- 1. Update Votes Table
ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS leaf_index INTEGER;

-- 2. Update Anchors Table to store layers
-- Storing layers allows us to generate proofs on the fly without recomputing the entire tree
ALTER TABLE public.block_anchors ADD COLUMN IF NOT EXISTS merkle_tree JSONB;

-- 3. Create RPC to fetch proof for a specific vote
CREATE OR REPLACE FUNCTION public.get_vote_proof(p_vote_hash TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_session_id UUID;
    v_leaf_index INTEGER;
    v_merkle_tree JSONB;
BEGIN
    -- Get session and leaf index for this vote
    SELECT resolution_id, leaf_index INTO v_session_id, v_leaf_index
    FROM public.votes
    WHERE vote_hash = p_vote_hash;

    -- If not found or not yet anchored, return null
    IF v_leaf_index IS NULL THEN
        RETURN NULL;
    END IF;

    -- Get the anchor data (we use the resolution_id to find the session)
    -- This assumes session_id is linked to resolutions
    SELECT merkle_tree INTO v_merkle_tree
    FROM public.block_anchors
    WHERE session_id = (SELECT voting_session_id FROM public.resolutions WHERE id = v_session_id)
    LIMIT 1;

    RETURN v_merkle_tree; -- For now returning the whole tree logic, but we can optimize this further
END;
$$;
