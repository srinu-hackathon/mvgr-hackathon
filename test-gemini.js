const fs = require('fs');
require('dotenv').config();
const key = process.env.VITE_GEMINI_API_KEY_1;

async function test() {
    const base64Data = Buffer.from('hello').toString('base64');
    console.log("Testing key...", key ? "Found" : "Missing");

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{
                parts: [
                    { text: "What is this?" },
                    {
                        inline_data: {
                            mime_type: 'image/png',
                            data: base64Data
                        }
                    }
                ]
            }],
            generationConfig: { maxOutputTokens: 10 }
        })
    });

    const text = await response.text();
    console.log("Status:", response.status);
    console.log("Response:", text);
}
test();
