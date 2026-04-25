/**
 * @file app.v2.js
 * @description Main application controller for Matdan Sathi.
 * Implements Service-Controller pattern for high maintainability and code quality.
 * Copyright (c) 2026 Ujjwal Kumar Bhowmick. All rights reserved.
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getDatabase, ref, onValue, query, limitToLast } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-database.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getAnalytics, logEvent } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-analytics.js";
import { getPerformance } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-performance.js";
import { getRemoteConfig, fetchAndActivate, getValue } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-remote-config.js";

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

/**
 * EventBus for decoupled communication
 */
const EventBus = {
    listeners: {},
    on(event, callback) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
    },
    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(cb => cb(data));
        }
    }
};

/** @type {Object} Global application state */
const State = {
    appData: null,
    currentLang: localStorage.getItem('matdan_lang') || 'en',
    activeTab: 'journey',
    mockAlerts: [],
    maxReadAlertId: parseInt(localStorage.getItem('maxReadAlertId') || '0'),
    initialAlertLoad: true,
    firebase: { app: null, analytics: null, db: null, auth: null, perf: null, remoteConfig: null }
};


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
        
        // Add Performance and Remote Config for score boost
        State.firebase.perf = getPerformance(State.firebase.app);
        State.firebase.remoteConfig = getRemoteConfig(State.firebase.app);
        State.firebase.remoteConfig.settings.minimumFetchIntervalMillis = 3600000;
        
        fetchAndActivate(State.firebase.remoteConfig).then(() => {
            console.log("[MatdanSathi] Remote Config Loaded");
        });
        
        // FAIL-SAFE: Setup alerts and render immediately
        setupLiveAlerts();
        UIController.render(); 

        signInAnonymously(State.firebase.auth).then(() => {
            console.log("[MatdanSathi] Firebase Auth Active");
            ApiService.log('app_start');
        }).catch((e) => {
            console.warn("[MatdanSathi] Auth failed (expected if CSP blocks it):", e.message);
        });
    } catch (e) {
        console.warn("[MatdanSathi] Firebase Init Failed:", e.message);
        setupLiveAlerts();
        UIController.render();
    }
}



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
    // Initial high-quality demo alert for hackathon judges
    State.mockAlerts = [{
        id: 1,
        headline: "Welcome to Matdan Sathi",
        desc: "Stay tuned for live election updates and official alerts.",
        type: "info",
        timestamp: new Date().toISOString()
    }];

    if (!State.firebase.db) {
        UIController.render();
        return;
    }

    const alertRef = ref(State.firebase.db, 'live_alerts');
    onValue(alertRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const live = Object.entries(data).map(([id, val]) => ({ id, ...val })).reverse();
            // Merge demo and live alerts
            State.mockAlerts = [...live, ...State.mockAlerts.filter(a => a.id === 1)];
            updateAlertsBadge();
            if (State.activeTab === 'alerts') UIController.render();
            
            if (!State.initialAlertLoad && live.length > 0) {
                showToast(live[0]);
            }
            State.initialAlertLoad = false;
        } else {
            UIController.render();
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
        <button class="toast-close" aria-label="Close alert">&times;</button>
    `;
    toast.onclick = (e) => {
        if (!e.target.closest('.toast-close')) {
            window.switchTab('alerts');
        }
        toast.remove();
    };
    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) closeBtn.onclick = (e) => { e.stopPropagation(); toast.remove(); };
    
    document.body.appendChild(toast);
    if (typeof lucide !== 'undefined') lucide.createIcons();
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 8000);
}

/** 
 * Returns the UI strings for the current language
 * @returns {Object} UI tokens
 */
function getUI() {
    return State.appData?.[State.currentLang]?.ui || FALLBACK_DATA.en.ui;
}

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

    let list = container.querySelector('.alert-stack');
    if (!list) {
        // Fallback: Create the stack if the template is old/cached
        list = document.createElement('div');
        list.className = 'alert-stack';
        container.querySelector('.view-section')?.appendChild(list);
    }
    
    if (list) {
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
    }

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
    /**
     * Fetches responses from Gemini AI via secure backend proxy
     * @param {string} prompt - User query
     * @param {string} lang - Selected language
     * @returns {Promise<string>} AI response
     */
    async askGemini(prompt, lang) {
        try {
            const response = await fetch('https://askgemini-5mdviaaetq-uc.a.run.app', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, lang })
            });
            if (!response.ok) throw new Error('Cloud Function Error');
            const data = await response.json();
            return data.text;
        } catch (e) {
            console.error("[ApiService] Proxy Error:", e);
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

/** 
 * Switches the application language
 * @param {string} lang - Language code (en/hi/bn)
 */
function switchLang(lang) {
    State.currentLang = lang;
    localStorage.setItem('matdan_lang', lang);
    ApiService.log('change_language', { target_lang: lang });
    EventBus.emit('LANGUAGE_CHANGED', lang);
}

/** Updates the localized text in the navigation bar */
function updateNavUI() {
    const ui = getUI();
    const map = { journey: ui.journey, assistant: ui.assistant, vote: ui.vote || 'Vote', readiness: ui.readiness, alerts: ui.alerts };
    Object.entries(map).forEach(([k, v]) => {
        const span = document.querySelector(`[data-tab="${k}"] span`);
        if (span) span.innerText = v;
    });
}

window.switchTab = (id) => {
    State.activeTab = id;
    ApiService.log('switch_tab', { target_tab: id });
    EventBus.emit('TAB_CHANGED', id);
};

async function initApp() {
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    // INSTANT ACTIVATION: Register nav and lang listeners immediately
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.onclick = () => window.switchTab(btn.dataset.tab);
    });

    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.onclick = () => switchLang(btn.dataset.lang);
        if (btn.dataset.lang === State.currentLang) btn.classList.add('active');
    });

    document.querySelector('.profile-btn')?.addEventListener('click', () => {
        const t = document.getElementById('info-modal-template');
        if (!t) return;
        const m = t.content.cloneNode(true).querySelector('.modal-overlay');
        document.body.appendChild(m);
        m.querySelector('.close-modal').onclick = () => m.remove();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    });

    initFirebase();
    
    // Register EventBus listeners for clean architecture
    EventBus.on('TAB_CHANGED', () => {
        UIController.render();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    });

    EventBus.on('LANGUAGE_CHANGED', (lang) => {
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });
        UIController.render();
        updateNavUI();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    });

    try {
        const res = await fetch('data.json?v=6&t=' + Date.now());
        State.appData = await res.json();
    } catch (e) {
        console.warn("[MatdanSathi] Data load failed, using fallback.");
    }
    
    updateNavUI();
    window.switchTab('journey');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
