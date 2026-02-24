// Native Deno.serve (no imports needed)

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        if (!GROQ_API_KEY) {
            console.error('GROQ_API_KEY is missing')
            throw new Error('Server configuration error: GROQ_API_KEY is missing')
        }

        const { action, payload } = await req.json()
        console.log(`Received action: ${action}`)

        let systemPrompt = ''
        let userPrompt = ''

        switch (action) {
            case 'summarize':
                systemPrompt = 'You are a helpful AI that summarizes documents. Provide a concise summary in bullet points, focusing on key financial figures, strategic decisions, and risks.'
                userPrompt = payload.text
                break

            case 'chat':
                systemPrompt = payload.context || 'You are a helpful assistant.'
                userPrompt = payload.message
                break

            case 'sentiment':
                systemPrompt = `Analyze the sentiment of the provided shareholder feedback. 
                Return a JSON object with: 
                1. "sentiment": "Positive", "Neutral", or "Negative"
                2. "score": a number between -1 (negative) and 1 (positive)
                3. "themes": an array of strings (max 3 themes)
                4. "summary": a one-sentence summary.
                
                IMPORTANT: Return ONLY the raw JSON object. Do not wrap in markdown blocks.`
                userPrompt = payload.text
                break

            case 'debug':
                return new Response(JSON.stringify({ status: 'Groq Ready' }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });

            default:
                throw new Error(`Invalid action: ${action}`)
        }

        // Content Truncation Protection (Prevents Groq 413 Payload Too Large)
        const MAX_PAYLOAD_CHARS = 15000;
        const truncatedUserPrompt = userPrompt && userPrompt.length > MAX_PAYLOAD_CHARS
            ? userPrompt.substring(0, MAX_PAYLOAD_CHARS) + "\n\n[Content truncated due to size limits...]"
            : userPrompt;

        // Call Groq API with Retry Logic
        const makeGroqRequest = async (retryCount = 0): Promise<Response> => {
            try {
                const response = await fetch(GROQ_API_URL, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${GROQ_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: "llama-3.3-70b-versatile",
                        messages: [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: truncatedUserPrompt }
                        ],
                        response_format: action === 'sentiment' ? { type: "json_object" } : undefined
                    }),
                });

                if (response.status === 429) {
                    if (retryCount < 3) {
                        const delay = Math.pow(2, retryCount) * 1000 + Math.random() * 1000;
                        console.warn(`Groq 429 hit. Retrying in ${Math.round(delay)}ms...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        return makeGroqRequest(retryCount + 1);
                    } else {
                        throw new Error('Rate limit exceeded. Please try again later.');
                    }
                }

                if (!response.ok) {
                    const errorData = await response.text();
                    console.error('Groq API Error:', errorData);
                    throw new Error(`Groq API Error: ${response.status} ${response.statusText}`);
                }

                return response;
            } catch (error) {
                if (retryCount < 3 && (error instanceof TypeError || (error as any).message.includes('network'))) {
                    const delay = 1000;
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return makeGroqRequest(retryCount + 1);
                }
                throw error;
            }
        };

        const response = await makeGroqRequest();
        const data = await response.json()

        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            console.error('Unexpected Groq response structure:', JSON.stringify(data))
            throw new Error('Invalid response structure from AI provider')
        }

        const generatedText = data.choices[0].message.content

        let result = generatedText
        if (action === 'sentiment') {
            try {
                // Ensure no markdown fencing if model ignores system prompt strictness
                const cleanJson = generatedText.replace(/```json/g, '').replace(/```/g, '').trim()
                result = JSON.parse(cleanJson)
            } catch (e) {
                console.error('Failed to parse sentiment JSON', e)
                result = { sentiment: 'Neutral', score: 0, themes: ['Error parsing'], summary: generatedText }
            }
        }

        return new Response(JSON.stringify({ result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error: any) {
        console.error('Function Error:', error)
        return new Response(
            JSON.stringify({ result: `System Error: ${error.message}` }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    }
})
