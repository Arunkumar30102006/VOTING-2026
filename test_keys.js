
const keys = [
    '-AIzaSyBn6Waz5ze71xyPWeQg4tmWq5UjPPS0ufU', // Current value
    'AIzaSyBn6Waz5ze71xyPWeQg4tmWq5UjPPS0ufU',  // Likely correct value (removed dash)
    'AIzaSyCNQzlk1-vZzINL_Qb9jtRb98JYyDzE2Uw'   // Old key (for reference)
];

const models = [
    'gemini-1.5-flash',
    'gemini-2.0-flash-lite-001',
    'gemini-2.0-flash'
];

async function testKey(key, model) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Hi" }] }]
            })
        });
        const data = await response.json();
        if (response.ok) {
            console.log(`[SUCCESS] Key: ${key.substring(0, 10)}... | Model: ${model}`);
            return true;
        } else {
            console.log(`[FAILED]  Key: ${key.substring(0, 10)}... | Model: ${model} | Error: ${data.error ? data.error.message : response.status}`);
            return false;
        }
    } catch (e) {
        console.log(`[ERROR]   Key: ${key.substring(0, 10)}... | Model: ${model} | Error: ${e.message}`);
        return false;
    }
}

async function run() {
    console.log("Starting Key Diagnostics...");
    for (const key of keys) {
        for (const model of models) {
            await testKey(key, model);
        }
    }
}

run();
