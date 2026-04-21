/* 
 * Election Process Education Assistant
 * Developer - Antigravity (powered by Gemini)
 * Project ID: fleet-bus-494014-q1
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { getAnalytics, logEvent } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getPerformance, trace } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-performance.js";
import { getRemoteConfig, fetchAndActivate, getValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-remote-config.js";

const firebaseConfig = {
    apiKey: "AIzaSy_PLACEHOLDER_KEY", // Note: User should provide actual API Key
    authDomain: "fleet-bus-494014-q1.firebaseapp.com",
    databaseURL: "https://fleet-bus-494014-q1-default-rtdb.firebaseio.com",
    projectId: "fleet-bus-494014-q1",
    storageBucket: "fleet-bus-494014-q1.appspot.com",
    messagingSenderId: "PLACEHOLDER",
    appId: "PLACEHOLDER"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);
const auth = getAuth(app);
const perf = getPerformance(app);
const remoteConfig = getRemoteConfig(app);

// Remote Config Defaults
remoteConfig.defaultConfig = {
    assistant_name: "Matdan Sathi",
    current_phase: "Preparation"
};

// Security: XSS Mitigation
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

const ELECTION_STAGES = [
    { id: 1, title: "Delimitation", desc: "Geographical boundaries of constituencies are redrawn to ensure equal representation.", icon: "map-pin" },
    { id: 2, title: "Electoral Rolls", desc: "Updating the list of eligible voters. Ensure your name is on the list!", icon: "users" },
    { id: 3, title: "Notification", desc: "The official announcement by the ECI calling for elections.", icon: "bell" },
    { id: 4, title: "Nominations", desc: "Candidates file papers. Scrutiny and withdrawals follow.", icon: "file-text" },
    { id: 5, title: "Campaigning", desc: "Political activities and the Model Code of Conduct come into effect.", icon: "megaphone" },
    { id: 6, title: "Polling Day", desc: "The crucial day when citizens cast their votes using EVMs.", icon: "box" },
    { id: 7, title: "Counting & Results", desc: "Votes are counted and winners are declared.", icon: "tally-5" }
];

let isInitialLoad = true;
let appData = null;

const MOCK_ALERTS = [
    { id: 1, type: "info", title: "Registration Open", desc: "Last date for voter registration is approaching. Check eci.gov.in", unread: true },
    { id: 2, type: "warning", title: "Code of Conduct", desc: "The Model Code of Conduct is now in effect for the current phase.", unread: false }
];

// Fetch content from data.json
async function loadAppData() {
    try {
        const response = await fetch('data.json');
        appData = await response.json();
    } catch (e) {
        console.error('Failed to load app data', e);
    }
}

// PWA: Service Worker Registration
function registerSW() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./service-worker.js')
                .then(reg => console.log('SW Registered', reg.scope))
                .catch(err => console.log('SW Registration Failed', err));
        });
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    // Non-blocking Firebase Init
    const initFirebase = async () => {
        try {
            await signInAnonymously(auth);
            logEvent(analytics, 'app_open');
            await fetchAndActivate(remoteConfig);
        } catch (e) {
            console.warn('[Firebase] Init partial success', e.message);
        }
    };
    initFirebase();
    await loadAppData();
    registerSW();

    if (typeof lucide !== 'undefined') lucide.createIcons();

    const mainContent = document.getElementById('main-content');
    const navButtons = document.querySelectorAll('.nav-item');

    const renderJourney = () => {
        const template = document.getElementById('journey-view-template');
        mainContent.innerHTML = '';
        mainContent.appendChild(template.content.cloneNode(true));
        
        const container = mainContent.querySelector('.timeline-container');
        const data = (appData && appData.journey) || [];
        
        data.forEach(stage => {
            const card = document.createElement('div');
            card.className = 'timeline-card animate-up';
            card.innerHTML = `
                <div class="step-num">${stage.id}</div>
                <div class="step-content">
                    <h3>${escapeHTML(stage.title)}</h3>
                    <p>${escapeHTML(stage.desc)}</p>
                </div>
            `;
            container.appendChild(card);
        });
        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    const renderAssistant = () => {
        const template = document.getElementById('assistant-view-template');
        mainContent.innerHTML = '';
        mainContent.appendChild(template.content.cloneNode(true));
        if (typeof lucide !== 'undefined') lucide.createIcons();

        const input = document.getElementById('chat-input');
        const sendBtn = document.querySelector('.send-btn');
        const chatMessages = document.getElementById('chat-messages');

        const sendMessage = () => {
            const text = input.value.trim();
            if (!text) return;

            const userMsg = document.createElement('div');
            userMsg.className = 'user-msg assistant-msg animate-up';
            userMsg.innerHTML = `<div class="msg-bubble">${escapeHTML(text)}</div>`;
            chatMessages.appendChild(userMsg);
            input.value = '';

            logEvent(analytics, 'assistant_query', { query: text });

            // Assistant Logic: Search FAQ data or provide default
            setTimeout(() => {
                let responseText = `That's a great question about "${escapeHTML(text)}". Generally, the ECI provides updated guidelines on this!`;
                
                if (appData && appData.faqs) {
                    const match = appData.faqs.find(f => 
                        text.toLowerCase().includes(f.question.toLowerCase().split(' ').slice(-2).join(' ')) ||
                        f.question.toLowerCase().includes(text.toLowerCase())
                    );
                    if (match) responseText = match.answer;
                }

                const botMsg = document.createElement('div');
                botMsg.className = 'assistant-msg animate-up';
                botMsg.innerHTML = `
                    <div class="avatar"><i data-lucide="bot"></i></div>
                    <div class="msg-bubble">${escapeHTML(responseText)}</div>
                `;
                chatMessages.appendChild(botMsg);
                chatMessages.scrollTop = chatMessages.scrollHeight;
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }, 1000);
        };

        sendBtn.addEventListener('click', sendMessage);
        input.addEventListener('keypress', (e) => { if(e.key === 'Enter') sendMessage(); });
    };

    const renderReadiness = () => {
        mainContent.innerHTML = `
            <section class="view-section">
                <div class="section-header">
                    <h2>Readiness Checklist</h2>
                    <p>Ensure you are ready for the ballot</p>
                </div>
                <div class="readiness-list timeline-container">
                    <!-- Items will be injected here -->
                </div>
            </section>
        `;
        const container = mainContent.querySelector('.readiness-list');
        const data = (appData && appData.readiness) || [];

        data.forEach(item => {
            const card = document.createElement('div');
            card.className = 'timeline-card animate-up';
            card.style.cursor = 'pointer';
            card.innerHTML = `
                <div class="step-num"><i data-lucide="check"></i></div>
                <div class="step-content">
                    <h3>${escapeHTML(item.title)}</h3>
                    <p>${escapeHTML(item.desc)}</p>
                    <span class="text-btn" style="margin-top:8px; display:inline-block">${escapeHTML(item.action)}</span>
                </div>
            `;
            card.addEventListener('click', () => alert(`Action: ${item.action}`));
            container.appendChild(card);
        });
        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    const renderAlerts = () => {
        const template = document.getElementById('alerts-view-template');
        mainContent.innerHTML = '';
        mainContent.appendChild(template.content.cloneNode(true));
        
        const container = mainContent.querySelector('.alerts-list');
        MOCK_ALERTS.forEach(alert => {
            const card = document.createElement('div');
            card.className = 'alert-card glass-panel';
            card.innerHTML = `
                ${alert.unread ? '<div class="unread-dot"></div>' : ''}
                <div class="alert-icon ${alert.type}"><i data-lucide="${alert.type === 'info' ? 'info' : 'alert-triangle'}"></i></div>
                <div class="alert-content">
                    <h4>${escapeHTML(alert.title)}</h4>
                    <p>${escapeHTML(alert.desc)}</p>
                </div>
            `;
            container.appendChild(card);
        });
        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    const switchTab = (tabId) => {
        logEvent(analytics, 'tab_view', { tab_name: tabId });
        navButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
            btn.setAttribute('aria-selected', btn.dataset.tab === tabId);
        });

        const traceName = `tab_render_${tabId}`;
        let t = null;
        try { t = trace(perf, traceName); t.start(); } catch (e) {}

        switch(tabId) {
            case 'journey': renderJourney(); break;
            case 'assistant': renderAssistant(); break;
            case 'readiness': renderReadiness(); break;
            case 'alerts': renderAlerts(); break;
            default: mainContent.innerHTML = '<div class="view-section"><h2>Coming Soon</h2></div>';
        }

        if (t) t.stop();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    // Global Search Logic
    const searchBtn = document.querySelector('.search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            const query = prompt('Search election information:');
            if (!query) return;
            
            logEvent(analytics, 'search_performed', { query });

            // Search in journey and faqs
            let match = null;
            if (appData) {
                match = appData.journey.find(s => s.title.toLowerCase().includes(query.toLowerCase()));
                if (!match && appData.faqs) {
                    match = appData.faqs.find(f => f.question.toLowerCase().includes(query.toLowerCase()));
                }
            }

            if (match) {
                alert(`Search Match: ${match.title || match.question}\n\n${match.desc || match.answer}`);
            } else {
                alert('No exact match found. Try searching for "Voting", "Registration", or "EVM".');
            }
        });
    }

    // Live Alerts from Firebase RTDB
    const alertsRef = ref(db, 'live_alerts');
    onValue(alertsRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            const newAlert = Object.values(data).sort((a, b) => b.id - a.id)[0];
            
            if (newAlert && !MOCK_ALERTS.find(a => a.id === newAlert.id)) {
                MOCK_ALERTS.unshift(newAlert);
                const badge = document.querySelector('.notification-badge');
                if (badge) {
                    badge.innerText = parseInt(badge.innerText) + 1;
                    badge.style.display = 'flex';
                }
                const activeTab = document.querySelector('.nav-item.active').dataset.tab;
                if (activeTab === 'alerts') renderAlerts();
            }
        }
    });

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Default Tab
    switchTab('journey');
});
