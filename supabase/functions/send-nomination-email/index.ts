import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { name, email, designation, companyName, qualification, bio } = await req.json();

        if (!email || !name || !companyName) {
            throw new Error("Missing required fields: email, name, or companyName");
        }

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
                from: "Vote India <admin@shareholdervoting.in>",
                to: [email],
                subject: `Nomination Alert: You have been nominated as ${designation || "Director"}`,
                html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Nomination Notification</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #1e293b;">
  <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); padding: 30px; text-align: center;">
      <h1 style="color: #ffffff; font-size: 24px; margin: 0; font-weight: 700;">Nomination Notification</h1>
      <p style="color: #e0e7ff; font-size: 14px; margin: 10px 0 0;">Vote India Secure Platform</p>
    </div>

    <!-- Content -->
    <div style="padding: 40px;">
      <h2 style="color: #1e293b; font-size: 20px; margin-top: 0; margin-bottom: 20px;">Hello ${name},</h2>
      
      <p style="font-size: 16px; line-height: 26px; color: #475569; margin-bottom: 24px;">
        We are pleased to inform you that you have been nominated for a leadership position at <strong>${companyName}</strong>.
      </p>

      <div style="background-color: #f1f5f9; border-left: 4px solid #4f46e5; border-radius: 4px; padding: 20px; margin-bottom: 30px;">
        <h3 style="margin: 0 0 15px 0; color: #334155; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">Nomination Details</h3>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-size: 14px; color: #64748b; width: 120px;">Position:</td>
            <td style="padding: 8px 0; font-size: 14px; color: #1e293b; font-weight: 600;">${designation || "Director"}</td>
          </tr>
          ${qualification ? `
          <tr>
            <td style="padding: 8px 0; font-size: 14px; color: #64748b;">Qualification:</td>
            <td style="padding: 8px 0; font-size: 14px; color: #1e293b; font-weight: 600;">${qualification}</td>
          </tr>
          ` : ''}
          ${bio ? `
          <tr>
            <td style="padding: 8px 0; font-size: 14px; color: #64748b;">Summary:</td>
            <td style="padding: 8px 0; font-size: 14px; color: #1e293b;">${bio}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      <p style="font-size: 16px; line-height: 26px; color: #475569; margin-bottom: 30px;">
        Your nomination will be put to vote in the upcoming Annual General Meeting (AGM). You will receive further details regarding the meeting schedule and results.
      </p>
      
      <div style="text-align: center;">
        <a href="https://www.shareholdervoting.in" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 16px;">Visit Platform</a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">
        &copy; ${new Date().getFullYear()} Vote India Secure. All rights reserved.<br>
        Powered by Blockchain & AI Tech
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

        const data = await res.json();
        console.log("Nomination email sent successfully:", data);

        return new Response(
            JSON.stringify({ success: true, message: "Nomination email sent" }),
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
