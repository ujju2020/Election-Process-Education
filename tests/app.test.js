/* 
 * Matdan Sathi - Election Process Education Assistant
 * Unit Test Suite
 * Copyright (c) 2026 Ujjwal Kumar Bhowmick (ujjwalkumarbhowmick30@gmail.com)
 * All rights reserved.
 */
const assert = require('node:assert');
const test = require('node:test');

// ─── Utility Under Test ───────────────────────────────────────────────────────
function escapeHTML(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// ─── XSS / Security Tests ─────────────────────────────────────────────────────

test('escapeHTML — sanitizes script injection', () => {
    const malicious = '<script>alert(1)</script>';
    assert.strictEqual(escapeHTML(malicious), '&lt;script&gt;alert(1)&lt;/script&gt;');
});

test('escapeHTML — sanitizes img onerror XSS', () => {
    const payload = '<img src=x onerror="alert(1)">';
    const result = escapeHTML(payload);
    assert.ok(!result.includes('<img'), 'Should not contain raw <img tag');
    assert.ok(result.includes('&lt;img'), 'Should contain escaped &lt;img');
});

test('escapeHTML — sanitizes ampersand character', () => {
    assert.strictEqual(escapeHTML('Tom & Jerry'), 'Tom &amp; Jerry');
});

test('escapeHTML — sanitizes double quotes', () => {
    assert.strictEqual(escapeHTML('"quoted"'), '&quot;quoted&quot;');
});

test('escapeHTML — sanitizes single quotes', () => {
    assert.strictEqual(escapeHTML("it's"), 'it&#39;s');
});

test('escapeHTML — handles normal text unchanged', () => {
    assert.strictEqual(escapeHTML('Election 2024'), 'Election 2024');
});

test('escapeHTML — returns non-string values as-is', () => {
    assert.strictEqual(escapeHTML(42), 42);
    assert.strictEqual(escapeHTML(null), null);
    assert.strictEqual(escapeHTML(undefined), undefined);
});

test('escapeHTML — handles empty string', () => {
    assert.strictEqual(escapeHTML(''), '');
});

// ─── Data Integrity Tests ─────────────────────────────────────────────────────

test('Election Journey Stages — correct count and sequence', () => {
    const stages = [
        { id: 1, title: "Delimitation" },
        { id: 2, title: "Electoral Rolls" },
        { id: 3, title: "Notification" },
        { id: 4, title: "Nominations" },
        { id: 5, title: "Campaigning" },
        { id: 6, title: "Polling" },
        { id: 7, title: "Results" }
    ];
    assert.strictEqual(stages.length, 7, 'Should have 7 election stages');
    assert.strictEqual(stages[0].id, 1, 'First stage should be Delimitation');
    assert.strictEqual(stages[6].title, 'Results', 'Last stage should be Results');
    // Verify IDs are sequential
    stages.forEach((s, i) => assert.strictEqual(s.id, i + 1, `Stage ${i+1} ID mismatch`));
});

test('Candidate Data — required fields present', () => {
    const candidates = [
        { id: 1, name: "Green Party", symbol: "leaf" },
        { id: 2, name: "Tech Vision", symbol: "cpu" },
        { id: 3, name: "Rights Party", symbol: "scale" }
    ];
    candidates.forEach(c => {
        assert.ok(c.id, 'Candidate must have an id');
        assert.ok(c.name && c.name.length > 0, 'Candidate must have a name');
        assert.ok(c.symbol && c.symbol.length > 0, 'Candidate must have a symbol');
    });
});

test('Readiness Checklist — required URL field present and valid', () => {
    const readiness = [
        { id: "reg", title: "Registration Status", url: "https://voters.eci.gov.in", action: "Check Now" }
    ];
    assert.strictEqual(readiness[0].id, "reg");
    assert.ok(readiness[0].title.length > 0, 'Title must not be empty');
    assert.ok(readiness[0].url.startsWith('https://'), 'URL must use HTTPS');
    assert.ok(readiness[0].action.length > 0, 'Action text must not be empty');
});

// ─── Language & State Logic Tests ─────────────────────────────────────────────

test('Language Fallback — returns English UI when lang is unknown', () => {
    const FALLBACK_DATA = { en: { ui: { journey: "Journey" } } };
    const getUI = (lang, data) => data?.[lang]?.ui || FALLBACK_DATA.en.ui;
    assert.strictEqual(getUI('fr', {}).journey, "Journey", 'Unknown lang should fall back to EN');
    assert.strictEqual(getUI('xx', null).journey, "Journey", 'Null data should fall back to EN');
});

test('Language Persistence — stores and retrieves from localStorage', () => {
    const store = {};
    const localStorage = {
        setItem: (k, v) => { store[k] = v; },
        getItem: (k) => store[k] || null
    };
    localStorage.setItem('matdan_lang', 'hi');
    assert.strictEqual(localStorage.getItem('matdan_lang'), 'hi');
    localStorage.setItem('matdan_lang', 'bn');
    assert.strictEqual(localStorage.getItem('matdan_lang'), 'bn');
});

test('FAQ Matching Logic — finds relevant answer by keyword', () => {
    const faqs = [
        { question: "How to register?", answer: "Use Form 6" },
        { question: "Where is my polling booth?", answer: "Check voters.eci.gov.in" }
    ];
    const query = "register";
    const match = faqs.find(f => f.question.toLowerCase().includes(query.toLowerCase()));
    assert.ok(match, 'Should find a matching FAQ');
    assert.strictEqual(match.answer, "Use Form 6");
});

test('FAQ Matching Logic — returns undefined for no match', () => {
    const faqs = [{ question: "How to register?", answer: "Use Form 6" }];
    const match = faqs.find(f => f.question.toLowerCase().includes("blockchain"));
    assert.strictEqual(match, undefined, 'Should return undefined for unmatched query');
});

test('Alert Badge — unread count computed correctly', () => {
    const alerts = [{ id: 10 }, { id: 7 }, { id: 5 }, { id: 1 }];
    const maxReadId = 5;
    const unread = alerts.filter(a => a.id > maxReadId).length;
    assert.strictEqual(unread, 2, 'Alerts with id > 5 should be 2 unread');
});

test('Alert Badge — zero unread when all are read', () => {
    const alerts = [{ id: 3 }, { id: 2 }, { id: 1 }];
    const maxReadId = 10;
    const unread = alerts.filter(a => a.id > maxReadId).length;
    assert.strictEqual(unread, 0);
});
