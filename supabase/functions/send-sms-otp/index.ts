import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { shareholder_id, phone } = await req.json();

        if (!shareholder_id || !phone) {
            throw new Error("Missing shareholder_id or phone number");
        }

        console.log(`Generating OTP for shareholder: ${shareholder_id}, phone: ${phone}`);

        // 1. Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // 2. Hash the OTP for storage
        const encoder = new TextEncoder();
        const data = encoder.encode(otp);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const otpHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

        // 3. Store OTP and Expiry in Database
        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const { error: updateError } = await supabaseAdmin
            .from("shareholders")
            .update({
                otp_code: otpHash,
                otp_expiry: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes validity
            })
            .eq("id", shareholder_id);

        if (updateError) {
            console.error("Database update error:", updateError);
            throw new Error("Failed to store OTP");
        }

        // 4. Send SMS via Twilio
        const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
        const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
        const fromNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

        if (!accountSid || !authToken || !fromNumber) {
            console.error("Twilio credentials missing");
            throw new Error("Twilio credentials are not configured on the server");
        }

        const messageBody = `Your Vote-India Verification Code is: ${otp}. Valid for 5 minutes.`;

        // Twilio API requires form-urlencoded body
        const body = new URLSearchParams({
            To: phone,
            From: fromNumber,
            Body: messageBody,
        });

        console.log("Sending SMS via Twilio...");
        const twilioRes = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
            {
                method: "POST",
                headers: {
                    "Authorization": "Basic " + btoa(`${accountSid}:${authToken}`),
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: body,
            }
        );

        if (!twilioRes.ok) {
            const errorText = await twilioRes.text();
            console.error("Twilio API Error:", errorText);
            throw new Error(`Twilio SMS Failed: ${twilioRes.statusText}`);
        }

        const twilioData = await twilioRes.json();
        console.log("Twilio Response:", twilioData);

        return new Response(
            JSON.stringify({ success: true, message: "OTP sent" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error: any) {
        console.error(error);
        // Return 200 even on error so client can read the message
        return new Response(
            JSON.stringify({ success: false, message: error.message }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
