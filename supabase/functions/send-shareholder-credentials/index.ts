import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CredentialsEmailRequest {
  type?: "credentials" | "otp"; // Default to "credentials" for backward compatibility
  shareholderEmail?: string; // Optional for OTP
  email?: string; // Standardized email field
  shareholderName?: string;
  companyName: string;
  loginId?: string;
  password?: string;
  otp?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      type = "credentials",
      shareholderEmail,
      email,
      shareholderName,
      companyName,
      loginId,
      password,
      otp
    }: CredentialsEmailRequest = await req.json();

    const targetEmail = email || shareholderEmail;

    if (!targetEmail || !companyName) {
      throw new Error("Missing email or company name");
    }

    console.log(`Processing ${type} email for ${targetEmail}`);

    let subject = "";
    let html = "";

    if (type === "otp") {
      if (!otp) throw new Error("OTP is required");
      subject = `Deregistration Verification Code - ${companyName}`;
      html = `
        <!DOCTYPE html>
        <html>
        <body style="font-family: sans-serif; background-color: #fca5a5; padding: 20px;">
          <div style="background-color: white; padding: 20px; border-radius: 10px; border: 1px solid #ef4444;">
            <h2 style="color: #b91c1c;">Deregistration Request</h2>
            <p>You have requested to deregister <strong>${companyName}</strong>.</p>
            <p>This action will <strong>permanently delete</strong> all company data, including shareholders and voting records.</p>
            <p>Use the following OTP to confirm this action:</p>
            <div style="background-color: #f3f4f6; padding: 10px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px;">
              ${otp}
            </div>
            <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">If you did not request this, please contact support immediately.</p>
          </div>
        </body>
        </html>
        `;
    } else {
      // Default: Credentials
      if (!shareholderName || !loginId || !password) throw new Error("Missing credentials fields");
      subject = `Your E-Voting Credentials for ${companyName}`;
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>E-Voting Credentials</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #3b82f6, #10b981); border-radius: 12px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 24px; font-weight: bold;">✓</span>
              </div>
              <h1 style="color: #f8fafc; font-size: 24px; margin: 0 0 8px;">E-Voting Platform</h1>
              <p style="color: #94a3b8; font-size: 14px; margin: 0;">Secure Digital Voting for Shareholders</p>
            </div>
            
            <!-- Main Card -->
            <div style="background: linear-gradient(135deg, #1e293b, #0f172a); border: 1px solid #334155; border-radius: 16px; padding: 32px; margin-bottom: 24px;">
              <h2 style="color: #f8fafc; font-size: 20px; margin: 0 0 8px;">Hello ${shareholderName},</h2>
              <p style="color: #94a3b8; font-size: 14px; margin: 0 0 24px;">
                You have been registered as a shareholder of <strong style="color: #f97316;">${companyName}</strong>. 
                Please use the credentials below to access the e-voting portal.
              </p>
              
              <!-- Credentials Box -->
              <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <h3 style="color: #3b82f6; font-size: 14px; font-weight: 600; margin: 0 0 16px; text-transform: uppercase; letter-spacing: 1px;">Your Login Credentials</h3>
                
                <div style="margin-bottom: 16px;">
                  <p style="color: #94a3b8; font-size: 12px; margin: 0 0 4px;">USER ID</p>
                  <div style="background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 12px 16px;">
                    <code style="color: #22d3ee; font-size: 18px; font-weight: 600; font-family: 'Courier New', monospace;">${loginId}</code>
                  </div>
                </div>
                
                <div>
                  <p style="color: #94a3b8; font-size: 12px; margin: 0 0 4px;">PASSWORD</p>
                  <div style="background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 12px 16px;">
                    <code style="color: #22d3ee; font-size: 18px; font-weight: 600; font-family: 'Courier New', monospace;">${password}</code>
                  </div>
                </div>
              </div>
              
              <!-- Security Notice -->
              <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 8px; padding: 16px;">
                <p style="color: #fbbf24; font-size: 12px; font-weight: 600; margin: 0 0 4px;">⚠️ IMPORTANT SECURITY NOTICE</p>
                <ul style="color: #94a3b8; font-size: 12px; margin: 0; padding-left: 16px;">
                  <li style="margin-bottom: 4px;">This is a one-time credential. It will be invalidated after first use.</li>
                  <li style="margin-bottom: 4px;">Do not share these credentials with anyone.</li>
                  <li>Delete this email after saving your credentials securely.</li>
                </ul>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center;">
              <p style="color: #64748b; font-size: 12px; margin: 0;">
                This is an automated message from the E-Voting Platform.<br>
                If you did not expect this email, please contact your company administrator.
              </p>
            </div>
          </div>
        </body>
        </html>
        `;
    }

    // Direct fetch call to avoid "Bundle Generation Timeout" with large SDKs
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "E-Voting Platform <notifications@shareholdervoting.in>",
        to: [targetEmail],
        subject: subject,
        html: html,
      }),
    });

    const data = await res.json();
    console.log("Email API response:", data);

    if (!res.ok) {
      throw new Error(data.message || "Failed to send email");
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-shareholder-credentials function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);