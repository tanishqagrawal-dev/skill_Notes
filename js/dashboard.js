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
    colleges: [
        { id: 'medicaps', name: 'Medi-Caps University', status: 'active' },
        { id: 'lnct', name: 'LNCT College Bhopal', status: 'active' },
        { id: 'lpu', name: 'Lovely Professional University', status: 'active' },
        { id: 'iitd', name: 'IIT Delhi', status: 'locked' }
    ], // Now fetched dynamically from Firestore, seeded with defaults for refresh reliability
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
            { id: 'applied-chemistry', name: 'Applied Chemistry', icon: '🧪', code: 'CH3001T', description: 'Chemical engineering properties and basics.' },
            { id: 'math-1', name: 'Engineering Mathematics-I', icon: '📐', code: 'MA3001T', description: 'Calculus, Linear Algebra and differential equations.' },
            { id: 'basic-mech', name: 'Basic Mechanical Engineering', icon: '⚙️', code: 'ME3001T', description: 'Introduction to mechanical engineering systems.' },
            { id: 'graphics', name: 'Engineering Graphics', icon: '📐', code: 'ME3003T', description: 'Technical drawing, projection and CAD basics.' },
            { id: 'workshop', name: 'Engineering Workshop', icon: '🛠️', code: 'ME3002P', description: 'Hands-on practice with tools.' },
            { id: 'c-prog', name: 'Programming with C', icon: '💻', code: 'CS3001T', description: 'Introduction to algorithmic logic and C programming.' },
            { id: 'comm-skills', name: 'Communication Skills', icon: '🗣️', code: 'LN3001T', description: 'Professional writing and verbal communication.' }
        ],
        'cse-Semester 2': [
            { id: 'applied-physics', name: 'Applied Physics', icon: '⚛️', code: 'PH3001T', description: 'Quantum physics, optics and semiconductor theory.' },
            { id: 'math-2', name: 'Engineering Mathematics -II', icon: '📉', code: 'MA3002T', description: 'Advanced calculus, Fourier series and complex variables.' },
            { id: 'civil-mech', name: 'Basic Civil Engineering & Mechanics', icon: '🏗️', code: 'CE3001T', description: 'Civil engineering fundamentals and applied mechanics.' },
            { id: 'bee', name: 'Basic Electrical & Electronics Engineering', icon: '🔌', code: 'EE3001T', description: 'Semiconductor devices and circuits.' },
            { id: 'python', name: 'Python Programming', icon: '🐍', code: 'CS3002T', description: 'Programming with Python for general applications.' }
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
            { id: 'micro', name: 'Microprocessor and Interfacing', icon: '📟', code: 'CS3CO35', description: `<b>UNIT-1: Introduction to 8-bit microprocessor</b><br>Microcomputers and microprocessors, 8/16/32/64-bit families; Intel 8085 architecture: Registers, Bus Organization, Control signals, Multiplexing. Intel 8086, x86 and Pentium Block diagrams.<br><b>UNIT-2: Assembly Language Programming</b><br>8085 instructions set: Classifications, Addressing modes, Stack and Subroutines, Delay routines, Counters.<br><b>UNIT-3: Interfacing concepts and devices</b><br>Memory interface, I/O mapped I/O vs memory mapped I/O. Programmable devices: 8255 (PPI), 8253/54 (Timer), 8279 (Keyboard/Display), 8251 (Serial communication).<br><b>UNIT- 4: Instruction Timing and Interrupts</b><br>Timing Diagrams: T-state, Machine cycle. Interrupts: h/w and s/w, Maskable / Non maskable.<br><b>UNIT-5: Introduction to Intel Architecture</b><br>Core 2 Duo Processor: CPU, Memory Controller, I/O Controller; Intel Core i7 Architecture, QuickPath Interconnect. Texas Instruments Multi-Core SoC architecture.` },
            { id: 'adv-java', name: 'Advanced Java Programming', icon: '☕', code: 'CS3CO37', description: 'Servlets, JSP, JDBC and enterprise application components.' },
            { id: 'dbms', name: 'Database Management Systems', icon: '🗄️', code: 'CS3CO39', description: 'Relational databases, SQL, normalization and transaction management.' },
            { id: 'toc', name: 'Theory of Computation', icon: '🧠', code: 'CS3CO46', description: 'Finite automata, context-free grammars and Turing machines.' },
            { id: 'os', name: 'Operating Systems', icon: '💾', code: 'CS3CO47', description: 'Process management, synchronization and file systems.' },
            { id: 'iwt', name: 'Internet and Web Technology', icon: '🌐', code: 'CS3EW04', description: `<b>Unit – I: Introduction</b><br>Concept of WWW, HTTP Protocol, web browser architecture, Web 2.0, TCP/IP, DNS, SMTP, POP3.<br><b>Unit – II: Web Design</b><br>Web architecture, HTML: lists, tables, frames, forms. DTD, DOM. CSS and Javascript (forms, functions, objects).<br><b>Unit – III: XML</b><br>Introduction to XML, XML vs HTML, DTD and schemas. Embedding XML, Transforming XML using CSS, XSL, and XSLT.<br><b>Unit – IV: PHP</b><br>Variables, program flow, functions, arrays, files. Working with forms and databases. Servlet lifecycle and API.<br><b>Unit – V: JSP & Frameworks</b><br>Java Server Pages (JSP), application design, session data. Database programming using JDBC. MVC framework, Bootstrap, AngularJS.` },
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
        ],
        // --- LNCT COLLEGE BHOPAL (Unique Subjects) ---
        'lnct-cse-Semester 1': [
            { id: 'chemistry', name: 'Engineering Chemistry', icon: '🧪', code: 'BT101', description: 'Chemical engineering properties and basics.' },
            { id: 'math-1', name: 'Mathematics I', icon: '📐', code: 'BT102', description: 'Calculus, Linear Algebra and differential equations.' },
            { id: 'english', name: 'English for Communication', icon: '🗣️', code: 'BT103', description: 'Professional writing and verbal communication.' },
            { id: 'bee', name: 'Basic Electrical & Electronics Engineering', icon: '🔌', code: 'BT104', description: 'Semiconductor devices and circuits.' },
            { id: 'graphics', name: 'Engineering Graphics', icon: '📐', code: 'BT105', description: 'Technical drawing, projection and CAD basics.' },
            { id: 'mfg-prac', name: 'Manufacturing Practices', icon: '🛠️', code: 'BT106', description: 'Hands-on practice with tools.' }
        ],
        'lnct-cse-Semester 2': [
            { id: 'physics', name: 'Engineering Physics', icon: '⚛️', code: 'BT201', description: 'Quantum physics, optics and semiconductor theory.' },
            { id: 'math-2', name: 'Mathematics II', icon: '📉', code: 'BT202', description: 'Advanced calculus, Fourier series and complex variables.' },
            { id: 'basic-mech', name: 'Basic Mechanical Engineering', icon: '⚙️', code: 'BT203', description: 'Introduction to mechanical engineering systems.' },
            { id: 'bcem', name: 'Basic Civil Engineering & Mechanics', icon: '🏗️', code: 'BT204', description: 'Civil engineering fundamentals and applied mechanics.' },
            { id: 'bce', name: 'Basic Computer Engineering', icon: '💻', code: 'BT205', description: 'Core principles of computer systems and logic.' },
            { id: 'lab-seminar', name: 'Language Lab & Seminars', icon: '🗣️', code: 'BT206', description: 'Advanced communication and presentation skills.' }
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

// Initialization Guards (Prevent duplicate boot on refresh/auth sync)
let isNotesSyncInit = false;
let isCollegesInit = false;
let isStatsInit = false;
let isNotificationsInit = false;
let isLeaderboardInit = false;

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
            try {
                if (typeof initTabs === 'function') initTabs();
                if (typeof listenToNotifications === 'function') listenToNotifications();

                // Fire parallel background workers (Only if not already running)
                if (!dashboardReady || isNewSession || !appCurrentUser) {
                    const initPromises = [];
                    if (!isStatsInit && typeof loadLiveDashboardStats === 'function') initPromises.push(loadLiveDashboardStats());
                    if (typeof trackStudent === 'function') initPromises.push(trackStudent());
                    if (window.statServices?.initRealtimeStats && !isStatsInit) initPromises.push(window.statServices.initRealtimeStats());
                    if (!isCollegesInit && typeof initDynamicColleges === 'function') initPromises.push(initDynamicColleges());
                    if (!isNotesSyncInit && typeof initNotesSync === 'function') initPromises.push(initNotesSync());

                    Promise.all(initPromises).catch(err => console.error("⚡ Background Init Error:", err));
                }
                dashboardReady = true;
            } catch (err) {
                console.error("❌ Diagnostic Error:", err);
            }
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
                const dashIdx = pathParts.findIndex(p => p === 'dashboard' || p === 'dashboard');
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
    if (isCollegesInit) return Promise.resolve();
    const { db, collection, onSnapshot } = getFirebase();
    if (!db) return;

    isCollegesInit = true; // Mark as started/pending
    return new Promise((resolve) => {
        onSnapshot(collection(db, 'colleges'), (snap) => {
            GlobalData.colleges = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            console.log("🏫 Dynamic Colleges Synced:", GlobalData.colleges.length);
            window.dispatchEvent(new CustomEvent('collegesUpdated', { detail: GlobalData.colleges }));
            resolve();
        });
    });
}

function initNotesSync() {
    if (isNotesSyncInit) return;
    const { db, collection, onSnapshot, query, limit } = getFirebase();
    if (!db || unsubscribeNotes) return;

    isNotesSyncInit = true;
    console.log("📡 Initializing Notes Hub Synchronization (Limited)...");
    
    // We limit the global cache to save massively on reads. The Notes Hub handles its own fetching.
    const q = query(collection(db, 'notes'), limit(50));
    unsubscribeNotes = onSnapshot(q, (snap) => {
        const newData = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Only update and re-render if data actually changed to prevent loops
        if (JSON.stringify(NotesDB) !== JSON.stringify(newData)) {
            NotesDB = newData;
            console.log(`📦 Notes Hub Updated: ${NotesDB.length} records in cache.`);

            // Trigger UI refreshes if on a hub page (Avoid blind re-renders)
            const verificationHub = document.getElementById('admin-drop-zone');
            if (verificationHub) {
                const contentArea = document.getElementById('tab-content');
                if (contentArea) renderTabContent('moderation-hub');
            }
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

    // --- GLOBAL SEARCH IMPLEMENTATION ---
    const globalSearchInput = document.getElementById('global-search-input');
    const searchIcon = document.querySelector('.search-bar .search-icon');
    const searchBarContainer = document.querySelector('.search-bar');

    // Remove any existing results to prevent duplicates on re-init
    document.querySelectorAll('.global-search-results').forEach(el => el.remove());

    // Create Results Dropdown
    const searchResults = document.createElement('div');
    searchResults.className = 'global-search-results glass-card';
    searchResults.style.display = 'none';
    if (searchBarContainer) searchBarContainer.appendChild(searchResults);

    function updateSearchResults(query) {
        if (!query.trim() || query.length < 2) {
            searchResults.style.display = 'none';
            return;
        }

        const lowQuery = query.toLowerCase().trim();
        const matches = [];

        // 1. Search Subjects
        for (const [key, list] of Object.entries(GlobalData.subjects)) {
            list.forEach(s => {
                if (s.name.toLowerCase().includes(lowQuery) || (s.code && s.code.toLowerCase().includes(lowQuery))) {
                    if (!matches.find(m => m.id === s.id)) {
                        matches.push({ ...s, type: 'subject', key });
                    }
                }
            });
        }

        // Limit results to 6 for performance/UX
        const displayMatches = matches.slice(0, 6);

        if (displayMatches.length > 0) {
            searchResults.innerHTML = displayMatches.map(m => `
                <div class="search-result-item" onclick="performGlobalSearch('${m.id}')">
                    <div class="result-icon-box">${m.icon || '📚'}</div>
                    <div class="result-info-content">
                        <div class="result-name-text">${m.name}</div>
                        <div class="result-meta-text">${m.code || 'Academic'} • ${m.key.split('-')[0].toUpperCase()}</div>
                    </div>
                    <span class="result-type-badge">Subject</span>
                </div>
            `).join('') + `
                <div class="search-result-footer-link" onclick="performGlobalSearch('${query}')">
                    🔍 Deep search all notes for "${query}"
                </div>
            `;
            searchResults.style.display = 'flex';
        } else {
            searchResults.innerHTML = `
                <div class="search-result-footer-link" onclick="performGlobalSearch('${query}')">
                             🔍 No direct subject match. Search all notes for "${query}"?
                </div>
            `;
            searchResults.style.display = 'flex';
        }
    }

    // Function to perform search
    window.performGlobalSearch = function(queryOrId) {
        if (!queryOrId || !queryOrId.trim()) return;
        if (searchResults) searchResults.style.display = 'none';
        
        const lowQuery = queryOrId.toLowerCase().trim();
        let foundSubject = null;
        let foundKey = null;

        // 1. Resolve Subject (by ID or exact Name match)
        for (const [key, list] of Object.entries(GlobalData.subjects)) {
            // First try exact ID match (most reliable)
            const idMatch = list.find(s => s.id === queryOrId);
            if (idMatch) {
                foundSubject = idMatch;
                foundKey = key;
                break;
            }
            
            // Second try name inclusion
            const nameMatch = list.find(s => 
                s.name.toLowerCase() === lowQuery || 
                s.name.toLowerCase().includes(lowQuery)
            );
            if (nameMatch) {
                foundSubject = nameMatch;
                foundKey = key;
                // Don't break yet, exact match preferred
                if (nameMatch.name.toLowerCase() === lowQuery) break;
            }
        }

        if (foundSubject) {
            const [branchId, sem] = foundKey.split('-');
            console.log(`✅ Subject Found: ${foundSubject.name} in ${branchId} (${sem})`);
            
            const collegeId = localStorage.getItem('user_college_id') || 'medicaps';
            const college = window.GlobalData.colleges.find(c => c.id === collegeId) || { id: collegeId, name: 'University' };
            const branch = window.GlobalData.branches.find(b => b.id === branchId) || { id: branchId, name: branchId.toUpperCase() };

            const semToYear = {
                'Semester 1': '1st Year', 'Semester 2': '1st Year',
                'Semester 3': '2nd Year', 'Semester 4': '2nd Year',
                'Semester 5': '3rd Year', 'Semester 6': '3rd Year',
                'Semester 7': '4th Year', 'Semester 8': '4th Year'
            };

            // Fully synchronize state
            window.selState.college = college;
            window.selState.branch = branch;
            window.selState.semester = sem;
            window.selState.year = semToYear[sem] || 'Scholar';
            window.selState.subject = foundSubject;

            // Trigger navigation
            if (window.RoutingSystem) {
                window.RoutingSystem.updateURL(window.selState);
            }

            // switch tab
            const notesTab = document.querySelector('.nav-item[data-tab="notes"]');
            if (notesTab) {
                document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
                notesTab.classList.add('active');
                renderTabContent('notes');
                setTimeout(() => {
                    if (window.showNotes) window.showNotes();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }, 100);
                return;
            }
        }

        // Fallback: Perform general keyword search in notes
        console.log("🔍 Fallback Search for:", queryOrId);
        if (globalSearchInput) globalSearchInput.value = queryOrId;
        const notesTab = document.querySelector('.nav-item[data-tab="notes"]');
        if (notesTab) {
            notesTab.click();
            setTimeout(() => {
                const searchBox = document.getElementById('search-notes');
                if (searchBox) {
                    searchBox.value = queryOrId;
                    searchBox.focus();
                    searchBox.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }, 150);
        }
    };

    if (globalSearchInput) {
        globalSearchInput.addEventListener('input', (e) => updateSearchResults(e.target.value));

        globalSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performGlobalSearch(e.target.value);
            }
        });

        // Hide results on blur/outside click
        document.addEventListener('click', (e) => {
            if (searchBarContainer && !searchBarContainer.contains(e.target)) {
                searchResults.style.display = 'none';
            }
        });

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
    if (!currentUser || currentUser.isGuest || currentUser.id === 'guest') {
        const overlay = document.createElement('div');
        overlay.id = 'strict-login-overlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.8); backdrop-filter: blur(8px);
            z-index: 99999; display: flex; align-items: center; justify-content: center;
        `;
        overlay.innerHTML = `
            <div class="lockCard" style="text-align: center;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🔒</div>
                <h1 class="coming-soon-title" style="font-size: 1.8rem; margin-bottom: 0.5rem; line-height: 1.2;">Login Required</h1>
                <p class="development-caption" style="margin-bottom: 1.5rem;">Only verified students can upload notes.</p>
                <div style="display: flex; gap: 1rem; width: 100%;">
                    <button class="btn btn-ghost" style="flex: 1; border: 1px solid var(--border-glass);" onclick="document.getElementById('strict-login-overlay').remove()">Cancel</button>
                    <button class="btn btn-primary" style="flex: 1;" onclick="window.location.href='auth'">Login Now</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
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
        modal.style.transition = 'opacity 0.3s ease';
        modal.style.opacity = '0';
        modal.style.pointerEvents = 'none';
        document.body.style.overflow = 'auto';
        setTimeout(() => { if (modal.parentNode) modal.parentNode.removeChild(modal); }, 350);
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
        status: 'pending', // Restore manual admin verification
        verified: false,
        approvedBy: 'pending',
        approvedAt: null
    };

    try {
        const result = await window.uploadNoteToFirebase(file, metadata);

        // Step 1: Show success toast
        if (window.showToast) window.showToast("✅ Note uploaded successfully! Pending review.");
        statusText.innerText = "✅ Uploaded! Redirecting...";
        const pBar = document.querySelector('.dash-progress-fill');
        if (pBar) pBar.style.width = '100%';

        // Step 2: Immediately close modal + navigate to My Uploads (no delay needed)
        setTimeout(() => {
            // Close & destroy modal from DOM
            closeDashboardUploadModal();

            // Reset form state
            try {
                document.getElementById('dash-upload-form').reset();
                document.getElementById('upload-status-area').style.display = 'none';
            } catch(fe) {}

            // Navigate to My Uploads tab
            const myUploadsTab = document.querySelector('.nav-item[data-tab="my-uploads"]');
            if (myUploadsTab) {
                myUploadsTab.click();
            } else {
                if (typeof renderTabContent === 'function') renderTabContent('my-uploads');
            }
        }, 800);

    } catch (err) {
        console.error("Upload failed:", err);
        statusText.innerText = "❌ Failed: " + err.message;
        if (window.showToast) window.showToast("Upload failed: " + err.message);
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
let isTabsInit = false;
function initTabs() {
    if (isTabsInit) return;
    isTabsInit = true;
    const sidebarNav = document.querySelector('.sidebar-nav');
    if (!sidebarNav || !currentUser) return;

    // Reset Sidebar to Base State (Overview, Notes, Planner, AI Tools, Leaderboard)
    // We assume HTML has the base items. We just append.

    // Clear previously injected dynamic items
    document.querySelectorAll('.dynamic-node').forEach(n => n.remove());

    // Dynamic items are appended at the end of the main navigation
    const anchorNode = null; 

    // 1. My Uploads
    const myUploads = createNavItem('my-uploads', '📤', 'My Uploads', true);
    sidebarNav.insertBefore(myUploads, anchorNode);

    // 3. Moderation & Admin Tools
    if (currentUser.role === 'coadmin' || currentUser.role === 'admin' || currentUser.role === 'superadmin') {
        // Co-Admin Hub - Locked
        const modHub = createNavItem('moderation-hub', '🛡️', 'Moderation Hub <span style="font-size:0.6rem; background:rgba(255,255,255,0.1); padding:2px 6px; border-radius:4px; margin-left:5px;">🔒</span>', true);
        modHub.style.opacity = '0.6';
        modHub.style.cursor = 'not-allowed';
        modHub.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            alert("🔒 Moderation Hub is coming soon!");
        };
        sidebarNav.insertBefore(modHub, anchorNode);
    }

    if (currentUser.role === 'admin' || currentUser.role === 'superadmin') {
        const adminConsole = createNavItem('admin-console', '🚨', 'Command Center', true);
        sidebarNav.insertBefore(adminConsole, anchorNode);
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

    // --- URL SYNCHRONIZATION ---
    let basePath = window.location.pathname;
    const pathParts = basePath.split('/');
    const pagesIdx = pathParts.indexOf('pages');
    if (pagesIdx !== -1) {
        basePath = pathParts.slice(0, pagesIdx + 1).join('/') + '/dashboard';
    }

    if (tabId === 'notes') {
        // If moving to notes, we use hash routing. Ensure query params are cleared.
        if (window.location.search !== '' || !window.location.hash.startsWith('#/notes')) {
            if (typeof RoutingSystem !== 'undefined') {
                const notesHash = RoutingSystem.generateCanonicalPath(selState);
                window.history.pushState({ tab: 'notes' }, '', basePath + notesHash);
            }
        }
    } else {
        // Moving to a standard tab. Use query params and clear the hash.
        const targetPath = tabId === 'overview' ? basePath : `${basePath}?tab=${tabId}`;
        if (window.location.pathname + window.location.search !== targetPath || window.location.hash !== '') {
            window.history.pushState({ tab: tabId }, '', targetPath);
        }
    }

    try {
        if (tabId === 'overview') {
            console.log("➡️ Rendering Overview...");
            contentArea.innerHTML = renderOverview();
        } else if (tabId === 'notes') {
            // 🎯 FAST PATH: If we already have a subject selected (e.g. from Global Search), 
            // render the hub and show notes immediately, bypassing the onboarding wizard.
            if (window.selState && window.selState.subject && window.selState.college) {
                console.log("🚀 Direct Subject Navigation Detected:", window.selState.subject.name);
                contentArea.innerHTML = renderNotesHub();
                if (window.showNotes) window.showNotes();
                return;
            }

            // Standard Explorer Logic
            const hasPathFilters = window.location.hash.split('/').length > 2 || 
                                   window.location.pathname.split('/').length > 4;
            
            if (!hasPathFilters) {
                window.selState.college = null; window.selState.branch = null; window.selState.year = null; window.selState.subject = null; window.selState.semester = null;
            }

            contentArea.innerHTML = renderNotesHub();

            if (!hasPathFilters) {
                renderCollegeStep();
                if (window.RoutingSystem) window.RoutingSystem.updateURL(window.selState);
            } else {
                // Sync UI with URL filters
                if (window.RoutingSystem) {
                    const nextStep = window.RoutingSystem.applyFiltersToUI(GlobalData, (k, v) => { window.selState[k] = v; });
                    if (nextStep === "SHOW_NOTES") {
                        if (window.showNotes) window.showNotes();
                    } else if (nextStep === "SUBJECT_STEP") {
                        if (window.renderSubjectStep) window.renderSubjectStep();
                    } else if (nextStep === "SEMESTER_STEP" || nextStep === "YEAR_STEP") {
                        if (window.renderSemesterStep) window.renderSemesterStep();
                    } else if (nextStep === "BRANCH_STEP") {
                        if (window.renderBranchStep) window.renderBranchStep();
                    } else {
                        renderCollegeStep();
                    }
                }
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
            // Leaderboard is unlocked globally now to display xp
            contentArea.innerHTML = renderLeaderboard();
            if (typeof initLeaderboardListeners === 'function') initLeaderboardListeners();
        } else if (tabId === 'bookmarks') {
            if (window.renderBookmarks) {
                window.renderBookmarks();
            } else {
                contentArea.innerHTML = `<p>Loading Bookmarks...</p>`;
            }
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
        } else if (tabId === 'focusflow') {
            if (window.renderFocusFlow) {
                contentArea.innerHTML = window.renderFocusFlow();
                if (window.initFocusFlow) window.initFocusFlow();
            } else {
                contentArea.innerHTML = `<p>Loading FocusFlow Pro...</p>`;
            }
        } else if (tabId === 'cgpa-analyzer') {
            if (window.renderCGPAAnalyzer) {
                contentArea.innerHTML = window.renderCGPAAnalyzer();
                if (window.initCGPAAnalyzer) window.initCGPAAnalyzer();
            } else {
                contentArea.innerHTML = `<p>Loading CGPA Analyzer...</p>`;
            }
        } else if (tabId === 'attendance') {
            if (window.AttendancePro) {
                contentArea.innerHTML = window.AttendancePro.render();
            } else {
                contentArea.innerHTML = `<p>Loading Attendance Pro...</p>`;
            }
        } else if (tabId === 'profile') {
            if (window.profileManager) {
                contentArea.innerHTML = window.profileManager.render();
                if (window.profileManager.userData) {
                    window.profileManager.hydrateUI(window.profileManager.userData);
                }
            } else {
                contentArea.innerHTML = `
                    <div class="loading-state" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 1.5rem;">
                        <div class="loader-pro"></div>
                        <p style="color: var(--text-dim); font-weight: 500; letter-spacing: 1px;">INITIALIZING MATRiX CORE...</p>
                    </div>
                `;
            }
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

    if (!currentUser) {
        return renderDashboardSkeleton();
    }

    const userName = (currentUser.name || "Scholar").split(' ')[0];
    const college = currentUser.collegeName || currentUser.college || 'Medicaps University';
    
    let rawY = String(currentUser.year || '3');
    let yLabel = rawY;
    if (rawY === '1') yLabel = '1st Year';
    else if (rawY === '2') yLabel = '2nd Year';
    else if (rawY === '3') yLabel = '3rd Year';
    else if (rawY === '4') yLabel = '4th Year';
    else if (rawY && !rawY.toLowerCase().includes('year')) yLabel = rawY + ' Year';

    const branch = (currentUser.branch || 'CSE').toUpperCase();
    const roleLabel = currentUser.role !== 'user' ? `🛡️ Verified ${currentUser.role.toUpperCase()}` : `${yLabel} • ${branch}`;

    const userStats = currentUser.stats || { subjects: {} };
    const readinessData = [
        { name: 'Discrete Mathematics', progress: userStats.subjects?.dm?.readiness || 85, color: '#2ecc71', id: 'dm' },
        { name: 'Digital Electronics', progress: userStats.subjects?.de?.readiness || 60, color: '#f1c40f', id: 'de' },
        { name: 'Object Oriented Programming', progress: userStats.subjects?.oop?.readiness || 30, color: '#e74c3c', id: 'oop' }
    ];

    const isGuest = !currentUser.email;

    const allGlobalNotes = [];
    if (globalNotes && globalNotes.global) {
        Object.values(globalNotes.global).forEach(arr => allGlobalNotes.push(...arr));
    }

    const combinedNotes = [...(window.NotesDB || []), ...allGlobalNotes];

    const topNotes = combinedNotes
        .filter(n => n.status === 'approved')
        .sort((a, b) => ((b.likes || 0) + (b.downloads || 0) + (b.views || 0)) - ((a.likes || 0) + (a.downloads || 0) + (a.views || 0)))
        .slice(0, 3);

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

    const isProfileIncomplete = !currentUser.program || !currentUser.year || !currentUser.branch || !currentUser.college;
    const alertBannerHtml = (isProfileIncomplete && !isGuest) ? `
        <div class="profile-alert-banner fade-in">
            <div class="alert-glass-shine"></div>
            <div class="alert-main">
                <div class="alert-icon-box pulse-blue">
                    <i class="fa-solid fa-wand-magic-sparkles"></i>
                </div>
                <div class="alert-info">
                    <h4 class="alert-title">Academic Profile <span class="badge-incomplete-premium">ACTION REQUIRED</span></h4>
                    <p class="alert-desc">Your profile is missing key academic fields. Complete it now to activate <strong>Personalized AI Insights</strong>.</p>
                </div>
            </div>
            <div class="alert-actions">
                <button class="btn btn-alert-complete-premium" onclick="document.querySelector('.nav-item[data-tab=\\'profile\\']')?.click()">
                    Complete Now <i class="fa-solid fa-arrow-right-long"></i>
                </button>
            </div>
        </div>
    ` : "";

    return `
        <div class="tab-pane active fade-in dashboard-overview-wrapper">
            ${alertBannerHtml}
            <!-- 1. Personalized Header -->
            <div class="welcome-banner">
                <h1 class="font-heading">Welcome back, <span class="gradient-text">${userName}</span> 👋</h1>
                <p class="role-badge">${roleLabel} • ${college}</p>
            </div>

            <!-- 2. Live Activity Widgets -->
            <div class="stats-grid overview-stats">
                <div class="glass-card wobble-hover accent-green">
                    <div class="live-header">
                        <span class="pulse-dot"></span>
                        <span class="stat-meta">Live Students</span>
                    </div>
                    <div id="liveStudents" class="big-stat">--</div>
                </div>
                <div class="glass-card wobble-hover accent-blue">
                    <div class="stat-meta">🔥 Global Views</div>
                    <div id="stat-views" class="big-stat">--</div>
                </div>
                <div class="glass-card wobble-hover accent-purple">
                    <div class="stat-meta">⬇️ Global Downloads</div>
                    <div id="globalDownloads" class="big-stat">--</div>
                </div>
                <div class="glass-card wobble-hover accent-gold">
                    <div class="stat-meta">🚀 Trending Now</div>
                    <div id="trendingNow" class="big-stat">--</div>
                </div>
            </div>

            <div class="dashboard-split-view">
                
                <div class="main-column">
                    
                    <!-- 3. Global Resources -->
                    <div class="glass-card verified-resources-card">
                         <h3 class="font-heading section-title">
                            <span class="emoji-icon">🚀</span> 
                            Global <span class="highlight">Verified Resources</span>
                         </h3>
                         <div id="dashboard-global-showcase" class="notes-list-container-pro">
                            ${topNotes.length > 0 ? renderInstantStaticNotes(topNotes) : '<p style="color:var(--text-dim);">Resources are being synced from global servers...</p>'}
                         </div>
                    </div>

                    <!-- 4. AI Insights Card -->
                    <div class="glass-card ai-insights-card">
                        <div class="bg-icon">🤖</div>
                        <h3 class="font-heading ai-title">✨ ${aiRec.title}</h3>
                        <p class="ai-msg">${aiRec.msg}</p>
                        <div class="ai-actions">
                            <button class="btn btn-primary" onclick="${isGuest ? "window.location.href='../pages/auth.html'" : (aiRec.actionType === 'ai-tools' || aiRec.actionType === 'planner' ? "window.lockOverlay.show()" : `renderTabContent('${aiRec.actionType}')`)}">${aiRec.actionLabel}</button>
                        </div>
                    </div>

                    <!-- 5. Quick Access Path -->
                    <div class="personalized-track">
                        <h3 class="font-heading section-title">🚀 Personalized Track</h3>
                        <div class="track-grid">
                           <div class="glass-card wobble-hover" onclick="renderTabContent('bookmarks')">
                                <div class="track-icon">🔖</div>
                                <div class="track-name">Saved</div>
                                <div class="track-label">Your Bookmarks</div>
                           </div>
                           <div class="glass-card wobble-hover" onclick="window.lockOverlay ? window.lockOverlay.show() : renderTabContent('ai-tools')">
                                <div class="track-icon">🤖</div>
                                <div class="track-name">AI Lab</div>
                                <div class="track-label">Predict Papers</div>
                           </div>
                           <div class="glass-card wobble-hover" onclick="renderTabContent('leaderboard')">
                                <div class="track-icon">🏆</div>
                                <div class="track-name">Ranking</div>
                                <div class="track-label">View Peers</div>
                           </div>
                        </div>
                    </div>
                </div>

                <!-- Sidebar column -->
                <div class="side-column">
                    <!-- 3. Readiness Meter -->
                    <div class="glass-card readiness-card">
                         <h3 class="font-heading section-title">📊 Readiness Analysis</h3>
                         <div class="readiness-list">
                            ${readinessData.map(sub => `
                                <div class="readiness-item">
                                    <div class="readiness-info">
                                        <span class="subject-name">${sub.name}</span>
                                        <span class="subject-progress" style="color: ${sub.color};">${sub.progress}%</span>
                                    </div>
                                    <div class="progress-bar-bg">
                                        <div class="progress-bar-fill" style="width: ${sub.progress}%; background: linear-gradient(90deg, ${sub.color}, white);"></div>
                                    </div>
                                </div>
                            `).join('')}
                         </div>
                         <div class="readiness-footer">
                            <p>Calculated based on downloads, views, and AI interactions.</p>
                            <button class="btn btn-ghost" style="width: 100%;" onclick="renderTabContent('analytics')">Deeper Insights →</button>
                         </div>
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
                                <option value="practicals">Practicals</option>
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
        if (window.showToast) {
            window.showToast("file uploaded successfully");
        } else {
            alert("file uploaded successfully");
        }
        selectedAdminFile = null;
        document.getElementById('selected-filename').innerText = '';
        document.getElementById('upload-progress').style.width = '0%';
        document.getElementById('admin-drop-zone').style.borderColor = 'var(--border-glass)';
    } catch (e) {
        if (window.showToast) window.showToast("Upload Failed: " + e.message, "error");
        else alert("Upload Failed: " + e.message);
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
                    <div id="explorer-steps-container" class="step-indicator" style="display: flex; justify-content: center; gap: 3rem; margin-bottom: 3rem;">
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
        // Sort: Unlocked colleges first, then by name
        const sortedItems = [...items].sort((a, b) => {
            const isUnlockedA = (a.id === 'medicaps' || a.id === 'lnct' || a.name.toLowerCase().includes('medicaps'));
            const isUnlockedB = (b.id === 'medicaps' || b.id === 'lnct' || b.name.toLowerCase().includes('medicaps'));

            if (isUnlockedA && !isUnlockedB) return -1;
            if (!isUnlockedA && isUnlockedB) return 1;

            // If both are same status, sort alphabetically by name
            return a.name.localeCompare(b.name);
        });

        return sortedItems.map(c => {
            const isMedicaps = (c.id === 'medicaps' || c.name.toLowerCase().includes('medicaps'));
            const isLnct = (c.id === 'lnct' || c.name.toLowerCase().includes('lnct'));
            const isLocked = !isMedicaps && !isLnct;

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

    // Try College-Specific Key first, then fallback to Common Key
    const collegeKey = `${selState.college.id}-${selState.branch.id}-${selState.semester}`;
    const commonKey = `${selState.branch.id}-${selState.semester}`;
    const subjects = GlobalData.subjects[collegeKey] || GlobalData.subjects[commonKey] || [];

    if (subjects.length === 0) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 4rem;">
            <p style="color: var(--text-dim);">No subjects registered for this branch/year combo yet.</p>
            <button class="btn btn-primary btn-sm" style="margin-top: 1rem;" onclick="renderCollegeStep()">Start Over</button>
        </div>`;
        return;
    }

    container.innerHTML = subjects.map(s => `
        <div class="selection-card glass-card fade-in" onclick="selectSubject('${s.id}', '${s.name}', '${s.code || ''}')">
            <div class="card-icon" style="font-size: 2.5rem; margin-bottom: 0.5rem;">${s.icon}</div>
            <div style="font-size: 0.7rem; color: var(--primary); font-weight: 700; margin-bottom: 0.5rem; background: rgba(108, 99, 255, 0.1); padding: 2px 8px; border-radius: 4px; display: inline-block;">${s.code}</div>
            <h3 class="font-heading">${s.name}</h3>
        </div>
    `).join('');
};

window.selectSubject = function (id, name, code = null) {
    selState.subject = { id, name, code };
    if (typeof RoutingSystem !== 'undefined') RoutingSystem.updateURL(selState);
    trackAnalytics('select_subject', { id, name, code });
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
             <div class="breadcrumb-pro" style="display: flex; flex-wrap: nowrap; gap: 0.4rem; align-items: center; font-size: 0.78rem; margin-bottom: 1.5rem; color: var(--text-dim); background: rgba(255,255,255,0.02); padding: 0.4rem 0.8rem; border-radius: 10px; width: fit-content; border: 1px solid rgba(255,255,255,0.03); position: relative; z-index: 10; max-width: 100%; overflow-x: auto; white-space: nowrap; scrollbar-width: none; -ms-overflow-style: none;">
                <span class="breadcrumb-item" onclick="window.jumpToExplorerStep('renderCollegeStep')" style="cursor:pointer; display:flex; align-items:center; gap:4px; -webkit-tap-highlight-color: transparent;">🏠 Home</span>
                <span style="opacity:0.3; font-size: 0.7rem;">/</span>
                <span class="breadcrumb-item" onclick="window.jumpToExplorerStep('renderBranchStep')" style="cursor:pointer; -webkit-tap-highlight-color: transparent;">${selState.branch.name}</span>
                <span style="opacity:0.3; font-size: 0.7rem;">/</span>
                <span class="breadcrumb-item" onclick="window.jumpToExplorerStep('renderCombinedSemesterStep')" style="cursor:pointer; -webkit-tap-highlight-color: transparent;">${selState.semester}</span>
                <span style="opacity:0.3; font-size: 0.7rem;">/</span>
                <span class="breadcrumb-item active" style="color: var(--secondary); font-weight: 600;">${selState.subject.name}</span>
            </div>
             <div class="subject-page-hero" style="margin-bottom: 2.5rem; padding: 2.5rem; background: linear-gradient(135deg, rgba(123, 97, 255, 0.08) 0%, rgba(0, 242, 255, 0.05) 100%); border-radius: 28px; border: 1px solid rgba(255, 255, 255, 0.08); position: relative; overflow: hidden; animation: heroEntrance 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;">
                <!-- Premium Animated Background Blobs -->
                <div class="hero-glow-blob" style="position: absolute; top: -100px; right: -100px; width: 400px; height: 400px; background: radial-gradient(circle, rgba(0, 242, 255, 0.1) 0%, transparent 70%); pointer-events: none; filter: blur(40px);"></div>
                <div class="hero-glow-blob" style="position: absolute; bottom: -150px; left: -100px; width: 350px; height: 350px; background: radial-gradient(circle, rgba(123, 97, 255, 0.08) 0%, transparent 70%); pointer-events: none; filter: blur(50px); animation-delay: -5s;"></div>
                
                <div class="hero-layout-pro" style="display: flex; justify-content: space-between; align-items: flex-start; gap: 2rem; position: relative; z-index: 2;">
                    <div style="flex: 1;">
                        <div class="stagger-1" style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.75rem;">
                             <span class="subject-code-badge" style="background: linear-gradient(135deg, var(--primary), #6366f1); color: white; padding: 5px 12px; border-radius: 8px; font-size: 0.75rem; font-weight: 800; letter-spacing: 1.5px; box-shadow: 0 4px 12px rgba(123, 97, 255, 0.3); border: 1px solid rgba(255,255,255,0.2); text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                                ${(() => {
                                    // Robust lookup for official code
                                    const allSubs = Object.values(GlobalData.subjects).flat();
                                    const match = allSubs.find(s => s.name === selState.subject.name || s.id === selState.subject.id);
                                    return match?.code || selState.subject.code || selState.subject.id.toUpperCase();
                                })()}
                             </span>
                             <div class="sub-badges" style="display: flex; gap: 0.6rem;">
                                <span class="meta-badge" style="background: rgba(255,255,255,0.06); padding: 5px 12px; border-radius: 8px; font-size: 0.7rem; color: var(--text-muted); border: 1px solid rgba(255,255,255,0.1); font-weight: 600; letter-spacing: 0.5px;">${selState.branch.id.toUpperCase()}</span>
                                <span class="meta-badge" style="background: rgba(255,255,255,0.06); padding: 5px 12px; border-radius: 8px; font-size: 0.7rem; color: var(--text-muted); border: 1px solid rgba(255,255,255,0.1); font-weight: 600; letter-spacing: 0.5px;">${selState.year.toUpperCase()}</span>
                            </div>
                        </div>
                        <h1 class="font-heading subject-title-pro stagger-2" style="margin: 0; font-size: 2.8rem; font-weight: 900; background: linear-gradient(to right, #fff 20%, #00f2ff 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; line-height: 1.1; letter-spacing: -0.5px;">${selState.subject.name}</h1>
                        
                        <div class="ai-btns-row stagger-3" style="margin-top: 2.2rem; display: flex; flex-wrap: wrap; gap: 1.25rem;">
                            <button class="btn-premium" onclick="window.showAIModal('summary', '${selState.subject.name}')" style="background: linear-gradient(135deg, var(--primary), #00f2ff); color: white; border: none; padding: 0.9rem 1.8rem; border-radius: 14px; font-weight: 700; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); position: relative; overflow: hidden;">
                                <span style="font-size: 1.1rem;">✨</span> AI Summary
                            </button>
                            <button class="btn-premium-outline" onclick="window.showAIModal('questions', '${selState.subject.name}')" style="background: rgba(255,255,255,0.03); color: white; border: 1px solid rgba(123, 97, 255, 0.5); padding: 0.9rem 1.8rem; border-radius: 14px; font-weight: 700; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: 0.3s; backdrop-filter: blur(5px);">📝 Model Questions</button>
                            <button class="btn-premium-outline" onclick="window.switchSubjectTab('syllabus')" style="background: rgba(255,255,255,0.03); color: white; border: 1px solid rgba(0, 242, 255, 0.4); padding: 0.9rem 1.8rem; border-radius: 14px; font-weight: 700; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: 0.3s; backdrop-filter: blur(5px);">📖 View Syllabus</button>
                        </div>
                    </div>
                    
                    <div class="subject-actions-top stagger-4" style="display: flex; flex-direction: column; gap: 1rem;">
                        <button class="btn-action-pro" onclick="window.copyShareLink(this)" id="share-btn" style="background: rgba(0, 242, 255, 0.1); color: var(--secondary); border: 1px solid rgba(0, 242, 255, 0.25); padding: 0.8rem 1.8rem; border-radius: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 12px; transition: all 0.3s ease; white-space: nowrap; backdrop-filter: blur(10px);">
                            <span style="font-size: 1.1rem;">🔗</span> Share Subject
                        </button>
                        <button class="btn-action-pro" onclick="window.backToSubjectSelection()" style="background: rgba(255, 255, 255, 0.05); color: white; border: 1px solid rgba(255, 255, 255, 0.12); padding: 0.8rem 1.8rem; border-radius: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 12px; transition: all 0.3s ease; backdrop-filter: blur(10px);">
                            <span>⬅</span> Back to List
                        </button>
                    </div>
                </div>
            </div>

            <div class="subject-tabs-nav" style="display: flex; justify-content: space-between; align-items: center; margin: 2rem 0; border-bottom: 2px solid rgba(255, 255, 255, 0.05); position: relative;">
                <div style="display: flex; gap: 2.5rem;">
                    <div class="subject-tab ${activeTab === 'notes' ? 'active' : ''}" onclick="switchSubjectTab('notes')" style="padding: 1rem 0; color: #FFFFFF; font-size: 1rem; font-weight: 700; cursor: pointer; transition: all 0.3s ease; opacity: ${activeTab === 'notes' ? '1' : '0.6'}; border-bottom: 2px solid ${activeTab === 'notes' ? '#00f2ff' : 'transparent'};">Notes</div>
                    <div class="subject-tab ${activeTab === 'pyqs' ? 'active' : ''}" onclick="switchSubjectTab('pyqs')" style="padding: 1rem 0; color: #FFFFFF; font-size: 1rem; font-weight: 700; cursor: pointer; transition: all 0.3s ease; opacity: ${activeTab === 'pyqs' ? '1' : '0.6'}; border-bottom: 2px solid ${activeTab === 'pyqs' ? '#00f2ff' : 'transparent'};">PYQs</div>
                    <div class="subject-tab ${activeTab === 'formula' ? 'active' : ''}" onclick="switchSubjectTab('formula')" style="padding: 1rem 0; color: #FFFFFF; font-size: 1rem; font-weight: 700; cursor: pointer; transition: all 0.3s ease; opacity: ${activeTab === 'formula' ? '1' : '0.6'}; border-bottom: 2px solid ${activeTab === 'formula' ? '#00f2ff' : 'transparent'};">Formula Sheets</div>
                    <div class="subject-tab ${activeTab === 'practicals' ? 'active' : ''}" onclick="switchSubjectTab('practicals')" style="padding: 1rem 0; color: #FFFFFF; font-size: 1rem; font-weight: 700; cursor: pointer; transition: all 0.3s ease; opacity: ${activeTab === 'practicals' ? '1' : '0.6'}; border-bottom: 2px solid ${activeTab === 'practicals' ? '#00f2ff' : 'transparent'};">Practicals</div>
                    <div class="subject-tab ${activeTab === 'syllabus' ? 'active' : ''}" onclick="switchSubjectTab('syllabus')" style="padding: 1rem 0; color: #FFFFFF; font-size: 1rem; font-weight: 700; cursor: pointer; transition: all 0.3s ease; opacity: ${activeTab === 'syllabus' ? '1' : '0.6'}; border-bottom: 2px solid ${activeTab === 'syllabus' ? '#00f2ff' : 'transparent'};">Syllabus</div>
                </div>
                <div class="tab-search-container" style="position: relative; min-width: 300px; margin-bottom: 0.5rem;">
                    <input type="text" id="search-notes" placeholder="Search in ${selState.subject.name}..." 
                           oninput="window.filterInternalNotes(this.value)"
                           style="width: 100%; padding: 0.8rem 1.5rem; padding-right: 3rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 25px; color: white; outline: none; transition: 0.3s; font-size: 0.9rem;">
                    <span style="position: absolute; right: 1.2rem; top: 50%; transform: translateY(-50%); opacity: 0.6;">🔍</span>
                </div>
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


    // Completely defer to NotesDB (Firestore snapshot) for rendering
    renderDetailedNotes(selState.subject.id, activeTab);
};

function renderInstantStaticNotes(notes) {
    const createNoteCard = (note, idx) => {
        const sequentialId = `unit${idx + 1}`;
        const yearDate = selState?.year && selState.year.includes('2') ? 'Jan 2026' : (selState?.year && selState.year.includes('1') ? 'Feb 2026' : 'Dec 2025');

        return `
            <div class="note-card-pro card-reveal" data-note-id="${sequentialId}" style="animation-delay: ${idx * 0.1}s;">
                <div class="note-info-pro">
                    <h3 class="note-title-pro">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--secondary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 12px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        ${note.title}
                    </h3>
                    <div class="meta-pills-row-pro">
                        <div class="meta-pill-pro date-pro">
                             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line></svg>
                             <span>${yearDate}</span>
                        </div>
                        <div class="meta-pill-pro uploader-pro">
                             <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(note.uploaderName || note.uploader || 'Verified')}&backgroundColor=transparent" style="width:18px;height:18px;border-radius:50%; background: #333;">
                             ${note.uploaderName || note.uploader || 'Verified'}
                        </div>
                        <div class="meta-pill-pro views-pro">
                             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                             <span class="views">${note.views || 0} Views</span>
                        </div>
                    </div>
                    <div class="note-actions-pro">
                        <button class="tool-icon-pro like-btn" onclick="likeNote('${note.id}')" title="Like">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                            <span class="like">${note.likes || 1}</span>
                        </button>
                        <button class="tool-icon-pro" onclick="toggleNoteDislike('${note.id}')" title="Dislike">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2-2h-3"></path></svg>
                            <span class="dislike-count">${note.dislikes || 0}</span>
                        </button>
                        <button class="tool-icon-pro" onclick="toggleBookmark('${note.id}')" title="Bookmark">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2-2z"></path></svg>
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
            </div>`;
    };

    const html = notes.map((n, idx) => createNoteCard(n, idx)).join('');

    setTimeout(() => {
        notes.forEach(n => { if (n.id) window.incrementNoteView?.(n.id); });
        if (typeof window.runAnalyticsSimulation === 'function') window.runAnalyticsSimulation();
    }, 100);

    return html;
}


window.renderMyUploads = function () {
    const container = document.getElementById('my-uploads-grid');
    if (!container) return;

    // Guard: guest users cannot have uploads
    if (!currentUser || currentUser.isGuest) {
        container.innerHTML = `<p style="color:var(--text-dim); text-align:center; padding: 2rem;">Please login to see your uploads.</p>`;
        return;
    }

    const { db, collection, query, where, getDocs, onSnapshot } = window.firebaseServices;

    // --- RENDER HELPER ---
    const render = (all) => {
        if (!all || all.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 4rem; opacity: 0.6;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📤</div>
                    <p>You haven't uploaded anything yet.</p>
                    <button class="btn btn-primary" onclick="openUploadModal()" style="margin-top:1rem;">Upload Your First Note</button>
                </div>
            `;
            return;
        }
        container.innerHTML = all.map(n => {
            const stat = (n.status || 'pending').toLowerCase();
            const color = stat === 'approved' ? 'var(--success)' : '#f1c40f';
            const subj = n.subject || 'general';
            const titl = n.title || n.fileName || 'Untitled Note';
            const ts = n.createdAt || n.created_at;
            let displayDate = new Date().toLocaleDateString();
            if (ts) {
                if (ts.toDate) displayDate = ts.toDate().toLocaleDateString();
                else displayDate = new Date(ts).toLocaleDateString();
            }
            return `
            <div class="glass-card wobble-hover" style="position: relative; border-left: 4px solid ${color}; padding: 1.5rem;">
                <div style="position: absolute; top: 1rem; right: 1rem; font-size: 0.7rem; padding: 2px 8px; border-radius: 4px; background: rgba(255,255,255,0.05); color: ${color}; border: 1px solid ${color};">
                    ${stat.toUpperCase()}
                </div>
                <div style="font-size: 2rem; margin-bottom: 0.5rem; opacity: 0.8;">📄</div>
                <h4 style="margin-bottom: 0.5rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${titl}</h4>
                <div style="font-size: 0.8rem; color: var(--text-dim); margin-bottom: 1rem;">
                    ${subj.toUpperCase()} • ${displayDate}
                </div>
                <div style="display: flex; gap: 0.5rem; justify-content: space-between; width: 100%;">
                    <div style="display: flex; gap: 0.5rem;">
                        <a href="${n.url || n.fileUrl || n.driveLink || '#'}" target="_blank" class="btn btn-sm btn-ghost" style="border: 1px solid var(--border-glass);">View</a>
                        <button onclick="deleteUploadedNote('${n.id}')" class="btn btn-sm btn-ghost" style="border: 1px solid #ff4757; color: #ff4757; background: rgba(255, 71, 87, 0.1); cursor: pointer;">Delete</button>
                    </div>
                    ${stat === 'approved' ? `<span style="font-size:0.8rem; display:flex; align-items:center;">👁️ ${n.views || 0}</span>` : ''}
                </div>
            </div>
            `;
        }).join('');
    };

    // --- STEP 1: Show cached data INSTANTLY (zero network delay) ---
    const cacheKey = `my_uploads_${currentUser.id}`;
    try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            const cachedNotes = JSON.parse(cached);
            if (cachedNotes && cachedNotes.length > 0) {
                render(cachedNotes);
                // Show a subtle syncing indicator without blocking UI
                const syncBadge = document.createElement('div');
                syncBadge.id = 'uploads-sync-badge';
                syncBadge.style.cssText = 'font-size:0.7rem; color:var(--text-dim); text-align:right; padding: 0 0 0.5rem; opacity:0.5;';
                syncBadge.textContent = '⟳ Syncing...';
                container.before(syncBadge);
            } else {
                container.innerHTML = '<div class="loader-pro" style="margin: 2rem auto;"></div>';
            }
        } else {
            container.innerHTML = '<div class="loader-pro" style="margin: 2rem auto;"></div>';
        }
    } catch (e) {
        container.innerHTML = '<div class="loader-pro" style="margin: 2rem auto;"></div>';
    }

    // --- STEP 2: Fetch fresh data via one-time HTTP (fast, no WebSocket wait) ---
    // Query by user's profile ID (stored in uploadedBy field)
    const userId = currentUser.id;
    const userEmail = currentUser.email;
    const q = query(collection(db, "notes"), where("uploadedBy", "==", userId));

    getDocs(q).then((snap) => {
        const notes = snap.docs.map(d => {
            const data = d.data();
            // Serialize Firestore Timestamps to ISO strings for localStorage compatibility
            if (data.createdAt && data.createdAt.toDate) data.createdAt = data.createdAt.toDate().toISOString();
            if (data.created_at && data.created_at.toDate) data.created_at = data.created_at.toDate().toISOString();
            return { id: d.id, ...data };
        });

        // Save to localStorage for instant display on next refresh
        try { localStorage.setItem(cacheKey, JSON.stringify(notes)); } catch (e) { /* storage full */ }

        // Remove sync badge
        const badge = document.getElementById('uploads-sync-badge');
        if (badge) badge.remove();

        render(notes);

        // --- STEP 3: After initial fast load, upgrade to real-time listener for live status updates ---
        onSnapshot(q, (liveSnap) => {
            const liveNotes = liveSnap.docs.map(d => {
                const data = d.data();
                if (data.createdAt && data.createdAt.toDate) data.createdAt = data.createdAt.toDate().toISOString();
                if (data.created_at && data.created_at.toDate) data.created_at = data.created_at.toDate().toISOString();
                return { id: d.id, ...data };
            });
            try { localStorage.setItem(cacheKey, JSON.stringify(liveNotes)); } catch (e) { /* storage full */ }
            render(liveNotes);
        }, (err) => {
            // Real-time listener failed — we already have the getDocs data shown, so just log silently
            console.warn("Live uploads sync dropped (non-critical):", err.message);
        });

    }).catch((error) => {
        console.error("Firestore Uploads Error:", error);
        // If we already showed cached data, don't overwrite with error message
        const hasCachedContent = container.querySelector('.glass-card');
        if (!hasCachedContent) {
            container.innerHTML = `<p style="color:red; text-align:center;">Could not load uploads: ${error.message}</p>`;
        }
        const badge = document.getElementById('uploads-sync-badge');
        if (badge) { badge.textContent = '⚠️ Sync failed'; badge.style.color = '#ff6b6b'; }
    });
};

window.deleteUploadedNote = async function (noteId) {
    if (!confirm("Are you sure you want to delete this note? This action cannot be undone.")) return;
    
    // Optimistic UI removal
    const deleteBtn = document.querySelector(`button[onclick="deleteUploadedNote('${noteId}')"]`);
    const cardToRemove = deleteBtn ? deleteBtn.closest('.glass-card') : null;
    
    if (cardToRemove) {
        cardToRemove.style.transition = 'opacity 0.3s ease';
        cardToRemove.style.opacity = '0.5';
        cardToRemove.style.pointerEvents = 'none';
        if (deleteBtn) deleteBtn.innerText = "Deleting...";
    }
    
    const { db, doc, deleteDoc } = window.firebaseServices;
    try {
        await deleteDoc(doc(db, "notes", noteId));
        if (window.showToast) window.showToast("Note deleted successfully!", "success");
        
        // Remove from DOM immediately
        if (cardToRemove) cardToRemove.remove();
        
        // Update local cache
        if (window.currentUser) {
            const cacheKey = `my_uploads_${window.currentUser.id}`;
            const cachedUrl = localStorage.getItem(cacheKey);
            if (cachedUrl) {
                try {
                    let cachedNotes = JSON.parse(cachedUrl);
                    cachedNotes = cachedNotes.filter(n => n.id !== noteId);
                    localStorage.setItem(cacheKey, JSON.stringify(cachedNotes));
                } catch(e) {}
            }
        }
    } catch (e) {
        console.error("Error deleting note:", e);
        if (window.showToast) window.showToast("Failed to delete note.", "error");
        else alert("Failed to delete note.");
        
        // Revert visual state if failed
        if (cardToRemove) {
            cardToRemove.style.opacity = '1';
            cardToRemove.style.pointerEvents = 'auto';
            if (deleteBtn) deleteBtn.innerText = "Delete";
        }
    }
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
                             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                             <span class="view-count">${n.views || 0}</span> Views
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
    const grid = document.getElementById('notes-list-grid');
    if (!grid) return;

    if (tabType === 'syllabus') {
        const subjectName = selState.subject.name;
        // Search for syllabus in global scope (we'll move it there in a moment)
        if (typeof window.getSubjectSyllabusHTML === 'function') {
            grid.innerHTML = window.getSubjectSyllabusHTML(subjectName);
        } else {
            grid.innerHTML = '<p style="color:var(--text-dim);">Syllabus details are coming soon for this subject.</p>';
        }
        return;
    }

    console.log(`🔎 Filtering Notes for Subject: ${subjectId}, Type: ${tabType} `);

    const querySem = selState?.semester;
    const semNum = querySem ? querySem.split(' ')[1] : null;
    const altSem = semNum ? (semNum + (semNum === '1' ? 'st' : semNum === '2' ? 'nd' : semNum === '3' ? 'rd' : 'th')) : null;

    if (!selState?.college || !selState?.subject) {
        console.warn("⚠️ Cannot render detailed notes: College or Subject state missing.");
        return;
    }

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
        const sequentialId = `unit${idx + 1}`;
        const yearDate = selState?.year && selState.year.includes('2') ? 'Jan 2026' : (selState?.year && selState.year.includes('1') ? 'Feb 2026' : 'Dec 2025');
        const unitTag = n.unit || (n.title.toLowerCase().includes('unit') ? n.title.match(/unit\s*\d+/i)?.[0].toUpperCase() : 'UNIT 1');

        // Dynamic Fake Stats Logic
        const seed = (n.id || sequentialId).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const dayFactor = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
        const isStuck = (seed % 8 === 0);
        const baseViews = (seed % 400) + 120;
        const baseLikes = Math.floor(baseViews * 0.15) + (seed % 15);
        const dailyViews = isStuck ? 0 : (seed % 8 + 2) * (dayFactor % 20);
        const dailyLikes = isStuck ? 0 : Math.floor(dailyViews * 0.08);
        
        const displayViews = (n.views || 0) + baseViews + dailyViews;
        const displayLikes = (n.likes || 0) + baseLikes + dailyLikes;
        const displayDislikes = n.dislikes || (seed % 4);

        const isLiked = window.likedNoteIds?.has(n.id);
        const isDisliked = window.dislikedNoteIds?.has(n.id);
        const isSaved = window.savedNoteIds?.has(n.id);

        return `
            <div class="detailed-item glass-card card-reveal" data-note-id="${n.id}" style="animation-delay: ${idx * 0.1}s; margin-bottom: 1.2rem; padding: 1.2rem 1.5rem; display: flex; justify-content: space-between; align-items: center;">
                <div class="item-left" style="display: flex; gap: 1.25rem; align-items: flex-start; flex: 1;">
                    <div class="file-type-icon" style="width: 45px; height: 45px; background: rgba(0, 242, 255, 0.1); color: var(--secondary); display: flex; align-items: center; justify-content: center; border-radius: 12px; font-size: 1.2rem; flex-shrink: 0;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                    </div>
                    <div class="item-info">
                        <div class="unit-tag" style="font-size: 0.75rem; color: var(--secondary); font-weight: 800; letter-spacing: 1px; margin-bottom: 0.3rem; text-transform: uppercase;">${unitTag}</div>
                        <h3 class="item-title" style="font-size: 1.2rem; font-weight: 700; color: white; margin: 0 0 0.4rem 0;">${n.title}</h3>
                        <div class="item-meta-row" style="display: flex; align-items: center; gap: 1.2rem; font-size: 0.85rem; color: var(--text-dim);">
                            <div class="uploader-mini" style="display: flex; align-items: center; gap: 0.5rem;">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                <span>${n.uploaderName || n.uploader || 'Verified'}</span>
                            </div>
                            <div class="date-mini" style="display: flex; align-items: center; gap: 0.4rem;">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line></svg>
                                <span>${yearDate}</span>
                            </div>
                            <div class="views-mini" style="display: flex; align-items: center; gap: 0.4rem;">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                <span class="views">${displayViews} Views</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="item-right" style="display: flex; align-items: center; gap: 1.5rem;">
                    <div class="item-actions-inline" style="display: flex; align-items: center; gap: 0.8rem;">
                        <button class="eng-btn-pro like-btn ${isLiked ? 'active' : ''}" onclick="likeNote('${n.id}')" style="display: flex; align-items: center; gap: 0.5rem; border: 1px solid rgba(255,255,255,0.1); padding: 0.5rem 0.8rem; border-radius: 8px; transition: 0.3s; cursor: pointer;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                            <span class="count" style="font-weight: 700; font-size: 0.9rem;">${displayLikes}</span>
                        </button>
                        <button class="eng-btn-pro dislike-btn ${isDisliked ? 'active' : ''}" onclick="toggleNoteDislike('${n.id}')" style="display: flex; align-items: center; gap: 0.5rem; border: 1px solid rgba(255,255,255,0.1); padding: 0.5rem 0.8rem; border-radius: 8px; transition: 0.3s; cursor: pointer;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2-2h-3"></path></svg>
                            <span class="count" style="font-weight: 700; font-size: 0.9rem;">${displayDislikes}</span>
                        </button>
                        <button class="tool-icon-pro bookmark-btn ${isSaved ? 'active' : ''}" onclick="toggleBookmark('${n.id}')" style="border: 1px solid rgba(255,255,255,0.1); padding: 0.6rem; border-radius: 8px; transition: 0.3s; cursor: pointer;">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                        </button>
                        <button class="tool-icon-pro share-btn" onclick="shareResource('${n.id}')" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 0.6rem; border-radius: 8px; color: var(--text-dim); transition: 0.3s; cursor: pointer;">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                        </button>
                    </div>
                    <a href="${n.url || n.fileUrl || n.driveLink}" target="_blank" class="btn-download-pro" onclick="downloadNote('${n.id}')" style="background: white; color: black; padding: 0.7rem 1.5rem; border-radius: 8px; font-weight: 700; font-size: 0.9rem; text-decoration: none; display: flex; align-items: center; gap: 0.6rem; transition: 0.3s;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        View
                    </a>
                </div>
            </div>`;
    }).join('');

    grid.innerHTML = `<div class="notes-list-container-pro">${cardsHTML}</div>`;

    setTimeout(() => {
        if (typeof attachNoteRealtimeListeners === 'function') attachNoteRealtimeListeners('tab-content');
        filtered.forEach(n => { if (n.id) window.incrementNoteView?.(n.id); });
        if (typeof window.runAnalyticsSimulation === 'function') window.runAnalyticsSimulation();
    }, 150);

    return grid.innerHTML;
}

// --- NOTE INTERACTIONS LOGIC (Handled by js/note-actions.js) ---
window.noteUnsubscribers = window.noteUnsubscribers || {};





window.filterInternalNotes = function (query) {
    const cards = document.querySelectorAll('.detailed-item');
    const lowQuery = query.toLowerCase();
    
    cards.forEach(card => {
        const title = card.querySelector('.item-title')?.innerText.toLowerCase() || "";
        const tag = card.querySelector('.unit-tag')?.innerText.toLowerCase() || "";
        if (title.includes(lowQuery) || tag.includes(lowQuery)) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
};

window.shareResource = function(id) {
    const url = window.location.href;
    if (navigator.share) {
        navigator.share({
            title: 'Study Resource | SKiL MATRiX',
            text: 'Check out this study resource on SKiL MATRiX!',
            url: url
        }).catch(console.error);
    } else {
        navigator.clipboard.writeText(url).then(() => {
            alert("Link copied to clipboard!");
        });
    }
};

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

window.getSubjectSyllabusHTML = function(subjectName) {
    const genSyllabusHTML = (units) => {
        return `<div class="syllabus-grid-pro" style="text-align: left; padding: 1.5rem 0; display: grid; gap: 1.25rem;">
        ${units.map((u, i) => `
                <div class="premium-syllabus-card" style="animation-delay: ${i * 0.1}s;">
                    <div class="syllabus-card-glow"></div>
                    <div class="syllabus-accent-bar"></div>
                    <div class="syllabus-content-wrapper">
                        <h4 class="syllabus-unit-title">${u.title}</h4>
                        <p class="syllabus-unit-desc">${u.desc}</p>
                    </div>
                </div>
            `).join('')}
        </div>`;
    };

    const syllabiDB = {
        'Applied Chemistry': genSyllabusHTML([
            { title: 'Unit I: Water analysis and its Treatment', desc: "Sources of water, impurities in water, hard water and soft water, hardness types and units, disadvantages of hard water, industrial and municipal water characteristics, water analysis (determination of hardness, alkalinity, and dissolved oxygen)." },
            { title: 'Unit II: Lubricants', desc: "Classification of lubricants: lubricating oils, semisolid, solid, and synthetic lubricants, mechanisms of lubrication, properties and testing (viscosity index, flash and fire point, cloud and pour point, aniline point, steam emulsion number, saponification number, iodine value, carbon residue)." },
            { title: 'Unit III: New Engineering Materials', desc: "Nanomaterials and nanotechnology, top-down and bottom-up fabrication approaches. Fullerenes: manufacturing and structure of C60, properties and applications. Carbon nanotubes (CNTs): single-walled and multi-walled. Graphene: structure, conductivity, mechanical strength." },
            { title: 'Unit IV: Instrumental Techniques in Chemical Analysis', desc: "Electromagnetic radiation, Lambert's and Beer's Law. UV-Visible spectroscopy: principle, electronic transitions, band shifts, instrumentation. Infrared (IR) spectroscopy: fundamental vibrations, stretching, bending, instrumentation and applications." },
            { title: 'Unit V: Heritage of Indian Chemistry', desc: "Early foundations of Indian chemistry, metallurgical techniques, literary contributions, rasas, minerals of Indian alchemy, chemical techniques in ancient India, dyeing and pigmentation, Ayurveda contributions." }
        ]),
        'Engineering Mathematics-I': genSyllabusHTML([
            { title: 'Unit I: Matrices and Linear Systems', desc: "Rank and Nullity of a Matrix by reducing it into Echelon form, Solution of Simultaneous equations by elementary transformation, Consistency and Inconsistency of Equations, Eigen Values and Eigen Vectors." },
            { title: 'Unit II: Differential Calculus', desc: "Taylors and Maclaurin’s series expansions, Functions of Several variables, Partial differentiation, Euler’s Theorem (without proof), Total Derivative, Maxima and Minima of function of two variables." },
            { title: 'Unit III: Integral Calculus', desc: "Beta and Gamma functions: Definitions, Properties without proof, Relation between Beta and Gamma functions without proof, Duplication formula without proof, Multiple Integral: Double and Triple Integrals, Change the Order of Integration, Applications of Multiple Integral in Area, Volume." },
            { title: 'Unit IV: Ordinary Differential Equations', desc: "First order differential equations: Exact, Linear, Linear differential Equations of second and higher order with constant coefficients, Homogeneous linear differential equations." },
            { title: 'Unit V: Complex Analysis', desc: "Functions of complex variable, Analytic functions, Harmonic Conjugate functions, Cauchy-Riemann Equations, Complex Line Integral, Cauchy’s Theorem, Cauchy’s Integral Formula." }
        ]),
        'Basic Mechanical Engineering': genSyllabusHTML([
            { title: 'Unit I: Materials & their mechanical properties', desc: "Classification of Engineering material and their mechanical properties, Composition of iron and carbon steels and their application. Stress-strain diagram, Hooks law and modulus of elasticity." },
            { title: 'Unit II: Thermodynamics', desc: "Thermodynamic Systems, Thermodynamic Properties, thermodynamic processes. First law of thermodynamics, Second law of thermodynamic, heat engine, heat pump, refrigerator and their numerical." },
            { title: 'Unit III: Internal Combustion Engines', desc: "Basic terminology and functions of components in IC Engines, Working of four stroke and two stroke engines, P-V, T-S plot and efficiency of Otto and Diesel cycle and their numerical." },
            { title: 'Unit IV: Steam generators', desc: "Definition, Classification, general study of Cochran and Lancashire boilers. Boiler mountings and accessories. Steam properties and boiler performance. Introduction to Draught." },
            { title: 'Unit V: Centroid & Moment of Inertia', desc: "Centroid & Centre of gravity, Location of centroid for standard figure and composite figure, Theory of Moment of Inertia, Perpendicular Axis and Parallel Axis theorems." }
        ]),
        'Engineering Graphics': genSyllabusHTML([
            { title: 'Unit I: Introduction to AutoCAD and its basic commands', desc: "CAD- Introduction, AutoCAD User Interface, coordinate systems, axes, panels, Status bar. AutoCAD Tools: Line, Polyline, Circle, Arc, Rectangle, Polygon, Ellipse, Spline, Hatch." },
            { title: 'Unit II: Orthographic Projection of Points and lines', desc: "Introduction of orthographic projection: Reference planes, First angle projections, Third angle projection. Projections of Points (all four quadrants), Projections of Straight lines." },
            { title: 'Unit III: Orthographic Projections of Planes & Solids', desc: "Orthographic Projections of Planes (perpendicular/parallel/inclined). Orthographic Projection of Solids: Classification of solids. Projections of solids when the axis of the solid is perpendicular to any one principal plane." },
            { title: 'Unit IV: Advanced commands of AutoCAD', desc: "Annotations Dimensions, TEXT style, single/multi text. Property: Layer properties, line weight. LAYERS: Create/edit layers, Layer control. Orthographic to Orthographic Projection Views." },
            { title: 'Unit V: Section of solids and development of surfaces', desc: "Sections of Solids: Sectional views and true shape of the section for the regular solids whose axis is perpendicular to HP. Development of Surfaces: Prism, Pyramid, Cone and Cylinder excluding cut solids." }
        ]),
        'Engineering Workshop': genSyllabusHTML([
            { title: 'Unit I: Carpentry Shop', desc: "Introduction to various shops and workshop layouts. Safety norms. Carpentry Shop: Tools & operations, Types of woods, Carpentry Joints, sawing, planning, chiseling, grooving." },
            { title: 'Unit II: Fitting Shop', desc: "Introduction of Tools & operations, Types of Marking tools, Types of fitting cutting tool & their uses, chipping, filing, scraping, grinding, drilling, tapping." },
            { title: 'Unit III: Foundry Shop & Black Smithy', desc: "Pattern Making: Pattern materials, allowances, Core box. Molding: Green/Dry/Loam sand, Methods for green sand mould. Black Smithy: Forging operations (Upsetting, drawing down, Fullering Swaging)." },
            { title: 'Unit IV: Welding Shop', desc: "Brazing, Soldering, Gas & Arc welding. Preparing Lap & Butt joints, Study of TIG & MIG welding processes. Safety precautions." },
            { title: 'Unit V: Machine Shop', desc: "Lathe machine (different parts, operations, cutting tools). Demonstration of Facing, Plane Turning, step turning, taper turning, knurling, parting. Drilling machine, CNC Machines." }
        ]),
        'Programming with C': genSyllabusHTML([
            { title: 'Unit I: Basics of C Programming', desc: "History and structure of C program, compiling and executing. Keywords, Identifiers, Constants, Variables, Data Types, Operators, Type conversions, Input/Output functions." },
            { title: 'Unit II: Control Flow and Arrays', desc: "Conditional statements: if, if-else, nested if, switch-case. Loops: while, do-while, for, break and continue. Arrays: declaration, initialization, 1D and 2D arrays, array operations." },
            { title: 'Unit III: Functions and Recursion', desc: "Function declaration and definition, Call by value and call by reference, Recursion, Storage classes, Scope rules, Header files, Inline functions." },
            { title: 'Unit IV: Pointers and Structures', desc: "Pointers: declaration, initialization, pointer arithmetic, pointers and arrays, pointers and functions. Structures: declaration, definition, accessing members, nested structures, unions, bit-fields." },
            { title: 'Unit V: File Handling and Dynamic Memory Allocation', desc: "File operations: opening, reading, writing text/binary files, command-line arguments. Dynamic memory allocation: malloc, calloc, realloc, free, introduction to linked lists." }
        ]),
        'Communication Skills': genSyllabusHTML([
            { title: 'Unit I: Developing Effective Communication Skills', desc: "Corporate Communication, process, characteristics and principles - Seven C’s of Communication, verbal and non-verbal communication, barriers, Importance of Feedback." },
            { title: 'Unit II: Developing Listening and Reading Skills', desc: "Reading Comprehension, SQ3R, Scanning, Skimming, Intensive/Extensive reading. Listening Skills: hearing vs listening, barriers, note-making, note-taking strategies." },
            { title: 'Unit III: Developing Speaking Skills', desc: "Phonetics IPA symbols, transcription and pronunciation. Preparing for Oral Presentations, Speech, Debates, Group Discussion, telephonic conversation, post-presentation strategy." },
            { title: 'Unit IV: Developing Professional Writing Skills', desc: "Précis writing, Paragraph writing. Business Letters: Quotations/Orders/Complaints. Writing Job Application with Resume, E-mail Writing. Report-writing: features, structures, elements." },
            { title: 'Unit V: Appreciating Literature', desc: "Poetry: The Solitary Reaper (Wordsworth), Where the Mind is Without Fear (Tagore). Prose: Of Studies (Bacon). Fiction: The Shroud (Premchand). Short Stories: The Mark of Vishnu (Singh), The last leaf." }
        ]),
        'Applied Physics': genSyllabusHTML([
            { title: 'Unit I: Laser and Fiber Optics', desc: "Lasers: Three quantum processes, Einstein’s A & B coefficients, Population inversion, Ruby/He-Ne Laser. Fiber Optics: Acceptance angle, numerical aperture, fractional refractive index change, V-number." },
            { title: 'Unit II: Wave Optics', desc: "Interference of light: Fundamentals of interference, Interference in thin film, Newton’s ring experiment, Michelson’s Interferometer. Diffraction of light: Fraunhofer diffraction for a single slit, Plane transmission Grating." },
            { title: 'Unit III: Quantum mechanics', desc: "de-Broglie hypothesis, Wave packet, Heisenberg’s uncertainty principle, Compton effect. Schrodinger’s time-dependent and time-independent wave equation, Particle in a one-dimensional infinite potential well." },
            { title: 'Unit IV: Nuclear Physics', desc: "Introduction of nucleus, types of nuclear radiations (α, β, γ), Interaction of nuclear radiations with matter. Radiation Technology: LINAC, Cyclotron, Betatron, Geiger-Muller (GM) counter." },
            { title: 'Unit V: Solid State Physics', desc: "Crystal Physics: Types of Unit cell (SC, FCC, BCC), Packing fraction, Miller indices, Bragg’s law of X-ray Diffraction. Semiconductor: Fermi level, Hall effect. Superconductivity: Meissner effect, Type-I and Type-II." }
        ]),
        'Engineering Mathematics -II': genSyllabusHTML([
            { title: 'Unit I: Laplace Transform', desc: "Introduction of Laplace Transform, properties of Laplace Transform, Inverse Laplace transform, Convolution theorem, Applications to Ordinary Differential Equations, Unit step function and Impulse function." },
            { title: 'Unit II: Fourier Series and Fourier Transform', desc: "Introduction of Fourier series, Fourier series for Discontinuous functions, Fourier series for Even and Odd function, Half range series, Fourier Transform." },
            { title: 'Unit III: Partial Differential Equations', desc: "Definition, Formulation, Solution of Linear Partial Differential Equations (Lagrange’s Method), Non-Linear PDEs of First order (Charpit’s method). PDEs with Constant Coefficients, Method of Separation of Variables." },
            { title: 'Unit IV: Vector Calculus', desc: "Vector Differentiation, Laplacian operator, Gradient, Divergence and Curl, Line and surface integrals, Green’s theorem, Gauss Divergence theorem, Stroke’s theorem." },
            { title: 'Unit V: Numerical Analysis', desc: "Errors and Approximations, Solution of Algebraic and Transcendental Equations (Regula Falsi, Newton-Raphson and Iterative methods), Solution of Simultaneous linear equations by Gauss Elimination and Gauss-Siedel." }
        ]),
        'Basic Civil Engineering & Mechanics': genSyllabusHTML([
            { title: 'Unit I: Building Materials & Construction', desc: "Stones, bricks, cement, timber... Concrete: Workability, Strength properties, Nominal proportion, compaction, curing. Foundations: spread footings, RCC footings, floors, staircases." },
            { title: 'Unit II: Surveying & Levelling', desc: "Surveying-classification, general principles of surveying. Basic terms and definitions of chain, Chain survey, Compass survey and levelling." },
            { title: 'Unit III: Mapping & Sensing', desc: "Mapping details and contouring, Profile Cross sectioning and measurement of areas, volumes, application of measurements in quantity computations, Survey stations." },
            { title: 'Unit IV: Forces & its applications', desc: "Graphical and Analytical Treatment of Concurrent and nonconcurrent Co-planner forces, Free Body Diagram. Analysis of plane Trusses: Method of joints, Method of Sections. Frictional force." },
            { title: 'Unit V: Shear force and Bending moment', desc: "Introduction of shear force and bending moment, sign conventions, Types of loads, beams, supports. Shear force and bending moment diagrams for simply supported, overhang and cantilever beams." }
        ]),
        'Basic Electrical & Electronics Engineering': genSyllabusHTML([
            { title: 'Unit I: DC Circuit Analysis', desc: "Elements and characteristics of electric circuits, Ideal/practical sources, Kirchhoff’s laws, Voltage and current division rules, Mesh analysis, Nodal analysis, Thevenin’s and Superposition theorem." },
            { title: 'Unit II: AC Circuit Analysis', desc: "Fundamentals of single/three phase AC, Average and RMS values, Analysis of series R-L, R-C and R-L-C circuits, Power factor, Series resonance, Star and delta connections for 3-phase system." },
            { title: 'Unit III: Electrical Machines', desc: "m.m.f, reluctance, flux, magnetic field intensity. Single Phase Transformer: Construction, working, E.M.F equation. Rotating Machines: Construction & working principle of DC motor and 3-phase induction motor." },
            { title: 'Unit IV: Diodes and Transistors', desc: "PN junction diode, drift and diffusion current, rectifier, Zener diode. BJT construction and operation, transistor biasing, CB, CE, CC Configurations, BJT as amplifier and switch." },
            { title: 'Unit V: Digital System', desc: "Number systems and conversion, Boolean algebra, De-Morgan’s theorems, binary addition, 1’s and 2’s complement system, logic gates and universal gates, half adder and full adder." }
        ]),
        'Python Programming': genSyllabusHTML([
            { title: 'Unit I: Introduction to Python Programming', desc: "Syntax, Indentation, REPL, Variables, Data Types (int, float, str, List, Set, Tuples, Dictionaries), Operators and Expressions, Logical Operators, Input and Output Operations." },
            { title: 'Unit II: Control Flow and Loops', desc: "Conditional Statements (if, elif, else), Switch-Like Behavior. Loops: While Loops, using range() for iteration, Loop Control Statements (break, continue). Functions." },
            { title: 'Unit III: OOP & Exception Handling', desc: "OOP Principles: Classes/Objects, Constructors, Inheritance and Polymorphism, Encapsulation. Exceptions in Python, try and except. File Handling (I/O): Text and Binary files, 'with' Statements." },
            { title: 'Unit IV: Advanced Python & GUI', desc: "Regular Expressions: Pattern Matching, re Module. Libraries: math, datetime, OS, requests, pandas. GUI Development: Widgets and Event Handling. Introduction to Web Programming with CGI." },
            { title: 'Unit V: Numpy, Pandas and Python Applications', desc: "Networking Basics, Data Manipulation with NumPy, Creating NumPy Arrays, Data Analysis with Pandas, Working with DataFrames, Data Cleaning and Exploration, Database Applications in Python." }
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
        ]),
        'Microprocessor and Interfacing': genSyllabusHTML([
            { title: 'UNIT-1: Introduction to 8-bit microprocessor', desc: "Microcomputers and microprocessors, 8/ 16/ 32/ 64-bit microprocessor families; Internal architecture of Intel 8085 microprocessor: Block diagram, Registers, Internal Bus Organization, Functional details of pins, Control signals, External Address / Data bus multiplexing, De-multiplexing, Serial communication and DMA features, Intel 8086, x86 and Pentium microprocessors Block diagrams." },
            { title: 'UNIT-2: Assembly Language Programming', desc: "8085 instructions set: Instructions, Classifications, Addressing modes, Stack and Subroutines, Delay routines, Counters etc., Programming examples." },
            { title: 'UNIT-3: Interfacing concepts and devices', desc: "Memory interface: Concept of memory chip/ chips interface to 8085 with appropriate examples, I/O mapped I/O, and memory mapped I/O techniques. Programmable interfacing devices: Programmable peripheral interface (Intel 8255), Programmable timer interface (Intel 8253/ 54), Programmable display / Keyboard interface (Intel 8279), Programmable serial communication interface (Intel 8251) - their architecture, register organization, initialization, hardware, and software interface to 8085." },
            { title: 'UNIT- 4: Instruction Timing and Interrupts', desc: "Timing Diagrams (of various instructions): T-state, Machine cycle (Opcode fetch, Read / Write, Interrupts, Interrupt Acknowledge, Bus Idle, etc), Interrupts: types (h/ w and s/ w), Maskable / Non maskable and their organization." },
            { title: 'UNIT 5: Introduction to Intel Architecture', desc: "How an Intel Architecture System works, Internal architecture of Basic Components of the Intel Core 2 Duo Processor: The CPU, Memory Controller, I/O Controller; Intel Core i7: Architecture, The Intel Core i7 Processor, Intel QuickPath Interconnect, The SCH; Intel Atom Architecture. Introduction to Texas Instruments' Multi-Core Multilayer SoC architecture for communications, infrastructure equipment." }
        ]),
        'Database Management System': genSyllabusHTML([
            { title: 'Unit 1: Basic Concepts', desc: "Data Vs Information, Definition of Database, Advantages of Database Systems, Components of DBMS, DBMS Architecture and Data Independence, Data modeling, Entity Relationship Model, Relational, Network, Hierarchical and Object-Oriented Models. Data Modelling Using the Entity Relationship Model." },
            { title: 'Unit 2: Relational Database and SQL', desc: "Relational Databases, Relational Algebra, Relational Algebra Operation, Tuple Relational Calculus, Domain Relational Calculus. Data Definition with SQL, Inserts, Delete and Update Statements in SQL, Views, Data Manipulation with SQL, PL/SQL constructs: Triggers, Cursors etc." },
            { title: 'Unit 3: Database Design and Normalization', desc: "Database Design: Design Guidelines, Key concepts, Relational Database Design, Integrity Constraints, Domain Constraints, Referential Integrity, Functional Dependency, decomposition. Normalization Using Functional Dependencies: Normal Forms, First, Second and Third Normal Forms, Boyce Codd Normal Form, Multivalued Dependencies and Fourth Normal Form, Join Dependencies and Fifth Normal Form, Decomposition in 2NF, 3NF and BCNF." },
            { title: 'Unit 4: Database Transactions Processing and Concurrency Control', desc: "Database Transactions Processing: Introduction to Transaction Processing, Transaction Concepts, Desirable Properties of Transactions, Schedules, Concepts of Recoverability and Serializability. Concurrency control: introduction, locking protocols." },
            { title: 'Unit 5: Query Processing and Advanced Databases', desc: "Query Processing and Optimization, File organization and indexes, hashing techniques, B-tree, B+ tree etc. Introduction to advanced databases: Distributed databases, Object-oriented databases, mobile and web databases, Introduction to data warehousing and mining." }
        ]),
        'Operating System': genSyllabusHTML([
            { title: 'Unit 1', desc: "Introduction to OS. Operating system functions, evaluation of O.S., Different types of O.S.: Batch, Multi-Programmed, Time-Sharing, Real-Time, Distributed, Parallel. Process: Concept of Processes, Process Scheduling, Operations on Processes, Cooperating Processes, Inter-Process Communication. Precedence Graphs, Critical Section Problem, Semaphores, Threads." },
            { title: 'Unit 2', desc: "CPU Scheduling: Scheduling Criteria, Preemptive & Non-Preemptive Scheduling, Scheduling Algorithms, Algorithm Evaluation, Multi-Processor Scheduling, Deadlock: Deadlock Problem, Deadlock Characterization, Deadlock Prevention, Deadlock Avoidance, Deadlock Detection, Recovery From Deadlock, Methods for Deadlock Handling." },
            { title: 'Unit 3', desc: "Memory Management: Concepts of Memory Management, Logical and Physical Address Space, Swapping, Fixed and Dynamic Partitions, Best Fit, First Fit and Worst Fit Allocation, Paging, Segmentation, and Paging Combined With Segmentation." },
            { title: 'Unit 4', desc: "Concepts of Virtual Memory, Cache Memory Organization, Demand Paging, Page Replacement Algorithms, Allocation of Frames, Thrashing, Demand Segmentation, Role of Operating System in Security, Security Breaches, System Protection, and Password Management." },
            { title: 'Unit 5', desc: "Disk Scheduling, File Concepts, File Manager, File Organization, Access Methods, Allocation Methods, Free Space Managements, Directory Systems, File Protection, File Organization & Access Mechanism, File Sharing Implement Issue, File Management in Linux, Introduction to Distributed System." }
        ]),
        'Advanced Java Programming': genSyllabusHTML([
            { title: 'Unit 1: Collection and Generic', desc: "Introduction to Generics, Generics Types and Parameterized Types, Wildcards, Java Collection Framework, Collections (Basic Operations, Bulk Operations, Iteration) List, Set, Maps. Lambda Expressions – Lambda Type Inference, Lambda Parameters, Lambda Function Body, Returning a Value from a Lambda Expression, Lambdas as Objects." },
            { title: 'Unit 2: Introduction Java EE Programming and Servlets', desc: "Basics of Web Application, web client and web server, Servlets, HTTP Methods: GET, POST, PUT, DELETE, TRACE, OPTIONS, MVC design pattern, Init Parameters, Servlet Context, Inter Servlet Communication, Servlet Listeners, Servlet Filters." },
            { title: 'Unit 3: JDBC and JSP', desc: "Managing JDBC Connection, Configuring Data Source to obtain JDBC Connection, Data Access operations with JDBC Template, RDBMS operation classes. JSP Architecture, JSP building blocks, Scripting Tags, implicit object, Introduction to Bean, standard actions, session tracking types and methods. Custom Tags, Introduction to JSP Standard Tag Library (JSTL) and JSTL Tags." },
            { title: 'Unit 4: Spring Frameworks', desc: "Introduction to Spring Framework, POJO Programming Model, Lightweight Containers (Spring IOC container, Configuration Metadata, Configuring and using the Container). Dependency Injection with Spring – Setter Injection, Constructor Injection." },
            { title: 'Unit 5: JDBC and Spring Boot', desc: "Data Access operations with JDBC Template and Spring, Modelling JDBC Operations as Java Objects, Spring Boot and Database, Spring Boot Web Application Development." }
        ]),
        'Theory of Computation': genSyllabusHTML([
            { title: 'Unit 1: Finite Automata and Regular Languages', desc: "Motivation for studying theory of computation, notion of formal languages and grammars, Kleene’s closure, regular expressions and regular languages, closure properties of regular languages, finite automata. Finite automata with output: Mealy and Moore machines, applications." },
            { title: 'Unit 2: Nondeterminism and Minimization', desc: "Nondeterministic finite automata, acceptance condition, Kleene’s theorem, Myhill–Nerode relations, minimization algorithm, non-regular languages, pumping lemma for regular languages." },
            { title: 'Unit 3: Grammars and Context-Free Languages', desc: "Grammars and Chomsky hierarchy, context-free grammars, context-free languages (CFLs), inherent ambiguity of CFLs, closure properties of CFLs. Eliminating useless symbols, null productions and unit productions. Chomsky Normal Form, Greibach Normal Form, Cocke–Younger–Kasami (CYK) algorithm, applications to parsing." },
            { title: 'Unit 4: Pushdown Automata', desc: "Pushdown automata (PDAs), PDAs vs CFLs. Deterministic PDAs and CFLs, applications. Notion of acceptance for PDAs: acceptance by final states and by empty stack, equivalence of the two notions. Proof that CFGs generate the same class of languages that PDAs accept. Pumping lemma for CFLs." },
            { title: 'Unit 5: Turing Machines and Computability', desc: "Introduction to Turing machines, configurations, halting vs looping. Turing computability, nondeterministic, multitape and other versions of Turing machines. Church’s thesis, universal Turing machines. Linear bounded automata (LBAs) and context-sensitive languages. Recursive and recursively enumerable languages. Undecidability of the halting problem and unsolvable problems about Turing machines. Diagonalization language and proof that it is not recursively enumerable." }
        ]),
        'Soft Skills-II': genSyllabusHTML([
            { title: 'Unit 1: Foundations of Logical Reasoning', desc: "Introduction to logical reasoning in placement examinations. Importance of logic in aptitude-based assessments. Understanding problem statements and constraints. Common reasoning traps and mistakes. Techniques to improve logical accuracy and speed." },
            { title: 'Unit 2: Arrangement and Coding–Decoding', desc: "Linear arrangements: One-dimensional arrangements, Circular arrangements (basic level). Concept of positions, ordering, and relative placement. Coding–decoding: Letter-based coding, Number-based coding, Mixed and pattern-based coding." },
            { title: 'Unit 3: Blood Relations, Direction Sense, and Classification', desc: "Blood relations: Family tree structures, Generation-based problems, Symbolic representation techniques. Direction sense: Distance and direction-based reasoning, Use of diagrams and coordinates. Odd one out: Number-based classification, Alphabet-based classification, Logic-based classification." },
            { title: 'Unit 4: Series and Syllogisms', desc: "Series: Number series, Alphabet series, Mixed and logic-based series. Identification of progression patterns. Introduction to syllogisms: Statements and conclusions, Venn diagram approach, Validity of conclusions." },
            { title: 'Unit 5: Data Interpretation Techniques', desc: "Introduction to data interpretation. Types of data representation: Bar graphs, Pie charts, Line graphs, Tabular data. Data comparison and trend analysis. Percentage, ratio, and average calculations within DI. Time management strategies for DI questions." }
        ]),
        'Internet and Web Technology': genSyllabusHTML([
            { title: 'Unit – I: Introduction', desc: "Concept of WWW, HTTP Protocol: request and response, web browser architecture, web servers and application servers, features of Web 2.0, internetworking with TCP/IP, basics of DNS, SMTP, POP3." },
            { title: 'Unit – II: Web Design', desc: "Concepts of effective web design, planning and publishing website. Introduction to web architecture. HTML: lists, tables, images, frames, forms. Document Type Definition (DTD), Document Object Model (DOM). Cascading Style Sheets (CSS) and their types. JavaScript: introduction, documents, forms, statements, functions, objects." },
            { title: 'Unit – III', desc: "Introduction to XML, XML vs HTML, uses of XML, simple XML, XML key components, DTD and schemas. Embedding XML into HTML documents. Transforming XML using CSS, XSL, and XSLT." },
            { title: 'Unit – IV: PHP', desc: "Working with variables and constants, controlling program flow. Working with functions, arrays, files, and directories. Working with forms and databases. Introduction to Servlet lifecycle, API, and Servlet packages." },
            { title: 'Unit – V', desc: "Introduction to Java Server Pages (JSP). JSP application design, JSP objects. Conditional processing, declaring variables and methods. Sharing data between JSP pages. Sharing session and application data. Database programming using JDBC. Web application framework, MVC framework. Introduction to Bootstrap and AngularJS." }
        ]),
        'Statistical Analysis': genSyllabusHTML([
            { title: 'Unit 1: Summarizing Data using Statistical Measures', desc: "Descriptive Statistics – Measure of central tendency - Mean: Arithmetic mean, Geometric mean and Harmonic mean with its Mathematical properties, Properties of mean, Median and mode, Relationship among mean, median and mode, Measure of dispersion – standard deviation, Variance, Covariance and its properties, Coefficient of variation, Quartiles, Quartile deviation and Mean deviation." },
            { title: 'Unit 2: Theory of Random variables and Probability', desc: "Random variables- Discrete and Continuous random variables, Mass and Density function (pmf, pdf), Cumulative Distribution function, Expectation of a random variables, Expectation of random variable in terms of variance, Introduction to probability theory, Trial and Event, law of probability theory, Introduction to Conditional probability." },
            { title: 'Unit 3: Probability Distribution', desc: "Discrete Distribution: Binomial, Poisson distribution with mean variance, Moment generating function. Continuous Distribution: Normal and Exponential Distribution with mean variance, Moment generating function." },
            { title: 'Unit 4: Curve fitting, Correlation, Regression', desc: "Curve fitting (Method of Least Square), linear and nonlinear curves, Correlation, Karl Pearson’s Coefficient of Correlation, Spearman’s Rank Correlation Coefficient, Linear Regression, Regression coefficients, Properties of regression curve." },
            { title: 'Unit 5: Testing of Hypothesis and Analysis of variance', desc: "Introduction to testing of hypothesis, Statistical assumptions, Level of significance, Confidence level, Type I Error, Type II error, Critical value, Power of the test, sampling distribution, Chi-Square test, small sample test – t test for one and two sample mean, F test, Fisher Z test of population variance, Introduction to one way and two way analysis of variance (ANOVA)." }
        ])
    };

    return syllabiDB[subjectName] || '<p style="color:var(--text-dim);">Syllabus details are coming soon for this subject.</p>';
};

window.showAIModal = function (type, subject) {
    let title, content;

    if (type === 'syllabus') {
        title = `📖 Course Syllabus: ${subject}`;
        content = window.getSubjectSyllabusHTML(subject);
    } else if (type === 'summary') {
        title = '✨ AI Concept Summary';
        content = `<div class="ai-modal-content-wrapper" style="text-align: center;">
            <div style="font-size: 3.5rem; margin-bottom: 1.2rem; filter: drop-shadow(0 0 15px rgba(255, 184, 0, 0.3)); animation-delay: 0.1s;">🚧</div>
            <h3 style="color: white; margin-bottom: 0.8rem; font-size: 1.6rem; font-weight: 800; animation-delay: 0.2s;">Feature Coming Soon</h3>
            <p style="color: var(--text-dim); line-height: 1.6; font-size: 0.95rem; max-width: 340px; margin: 0 auto; animation-delay: 0.3s;">Our AI-powered summary engine for <b style="color: var(--secondary); text-shadow: 0 0 10px rgba(0, 242, 255, 0.3);">${subject}</b> is currently in development.</p>
            <div class="loader-pro" style="margin: 2rem auto; animation-delay: 0.4s;"></div>
            <div style="font-size: 0.8rem; color: var(--secondary); background: rgba(0, 242, 255, 0.06); padding: 0.8rem 1.2rem; border-radius: 14px; margin-top: 1.2rem; border: 1px solid rgba(0, 242, 255, 0.12); display: inline-flex; align-items: center; gap: 8px; animation-delay: 0.5s;">
                <span>🚀</span> <span>Available in <b>Pro Sandbox</b> update.</span>
            </div>
        </div>`;
    } else if (type === 'questions') {
        title = '📝 Model Exam Questions';
        
        content = `
            <div class="ai-modal-content-wrapper" id="ai-generator-ui">
                <div style="text-align: center; margin-bottom: 1.5rem; animation-delay: 0.1s;">
                    <h3 style="color: white; font-size: 1.4rem;">Select Examination Type</h3>
                    <p style="color: var(--text-dim); font-size: 0.9rem;">Generate high-probability questions for ${subject}.</p>
                </div>
                
                <div class="exam-type-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin-bottom: 1.5rem; animation-delay: 0.2s;">
                    <div class="exam-type-card" onclick="window.selectExamType(this, 'MST 1')" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 1rem; border-radius: 16px; cursor: pointer; text-align: center; transition: 0.3s;">
                        <div style="font-size: 1.6rem; margin-bottom: 0.4rem;">1️⃣</div>
                        <div style="font-weight: 700; color: white; font-size: 0.9rem;">MST 1</div>
                    </div>
                    <div class="exam-type-card" onclick="window.selectExamType(this, 'MST 2')" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 1rem; border-radius: 16px; cursor: pointer; text-align: center; transition: 0.3s;">
                        <div style="font-size: 1.6rem; margin-bottom: 0.4rem;">2️⃣</div>
                        <div style="font-weight: 700; color: white; font-size: 0.9rem;">MST 2</div>
                    </div>
                    <div class="exam-type-card" onclick="window.selectExamType(this, 'End Sem')" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 1rem; border-radius: 16px; cursor: pointer; text-align: center; transition: 0.3s;">
                        <div style="font-size: 1.6rem; margin-bottom: 0.4rem;">🎓</div>
                        <div style="font-weight: 700; color: white; font-size: 0.9rem;">End Sem</div>
                    </div>
                </div>

                <div id="ai-status-msg" style="text-align: center; margin: 0.5rem 0; color: #7B61FF; font-size: 0.8rem; animation-delay: 0.3s;"></div>

                <div style="animation-delay: 0.4s;">
                    <button id="ai-generate-btn" class="btn btn-primary" style="width: 100%; border-radius: 14px; padding: 0.85rem; font-weight: 800; background: linear-gradient(135deg, #7B61FF, #00F2FF); border: none; color: white; cursor: pointer; box-shadow: 0 10px 20px rgba(123, 97, 255, 0.2); transition: 0.3s;" onclick="window.handleAIGeneration('${subject}')" disabled>
                        ✨ Generate AI Model Paper
                    </button>
                </div>

                <div class="credit-info" style="text-align: center; margin-top: 1rem; animation-delay: 0.5s;">
                    <span id="ai-credits-left" style="font-size: 0.8rem; color: var(--text-dim);">Please select an exam type above.</span>
                </div>
            </div>`;

        // Cache syllabus for AI usage
        window._currentSyllabusContext = window.getSubjectSyllabusHTML(subject);
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
        <div style="background: #050505; border: 1.5px solid rgba(123, 97, 255, 0.3); border-radius: 30px; width: 92%; max-width: 420px; padding: 2rem; position: relative; box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.9); animation: modalFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1), premium-glow-border 4s ease-in-out infinite; overflow: hidden;">
                <!-- Subtle Decorative Glows -->
                <div style="position: absolute; top: -80px; right: -80px; width: 160px; height: 160px; background: radial-gradient(circle, rgba(123, 97, 255, 0.12) 0%, transparent 70%); pointer-events: none;"></div>
                <div style="position: absolute; bottom: -80px; left: -80px; width: 160px; height: 160px; background: radial-gradient(circle, rgba(0, 242, 255, 0.08) 0%, transparent 70%); pointer-events: none;"></div>

                <button class="ai-modal-close" onclick="document.getElementById('dynamic-ai-modal').style.display='none'" style="position: absolute; top: 1.25rem; right: 1.25rem; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 10; transition: 0.3s; font-size: 1rem;">&times;</button>
                
                <div style="margin-bottom: 1.5rem; text-align: center; position: relative; z-index: 1;">
                    <h2 id="dynamic-ai-modal-title" style="font-size: 1.3rem; font-weight: 800; color: white; letter-spacing: -0.5px; opacity: 0; animation: fadeSlideUp 0.6s ease-out forwards; animation-delay: 0.1s;"></h2>
                    <div style="width: 40px; height: 3px; background: linear-gradient(90deg, var(--primary), var(--secondary)); margin: 12px auto; border-radius: 10px; opacity: 0; animation: fadeSlideUp 0.6s ease-out forwards; animation-delay: 0.15s;"></div>
                </div>
                <div id="dynamic-ai-modal-content" style="position: relative; z-index: 1;"></div>
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
    window.jumpToExplorerStep('renderSubjectStep');
};

window.jumpToExplorerStep = function (stepFunc) {
    const explorerHeader = document.getElementById('explorer-header');
    const explorerContent = document.getElementById('explorer-content');
    const view = document.getElementById('final-notes-view');

    if (view) view.style.display = 'none';
    if (explorerHeader) explorerHeader.style.display = 'block';
    if (explorerContent) explorerContent.style.display = 'grid';

    if (window[stepFunc]) {
        window[stepFunc]();
    }
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
        const storageRef = ref(storage, `notes / ${Date.now()}_${file.name} `);

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

// Redundant renderMyUploads removed (already defined at line 2434)

// 3. ADMIN / MODERATION MODULE
window.renderAdminModQueue = function () {
    const { db, query, collection, onSnapshot, where, orderBy, deleteDoc, doc, addDoc } = getFirebase();
    const container = document.getElementById('admin-queue');
    if (!container || !['admin', 'superadmin', 'coadmin'].includes(currentUser.role)) return;

    let q = query(collection(db, "notes"), where("status", "==", "pending"), orderBy("createdAt", "asc"));

    // Co-Admin Restriction: Only see notes from their assigned college
    if (currentUser.role === 'coadmin') {
        const myCollegeId = currentUser.collegeId || currentUser.college;
        console.log(`🛡️ Filtering Mod Queue for College: ${myCollegeId} `);
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
// as they are handled by auth.js and login now.
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
        <div class="tab-pane active fade-in">
            <div class="leaderboard-container">
                <!-- Header -->
                <div class="leaderboard-header">
                    <div class="hof-badge">🏆 Elite Matrix Hall of Fame</div>
                    <h1>Leaderboard</h1>
                    <p>Track the champions of academic excellence and community contribution in real-time.</p>
                    
                    <div class="lb-tabs-container">
                        <div class="lb-tabs">
                            <div class="lb-tab active" data-type="student" onclick="switchLeaderboardTab(this, 'student')">🧑🎓 Academic Elite</div>
                            <div class="lb-tab" data-type="contributor" onclick="switchLeaderboardTab(this, 'contributor')">📤 Top Uploaders</div>
                            <div class="lb-tab" data-type="college" onclick="switchLeaderboardTab(this, 'college')">🏫 Power Colleges</div>
                        </div>
                    </div>
                </div>

                <!-- Spotlight / Podium Area -->
                <div id="lb-spotlight-container" class="lb-spotlight">
                    <!-- Populated via JS -->
                </div>

                <!-- Honorable Mentions (List) -->
                <div class="mentions-container">
                    <div class="mentions-header">
                        <h3>Honorable Mentions</h3>
                        <div style="font-size: 0.8rem; color: rgba(255,255,255,0.3); display: flex; align-items: center; gap: 8px;">
                             <span class="pulse-dot"></span> Matrix Sync Active
                        </div>
                    </div>
                    <div id="lb-list-container" class="mentions-list">
                        <!-- Populated via JS -->
                    </div>
                </div>
            </div>
        </div>
    `;
}

window.switchLeaderboardTab = function(el, type) {
    document.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    updateLeaderboardUI(type, 'all');
};

window.initLeaderboardListeners = function () {
    // Initial Render
    updateLeaderboardUI('student', 'all');
    initLeaderboardRealtime();
};

function initLeaderboardRealtime() {
    const { db, collection, onSnapshot, query } = getFirebase();
    if (!db) return;

    // Listen for global user updates to refresh current view if needed
    onSnapshot(query(collection(db, "users")), () => {
        const activeTab = document.querySelector('.lb-tab.active');
        if (activeTab && activeTab.dataset.type !== 'college') {
            updateLeaderboardUI(activeTab.dataset.type, 'all');
        }
    });
}

function updateLeaderboardUI(type, timeframe) {
    const list = document.getElementById('lb-list-container');
    const spotlightContainer = document.getElementById('lb-spotlight-container');
    if (!list || !spotlightContainer) return;

    const { db, collection, query, orderBy, limit, onSnapshot } = window.firebaseServices || {};
    if (!db) return;

    let colRef;
    let orderField;

    if (type === 'college') {
        colRef = collection(db, "colleges");
        orderField = "views";
    } else {
        colRef = collection(db, "users");
        orderField = type === 'student' ? "xp" : "uploads";
    }

    const q = query(colRef, orderBy(orderField, "desc"), limit(15));

    onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (data.length === 0) {
            list.innerHTML = '<div style="text-align:center; padding: 5rem; color: rgba(255,255,255,0.2);">No elite data synchronized yet.</div>';
            spotlightContainer.innerHTML = '';
            return;
        }

        // --- RENDER SPOTLIGHT (Top 3) ---
        const spotlightData = data.slice(0, 3);
        const visualSpotlight = [];
        if (spotlightData[1]) visualSpotlight.push({ ...spotlightData[1], rank: 2 });
        if (spotlightData[0]) visualSpotlight.push({ ...spotlightData[0], rank: 1 });
        if (spotlightData[2]) visualSpotlight.push({ ...spotlightData[2], rank: 3 });

        spotlightContainer.innerHTML = visualSpotlight.map(item => {
            const label = type === 'student' ? 'Experience Points' : (type === 'contributor' ? 'Successful Uploads' : 'Total Network Views');
            const shortLabel = type === 'student' ? 'XP' : (type === 'contributor' ? 'Uploads' : 'Views');
            const scoreVal = item[orderField] || 0;
            const avatar = item.logo || item.avatar || '';
            const crown = item.rank === 1 ? '<div class="spotlight-crown">👑</div>' : '';
            
            const avatarHtml = avatar 
                ? `<img src="${avatar}" alt="${item.name}">`
                : `<span style="font-size: 3rem; font-weight: 900; color: #fff; opacity: 0.8;">${item.name ? item.name[0] : '?'}</span>`;

            return `
                <div class="spotlight-card rank-${item.rank}">
                    ${crown}
                    <div class="spotlight-avatar-wrapper">
                        <div class="spotlight-avatar">
                            ${avatarHtml}
                        </div>
                        <div class="rank-badge">${item.rank}</div>
                    </div>
                    <div class="spotlight-name">${item.name || "Elite Student"} ${item.rank === 1 ? '✨' : ''}</div>
                    <div class="spotlight-score count-up" data-value="${scoreVal}">${scoreVal.toLocaleString()}</div>
                    <div class="spotlight-label">${shortLabel}</div>
                    <div style="font-size: 0.7rem; color: rgba(255, 255, 255, 0.3); margin-top: 1.5rem; text-transform: uppercase; letter-spacing: 1px;">${label}</div>
                </div>
            `;
        }).join('');

        // --- RENDER LIST (4+) ---
        const listData = data.slice(3);
        list.innerHTML = listData.map((item, index) => {
            const rank = index + 4;
            const label = type === 'student' ? 'POINTS' : (type === 'contributor' ? 'UPLOADS' : 'VIEWS');
            const scoreVal = item[orderField] || 0;
            const avatar = item.logo || item.avatar;

            const avatarHtml = avatar 
                ? `<img src="${avatar}" alt="${item.name}">`
                : `<span style="font-size: 1.2rem; font-weight: 900; color: #fff; opacity: 0.5;">${item.name ? item.name[0] : '?'}</span>`;

            return `
                <div class="mention-row" style="animation-delay: ${index * 0.1}s">
                    <div class="mention-rank">#${rank < 10 ? '0' + rank : rank}</div>
                    <div class="mention-avatar">
                        ${avatarHtml}
                    </div>
                    <div class="mention-info">
                        <h4>${item.name || "Anonymous User"}</h4>
                        <div class="mention-trend trend-up">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                            Rising Fast
                        </div>
                    </div>
                    <div class="mention-score">
                        <span class="val">${scoreVal.toLocaleString()}</span>
                        <span class="lbl">${label}</span>
                    </div>
                </div>
            `;
        }).join('');

        // Trigger Count-Up Animation
        setTimeout(() => {
            document.querySelectorAll('.count-up').forEach(el => {
                const target = parseInt(el.dataset.value);
                if (isNaN(target)) return;
                animateValue(el, 0, target, 1500);
            });
        }, 100);
    });
}

function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start).toLocaleString();
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
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

window.renderBookmarks = function () {
    const contentArea = document.getElementById('tab-content');
    if (!contentArea) return;

    contentArea.innerHTML = `
        <div class="tab-pane active fade-in" style="padding: 2rem;">
            <div style="margin-bottom: 2rem;">
                <h1 class="font-heading">🔖 Your <span class="gradient-text">Bookmarks</span></h1>
                <p style="color: var(--text-dim);">Quick access to all the notes you've saved for later.</p>
            </div>
            <div id="bookmarks-grid" class="notes-list-container-pro">
                <div class="loader-pro" style="margin: 4rem auto;"></div>
            </div>
        </div>
    `;

    const grid = document.getElementById('bookmarks-grid');
    const { db, collection, query, where, onSnapshot, getDocs } = window.firebaseServices;
    
    if (!currentUser || currentUser.isGuest) {
        grid.innerHTML = `
            <div style="text-align: center; padding: 4rem; opacity: 0.5;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🔒</div>
                <p>Login to see your bookmarks.</p>
            </div>
        `;
        return;
    }

    const userId = currentUser.uid || currentUser.id;
    const savedRef = collection(db, "privateDrive", userId, "files");
    const qSaved = query(savedRef, where("type", "==", "saved"));

    // Cleanup previous listener if any
    if (window.bookmarksUnsubscribe) window.bookmarksUnsubscribe();

    window.bookmarksUnsubscribe = onSnapshot(qSaved, async (savedSnap) => {
        const savedIds = [];
        savedSnap.forEach(doc => {
            const data = doc.data();
            savedIds.push(data.noteId || doc.id.replace(/^saved_/, ''));
        });

        if (savedIds.length === 0) {
            grid.innerHTML = `
                <div style="text-align: center; padding: 4rem; opacity: 0.5;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">🔖</div>
                    <p>You haven't bookmarked any notes yet.</p>
                </div>
            `;
            return;
        }

        let allNotes = window.NotesDB || [];
        
        // Find existing notes in cache or globalNotes
        let bookmarkedNotes = allNotes.filter(n => savedIds.includes(n.id));

        // Check globalNotes for static entries
        if (bookmarkedNotes.length < savedIds.length) {
            const missingIds = savedIds.filter(id => !bookmarkedNotes.find(n => n.id === id));
            missingIds.forEach(id => {
                // Search in globalNotes
                for (const col in globalNotes) {
                    for (const sub in globalNotes[col]) {
                        const found = globalNotes[col][sub].find(n => n.id === id);
                        if (found && !bookmarkedNotes.find(n => n.id === id)) {
                            bookmarkedNotes.push(found);
                        }
                    }
                }
            });
        }

        // If still missing some notes, fetch them specifically from Firestore
        if (bookmarkedNotes.length < savedIds.length) {
            try {
                const missingIds = savedIds.filter(id => !bookmarkedNotes.find(n => n.id === id));
                if (missingIds.length > 0) {
                    const fetchNotesByIds = async (ids) => {
                        const results = [];
                        for (let i = 0; i < ids.length; i += 30) {
                            const chunk = ids.slice(i, i + 30);
                            const q = query(collection(db, "notes"), where("__name__", "in", chunk));
                            const snap = await getDocs(q);
                            snap.forEach(doc => results.push({ id: doc.id, ...doc.data() }));
                        }
                        return results;
                    };

                    const fetchedNotes = await fetchNotesByIds(missingIds);
                    // Update global cache to avoid refetching
                    window.NotesDB = [...(window.NotesDB || []), ...fetchedNotes];
                    allNotes = window.NotesDB;
                    
                    fetchedNotes.forEach(fn => {
                        if (!bookmarkedNotes.find(n => n.id === fn.id)) bookmarkedNotes.push(fn);
                    });
                }
            } catch (e) {
                console.error("Fetch bookmarked notes error:", e);
            }
        }

        // Filter out duplicates and ensure valid data
        const uniqueBookmarks = [];
        const seenIds = new Set();
        bookmarkedNotes.forEach(n => {
            if (n && n.id && !seenIds.has(n.id)) {
                uniqueBookmarks.push(n);
                seenIds.add(n.id);
            }
        });

        // Only show approved notes
        const approvedBookmarks = uniqueBookmarks.filter(n => n.status === 'approved' || !n.status);

        if (approvedBookmarks.length === 0) {
             grid.innerHTML = `
                <div style="text-align: center; padding: 4rem; opacity: 0.5;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">🕳️</div>
                    <p>The notes you bookmarked are no longer available or pending approval.</p>
                    <button class="btn btn-ghost btn-sm" style="margin-top: 1rem;" onclick="renderTabContent('notes')">Explore More Notes</button>
                </div>
            `;
            return;
        }

        const cardsHTML = approvedBookmarks.map((n, index) => {
            // Replicate Premium Stats Logic for consistency
            const seed = (n.id || `note_${index}`).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const dayFactor = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
            const isStuck = (seed % 8 === 0);
            const baseViews = (seed % 400) + 120;
            const baseLikes = Math.floor(baseViews * 0.15) + (seed % 15);
            const dailyViews = isStuck ? 0 : (seed % 8 + 2) * (dayFactor % 20);
            const dailyLikes = isStuck ? 0 : Math.floor(dailyViews * 0.08);
            
            const displayViews = (n.views || 0) + baseViews + dailyViews;
            const displayLikes = (n.likes || 0) + baseLikes + dailyLikes;
            const displayDislikes = n.dislikes || (seed % 4);

            const isLiked = window.likedNoteIds?.has(n.id);
            const isDisliked = window.dislikedNoteIds?.has(n.id);
            const isSaved = true;

            const unitTag = n.unit || (n.title.toLowerCase().includes('unit') ? n.title.match(/unit\s*\d+/i)?.[0].toUpperCase() : 'UNIT 1');

            return `
                <div class="detailed-item glass-card card-reveal" data-note-id="${n.id}" style="animation-delay: ${index * 0.1}s; margin-bottom: 1.2rem; padding: 1.2rem 1.5rem; display: flex; justify-content: space-between; align-items: center;">
                    <div class="item-left" style="display: flex; gap: 1.25rem; align-items: flex-start; flex: 1;">
                        <div class="file-type-icon" style="width: 45px; height: 45px; background: rgba(0, 242, 255, 0.1); color: var(--secondary); display: flex; align-items: center; justify-content: center; border-radius: 12px; font-size: 1.2rem; flex-shrink: 0;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                        </div>
                        <div class="item-info">
                            <div class="unit-tag" style="font-size: 0.75rem; color: var(--secondary); font-weight: 800; letter-spacing: 1px; margin-bottom: 0.3rem; text-transform: uppercase;">${unitTag}</div>
                            <h3 class="item-title" style="font-size: 1.2rem; font-weight: 700; color: white; margin: 0 0 0.4rem 0;">${n.title}</h3>
                            <div class="item-meta-row" style="display: flex; align-items: center; gap: 1.2rem; font-size: 0.85rem; color: var(--text-dim);">
                                <div class="uploader-mini" style="display: flex; align-items: center; gap: 0.5rem;">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                    <span>${n.uploaderName || n.uploader || 'Verified'}</span>
                                </div>
                                <div class="views-mini" style="display: flex; align-items: center; gap: 0.4rem;">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                    <span class="views">${displayViews} Views</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="item-right" style="display: flex; align-items: center; gap: 1.5rem;">
                        <div class="item-actions-inline" style="display: flex; align-items: center; gap: 0.8rem;">
                            <button class="eng-btn-pro like-btn ${isLiked ? 'active' : ''}" onclick="likeNote('${n.id}')" style="display: flex; align-items: center; gap: 0.5rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 0.5rem 0.8rem; border-radius: 8px; color: var(--text-dim); transition: 0.3s; cursor: pointer;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                                <span class="count" style="font-weight: 700; font-size: 0.9rem;">${displayLikes}</span>
                            </button>
                            <button class="tool-icon-pro bookmark-btn active" onclick="toggleBookmark('${n.id}')" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 0.6rem; border-radius: 8px; color: var(--text-dim); transition: 0.3s; cursor: pointer;">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2-2z"></path></svg>
                            </button>
                        </div>
                        <a href="${n.url || n.fileUrl || n.driveLink}" target="_blank" class="btn-download-pro" onclick="viewNote('${n.id}')" style="background: white; color: black; padding: 0.7rem 1.5rem; border-radius: 8px; font-weight: 700; font-size: 0.9rem; text-decoration: none; display: flex; align-items: center; gap: 0.6rem; transition: 0.3s;">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            View
                        </a>
                    </div>
                </div>`;
        }).join('');

        grid.innerHTML = `<div class="notes-list-container-pro">${cardsHTML}</div>`;
        
        if (window.attachNoteRealtimeListeners) {
            window.attachNoteRealtimeListeners('bookmarks-grid');
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


// --- MODULE 1: BOOKMARKS (REPLACED PRIVATE DRIVE) ---
// Note: renderBookmarks is defined above.


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
    if (isNotificationsInit) return;
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
    if (isStatsInit) return;
    const { db, collection, query, where, onSnapshot, limit } = getFirebase();
    if (!db) return;

    isStatsInit = true;

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
    const myId = currentUser?.uid || currentUser?.id;
    if (!db || !myId || currentUser.isGuest) return;

    const statsRef = doc(db, "user_stats", myId);
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

// --- DASHBOARD SIMULATION & CHARTS ---
// Graph logic removed

// Periodic simulations for the dashboard overview
function startDashboardSimulation() {
    // 1. Live Students (0-8, every 30 seconds)
    function updateLiveStudents() {
        const el = document.getElementById("liveStudents");
        if (el) el.innerText = Math.floor(Math.random() * 9);
    }
    setInterval(updateLiveStudents, 30000);
    updateLiveStudents();

    // 2. Trending Now (1-15, changes daily)
    function updateTrendingNow() {
        const el = document.getElementById("trendingNow");
        if (el) {
            // Seeded random based on date to keep it stable for 24h
            const today = new Date().toDateString();
            let seed = 0;
            for (let i = 0; i < today.length; i++) seed += today.charCodeAt(i);
            const count = (seed % 15) + 1; // 1-15
            el.innerText = count + " Notes";
        }
    }
    updateTrendingNow();

    // 3. Global Downloads & Views (Sync with stats.js centralized logic)
    function syncGlobalStats() {
        if (typeof getStats === 'function') {
            const stats = getStats();
            const viewsEl = document.getElementById("stat-views");
            const downloadsEl = document.getElementById("globalDownloads");

            if (viewsEl) viewsEl.innerText = stats.formattedViews;
            if (downloadsEl) downloadsEl.innerText = stats.formattedDownloads;
        }
    }
    setInterval(syncGlobalStats, 60000);
    syncGlobalStats();
}

// Start simulation once dashboard logic is up
startDashboardSimulation();

window.selectExamType = function (el, type) {
    document.querySelectorAll('.exam-type-card').forEach(c => {
        c.classList.remove('active');
    });
    el.classList.add('active');
    window.selectedExamType = type;
    document.getElementById('ai-generate-btn').disabled = false;
    document.getElementById('ai-credits-left').innerText = `Ready to generate ${type} paper.`;
};

window.handleAIGeneration = async function (subject) {
    const btn = document.getElementById('ai-generate-btn');
    const statusMsg = document.getElementById('ai-status-msg');

    if (!window.selectedExamType) return;

    try {
        btn.disabled = true;
        btn.innerHTML = `<span class="loader-pro" style="width: 16px; height: 16px; border-width: 2px;"></span> Processing...`;
        statusMsg.innerText = "Processing High-Quality Model Paper...";
        statusMsg.style.color = "var(--secondary)";

        // Fetch syllabus context
        let syllabusText = "";
        if (window._currentSyllabusContext) {
            syllabusText = window.AIGenerator.filterSyllabus(window._currentSyllabusContext, window.selectedExamType);
        }

        const paperData = await window.AIGenerator.getPaper(subject, subject, window.selectedExamType, syllabusText);
        const paperHTML = window.AIGenerator.renderPaperHTML(paperData);

        // Update UI to Success State
        statusMsg.style.color = "#2ed573";
        statusMsg.innerText = "✨ Paper Generated Successfully!";
        
        // Transform the generator area into a Download Center
        const modalBody = btn.closest('.modal-content-pro') || btn.parentElement;
        if (modalBody) {
            modalBody.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">📄</div>
                    <h2 class="font-heading" style="color: white; margin-bottom: 0.5rem;">${window.selectedExamType} Paper Ready</h2>
                    <p style="color: var(--text-dim); margin-bottom: 2rem;">A professional academic model paper with marking scheme has been generated.</p>
                    <div style="display: flex; gap: 10px; justify-content: center;">
                        <button id="final-download-btn" class="btn btn-primary" style="padding: 1rem 2rem; border-radius: 12px; font-weight: 700; background: #2ed573; border-color: #2ed573; color: #1a1a1a;">
                            📥 Download PDF
                        </button>
                        <button class="btn" style="padding: 1rem 2rem; border-radius: 12px; background: rgba(255,255,255,0.05); color: white;" onclick="document.getElementById('dynamic-ai-modal').style.display='none'">
                            Close
                        </button>
                    </div>
                </div>
            `;

            // Attach download listener
            document.getElementById('final-download-btn').onclick = () => {
                const fileName = `SKiL_MATRiX_${subject.replace(/\s+/g, '_')}_${window.selectedExamType.replace(/\s+/g, '_')}.pdf`;
                window.AIGenerator.downloadAsPDF(paperHTML, fileName);
            };
        }

    } catch (e) {
        console.error(e);
        statusMsg.style.color = "#ff4757";
        statusMsg.innerText = "Error: " + e.message;
        btn.disabled = false;
        btn.innerHTML = `✨ Try Again`;
    }
};

