import { globalNotes } from "../data/globalNotes.js";
import { RoutingSystem } from "./routing.js";
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
            { id: 'math-1', name: 'Engineering Mathematics-I', icon: '📐', code: 'EN3BS11', description: 'Calculus, Linear Algebra and differential equations.' },
            { id: 'physics', name: 'Engineering Physics', icon: '⚛️', code: 'EN3BS16', description: 'Quantum physics, optics and semiconductor theory.' },
            { id: 'bee', name: 'Basic Electrical Engineering', icon: '🔌', code: 'EN3ES17', description: 'AC/DC circuits, transformers and machines.' },
            { id: 'graphics', name: 'Engineering Graphics', icon: '📐', code: 'EN3ES26', description: 'Technical drawing, projection and CAD basics.' },
            { id: 'c-prog', name: 'Basic Programming with C', icon: '💻', code: 'EN3ES27', description: 'Introduction to algorithmic logic and C programming.' },
            { id: 'civil-mech', name: 'Basic Civil Engineering & Mechanics', icon: '🏗️', code: 'EN3ES30', description: 'Civil engineering fundamentals and applied mechanics.' },
            { id: 'evs', name: 'Environmental Science', icon: '🌍', code: 'EN3NG01', description: 'Ecosystems, biodiversity and environmental conservation.' },
            { id: 'hst', name: 'History of Science and Technology', icon: '📜', code: 'EN3HS01', description: 'Evolution of scientific thought and technological advancements.' }
        ],
        'cse-Semester 2': [
            { id: 'math-2', name: 'Engineering Mathematics-II', icon: '📉', code: 'EN3BS12', description: 'Advanced calculus, Fourier series and complex variables.' },
            { id: 'chemistry', name: 'Engineering Chemistry', icon: '🧪', code: 'EN3BS14', description: 'Water treatment, thermodynamics and material science.' },
            { id: 'electronics', name: 'Basic Electronics Engineering', icon: '📟', code: 'EN3ES16', description: 'Semiconductor devices and circuits.' },
            { id: 'mech', name: 'Basic Mechanical Engineering', icon: '⚙️', code: 'EN3ES18', description: 'Thermodynamics and IC engines.' },
            { id: 'adv-c', name: 'Advanced Programming with C', icon: '💻', code: 'EN3ES28', description: 'Pointers, dynamic memory allocation and file handling.' },
            { id: 'workshop', name: 'Engineering Workshop', icon: '🛠️', code: 'EN3ES29', description: 'Hands-on practice with tools, carpentry and welding.' },
            { id: 'uhv', name: 'Universal Human Values & Professional Ethics', icon: '🤝', code: 'EN3NG02', description: 'Understanding human values and ethical practices.' },
            { id: 'comm-skills', name: 'Communication Skills', icon: '🗣️', code: 'EN3HS10', description: 'Professional writing and verbal communication.' }
        ],
        'cse-Semester 3': [
            { id: 'dm', name: 'Discrete Mathematics', icon: '🧩', code: 'CS3BS04', description: 'Logic, sets, graph theory and combinatorics.' },
            { id: 'dc', name: 'Data Communication', icon: '📡', code: 'CS3CO28', description: 'Network models, transmission media, and data link control.' },
            { id: 'oop', name: 'Object Oriented Programming', icon: '☕', code: 'CS3CO30', description: 'Core principles: Encapsulation, Inheritance, Polymorphism.' },
            { id: 'dsa', name: 'Data Structures', icon: '🌳', code: 'CS3CO31', description: 'Arrays, stacks, queues, trees and sorting.' },
            { id: 'java', name: 'Java Programming', icon: '☕', code: 'CS3CO32', description: 'Core Java fundamentals and application development.' },
            { id: 'de', name: 'Digital Electronics', icon: '💡', code: 'CS3CO33', description: 'Boolean algebra and combinational circuits.' },
            { id: 'csa', name: 'Computer System Architecture', icon: '🖥️', code: 'CS3CO34', description: 'ALU, control unit and memory hierarchy.' },
            { id: 'soft-skills-1', name: 'Soft Skills-I', icon: '🗣️', code: 'EN3NG03', description: 'Communication, presentation, and interpersonal skills.' }
        ],
        'cse-Semester 4': [
            { id: 'micro', name: 'Microprocessor and Interfacing', icon: '📟', code: 'CS3CO35', description: '8085/8086 architecture, assembly language and peripheral interfacing.' },
            { id: 'adv-java', name: 'Advanced Java Programming', icon: '☕', code: 'CS3CO37', description: 'Servlets, JSP, JDBC and enterprise application components.' },
            { id: 'dbms', name: 'Database Management Systems', icon: '🗄️', code: 'CS3CO39', description: 'Relational databases, SQL, normalization and transaction management.' },
            { id: 'toc', name: 'Theory of Computation', icon: '🧠', code: 'CS3CO46', description: 'Finite automata, context-free grammars and Turing machines.' },
            { id: 'os', name: 'Operating Systems', icon: '💾', code: 'CS3CO47', description: 'Process management, synchronization and file systems.' },
            { id: 'iwt', name: 'Internet & Web Technology', icon: '🌐', code: 'CS3EW04', description: 'Web development, HTML, CSS, JavaScript, and Server-side.' },
            { id: 'stat-analysis', name: 'Statistical Analysis', icon: '📊', code: 'CS3EL11', description: 'Statistical Analysis of data and hypothesis testing.' },
            { id: 'soft-skills-2', name: 'Soft Skills-II', icon: '🗣️', code: 'EN3NG10', description: 'Advanced communication and professional etiquette.' }
        ],
        'cse-Semester 5': [
            { id: 'se', name: 'Software Engineering', icon: '💻', code: 'CS3CO40', description: 'Software lifecycles, methodologies and project management.' },
            { id: 'cn', name: 'Computer Networks', icon: '🌐', code: 'CS3CO43', description: 'Network architectures, protocols and data routing.' },
            { id: 'data-science', name: 'Data Science', icon: '📈', code: 'CS3EL13', description: 'Data analysis, statistics, and machine learning.' },
            { id: 'expert-systems', name: 'Expert Systems', icon: '🧠', code: 'CS3EA16', description: 'Rule-based systems and knowledge representation.' },
            { id: 'iot', name: 'Internet of Things', icon: '📟', code: 'CS3EL14', description: 'IoT architecture, sensors, and embedded networks.' },
            { id: 'ai', name: 'Artificial Intelligence', icon: '🤖', code: 'CS3EA10', description: 'AI algorithms, search techniques, and reasoning.' },
            { id: 'cloud', name: 'Cloud Computing', icon: '☁️', code: 'CS3EL12', description: 'Cloud models, virtualization, and distributed data.' },
            { id: 'nosql', name: 'NoSQL Database', icon: '🗄️', code: 'CS3EL17', description: 'Non-relational databases and distributed ledgers.' },
            { id: 'mgmt-eco', name: 'Fundamentals of Management, Economics & Accountancy', icon: '💼', code: 'EN3HS04', description: 'Basic management principles and economic theory.' },
            { id: 'soft-skills-3', name: 'Soft Skills-III', icon: '🗣️', code: 'EN3NG09', description: 'Leadership, teamwork, and corporate communication.' },
            { id: 'blockchain', name: 'Block Chain Architecture', icon: '⛓️', code: 'OE00016', description: 'Decentralized architectures and smart contracts.' },
            { id: 'python', name: 'Python Essential', icon: '🐍', code: 'OE00018', description: 'Programming with Python for general applications.' }
        ],
        'cse-Semester 6': [
            { id: 'cd', name: 'Compiler Design', icon: '⚙️', code: 'CS3CO44', description: 'Lexical analysis, parsing, and code generation.' },
            { id: 'daa', name: 'Design and Analysis of Algorithms', icon: '⏳', code: 'CS3CO45', description: 'Algorithm optimization, complexity, and dynamic programming.' },
            { id: 'ml', name: 'Machine Learning', icon: '🤖', code: 'CS3EL15', description: 'Supervised, unsupervised, and deep learning algorithms.' },
            { id: 'xml', name: 'Programming with XML', icon: '📄', code: 'CS3EL16', description: 'XML data representation and web services.' },
            { id: 'research', name: 'Research Methodology', icon: '🔬', code: 'CS3ES15', description: 'Research techniques, data collection, and ethics.' },
            { id: 'agile', name: 'Agile Development', icon: '🏃', code: 'OE00015', description: 'Agile methodologies, Scrum, and Kanban.' },
            { id: 'mini-project', name: 'Mini Project', icon: '🧪', code: 'CS3PC04', description: 'Practical application of learned concepts in a small project.' },
            { id: 'soft-skills-4', name: 'Soft Skills-IV', icon: '🗣️', code: 'EN3NG08', description: 'Interview preparation and career readiness.' },
            { id: 'cyber', name: 'Cyber Security Fundamentals', icon: '🛡️', code: 'OE00073', description: 'Security principles, cryptography, and network defense.' },
            { id: 'r-prog', name: 'R Programming', icon: '📉', code: 'OE00051', description: 'Statistical computing and graphics with R.' }
        ],
        'cse-Semester 7': [
            { id: 'ad-hoc', name: 'Ad-Hoc Networks', icon: '📡', code: 'CS3EL05', description: 'Wireless sensor and ad-hoc networking protocols.' },
            { id: 'data-viz', name: 'Data Visualization', icon: '📊', code: 'CS3ED03', description: 'Visual representations of complex data spaces.' },
            { id: 'nlp', name: 'Natural Language Processing', icon: '🗣️', code: 'CS3EA06', description: 'Text processing, linguistics, and language models.' },
            { id: 'dist-sys', name: 'Distributed Systems', icon: '🌍', code: 'CS3EL04', description: 'Distributed computing, clock synchronization, and IPC.' },
            { id: 'gen-ai', name: 'Generative AI', icon: '✨', code: 'CS3ED13', description: 'LLMs, diffusion models, and AI synthesis.' },
            { id: 'swarm', name: 'Swarm Intelligence', icon: '🐝', code: 'CS3EA17', description: 'Bio-inspired algorithms and optimization techniques.' },
            { id: 'proj-1', name: 'Project-I', icon: '🚀', code: 'CS3PC05', description: 'Major project phase I: conception and design.' },
            { id: 'cloud-sec', name: 'Cloud Security', icon: '🔒', code: 'OE00056', description: 'Security challenges and solutions in cloud environments.' },
            { id: 'eda', name: 'Exploratory Data Analysis', icon: '🔎', code: 'OE00075', description: 'Statistical techniques for data investigation.' },
            { id: 'open-learn', name: 'Open Learning Courses', icon: '📚', code: 'EN3NG06', description: 'Self-directed learning and online certifications.' }
        ],
        'cse-Semester 8': [
            { id: 'proj-2', name: 'Project-II', icon: '🚀', code: 'CS3PC08', description: 'Major project phase II: implementation and testing.' }
        ]
    }
};
window.GlobalData = GlobalData;

let NotesDB = [];
let unsubscribeNotes = null;
let currentUser = null;
let selState = window.selState || { college: null, branch: null, year: null, subject: null, semester: null };
let userNotifications = [];
let notificationsUnsubscribe = null;

// Expose to window for global compatibility
window.selState = selState;
window.currentUser = currentUser;
window.NotesDB = NotesDB;

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
            let tabParam = urlParams.get('tab') || window.pendingTab;

            // Deep link support via Hash (#/notes/...)
            if (!tabParam && window.location.hash.startsWith('#/')) {
                const hashParts = window.location.hash.split('/');
                if (hashParts[1]) {
                    tabParam = hashParts[1];
                    console.log("📍 Detected Tab from Hash:", tabParam);
                }
            }

            // Fallback for old URL path logic
            if (!tabParam) {
                const pathParts = window.location.pathname.split('/');
                const dashIdx = pathParts.findIndex(p => p === 'dashboard' || p === 'dashboard.html');
                if (dashIdx !== -1 && pathParts[dashIdx + 1]) {
                    tabParam = pathParts[dashIdx + 1];
                    console.log("📍 Detected Tab from Path:", tabParam);
                }
            }

            if (tabParam) {
                renderTabContent(tabParam);

                // Deep Link Restoration
                if (tabParam === 'notes' && (window.location.hash.includes('#/notes/') || window.location.pathname.includes('/notes/'))) {
                    initDynamicColleges().then(() => {
                        const nextStep = RoutingSystem.applyFiltersToUI(GlobalData, (k, v) => { selState[k] = v; });
                        if (nextStep === "SHOW_NOTES") showNotes();
                        else if (nextStep === "SUBJECT_STEP") renderSubjectStep();
                        else if (nextStep === "SEMESTER_STEP" || nextStep === "YEAR_STEP") renderCombinedSemesterStep();
                        else if (nextStep === "BRANCH_STEP") renderBranchStep();
                    });
                }
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

// Re-wired to native window methods inside note-actions.js
window.downloadNote = function (id) { if (window.updateNoteStat) window.updateNoteStat(id, 'download'); };
window.viewNote = function (id) { if (window.updateNoteStat) window.updateNoteStat(id, 'view'); };
window.incrementNoteView = window.viewNote;

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

// Redundant toggleNoteBookmark removed (Handled by toggleBookmark in note-actions.js)

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

    // Synchronize URL with Tab (Exclude notes as it has sub-routing)
    if (tabId !== 'notes' && !window.location.hash.startsWith('#/notes') && !window.location.pathname.startsWith('/notes')) {
        let base = window.location.pathname;
        const pathParts = base.split('/');
        const pagesIdx = pathParts.indexOf('pages');

        // Ensure we explicitly refer to dashboard.html to prevent GitHub pages 404s
        if (pagesIdx !== -1) {
            base = pathParts.slice(0, pagesIdx + 1).join('/') + '/dashboard.html';
        }

        const targetPath = tabId === 'overview' ? base : `${base}?tab=${tabId}`;
        if (window.location.pathname + window.location.search !== targetPath) {
            window.history.pushState({ tab: tabId }, '', targetPath);
        }
    }

    try {
        if (tabId === 'overview') {
            console.log("➡️ Rendering Overview...");
            contentArea.innerHTML = renderOverview();
        } else if (tabId === 'notes') {
            const hasPathFilters = window.location.hash.split('/').length > 2 || window.location.pathname.split('/').length > 4; // #/notes/medicaps...
            if (!hasPathFilters) {
                selState.college = null; selState.branch = null; selState.year = null; selState.subject = null; selState.semester = null;
            }
            contentArea.innerHTML = renderNotesHub();

            if (!hasPathFilters) {
                renderCollegeStep();
                if (typeof RoutingSystem !== 'undefined') RoutingSystem.updateURL(selState);
            }
        } else if (tabId === 'planner') {
            if (window.lockOverlay) {
                window.lockOverlay.show();
                return;
            }
            contentArea.innerHTML = renderPlanner();
        } else if (tabId === 'ai-tools') {
            if (window.lockOverlay) {
                window.lockOverlay.show();
                return;
            }
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

    // Aggregate global hardcoded notes
    const allGlobalNotes = [];
    if (globalNotes && globalNotes.global) {
        Object.values(globalNotes.global).forEach(arr => allGlobalNotes.push(...arr));
    }

    // Merge true Firestore nodes securely with formatted hardcoded ones
    const combinedNotes = [...(window.NotesDB || []), ...allGlobalNotes];

    const topNotes = combinedNotes
        .filter(n => n.status === 'approved')
        .sort((a, b) => ((b.likes || 0) + (b.downloads || 0) + (b.views || 0)) - ((a.likes || 0) + (a.downloads || 0) + (a.views || 0)))
        .slice(0, 3);

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
                    
                    <!-- 3.5 Global Static Showcase (Phase-1 MVP) -->
                    <div class="glass-card" style="padding: 2.5rem; border: 1px solid rgba(255, 255, 255, 0.05); background: rgba(255, 255, 255, 0.01);">
                         <h3 class="font-heading" style="margin-bottom: 2rem; display: flex; align-items: center; gap: 0.8rem;">
                            <span style="font-size: 1.5rem;">🚀</span> 
                            Global <span class="highlight">Verified Resources</span>
                         </h3>
                         <div id="dashboard-global-showcase" class="notes-list-container-pro">
                            ${topNotes.length > 0 ? renderInstantStaticNotes(topNotes) : '<p style="color:var(--text-dim);">Resources are being synced from global servers...</p>'}
                         </div>
                    </div>

                    <!-- 4. AI Insights Card -->
                    <div class="glass-card" style="background: linear-gradient(135deg, rgba(108, 99, 255, 0.1) 0%, rgba(255, 255, 255, 0.03) 100%); border: 1px solid rgba(108, 99, 255, 0.2); padding: 2.5rem; position: relative; overflow: hidden; border-radius: 24px;">
                        <div style="position: absolute; top: -20px; right: -20px; font-size: 10rem; opacity: 0.03; transform: rotate(15deg);">🤖</div>
                        <h3 class="font-heading" style="font-size: 1.5rem; margin-bottom: 1rem; color: var(--secondary);">✨ ${aiRec.title}</h3>
                        <p style="margin-bottom: 2rem; max-width: 85%; font-size: 1.1rem; line-height: 1.6; color: #eee;">${aiRec.msg}</p>
                        <div style="display: flex; gap: 1rem;">
                            <button class="btn btn-primary" onclick="${isGuest ? "window.location.href='../pages/auth.html'" : (aiRec.actionType === 'ai-tools' || aiRec.actionType === 'planner' ? "window.lockOverlay.show()" : `renderTabContent('${aiRec.actionType}')`)}">${aiRec.actionLabel}</button>
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
                           <div class="glass-card wobble-hover" onclick="window.lockOverlay ? window.lockOverlay.show() : renderTabContent('ai-tools')" style="cursor: pointer; padding: 2rem; text-align: center; border: 1px solid var(--border-glass);">
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

                <div id="explorer-content" class="explorer-grid-pro" style="padding: 2rem 2rem 6rem 2rem; min-height: 400px; display: grid; gap: 2rem;">
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

    if (container) {
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
    }
};

window.selectCollege = function (id, name) {
    selState.college = { id, name };
    if (typeof RoutingSystem !== 'undefined') RoutingSystem.updateURL(selState);
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
    if (typeof RoutingSystem !== 'undefined') RoutingSystem.updateURL(selState);
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
    if (typeof RoutingSystem !== 'undefined') RoutingSystem.updateURL(selState);
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
    if (typeof RoutingSystem !== 'undefined') RoutingSystem.updateURL(selState);
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
    if (typeof RoutingSystem !== 'undefined') RoutingSystem.updateURL(selState);
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

    // 1. Render Shell
    view.innerHTML = `
        <div class="subject-page-container fade-in">
             <div class="breadcrumb-pro" style="display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; font-size: 0.85rem; margin-bottom: 1.5rem; color: var(--text-dim);">
                🏠 <span style="opacity:0.5;">›</span> ${selState.branch.name} <span style="opacity:0.5;">›</span> ${selState.semester} <span style="opacity:0.5;">›</span> ${selState.subject.name}
            </div>
             <div class="subject-page-hero">
                <div style="display:flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <h1 class="font-heading subject-title-pro" style="margin: 0; line-height: 1.1;">${selState.subject.name}</h1>
                        <div class="sub-badges" style="margin-top: 0.8rem;">
                            <span class="meta-badge">${selState.branch.id.toUpperCase()}</span>
                            <span class="meta-badge">${selState.year.toUpperCase()}</span>
                        </div>
                        <div class="ai-btns-row" style="margin-top: 1.5rem; display: flex; gap: 1rem;">
                            <button class="btn btn-primary btn-sm" onclick="showAIModal('summary', '${selState.subject.name}')">✨ AI Summary</button>
                            <button class="btn btn-ghost btn-sm ai-questions-btn" style="border: 1px solid var(--primary);" onclick="showAIModal('questions', '${selState.subject.name}')">📝 Generate Model Questions</button>
                            <button class="btn btn-ghost btn-sm syllabus-btn" style="border: 1px solid var(--primary);" onclick="showAIModal('syllabus', '${selState.subject.name}')">📖 Syllabus</button>
                        </div>
                    </div>
                    <div class="subject-actions-top" style="display:flex; gap: 1rem;">
                        <button class="btn btn-ghost" onclick="copyShareLink()" id="share-btn" style="white-space:nowrap; background: rgba(0, 242, 255, 0.1); color: var(--secondary); padding: 0.6rem 1.2rem; border-radius: 8px;">🔗 Share Subject</button>
                        <button class="btn btn-ghost" onclick="backToSubjectSelection()" style="white-space:nowrap; background: rgba(255,255,255,0.05); padding: 0.6rem 1.2rem; border-radius: 8px;">⬅ Back</button>
                    </div>
                </div>
            </div>

            <div class="subject-tabs-nav" style="display: flex; gap: 2.5rem; margin: 2rem 0; border-bottom: 2px solid rgba(255, 255, 255, 0.05); position: relative;">
                <div class="subject-tab ${activeTab === 'notes' ? 'active' : ''}" onclick="switchSubjectTab('notes')" style="padding: 1rem 0; color: #FFFFFF; font-size: 1rem; font-weight: 700; cursor: pointer; transition: all 0.3s ease; opacity: ${activeTab === 'notes' ? '1' : '0.6'}; border-bottom: 2px solid ${activeTab === 'notes' ? '#00f2ff' : 'transparent'};">Notes</div>
                <div class="subject-tab ${activeTab === 'pyqs' ? 'active' : ''}" onclick="switchSubjectTab('pyqs')" style="padding: 1rem 0; color: #FFFFFF; font-size: 1rem; font-weight: 700; cursor: pointer; transition: all 0.3s ease; opacity: ${activeTab === 'pyqs' ? '1' : '0.6'}; border-bottom: 2px solid ${activeTab === 'pyqs' ? '#00f2ff' : 'transparent'};">PYQs</div>
                <div class="subject-tab ${activeTab === 'formula' ? 'active' : ''}" onclick="switchSubjectTab('formula')" style="padding: 1rem 0; color: #FFFFFF; font-size: 1rem; font-weight: 700; cursor: pointer; transition: all 0.3s ease; opacity: ${activeTab === 'formula' ? '1' : '0.6'}; border-bottom: 2px solid ${activeTab === 'formula' ? '#00f2ff' : 'transparent'};">Formula Sheets</div>
            </div>

            <div class="resource-section">
                <h2 class="font-heading" style="margin-bottom: 1.5rem; font-size: 1.6rem; color: rgba(255,255,255,0.7);">Verified <span class="highlight" style="color: #00f2ff; font-weight: 800;">${activeTab.toUpperCase()}</span></h2>
                <div class="notes-list-container-pro" id="notes-list-grid">
                     <!-- Populated instantly from globalNotes or NotesDB -->
                </div>
            </div>
        </div>
    `;

    // 2. Instant Static Lookup or Detailed Filtered Data
    const grid = document.getElementById('notes-list-grid');

    // Completely defer to NotesDB (Firestore snapshot) for rendering
    renderDetailedNotes(selState.subject.id, activeTab);
};

function renderInstantStaticNotes(notes) {
    const createNoteCard = (note, idx) => {
        return `
            <div class="note-card-pro card-reveal" data-note-id="${note.id}" style="animation-delay: ${idx * 0.1}s;">
                <div class="note-info-pro">
                    <h3 class="note-title-pro">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--secondary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 12px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        ${note.title}
                    </h3>
                    <div class="meta-pills-row-pro">
                        <div class="meta-pill-pro date-pro">
                             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line></svg>
                             ${formatDate(note.created_at || note.approvedAt || note.date)}
                        </div>
                        <div class="meta-pill-pro uploader-pro">
                             <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(note.uploaderName || note.uploader || 'Verified')}&backgroundColor=transparent" style="width:18px;height:18px;border-radius:50%; background: #333;">
                             ${note.uploaderName || note.uploader || 'Verified'}
                        </div>
                        <div class="meta-pill-pro views-pro">
                             ${note.downloads || note.views || 0} downloads
                        </div>
                    </div>
                    <div class="note-actions-pro">
                        <button class="tool-icon-pro" onclick="likeNote('${note.id}')" title="Like">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                            <span class="like-count">${note.likes || 1}</span>
                        </button>
                        <button class="tool-icon-pro" onclick="toggleNoteDislike('${note.id}')" title="Dislike">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path></svg>
                            <span class="dislike-count">${note.dislikes || 0}</span>
                        </button>
                        <button class="tool-icon-pro" onclick="toggleBookmark('${note.id}')" title="Bookmark">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                        </button>
                        <button class="tool-icon-pro" onclick="reportNote('${note.id}')" title="Report">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
                        </button>
                    </div>
                </div>
                <div class="download-section-pro">
                    <a href="${note.url || note.fileUrl || note.driveLink}" target="_blank" class="btn-download-white" onclick="downloadNote('${note.id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                        Download
                    </a>
                </div>
            </div>
        `;
    };

    const html = notes.map((n, idx) => createNoteCard(n, idx)).join('');

    setTimeout(() => {
        notes.forEach(n => { if (n.id) window.incrementNoteView?.(n.id); });
    }, 100);

    return html;
}


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
                     <a href="${n.url || n.fileUrl || n.driveLink}" target="_blank" class="btn btn-sm btn-ghost" style="border: 1px solid var(--border-glass);">View</a>
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
            <div style="text-align: center; padding: 5rem; background: rgba(255,255,255,0.01); border: 2px dashed rgba(255,255,255,0.05); border-radius: 20px; width: 100%;">
                <div style="font-size: 4rem; margin-bottom: 2rem;">📂</div>
                <h2 class="font-heading">No premium ${tabType} for this subject found yet.</h2>
                <p style="color: var(--text-dim); margin-bottom: 2.5rem;">Be the first contributor and earn academic credit!</p>
                <button class="btn btn-primary" style="padding: 1rem 2.5rem; font-weight: 700;" onclick="openUploadModal()">+ Upload ${tabType}</button>
            </div>
        `;
    }

    const cardsHTML = list.map((n, idx) => {
        return `
            <div class="note-card-pro card-reveal" data-note-id="${n.id}" style="animation-delay: ${idx * 0.1}s;">
                <div class="note-info-pro">
                    <h3 class="note-title-pro">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--secondary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 12px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        ${n.title}
                    </h3>
                    <div class="meta-pills-row-pro">
                        <div class="meta-pill-pro date-pro">
                             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line></svg>
                             ${formatDate(n.created_at || n.approvedAt || n.date)}
                        </div>
                        <div class="meta-pill-pro uploader-pro">
                             <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(n.uploaderName || n.uploader || 'Scholar')}&backgroundColor=transparent" style="width:18px;height:18px;border-radius:50%; background: #333;">
                             ${n.uploaderName || n.uploader || 'Scholar'}
                        </div>
                        <div class="meta-pill-pro views-pro">
                             ${n.downloads || n.views || 0} downloads
                        </div>
                    </div>
                    <div class="note-actions-pro">
                        <button class="tool-icon-pro" onclick="likeNote('${n.id}')" title="Like">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                            <span class="like-count">${n.likes || 1}</span>
                        </button>
                        <button class="tool-icon-pro" onclick="toggleNoteDislike('${n.id}')" title="Dislike">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path></svg>
                            <span class="dislike-count">${n.dislikes || 0}</span>
                        </button>
                        <button class="tool-icon-pro" onclick="toggleBookmark('${n.id}')" title="Bookmark">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                        </button>
                        <button class="tool-icon-pro" onclick="reportNote('${n.id}')" title="Report">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
                        </button>
                    </div>
                </div>
                <div class="download-section-pro">
                    <a href="${n.url || n.fileUrl || n.driveLink}" target="_blank" class="btn-download-white" onclick="downloadNote('${n.id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                        Download
                    </a>
                </div>
            </div>`;
    }).join('');

    return `<div class="notes-list-container-pro">${cardsHTML}</div>`;
}


window.switchSubjectTab = function (tab) {
    showNotes(tab);
    trackAnalytics('switch_subject_tab', { tab });
};

function renderDetailedNotes(subjectId, tabType = 'notes') {
    console.log(`🔎 Filtering Notes for Subject: ${subjectId}, Type: ${tabType} `);

    const querySem = selState.semester;
    const semNum = querySem ? querySem.split(' ')[1] : null;
    const altSem = semNum ? (semNum + (semNum === '1' ? 'st' : semNum === '2' ? 'nd' : semNum === '3' ? 'rd' : 'th')) : null;

    // Combine NotesDB with Global Notes to guarantee hardcoded copies render
    let staticNotes = globalNotes[selState.college.id]?.[selState.subject.name];
    if (!staticNotes || staticNotes.length === 0) {
        staticNotes = globalNotes['global']?.[selState.subject.name] || [];
    }
    const combinedNotes = [...(window.NotesDB || []), ...staticNotes];

    // Remove duplicates natively to prioritize DB copies
    const uniqueMap = new Map();
    combinedNotes.forEach(n => { if (n.id) uniqueMap.set(n.id, n); });
    const deduplicatedNotes = Array.from(uniqueMap.values());

    const filtered = deduplicatedNotes.filter(n => {
        const semMatch = !n.semester || n.semester === querySem || (altSem && n.semester === altSem);
        const isCorrectSubject = ((n.subjectId === subjectId) || (n.subject === subjectId) || (n.subjectName === selState.subject.name)) &&
            (n.collegeId === selState.college.id || n.college === selState.college.id || n.collegeId === 'global') &&
            (n.type === tabType || !n.type);

        if (!semMatch || !isCorrectSubject) return false;

        const isVisible = n.status !== 'rejected';
        const isAdminOfCollege = currentUser && (
            (currentUser.role === Roles.SUPER_ADMIN) ||
            (currentUser.role === Roles.COLLEGE_ADMIN && currentUser.college === n.collegeId)
        );

        if (isAdminOfCollege) return n.status !== 'rejected';
        return isVisible;
    }).sort((a, b) => (b.likes || 0) - (a.likes || 0));

    const grid = document.getElementById('notes-list-grid');
    if (!grid) return;

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div style="text-align: center; padding: 5rem; background: rgba(255,255,255,0.01); border: 2px dashed rgba(255,255,255,0.05); border-radius: 20px; width: 100%;">
                <div style="font-size: 4rem; margin-bottom: 2rem;">📂</div>
                <h2 class="font-heading">No premium ${tabType} for this subject found yet.</h2>
                <p style="color: var(--text-dim); margin-bottom: 2.5rem;">Be the first contributor and earn academic credit!</p>
                <button class="btn btn-primary" style="padding: 1rem 2.5rem; font-weight: 700;" onclick="openUploadModal()">+ Upload ${tabType}</button>
            </div>
        `;
        return;
    }

    const cardsHTML = filtered.map((n, idx) => {
        return `
            <div class="note-card-pro card-reveal" data-note-id="${n.id}" style="animation-delay: ${idx * 0.1}s;">
                <div class="note-info-pro">
                    <h3 class="note-title-pro">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--secondary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 12px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        ${n.title}
                    </h3>
                    <div class="meta-pills-row-pro">
                        <div class="meta-pill-pro date-pro">
                             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line></svg>
                             ${formatDate(n.created_at || n.approvedAt || n.date)}
                        </div>
                        <div class="meta-pill-pro uploader-pro">
                             <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(n.uploaderName || n.uploader || 'Verified')}&backgroundColor=transparent" style="width:18px;height:18px;border-radius:50%; background: #333;">
                             ${n.uploaderName || n.uploader || 'Verified'}
                        </div>
                        <div class="meta-pill-pro views-pro">
                             ${n.downloads || n.views || 0} downloads
                        </div>
                    </div>
                    <div class="note-actions-pro">
                        <button class="tool-icon-pro" onclick="likeNote('${n.id}')" title="Like">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                            <span class="like-count">${n.likes || 1}</span>
                        </button>
                        <button class="tool-icon-pro" onclick="toggleNoteDislike('${n.id}')" title="Dislike">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path></svg>
                            <span class="dislike-count">${n.dislikes || 0}</span>
                        </button>
                        <button class="tool-icon-pro" onclick="toggleBookmark('${n.id}')" title="Bookmark">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                        </button>
                        <button class="tool-icon-pro" onclick="reportNote('${n.id}')" title="Report">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
                        </button>
                    </div>
                </div>
                <div class="download-section-pro">
                    <a href="${n.url || n.fileUrl || n.driveLink}" target="_blank" class="btn-download-white" onclick="downloadNote('${n.id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                        Download
                    </a>
                </div>
            </div>`;
    }).join('');

    grid.innerHTML = `<div class="notes-list-container-pro">${cardsHTML}</div>`;

    setTimeout(() => {
        if (typeof attachNoteRealtimeListeners === 'function') attachNoteRealtimeListeners('tab-content');
        filtered.forEach(n => { if (n.id) window.incrementNoteView?.(n.id); });
    }, 150);

    return grid.innerHTML;
}

// --- NOTE INTERACTIONS LOGIC (Handled by js/note-actions.js) ---
window.noteUnsubscribers = window.noteUnsubscribers || {};





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
    let title, content;
    let isSyllabusAvailable = false;

    // Base helper for standard syllabus generation
    const genSyllabusHTML = (units) => {
        return `<div style="text-align: left; max-height: 60vh; overflow-y: auto; padding-right: 10px;">
            ${units.map(u => `
                <h4 style="color: var(--primary); margin-bottom: 0.5rem;">${u.title}</h4>
                <p style="color: var(--text-dim); font-size: 0.9rem; margin-bottom: 1.5rem; line-height: 1.6;">${u.desc}</p>
            `).join('')}
        </div>`;
    };

    const syllabiDB = {
        'Engineering Mathematics-I': genSyllabusHTML([
            { title: 'Unit 1: Matrices and Linear Systems', desc: "Rank and Nullity of a Matrix by reducing it into Echelon and Normal Forms, Solution of Simultaneous equations by elementary transformation methods, Consistency and Inconsistency of Equations, Eigen Values and Eigen Vectors." },
            { title: 'Unit 2: Differential Calculus', desc: "Introduction to limit continuity, differentiability, Rolle’s theorem, Mean value theorem, Taylor's and Maclaurin’s series expansions. Functions of Several variables, Partial differentiation, Euler’s Theorem, Total Derivative, Maxima and Minima of function of two variables." },
            { title: 'Unit 3: Integral Calculus', desc: "Definite Integral as a limit of sum and its application in summation of series, Beta and Gamma functions (Definitions, Relation between Beta and Gamma functions without proof, Duplication formula without proof). Multiple Integral (Double and Triple Integrals), Change the Order of Integration, Applications of Multiple Integral in Area, Volume." },
            { title: 'Unit 4: Ordinary Differential Equations', desc: "First order differential equations (Separable, Exact, Homogeneous, Linear), Linear differential Equations of second and higher order with constant coefficients, Homogeneous linear differential equations, Simultaneous linear differential equations." },
            { title: 'Unit 5: Complex Variable', desc: "Basics of Complex number, Functions of complex variable: Analytic functions, Harmonic Conjugate functions, Cauchy-Riemann Equations, Complex Line Integral, Cauchy’s Theorem, Cauchy’s Integral Formula." }
        ]),
        'Engineering Physics': genSyllabusHTML([
            { title: 'Unit 1: Quantum mechanics', desc: "Limitations of Classical Mechanics, De-Broglie hypothesis for matter waves, phase and group velocity, wave packet, Heisenberg’s uncertainty principle, Compton scattering, wave function, Schrodinger’s Time dependent and time independent wave equation, Particle in a box problem." },
            { title: 'Unit 2: Wave Optics', desc: "Interference: Fresnel’s biprism experiment, Newton’s ring experiment. Diffraction of light: Fraunhofer diffraction for single slit, Grating and its types, and Rayleigh criterion of Resolution. Polarization: General concept of Polarization, Huygens theory of double refraction, Engineering Applications of Polarization." },
            { title: 'Unit 3: Nuclear Physics', desc: "Nuclear Structure, Nuclear model: Liquid drop model, Semi- empirical mass formula (Qualitative study) , Shell model, Particle accelerators: LINAC, Cyclotron, Synchrotron (Qualitative study), Betatron. Geiger-Muller (GM) counter, Bainbridge Mass Spectrograph." },
            { title: 'Unit 4: Solid State Physics', desc: "Crystal Physics: Unit cell, Crystal System, Types of Unit cell: Simple cubic, Face centred cubic, Body centred cubic Crystal, Number of atoms per unit cell, Packing fraction in different cubic lattices, Miller indices. Band theory of solids: Free Electron model, Band Model, Fermi level for Intrinsic and Extrinsic Semiconductors, Hall effect. Superconductivity: Zero resistance, persistent currents, superconducting transition temperature (Tc), Meissner effect, Type-I and Type-II superconductors, Engineering applications of superconductivity." },
            { title: 'Unit 5: Laser and Fiber Optics', desc: "Lasers: Properties of lasers, Spontaneous and Stimulated emission of radiation, Einstein’s A & B coefficient, Population inversion, Components of Laser, Ruby Laser, He-Ne Laser, Engineering applications of lasers. Fiber Optics: Fundamental idea about optical fibre, propagation of light through optical fibre acceptance angle, numerical aperture, fractional refractive index change, Classification of fibre, V number, Engineering applications of fibre." }
        ]),
        'Basic Civil Engineering & Mechanics': genSyllabusHTML([
            { title: 'Unit 1: Building Materials & Construction', desc: "Stones, bricks, cement, lime, timber-types, properties, test & uses, laboratory tests concrete and mortar Materials: Workability, Strength properties of Concrete, Nominal proportion of Concrete preparation of concrete, compaction, curing. Elements of Building Construction, Foundations conventional spread footings, RCC footings, floors, staircases – types and their suitability." },
            { title: 'Unit 2: Surveying & Levelling', desc: "Surveying-classification, general principles of surveying–Basic terms and definitions of chain, Chain survey, Compass survey and levelling." },
            { title: 'Unit 3: Mapping & Sensing', desc: "Mapping details and contouring, Profile Cross sectioning and measurement of areas, volumes, application of measurements in quantity computations, Survey stations." },
            { title: 'Unit 4: Forces & its applications', desc: "Graphical and Analytical Treatment of Concurrent and nonconcurrent Co- planner forces, Free Body Diagram, Force Diagram and Bow’s notations. Application of Equilibrium Concepts: Analysis of plane Trusses: Method of joints, Method of Sections. Frictional force in equilibrium problems." },
            { title: 'Unit 5: Shear force and Bending moment', desc: "Introduction of shear force and bending moment and their sign conventions, Types of loads, Types of beams, Types of supports; Shear force and bending moment diagrams for simply supported, overhang and cantilever beams subjected to any combination of point loads, uniformly distributed load, and point moment; Relationship between load, shear force and bending moment." }
        ]),
        'Basic Electrical Engineering': genSyllabusHTML([
            { title: 'Unit 1: DC circuit analysis', desc: "Elements and characteristics of electric circuits, ideal and practical sources, independent and dependent electrical sources, Ohm’s law, source transformation, Kirchhoff’s laws. Mesh analysis, nodal analysis, voltage and current division rules, star- delta conversions, Thevenin’s and Norton’s theorems." },
            { title: 'Unit 2: AC Circuit Analysis', desc: "Generation of sinusoidal AC voltage, average and RMS values, concept of phasor, analysis of series RL, RC and RLC circuits, power triangle, power factor, series resonance and Q factor. Generation of three phase voltages, advantages of three phase systems, star and delta connections (balanced only), relation between line and phase quantities." },
            { title: 'Unit 3: Electrical Machines', desc: "Definition, working principle and construction of transformer, construction & working principle of DC motor and three phase induction motor, single phase induction motor, application of rotating machines." },
            { title: 'Unit 4: Industrial Electrical Engineering', desc: "Power supply: linear power supply, switch mode power supply (SMPS), block diagram of UPS. Safety and protection: electric hazards and precautions, earthing, fuses, MCB, types of wires and cables, components of domestic wiring, electricity metering and billing." },
            { title: 'Unit 5: Electrical Energy Systems and Utilization', desc: "Power generation to distribution through overhead lines and underground cables with single line diagram, block schematic representation of hydroelectric and thermal power plants. Advantages of electrical heating, induction heating and its applications, dielectric heating and its applications, welding transformer." }
        ]),
        'Basic Programming with C': genSyllabusHTML([
            { title: 'Unit 1: Introduction to Computer and Problem-Solving Methodology', desc: "Computer System, Computing Environments, Software, Types of Software and Features of Software. Design Tools (Algorithm, Flow-Chart, Pseudo-Code). Types and Generations of Programming Languages. Compiler, Interpreter, Linker, Loader, Execution of Program. Develop an Algorithm for Simple Problems." },
            { title: 'Unit 2: Basics of Language', desc: "Character set, Identifier, Keywords, Constants, Data Types, Preprocessor Directives, Variables and Declaration, White Space and Escape Sequence, Operators and Expressions, Type Conversions, Operator Precedence and Associativity, Expression Evaluation, Input and Output Functions. Computational Problems Solving Based on the above Constructs." },
            { title: 'Unit 3: Control Statements', desc: "Selection (If, Else), Conditional Operator, Iteration (For, While, Do-While), Branching (Switch, Break, Continue, Goto), Nesting of Control Statements. Problem Solving Based on Control Statements." },
            { title: 'Unit 4: Arrays and Strings', desc: "Defining an Array, One Dimensional Array, Two-Dimensional Array, Multi-Dimensional Array. Basic Array Operations and Matrix Manipulation Operations (Addition, Subtraction, and Multiplication). Problem Solving Based on Array. Strings Definition, String Operations and String Functions. Problem Solving Based on Strings." },
            { title: 'Unit 5: Functions', desc: "Introduction, Functions Declaration, Definition, Calling, Return Statement, Parameter Passing (By Value), Recursion, Library Functions. Problem Solving Based on Functions." }
        ]),
        'Engineering Graphics': genSyllabusHTML([
            { title: 'Unit 1: Orthographic Projection of Point and line', desc: "Introduction of orthographic projection: Reference planes, types of orthographic projections– First angle projections, Third angle projection. Projections of points: Including points in all four quadrants Projections of lines: Line parallel to reference plane, perpendicular to reference plane, inclined to one reference plane, inclined to both reference planes, traces of line." },
            { title: 'Unit 2: Orthographic Projection of Planes and solids', desc: "Orthographic Projections of Planes: Projections of Planes in different Positions Orthographic Projection of Solids: Classification of solid. Projections in simple and complex positions of the axis of the solid." },
            { title: 'Unit 3: Section of solids and development of surfaces', desc: "Sections of Solids: Sectional views and true shape of the section. Development of Surfaces: Prism, Pyramid, Cone and Cylinder." },
            { title: 'Unit 4: Introduction to Auto CAD and its basic commands', desc: "User Interface – Menu system – coordinate systems, axesTool bars (draw, modify, annotations, layers, Blocks etc.) Status bar (ortho, grid, snap, iso etc.), Utility commands. Drawing Tools : Line, polyline, Circle, arc Rectangle, polygon Ellipse, Elliptical arc, spline Spline Edit, Xline, Ray, Points Measure, Divide , Donut, , hatch, Gradient, CAD, advantages and limitation of auto cad." },
            { title: 'Unit 5: Some advance commands of auto cad and orthographic projection using auto cad', desc: "Advance commands: Annotations Dimensions, dimension setting Linear dimension, Aligned dimension, Angular dimensions, arc length, Radius Diameter, ordinates, jogged Base line dimension, Dim base Continuous dimension TEXT: Text style, single text, multi text TOOLS Property: color, line type, Line weight, Match properties LAYERS Create layers, Edit layers properties Layer control (hide, freeze, lock Layout lock, print lock) Orthographic Projection using Auto CAD: Various Objects (Conversion of Pictorial Views to Orthographic Views)." }
        ]),
        'History of Science and Technology': genSyllabusHTML([
            { title: 'Unit 1: Historical Perspective', desc: "Nature of science and technology, Roots of science and technology in India, Role of Science and Scientists in Society, Science and Faith." },
            { title: 'Unit 2: Research and Development (R&D) in India', desc: "Science and Technology Education, Research activities and promotion of technology development, Technology mission, Programs aimed at technological self-reliance, activities of council of scientific and industrial research (CSIR)." },
            { title: 'Unit 3: Policies and Plans after Independence', desc: "Nehru’s vision of science for independent India, Science and technology developments in the new era, science and technology developments during the Five-Year Plan Periods and science and technology policy resolutions." },
            { title: 'Unit 4: Science and Technological Developments in Major Areas', desc: "Space – Objectives of space programs, Geostationary Satellite Services – INSAT system and INSAT services remote sensing applications, Launch Vehicle Technology. Ocean Development. Objectives of ocean development, marine research. Biotechnology - Applications of biotechnology in medicine, agriculture, food, and fuel. Energy – Research and development in the field of nonconventional energy resources, India’s nuclear energy program." },
            { title: 'Unit 5: Nexus between Technologies', desc: "Transfer of Technology – Types, Methods, Mechanisms, Process, Channels and Techniques, Appropriate technology, Technology assessment, Technological forecasting, Technological innovations and barriers of technological change." }
        ]),
        'Environmental Science': genSyllabusHTML([
            { title: 'Unit 1: Ecosystem and Biodiversity', desc: "Concept of Ecosystem, Food Chains, Food Webs, Energy flow in an ecosystem. Biodiversity: Introduction, Types, Significance and Conservation." },
            { title: 'Unit 2: Air Pollution', desc: "Causes, Effects and Control of Air Pollution, Greenhouse Effect - Climate changes and Global warming, Ozone layer depletion, Acid Rain. Case studies on recent cases of air pollution and management." },
            { title: 'Unit 3: Water Pollution', desc: "Causes, Effects and Control of Water Pollution, DO, BOD and COD, Water sampling, Municipal water treatment." },
            { title: 'Unit 4: Solid Waste Management', desc: "Introduction, Types of solid waste, Harmful effects of solid waste, Methods to manage and modern techniques for solid waste management." },
            { title: 'Unit 5: Disaster Management', desc: "Concept of Disaster, Types of Disaster, Pre-disaster risk and vulnerability reduction, Post disaster recovery and rehabilitation. Case studies on recent disasters and management." }
        ]),
        'Discrete Mathematics': genSyllabusHTML([
            { title: 'Unit 1', desc: "Sets, sub-sets and operations on sets, finite and infinite sets, principle of inclusion and exclusion. Relations and properties of relations – equivalence relation. Functions: definition, classification of functions, composition of functions, growth of functions, pigeonhole principle." },
            { title: 'Unit 2', desc: "Partial order relation, posets, least upper bound, greatest lower bound, maximal and minimal elements of a poset. Definition and example of Boolean algebra. Lattices, distributive laws in lattices, complemented lattices. Propositional calculus, Boolean functions, minterms and maxterms, simplification of Boolean functions with Karnaugh map and Quine–McCluskey method. Applications in computer science." },
            { title: 'Unit 3', desc: "Binary composition, algebraic structure, semigroup, monoid, groups, Abelian group, properties of groups. Coset decomposition, subgroup, cyclic group, normal subgroup. Rings and fields (definition and standard results). Applications in computer science." },
            { title: 'Unit 4', desc: "Trees: definition, binary tree, binary tree traversal, binary search tree. Graphs: definition and terminology, representation of graphs, multigraphs, bipartite graphs, planar graphs, isomorphism and homeomorphism of graphs. Euler and Hamiltonian paths, graph coloring. Application in computer science." },
            { title: 'Unit 5', desc: "Recurrence relation and generating function: recursive definition of functions, recursive algorithms, methods of solving recurrence relations. Combinatorics: introduction, counting techniques, basic theorems on permutations and combinations. Applications in computer science." }
        ]),
        'Computer System Architecture': genSyllabusHTML([
            { title: 'Unit 1', desc: "Difference between computer organization and computer architecture. Computer types, functional units, basic operational concepts, bus structures. Generation of computers. Introduction to computer operation with a simple 8-bit instruction computer illustrating assembly and machine language. Register transfer language, register transfer bus and memory transfers, arithmetic micro-operations, logic micro-operations, shift micro-operations, arithmetic logic shift unit." },
            { title: 'Unit 2', desc: "Instruction codes, registers, buses. Design of computer instructions, timing and control. Instruction cycle, memory reference instructions, input-output interrupt. Design of basic computer, accumulator logic. Programming the basic computer – machine language, assembly language, assembler. Address sequencing, microprogram instructions format, addressing modes." },
            { title: 'Unit 3', desc: "Computer arithmetic: addition and subtraction with signed magnitude. Multiplication and division algorithms. Divide overflow, Booth multiplication algorithm. Hardware implementation for signed magnitude and hardware algorithms." },
            { title: 'Unit 4', desc: "Input-output organization, input-output interface. Synchronous vs asynchronous data transfer. Modes of transfer – interrupt and its priority, DMA. Memory hierarchy: main memory, auxiliary memory, associative memory, cache memory, virtual memory, memory management hardware." },
            { title: 'Unit 5', desc: "Flynn’s classification. RISC and CISC processors. Pipelining and vector processing. Parallel processing, array processor, multiprocessor architectures organization. Multi-core architectures, inter-processor communication, system-on-chips." }
        ]),
        'Data Communication': genSyllabusHTML([
            { title: 'Unit 1', desc: "Introduction to digital communications, components, data representation, data flow. Analog and digital signals and their representation. Transmission impairment, data rate limits – Nyquist theorem, Shannon’s theorem. Signal propagation, signal types, transmission mode and techniques. Transmission media – guided and non-guided. Noise." },
            { title: 'Unit 2', desc: "Encoding of signals – analog to digital conversion, digital to digital conversion (unipolar, polar, bipolar line and block codes). Digital to analog conversion, analog to analog conversion. Spread spectrum – FHSS, DHSS, CDMA. Modulation and demodulation of signals. Multiplexing – FDM, TDM, WDM, QAM. Data compression – frequency dependent codes, run length encoding, relative encoding, LZ compression." },
            { title: 'Unit 3', desc: "Switched communication networks – circuit, message, packet and hybrid switching. Data gram network, connection oriented services vs connectionless services. Public switched telephone network, digital subscriber line – ADSL, HDSL, SDSL, VDSL. Study of various types of topology and their comparative study." },
            { title: 'Unit 4', desc: "Reference models – OSI and TCP/IP model and their comparison. Layers in the model and its requirement, critiques of OSI and TCP/IP model. Use of computer networks, architecture of internet. Addressing – physical, logical, port. Various networking devices. Peer to peer protocols and service model." },
            { title: 'Unit 5', desc: "Data link layer: transmission errors, content error, error detection and error correction. Bit error rate. Error detection methods – parity checking, checksum error detection, CRC, Hamming code. Framing, flow error control – ARQ, sliding window protocol, HDLC and PPP. Layer 2 switches, bridges." }
        ]),
        'Data Structures': genSyllabusHTML([
            { title: 'Unit 1', desc: "Definitions and types of data structures. Concept of linear and non-linear, static and dynamic, primitive and non-primitive, persistent and non-persistent data structure. Overview of array, one-dimensional and multidimensional array. Pointers, recursive functions." },
            { title: 'Unit 2', desc: "Concept of linked list organization – singly list, doubly list, circular list and doubly circular linked list. Operations: linked list implementation of stack and queue. Applications of linked list data structure." },
            { title: 'Unit 3', desc: "Stack: primitive stack operations, array implementation of stack, multiple stack. Application of stack – prefix and postfix expressions, evaluation of postfix expression, recursion, Tower of Hanoi problem. Queue: overview, operations on queue, circular queue, array implementation of queues, deque and priority queue." },
            { title: 'Unit 4', desc: "Searching and sorting: sequential search, binary search. Internal and external sort. Bubble sort, selection sort, insertion sort, shell sort, radix sort, quick sort and merge sort. Hashing: hash function, collision resolution strategies. Storage management: garbage collection and compaction." },
            { title: 'Unit 5', desc: "Trees: basic terminology, binary trees, binary tree representation, complete binary tree, algebraic expressions, extended binary trees. Array and linked representation of binary trees. Tree traversal, threaded binary trees, AVL tree, heaps. Graphs: basic terminology and types of graph, representation of graphs, graph traversal." }
        ]),
        'Java Programming': genSyllabusHTML([
            { title: 'Unit 1: Basics of Java', desc: "Overview of Java, history and evolution of Java, features of Java. Difference between Java, C++ and C. Structure of Java program. Basics of JDK, JRE and JVM, installation of JDK. Simple Java program, compilation and execution of Java program. Elements of Java: keywords, data types, variables, declaration and initialization of variable, scope and lifetime of variable, constants, literals, identifiers. Operators, types of Java statements. Unicode system, naming convention, comments, arrays, type conversion and casting." },
            { title: 'Unit 2', desc: "Dynamic method dispatch, garbage collection. Static and dynamic binding. Inheritance and its types. Interfaces. Java packages: definition of package, types of packages, differentiate package from header file, importing package, creating package." },
            { title: 'Unit 3', desc: "String in Java: overview of string, immutable string, string comparison, string concatenation, substring. Methods of string class. String buffer class. Creating immutable class to string method." },
            { title: 'Unit 4', desc: "Exception handling: defining exception, types of exception, exception class. Try and catch block, multiple catch blocks, nested try, finally block, throw keyword, exception propagation, throws keyword. Multithreading: overview of thread, thread types, life cycle of a thread, creating thread, sleeping a thread, joining a thread, thread priority, daemon thread." },
            { title: 'Unit 5', desc: "I/O handling: file output stream and file input stream, buffered output stream and buffered input stream. Input from keyboard by input stream reader, input from keyboard by console, input from keyboard by scanner. Print stream class. Java applets: applet basics, the applet class, applet architecture, applet initialization and termination, the HTML APPLET tag, passing parameters to applets. Introducing the AWT: introduction to windows, graphics and text, AWT classes, window fundamentals, component, container, panel, frame." }
        ]),
        'Object Oriented Programming': genSyllabusHTML([
            { title: 'Unit 1: Introduction to Object-Oriented Programming', desc: "Characteristics, applications, difference between object-oriented and procedure-based programming. Object-oriented programming languages. Object-oriented concepts: abstraction, encapsulation, polymorphism, inheritance and information hiding." },
            { title: 'Unit 2: Abstract Data Types, Objects and Classes', desc: "Attributes and methods, objects as software units. Encapsulation and information hiding. Object instantiation and interactions. Object lifetime. Static and dynamic objects. Global and local objects. Meta-class." },
            { title: 'Unit 3: Relationship Between Classes', desc: "Association of objects. Types of association. Recursive association. Multiplicity. Navigability. Named association. Aggregation of objects. Types of aggregation. Delegation. Modeling association and aggregation." },
            { title: 'Unit 4: Inheritance and Polymorphism', desc: "Types of polymorphism – static and dynamic polymorphism. Operator and method overloading. Inherited methods, redefined methods, protected interface. Abstract methods and classes. Public and protected properties, private operations. Disinheritance, multiple inheritance." },
            { title: 'Unit 5: Template Classes and Functions', desc: "Container classes, container types, typical functions and iterator methods. Heterogeneous containers. Persistent objects, stream and files. Object-oriented programming languages." }
        ]),
        'Digital Electronics': genSyllabusHTML([
            { title: 'Unit 1: Number System', desc: "Introduction to binary numbers, data representation, binary, octal, hexadecimal number system and their conversion. Various coding schemes such as BCD codes, excess-3 code, Gray code. Binary arithmetic. Boolean algebra, basic theorems and properties of Boolean algebra. Boolean functions, canonical and standard forms. Minimization techniques, sum of products and product of sums simplification. Karnaugh map method, Quine–McCluskey method." },
            { title: 'Unit 2: Logic Gates and Combinational Logic', desc: "Digital logic gates such as AND, OR, NAND, NOR, EX-OR, EX-NOR. Realization of Boolean functions using logic gates. Adders, subtractors, BCD adder, magnitude comparator, decoders and encoders, multiplexers and demultiplexers, code converters. Analysis and design of combinational circuits. Implementation of combinational logic using multiplexers and decoders." },
            { title: 'Unit 3: Sequential Circuits', desc: "Introduction and comparison of sequential and combinational circuits. Various types of flip-flops and their conversions. Triggering of flip-flops, timing issues, setup and hold times. Registers, counters, ring, Johnson, asynchronous and synchronous counters. Finite state machines, Moore and Mealy design of synchronous sequential circuits." },
            { title: 'Unit 4: Memories', desc: "ROM, PLA and PAL. Memories: organization and construction of RAM, SRAM, DRAM, ROM, PROM, EPROM, EEPROM." },
            { title: 'Unit 5: Logic Families', desc: "DTL, RTL, TTL, IIL, PMOS, NMOS and CMOS logic families. Interfacing between TTL and MOS logic families." }
        ])
    };

    if (type === 'summary') {
        title = '✨ AI Concept Summary';
        content = `<div style="text-align: center; padding: 2rem;"><p style="color: var(--text-dim); line-height: 1.6;">Gemini is generating a high-yield summary for <b style="color: white;">${subject}</b> based on the latest syllabus...</p><div class="loader-pro" style="margin: 2rem auto;"></div><p style="font-size: 0.8rem; color: var(--secondary); margin-top: 1rem;">(Feature processing available in Pro Sandbox)</p></div>`;
    } else if (type === 'questions') {
        title = '📝 Model Exam Questions';
        content = `<div style="text-align: center; padding: 2rem;"><p style="color: var(--text-dim); line-height: 1.6;">Generating a mock question paper for <b style="color: white;">${subject}</b> including 2-mark and 10-mark questions...</p><div class="loader-pro" style="margin: 2rem auto;"></div><p style="font-size: 0.8rem; color: var(--secondary); margin-top: 1rem;">(Feature processing available in Pro Sandbox)</p></div>`;
    } else if (type === 'syllabus') {
        title = '📖 Subject Syllabus';

        let exactMatch = syllabiDB[subject];
        if (!exactMatch) {
            // fuzzy fallback check
            for (let key in syllabiDB) {
                if (subject.toLowerCase().includes(key.toLowerCase())) {
                    exactMatch = syllabiDB[key];
                    break;
                }
            }
        }

        if (exactMatch) {
            content = exactMatch;
            isSyllabusAvailable = true;
        } else {
            content = `<div style="text-align: center; padding: 2rem;"><p style="color: var(--text-dim); line-height: 1.6;">Loading the official syllabus structure for <b style="color: white;">${subject}</b>...</p><div class="loader-pro" style="margin: 2rem auto;"></div><p style="font-size: 0.8rem; color: var(--secondary); margin-top: 1rem;">(Feature processing available in Pro Sandbox)</p></div>`;
        }
    }

    // Create custom modal if it doesn't exist
    let modal = document.getElementById('dynamic-ai-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'dynamic-ai-modal';
        modal.style.cssText = `
            display: none; position: fixed; z-index: 10000; left: 0; top: 0; width: 100%; height: 100%;
            background-color: rgba(0, 0, 0, 0.8); backdrop-filter: blur(8px);
            align-items: center; justify-content: center;
        `;

        modal.innerHTML = `
            <div style="background: rgba(23, 23, 23, 0.95); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; width: 90%; max-width: 600px; padding: 2.5rem; position: relative; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); animation: modalFadeIn 0.3s ease-out;">
                <button onclick="document.getElementById('dynamic-ai-modal').style.display='none'" style="position: absolute; top: 1.5rem; right: 1.5rem; background: none; border: none; color: var(--text-dim); font-size: 1.5rem; cursor: pointer;">&times;</button>
                <div style="margin-bottom: 2rem; text-align: center;">
                    <h2 id="dynamic-ai-modal-title" style="font-size: 1.75rem; font-weight: 700; margin-bottom: 0.5rem; font-family: 'JetBrains Mono', monospace;"></h2>
                </div>
                <div id="dynamic-ai-modal-content"></div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    document.getElementById('dynamic-ai-modal-title').innerText = title;
    document.getElementById('dynamic-ai-modal-content').innerHTML = content;

    modal.style.display = 'flex';
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

    const { db, collection, query, orderBy, limit, onSnapshot } = window.firebaseServices || {};
    if (!db) {
        list.innerHTML = '<p style="text-align:center; padding: 2rem; color: var(--text-dim);">Syncing with Cloud Hub...</p>';
        return;
    }

    // Determine collection and ordering based on type
    let colRef;
    let orderField;

    if (type === 'college') {
        colRef = collection(db, "colleges");
        orderField = "views"; // Assume views for colleges
    } else {
        colRef = collection(db, "users");
        orderField = type === 'student' ? "xp" : "uploads";
    }

    const q = query(colRef, orderBy(orderField, "desc"), limit(20));

    onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (data.length === 0) {
            list.innerHTML = '<p style="text-align:center; padding: 2rem; color: var(--text-dim);">No rankings found yet. Be the first!</p>';
            return;
        }

        // --- Update "Your Standing" Widget ---
        if (window.currentUser) {
            const myRank = data.findIndex(item => item.id === window.currentUser.id || item.name === window.currentUser.name) + 1;
            const myScore = data.find(item => item.id === window.currentUser.id || item.name === window.currentUser.name)?.[orderField] || 0;

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
        }

        list.innerHTML = data.map((item, index) => {
            const rankClass = index < 3 ? `top-3 rank-${index + 1}` : '';
            const rankIcon = index < 3 ? ['🥇', '🥈', '🥉'][index] : `#${index + 1}`;

            // Systematic logo/avatar rendering
            const imgPath = item.logo || item.avatar;
            let avatarHtml = '';

            if (imgPath) {
                avatarHtml = `<img src="${imgPath}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
                              <span class="lb-avatar-letter" style="display:none">${item.name ? item.name[0] : '?'}</span>`;
            } else {
                avatarHtml = `<span class="lb-avatar-letter">${item.name ? item.name[0] : '?'}</span>`;
            }

            let metaHtml = '';
            if (type === 'student') {
                metaHtml = `<span class="score-val">${item.xp || 0} XP</span><span class="score-label">Points</span>`;
            } else if (type === 'contributor') {
                metaHtml = `<span class="score-val">${item.uploads || 0}</span><span class="score-label">Uploads</span>`;
            } else if (type === 'college') {
                metaHtml = `<span class="score-val">${formatNumber(item.views || 0)}</span><span class="score-label">Total Views</span>`;
            }

            return `
                <div class="lb-entry ${rankClass}">
                    <div class="lb-rank rank-${index + 1}">${rankIcon}</div>
                    
                    <div class="lb-user-content">
                        <div class="lb-avatar-container">
                            ${avatarHtml}
                            ${index === 0 ? '<div class="lb-badge">👑</div>' : ''}
                        </div>
                        <div class="lb-info">
                            <h4>${item.name || "Anonymous"}</h4>
                            <p>${type === 'college' ? (item.city || 'University') : (item.collegeName || "Student")}</p>
                        </div>
                    </div>

                    <div class="lb-score">
                        ${metaHtml}
                    </div>
                </div>
            `;
        }).join('');
    });
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

             <div id="private-files-grid" class="private-files-grid-pro" style="display: grid; gap: 1.5rem;">
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
    if (!db || !currentUser || currentUser.isGuest) return;

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
