export type VoteType = "FOR" | "AGAINST" | "ABSTAIN";

export interface VotingItem {
    id: string;
    title: string;
    description: string;
    category: string;
    voted: boolean;
    vote: VoteType | null;
    voteHash?: string;
    merkleProof?: Array<{ position: 'left' | 'right', data: string }> | null;
    anchorRoot?: string;
}

export interface Shareholder {
    id: string;
    shareholder_name: string;
    shares_held: number;
    company_id: string;
    companies?: {
        company_name: string;
    };
}

export interface VotingSession {
    id: string;
    title: string;
    description?: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
    company_id: string;
    meeting_link?: string;
    meeting_password?: string;
    meeting_platform?: string;
    meeting_start_date?: string;
    meeting_end_date?: string;
    voting_instructions?: string;
    is_meeting_emails_sent?: boolean;
}

export interface Resolution {
    id: string;
    title: string;
    description?: string;
    resolution_type: string;
    voting_session_id: string;
}

export interface VoteRecord {
    id: string;
    resolution_id: string;
    vote_value: VoteType;
    vote_hash: string;
    created_at: string;
}

export interface ResolutionStats {
    resolution_id: string;
    for_count: number;
    against_count: number;
    abstain_count: number;
    total_votes: number;
    last_updated: string;
}
