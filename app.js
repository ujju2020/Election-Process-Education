/* 
 * Matdan Sathi - Election Process Education Assistant
 * Robust Recovery Module
 */
console.log("[MatdanSathi] Script starting...");

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { getAnalytics, logEvent } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getPerformance, trace } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-performance.js";
import { getRemoteConfig, fetchAndActivate } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-remote-config.js";

// Global Debugger
window.MATDAN_DEBUG = true;

const firebaseConfig = {
    apiKey: "AIzaSy_PLACEHOLDER_KEY", 
    authDomain: "fleet-bus-494014-q1.firebaseapp.com",
    databaseURL: "https://fleet-bus-494014-q1-default-rtdb.firebaseio.com",
    projectId: "fleet-bus-494014-q1",
    storageBucket: "fleet-bus-494014-q1.appspot.com",
    messagingSenderId: "PLACEHOLDER",
    appId: "PLACEHOLDER"
};

let analytics, db, auth;
try {
    const app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    auth = getAuth(app);
    analytics = getAnalytics(app);
    console.log("[MatdanSathi] Firebase Initialized (partial check)");
} catch (e) {
    console.warn("[MatdanSathi] Firebase error:", e.message);
}

let appData = null;
let currentLang = localStorage.getItem('matdan_lang') || 'en';
let activeTab = 'journey';

const FALLBACK_UI = { journey: "Journey", assistant: "Assistant", vote: "Vote", readiness: "Readiness", alerts: "Alerts", ask_placeholder: "Ask about voting...", booth_finder: "Booth Finder", view_details: "View Details" };

function escapeHTML(str) {
    if (typeof str !== 'string') return str || '';
    return str.replace(/[&<>'"]/g, t => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[t] || t));
}

async function loadAppData() {
    try {
        const r = await fetch('data.json');
        if (!r.ok) throw new Error("404 data.json");
        appData = await r.json();
        console.log("[MatdanSathi] Data loaded");
    } catch (e) {
        console.error("[MatdanSathi] loadAppData failed", e);
    }
}

// Global functions to ensure visibility
window.switchTab = (tabId) => {
    console.log("[MatdanSathi] Switching to:", tabId);
    activeTab = tabId;
    const navButtons = document.querySelectorAll('.nav-item');
    const mainContent = document.getElementById('main-content');
    
    navButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
        btn.setAttribute('aria-selected', btn.dataset.tab === tabId);
    });

    try {
        if (tabId === 'journey') renderJourney(mainContent);
        else if (tabId === 'assistant') renderAssistant(mainContent);
        else if (tabId === 'vote') renderVote(mainContent);
        else if (tabId === 'readiness') renderReadiness(mainContent);
        else if (tabId === 'alerts') renderAlerts(mainContent);
    } catch (e) {
        console.error("[MatdanSathi] Render failed", e);
        mainContent.innerHTML = "<h2>Render Error</h2>";
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

function getUI() { return appData?.[currentLang]?.ui || FALLBACK_UI; }

function renderJourney(container) {
    const t = document.getElementById('journey-view-template');
    if (!t) return;
    container.innerHTML = '';
    container.appendChild(t.content.cloneNode(true));
    const ui = getUI();
    const h2 = container.querySelector('h2');
    if (h2) h2.innerText = (ui.journey || 'Election') + ' Journey';
    const list = container.querySelector('.timeline-container');
    const data = appData?.[currentLang]?.journey || [];
    data.forEach(s => {
        const c = document.createElement('div');
        c.className = 'timeline-card animate-up';
        c.innerHTML = `<div class="step-num">${s.id}</div><div class="step-content"><h3>${escapeHTML(s.title)}</h3><p>${escapeHTML(s.desc)}</p></div>`;
        list.appendChild(c);
    });
}

function renderAssistant(container) {
    const t = document.getElementById('assistant-view-template');
    if (!t) return;
    container.innerHTML = '';
    container.appendChild(t.content.cloneNode(true));
    const ui = getUI();
    const input = document.getElementById('chat-input');
    if (input) input.placeholder = ui.ask_placeholder;
    const btn = container.querySelector('.send-btn');
    if (btn) btn.onclick = () => {
        const text = input.value.trim();
        if (!text) return;
        const msg = document.createElement('div');
        msg.className = 'user-msg assistant-msg animate-up';
        msg.innerHTML = `<div class="msg-bubble">${escapeHTML(text)}</div>`;
        document.getElementById('chat-messages').appendChild(msg);
        input.value = '';
        setTimeout(() => {
            const bot = document.createElement('div');
            bot.className = 'assistant-msg animate-up';
            bot.innerHTML = `<div class="avatar"><i data-lucide="bot"></i></div><div class="msg-bubble">Thank you.</div>`;
            document.getElementById('chat-messages').appendChild(bot);
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }, 800);
    };
}

function renderReadiness(container) {
    const ui = getUI();
    container.innerHTML = `<section class="view-section"><h2>${ui.readiness}</h2><div class="readiness-list timeline-container"></div><a href="https://voters.eci.gov.in/" target="_blank" class="primary-btn" style="margin-top:20px; text-decoration:none; display:inline-block; padding:12px 20px; background:var(--primary); border-radius:10px; color:white;">Check Portal</a></section>`;
    const list = container.querySelector('.readiness-list');
    const data = appData?.[currentLang]?.readiness || [];
    data.forEach(i => {
        const c = document.createElement('div');
        c.className = 'timeline-card animate-up';
        c.innerHTML = `<div class="step-num"><i data-lucide="check"></i></div><div class="step-content"><h3>${escapeHTML(i.title)}</h3><p>${escapeHTML(i.desc)}</p></div>`;
        list.appendChild(c);
    });
}

function renderAlerts(container) {
    const t = document.getElementById('alerts-view-template');
    if (!t) return;
    container.innerHTML = '';
    container.appendChild(t.content.cloneNode(true));
}

let isBallotActive = false;
function renderVote(container) {
    const t = document.getElementById('vote-view-template');
    if (!t) return;
    container.innerHTML = '';
    container.appendChild(t.content.cloneNode(true));
    const bu = document.getElementById('bu-candidates');
    const ballot = document.getElementById('ballot-trigger');
    const update = () => {
        document.getElementById('cu-busy-light')?.classList.toggle('active', !isBallotActive);
        document.getElementById('bu-ready-light')?.classList.toggle('active', isBallotActive);
    };
    const showList = () => {
        if (!bu) return;
        bu.innerHTML = '';
        (appData?.[currentLang]?.candidates || [{id:1,name:"Demo",symbol:"leaf"}]).forEach(c => {
            const r = document.createElement('div');
            r.className = 'candidate-row';
            r.innerHTML = `<div class="cand-num">${c.id}</div><div class="cand-name">${escapeHTML(c.name)}</div><div class="cand-symbol"><i data-lucide="${c.symbol}"></i></div><div class="vote-btn-wrapper"><button class="vote-btn" ${!isBallotActive ? 'disabled' : ''}></button></div>`;
            r.querySelector('.vote-btn').onclick = () => {
                isBallotActive = false;
                const s = document.getElementById('vvpat-slip');
                if (s) { s.querySelector('.slip-name').innerText = c.name; s.classList.add('show'); setTimeout(() => { s.classList.remove('show'); s.classList.add('drop'); update(); showList(); window.switchTab('vote'); }, 3000); }
            };
            bu.appendChild(r);
        });
        if (typeof lucide !== 'undefined') lucide.createIcons();
    };
    if (ballot) ballot.onclick = () => { isBallotActive = true; update(); showList(); };
    update(); showList();
}

// Final Initialization
console.log("[MatdanSathi] Registering DOMContentLoaded...");
document.addEventListener('DOMContentLoaded', async () => {
    console.log("[MatdanSathi] DOM Ready");
    await loadAppData();
    
    // UI strings update
    const ui = getUI();
    const map = { journey: ui.journey, assistant: ui.assistant, vote: ui.vote || 'Vote', readiness: ui.readiness, alerts: ui.alerts };
    Object.entries(map).forEach(([k, v]) => {
        const s = document.querySelector(`[data-tab="${k}"] span`);
        if (s) s.innerText = v;
    });

    // Event listeners
    document.querySelectorAll('.nav-item').forEach(b => b.onclick = () => window.switchTab(b.dataset.tab));
    document.querySelectorAll('.lang-btn').forEach(b => b.onclick = () => { currentLang = b.dataset.lang; localStorage.setItem('matdan_lang', currentLang); window.switchTab(activeTab); });
    
    const pb = document.querySelector('.profile-btn');
    if (pb) pb.onclick = () => {
        const t = document.getElementById('info-modal-template');
        if (!t) return;
        const m = t.content.cloneNode(true).querySelector('.modal-overlay');
        document.body.appendChild(m);
        m.querySelector('.close-modal').onclick = () => m.remove();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    console.log("[MatdanSathi] Init complete. Booting journey...");
    window.switchTab('journey');
});
