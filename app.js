/* 
 * Matdan Sathi - Election Process Education Assistant
 * Developer - Ujjwal Kumar Bhowmick (ujjwalkumarbhowmick30@gmail.com)
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { getAnalytics, logEvent } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getPerformance, trace } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-performance.js";
import { getRemoteConfig, fetchAndActivate, getValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-remote-config.js";

window.onerror = (msg, url, line, col, error) => {
    console.error(`[App Error] ${msg} at ${line}:${col}.`);
    return false;
};

const firebaseConfig = {
    apiKey: "AIzaSy_PLACEHOLDER_KEY", 
    authDomain: "fleet-bus-494014-q1.firebaseapp.com",
    databaseURL: "https://fleet-bus-494014-q1-default-rtdb.firebaseio.com",
    projectId: "fleet-bus-494014-q1",
    storageBucket: "fleet-bus-494014-q1.appspot.com",
    messagingSenderId: "PLACEHOLDER",
    appId: "PLACEHOLDER"
};

let analytics, db, auth, perf, remoteConfig;
try {
    const app = initializeApp(firebaseConfig);
    analytics = getAnalytics(app);
    db = getDatabase(app);
    auth = getAuth(app);
    perf = getPerformance(app);
    remoteConfig = getRemoteConfig(app);
} catch (e) {
    console.warn("Firebase failed.");
}

let appData = null;
let currentLang = localStorage.getItem('matdan_lang') || 'en';
let activeTab = 'journey';

const MOCK_ALERTS = [
    { id: 1, type: "info", title: "Registration Open", desc: "Check eci.gov.in", unread: true },
    { id: 2, type: "warning", title: "Code of Conduct", desc: "Model Code of Conduct is in effect.", unread: false }
];

const FALLBACK_STRINGS = {
    journey: "Journey", assistant: "Assistant", vote: "Vote", readiness: "Readiness", alerts: "Alerts",
    ask_placeholder: "Ask about voting...", booth_finder: "Booth Finder", view_details: "View Details", mark_read: "Mark Read"
};

function escapeHTML(str) {
    if (typeof str !== 'string') return str || '';
    return str.replace(/[&<>'"]/g, t => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[t] || t));
}

async function loadAppData() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) throw new Error('Data load failed');
        appData = await response.json();
    } catch (e) {
        console.error('Data error:', e);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const initFirebase = async () => {
        if (!auth) return;
        try {
            await signInAnonymously(auth);
            if (analytics) logEvent(analytics, 'app_open');
            if (remoteConfig) await fetchAndActivate(remoteConfig);
        } catch (e) {}
    };
    initFirebase();
    await loadAppData();
    
    const mainContent = document.getElementById('main-content');
    const navButtons = document.querySelectorAll('.nav-item');
    const langButtons = document.querySelectorAll('.lang-btn');
    const profileBtn = document.querySelector('.profile-btn');

    const getStrings = () => appData?.[currentLang]?.ui || FALLBACK_STRINGS;

    function updateUIStrings() {
        const strings = getStrings();
        const navMap = { journey: strings.journey, assistant: strings.assistant, vote: strings.vote || 'Vote', readiness: strings.readiness, alerts: strings.alerts };
        Object.entries(navMap).forEach(([tab, text]) => {
            const span = document.querySelector(`[data-tab="${tab}"] span`);
            if (span) span.innerText = text;
        });
        langButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.lang === currentLang));
    }

    const renderJourney = () => {
        const template = document.getElementById('journey-view-template');
        if (!template || !mainContent) return;
        mainContent.innerHTML = '';
        mainContent.appendChild(template.content.cloneNode(true));
        const strings = getStrings();
        const h2 = mainContent.querySelector('h2');
        if (h2) h2.innerText = (strings.journey || 'Election') + ' Journey';
        const container = mainContent.querySelector('.timeline-container');
        const data = appData?.[currentLang]?.journey || [];
        data.forEach(s => {
            const card = document.createElement('div');
            card.className = 'timeline-card animate-up';
            card.innerHTML = `<div class="step-num">${s.id}</div><div class="step-content"><h3>${escapeHTML(s.title)}</h3><p>${escapeHTML(s.desc)}</p></div>`;
            if (container) container.appendChild(card);
        });
        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    const renderAssistant = () => {
        const template = document.getElementById('assistant-view-template');
        if (!template || !mainContent) return;
        mainContent.innerHTML = '';
        mainContent.appendChild(template.content.cloneNode(true));
        const chatMessages = document.getElementById('chat-messages');
        const input = document.getElementById('chat-input');
        const sendBtn = mainContent.querySelector('.send-btn');
        const strings = getStrings();
        if (input) input.placeholder = strings.ask_placeholder;
        if (chatMessages) {
            const welcome = currentLang === 'bn' ? 'নমস্কার! আমী কিভাবে সাহায্য করতে পারি?' : currentLang === 'hi' ? 'नमस्ते! मैं आपकी कैसे मदद कर सकता हूं?' : 'Namaste! How can I help you?';
            const bubble = chatMessages.querySelector('.msg-bubble');
            if (bubble) bubble.innerText = welcome;
        }
        const sendMessage = () => {
            const text = input.value.trim();
            if (!text || !chatMessages) return;
            const userMsg = document.createElement('div');
            userMsg.className = 'user-msg assistant-msg animate-up';
            userMsg.innerHTML = `<div class="msg-bubble">${escapeHTML(text)}</div>`;
            chatMessages.appendChild(userMsg);
            input.value = '';
            if (analytics) logEvent(analytics, 'assistant_query', { query: text });
            setTimeout(() => {
                let resp = currentLang === 'bn' ? 'ধন্যবাদ।' : currentLang === 'hi' ? 'धन्यवाद।' : 'Thank you for asking.';
                const faqs = appData?.[currentLang]?.faqs || [];
                const match = faqs.find(f => text.toLowerCase().includes(f.question.toLowerCase()) || f.question.toLowerCase().includes(text.toLowerCase()));
                if (match) resp = match.answer;
                const botMsg = document.createElement('div');
                botMsg.className = 'assistant-msg animate-up';
                botMsg.innerHTML = `<div class="avatar"><i data-lucide="bot"></i></div><div class="msg-bubble">${escapeHTML(resp)}</div>`;
                chatMessages.appendChild(botMsg);
                chatMessages.scrollTop = chatMessages.scrollHeight;
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }, 800);
        };
        if (sendBtn) sendBtn.addEventListener('click', sendMessage);
        if (input) input.addEventListener('keypress', (e) => { if(e.key === 'Enter') sendMessage(); });
        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    const renderReadiness = () => {
        const strings = getStrings();
        mainContent.innerHTML = `<section class="view-section"><div class="section-header"><h2>${strings.readiness} Checklist</h2></div><div class="readiness-list timeline-container"></div><div class="booth-finder-feature animate-up" style="margin-top:24px"><a href="https://electoralsearch.eci.gov.in/pollingstation" target="_blank" class="primary-btn"><span>${strings.booth_finder}</span></a></div></section>`;
        const container = mainContent.querySelector('.readiness-list');
        const data = appData?.[currentLang]?.readiness || [];
        data.forEach(item => {
            const card = document.createElement('div');
            card.className = 'timeline-card animate-up';
            card.innerHTML = `<div class="step-num"><i data-lucide="check"></i></div><div class="step-content"><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.desc)}</p><span class="text-btn">${escapeHTML(item.action)}</span></div>`;
            card.addEventListener('click', () => item.url && window.open(item.url, '_blank'));
            if (container) container.appendChild(card);
        });
        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    const renderAlerts = () => {
        const template = document.getElementById('alerts-view-template');
        if (!template || !mainContent) return;
        mainContent.innerHTML = '';
        mainContent.appendChild(template.content.cloneNode(true));
        const strings = getStrings();
        const container = mainContent.querySelector('.alerts-list');
        MOCK_ALERTS.forEach(a => {
            const card = document.createElement('div');
            card.className = `alert-card glass-panel ${a.unread ? 'unread' : ''}`;
            card.innerHTML = `<div class="alert-icon ${a.type}"><i data-lucide="${a.type === 'warning' ? 'alert-triangle' : 'info'}"></i></div><div class="alert-content"><h4>${escapeHTML(a.title)}</h4><p>${escapeHTML(a.desc)}</p></div>`;
            if (container) container.appendChild(card);
        });
        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    let isBallotActive = false;
    const renderVote = () => {
        const template = document.getElementById('vote-view-template');
        if (!template || !mainContent) return;
        mainContent.innerHTML = '';
        mainContent.appendChild(template.content.cloneNode(true));
        const buCandidates = document.getElementById('bu-candidates');
        const cuBusyLight = document.getElementById('cu-busy-light');
        const buReadyLight = document.getElementById('bu-ready-light');
        const ballotBtn = document.getElementById('ballot-trigger');
        const updateEVM = () => {
            if (cuBusyLight) cuBusyLight.classList.toggle('active', !isBallotActive);
            if (buReadyLight) buReadyLight.classList.toggle('active', isBallotActive);
        };
        const renderList = () => {
            if (!buCandidates) return;
            buCandidates.innerHTML = '';
            (appData?.[currentLang]?.candidates || []).forEach(cand => {
                const row = document.createElement('div');
                row.className = 'candidate-row';
                row.innerHTML = `<div class="cand-num">${cand.id}</div><div class="cand-name">${escapeHTML(cand.name)}</div><div class="cand-symbol"><i data-lucide="${cand.symbol}"></i></div><div class="vote-btn-wrapper"><div class="vote-light" id="vl-${cand.id}"></div><button class="vote-btn" ${!isBallotActive ? 'disabled' : ''}></button></div>`;
                row.querySelector('.vote-btn').addEventListener('click', () => castVote(cand));
                buCandidates.appendChild(row);
            });
            if (typeof lucide !== 'undefined') lucide.createIcons();
        };
        const castVote = (candidate) => {
            if (!isBallotActive) return;
            isBallotActive = false;
            document.getElementById(`vl-${candidate.id}`)?.classList.add('active');
            if (buReadyLight) buReadyLight.classList.remove('active');
            const slip = document.getElementById('vvpat-slip');
            if (slip) {
                slip.querySelector('.slip-name').innerText = candidate.name;
                slip.classList.add('show');
                setTimeout(() => {
                    slip.classList.remove('show'); slip.classList.add('drop');
                    setTimeout(() => { updateEVM(); renderList(); if (activeTab === 'vote') renderVote(); }, 1000);
                }, 7000);
            }
        };
        updateEVM();
        renderList();
        if (ballotBtn) ballotBtn.addEventListener('click', () => { if (!isBallotActive) { isBallotActive = true; updateEVM(); renderList(); } });
    };

    const switchTab = (tabId) => {
        activeTab = tabId;
        navButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
            btn.setAttribute('aria-selected', btn.dataset.tab === tabId);
        });
        switch(tabId) {
            case 'journey': renderJourney(); break;
            case 'assistant': renderAssistant(); break;
            case 'vote': renderVote(); break;
            case 'readiness': renderReadiness(); break;
            case 'alerts': renderAlerts(); break;
            default: mainContent.innerHTML = '<h2>Coming Soon</h2>';
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    const showProjectInfo = () => {
        const template = document.getElementById('info-modal-template');
        if (!template) return;
        const modal = template.content.cloneNode(true).querySelector('.modal-overlay');
        document.body.appendChild(modal);
        modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    if (profileBtn) profileBtn.addEventListener('click', showProjectInfo);
    langButtons.forEach(btn => btn.addEventListener('click', () => { currentLang = btn.dataset.lang; localStorage.setItem('matdan_lang', currentLang); updateUIStrings(); switchTab(activeTab); }));
    navButtons.forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));

    if (db) {
        onValue(ref(db, 'live_alerts'), (snapshot) => {
            if (snapshot.exists()) {
                const newAlert = Object.values(snapshot.val()).sort((a,b) => b.id - a.id)[0];
                if (newAlert && !MOCK_ALERTS.find(a => a.id === newAlert.id)) {
                    MOCK_ALERTS.unshift(newAlert);
                    const badge = document.querySelector('.notification-badge');
                    if (badge) { badge.innerText = parseInt(badge.innerText || 0) + 1; badge.style.display = 'flex'; }
                    if (activeTab === 'alerts') renderAlerts();
                }
            }
        });
    }

    updateUIStrings();
    switchTab('journey');
});
