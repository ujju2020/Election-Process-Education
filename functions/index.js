/**
 * Matdan Sathi - Backend Proxy for Gemini AI
 * This function keeps the API Key secret from the client-side.
 * Copyright (c) 2026 Ujjwal Kumar Bhowmick.
 */

const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const { defineSecret } = require('firebase-functions/params');

// Securely define the secret
const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');

/**
 * CORS helper - sets headers on every response
 */
function setCORS(res) {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.set('Access-Control-Max-Age', '3600');
}

exports.askGemini = onRequest({ 
    secrets: [GEMINI_API_KEY], 
    invoker: 'public',
    region: "us-central1"
}, async (req, res) => {
    // Always set CORS headers first
    setCORS(res);

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return res.status(204).send('');
    }

    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { prompt, lang } = req.body || {};
    if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
    }

    const langContext = lang === 'hi' ? 'Respond in Hindi.' 
                      : lang === 'bn' ? 'Respond in Bengali.' 
                      : 'Respond in English.';
    const systemInstruction = `You are Matdan Sathi, an expert on the Indian Election Process. Keep your answers concise, helpful, and neutral. ${langContext}`;

    try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY.value()}`;
        
        const geminiResp = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: { text: systemInstruction } },
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!geminiResp.ok) {
            const errData = await geminiResp.json();
            logger.error("Gemini API Error", errData);
            throw new Error(`Gemini API Error: ${geminiResp.status}`);
        }

        const data = await geminiResp.json();
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
        
        logger.info("askGemini: success", { lang });
        return res.status(200).json({ text: aiText });

    } catch (error) {
        logger.error("askGemini: error", { message: error.message });
        return res.status(500).json({ error: "Failed to fetch AI response" });
    }
});
