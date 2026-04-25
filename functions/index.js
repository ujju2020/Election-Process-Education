/**
 * Matdan Sathi - Backend Proxy for Gemini AI
 * This function keeps the API Key secret from the client-side.
 * Copyright (c) 2026 Ujjwal Kumar Bhowmick.
 */

const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const { defineSecret } = require('firebase-functions/params');

// Securely define the secret (must be set in Firebase Console or via CLI)
const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');

exports.askGemini = onRequest({ 
    secrets: [GEMINI_API_KEY], 
    cors: true,
    region: "us-central1" // Default region
}, async (req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(204).send('');
    }

    const { prompt, lang } = req.body;
    if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
    }

    const langContext = lang === 'hi' ? 'Respond in Hindi.' : lang === 'bn' ? 'Respond in Bengali.' : 'Respond in English.';
    const systemInstruction = `You are Matdan Sathi, an expert on the Indian Election Process. Keep your answers concise, helpful, and neutral. ${langContext}`;

    try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY.value()}`;
        
        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: { text: systemInstruction } },
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            logger.error("Gemini API Error Response", errData);
            throw new Error(`Gemini API Error: ${response.status}`);
        }

        const data = await response.json();
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
        
        res.set('Access-Control-Allow-Origin', '*');
        res.json({ text: aiText });
    } catch (error) {
        logger.error("Cloud Function Error:", error.message);
        res.set('Access-Control-Allow-Origin', '*');
        res.status(500).json({ error: "Failed to fetch AI response" });
    }
});
