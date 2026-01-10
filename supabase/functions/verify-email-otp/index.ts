import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { email, code } = await req.json();

        if (!email || !code) {
            throw new Error("Email and code are required");
        }

        // 1. Fetch Code
        const { data, error } = await supabase
            .from("verification_codes")
            .select("*")
            .eq("email", email.toLowerCase())
            .single();

        if (error || !data) {
            return new Response(
                JSON.stringify({ success: false, message: "Invalid or expired code" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 2. Check Expiry
        if (new Date(data.expires_at) < new Date()) {
            return new Response(
                JSON.stringify({ success: false, message: "Code has expired" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 3. Verify Code
        if (data.code !== code) { // If hashed, compare hash here
            return new Response(
                JSON.stringify({ success: false, message: "Incorrect code" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 4. Success - Delete used code
        await supabase.from("verification_codes").delete().eq("email", email.toLowerCase());

        return new Response(
            JSON.stringify({ success: true, message: "Verified" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error: any) {
        console.error(error);
        return new Response(
            JSON.stringify({ success: false, message: error.message }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
