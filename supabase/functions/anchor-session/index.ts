import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AnchorRequest {
    sessionId: string;
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        const { sessionId } = await req.json() as AnchorRequest;

        if (!sessionId) {
            throw new Error("sessionId is required");
        }

        // 1. Fetch all votes for the session
        const { data: resolutions, error: resError } = await supabase
            .from("resolutions")
            .select("id")
            .eq("voting_session_id", sessionId);

        if (resError || !resolutions) throw new Error("Could not find resolutions for session");

        const resolutionIds = resolutions.map(r => r.id);

        const { data: votes, error: votesError } = await supabase
            .from("votes")
            .select("id, vote_hash")
            .in("resolution_id", resolutionIds)
            .order("vote_hash", { ascending: true });

        if (votesError || !votes) throw new Error("Could not fetch votes");

        if (votes.length === 0) {
            return new Response(JSON.stringify({ success: true, message: "No votes to anchor" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // 2. Build Merkle Tree
        const hashes = votes.map(v => v.vote_hash);

        // Simplistic Merkle Tree builder (SHA-256)
        const sha256 = async (data: string): Promise<string> => {
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(data);
            const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
            return Array.from(new Uint8Array(hashBuffer))
                .map(b => b.toString(16).padStart(2, "0"))
                .join("");
        };

        let layers: string[][] = [hashes];
        let currentLayer = hashes;

        while (currentLayer.length > 1) {
            const nextLayer: string[] = [];
            for (let i = 0; i < currentLayer.length; i += 2) {
                if (i + 1 < currentLayer.length) {
                    nextLayer.push(await sha256(currentLayer[i] + currentLayer[i + 1]));
                } else {
                    nextLayer.push(currentLayer[i]);
                }
            }
            currentLayer = nextLayer;
            layers.push(currentLayer);
        }

        const rootHash = currentLayer[0];

        // 3. Update votes with leaf_index
        const updatePromises = votes.map((vote, index) =>
            supabase.from("votes").update({ leaf_index: index }).eq("id", vote.id)
        );
        await Promise.all(updatePromises);

        // 4. Store Anchor Data
        const { error: anchorError } = await supabase
            .from("block_anchors")
            .upsert({
                session_id: sessionId,
                merkle_root: rootHash,
                vote_count: votes.length,
                merkle_tree: { layers }, // Store layers for fast proof generation
                started_at: new Date().toISOString(), // Period start
                ended_at: new Date().toISOString(), // Period end
                transaction_id: `mock-tx-${Math.random().toString(36).substring(2)}`
            }, { onConflict: 'session_id' });

        if (anchorError) throw anchorError;

        return new Response(JSON.stringify({
            success: true,
            merkleRoot: rootHash,
            voteCount: votes.length
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error: any) {
        console.error(error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
