ALTER TABLE public.voting_sessions 
ADD COLUMN IF NOT EXISTS meeting_start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS meeting_end_date TIMESTAMPTZ;
