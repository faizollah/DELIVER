const textInput = document.getElementById('text-input');
const analyzeButton = document.getElementById('analyze-button');
const result = document.getElementById('result');

analyzeButton.addEventListener('click', analyzeSentiment);

async function analyzeSentiment() {
    console.log("Analyze button clicked");
    const text = textInput.value.trim();

    if (!text) {
        showResult("Please enter some text.", "error");
        return;
    }

    showResult("Analyzing...", "info");

    try {
        console.log("Sending request to /analyze");
        console.log("Request payload:", JSON.stringify({ text }));

        const response = await fetch('/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });

        console.log("Response status:", response.status);
        console.log("Response headers:", Object.fromEntries(response.headers));

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Response data:", data);

        if (data.error) {
            showResult(data.error, "error");
        } else {
            const sentiment = data.sentiment;
            const confidence = data.confidence;
            showResult(`Sentiment: ${sentiment}, Confidence: ${confidence.toFixed(2)}`, "success");
        }
    } catch (error) {
        console.error('Fetch error:', error);
        showResult(`Error: ${error.message}. Check console for more details.`, "error");
    }
}

function showResult(message, type) {
    console.log("Showing result:", message, type);
    result.textContent = message;
    result.className = type;
}
function showLoading() {
    // Remove the "hidden" class from the loading overlay so it becomes visible.
    document.getElementById('loading').classList.remove('hidden');
}
