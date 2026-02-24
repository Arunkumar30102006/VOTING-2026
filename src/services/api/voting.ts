import { supabase } from "@/integrations/supabase/client";
import { Shareholder, VotingSession, Resolution, VoteRecord, VoteType } from "@/types/voting";

export const votingApi = {
    getShareholder: async (id: string): Promise<Shareholder> => {
        const { data, error } = await supabase
            .from("shareholders")
            .select("*, companies(*)")
            .eq("id", id)
            .single();

        if (error) throw error;
        return data;
    },

    getActiveSession: async (companyId: string): Promise<VotingSession | null> => {
        const { data, error } = await supabase
            .from("voting_sessions")
            .select("*")
            .eq("company_id", companyId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    getResolutions: async (sessionId: string): Promise<Resolution[]> => {
        const { data, error } = await supabase
            .from("resolutions")
            .select("*")
            .eq("voting_session_id", sessionId);

        if (error) throw error;
        return data;
    },

    getShareholderVotes: async (shareholderId: string): Promise<VoteRecord[]> => {
        const { data, error } = await supabase
            .from("votes")
            .select("*")
            .eq("shareholder_id", shareholderId);

        if (error) throw error;
        return data as unknown as VoteRecord[];
    },

    castVote: async (shareholderId: string, resolutionId: string, voteValue: VoteType, voteHash: string) => {
        // Attempt to use RPC if available (check scalability.sql), fallback to insert
        // For now, we use standard insert as per previous implementation to ensure stability
        const { error } = await supabase.from("votes").insert({
            shareholder_id: shareholderId,
            resolution_id: resolutionId,
            vote_value: voteValue,
            vote_hash: voteHash,
        });

        if (error) throw error;
        return true;
    },

    getSessionStats: async (resolutionIds: string[]) => {
        if (resolutionIds.length === 0) return [];

        const { data, error } = await supabase
            .from("vote_stats")
            .select("*")
            .in("resolution_id", resolutionIds);

        if (error) throw error;
        return data;
    },

    getCompanyShareholders: async (companyId: string): Promise<Shareholder[]> => {
        const { data, error } = await supabase
            .from("shareholders")
            .select("*")
            .eq("company_id", companyId);

        if (error) throw error;
        return data as unknown as Shareholder[];
    },

    submitFeedback: async (feedback: {
        session_id: string;
        shareholder_id?: string;
        content: string;
        sentiment_label: 'Positive' | 'Neutral' | 'Negative';
        sentiment_score: number;
        themes: string[];
    }) => {
        const { error } = await supabase
            .from("shareholder_feedback")
            .insert(feedback);

        if (error) throw error;
        return true;
    }
};
