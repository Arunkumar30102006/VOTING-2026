import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { amount, customerPhone, customerId, customerName, customerEmail } = await req.json()

        console.log("Creating Cashfree Order", { amount, customerId });


        // --- MOCK MODE (User Requested Removal of Keys) ---
        console.log("Mocking Order - Keys usage removed");
        const orderId = "ORDER_" + crypto.randomUUID().split('-')[0].toUpperCase();

        // Return a FAKE session ID. 
        // NOTE: The frontend Cashfree SDK might fail if it tries to use this, 
        // but this stops the Backend from crashing.
        return new Response(
            JSON.stringify({
                payment_session_id: "session_mock_" + crypto.randomUUID(),
                order_id: orderId
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

        /* 
        // CASHFREE LOGIC REMOVED/COMMENTED OUT
        const appId = Deno.env.get('CASHFREE_APP_ID');
        const secretKey = Deno.env.get('CASHFREE_SECRET_KEY');
        // ... (rest of the original code) ...
        */

    } catch (error) {
        console.error("Error:", error.message);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
