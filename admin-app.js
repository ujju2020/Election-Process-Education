/* 
 * Matdan Sathi - Election Process Education Assistant
 * Admin Dashboard Logic
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, push } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getAnalytics, logEvent } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";

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

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const analytics = getAnalytics(app);

const ADMIN_PASS = "Ujju@3006#";

let appData = null;
let currentLang = localStorage.getItem('matdan_lang') || 'en';

const FALLBACK_ADMIN_UI = {
    admin_login_title: "Admin Login",
    admin_login_desc: "Enter password to broadcast alerts",
    admin_login_pass: "Enter Password",
    admin_login_btn: "Unlock Dashboard",
    admin_header: "Alert Broadcast",
    admin_view_site: "View Site",
    admin_alert_type: "Alert Type",
    admin_type_info: "Information (Blue)",
    admin_type_warn: "Warning (Yellow/Red)",
    admin_headline: "Headline",
    admin_headline_ph: "e.g., Heavy Rain Warning",
    admin_desc: "Description",
    admin_desc_ph: "Enter full details...",
    admin_broadcast_btn: "Broadcast to All Users"
};

const getUI = () => appData?.[currentLang]?.ui || FALLBACK_ADMIN_UI;

function updateAdminUI() {
    const ui = getUI();
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === currentLang));

    const els = {
        'ui-login-title': ui.admin_login_title,
        'ui-login-desc': ui.admin_login_desc,
        'ui-login-btn': ui.admin_login_btn,
        'ui-admin-header': ui.admin_header,
        'ui-view-site': ui.admin_view_site,
        'ui-alert-type': ui.admin_alert_type,
        'ui-type-info': ui.admin_type_info,
        'ui-type-warn': ui.admin_type_warn,
        'ui-headline': ui.admin_headline,
        'ui-desc': ui.admin_desc,
        'ui-broadcast-btn': ui.admin_broadcast_btn
    };

    Object.entries(els).forEach(([id, text]) => {
        const el = document.getElementById(id);
        if (el && text) el.innerText = text;
    });

    const passInput = document.getElementById('admin-pass');
    if (passInput && ui.admin_login_pass) passInput.placeholder = ui.admin_login_pass;

    const titleInput = document.getElementById('alert-title');
    if (titleInput && ui.admin_headline_ph) titleInput.placeholder = ui.admin_headline_ph;

    const descInput = document.getElementById('alert-desc');
    if (descInput && ui.admin_desc_ph) descInput.placeholder = ui.admin_desc_ph;
}

async function initAdminLang() {
    const resp = await fetch('data.json?v=' + Date.now()).catch(() => null);
    if (resp && resp.ok) appData = await resp.json();
    updateAdminUI();
}

document.addEventListener('DOMContentLoaded', () => {
    initAdminLang();

    document.querySelectorAll('.lang-btn').forEach(b => {
        b.onclick = () => {
            currentLang = b.dataset.lang;
            localStorage.setItem('matdan_lang', currentLang);
            updateAdminUI();
        };
    });
    const authPanel = document.getElementById('auth-panel');
    const dashboardPanel = document.getElementById('dashboard-panel');
    const loginBtn = document.getElementById('login-btn');
    const passInput = document.getElementById('admin-pass');
    const broadcastBtn = document.getElementById('broadcast-btn');
    const statusMsg = document.getElementById('status-msg');

    // Attempt Anonymous Sign-in for database access
    signInAnonymously(auth).then(() => {
        console.log("[Admin] Firebase Auth Session Active");
    }).catch(e => {
        console.error("[Admin] Auth error:", e.message);
    });

    if (passInput) {
        passInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                loginBtn.click();
            }
        });
    }

    loginBtn.addEventListener('click', () => {
        if (passInput.value === ADMIN_PASS) {
            authPanel.style.display = 'none';
            dashboardPanel.style.display = 'block';
            logEvent(analytics, 'admin_login_success');
            
            // Add listeners for broadcast inputs once dashboard is active
            const titleInput = document.getElementById('alert-title');
            const descInput = document.getElementById('alert-desc');
            
            if (titleInput) {
                titleInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        broadcastBtn.click();
                    }
                });
            }
            if (descInput) {
                descInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        broadcastBtn.click();
                    }
                });
            }
        } else {
            alert('Incorrect password!');
            logEvent(analytics, 'admin_login_failed');
        }
    });

    broadcastBtn.addEventListener('click', async () => {
        const type = document.getElementById('alert-type').value;
        const title = document.getElementById('alert-title').value.trim();
        const desc = document.getElementById('alert-desc').value.trim();

        if (!title || !desc) {
            alert('Please fill in all fields');
            return;
        }

        broadcastBtn.disabled = true;
        statusMsg.style.color = '#6366f1';
        statusMsg.innerText = 'Attempting to broadcast...';

        try {
            const alertsRef = ref(db, 'live_alerts');
            const newAlert = {
                id: Date.now(),
                type: type,
                title: title,
                desc: desc,
                unread: true,
                timestamp: new Date().toISOString()
            };

            await push(alertsRef, newAlert);

            statusMsg.style.color = '#22c55e';
            statusMsg.innerText = 'Alert Broadcasted Successfully!';
            logEvent(analytics, 'alert_broadcasted', { type });

            // Clear form
            document.getElementById('alert-title').value = '';
            document.getElementById('alert-desc').value = '';
        } catch (e) {
            console.error(e);
            statusMsg.style.color = '#ef4444';
            let errMsg = 'Failed: Check internet and if Realtime Database is enabled.';
            if (e.message.includes('permission_denied')) errMsg = 'Permission Denied: Check Database Rules.';
            statusMsg.innerText = errMsg;
        } finally {
            broadcastBtn.disabled = false;
        }
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();
});
