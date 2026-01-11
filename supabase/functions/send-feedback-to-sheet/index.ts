
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as jose from "https://deno.land/x/jose@v4.14.4/index.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const payload = await req.json();
        console.log("Payload:", payload);

        // 1. Get Secrets
        const serviceAccountEmail = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_EMAIL");
        const privateKey = Deno.env.get("GOOGLE_PRIVATE_KEY")?.replace(/\\n/g, "\n");
        const sheetId = Deno.env.get("GOOGLE_SHEET_ID");

        if (!serviceAccountEmail || !privateKey || !sheetId) {
            throw new Error("Missing Google Credentials");
        }

        // 2. Create JWT for Access Token (Manual signing to avoid heavy libraries)
        const alg = 'RS256';
        const pk = await jose.importPKCS8(privateKey, alg);

        const jwt = await new jose.SignJWT({
            scope: 'https://www.googleapis.com/auth/spreadsheets'
        })
            .setProtectedHeader({ alg })
            .setIssuer(serviceAccountEmail)
            .setAudience('https://oauth2.googleapis.com/token')
            .setExpirationTime('1h')
            .setIssuedAt()
            .sign(pk);

        // 3. Exchange JWT for Access Token
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
                assertion: jwt,
            }),
        });

        const tokenData = await tokenRes.json();
        const accessToken = tokenData.access_token;

        if (!accessToken) {
            throw new Error("Failed to generate Access Token from Google: " + JSON.stringify(tokenData));
        }

        // 4. Append to Sheet
        const date = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

        let rowValues = [];
        if (payload.type === 'website') {
            rowValues = [
                date, "Website Feedback", payload.email || "Anonymous", payload.category || "-", payload.pageName || "-", payload.rating, payload.message || ""
            ];
        } else {
            rowValues = [
                date, "Company Rating", payload.email || "Anonymous", payload.companyName || "-", payload.rating, payload.message || ""
            ];
        }

        const appendRes = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1!A1:append?valueInputOption=USER_ENTERED`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ values: [rowValues] }),
            }
        );

        if (!appendRes.ok) {
            const errorText = await appendRes.text();
            throw new Error("Google Sheets API Error: " + errorText);
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json", ...corsHeaders },
            status: 200,
        });

    } catch (error) {
        console.error("Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { "Content-Type": "application/json", ...corsHeaders },
            status: 500, // Return 500 to see the error in frontend if possible
        });
    }
});
