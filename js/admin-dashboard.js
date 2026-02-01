
// Admin Dashboard Entry Point
import { initRealtimeStats } from './stats.js';

// --- FIREBASE CHECK ---
if (!window.firebaseServices) {
    console.error("Critical: window.firebaseServices is undefined.");
    setTimeout(() => {
        if (!window.firebaseServices) document.body.innerHTML = "<h1 style='color:red; text-align:center; margin-top:20%;'>Firebase Connection Failed</h1>";
    }, 2000);
}

function getFirebase() { return window.firebaseServices || {}; }

// --- GLOBAL CONSTANTS ---
window.Roles = {
    SUPER_ADMIN: 'superadmin',
    ADMIN: 'admin',
    COADMIN: 'coadmin',
    USER: 'user'
};

window.GlobalData = {
    colleges: [
        { id: 'medicaps', name: 'Medicaps University', logo: '../assets/logos/medicaps.png' },
        { id: 'lpu', name: 'LPU University', logo: '../assets/logos/lpu.png' },
        { id: 'ips', name: 'IPS Academy', logo: '../assets/logos/ips.png' },
        { id: 'cdgi', name: 'CDGI University', logo: '../assets/logos/cdgi.png' },
        { id: 'iitd', name: 'IIT Delhi', logo: '../assets/logos/iitd.png' }
    ]
};

let currentUser = null;

// --- INITIALIZATION ---
function handleAuthReady(data) {
    if (!data) return;
    const { user, currentUser: appCurrentUser } = data;

    if (user && appCurrentUser) {
        console.log("🚀 Admin Dashboard Session Active:", appCurrentUser.role);

        currentUser = appCurrentUser;
        window.currentUser = currentUser;

        // Security Check (Redundant but safe)
        if (currentUser.role !== 'admin' && currentUser.role !== 'superadmin') {
            alert("⛔ Access Denied. Redirecting...");
            window.location.href = 'dashboard.html';
            return;
        }

        updateUserProfileUI();
        initTabs();

        // Default View
        renderTabContent('admin-console');

        // Initialize Admin Console Module
        if (window.AdminConsole) {
            window.AdminConsole.init();
        }

        // Settings Init
        if (window.SettingsModule) {
            window.SettingsModule.state.user = { ...currentUser };
            window.SettingsModule.init();
        }
    }
}

// --- TAB LOGIC ---
function initTabs() {
    const sidebarNav = document.querySelector('.sidebar-nav');
    if (!sidebarNav) return;

    // Clear existing dynamic items
    sidebarNav.innerHTML = '';

    // Rebuild Sidebar for Admin
    const items = [
        { id: 'admin-console', icon: '🚨', label: 'Command Center' },
        { id: 'verification-hub', icon: '🛡️', label: 'Global Moderation' },
        { id: 'settings', icon: '⚙️', label: 'Settings' }
    ];

    items.forEach(item => {
        const a = document.createElement('a');
        a.href = '#';
        a.className = `nav-item ${item.id === 'admin-console' ? 'active' : ''}`;
        a.dataset.tab = item.id;
        a.innerHTML = `<span class="icon">${item.icon}</span> ${item.label}`;
        a.onclick = (e) => {
            e.preventDefault();
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            a.classList.add('active');
            renderTabContent(item.id);
        };
        sidebarNav.appendChild(a);
    });

    // Logout Button (Manual Append to bottom if needed, or rely on Settings)
}

function renderTabContent(tabId) {
    const contentArea = document.getElementById('tab-content');
    if (!contentArea) return;

    if (tabId === 'admin-console') {
        if (window.AdminConsole) {
            contentArea.innerHTML = window.AdminConsole.render();
            // Re-bind listeners if needed
            setTimeout(() => window.AdminConsole.init(), 100);
        } else {
            contentArea.innerHTML = "<p>Loading Admin Console...</p>";
        }
    } else if (tabId === 'verification-hub') {
        // We can reuse the moderation logic from AdminConsole or keep it separate
        // For strictness, let's create a simple wrapper or reuse AdminConsole logic
        contentArea.innerHTML = `
            <div class="tab-pane active fade-in" style="padding: 2rem;">
                <h1 class="font-heading">🛡️ Global <span class="gradient-text">Moderation</span></h1>
                <p style="color: var(--text-dim); margin-bottom: 2rem;">Review pending notes from ALL colleges.</p>
                <div id="admin-global-queue">Loading...</div>
            </div>
        `;
        // We need a renderQueue function. For now, simple placeholder.
        // Ideally, this should be in AdminConsole too.
        if (window.AdminConsole) setTimeout(renderGlobalQueue, 100);
    } else if (tabId === 'settings') {
        contentArea.innerHTML = window.renderSettings ? window.renderSettings() : 'Loading settings...';
    }
}

async function renderGlobalQueue() {
    const container = document.getElementById('admin-global-queue');
    const { db, collection, getDocs } = getFirebase();
    // Fetch all pending
    // Real implementation would be real-time
    container.innerHTML = "<p>Fetching global pending notes...</p>";
    // Placeholder
}

function updateUserProfileUI() {
    const nameEl = document.querySelector('.user-info .name');
    const roleEl = document.querySelector('.user-info .meta');
    if (currentUser) {
        if (nameEl) nameEl.innerText = currentUser.name;
        if (roleEl) roleEl.innerText = "SYSTEM ADMIN";
    }
}

// Global Event Listener
window.addEventListener('auth-ready', (event) => handleAuthReady(event.detail));

// Check pre-auth
if (window.authStatus && window.authStatus.ready) {
    handleAuthReady(window.authStatus.data);
}

// Global Utils needed for Settings
window.showToast = function (message, type = 'success') {
    // Simple alert for now or implement toast
    console.log("Toast:", message);
    const toast = document.createElement('div');
    toast.className = `toast-popup ${type}`;
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => { toast.classList.add('active'); }, 100);
    setTimeout(() => { toast.remove(); }, 3000);
};
