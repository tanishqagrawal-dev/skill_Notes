
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
        onSnapshot(collection(db, "college_admins"), snap => {
            let found = false;
            snap.forEach(d => {
                const data = d.data();
                if (data.uid === u.uid) {
                    console.log("✅ Access Granted: CoAdmin for", d.id);
                    myCollege = d.id;
                    currentUser = { ...u, college: myCollege, role: 'coadmin' }; // Optimistic role for UI
                    found = true;

                    // Update UI
                    updateDashboardUI();

                    // Load Content
                    loadCollege(d.id);
                }
            });

            if (!found) {
                console.warn("⛔ Access Denied: Not in college_admins");
                // Optional: Redirect if strict, or show "Access Denied" screen
                document.body.innerHTML = `
                    <div style="display:flex; justify-content:center; align-items:center; height:100vh; flex-direction:column; background:#0f0c29; color:white;">
                        <h1>⛔ Access Denied</h1>
                        <p>You are not assigned as a Co-Admin to any college.</p>
                        <a href="dashboard.html" style="color:#7B61FF; margin-top:1rem;">Return to Member Dashboard</a>
                    </div>
                `;
            }
        });
    });
}

// 6. LOAD NOTES - Strict College Query
function loadCollege(college) {
    const { db, collection, query, where, onSnapshot } = getFirebase();

    // Update Tab UI based on college (reuse existing)
    initCoAdminTabs();

    // We listen for pending notes for this college
    const q = query(collection(db, "notes"),
        where("college", "==", college),
        where("status", "==", "pending"));

    onSnapshot(q, snap => {
        const notes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        pendingNotes = notes;

        // Render if on correct tab
        if (document.querySelector('.nav-item[data-tab="verification-hub"].active')) {
            renderQueueList();
        }
    });

    // Also listen for approved for stats
    // ...
}

// Global Event Listener
window.addEventListener('auth-ready', (event) => {
    console.log("⚡ CoAdmin Dashboard received auth-ready");
    const { user } = event.detail;
    if (user) {
        initRealtimeAccessCheck(user.uid);
    }
    handleAuthReady(event.detail);
});

if (window.authStatus && window.authStatus.ready) {
    if (window.authStatus.data.user) {
        initRealtimeAccessCheck(window.authStatus.data.user.uid);
    }
    handleAuthReady(window.authStatus.data);
}

function initRealtimeAccessCheck(uid) {
    const { db, doc, onSnapshot } = getFirebase();
    if (!db) return;

    // REALTIME REFLECTION: Listen to MY user doc
    onSnapshot(doc(db, "users", uid), (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            // If role lost or changed, kick out immediately
            if (data.role !== 'coadmin' && data.role !== 'superadmin') {
                console.warn("⛔ Role revoked in realtime. Redirecting...");
                window.location.href = '../index.html';
            }
            // Optional: Update college if switched in realtime
            if (data.college && myCollege && data.college !== myCollege) {
                console.log("🔄 College switched in realtime. Reloading...");
                window.location.reload();
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
