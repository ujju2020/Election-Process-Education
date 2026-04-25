/**
 * @file app.v2.js
 * @description Main application controller for Matdan Sathi.
 * Implements Service-Controller pattern for high maintainability and code quality.
 * Copyright (c) 2026 Ujjwal Kumar Bhowmick. All rights reserved.
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getAnalytics, logEvent } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";

const FALLBACK_DATA = {
    en: {
        ui: { 
            journey: "Journey", 
            assistant: "Assistant", 
            vote: "Vote", 
            readiness: "Readiness", 
            alerts: "Alerts", 
            ask_placeholder: "Ask about voting...", 
            booth_finder: "Booth Finder", 
            view_details: "View Details", 
            mark_read: "Mark Read",
            assistant_greeting: "Namaste! I am your Election Assistant. How can I help you today?",
            assistant_processing: "Processing query..."
        },
        journey: [{ id: 1, title: "Delimitation", desc: "Defining boundaries." }, { id: 2, title: "Electoral Rolls", desc: "Update your name." }, { id: 3, title: "Notification", desc: "Election announcement." }, { id: 4, title: "Nominations", desc: "Candidates file papers." }, { id: 5, title: "Campaigning", desc: "Vision pitch." }, { id: 6, title: "Polling", desc: "Cast your vote." }, { id: 7, title: "Results", desc: "Winners declared." }],
        candidates: [{ id: 1, name: "Green Party", symbol: "leaf" }, { id: 2, name: "Tech Vision", symbol: "cpu" }, { id: 3, name: "Rights Party", symbol: "scale" }],
        readiness: [{ id: 1, title: "Check List", desc: "Are you ready?", action: "Check Now", url: "https://voters.eci.gov.in" }]
    }
};

/** @type {Object} Global application state */
const State = {
    appData: null,
    currentLang: localStorage.getItem('matdan_lang') || 'en',
    activeTab: 'journey',
    mockAlerts: [],
    maxReadAlertId: parseInt(localStorage.getItem('maxReadAlertId') || '0'),
    firebase: { app: null, analytics: null, db: null, auth: null }
};


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

/**
 * Security Service for Sanitization
 */
const SanitizerService = {
    /**
     * Sanitizes strings to prevent XSS
     * @param {string} str - Input string
     * @returns {string} Sanitized HTML-safe string
     */
    escapeHTML(str) {
        if (typeof str !== 'string') return str;
        return str.replace(/[&<>'"]/g, tag => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
        }[tag] || tag));
    }
};

/**
 * Global Initialization and Event Handlers
 */
function initFirebase() {
    try {
        State.firebase.app = initializeApp(firebaseConfig);
        State.firebase.db = getDatabase(State.firebase.app);
        State.firebase.auth = getAuth(State.firebase.app);
        State.firebase.analytics = getAnalytics(State.firebase.app);
        
        signInAnonymously(State.firebase.auth).then(() => {
            console.log("[MatdanSathi] Firebase Auth Active");
            ApiService.log('app_start');
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
        const count = State.mockAlerts.filter(a => a.id > State.maxReadAlertId).length;
        badge.innerText = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}

/** Synchronizes live alerts from Firebase */
function setupLiveAlerts() {
    if (!State.firebase.db) return;
    const alertRef = ref(State.firebase.db, 'live_alerts');
    onValue(alertRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            State.mockAlerts = Object.entries(data).map(([id, val]) => ({ id, ...val })).reverse();
            updateAlertsBadge();
            if (State.activeTab === 'alerts') UIController.render();
            
            if (!initialAlertLoad && State.mockAlerts.length > 0) {
                showToast(State.mockAlerts[0]);
            }
            initialAlertLoad = false;
        }
    });
}

/**
 * Displays a toast notification for new alerts
 * @param {Object} alertObj - Alert data
 */
function showToast(alertObj) {
    const toast = document.createElement('div');
    toast.className = 'toast-alert animate-up';
    toast.innerHTML = `
        <div class="toast-icon ${SanitizerService.escapeHTML(alertObj.type)}"><i data-lucide="${alertObj.type === 'warning' ? 'alert-triangle' : 'info'}"></i></div>
        <div class="toast-content">
            <h4>${SanitizerService.escapeHTML(alertObj.headline)}</h4>
            <p>${SanitizerService.escapeHTML(alertObj.desc)}</p>
        </div>
    `;
    toast.onclick = () => {
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
    const ui = getUI();
    container.innerHTML = `<section class="view-section"><h2>${ui.journey}</h2><p class="section-desc">${State.appData?.[State.currentLang]?.ui?.journey_subtitle || "Follow the path of democracy"}</p><div class="journey-list timeline-container"></div></section>`;
    const list = container.querySelector('.journey-list');
    const steps = State.appData?.[State.currentLang]?.journey || FALLBACK_DATA.en.journey;
    steps.forEach(s => {
        const c = document.createElement('div');
        c.className = 'timeline-card animate-up';
        c.tabIndex = 0;
        c.setAttribute('role', 'article');
        c.setAttribute('aria-label', `Election step ${s.id}: ${s.title}`);
        c.innerHTML = `<div class="step-num">${s.id}</div><div class="step-content"><h3>${SanitizerService.escapeHTML(s.title)}</h3><p>${SanitizerService.escapeHTML(s.desc)}</p><button class="view-details-btn ballot-btn" style="margin-top:10px;">${ui.view_details || "View Details"}</button></div>`;
        c.querySelector('button').onclick = () => {
            ApiService.log('view_journey_detail', { step_id: s.id, step_title: s.title });
            window.switchTab('assistant');
            const input = document.getElementById('chat-input');
            if (input) {
                input.value = `Tell me more about the election step: ${s.title}`;
                const sendBtn = document.querySelector('.send-btn');
                if (sendBtn) sendBtn.click();
            }
        };
        list.appendChild(c);
    });
}

/**
 * Renders the AI Assistant view
 * @param {HTMLElement} container 
 */
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
            if (e.key === 'Enter') { e.preventDefault(); sendBtn.click(); }
        });
    }

    sendBtn.onclick = async () => {
        const val = input.value.trim();
        if (!val) return;
        
        ApiService.log('ask_assistant', { query_length: val.length });
        
        const uMsg = document.createElement('div');
        uMsg.className = 'user-msg assistant-msg animate-up';
        uMsg.innerHTML = `<div class="msg-bubble">${SanitizerService.escapeHTML(val)}</div>`;
        msgArea.appendChild(uMsg);
        input.value = '';
        msgArea.scrollTop = msgArea.scrollHeight;

        const bot = document.createElement('div');
        bot.className = 'assistant-msg animate-up';
        bot.innerHTML = `<div class="avatar"><i data-lucide="bot"></i></div><div class="msg-bubble loading-bubble">${SanitizerService.escapeHTML(ui.assistant_processing || "Processing query...")}</div>`;
        msgArea.appendChild(bot);
        if (typeof lucide !== 'undefined') lucide.createIcons();
        msgArea.scrollTop = msgArea.scrollHeight;

        try {
            const text = await ApiService.askGemini(val, State.currentLang);
            const bubble = bot.querySelector('.msg-bubble');
            bubble.classList.remove('loading-bubble');
            bubble.innerHTML = typeof marked !== 'undefined' ? marked.parse(text) : SanitizerService.escapeHTML(text);
        } catch (e) {
            bot.querySelector('.msg-bubble').innerText = "Sorry, I am currently offline. Please try again later.";
        }
        msgArea.scrollTop = msgArea.scrollHeight;
    };
}


/**
 * Renders the Mock Voting Simulation
 * @param {HTMLElement} container 
 */
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
    const cands = State.appData?.[State.currentLang]?.candidates || FALLBACK_DATA.en.candidates;
    
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
            r.innerHTML = `<div class="cand-num">${c.id}</div><div class="cand-name">${SanitizerService.escapeHTML(c.name)}</div><div class="cand-symbol"><i data-lucide="${c.symbol}"></i></div><div class="vote-btn-wrapper"><button class="vote-btn" ${!act ? 'disabled' : ''}></button></div>`;
            r.querySelector('.vote-btn').onclick = () => {
                ApiService.log('cast_mock_vote', { candidate_id: c.id, candidate_name: c.name });
                act = false; upd(false);
                const slip = document.getElementById('vvpat-slip');
                if (slip) { 
                    slip.querySelector('.slip-name').innerText = c.name; 
                    slip.classList.add('show'); 
                    setTimeout(() => { slip.classList.replace('show', 'drop'); window.switchTab('vote'); }, 2000); 
                }
            };
            bu.appendChild(r);
        });
        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    const btn = document.getElementById('ballot-trigger');
    if (btn) btn.onclick = () => { ApiService.log('press_ballot_button'); upd(true); draw(true); };
    upd(false); draw(false);
}


/**
 * Renders the Readiness Checklist view
 * @param {HTMLElement} container 
 */
function renderReadiness(container) {
    const ui = getUI();
    container.innerHTML = `<section class="view-section"><h2>${ui.readiness}</h2><div class="readiness-list timeline-container"></div></section>`;
    const list = container.querySelector('.readiness-list');
    const rData = State.appData?.[State.currentLang]?.readiness || FALLBACK_DATA.en.readiness;
    if (rData && list) {
        rData.forEach(r => {
            const c = document.createElement('div');
            c.className = 'timeline-card animate-up';
            c.tabIndex = 0;
            c.setAttribute('role', 'article');
            c.innerHTML = `<div class="step-num"><i data-lucide="check"></i></div><div class="step-content"><h3>${SanitizerService.escapeHTML(r.title)}</h3><p>${SanitizerService.escapeHTML(r.desc)}</p><a href="${SanitizerService.escapeHTML(r.url)}" target="_blank" class="ballot-btn" style="display:inline-block; margin-top:10px; text-decoration:none; padding:8px 16px; font-size:0.85rem;">${SanitizerService.escapeHTML(r.action)}</a></div>`;
            c.querySelector('a').onclick = () => ApiService.log('click_readiness_link', { link_title: r.title });
            list.appendChild(c);
        });
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}


/**
 * Renders the Live Alerts view
 * @param {HTMLElement} container 
 */
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
            if (State.mockAlerts.length > 0) {
                ApiService.log('mark_all_alerts_read');
                State.maxReadAlertId = State.mockAlerts[0].id;
                localStorage.setItem('maxReadAlertId', State.maxReadAlertId);
                updateAlertsBadge();
                UIController.render();
            }
        };
    }

    const list = container.querySelector('.alert-stack');
    if (!list) return;
    list.innerHTML = '';
    State.mockAlerts.forEach(a => {
        const isNew = a.id > State.maxReadAlertId;
        const c = document.createElement('div');
        c.className = `alert-card ${a.type} animate-up ${isNew ? 'new-alert' : ''}`;
        c.tabIndex = 0;
        c.setAttribute('role', 'status');
        c.innerHTML = `<div class="alert-icon"><i data-lucide="${a.type === 'warning' ? 'alert-triangle' : 'info'}"></i></div><div class="alert-info"><h3>${SanitizerService.escapeHTML(a.headline)}</h3><p>${SanitizerService.escapeHTML(a.desc)}</p></div>`;
        list.appendChild(c);
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/**
 * Core Services for API and External Integrations
 */
const ApiService = {
    /**
     * Fetches responses from Gemini AI
     * @param {string} prompt - User query
     * @param {string} lang - Selected language
     * @returns {Promise<string>} AI response
     */
    async askGemini(prompt, lang) {
        const langContext = lang === 'hi' ? 'Respond in Hindi.' : lang === 'bn' ? 'Respond in Bengali.' : 'Respond in English.';
        const systemInstruction = `You are Matdan Sathi, an expert on the Indian Election Process. Keep your answers concise, helpful, and neutral. ${langContext}`;
        
        try {
            const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=AIzaSyCTi8JZUSd76Y0BIY75xJ4n9soI2pXAKPg', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: { parts: { text: systemInstruction } },
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });
            if (!response.ok) throw new Error('Gemini API Error');
            const data = await response.json();
            return data.candidates[0].content.parts[0].text;
        } catch (e) {
            console.error("[ApiService] Gemini Error:", e);
            throw e;
        }
    },

    /** Logs custom events to Firebase Analytics */
    log(eventName, params = {}) {
        if (State.firebase.analytics) {
            logEvent(State.firebase.analytics, eventName, {
                ...params,
                language: State.currentLang,
                tab: State.activeTab
            });
        }
    }
};

/**
 * UI Controller for Tab Rendering and Interaction
 */
const UIController = {
    /** Refreshes the active view */
    render() {
        const container = document.getElementById('main-content');
        if (!container) return;
        
        switch (State.activeTab) {
            case 'journey': renderJourney(container); break;
            case 'assistant': renderAssistant(container); break;
            case 'vote': renderVote(container); break;
            case 'readiness': renderReadiness(container); break;
            case 'alerts': renderAlerts(container); break;
        }
        
        document.querySelectorAll('.nav-item').forEach(btn => {
            const isActive = btn.dataset.tab === State.activeTab;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-selected', isActive);
        });
    }
};

window.switchTab = (id) => {
    console.log("[MatdanSathi] Tab:", id);
    State.activeTab = id;
    ApiService.log('switch_tab', { target_tab: id });
    UIController.render();
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
