
// Native Deno.serve (no imports needed)

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        if (!GEMINI_API_KEY) {
            console.error('GEMINI_API_KEY is missing')
            throw new Error('Server configuration error: GEMINI_API_KEY is missing')
        }

        const { action, payload } = await req.json()
        console.log(`Received action: ${action}`)

        let prompt = ''

        switch (action) {
            case 'summarize':
                prompt = `Please provide a concise summary of the following document in bullet points. Focus on key financial figures, strategic decisions, and risks if any:\n\n${payload.text}`
                break

            case 'chat':
                prompt = `${payload.context ? `Context: ${payload.context}\n\n` : ''}User Question: ${payload.message}`
                break

            case 'sentiment':
                prompt = `Analyze the sentiment of the following shareholder feedback. Return a JSON object with: 
        1. "sentiment": "Positive", "Neutral", or "Negative"
        2. "score": a number between -1 (negative) and 1 (positive)
        3. "themes": an array of key themes mentioned (max 3)
        4. "summary": a one-sentence summary of the feedback.
        
        Feedback: "${payload.text}"
        
        Return ONLY the JSON object, no markdown formatting.`
                break

            case 'debug':
                const modelsResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`);
                const modelsData = await modelsResponse.json();
                return new Response(JSON.stringify(modelsData), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });

            default:
                throw new Error(`Invalid action: ${action}`)
        }

        // Call Gemini API
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            }),
        })

        if (!response.ok) {
            const errorData = await response.text()
            console.error('Gemini API Error:', errorData)
            throw new Error(`Gemini API Error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        console.log('Gemini response received')

        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            console.error('Unexpected Gemini response structure:', JSON.stringify(data))
            throw new Error('Invalid response structure from AI provider')
        }

        const generatedText = data.candidates[0].content.parts[0].text

        let result = generatedText
        if (action === 'sentiment') {
            try {
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
