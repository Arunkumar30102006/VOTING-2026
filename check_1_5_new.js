
const apiKey = 'AIzaSyBn6Waz5ze71xyPWeQg4tmWq5UjPPS0ufU';
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash?key=${apiKey}`;

async function checkModel() {
    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log('Model Info:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

checkModel();
