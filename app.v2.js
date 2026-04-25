/* 
 * Matdan Sathi - Election Process Education Assistant
 * Stability Rescue Module
 */
console.log("[MatdanSathi] Script Load Started");

const FALLBACK_DATA = {
    en: {
        ui: { journey: "Journey", assistant: "Assistant", vote: "Vote", readiness: "Readiness", alerts: "Alerts", ask_placeholder: "Ask about voting...", booth_finder: "Booth Finder", view_details: "View Details", mark_read: "Mark Read" },
        journey: [{ id: 1, title: "Delimitation", desc: "Defining boundaries." }, { id: 2, title: "Electoral Rolls", desc: "Update your name." }, { id: 3, title: "Notification", desc: "Election announcement." }, { id: 4, title: "Nominations", desc: "Candidates file papers." }, { id: 5, title: "Campaigning", desc: "Vision pitch." }, { id: 6, title: "Polling", desc: "Cast your vote." }, { id: 7, title: "Results", desc: "Winners declared." }],
        candidates: [{ id: 1, name: "Green Party", symbol: "leaf" }, { id: 2, name: "Tech Vision", symbol: "cpu" }, { id: 3, name: "Rights Party", symbol: "scale" }],
        readiness: [{ id: 1, title: "Check List", desc: "Are you ready?", action: "Check Now", url: "https://voters.eci.gov.in" }]
    }
};

let appData = null;
let currentLang = localStorage.getItem('matdan_lang') || 'en';
let activeTab = 'journey';
let MOCK_ALERTS = [];
let maxReadAlertId = parseInt(localStorage.getItem('maxReadAlertId') || '0');

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, onValue, limitToLast, query } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { getAnalytics, logEvent } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBHVhvLjTGXJHAfyiJAfqglZEmvSmN43bk",
    authDomain: "fleet-bus-494014-q1.firebaseapp.com",
    databaseURL: "https://fleet-bus-494014-q1-default-rtdb.firebaseio.com",
    projectId: "fleet-bus-494014-q1",
    storageBucket: "fleet-bus-494014-q1.firebasestorage.app",
    messagingSenderId: "929350853317",
    appId: "1:929350853317:web:a16ed41fb2274a9b0f06ac",
    measurementId: "G-ZH85HCNMFB"
};

let firebaseApp, analytics, db, auth;
function initFirebase() {
    try {
        firebaseApp = initializeApp(firebaseConfig);
        db = getDatabase(firebaseApp);
        auth = getAuth(firebaseApp);
        analytics = getAnalytics(firebaseApp);
        signInAnonymously(auth).then(() => {
            console.log("[MatdanSathi] Firebase Auth Active");
            setupLiveAlerts();
        }).catch((e) => {
            console.warn("[MatdanSathi] Auth failed", e.message);
            setupLiveAlerts();
        });
    } catch (e) {
        console.warn("[MatdanSathi] Firebase Init Failed:", e.message);
    }
}

let initialAlertLoad = true;

function updateAlertsBadge() {
    const badge = document.querySelector('.notification-badge');
    if (badge) {
        const count = MOCK_ALERTS.filter(a => a.id > maxReadAlertId).length;
        badge.innerText = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}

function setupLiveAlerts() {
    if (!db) return;
    const alertsRef = query(ref(db, 'live_alerts'), limitToLast(10));
    onValue(alertsRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            const newAlerts = Object.values(data).sort((a,b) => b.id - a.id);
            if (!initialAlertLoad) {
                const prevLatest = MOCK_ALERTS.length > 0 ? MOCK_ALERTS[0].id : 0;
                const incoming = newAlerts.filter(a => a.id > prevLatest);
                incoming.forEach(a => showToastAlert(a));
            }
            initialAlertLoad = false;
            MOCK_ALERTS = newAlerts;
            updateAlertsBadge();
            if (activeTab === 'alerts') window.switchTab('alerts');
        }
    });
}

function showToastAlert(alertObj) {
    const toast = document.createElement('div');
    toast.className = 'toast-alert animate-up';
    toast.innerHTML = `
        <div class="toast-icon ${escapeHTML(alertObj.type)}"><i data-lucide="${alertObj.type === 'warning' ? 'alert-triangle' : 'info'}"></i></div>
        <div class="toast-content">
            <h4>${escapeHTML(alertObj.title)}</h4>
            <p>${escapeHTML(alertObj.desc)}</p>
        </div>
        <button class="toast-close"><i data-lucide="x"></i></button>
    `;
    document.body.appendChild(toast);
    if (typeof lucide !== 'undefined') lucide.createIcons();
    toast.onclick = (e) => {
        if (e.target.closest('.toast-close')) return;
        window.switchTab('alerts');
        toast.remove();
    };
    toast.querySelector('.toast-close').onclick = () => toast.remove();
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 5000);
}

function escapeHTML(str) {
    if (typeof str !== 'string') return str || '';
    return str.replace(/[&<>'"]/g, t => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[t] || t));
}

const getUI = () => appData?.[currentLang]?.ui || FALLBACK_DATA.en.ui;

function renderJourney(container) {
    const t = document.getElementById('journey-view-template');
    if (!t) return;
    container.innerHTML = '';
    container.appendChild(t.content.cloneNode(true));
    const ui = getUI();
    const headerTitle = container.querySelector('.section-header h2');
    const headerDesc = container.querySelector('.section-header p');
    if (headerTitle && ui.journey_title) headerTitle.innerText = ui.journey_title;
    if (headerDesc && ui.journey_desc) headerDesc.innerText = ui.journey_desc;
    
    const list = container.querySelector('.timeline-container');
    const data = appData?.[currentLang]?.journey || FALLBACK_DATA.en.journey;
    data.forEach(s => {
        const c = document.createElement('div');
        c.className = 'timeline-card animate-up';
        const btnText = ui.view_details || "View Details";
        c.innerHTML = `<div class="step-num">${s.id}</div><div class="step-content"><h3>${escapeHTML(s.title)}</h3><p>${escapeHTML(s.desc)}</p><button class="ballot-btn" style="margin-top:10px; border:none; cursor:pointer; font-family:inherit; padding:6px 14px; font-size:0.8rem;">${escapeHTML(btnText)}</button></div>`;
        c.querySelector('.ballot-btn').onclick = () => {
            window.switchTab('assistant');
            setTimeout(() => {
                const input = document.getElementById('chat-input');
                const sendBtn = document.querySelector('.send-btn');
                if (input && sendBtn) {
                    input.value = `Tell me more about the election step: ${s.title}`;
                    sendBtn.click();
                }
            }, 50);
        };
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
    if (input && ui.ask_placeholder) input.placeholder = ui.ask_placeholder;
    const msgArea = document.getElementById('chat-messages');
    const msgBubble = container.querySelector('.assistant-msg .msg-bubble');
    if (msgBubble && ui.assistant_greeting) msgBubble.innerText = ui.assistant_greeting;
    const sendBtn = container.querySelector('.send-btn');
    if (input && sendBtn) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendBtn.click();
            }
        });
    }

    sendBtn.onclick = async () => {
        const val = input.value.trim();
        if (!val) return;
        
        const uMsg = document.createElement('div');
        uMsg.className = 'user-msg assistant-msg animate-up';
        uMsg.innerHTML = `<div class="msg-bubble">${escapeHTML(val)}</div>`;
        msgArea.appendChild(uMsg);
        input.value = '';
        msgArea.scrollTop = msgArea.scrollHeight;

        const bot = document.createElement('div');
        bot.className = 'assistant-msg animate-up';
        bot.innerHTML = `<div class="avatar"><i data-lucide="bot"></i></div><div class="msg-bubble loading-bubble">${escapeHTML(ui.assistant_processing || "Processing query...")}</div>`;
        msgArea.appendChild(bot);
        if (typeof lucide !== 'undefined') lucide.createIcons();
        msgArea.scrollTop = msgArea.scrollHeight;

        try {
            const langContext = currentLang === 'hi' ? 'Respond in Hindi.' : currentLang === 'bn' ? 'Respond in Bengali.' : 'Respond in English.';
            const systemInstruction = `You are Matdan Sathi, an expert on the Indian Election Process. Keep your answers concise, helpful, and neutral. ${langContext}`;
            
            const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=AIzaSyDMx5BLN1AWbFppDT14cqE_INgea3dQXWg', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: { parts: { text: systemInstruction } },
                    contents: [{ parts: [{ text: val }] }]
                })
            });

            if (!response.ok) throw new Error('API Error');
            const data = await response.json();
            const text = data.candidates[0].content.parts[0].text;
            
            const bubble = bot.querySelector('.msg-bubble');
            bubble.classList.remove('loading-bubble');
            bubble.innerHTML = typeof marked !== 'undefined' ? marked.parse(text) : escapeHTML(text);
        } catch (e) {
            console.error(e);
            bot.querySelector('.msg-bubble').innerText = "Sorry, I am currently offline. Please try again later.";
        }
        msgArea.scrollTop = msgArea.scrollHeight;
    };
}

function renderVote(container) {
    const t = document.getElementById('vote-view-template');
    if (!t) return;
    container.innerHTML = '';
    container.appendChild(t.content.cloneNode(true));
    const ui = getUI();
    const title = document.getElementById('vote-title');
    const desc = document.getElementById('vote-desc');
    if (title && ui.vote_title) title.innerText = ui.vote_title;
    if (desc && ui.vote_desc) desc.innerText = ui.vote_desc;
    const cuHeader = container.querySelector('.cu-header');
    if (cuHeader && ui.control_unit) cuHeader.innerText = ui.control_unit;
    const busySpan = container.querySelector('.cu-status span');
    if (busySpan && ui.busy) busySpan.innerText = ui.busy;
    const ballotBtn = document.getElementById('ballot-trigger');
    if (ballotBtn && ui.ballot) ballotBtn.innerText = ui.ballot;
    const buHeaderSpan = container.querySelector('.bu-header span');
    if (buHeaderSpan && ui.balloting_unit) buHeaderSpan.innerText = ui.balloting_unit;
    const vvpatHeader = container.querySelector('.vvpat-header');
    if (vvpatHeader && ui.vvpat) vvpatHeader.innerText = ui.vvpat;
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
    const list = container.querySelector('.readiness-list');
    const rData = appData?.[currentLang]?.readiness || FALLBACK_DATA.en.readiness;
    if (rData && list) {
        rData.forEach(r => {
            const c = document.createElement('div');
            c.className = 'timeline-card animate-up';
            c.innerHTML = `<div class="step-num"><i data-lucide="check"></i></div><div class="step-content"><h3>${escapeHTML(r.title)}</h3><p>${escapeHTML(r.desc)}</p><a href="${escapeHTML(r.url)}" target="_blank" class="ballot-btn" style="display:inline-block; margin-top:10px; text-decoration:none; padding:8px 16px; font-size:0.85rem;">${escapeHTML(r.action)}</a></div>`;
            list.appendChild(c);
        });
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

function renderAlerts(container) {
    const t = document.getElementById('alerts-view-template');
    if (!t || !container) return;
    container.innerHTML = '';
    container.appendChild(t.content.cloneNode(true));
    const ui = getUI();
    const h2 = container.querySelector('.header-main h2');
    const p = container.querySelector('.header-main p');
    if (h2 && ui.alerts_title) h2.innerText = ui.alerts_title;
    if (p && ui.alerts_desc) p.innerText = ui.alerts_desc;
    const markBtn = container.querySelector('.text-btn');
    if (markBtn) {
        if (ui.mark_read) markBtn.innerText = ui.mark_read;
        markBtn.onclick = () => {
            if (MOCK_ALERTS.length > 0) {
                maxReadAlertId = MOCK_ALERTS[0].id;
                localStorage.setItem('maxReadAlertId', maxReadAlertId);
                updateAlertsBadge();
                window.switchTab('alerts');
            }
        };
    }
    const list = container.querySelector('.alerts-list');
    if (!list) return;
    if (MOCK_ALERTS.length === 0) {
        list.innerHTML = `<div class="glass-panel" style="padding:20px; text-align:center;">${escapeHTML(ui.no_alerts || "No live alerts right now.")}</div>`;
    } else {
        MOCK_ALERTS.forEach(a => {
            const isUnread = a.id > maxReadAlertId;
            const c = document.createElement('div');
            c.className = `alert-card glass-panel ${isUnread ? 'unread' : ''}`;
            c.innerHTML = `<div class="alert-icon ${escapeHTML(a.type)}"><i data-lucide="${a.type === 'warning' ? 'alert-triangle' : 'info'}"></i></div><div class="alert-content"><h4>${escapeHTML(a.title)}</h4><p>${escapeHTML(a.desc)}</p></div>`;
            list.appendChild(c);
        });
    }
}

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
    console.log("[MatdanSathi] Starting init...");
    initFirebase();
    const resp = await fetch('data.json?v=3').catch(() => null);
    if (resp && resp.ok) appData = await resp.json();
    
    const updateNavUI = () => {
        const ui = getUI();
        const map = { journey: ui.journey, assistant: ui.assistant, vote: ui.vote || 'Vote', readiness: ui.readiness, alerts: ui.alerts };
        Object.entries(map).forEach(([k, v]) => {
            const s = document.querySelector(`[data-tab="${k}"] span`);
            if (s) s.innerText = v;
        });
    };
    updateNavUI();

    document.querySelectorAll('.nav-item').forEach(n => n.onclick = () => window.switchTab(n.dataset.tab));
    const updateLangUI = () => {
        document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === currentLang));
    };

    document.querySelectorAll('.lang-btn').forEach(b => {
        b.onclick = () => {
            currentLang = b.dataset.lang;
            localStorage.setItem('matdan_lang', currentLang);
            updateLangUI();
            updateNavUI();
            window.switchTab(activeTab);
        };
    });
    updateLangUI();
    
    const pbtn = document.querySelector('.profile-btn');
    if (pbtn) pbtn.onclick = () => {
        const t = document.getElementById('info-modal-template');
        if (!t) return;
        const m = t.content.cloneNode(true).querySelector('.modal-overlay');
        document.body.appendChild(m);
        m.querySelector('.close-modal').onclick = () => m.remove();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    const sbtn = document.querySelector('.search-btn');
    if (sbtn) {
        sbtn.onclick = () => {
            window.switchTab('assistant');
            setTimeout(() => {
                const input = document.getElementById('chat-input');
                if (input) input.focus();
            }, 50);
        };
    }

    console.log("[MatdanSathi] Init complete. UI Ready.");
    window.switchTab('journey');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
} else {
    start();
}
