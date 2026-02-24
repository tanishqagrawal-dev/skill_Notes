
// Co-Admin Dashboard Script
// Restricted to College-Specific Data

if (!window.firebaseServices) {
    console.error("Critical: window.firebaseServices is undefined.");
    setTimeout(() => {
        if (!window.firebaseServices) document.body.innerHTML = "<h1 style='color:red; text-align:center; padding:2rem;'>Firebase Connection Failed</h1>";
    }, 2000);
}

function getFirebase() { return window.firebaseServices || {}; }

let currentUser = null;
let pendingNotes = [];
let myCollege = null;

// --- INITIALIZATION ---
function handleAuthReady(data) {
    if (!data) return;
    const { user, currentUser: appCurrentUser } = data;

    if (user && appCurrentUser) {
        console.log("🚀 Co-Admin Session Active:", appCurrentUser.role);
        currentUser = appCurrentUser;

        // STRICT ROLE CHECK
        if (currentUser.role !== 'coadmin' && currentUser.role !== 'superadmin') {
            alert("⛔ Access Denied. Redirecting...");
            window.location.href = 'dashboard.html';
            return;
        }

        // Identify College
        // Support 'college' string or 'assignedCollege' field
        myCollege = currentUser.college;
        if (!myCollege) {
            alert("⚠️ Configuration Error: No college assigned to your account. Contact Super Admin.");
            return;
        }

        updateDashboardUI();
        initCoAdminTabs();

        // Start Real-time Listeners
        initLiveFeed();

        // Default View
        renderTabContent('verification-hub');

        // Settings Init
        if (window.SettingsModule) {
            window.SettingsModule.state.user = { ...currentUser };
            window.SettingsModule.init();
        }
    }
}

function updateDashboardUI() {
    // Update Sidebar / Header info
    const nameEl = document.querySelector('.user-info .name');
    const metaEl = document.querySelector('.user-info .meta');

    if (nameEl) nameEl.innerText = currentUser.name;
    if (metaEl) metaEl.innerText = `${myCollege.toUpperCase()} ADMIN`;

    // Disable irrelevant sidebar items if any exist
}

function initCoAdminTabs() {
    const sidebarNav = document.querySelector('.sidebar-nav');
    if (!sidebarNav) return;
    sidebarNav.innerHTML = ''; // Clean slate

    const items = [
        { id: 'verification-hub', icon: '🛡️', label: 'Moderation Hub' },
        { id: 'my-college-stats', icon: '📊', label: 'My College Stats' },
        { id: 'settings', icon: '⚙️', label: 'Settings' }
    ];

    items.forEach(item => {
        const a = document.createElement('a');
        a.href = '#';
        a.className = `nav-item ${item.id === 'verification-hub' ? 'active' : ''}`;
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
}

function renderTabContent(tabId) {
    const contentArea = document.getElementById('tab-content');
    if (!contentArea) return;

    if (tabId === 'verification-hub') {
        contentArea.innerHTML = `
            <div class="tab-pane active fade-in" style="padding: 2rem;">
                <div style="margin-bottom: 2rem;">
                    <h1 class="font-heading">🛡️ ${myCollege.toUpperCase()} <span class="gradient-text">Moderation</span></h1>
                    <p style="color: var(--text-dim);">Review pending notes submitted to your college.</p>
                </div>
                
                <!-- Queue Container -->
                <div id="coadmin-queue-list" class="grid-1-col" style="display: grid; gap: 1.5rem;">
                    <div style="text-align:center; padding: 2rem; color: var(--text-dim);">
                        Loading pending submissions...
                    </div>
                </div>
            </div>
        `;
        renderQueueList();
    }
    else if (tabId === 'my-college-stats') {
        contentArea.innerHTML = renderCollegeStats();
        // --- REPLACEMENT: Strict Co-Admin Logic (No Users Role Dependency) ---
    }
}

function initStrictMode() {
    const { auth, onAuthStateChanged, db, collection, onSnapshot, query, where } = getFirebase();

    onAuthStateChanged(auth, async u => {
        if (!u) {
            console.log("No user, redirecting...");
            window.location.href = '../index.html'; // Or auth.html
            return;
        }

        console.log("🔍 Verifying CoAdmin Access for:", u.email);

        // 5. COADMIN DASHBOARD FIX - Strict Check
        onSnapshot(collection(db, "colleges"), snap => {
            let found = false;
            snap.forEach(d => {
                const college = d.data();
                if (college.coadmins?.includes(u.uid)) {
                    console.log("✅ Access Granted: CoAdmin for", d.id);
                    myCollege = d.id;
                    currentUser = { ...u, college: myCollege, role: 'coadmin' };
                    found = true;
                    updateDashboardUI();
                    loadCollege(d.id);
                }
            });

            if (!found) {
                console.warn("⛔ Access Denied: Not in any college coadmins list");
                document.body.innerHTML = `
                    <div style="display:flex; justify-content:center; align-items:center; height:100vh; flex-direction:column; background:#0f0c29; color:white; padding: 2rem; text-align: center;">
                        <h1 style="font-size: 4rem;">⛔</h1>
                        <h1 style="margin-bottom: 1rem;">Access Denied</h1>
                        <p style="color: var(--text-dim); margin-bottom: 0.5rem;">You are not assigned as a Co-Admin to any college.</p>
                        <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 8px; margin-bottom: 2rem; border: 1px solid var(--border-glass);">
                            <p style="font-size: 0.8rem; color: var(--text-dim); margin-bottom: 0.25rem;">Your Unique ID (UID):</p>
                            <code style="color: #7B61FF; font-weight: bold; font-family: monospace;">${u.uid}</code>
                        </div>
                        <a href="dashboard.html" style="color:#7B61FF; text-decoration: none; border-bottom: 1px solid #7B61FF;">Return to Member Dashboard</a>
                    </div>
                `;
            }
        });
    });
}

// 6. LOAD NOTES - Strict College Query
function loadCollege(college) {
    console.log("🏫 Loading College Module for:", college);
    if (window.CoAdminModule) {
        window.CoAdminModule.init({ college: college });
        // Force refresh the moderation hub if it's the active tab
        const activeNav = document.querySelector('.nav-item.active');
        if (activeNav && activeNav.dataset.tab === 'verification-hub') {
            renderTabContent('verification-hub');
        }
    }
}

function renderQueueList() {
    const container = document.getElementById('coadmin-queue-list');
    if (container && window.CoAdminModule) {
        container.innerHTML = window.CoAdminModule.renderQueueItems();
    }
}

function renderCollegeStats() {
    return `
        <div class="tab-pane active fade-in" style="padding: 2rem;">
            <h1 class="font-heading">📊 College <span class="gradient-text">Analytics</span></h1>
            <p style="color: var(--text-dim);">Live performance metrics for ${myCollege.toUpperCase()}.</p>
            <div style="margin-top: 2rem; padding: 4rem; text-align: center; background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px dashed var(--border-glass);">
                <p style="color: var(--text-dim);">Detailed college analytics are being synchronized...</p>
            </div>
        </div>
    `;
}

// Start Verification Flow
initStrictMode();

// Global Event Listener
window.addEventListener('auth-ready', (event) => {
    console.log("⚡ CoAdmin Dashboard received auth-ready");
    handleAuthReady(event.detail);
});

if (window.authStatus && window.authStatus.ready) {
    handleAuthReady(window.authStatus.data);
}

function initRealtimeAccessCheck(uid) {
    const services = getFirebase();
    const { db, doc, onSnapshot } = services;
    if (!db) return;

    onSnapshot(doc(db, "users", uid), (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.role !== 'coadmin' && data.role !== 'superadmin' && data.role !== 'admin') {
                console.warn("⛔ Role revoked in realtime. Redirecting...");
                window.location.href = '../index.html';
            }
        }
    });
}

// Kept helper functions for UI rendering (renderQueueList, updateDashboardUI, etc.)
// ... (The previous file content for renderQueueList etc. is still valid if we ensure pendingNotes is populated)
// ... keeping existing helpers below but ensuring initStrictMode is the entry point.

// Global Toast Reuse
window.showToast = function (message) {
    // ... same toast logic
    console.log(message);
    alert(message); // Fallback
};
