import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { firstname, lastname, email, subject, message } = await req.json();

        if (!email || !message) {
            throw new Error("Email and Message are required");
        }

        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: "Vote India Contact <admin@shareholdervoting.in>",
                to: ["admin@shareholdervoting.in", "arunkumar30102006@gmail.com"],
                reply_to: email,
                subject: `[Contact Form] ${subject || "New Message"}`,
                html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: sans-serif; padding: 20px;">
  <h2>New Contact Form Submission</h2>
  <hr />
  <p><strong>From:</strong> ${firstname} ${lastname}</p>
  <p><strong>Email:</strong> ${email}</p>
  <p><strong>Subject:</strong> ${subject}</p>
  <hr />
  <h3>Message:</h3>
  <p style="white-space: pre-wrap;">${message}</p>
</body>
</html>
        `,
            }),
        });

        if (!res.ok) {
            const text = await res.text();
            console.error("Resend API Error:", text);
            throw new Error(`Failed to send email: ${text}`);
        }

        const data = await res.json();

        return new Response(
            JSON.stringify({ success: true, id: data.id }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error: any) {
        console.error("Error in send-contact-message:", error);
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            }
        );
    }
});
