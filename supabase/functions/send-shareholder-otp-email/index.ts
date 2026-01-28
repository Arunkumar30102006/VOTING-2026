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
        const { shareholder_id, email, name } = await req.json();

        if (!shareholder_id || !email) {
            throw new Error("Missing shareholder_id or email");
        }

        console.log(`Generating OTP for shareholder: ${shareholder_id}, email: ${email}`);

        // 1. Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // 2. Hash the OTP for storage
        const encoder = new TextEncoder();
        const data = encoder.encode(otp);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const otpHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

        // 3. Store OTP and Expiry in Database
        // Note: We need the SERVICE_ROLE_KEY to bypass potential RLS if the user isn't fully logged in yet,
        // though usually for initial login logic we might use anon if policies allow, but admin is safer for updates.
        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const { error: updateError } = await supabaseAdmin
            .from("shareholders")
            .update({
                otp_code: otpHash,
                otp_expiry: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes validity
            })
            .eq("id", shareholder_id);

        if (updateError) {
            console.error("Database update error:", updateError);
            throw new Error("Failed to store OTP");
        }

        // 4. Send Email via Resend
        const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
        if (!RESEND_API_KEY) {
            throw new Error("RESEND_API_KEY is not set");
        }

        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: "Vote India <admin@shareholdervoting.in>", // Using consistent sender
                to: [email],
                subject: "Your Secure Login OTP",
                html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Shareholder Login OTP</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 0; color: #ffffff;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #0f172a; padding: 20px;">
    
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px; margin-top: 20px;">
      <h1 style="color: #ffffff; font-size: 24px; margin: 0; font-weight: 700;">Secure Login Verification</h1>
      <p style="color: #94a3b8; font-size: 14px; margin: 5px 0 0;">Vote India Secure Platform</p>
    </div>

    <!-- Main Card -->
    <div style="background-color: #1e293b; border-radius: 16px; padding: 40px; border: 1px solid #334155;">
      <h2 style="color: #f8fafc; font-size: 20px; margin-top: 0; margin-bottom: 20px;">Hello ${name || "Shareholder"},</h2>
      
      <p style="color: #cbd5e1; font-size: 16px; line-height: 24px; margin-bottom: 24px;">
        To securely access your voting dashboard, please use the One-Time Password (OTP) below.
      </p>

      <!-- OTP Box -->
      <div style="background-color: #0f172a; border-radius: 8px; padding: 20px; text-align: center; border: 1px solid #3b82f6; margin: 30px 0;">
        <span style="font-family: 'Courier New', monospace; font-size: 32px; font-weight: 700; color: #38bdf8; letter-spacing: 8px;">${otp}</span>
      </div>
      
      <p style="color: #94a3b8; font-size: 14px; text-align: center; margin-bottom: 0;">
        This code is valid for 10 minutes. Do not share this code with anyone.
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 30px;">
      <p style="color: #64748b; font-size: 12px;">
        &copy; ${new Date().getFullYear()} Vote India Secure. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
                `,
            }),
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error("Resend API Error:", errorText);
            throw new Error(`Email sending failed: ${errorText}`);
        }

        const resData = await res.json();
        console.log("Email sent successfully:", resData);

        return new Response(
            JSON.stringify({ success: true, message: "OTP sent via email" }),
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
