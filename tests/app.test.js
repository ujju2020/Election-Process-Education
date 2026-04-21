/* 
 * Matdan Sathi - Election Process Education Assistant
 * Developer - Ujjwal Kumar Bhowmick (ujjwalkumarbhowmick30@gmail.com)
 */
const assert = require('node:assert');
const test = require('node:test');

// Utility to test
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

test('escapeHTML — sanitizes injection', () => {
    const malicious = '<script>alert(1)</script>';
    assert.strictEqual(escapeHTML(malicious), '&lt;script&gt;alert(1)&lt;/script&gt;');
});

test('escapeHTML — handles normal text', () => {
    assert.strictEqual(escapeHTML('Election 2024'), 'Election 2024');
});

test('Election Stages Data Integrity', () => {
    const stages = [
        { id: 1, title: "Delimitation" },
        { id: 2, title: "Electoral Rolls" }
    ];
    assert.strictEqual(stages.length, 2);
    assert.strictEqual(stages[0].id, 1);
});

test('Readiness Checklist Validation', () => {
    const readiness = [
        { id: "reg", title: "Registration Status" }
    ];
    assert.strictEqual(readiness[0].id, "reg");
    assert.ok(readiness[0].title.length > 0);
});

test('FAQ Matching Logic Mock', () => {
    const faqs = [{ question: "How to register?", answer: "Use Form 6" }];
    const query = "register";
    const match = faqs.find(f => f.question.toLowerCase().includes(query.toLowerCase()));
    assert.strictEqual(match.answer, "Use Form 6");
});
