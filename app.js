/* 
 * Matdan Sathi - Election Process Education Assistant
 * Developer - Ujjwal Kumar Bhowmick (ujjwalkumarbhowmick30@gmail.com)
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
let currentLang = localStorage.getItem('matdan_lang') || 'en';

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
    updateUIStrings();

    if (typeof lucide !== 'undefined') lucide.createIcons();

    const mainContent = document.getElementById('main-content');
    const navButtons = document.querySelectorAll('.nav-item');
    const langButtons = document.querySelectorAll('.lang-btn');

    function updateUIStrings() {
        if (!appData || !appData[currentLang]) return;
        const strings = appData[currentLang].ui;
        
        // Update Nav
        document.querySelector('[data-tab="journey"] span').innerText = strings.journey;
        document.querySelector('[data-tab="assistant"] span').innerText = strings.assistant;
        document.querySelector('[data-tab="readiness"] span').innerText = strings.readiness;
        document.querySelector('[data-tab="alerts"] span').innerText = strings.alerts;

        // Update Search Placeholder (if exists)
        const searchInput = document.getElementById('chat-input');
        if (searchInput) searchInput.placeholder = strings.ask_placeholder;

        // Set Active Lang Button
        langButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === currentLang);
        });
    }

    const renderJourney = () => {
        const template = document.getElementById('journey-view-template');
        mainContent.innerHTML = '';
        mainContent.appendChild(template.content.cloneNode(true));
        
        const strings = appData[currentLang].ui;
        mainContent.querySelector('h2').innerText = strings.journey + ' Journey';

        const container = mainContent.querySelector('.timeline-container');
        const data = (appData && appData[currentLang].journey) || [];
        
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

        const chatMessages = document.getElementById('chat-messages');
        const strings = appData[currentLang].ui;
        chatMessages.querySelector('.msg-bubble').innerText = currentLang === 'bn' ? 'নমস্কার! আমি আপনার নির্বাচনী সহকারী। আজ আমি আপনাকে কীভাবে সাহায্য করতে পারি?' : 
                                                            currentLang === 'hi' ? 'नमस्ते! मैं आपका चुनाव सहायक हूं। मैं आज आपकी क्या मदद कर सकता हूं?' : 
                                                            'Namaste! I am your Election Assistant. How can I help you today?';
        
        const input = document.getElementById('chat-input');
        const sendBtn = document.querySelector('.send-btn');
        input.placeholder = strings.ask_placeholder;

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
                let responseText = currentLang === 'bn' ? `"${escapeHTML(text)}" সম্পর্কে এটি একটি দুর্দান্ত প্রশ্ন। সাধারণত, নির্বাচন কমিশন এই বিষয়ে নিয়মিত আপডেট দেয়!` :
                                   currentLang === 'hi' ? `"${escapeHTML(text)}" के बारे में यह एक बेहतरीन सवाल है। आम तौर पर, चुनाव आयोग इस पर अपडेटेड दिशा-निर्देश प्रदान करता है!` :
                                   `That's a great question about "${escapeHTML(text)}". Generally, the ECI provides updated guidelines on this!`;
                
                if (appData && appData[currentLang].faqs) {
                    const match = appData[currentLang].faqs.find(f => 
                        text.toLowerCase().includes(f.question.toLowerCase()) ||
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
        const strings = appData[currentLang].ui;
        mainContent.innerHTML = `
            <section class="view-section">
                <div class="section-header">
                    <h2>${strings.readiness} Checklist</h2>
                    <p>${currentLang === 'bn' ? 'ব্যালটের জন্য আপনি প্রস্তুত কিনা নিশ্চিত করুন' : currentLang === 'hi' ? 'सुनिश्चित करें कि आप मतपत्र के लिए तैयार हैं' : 'Ensure you are ready for the ballot'}</p>
                </div>
                <div class="readiness-list timeline-container">
                    <!-- Items will be injected here -->
                </div>
                <div class="glass-panel booth-finder-feature animate-up" style="margin-top: 24px; padding: 20px;">
                    <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 12px;">
                        <div class="icon-box" style="background: var(--primary); color: white; padding: 10px; border-radius: 10px;">
                            <i data-lucide="map-pin"></i>
                        </div>
                        <h3>${strings.booth_finder}</h3>
                    </div>
                    <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 15px;">
                        ${currentLang === 'bn' ? 'আপনার নির্দিষ্ট ভোটকেন্দ্র এবং বুথের অবস্থান জানতে অফিসিয়াল পোর্টাল ব্যবহার করুন।' : 
                          currentLang === 'hi' ? 'अपने विशेष मतदान केंद्र और बूथ की स्थिति जानने के लिए आधिकारिक पोर्टल का उपयोग करें।' : 
                          'Use the official portal to find your dedicated polling station and booth location.'}
                    </p>
                    <a href="https://electoralsearch.eci.gov.in/pollingstation" target="_blank" class="primary-btn" style="text-decoration: none; display: inline-flex; align-items: center; gap: 8px;">
                        <span>${strings.view_details}</span>
                        <i data-lucide="external-link" style="width: 14px;"></i>
                    </a>
                </div>
            </section>
        `;
        const container = mainContent.querySelector('.readiness-list');
        const data = (appData && appData[currentLang].readiness) || [];

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
            card.addEventListener('click', () => {
                if (item.url) window.open(item.url, '_blank');
                else alert(`Action: ${item.action}`);
            });
            container.appendChild(card);
        });
        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    const renderAlerts = () => {
        const strings = appData[currentLang].ui;
        const template = document.getElementById('alerts-view-template');
        mainContent.innerHTML = '';
        mainContent.appendChild(template.content.cloneNode(true));
        
        mainContent.querySelector('h2').innerText = strings.alerts;
        if (mainContent.querySelector('.text-btn')) {
            mainContent.querySelector('.text-btn').innerText = strings.mark_read;
        }

        const container = mainContent.querySelector('.alerts-list');
        MOCK_ALERTS.forEach(alert => {
            const card = document.createElement('div');
            card.className = `alert-card animate-up ${alert.unread ? 'unread' : ''}`;
            card.innerHTML = `
                <div class="alert-icon ${alert.type}">
                    <i data-lucide="${alert.type === 'warning' ? 'alert-triangle' : 'info'}"></i>
                </div>
                <div class="alert-content">
                    <h4>${escapeHTML(alert.title)}</h4>
                    <p>${escapeHTML(alert.desc)}</p>
                </div>
            `;
            container.appendChild(card);
        });
        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    let isBallotActive = false;
    const renderVote = () => {
        const template = document.getElementById('vote-view-template');
        mainContent.innerHTML = '';
        mainContent.appendChild(template.content.cloneNode(true));

        const candidates = (appData && appData[currentLang].candidates) || [];

        const buCandidates = document.getElementById('bu-candidates');
        const cuBusyLight = document.getElementById('cu-busy-light');
        const buReadyLight = document.getElementById('bu-ready-light');
        const ballotBtn = document.getElementById('ballot-trigger');

        const updateEVMState = () => {
            if (isBallotActive) {
                if (cuBusyLight) cuBusyLight.classList.remove('active');
                if (buReadyLight) buReadyLight.classList.add('active');
            } else {
                if (cuBusyLight) cuBusyLight.classList.add('active');
                if (buReadyLight) buReadyLight.classList.remove('active');
            }
        };
        updateEVMState();

        if (ballotBtn) {
            ballotBtn.addEventListener('click', () => {
                if (!isBallotActive) {
                    isBallotActive = true;
                    updateEVMState();
                    renderCandidates();
                    logEvent(analytics, 'ballot_activated');
                }
            });
        }

        const castVote = (candidate) => {
            if (!isBallotActive) return;
            isBallotActive = false;
            
            // UI Feedback
            const row = document.querySelector(`[data-cand-id="${candidate.id}"]`);
            if (row) row.querySelector('.vote-light').classList.add('active');
            if (buReadyLight) buReadyLight.classList.remove('active');
            
            logEvent(analytics, 'vote_cast', { candidate: candidate.name });

            // VVPAT Sequence
            const slip = document.getElementById('vvpat-slip');
            if (slip) {
                slip.querySelector('.slip-num').innerText = `ID: ${candidate.id}`;
                slip.querySelector('.slip-name').innerText = candidate.name;
                slip.querySelector('.slip-symbol-box').innerHTML = `<i data-lucide="${candidate.symbol}"></i>`;
                if (typeof lucide !== 'undefined') lucide.createIcons();

                setTimeout(() => {
                    slip.classList.add('show');
                    
                    // 7 seconds display
                    setTimeout(() => {
                        slip.classList.remove('show');
                        slip.classList.add('drop');
                        
                        setTimeout(() => {
                            isBallotActive = false;
                            updateEVMState();
                            renderCandidates();
                            if (activeTab === 'vote') renderVote();
                        }, 1000);
                    }, 7000);
                }, 500);
            }
        };

        const renderCandidates = () => {
            if (!buCandidates) return;
            buCandidates.innerHTML = '';
            candidates.forEach(cand => {
                const row = document.createElement('div');
                row.className = 'candidate-row';
                row.dataset.candId = cand.id;
                row.innerHTML = `
                    <div class="cand-num">${cand.id}</div>
                    <div class="cand-name">${escapeHTML(cand.name)}</div>
                    <div class="cand-symbol"><i data-lucide="${cand.symbol}"></i></div>
                    <div class="vote-btn-wrapper">
                        <div class="vote-light"></div>
                        <button class="vote-btn" ${!isBallotActive ? 'disabled' : ''}></button>
                    </div>
                `;
                
                const btn = row.querySelector('.vote-btn');
                btn.addEventListener('click', () => castVote(cand));
                buCandidates.appendChild(row);
            });
            if (typeof lucide !== 'undefined') lucide.createIcons();
        };

        renderCandidates();
    };

    // Project Info Modal Logic
    const profileBtn = document.querySelector('.profile-btn');
    const showProjectInfo = () => {
        const template = document.getElementById('info-modal-template');
        if (!template) return;
        const modal = template.content.cloneNode(true).querySelector('.modal-overlay');
        document.body.appendChild(modal);

        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    if (profileBtn) {
        profileBtn.addEventListener('click', showProjectInfo);
    }

    let activeTab = 'journey';
    const switchTab = (tabId) => {
        activeTab = tabId;
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
            case 'vote': renderVote(); break;
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
            const strings = appData[currentLang].ui;
            const query = prompt(strings.search_placeholder);
            if (!query) return;
            
            logEvent(analytics, 'search_performed', { query });

            // Search in journey and faqs
            let match = null;
            if (appData && appData[currentLang]) {
                match = appData[currentLang].journey.find(s => s.title.toLowerCase().includes(query.toLowerCase()));
                if (!match && appData[currentLang].faqs) {
                    match = appData[currentLang].faqs.find(f => f.question.toLowerCase().includes(query.toLowerCase()));
                }
            }

            if (match) {
                alert(`Search Match: ${match.title || match.question}\n\n${match.desc || match.answer}`);
            } else {
                alert(currentLang === 'bn' ? 'সঠিক মিল খুঁজে পাওয়া যায়নি।' : currentLang === 'hi' ? 'कोई सटीक मिलान नहीं मिला।' : 'No exact match found.');
            }
        });
    }

    // Language Switching Logic
    langButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            currentLang = btn.dataset.lang;
            localStorage.setItem('matdan_lang', currentLang);
            updateUIStrings();
            
            // Re-render current tab
            switchTab(activeTab);
        });
    });

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
