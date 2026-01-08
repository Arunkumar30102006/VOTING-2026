import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface MeetingInviteRequest {
  votingSessionId: string;
  companyName: string;
  meetingTitle: string;
  meetingLink: string;
  meetingPassword?: string;
  meetingPlatform: string;
  startDate: string;
  endDate: string;
  votingInstructions?: string;
  recipients: Array<{
    email: string;
    name: string;
    type: "shareholder" | "nominee";
    shares?: number;
  }>;
}

const formatDateTime = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      votingSessionId,
      companyName,
      meetingTitle,
      meetingLink,
      meetingPassword,
      meetingPlatform,
      startDate,
      endDate,
      votingInstructions,
      recipients,
    }: MeetingInviteRequest = await req.json();

    console.log(`Sending meeting invites for session: ${votingSessionId}`);
    console.log(`Total recipients: ${recipients.length}`);

    if (!recipients || recipients.length === 0) {
      throw new Error("No recipients provided");
    }

    const emailPromises = recipients.map(async (recipient) => {
      const isNominee = recipient.type === "nominee";

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f7fa;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <tr>
              <td style="background: linear-gradient(135deg, #1e3a5f 0%, #2d4a6f 50%, #f59e0b 100%); padding: 40px 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">
                  ${isNominee ? "📋 Nomination Notification" : "🗳️ Meeting & Voting Invitation"}
                </h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">
                  ${companyName}
                </p>
              </td>
            </tr>
            
            <!-- Main Content -->
            <tr>
              <td style="padding: 40px 30px;">
                <p style="color: #1e3a5f; font-size: 18px; margin: 0 0 20px;">
                  Dear ${recipient.name},
                </p>
                
                ${isNominee ? `
                  <p style="color: #4a5568; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
                    We are pleased to inform you that you have been <strong style="color: #f59e0b;">nominated</strong> for the upcoming voting session. Please join the online meeting at the scheduled time.
                  </p>
                ` : `
                  <p style="color: #4a5568; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
                    You are invited to participate in the <strong style="color: #1e3a5f;">Annual General Meeting (AGM)</strong> and exercise your voting rights. ${recipient.shares ? `Your voting shares: <strong>${recipient.shares.toLocaleString()}</strong>` : ""}
                  </p>
                `}
                
                <!-- Meeting Details Card -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 12px; margin: 25px 0; border: 1px solid #e2e8f0;">
                  <tr>
                    <td style="padding: 25px;">
                      <h2 style="color: #1e3a5f; font-size: 18px; margin: 0 0 20px; border-bottom: 2px solid #f59e0b; padding-bottom: 10px;">
                        📅 Meeting Details
                      </h2>
                      
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding: 8px 0; color: #718096; font-size: 14px; width: 120px;">Meeting Title:</td>
                          <td style="padding: 8px 0; color: #1e3a5f; font-size: 14px; font-weight: 600;">${meetingTitle}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #718096; font-size: 14px;">Platform:</td>
                          <td style="padding: 8px 0; color: #1e3a5f; font-size: 14px; font-weight: 600; text-transform: capitalize;">${meetingPlatform}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #718096; font-size: 14px;">Start Time:</td>
                          <td style="padding: 8px 0; color: #10b981; font-size: 14px; font-weight: 600;">${formatDateTime(startDate)} IST</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #718096; font-size: 14px;">End Time:</td>
                          <td style="padding: 8px 0; color: #ef4444; font-size: 14px; font-weight: 600;">${formatDateTime(endDate)} IST</td>
                        </tr>
                        ${meetingPassword ? `
                        <tr>
                          <td style="padding: 8px 0; color: #718096; font-size: 14px;">Password:</td>
                          <td style="padding: 8px 0; color: #1e3a5f; font-size: 14px; font-weight: 600; font-family: monospace; background: #e2e8f0; padding: 4px 8px; border-radius: 4px; display: inline-block;">${meetingPassword}</td>
                        </tr>
                        ` : ""}
                      </table>
                    </td>
                  </tr>
                </table>
                
                <!-- Join Button -->
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="text-align: center; padding: 20px 0;">
                      <a href="${meetingLink}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);">
                        🔗 Join Meeting
                      </a>
                    </td>
                  </tr>
                </table>
                
                ${votingInstructions ? `
                <!-- Voting Instructions -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fffbeb; border-radius: 12px; margin: 25px 0; border: 1px solid #fcd34d;">
                  <tr>
                    <td style="padding: 25px;">
                      <h3 style="color: #92400e; font-size: 16px; margin: 0 0 15px;">
                        📋 Voting Instructions
                      </h3>
                      <p style="color: #78350f; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-line;">
                        ${votingInstructions}
                      </p>
                    </td>
                  </tr>
                </table>
                ` : ""}
                
                <!-- Important Notes -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; border-radius: 12px; margin: 25px 0; border: 1px solid #86efac;">
                  <tr>
                    <td style="padding: 25px;">
                      <h3 style="color: #166534; font-size: 16px; margin: 0 0 15px;">
                        ✅ Important Notes
                      </h3>
                      <ul style="color: #166534; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                        <li>Please join the meeting 5-10 minutes before the scheduled start time</li>
                        <li>Ensure stable internet connectivity for uninterrupted participation</li>
                        <li>Keep this email for your reference</li>
                        ${!isNominee ? "<li>Your vote will be recorded securely and is final once submitted</li>" : ""}
                      </ul>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            
            <!-- Footer -->
            <tr>
              <td style="background-color: #1e3a5f; padding: 30px; text-align: center;">
                <p style="color: rgba(255,255,255,0.8); font-size: 14px; margin: 0 0 10px;">
                  This is an automated message from ${companyName}
                </p>
                <p style="color: rgba(255,255,255,0.6); font-size: 12px; margin: 0;">
                  © ${new Date().getFullYear()} ${companyName}. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      try {
        const result = await resend.emails.send({
          from: `${companyName} <notifications@shareholdervoting.in>`,
          to: [recipient.email],
          subject: isNominee
            ? `Nomination Notification - ${meetingTitle}`
            : `AGM Invitation & Voting Notice - ${meetingTitle}`,
          html,
        });

        console.log(`Email sent to ${recipient.email}:`, result);
        return { success: true, email: recipient.email };
      } catch (emailError: any) {
        console.error(`Failed to send email to ${recipient.email}:`, emailError);
        return { success: false, email: recipient.email, error: emailError?.message || "Unknown error" };
      }
    });

    const results = await Promise.all(emailPromises);
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    console.log(`Emails sent: ${successCount} success, ${failedCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        failed: failedCount,
        results
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-meeting-invites function:", error);
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
