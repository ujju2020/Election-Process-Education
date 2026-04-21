/* 
 * Matdan Sathi - Election Process Education Assistant
 * Stability Rescue Module
 */
console.log("[MatdanSathi] Script Load Started");

// Fallback logic for when modules or data takes time
const FALLBACK_DATA = {
    en: {
        ui: { journey: "Journey", assistant: "Assistant", vote: "Vote", readiness: "Readiness", alerts: "Alerts", ask_placeholder: "Ask about voting...", booth_finder: "Booth Finder", view_details: "View Details", mark_read: "Mark Read" },
        journey: [{id:1, title:"Delimitation", desc:"Defining boundaries."}, {id:2, title:"Electoral Rolls", desc:"Update your name."}, {id:3, title:"Notification", desc:"Election announcement."}, {id:4, title:"Nominations", desc:"Candidates file papers."}, {id:5, title:"Campaigning", desc:"Vision pitch."}, {id:6, title:"Polling", desc:"Cast your vote."}, {id:7, title:"Results", desc:"Winners declared."}],
        candidates: [{id:1, name:"Green Party", symbol:"leaf"}, {id:2, name:"Tech Vision", symbol:"cpu"}, {id:3, name:"Rights Party", symbol:"scale"}],
        readiness: [{id:1, title:"Check List", desc:"Are you ready?", action:"Check Now", url:"https://voters.eci.gov.in"}]
    }
};

let appData = null;
let currentLang = localStorage.getItem('matdan_lang') || 'en';
let activeTab = 'journey';

// ESM Imports - These run at the top level
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { getAnalytics, logEvent } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSy_PLACEHOLDER_KEY", 
    authDomain: "fleet-bus-494014-q1.firebaseapp.com",
    databaseURL: "https://fleet-bus-494014-q1-default-rtdb.firebaseio.com",
    projectId: "fleet-bus-494014-q1"
};

let analytics, db, auth;
function initFirebase() {
    try {
        const app = initializeApp(firebaseConfig);
        db = getDatabase(app);
        auth = getAuth(app);
        analytics = getAnalytics(app);
        signInAnonymously(auth).catch(() => {});
        console.log("[MatdanSathi] Firebase Initialized");
    } catch (e) {
        console.warn("[MatdanSathi] Firebase Init Failed - Offline/Placeholder Mode Active");
    }
}

function escapeHTML(str) {
    if (typeof str !== 'string') return str || '';
    return str.replace(/[&<>'"]/g, t => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[t] || t));
}

// UI RENDERING ENGINE
const getUI = () => appData?.[currentLang]?.ui || FALLBACK_DATA.en.ui;

function renderJourney(container) {
    const t = document.getElementById('journey-view-template');
    if (!t) return;
    container.innerHTML = '';
    container.appendChild(t.content.cloneNode(true));
    const ui = getUI();
    const list = container.querySelector('.timeline-container');
    const data = appData?.[currentLang]?.journey || FALLBACK_DATA.en.journey;
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
    const input = document.getElementById('chat-input');
    const msgArea = document.getElementById('chat-messages');
    container.querySelector('.send-btn').onclick = () => {
        const val = input.value.trim();
        if (!val) return;
        const uMsg = document.createElement('div');
        uMsg.className = 'user-msg assistant-msg animate-up';
        uMsg.innerHTML = `<div class="msg-bubble">${escapeHTML(val)}</div>`;
        msgArea.appendChild(uMsg);
        input.value = '';
        setTimeout(() => {
            const bMsg = document.createElement('div');
            bMsg.className = 'assistant-msg animate-up';
            bMsg.innerHTML = `<div class="avatar"><i data-lucide="bot"></i></div><div class="msg-bubble">Processing query... (Offline)</div>`;
            msgArea.appendChild(bMsg);
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }, 500);
    };
}

function renderVote(container) {
    const t = document.getElementById('vote-view-template');
    if (!t) return;
    container.innerHTML = '';
    container.appendChild(t.content.cloneNode(true));
    const bu = document.getElementById('bu-candidates');
    const cands = appData?.[currentLang]?.candidates || FALLBACK_DATA.en.candidates;
    const upd = (act) => {
        document.getElementById('cu-busy-light')?.classList.toggle('active', !act);
        document.getElementById('bu-ready-light')?.classList.toggle('active', act);
    };
    const draw = (act) => {
        if (!bu) return;
        bu.innerHTML = '';
        cands.forEach(c => {
            const r = document.createElement('div');
            r.className = 'candidate-row';
            r.innerHTML = `<div class="cand-num">${c.id}</div><div class="cand-name">${escapeHTML(c.name)}</div><div class="cand-symbol"><i data-lucide="${c.symbol}"></i></div><div class="vote-btn-wrapper"><button class="vote-btn" ${!act ? 'disabled' : ''}></button></div>`;
            r.querySelector('.vote-btn').onclick = () => {
                act = false; upd(false);
                const slip = document.getElementById('vvpat-slip');
                if (slip) { slip.querySelector('.slip-name').innerText = c.name; slip.classList.add('show'); setTimeout(() => { slip.classList.replace('show', 'drop'); window.switchTab('vote'); }, 2000); }
            };
            bu.appendChild(r);
        });
        if (typeof lucide !== 'undefined') lucide.createIcons();
    };
    const btn = document.getElementById('ballot-trigger');
    if (btn) btn.onclick = () => { upd(true); draw(true); };
    upd(false); draw(false);
}

function renderReadiness(container) {
    const ui = getUI();
    container.innerHTML = `<section class="view-section"><h2>${ui.readiness}</h2><div class="readiness-list timeline-container"></div></section>`;
}

function renderAlerts(container) {
    const t = document.getElementById('alerts-view-template');
    if (!t || !container) return;
    container.innerHTML = '';
    container.appendChild(t.content.cloneNode(true));
}

// GLOBAL SWITCHER
window.switchTab = (id) => {
    console.log("[MatdanSathi] Tab:", id);
    activeTab = id;
    const cont = document.getElementById('main-content');
    if (!cont) return;
    document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.tab === id));
    
    if (id === 'journey') renderJourney(cont);
    else if (id === 'assistant') renderAssistant(cont);
    else if (id === 'vote') renderVote(cont);
    else if (id === 'readiness') renderReadiness(cont);
    else if (id === 'alerts') renderAlerts(cont);
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

async function start() {
    console.log("[MatdanSathi] Starting init sequence...");
    initFirebase();
    const resp = await fetch('data.json').catch(() => null);
    if (resp && resp.ok) appData = await resp.json();
    
    // Set UI Strings
    const ui = getUI();
    const map = { journey: ui.journey, assistant: ui.assistant, vote: ui.vote || 'Vote', readiness: ui.readiness, alerts: ui.alerts };
    Object.entries(map).forEach(([k, v]) => {
        const s = document.querySelector(`[data-tab="${k}"] span`);
        if (s) s.innerText = v;
    });

    document.querySelectorAll('.nav-item').forEach(n => n.onclick = () => window.switchTab(n.dataset.tab));
    document.querySelectorAll('.lang-btn').forEach(b => b.onclick = () => { currentLang = b.dataset.lang; localStorage.setItem('matdan_lang', currentLang); window.switchTab(activeTab); });
    
    const pbtn = document.querySelector('.profile-btn');
    if (pbtn) pbtn.onclick = () => {
        const t = document.getElementById('info-modal-template');
        if (!t) return;
        const m = t.content.cloneNode(true).querySelector('.modal-overlay');
        document.body.appendChild(m);
        m.querySelector('.close-modal').onclick = () => m.remove();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    console.log("[MatdanSathi] Ready.");
    window.switchTab('journey');
}

// BOOTSTRAP
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
} else {
    start();
}
