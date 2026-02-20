-- Blockchain Anchoring: Merkle Tree Storage
-- Stores the Root Hash of all votes in a session to anchor them to a simulated/real blockchain.

CREATE TABLE IF NOT EXISTS block_anchors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES voting_sessions(id) ON DELETE CASCADE,
    merkle_root TEXT NOT NULL,
    vote_count INT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL, -- Period start for this batch
    ended_at TIMESTAMPTZ NOT NULL, -- Period end
    transaction_id TEXT, -- Mock or Real Blockchain Tx Hash
    blockchain_network TEXT DEFAULT 'Polygon Amoy Testnet',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_anchors_session ON block_anchors(session_id);

-- Enable RLS
ALTER TABLE block_anchors ENABLE ROW LEVEL SECURITY;

-- Admins can create anchors (server-side usually, but for MVP admins trigger it)
CREATE POLICY "Admins can insert anchors" 
ON block_anchors FOR INSERT 
WITH CHECK (
    exists (select 1 from company_admins where user_id = auth.uid())
);

-- Everyone can view anchors for verification
CREATE POLICY "Public view anchors" 
ON block_anchors FOR SELECT 
USING (true);
