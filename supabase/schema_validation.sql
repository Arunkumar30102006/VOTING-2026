-- Schema Validation Script (The "Swap Column" Strategy)
-- Run this in your Supabase SQL Editor

-- 1. Safe ENUM Creation
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vote_enum') THEN
        CREATE TYPE vote_enum AS ENUM ('FOR', 'AGAINST', 'ABSTAIN');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'resolution_type_enum') THEN
        CREATE TYPE resolution_type_enum AS ENUM ('special', 'ordinary', 'director_election');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;


-- 2. Drop Dependencies (Views)
DROP VIEW IF EXISTS vote_summary CASCADE;


-- 3. The "Swap Column" Migration
-- This bypasses any existing constraints/defaults causing "operator does not exist" errors
DO $$
DECLARE
    col_type text;
BEGIN
    SELECT data_type INTO col_type FROM information_schema.columns 
    WHERE table_name = 'votes' AND column_name = 'vote_value';

    -- Only proceed if it is NOT already our user-defined enum (user-defined types often show as 'USER-DEFINED' or the enum name)
    IF col_type <> 'USER-DEFINED' AND col_type <> 'vote_enum' THEN
        
        -- A. Add new column
        ALTER TABLE votes ADD COLUMN vote_value_new vote_enum;

        -- B. Backfill data (Robust cast)
        -- We handle potential lowercase/uppercase issues here
        UPDATE votes 
        SET vote_value_new = upper(vote_value::text)::vote_enum;

        -- C. Drop old column
        ALTER TABLE votes DROP COLUMN vote_value;

        -- D. Rename new column to old name
        ALTER TABLE votes RENAME COLUMN vote_value_new TO vote_value;
        
    END IF;
END $$;


-- 4. Re-Apply Constraints on the (New) Column
ALTER TABLE votes
ALTER COLUMN vote_value SET NOT NULL;

-- Safe handling for created_at
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'votes' AND column_name = 'created_at') THEN
        ALTER TABLE votes ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
    END IF;
END $$;
ALTER TABLE votes ALTER COLUMN created_at SET DEFAULT now(), ALTER COLUMN created_at SET NOT NULL;


-- 5. Recreate View (With Safe Casts just in case)
CREATE OR REPLACE VIEW vote_summary AS
SELECT 
    resolution_id,
    COUNT(*) FILTER (WHERE vote_value::text = 'FOR') AS for_count,
    COUNT(*) FILTER (WHERE vote_value::text = 'AGAINST') AS against_count,
    COUNT(*) FILTER (WHERE vote_value::text = 'ABSTAIN') AS abstain_count,
    COUNT(*) AS total_votes
FROM 
    votes
GROUP BY 
    resolution_id;


-- 6. Apply Foreign Keys & Unique Constraints
ALTER TABLE votes DROP CONSTRAINT IF EXISTS unique_vote_pair;
ALTER TABLE votes ADD CONSTRAINT unique_vote_pair UNIQUE (shareholder_id, resolution_id);

ALTER TABLE votes DROP CONSTRAINT IF EXISTS votes_resolution_id_fkey;
ALTER TABLE votes
ADD CONSTRAINT votes_resolution_id_fkey
FOREIGN KEY (resolution_id)
REFERENCES resolutions(id)
ON DELETE RESTRICT;

ALTER TABLE votes DROP CONSTRAINT IF EXISTS votes_shareholder_id_fkey;
ALTER TABLE votes
ADD CONSTRAINT votes_shareholder_id_fkey
FOREIGN KEY (shareholder_id)
REFERENCES shareholders(id)
ON DELETE CASCADE;

-- 7. Shareholders Constraint
ALTER TABLE shareholders DROP CONSTRAINT IF EXISTS check_shares_positive;
ALTER TABLE shareholders
ADD CONSTRAINT check_shares_positive
CHECK (shares_held >= 1);

-- 8. Final Message
SELECT 'Schema migrated successfully using Swap Strategy' as status;
