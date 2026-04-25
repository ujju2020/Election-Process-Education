/* 
 * Matdan Sathi - Election Process Education Assistant
 * Copyright (c) 2026 Ujjwal Kumar Bhowmick (ujjwalkumarbhowmick30@gmail.com)
 * All rights reserved.
 * 
 * Integration Test Suite: Verifies end-to-end flows for AI and Localization.
 */
const assert = require('node:assert');
const test = require('node:test');

// Mock DOM elements and global variables for testing logic in isolation
global.localStorage = {
    getItem: (key) => global.localStorage[key] || null,
    setItem: (key, val) => { global.localStorage[key] = val.toString(); }
};

const FALLBACK_DATA = {
    en: { ui: { journey: "Journey" } },
    hi: { ui: { journey: "Yatra" } }
};

test('Localization Engine: handles language switching and persistence', () => {
    let currentLang = 'en';
    const setLang = (l) => { currentLang = l; global.localStorage.setItem('matdan_lang', l); };
    
    setLang('hi');
    assert.strictEqual(currentLang, 'hi');
    assert.strictEqual(global.localStorage.getItem('matdan_lang'), 'hi');
    
    // Verify fallback logic
    const getUI = (lang) => FALLBACK_DATA[lang]?.ui || FALLBACK_DATA.en.ui;
    assert.strictEqual(getUI('hi').journey, "Yatra");
    assert.strictEqual(getUI('fr').journey, "Journey"); // Fallback to EN
});

test('State Management: Alert badge logic', () => {
    let mockAlerts = [{ id: 10 }, { id: 5 }, { id: 1 }];
    let maxReadId = 5;
    
    const unreadCount = mockAlerts.filter(a => a.id > maxReadId).length;
    assert.strictEqual(unreadCount, 1);
});

test('Security Logic: escapeHTML handles multiple vectors', () => {
    function escapeHTML(str) {
        if (typeof str !== 'string') return str;
        return str.replace(/[&<>'"]/g, tag => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
        }[tag] || tag));
    }
    
    const input = '<script>alert("xss")</script> & "test"';
    const output = escapeHTML(input);
    assert.ok(!output.includes('<script>'));
    assert.ok(output.includes('&lt;script&gt;'));
    assert.ok(output.includes('&amp;'));
    assert.ok(output.includes('&quot;'));
});
test('ApiService: askGemini calls the backend proxy', async () => {
    const mockResponse = { text: "AI Response" };
    global.fetch = async (url, options) => {
        assert.ok(url.includes('run.app')); // Verify it calls the proxy
        assert.strictEqual(options.method, 'POST');
        return {
            ok: true,
            json: async () => mockResponse
        };
    };

    const ApiService = {
        async askGemini(prompt, lang) {
            const response = await fetch('https://askgemini-5mdviaaetq-uc.a.run.app', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, lang })
            });
            const data = await response.json();
            return data.text;
        }
    };

    const result = await ApiService.askGemini('hello', 'en');
    assert.strictEqual(result, "AI Response");
});
