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

document.addEventListener('DOMContentLoaded', () => {
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

    loginBtn.addEventListener('click', () => {
        if (passInput.value === ADMIN_PASS) {
            authPanel.style.display = 'none';
            dashboardPanel.style.display = 'block';
            logEvent(analytics, 'admin_login_success');
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
