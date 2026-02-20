-- Add Meeting Scheduling columns to voting_sessions
-- Check and add columns safely

DO $$
BEGIN
    -- meeting_link
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'voting_sessions' AND column_name = 'meeting_link') THEN
        ALTER TABLE voting_sessions ADD COLUMN meeting_link TEXT;
    END IF;

    -- meeting_date (start)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'voting_sessions' AND column_name = 'meeting_start_date') THEN
        ALTER TABLE voting_sessions ADD COLUMN meeting_start_date TIMESTAMPTZ;
    END IF;

    -- meeting_date (end)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'voting_sessions' AND column_name = 'meeting_end_date') THEN
        ALTER TABLE voting_sessions ADD COLUMN meeting_end_date TIMESTAMPTZ;
    END IF;

    -- meeting_type/platform
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'voting_sessions' AND column_name = 'meeting_platform') THEN
        ALTER TABLE voting_sessions ADD COLUMN meeting_platform TEXT DEFAULT 'zoom';
    END IF;

     -- meeting_password
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'voting_sessions' AND column_name = 'meeting_password') THEN
        ALTER TABLE voting_sessions ADD COLUMN meeting_password TEXT;
    END IF;

    -- is_meeting_emails_sent
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'voting_sessions' AND column_name = 'is_meeting_emails_sent') THEN
        ALTER TABLE voting_sessions ADD COLUMN is_meeting_emails_sent BOOLEAN DEFAULT FALSE;
    END IF;

END $$;
