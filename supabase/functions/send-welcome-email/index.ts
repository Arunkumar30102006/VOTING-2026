import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, companyName, cin, adminName, address, phone } = await req.json();
    const FRONTEND_URL = Deno.env.get("FRONTEND_URL") || "https://www.shareholdervoting.in";

    if (!email || !companyName) {
      throw new Error("Email and Company Name are required");
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
        subject: "Welcome to Vote India - Registration Successful!",
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to Vote India</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 0; color: #ffffff;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #0f172a; padding: 20px;">
    
    <!-- Logo/Header -->
    <div style="text-align: center; margin-bottom: 30px; margin-top: 20px;">
      <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border-radius: 12px; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 30px; color: white;">&#127970;</span>
      </div>
      <h1 style="color: #ffffff; font-size: 24px; margin: 0; font-weight: 700;">Registration Successful!</h1>
      <p style="color: #94a3b8; font-size: 14px; margin: 5px 0 0;">Your company is now secure with Vote India</p>
    </div>

    <!-- Main Card -->
    <div style="background-color: #1e293b; border-radius: 16px; padding: 40px; border: 1px solid #334155; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
      <h2 style="color: #f8fafc; font-size: 20px; margin-top: 0; margin-bottom: 20px;">Hello ${adminName},</h2>
      
      <p style="color: #cbd5e1; font-size: 16px; line-height: 24px; margin-bottom: 24px;">
        Congratulations! <strong>${companyName}</strong> has been successfully registered on our secure e-voting platform.
      </p>

      <div style="background-color: #0f172a; border-radius: 12px; padding: 25px; border: 1px solid #334155; margin-bottom: 25px;">
        <h3 style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-top: 0; margin-bottom: 15px;">Company Profile</h3>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #94a3b8; font-size: 14px; width: 40%;">CIN Number:</td>
            <td style="padding: 8px 0; color: #ffffff; font-size: 14px; font-weight: 500;">${cin}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #94a3b8; font-size: 14px;">User ID (Email):</td>
            <td style="padding: 8px 0; color: #ffffff; font-size: 14px; font-weight: 500;">${email}</td>
          </tr>
          <tr>
             <td style="padding: 8px 0; color: #94a3b8; font-size: 14px;">Contact Phone:</td>
             <td style="padding: 8px 0; color: #ffffff; font-size: 14px; font-weight: 500;">${phone || "N/A"}</td>
          </tr>
        </table>
        
        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #1e293b;">
            <p style="color: #94a3b8; font-size: 14px; margin: 0 0 5px;">Registered Address:</p>
            <p style="color: #cbd5e1; font-size: 14px; margin: 0; line-height: 1.5;">${address}</p>
        </div>
      </div>

      <div style="text-align: center; margin-top: 30px;">
        <a href="${FRONTEND_URL}/company-login" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; display: inline-block;">Login to Dashboard</a>
      </div>
      
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 30px;">
      <p style="color: #64748b; font-size: 12px;">
        &copy; ${new Date().getFullYear()} Vote India Secure. All rights reserved.<br>
        This is an automated message, please do not reply.
      </p>
    </div>
  </div>
</body>
</html>
                `,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Resend Error: ${text}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Welcome email sent" }),
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
