-- AI Power Suite Schema

-- 1. Shareholder Feedback Table
CREATE TABLE IF NOT EXISTS shareholder_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES voting_sessions(id) ON DELETE CASCADE,
    shareholder_id UUID REFERENCES shareholders(id) ON DELETE SET NULL, -- Optional, can be anonymous
    content TEXT NOT NULL,
    sentiment_score NUMERIC(5,4), -- -1.0 to 1.0
    sentiment_label TEXT, -- 'Positive', 'Neutral', 'Negative'
    themes TEXT[], -- Array of strings
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Enable RLS
ALTER TABLE shareholder_feedback ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Company Admins can view all feedback
CREATE POLICY "Admins can view all feedback" 
ON shareholder_feedback FOR SELECT 
USING (
    exists (
        select 1 from company_admins 
        where user_id = auth.uid() 
        -- limit by company if needed, for now simplified
    )
);

-- Shareholders can insert feedback
CREATE POLICY "Shareholders can insert feedback" 
ON shareholder_feedback FOR INSERT 
WITH CHECK (true); 
-- In a stricter app, we'd check if auth.uid() matches a shareholder user, 
-- but our shareholder auth is currently ID/Password based, not always mapped to auth.users.
-- If using anonymous/public feedback for now:
-- CREATE POLICY "Public insert" ON shareholder_feedback FOR INSERT WITH CHECK (true);

-- 4. Realtime
-- Enable Realtime for this table so the Admin Dashboard updates instantly
alter publication supabase_realtime add table shareholder_feedback;

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON shareholder_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_sentiment ON shareholder_feedback(sentiment_label);
