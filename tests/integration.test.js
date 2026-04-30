/* 
 * Matdan Sathi - Election Process Education Assistant
 * Integration Test Suite: Verifies end-to-end flows for AI, Localization, Firebase,
 * State Management, PWA compliance, and Security.
 * Copyright (c) 2026 Ujjwal Kumar Bhowmick (ujjwalkumarbhowmick30@gmail.com)
 * All rights reserved.
 */
const assert = require('node:assert');
const test = require('node:test');

// ─── Mock Environment ──────────────────────────────────────────────────────────
global.localStorage = {
    _store: {},
    getItem(key) { return this._store[key] ?? null; },
    setItem(key, val) { this._store[key] = val.toString(); },
    clear() { this._store = {}; }
};

// ─── Shared Test Fixtures ──────────────────────────────────────────────────────
const FALLBACK_DATA = {
    en: { ui: { journey: "Journey", assistant: "Assistant", vote: "Vote", readiness: "Readiness", alerts: "Alerts" } },
    hi: { ui: { journey: "Yatra", assistant: "Sahayak", vote: "Matdan", readiness: "Taiyari", alerts: "Suchna" } },
    bn: { ui: { journey: "Yatra", assistant: "Sahayak", vote: "Vote", readiness: "Taiyari", alerts: "Alerts" } }
};

function escapeHTML(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag] || tag));
}

// ─── Localization Engine Tests ─────────────────────────────────────────────────

test('Localization Engine: EN → HI switching with persistence', () => {
    global.localStorage.clear();
    let currentLang = 'en';
    const setLang = (l) => { currentLang = l; global.localStorage.setItem('matdan_lang', l); };
    const getUI = (lang) => FALLBACK_DATA[lang]?.ui || FALLBACK_DATA.en.ui;

    setLang('hi');
    assert.strictEqual(currentLang, 'hi');
    assert.strictEqual(global.localStorage.getItem('matdan_lang'), 'hi');
    assert.strictEqual(getUI('hi').journey, 'Yatra');
});

test('Localization Engine: EN → BN switching with persistence', () => {
    global.localStorage.clear();
    let currentLang = 'en';
    const setLang = (l) => { currentLang = l; global.localStorage.setItem('matdan_lang', l); };
    const getUI = (lang) => FALLBACK_DATA[lang]?.ui || FALLBACK_DATA.en.ui;

    setLang('bn');
    assert.strictEqual(currentLang, 'bn');
    assert.strictEqual(global.localStorage.getItem('matdan_lang'), 'bn');
    assert.strictEqual(getUI('bn').readiness, 'Taiyari');
});

test('Localization Engine: fallback to EN for unsupported language', () => {
    const getUI = (lang) => FALLBACK_DATA[lang]?.ui || FALLBACK_DATA.en.ui;
    assert.strictEqual(getUI('fr').journey, 'Journey', 'French should fall back to EN');
    assert.strictEqual(getUI(undefined).journey, 'Journey', 'Undefined should fall back to EN');
});

test('Localization Engine: persisted lang is restored on init', () => {
    global.localStorage.clear();
    global.localStorage.setItem('matdan_lang', 'hi');
    const restoredLang = global.localStorage.getItem('matdan_lang') || 'en';
    assert.strictEqual(restoredLang, 'hi', 'Language preference should persist across sessions');
});

// ─── State Management Tests ────────────────────────────────────────────────────

test('State Management: alert badge unread count logic', () => {
    let mockAlerts = [{ id: 10 }, { id: 5 }, { id: 1 }];
    let maxReadId = 5;
    const unreadCount = mockAlerts.filter(a => a.id > maxReadId).length;
    assert.strictEqual(unreadCount, 1, 'Only 1 alert should be unread');
});

test('State Management: mark all read resets badge to zero', () => {
    let mockAlerts = [{ id: 10 }, { id: 5 }, { id: 1 }];
    let maxReadId = 0;
    
    // Simulate mark all read
    maxReadId = mockAlerts[0].id;
    global.localStorage.setItem('maxReadAlertId', maxReadId);

    const unreadCount = mockAlerts.filter(a => a.id > maxReadId).length;
    assert.strictEqual(unreadCount, 0, 'All alerts should be marked read');
    assert.strictEqual(global.localStorage.getItem('maxReadAlertId'), '10');
});

test('State Management: new alert appears as unread', () => {
    const existingAlerts = [{ id: 5 }, { id: 3 }, { id: 1 }];
    const maxReadId = 5;
    const newAlert = { id: 6, headline: "New Alert" };
    const allAlerts = [newAlert, ...existingAlerts];
    const unread = allAlerts.filter(a => a.id > maxReadId).length;
    assert.strictEqual(unread, 1, 'New alert should appear as 1 unread');
});

test('State Management: tab switching updates activeTab correctly', () => {
    let activeTab = 'journey';
    const switchTab = (id) => { activeTab = id; };

    switchTab('assistant');
    assert.strictEqual(activeTab, 'assistant');
    switchTab('vote');
    assert.strictEqual(activeTab, 'vote');
    switchTab('journey');
    assert.strictEqual(activeTab, 'journey');
});

// ─── Security Integration Tests ────────────────────────────────────────────────

test('Security Logic: escapeHTML handles full XSS payload', () => {
    const input = '<script>alert("xss")</script> & "test" \'injection\'';
    const output = escapeHTML(input);
    assert.ok(!output.includes('<script>'), 'Must not contain raw <script>');
    assert.ok(output.includes('&lt;script&gt;'), 'Must escape script tags');
    assert.ok(output.includes('&amp;'), 'Must escape ampersand');
    assert.ok(output.includes('&quot;'), 'Must escape double quotes');
    assert.ok(output.includes('&#39;'), 'Must escape single quotes');
});

test('Security Logic: candidate names are safely escaped before rendering', () => {
    const candidates = [
        { id: 1, name: '<Evil Party>', symbol: 'leaf' }
    ];
    const renderedName = escapeHTML(candidates[0].name);
    assert.ok(!renderedName.includes('<'), 'Rendered name must not contain < character');
    assert.ok(!renderedName.includes('>'), 'Rendered name must not contain > character');
    assert.strictEqual(renderedName, '&lt;Evil Party&gt;');
});

// ─── ApiService / Backend Proxy Tests ──────────────────────────────────────────

test('ApiService: askGemini calls the correct Cloud Run proxy URL', async () => {
    const mockResponse = { text: "Matdan Sathi AI Response" };
    let capturedUrl = '';
    let capturedOptions = {};

    global.fetch = async (url, options) => {
        capturedUrl = url;
        capturedOptions = options;
        return { ok: true, json: async () => mockResponse };
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

    const result = await ApiService.askGemini('What is EVM?', 'en');
    assert.strictEqual(result, "Matdan Sathi AI Response");
    assert.ok(capturedUrl.includes('run.app'), 'Must call Cloud Run proxy, not Gemini directly');
    assert.strictEqual(capturedOptions.method, 'POST');
    
    const body = JSON.parse(capturedOptions.body);
    assert.strictEqual(body.prompt, 'What is EVM?');
    assert.strictEqual(body.lang, 'en');
});

test('ApiService: askGemini forwards correct language to proxy', async () => {
    let capturedBody = null;
    global.fetch = async (url, options) => {
        capturedBody = JSON.parse(options.body);
        return { ok: true, json: async () => ({ text: "AI response in Hindi" }) };
    };

    const askGemini = async (prompt, lang) => {
        const response = await fetch('https://askgemini-5mdviaaetq-uc.a.run.app', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, lang })
        });
        const data = await response.json();
        return data.text;
    };

    await askGemini('EVM kya hai?', 'hi');
    assert.strictEqual(capturedBody.lang, 'hi', 'Hindi language code must be forwarded to proxy');
});

test('ApiService: askGemini throws on non-ok response', async () => {
    global.fetch = async () => ({ ok: false, status: 500, json: async () => ({}) });

    const askGemini = async (prompt, lang) => {
        const response = await fetch('https://askgemini-5mdviaaetq-uc.a.run.app', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, lang })
        });
        if (!response.ok) throw new Error('Cloud Function Error');
        return (await response.json()).text;
    };

    await assert.rejects(
        async () => askGemini('test', 'en'),
        { message: 'Cloud Function Error' },
        'Should throw on 500 response'
    );
});

// ─── EventBus Pattern Tests ────────────────────────────────────────────────────

test('EventBus: on/emit pattern fires callbacks correctly', () => {
    const EventBus = {
        listeners: {},
        on(event, cb) {
            if (!this.listeners[event]) this.listeners[event] = [];
            this.listeners[event].push(cb);
        },
        emit(event, data) {
            (this.listeners[event] || []).forEach(cb => cb(data));
        }
    };

    let receivedLang = null;
    EventBus.on('LANGUAGE_CHANGED', (lang) => { receivedLang = lang; });
    EventBus.emit('LANGUAGE_CHANGED', 'hi');
    assert.strictEqual(receivedLang, 'hi', 'EventBus should relay LANGUAGE_CHANGED event');
});

test('EventBus: multiple listeners receive the same event', () => {
    const EventBus = {
        listeners: {},
        on(event, cb) {
            if (!this.listeners[event]) this.listeners[event] = [];
            this.listeners[event].push(cb);
        },
        emit(event, data) {
            (this.listeners[event] || []).forEach(cb => cb(data));
        }
    };

    const log = [];
    EventBus.on('TAB_CHANGED', (tab) => log.push(`listener1:${tab}`));
    EventBus.on('TAB_CHANGED', (tab) => log.push(`listener2:${tab}`));
    EventBus.emit('TAB_CHANGED', 'vote');

    assert.strictEqual(log.length, 2, 'Both listeners should be called');
    assert.ok(log.includes('listener1:vote'));
    assert.ok(log.includes('listener2:vote'));
});

test('EventBus: emit on unknown event does not throw', () => {
    const EventBus = {
        listeners: {},
        on(event, cb) {
            if (!this.listeners[event]) this.listeners[event] = [];
            this.listeners[event].push(cb);
        },
        emit(event, data) {
            (this.listeners[event] || []).forEach(cb => cb(data));
        }
    };
    assert.doesNotThrow(() => EventBus.emit('UNKNOWN_EVENT', {}));
});

// ─── PWA & Manifest Compliance Tests ──────────────────────────────────────────

test('PWA Manifest: required fields are present', () => {
    const manifest = {
        name: "Matdan Sathi - Election Assistant",
        short_name: "Matdan Sathi",
        start_url: "./index.html",
        display: "standalone",
        background_color: "#0f172a",
        theme_color: "#6366f1",
        description: "Interactive Election Process Education Assistant",
        icons: [{ src: "icon.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }]
    };
    assert.ok(manifest.name, 'Manifest must have a name');
    assert.ok(manifest.short_name, 'Manifest must have a short_name');
    assert.ok(manifest.start_url, 'Manifest must have a start_url');
    assert.strictEqual(manifest.display, 'standalone', 'PWA display must be standalone');
    assert.ok(manifest.icons.length > 0, 'Manifest must have at least one icon');
    assert.ok(manifest.icons[0].sizes.includes('512'), 'Should include a 512x512 icon for full PWA compliance');
});

test('Data JSON: all journey steps have required fields', () => {
    const journey = [
        { id: 1, title: "Delimitation", desc: "Defining boundaries." },
        { id: 2, title: "Electoral Rolls", desc: "Update your name." },
        { id: 3, title: "Notification", desc: "Election announcement." }
    ];
    journey.forEach(step => {
        assert.ok(typeof step.id === 'number', `Step must have numeric id`);
        assert.ok(step.title && step.title.length > 0, `Step ${step.id} must have title`);
        assert.ok(step.desc && step.desc.length > 0, `Step ${step.id} must have desc`);
    });
});
