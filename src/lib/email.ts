
interface EmailParams {
    to: string;
    subject: string;
    html: string;
}

export const sendEmail = async ({ to, subject, html }: EmailParams) => {
    const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY;

    if (!RESEND_API_KEY) {
        console.error("Missing VITE_RESEND_API_KEY");
        throw new Error("Email configuration missing");
    }

    // ON FREE TIER: We can only send to the verified email.
    // We override the destination to the user's email for testing purposes.
    const VERIFIED_EMAIL = "arunkumar30102006@gmail.com";

    try {
        const response = await fetch("/resend-api/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: "Vote India <onboarding@resend.dev>",
                to: [VERIFIED_EMAIL], // FORCE delivery to verified email
                subject: `[For: ${to}] ${subject}`, // Show original recipient in subject
                html: html,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to send email");
        }

        return await response.json();
    } catch (error) {
        console.error("Email sending failed:", error);
        throw error;
    }
};
