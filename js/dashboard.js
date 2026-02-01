import { initRealtimeStats, trackDownload } from './stats.js';
// --- FIREBASE SERVICES ---
// Fallback if firebaseServices failed to load (e.g. CORS or network error)
if (!window.firebaseServices) {
    console.error("Critical: window.firebaseServices is undefined. Check firebase-config.js loading.");
    // Wait a brief moment in case of race condition, then alert
    setTimeout(() => {
        if (!window.firebaseServices) {
            const contentArea = document.getElementById('tab-content');
            if (contentArea) {
                contentArea.innerHTML = `
                    <div style="text-align:center; padding: 4rem; color: #ff4757;">
                        <h1>Connection Error</h1>
                        <p>Could not load Firebase Services. If you are opening this file locally, please use a local server (e.g. Live Server) instead of file://.</p>
                        <button onclick="location.reload()" class="btn btn-primary" style="margin-top:1rem;">Retry</button>
                    </div>
                 `;
            }
        }
    }, 2000);
}

// Helper to get Firebase services safely
function getFirebase() {
    return window.firebaseServices || {};
}

// --- MOCK DATA ---
const MockUsers = [
    { id: 'u_user', name: 'Rohan Sharma', email: 'rohan@example.com', role: 'user', college: 'medicaps', branch: 'CSE', year: '3rd Year' },
    { id: 'u_coadmin', name: 'Prof. Jain', email: 'jain@medicaps.ac.in', role: 'coadmin', college: 'medicaps', branch: 'CSE', year: 'Faculty' },
    { id: 'u_admin', name: 'Dean Admin', email: 'admin@medicaps.ac.in', role: 'admin', college: 'medicaps', branch: 'All', year: 'Staff' }
];

// --- RBAC & USER SYSTEM ---
const Roles = {
    SUPER_ADMIN: 'superadmin',
    ADMIN: 'admin',
    COLLEGE_ADMIN: 'coadmin',
    USER: 'user'
};

// --- GLOBAL STATE ---
const GlobalData = {
    colleges: [
        { id: 'medicaps', name: 'Medicaps University', logo: '../assets/logos/medicaps.png' },
        { id: 'lpu', name: 'LPU University', logo: '../assets/logos/lpu.png' },
        { id: 'ips', name: 'IPS Academy', logo: '../assets/logos/ips.png' },
        { id: 'cdgi', name: 'CDGI University', logo: '../assets/logos/cdgi.png' },
        { id: 'iitd', name: 'IIT Delhi', logo: '../assets/logos/iitd.png' }
    ],
    branches: [
        { id: 'cse', name: 'Computer Science', icon: '💻' },
        { id: 'ece', name: 'Electronics', icon: '⚡' },
        { id: 'ee', name: 'Electrical Engineering', icon: '🔌' },
        { id: 'me', name: 'Mechanical', icon: '⚙️' },
        { id: 'aiml', name: 'AI & Machine Learning', icon: '🧠' },
        { id: 'vlsi', name: 'VLSI Design', icon: '🔌' },
        { id: 'finance', name: 'Finance', icon: '💰' },
        { id: 'marketing', name: 'Marketing', icon: '📣' }
    ],
    streams: [
        { id: 'btech', name: 'B.Tech', icon: '🎓', branches: ['cse', 'ece', 'ee', 'me'] },
        { id: 'mtech', name: 'M.Tech', icon: '🔬', branches: ['cse', 'vlsi'] },
        { id: 'mba', name: 'MBA', icon: '📊', branches: ['finance', 'marketing'] }
    ],
    years: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
    subjects: {
        'cse-Semester 1': [
            { id: 'math-1', name: 'Engineering Mathematics I', icon: '📐', code: 'MA101', description: 'Calculus, Linear Algebra and differential equations.' },
            { id: 'physics', name: 'Engineering Physics', icon: '⚛️', code: 'PH101', description: 'Quantum physics, optics and semiconductor theory.' },
            { id: 'pps', name: 'Programming for Problem Solving', icon: '💻', code: 'CS101', description: 'Introduction to algorithmic logic and C programming.' },
            { id: 'bee', name: 'Basic Electrical Engineering', icon: '🔌', code: 'EE101', description: 'AC/DC circuits, transformers and machines.' },
            { id: 'comm-skills', name: 'Communication Skills', icon: '🗣️', code: 'HS101', description: 'Professional writing and verbal communication.' }
        ],
        'cse-Semester 2': [
            { id: 'chemistry', name: 'Engineering Chemistry', icon: '🧪', code: 'EN3BS14', description: 'Water treatment, thermodynamics and material science.' },
            { id: 'math-2', name: 'Engineering Mathematics-II', icon: '📉', code: 'EN3BS12', description: 'Advanced calculus, Fourier series and complex variables.' },
            { id: 'graphics', name: 'Engineering Graphics', icon: '📐', code: 'EN3ES26', description: 'Technical drawing, projection and CAD basics.' },
            { id: 'electronics', name: 'Basic Electronics Engg.', icon: '📟', code: 'EN3ES16', description: 'Semiconductor devices and circuits.' },
            { id: 'mech', name: 'Basic Mechanical Engg.', icon: '⚙️', code: 'EN3ES18', description: 'Thermodynamics and IC engines.' }
        ],
        'cse-Semester 3': [
            { id: 'discrete-math', name: 'Discrete Mathematics', icon: '🧩', code: 'CS301', description: 'Logic, sets, graph theory and combinatorics.' },
            { id: 'digital-elec', name: 'Digital Electronics', icon: '💡', code: 'CS302', description: 'Boolean algebra and combinational circuits.' },
            { id: 'java-oop', name: 'Object Oriented Programming (Java)', icon: '☕', code: 'CS303', description: 'Core principles: Encapsulation, Inheritance, Polymorphism.' },
            { id: 'co', name: 'Computer Organization', icon: '🖥️', code: 'CS304', description: 'ALU, control unit and memory hierarchy.' },
            { id: 'dsa', name: 'Data Structures', icon: '🌳', code: 'CS305', description: 'Arrays, stacks, queues, trees and sorting.' }
        ],
        'cse-Semester 4': [
            { id: 'adv-java', name: 'Advanced Java Programming', icon: '☕', code: 'CS3CO37', description: 'Servlets, JSP, JDBC and enterprise application components.' },
            { id: 'dbms', name: 'DBMS', icon: '🗄️', code: 'CS3CO39', description: 'Relational databases, SQL, normalization and transaction management.' },
            { id: 'micro', name: 'Microprocessor & Interfacing', icon: '📟', code: 'CS3CO35', description: '8085/8086 architecture, assembly language and peripheral interfacing.' },
            { id: 'os', name: 'Operating Systems', icon: '💾', code: 'CS3CO47', description: 'Process management, synchronization and file systems.' },
            { id: 'toc', name: 'Theory of Computation', icon: '🧠', code: 'CS3CO46', description: 'Finite automata, context-free grammars and Turing machines.' },
            { id: 'elective-1', name: 'Elective-1', icon: '🏷️', code: 'CS3ELXX', description: 'Specialized elective track course for Computer Science.' }
        ]
    }
};
window.GlobalData = GlobalData;

let NotesDB = [];
let unsubscribeNotes = null;
let currentUser = null;
let selState = { college: null, branch: null, year: null, subject: null };

// --- CORE SYSTEM INITIALIZATION ---

function handleAuthReady(data) {
    if (!data) return;
    try {
        const { user, currentUser: appCurrentUser } = data;
        if (user && appCurrentUser) {
            console.log("🚀 Dashboard Session Active:", (appCurrentUser.email || "Guest"));

            currentUser = appCurrentUser;
            window.currentUser = currentUser;

            // UI & DB
            updateUserProfileUI();
            initRealTimeDB();
            initTabs();

            // Settings
            if (window.SettingsModule) {
                window.SettingsModule.state.user = { ...currentUser };
                window.SettingsModule.init();
            }

            // Stats
            if (window.statServices && window.statServices.initRealtimeStats) {
                window.statServices.initRealtimeStats();
            }

            // Telemetry
            if (typeof trackStudent === 'function') trackStudent();

            // Initial View - Specialized Routing
            if (currentUser.role === 'superadmin') {
                renderTabContent('superadmin-panel');
                // Update Sidebar Active State
                document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
                const adminTab = document.querySelector('.nav-item[data-tab="superadmin-panel"]');
                if (adminTab) adminTab.classList.add('active');
            } else if (currentUser.role === 'coadmin' || currentUser.role === 'admin') {
                renderTabContent('verification-hub');
                document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
                const modTab = document.querySelector('.nav-item[data-tab="verification-hub"]');
                if (modTab) modTab.classList.add('active');
            } else {
                renderTabContent('overview');
            }
        } else {
            console.warn("🔓 Dashboard: No user data in auth-ready event.");
        }
    } catch (e) {
        console.error("CRITICAL Dashboard Init Error:", e);
        const contentArea = document.getElementById('tab-content');
        if (contentArea) {
            contentArea.innerHTML = `
                <div style="padding: 4rem; text-align: center; color: #ff4757;">
                    <h2>🚧 Initialization Failed</h2>
                    <p>${e.message}</p>
                    <button onclick="location.reload()" class="btn btn-primary" style="margin-top: 1rem;">Reload Dashboard</button>
                </div>
            `;
        }
    }
}

async function trackStudent() {
    const { db, doc, setDoc, serverTimestamp } = getFirebase();
    if (!db || !currentUser || currentUser.isGuest) return;

    try {
        const userRef = doc(db, "users", currentUser.id);
        await setDoc(userRef, {
            name: currentUser.name,
            email: currentUser.email,
            lastSeen: serverTimestamp(),
            role: currentUser.role,
            college: currentUser.college
        }, { merge: true });
        console.log("👤 User heart-beat updated.");
    } catch (e) {
        console.warn("Telemetry error:", e);
    }
}

// Initial Listener
window.addEventListener('auth-ready', (event) => {
    console.log("📥 Received auth-ready event");
    handleAuthReady(event.detail);
});

// Check if auth was already dispatched before dashboard.js loaded
if (window.authStatus && window.authStatus.ready) {
    console.log("⚡ Auth already ready, triggering handleAuthReady immediately");
    handleAuthReady(window.authStatus.data);
}


// --- RE-INIT SERVICES ON DEMAND ---
function calculateSmartScore(note) {
    const viewsWeight = 0.25;
    const downloadsWeight = 0.5;
    const likesWeight = 0.25;
    return ((note.totalViews || 0) * viewsWeight) + ((note.totalSaves || 0) * downloadsWeight) + ((note.likes || 0) * likesWeight);
}

// Google Drive Link Converter
function convertDriveLink(link, format = 'preview') {
    if (!link || !link.includes('drive.google.com')) return link;

    // Extract ID using regex
    const fileIdMatch = link.match(/\/file\/d\/([^\/]+)/) || link.match(/id=([^\&]+)/);
    const folderIdMatch = link.match(/\/folders\/([^\/?]+)/);

    if (folderIdMatch) return link; // Folders stay as is for now
    if (!fileIdMatch) return link;

    const fileId = fileIdMatch[1];
    if (format === 'preview') return `https://drive.google.com/file/d/${fileId}/preview`;
    if (format === 'download') return `https://drive.google.com/uc?export=download&id=${fileId}`;
    return link;
}

function trackAnalytics(eventType, data) {
    const { db, addDoc, collection } = getFirebase();
    console.log(`[Analytics] ${eventType}:`, data);
    if (typeof gtag === 'function') {
        gtag('event', eventType, { 'event_category': 'Explorer', 'event_label': data.id || data.name });
    }
    if (currentUser && db) {
        addDoc(collection(db, "analytics_logs"), {
            eventType,
            data,
            userId: currentUser.id,
            timestamp: new Date().toISOString()
        }).catch(e => console.error("Analytics Error:", e));
    }
}

window.showToast = function (message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast-popup ${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">${type === 'success' ? '✅' : '❌'}</span>
            <span class="toast-message">${message}</span>
        </div>
    `;
    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => toast.classList.add('active'), 100);

    // Remove after 3s
    setTimeout(() => {
        toast.classList.remove('active');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
};

window.updateNoteStat = async function (noteId, type) {
    const { db, doc, updateDoc, increment } = getFirebase();
    // Immediate UI Optimistic Update
    const note = NotesDB.find(n => n.id === noteId);
    if (note) {
        if (type === 'view') note.views++;
        if (type === 'download') note.downloads++;
        if (type === 'like') {
            note.likes++;
            alert("💖 Added to your liked resources!");
        }
    }

    if (!db) return;
    try {
        const noteRef = doc(db, "notes", noteId);
        await updateDoc(noteRef, {
            [type + 's']: increment(1)
        });
        if (type === 'download') trackDownload();
        trackAnalytics(`note_${type}`, { id: noteId, title: note ? note.title : 'Unknown' });
    } catch (error) {
        console.error("Error updating stats:", error);
    }
}

window.toggleNoteDislike = async function (noteId) {
    const { db, doc, updateDoc, increment } = getFirebase();
    const note = NotesDB.find(n => n.id === noteId);
    if (note) note.dislikes = (note.dislikes || 0) + 1; // Optimistic

    if (!db) return;
    try {
        const noteRef = doc(db, "notes", noteId);
        await updateDoc(noteRef, {
            dislikes: increment(1)
        });
    } catch (e) {
        console.error("Dislike error:", e);
    }
}

window.toggleNoteBookmark = function (noteId) {
    alert("📑 Note added to your bookmarks!");
    // In a real app, this would save to user's personal bookmark collection in Firestore
}

// --- CORE DASHBOARD LOGIC ---
// Handled by consolidated listener at the bottom of the file


document.addEventListener('DOMContentLoaded', () => {
    // Check for saved theme
    if (localStorage.getItem('theme') === 'light') {
        document.body.classList.add('light-mode');
    }

    // Global listener for + Upload Note button in sidebar/header
    const uploadBtns = document.querySelectorAll('.upload-btn');
    uploadBtns.forEach(btn => {
        btn.onclick = () => openUploadModal();
    });

    // Global Search Engine
    // --- GLOBAL SEARCH IMPLEMENTATION ---
    const globalSearchInput = document.querySelector('.search-bar input');
    const searchIcon = document.querySelector('.search-bar .search-icon');

    // Function to perform search
    function performGlobalSearch(query) {
        if (!query.trim()) return;

        // 1. Switch to Notes Hub
        const notesTab = document.querySelector('.nav-item[data-tab="notes"]');
        if (notesTab) notesTab.click();

        // 2. Wait for tab to render then search
        setTimeout(() => {
            const searchBox = document.getElementById('search-notes');
            if (searchBox) {
                searchBox.value = query;
                searchBox.focus();
                // Trigger input event to run the filter logic
                searchBox.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }, 100);
    }

    if (globalSearchInput) {
        // Search on Enter key
        globalSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performGlobalSearch(e.target.value);
            }
        });

        // Search on Icon Click
        if (searchIcon) {
            searchIcon.style.cursor = 'pointer';
            searchIcon.onclick = () => performGlobalSearch(globalSearchInput.value);
        }
    }
    // --- DEEP LINKING SUPPORT ---
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam) {
        const targetTab = document.querySelector(`.nav-item[data-tab="${tabParam}"]`);
        if (targetTab) {
            // Need to wait for initTabs to bind click handlers? 
            // Better to just set it active logic manually or trigger click after initTabs
            // But initTabs is called later in auth flow.
            // We'll handle this inside onAuthStateChanged or similar triggering mechanism.
            // However, since initTabs binds clicks, we can just store the pending tab.
            window.pendingTab = tabParam;
        }
    }
}); // End DOMContentLoaded

// Global Theme Toggler
window.toggleTheme = function (isLight) {
    if (isLight) {
        document.body.classList.add('light-mode');
        localStorage.setItem('theme', 'light');
    } else {
        document.body.classList.remove('light-mode');
        localStorage.setItem('theme', 'dark');
    }
};


window.openUploadModal = async function () {
    if (!currentUser) {
        alert("Please login first.");
        return;
    }

    // Check permission (Admin+)
    const isUploader = ['admin', 'superadmin', 'coadmin'].includes(currentUser.role);
    if (!isUploader) {
        alert("🔒 Only contributors and admins can upload directly in this version.");
        return;
    }

    // Creating modal overlay if it doesn't exist
    let modal = document.getElementById('dashboard-upload-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'dashboard-upload-modal';
        modal.className = 'modal'; // Reuse existing modal class
        modal.innerHTML = `
            <div class="modal-content">
                <button class="close-modal" onclick="closeDashboardUploadModal()">&times;</button>
                <div class="modal-header">
                    <h2>Upload <span class="gradient-text">New Note</span></h2>
                    <p style="color: var(--text-dim); font-size: 0.9rem;">Share your resource with the community.</p>
                </div>
                <form id="dash-upload-form">
                    <div class="form-group">
                        <label>Note Title</label>
                        <input type="text" id="dash-note-title" class="form-input" placeholder="e.g. OS Unit 3 Process Sync" required>
                    </div>
                    <div class="form-group">
                        <label>Resource Type</label>
                        <select id="dash-note-type" class="form-input">
                            <option value="notes">Notes</option>
                            <option value="pyq">PYQs</option>
                            <option value="formula">Formula Sheet</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Google Drive Link</label>
                        <input type="url" id="dash-note-link" class="form-input" placeholder="https://drive.google.com/..." required>
                    </div>
                    <div class="modal-footer">
                        <button type="submit" class="btn btn-primary" id="dash-submit-btn" style="width:100%;">🚀 Upload Note</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('dash-upload-form').onsubmit = handleDashboardNoteSubmit;
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
};

window.closeDashboardUploadModal = function () {
    const modal = document.getElementById('dashboard-upload-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
};

async function handleDashboardNoteSubmit(e) {
    e.preventDefault();
    const { db, collection, addDoc } = getFirebase();
    if (!db) return;

    const btn = document.getElementById('dash-submit-btn');
    const title = document.getElementById('dash-note-title').value;
    const type = document.getElementById('dash-note-type').value;
    const link = document.getElementById('dash-note-link').value;

    btn.disabled = true;
    btn.innerText = "Uploading...";

    const isModerator = ['admin', 'superadmin', 'coadmin'].includes(currentUser.role);
    const targetCollegeId = selState.college ? selState.college.id : (currentUser.collegeId || currentUser.college || 'medicaps');

    const newNote = {
        title: title,
        collegeId: targetCollegeId,
        branchId: selState.branch ? selState.branch.id : 'cse',
        semester: selState.semester || 'Semester 3',
        year: selState.year || '2nd Year',
        subject: selState.subject ? selState.subject.id : 'os',
        type: type,
        views: 0,
        saves: 0,
        uploader: currentUser.name,
        uploaderUid: currentUser.id,
        uploaderEmail: currentUser.email,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        driveLink: link,
        status: isModerator ? 'approved' : 'pending',
        created_at: new Date().toISOString()
    };

    try {
        const targetColl = isModerator ? "notes_approved" : "notes_pending";
        await addDoc(collection(db, targetColl), newNote);
        showToast(isModerator ? "🚀 Note published successfully!" : "📩 Submitted for review!");
        closeDashboardUploadModal();
        document.getElementById('dash-upload-form').reset();
    } catch (err) {
        console.error("Upload error:", err);
        showToast("Failed to upload. Check connection.", "error");
    } finally {
        btn.disabled = false;
        btn.innerText = "🚀 Upload Note";
    }
}

// --- TAB LOGIC ---
function initTabs() {
    const sidebarNav = document.querySelector('.sidebar-nav');
    if (!sidebarNav || !currentUser) return;

    // Reset Sidebar to Base State (Overview, Notes, Planner, AI Tools, Leaderboard)
    // We assume HTML has the base items. We just append.

    // Clear previously injected dynamic items
    document.querySelectorAll('.dynamic-node').forEach(n => n.remove());

    const settingsNode = document.querySelector('[data-tab="settings"]');

    // 1. My Uploads (For Everyone)
    const myUploads = createNavItem('my-uploads', '📤', 'My Uploads');
    sidebarNav.insertBefore(myUploads, settingsNode);

    // 2. Co-Admin Tools
    if (currentUser.role === 'coadmin' || currentUser.role === 'superadmin') {
        const modHub = createNavItem('coadmin-hub', '🛡️', 'Moderation Hub');
        sidebarNav.insertBefore(modHub, settingsNode);

        // Only pure coadmins get "My College Stats" explicitly here, admin sees all
        if (currentUser.role === 'coadmin') {
            const statsHub = createNavItem('college-stats', '📊', 'My College Stats');
            sidebarNav.insertBefore(statsHub, settingsNode);
        }
    }

    // 3. Admin Tools
    if (currentUser.role === 'admin' || currentUser.role === 'superadmin') {
        const adminConsole = createNavItem('admin-console', '🚨', 'Command Center');
        sidebarNav.insertBefore(adminConsole, settingsNode);
    }

    // Re-bind listeners
    document.querySelectorAll('.nav-item').forEach(item => {
        // Remove old listeners to prevent duplicates? onclick overwrites so it's fine.
        item.onclick = (e) => {
            e.preventDefault();
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            renderTabContent(item.dataset.tab);
        };
    });
}

function createNavItem(id, icon, label) {
    const a = document.createElement('a');
    a.href = "#";
    a.className = "nav-item dynamic-node";
    a.dataset.tab = id;
    a.innerHTML = `<span class="icon">${icon}</span> ${label}`;
    return a;
}

function updateUserProfileUI() {
    const avatar = document.querySelector('.user-profile-mini .avatar');
    const name = document.querySelector('.user-profile-mini .name');
    const meta = document.querySelector('.user-profile-mini .meta');

    if (!currentUser) return;

    if (avatar) {
        if (currentUser.photo) {
            avatar.innerHTML = `<img src="${currentUser.photo}" style="width:100%; height:100%; object-fit: cover; border-radius:50%;">`;
            avatar.style.background = 'transparent';
        } else {
            avatar.innerText = (currentUser.name && currentUser.name.charAt(0)) || 'U';
        }
    }
    if (name) name.innerText = currentUser.name || currentUser.email.split('@')[0];

    // Update meta text with role
    if (meta) {
        meta.style.display = 'block';
        meta.innerText = currentUser.role ? currentUser.role.toUpperCase() : 'USER';
    }

    // Ensure logout button is NOT added here (it's in Settings now)
    const existingLogout = document.getElementById('logout-btn');
    if (existingLogout) existingLogout.remove();
}

window.switchRole = function (userId, role, name) {
    const user = MockUsers.find(u => u.id === userId) || { id: userId, role, name, email: 'demo@example.com', college: 'medicaps' };

    console.log(`🛠️ Switching to role: ${role} (${name})`);

    // Simulate auth-ready event data structure
    handleAuthReady({
        user: { uid: user.id, email: user.email },
        currentUser: { ...user, role, name } // Override with passed values for demo
    });

    // Switch to Overview
    const overviewTab = document.querySelector('.nav-item[data-tab="overview"]');
    if (overviewTab) {
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        overviewTab.classList.add('active');
    }
};

function renderTabContent(tabId) {
    const contentArea = document.getElementById('tab-content');
    if (!contentArea) return;

    try {
        if (tabId === 'overview') {
            contentArea.innerHTML = renderOverview();
        } else if (tabId === 'notes') {
            selState = { college: null, branch: null, year: null, subject: null };
            contentArea.innerHTML = renderNotesHub();
            renderCollegeStep();
        } else if (tabId === 'planner') {
            contentArea.innerHTML = renderPlanner();
        } else if (tabId === 'ai-tools') {
            contentArea.innerHTML = renderAITools();
            setTimeout(window.checkServer, 100);
        } else if (tabId === 'leaderboard') {
            contentArea.innerHTML = renderLeaderboard();
            setTimeout(initLeaderboardListeners, 100);
        } else if (tabId === 'verification-hub') {
            contentArea.innerHTML = `<div class="tab-pane active fade-in" style="padding: 2rem;">
                <h1 class="font-heading">🛡️ Moderation <span class="gradient-text">Queue</span></h1>
                <p style="color: var(--text-dim); margin-bottom: 2rem;">Approve or reject pending note submissions.</p>
                <div id="admin-queue" class="grid-1-col" style="display: grid; gap: 1rem;"></div>
            </div>`;
            setTimeout(renderAdminModQueue, 100);
        } else if (tabId === 'superadmin-panel') {
            if (window.AdminConsole) {
                contentArea.innerHTML = window.AdminConsole.render();
            } else {
                contentArea.innerHTML = "<p>Admin Console module loading...</p>";
            }
        } else if (tabId === 'my-uploads') {
            contentArea.innerHTML = `<div class="tab-pane active fade-in" style="padding: 2rem;">
                <h1 class="font-heading">📤 My <span class="gradient-text">Uploads</span></h1>
                <p style="color: var(--text-dim); margin-bottom: 2rem;">Track the status of your contributed materials.</p>
                <div id="my-uploads-grid" class="notes-grid-pro" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1.5rem;"></div>
            </div>`;
            setTimeout(renderMyUploads, 100);
        }
        // --- ROLE SPECIFIC ---
        else if (tabId === 'admin-console') {
            if (window.AdminConsole) contentArea.innerHTML = window.AdminConsole.render();
            else contentArea.innerHTML = "<p>Loading Admin Console...</p>";
        }
        else if (tabId === 'coadmin-hub') {
            if (window.CoAdminModule) contentArea.innerHTML = window.CoAdminModule.render();
            else contentArea.innerHTML = "<p>Loading Moderation Hub...</p>";
        }
        else if (tabId === 'college-stats') {
            contentArea.innerHTML = `<div class="tab-pane active fade-in"><h1 class="font-heading">College Stats</h1><p>Analytics module coming soon.</p></div>`;
        }
        // --- SETTINGS ---
        else if (tabId === 'settings') {
            contentArea.innerHTML = window.renderSettings ? window.renderSettings() : 'Loading settings...';
        } else {
            contentArea.innerHTML = `<div class="tab-pane active"><h1 class="font-heading">${tabId}</h1><p>Module coming soon...</p></div>`;
        }
    } catch (err) {
        console.error("Tab Render Error:", err);
        contentArea.innerHTML = `
            <div style="padding: 4rem; text-align: center;">
                <h2 style="color: #ff4757;">⚠️ Rendering Error</h2>
                <p style="color: var(--text-dim); margin-top: 1rem;">Something went wrong while loading this module.</p>
                <pre style="background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 8px; margin-top: 1rem; color: #ff4757; font-size: 0.8rem;">${err.message}</pre>
                <button onclick="location.reload()" class="btn btn-primary" style="margin-top: 2rem;">Reload Page</button>
            </div>
        `;
    }
}


function renderPlanner() {
    // 1. Get Subjects
    const mySubjects = (GlobalData.subjects['cse-Semester 3'] || GlobalData.subjects['cse-Semester 1']).map(s => s.name);

    return `
        <div class="tab-pane active fade-in" style="padding: 2rem;">
            <div style="margin-bottom: 2rem;">
                <h1 class="font-heading">📅 AI Exam <span class="gradient-text">Strategist</span></h1>
                <p style="color: var(--text-dim);">Let Gemini create your perfect daily schedule based on exam proximity and weak topics.</p>
            </div>

            <div class="grid-2-col" style="display: grid; grid-template-columns: 350px 1fr; gap: 2rem; align-items: start;">
                
                <!-- CONFIG PANEL -->
                <div class="glass-card" style="padding: 2rem;">
                    <h3 class="font-heading" style="margin-bottom: 1.5rem;">⚙️ Plan Configuration</h3>
                    
                    <div class="form-group" style="margin-bottom: 1rem;">
                        <label>Target Exam Date</label>
                        <input type="date" id="p-exam-date" class="input-field" style="width: 100%; margin-top:0.5rem; color-scheme: dark;">
                    </div>

                    <div class="form-group" style="margin-bottom: 1rem;">
                        <label>Daily Study Limit: <span id="p-hours-val" style="color:var(--primary);">4 Hours</span></label>
                        <input type="range" id="p-hours" min="1" max="12" value="4" step="0.5" style="width: 100%; margin-top:0.5rem;" oninput="document.getElementById('p-hours-val').innerText = this.value + ' Hours'">
                    </div>

                    <div class="form-group" style="margin-bottom: 1.5rem;">
                        <label>Weak Topics (Select multiple)</label>
                        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem;">
                            ${mySubjects.map(sub => `
                                <div class="chip" onclick="this.classList.toggle('active')" data-val="${sub}" style="padding: 0.5rem 1rem; border: 1px solid var(--border-glass); border-radius: 20px; cursor: pointer; font-size: 0.8rem; transition: all 0.2s;">
                                    ${sub}
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <button class="btn btn-primary" onclick="handleGeneratePlan()" id="btn-gen-plan" style="width: 100%;">
                        ✨ Generate Daily Schedule
                    </button>
                    <p style="text-align:center; font-size: 0.75rem; color: var(--text-dim); margin-top: 1rem;">Powered by Gemini Pro</p>
                </div>

                <!-- TIMELINE VIEW -->
                <div class="glass-card" style="padding: 2rem; min-height: 500px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                        <h3 class="font-heading">📝 Your Daily Plan</h3>
                        <div style="font-size: 0.8rem; color: var(--text-dim);" id="plan-meta">No plan generated yet.</div>
                    </div>

                    <div id="plan-timeline" class="timeline-wrapper">
                        <!-- Empty State -->
                        <div style="text-align: center; padding: 4rem; opacity: 0.5;">
                            <div style="font-size: 3rem; margin-bottom: 1rem;">🗓️</div>
                            <p>Configure your preferences and click Generate.</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    `;
}

window.handleGeneratePlan = async function () {
    const btn = document.getElementById('btn-gen-plan');
    const container = document.getElementById('plan-timeline');

    // Gather Data
    const examDate = document.getElementById('p-exam-date').value;
    const hours = document.getElementById('p-hours').value;
    const weakTopics = Array.from(document.querySelectorAll('.chip.active')).map(el => el.dataset.val);
    const subjects = (GlobalData.subjects['cse-Semester 3'] || GlobalData.subjects['cse-Semester 1']).map(s => s.name);

    if (!examDate) {
        alert("⚠️ Please select an upcoming exam date.");
        return;
    }

    // UI Loading
    btn.disabled = true;
    btn.innerHTML = `<span class="spin-loader"></span> Strategizing...`;
    container.innerHTML = `
        <div style="text-align: center; padding: 4rem;">
            <div class="loader-pro" style="margin: 0 auto 1rem;"></div>
            <p>Gemini is analyzing your weak areas...</p>
        </div>
    `;

    try {
        const plan = await aiClient.generateStudyPlan({
            subjects,
            examDate,
            weakTopics,
            hoursAvailable: hours
        });

        renderTimeline(plan);
        document.getElementById('plan-meta').innerText = `Target: ${new Date(examDate).toLocaleDateString()}`;

    } catch (e) {
        container.innerHTML = `
            <div style="color: #ff4757; text-align: center;">
                <h3>⚠️ Planning Failed</h3>
                <p>${e.message}</p>
            </div>
        `;
    } finally {
        btn.disabled = false;
        btn.innerHTML = `✨ Generate Daily Schedule`;
    }
};

function renderTimeline(plan) {
    const container = document.getElementById('plan-timeline');
    if (!plan || plan.length === 0) {
        container.innerHTML = "<p>No tasks generated.</p>";
        return;
    }

    let html = '<div class="timeline">';
    plan.forEach((task, idx) => {
        const icons = { 'Learn': '📖', 'Practice': '📝', 'Revise': '⚡' };
        const color = { 'Learn': '#3498db', 'Practice': '#e67e22', 'Revise': '#2ecc71' };

        html += `
            <div class="timeline-item glass-card" style="margin-bottom: 1.5rem; border-left: 4px solid ${color[task.type] || '#7B61FF'}; padding: 1.5rem; position: relative; animation: slideIn 0.3s ease forwards; animation-delay: ${idx * 0.1}s; opacity: 0;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <div style="font-size: 0.8rem; color: var(--text-dim); font-family: var(--font-mono); margin-bottom: 0.3rem;">
                            ${task.time}
                        </div>
                        <h4 style="font-size: 1.1rem; margin-bottom: 0.5rem;">
                            ${icons[task.type] || '📌'} ${task.activity}
                        </h4>
                        <div style="background: rgba(255,255,255,0.05); display: inline-block; padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.8rem; color: var(--text-muted);">
                            ${task.topic}
                        </div>
                    </div>
                    
                    <div class="tooltip-wrapper" style="position: relative; cursor: help;">
                        <span style="font-size: 1.2rem; opacity: 0.5;">ℹ️</span>
                        <div class="tooltip-content glass-card" style="position: absolute; right: 0; top: 30px; width: 200px; padding: 1rem; font-size: 0.8rem; display: none; z-index: 10;">
                            <strong>Why AI chose this:</strong><br/>
                            ${task.reasoning}
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    html += '</div>';

    // Tooltip Logic
    container.innerHTML = html;
    container.querySelectorAll('.tooltip-wrapper').forEach(el => {
        el.onmouseenter = () => el.querySelector('.tooltip-content').style.display = 'block';
        el.onmouseleave = () => el.querySelector('.tooltip-content').style.display = 'none';
    });
}


function renderAITools() {
    // Flatten subjects for the dropdown
    const allSubjects = [];
    Object.values(GlobalData.subjects).forEach(list => {
        list.forEach(sub => {
            if (!allSubjects.find(s => s.name === sub.name)) {
                allSubjects.push(sub.name);
            }
        });
    });

    return `
        <div class="tab-pane active fade-in" style="padding: 2rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem;">
                <div>
                    <h1 class="font-heading">🤖 AI <span class="gradient-text">Model Paper Generator</span></h1>
                    <p style="color: var(--text-dim);">Upload your PYQs (PDF/Image) and let Gemini generate a model paper.</p>
                </div>
                <div class="status-badge" id="server-status-badge" style="font-size: 0.8rem; padding: 0.5rem 1rem; border-radius: 20px; background: rgba(255,255,255,0.05);">
                    Checking Server...
                </div>
            </div>

            <div class="grid-2-col" style="display: grid; grid-template-columns: 350px 1fr; gap: 2rem; align-items: start;">
                <!-- Left: Configuration Form -->
                <div class="glass-card" style="padding: 2rem;">
                    <h3 class="font-heading" style="margin-bottom: 1.5rem;">⚙️ Paper Config</h3>
                    
                    <div class="form-group" style="margin-bottom: 1rem;">
                        <label style="display:block; margin-bottom: 0.5rem; color: var(--text-dim); font-size: 0.9rem;">Subject Name</label>
                        <select id="ai-subject" class="input-field" style="width: 100%; padding: 0.8rem; background: rgba(0,0,0,0.2); border: 1px solid var(--border-glass); border-radius: 8px; color: white;">
                             <option value="" disabled selected>Select Subject</option>
                             ${allSubjects.map(s => `<option value="${s}">${s}</option>`).join('')}
                             <option value="Other">Other (Custom)</option>
                        </select>
                    </div>

                    <div class="form-group" style="margin-bottom: 1rem;">
                        <label style="display:block; margin-bottom: 0.5rem; color: var(--text-dim); font-size: 0.9rem;">University</label>
                         <select id="ai-uni" class="input-field" style="width: 100%; padding: 0.8rem; background: rgba(0,0,0,0.2); border: 1px solid var(--border-glass); border-radius: 8px; color: white;">
                             ${GlobalData.colleges.map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
                        </select>
                    </div>

                    <div class="form-group" style="margin-bottom: 1rem;">
                        <label style="display:block; margin-bottom: 0.5rem; color: var(--text-dim); font-size: 0.9rem;">Exam Type</label>
                        <select id="ai-exam" style="width: 100%; padding: 0.8rem; background: rgba(0,0,0,0.2); border: 1px solid var(--border-glass); border-radius: 8px; color: white;">
                            <option value="End Semester">End Semester (Final)</option>
                            <option value="Mid Semester">Mid Semester (MST)</option>
                        </select>
                    </div>

                    <div class="form-group" style="margin-bottom: 1.5rem;">
                        <label style="display:block; margin-bottom: 0.5rem; color: var(--text-dim); font-size: 0.9rem;">Upload PYQ (PDF/Image)</label>
                        
                        <!-- Upload Box -->
                        <div class="upload-zone" onclick="document.getElementById('ai-file-input').click()" style="border: 2px dashed var(--border-glass); border-radius: 12px; padding: 2rem; text-align: center; cursor: pointer; transition: all 0.3s ease;">
                            <div style="font-size: 2rem; margin-bottom: 0.5rem;">📂</div>
                            <p style="font-size: 0.9rem; color: var(--text-dim);">Click to upload file</p>
                            <p id="file-name-display" style="font-size: 0.8rem; color: var(--primary); margin-top: 0.5rem; font-weight: 500;"></p>
                        </div>
                        <input type="file" id="ai-file-input" accept=".pdf,.png,.jpg,.jpeg,.txt" style="display: none;" onchange="handleAIFileUpload(this)">
                        
                        <!-- Hidden text area for fallback/content passing -->
                        <textarea id="ai-pyqs" style="display:none;"></textarea>
                    </div>

                    <button class="btn btn-primary" onclick="generatePaper()" id="btn-generate" style="width: 100%; justify-content: center;">
                        ✨ Generate Model Paper
                    </button>
                    <p style="font-size: 0.7rem; color: var(--text-dim); margin-top: 1rem; text-align: center;">
                        AI will analyze the uploaded file structure.
                    </p>
                </div>

                <!-- Right: Output Preview -->
                <div class="glass-card" style="padding: 2rem; min-height: 600px; display: flex; flex-direction: column;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem; border-bottom: 1px solid var(--border-glass); padding-bottom: 1rem;">
                        <h3 class="font-heading">📄 Generated Paper</h3>
                        <div class="actions">
                            <button class="btn btn-sm btn-ghost" onclick="copyPaper()" title="Copy to Clipboard">📋</button>
                        </div>
                    </div>
                    
                    <div id="ai-output" style="flex: 1; overflow-y: auto; font-family: 'Times New Roman', serif; line-height: 1.6; white-space: pre-wrap; color: #e0e0e0;">
                        <div style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-dim); opacity: 0.5;">
                            <span style="font-size: 3rem;">📄</span>
                            <p>Paper will appear here</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Phase 1 Advanced Dashboard Implementation
function renderOverview() {
    // Phase 1: Personalization
    const userName = currentUser.name.split(' ')[0];
    const college = GlobalData.colleges.find(c => c.id === currentUser.college)?.name || 'Medicaps University';
    const year = currentUser.year || '3rd Year';
    const branch = currentUser.branch || 'CSE';

    // Real-time subjects based on user branch/semester
    const branchKey = `${branch.toLowerCase().replace(' ', '')}-${currentUser.semester || 'Semester 3'}`;
    const mySubjects = GlobalData.subjects[branchKey] || [];
    const subjects = mySubjects.length > 0 ? mySubjects.slice(0, 3).map((s, idx) => ({
        name: s.name,
        progress: [85, 60, 30][idx] || 45,
        color: ['#2ecc71', '#f1c40f', '#e74c3c'][idx] || '#3498db'
    })) : [
        { name: 'Digital Electronics', progress: 85, color: '#2ecc71' },
        { name: 'Data Structures', progress: 60, color: '#f1c40f' },
        { name: 'Mathematics-III', progress: 30, color: '#e74c3c' }
    ];

    // Mock Users for Role Switcher (Demo Mode)
    const mockUsers = [
        { id: 'u_user', name: 'Rohan (User)', role: 'user' },
        { id: 'u_coadmin', name: 'Dr. Jain (Co-Admin)', role: 'coadmin' },
        { id: 'u_admin', name: 'Admin Console', role: 'admin' }
    ];

    setTimeout(initLiveCounters, 0); // Start animations

    return `
        <div class="tab-pane active fade-in" style="padding: 2rem;">
            <!-- 1. Personalized Header -->
            <div style="margin-bottom: 2.5rem;">
                <h1 class="font-heading" style="font-size: 2.5rem;">Welcome back, <span class="gradient-text">${userName}</span> 👋</h1>
                <p style="color: var(--text-dim); font-size: 1.1rem;">${year} • ${branch} • ${college}</p>
            </div>

            <!-- 2. Live Activity Widgets -->
            <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 3rem;">
                <div class="glass-card wobble-hover" style="padding: 1.5rem; border-left: 4px solid #2ecc71;">
                    <div style="font-size: 0.9rem; color: var(--text-dim); margin-bottom: 0.5rem;">🔴 Live Students</div>
                    <div class="live-counter" id="live-students" style="font-size: 2rem; font-weight: 700;">124</div>
                </div>
                <div class="glass-card wobble-hover" style="padding: 1.5rem; border-left: 4px solid #3498db;">
                    <div style="font-size: 0.9rem; color: var(--text-dim); margin-bottom: 0.5rem;">🔥 Trending Now</div>
                    <div style="font-size: 2rem; font-weight: 700;" id="trending-notes">${NotesDB.length} Notes</div>
                </div>
                <div class="glass-card wobble-hover" style="padding: 1.5rem; border-left: 4px solid #9b59b6;">
                    <div style="font-size: 0.9rem; color: var(--text-dim); margin-bottom: 0.5rem;">⬇️ Global Downloads</div>
                    <div class="live-counter" id="global-downloads" style="font-size: 2rem; font-weight: 700;">0</div>
                </div>
            </div>

            <div class="grid-2-col" style="display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; align-items: start;">
                
                <!-- Main Content: Quick Actions & Recently Viewed -->
                <div style="display: flex; flex-direction: column; gap: 2rem;">
                    
                    <!-- 4. "What Next?" AI Card -->
                    <div class="glass-card" style="background: linear-gradient(135deg, rgba(108, 99, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%); border: 1px solid rgba(108, 99, 255, 0.3); padding: 2rem; position: relative; overflow: hidden;">
                        <div style="position: absolute; top: -10px; right: -10px; font-size: 8rem; opacity: 0.05; transform: rotate(15deg);">🤖</div>
                        <h3 class="font-heading">🤖 AI Recommendation</h3>
                        <p style="margin-bottom: 1.5rem; max-width: 80%;">Your retention in <strong>${subjects[0]?.name || 'Core Subjects'}</strong> is dropping. We recommend solving a model paper to boost confidence.</p>
                        <div style="display: flex; gap: 1rem;">
                            <button class="btn btn-primary" onclick="renderTabContent('ai-tools')">Generate Model Paper</button>
                            <button class="btn btn-ghost" onclick="renderTabContent('planner')">Schedule Revision</button>
                        </div>
                    </div>

                    <!-- Quick Actions -->
                    <div>
                        <h3 class="font-heading" style="margin-bottom: 1rem;">🚀 Quick Actions</h3>
                        <div class="grid-2-col" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
                           <div class="quick-action-card glass-card" onclick="renderNotesHub()" style="cursor: pointer; text-align: center; padding: 1.5rem; transition: transform 0.2s;">
                                <div style="font-size: 2rem; margin-bottom: 0.5rem;">📚</div>
                                <div>Notes Hub</div>
                           </div>
                           <div class="quick-action-card glass-card" onclick="renderTabContent('ai-paper')" style="cursor: pointer; text-align: center; padding: 1.5rem; transition: transform 0.2s;">
                                <div style="font-size: 2rem; margin-bottom: 0.5rem;">🤖</div>
                                <div>AI Paper</div>
                           </div>
                           <div class="quick-action-card glass-card" onclick="renderTabContent('planner')" style="cursor: pointer; text-align: center; padding: 1.5rem; transition: transform 0.2s;">
                                <div style="font-size: 2rem; margin-bottom: 0.5rem;">📅</div>
                                <div>Planner</div>
                           </div>
                        </div>
                    </div>

                </div>

                <!-- 3. Exam Readiness Meter (Sidebar) -->
                <div>
                    <div class="glass-card" style="padding: 1.5rem;">
                         <h3 class="font-heading" style="margin-bottom: 1.5rem;">📊 Exam Readiness</h3>
                         <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                            ${subjects.map(sub => `
                                <div>
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.9rem;">
                                        <span>${sub.name}</span>
                                        <span style="font-weight: 700; color: ${sub.color};">${sub.progress}%</span>
                                    </div>
                                    <div style="width: 100%; background: rgba(255,255,255,0.1); height: 8px; border-radius: 10px; overflow: hidden;">
                                        <div style="width: ${sub.progress}%; background: ${sub.color}; height: 100%; border-radius: 10px; transition: width 1s ease;"></div>
                                    </div>
                                </div>
                            `).join('')}
                         </div>
                         <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border-glass); text-align: center;">
                            <button class="btn btn-sm btn-ghost" style="width: 100%;" onclick="renderTabContent('analytics')">View Full Analysis</button>
                         </div>
                    </div>
                </div>
            </div>

            <!-- Role Switcher (Developer Only) -->
            ${(currentUser.role === 'admin' || currentUser.role === 'superadmin') ? `
             <div style="margin-top: 3rem; padding: 1.5rem; background: rgba(108, 99, 255, 0.05); border-radius: 16px; border: 1px dashed var(--border-glass);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;">
                    <h4 class="font-heading" style="font-size: 1rem;">🛠️ Quick Role Switcher (Demo)</h4>
                </div>
                <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                    ${mockUsers.map(u => `
                        <button class="btn btn-sm ${currentUser.id === u.id ? 'btn-primary' : 'btn-ghost'}" 
                                onclick="switchRole('${u.id}', '${u.role}', '${u.name}')" 
                                style="font-size: 0.75rem;">
                            👤 ${u.name}
                        </button>
                    `).join('')}
                </div>
            </div>
            ` : ''}
        </div>
    `;
}

let unsubscribeLiveStat = null;

// Live Counter Animation logic
window.initLiveCounters = function () {
    const liveEl = document.getElementById('live-students');
    const downloadEl = document.getElementById('global-downloads');
    const { db, doc, onSnapshot } = getFirebase();

    if (unsubscribeLiveStat) unsubscribeLiveStat();

    if (db && (liveEl || downloadEl)) {
        // Listen to global stats for student count and downloads
        const statsRef = doc(db, 'stats', 'global');
        unsubscribeLiveStat = onSnapshot(statsRef, (snap) => {
            if (snap.exists()) {
                const data = snap.data();

                // Update Live Students
                if (liveEl) {
                    const realCount = data.students || 0;
                    const variance = Math.floor(Math.random() * 5) + 2;
                    liveEl.innerText = (realCount + variance).toLocaleString();
                }

                // Update Global Downloads
                if (downloadEl) {
                    downloadEl.innerText = (data.downloads || 0).toLocaleString();
                }
            }
        });
    }
}

// File Handler
window.handleAIFileUpload = function (input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        document.getElementById('file-name-display').innerText = "✅ " + file.name;

        // Simulating File Reading (In a real app, this would upload to server for OCR)
        // For this prototype, we will set a flag or simulated text content
        const reader = new FileReader();
        reader.onload = function (e) {
            // If text file, use content. If binary, use placeholder.
            if (file.type.includes('text')) {
                document.getElementById('ai-pyqs').value = e.target.result;
            } else {
                // PDF/Image mock content
                document.getElementById('ai-pyqs').value = `[SYSTEM: The user uploaded a file named ${file.name}. Please assume this contains standard PYQs for the selected subject and generate a new model paper based on typical university patterns.]`;
            }
        };
        reader.readAsText(file);
    }
}

// Check server status when tab loads
window.checkServer = async () => {
    const badge = document.getElementById('server-status-badge');
    if (!badge) return;

    const isUp = await aiClient.isServerAvailable();
    if (isUp) {
        badge.innerHTML = "🟢 System Online";
        badge.style.background = "rgba(46, 204, 113, 0.2)";
        badge.style.color = "#2ecc71";
    } else {
        badge.innerHTML = "🔴 Server Offline";
        badge.style.background = "rgba(231, 76, 60, 0.2)";
        badge.style.color = "#e74c3c";
    }
}

// Hook into renderAITools to check server
const originalRenderAITools = renderAITools; // Self-reference fix not needed if I replaced the function definition above entirely.

// Main Generation Function
window.generatePaper = async () => {
    const btn = document.getElementById('btn-generate');
    const output = document.getElementById('ai-output');

    // Inputs
    const subject = document.getElementById('ai-subject').value;
    const university = document.getElementById('ai-uni').value;
    const examType = document.getElementById('ai-exam').value;
    const pyqs = document.getElementById('ai-pyqs').value;

    if (!subject || !pyqs) {
        alert("Please select a subject and upload a file (or enter topics).");
        return;
    }

    // UI Loading State
    btn.innerHTML = '<span class="loader-pro" style="width:15px; height:15px; border-width:2px;"></span> Generating...';
    btn.disabled = true;
    output.innerHTML = `
        <div style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--primary);">
            <div class="loader-pro"></div>
            <p style="margin-top: 1rem;">Analyzing patterns & generating questions...</p>
        </div>
    `;

    try {
        const result = await aiClient.generateModelPaper({
            subject, university, semester: selState.year || 'Unknown', examType, pyqs
        });

        // Format Markdown to simple HTML for display (basic)
        // Replacing **text** with <b>text</b> etc. for better preview
        let formatted = result.content
            .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
            .replace(/### (.*?)\n/g, '<h3 style="margin-top:1rem; border-bottom:1px solid #444;">$1</h3>')
            .replace(/## (.*?)\n/g, '<h2 style="text-align:center; text-decoration:underline;">$1</h2>');

        output.innerHTML = formatted;

        // Track
        trackAnalytics('ai_generate_paper', { subject });

    } catch (error) {
        output.innerHTML = `
            <div style="color: #ff4757; text-align: center; padding: 2rem;">
                <h3>⚠️ Error</h3>
                <p>${error.message}</p>
                ${error.message.includes('Server') ? '<p style="font-size:0.8rem; margin-top:1rem; color: var(--text-dim);">Run "node server.js" in the server folder.</p>' : ''}
            </div>
        `;
    } finally {
        btn.innerHTML = '✨ Generate Model Paper';
        btn.disabled = false;
    }
};

window.copyPaper = function () {
    const text = document.getElementById('ai-output').innerText;
    navigator.clipboard.writeText(text).then(() => {
        alert("Paper copied to clipboard!");
    });
};

/* End AI Tools */

function renderAnalytics() {
    const totalViews = NotesDB.reduce((acc, n) => acc + (n.views || 0), 0);
    const totalDownloads = NotesDB.reduce((acc, n) => acc + (n.downloads || 0), 0);
    const totalLikes = NotesDB.reduce((acc, n) => acc + (n.likes || 0), 0);

    return `
        <div class="tab-pane active fade-in" style="padding: 2rem;">
            <h1 class="font-heading">📈 Performance <span class="gradient-text">Analytics</span></h1>
            
            <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-top: 2rem;">
                <div class="glass-card" style="padding: 2rem; border-top: 4px solid var(--primary);">
                    <div style="color: var(--text-dim); font-size: 0.9rem;">Total Content Reach</div>
                    <div style="font-size: 2.5rem; font-weight: 700;">${totalViews.toLocaleString()}</div>
                    <div style="color: var(--success); font-size: 0.8rem; margin-top: 0.5rem;">👁️ Universal Views</div>
                </div>
                <div class="glass-card" style="padding: 2rem; border-top: 4px solid var(--secondary);">
                    <div style="color: var(--text-dim); font-size: 0.9rem;">Community Engagement</div>
                    <div style="font-size: 2.5rem; font-weight: 700;">${totalLikes.toLocaleString()}</div>
                    <div style="color: var(--primary); font-size: 0.8rem; margin-top: 0.5rem;">💖 Total Likes</div>
                </div>
                <div class="glass-card" style="padding: 2rem; border-top: 4px solid #2ecc71;">
                    <div style="color: var(--text-dim); font-size: 0.9rem;">Resource Utilization</div>
                    <div style="font-size: 2.5rem; font-weight: 700;">${totalDownloads.toLocaleString()}</div>
                    <div style="color: #2ecc71; font-size: 0.8rem; margin-top: 0.5rem;">📥 Direct Downloads</div>
                </div>
            </div>

            <div class="glass-card" style="margin-top: 2rem; padding: 3rem; text-align: center;">
                <div style="font-size: 4rem; margin-bottom: 1rem;">🧠</div>
                <h3>Personalized Insights Coming Soon</h3>
                <p>Gemini is currently analyzing your study patterns within the <b>${NotesDB.length} available resources</b>.</p>
            </div>
        </div>
    `;
}



function renderVerificationHub() {
    const pending = NotesDB.filter(n => {
        if (currentUser.role === Roles.SUPER_ADMIN) return n.status === 'pending';
        return n.status === 'pending' && n.collegeId === currentUser.college;
    });

    setTimeout(() => {
        const dropZone = document.getElementById('admin-drop-zone');
        const fileInput = document.getElementById('admin-file-input');

        if (dropZone && fileInput) {
            dropZone.onclick = () => fileInput.click();
            fileInput.onchange = (e) => handleAdminFileSelect(e.target.files[0]);

            dropZone.ondragover = (e) => { e.preventDefault(); dropZone.style.borderColor = 'var(--primary)'; };
            dropZone.ondragleave = (e) => { e.preventDefault(); dropZone.style.borderColor = 'var(--border-glass)'; };
            dropZone.ondrop = (e) => {
                e.preventDefault();
                dropZone.style.borderColor = 'var(--border-glass)';
                handleAdminFileSelect(e.dataTransfer.files[0]);
            };
        }
    }, 500);

    return `
        <div class="tab-pane active fade-in" style="padding: 2rem;">
            <div style="margin-bottom: 2rem;">
                <h1 class="font-heading">🛡️ Verification <span class="gradient-text">Hub</span></h1>
                <p style="color: var(--text-dim);">Quality control center for moderated academic content.</p>
            </div>

            <!-- Admin Direct Upload -->
            <div class="glass-card" style="padding: 2rem; margin-bottom: 3rem; background: rgba(108, 99, 255, 0.03);">
                <h3 class="font-heading" style="margin-bottom: 1rem;">📤 Direct Upload</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                    
                    <!-- File Drop -->
                    <div id="admin-drop-zone" style="border: 2px dashed var(--border-glass); border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 200px; cursor: pointer; transition: all 0.3s ease;">
                        <input type="file" id="admin-file-input" accept=".pdf" style="display: none;">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">📄</div>
                        <p style="color: var(--text-dim);">Click or Drag PDF here</p>
                        <p id="selected-filename" style="color: var(--primary); margin-top: 0.5rem; font-weight: 600;"></p>
                    </div>

                    <!-- Metadata Form -->
                    <div class="upload-meta-form" style="display: flex; flex-direction: column; gap: 1rem;">
                        <select id="up-college" class="search-input" style="width: 100%;"><option value="medicaps">Medi-Caps University</option></select>
                        <div style="display: flex; gap: 1rem;">
                            <select id="up-stream" class="search-input" style="width: 100%;" onchange="updateUpBranches()">
                                <option value="btech">B.Tech</option>
                                <option value="mtech">M.Tech</option>
                                <option value="mba">MBA</option>
                            </select>
                            <select id="up-branch" class="search-input" style="width: 100%;">
                                <option value="cse">CSE</option>
                                <option value="ece">ECE</option>
                                <option value="ee">EE</option>
                                <option value="me">ME</option>
                            </select>
                        </div>
                        <div style="display: flex; gap: 1rem;">
                            <select id="up-year" class="search-input" style="width: 100%;">
                                <option value="1st Year">1st Year</option>
                                <option value="2nd Year">2nd Year</option>
                                <option value="3rd Year">3rd Year</option>
                                <option value="4th Year">4th Year</option>
                            </select>
                            <select id="up-sem" class="search-input" style="width: 100%;">
                                <option value="Semester 3">Semester 3</option>
                                <option value="Semester 4">Semester 4</option>
                            </select>
                        </div>
                         <select id="up-subject" class="search-input" style="width: 100%;">
                                <option value="os">Operating Systems</option>
                                <option value="dbms">DBMS</option>
                                <option value="dsa">DSA</option>
                        </select>
                         <input type="text" id="up-title" class="search-input" placeholder="Title (e.g. Unit 1 Notes)" style="width: 100%;">
                         <div style="display: flex; gap: 1rem;">
                            <select id="up-type" class="search-input" style="width: 100%;">
                                <option value="notes">Notes</option>
                                <option value="pyq">PYQ</option>
                                <option value="formula">Formula Sheet</option>
                            </select>
                             <button class="btn btn-primary" onclick="executeAdminUpload()" style="flex: 1;">🚀 Upload Now</button>
                         </div>
                         <div id="upload-progress-container" style="width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; margin-top: 10px; overflow: hidden; display: none;">
                            <div id="upload-progress" style="width: 0%; height: 100%; background: var(--success); transition: width 0.3s ease;"></div>
                        </div>
                    </div>
                </div>
            </div>

            <h3 class="font-heading" style="margin-bottom: 1.5rem;">User Submissions</h3>
            ${pending.length === 0 ? `
                <div class="glass-card" style="padding: 4rem; text-align: center; border: 1px dashed rgba(255,255,255,0.1);">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">✅</div>
                    <h3>Inbox zero!</h3>
                    <p style="color: var(--text-dim);">All submitted notes have been processed.</p>
                </div>
            ` : `
                <div class="pending-list" style="display: grid; gap: 1.5rem;">
                    ${pending.map(n => `
                        <div class="detailed-item glass-card" style="border-left: 4px solid var(--secondary);">
                            <div class="item-left">
                                <div class="file-type-icon">📑</div>
                                <div class="item-info-block">
                                    <div class="item-title">${n.title}</div>
                                    <div class="item-meta-row">
                                        <span>📍 ${n.collegeId.toUpperCase()} / ${n.branchId.toUpperCase()}</span>
                                        <span>📅 ${n.date}</span>
                                        <span>👤 By ${n.uploader}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="item-right" style="display: flex; gap: 1rem;">
                                <button class="btn btn-ghost" style="color: #ff4757;" onclick="processNote('${n.id}', 'rejected')">❌ Reject</button>
                                <button class="btn btn-primary" onclick="window.open('${n.driveLink}', '_blank')">👁️ Review</button>
                                <button class="btn btn-primary" style="background: var(--success);" onclick="processNote('${n.id}', 'approved')">✅ Approve</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `}
        </div>
    `;
}

let selectedAdminFile = null;

window.handleAdminFileSelect = function (file) {
    if (!file) return;
    if (file.type !== 'application/pdf') {
        alert("Please upload PDF files only.");
        return;
    }
    selectedAdminFile = file;
    document.getElementById('selected-filename').innerText = file.name;
    document.getElementById('admin-drop-zone').style.borderColor = 'var(--success)';
};

window.executeAdminUpload = async function () {
    if (!selectedAdminFile) {
        alert("Please select a file first.");
        return;
    }

    const metadata = {
        title: document.getElementById('up-title').value || selectedAdminFile.name.replace('.pdf', ''),
        collegeId: document.getElementById('up-college').value,
        streamId: document.getElementById('up-stream').value,
        branchId: document.getElementById('up-branch').value,
        year: document.getElementById('up-year').value,
        semester: document.getElementById('up-sem').value,
        subject: document.getElementById('up-subject').value, // Changed from subjectId to subject
        type: document.getElementById('up-type').value,
        uploader: currentUser.name,
        uploaded_by: currentUser.id,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        created_at: new Date().toISOString()
    };

    document.getElementById('upload-progress-container').style.display = 'block';

    try {
        await window.uploadNoteToFirebase(selectedAdminFile, metadata);
        alert("✅ Upload Successful!");
        selectedAdminFile = null;
        document.getElementById('selected-filename').innerText = '';
        document.getElementById('upload-progress').style.width = '0%';
        document.getElementById('admin-drop-zone').style.borderColor = 'var(--border-glass)';
    } catch (e) {
        alert("Upload Failed: " + e.message);
    }
};

window.processNote = function (noteId, newStatus) {
    const note = NotesDB.find(n => n.id === noteId);
    if (!note) return;

    note.status = newStatus;
    note.approved_by = currentUser.id;

    trackAnalytics('note_moderation', { id: noteId, status: newStatus });
    alert(`Note ${newStatus.toUpperCase()} successfully!`);
    renderTabContent('verification');
};

window.updateUpBranches = function () {
    const stream = document.getElementById('up-stream').value;
    const branchSelect = document.getElementById('up-branch');

    // Find branches for this stream from GlobalData
    const streamObj = GlobalData.streams.find(s => s.id === stream);
    let branches = [];
    if (streamObj) {
        branches = GlobalData.branches.filter(b => streamObj.branches.includes(b.id));
    } else {
        branches = GlobalData.branches;
    }

    branchSelect.innerHTML = branches.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
};



function renderAdminConsole() {
    return `
        <div class="tab-pane active fade-in" style="padding: 2rem;">
            <div style="margin-bottom: 3rem;">
                <h1 class="font-heading">💻 Admin <span class="gradient-text">Console</span></h1>
                <p style="color: var(--text-dim);">System-wide oversight, Database Access, and Real-time Analytics.</p>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
                <div class="glass-card" style="padding: 2rem;">
                    <h3 class="font-heading" style="margin-bottom:1rem;">📈 Traffic Analytics</h3>
                    <div style="font-size: 2.5rem; font-weight: 700;">842 <span style="font-size: 1rem; color: var(--success); font-weight:400;">+12%</span></div>
                    <p style="color: var(--text-dim); font-size: 0.9rem;">Active sessions today</p>
                    <div style="height: 100px; background: rgba(255,255,255,0.05); margin-top: 1rem; border-radius: 12px; display:flex; align-items:flex-end; padding: 5px; gap: 5px;">
                        ${[40, 70, 45, 90, 65, 80, 50].map(h => `<div style="flex:1; background: var(--secondary); height:${h}%; border-radius: 4px; opacity:0.6;"></div>`).join('')}
                    </div>
                </div>

                <div class="glass-card" style="padding: 2rem;">
                    <h3 class="font-heading" style="margin-bottom:1rem;">📦 Core Database</h3>
                    <div style="background: #000; padding: 1rem; border-radius: 12px; font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; color: #00ff00; max-height: 200px; overflow: scroll;">
                        { "notes_count": ${NotesDB.length}, "verified": ${NotesDB.filter(n => n.status === 'approved').length}, "pending": ${NotesDB.filter(n => n.status === 'pending').length} }
                    </div>
                    <button class="btn btn-ghost" style="width:100%; margin-top: 1rem; font-size: 0.8rem;">📥 Export full .JSON data</button>
                </div>

                <div class="glass-card" style="padding: 2rem;">
                    <h3 class="font-heading" style="margin-bottom:1rem;">👥 User Management</h3>
                    <div style="display:flex; flex-direction:column; gap:0.5rem;">
                        ${MockUsers.map(u => `
                            <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.8rem; padding: 0.5rem; background: rgba(255,255,255,0.02); border-radius: 8px;">
                                <span>${u.name}</span>
                                <span class="meta-badge" style="font-size:0.6rem;">${u.role}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// --- NOTES HUB FLOW ---
function renderNotesHub() {
    return `
        <div class="tab-pane active" style="padding:0;">
            <div class="notes-hub-wrapper" style="flex-direction: column; overflow-x: hidden; padding-bottom: 4rem;">
                <div class="explorer-header" id="explorer-header" style="position: relative; padding: 3rem 2rem; border-bottom: 1px solid var(--border-glass); background: rgba(108, 99, 255, 0.02);">
                    <div id="explorer-back-container" style="position: absolute; top: 2rem; left: 2rem; z-index: 10;">
                         <button id="explorer-back-btn" class="btn btn-ghost" style="display: none; padding: 0.5rem 1rem; gap: 0.5rem;">
                            <span>⬅</span> Back
                         </button>
                    </div>
                    <div class="step-indicator" style="display: flex; justify-content: center; gap: 3rem; margin-bottom: 3rem;">
                        ${['College', 'Stream', 'Branch', 'Sem', 'Subject'].map((s, i) => `
                            <div class="step-node" id="step-${i}">
                                <div class="step-num">${i + 1}</div>
                                <div class="step-label">${s}</div>
                            </div>
                        `).join('')}
                    </div>
                    <div id="explorer-title-container" style="text-align: center;">
                        <h1 class="font-heading" id="explorer-main-title">Select your <span class="gradient-text">Institution</span></h1>
                        <p id="explorer-sub-title" style="color: var(--text-dim); margin-top: 1rem;">Choose your college to start browsing localized content.</p>
                    </div>
                </div>

                <div id="explorer-content" style="padding: 2rem 2rem 6rem 2rem; min-height: 400px; display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 2rem;">
                    <!-- Step-specific cards will be injected here -->
                </div>

                <div id="final-notes-view" style="display:none; padding: 4rem;">
                    <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 3rem;">
                        <div>
                            <span id="notes-breadcrumb" style="font-size: 0.9rem; color: var(--text-dim); display:block; margin-bottom: 0.5rem;"></span>
                            <h1 id="active-notes-title" class="font-heading" style="font-size: 2.5rem;"></h1>
                        </div>
                        <button class="btn btn-ghost" onclick="backToExplorer()">↺ Restart Explorer</button>
                    </div>
                    <div id="notes-list-grid" class="notes-grid-pro"></div>
                </div>
            </div>
        </div>
    `;
}

function updateStepUI(activeIdx) {
    const nodes = document.querySelectorAll('.step-node');
    nodes.forEach((node, i) => {
        node.classList.remove('active', 'completed');
        if (i < activeIdx) node.classList.add('completed');
        if (i === activeIdx) node.classList.add('active');
    });
}

// --- STEP RENDERS ---
window.renderCollegeStep = function () {
    updateStepUI(0);
    const backBtn = document.getElementById('explorer-back-btn');
    if (backBtn) backBtn.style.display = 'none';

    const container = document.getElementById('explorer-content');

    // Helper to generate HTML for cards
    const getCardsHTML = (items) => items.map(c => `
        <div class="selection-card glass-card fade-in" onclick="selectCollege('${c.id}', '${c.name}')">
            <div class="card-icon" style="width: 80px; height: 80px; margin: 0 auto 1.5rem auto; background: white; border-radius: 12px; padding: 10px; display: flex; align-items: center; justify-content: center;">
                <img src="${c.logo}" alt="${c.name}" style="width: 100%; height: 100%; object-fit: contain;">
            </div>
            <h3 class="font-heading" style="margin-top: 1.5rem;">${c.name}</h3>
            <p style="color: var(--text-dim); margin-top: 0.5rem;">Verified Academic Partner</p>
        </div>
    `).join('');

    // Attach filter function locally
    window.handleCollegeSearch = (input) => {
        const query = input.value.toLowerCase();
        const filtered = GlobalData.colleges.filter(c => c.name.toLowerCase().includes(query));
        const grid = document.getElementById('college-list-grid');
        if (grid) {
            if (filtered.length > 0) {
                grid.innerHTML = getCardsHTML(filtered);
            } else {
                grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:2rem; color:var(--text-dim);">No universities found matching "${input.value}"</div>`;
            }
        }
    };

    container.innerHTML = `
        <div style="grid-column: 1 / -1; margin-bottom: 2rem;">
            <input type="text" 
                   placeholder="Search for your university..." 
                   class="input-field"
                   onkeyup="handleCollegeSearch(this)"
                   style="width: 100%; padding: 1.2rem; border-radius: 16px; border: 1px solid var(--border-glass); background: rgba(0,0,0,0.3); color: white; font-size: 1rem; backdrop-filter: blur(10px);">
        </div>
        
        <!-- Nested Grid for Cards -->
        <div id="college-list-grid" style="grid-column: 1 / -1; display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 2rem;">
            ${getCardsHTML(GlobalData.colleges)}
        </div>
    `;
};

window.selectCollege = function (id, name) {
    selState.college = { id, name };
    trackAnalytics('select_college', { id, name });
    renderStreamStep();
};

window.renderStreamStep = function () {
    updateStepUI(1);
    const backBtn = document.getElementById('explorer-back-btn');
    if (backBtn) {
        backBtn.style.display = 'flex';
        backBtn.onclick = renderCollegeStep;
    }

    document.getElementById('explorer-main-title').innerHTML = `Select your <span class="gradient-text">Stream</span>`;
    document.getElementById('explorer-sub-title').innerText = `Which program are you enrolled in at ${selState.college.name}?`;

    const container = document.getElementById('explorer-content');
    // For now, showing all streams. In future, can filter by college if needed.
    container.innerHTML = GlobalData.streams.map(s => `
        <div class="selection-card glass-card fade-in" onclick="selectStream('${s.id}', '${s.name}')">
            <div class="card-icon" style="background: rgba(108, 99, 255, 0.1); color: var(--primary); width: 60px; height: 60px; display: flex; align-items:center; justify-content:center; border-radius: 12px; margin: 0 auto; font-size: 1.5rem;">${s.icon}</div>
            <h3 class="font-heading" style="margin-top: 1.5rem;">${s.name}</h3>
        </div>
    `).join('');
};

window.selectStream = function (id, name) {
    selState.stream = { id, name };
    trackAnalytics('select_stream', { id, name });
    renderBranchStep();
};

window.renderBranchStep = function () {
    updateStepUI(2);
    const backBtn = document.getElementById('explorer-back-btn');
    if (backBtn) {
        backBtn.style.display = 'flex';
        backBtn.onclick = renderStreamStep;
    }

    document.getElementById('explorer-main-title').innerHTML = `Select your <span class="gradient-text">Branch</span>`;
    document.getElementById('explorer-sub-title').innerText = `What's your field of study at ${selState.college.name}?`;

    const container = document.getElementById('explorer-content');

    // Filter branches based on selected stream logic
    let flowBranches = GlobalData.branches;

    // If a stream is selected and we have a definition for it, filter
    const currentStreamId = selState.stream ? selState.stream.id : null;
    const streamDef = GlobalData.streams.find(s => s.id === currentStreamId);

    if (streamDef && streamDef.branches) {
        flowBranches = GlobalData.branches.filter(b => streamDef.branches.includes(b.id));
    }

    // Default fallback if no branches match (e.g. MBA might not have matched branches in 'branches' array yet)
    if (flowBranches.length === 0) {
        flowBranches = GlobalData.branches; // Fallback or show empty message
    }

    container.innerHTML = flowBranches.map(b => `
        <div class="selection-card glass-card fade-in" onclick="selectBranch('${b.id}', '${b.name}')">
            <div class="card-icon" style="background: rgba(108, 99, 255, 0.1); color: var(--primary); width: 60px; height: 60px; display: flex; align-items:center; justify-content:center; border-radius: 12px; margin: 0 auto; font-size: 1.5rem;">${b.icon}</div>
            <h3 class="font-heading" style="margin-top: 1.5rem;">${b.name}</h3>
        </div>
    `).join('');
};

window.selectBranch = function (id, name) {
    selState.branch = { id, name };
    trackAnalytics('select_branch', { id, name });
    renderCombinedSemesterStep();
};

window.renderCombinedSemesterStep = function () {
    updateStepUI(3);
    const backBtn = document.getElementById('explorer-back-btn');
    if (backBtn) {
        backBtn.style.display = 'flex';
        backBtn.onclick = renderBranchStep;
    }

    document.getElementById('explorer-main-title').innerHTML = `Select your <span class="gradient-text">Semester</span>`;

    const container = document.getElementById('explorer-content');

    // Group Semesters by Year
    const yearGroups = [
        { year: '1st Year', semesters: ['Semester 1', 'Semester 2'], icon: '1️⃣' },
        { year: '2nd Year', semesters: ['Semester 3', 'Semester 4'], icon: '2️⃣' },
        { year: '3rd Year', semesters: ['Semester 5', 'Semester 6'], icon: '3️⃣' },
        { year: '4th Year', semesters: ['Semester 7', 'Semester 8'], icon: '4️⃣' }
    ];

    container.innerHTML = yearGroups.map(group => `
        <div style="grid-column: 1 / -1; margin-top: 2rem; margin-bottom: 1rem;">
            <h3 class="font-heading" style="color: var(--text-main); display: flex; align-items: center; gap: 0.5rem; font-size: 1.4rem;">
                <span style="opacity:0.8;">${group.icon}</span> ${group.year}
            </h3>
            <div style="height: 1px; background: var(--border-glass); margin-top: 0.5rem; width: 100%;"></div>
        </div>
        ${group.semesters.map(sem => `
            <div class="selection-card glass-card fade-in" onclick="selectCombinedSemester('${sem}', '${group.year}')">
                <div class="card-icon" style="font-size: 1.5rem; font-weight: 700; color: var(--primary);">${sem.split(' ')[1]}</div>
                <h3 class="font-heading" style="margin-top: 0.5rem;">${sem}</h3>
            </div>
        `).join('')}
    `).join('');
};

window.selectCombinedSemester = function (sem, year) {
    selState.semester = sem;
    selState.year = year; // Implicitly set year
    trackAnalytics('select_semester', { sem, year });
    renderSubjectStep();
};


window.renderSubjectStep = function () {
    updateStepUI(5);
    const backBtn = document.getElementById('explorer-back-btn');
    if (backBtn) {
        backBtn.style.display = 'flex';
        backBtn.onclick = renderCombinedSemesterStep;
    }

    document.getElementById('explorer-main-title').innerHTML = `Select your <span class="gradient-text">Subject</span>`;

    const container = document.getElementById('explorer-content');
    const key = `${selState.branch.id}-${selState.semester}`;
    const subjects = GlobalData.subjects[key] || [];

    if (subjects.length === 0) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 4rem;">
            <p style="color: var(--text-dim);">No subjects registered for this branch/year combo yet.</p>
            <button class="btn btn-primary btn-sm" style="margin-top: 1rem;" onclick="renderCollegeStep()">Start Over</button>
        </div>`;
        return;
    }

    container.innerHTML = subjects.map(s => `
        <div class="selection-card glass-card fade-in" onclick="selectSubject('${s.id}', '${s.name}')">
            <div class="card-icon" style="font-size: 2.5rem; margin-bottom: 0.5rem;">${s.icon}</div>
            <div style="font-size: 0.7rem; color: var(--primary); font-weight: 700; margin-bottom: 0.5rem; background: rgba(108, 99, 255, 0.1); padding: 2px 8px; border-radius: 4px; display: inline-block;">${s.code}</div>
            <h3 class="font-heading">${s.name}</h3>
        </div>
    `).join('');
};

window.selectSubject = function (id, name) {
    selState.subject = { id, name };
    trackAnalytics('select_subject', { id, name });
    showNotes();
};

function showNotes(activeTab = 'notes') {
    const explorerHeader = document.getElementById('explorer-header');
    const explorerContent = document.getElementById('explorer-content');
    if (explorerHeader) explorerHeader.style.display = 'none';
    if (explorerContent) explorerContent.style.display = 'none';

    const view = document.getElementById('final-notes-view');
    view.style.display = 'block';

    const key = `${selState.branch.id}-${selState.semester}`;
    const subjectData = (GlobalData.subjects[key] || []).find(s => s.id === selState.subject.id) || {
        name: selState.subject.name,
        code: 'GEN101',
        description: 'Comprehensive study materials and verified academic resources for final exam preparation.'
    };

    // Filter notes relevant to the current subject and tab type
    const relevantNotes = NotesDB.filter(n =>
        n.subject === selState.subject.id &&
        n.collegeId === selState.college.id &&
        n.type === activeTab &&
        (n.status === 'approved' || (currentUser.role === Roles.SUPER_ADMIN || (currentUser.role === Roles.COLLEGE_ADMIN && currentUser.college === n.collegeId)))
    );

    const uniqueUnits = new Set();
    relevantNotes.forEach(n => {
        if (n.units) {
            n.units.split(',').forEach(unit => uniqueUnits.add(unit.trim()));
        }
    });

    view.innerHTML = `
        <div class="subject-page-container fade-in">
            <div class="breadcrumb-pro">
                🏠 <span>›</span> ${selState.branch.name} <span>›</span> ... <span>›</span> ${selState.subject.name}
            </div>

            <div class="subject-page-hero">
                <div style="display:flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <h1 class="font-heading" style="font-size: 3rem; margin: 0; line-height: 1.1;">${selState.subject.name}</h1>
                        <div class="sub-meta-stats" style="margin-top: 1rem; display: flex; gap: 2rem; color: var(--text-dim); font-size: 0.9rem;">
                            <span>📚 <b>${relevantNotes.length}</b> Resources</span>
                            <span>🎯 <b>${uniqueUnits.size}</b> Units Covered</span>
                        </div>
                        <div class="sub-badges" style="margin-top: 0.8rem;">
                            <span class="meta-badge">${selState.branch.id.toUpperCase()}</span>
                            <span class="meta-badge">${selState.year.toUpperCase()}</span>
                            <span class="meta-badge">${subjectData.code.toUpperCase()}</span>
                        </div>
                        <p class="subject-description">${subjectData.description}</p>
                        <div style="margin-top: 1.5rem; display: flex; gap: 1rem;">
                            <button class="btn btn-primary btn-sm" onclick="showAIModal('summary', '${selState.subject.name}')">✨ AI Summary</button>
                            <button class="btn btn-ghost btn-sm" style="border: 1px solid var(--primary);" onclick="showAIModal('questions', '${selState.subject.name}')">📝 Generate Model Questions</button>
                        </div>
                    </div>
                    <div style="display:flex; gap: 1rem;">
                        <button class="btn btn-ghost" onclick="backToSubjectSelection()" style="white-space:nowrap; background: rgba(255,255,255,0.05); padding: 0.6rem 1.2rem; border-radius: 8px;">⬅ Back</button>
                    </div>
                </div>
            </div>

            <div class="subject-content-tabs">
                <div class="sub-tab ${activeTab === 'notes' ? 'active' : ''}" onclick="switchSubjectTab('notes')">Notes</div>
                <div class="sub-tab ${activeTab === 'pyq' ? 'active' : ''}" onclick="switchSubjectTab('pyq')">PYQs</div>
                <div class="sub-tab ${activeTab === 'formula' ? 'active' : ''}" onclick="switchSubjectTab('formula')">Formula Sheets</div>
            </div>

            <div class="resource-section">
                <h3 class="font-heading" style="margin-bottom: 2rem;">Verified <span class="highlight">${activeTab.toUpperCase()}</span></h3>
                <div class="resource-list-detailed">
                    ${renderDetailedNotes(selState.subject.id, activeTab)}
                </div>
            </div>
        </div>
    `;
}

window.switchSubjectTab = function (tab) {
    showNotes(tab);
    trackAnalytics('switch_subject_tab', { tab });
};

function renderDetailedNotes(subjectId, tabType = 'notes') {
    // Advanced Filter + Smart Sorting
    const filtered = NotesDB.filter(n => {
        const isCorrectSubject = n.subject === subjectId && n.collegeId === selState.college.id && n.type === tabType;
        if (!isCorrectSubject) return false;

        const isApproved = n.status === 'approved';
        const isAdminOfCollege = (currentUser.role === Roles.SUPER_ADMIN) ||
            (currentUser.role === Roles.COLLEGE_ADMIN && currentUser.college === n.collegeId);

        if (isAdminOfCollege) return n.status !== 'rejected';
        return isApproved;
    }).sort((a, b) => calculateSmartScore(b) - calculateSmartScore(a)); // Sort by SmartScore (Highest first)

    if (filtered.length === 0) {
        return `
            <div style="text-align: center; padding: 5rem; background: rgba(255,255,255,0.01); border: 2px dashed rgba(255,255,255,0.05); border-radius: 20px;">
                <div style="font-size: 4rem; margin-bottom: 2rem;">📂</div>
                <h2 class="font-heading">No premium ${tabType} for this subject found yet.</h2>
                <p style="color: var(--text-dim); margin-bottom: 2.5rem;">Be the first contributor and earn academic credit!</p>
                <button class="btn btn-primary" style="padding: 1rem 2.5rem; font-weight: 700;" onclick="openUploadModal()">+ Upload ${tabType}</button>
            </div>
        `;
    }

    const grid = document.getElementById('notes-list-grid');
    if (!grid) return filtered.map(n => `
        <div class="note-card glass-card">
            <div class="note-type-badge">${n.type || 'Note'}</div>
            <h3 class="note-title">${n.title}</h3>
            ${n.source ? `<div style="font-size: 0.75rem; color: var(--primary); margin-top: -0.5rem; margin-bottom: 0.5rem;">Source: ${n.source}</div>` : ''}
            <div class="note-meta">
                <span>👁️ ${n.views || 0}</span>
                <span>📥 ${n.downloads || 0}</span>
                <span>💖 ${n.likes || 0}</span>
            </div>
            <div class="note-actions">
                <a href="${n.driveLink}" target="_blank" class="btn btn-primary btn-sm" onclick="updateNoteStat('${n.id}', 'view')">Open Notes</a>
                <button class="btn btn-ghost btn-sm" onclick="updateNoteStat('${n.id}', 'like')">💖</button>
            </div>
        </div>
    `).join('');

    grid.innerHTML = filtered.map(n => `
        <div class="note-card glass-card">
            <div class="note-type-badge">${n.type || 'Note'}</div>
            <h3 class="note-title">${n.title}</h3>
            ${n.source ? `<div style="font-size: 0.75rem; color: var(--primary); margin-top: -0.5rem; margin-bottom: 0.5rem;">Source: ${n.source}</div>` : ''}
            <div class="note-meta">
                <span>👁️ ${n.views || 0}</span>
                <span>📥 ${n.downloads || 0}</span>
                <span>💖 ${n.likes || 0}</span>
            </div>
            <div class="note-actions">
                <a href="${n.driveLink}" target="_blank" class="btn btn-primary btn-sm" onclick="updateNoteStat('${n.id}', 'view')">Open Notes</a>
                <button class="btn btn-ghost btn-sm" onclick="updateNoteStat('${n.id}', 'like')">💖</button>
            </div>
        </div>
    `).join('') + `
        <div style="grid-column: 1 / -1; text-align: center; margin-top: 2rem; padding: 1.5rem; border-top: 1px solid var(--border-glass);">
            <p style="color: var(--text-dim); font-size: 0.85rem;">⚠️ <i>Disclaimer: Notes are referenced from educational sources like ${Array.from(new Set(filtered.map(f => f.source).filter(s => s))).join(', ') || 'Medinotes.live'}.</i></p>
        </div>
    `;
    return grid.innerHTML;
}

window.showAIModal = function (type, subject) {
    const title = type === 'summary' ? 'AI Concept Summary' : 'Model Exam Questions';
    const content = type === 'summary'
        ? `Gemini is generating a high-yield summary for <b>${subject}</b> based on the latest Medi-Caps syllabus...`
        : `Generating a mock question paper for <b>${subject}</b> including 2-mark and 10-mark questions...`;

    alert(`✨ [AI Agent Mode]\n\n${title}\nTarget: ${subject}\n\n${content}\n\n(Feature processing available in Pro Sandbox)`);
};

window.processNote = async function (noteId, status) {
    const { db, doc, updateDoc } = getFirebase();
    if (!db) return;

    try {
        const noteRef = doc(db, "notes", noteId);
        await updateDoc(noteRef, {
            status: status,
            approved_by: currentUser.name
        });
        alert(`Note ${status} successfully.`);
    } catch (e) {
        console.error("Moderation error:", e);
    }
}

window.backToExplorer = function () {
    location.reload();
};

window.backToSubjectSelection = function () {
    const explorerHeader = document.getElementById('explorer-header');
    const explorerContent = document.getElementById('explorer-content');
    const view = document.getElementById('final-notes-view');

    if (view) view.style.display = 'none';
    if (explorerHeader) explorerHeader.style.display = 'block'; // Or flex/grid depending on orig styles, but block usually works for div containers or use empty to revert
    if (explorerContent) explorerContent.style.display = 'grid'; // Grid was the original display type

    renderSubjectStep();
};

// Checked for auth above in system initialization


window.loginAsGuest = function () {
    console.log("Logging in as Guest...");
    currentUser = {
        id: 'guest_' + Math.random().toString(36).substr(2, 9),
        name: 'Guest Tester',
        email: 'guest@example.com',
        photo: null,
        role: Roles.USER,
        college: 'medicaps',
        isGuest: true
    };

    updateUserProfileUI();
    initRealTimeDB();
    initTabs();
    renderTabContent('overview');
};

// --- PRODUCTION MODULES ---

// 1. UPLOAD MODULE
window.uploadNote = async function (formData) {
    const { db, collection, addDoc, serverTimestamp, storage, ref, uploadBytes, getDownloadURL } = getFirebase();
    if (!currentUser) return alert("You must be logged in to upload.");

    try {
        const file = formData.get('noteFile');
        const storageRef = ref(storage, `notes/${Date.now()}_${file.name}`);

        console.log("📤 Uploading to Storage...");
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);

        console.log("📝 Saving Metadata to notes_pending...");
        await addDoc(collection(db, "notes_pending"), {
            title: formData.get('title'),
            subject: formData.get('subject'),
            semester: formData.get('semester'),
            year: formData.get('year'),
            collegeId: formData.get('collegeId') || currentUser.collegeId || currentUser.college || 'medicaps',
            fileUrl: downloadURL,
            uploaderUid: currentUser.id,
            uploaderName: currentUser.name,
            uploaderEmail: currentUser.email,
            status: 'pending',
            uploadedAt: serverTimestamp()
        });

        alert("✅ Note successfully submitted for review!");
        closeModal('upload-modal');
    } catch (err) {
        console.error("Upload Error:", err);
        alert("❌ Upload failed: " + err.message);
    }
};

// 2. USER DASHBOARD MODULE
window.renderMyUploads = function () {
    const { db, query, collection, onSnapshot, where, orderBy } = getFirebase();
    const container = document.getElementById('my-uploads-grid');
    if (!container || !currentUser) return;

    const q = query(
        collection(db, "notes_pending"),
        where("uploaderUid", "==", currentUser.id),
        orderBy("uploadedAt", "desc")
    );

    onSnapshot(q, (snapshot) => {
        const pending = [];
        snapshot.forEach(doc => pending.push({ id: doc.id, ...doc.data() }));

        const approvedQ = query(
            collection(db, "notes_approved"),
            where("uploaderUid", "==", currentUser.id)
        );

        onSnapshot(approvedQ, (appSnapshot) => {
            const approved = [];
            appSnapshot.forEach(doc => approved.push({ id: doc.id, ...doc.data() }));

            const all = [...pending, ...approved].sort((a, b) => (b.uploadedAt || b.approvedAt) - (a.uploadedAt || a.approvedAt));

            container.innerHTML = all.length ? all.map(n => `
                <div class="selection-card glass-card">
                    <div class="status-badge ${n.status}">${n.status.toUpperCase()}</div>
                    <h4 style="margin: 0.5rem 0;">${n.title}</h4>
                    <p style="font-size: 0.8rem; color: var(--text-dim);">${n.subject} | ${n.semester}</p>
                    ${n.status === 'approved' ? `
                        <div style="margin-top: 1rem; display: flex; gap: 1rem; font-size: 0.75rem;">
                            <span>👁️ ${n.totalViews || 0}</span>
                            <span>📥 ${n.totalSaves || 0}</span>
                        </div>
                    ` : ''}
                </div>
            `).join('') : '<p style="grid-column: 1/-1; text-align: center; color: var(--text-dim);">No uploads found.</p>';
        });
    });
};

// 3. ADMIN / MODERATION MODULE
window.renderAdminModQueue = function () {
    const { db, query, collection, onSnapshot, where, orderBy, deleteDoc, doc, addDoc } = getFirebase();
    const container = document.getElementById('admin-queue');
    if (!container || !['admin', 'superadmin', 'coadmin'].includes(currentUser.role)) return;

    let q = query(collection(db, "notes_pending"), orderBy("uploadedAt", "asc"));

    // Co-Admin Restriction: Only see notes from their assigned college
    if (currentUser.role === 'coadmin') {
        const myCollegeId = currentUser.collegeId || currentUser.college;
        console.log(`🛡️ Filtering Mod Queue for College: ${myCollegeId}`);
        q = query(collection(db, "notes_pending"), where("collegeId", "==", myCollegeId), orderBy("uploadedAt", "asc"));
    }

    onSnapshot(q, (snapshot) => {
        const items = [];
        snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));

        container.innerHTML = items.length ? items.map(n => `
            <div class="glass-card" style="padding: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h3 style="margin:0;">${n.title}</h3>
                    <p style="margin: 0.3rem 0; font-size: 0.9rem;">From: ${n.uploaderName} | <span class="gradient-text">${n.collegeId || n.college}</span></p>
                    <a href="${n.fileUrl}" target="_blank" class="gradient-text" style="font-weight: 700;">👁️ Preview Note</a>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-primary btn-sm" onclick="approveNote('${n.id}')">✅ Approve</button>
                    <button class="btn btn-ghost btn-sm" style="color: #ff4757;" onclick="rejectNote('${n.id}')">❌ Reject</button>
                </div>
            </div>
        `).join('') : '<p style="text-align:center; color: var(--text-dim);">All caught up! No pending approvals.</p>';
    });

    window.approveNote = async (id) => {
        try {
            const noteRef = doc(db, "notes_pending", id);
            const noteSnap = await getDoc(noteRef);
            if (!noteSnap.exists()) return;

            const data = noteSnap.data();
            await addDoc(collection(db, "notes_approved"), {
                ...data,
                status: 'approved',
                approvedBy: currentUser.name,
                approvedByEmail: currentUser.email,
                approvedAt: serverTimestamp(),
                totalViews: 0,
                totalSaves: 0
            });

            await deleteDoc(noteRef);
            alert("✅ Note Approved!");
        } catch (err) {
            console.error("Approval Error:", err);
            alert("❌ Approval failed.");
        }
    };

    window.rejectNote = async (id) => {
        const reason = prompt("Enter rejection reason:");
        if (!reason) return;
        try {
            const noteRef = doc(db, "notes_pending", id);
            await updateDoc(noteRef, {
                status: 'rejected',
                rejectionReason: reason,
                processedBy: currentUser.email,
                processedAt: serverTimestamp()
            });
            alert("❌ Note Rejected.");
        } catch (err) {
            console.error("Rejection Error:", err);
        }
    };
};

// 4. SUPER ADMIN MANAGEMENT PANEL
window.renderSuperAdminPanel = function () {
    const { db, collection, query, where, getDocs, updateDoc, doc } = getFirebase();
    const container = document.getElementById('superadmin-panel');
    if (!container || currentUser.role !== 'superadmin') return;

    container.innerHTML = `
        <div class="glass-card" style="padding: 2rem;">
            <h3>User Role Management</h3>
            <div style="display:flex; gap: 1rem; margin-top: 1rem;">
                <input type="email" id="user-search-email" placeholder="User Email" class="glass-input" style="flex:1;">
                <button class="btn btn-primary" onclick="searchUserForRoleChange()">Search</button>
            </div>
            <div id="user-management-result" style="margin-top: 2rem;"></div>
        </div>
    `;

    window.searchUserForRoleChange = async () => {
        const email = document.getElementById('user-search-email').value;
        const q = query(collection(db, "users"), where("email", "==", email));
        const snap = await getDocs(q);

        const resultDiv = document.getElementById('user-management-result');
        if (snap.empty) {
            resultDiv.innerHTML = '<p style="color:red;">User not found.</p>';
            return;
        }

        const user = snap.docs[0].data();
        const uid = snap.docs[0].id;

        resultDiv.innerHTML = `
            <div class="glass-card" style="padding: 1rem; border-color: var(--primary);">
                <p><strong>Name:</strong> ${user.name}</p>
                <p><strong>Current Role:</strong> ${user.role}</p>
                <p><strong>Assigned College ID:</strong> ${user.collegeId || user.college || 'None'}</p>
                
                <div style="margin-top: 1rem; display:grid; gap: 0.5rem;">
                    <label style="font-size: 0.8rem; color: var(--text-dim);">Assign New Role</label>
                    <select id="new-role-select" class="glass-input">
                        <option value="user" ${user.role === 'user' ? 'selected' : ''}>Standard User</option>
                        <option value="coadmin" ${user.role === 'coadmin' ? 'selected' : ''}>College Co-Admin</option>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Full Admin</option>
                    </select>
                    
                    <label style="font-size: 0.8rem; color: var(--text-dim);">Assign To College</label>
                    <select id="new-college-select" class="glass-input">
                        <option value="">None / All</option>
                        ${GlobalData.colleges.map(c => `<option value="${c.id}" ${(user.collegeId === c.id || user.college === c.id) ? 'selected' : ''}>${c.name}</option>`).join('')}
                    </select>
                    
                    <button class="btn btn-primary" onclick="updateUserRole('${uid}')" style="margin-top: 0.5rem;">Update Permissions</button>
                </div>
            </div>
        `;
    };

    window.updateUserRole = async (uid) => {
        const role = document.getElementById('new-role-select').value;
        const collegeId = document.getElementById('new-college-select').value;
        try {
            await updateDoc(doc(db, "users", uid), {
                role,
                collegeId: collegeId,
                college: collegeId // Maintain backward compatibility for now
            });
            alert("✅ Permissions updated!");
            searchUserForRoleChange();
        } catch (err) {
            alert("❌ Error: " + err.message);
        }
    };
};

function initRealTimeDB() {
    const { db, query, collection, onSnapshot, orderBy } = getFirebase();
    if (!db) {
        setTimeout(initRealTimeDB, 500);
        return;
    }

    if (unsubscribeNotes) unsubscribeNotes();

    // ONLY fetch from notes_approved for the public feed
    const q = query(collection(db, "notes_approved"), orderBy("approvedAt", "desc"));
    unsubscribeNotes = onSnapshot(q, (snapshot) => {
        NotesDB = [];
        snapshot.forEach((doc) => {
            NotesDB.push({ id: doc.id, ...doc.data() });
        });
        window.NotesDB = NotesDB;
        console.log(`✅ Synced ${NotesDB.length} approved notes from Firestore.`);

        // Trigger UI updates
        const trendingEl = document.getElementById('trending-notes');
        if (trendingEl) trendingEl.innerText = `${NotesDB.length} Approved Notes`;

        const lbList = document.getElementById('lb-list-container');
        if (lbList) {
            const activeType = document.querySelector('.lb-tab.active')?.dataset.type || 'student';
            const activeTime = document.querySelector('.time-filter.active')?.dataset.time || 'all';
            updateLeaderboardUI(activeType, activeTime);
        }
        startActivityFeed();
    });
}

window.toggleTheme = function (forceLight) {
    if (typeof forceLight === 'boolean') {
        if (forceLight) document.body.classList.add('light-mode');
        else document.body.classList.remove('light-mode');
    } else {
        document.body.classList.toggle('light-mode');
    }
    const isLight = document.body.classList.contains('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
}
// Removed redundant initAuthSystem, loginWithGoogle, logout, renderLoginScreen
// as they are handled by auth.js and login.html now.
// --- ADVANCED LEADERBOARD SYSTEM ---

const LeaderboardData = {
    student: [
        { id: 'l1', name: 'Tanishq', views: 856, score: 2400, rank: 1, avatar: 'assets/avatars/1.png' },
        { id: 'l2', name: 'Ankit Sharma', views: 720, score: 2100, rank: 2, avatar: null },
        { id: 'l3', name: 'Riya Patel', views: 690, score: 1950, rank: 3, avatar: null },
        { id: 'l4', name: 'Sneha Gupta', views: 540, score: 1400, rank: 4, avatar: null },
        { id: 'l5', name: 'Rahul Verma', views: 430, score: 1100, rank: 5, avatar: null },
    ],
    contributor: [
        { id: 'c1', name: 'Ankit Sharma', uploads: 12, downloads: 8400, score: 5600, rank: 1, avatar: null },
        { id: 'c2', name: 'Prof. Mehta', uploads: 8, downloads: 6100, score: 4200, rank: 2, avatar: null },
        { id: 'c3', name: 'Rahul Verma', uploads: 5, downloads: 3200, score: 2800, rank: 3, avatar: null },
    ],
    college: [
        { id: 'u1', name: 'Medi-Caps University', views: 42000, students: 3400, score: 9800, rank: 1, logo: '🏛️' },
        { id: 'u2', name: 'SGSITS Indore', views: 31000, students: 2100, score: 8500, rank: 2, logo: '🎓' },
        { id: 'u3', name: 'IIPS DAVV', views: 18000, students: 1500, score: 6200, rank: 3, logo: '📚' },
    ]
};

function renderLeaderboard() {
    return `
        <div class="tab-pane active fade-in" style="padding: 2rem;">
            <!-- Header -->
            <div style="margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: end;">
                <div>
                    <h1 class="font-heading">🏆 Advanced <span class="gradient-text">Leaderboard</span></h1>
                    <p style="color: var(--text-dim);">Compete, contribute, and track your academic standing in real-time.</p>
                </div>
                <!-- Controls -->
                <div class="leaderboard-controls glass-card">
                    <div class="lb-tabs">
                        <div class="lb-tab active" data-type="student">🧑🎓 Students</div>
                        <div class="lb-tab" data-type="contributor">📤 Contributors</div>
                        <div class="lb-tab" data-type="college">🏫 Colleges</div>
                    </div>
                </div>
            </div>

            <div class="leaderboard-container">
                <!-- Main Leaderboard List -->
                <div class="leaderboard-main glass-card" style="padding: 2rem;">
                    
                    <div style="display: flex; justify-content: space-between; margin-bottom: 1.5rem;">
                        <div class="time-filters">
                            <div class="time-filter active" data-time="today">Today</div>
                            <div class="time-filter" data-time="week">Week</div>
                            <div class="time-filter" data-time="month">Month</div>
                            <div class="time-filter" data-time="all">All Time</div>
                        </div>
                        <div style="font-size: 0.8rem; color: var(--text-dim);">
                             Auto-updates every 10s
                        </div>
                    </div>

                    <div id="lb-list-container" class="leaderboard-list">
                        <!-- Populated via JS -->
                    </div>
                </div>

                <!-- Sidebar / Widget Area -->
                <div class="lb-sidebar">
                    
                    <!-- 1. Personal Rank Tracker -->
                    <div class="personal-rank-card">
                        <div style="position: relative; z-index: 2;">
                            <h4 style="margin-bottom: 1rem; color: white;">Your Standing</h4>
                            <div class="rank-stat">
                                <span class="label">Student Rank</span>
                                <div style="display:flex; align-items:center; gap: 8px;">
                                    <span class="value">#1</span>
                                    <span class="rank-change rank-up">↑ 2</span>
                                </div>
                            </div>
                            <div class="rank-stat">
                                <span class="label">Contributor Rank</span>
                                <div style="display:flex; align-items:center; gap: 8px;">
                                    <span class="value">#12</span>
                                    <span class="rank-change rank-down">↓ 1</span>
                                </div>
                            </div>
                            <div style="margin-top: 1rem; padding-top: 0.5rem; border-top: 1px solid rgba(255,255,255,0.1);">
                                <span class="label">Score</span>
                                <span class="value" style="float: right; color: var(--secondary);">2,450 XP</span>
                            </div>
                        </div>
                    </div>

                    <!-- 2. Live Activity Feed -->
                    <div class="glass-card" style="padding: 1.5rem;">
                        <h4 style="margin-bottom: 1rem; font-size: 1rem;">🔴 Live Activity</h4>
                        <div id="activity-feed" class="activity-feed">
                            <!-- Populated via JS -->
                        </div>
                    </div>

                    <!-- 3. Badges -->
                    <div class="glass-card" style="padding: 1.5rem;">
                        <h4 style="margin-bottom: 1rem; font-size: 1rem;">🎖️ Your Badges</h4>
                        <div style="display:flex; gap: 0.5rem; flex-wrap: wrap;">
                            <span title="Early Adopter" style="font-size: 1.5rem; cursor: help;">🚀</span>
                            <span title="Top Viewer" style="font-size: 1.5rem; cursor: help;">👁️</span>
                            <span title="First Upload" style="font-size: 1.5rem; cursor: help; opacity: 0.3;">📤</span>
                            <span title="Scholar" style="font-size: 1.5rem; cursor: help; opacity: 0.3;">🎓</span>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    `;
}

window.initLeaderboardListeners = function () {
    // Type Switching
    const typeTabs = document.querySelectorAll('.lb-tab');
    typeTabs.forEach(tab => {
        tab.onclick = () => {
            document.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            updateLeaderboardUI(tab.dataset.type, 'week'); // Default to week
        };
    });

    // Time Switching
    const timeFilters = document.querySelectorAll('.time-filter');
    timeFilters.forEach(filter => {
        filter.onclick = () => {
            document.querySelectorAll('.time-filter').forEach(t => t.classList.remove('active'));
            filter.classList.add('active');
            // In a real app, this would fetch filtered data. Here we simulated.
            const activeType = document.querySelector('.lb-tab.active').dataset.type;
            updateLeaderboardUI(activeType, filter.dataset.time);
        };
    });

    // Initial Render
    updateLeaderboardUI('student', 'today');
    startActivityFeed();
    initLeaderboardRealtime();
};

function initLeaderboardRealtime() {
    const { db, collection, onSnapshot, query, orderBy } = getFirebase();
    if (!db) return;

    // Listen to users for student leaderboard
    const usersQ = query(collection(db, "users"));
    onSnapshot(usersQ, (snapshot) => {
        const activeType = document.querySelector('.lb-tab.active')?.dataset.type;
        if (activeType === 'student') {
            updateLeaderboardUI('student', document.querySelector('.time-filter.active')?.dataset.time || 'all');
        }
    });
}

function updateLeaderboardUI(type, timeframe) {
    const list = document.getElementById('lb-list-container');
    if (!list) return;

    let data = [];

    if (type === 'student') {
        // Real logic: Aggregating stats from NotesDB for contributors
        // But for "Student" rank usually based on their own activity or points
        // Let's use NotesDB to find top contributors as "Students" for now since we don't have a points system yet
        const contributors = {};
        NotesDB.forEach(note => {
            if (!contributors[note.uploader]) {
                contributors[note.uploader] = { name: note.uploader, score: 0, views: 0, avatar: null };
            }
            contributors[note.uploader].score += (note.likes * 10) + (note.downloads * 5) + note.views;
            contributors[note.uploader].views += note.views;
        });
        data = Object.values(contributors);
    } else if (type === 'contributor') {
        const uploaderStats = {};
        NotesDB.forEach(note => {
            if (!uploaderStats[note.uploader]) {
                uploaderStats[note.uploader] = { name: note.uploader, score: 0, downloads: 0, avatar: null };
            }
            uploaderStats[note.uploader].score += note.likes + note.downloads;
            uploaderStats[note.uploader].downloads += note.downloads;
        });
        data = Object.values(uploaderStats);
    } else if (type === 'college') {
        const collegeStats = {};
        const colleges = GlobalData.colleges;
        colleges.forEach(c => collegeStats[c.id] = { id: c.id, name: c.name, score: 0, views: 0, students: 0, logo: c.logo });

        NotesDB.forEach(note => {
            if (collegeStats[note.collegeId]) {
                collegeStats[note.collegeId].views += note.views;
                collegeStats[note.collegeId].score += note.views;
            }
        });
        data = Object.values(collegeStats);
    }

    // Sort
    data.sort((a, b) => b.score - a.score);

    // --- NEW: Update "Your Standing" Widget ---
    const myRank = data.findIndex(item => item.name === currentUser.name) + 1;
    const myScore = data.find(item => item.name === currentUser.name)?.score || 0;

    // Attempt to update the sidebar widget if it exists
    const valueEls = document.querySelectorAll('.personal-rank-card .value');
    if (valueEls && valueEls.length >= 3) {
        if (type === 'student') {
            const rankEls = document.querySelectorAll('.personal-rank-card .rank-stat .value');
            if (rankEls[0]) rankEls[0].innerText = myRank > 0 ? `#${myRank}` : 'N/A';
        } else if (type === 'contributor') {
            const rankEls = document.querySelectorAll('.personal-rank-card .rank-stat .value');
            if (rankEls[1]) rankEls[1].innerText = myRank > 0 ? `#${myRank}` : 'N/A';
        }
        valueEls[2].innerText = `${myScore.toLocaleString()} ${type === 'student' ? 'XP' : 'pts'}`;
    }

    list.innerHTML = data.map((item, index) => {
        const rankClass = index < 3 ? `top-3 rank-${index + 1}` : '';
        const rankDisplay = `#${index + 1}`;
        const avatar = item.avatar ? `<img src="${item.avatar}">` : (item.name[0]);
        const logo = item.logo ? item.logo : (item.name[0]);

        // Different meta based on type
        let metaHtml = '';
        if (type === 'student') metaHtml = `<span class="score-val">${item.score} XP</span><span class="score-label">${item.views} views</span>`;
        if (type === 'contributor') metaHtml = `<span class="score-val">${item.score} pts</span><span class="score-label">${item.downloads} downloads</span>`;
        if (type === 'college') metaHtml = `<span class="score-val">${formatNumber(item.views)}</span><span class="score-label">total views</span>`;

        return `
            <div class="lb-entry ${rankClass}">
                <div class="lb-rank ${rankClass}">${index < 3 ? ['🥇', '🥈', '🥉'][index] : rankDisplay}</div>
                <div class="lb-user">
                    <div class="lb-avatar">${type === 'college' ? logo : avatar} 
                        ${index === 0 ? '<div class="badge-mini">👑</div>' : ''}
                    </div>
                    <div class="lb-info">
                        <h4>${item.name}</h4>
                        <p>${type === 'college' ? item.students + ' Students' : 'Medi-Caps University'}</p>
                    </div>
                </div>
                <div class="lb-score">
                    ${metaHtml}
                </div>
            </div>
        `;
    }).join('');
}

function startActivityFeed() {
    const feed = document.getElementById('activity-feed');
    if (!feed) return;

    // Use actual NotesDB data for activity feed
    const getRecentActivities = () => {
        // Sort NotesDB by created_at desc to get truly recent ones
        const sorted = [...NotesDB].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        return sorted.slice(0, 5).map(note => ({
            icon: note.type === 'pyq' ? '📝' : '📄',
            text: `<strong>${note.uploader}</strong> uploaded ${note.title}`,
            time: note.date || 'Recently'
        }));
    };

    const activities = getRecentActivities();
    feed.innerHTML = activities.length > 0
        ? activities.map(act => createActivityHTML(act)).join('')
        : '<p style="font-size:0.8rem; color:var(--text-dim); text-align:center;">No recent activity</p>';
}

function createActivityHTML(act) {
    return `
        <div class="activity-item">
            <div class="activity-icon">${act.icon}</div>
            <div class="activity-text">
                ${act.text}
                <span class="activity-meta">${act.time}</span>
            </div>
        </div>
    `;
}

// Ensure formatNumber is available globaly if not already
if (!window.formatNumber) {
    window.formatNumber = (num) => {
        if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
        return num;
    };
}
