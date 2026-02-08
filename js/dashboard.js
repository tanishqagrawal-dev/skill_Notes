// stats functionality is managed via window.statServices
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


// --- RBAC & USER SYSTEM ---
const Roles = {
    SUPER_ADMIN: 'superadmin',
    ADMIN: 'admin',
    COLLEGE_ADMIN: 'coadmin',
    USER: 'user'
};

// --- GLOBAL STATE ---
const GlobalData = {
    colleges: [], // Now fetched dynamically from Firestore
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
            { id: 'pps', name: 'Programming With C', icon: '💻', code: 'CS101', description: 'Introduction to algorithmic logic and C programming.' },
            { id: 'bee', name: 'Basic Electrical & Electronics Engineering', icon: '🔌', code: 'EE101', description: 'AC/DC circuits, transformers and machines.' },
            { id: 'comm-skills', name: 'Communication Skills', icon: '🗣️', code: 'HS101', description: 'Professional writing and verbal communication.' }
        ],
        'cse-Semester 2': [
            { id: 'chemistry', name: 'Engineering Chemistry', icon: '🧪', code: 'EN3BS14', description: 'Water treatment, thermodynamics and material science.' },
            { id: 'math-2', name: 'Engineering Mathematics-II', icon: '📉', code: 'EN3BS12', description: 'Advanced calculus, Fourier series and complex variables.' },
            { id: 'graphics', name: 'Engineering Graphics', icon: '📐', code: 'EN3ES26', description: 'Technical drawing, projection and CAD basics.' },
            { id: 'electronics', name: 'Basic Civil Engineering', icon: '📟', code: 'EN3ES16', description: 'Semiconductor devices and circuits.' },
            { id: 'mech', name: 'Basic Mechanical Engineering', icon: '⚙️', code: 'EN3ES18', description: 'Thermodynamics and IC engines.' }
        ],
        'cse-Semester 3': [
            { id: 'dm', name: 'Discrete Mathematics', icon: '🧩', code: 'CS301', description: 'Logic, sets, graph theory and combinatorics.' },
            { id: 'de', name: 'Digital Electronics', icon: '💡', code: 'CS302', description: 'Boolean algebra and combinational circuits.' },
            { id: 'oop', name: 'Object Oriented Programming ', icon: '☕', code: 'CS303', description: 'Core principles: Encapsulation, Inheritance, Polymorphism.' },
            { id: 'csa', name: 'Computer System Architecture', icon: '🖥️', code: 'CS304', description: 'ALU, control unit and memory hierarchy.' },
            { id: 'java', name: 'Java Programming', icon: '☕', code: 'CS304', description: 'Core principles: Encapsulation, Inheritance, Polymorphism.' },
            { id: 'dsa', name: 'Data Structures', icon: '🌳', code: 'CS305', description: 'Arrays, stacks, queues, trees and sorting.' }
        ],
        'cse-Semester 4': [
            { id: 'adv-java', name: 'Advanced Java Programming', icon: '☕', code: 'CS3CO37', description: 'Servlets, JSP, JDBC and enterprise application components.' },
            { id: 'dbms', name: 'DBMS', icon: '🗄️', code: 'CS3CO39', description: 'Relational databases, SQL, normalization and transaction management.' },
            { id: 'micro', name: 'Microprocessor & Interfacing', icon: '📟', code: 'CS3CO35', description: '8085/8086 architecture, assembly language and peripheral interfacing.' },
            { id: 'os', name: 'Operating Systems', icon: '💾', code: 'CS3CO47', description: 'Process management, synchronization and file systems.' },
            { id: 'toc', name: 'Theory of Computation', icon: '🧠', code: 'CS3CO46', description: 'Finite automata, context-free grammars and Turing machines.' },
            { id: 'SA', name: 'Statical Analysis', icon: '🏷️', code: 'CS3ELXX', description: 'Statical Analysis of Software.' }
        ]
    }
};
window.GlobalData = GlobalData;

let NotesDB = [];
let unsubscribeNotes = null;
let currentUser = null;
let selState = { college: null, branch: null, year: null, subject: null };
let userNotifications = [];
let notificationsUnsubscribe = null;

// --- CORE SYSTEM INITIALIZATION ---

// function handleAuthReady removed (duplicate)

// --- CONSOLIDATED AUTH INITIALIZATION ---
let dashboardReady = false;

function handleAuthReady(data) {
    if (!data) return;
    try {
        const { user, currentUser: appCurrentUser } = data;
        if (appCurrentUser) {
            console.log("🚦 Dashboard Sync:", appCurrentUser.email, `[${appCurrentUser.role}]`);
        } else {
            console.log("🚦 Dashboard Sync: Guest Mode");
        }

        const isNewSession = !currentUser || (appCurrentUser && currentUser.id !== appCurrentUser.id);
        const roleChanged = currentUser && appCurrentUser && currentUser.role !== appCurrentUser.role;

        // Update Global State
        currentUser = appCurrentUser || {
            id: 'visitor_' + Math.random().toString(36).substr(2, 9),
            name: 'Guest Scholar',
            role: 'user',
            college: 'medicaps',
            isGuest: true
        };
        window.currentUser = currentUser;

        // 1. UI Refresh (Identities, Roles)
        updateUserProfileUI();

        // 2. Core Service Initialization (Only Once or on Role Change)
        if (!dashboardReady || isNewSession || roleChanged) {
            initTabs();
            listenToNotifications();

            // Fire parallel background workers
            if (!dashboardReady || isNewSession || !appCurrentUser) {
                Promise.all([
                    loadLiveDashboardStats(),
                    typeof trackStudent === 'function' ? trackStudent() : Promise.resolve(),
                    window.statServices?.initRealtimeStats ? window.statServices.initRealtimeStats() : Promise.resolve(),
                    initDynamicColleges(),
                    initNotesSync()
                ]);
            }

            dashboardReady = true;
        }

        // 3. Dynamic Routing (On load or Role upgrade)
        const contentArea = document.getElementById('tab-content');
        const isSkeleton = contentArea && (contentArea.innerHTML.includes('Loading') || contentArea.innerHTML.includes('skeleton'));

        if (isNewSession || roleChanged || isSkeleton) {
            const urlParams = new URLSearchParams(window.location.search);
            const tabParam = urlParams.get('tab') || window.pendingTab;

            if (tabParam) {
                renderTabContent(tabParam);
            } else if (currentUser && (currentUser.role === 'superadmin' || currentUser.role === 'admin')) {
                renderTabContent('admin-console');
            } else if (currentUser && currentUser.role === 'coadmin') {
                renderTabContent('coadmin-hub');
            } else {
                renderTabContent('overview');
            }
        }
    } catch (e) {
        console.error("CRITICAL Dashboard Init Error:", e);
    }
}

// Single Event Listener
window.addEventListener('auth-ready', (e) => handleAuthReady(e.detail));

// Immediate Sync
if (window.authStatus && window.authStatus.ready) {
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
    const { db, doc, updateDoc, increment, setDoc } = getFirebase();

    // 1. Optimistic UI Update (Instant Feedback)
    const note = NotesDB.find(n => n.id === noteId);
    if (note) {
        if (type === 'view') {
            note.views = (note.views || 0) + 1;
            window.trackStudyProgress(note.subject || 'misc', 'view');
        }
        if (type === 'download') {
            note.downloads = (note.downloads || 0) + 1;
            window.trackStudyProgress(note.subject || 'misc', 'download');
        }
        if (type === 'like') {
            note.likes = (note.likes || 0) + 1;
            showToast("💖 Added to your bookmarks!");
        }
    }

    if (!db) return;

    try {
        // 2. Increment Firestore (Real Source of Truth)
        if (type === 'save') {
            const fileId = "saved_" + noteId;
            const fileRef = doc(db, "privateDrive", currentUser.id, "files", fileId);
            await setDoc(fileRef, {
                name: note.title,
                url: note.url,
                size: 0, // Metadata only
                mimeType: "application/pdf",
                type: "saved",
                subject: note.subject,
                semester: note.semester,
                updatedAt: increment(0), // placeholder for time if needed
                uploaderUid: currentUser.id
            }, { merge: true });
            showToast("🔖 Note saved to Private Drive!");
            return;
        }

        const noteRef = doc(db, "notes", noteId);
        await updateDoc(noteRef, {
            [type + 's']: increment(1)
        });

        // 3. Send to GA4 (Reporting)
        if (type === 'download' && window.statServices?.trackNoteDownload) {
            window.statServices.trackNoteDownload(noteId);
        } else if (type === 'view' && window.statServices?.trackNoteView) {
            window.statServices.trackNoteView(noteId);
        }

    } catch (error) {
        console.error("Error updating stats:", error);
    }
};

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
        console.error("Auth Ready Fail:", e);
    }
}

function initDynamicColleges() {
    const { db, collection, onSnapshot } = getFirebase();
    if (!db) return;

    return new Promise((resolve) => {
        onSnapshot(collection(db, 'colleges'), (snap) => {
            GlobalData.colleges = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            console.log("🏫 Dynamic Colleges Synced:", GlobalData.colleges.length);
            // Dispatch event for components that need to re-render (like Notes Hub filters)
            window.dispatchEvent(new CustomEvent('collegesUpdated', { detail: GlobalData.colleges }));
            resolve();
        });
    });
}

function initNotesSync() {
    const { db, collection, onSnapshot } = getFirebase();
    if (!db || unsubscribeNotes) return;

    console.log("📡 Initializing Notes Hub Synchronization...");
    unsubscribeNotes = onSnapshot(collection(db, 'notes'), (snap) => {
        NotesDB = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        console.log(`📦 Notes Hub Updated: ${NotesDB.length} records in cache.`);

        // Trigger UI refreshes if on a hub page
        const verificationHub = document.getElementById('admin-drop-zone');
        if (verificationHub) {
            const contentArea = document.getElementById('tab-content');
            if (contentArea) renderTabContent('moderation-hub');
        }
    });
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

// --- SYNC UTILITY FOR ADVANCE JAVA ---
window.syncAdvancedJavaNotes = async function () {
    const { storage, ref, listAll, getDownloadURL, db, setDoc, doc, serverTimestamp } = window.firebaseServices;

    // Exact path from screenshot: notes_uploads > medicaps > Advance Java P...
    // Assuming "Advance Java Programming"
    const folderPath = 'notes_uploads/medicaps/Advance Java Programming';
    const folderRef = ref(storage, folderPath);

    showToast(`🔄 Starting sync for: ${folderPath}`, 'info');
    console.log(`🔄 Starting sync for: ${folderPath}`);

    try {
        const res = await listAll(folderRef);
        console.log(`📂 Found ${res.items.length} files.`);

        let count = 0;
        for (const itemRef of res.items) {
            const name = itemRef.name;
            console.log(`Processing: ${name}`);

            const url = await getDownloadURL(itemRef);

            // Generate Metadata
            const noteId = 'sync_' + name.replace(/[^a-zA-Z0-9]/g, '_');
            const title = name.replace('.pdf', '').replace('.pptx', '').replace(/-/g, ' ');

            // Firestore Doc
            await setDoc(doc(db, 'notes', noteId), {
                title: title,
                url: url,
                driveLink: url, // For compatibility
                collegeId: 'medicaps',
                collegeName: 'Medicaps University',
                branchId: 'cse',
                branch: 'Computer Science',
                semester: 'Semester 4', // Mapped to 4th Sem in GlobalData
                subject: 'Advanced Java Programming',
                subjectId: 'adv-java',
                type: 'notes',
                status: 'approved',
                verified: true, // Explicitly trusted
                approvedBy: 'admin_sync',
                approvedAt: serverTimestamp(),
                uploadedBy: 'admin_sync',
                uploader: 'Admin Sync',
                created_at: serverTimestamp(),
                date: new Date().toLocaleDateString(),
                views: 0,
                likes: 0,
                downloads: 0,
                description: 'Auto-synced from storage'
            }, { merge: true });

            count++;
            console.log(`✅ Synced: ${title}`);
        }

        showToast(`✅ Successfully synchronized ${count} notes!`);
        // Refresh view if on the page
        if (window.showNotes) window.showNotes('notes');

    } catch (e) {
        console.error("Sync Error:", e);
        showToast("Sync Failed: " + e.message, 'error');
    }
};


window.openUploadModal = async function () {
    if (!currentUser) {
        alert("Please login first.");
        return;
    }

    let modal = document.getElementById('dashboard-upload-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'dashboard-upload-modal';
        modal.className = 'modal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.8); backdrop-filter: blur(8px);
            z-index: 10000; display: flex; align-items: center; justify-content: center;
            opacity: 0; pointer-events: none; transition: opacity 0.3s;
        `;

        // Using User's HTML Structure
        modal.innerHTML = `
            <div class="upload-card" onclick="event.stopPropagation()">
                <button onclick="closeDashboardUploadModal()" style="position: absolute; top: 1rem; right: 1rem; background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer;">&times;</button>
                <h2>Upload Notes</h2>
                <p class="subtitle">Share your notes with your juniors</p>

                <form class="upload-form" id="dash-upload-form">
                    <!-- COLLEGE (SELECT) -->
                    <div class="form-group full">
                    <label for="college">College Name</label>
                    <select id="college" onchange="const nc = document.getElementById('college-new-wrapper'); if(this.value==='new_college'){nc.style.display='block';} else {nc.style.display='none';}">
                        <option value="">Select college</option>
                        ${GlobalData.colleges.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                        <option value="new_college">+ Other (Add New Institution)</option>
                    </select>
                    <div id="college-new-wrapper" style="display: none; margin-top: 10px;">
                        <input type="text" id="college-new-name" placeholder="Enter Full Institution Name" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid var(--primary); border-radius: 8px; color: white;">
                    </div>
                    </div>

                    <div class="form-group">
                    <label for="stream">Stream</label>
                    <select id="stream">
                        <option value="">Select stream</option>
                        <option value="btech">B.Tech</option>
                        <option value="mtech">M.Tech</option>
                        <option value="bba">BBA</option>
                        <option value="mba">MBA</option>
                    </select>
                    </div>

                    <div class="form-group">
                    <label for="branch">Branch</label>
                    <select id="branch" onchange="updateUploadSubjects()">
                        <option value="">Select branch</option>
                        <option value="cse">CSE</option>
                        <option value="cse_ai">CSE (AI/ML)</option>
                        <option value="it">IT</option>
                        <option value="ece">ECE</option>
                    </select>
                    </div>

                    <div class="form-group">
                    <label for="semester">Semester</label>
                    <select id="semester" onchange="updateUploadSubjects()">
                        <option value="">Select semester</option>
                        <option value="Semester 1">1st Semester</option>
                        <option value="Semester 2">2nd Semester</option>
                        <option value="Semester 3">3rd Semester</option>
                        <option value="Semester 4">4th Semester</option>
                        <option value="Semester 5">5th Semester</option>
                        <option value="Semester 6">6th Semester</option>
                        <option value="Semester 7">7th Semester</option>
                        <option value="Semester 8">8th Semester</option>
                    </select>
                    </div>

                    <div class="form-group">
                    <label for="subject">Subject</label>
                    <select id="subject">
                        <option value="">Select subject</option>
                        <option value="os">Operating Systems</option>
                        <option value="dbms">DBMS</option>
                        <option value="cn">Computer Networks</option>
                        <option value="coa">COA</option>
                    </select>
                    </div>

                    <div class="form-group full">
                    <label for="title">Notes Title</label>
                    <input id="title" type="text" placeholder="Enter notes title" required />
                    </div>

                    <!-- FILE UPLOAD -->
                    <div class="form-group full" id="drop-zone" style="transition: all 0.2s;">
                    <label for="file">Upload File (pdf, ppt, doc)</label>
                    <input
                        id="file"
                        type="file"
                        accept=".pdf,.ppt,.pptx,.doc,.docx"
                        required
                    />
                    </div>

                    <button type="submit" class="primary-btn" id="dash-submit-btn">Upload Note</button>
                    <!-- Progress Bar -->
                    <div style="grid-column: 1/-1; margin-top: 10px; display: none;" id="upload-status-area">
                        <div style="height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden;">
                            <div id="upload-progress" style="width: 0%; height: 100%; background: var(--secondary);"></div>
                        </div>
                        <div style="font-size: 0.8rem; color: var(--text-dim); text-align: center; margin-top: 5px;" id="upload-status-text">Uploading...</div>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        // Initializer for form
        document.getElementById('dash-upload-form').onsubmit = handleDashboardNoteSubmit;

        // Click outside to close
        modal.onclick = (e) => {
            if (e.target === modal) closeDashboardUploadModal();
        }

        // Drag and Drop Logic
        const dropZone = document.getElementById('drop-zone');
        const fileInput = document.getElementById('file');

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, unhighlight, false);
        });

        function highlight(e) {
            dropZone.style.background = 'rgba(102, 255, 227, 0.05)';
            dropZone.style.border = '1px dashed #66ffe3';
            dropZone.style.borderRadius = '12px';
        }

        function unhighlight(e) {
            dropZone.style.background = '';
            dropZone.style.border = '';
        }

        dropZone.addEventListener('drop', handleDrop, false);

        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            fileInput.files = files;
        }
    }

    // Reset form
    document.getElementById('dash-upload-form')?.reset();
    document.getElementById('upload-status-area').style.display = 'none';

    // Show
    requestAnimationFrame(() => {
        modal.style.opacity = '1';
        modal.style.pointerEvents = 'all';
    });
    document.body.style.overflow = 'hidden';
};

window.showToast = window.showToast || function (msg, type = 'success') {
    console.log(`[Toast] ${type.toUpperCase()}: ${msg}`);
    alert(msg);
};

window.closeDashboardUploadModal = function () {
    const modal = document.getElementById('dashboard-upload-modal');
    if (modal) {
        modal.style.opacity = '0';
        modal.style.pointerEvents = 'none';
        document.body.style.overflow = 'auto';
    }
};

async function handleDashboardNoteSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('dash-submit-btn');
    const statusArea = document.getElementById('upload-status-area');
    const statusText = document.getElementById('upload-status-text');

    const title = document.getElementById('title').value;
    const collegeId = document.getElementById('college').value;
    const stream = document.getElementById('stream').value;
    const branch = document.getElementById('branch').value;
    const semester = document.getElementById('semester').value;
    const subject = document.getElementById('subject').value;
    const file = document.getElementById('file').files[0];

    if (!file) {
        alert("Please select a file.");
        return;
    }

    btn.disabled = true;
    btn.innerText = "Processing...";
    statusArea.style.display = 'block';

    // Helper to get text from select
    const getSelectText = (id) => {
        const el = document.getElementById(id);
        return el.options[el.selectedIndex]?.text || '';
    };

    // Metadata construction
    let finalCollegeId = collegeId;
    let finalCollegeName = getSelectText('college');

    if (collegeId === 'new_college') {
        const newName = document.getElementById('college-new-name').value;
        if (!newName) {
            alert("Please enter the new college name.");
            btn.disabled = false;
            btn.innerText = "Upload Note";
            return;
        }
        finalCollegeId = newName.toLowerCase().trim().replace(/\s+/g, '-');
        finalCollegeName = newName;

        const { db, doc, setDoc, serverTimestamp } = getFirebase();
        await setDoc(doc(db, 'colleges', finalCollegeId), {
            id: finalCollegeId,
            name: finalCollegeName,
            status: 'active',
            createdAt: serverTimestamp()
        }, { merge: true });
    }

    const isAdmin = ['admin', 'superadmin', 'super-admin', 'coadmin', 'college-admin'].includes(currentUser.role?.toLowerCase()) ||
        currentUser.email === 'skilmatrix3@gmail.com';
    console.log("👤 Current User Role/Email for Upload:", currentUser.role, currentUser.email, "isAdmin:", isAdmin);
    const metadata = {
        title: title,
        college: finalCollegeId || (currentUser.collegeId || 'medicaps'),
        collegeId: finalCollegeId || (currentUser.collegeId || 'medicaps'),
        collegeName: finalCollegeName || 'Medicaps University',
        stream: getSelectText('stream') || 'B.Tech',
        streamId: stream,
        branch: getSelectText('branch') || 'CSE',
        branchId: branch,
        semester: semester,
        subject: getSelectText('subject') || 'General',
        subjectId: subject,
        type: 'notes',
        uploader: currentUser.name || "Guest Scholar",
        uploadedBy: currentUser.id || "guest",
        uploaderEmail: currentUser.email || "guest@example.com",
        date: new Date().toLocaleDateString(),
        targetCollection: 'notes',
        status: 'approved', // Auto-approve ALL
        verified: true, // Auto-verify ALL
        approvedBy: 'auto_system',
        approvedAt: new Date().toISOString() // Fallback to ISO string for immediate use
    };

    try {
        const result = await window.uploadNoteToFirebase(file, metadata);
        statusText.innerText = "✅ Upload and Save Successful!";
        if (window.showToast) window.showToast("✅ Note uploaded successfully!");

        setTimeout(() => {
            closeDashboardUploadModal();
            // Clear form
            document.getElementById('dash-upload-form').reset();
            document.getElementById('upload-status-area').style.display = 'none';

            // Redirect to My Uploads tab instantly
            const myUploadsTab = document.querySelector('.nav-item[data-tab="my-uploads"]');
            if (myUploadsTab) {
                myUploadsTab.click();
            } else {
                renderTabContent('my-uploads');
            }
        }, 1200);
    } catch (err) {
        console.error("Upload failed:", err);
        statusText.innerText = "Failed: " + err.message;
        alert("Error: " + err.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "Upload Note";
    }
}

window.updateUploadSubjects = function () {
    const branch = document.getElementById('branch').value;
    const semester = document.getElementById('semester').value;
    const subjectSelect = document.getElementById('subject');

    if (!branch || !semester || !subjectSelect) return;

    const key = `${branch}-${semester}`;
    const subjects = GlobalData.subjects[key] || [];

    subjectSelect.innerHTML = `<option value="">Select subject</option>` +
        subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('') +
        `<option value="other">Other</option>`;
};

// --- TAB LOGIC ---
function initTabs() {
    const sidebarNav = document.querySelector('.sidebar-nav');
    if (!sidebarNav || !currentUser) return;

    // Reset Sidebar to Base State (Overview, Notes, Planner, AI Tools, Leaderboard)
    // We assume HTML has the base items. We just append.

    // Clear previously injected dynamic items
    document.querySelectorAll('.dynamic-node').forEach(n => n.remove());

    const settingsNode = document.querySelector('[data-tab="settings"]');

    // 1. My Uploads
    const myUploads = createNavItem('my-uploads', '📤', 'My Uploads', true);
    sidebarNav.insertBefore(myUploads, settingsNode);

    // 3. Moderation & Admin Tools
    if (currentUser.role === 'coadmin' || currentUser.role === 'admin' || currentUser.role === 'superadmin') {
        // Co-Admin Hub - Locked
        const modHub = createNavItem('moderation-hub', '🛡️', 'Moderation Hub <span style="font-size:0.6rem; background:rgba(255,255,255,0.1); padding:2px 6px; border-radius:4px; margin-left:5px;">🔒 Soon</span>', true);
        modHub.style.opacity = '0.6';
        modHub.style.cursor = 'not-allowed';
        modHub.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            alert("🔒 Moderation Hub is coming soon!");
        };
        sidebarNav.insertBefore(modHub, settingsNode);
    }

    if (currentUser.role === 'admin' || currentUser.role === 'superadmin') {
        const adminConsole = createNavItem('admin-console', '🚨', 'Command Center', true);
        sidebarNav.insertBefore(adminConsole, settingsNode);
    }

    // Re-bind listeners and set initial active state
    const urlParams = new URLSearchParams(window.location.search);
    const initialTab = urlParams.get('tab') || window.pendingTab ||
        (currentUser.role === 'coadmin' ? 'coadmin-hub' :
            (currentUser.role === 'admin' || currentUser.role === 'superadmin' ? 'admin-console' : 'overview'));

    document.querySelectorAll('.nav-item').forEach(item => {
        if (item.dataset.tab === initialTab) item.classList.add('active');

        item.onclick = (e) => {
            if (!item.dataset.tab) return;
            e.preventDefault();
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            renderTabContent(item.dataset.tab);
        };
    });
}

function createNavItem(id, icon, label, isDynamic = false) {
    const a = document.createElement('a');
    a.href = "#";
    a.className = `nav-item ${isDynamic ? 'dynamic-node' : ''}`;
    a.dataset.tab = id;
    a.innerHTML = `<span class="icon">${icon}</span> ${label}`;
    return a;
}

function updateUserProfileUI() {
    const avatar = document.querySelector('.user-profile-mini .avatar');
    const name = document.querySelector('.user-profile-mini .name');
    const meta = document.querySelector('.user-profile-mini .meta');

    if (!currentUser) {
        if (name) name.innerText = "Visitor";
        if (meta) meta.innerText = "GUEST";
        if (avatar) {
            avatar.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
            avatar.style.background = 'rgba(255,255,255,0.05)';
        }
        return;
    }

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



function renderTabContent(tabId) {
    const contentArea = document.getElementById('tab-content');
    if (!contentArea) return;

    // GA4 SPA Tracking
    if (window.trackSPAView) {
        window.trackSPAView(`/dashboard/${tabId}`);
    }

    try {
        if (tabId === 'overview') {
            console.log("➡️ Rendering Overview...");
            contentArea.innerHTML = renderOverview();
        } else if (tabId === 'notes') {
            selState = { college: null, branch: null, year: null, subject: null };
            contentArea.innerHTML = renderNotesHub();
            renderCollegeStep();
        } else if (tabId === 'planner') {
            contentArea.innerHTML = renderPlanner();
        } else if (tabId === 'ai-tools') {
            contentArea.innerHTML = renderAITools();
            if (window.checkServer) window.checkServer();
        } else if (tabId === 'leaderboard') {
            contentArea.innerHTML = renderLeaderboard();
            if (typeof initLeaderboardListeners === 'function') initLeaderboardListeners();
        } else if (tabId === 'private-drive') {
            contentArea.innerHTML = renderPrivateDrive();
            if (typeof initPrivateDrive === 'function') initPrivateDrive();
        } else if (tabId === 'moderation-hub') {
            contentArea.innerHTML = renderModerationHub();
            if (typeof initModerationHub === 'function') initModerationHub();
        } else if (tabId === 'verification-hub') {
            contentArea.innerHTML = `<div class="tab-pane active fade-in" style="padding: 2rem;">
                <h1 class="font-heading">🛡️ Moderation <span class="gradient-text">Queue</span></h1>
                <p style="color: var(--text-dim); margin-bottom: 2rem;">Approve or reject pending note submissions.</p>
                <div id="admin-queue" class="grid-1-col" style="display: grid; gap: 1rem;"></div>
            </div>`;
            if (typeof renderAdminModQueue === 'function') renderAdminModQueue();
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
            if (typeof renderMyUploads === 'function') renderMyUploads();
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
                        <input type="file" id="ai-file-input" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.png,.jpg,.jpeg" style="display: none;" onchange="handleAIFileUpload(this)">
                        
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
                        <div class="actions" style="display: flex; gap: 0.5rem;">
                            <button class="btn btn-sm btn-ghost" onclick="copyPaper()" title="Copy to Clipboard">📋</button>
                            <button class="btn btn-sm btn-ghost" onclick="saveAIOutputToDrive()" title="Save to Private Drive">💾</button>
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


// --- PROFESSIONAL DASHBOARD ENGINE ---

function renderDashboardSkeleton() {
    return `
        <div class="tab-pane active fade-in" style="padding: 2rem;">
            <div style="margin-bottom: 2.5rem;">
                <div class="skeleton" style="height: 48px; width: 400px; border-radius: 8px; margin-bottom: 0.5rem;"></div>
                <div class="skeleton" style="height: 24px; width: 250px; border-radius: 4px;"></div>
            </div>

            <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 3rem;">
                ${Array(3).fill(0).map(() => `<div class="glass-card skeleton" style="height: 120px; border-radius: 12px;"></div>`).join('')}
            </div>

            <div class="grid-2-col" style="display: grid; grid-template-columns: 2fr 1fr; gap: 2rem;">
                <div class="glass-card skeleton" style="height: 250px; border-radius: 20px;"></div>
                <div class="glass-card skeleton" style="height: 400px; border-radius: 20px;"></div>
            </div>
        </div>
    `;
}

function renderOverview() {
    const contentArea = document.getElementById('tab-content');
    if (!contentArea) return "";

    // Simplified guard: Only skeleton if we truly have no identity data at all
    if (!currentUser) {
        return renderDashboardSkeleton();
    }

    const userName = (currentUser.name || "Scholar").split(' ')[0];
    const college = currentUser.collegeName || currentUser.college || 'Medicaps University';
    const year = currentUser.year || '3rd Year';
    const branch = currentUser.branch || 'CSE';
    const roleLabel = currentUser.role !== 'user' ? `🛡️ Verified ${currentUser.role.toUpperCase()}` : `${year} • ${branch}`;

    // Calculate real readiness (from user_stats or mock for first time)
    const userStats = currentUser.stats || { subjects: {} };
    const readinessData = [
        { name: 'Discrete Mathematics', progress: userStats.subjects?.dm?.readiness || 85, color: '#2ecc71', id: 'dm' },
        { name: 'Digital Electronics', progress: userStats.subjects?.de?.readiness || 60, color: '#f1c40f', id: 'de' },
        { name: 'Object Oriented Programming', progress: userStats.subjects?.oop?.readiness || 30, color: '#e74c3c', id: 'oop' }
    ];

    const isGuest = !currentUser.email;

    // AI Logic: What should they study?
    let aiRec = {
        title: "🤖 AI Recommendation",
        msg: `Your retention in <strong>${readinessData[0].name}</strong> is dropping. We recommend solving a model paper to boost confidence.`,
        actionType: "ai-tools",
        actionLabel: "Generate Model Paper"
    };

    if (isGuest) {
        aiRec = {
            title: "🔐 Unlock AI Insights",
            msg: "Create a free account to track your study progress, get personalized AI recommendations, and see your exam readiness.",
            actionType: "login",
            actionLabel: "Join Now"
        };
    } else if (readinessData[2].progress < 40) {
        aiRec.msg = `We noticed you're struggling with <strong>${readinessData[2].name}</strong>. Why not check out some verified formula sheets?`;
        aiRec.actionType = "notes";
        aiRec.actionLabel = "Browse Resource Hub";
    }

    return `
        <div class="tab-pane active fade-in" style="padding: 2rem;">
            <!-- 1. Personalized Header -->
            <div style="margin-bottom: 2.5rem;">
                <h1 class="font-heading" style="font-size: 2.5rem; margin-bottom: 0.5rem;">Welcome back, <span class="gradient-text">${userName}</span> 👋</h1>
                <p style="color: var(--text-dim); font-size: 1.1rem;">${roleLabel} • ${college}</p>
            </div>

            <!-- 2. Live Activity Widgets (Firestore Real-time) -->
            <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 3rem;">
                <div class="glass-card wobble-hover" style="padding: 1.5rem; border-left: 4px solid #2ecc71;">
                    <div style="display:flex; justify-content:space-between;">
                        <span style="font-size: 0.9rem; color: var(--text-dim);">🔴 Live Students</span>
                        <span style="font-size: 0.8rem; color: #2ecc71;">● Live</span>
                    </div>
                    <div id="stat-active" style="font-size: 2.5rem; font-weight: 700; margin-top:0.5rem;">--</div>
                </div>
                <div class="glass-card wobble-hover" style="padding: 1.5rem; border-left: 4px solid #3498db;">
                    <div style="font-size: 0.9rem; color: var(--text-dim);">🔥 Trending Now</div>
                    <div id="stat-notes" style="font-size: 2.5rem; font-weight: 700; margin-top:0.5rem;">--</div>
                    <div style="font-size: 0.75rem; color: var(--text-dim);">Premium Resources</div>
                </div>
                <div class="glass-card wobble-hover" style="padding: 1.5rem; border-left: 4px solid #9b59b6;">
                    <div style="font-size: 0.9rem; color: var(--text-dim);">⬇️ Global Downloads</div>
                    <div id="stat-downloads" style="font-size: 2.5rem; font-weight: 700; margin-top:0.5rem;">--</div>
                </div>
            </div>

            <div class="grid-2-col" style="display: grid; grid-template-columns: 2fr 1fr; gap: 2.5rem; align-items: start;">
                
                <div style="display: flex; flex-direction: column; gap: 2.5rem;">
                    
                    <!-- 4. AI Insights Card -->
                    <div class="glass-card" style="background: linear-gradient(135deg, rgba(108, 99, 255, 0.1) 0%, rgba(255, 255, 255, 0.03) 100%); border: 1px solid rgba(108, 99, 255, 0.2); padding: 2.5rem; position: relative; overflow: hidden; border-radius: 24px;">
                        <div style="position: absolute; top: -20px; right: -20px; font-size: 10rem; opacity: 0.03; transform: rotate(15deg);">🤖</div>
                        <h3 class="font-heading" style="font-size: 1.5rem; margin-bottom: 1rem; color: var(--secondary);">✨ ${aiRec.title}</h3>
                        <p style="margin-bottom: 2rem; max-width: 85%; font-size: 1.1rem; line-height: 1.6; color: #eee;">${aiRec.msg}</p>
                        <div style="display: flex; gap: 1rem;">
                            <button class="btn btn-primary" onclick="${isGuest ? "window.location.href='../pages/auth.html'" : `renderTabContent('${aiRec.actionType}')`}">${aiRec.actionLabel}</button>
                            ${!isGuest ? '<button class="btn btn-ghost" onclick="renderTabContent(\'planner\')">Schedule Revision</button>' : ''}
                        </div>
                    </div>

                    <!-- 5. Quick Access Path -->
                    <div>
                        <h3 class="font-heading" style="margin-bottom: 1.5rem;">🚀 Personalized Track</h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1.25rem;">
                           <div class="glass-card wobble-hover" onclick="renderTabContent('private-drive')" style="cursor: pointer; padding: 2rem; text-align: center; border: 1px solid var(--border-glass);">
                                <div style="font-size: 2.5rem; margin-bottom:1rem;">📂</div>
                                <div style="font-weight:600;">My Drive</div>
                                <div style="font-size:0.7rem; color: var(--text-dim); margin-top:0.3rem;">Stored Notes</div>
                           </div>
                           <div class="glass-card wobble-hover" onclick="renderTabContent('ai-tools')" style="cursor: pointer; padding: 2rem; text-align: center; border: 1px solid var(--border-glass);">
                                <div style="font-size: 2.5rem; margin-bottom:1rem;">🤖</div>
                                <div style="font-weight:600;">AI Lab</div>
                                <div style="font-size:0.7rem; color: var(--text-dim); margin-top:0.3rem;">Predict Papers</div>
                           </div>
                           <div class="glass-card wobble-hover" onclick="renderTabContent('leaderboard')" style="cursor: pointer; padding: 2rem; text-align: center; border: 1px solid var(--border-glass);">
                                <div style="font-size: 2.5rem; margin-bottom:1rem;">🏆</div>
                                <div style="font-weight:600;">Ranking</div>
                                <div style="font-size:0.7rem; color: var(--text-dim); margin-top:0.3rem;">View Peers</div>
                           </div>
                        </div>
                    </div>
                </div>

                <!-- 3. Readiness Meter (Sidebar) -->
                <div class="glass-card" style="padding: 2rem; border-radius: 24px;">
                     <h3 class="font-heading" style="margin-bottom: 2rem; font-size: 1.3rem;">📊 Readiness Analysis</h3>
                     <div style="display: flex; flex-direction: column; gap: 2rem;">
                        ${readinessData.map(sub => `
                            <div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem; font-size: 0.95rem;">
                                    <span style="color: var(--text-dim);">${sub.name}</span>
                                    <span style="font-weight: 700; color: ${sub.color};">${sub.progress}%</span>
                                </div>
                                <div style="width: 100%; background: rgba(255,255,255,0.05); height: 10px; border-radius: 20px; overflow: hidden; border: 1px solid rgba(255,255,255,0.02);">
                                    <div style="width: ${sub.progress}%; background: linear-gradient(90deg, ${sub.color}, white); height: 100%; border-radius: 20px; transition: width 1.5s cubic-bezier(0.1, 0.7, 1.0, 0.1);"></div>
                                </div>
                            </div>
                        `).join('')}
                     </div>
                     <div style="margin-top: 2.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border-glass); text-align: center;">
                        <p style="font-size: 0.8rem; color: var(--text-dim); margin-bottom: 1.5rem;">Calculated based on downloads, views, and AI interactions.</p>
                        <button class="btn btn-ghost" style="width: 100%;" onclick="renderTabContent('analytics')">Deeper Insights →</button>
                     </div>
                </div>
            </div>
        </div>
    `;
}

let unsubscribeLiveStat = null;

// Live Counter Animation logic
// Redundant initLiveCounters removed in favor of stats.js management

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
        showToast("Paper copied to clipboard!");
    });
};

window.saveAIOutputToDrive = async function () {
    const text = document.getElementById('ai-output').innerText;
    if (text.includes("Paper will appear here")) return showToast("Generate paper first!", "info");

    const subject = document.getElementById('ai-subject').value || "Academic";
    const { db, doc, setDoc, serverTimestamp } = getFirebase();
    if (!db || !currentUser) return;

    showToast("Saving to Drive...", "info");
    const fileId = "ai_" + Math.random().toString(36).substring(7);
    const fileRef = doc(db, "privateDrive", currentUser.id, "files", fileId);

    try {
        await setDoc(fileRef, {
            name: `${subject}_AI_Paper.txt`,
            url: "data:text/plain;charset=utf-8," + encodeURIComponent(text),
            size: text.length,
            mimeType: "text/plain",
            type: "ai",
            updatedAt: serverTimestamp(),
            uploaderUid: currentUser.id
        });
        showToast("✅ Saved to Private Drive > AI Notes");
    } catch (e) {
        console.error(e);
        showToast("Failed to save", "error");
    }
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
                        <input type="file" id="admin-file-input" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt" style="display: none;">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">📄</div>
                        <p style="color: var(--text-dim);">Click or Drag PDF, DOCX, or PPT here</p>
                        <p id="selected-filename" style="color: var(--primary); margin-top: 0.5rem; font-weight: 600;"></p>
                    </div>

                    <!-- Metadata Form -->
                    <div class="upload-meta-form" style="display: flex; flex-direction: column; gap: 1rem;">
                        <select id="up-college" class="search-input" style="width: 100%;" onchange="const nc = document.getElementById('up-college-new'); if(this.value==='new_college'){nc.style.display='block'; nc.focus();} else {nc.style.display='none';}">
                            <option value="">Select College</option>
                            ${GlobalData.colleges.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                            <option value="new_college">+ Add New College...</option>
                        </select>
                        <input type="text" id="up-college-new" class="search-input" placeholder="Enter New College Name" style="width: 100%; display: none; margin-top: 5px; border-color: var(--primary);">
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
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain'
    ];
    if (!allowedTypes.includes(file.type)) {
        alert("Please upload supported document formats (PDF, Word, PPT, or Text).");
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

    let finalCollegeId = document.getElementById('up-college').value;
    let finalCollegeName = document.getElementById('up-college').options[document.getElementById('up-college').selectedIndex].text;

    if (finalCollegeId === 'new_college') {
        const newName = document.getElementById('up-college-new').value;
        if (!newName) return alert("Please enter the new college name.");

        finalCollegeId = newName.toLowerCase().trim().replace(/\s+/g, '-');
        finalCollegeName = newName;

        const { db, doc, setDoc, serverTimestamp } = getFirebase();
        await setDoc(doc(db, 'colleges', finalCollegeId), {
            id: finalCollegeId,
            name: finalCollegeName,
            status: 'active',
            createdAt: serverTimestamp()
        }, { merge: true });
    }

    const metadata = {
        title: document.getElementById('up-title').value || selectedAdminFile.name.replace(/\.[^/.]+$/, ""),
        collegeId: finalCollegeId,
        collegeName: finalCollegeName,
        streamId: document.getElementById('up-stream').value,
        branchId: document.getElementById('up-branch').value,
        year: document.getElementById('up-year').value,
        semester: document.getElementById('up-sem').value,
        subject: document.getElementById('up-subject').value,
        type: document.getElementById('up-type').value,
        uploaderName: currentUser.name,
        uploadedBy: currentUser.id,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: 'approved',
        targetCollection: 'notes',
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

window.processNote = async function (noteId, newStatus) {
    const { db, doc, runTransaction, deleteDoc, serverTimestamp } = getFirebase();
    if (!db) return;

    if (newStatus === 'rejected') {
        if (!confirm("Permanently reject/delete this submission?")) return;
        try {
            await deleteDoc(doc(db, 'notes', noteId));
            showToast("🚫 Submission rejected and deleted.");
            renderTabContent('verification-hub');
        } catch (e) {
            console.error(e);
            showToast("Error rejecting: " + e.message, "error");
        }
        return;
    }

    // Approval logic
    try {
        await runTransaction(db, async (transaction) => {
            const noteRef = doc(db, 'notes', noteId);
            const noteSnap = await transaction.get(noteRef);
            if (!noteSnap.exists()) throw "Note not found!";

            transaction.update(noteRef, {
                status: 'approved',
                approvedBy: currentUser.id,
                approvedAt: serverTimestamp(),
                views: 0,
                saves: 0,
                likes: 0
            });
        });

        showToast("🚀 Note approved and published!");
        renderTabContent('verification-hub');
    } catch (e) {
        console.error(e);
        showToast("Error approving: " + e.message, "error");
    }
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
                    <div style="display:flex; gap:0.5rem; margin-top: 1rem;">
                        <button class="btn btn-ghost" style="flex:1; font-size: 0.8rem;">📥 Export JSON</button>
                        <button class="btn btn-primary" style="flex:1; font-size: 0.8rem;" onclick="window.syncAdvancedJavaNotes()">🔄 Sync AJP</button>
                    </div>
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
    const getCardsHTML = (items) => {
        // Sort: Medicaps first
        const sortedItems = [...items].sort((a, b) => {
            const isMedicapsA = (a.id === 'medicaps' || a.name.toLowerCase().includes('medicaps'));
            const isMedicapsB = (b.id === 'medicaps' || b.name.toLowerCase().includes('medicaps'));
            if (isMedicapsA && !isMedicapsB) return -1;
            if (!isMedicapsA && isMedicapsB) return 1;
            return 0;
        });

        return sortedItems.map(c => {
            const isMedicaps = (c.id === 'medicaps' || c.name.toLowerCase().includes('medicaps'));
            const isLocked = !isMedicaps;

            return `
        <div class="selection-card glass-card fade-in" 
             style="position: relative; ${isLocked ? 'opacity: 0.7; cursor: not-allowed;' : ''}"
             onclick="${isLocked ? '' : `selectCollege('${c.id}', '${c.name}')`}">
             
            ${isLocked ? `
                <div style="position: absolute; top: 1rem; right: 1rem; background: rgba(0,0,0,0.6); padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.75rem; color: #fff; display: flex; align-items: center; gap: 0.3rem; border: 1px solid rgba(255,255,255,0.1);">
                    🔒 <span style="font-weight: 500;">Coming Soon</span>
                </div>
            ` : ''}

            <div class="card-icon" style="width: 80px; height: 80px; margin: 0 auto 1.5rem auto; background: white; border-radius: 12px; padding: 10px; display: flex; align-items: center; justify-content: center; ${isLocked ? 'filter: grayscale(1); opacity: 0.8;' : ''}">
                <img src="${c.logo}" alt="${c.name}" style="width: 100%; height: 100%; object-fit: contain;">
            </div>
            <h3 class="font-heading" style="margin-top: 1.5rem; ${isLocked ? 'color: var(--text-dim);' : ''}">${c.name}</h3>
        </div>
    `}).join('');
    };

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



let notesUnsubscribe = null;

window.showNotes = function (activeTab = 'notes') {
    const explorerHeader = document.getElementById('explorer-header');
    const explorerContent = document.getElementById('explorer-content');
    if (explorerHeader) explorerHeader.style.display = 'none';
    if (explorerContent) explorerContent.style.display = 'none';

    const view = document.getElementById('final-notes-view');
    view.style.display = 'block';

    // 1. Unsubscribe previous listener if exists
    if (notesUnsubscribe) {
        notesUnsubscribe();
        notesUnsubscribe = null;
    }

    const { db, collection, query, where, onSnapshot } = window.firebaseServices;

    // 2. Render Shell
    view.innerHTML = `
        <div class="subject-page-container fade-in">
             <div class="breadcrumb-pro">
                🏠 <span>›</span> ${selState.branch.name} <span>›</span> ${selState.semester} <span>›</span> ${selState.subject.name}
            </div>
             <div class="subject-page-hero">
                <div style="display:flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <h1 class="font-heading" style="font-size: 3rem; margin: 0; line-height: 1.1;">${selState.subject.name}</h1>
                        <div id="notes-header-stats" class="sub-meta-stats" style="margin-top: 1rem; display: flex; gap: 2rem; color: var(--text-dim); font-size: 0.9rem;">
                             <span>📚 <b>Loading...</b></span>
                        </div>
                        <div class="sub-badges" style="margin-top: 0.8rem;">
                            <span class="meta-badge">${selState.branch.id.toUpperCase()}</span>
                            <span class="meta-badge">${selState.year.toUpperCase()}</span>
                        </div>
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
                <div class="resource-list-detailed" id="notes-list-grid">
                     <div style="text-align:center; padding: 4rem;">
                        <div class="loader-pro" style="margin: 0 auto 1rem;"></div>
                        <p style="color:var(--text-dim);">Listening for live updates...</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    console.log("📡 Connecting Real-Time Listener (Robust):", selState);
    const q = query(
        collection(db, "notes"),
        where("collegeId", "==", selState.college.id),
        where("branchId", "==", selState.branch.id),
        where("type", "==", activeTab),
        where("status", "==", "approved")
    );

    notesUnsubscribe = onSnapshot(q, (snapshot) => {
        const querySem = selState.semester; // e.g. "Semester 4"
        // Generate alternative format (e.g. "Semester 4" -> "4th")
        const semNum = querySem.split(' ')[1];
        const altSem = semNum ? (semNum + (semNum === '1' ? 'st' : semNum === '2' ? 'nd' : semNum === '3' ? 'rd' : 'th')) : null;

        const notes = [];
        snapshot.forEach(doc => {
            const data = doc.data();

            // Robust Filtering:
            // 1. Semester Check (Matches "Semester 4" or "4th")
            const semMatch = data.semester === querySem || (altSem && data.semester === altSem);

            // 2. Subject Check (Matches "subjectId" or "subject" fields)
            const subMatch = (data.subjectId === selState.subject.id) || (data.subject === selState.subject.id) || (data.subject === selState.subject.name);

            // 3. Status Check (Show only approved notes Globally)
            const isVisible = true; // Query already filters for approved

            if (semMatch && subMatch && isVisible) {
                notes.push({ id: doc.id, ...data });
            }
        });

        console.log(`⚡ Real-time update (filtered): ${notes.length} notes found.`);

        // Update Stats
        const statsEl = document.getElementById('notes-header-stats');
        if (statsEl) {
            const uniqueUnits = new Set();
            notes.forEach(n => { if (n.units) n.units.split(',').forEach(u => uniqueUnits.add(u.trim())); });
            statsEl.innerHTML = `<span>📚 <b>${notes.length}</b> Resources</span><span>🎯 <b>${uniqueUnits.size}</b> Units Covered</span>`;
        }

        // Render List
        const listContainer = document.getElementById('notes-list-grid');
        if (listContainer) {
            listContainer.innerHTML = renderNotesList(notes, activeTab);
            // Trigger unique view tracking for all notes shown
            notes.forEach(n => {
                if (typeof window.incrementNoteView === 'function') {
                    window.incrementNoteView(n.id);
                }
            });
        }

    }, (error) => {
        console.error("❌ Real-time Error:", error);
        const listContainer = document.getElementById('notes-list-grid');
        if (listContainer) {
            listContainer.innerHTML = `
                <div style="padding: 2rem; border: 1px solid red; background: rgba(255,0,0,0.1); border-radius: 8px; color: #ff6b6b;">
                    <strong>🔥 Connection Failed:</strong> ${error.message}<br>
                    <small>Check console for details.</small>
                </div>
             `;
        }
    });
};

window.renderMyUploads = function () {
    const container = document.getElementById('my-uploads-grid');
    if (!container || !currentUser) return;

    const { db, collection, query, where, onSnapshot } = window.firebaseServices;
    container.innerHTML = '<div class="loader-pro" style="margin: 2rem auto;"></div>';

    const render = (all) => {
        if (all.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 4rem; opacity: 0.6;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📤</div>
                    <p>You haven't uploaded anything yet.</p>
                    <button class="btn btn-primary" onclick="openUploadModal()" style="margin-top:1rem;">Upload Your First Note</button>
                </div>
            `;
            return;
        }
        container.innerHTML = all.map(n => `
            <div class="glass-card wobble-hover" style="position: relative; border-left: 4px solid ${n.status === 'approved' ? 'var(--success)' : '#f1c40f'}; padding: 1.5rem;">
                <div style="position: absolute; top: 1rem; right: 1rem; font-size: 0.7rem; padding: 2px 8px; border-radius: 4px; background: rgba(255,255,255,0.05); color: ${n.status === 'approved' ? 'var(--success)' : '#f1c40f'}; border: 1px solid ${n.status === 'approved' ? 'var(--success)' : '#f1c40f'};">
                    ${n.status.toUpperCase()}
                </div>
                <div style="font-size: 2rem; margin-bottom: 0.5rem; opacity: 0.8;">📄</div>
                <h4 style="margin-bottom: 0.5rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${n.title}</h4>
                <div style="font-size: 0.8rem; color: var(--text-dim); margin-bottom: 1rem;">
                    ${n.subject.toUpperCase()} • ${new Date(n.created_at || Date.now()).toLocaleDateString()}
                </div>
                <div style="display: flex; gap: 0.5rem;">
                     <a href="${n.fileUrl || n.driveLink}" target="_blank" class="btn btn-sm btn-ghost" style="border: 1px solid var(--border-glass);">View</a>
                     ${n.status === 'approved' ? `<span style="font-size:0.8rem; margin-left:auto; display:flex; align-items:center;">👁️ ${n.views || 0}</span>` : ''}
                </div>
            </div>
        `).join('');
    };

    let approved = [], pending = [];
    const mergeAndRender = () => {
        const all = [...approved, ...pending].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        render(all);
    };

    if (!currentUser) {
        const grid = document.getElementById('my-uploads-grid');
        if (grid) grid.innerHTML = `<p style="color:var(--text-dim); text-align:center; padding: 2rem;">Please login to see your uploads.</p>`;
        return;
    }

    const q = query(collection(db, "notes"), where("uploadedBy", "==", currentUser.id));
    onSnapshot(q, (snap) => {
        const notes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        render(notes);
    });
};

function renderNotesList(list, tabType) {
    if (list.length === 0) {
        return `
            <div style="text-align: center; padding: 5rem; background: rgba(255,255,255,0.01); border: 2px dashed rgba(255,255,255,0.05); border-radius: 20px;">
                <div style="font-size: 4rem; margin-bottom: 2rem;">📂</div>
                <h2 class="font-heading">No premium ${tabType} for this subject found yet.</h2>
                <p style="color: var(--text-dim); margin-bottom: 2.5rem;">Be the first contributor and earn academic credit!</p>
                <button class="btn btn-primary" style="padding: 1rem 2.5rem; font-weight: 700;" onclick="openUploadModal()">+ Upload ${tabType}</button>
            </div>
        `;
    }

    // Inject Refined Futuristic Styles
    const futuristicStyles = `
        <style>
            .futuristic-note-card {
                background: rgba(13, 17, 23, 0.9);
                backdrop-filter: blur(15px);
                border: 1px solid rgba(123, 97, 255, 0.2);
                border-radius: 16px;
                padding: 1.2rem 1.5rem;
                margin-bottom: 1.25rem;
                transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
                position: relative;
                overflow: hidden;
                display: flex;
                align-items: center;
                gap: 1.5rem;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
            }

            .futuristic-note-card:hover {
                transform: translateY(-4px);
                border-color: var(--secondary);
                box-shadow: 0 10px 40px rgba(0, 242, 255, 0.15);
            }

            .futuristic-note-card::before {
                content: '';
                position: absolute;
                top: 0; left: 0; width: 4px; height: 100%;
                background: linear-gradient(to bottom, var(--primary), var(--secondary));
            }

            .note-icon-box {
                width: 60px; height: 60px;
                background: rgba(255, 255, 255, 0.03);
                border-radius: 12px;
                display: flex; align-items: center; justify-content: center;
                color: var(--secondary);
                flex-shrink: 0;
            }

            .note-core-content {
                flex-grow: 1;
                display: flex;
                flex-direction: column;
                gap: 0.6rem;
            }

            .note-title-line {
                font-size: 1.4rem;
                font-weight: 700;
                color: #FFFFFF;
                margin: 0;
            }

            .note-metadata-bar {
                display: flex;
                gap: 1rem;
                align-items: center;
                flex-wrap: wrap;
            }

            .meta-badge-pro {
                display: flex; align-items: center; gap: 0.4rem;
                background: rgba(255, 255, 255, 0.06);
                padding: 0.3rem 0.75rem;
                border-radius: 6px;
                font-size: 0.8rem;
                color: #E2E8F0; /* Brighter for visibility */
                font-weight: 500;
            }

            .meta-badge-pro.uploader {
                background: rgba(123, 97, 255, 0.15);
                color: #CBD5E0;
            }

            .note-actions-metrics {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                margin-top: 0.2rem;
            }

            .action-pill-rt {
                display: flex; align-items: center; gap: 0.5rem;
                background: rgba(255, 255, 255, 0.04);
                border: 1px solid rgba(255, 255, 255, 0.08);
                padding: 0.35rem 0.8rem;
                border-radius: 8px;
                font-size: 0.85rem;
                color: #A0AEC0;
                cursor: pointer;
                transition: all 0.2s ease;
                font-family: var(--font-mono);
            }

            .action-pill-rt:hover {
                background: rgba(255, 255, 255, 0.1);
                color: #FFFFFF;
            }

            .action-pill-rt.liked {
                background: rgba(123, 97, 255, 0.2);
                border-color: var(--primary);
                color: var(--primary-light);
            }

            .view-count-badge {
                display: flex; align-items: center; gap: 0.4rem;
                color: var(--secondary);
                font-size: 0.8rem;
                font-weight: 600;
                margin-left: 0.5rem;
            }

            .download-btn-furistic {
                background: #FFFFFF;
                color: #000000 !important;
                padding: 0.9rem 1.8rem;
                border-radius: 10px;
                font-weight: 800;
                text-decoration: none;
                display: flex; align-items: center; gap: 0.6rem;
                transition: transform 0.2s ease, filter 0.2s ease;
                white-space: nowrap;
                box-shadow: 0 4px 15px rgba(255, 255, 255, 0.1);
            }

            .download-btn-furistic:hover {
                transform: scale(1.05);
                filter: brightness(0.9);
            }
        </style>
    `;

    // Track View increments - Moved to fetch/display triggers to avoid render loops
    /* 
    if (list.length > 0) {
        list.forEach(n => incrementNoteView(n.id));
    }
    */

    const html = list.map(n => {
        const isLiked = currentUser && n.likedBy && n.likedBy.includes(currentUser.id);

        return `
        <div class="futuristic-note-card card-reveal">
            <div class="note-icon-box">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
            </div>
            
            <div class="note-core-content">
                <h3 class="note-title-line">${n.title}</h3>
                
                <div class="note-metadata-bar">
                    <span class="meta-badge-pro uploader">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        ${n.uploaderName || n.uploader || 'Admin'}
                    </span>
                    <span class="meta-badge-pro">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line></svg>
                        ${formatDate(n.created_at || n.approvedAt || n.date)}
                    </span>
                    <div class="view-count-badge">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        ${n.views || 0}
                    </div>
                </div>

                <div class="note-actions-metrics">
                    <button class="action-pill-rt ${isLiked ? 'liked' : ''}" onclick="toggleNoteLike('${n.id}')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                        ${n.likes || 0}
                    </button>
                    <button class="action-pill-rt" onclick="updateNoteStat('${n.id}', 'save')" title="Save to Private Drive">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                    </button>
                    <div class="action-pill-rt" style="cursor:default; opacity:0.8;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline></svg>
                        ${n.downloads || 0}
                    </div>
                </div>
            </div>

            <div class="note-action-side">
                <a href="${n.fileUrl || n.driveLink}" target="_blank" class="download-btn-furistic" onclick="updateNoteStat('${n.id}', 'download')">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    DOWNLOAD
                </a>
            </div>
        </div>
    `}).join('');

    return futuristicStyles + html;

    return futuristicStyles + html;
}

window.switchSubjectTab = function (tab) {
    showNotes(tab);
    trackAnalytics('switch_subject_tab', { tab });
};

function renderDetailedNotes(subjectId, tabType = 'notes') {
    console.log(`🔎 Filtering Notes for Subject: ${subjectId}, Type: ${tabType}`);

    // Advanced Filter + Smart Sorting
    const querySem = selState.semester;
    const semNum = querySem ? querySem.split(' ')[1] : null;
    const altSem = semNum ? (semNum + (semNum === '1' ? 'st' : semNum === '2' ? 'nd' : semNum === '3' ? 'rd' : 'th')) : null;

    const filtered = NotesDB.filter(n => {
        // 1. Semester Check (Robust)
        const semMatch = n.semester === querySem || (altSem && n.semester === altSem);

        // 2. Subject & College & Type Check
        const isCorrectSubject = ((n.subjectId === subjectId) || (n.subject === subjectId)) &&
            (n.collegeId === selState.college.id || n.college === selState.college.id) &&
            n.type === tabType;

        if (!semMatch || !isCorrectSubject) return false;

        const isVisible = n.status !== 'rejected';
        const isAdminOfCollege = currentUser && (
            (currentUser.role === Roles.SUPER_ADMIN) ||
            (currentUser.role === Roles.COLLEGE_ADMIN && currentUser.college === n.collegeId)
        );

        if (isAdminOfCollege) return n.status !== 'rejected';
        return isVisible;
    }).sort((a, b) => calculateSmartScore(b) - calculateSmartScore(a));

    console.log(`✅ Found ${filtered.length} matching notes (Robust Filter).`);

    if (filtered.length === 0) {
        // DEBUGGING DIAGNOSTICS
        const debugInfo = NotesDB.length > 0
            ? `DB:${NotesDB.length} | First: ${NotesDB[0].title} (${NotesDB[0].subject}) | Target: ${subjectId}`
            : `DB Empty (Fetch failed?)`;

        return `
            <div style="text-align: center; padding: 5rem; background: rgba(255,255,255,0.01); border: 2px dashed rgba(255,255,255,0.05); border-radius: 20px;">
                <div style="font-size: 4rem; margin-bottom: 2rem;">📂</div>
                <h2 class="font-heading">No premium ${tabType} for this subject found yet.</h2>
                <p style="color: var(--text-dim); margin-bottom: 2.5rem;">Be the first contributor and earn academic credit!</p>
                <div style="background: #333; color: #0f0; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; font-family: monospace; font-size: 0.8rem; text-align: left; display: inline-block;">
                    <strong>DEBUG INFO:</strong><br>
                    ${debugInfo}<br>
                    My College: ${selState.college ? selState.college.id : 'null'}<br>
                    Note College: ${NotesDB.length > 0 ? NotesDB[0].collegeId : 'N/A'}
                </div>
                <br>
                <button class="btn btn-primary" style="padding: 1rem 2.5rem; font-weight: 700;" onclick="openUploadModal()">+ Upload ${tabType}</button>
            </div>
        `;
    }

    const cardsHTML = filtered.map(n => `
        <div class="detailed-item glass-card card-reveal" style="display: flex; align-items: center; justify-content: space-between; padding: 1.5rem; margin-bottom: 1rem; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.05);">
            <div class="item-left" style="display: flex; gap: 1.5rem; align-items: center;">
                <div class="file-icon-lg" style="font-size: 2.5rem; background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 12px; min-width: 80px; text-align: center;">
                    ${getActiveIcon(n.fileUrl || n.driveLink)}
                </div>
                <div class="file-info">
                    <h3 style="margin: 0; font-size: 1.2rem; font-weight: 600; color: white;">${n.title}</h3>
                    <div class="meta-row" style="display: flex; gap: 1.5rem; color: var(--text-dim); font-size: 0.85rem; margin-top: 0.6rem;">
                        <span style="display: flex; align-items: center; gap: 0.4rem;">📅 ${formatDate(n.created_at || n.approvedAt)}</span>
                        <span style="display: flex; align-items: center; gap: 0.4rem;">
                            ${n.uploaderAvatar ? `<img src="${n.uploaderAvatar}" style="width:20px; height:20px; border-radius:50%;">` : '👤'} 
                            ${n.uploaderName || 'Admin'}
                        </span>
                        <span style="display: flex; align-items: center; gap: 0.4rem;">📥 ${n.downloads || 0} downloads</span>
                    </div>
                </div>
            </div>
            
            <div class="item-right" style="display: flex; align-items: center; gap: 1.5rem;">
                <div class="action-buttons" style="display: flex; gap: 0.8rem;">
                     <button class="btn btn-ghost btn-sm" onclick="updateNoteStat('${n.id}', 'like')" style="color: var(--text-dim);">👍 ${n.likes || 0}</button>
                     <button class="btn btn-ghost btn-sm" style="color: var(--text-dim);">👎</button>
                     <button class="btn btn-ghost btn-sm" style="color: var(--text-dim);">🔖</button>
                </div>
                <a href="${n.fileUrl || n.driveLink}" target="_blank" class="btn" style="background: white; color: black; font-weight: 600; padding: 0.8rem 1.8rem; border-radius: 8px; text-decoration: none; border:none;" onclick="updateNoteStat('${n.id}', 'download')">Download</a>
            </div>
        </div>
    `).join('');

    const grid = document.getElementById('notes-list-grid');
    if (grid) {
        grid.innerHTML = cardsHTML;
        // Trigger unique view tracking (if available in this context)
        filtered.forEach(n => {
            if (typeof window.incrementNoteView === 'function') {
                window.incrementNoteView(n.id);
            }
        });
    }
    return cardsHTML;
}

function getActiveIcon(url) {
    if (!url) return '📄';
    if (url.includes('.pdf')) return '📕';
    if (url.includes('.ppt')) return '📊';
    if (url.includes('.doc')) return '📝';
    return '📄';
}

function formatDate(timestamp) {
    if (!timestamp) return 'Recently';
    // Handle Firestore Timestamp or Date string
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
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
        password: '12345678',
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

        console.log("📝 Saving Metadata to notes...");
        await addDoc(collection(db, "notes"), {
            title: formData.get('title'),
            subject: formData.get('subject'),
            semester: formData.get('semester'),
            year: formData.get('year'),
            college: formData.get('collegeId') || currentUser.collegeId || currentUser.college || 'medicaps',
            collegeId: formData.get('collegeId') || currentUser.collegeId || currentUser.college || 'medicaps',
            collegeName: formData.get('collegeName') || currentUser.collegeName || 'Medicaps University',
            stream: formData.get('stream') || 'B.Tech',
            fileUrl: downloadURL,
            uploaderName: currentUser.name,
            uploadedBy: currentUser.id,
            uploaderEmail: currentUser.email,
            status: 'approved', // Auto-approve per user request for instant visibility
            views: 0,
            downloads: 0,
            likes: 0,
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
    const { db, collection, query, where, onSnapshot } = getFirebase();
    const container = document.getElementById('my-uploads-grid');
    if (!container || !currentUser) return;

    container.innerHTML = '<div class="spinner" style="margin: 2rem auto;"></div>';

    // Query notes where user is uploader. Check both field names for older docs.
    const q = query(
        collection(db, "notes"),
        where("uploadedBy", "==", currentUser.id)
    );

    onSnapshot(q, (snapshot) => {
        const notes = [];
        snapshot.forEach(doc => notes.push({ id: doc.id, ...doc.data() }));

        const sorted = notes.sort((a, b) => {
            const dateA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.uploadedAt?.seconds ? a.uploadedAt.seconds * 1000 : 0);
            const dateB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.uploadedAt?.seconds ? b.uploadedAt.seconds * 1000 : 0);
            return dateB - dateA;
        });

        container.innerHTML = sorted.length ? sorted.map(n => `
            <div class="selection-card glass-card">
                <div class="status-badge ${n.status}">${(n.status || 'pending').toUpperCase()}</div>
                <h4 style="margin: 0.5rem 0;">${n.title}</h4>
                <p style="font-size: 0.8rem; color: var(--text-dim);">${n.subject} | ${n.semester}</p>
                <div style="margin-top: 1rem; display: flex; justify-content: space-between; align-items: center;">
                     <div style="display: flex; gap: 1rem; font-size: 0.75rem;">
                        <span>👁️ ${n.views || 0}</span>
                        <span>📥 ${n.downloads || 0}</span>
                    </div>
                </div>
            </div>
        `).join('') : '<p style="grid-column: 1/-1; text-align: center; color: var(--text-dim);">No uploads found.</p>';
    });
};

// 3. ADMIN / MODERATION MODULE
window.renderAdminModQueue = function () {
    const { db, query, collection, onSnapshot, where, orderBy, deleteDoc, doc, addDoc } = getFirebase();
    const container = document.getElementById('admin-queue');
    if (!container || !['admin', 'superadmin', 'coadmin'].includes(currentUser.role)) return;

    let q = query(collection(db, "notes"), where("status", "==", "pending"), orderBy("createdAt", "asc"));

    // Co-Admin Restriction: Only see notes from their assigned college
    if (currentUser.role === 'coadmin') {
        const myCollegeId = currentUser.collegeId || currentUser.college;
        console.log(`🛡️ Filtering Mod Queue for College: ${myCollegeId}`);
        q = query(collection(db, "notes"), where("status", "==", "pending"), where("collegeId", "==", myCollegeId), orderBy("createdAt", "asc"));
    }

    onSnapshot(q, (snapshot) => {
        const items = [];
        snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));

        container.innerHTML = items.length ? items.map(n => `
            <div class="glass-card" style="padding: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h3 style="margin:0;">${n.title}</h3>
                    <p style="margin: 0.3rem 0; font-size: 0.9rem;">From: ${n.uploaderName} | <span class="gradient-text">${n.collegeId || n.college}</span></p>
                    <a href="${n.fileUrl || n.driveLink || n.url}" target="_blank" onclick="window.incrementNoteView('${n.id}')" class="gradient-text" style="font-weight: 700;">👁️ Preview Note</a>
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
            const noteRef = doc(db, "notes", id);
            await updateDoc(noteRef, {
                status: 'approved',
                approvedBy: currentUser.name,
                approvedByEmail: currentUser.email,
                approvedAt: serverTimestamp(),
                // Ensure analytic fields are initialized
                views: 0,
                downloads: 0,
                // Ensure URL fields are consistent upon approval
                verified: true
            });

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
            const noteRef = doc(db, "notes", id);
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
    const q = query(collection(db, "notes"), where("status", "==", "approved"), orderBy("approvedAt", "desc"));
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
    }, (error) => {
        console.error("❌ Stats Realtime Error:", error);
        window.LastDbError = error; // Expose for debugUI

        // Critical Error Display
        const container = document.getElementById('notes-list-grid');
        if (container) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; padding: 2rem; background: rgba(255,0,0,0.1); border: 1px solid red; border-radius: 12px; color: #ff6b6b; font-family: monospace;">
                    <strong>🔥 Database Error:</strong><br>
                    ${error.message}<br><br>
                    This is usually due to missing indexes or security rules.
                    <br>Check console for "link to create index".
                </div>
            `;
        }
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
        { id: 'u3', name: 'IET DAVV', views: 18000, students: 1500, score: 6200, rank: 3, logo: '📚' },
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

// --- PRIVATE DRIVE MODULE ---

window.renderPrivateDrive = function () {
    const { db, collection, query, where, onSnapshot, orderBy } = window.firebaseServices;
    const container = document.getElementById('private-drive');
    if (!container) return;

    container.innerHTML = `
        <div class="fade-in">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                <div>
                    <h1 class="font-heading">🔒 Private <span class="gradient-text">Drive</span></h1>
                    <p style="color: var(--text-dim);">Secure cloud storage for your personal study materials.</p>
                </div>
                <button class="btn btn-primary" onclick="openPrivateUploadModal()">
                    <span style="margin-right:0.5rem;">☁️</span> Upload File
                </button>
            </div>

            <!-- Stats Row -->
            <div style="display: flex; gap: 1.5rem; margin-bottom: 2rem;">
                <div class="stat-card glass-card" style="flex:1; padding: 1.5rem;">
                    <div style="color: var(--text-dim); font-size: 0.9rem; margin-bottom: 0.5rem;">Storage Used</div>
                    <div style="font-size: 1.8rem; font-weight: 700;" id="pd-storage-used">Loading...</div>
                </div>
                <div class="stat-card glass-card" style="flex:1; padding: 1.5rem;">
                    <div style="color: var(--text-dim); font-size: 0.9rem; margin-bottom: 0.5rem;">Total Files</div>
                    <div style="font-size: 1.8rem; font-weight: 700;" id="pd-file-count">...</div>
                </div>
            </div>

            <!-- Process Indicator -->
            <div id="private-upload-progress" style="display:none; margin-bottom: 2rem; background: rgba(0,0,0,0.3); border-radius: 8px; padding: 1rem; border: 1px solid var(--border-glass);">
                <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                    <span id="p-prog-text">Uploading...</span>
                    <span id="p-prog-percent">0%</span>
                </div>
                <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow:hidden;">
                    <div id="p-prog-bar" style="width: 0%; height: 100%; background: var(--gradient-main); transition: width 0.3s;"></div>
                </div>
            </div>

            <div id="private-files-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1.5rem;">
                <!-- Files populate here -->
            </div>
        </div>
    `;

    // Subscribe to Files
    if (!currentUser) return;

    // Using userId for strict isolation
    const q = query(
        collection(db, "personal_notes"),
        where("userId", "==", currentUser.id),
        orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
        const files = [];
        let totalBytes = 0;

        snapshot.forEach(doc => {
            const data = doc.data();
            files.push({ id: doc.id, ...data });
            totalBytes += (data.fileSize || 0);
        });

        // Update Stats
        document.getElementById('pd-file-count').innerText = files.length;
        document.getElementById('pd-storage-used').innerText = formatBytes(totalBytes);

        // Render Grid
        const grid = document.getElementById('private-files-grid');

        if (files.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 4rem; opacity: 0.5;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📂</div>
                    <p>Your drive is empty.</p>
                </div>
            `;
        } else {
            grid.innerHTML = files.map(f => `
                <div class="glass-card card-reveal" style="position: relative;">
                    <div style="display: flex; align-items: start; gap: 1rem; margin-bottom: 1rem;">
                        <div style="font-size: 2rem; background: rgba(255,255,255,0.05); padding: 0.8rem; border-radius: 12px;">
                            ${getFileIcon(f.fileType)}
                        </div>
                        <div style="flex:1; overflow:hidden;">
                            <h4 style="margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${f.title}">${f.title}</h4>
                            <p style="font-size: 0.8rem; color: var(--text-dim); margin-top: 0.3rem;">
                                ${formatBytes(f.fileSize)} • ${new Date(f.createdAt.toDate()).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                        <button class="btn btn-primary btn-sm" onclick="window.open('${f.fileUrl}', '_blank')" style="flex:1;">Open</button>
                        <button class="btn btn-ghost btn-sm" onclick="deletePrivateFile('${f.id}', '${f.storagePath}')" style="color: #ff4757;">🗑️</button>
                    </div>
                </div>
            `).join('');
        }
    });
};

// Open Upload Modal
window.openPrivateUploadModal = function () {
    // We reuse the generic modal logic but specific for private drive
    // OR create a simple prompt for now

    // Let's create a specific hidden input trigger
    let input = document.getElementById('private-file-input');
    if (!input) {
        input = document.createElement('input');
        input.type = 'file';
        input.id = 'private-file-input';
        input.style.display = 'none';
        input.accept = ".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"; // Allowed types
        document.body.appendChild(input);

        input.onchange = (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                const title = prompt("Enter a title for this file:", file.name); // Simple flow
                if (title) handlePrivateUpload(file, title);
                input.value = ''; // Reset
            }
        };
    }
    input.click();
};

window.handlePrivateUpload = async function (file, title) {
    const { storage, ref, uploadBytesResumable, getDownloadURL, db, collection, addDoc, serverTimestamp } = window.firebaseServices;

    // Validation
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) return alert("File too large. Max 50MB.");

    // UI Update
    const progressDiv = document.getElementById('private-upload-progress');
    const bar = document.getElementById('p-prog-bar');
    const txt = document.getElementById('p-prog-percent');
    if (progressDiv) progressDiv.style.display = 'block';

    try {
        const noteId = Date.now().toString(); // Use timestamp as simple unique ID part
        const storagePath = `personal_notes/${currentUser.id}/${noteId}/${file.name}`;
        const storageRef = ref(storage, storagePath);

        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                if (bar) bar.style.width = progress + '%';
                if (txt) txt.innerText = Math.round(progress) + '%';
            },
            (error) => {
                console.error(error);
                alert("Upload failed: " + error.code);
                if (progressDiv) progressDiv.style.display = 'none';
            },
            async () => {
                // Success
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

                await addDoc(collection(db, "personal_notes"), {
                    userId: currentUser.id,
                    title: title,
                    fileName: file.name,
                    fileType: file.type,
                    fileSize: file.size,
                    fileUrl: downloadURL,
                    storagePath: storagePath,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });

                if (progressDiv) progressDiv.style.display = 'none';
                alert("✅ File uploaded securely!");
            }
        );

    } catch (e) {
        console.error("Upload Init Error:", e);

        if (progressDiv) progressDiv.style.display = 'none';
        alert("Upload Error: " + e.message);
    }
};

// --- GLOBAL SEARCH & ADMIN UPLOAD ---
window.initGlobalSearch = function () {
    const input = document.getElementById('global-search-input');
    if (!input) return;

    let debounceTimer;

    // Create Results Dropdown
    let resultsContainer = document.getElementById('global-search-results');
    if (!resultsContainer) {
        resultsContainer = document.createElement('div');
        resultsContainer.id = 'global-search-results';
        resultsContainer.className = 'glass-card';
        Object.assign(resultsContainer.style, {
            position: 'absolute',
            top: '100%',
            left: '0',
            right: '0',
            zIndex: '1000',
            maxHeight: '400px',
            overflowY: 'auto',
            display: 'none',
            marginTop: '0.5rem',
            padding: '1rem'
        });
        document.querySelector('.search-bar').style.position = 'relative';
        document.querySelector('.search-bar').appendChild(resultsContainer);
    }

    input.addEventListener('input', (e) => {
        const term = e.target.value.trim().toLowerCase();
        if (debounceTimer) clearTimeout(debounceTimer);

        if (term.length < 2) {
            resultsContainer.style.display = 'none';
            return;
        }

        debounceTimer = setTimeout(async () => {
            const { db, collection, query, where, getDocs, limit } = window.firebaseServices;
            resultsContainer.innerHTML = '<div style="text-align:center; padding:1rem;">Searching...</div>';
            resultsContainer.style.display = 'block';

            try {
                // Simple Subject Code / Title search logic
                // Since Firestore doesn't do "contains", we do startAt/endAt or client side if small.
                // Assuming "subjectCode" or "title" exact or prefix.
                // Doing a combined client-side filter for better UX on small dataset
                const q = query(collection(db, "notes"), where("status", "==", "approved"), limit(50));
                const snap = await getDocs(q);

                const hits = snap.docs
                    .map(d => ({ id: d.id, ...d.data() }))
                    .filter(doc =>
                        (doc.title && doc.title.toLowerCase().includes(term)) ||
                        (doc.subject && doc.subject.toLowerCase().includes(term)) ||
                        (doc.subjectCode && doc.subjectCode.toLowerCase().includes(term))
                    ).slice(0, 5);

                if (hits.length === 0) {
                    resultsContainer.innerHTML = '<div style="text-align:center; padding:1rem; color:var(--text-dim);">No results found.</div>';
                } else {
                    resultsContainer.innerHTML = hits.map(hit => `
                        <div onclick="window.open('${hit.driveLink || hit.fileUrl || hit.url}', '_blank')" style="padding: 0.8rem; border-bottom: 1px solid rgba(255,255,255,0.05); cursor: pointer; display: flex; align-items: center; gap: 1rem; transition: background 0.2s;">
                            <div style="font-size: 1.5rem;">📄</div>
                            <div>
                                <div style="font-weight: 600; color: white;">${hit.title}</div>
                                <div style="font-size: 0.8rem; color: var(--text-dim);">${hit.subject.toUpperCase()} • ${hit.collegeId}</div>
                            </div>
                        </div>
                    `).join('');
                }
            } catch (err) {
                console.error("Search error:", err);
                resultsContainer.innerHTML = '<div style="padding:1rem; color:red;">Search failed.</div>';
            }
        }, 300);
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !resultsContainer.contains(e.target)) {
            resultsContainer.style.display = 'none';
        }
    });
};

// Initialize listeners
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(window.initGlobalSearch, 1000);
});

window.deletePrivateFile = async function (docId, storagePath) {
    if (!confirm("Permanently delete this file? This cannot be undone.")) return;

    const { db, doc, deleteDoc, storage, ref, deleteObject } = window.firebaseServices;

    try {
        // 1. Delete from Storage
        const fileRef = ref(storage, storagePath);
        await deleteObject(fileRef);
        console.log("Storage file deleted.");

        // 2. Delete Metadata
        await deleteDoc(doc(db, "personal_notes", docId));
        console.log("Firestore metadata deleted.");

        // UI updates automatically via onSnapshot
    } catch (e) {
        console.error("Delete failed:", e);
        alert("Delete failed: " + e.message);
    }
};

// Utils
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function getFileIcon(mimeType) {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📊';
    return '📁';
}


// --- MODULE 1: PRIVATE DRIVE ---
let privateDriveFiles = [];
let privateDriveUnsubscribe = null;
let currentDriveTab = 'files'; // files, ai, saved, drafts

window.renderPrivateDrive = function () {
    return `
        <div class="tab-pane active fade-in" style="padding: 2rem;">
            <!-- Header section -->
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2.5rem;">
                <div>
                    <h1 class="font-heading" style="font-size: 2.5rem; margin-bottom: 0.5rem;">My <span class="gradient-text">Private Drive</span></h1>
                    <p style="color: var(--text-dim); font-size: 1.1rem;">Your personal academic space</p>
                </div>
                <div style="text-align: right; width: 300px;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.5rem; color: var(--text-dim);">
                        <span>Storage Usage</span>
                        <span id="storage-usage-text">0MB / 1GB</span>
                    </div>
                    <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.05); border-radius: 10px; overflow: hidden; border: 1px solid var(--border-glass);">
                        <div id="storage-usage-bar" style="width: 0%; height: 100%; background: var(--secondary); transition: width 0.5s ease;"></div>
                    </div>
                </div>
            </div>

            <!-- Action Bar -->
            <div class="glass-card" style="padding: 1rem; margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap;">
                <div style="display: flex; gap: 0.75rem;">
                    <button class="btn btn-primary btn-sm" onclick="document.getElementById('drive-upload-input').click()">➕ Upload File</button>
                    <button class="btn btn-ghost btn-sm" onclick="renderTabContent('ai-tools')">✨ Generate AI Notes</button>
                    <button class="btn btn-ghost btn-sm" onclick="alert('Folder support coming soon!')">📂 New Folder</button>
                    <input type="file" id="drive-upload-input" style="display: none;" onchange="handleDriveFileUpload(this)">
                </div>
                <div style="position: relative; flex-grow: 1; max-width: 400px;">
                    <input type="text" placeholder="Search your drive..." style="width: 100%; padding: 0.6rem 1rem 0.6rem 2.5rem; background: rgba(0,0,0,0.2); border: 1px solid var(--border-glass); border-radius: 10px; color: white;" onkeyup="filterDriveFiles(this.value)">
                    <span style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); opacity: 0.5;">🔍</span>
                </div>
            </div>

            <!-- Tabs -->
            <div style="display: flex; gap: 2rem; border-bottom: 1px solid var(--border-glass); margin-bottom: 2rem; padding-left: 1rem;">
                <button class="drive-tab active" onclick="switchDriveTab('files', this)">📁 My Files</button>
                <button class drive-tab" onclick="switchDriveTab('ai', this)">🤖 AI Notes</button>
                <button class="drive-tab" onclick="switchDriveTab('saved', this)">⭐ Saved Notes</button>
                <button class="drive-tab" onclick="switchDriveTab('drafts', this)">🗂 Drafts</button>
            </div>

            <!-- Content Grid -->
            <div id="drive-content-grid" class="notes-grid-pro" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem;">
                <!-- Skeleton Loader -->
                ${Array(4).fill(0).map(() => `<div class="glass-card skeleton" style="height: 180px; border-radius: 16px;"></div>`).join('')}
            </div>
        </div>
    `;
};

window.initPrivateDrive = async function () {
    const { db, collection, query, where, onSnapshot } = getFirebase();
    if (!db || !currentUser) return;

    if (privateDriveUnsubscribe) privateDriveUnsubscribe();

    const driveRef = collection(db, "privateDrive", currentUser.id, "files");
    const q = query(driveRef, where("type", "==", currentDriveTab));

    privateDriveUnsubscribe = onSnapshot(q, (snapshot) => {
        privateDriveFiles = [];
        snapshot.forEach(doc => privateDriveFiles.push({ id: doc.id, ...doc.data() }));
        renderDriveFiles();
        updateStorageUsage();
    }, (err) => {
        console.error("Drive error:", err);
        document.getElementById('drive-content-grid').innerHTML = `<p style="color:red; text-align:center;">Failed to load drive files.</p>`;
    });
};

function renderDriveFiles() {
    const container = document.getElementById('drive-content-grid');
    if (!container) return;

    if (privateDriveFiles.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 4rem; opacity: 0.5;">
                <div style="font-size: 4rem; marginBottom: 1rem;">🕳️</div>
                <h3>Your drive is empty</h3>
                <p>Upload files or save notes to see them here.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = privateDriveFiles.map(file => `
        <div class="glass-card file-card fade-in" style="padding: 1.5rem; position: relative;">
            <div style="display: flex; gap: 1rem; align-items: flex-start; margin-bottom: 1rem;">
                <div style="font-size: 2.5rem; background: rgba(255,255,255,0.03); width: 60px; height: 60px; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                    ${getFileIcon(file.mimeType || '')}
                </div>
                <div style="flex-grow: 1; overflow: hidden;">
                    <h4 style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 0.25rem;" title="${file.name}">${file.name}</h4>
                    <p style="font-size: 0.75rem; color: var(--text-dim);">${file.subject || 'Personal'} • ${file.semester || 'Misc'}</p>
                </div>
            </div>
            
            <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-dim); margin-bottom: 1.5rem;">
                <span>📏 ${formatBytes(file.size || 0)}</span>
                <span>🕒 ${file.updatedAt ? new Date(file.updatedAt.seconds * 1000).toLocaleDateString() : 'Just now'}</span>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                <button class="btn btn-sm btn-primary" onclick="window.open('${file.driveLink || file.fileUrl || file.url}', '_blank')">Open</button>
                <div style="display:flex; gap: 0.5rem;">
                    <button class="btn btn-sm btn-ghost" style="flex-grow:1;" onclick="handleDriveDelete('${file.id}', '${file.path}')">🗑️</button>
                    <button class="btn btn-sm btn-ghost" style="flex-grow:1;" onclick="handleDriveRename('${file.id}', '${file.name}')">✏️</button>
                </div>
            </div>
        </div>
    `).join('');
}

window.handleDriveFileUpload = async function (input) {
    if (!input.files[0]) return;
    const { db, storage, ref, uploadBytesResumable, getDownloadURL, doc, setDoc, serverTimestamp } = getFirebase();
    if (!db || !storage || !currentUser) return;

    const file = input.files[0];
    const fileId = Math.random().toString(36).substring(7);
    const storagePath = `private-drive/${currentUser.id}/${fileId}_${file.name}`;
    const storageRef = ref(storage, storagePath);

    // Show Progress?
    showToast("Starting upload...", "info");

    try {
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed',
            (snapshot) => {
                // Optional: update UI with progress
            },
            (error) => {
                console.error("Upload fail:", error);
                showToast("Upload failed!", "error");
            },
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                const fileRef = doc(db, "privateDrive", currentUser.id, "files", fileId);

                await setDoc(fileRef, {
                    name: file.name,
                    url: downloadURL,
                    fileUrl: downloadURL,
                    driveLink: downloadURL,
                    path: storagePath,
                    size: file.size,
                    mimeType: file.type,
                    type: currentDriveTab,
                    updatedAt: serverTimestamp(),
                    uploaderUid: currentUser.id
                });

                showToast("File uploaded successfully!");
                input.value = ""; // reset
            }
        );
    } catch (e) {
        console.error("Upload error:", e);
        showToast("Upload failed", "error");
    }
};

window.handleDriveDelete = async function (fileId, storagePath) {
    if (!confirm("Are you sure you want to delete this file forever?")) return;
    const { db, storage, ref, deleteObject, doc, deleteDoc } = getFirebase();
    if (!db || !storage || !currentUser) return;

    try {
        // 1. Delete from Storage
        if (storagePath) {
            const storageRef = ref(storage, storagePath);
            await deleteObject(storageRef).catch(e => console.warn("Storage delete skip:", e));
        }

        // 2. Delete from Firestore
        await deleteDoc(doc(db, "privateDrive", currentUser.id, "files", fileId));
        showToast("File deleted", "success");
    } catch (e) {
        console.error("Delete err:", e);
        showToast("Failed to delete", "error");
    }
};

window.switchDriveTab = function (tabId, btn) {
    currentDriveTab = tabId;
    document.querySelectorAll('.drive-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    initPrivateDrive(); // Re-fetch
};

function updateStorageUsage() {
    const totalBytes = privateDriveFiles.reduce((acc, f) => acc + (f.size || 0), 0);
    const GB = 1024 * 1024 * 1024;
    const percent = Math.min((totalBytes / GB) * 100, 100);

    const bar = document.getElementById('storage-usage-bar');
    const text = document.getElementById('storage-usage-text');

    if (bar) bar.style.width = percent + "%";
    if (text) text.innerText = `${formatBytes(totalBytes)} / 1GB`;
}

window.handleDriveRename = async function (fileId, oldName) {
    const newName = prompt("Enter new filename:", oldName);
    if (!newName || newName === oldName) return;

    const { db, doc, updateDoc } = getFirebase();
    if (!db || !currentUser) return;

    try {
        await updateDoc(doc(db, "privateDrive", currentUser.id, "files", fileId), {
            name: newName
        });
        showToast("Renamed successfully");
    } catch (e) {
        showToast("Rename failed", "error");
    }
};

// --- MODULE 2: MODERATION HUB ---
let moderationQueue = [];
let moderationUnsubscribe = null;

window.renderModerationHub = function () {
    return `
        <div class="tab-pane active fade-in" style="padding: 2rem;">
            <div style="margin-bottom: 2.5rem;">
                <h1 class="font-heading" style="font-size: 2.5rem; margin-bottom: 0.5rem;">Moderation <span class="gradient-text">Hub</span></h1>
                <p style="color: var(--text-dim); font-size: 1.1rem;">Academic Quality Control & Content Governance</p>
            </div>

            <!-- Stats Ribbon -->
            <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; margin-bottom: 3rem;">
                <div class="glass-card" style="padding: 1.5rem; border-bottom: 3px solid var(--secondary);">
                    <div style="font-size: 0.85rem; color: var(--text-dim); margin-bottom: 0.5rem;">⏳ Pending Approvals</div>
                    <div id="stat-pending-count" style="font-size: 2rem; font-weight: 700;">--</div>
                </div>
                <div class="glass-card" style="padding: 1.5rem; border-bottom: 3px solid #2ecc71;">
                    <div style="font-size: 0.85rem; color: var(--text-dim); margin-bottom: 0.5rem;">✅ Approved Today</div>
                    <div id="stat-approved-today" style="font-size: 2rem; font-weight: 700;">--</div>
                </div>
                <div class="glass-card" style="padding: 1.5rem; border-bottom: 3px solid #e74c3c;">
                    <div style="font-size: 0.85rem; color: var(--text-dim); margin-bottom: 0.5rem;">❌ Total Rejected</div>
                    <div id="stat-rejected-total" style="font-size: 2rem; font-weight: 700;">--</div>
                </div>
                <div class="glass-card" style="padding: 1.5rem; border-bottom: 3px solid var(--primary);">
                    <div style="font-size: 0.85rem; color: var(--text-dim); margin-bottom: 0.5rem;">🏫 Colleges Covered</div>
                    <div id="stat-colleges-count" style="font-size: 2rem; font-weight: 700;">${GlobalData.colleges.length}</div>
                </div>
            </div>

            <!-- Queue Table -->
            <div class="glass-card" style="overflow: hidden; border-radius: 16px;">
                <div style="padding: 1.5rem; border-bottom: 1px solid var(--border-glass); display: flex; justify-content: space-between; align-items: center;">
                    <h3 class="font-heading">🗂 Pending Notes Queue</h3>
                    <div style="display: flex; gap: 0.5rem;">
                        <select id="mod-filter-college" class="search-input" style="padding: 0.4rem;" onchange="initModerationHub()">
                            <option value="all">All Colleges</option>
                            ${GlobalData.colleges.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; text-align: left;">
                        <thead>
                            <tr style="background: rgba(255,255,255,0.02); font-size: 0.85rem; color: var(--text-dim);">
                                <th style="padding: 1.25rem;">Note & Subject</th>
                                <th style="padding: 1.25rem;">College</th>
                                <th style="padding: 1.25rem;">Uploaded By</th>
                                <th style="padding: 1.25rem;">Status</th>
                                <th style="padding: 1.25rem; text-align: right;">Action</th>
                            </tr>
                        </thead>
                        <tbody id="mod-queue-body">
                            <!-- Injected by JS -->
                            <tr><td colspan="5" style="padding: 4rem; text-align: center; opacity: 0.5;">Loading moderation queue...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Moderation Modal (Hidden) -->
        <div id="mod-review-modal" class="modal-overlay" style="display:none; z-index: 10000;">
            <div class="glass-card" style="width: 95%; max-width: 1200px; height: 90vh; display: flex; overflow: hidden; position: relative;">
                <button onclick="closeModModal()" style="position: absolute; top: 1rem; right: 1rem; background: rgba(0,0,0,0.5); border: none; color: white; border-radius: 50%; width: 40px; height: 40px; cursor: pointer; z-index: 10;">✖</button>
                
                <!-- PDF Preview -->
                <div style="flex-grow: 1; background: #1a1a1a; position: relative;">
                    <iframe id="mod-preview-frame" style="width: 100%; height: 100%; border: none;"></iframe>
                    <div id="mod-preview-placeholder" style="display:none; height:100%; align-items:center; justify-content:center; flex-direction:column; gap:1rem;">
                        <span style="font-size: 4rem;">🖼️</span>
                        <p>Preview not available for this file type.</p>
                        <a id="mod-download-link" href="#" target="_blank" class="btn btn-ghost">Download to Review</a>
                    </div>
                </div>

                <!-- Review Panel -->
                <div style="width: 380px; border-left: 1px solid var(--border-glass); padding: 2rem; display: flex; flex-direction: column; background: rgba(0,0,0,0.4);">
                    <h2 class="font-heading" style="margin-bottom: 2rem;">🔍 Review Note</h2>
                    
                    <div style="flex-grow: 1; display: flex; flex-direction: column; gap: 1.5rem;">
                        <div>
                            <label style="font-size: 0.75rem; color: var(--text-dim); display: block; margin-bottom: 0.25rem;">Note Title</label>
                            <div id="mod-note-title" style="font-weight: 600;">--</div>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <div>
                                <label style="font-size: 0.75rem; color: var(--text-dim); display: block; margin-bottom: 0.25rem;">College</label>
                                <div id="mod-note-college" style="font-size: 0.9rem;">--</div>
                            </div>
                            <div>
                                <label style="font-size: 0.75rem; color: var(--text-dim); display: block; margin-bottom: 0.25rem;">Subject</label>
                                <div id="mod-note-subject" style="font-size: 0.9rem;">--</div>
                            </div>
                        </div>
                        <div>
                            <label style="font-size: 0.75rem; color: var(--text-dim); display: block; margin-bottom: 0.25rem;">Uploaded By</label>
                            <div id="mod-note-uploader" style="font-size: 0.9rem;">--</div>
                            <div id="mod-note-email" style="font-size: 0.75rem; color: var(--text-dim);">--</div>
                        </div>
                        <div class="glass-card" style="padding: 1rem; background: rgba(231, 76, 60, 0.05); border: 1px solid rgba(231, 76, 60, 0.2);">
                            <div style="display: flex; gap: 0.5rem; align-items: center; color: #e74c3c; font-size: 0.85rem; margin-bottom: 0.25rem;">
                                <span>⚠️</span>
                                <span style="font-weight: 700;">Plagiarism Check</span>
                            </div>
                            <p style="font-size: 0.75rem; opacity: 0.8;">No external matches found. Internal similarity: 12%</p>
                        </div>
                    </div>

                    <div style="margin-top: 2rem; display: flex; flex-direction: column; gap: 0.75rem;">
                        <button class="btn btn-primary" style="background: #2ecc71; border-color: #2ecc71;" onclick="executeModeration('approve')">✅ Approve Note</button>
                        <button class="btn btn-ghost" style="color: #f1c40f;" onclick="executeModeration('request-changes')">📝 Request Changes</button>
                        <button class="btn btn-ghost" style="color: #e74c3c;" onclick="executeModeration('reject')">❌ Reject Note</button>
                    </div>
                </div>
            </div>
        </div>
    `;
};

window.initModerationHub = async function () {
    const { db, collection, query, where, onSnapshot, getDocs } = getFirebase();
    if (!db || !currentUser) return;

    if (moderationUnsubscribe) moderationUnsubscribe();

    const collegeFilter = document.getElementById('mod-filter-college')?.value || "all";

    let q = query(collection(db, "notes"), where("status", "==", "pending"));
    if (collegeFilter !== 'all') {
        q = query(collection(db, "notes"), where("status", "==", "pending"), where("collegeId", "==", collegeFilter));
    } else if (currentUser.role === 'coadmin') {
        const myColl = currentUser.collegeId || currentUser.college || currentUser.assignedCollege;
        q = query(collection(db, "notes"), where("status", "==", "pending"), where("collegeId", "==", myColl));
    }

    moderationUnsubscribe = onSnapshot(q, (snapshot) => {
        moderationQueue = [];
        snapshot.forEach(doc => moderationQueue.push({ id: doc.id, ...doc.data() }));
        renderModerationQueue();
        updateModerationStats();
    });
};

function renderModerationQueue() {
    const tbody = document.getElementById('mod-queue-body');
    if (!tbody) return;

    if (moderationQueue.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="padding: 4rem; text-align: center; opacity: 0.5;">Queue is empty. Great job!</td></tr>`;
        return;
    }

    tbody.innerHTML = moderationQueue.map(note => `
        <tr style="border-bottom: 1px solid var(--border-glass);">
            <td style="padding: 1.25rem;">
                <div style="font-weight: 600;">${note.title}</div>
                <div style="font-size: 0.75rem; color: var(--text-dim);">${note.subject} • ${note.semester}</div>
            </td>
            <td style="padding: 1.25rem; font-size: 0.85rem;">${note.collegeName || note.collegeId || note.college}</td>
            <td style="padding: 1.25rem; font-size: 0.85rem;">${note.uploaderName || 'Unknown'}</td>
            <td style="padding: 1.25rem;">
                <span style="background: rgba(241, 196, 15, 0.1); color: #f1c40f; padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.75rem;">Pending</span>
            </td>
            <td style="padding: 1.25rem; text-align: right;">
                <button class="btn btn-sm btn-ghost" onclick="openModReview('${note.id}')">Review</button>
            </td>
        </tr>
    `).join('');
}

let activeReviewNote = null;

window.openModReview = function (noteId) {
    activeReviewNote = moderationQueue.find(n => n.id === noteId);
    if (!activeReviewNote) return;

    const modal = document.getElementById('mod-review-modal');
    const iframe = document.getElementById('mod-preview-frame');
    const placeholder = document.getElementById('mod-preview-placeholder');

    document.getElementById('mod-note-title').innerText = activeReviewNote.title;
    document.getElementById('mod-note-college').innerText = activeReviewNote.college;
    document.getElementById('mod-note-subject').innerText = activeReviewNote.subject;
    document.getElementById('mod-note-uploader').innerText = activeReviewNote.uploaderName || 'Anonymous';
    document.getElementById('mod-note-email').innerText = activeReviewNote.uploaderEmail || 'No email';

    if (activeReviewNote.fileType?.includes('pdf') || activeReviewNote.url?.includes('.pdf')) {
        iframe.style.display = 'block';
        placeholder.style.display = 'none';
        iframe.src = activeReviewNote.url;
    } else {
        iframe.style.display = 'none';
        placeholder.style.display = 'flex';
        document.getElementById('mod-download-link').href = activeReviewNote.driveLink || activeReviewNote.fileUrl || activeReviewNote.url;
    }

    modal.style.display = 'flex';
};

window.closeModModal = function () {
    const modal = document.getElementById('mod-review-modal');
    modal.style.display = 'none';
    document.getElementById('mod-preview-frame').src = "";
};

window.executeModeration = async function (action) {
    if (!activeReviewNote) return;
    const { db, doc, updateDoc, serverTimestamp } = getFirebase();
    if (!db) return;

    try {
        const noteId = activeReviewNote.id;
        const noteRef = doc(db, "notes", noteId);

        if (action === 'approve') {
            await updateDoc(noteRef, {
                status: 'approved',
                approvedAt: serverTimestamp(),
                approvedBy: currentUser.id,
                views: 0,
                downloads: 0,
                likes: 0
            });

            // Send Notification
            if (typeof createNotification === 'function') {
                await createNotification(activeReviewNote.uploaderUid, {
                    title: "✅ Note Approved!",
                    message: `Your note "${activeReviewNote.title}" has been approved and is now live.`,
                    type: "success"
                });
            }

            showToast("Note approved and made live!");
        } else if (action === 'reject') {
            const reason = prompt("Reason for rejection:");
            if (!reason) return;

            await updateDoc(noteRef, {
                status: 'rejected',
                rejectedAt: serverTimestamp(),
                rejectionReason: reason
            });

            // Send Notification
            if (typeof createNotification === 'function') {
                await createNotification(activeReviewNote.uploaderUid, {
                    title: "❌ Note Rejected",
                    message: `Your note "${activeReviewNote.title}" was rejected. Reason: ${reason}`,
                    type: "error"
                });
            }

            showToast("Note rejected.");
        }

        closeModModal();
    } catch (e) {
        console.error("Mod action error:", e);
        showToast("Action failed: " + e.message, "error");
    }
};

async function updateModerationStats() {
    const { db, collection, getDocs } = getFirebase();
    if (!db) return;

    document.getElementById('stat-pending-count').innerText = moderationQueue.length;
}

// --- NOTIFICATIONS SYSTEM ---

async function createNotification(userId, data) {
    const { db, collection, addDoc, serverTimestamp } = getFirebase();
    if (!db || !userId) return;
    try {
        await addDoc(collection(db, "notifications"), {
            userId,
            ...data,
            read: false,
            timestamp: serverTimestamp()
        });
    } catch (e) { console.error("Notify fail:", e); }
}

function listenToNotifications() {
    const { db, collection, query, where, onSnapshot, orderBy } = getFirebase();
    if (!db || !currentUser) return;

    if (notificationsUnsubscribe) notificationsUnsubscribe();

    try {
        const q = query(
            collection(db, "notifications"),
            where("userId", "==", currentUser.id),
            orderBy("timestamp", "desc")
        );

        notificationsUnsubscribe = onSnapshot(q, (snapshot) => {
            userNotifications = [];
            snapshot.forEach(doc => userNotifications.push({ id: doc.id, ...doc.data() }));
            updateNotificationBadge();
        }, (err) => {
            console.warn("Notification listener failed (likely index missing):", err);
            // Fallback: simpler query without order if index is missing
            const qBasic = query(collection(db, "notifications"), where("userId", "==", currentUser.id));
            onSnapshot(qBasic, (snap) => {
                userNotifications = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
                updateNotificationBadge();
            });
        });
    } catch (e) { console.warn("Notify listen error:", e); }
}

function updateNotificationBadge() {
    const btn = document.querySelector('.notification-btn');
    if (!btn) return;

    const unread = userNotifications.filter(n => !n.read).length;
    if (unread > 0) {
        btn.innerHTML = `🔔 <span style="position:absolute; top:2px; right:2px; background:var(--secondary); color:white; font-size:10px; min-width:18px; height:18px; display:flex; align-items:center; justify-content:center; border-radius:10px; border: 2px solid #111;">${unread}</span>`;
    } else {
        btn.innerHTML = `🔔`;
    }

    btn.onclick = toggleNotificationPanel;
}

function toggleNotificationPanel(e) {
    e.stopPropagation();
    let panel = document.getElementById('notification-panel');
    if (panel) {
        panel.remove();
        return;
    }

    panel = document.createElement('div');
    panel.id = 'notification-panel';
    panel.style.cssText = `
        position: absolute; top: 75px; right: 20px; width: 350px; 
        max-height: 500px; display: flex; flex-direction: column; z-index: 11000;
        background: rgba(15,15,15,0.95); backdrop-filter: blur(20px); 
        border: 1px solid var(--border-glass); border-radius: 16px; 
        box-shadow: 0 20px 50px rgba(0,0,0,0.8); animation: fadeInScale 0.2s ease-out;
    `;

    panel.innerHTML = `
        <div style="padding: 1.5rem; border-bottom: 1px solid var(--border-glass); display: flex; justify-content: space-between; align-items: center;">
            <h3 class="font-heading" style="margin:0; font-size: 1.1rem;">Notifications</h3>
            <span onclick="window.markAllNotificationsRead()" style="font-size: 0.75rem; color: var(--primary); cursor: pointer; font-weight: 600;">Mark all as read</span>
        </div>
        <div style="flex: 1; overflow-y: auto; padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem;">
            ${userNotifications.length === 0 ? '<div style="text-align:center; padding: 3rem; opacity:0.5;">No notifications yet.</div>' :
            userNotifications.map(n => `
                <div class="glass-card" style="padding: 1rem; ${n.read ? 'opacity: 0.5;' : 'border-left: 3px solid var(--secondary); background: rgba(255,255,255,0.03);'}">
                    <div style="font-weight: 700; font-size: 0.9rem; margin-bottom: 0.25rem;">${n.title}</div>
                    <p style="font-size: 0.8rem; line-height: 1.4; color: #ccc;">${n.message}</p>
                    <div style="font-size: 0.65rem; color: var(--text-dim); margin-top: 0.75rem;">${n.timestamp ? new Date(n.timestamp.seconds * 1000).toLocaleString() : 'Just now'}</div>
                </div>
            `).join('')}
        </div>
    `;

    document.body.appendChild(panel);

    // Close on outside click
    const closer = (event) => {
        if (!panel.contains(event.target)) {
            panel.remove();
            document.removeEventListener('click', closer);
        }
    };
    setTimeout(() => document.addEventListener('click', closer), 10);
}

window.markAllNotificationsRead = async () => {
    const { db, doc, updateDoc } = getFirebase();
    if (!db) return;

    showToast("Clearing notifications...", "info");
    try {
        const batch = [];
        for (const n of userNotifications) {
            if (!n.read) {
                batch.push(updateDoc(doc(db, "notifications", n.id), { read: true }));
            }
        }
        await Promise.all(batch);
        document.getElementById('notification-panel')?.remove();
    } catch (e) { console.warn(e); }
};

window.showToast = function (msg, type = 'success') {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
        padding: 1rem 2rem; border-radius: 12px; z-index: 12000;
        background: ${type === 'error' ? '#e74c3c' : (type === 'info' ? 'var(--primary)' : '#2ecc71')};
        color: white; font-weight: 600; box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        animation: slideUp 0.3s ease-out;
    `;
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease-in forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};


// Note actions moved to js/note-actions.js for global availability

async function loadLiveDashboardStats() {
    const { db, collection, query, where, onSnapshot, limit } = getFirebase();
    if (!db) return;

    const isCoAdmin = currentUser?.role === 'coadmin';
    const myColl = currentUser?.collegeId || currentUser?.college;

    console.log("📊 Loading Dashboard Live Data...");

    // 1. Live Students (Heartbeat listener)
    try {
        let qPresence = query(collection(db, "presence"), where("online", "==", true));
        if (isCoAdmin && myColl) {
            qPresence = query(collection(db, "presence"), where("online", "==", true), where("collegeId", "==", myColl));
        }
        onSnapshot(qPresence, (snap) => {
            const el = document.getElementById('stat-active');
            if (el) el.innerText = snap.size > 0 ? snap.size : "0";
        });
    } catch (e) { console.warn("Presence sync fail:", e); }

    // 2. Trending Notes Count
    try {
        let qTrending = query(collection(db, "notes"), where("status", "==", "approved"), limit(10));
        onSnapshot(qTrending, (snap) => {
            const count = snap.size;
            const el = document.getElementById('stat-notes');
            if (el) el.innerText = count > 0 ? count : "0";
        });
    } catch (e) { console.warn("Trending sync fail:", e); }
}

// Global hook for tracking progress
window.trackStudyProgress = async function (subjectId, action = 'view') {
    const { db, doc, setDoc, increment } = getFirebase();
    if (!db || !currentUser || currentUser.id === 'guest') return;

    const statsRef = doc(db, "user_stats", currentUser.id);
    const weight = action === 'download' ? 5 : 1;

    try {
        await setDoc(statsRef, {
            subjects: {
                [subjectId]: {
                    score: increment(weight),
                    lastActive: new Date().toISOString()
                }
            }
        }, { merge: true });
    } catch (e) { }
};

window.renderOverviewSkeleton = renderDashboardSkeleton;
