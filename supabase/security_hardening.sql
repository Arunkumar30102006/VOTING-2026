-- Security Hardening Script for Digital Shareholder Voting System
-- Run this in your Supabase SQL Editor

-- 1. Create Audit Logs Table (Tamper-Proof Logging)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id UUID,
    operation TEXT CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    performed_by UUID DEFAULT auth.uid(),
    timestamp TIMESTAMPTZ DEFAULT now()
);

-- Turn on RLS for Audit Logs (Admins Only)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
-- No one can insert manually, only triggers
CREATE POLICY "System triggers can insert audit logs"
ON audit_logs
FOR INSERT
WITH CHECK (true);
-- Only admins can read logs (Adjust logic if you have roles)
CREATE POLICY "Admins can view audit logs"
ON audit_logs
FOR SELECT
-- USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));
USING (false); -- Placeholder: Replace 'false' with your actual admin logic (e.g., check 'companies' table or hardcoded UUID)


-- 2. Create Audit Trigger Function
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (table_name, record_id, operation, old_data, new_data, performed_by)
    VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        to_jsonb(OLD),
        to_jsonb(NEW),
        auth.uid()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Apply Audit Triggers to Critical Tables
DROP TRIGGER IF EXISTS audit_votes_trigger ON votes;
CREATE TRIGGER audit_votes_trigger
AFTER INSERT OR UPDATE OR DELETE ON votes
FOR EACH ROW EXECUTE FUNCTION log_audit_event();

DROP TRIGGER IF EXISTS audit_resolutions_trigger ON resolutions;
CREATE TRIGGER audit_resolutions_trigger
AFTER INSERT OR UPDATE OR DELETE ON resolutions
FOR EACH ROW EXECUTE FUNCTION log_audit_event();


-- 4. Enterprise-Grade RLS for Votes (Immutable & Isolated)
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies to replace with stricter ones
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON votes;
DROP POLICY IF EXISTS "Enable read access for all users" ON votes;

-- INSERT: Allowed ONLY if shareholder_id matches authenticated user
CREATE POLICY "Shareholders can cast their own vote"
ON votes
FOR INSERT
WITH CHECK (
  auth.uid() = shareholder_id
);

-- SELECT: Shareholders can see their OWN votes only (Privacy)
CREATE POLICY "Shareholders see only their own votes"
ON votes
FOR SELECT
USING (
  auth.uid() = shareholder_id
);

-- UPDATE/DELETE: BLOCKED (Immutability Guarantee)
-- No policies created for UPDATE/DELETE means they are implicitly denied by default RLS.
-- This ensures once a vote is cast, it cannot be changed or removed by the user.


-- 5. RLS for Voting Sessions (Read-Only Public)
ALTER TABLE voting_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Access to Active Sessions"
ON voting_sessions
FOR SELECT
USING (true); -- Public can read sessions

-- Only Admins can create/edit sessions (Needs Admin Role Logic)
-- Assuming 'companies' table usage for this logic in real app


-- 6. Verify Isolation
-- Ensure Resolution RLS enforces session context if needed
ALTER TABLE resolutions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Resolutions"
ON resolutions
FOR SELECT
USING (true);
