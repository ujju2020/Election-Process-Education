/**
 * @file admin-app.js
 * @description Admin Dashboard controller for Matdan Sathi.
 * Copyright (c) 2026 Ujjwal Kumar Bhowmick. All rights reserved.
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

/** @type {Object} Global application state */
const State = {
    appData: null,
    currentLang: localStorage.getItem('matdan_lang') || 'en',
    firebase: { app: null, analytics: null, db: null, auth: null }
};

const ADMIN_PASS = "Ujju@3006#";

const FALLBACK_ADMIN_UI = {
    admin_login_title: "Dashboard Access",
    admin_login_desc: "Enter your secure access key to manage alerts",
    admin_login_pass: "Enter Access Key",
    admin_login_btn: "Verify & Unlock",
    admin_header: "Election Alert Control",
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

/**
 * Admin API Service
 */
const AdminService = {
    init() {
        try {
            State.firebase.app = initializeApp(firebaseConfig);
            State.firebase.db = getDatabase(State.firebase.app);
            State.firebase.auth = getAuth(State.firebase.app);
            State.firebase.analytics = getAnalytics(State.firebase.app);
            
            signInAnonymously(State.firebase.auth).then(() => {
                console.log("[Admin] Auth Session Active");
                this.log('admin_session_start');
            }).catch(e => console.error("[Admin] Auth failed", e.message));
        } catch (e) {
            console.error("[Admin] Firebase Init Failed", e);
        }
    },
    log(eventName, params = {}) {
        if (State.firebase.analytics) logEvent(State.firebase.analytics, eventName, params);
    },
    async broadcast(headline, desc, type) {
        if (!State.firebase.db) throw new Error("Database not initialized");
        const alertRef = ref(State.firebase.db, 'live_alerts');
        await push(alertRef, {
            id: Date.now(),
            headline,
            desc,
            type,
            timestamp: new Date().toISOString()
        });
        this.log('admin_broadcast_success', { type });
    }
};

const getUI = () => State.appData?.[State.currentLang]?.ui || FALLBACK_ADMIN_UI;

function updateAdminUI() {
    const ui = getUI();
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === State.currentLang));

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
    if (passInput) passInput.placeholder = ui.admin_login_pass || "Enter Password";
}

async function initAdminLang() {
    try {
        const resp = await fetch('data.json?v=' + Date.now());
        if (resp.ok) State.appData = await resp.json();
    } catch (e) { console.warn("[Admin] Lang load failed"); }
    updateAdminUI();
}

document.addEventListener('DOMContentLoaded', () => {
    AdminService.init();
    initAdminLang();

    const loginBtn = document.getElementById('login-btn');
    const passInput = document.getElementById('admin-pass');
    const authPanel = document.getElementById('auth-panel');
    const dashboardPanel = document.getElementById('dashboard-panel');
    const broadcastBtn = document.getElementById('broadcast-btn');
    const statusMsg = document.getElementById('status-msg');

    // Language Toggle
    document.querySelectorAll('.lang-btn').forEach(b => {
        b.onclick = () => {
            State.currentLang = b.dataset.lang;
            localStorage.setItem('matdan_lang', State.currentLang);
            updateAdminUI();
        };
    });

    // Login logic
    loginBtn.addEventListener('click', () => {
        console.log("[Admin] Login Attempt");
        if (passInput.value === ADMIN_PASS) {
            authPanel.style.display = 'none';
            dashboardPanel.style.display = 'block';
            AdminService.log('admin_login_success');
            if (typeof lucide !== 'undefined') lucide.createIcons();
        } else {
            alert('Incorrect access key!');
            AdminService.log('admin_login_failed');
        }
    });

    passInput.addEventListener('keypress', (e) => { 
        if (e.key === 'Enter') {
            e.preventDefault();
            loginBtn.click();
        }
    });

    // Broadcast logic
    broadcastBtn.onclick = async () => {
        const title = document.getElementById('alert-title').value.trim();
        const desc = document.getElementById('alert-desc').value.trim();
        const type = document.getElementById('alert-type').value;

        if (!title || !desc) {
            alert('Please fill all fields');
            return;
        }

        broadcastBtn.disabled = true;
        statusMsg.innerText = 'Broadcasting...';
        statusMsg.style.color = 'var(--primary)';

        try {
            await AdminService.broadcast(title, desc, type);
            statusMsg.innerText = '✅ Broadcast successful!';
            statusMsg.style.color = 'var(--success)';
            document.getElementById('alert-title').value = '';
            document.getElementById('alert-desc').value = '';
        } catch (e) {
            statusMsg.innerText = '❌ Error: ' + e.message;
            statusMsg.style.color = 'var(--danger)';
        } finally {
            broadcastBtn.disabled = false;
        }
    };

    if (typeof lucide !== 'undefined') lucide.createIcons();
});
