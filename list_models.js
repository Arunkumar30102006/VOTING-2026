
const apiKey = 'AIzaSyCNQzlk1-vZzINL_Qb9jtRb98JYyDzE2Uw';
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

async function listModels() {
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.models) {
            console.log('Available Models:');
            data.models.forEach(m => {
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')) {
                    console.log(m.name);
                }
            });
        } else {
            console.log('No models found or error:', data);
        }
    } catch (error) {
        console.error('Error fetching models:', error);
    }
}

listModels();
