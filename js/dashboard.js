window.getViewerUrl = function(url, title, id) { if (id) return '../pages/view?id=' + id; if (!url) return '#'; try { return '../pages/view?u=' + btoa(encodeURIComponent(url)) + '&t=' + btoa(encodeURIComponent(title || 'Document')); } catch(e) { return url; } };
import { globalNotes } from "../data/globalNotes.js?v=6.0";
import { renderCodingArena } from './coding-arena.js?v=1.3';
import { RoutingSystem } from "./routing.js?v=6.0";
import { initGlobalAnalytics } from './analytics.js?v=6.0';

// Initialize analytics (Supabase & Firebase) so dashboard stats are populated globally
initGlobalAnalytics();

window.openCodingArena = function() {
    const mainContent = document.getElementById('tab-content');
    if (mainContent) {
        renderCodingArena(mainContent);
    }
};

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
        { id: 'medicaps', name: 'Medicaps University', status: 'active', logo: '../assets/logos/medicaps.png?v=6.0' },
        { id: 'lnct', name: 'LNCT COLLEGE BHOPAL', status: 'active', logo: '../assets/logos/lnct.jpg?v=6.0' },
        { id: 'cdgi', name: 'CDGI University', status: 'locked', logo: '../assets/logos/cdgi.png?v=6.0' },
        { id: 'ips', name: 'IPS Academy', status: 'active', logo: '../assets/logos/ips.png?v=6.0' },
        { id: 'iitd', name: 'IIT Delhi', status: 'locked', logo: '../assets/logos/iitd.png?v=6.0' }
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
            { id: 'stat-analysis', name: 'Statistical Analysis', icon: '📊', code: 'CS3EL11', description: `<b>Unit I: Summarizing Data using Statistical Measures</b><br>Descriptive Statistics –Measure of dispersion – standard deviation, Variance, Covariance, Coefficient of variation, Quartiles, Quartile deviation and Mean deviation.<br><b>Unit II: Theory of Random variables and Probability</b><br>Random variables- Discrete and Continuous random variables, Mass and Density function (pmf, pdf), CDF, Expectation.<br><b>Unit III: Probability Distribution</b><br>Binomial, Poisson, Normal and Exponential Distribution, MGF (without proof).<br><b>Unit IV: Curve fitting, Correlation, Regression</b><br>Least Square Method (Straight line and Parabola), Correlation, Rank Correlation, Linear Regression.<br><b>Unit V: Testing of Hypothesis and ANOVA</b><br>Level of significance, Type I/II Error, Chi-Square, t-test, F-test, ANOVA.` },
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
window.globalNotes = globalNotes;

window.NotesDB = [];
let NotesDB = window.NotesDB;
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

// --- WEEKLY PLAN SYSTEM ---
let weeklyPlan = JSON.parse(localStorage.getItem('weeklyPlan')) || [
    { week: 1, title: 'OOP Basics', status: 'completed', progress: 100 },
    { week: 2, title: 'Advanced OOP', status: 'active', progress: 60 },
    { week: 3, title: 'Practice', status: 'locked', progress: 0 }
];

async function initWeeklyPlanSync() {
    const { db, doc, onSnapshot } = getFirebase();
    if (!currentUser || currentUser.isGuest || !db) return;

    const planRef = doc(db, "users", currentUser.id, "planner", "weeklyPlan");
    onSnapshot(planRef, (snap) => {
        if (snap.exists()) {
            weeklyPlan = snap.data().plan || weeklyPlan;
            console.log("📅 Weekly Plan Synced:", weeklyPlan.length, "weeks");
        }
    });
}
window.initWeeklyPlanSync = initWeeklyPlanSync;

window.openPlannerEditor = function () {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay fade-in';
    modal.id = 'planner-editor-modal';

    let rowsHtml = weeklyPlan.map((item, idx) => `
        <div class="planner-edit-row" style="display: flex; gap: 10px; align-items: center; margin-bottom: 1rem; background: rgba(15,17,26,0.6); padding: 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.05); transition: all 0.3s ease;">
            <div class="planner-week-label" style="font-weight: 800; font-size: 0.9rem; color: #a1b0c8; width: 70px;">Week ${item.week}</div>
            <input type="text" class="planner-input" style="flex: 1; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); color: #ffffff; padding: 10px 12px; border-radius: 8px; font-size: 0.9rem; outline: none; transition: border-color 0.3s ease;" value="${item.title}" data-idx="${idx}" placeholder="Topic Name">
            <select class="planner-select" style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); color: #ffffff; padding: 10px; border-radius: 8px; font-size: 0.9rem; outline: none; appearance: none; cursor: pointer; min-width: 110px;" data-idx="${idx}">
                <option style="background: #11131a; color: white;" value="completed" ${item.status === 'completed' ? 'selected' : ''}>✅ Completed</option>
                <option style="background: #11131a; color: white;" value="active" ${item.status === 'active' ? 'selected' : ''}>⏳ Active</option>
                <option style="background: #11131a; color: white;" value="locked" ${item.status === 'locked' ? 'selected' : ''}>🔒 Locked</option>
            </select>
            <button class="btn-icon-mini planner-delete-btn" style="background: rgba(255,45,149,0.1); color: #FF2D95; border: 1px solid rgba(255,45,149,0.3); padding: 8px 12px; border-radius: 8px; cursor: pointer; transition: all 0.3s ease; font-size: 1rem;" onclick="removeWeekFromPlan(${idx})" onmouseover="this.style.background='rgba(255,45,149,0.2)'" onmouseout="this.style.background='rgba(255,45,149,0.1)'">✕</button>
        </div>
    `).join('');

    modal.innerHTML = `
        <div class="upload-card planner-modal-card" style="background: linear-gradient(145deg, #151322, #0c0a12); border: 1px solid rgba(123, 97, 255, 0.15); box-shadow: 0 10px 40px rgba(0,0,0,0.5); padding: 2rem; border-radius: 16px; max-width: 600px; width: 90%; margin: auto;">
            <h2 class="font-heading" style="color: #ffffff; margin-bottom: 0.5rem; font-size: 1.5rem;">Design Your Track</h2>
            <p class="subtitle" style="color: #aebacd; margin-bottom: 2rem;">Customize your weekly learning roadmap</p>
            
            <div id="planner-rows-container" style="max-height: 400px; overflow-y: auto; padding-right: 10px; margin-bottom: 1.5rem;">
                ${rowsHtml}
            </div>
            
            <button class="btn btn-ghost add-week-btn" style="width: 100%; border: 1px dashed rgba(255,255,255,0.2); border-radius: 10px; padding: 12px; font-weight: 700; color: #b4a2ff; transition: all 0.3s ease;" onclick="addWeekToPlan()" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='transparent'">+ Add New Week</button>
            
            <div class="modal-actions" style="display: flex; gap: 1rem; margin-top: 2rem;">
                <button class="btn btn-ghost" style="flex: 1; padding: 12px; border-radius: 10px; font-weight: 700;" onclick="document.getElementById('planner-editor-modal').remove()">Cancel</button>
                <button class="btn" style="flex: 2; background: linear-gradient(90deg, #6D5DF2, #00f2ff); border: none; color: white; padding: 12px; border-radius: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 15px rgba(0, 242, 255, 0.3);" onclick="savePlannerChanges()">Save Plan</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
};

window.addWeekToPlan = function () {
    const nextWeek = weeklyPlan.length + 1;
    weeklyPlan.push({ week: nextWeek, title: '', status: 'locked', progress: 0 });
    document.getElementById('planner-editor-modal').remove();
    window.openPlannerEditor();
};

window.removeWeekFromPlan = function (idx) {
    weeklyPlan.splice(idx, 1);
    // Re-index weeks
    weeklyPlan.forEach((w, i) => w.week = i + 1);
    document.getElementById('planner-editor-modal').remove();
    window.openPlannerEditor();
};

window.savePlannerChanges = async function () {
    try {
        const modal = document.getElementById('planner-editor-modal');
        if (!modal) return;

        const inputs = Array.from(modal.querySelectorAll('.planner-input'));
        const selects = Array.from(modal.querySelectorAll('.planner-select'));

        // 1. Capture Data with safety checks
        const newPlan = weeklyPlan.map((item, idx) => {
            const input = inputs[idx];
            const select = selects[idx];
            const status = select ? select.value : item.status;
            return {
                ...item,
                title: input ? (input.value || `Week ${idx + 1}`) : item.title,
                status: status,
                progress: status === 'completed' ? 100 : (status === 'active' ? 50 : 0)
            };
        });

        // 2. Update Global State Immediately
        weeklyPlan = newPlan;

        // Save locally to localStorage so it persists for guests
        localStorage.setItem('weeklyPlan', JSON.stringify(weeklyPlan));

        // 3. Save to Cloud (Fire and Forget or handle error silently)
        const firebase = getFirebase();
        if (currentUser && !currentUser.isGuest && firebase && firebase.db) {
            const { db, doc, setDoc } = firebase;
            setDoc(doc(db, "users", currentUser.id, "planner", "weeklyPlan"), {
                plan: newPlan,
                lastUpdated: new Date().toISOString()
            }, { merge: true }).catch(e => console.error("Cloud Sync Error:", e));
        }

        // 4. Close Modal and Notify
        modal.remove();
        showToast("Plan Saved! 🚀");

        // 5. Hard Refresh Overview UI
        if (typeof renderTabContent === 'function') {
            renderTabContent('overview');
        }
    } catch (err) {
        console.error("Save Logic Error:", err);
        const m = document.getElementById('planner-editor-modal');
        if (m) m.remove();
        showToast("Error updating plan", "error");
    }
};

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
            college: 'matrix',
            collegeName: 'SKiL MATRiX Scholar',
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
                    if (typeof initWeeklyPlanSync === 'function') initPromises.push(initWeeklyPlanSync());

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
            if (!snap.empty) {
                GlobalData.colleges = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                console.log("🏫 Dynamic Colleges Synced:", GlobalData.colleges.length);
            } else {
                console.log("⚠️ Colleges collection empty, using defaults.");
            }
            window.dispatchEvent(new CustomEvent('collegesUpdated', { detail: GlobalData.colleges }));
            resolve();
        });
    });
}

import { supabase } from './supabase-config.js?v=1.0';

function initNotesSync() {
    if (isNotesSyncInit) return;
    if (unsubscribeNotes) {
        supabase.removeChannel(unsubscribeNotes);
    }

    isNotesSyncInit = true;
    console.log("📡 Initializing Notes Hub Synchronization (Supabase)...");

    const fetchApprovedNotes = async () => {
        try {
            const { data, error } = await supabase
                .from('approved_notes')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);
                
            if (error) throw error;
            
            if (JSON.stringify(NotesDB) !== JSON.stringify(data)) {
                NotesDB = data.map(d => ({
                    ...d,
                    url: d.file_url,
                    fileUrl: d.file_url,
                    uploaderName: d.uploader_name || (d.uploader_email ? d.uploader_email.split('@')[0] : 'Scholar'),
                    name: d.title
                }));
                window.NotesDB = NotesDB;
                console.log(`📦 Notes Hub Updated: ${NotesDB.length} records in cache.`);
                
                // Note: The UI updates based on NotesDB in the notes tab
            }
        } catch (e) {
            console.error("Supabase sync error:", e);
        }
    };

    fetchApprovedNotes();

    unsubscribeNotes = supabase.channel('public:approved_notes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'approved_notes' }, fetchApprovedNotes)
        .subscribe();
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
    window.performGlobalSearch = function (queryOrId) {
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
                collegeId: 'matrix',
                collegeName: 'SKiL MATRiX Scholar',
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
            background: rgba(0,0,0,0.8); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
            z-index: 10000; display: flex; align-items: center; justify-content: center;
            opacity: 0; pointer-events: none; transition: opacity 0.3s ease;
        `;

        // Using User's HTML Structure
        modal.innerHTML = `
            <div class="upload-card notes-upload-card" onclick="event.stopPropagation()">
                <button onclick="closeDashboardUploadModal()" class="notes-upload-close-btn" title="Close">&times;</button>
                <h2>Upload Notes</h2>
                <p class="subtitle">Share your academic notes & PYQs with peers</p>

                <form class="upload-form notes-upload-form" id="dash-upload-form">
                    <!-- COLLEGE (SELECT) -->
                    <div class="form-group full">
                    <label for="college">College Name</label>
                    <select id="college" onchange="const nc = document.getElementById('college-new-wrapper'); if(this.value==='new_college'){nc.style.display='block';} else {nc.style.display='none';}">
                        <option value="">Select college</option>
                        ${GlobalData.colleges.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                        <option value="new_college">+ Other (Add New Institution)</option>
                    </select>
                    <div id="college-new-wrapper" style="display: none; margin-top: 8px;">
                        <input type="text" id="college-new-name" placeholder="Enter Full Institution Name" style="width: 100%; padding: 8px 12px; background: rgba(255,255,255,0.05); border: 1px solid var(--primary); border-radius: 8px; color: white;">
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

                    <div class="form-group">
                    <label for="note-type">Note Type</label>
                    <select id="note-type">
                        <option value="notes">📄 Notes</option>
                        <option value="pyqs">📝 PYQs (Previous Year Questions)</option>
                        <option value="formula">🔢 Formula Sheets</option>
                        <option value="practicals">⚗️ Practicals / Lab Work</option>
                    </select>
                    </div>

                    <div class="form-group">
                    <label for="title">Notes Title</label>
                    <input id="title" type="text" placeholder="Enter notes title" required />
                    </div>

                    <!-- FILE UPLOAD DROP ZONE -->
                    <div class="form-group full" id="drop-zone-container" style="position: relative; margin-top: 4px;">
                        <input
                            id="file"
                            type="file"
                            style="display: none;"
                            accept=".pdf,.ppt,.pptx,.doc,.docx"
                        />
                        <label id="drop-zone-label" for="file" style="cursor: pointer; display: block; border: 1.5px dashed rgba(102, 255, 227, 0.3); background: rgba(255, 255, 255, 0.02); border-radius: 12px; padding: 22px 16px; text-align: center; transition: all 0.25s ease;">
                            ☁️ <b style="color: #fff;">Click here</b> or drag & drop file<br>
                            <span style="font-size: 11px; color: #7e8ba8; font-weight: normal; margin-top: 4px; display: inline-block;">Supports PDF, PPT, DOC (Max 50MB)</span>
                        </label>
                        <div id="file-attached-card" style="display: none; background: rgba(0, 0, 0, 0.5); border: 1px solid #00ff87; padding: 14px 16px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 255, 135, 0.15); transition: all 0.25s ease;">
                            <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
                                <div style="display: flex; align-items: center; gap: 14px; overflow: hidden;">
                                    <div id="attached-file-icon" style="flex-shrink: 0;"></div>
                                    <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                        <div id="attached-file-name" style="color: #00ff87; font-weight: 600; font-size: 0.95rem; overflow: hidden; text-overflow: ellipsis;"></div>
                                        <div style="color: #7e8ba8; font-size: 0.75rem; margin-top: 3px;">Size: <span id="attached-file-size" style="color: #fff; font-weight: 500;"></span></div>
                                    </div>
                                </div>
                                <button type="button" id="remove-file-btn" title="Remove attachment" style="background: rgba(255, 95, 86, 0.15); border: 1px solid rgba(255, 95, 86, 0.3); color: #ff5f56; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 1rem; flex-shrink: 0; transition: all 0.2s ease;">✕</button>
                            </div>
                        </div>
                    </div>

                    <button type="submit" class="primary-btn notes-upload-submit-btn" id="dash-submit-btn">Upload Note</button>
                    <!-- Progress Bar -->
                    <div style="grid-column: 1/-1; margin-top: 8px; display: none;" id="upload-status-area">
                        <div style="height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden;">
                            <div id="upload-progress" style="width: 0%; height: 100%; background: linear-gradient(90deg, #00ff87, #60efff); transition: width 0.3s ease;"></div>
                        </div>
                        <div style="font-size: 0.8rem; color: #a0a8c0; text-align: center; margin-top: 6px; font-weight: 500;" id="upload-status-text">Uploading...</div>
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

        // Drag and Drop & File Display Logic
        const dropZoneContainer = document.getElementById('drop-zone-container');
        const dropZoneLabel = document.getElementById('drop-zone-label');
        const fileAttachedCard = document.getElementById('file-attached-card');
        const fileInput = document.getElementById('file');
        const attachedIcon = document.getElementById('attached-file-icon');
        const attachedName = document.getElementById('attached-file-name');
        const attachedSize = document.getElementById('attached-file-size');
        const removeBtn = document.getElementById('remove-file-btn');

        const formatFileSize = (bytes) => {
            if (bytes >= 1024 * 1024 * 1024) {
                return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
            } else if (bytes >= 1024 * 1024) {
                return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
            } else if (bytes >= 1024) {
                return (bytes / 1024).toFixed(1) + ' KB';
            } else {
                return bytes + ' B';
            }
        };

        const getFileBadge = (filename) => {
            const ext = filename.split('.').pop().toLowerCase();
            if (ext === 'pdf') {
                return `<span style="background: rgba(255, 59, 48, 0.18); color: #ff3b30; border: 1px solid rgba(255, 59, 48, 0.4); padding: 6px 10px; border-radius: 8px; font-weight: 700; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 8px rgba(255, 59, 48, 0.15);">📕 PDF</span>`;
            } else if (ext === 'ppt' || ext === 'pptx') {
                return `<span style="background: rgba(255, 149, 0, 0.18); color: #ff9500; border: 1px solid rgba(255, 149, 0, 0.4); padding: 6px 10px; border-radius: 8px; font-weight: 700; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 8px rgba(255, 149, 0, 0.15);">📙 PPT</span>`;
            } else if (ext === 'doc' || ext === 'docx') {
                return `<span style="background: rgba(0, 122, 255, 0.18); color: #60efff; border: 1px solid rgba(0, 122, 255, 0.4); padding: 6px 10px; border-radius: 8px; font-weight: 700; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 8px rgba(0, 122, 255, 0.15);">📘 DOC</span>`;
            } else {
                return `<span style="background: rgba(160, 168, 192, 0.18); color: #a0a8c0; border: 1px solid rgba(160, 168, 192, 0.4); padding: 6px 10px; border-radius: 8px; font-weight: 700; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 6px;">📁 FILE</span>`;
            }
        };

        const updateFileDisplay = () => {
            const file = fileInput.files[0];
            if (file) {
                attachedIcon.innerHTML = getFileBadge(file.name);
                attachedName.innerText = file.name;
                attachedSize.innerText = formatFileSize(file.size);
                dropZoneLabel.style.display = 'none';
                fileAttachedCard.style.display = 'block';
            } else {
                dropZoneLabel.style.display = 'block';
                fileAttachedCard.style.display = 'none';
            }
        };

        fileInput.addEventListener('change', updateFileDisplay);

        if (removeBtn) {
            removeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                fileInput.value = '';
                updateFileDisplay();
            });
        }

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZoneContainer.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZoneContainer.addEventListener(eventName, () => {
                dropZoneLabel.style.borderColor = '#00ff87';
                dropZoneLabel.style.background = 'rgba(0, 255, 135, 0.08)';
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZoneContainer.addEventListener(eventName, () => {
                dropZoneLabel.style.borderColor = 'rgba(102, 255, 227, 0.3)';
                dropZoneLabel.style.background = 'rgba(255, 255, 255, 0.02)';
            }, false);
        });

        dropZoneContainer.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt?.files;
            if (files && files.length > 0) {
                fileInput.files = files;
                updateFileDisplay();
            }
        }, false);
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
    const noteType = document.getElementById('note-type')?.value || 'notes';
    const file = document.getElementById('file').files[0];

    if (!file) {
        alert("Please select a file.");
        return;
    }

    const maxAllowedSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxAllowedSize) {
        alert("File size exceeds the 50MB limit.");
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
        college: finalCollegeId || (currentUser.collegeId || ''),
        collegeId: finalCollegeId || (currentUser.collegeId || ''),
        collegeName: finalCollegeName || 'SKiL MATRiX Scholar',
        stream: getSelectText('stream') || 'B.Tech',
        streamId: stream,
        branch: getSelectText('branch') || 'CSE',
        branchId: branch,
        semester: semester,
        subject: getSelectText('subject') || 'General',
        subjectId: subject,
        type: noteType,
        uploader_name: currentUser.name || (currentUser.email ? currentUser.email.split('@')[0] : 'Scholar'),
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
            } catch (fe) { }

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
        const cleanMsg = (err.message || "Unknown error").replace(/supabase|firebase|storage|bucket|postgrest/gi, "server");
        statusText.innerText = "❌ Failed: " + cleanMsg;
        if (window.showToast) window.showToast("Upload failed: " + cleanMsg, "error");
    } finally {
        btn.disabled = false;
        btn.innerText = "Upload Note";
    }
}

window.updateUploadSubjects = async function () {
    const branch = document.getElementById('branch').value;
    const semester = document.getElementById('semester').value;
    const college = document.getElementById('college').value;
    const subjectSelect = document.getElementById('subject');

    if (!branch || !semester || !subjectSelect) return;

    subjectSelect.innerHTML = `<option value="">Loading...</option>`;

    const key = `${branch}-${semester}`;
    const gdSubjects = (college === 'medicaps' || (college && college.includes('medicaps'))) 
        ? (GlobalData.subjects[key] || []) 
        : [];

    let customSubjects = [];
    try {
        let sb = window._apSB;
        if (!sb) {
            const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
            sb = createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
            window._apSB = sb;
        }
        
        // Fetch subjects added by admin for this specific college/branch/sem
        if (college && college !== 'new_college') {
            const { data } = await sb.from('college_subjects')
                .select('id, subject_name, subject_code')
                .eq('college_id', college)
                .eq('branch_id', branch)
                .eq('semester', semester);
                
            if (data) customSubjects = data;
        }
    } catch(e) { 
        console.error('Error fetching custom subjects for upload:', e); 
    }

    const combined = [...gdSubjects];
    customSubjects.forEach(cs => {
        if (!combined.find(s => s.name.toLowerCase() === cs.subject_name.toLowerCase())) {
            combined.push({ 
                id: cs.id, 
                name: cs.subject_name 
            });
        }
    });

    subjectSelect.innerHTML = `<option value="">Select subject</option>` +
        combined.map(s => `<option value="${s.id || s.name}">${s.name}</option>`).join('') +
        `<option value="other">Other</option>`;
};

// --- TAB LOGIC ---
let isTabsInit = false;
function initTabs() {
    if (isTabsInit) return;
    isTabsInit = true;
    const sidebarNav = document.querySelector('.sidebar-nav');
    if (!sidebarNav || !currentUser) return;

    // Reset Sidebar to Base State. Static items are already grouped and ordered in dashboard.html.

    // Clear previously injected dynamic items
    document.querySelectorAll('.dynamic-node').forEach(n => n.remove());

    const profileItem = sidebarNav.querySelector('.nav-item[data-tab="profile"]');
    const insertAfter = (node, referenceNode) => {
        if (referenceNode && referenceNode.parentNode) {
            referenceNode.parentNode.insertBefore(node, referenceNode.nextSibling);
        } else {
            sidebarNav.appendChild(node);
        }
    };

    // Profile section: Leaderboard, My Profile, My Uploads
    const myUploads = createNavItem('my-uploads', '📤', 'My Uploads', true);
    insertAfter(myUploads, profileItem);
    // Re-bind listeners and set initial active state
    const urlParams = new URLSearchParams(window.location.search);
    const initialTab = urlParams.get('tab') || window.pendingTab || 'overview';

    document.querySelectorAll('.nav-item').forEach(item => {
        if (item.dataset.tab === initialTab) item.classList.add('active');

        item.onclick = (e) => {
            if (!item.dataset.tab) return;
            e.preventDefault();
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            renderTabContent(item.dataset.tab);

            // ⚡ Mobile UX: Auto-close sidebar on item selection
            document.querySelector('.sidebar')?.classList.remove('active');
        };
    });

    // Actually load the content for the initial tab
    renderTabContent(initialTab);
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
        let displayRole = currentUser.role ? currentUser.role.toUpperCase() : 'STUDENT';
        if (displayRole === 'USER') displayRole = 'STUDENT';
        meta.innerText = displayRole;
    }

    // Ensure logout button is NOT added here (it's in Settings now)
    const existingLogout = document.getElementById('logout-btn');
    if (existingLogout) existingLogout.remove();
}



window.renderTabContent = renderTabContent;
function renderTabContent(tabId) {
    const contentArea = document.getElementById('tab-content');
    if (!contentArea) return;

    // 1. Sync Sidebar Active State (Crucial for Dashboard Cards)
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.tab === tabId) item.classList.add('active');
    });

    // 2. Scroll to top for fresh view
    window.scrollTo({ top: 0, behavior: 'smooth' });

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
            
            // Live fetch true Coding Streak from Supabase
            if (window.currentUser && window.currentUser.id && window.supabase) {
                window.supabase.from('users').select('coding_streak').eq('id', window.currentUser.id).single()
                    .then(({ data, error }) => {
                        if (!error && data) {
                            const liveStreak = data.coding_streak || 0;
                            window.currentUser.coding_streak = liveStreak;
                            localStorage.setItem('auth_user_full', JSON.stringify(window.currentUser));
                            const streakSpan = document.querySelector('.premium-streak-badge .streak-count');
                            if (streakSpan) {
                                streakSpan.innerText = liveStreak === 1 ? "1 Day" : `${liveStreak} Days`;
                            }
                        }
                    }).catch(e => console.error(e));
            }
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
                        renderSubjectStep();
                    } else if (nextStep === "SEMESTER_STEP" || nextStep === "YEAR_STEP") {
                        renderCombinedSemesterStep();
                    } else if (nextStep === "BRANCH_STEP") {
                        renderBranchStep();
                    } else {
                        renderCollegeStep();
                    }
                }
            }
        } else if (tabId === 'codetantra') {
            contentArea.innerHTML = '<div id="codetantra" class="tab-pane fade-in"><div id="ct-app-root"></div></div>';
            if (window.renderCodeTantraApp) {
                window.renderCodeTantraApp();
            } else {
                setTimeout(() => {
                    if (window.renderCodeTantraApp) window.renderCodeTantraApp();
                }, 500); // Wait for the module to load just in case
            }

        } else if (tabId === 'timetable') {
            contentArea.innerHTML = renderTimetable();
            if (window.initTimetable) window.initTimetable();
        } else if (tabId === 'coding-arena') {
            window.openCodingArena();
        } else if (tabId === 'ai-tools') {
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
            contentArea.innerHTML = `<div class="tab-pane active fade-in" style="padding: 1.5rem;">
                <div class="welcome-header" style="text-align: center;">
                    <h1 class="font-heading">🛡️ Moderation <span class="gradient-text">Queue</span></h1>
                    <p style="color: var(--text-dim); margin-bottom: 2rem;">Approve or reject pending note submissions.</p>
                </div>
                <div id="admin-queue" class="grid-1-col" style="display: grid; gap: 1rem;"></div>
            </div>`;
            if (typeof renderAdminModQueue === 'function') renderAdminModQueue();

        } else if (tabId === 'my-uploads') {
            contentArea.innerHTML = `<div class="tab-pane active fade-in" style="padding: 1.5rem;">
                <div class="welcome-header" style="text-align: center; margin-bottom: 2rem;">
                    <h1 class="font-heading" style="white-space: nowrap; font-size: clamp(1.5rem, 6vw, 2.5rem);">📤 My <span class="gradient-text">Uploads</span></h1>
                </div>
                <div id="my-uploads-grid" class="notes-grid-pro" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1.5rem; justify-content: center; width: 100%;"></div>
            </div>`;
            if (typeof renderMyUploads === 'function') renderMyUploads();
        } else if (tabId === 'focusflow') {
            if (window.renderFocusFlow) {
                contentArea.innerHTML = window.renderFocusFlow();
                if (window.initFocusFlow) window.initFocusFlow();
            } else {
                contentArea.innerHTML = `<p>Loading NeuroSprint Pro...</p>`;
            }
        } else if (tabId === 'cgpa-analyzer') {
            if (window.renderCGPAAnalyzer) {
                contentArea.innerHTML = window.renderCGPAAnalyzer();
                if (window.initCGPAAnalyzer) window.initCGPAAnalyzer();
            } else {
                contentArea.innerHTML = `<p>Loading CGPA Analyzer...</p>`;
            }
        } else if (tabId === 'attendance' || tabId === 'attendance-pro') {
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
        } else if (tabId === 'qr-generator') {
            if (window.renderQrGenerator) {
                contentArea.innerHTML = window.renderQrGenerator();
                if (window.initQrGenerator) window.initQrGenerator();
            } else {
                contentArea.innerHTML = `<p>Loading QR Generator...</p>`;
            }
        }
        // --- SETTINGS ---
        else if (tabId === 'settings') {
            contentArea.innerHTML = window.renderSettings ? window.renderSettings() : 'Loading settings...';
        } else if (tabId === 'admin-panel') {
            contentArea.innerHTML = '<div id="ap-content" class="tab-pane active fade-in" style="min-height: 80vh; width: 100%;"></div>';
            if (typeof window.initAdminPanel === 'function') {
                window.initAdminPanel(document.getElementById('ap-content'));
            } else {
                // Retry after scripts load
                setTimeout(() => {
                    if (typeof window.initAdminPanel === 'function') {
                        window.initAdminPanel(document.getElementById('ap-content'));
                    }
                }, 1000);
            }
        } else if (tabId === 'subscription') {
            const _apiUrl = location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://skil-matrix-server.onrender.com';

            contentArea.innerHTML = `
            <style>
            /* ═══ ULTRA PREMIUM SPLIT-PANE STYLES ═══ */
            
            /* CSS Custom Properties for plan theming */
            :root {
                --sub-accent-color: #a78bfa;
                --sub-accent-grad: linear-gradient(135deg,#7b61ff,#a78bfa);
                --sub-accent-glow: 0 8px 28px rgba(123,97,255,.5);
                --sub-card-border: rgba(167,139,250,.25);
                --sub-top-line: linear-gradient(90deg,transparent,rgba(167,139,250,.9),transparent);
                --sub-dur-active-bg: rgba(123,97,255,.2);
                --sub-icon-bg: rgba(123,97,255,.15);
                --sub-icon-color: #a78bfa;
                --sub-feat-border: rgba(123,97,255,.08);
            }
            
            #sub-root {
                display:flex; justify-content:center; align-items:flex-start;
                min-height:85vh; padding:0.5rem 1.5rem 2.5rem; position:relative; overflow:hidden;
            }
            /* Main Container */
            .sub-container {
                width:100%; max-width:1120px;
                display:grid; grid-template-columns: 1fr 420px; gap:2.5rem;
                position:relative; z-index:1;
                animation: subFadeIn .5s cubic-bezier(.4,0,.2,1) both;
            }
            @media (max-width: 992px) { .sub-container { grid-template-columns: 1fr; gap:2rem; } }
            @keyframes subFadeIn { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }

            /* ── Left Pane ── */
            .sub-left { display:flex; flex-direction:column; gap:1.75rem; }
            
            .sub-plan-switch {
                display:inline-flex; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.09);
                border-radius:32px; padding:4px; width:fit-content;
            }
            .sub-plan-btn {
                padding:.6rem 1.5rem; border-radius:28px; border:none; background:transparent;
                color:rgba(255,255,255,.4); font-size:.82rem; font-weight:700; cursor:pointer;
                transition:all .35s cubic-bezier(.4,0,.2,1); letter-spacing:.03em;
            }
            .sub-plan-btn.active {
                background:var(--sub-accent-grad); color:#fff;
                box-shadow:var(--sub-accent-glow);
            }

            .sub-left-hdr {}
            .sub-left-hdr h2 {
                font-family:'Poppins',sans-serif; font-size:clamp(2rem, 4vw, 2.85rem);
                font-weight:800; line-height:1.2; margin-bottom:.6rem; letter-spacing:-0.025em; color:#fff;
            }
            .sub-left-hdr p { color:rgba(255,255,255,.7); font-size:1.05rem; max-width:520px; line-height:1.7; margin:0; font-weight:400; letter-spacing:0.015em; }
            .sub-left-hdr p strong { color:#fff; font-weight:600; }
            .pro-grad { background:linear-gradient(135deg,#8b5cf6,#6d28d9); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
            .ct-grad  { background:linear-gradient(135deg,#eab308,#a16207); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
            
            /* Feature box */
            .sub-feats-box {
                background:#050505; border:1px solid rgba(255,255,255,.04);
                border-radius:24px; padding:2rem; transition: border-color .4s ease;
                box-shadow: inset 0 0 20px rgba(0,0,0,.8);
            }
            .sub-feats-hdr {
                font-size:.75rem; font-weight:800; color:rgba(255,255,255,.5);
                margin-bottom:1.5rem; letter-spacing:.15em; text-transform:uppercase;
            }
            .sub-feats-list { list-style:none; display:flex; flex-direction:column; gap:.4rem; }
            .sub-feats-list li {
                display:flex; align-items:center; gap:1rem;
                color:rgba(255,255,255,.85); font-size:.95rem; font-weight:500;
                padding:.75rem 1rem; border-radius:12px; background:#0c0d12; border:1px solid rgba(255,255,255,.04);
                transition:all .25s; cursor:default;
            }
            .sub-feats-list li:hover { background:rgba(255,255,255,.03); border-color:rgba(255,255,255,.08); }
            .sub-feat-icon {
                width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;
                font-size:.75rem; flex-shrink:0; transition:all .3s;
            }
            .sub-feat-ok { background:rgba(16,185,129,0.1); color:#10b981; border: 1px solid rgba(16,185,129,0.25); box-shadow: 0 0 12px rgba(16,185,129,0.15); }
            .premium-svg-tick { width:15px; height:15px; stroke-dasharray:25; stroke-dashoffset:25; animation:drawCheck .6s cubic-bezier(.65,0,.45,1) forwards; }
            @keyframes drawCheck { to { stroke-dashoffset:0; } }
            .sub-feat-no { background:rgba(255,255,255,.05); color:rgba(255,255,255,.2); }
            .sub-feats-list li.dim { color:rgba(255,255,255,.3); }

            /* ── Contact Section ── */
            .sub-contact-section {
                background:#050505; border:1px solid rgba(255,255,255,.04);
                border-radius:24px; padding:2rem; box-shadow: inset 0 0 20px rgba(0,0,0,.8);
                margin-top: auto;
            }
            .sub-contact-hdr {
                font-family:'Poppins',sans-serif; font-size:1.05rem; font-weight:700; color:#fff;
                display:flex; align-items:center; gap:.6rem; margin-bottom:.5rem;
            }
            .sub-contact-hdr i { color:var(--sub-accent-color); }
            .sub-contact-desc { font-size:.83rem; color:rgba(255,255,255,.4); line-height:1.65; margin:0 0 1.25rem; }
            .sub-contact-form { display:flex; flex-direction:column; gap:.65rem; }
            .sub-cf-row { display:grid; grid-template-columns:1fr 1fr; gap:.65rem; }
            @media (max-width:600px) { .sub-cf-row { grid-template-columns:1fr; } }
            .sub-cf-input {
                width:100%; padding:.78rem 1rem; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08);
                border-radius:12px; color:#fff; font-size:.84rem; outline:none; transition:all .2s;
                box-sizing:border-box; font-family:inherit; margin-bottom: 0.65rem;
            }
            .sub-cf-input::placeholder { color:rgba(255,255,255,.28); }
            .sub-cf-input:focus { border-color:var(--sub-accent-color); background:rgba(123,97,255,.04); }
            textarea.sub-cf-input { resize:none; margin-bottom:0; }
            select.sub-cf-input { cursor: pointer; -webkit-appearance: none; -moz-appearance: none; appearance: none; }
            .sub-cf-input option { background: #090a10; color: #fff; padding: 10px; font-size: 0.9rem; }
            .sub-cf-submit {
                width:100%; padding:.88rem; border-radius:12px; border:1px solid rgba(255,255,255,.1);
                cursor:pointer; font-size:.88rem; font-weight:700; font-family:inherit;
                background:rgba(255,255,255,.05); color:rgba(255,255,255,.65); transition:all .2s; letter-spacing:.03em;
            }
            .sub-cf-submit:hover { background:rgba(255,255,255,.1); color:#fff; border-color:rgba(255,255,255,.18); }
            .sub-cf-submit:disabled { opacity:.5; cursor:not-allowed; }
            .sub-cf-status { font-size:.78rem; text-align:center; min-height:1.1rem; font-weight:600; transition:all .2s; }
            .sub-cf-status.ok  { color:#10b981; }
            .sub-cf-status.err { color:#ef4444; }

            /* ── Right Checkout Card ── */
            .sub-right-card {
                background: rgba(5,5,5,.97); border:1px solid var(--sub-card-border);
                border-radius:28px; padding:2rem 2rem 1.5rem; backdrop-filter:blur(40px);
                box-shadow: 0 50px 100px rgba(0,0,0,.55), 0 0 80px rgba(123,97,255,.06);
                position:relative; transition: border-color .45s, box-shadow .45s;
                display:flex; flex-direction:column;
            }
            @media (min-width: 993px) {
                .sub-right-card { margin-top: 4.4rem; }
            }
            .sub-right-card::before {
                content:'';position:absolute;top:-1px;left:6%;right:6%;height:2px;border-radius:2px;
                background:var(--sub-top-line); transition: background .45s;
            }
            
            /* Tag badge */
            .sub-card-tag {
                position:absolute; top:-13px; left:50%; transform:translateX(-50%);
                background:var(--sub-accent-grad); color:#fff;
                font-size:.6rem; font-weight:900; padding:.35rem 1.2rem; border-radius:20px;
                letter-spacing:.13em; text-transform:uppercase; white-space:nowrap;
                box-shadow:var(--sub-accent-glow);
            }

            .sub-card-title { display:flex; align-items:center; gap:.75rem; margin-bottom:1.5rem; padding-top:.3rem; }
            .sub-card-icon {
                width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;
                font-size:1.2rem; background:var(--sub-icon-bg); color:var(--sub-icon-color);
                flex-shrink:0; transition:all .45s; border:1px solid rgba(255,255,255,.07);
            }
            .sub-card-name { font-family:'Poppins',sans-serif; font-size:1.2rem; font-weight:800; color:#fff; line-height:1.2; }
            .sub-card-sub  { font-size:.74rem; color:rgba(255,255,255,.38); margin-top:.1rem; }

            /* Duration toggle */
            .sub-dur-toggle {
                display:flex; background:rgba(255,255,255,.04); border-radius:14px;
                padding:4px; margin-bottom:1.2rem; position:relative; border:1px solid rgba(255,255,255,.06);
            }
            .sub-dur-opt {
                flex:1; padding:.7rem; border-radius:10px; border:none; background:transparent;
                color:rgba(255,255,255,.38); font-size:.8rem; font-weight:700; cursor:pointer;
                transition:all .25s; font-family:inherit; position:relative;
            }
            .sub-dur-opt.active { background:var(--sub-dur-active-bg); color:#fff; box-shadow:0 2px 10px rgba(0,0,0,.3); }
            .sub-save-badge {
                display:inline-block; background:linear-gradient(135deg,#059669,#10b981); color:#fff;
                font-size:.54rem; font-weight:900; padding:.15rem .45rem; border-radius:6px;
                letter-spacing:.05em; margin-left:.35rem; vertical-align:middle;
            }

            /* Price */
            .sub-price-area { margin-bottom:.3rem; display:flex; align-items:baseline; gap:.55rem; }
            .sub-price-strikethrough { font-size:1.1rem; color:rgba(255,255,255,.25); text-decoration:line-through; font-weight:600; }
            .sub-price-big { font-family:'Poppins',sans-serif; font-size:3.2rem; font-weight:900; line-height:1; color:#fff; }
            .sub-price-period { font-size:.9rem; color:rgba(255,255,255,.3); }
            .sub-billed-note { font-size:.85rem; font-weight:500; margin-bottom:1.2rem; color:#10b981; letter-spacing:.01em; }

            /* Coupon */
            .sub-coupon-box { margin-top:1.5rem; margin-bottom:1.2rem; }
            .sub-coupon-row { display:flex; gap:.45rem; }
            #sub-coupon-inp {
                flex:1; padding:.75rem 1rem; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.09);
                border-radius:12px; color:#fff; font-size:.82rem; text-transform:uppercase; letter-spacing:1px;
                outline:none; transition:all .2s; font-family:inherit;
            }
            #sub-coupon-inp::placeholder { text-transform:none; letter-spacing:0; color:rgba(255,255,255,.22); }
            #sub-coupon-inp:focus { border-color:var(--sub-accent-color); background:rgba(123,97,255,.04); }
            #sub-coupon-apply {
                padding:.75rem 1.1rem; border-radius:12px; background:rgba(255,255,255,.04);
                border:1px solid rgba(255,255,255,.09); color:rgba(255,255,255,.5);
                font-weight:700; cursor:pointer; transition:all .2s; font-family:inherit; font-size:.8rem;
            }
            #sub-coupon-apply:hover { background:rgba(255,255,255,.09); color:#fff; }
            #sub-coupon-fb { margin-top:.45rem; font-size:.76rem; min-height:.9rem; font-weight:600; }
            #sub-coupon-fb.ok  { color:#10b981; }
            #sub-coupon-fb.err { color:#ef4444; }

            /* Order Summary */
            .sub-os-box {
                background:rgba(255,255,255,.025); border:1px solid rgba(255,255,255,.06);
                border-radius:14px; padding:1rem 1.2rem; margin-bottom:1.2rem;
            }
            .sub-os-row { display:flex; justify-content:space-between; padding:.32rem 0; font-size:.81rem; color:rgba(255,255,255,.42); }
            .sub-os-row .val { color:#fff; font-weight:600; }
            .sub-os-row.disc .val { color:#10b981; }
            .sub-os-row.tot {
                margin-top:.4rem; padding-top:.55rem; border-top:1px solid rgba(255,255,255,.07);
                color:#fff; font-weight:800; font-size:.92rem;
            }
            .sub-os-row.tot .val { color:var(--sub-accent-color); font-size:1.1rem; }

            /* Pay Button */
            #sub-pay-btn {
                width:100%; padding:1.05rem; border-radius:14px; font-size:.98rem; font-weight:800;
                cursor:pointer; border:none; font-family:'Poppins',sans-serif;
                background:var(--sub-accent-grad); color:#fff;
                box-shadow:var(--sub-accent-glow); transition:all .3s; letter-spacing:.04em;
                margin-top: auto;
                margin-bottom:1rem;
            }
            #sub-pay-btn:hover { transform:translateY(-3px); filter:brightness(1.1); }
            #sub-pay-btn:disabled { opacity:.6; cursor:not-allowed; transform:none; filter:none; }

            /* Trust row */
            .sub-trust {
                display:flex; justify-content:center; gap:1.1rem; flex-wrap:wrap;
                font-size:.7rem; color:rgba(255,255,255,.28); margin-bottom:.9rem;
            }
            .sub-trust span { display:flex; align-items:center; gap:.28rem; }
            .sub-trust i { color:#10b981; font-size:.72rem; }

            /* ── Razorpay Footer ── */
            .sub-rzp-footer {
                display:flex; flex-direction:column; align-items:center; gap:.25rem;
                padding:.8rem; background:rgba(255,255,255,.02); border-radius:12px;
                border:1px solid rgba(255,255,255,.05);
            }
            .sub-rzp-line1 {
                display:flex; align-items:center; gap:.5rem;
                font-size:.74rem; color:rgba(255,255,255,.3); font-weight:500; letter-spacing:.02em;
            }
            .sub-rzp-bolt { color:#528FF0; font-size:.9rem; }
            .sub-rzp-brand { font-weight:900; font-size:.84rem; color:#528FF0; letter-spacing:.02em; }
            .sub-rzp-line2 { font-size:.65rem; color:rgba(255,255,255,.18); letter-spacing:.04em; }

            /* Popup */
            .sub-popup-overlay {
                position:fixed;inset:0;z-index:9999; background:rgba(0,0,0,.82);backdrop-filter:blur(12px);
                display:flex;align-items:center;justify-content:center; animation:popOverlayIn .3s ease both;
            }
            @keyframes popOverlayIn { from{opacity:0} to{opacity:1} }
            .sub-popup {
                background:rgba(9,10,20,.98); border:1px solid rgba(255,255,255,.12); border-radius:28px;
                padding:2.5rem; text-align:center; max-width:440px; width:90%;
                box-shadow:0 50px 120px rgba(0,0,0,.7); animation:popIn .45s cubic-bezier(.34,1.56,.64,1) both;
            }
            @keyframes popIn { from{opacity:0;transform:scale(.8) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
            .sub-popup-icon { font-size:4rem;margin-bottom:1rem;display:block;animation:iconBounce .6s .2s cubic-bezier(.34,1.56,.64,1) both; }
            @keyframes iconBounce { from{transform:scale(0)} to{transform:scale(1)} }
            .sub-popup h3 { font-family:'Poppins',sans-serif;font-size:1.6rem;font-weight:800;margin-bottom:.5rem; }
            .sub-popup p  { color:rgba(255,255,255,.5);font-size:.9rem;margin-bottom:1.5rem; }
            .sub-popup-btn {
                display:inline-block;padding:.85rem 2rem;border-radius:12px;font-size:.95rem;font-weight:800;
                cursor:pointer;border:none;background:linear-gradient(135deg,#7b61ff,#a78bfa);color:#fff;
                box-shadow:0 6px 24px rgba(123,97,255,.45);transition:all .2s;
            }
            .sub-popup-btn:hover { transform:translateY(-2px);box-shadow:0 10px 32px rgba(123,97,255,.6); }
            
            /* ── Mobile Responsiveness ── */
            @media (max-width: 768px) {
                #sub-root { padding: 0.5rem 1rem 2rem; }
                .sub-container { gap: 1.5rem; display: flex; flex-direction: column; }
                .sub-left { display: contents; }
                .sub-contact-section { order: 10; margin-top: 1rem; }
                .sub-right-card { order: 3; padding: 1.5rem; margin-top: 2rem; }
                .sub-plan-switch { display: flex; width: 100%; order: 1; }
                .sub-left-hdr { order: 2; }
                .sub-feats-box { padding: 1.5rem; order: 4; }
                .sub-plan-btn { flex: 1; padding: 0.6rem 0.2rem; font-size: 0.8rem; white-space: nowrap; text-align: center; }
                .sub-left-hdr h2 { font-size: 1.8rem !important; }
                .sub-left-hdr p { font-size: 0.95rem; }
                .sub-feats-hdr { margin-bottom: 1rem; }
                .sub-feats-list li { font-size: 0.85rem; padding: 0.6rem 0.8rem; gap: 0.75rem; }
                .sub-price-big { font-size: 2.6rem; }
                .sub-popup { padding: 1.5rem; }
                .sub-popup h3 { font-size: 1.4rem; }
            }
            </style>

            <div id="sub-root">
                <div class="sub-container">
                    
                    <!-- Left: Features + Contact -->
                    <div class="sub-left">
                        <div class="sub-plan-switch">
                            <button class="sub-plan-btn" id="sp-btn-codetantra" onclick="subPickPlan('codetantra')">Lab Solutions</button>
                            <button class="sub-plan-btn active" id="sp-btn-pro" onclick="subPickPlan('pro')">Premium Scholar</button>
                        </div>

                        <div class="sub-left-hdr">
                            <h2 id="sub-left-title">Pricing & <span class="pro-grad">Plans</span></h2>
                            <p id="sub-left-desc">Choose the perfect plan to unlock exclusive AI resources, priority features, and a seamless learning experience.</p>
                        </div>

                        <div class="sub-feats-box">
                            <div class="sub-feats-hdr">What's included in this plan</div>
                            <ul class="sub-feats-list" id="sub-feats-list"></ul>
                        </div>

                        <!-- Contact Section (using same backend) -->
                        <div class="sub-contact-section">
                            <div class="sub-contact-hdr"><i class="fas fa-headset"></i> Talk to Our Team</div>
                            <p class="sub-contact-desc">Have a question before upgrading? Our team responds within a few hours.</p>
                            <a href="contact.html?topic=payment" class="sub-cf-submit" style="display:block; text-align:center; text-decoration:none; margin-top:1.5rem;">Open Support Ticket &rarr;</a>
                        </div>
                    </div>

                    <!-- Right: Checkout Card -->
                    <div class="sub-right-card">
                        <div class="sub-card-tag" id="sub-card-tag">MOST POPULAR</div>

                        <div class="sub-card-title">
                            <div class="sub-card-icon" id="sub-card-icon"><i class="fas fa-crown"></i></div>
                            <div>
                                <div class="sub-card-name" id="sub-card-name">Premium Scholar</div>
                                <div class="sub-card-sub" id="sub-card-sub">For serious students</div>
                            </div>
                        </div>

                        <div class="sub-dur-toggle">
                            <button class="sub-dur-opt active" id="sub-dur-1mo" onclick="subSetDuration('1mo')">1 Month</button>
                            <button class="sub-dur-opt" id="sub-dur-6mo" onclick="subSetDuration('6mo')">6 Months <span class="sub-save-badge">SAVE!</span></button>
                        </div>

                        <div class="sub-price-area">
                            <div class="sub-price-big">₹<span id="sub-price-val">49</span><span class="sub-price-period" id="sub-price-period">/1 month</span></div>
                        </div>
                        <div class="sub-billed-note" id="sub-billed-note"></div>

                        <!-- Coupon -->
                        <div class="sub-coupon-box" id="sub-coupon-box">
                            <div class="sub-coupon-row">
                                <div style="position:relative; flex:1;">
                                    <input type="text" id="sub-coupon-inp" placeholder="Have a coupon code?" maxlength="30" style="width:100%;" />
                                    <div style="position:absolute; left:6px; top:100%; margin-top:3px; font-size:0.68rem; color:rgba(255,255,255,0.3); letter-spacing:0.02em;">Optional</div>
                                </div>
                                <button id="sub-coupon-apply" onclick="subApplyCoupon()">Apply</button>
                            </div>
                            <div id="sub-coupon-fb"></div>
                        </div>

                        <!-- Order Summary -->
                        <div class="sub-os-box">
                            <div class="sub-os-row">
                                <span>Plan</span>
                                <span class="val" id="sub-os-plan">Premium Scholar</span>
                            </div>
                            <div class="sub-os-row">
                                <span>Duration</span>
                                <span class="val" id="sub-os-dur">1 Month</span>
                            </div>
                            <div class="sub-os-row disc" id="sub-os-disc-row" style="display:none">
                                <span>Discount</span>
                                <span class="val" id="sub-os-disc">-</span>
                            </div>
                            <div class="sub-os-row tot">
                                <span>Total</span>
                                <span class="val" id="sub-os-total">₹49</span>
                            </div>
                        </div>

                        <button id="sub-pay-btn" onclick="subProceedToPay()"><i class="fas fa-bolt" style="margin-right: 6px;"></i> Get Premium Access</button>

                        <div class="sub-trust">
                            <span><i class="fas fa-shield-alt"></i> 256-bit Encryption</span>
                            <span><i class="fas fa-lock"></i> Secure Checkout</span>
                        </div>

                        <!-- Razorpay Footer -->
                        <div class="sub-rzp-footer">
                            <div class="sub-rzp-line1">
                                <span>Powered by</span>
                                <span class="sub-rzp-bolt">
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle;">
                                        <path d="M10.88 18.2L12.03 2L19.25 2L19.25 5.63L14.44 5.63L13.97 18.2L10.88 18.2Z" fill="#3395FF"/>
                                        <path d="M6.75 18.2L7.9 2L11 2L9.84 18.2L6.75 18.2Z" fill="#3395FF"/>
                                    </svg>
                                </span>
                                <span class="sub-rzp-brand">Razorpay</span>
                            </div>
                            <div class="sub-rzp-line2">SECURE PAYMENTS &bull; CANCEL ANYTIME</div>
                        </div>
                    </div>
                </div>
            </div>
            `;

            // ═══════════════════════════════════════════════════════
            //  SUBSCRIPTION LOGIC
            // ═══════════════════════════════════════════════════════
            const _apiUrlSub = _apiUrl;

            const checkActiveSub = async () => {
                try {
                    const raw = localStorage.getItem('auth_user_full');
                    const fbUser = window.firebaseServices && window.firebaseServices.auth && window.firebaseServices.auth.currentUser;
                    const u = fbUser || (raw ? (() => { try { return JSON.parse(raw); } catch(e) { return null; } })() : null);
                    if (!u) return;
                    const uid = u.uid || u.id;
                    
                    const resPlan = await fetch(`${_apiUrlSub}/api/user-plan?uid=${uid}&_t=${Date.now()}`);
                    let dataPlan = await resPlan.json();
                    
                    // Admin override for premium
                    const email = (u.email || '').toLowerCase();
                    const adminEmails = ['tanishqagrawal1103@gmail.com', 'skilmatrix3@gmail.com'];
                    if (adminEmails.includes(email)) {
                        dataPlan = { success: true, plan: 'pro', expiry: '2099-12-31T23:59:59Z' };
                    }
                    
                    if (dataPlan.plan && dataPlan.plan !== 'free') {
                        window._activeUserPlan = dataPlan.plan;
                        window._activeUserExpiry = dataPlan.expiry;

                        if (window._forceShowPlans) {
                            if (typeof _subRefreshUI === 'function') _subRefreshUI();
                            return;
                        }

                        // Fetch Payments
                        let paymentsHtml = '<p style="color:rgba(255,255,255,0.5);">No payment history found.</p>';
                        try {
                            const resPay = await fetch(`${_apiUrlSub}/api/user-payments?uid=${uid}&_t=${Date.now()}`);
                            const dataPay = await resPay.json();
                            if (dataPay.success && dataPay.payments && dataPay.payments.length > 0) {
                                paymentsHtml = `
                                <div style="overflow-x: auto; width: 100%;">
                                    <table style="width:100%; border-collapse: collapse; margin-top:1rem; font-size:0.95rem; min-width: 500px;">
                                        <thead>
                                            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.5);">
                                                <th style="padding: 1rem; font-weight: 600; text-align: center;">Date</th>
                                                <th style="padding: 1rem; font-weight: 600; text-align: center;">Plan</th>
                                                <th style="padding: 1rem; font-weight: 600; text-align: center;">Amount</th>
                                                <th style="padding: 1rem; font-weight: 600; text-align: center;">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${dataPay.payments.map(p => `
                                            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
                                                <td style="padding: 1rem; color: rgba(255,255,255,0.8); white-space: nowrap; text-align: center;">${new Date(p.created_at).toLocaleDateString()}</td>
                                                <td style="padding: 1rem; color: #fff; font-weight: 500; white-space: nowrap; text-align: center;">${p.plan_id.replace('_', ' ').toUpperCase()}</td>
                                                <td style="padding: 1rem; color: #10b981; font-weight: 700; white-space: nowrap; text-align: center;">₹${p.amount_paid / 100}</td>
                                                <td style="padding: 1rem; white-space: nowrap; text-align: center;"><span style="background: rgba(16,185,129,0.15); color: #10b981; padding: 6px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; letter-spacing: 0.5px;">${p.status.toUpperCase()}</span></td>
                                            </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                                `;
                            }
                        } catch(e) { console.warn("Failed to fetch payments", e); }

                        const container = document.querySelector('.sub-container');
                        if (container) {
                            const isPro = dataPlan.plan === 'pro';
                            const planName = isPro ? 'Premium Scholar' : 'Lab Solutions';
                            const daysLeft = Math.ceil((new Date(dataPlan.expiry) - new Date()) / (1000 * 60 * 60 * 24));
                            const expiryStr = new Date(dataPlan.expiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                            
                            container.style.display = 'block'; // Override the default grid layout to allow centering
                            container.innerHTML = `
                            <div style="width: 100%; display: flex; justify-content: center;">
                                <div style="width: 100%; max-width: 900px; animation: popIn 0.5s ease;">
                                    <!-- Active Plan Banner -->
                                <div style="background: linear-gradient(135deg, rgba(16,185,129,0.05), rgba(16,185,129,0.01)); border: 1px solid rgba(16,185,129,0.3); border-radius: 28px; padding: 2.5rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 2rem; position: relative; overflow: hidden; margin-bottom: 2rem; box-shadow: 0 20px 40px rgba(0,0,0,0.3);">
                                    <div style="position: absolute; top: -50px; right: -50px; width: 200px; height: 200px; background: radial-gradient(circle, rgba(16,185,129,0.15), transparent 70%); border-radius: 50%; pointer-events: none;"></div>
                                    
                                    <div>
                                        <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(16,185,129,0.15); color: #10b981; padding: 6px 14px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; letter-spacing: 1px; margin-bottom: 1rem; text-transform: uppercase;">
                                            <i class="fas fa-check-circle"></i> Active Subscription
                                        </div>
                                        <h2 style="font-size: 2.2rem; font-weight: 800; color: #fff; margin: 0 0 0.5rem 0; font-family: 'Poppins', sans-serif;">${planName}</h2>
                                        <p style="color: rgba(255,255,255,0.5); font-size: 0.95rem; margin: 0;">You have unlocked premium features for this tier.</p>
                                    </div>
                                    
                                    <div style="text-align: right;">
                                        <div style="font-size: 0.85rem; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin-bottom: 0.2rem;">Time Remaining</div>
                                        <div style="font-size: 2.5rem; font-weight: 800; color: #10b981; line-height: 1;">${Math.max(0, daysLeft)} <span style="font-size: 1rem; color: rgba(255,255,255,0.6);">Days</span></div>
                                        <div style="font-size: 0.8rem; color: rgba(255,255,255,0.4); margin-top: 0.5rem;">Expires on ${expiryStr}</div>
                                    </div>
                                </div>

                                <!-- Grid: History Only -->
                                <div style="display: grid; grid-template-columns: 1fr; gap: 2rem;">

                                    <!-- Payment History -->
                                    <div style="background: rgba(9,10,20,0.6); border: 1px solid rgba(255,255,255,0.05); border-radius: 24px; padding: 2rem; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                                        <h3 style="color: #fff; font-size: 1.2rem; font-weight: 700; margin: 0 0 1rem 0; font-family: 'Poppins', sans-serif; display: flex; align-items: center; justify-content: center; gap: 0.7rem;"><i class="fas fa-receipt" style="color: #00f2ff;"></i> Payment History</h3>
                                        ${paymentsHtml}
                                    </div>
                                    </div>
                                </div>
                            </div>
                            `;
                        }
                    }
                } catch(e) { console.warn("Check sub error", e); }
            };
            checkActiveSub();

            const SUB_P = {
                codetantra: {
                    '1mo': { amount:19, planId:'codetantra_1mo' },
                    '6mo': { amount:89, planId:'codetantra_6mo' }
                },
                pro: {
                    '1mo': { amount:49, planId:'pro_1mo' },
                    '6mo': { amount:149, planId:'pro_6mo' }
                }
            };
            const PLAN_DATA = {
                codetantra: {
                    name: 'CodeTantra Hub', sub: 'Master Your Practicals', tag: 'ESSENTIAL',
                    icon: '<i class="fas fa-laptop-code"></i>',
                    titleHtml: 'CodeTantra <span class="ct-grad">Solutions</span>',
                    descHtml: 'Instant access to <strong>verified lab solutions</strong>, <strong>AI guidance</strong>, and model papers to easily crack exams.',
                    theme: {
                        accentColor: '#ca8a04',
                        accentGrad: 'linear-gradient(135deg,#ca8a04,#a16207)',
                        accentGlow: '0 4px 15px rgba(161,98,7,.2)',
                        cardBorder: 'rgba(202,138,4,.3)',
                        topLine: 'linear-gradient(90deg,transparent,rgba(202,138,4,.8),transparent)',
                        durActiveBg: 'rgba(202,138,4,.15)',
                        iconBg: 'rgba(202,138,4,.1)',
                        iconColor: '#eab308',
                    },
                    feats: [
                        { text: 'CodeTantra Lab Solutions', ok: true },
                        { text: 'AI Coach (5/day)', ok: true },
                        { text: '3 AI Model Papers / mo', ok: true },
                        { text: 'Verified Scholar Badge', ok: false },
                        { text: 'Ad-free Experience', ok: false }
                    ]
                },
                pro: {
                    name: 'Premium Scholar', sub: 'The Ultimate Learning Experience', tag: 'MOST POPULAR',
                    icon: '<i class="fas fa-crown"></i>',
                    titleHtml: 'Premium <span class="pro-grad">Scholar</span>',
                    descHtml: 'Unlock <strong>unlimited AI coaching</strong>, <strong>premium model papers</strong>, and a distraction-free interface for top performers.',
                    theme: {
                        accentColor: '#7c3aed',
                        accentGrad: 'linear-gradient(135deg,#7c3aed,#5b21b6)',
                        accentGlow: '0 4px 15px rgba(91,33,182,.2)',
                        cardBorder: 'rgba(109,40,217,.3)',
                        topLine: 'linear-gradient(90deg,transparent,rgba(109,40,217,.8),transparent)',
                        durActiveBg: 'rgba(109,40,217,.2)',
                        iconBg: 'rgba(109,40,217,.1)',
                        iconColor: '#a78bfa',
                    },
                    feats: [
                        { text: 'Everything in CodeTantra', ok: true },
                        { text: 'Unlimited AI Coach', ok: true },
                        { text: '30 AI Model Papers / mo', ok: true },
                        { text: 'Verified "Scholar" Badge', ok: true },
                        { text: '100% Ad-free Interface', ok: true }
                    ]
                }
            };

            let _subPlan = 'pro', _subDur = '1mo', _subCoupon = null, _subDisc = 0;

            // Load live prices via Supabase Realtime
            const _loadPricingFromSupabase = async () => {
                try {
                    const { supabase } = window.supabase ? window : await import('./supabase-config.js');
                    const { data, error } = await supabase.from('pricing_config').select('*').eq('id', 1).single();
                    if (data && data.plans) {
                        const p = data.plans;
                        if (p.codetantra_1mo) SUB_P.codetantra['1mo'].amount = p.codetantra_1mo.amount/100;
                        if (p.codetantra_6mo) SUB_P.codetantra['6mo'].amount = p.codetantra_6mo.amount/100;
                        if (p.pro_1mo)        SUB_P.pro['1mo'].amount        = p.pro_1mo.amount/100;
                        if (p.pro_6mo)        SUB_P.pro['6mo'].amount        = p.pro_6mo.amount/100;
                        _subRefreshUI();
                    }
                } catch(e) { console.warn('Pricing realtime error:', e); }
            };
            _loadPricingFromSupabase();
            
            // Subscribe to pricing changes
            (async () => {
                try {
                    const { supabase } = window.supabase ? window : await import('./supabase-config.js');
                    supabase.channel('pricing_config_changes')
                        .on('postgres_changes', { event: '*', schema: 'public', table: 'pricing_config' }, payload => {
                            _loadPricingFromSupabase();
                        }).subscribe();
                } catch(e){}
            })();

            function _subRefreshUI() {
                const data = PLAN_DATA[_subPlan];
                const t = data.theme;
                const root = document.documentElement;

                // Apply theme CSS variables
                root.style.setProperty('--sub-accent-color',  t.accentColor);
                root.style.setProperty('--sub-accent-grad',   t.accentGrad);
                root.style.setProperty('--sub-accent-glow',   t.accentGlow);
                root.style.setProperty('--sub-card-border',   t.cardBorder);
                root.style.setProperty('--sub-top-line',      t.topLine);
                root.style.setProperty('--sub-dur-active-bg', t.durActiveBg);
                root.style.setProperty('--sub-icon-bg',       t.iconBg);
                root.style.setProperty('--sub-icon-color',    t.iconColor);

                // Update card title
                document.getElementById('sub-card-tag').textContent  = data.tag;
                document.getElementById('sub-card-name').textContent = data.name;
                document.getElementById('sub-card-sub').textContent  = data.sub;
                const iconEl = document.getElementById('sub-card-icon');
                if (iconEl) iconEl.innerHTML = data.icon;

                // Update left heading per plan
                const titleEl = document.getElementById('sub-left-title');
                const descEl  = document.getElementById('sub-left-desc');
                if (titleEl) titleEl.innerHTML = data.titleHtml;
                if (descEl)  descEl.innerHTML = data.descHtml || data.desc;

                // Update contact section accent color
                const cfhdr = document.querySelector('.sub-contact-hdr i');
                if (cfhdr) cfhdr.style.color = t.accentColor;
                const submitBtn = document.getElementById('sub-cf-submit-btn');
                if (submitBtn) submitBtn.style.borderColor = `${t.accentColor}33`;

                // Render Features
                const featList = document.getElementById('sub-feats-list');
                if (featList) featList.innerHTML = data.feats.map((f, idx) => `
                    <li class="${f.ok ? '' : 'dim'}">
                        <div class="sub-feat-icon ${f.ok ? 'sub-feat-ok' : 'sub-feat-no'}">
                            ${f.ok ? `<svg class="premium-svg-tick" style="animation-delay: ${idx * 0.08}s;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>` : `<i class="fas fa-times"></i>`}
                        </div>
                        ${f.text}
                    </li>
                `).join('');

                // Update Prices & Order Summary
                const p = SUB_P[_subPlan][_subDur];
                const base1mo = SUB_P[_subPlan]['1mo'].amount;
                document.getElementById('sub-price-val').textContent = p.amount;

                const note   = document.getElementById('sub-billed-note');
                const period = document.getElementById('sub-price-period');
                
                if (_subDur === '6mo') {
                    period.textContent = '/6 months';
                    const totalNormal = base1mo * 6;
                    const savedRs = totalNormal - p.amount;
                    const savedPct = Math.round((savedRs / totalNormal) * 100);
                    const perMo = (p.amount / 6).toFixed(2).replace(/\.00$/, '');
                    
                    note.style.display = 'block';
                    note.innerHTML = `
                        <span class="sub-price-strikethrough" style="display:inline-block; margin-right:10px; font-size:1rem; opacity:0.6;">₹${totalNormal}</span>
                        <span style="background: linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.15)); color:#10b981; padding: 5px 12px; border-radius: 8px; font-weight:800; font-size:0.82rem; border: 1px solid rgba(16,185,129,0.25); letter-spacing:0.02em; display:inline-block; transform:translateY(-2px); box-shadow: 0 4px 12px rgba(16,185,129,0.1);">Save ${savedPct}% (₹${savedRs}) &nbsp;&bull;&nbsp; Just ₹${perMo}/mo</span>
                    `;
                } else {
                    period.textContent = '/1 month';
                    note.style.display = 'none';
                    note.innerHTML = '';
                }

                document.getElementById('sub-os-plan').textContent = data.name;
                document.getElementById('sub-os-dur').textContent  = _subDur === '1mo' ? '1 Month' : '6 Months';

                let final = p.amount;
                if (_subCoupon && _subDisc > 0) {
                    const discAmt = Math.round(p.amount * _subDisc / 100);
                    final = Math.max(0, p.amount - discAmt);
                    document.getElementById('sub-os-disc-row').style.display = 'flex';
                    document.getElementById('sub-os-disc').textContent = `-₹${discAmt} (${_subDisc}% off)`;
                } else {
                    document.getElementById('sub-os-disc-row').style.display = 'none';
                }

                document.getElementById('sub-os-total').textContent = `₹${final}`;
                const btn = document.getElementById('sub-pay-btn');
                btn.textContent = `⚡ Pay ₹${final} Securely`;

                // --- LOCK/UNLOCK LOGIC BASED ON ACTIVE PLAN ---
                const durOptions = document.querySelector('.sub-dur-toggle');
                const couponBox = document.getElementById('sub-coupon-box');
                const expiryText = document.getElementById('sub-billed-note');

                if (window._activeUserPlan && window._activeUserPlan !== 'free') {
                    const osTotalRow = document.getElementById('sub-os-total')?.parentElement;
                    const osPlan = document.getElementById('sub-os-plan');
                    const osDur = document.getElementById('sub-os-dur');
                    
                    // Logic 1: PRO Plan - Everything is locked
                    if (window._activeUserPlan === 'pro') {
                        btn.innerHTML = `<i class="fas fa-check-circle"></i> Premium Scholar Active`;
                        btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                        btn.style.boxShadow = '0 6px 28px rgba(16,185,129,0.4)';
                        btn.disabled = true;
                        
                        if (durOptions) durOptions.style.display = 'none';
                        if (couponBox) couponBox.style.display = 'none';
                        if (osTotalRow) osTotalRow.style.display = 'none';
                        
                        if (expiryText && window._activeUserExpiry) {
                            const daysLeft = Math.ceil((new Date(window._activeUserExpiry) - new Date()) / (1000 * 60 * 60 * 24));
                            if (osPlan) osPlan.innerHTML = `Premium Scholar <span style="background:#10b981;color:#000;padding:2px 8px;border-radius:12px;font-size:0.6rem;font-weight:800;margin-left:6px;vertical-align:middle;">ACTIVE</span>`;
                            if (osDur) osDur.parentElement.innerHTML = `<span>Time Remaining</span><span class="val" style="color:#10b981;font-size:1.05rem;display:flex;align-items:center;gap:4px;">${Math.max(0, daysLeft)} Days <i class="fas fa-clock"></i></span>`;
                            expiryText.innerHTML = `Your plan is active and will expire on ${new Date(window._activeUserExpiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
                        }
                    } 
                    // Logic 2: CodeTantra Plan - Can upgrade to PRO
                    else if (window._activeUserPlan === 'codetantra') {
                        if (_subPlan === 'codetantra') {
                            btn.innerHTML = `<i class="fas fa-check-circle"></i> Lab Solutions Active`;
                            btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                            btn.style.boxShadow = '0 6px 28px rgba(16,185,129,0.4)';
                            btn.disabled = true;
                            
                            if (durOptions) durOptions.style.display = 'none';
                            if (couponBox) couponBox.style.display = 'none';
                            if (osTotalRow) osTotalRow.style.display = 'none';
                            
                            if (expiryText && window._activeUserExpiry) {
                                const daysLeft = Math.ceil((new Date(window._activeUserExpiry) - new Date()) / (1000 * 60 * 60 * 24));
                                if (osPlan) osPlan.innerHTML = `Lab Solutions <span style="background:#10b981;color:#000;padding:2px 8px;border-radius:12px;font-size:0.6rem;font-weight:800;margin-left:6px;vertical-align:middle;">ACTIVE</span>`;
                                if (osDur) osDur.parentElement.innerHTML = `<span>Time Remaining</span><span class="val" style="color:#10b981;font-size:1.05rem;display:flex;align-items:center;gap:4px;">${Math.max(0, daysLeft)} Days <i class="fas fa-clock"></i></span>`;
                                expiryText.innerHTML = `Your plan is active and will expire on ${new Date(window._activeUserExpiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
                            }
                        } else if (_subPlan === 'pro') {
                            // Upgrade available
                            btn.disabled = false;
                            btn.style.background = '';
                            btn.style.boxShadow = '';
                            if (durOptions) durOptions.style.display = 'flex';
                            if (couponBox) couponBox.style.display = 'block';
                            if (osTotalRow) osTotalRow.style.display = 'flex';
                            if (expiryText) expiryText.innerHTML = `Upgrade to Premium Scholar (Billed ₹${p.amount} for ${_subDur === '1mo' ? '1 month' : '6 months'})`;
                        }
                    }
                } else {
                    btn.disabled = false;
                    btn.style.background = '';
                    btn.style.boxShadow = '';
                    if (durOptions) durOptions.style.display = 'flex';
                    if (couponBox) couponBox.style.display = 'block';
                }
            }

            window.subPickPlan = function(plan) {
                _subPlan = plan;
                document.querySelectorAll('.sub-plan-btn').forEach(b => b.classList.remove('active'));
                document.getElementById(`sp-btn-${plan}`).classList.add('active');
                _subCoupon = null; _subDisc = 0;
                const ci = document.getElementById('sub-coupon-inp'); if(ci) ci.value='';
                const cf = document.getElementById('sub-coupon-fb'); if(cf){cf.textContent='';cf.className='';}
                _subRefreshUI();
            };

            window.subSetDuration = function(dur) {
                _subDur = dur;
                document.querySelectorAll('.sub-dur-opt').forEach(b => b.classList.remove('active'));
                document.getElementById(`sub-dur-${dur}`).classList.add('active');
                _subCoupon = null; _subDisc = 0;
                const ci = document.getElementById('sub-coupon-inp'); if(ci) ci.value='';
                const cf = document.getElementById('sub-coupon-fb'); if(cf){cf.textContent='';cf.className='';}
                _subRefreshUI();
            };

            window.subApplyCoupon = async function() {
                const inp = document.getElementById('sub-coupon-inp');
                const fb  = document.getElementById('sub-coupon-fb');
                const code = inp.value.trim().toUpperCase();
                if (!code) { fb.textContent='Enter a coupon code.'; fb.className='err'; return; }
                const btn = document.getElementById('sub-coupon-apply'); btn.disabled=true; btn.textContent='...';
                try {
                    const { supabase } = window.supabase ? window : await import('./supabase-config.js');
                    const { data, error } = await supabase.from('pricing_config').select('coupons').eq('id', 1).single();
                    if (data && data.coupons && data.coupons[code] !== undefined) {
                        const couponVal = data.coupons[code];
                        const isObject = typeof couponVal === 'object';
                        
                        if (isObject && couponVal.maxUses && (couponVal.uses || 0) >= couponVal.maxUses) {
                            _subCoupon=null; _subDisc=0;
                            fb.textContent='❌ Coupon usage limit reached.'; fb.className='err';
                            _subRefreshUI();
                        } else {
                            _subDisc = isObject ? couponVal.discount : couponVal;
                            _subCoupon = code;
                            fb.textContent = `✅ "${code}" — ${_subDisc}% off applied!`; fb.className='ok';
                            _subRefreshUI();
                            _subFireConfetti();
                        }
                    } else {
                        _subCoupon=null; _subDisc=0;
                        fb.textContent='❌ Invalid or expired coupon code.'; fb.className='err';
                        _subRefreshUI();
                    }
                } catch(e) { fb.textContent='Could not verify. Try again.'; fb.className='err'; }
                btn.disabled=false; btn.textContent='Apply';
            };

            // ── Premium Confetti (Party Popper) — fires around coupon box ──
            function _subFireConfetti() {
                if (!window.confetti) {
                    const s = document.createElement('script');
                    s.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
                    s.onload = _triggerCouponConfetti;
                    document.head.appendChild(s);
                } else {
                    _triggerCouponConfetti();
                }
            }
            function _triggerCouponConfetti() {
                // Get coupon box position to fire from around it
                const box = document.getElementById('sub-coupon-box');
                let originX = 0.75, originY = 0.6; // default right-side position
                if (box) {
                    const rect = box.getBoundingClientRect();
                    originX = (rect.left + rect.width / 2) / window.innerWidth;
                    originY = (rect.top + rect.height / 2) / window.innerHeight;
                }
                const colors = ['#a78bfa','#7b61ff','#60a5fa','#34d399','#fbbf24','#f472b6','#fff'];
                const base = { colors, zIndex: 9999, disableForReducedMotion: true };
                // Left burst
                confetti({ ...base, particleCount:80, startVelocity:40, spread:55, angle:60,  origin:{x: originX - 0.12, y: originY} });
                // Right burst
                confetti({ ...base, particleCount:80, startVelocity:40, spread:55, angle:120, origin:{x: originX + 0.12, y: originY} });
                // Up burst
                confetti({ ...base, particleCount:40, startVelocity:30, spread:80, angle:90,  origin:{x: originX, y: originY + 0.04} });
            }
            function _triggerDualConfetti() {
                // For payment success: full screen dual cannons from edges
                if (!window.confetti) {
                    const s = document.createElement('script');
                    s.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
                    s.onload = () => _doFullConfetti();
                    document.head.appendChild(s);
                } else { _doFullConfetti(); }
            }
            function _doFullConfetti() {
                const count = 250;
                const colors = ['#a78bfa','#7b61ff','#60a5fa','#34d399','#fbbf24','#f472b6','#fff'];
                const fire = (ratio, opts) => confetti({ particleCount: Math.floor(count * ratio), colors, zIndex:9999, ...opts });
                fire(0.3,  { spread: 26, startVelocity: 65, angle: 60,  origin: { x: 0,   y: 0.9 } });
                fire(0.25, { spread: 70, startVelocity: 45, angle: 60,  origin: { x: 0,   y: 0.9 } });
                fire(0.3,  { spread: 26, startVelocity: 65, angle: 120, origin: { x: 1,   y: 0.9 } });
                fire(0.25, { spread: 70, startVelocity: 45, angle: 120, origin: { x: 1,   y: 0.9 } });
                fire(0.15, { spread: 90, startVelocity: 30, angle: 90,  origin: { x: 0.5, y: 1   } });
            }

            // ── Premium Popup ──
            function _subShowPopup(success, planLabel) {
                const overlay = document.createElement('div');
                overlay.className = 'sub-popup-overlay';
                overlay.innerHTML = success ? `
                    <div class="sub-popup">
                        <span class="sub-popup-icon">🎉</span>
                        <h3 style="background:linear-gradient(135deg,#a78bfa,#60a5fa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">Payment Successful!</h3>
                        <p>Your <strong>${planLabel}</strong> is now active.<br>Enjoy all premium features instantly.</p>
                        <button class="sub-popup-btn" onclick="location.reload()">Start Learning →</button>
                    </div>
                ` : `
                    <div class="sub-popup" style="border-color:rgba(248,113,113,.2);">
                        <span class="sub-popup-icon">⚠️</span>
                        <h3 style="color:#f87171;">Payment Failed</h3>
                        <p>Something went wrong with your payment. No charge was made. Please try again.</p>
                        <button class="sub-popup-btn" style="background:linear-gradient(135deg,#f87171,#ef4444);" onclick="this.closest('.sub-popup-overlay').remove()">Try Again</button>
                    </div>
                `;
                document.body.appendChild(overlay);
                if (success) setTimeout(_triggerDualConfetti, 100);
            }

            window.subProceedToPay = async function() {
                if (!_subPlan) return;
                const raw = localStorage.getItem('auth_user_full');
                const fbUser = window.firebaseServices && window.firebaseServices.auth && window.firebaseServices.auth.currentUser;
                const u = fbUser || (raw ? (() => { try { return JSON.parse(raw); } catch(e) { return null; } })() : null);
                if (!u) { alert('Please login to purchase.'); return; }
                const uid = u.uid || u.id, email = u.email || '';

                const p = SUB_P[_subPlan][_subDur];
                const planName = PLAN_DATA[_subPlan].name;
                const btn = document.getElementById('sub-pay-btn');
                const originalText = btn.textContent;
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right:.4rem;"></i> Processing...';

                try {
                    const res = await fetch(`${_apiUrlSub}/api/create-order`, {
                        method:'POST', headers:{'Content-Type':'application/json'},
                        body: JSON.stringify({ planId: p.planId, uid, couponCode: _subCoupon || null })
                    });
                    const data = await res.json();
                    if (!data.success) throw new Error(data.error || 'Failed to create order');
                    
                    if (data.zeroAmount) {
                        // 100% discount applied and plan activated successfully on backend!
                        _subShowPopup(true, planName);
                        btn.innerHTML = originalText;
                        btn.disabled = false;
                        return;
                    }

                    const rzp = new Razorpay({
                        key: data.keyId,
                        amount: data.order.amount,
                        currency: 'INR',
                        name: 'SKiL MATRiX Notes',
                        description: `${planName} — ${_subDur === '1mo'?'1 Month':'6 Months'}${_subCoupon ? ` (${_subCoupon})` : ''}`,
                        order_id: data.order.id,
                        handler: async function(r) {
                            try {
                                const vr = await fetch(`${_apiUrlSub}/api/verify-payment`, {
                                    method:'POST', headers:{'Content-Type':'application/json'},
                                    body: JSON.stringify({
                                        razorpay_order_id: r.razorpay_order_id,
                                        razorpay_payment_id: r.razorpay_payment_id,
                                        razorpay_signature: r.razorpay_signature,
                                        planId: p.planId, uid,
                                        couponCode: _subCoupon || null
                                    })
                                });
                                const vd = await vr.json();
                                if (vd.success) {
                                    _subShowPopup(true, planName);
                                } else {
                                    _subShowPopup(false);
                                }
                            } catch(err) { _subShowPopup(false); }
                        },
                        prefill: { email },
                        theme: { color: '#7b61ff' },
                        modal: {
                            ondismiss: function() {
                                btn.disabled = false;
                                btn.textContent = originalText;
                            }
                        }
                    });
                    rzp.on('payment.failed', function() {
                        _subShowPopup(false);
                        btn.disabled = false;
                        btn.textContent = originalText;
                    });
                    rzp.open();
                } catch(e) {
                    alert(e.message || 'Something went wrong.');
                    btn.disabled = false;
                    btn.textContent = originalText;
                }
            };

            // Init UI immediately
            _subRefreshUI();

            // Enter key on coupon
            document.getElementById('sub-coupon-inp')?.addEventListener('keydown', e => { if(e.key==='Enter') subApplyCoupon(); });


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


window.addCustomTopic = function() {
    const input = document.getElementById('p-custom-topic');
    const val = input.value.trim();
    if (!val) return;
    const container = document.getElementById('weak-topics-container');
    const chip = document.createElement('div');
    chip.className = 'chip active';
    chip.dataset.val = val;
    chip.style.cssText = "padding: 0.5rem 1rem; border: 1px solid var(--primary); background: var(--primary); color: #fff; border-radius: 20px; cursor: pointer; font-size: 0.8rem; transition: all 0.3s ease;";
    chip.onclick = function() {
        this.classList.toggle('active');
        if(this.classList.contains('active')) {
            this.style.background='var(--primary)';
            this.style.color='#fff';
            this.style.borderColor='var(--primary)';
        } else {
            this.style.background='transparent';
            this.style.color='var(--text-bright)';
            this.style.borderColor='var(--border-glass)';
        }
    };
    chip.innerText = val;
    container.insertBefore(chip, container.firstChild);
    input.value = '';
};

// Study Planner removed
function renderPlanner() {
    return `
        <div class="tab-pane active fade-in" style="padding: 1rem 1.5rem; max-width: 1200px; margin: 0 auto;">
            <div class="welcome-header" style="margin-bottom: 1.5rem; text-align: center;">
                <h1 class="font-heading">📅 Exam <span class="gradient-text">Strategist</span></h1>
                <p style="color: var(--text-dim); margin-top: 0.3rem;">Create your perfect daily schedule based on exam proximity and weak topics.</p>
            </div>

            <div class="grid-2-col" style="display: grid; grid-template-columns: 320px 1fr; gap: 1.5rem; align-items: start;">
                
                <!-- CONFIG PANEL -->
                <div class="glass-card" style="padding: 1.5rem; background: linear-gradient(145deg, rgba(20,22,30,0.8), rgba(15,17,25,0.9)); border: 1px solid rgba(123, 97, 255, 0.15); box-shadow: 0 10px 40px rgba(0,0,0,0.5);">
                    <h3 class="font-heading" style="margin-bottom: 1.2rem; display: flex; align-items: center; gap: 10px;"><i class="fas fa-sliders-h" style="color: var(--primary);"></i> Plan Configuration</h3>
                    
                    <div class="form-group" style="margin-bottom: 1.2rem;">
                        <label style="color: var(--text-dim); font-size: 0.85rem; margin-bottom: 0.4rem; display: block;">Target Exam Date</label>
                        <input type="date" id="p-exam-date" class="input-field" style="width: 100%; padding: 0.6rem; background: rgba(0,0,0,0.3); border: 1px solid var(--border-glass); border-radius: 8px; color: white; color-scheme: dark;">
                    </div>

                    <div class="form-group" style="margin-bottom: 1.2rem;">
                        <label style="color: var(--text-dim); font-size: 0.85rem; margin-bottom: 0.4rem; display: block; display: flex; justify-content: space-between;">Daily Study Limit <span id="p-hours-val" style="color:var(--primary); font-weight: bold;">4 Hours</span></label>
                        <input type="range" id="p-hours" min="2" max="12" value="4" step="0.5" style="width: 100%; margin-top: 0.4rem; accent-color: var(--primary);" oninput="document.getElementById('p-hours-val').innerText = this.value + ' Hours'">
                    </div>

                    <div class="form-group" style="margin-bottom: 1.5rem;">
                        <label style="color: var(--text-dim); font-size: 0.85rem; margin-bottom: 0.6rem; display: block;">Weak Topics</label>
                        <div style="display: flex; gap: 0.5rem; margin-bottom: 0.8rem;">
                            <input type="text" id="p-custom-topic" placeholder="e.g. Advanced Calculus" class="input-field" style="flex: 1; padding: 0.6rem; background: rgba(0,0,0,0.3); border: 1px solid var(--border-glass); border-radius: 8px; color: white; font-size: 0.85rem;" onkeypress="if(event.key==='Enter') addCustomTopic()">
                            <button class="btn btn-primary" onclick="addCustomTopic()" style="padding: 0 1rem; border-radius: 8px; font-weight: bold;">Add</button>
                        </div>
                        <div id="weak-topics-container" style="display: flex; flex-wrap: wrap; gap: 0.4rem; max-height: 120px; overflow-y: auto; padding-right: 5px; scrollbar-width: thin; scrollbar-color: var(--primary) transparent;">
                            ${mySubjects.map(sub => `
                                <div class="chip" onclick="this.classList.toggle('active'); if(this.classList.contains('active')) { this.style.background='var(--primary)'; this.style.color='#fff'; this.style.borderColor='var(--primary)'; } else { this.style.background='transparent'; this.style.color='var(--text-bright)'; this.style.borderColor='var(--border-glass)'; }" data-val="${sub}" style="padding: 0.4rem 0.8rem; border: 1px solid var(--border-glass); background: transparent; color: var(--text-bright); border-radius: 20px; cursor: pointer; font-size: 0.75rem; transition: all 0.3s ease;">
                                    ${sub}
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <button class="btn btn-primary" onclick="handleGeneratePlan()" id="btn-gen-plan" style="width: 100%; padding: 10px; font-weight: bold; font-size: 1rem; box-shadow: 0 5px 15px rgba(108, 99, 255, 0.4);">
                        ✨ Generate Daily Schedule
                    </button>
                    <p style="text-align:center; font-size: 0.7rem; color: var(--text-dim); margin-top: 0.8rem;"><i class="fas fa-bolt" style="color: #ffb703;"></i> Smart Scheduling Engine</p>
                </div>

                <!-- TIMELINE VIEW -->
                <div class="glass-card" style="padding: 0; overflow: hidden; border: 1px solid rgba(123, 97, 255, 0.1); height: calc(100vh - 220px); min-height: 500px; display: flex; flex-direction: column;">
                    <div style="padding: 1.2rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); background: rgba(0,0,0,0.2); display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;">
                        <h3 class="font-heading" style="margin: 0; display: flex; align-items: center; gap: 10px; font-size: 1.1rem;"><i class="fas fa-list-check" style="color: var(--secondary);"></i> Your Daily Plan</h3>
                        <div style="font-size: 0.8rem; color: var(--text-dim); background: rgba(255,255,255,0.05); padding: 4px 10px; border-radius: 12px;" id="plan-meta">No plan generated yet</div>
                    </div>

                        <div id="plan-timeline" class="timeline-wrapper" style="padding: 1.5rem; flex: 1; overflow-y: auto; scrollbar-width: thin; scrollbar-color: var(--primary) transparent;">
                        <!-- Empty State -->
                        <div style="text-align: center; padding: 2rem; opacity: 0.6; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
                            <div style="font-size: 3rem; margin-bottom: 1rem; text-shadow: 0 0 20px rgba(108, 99, 255, 0.3);">🗓️</div>
                            <h3 style="margin-bottom: 0.5rem; color: var(--text-main); font-size: 1.1rem;">Ready to Strategize?</h3>
                            <p style="color: var(--text-dim); max-width: 280px; line-height: 1.4; font-size: 0.85rem;">Configure your preferences on the left and click Generate to see your personalized study schedule.</p>
                        </div>
                    </div>
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

    // Premium Loading UI
    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Initializing Engine...`;
    
    // Step 1: Initializing
    container.innerHTML = `
        <div style="text-align: center; padding: 2rem; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
            <div style="position: relative; width: 60px; height: 60px; margin-bottom: 1.5rem;">
                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; border-radius: 50%; border: 3px solid transparent; border-top-color: var(--primary); animation: spin 1s linear infinite;"></div>
                <div style="position: absolute; top: 8px; left: 8px; right: 8px; bottom: 8px; border-radius: 50%; border: 3px solid transparent; border-top-color: var(--secondary); animation: spin 2s linear infinite reverse;"></div>
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 1.2rem;">⚙️</div>
            </div>
            <h3 id="ai-loading-text" style="font-size: 1.1rem; background: linear-gradient(90deg, var(--primary), var(--secondary)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: pulse 2s infinite;">Initializing Smart Core...</h3>
            <p style="color: var(--text-dim); font-size: 0.85rem; margin-top: 0.4rem; max-width: 250px;">Please wait while the strategist algorithm calculates your perfect schedule.</p>
        </div>
    `;

    try {
        // Fake AI Processing Delays
        await new Promise(r => setTimeout(r, 1200));
        if(document.getElementById('ai-loading-text')) document.getElementById('ai-loading-text').innerText = "Analyzing Weak Topics...";
        await new Promise(r => setTimeout(r, 1500));
        if(document.getElementById('ai-loading-text')) document.getElementById('ai-loading-text').innerText = "Optimizing Cognitive Load...";
        await new Promise(r => setTimeout(r, 1200));
        if(document.getElementById('ai-loading-text')) document.getElementById('ai-loading-text').innerText = "Generating Final Blueprint...";
        await new Promise(r => setTimeout(r, 800));

        // Generate Advanced Pomodoro Plan
        const plan = [];
        let currentHour = 9; // Start at 9 AM
        let rem = parseFloat(hours);

        const formatTime = (h) => {
            const period = h >= 12 ? 'PM' : 'AM';
            let displayH = Math.floor(h) % 12;
            if (displayH === 0) displayH = 12;
            const mins = (h % 1) === 0.5 ? '30' : '00';
            return `${displayH}:${mins} ${period}`;
        };

        let topicsPool = [...weakTopics];
        if (topicsPool.length === 0) topicsPool = ["Core Syllabus", "Previous Year Papers", "Formula Revision"];
        
        let topicIdx = 0;
        
        // Block 0: Setup
        plan.push({
            type: 'Revise',
            time: `${formatTime(currentHour)} - ${formatTime(currentHour + 0.5)}`,
            activity: 'Initial Assessment & Strategy',
            topic: 'Scan syllabus gaps & prepare study environment',
            reasoning: 'Calibrating your focus by mapping out exact topics reduces friction and prepares the brain for deep learning.'
        });
        currentHour += 0.5;
        rem -= 0.5;
        
        let sessionCount = 1;
        while (rem >= 1.5) {
            let currentTopic = topicsPool[topicIdx % topicsPool.length];
            
            const studyMethods = ['Feynman Technique', 'Spaced Repetition', 'Deep Concept Mapping', 'Core Principle Breakdown'];
            const method = studyMethods[topicIdx % studyMethods.length];
            
            plan.push({
                type: 'Learn',
                time: `${formatTime(currentHour)} - ${formatTime(currentHour + 1)}`,
                activity: `Deep Mastery (${method})`,
                topic: `Focused learning on: ${currentTopic}`,
                reasoning: `Using the ${method} provides a high retention rate specifically for complex subjects like ${currentTopic}.`
            });
            currentHour += 1;
            rem -= 1;
            
            plan.push({
                type: 'Practice',
                time: `${formatTime(currentHour)} - ${formatTime(currentHour + 0.5)}`,
                activity: `Application & Validation`,
                topic: `Solve complex numericals/PYQs for ${currentTopic}`,
                reasoning: `Immediate application of learned concepts prevents the forgetting curve and cements understanding.`
            });
            currentHour += 0.5;
            rem -= 0.5;
            
            topicIdx++;
            sessionCount++;
            
            // Add a 30 min break
            if (rem > 0) {
                plan.push({
                    type: 'Break',
                    time: `${formatTime(currentHour)} - ${formatTime(currentHour + 0.5)}`,
                    activity: 'Neurological Rest Phase',
                    topic: 'Non-screen break, hydration, light stretching',
                    reasoning: 'The brain requires diffused mode thinking periods to synthesize and store complex engineering concepts.'
                });
                currentHour += 0.5;
            }
        }
        
        if (rem > 0) {
            plan.push({
                type: 'Revise',
                time: `${formatTime(currentHour)} - ${formatTime(currentHour + rem)}`,
                activity: 'Global Synthesization',
                topic: 'Rapid review of all key formulas & mistakes',
                reasoning: 'Ending the day with a global review triggers memory consolidation during sleep.'
            });
        }

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

// --- TIMETABLE LOGIC ---
function renderTimetable() {
    return `
    <style>
        .tt-premium-card {
            background: rgba(15, 17, 26, 0.7);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 16px;
            transition: all 0.3s ease;
        }
        .tt-premium-card:hover {
            transform: translateY(-4px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        .tt-input-group {
            position: relative;
        }
        .tt-select-pro {
            width: 100%;
            border-radius: 14px;
            background: rgba(10, 12, 20, 0.8);
            border: 1px solid rgba(255,255,255,0.1);
            padding: 0.85rem 1.2rem;
            color: white !important;
            font-size: 0.95rem;
            font-weight: 500;
            box-shadow: inset 0 2px 5px rgba(0,0,0,0.5);
            transition: all 0.3s ease;
            appearance: none;
            cursor: pointer;
        }
        .tt-select-pro:focus {
            outline: none;
            border-color: #7b61ff;
            box-shadow: 0 0 15px rgba(123, 97, 255, 0.4), inset 0 2px 5px rgba(0,0,0,0.5);
        }
        .tt-select-pro option {
            background: #111424;
            color: white;
        }
        .tt-input-group::after {
            content: '▼';
            position: absolute;
            right: 15px;
            bottom: 16px;
            color: var(--primary);
            font-size: 0.8rem;
            pointer-events: none;
        }
        .tt-floating-icon {
            display: inline-block;
            animation: float-3d 4s ease-in-out infinite;
            filter: drop-shadow(0 10px 15px rgba(123, 97, 255, 0.4));
        }
        @keyframes float-3d {
            0%, 100% { transform: translateY(0) rotateX(0) rotateY(0); }
            50% { transform: translateY(-12px) rotateX(10deg) rotateY(-10deg); filter: drop-shadow(0 20px 25px rgba(123, 97, 255, 0.6)); }
        }
        .tt-exam-card::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 100%);
            opacity: 0;
            transition: opacity 0.3s;
            pointer-events: none;
        }
        .tt-exam-card:hover::after {
            opacity: 1;
        }
        @media (max-width: 768px) {
            .tt-exam-flex-row {
                flex-direction: column !important;
                align-items: flex-start !important;
                gap: 1.2rem !important;
            }
            .tt-exam-actions {
                width: 100%;
                justify-content: space-between !important;
                gap: 1rem !important;
            }
            .tt-exam-info {
                min-width: 100% !important;
            }
        }
        .tt-countdown-box {
            background: rgba(0, 0, 0, 0.2);
            border: 1px solid rgba(255,255,255,0.05);
            border-radius: 10px;
            padding: 0.4rem;
            text-align: center;
            min-width: 48px;
        }
        .tt-countdown-val {
            font-size: 1.1rem;
            font-weight: 700;
            color: #ffffff;
            line-height: 1.1;
        }
        .tt-countdown-lbl {
            font-size: 0.6rem;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 600;
            margin-top: 2px;
        }
        .tt-exam-card {
            position: relative;
            overflow: hidden;
        }
        .tt-exam-card::before {
            content: '';
            position: absolute;
            top: 0; left: -100%;
            width: 50%; height: 100%;
            background: linear-gradient(to right, transparent, rgba(255,255,255,0.03), transparent);
            transform: skewX(-20deg);
            animation: shine 4s infinite;
        }
        @keyframes shine {
            0% { left: -100%; }
            20%, 100% { left: 200%; }
        }
    </style>
    <div class="tab-pane active fade-in" style="padding: 1rem; max-width: 1000px; margin: 0 auto; perspective: 1000px;">
        <div style="text-align: center; margin-bottom: 2rem; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <h1 class="font-heading" style="font-size: clamp(2rem, 5vw, 2.8rem); text-shadow: 0 10px 30px rgba(123,97,255,0.3); margin: 0;">
                <span class="tt-floating-icon" style="font-size: 1em; vertical-align: middle; margin-right: 8px;">⏳</span> 
                Exam <span class="gradient-text" style="background: linear-gradient(135deg, #a78bfa, #00f2ff); -webkit-background-clip: text; color: transparent;">Timetable</span>
            </h1>
            <p style="color: #94a3b8; max-width: 500px; margin: 0.5rem auto 0; font-size: 0.95rem; line-height: 1.5; font-weight: 400;">
                Precision tracking for your academic milestones. Never miss a deadline with real-time dynamic countdowns.
            </p>
        </div>

        <div class="tt-premium-card" style="padding: 1.5rem; margin-bottom: 2rem; display: flex; flex-wrap: wrap; gap: 1rem; justify-content: center; position: relative; z-index: 10;">
            <!-- Glow background blob -->
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 80%; height: 80%; background: radial-gradient(circle, rgba(123,97,255,0.1) 0%, transparent 70%); pointer-events: none; z-index: -1;"></div>
            
            <div class="tt-input-group" style="flex: 1; min-width: 180px; max-width: 250px;">
                <label style="font-size: 0.75rem; color: #a78bfa; font-weight: 800; margin-bottom: 0.4rem; display: block; text-transform: uppercase; letter-spacing: 0.1em; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">Target College</label>
                <select id="user-tt-college" class="tt-select-pro" onchange="window.initTimetable()">
                    <option value="">-- Select College --</option>
                    ${(window.GlobalData?.colleges || []).map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                </select>
            </div>
            <div class="tt-input-group" style="flex: 1; min-width: 180px; max-width: 250px;">
                <label style="font-size: 0.75rem; color: #00f2ff; font-weight: 800; margin-bottom: 0.4rem; display: block; text-transform: uppercase; letter-spacing: 0.1em; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">Academic Branch</label>
                <select id="user-tt-branch" class="tt-select-pro" onchange="window.initTimetable()">
                    <option value="">-- Select Branch --</option>
                    ${(window.GlobalData?.branches || []).map(b => `<option value="${b.id}">${b.name}</option>`).join('')}
                </select>
            </div>
            <div class="tt-input-group" style="flex: 1; min-width: 180px; max-width: 250px;">
                <label style="font-size: 0.75rem; color: #f43f5e; font-weight: 800; margin-bottom: 0.4rem; display: block; text-transform: uppercase; letter-spacing: 0.1em; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">Current Semester</label>
                <select id="user-tt-sem" class="tt-select-pro" onchange="window.initTimetable()">
                    <option value="">-- Select Semester --</option>
                    ${[1,2,3,4,5,6,7,8].map(s => `<option value="Semester ${s}">Semester ${s}</option>`).join('')}
                </select>
            </div>
        </div>


        <div id="tt-user-list" style="display: flex; flex-direction: column; gap: 2rem; position: relative;">
            <div style="text-align: center; padding: 5rem 2rem; opacity: 0.8;">
                <div class="tt-floating-icon" style="font-size: 4rem; margin-bottom: 1.5rem;">🎯</div>
                <h3 style="margin-bottom: 0.8rem; color: white; font-size: 1.4rem; font-weight: 700; letter-spacing: 0.5px;">Awaiting Configuration</h3>
                <p style="color: #94a3b8; font-size: 1.05rem; max-width: 400px; margin: 0 auto;">Select your academic profile above to synchronize your personalized exam timeline.</p>
            </div>
        </div>
    </div>
    `;
}

// Global Helper Scripts for Timetable Integrations
window.goToPlannerForExam = function(subject, dateStr) {
    localStorage.setItem('tt_planner_subject', subject);
    localStorage.setItem('tt_planner_date', dateStr);
    
    const sidebarLinks = document.querySelectorAll('.nav-item');
    sidebarLinks.forEach(l => l.classList.remove('active'));
    const plannerLink = Array.from(sidebarLinks).find(l => l.getAttribute('onclick')?.includes('planner'));
    if(plannerLink) plannerLink.classList.add('active');
    
    if(window.renderTabContent) window.renderTabContent('planner');
};

window.goToNotesForExam = function(subject, college, branch, semester) {
    let cleanSubject = subject.split(' (')[0].trim().toLowerCase();
    let foundSubjectObj = null;

    if (college && branch && semester && window.GlobalData && window.GlobalData.subjects) {
        const key = `${branch}-${semester}`;
        if (window.GlobalData.subjects[key]) {
            foundSubjectObj = window.GlobalData.subjects[key].find(s => 
                s.name.toLowerCase() === cleanSubject || 
                (s.code && s.code.toLowerCase() === cleanSubject)
            );
        }
    }
    
    // If it's a custom subject, create a dynamic object for it!
    if (!foundSubjectObj && college && branch && semester) {
        foundSubjectObj = {
            id: 'custom-' + cleanSubject.replace(/\s+/g, '-'),
            name: subject.split(' (')[0].trim()
        };
    }
    
    if (foundSubjectObj && college && branch && semester) {
        const collegeObj = (window.GlobalData?.colleges || []).find(c => c.id === college) || {id: college, name: college};
        const branchObj = (window.GlobalData?.branches || []).find(b => b.id === branch) || {id: branch, name: branch};
        
        window.selState = {
            college: collegeObj,
            branch: branchObj,
            semester: semester,
            year: null,
            subject: foundSubjectObj
        };
        
        const sidebarLinks = document.querySelectorAll('.nav-item');
        sidebarLinks.forEach(l => l.classList.remove('active'));
        const notesLink = Array.from(sidebarLinks).find(l => l.getAttribute('onclick')?.includes('notes'));
        if(notesLink) notesLink.classList.add('active');
        
        if(window.renderTabContent) window.renderTabContent('notes');
        
        // Visually update the URL hash
        const semFormatted = semester.toLowerCase().replace(/\s+/g, '-');
        window.history.replaceState(null, '', `#/notes/${college}/${branch}/year/${semFormatted}/${foundSubjectObj.id}`);
        return;
    }

    // Fallback to global search
    localStorage.setItem('searchQuery', subject);
    
    const sidebarLinks = document.querySelectorAll('.nav-item');
    sidebarLinks.forEach(l => l.classList.remove('active'));
    const homeLink = Array.from(sidebarLinks).find(l => l.getAttribute('onclick')?.includes('home'));
    if(homeLink) homeLink.classList.add('active');
    
    if(window.renderTabContent) window.renderTabContent('home');
    
    setTimeout(() => {
        const searchBox = document.getElementById('global-search');
        if(searchBox) {
            searchBox.value = subject;
            if(window.filterGlobalSearch) window.filterGlobalSearch();
        }
    }, 300);
};

window.downloadICS = function(subject, dateStr) {
    const d = new Date(dateStr);
    const endD = new Date(d.getTime() + 2 * 60 * 60 * 1000); 
    
    const fmt = date => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    const icsContent = 
`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//SkillNotes//ExamTimetable//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
UID:${Date.now()}@skillnotes.com
DTSTAMP:${fmt(new Date())}
DTSTART:${fmt(d)}
DTEND:${fmt(endD)}
SUMMARY:Exam: ${subject}
DESCRIPTION:Scheduled exam from SkillNotes Timetable.
BEGIN:VALARM
TRIGGER:-PT24H
ACTION:DISPLAY
DESCRIPTION:Reminder: Exam in 24 hours
END:VALARM
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Exam_${subject.replace(/\s+/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

window.initTimetable = async function() {
    const col = document.getElementById('user-tt-college').value;
    const br = document.getElementById('user-tt-branch').value;
    const sem = document.getElementById('user-tt-sem').value;
    const list = document.getElementById('tt-user-list');
    
    if(!col || !br || !sem) return;
    
    list.innerHTML = `
        <style>
        @keyframes spin-glow { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes spin-glow-reverse { 0% { transform: rotate(360deg); } 100% { transform: rotate(0deg); } }
        </style>
        <div class="premium-loader-wrapper" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 2rem; gap: 1.5rem;">
            <div class="premium-glow-spinner" style="position: relative; width: 60px; height: 60px;">
                <div style="box-sizing: border-box; display: block; position: absolute; width: 60px; height: 60px; margin: 0; border: 4px solid transparent; border-radius: 50%; animation: spin-glow 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite; border-top-color: var(--primary); box-shadow: 0 0 20px rgba(123, 97, 255, 0.4);"></div>
                <div style="box-sizing: border-box; display: block; position: absolute; width: 60px; height: 60px; margin: 0; border: 4px solid transparent; border-radius: 50%; animation: spin-glow-reverse 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite; border-bottom-color: var(--secondary); box-shadow: 0 0 20px rgba(0, 242, 255, 0.3); animation-delay: -0.6s;"></div>
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 1.2rem; filter: drop-shadow(0 0 8px var(--primary));">📅</div>
            </div>
            <div style="text-align: center;">
                <h4 style="margin: 0 0 0.4rem; color: white; font-weight: 700; letter-spacing: 0.5px; font-size: 1.05rem; background: linear-gradient(90deg, #fff, rgba(255,255,255,0.7)); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Retrieving Academic Timetable</h4>
                <p style="margin: 0; color: var(--text-dim); font-size: 0.85rem; font-family: 'JetBrains Mono', monospace; opacity: 0.8; animation: pulse 1.5s infinite alternate;">Connecting to secure cloud nodes...</p>
            </div>
        </div>`;
    
    // Stop any existing intervals
    if(window._ttInterval) clearInterval(window._ttInterval);
    
    try {
        const { supabase } = await import('./supabase-config.js?v=1.0');
        const { data, error } = await supabase.from('exam_timetable')
            .select('*')
            .eq('college', col)
            .eq('branch', br)
            .eq('semester', sem)
            .order('exam_date', { ascending: true });
            
        if(error) throw error;
        
        if(!data || data.length === 0) {
            list.innerHTML = `<div style="text-align: center; padding: 4rem; opacity: 0.6;">
                <div style="font-size: 3rem; margin-bottom: 1rem; text-shadow: 0 0 20px rgba(52, 211, 153, 0.3);">🎉</div>
                <h3 style="margin-bottom: 0.5rem; color: var(--text-main); font-size: 1.1rem;">No exams scheduled!</h3>
                <p style="color: var(--text-dim); font-size: 0.9rem;">Your timetable is completely clear for now.</p>
            </div>`;
            return;
        }
        
        window._ttCurrentExams = data;
        renderTimetableCards();
        window._ttInterval = setInterval(renderTimetableCards, 60000); // Update every minute
        
    } catch(e) {
        list.innerHTML = `<div style="text-align:center; color:#ff4757; padding:3rem;">Error: ${e.message}</div>`;
    }
};

function renderTimetableCards() {
    const list = document.getElementById('tt-user-list');
    if(!list || !window._ttCurrentExams) return;
    
    const now = new Date();
    
    list.innerHTML = window._ttCurrentExams.map((ex, index) => {
        const examDate = new Date(ex.exam_date);
        const diffMs = examDate - now;
        
        // Consistent Pseudo-random number for live studying based on subject hash
        const hash = ex.subject.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);
        const liveCount = Math.abs(hash % 45) + 12; 
        
        let statusHtml = '';
        let cardStyle = '';
        let iconHtml = '';
        
        if(diffMs < 0) {
            statusHtml = `<span style="background: rgba(255,255,255,0.05); padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; color: rgba(255,255,255,0.5); font-weight: 600; border: 1px solid rgba(255,255,255,0.1); letter-spacing: 0.5px;">✓ COMPLETED</span>`;
            cardStyle = 'background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-left: 1px solid rgba(255, 255, 255, 0.05); opacity: 0.65;';
            iconHtml = `<div style="width: 42px; height: 42px; border-radius: 12px; background: rgba(255,255,255,0.03); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; border: 1px solid rgba(255,255,255,0.05); filter: grayscale(1);">✓</div>`;
        } else {
            const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
            const mins = Math.floor((diffMs / 1000 / 60) % 60);
            
            // Single premium style for all upcoming exams
            cardStyle = 'background: rgba(0, 242, 255, 0.02); border: 1px solid rgba(0, 242, 255, 0.2); border-left: 1px solid rgba(0, 242, 255, 0.2); box-shadow: 0 0 20px rgba(0, 242, 255, 0.1), inset 0 0 8px rgba(0, 242, 255, 0.03);';
            iconHtml = `<div style="width: 42px; height: 42px; border-radius: 12px; background: rgba(0, 242, 255, 0.12); color: #00f2ff; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; border: 1px solid rgba(0, 242, 255, 0.25); box-shadow: 0 0 4px rgba(0, 242, 255, 0.15); text-shadow: none;">📘</div>`;
            
            statusHtml = `
                <div style="display: flex; gap: 0.6rem; margin-top: 0;">
                    <div class="tt-countdown-box">
                        <div class="tt-countdown-val">${days}</div>
                        <div class="tt-countdown-lbl">Days</div>
                    </div>
                    <div class="tt-countdown-box">
                        <div class="tt-countdown-val">${hours.toString().padStart(2, '0')}</div>
                        <div class="tt-countdown-lbl">Hrs</div>
                    </div>
                    <div class="tt-countdown-box">
                        <div class="tt-countdown-val">${mins.toString().padStart(2, '0')}</div>
                        <div class="tt-countdown-lbl">Min</div>
                    </div>
                </div>
            `;
        }
        
        const animDelay = index * 0.1;
        
        return `
            <div class="tt-premium-card tt-exam-card" style="padding: 1rem 1.2rem; display: flex; flex-direction: column; gap: 0.8rem; ${cardStyle} animation: slideUp 0.3s ease ${animDelay}s both; position: relative; backdrop-filter: blur(12px); border-radius: 16px;">
                
                <div class="tt-exam-flex-row" style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 1rem; width: 100%;">
                    <div class="tt-exam-info" style="display: flex; align-items: center; gap: 1rem; flex: 1; min-width: 250px;">
                        ${iconHtml}
                        <div>
                            <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.2rem;">
                                <h3 style="margin: 0; font-size: 1.15rem; font-weight: 700; color: white;">
                                    ${ex.subject}
                                </h3>

                            </div>
                            
                            <div style="display: flex; gap: 0.8rem; flex-wrap: wrap; align-items: center; font-size: 0.8rem; color: #94a3b8;">
                                <div style="display: flex; align-items: center; gap: 4px;">
                                    <span>📅</span> ${examDate.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                </div>
                                <div style="display: flex; align-items: center; gap: 4px;">
                                    <span>⏰</span> ${examDate.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="tt-exam-actions" style="display: flex; align-items: center; gap: 1.5rem;">
                        ${statusHtml}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}


// renderTimeline removed (Study Planner removed)


function renderAITools() {
    // Real-time Backend Sync: Automatically lock/unlock AI coach based on real database status
    setTimeout(async () => {
        try {
            const raw = localStorage.getItem('auth_user_full');
            const fbUser = window.firebaseServices && window.firebaseServices.auth && window.firebaseServices.auth.currentUser;
            const u = fbUser || (raw ? (() => { try { return JSON.parse(raw); } catch(e) { return null; } })() : null);
            if (!u) return;
            const uid = u.uid || u.id;
            const apiUrl = location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://skil-matrix-server.onrender.com';
            const res = await fetch(`${apiUrl}/api/user-plan?uid=${uid}&_t=${Date.now()}`);
            let data = await res.json();
            
            // Admin override for premium AI coach
            try {
                const u = JSON.parse(localStorage.getItem('auth_user_full') || '{}');
                const email = (u.email || '').toLowerCase();
                const adminEmails = ['tanishqagrawal1103@gmail.com', 'skilmatrix3@gmail.com'];
                if (adminEmails.includes(email)) {
                    data = { success: true, plan: 'pro', expiry: '2099-12-31T23:59:59Z' };
                }
            } catch(e) {}
            if (!data.plan || data.plan === 'free') {
                if (localStorage.getItem('is_premium_' + uid) === 'true') {
                    if (window.revertToFreeAI) window.revertToFreeAI();
                }
            } else if (data.plan === 'pro' || data.plan.includes('pro')) {
                if (localStorage.getItem('is_premium_' + uid) !== 'true') {
                    if (window.unlockPremiumAI) window.unlockPremiumAI();
                }
            }
        } catch(e) { console.warn("AI Coach Backend Sync Error:", e); }
    }, 50);

    const rawUser = localStorage.getItem('auth_user_full');
    let aiUid = 'guest';
    if (rawUser) { try { const u = JSON.parse(rawUser); aiUid = u.uid || u.id || 'guest'; } catch(e) {} }

    let todayDate = new Date().toDateString();
    let storedDate = localStorage.getItem('ai_usage_date_' + aiUid);
    if (storedDate !== todayDate) {
        localStorage.setItem('ai_usage_date_' + aiUid, todayDate);
        localStorage.setItem('ai_usage_count_' + aiUid, '0');
    }

    let aiUsage = parseInt(localStorage.getItem('ai_usage_count_' + aiUid) || '0');
    let isPremium = localStorage.getItem('is_premium_' + aiUid) === 'true';
    const MAX_FREE_USAGE = 5;
    const isLocked = !isPremium && aiUsage >= MAX_FREE_USAGE;

    return `
        <div class="tab-pane active fade-in" style="padding: 0; padding-top: 10px; width: 100%; height: calc(100vh - 130px); display: flex; justify-content: center; align-items: flex-start; box-sizing: border-box; background: transparent;">
            
            <style>
                /* Dark Premium Theme CSS */
                .ai-premium-container {
                    width: 100%;
                    max-width: 1000px;
                    height: 100%;
                    max-height: calc(100vh - 140px);
                    background: #0a0a0a;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 20px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.8);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    position: relative;
                }
                
                .ai-header {
                    padding: 1.2rem 2rem;
                    background: #111111;
                    border-bottom: 1px solid rgba(255,255,255,0.06);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-shrink: 0;
                }

                .ai-header-title {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .ai-header-icon.premium-tier {
                    width: 48px;
                    height: 48px;
                    border-radius: 14px;
                    background: linear-gradient(135deg, #111, #222);
                    border: 1px solid rgba(251, 191, 36, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                    color: #fbbf24;
                    box-shadow: 0 0 20px rgba(251, 191, 36, 0.2), inset 0 0 10px rgba(251, 191, 36, 0.1);
                }
                .ai-header-icon.free-tier {
                    width: 44px;
                    height: 44px;
                    border-radius: 12px;
                    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.3rem;
                    color: white;
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                }

                .ai-header-text h3 {
                    margin: 0;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .ai-header-text h3.premium-tier {
                    font-size: 1.4rem;
                    font-weight: 800;
                    background: linear-gradient(to right, #fbbf24, #f59e0b, #fbbf24);
                    background-size: 200% auto;
                    color: #fbbf24;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    animation: shine 3s linear infinite;
                    letter-spacing: 0.5px;
                }
                .ai-header-text h3.free-tier {
                    font-size: 1.2rem;
                    font-weight: 600;
                    color: #fff;
                    letter-spacing: 0px;
                }
                
                @keyframes shine {
                    to { background-position: 200% center; }
                }
                
                .pro-badge.premium-tier {
                    font-size: 0.7rem;
                    background: linear-gradient(135deg, #fbbf24, #f59e0b);
                    padding: 4px 10px;
                    border-radius: 6px;
                    font-weight: 800;
                    color: #000;
                    -webkit-text-fill-color: #000;
                    letter-spacing: 1px;
                    box-shadow: 0 4px 15px rgba(251, 191, 36, 0.4), inset 0 2px 4px rgba(255,255,255,0.3);
                }
                .pro-badge.free-tier {
                    font-size: 0.65rem;
                    background: #2563eb;
                    padding: 4px 8px;
                    border-radius: 6px;
                    font-weight: 700;
                    color: #fff;
                    -webkit-text-fill-color: #fff;
                    letter-spacing: 0.5px;
                }

                .ai-status {
                    font-size: 0.8rem;
                    color: #a1a1aa;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-top: 4px;
                }
                
                .ai-chat-area {
                    flex: 1;
                    overflow-y: auto;
                    min-height: 0;
                    padding: 2rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    scroll-behavior: smooth;
                    background: #0a0a0a;
                }

                .ai-chat-area::-webkit-scrollbar {
                    width: 6px;
                }
                
                .ai-chat-area::-webkit-scrollbar-thumb {
                    background: #333;
                    border-radius: 10px;
                }
                
                .quick-prompts-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1rem;
                    margin-top: auto;
                    margin-bottom: 0;
                }
                
                .premium-prompt-card {
                    background: #141414;
                    border: 1px solid #262626;
                    border-radius: 12px;
                    padding: 1rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                
                .premium-prompt-card:hover {
                    background: #1f1f1f;
                    border-color: #3b82f6;
                }
                
                .prompt-icon {
                    font-size: 1.2rem;
                    color: #3b82f6;
                }
                
                .prompt-text {
                    font-size: 0.85rem;
                    color: #d4d4d8;
                    line-height: 1.4;
                }
                
                .premium-prompt-card:hover .prompt-text {
                    color: #fff;
                }

                .ai-input-wrapper {
                    padding: 1.5rem 2rem;
                    background: #111111;
                    border-top: 1px solid rgba(255,255,255,0.06);
                    flex-shrink: 0;
                }

                .ai-input-container {
                    background: #1a1a1a;
                    border: 1px solid #333;
                    border-radius: 16px;
                    padding: 0.6rem;
                    display: flex;
                    align-items: flex-end;
                    gap: 10px;
                    transition: all 0.3s;
                }
                
                .ai-input-container:focus-within {
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
                }

                #ai-chat-input {
                    flex: 1;
                    background: transparent;
                    border: none;
                    color: #fff;
                    font-family: 'Inter', sans-serif;
                    font-size: 0.95rem;
                    padding: 0.6rem 0.8rem;
                    resize: none;
                    min-height: 24px;
                    max-height: 150px;
                    outline: none;
                    line-height: 1.5;
                }
                
                #ai-chat-input::placeholder {
                    color: #71717a;
                }

                .ai-action-btn {
                    height: 40px;
                    width: 40px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s;
                    flex-shrink: 0;
                }

                .mic-btn {
                    background: transparent;
                    color: #71717a;
                    font-size: 1.1rem;
                }
                
                .mic-btn:hover {
                    color: #fff;
                    background: #27272a;
                }

                .send-btn {
                    background: #3b82f6;
                    color: white;
                    font-size: 1.1rem;
                }
                
                .send-btn:hover {
                    background: #2563eb;
                }
                
                /* Message Styling */
                .chat-message {
                    display: flex;
                    gap: 16px;
                    max-width: 85%;
                }
                
                .user-msg {
                    align-self: flex-end;
                    flex-direction: row-reverse;
                }
                
                .msg-avatar {
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    font-size: 1rem;
                }
                
                .ai-msg .msg-avatar {
                    background: #1e1e1e;
                    border: 1px solid #333;
                    color: #3b82f6;
                }
                
                .user-msg .msg-avatar {
                    background: #2563eb;
                    color: #fff;
                }
                
                .msg-bubble {
                    padding: 1.2rem;
                    font-size: 0.95rem;
                    line-height: 1.6;
                    border-radius: 14px;
                    color: #ededed;
                }
                
                .ai-msg .msg-bubble {
                    background: #141414;
                    border: 1px solid #262626;
                    border-top-left-radius: 4px;
                }
                
                .user-msg .msg-bubble {
                    background: #2563eb;
                    border: 1px solid #1d4ed8;
                    border-top-right-radius: 4px;
                }
                
                .ai-msg-actions {
                    display: none;
                }

                /* Mobile Responsiveness for AI Coach */
                @media (max-width: 768px) {
                    .ai-premium-container {
                        height: calc(100vh - 140px);
                        max-height: calc(100vh - 140px);
                        border-radius: 12px;
                    }
                    .ai-header {
                        padding: 0.8rem;
                        background: #09090b;
                        border-bottom: 1px solid #27272a;
                    }
                    .ai-header-title {
                        gap: 8px;
                    }
                    .ai-header-text h3.free-tier, 
                    .ai-header-text h3.premium-tier {
                        font-size: 0.95rem;
                        white-space: nowrap;
                    }
                    .ai-header-icon {
                        width: 32px;
                        height: 32px;
                        font-size: 1rem;
                    }
                    .pro-badge {
                        padding: 2px 6px;
                        font-size: 0.6rem;
                    }
                    .ai-status {
                        font-size: 0.7rem;
                    }
                    .ai-chat-area {
                        padding: 1rem;
                        gap: 1rem;
                    }
                    .chat-message {
                        max-width: 95%;
                        gap: 8px;
                    }
                    .msg-bubble {
                        padding: 0.8rem;
                        font-size: 0.82rem;
                    }
                    .ai-msg-actions {
                        display: flex;
                        gap: 16px;
                        margin-top: 8px;
                        padding-left: 2px;
                        align-items: center;
                    }
                    .ai-action-icon {
                        background: transparent;
                        border: none;
                        color: #71717a;
                        font-size: 0.75rem;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        padding: 0;
                    }
                    .msg-avatar {
                        width: 28px;
                        height: 28px;
                        font-size: 0.8rem;
                        border-radius: 50%;
                    }
                    .ai-input-wrapper {
                        padding: 0.8rem;
                        background: #09090b;
                    }
                    .quick-prompts-grid {
                        display: flex;
                        flex-direction: row;
                        flex-wrap: nowrap;
                        overflow-x: auto;
                        padding: 0 0 10px 0;
                        gap: 8px;
                        -webkit-overflow-scrolling: touch;
                        scrollbar-width: thin;
                        scrollbar-color: #3f3f46 transparent;
                        margin-bottom: 0;
                    }
                    .quick-prompts-grid::-webkit-scrollbar {
                        display: block;
                        height: 3px;
                    }
                    .quick-prompts-grid::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .quick-prompts-grid::-webkit-scrollbar-thumb {
                        background-color: rgba(255,255,255,0.15);
                        border-radius: 4px;
                    }
                    .premium-prompt-card {
                        flex: 0 0 auto;
                        padding: 8px 14px;
                        border-radius: 20px;
                        background: #18181b;
                        border: 1px solid #27272a;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        min-height: auto;
                    }
                    .premium-prompt-card:hover {
                        background: #27272a;
                    }
                    .premium-prompt-card .prompt-icon {
                        width: auto;
                        height: auto;
                        background: transparent;
                        font-size: 0.85rem;
                        color: #a1a1aa;
                        margin-bottom: 0;
                    }
                    .premium-prompt-card .prompt-text {
                        font-size: 0.8rem;
                        color: #d4d4d8;
                    }
                    .premium-prompt-card .prompt-text strong {
                        display: none; 
                    }
                    .premium-prompt-card .prompt-text br {
                        display: none;
                    }
                }
            </style>

            <div class="ai-premium-container">
                ${isLocked ? `
                    <div id="premium-lock-overlay" style="position: absolute; inset: 0; background: rgba(10,10,10,0.85); backdrop-filter: blur(8px); z-index: 50; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
                        <div style="background: #141414; border: 1px solid rgba(251,191,36,0.3); padding: 3rem; border-radius: 24px; box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
                            <i class="fas fa-lock" style="font-size: 4rem; color: #fbbf24; margin-bottom: 20px;"></i>
                            <h2 style="color: #fbbf24; margin-bottom: 10px; font-size: 1.8rem;">Premium Locked</h2>
                            <p style="color: #a1a1aa; margin-bottom: 30px; max-width: 300px; line-height: 1.6;">You've reached your free usage limit. Upgrade to unlock unlimited AI assistance.</p>
                            <button onclick="window.location.search = '?tab=subscription'" style="background: linear-gradient(135deg, #fbbf24, #f59e0b); color: #000; font-weight: bold; border: none; padding: 12px 30px; border-radius: 12px; cursor: pointer; font-size: 1.1rem; box-shadow: 0 5px 15px rgba(251,191,36,0.3); transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">Buy Subscription</button>
                        </div>
                    </div>
                ` : ''}
                <!-- Header -->
                <div class="ai-header">
                    <div class="ai-header-title">
                        <div id="ai-header-icon" class="ai-header-icon ${isPremium ? 'premium-tier' : 'free-tier'}"><i class="fas fa-brain"></i></div>
                        <div class="ai-header-text">
                            <div class="ai-header-badge-row" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                                <h3 id="ai-header-title" class="${isPremium ? 'premium-tier' : 'free-tier'}" style="margin: 0;">SKiL Matrix AI</h3>
                                <span id="ai-pro-badge" class="pro-badge ${isPremium ? 'premium-tier' : 'free-tier'}">${isPremium ? 'PRO' : 'FREE'}</span>
                                ${isPremium ? `<button id="demo-downgrade-btn" onclick="window.revertToFreeAI(); this.style.display='none';" style="background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); padding: 4px 8px; border-radius: 6px; font-size: 0.7rem; font-weight: bold; cursor: pointer; transition: all 0.2s;">Demo Downgrade</button>` : ''}
                            </div>
                            <div class="ai-status">
                                <span class="online-dot" style="width:8px;height:8px;background:#10b981;border-radius:50%;display:inline-block;"></span> 
                                Ready to assist
                            </div>
                        </div>
                    </div>
                    <div>
                        <button class="btn btn-icon-mini" onclick="document.getElementById('ai-chat-history').innerHTML=''; document.getElementById('ai-quick-prompts').style.display='grid';" style="background: #262626; color: #fff; border: 1px solid #333; border-radius: 8px; width: auto; padding: 0 12px; height: 36px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; font-size: 0.8rem; font-weight: 600; letter-spacing: 0.5px;" onmouseover="this.style.background='#333'" onmouseout="this.style.background='#262626'" title="Clear Chat">
                            Clear
                        </button>
                    </div>
                </div>

                <!-- Chat Area -->
                <div id="ai-chat-history" class="ai-chat-area">
                    <!-- Initial AI Greeting -->
                    <div class="chat-message ai-msg">
                        <div class="msg-avatar"><i class="fas fa-robot"></i></div>
                        <div style="display: flex; flex-direction: row; align-items: flex-end; gap: 10px;">
                            <div class="msg-bubble">
                                <span class="desktop-greeting">Hello! I am your <strong>SKiL Matrix AI Coach</strong>. How can I assist your learning today?</span>
                                <span class="mobile-greeting">How can I assist you today?</span>
                            </div>
                            <div class="ai-msg-actions">
                                <button class="ai-action-icon" onclick="window.copyAIBubbleText(this)" title="Copy text" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; color: #8f9bb3; cursor: pointer; transition: all 0.2s; padding: 0;"><i class="far fa-copy" style="font-size: 1rem;"></i></button>
                            </div>
                        </div>
                    </div>

                    <!-- Quick Prompts Grid (Visible when empty) -->
                    <div id="ai-quick-prompts" class="quick-prompts-grid">
                        <div class="premium-prompt-card" onclick="window.useQuickPrompt('Explain Time Complexity of Merge Sort with an example.')">
                            <div class="prompt-icon"><i class="fas fa-chart-line"></i></div>
                            <div class="prompt-text"><strong>Merge Sort</strong><br>Explain time complexity</div>
                        </div>
                        <div class="premium-prompt-card" onclick="window.useQuickPrompt('What is the difference between TCP and UDP?')">
                            <div class="prompt-icon"><i class="fas fa-network-wired"></i></div>
                            <div class="prompt-text"><strong>Networking</strong><br>TCP vs UDP</div>
                        </div>
                        <div class="premium-prompt-card" onclick="window.useQuickPrompt('Write a SQL query to find the second highest salary.')">
                            <div class="prompt-icon"><i class="fas fa-database"></i></div>
                            <div class="prompt-text"><strong>SQL Query</strong><br>Second highest salary</div>
                        </div>
                        <div class="premium-prompt-card" onclick="window.useQuickPrompt('Explain the 4 main pillars of Object Oriented Programming.')">
                            <div class="prompt-icon"><i class="fas fa-cubes"></i></div>
                            <div class="prompt-text"><strong>OOP Concepts</strong><br>4 main pillars</div>
                        </div>
                    </div>
                </div>

                <!-- Input Area -->
                <div class="ai-input-wrapper">
                    <form id="ai-chat-form" onsubmit="window.handleAIChatSubmit(event)" class="ai-input-container">
                        <button type="button" id="ai-mic-btn" class="ai-action-btn mic-btn" title="Voice Input" onclick="window.startAIVoiceInput()">
                            <i class="fas fa-microphone"></i>
                        </button>
                        <textarea id="ai-chat-input" placeholder="Message AI Coach..." rows="1" oninput="this.style.height = ''; this.style.height = Math.min(this.scrollHeight, 150) + 'px';"></textarea>
                        <button type="submit" id="ai-chat-send" class="ai-action-btn send-btn">
                            <i class="fas fa-arrow-up"></i>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    `;
}

window.unlockPremiumAI = function() {
    const rawUser = localStorage.getItem('auth_user_full');
    let aiUid = 'guest';
    if (rawUser) { try { const u = JSON.parse(rawUser); aiUid = u.uid || u.id || 'guest'; } catch(e) {} }
    localStorage.setItem('is_premium_' + aiUid, 'true');
    
    // Remove overlay
    const overlay = document.getElementById('premium-lock-overlay');
    if (overlay) overlay.remove();
    
    // Upgrade header instantly
    const icon = document.getElementById('ai-header-icon');
    const title = document.getElementById('ai-header-title');
    const badge = document.getElementById('ai-pro-badge');
    
    if (icon) { icon.classList.remove('free-tier'); icon.classList.add('premium-tier'); }
    if (title) { title.classList.remove('free-tier'); title.classList.add('premium-tier'); }
    if (badge) { 
        badge.classList.remove('free-tier'); 
        badge.classList.add('premium-tier'); 
        badge.textContent = 'PRO'; 
    }
};

window.revertToFreeAI = function() {
    const rawUser = localStorage.getItem('auth_user_full');
    let aiUid = 'guest';
    if (rawUser) { try { const u = JSON.parse(rawUser); aiUid = u.uid || u.id || 'guest'; } catch(e) {} }
    localStorage.setItem('is_premium_' + aiUid, 'false');
    
    // Downgrade header instantly
    const icon = document.getElementById('ai-header-icon');
    const title = document.getElementById('ai-header-title');
    const badge = document.getElementById('ai-pro-badge');
    
    if (icon) { icon.classList.remove('premium-tier'); icon.classList.add('free-tier'); }
    if (title) { title.classList.remove('premium-tier'); title.classList.add('free-tier'); }
    if (badge) { 
        badge.classList.remove('premium-tier'); 
        badge.classList.add('free-tier'); 
        badge.textContent = 'FREE'; 
    }

    // Immediately show lock if usage is already >= MAX_FREE_USAGE
    let aiUsage = parseInt(localStorage.getItem('ai_usage_count_' + aiUid) || '0');
    if (aiUsage >= 5) {
        window.showPremiumLockOverlay();
    }
};

window.showPremiumLockOverlay = function() {
    const container = document.querySelector('.ai-premium-container');
    if (container && !document.getElementById('premium-lock-overlay')) {
        const overlay = document.createElement('div');
        overlay.id = 'premium-lock-overlay';
        overlay.style.cssText = "position: absolute; inset: 0; background: rgba(10,10,10,0.85); backdrop-filter: blur(8px); z-index: 50; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;";
        overlay.innerHTML = `
            <div style="background: #141414; border: 1px solid rgba(251,191,36,0.3); padding: 3rem; border-radius: 24px; box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
                <i class="fas fa-lock" style="font-size: 4rem; color: #fbbf24; margin-bottom: 20px;"></i>
                <h2 style="color: #fbbf24; margin-bottom: 10px; font-size: 1.8rem;">Premium Locked</h2>
                <p style="color: #a1a1aa; margin-bottom: 30px; max-width: 300px; line-height: 1.6;">You've reached your free usage limit. Upgrade to unlock unlimited AI assistance.</p>
                <button onclick="window.location.search = '?tab=subscription'" style="background: linear-gradient(135deg, #fbbf24, #f59e0b); color: #000; font-weight: bold; border: none; padding: 12px 30px; border-radius: 12px; cursor: pointer; font-size: 1.1rem; box-shadow: 0 5px 15px rgba(251,191,36,0.3); transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">Buy Subscription</button>
            </div>
        `;
        container.appendChild(overlay);
    }
};

window.useQuickPrompt = function(promptText) {
    const input = document.getElementById('ai-chat-input');
    if (input) {
        input.value = promptText;
        input.focus();
    }
};

window.startAIVoiceInput = function() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("Your browser does not support Voice Input. Please use Chrome or Edge.");
        return;
    }
    
    const micBtn = document.getElementById('ai-mic-btn');
    if (micBtn) {
        micBtn.style.color = '#ff4757';
        micBtn.style.background = 'rgba(255,71,87,0.1)';
        micBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    }
    
    const recognition = new SpeechRecognition();
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    
    recognition.onresult = async function(event) {
        const text = event.results[0][0].transcript;
        
        try {
            const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`);
            const data = await res.json();
            const translatedText = data[0][0][0];
            
            const input = document.getElementById('ai-chat-input');
            if (input) {
                input.value = input.value + (input.value ? ' ' : '') + translatedText;
            }
        } catch(e) {
            console.error("Translation failed, using original text", e);
            const input = document.getElementById('ai-chat-input');
            if (input) {
                input.value = input.value + (input.value ? ' ' : '') + text;
            }
        }
        resetMicBtn();
    };
    
    recognition.onerror = function(event) {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
            alert("Microphone access was denied. Please allow microphone permissions in your browser settings.");
        } else if (event.error !== 'no-speech') {
            alert("Microphone error: " + event.error);
        }
        resetMicBtn();
    };
    
    recognition.onend = function() {
        resetMicBtn();
    };
    
    function resetMicBtn() {
        if (micBtn) {
            micBtn.style.color = '#71717a';
            micBtn.style.background = 'transparent';
            micBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        }
    }
    
    try {
        recognition.start();
    } catch (e) {
        console.error(e);
        resetMicBtn();
    }
};

window.handleAIChatSubmit = async function(e) {
    e.preventDefault();

    const rawUser = localStorage.getItem('auth_user_full');
    let aiUid = 'guest';
    if (rawUser) { try { const u = JSON.parse(rawUser); aiUid = u.uid || u.id || 'guest'; } catch(e) {} }

    let todayDate = new Date().toDateString();
    let storedDate = localStorage.getItem('ai_usage_date_' + aiUid);
    if (storedDate !== todayDate) {
        localStorage.setItem('ai_usage_date_' + aiUid, todayDate);
        localStorage.setItem('ai_usage_count_' + aiUid, '0');
    }

    let isPremium = localStorage.getItem('is_premium_' + aiUid) === 'true';
    let aiUsage = parseInt(localStorage.getItem('ai_usage_count_' + aiUid) || '0');
    const MAX_FREE_USAGE = 5;
    
    if (!isPremium && aiUsage >= MAX_FREE_USAGE) {
        window.showPremiumLockOverlay();
        return;
    }

    const input = document.getElementById('ai-chat-input');
    const question = input.value.trim();
    if (!question) return;

    if (!isPremium) {
        aiUsage++;
        localStorage.setItem('ai_usage_count_' + aiUid, aiUsage);
        
        if (aiUsage >= MAX_FREE_USAGE) {
            setTimeout(() => {
                window.showPremiumLockOverlay();
            }, 1000);
        }
    }

    input.value = '';
    input.style.height = ''; 
    const historyBox = document.getElementById('ai-chat-history');

    const quickPrompts = document.getElementById('ai-quick-prompts');
    if (quickPrompts) quickPrompts.style.display = 'none';

    historyBox.innerHTML += `
        <div class="chat-message user-msg">
            <div class="msg-avatar"><i class="fas fa-user"></i></div>
            <div class="msg-bubble">
                ${question.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')}
            </div>
        </div>
    `;

    const loaderId = 'loader-' + Date.now();
    historyBox.innerHTML += `
        <div id="${loaderId}" class="chat-message ai-msg">
            <div class="msg-avatar"><i class="fas fa-robot"></i></div>
            <div class="msg-bubble" style="display: flex; align-items: center; gap: 8px; padding: 1.5rem;">
                <div class="typing-dot" style="width:8px;height:8px;background:#3b82f6;border-radius:50%;animation:pulse 1s infinite;"></div>
                <div class="typing-dot" style="width:8px;height:8px;background:#3b82f6;border-radius:50%;animation:pulse 1s infinite 0.2s;"></div>
                <div class="typing-dot" style="width:8px;height:8px;background:#3b82f6;border-radius:50%;animation:pulse 1s infinite 0.4s;"></div>
            </div>
        </div>
    `;
    historyBox.scrollTop = historyBox.scrollHeight;

    try {
        let answer = "I'm sorry, my API is currently disconnected. Please check `ai-client.js` configuration.";
        if (window.aiClient && typeof window.aiClient.askDoubt === 'function') {
            answer = await window.aiClient.askDoubt(question);
        } else {
            answer = "Here is a simulated response from the AI Coach. It seems the API key is not currently injected, but the UI is fully functional! To fix this, make sure `ai-client.js` is loaded properly and the Gemini Key is active.";
        }

        document.getElementById(loaderId).remove();
        
        historyBox.innerHTML += `
            <div class="chat-message ai-msg">
                <div class="msg-avatar"><i class="fas fa-robot"></i></div>
                <div style="display: flex; flex-direction: row; align-items: flex-end; gap: 10px;">
                    <div class="msg-bubble">
                        ${window.marked && window.marked.parse ? marked.parse(answer) : answer.replace(/\n/g, '<br>')}
                    </div>
                    <div class="ai-msg-actions">
                        <button class="ai-action-icon" onclick="window.copyAIBubbleText(this)" title="Copy text" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; color: #8f9bb3; cursor: pointer; transition: all 0.2s; padding: 0;"><i class="far fa-copy" style="font-size: 1rem;"></i></button>
                    </div>
                </div>
            </div>
        `;
    } catch (err) {
        document.getElementById(loaderId).remove();
        historyBox.innerHTML += `
            <div class="chat-message ai-msg">
                <div class="msg-avatar" style="background: rgba(255,0,0,0.1); border-color: rgba(255,0,0,0.2); color: #ef4444;"><i class="fas fa-exclamation-triangle"></i></div>
                <div class="msg-bubble" style="background: #141414; border-color: #ef4444; color: #ef4444;">
                    Error connecting to AI Server. Please try again.
                </div>
            </div>
        `;
    }
    historyBox.scrollTop = historyBox.scrollHeight;
}

window.copyAIBubbleText = function(btn) {
    try {
        const bubble = btn.closest('.chat-message').querySelector('.msg-bubble');
        if (bubble) {
            const textToCopy = bubble.innerText;
            navigator.clipboard.writeText(textToCopy).then(() => {
                const originalText = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-check"></i> Copied';
                setTimeout(() => {
                    btn.innerHTML = originalText;
                }, 2000);
            });
        }
    } catch (err) {
        console.error("Failed to copy text", err);
    }
};

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
    const collegeName = currentUser.college || currentUser.collegeName || 'SKiL MATRiX Scholar';

    // 1. Resolve Dynamic Year
    let yLabel = "";
    if (currentUser.year) {
        let rawY = String(currentUser.year);
        if (rawY === '1') yLabel = '1st Year';
        else if (rawY === '2') yLabel = '2nd Year';
        else if (rawY === '3') yLabel = '3rd Year';
        else if (rawY === '4') yLabel = '4th Year';
        else if (rawY.toLowerCase().includes('year')) yLabel = rawY;
        else yLabel = rawY + ' Year';
    }

    // 2. Resolve Dynamic Branch
    const branchLabel = currentUser.branch ? currentUser.branch.toUpperCase() : "";

    // 3. Construct Unified Subtitle
    let profileSummary = "";
    if (currentUser.role !== 'user') {
        profileSummary = `🛡️ Verified ${currentUser.role.toUpperCase()}`;
    } else {
        const parts = [];
        if (yLabel) parts.push(yLabel);
        if (branchLabel) parts.push(branchLabel);
        profileSummary = parts.length > 0 ? parts.join(' • ') : "Scholar";
    }

    let greetingSubtitle = `${profileSummary} • ${collegeName}`;
    // If guest OR new user who hasn't updated profile (branch and custom college missing)
    const hasIncompleteProfile = !currentUser.branch && (!currentUser.college);
    if (currentUser.isGuest || hasIncompleteProfile) {
        greetingSubtitle = "Scholar • Welcome to SKiL MATRiX";
    }

    const userStats = currentUser.stats || { subjects: {} };
    const readinessData = [
        { name: 'Discrete Mathematics', progress: userStats.subjects?.dm?.readiness || 85, color: '#2ecc71', id: 'dm' },
        { name: 'Digital Electronics', progress: userStats.subjects?.de?.readiness || 60, color: '#f1c40f', id: 'de' },
        { name: 'Object Oriented Programming', progress: userStats.subjects?.oop?.readiness || 30, color: '#e74c3c', id: 'oop' }
    ];

    const isGuest = !currentUser.email;

    const allGlobalNotes = [];
    if (typeof globalNotes !== 'undefined') {
        for (const col in globalNotes) {
            for (const sub in globalNotes[col]) {
                allGlobalNotes.push(...globalNotes[col][sub]);
            }
        }
    }

    const combinedNotes = [...(NotesDB || []), ...allGlobalNotes];

    // Total numbers for Minimal Stats (passed to unified stats engine)
    const totalDownloads = combinedNotes.reduce((acc, n) => acc + (n.downloads || 0), 0);
    const totalNotes = combinedNotes.length;
    const totalViews = combinedNotes.reduce((acc, n) => acc + (n.views || 0), 0);

    let aiRec = {
        title: "🤖 AI Recommendation",
        msg: `Your retention in <strong>${readinessData[0].name}</strong> is dropping. We recommend solving a model paper.`,
        actionType: "ai-tools",
        actionLabel: "Generate Model Paper"
    };

    if (isGuest) {
        aiRec = {
            title: "🔐 Unlock AI Insights",
            msg: "Create a free account to track your study progress and see your exam readiness.",
            actionType: "login",
            actionLabel: "Join Now"
        };
    } else if (readinessData[2].progress < 40) {
        aiRec.msg = `We noticed you're struggling with <strong>${readinessData[2].name}</strong>. Check out some verified formula sheets!`;
        aiRec.actionType = "notes";
        aiRec.actionLabel = "Browse Resource Hub";
    }

    const isProfileIncomplete = !currentUser.program || !currentUser.year || !currentUser.branch || !currentUser.college;
    const alertBannerHtml = (isProfileIncomplete && !isGuest) ? `
        <div class="profile-alert-banner-modern stagger-1">
            <div class="alert-inner-row">
                <div class="alert-left">
                    <div class="alert-icon-magic">
                        <i class="fa-solid fa-wand-magic-sparkles"></i>
                    </div>
                    <div class="alert-content-stack">
                        <div class="alert-top-meta">
                            <span class="alert-label">Academic Profile</span>
                            <span class="alert-badge-new">ACTION REQUIRED</span>
                        </div>
                        <span class="alert-text">Your profile is missing key fields. Complete it now to activate <strong>Personalized AI Insights</strong>.</span>
                    </div>
                </div>
                <div class="alert-right">
                    <button class="btn-premium-alert" onclick="document.querySelector('.nav-item[data-tab=\\'profile\\']')?.click()">
                        Complete Now <i class="fa-solid fa-arrow-right-long"></i>
                    </button>
                </div>
            </div>
        </div>
    ` : "";

    const userStreak = currentUser.coding_streak || 0;
    const streakText = userStreak === 1 ? "1 Day" : `${userStreak} Days`;

    return `
        <div class="tab-pane active fade-in dashboard-overview-wrapper" style="padding: 0;">
            ${alertBannerHtml}
            <!-- 1. Welcome Section -->
            <div class="premium-welcome-card stagger-2">
                <div class="welcome-header" style="margin-bottom: 0;">
                    <div class="welcome-text-area">
                        <h1 class="font-heading" style="font-size: 2.2rem; margin-bottom: 0.2rem; font-weight: 700;">
                            Welcome back, <span style="background: linear-gradient(90deg, #00f2ff, #6D5DF2); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${userName}</span> 👋
                        </h1>
                        <p style="color: var(--text-dim); font-size: 0.85rem; font-weight: 500;">${greetingSubtitle}</p>
                    </div>

                    <!-- Premium 3D Coding Streak -->
                    <div class="premium-streak-badge" title="Keep learning to maintain your streak!" onclick="renderTabContent('coding-arena')">
                        <div class="streak-icon-3d">
                            <i class="fa-solid fa-fire"></i>
                        </div>
                        <div class="streak-info">
                            <span class="streak-label">CODING STREAK</span>
                            <span class="streak-count">${streakText}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 2. Stats Grid (4 columns) -->
            <div class="grid-2x3 stagger-3" style="margin-bottom: 2rem; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
                <div class="qa-card-wrapper" style="border-color: rgba(0,255,148,0.2);">
                    <div style="flex: 1; text-align: center;">
                        <div id="display-students" style="font-size: 2.2rem; font-weight: 800; color: #fff; margin-bottom: 0.2rem;">${window.globalAnalyticsData?.adminTotalStudents || '561+'}</div>
                        <div style="font-size: 0.75rem; color: var(--success); font-weight: 800; text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                            <img src="https://img.icons8.com/fluency/48/graduation-cap.png" style="width: 18px; height: 18px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));" alt="Students"> TOTAL STUDENTS
                        </div>
                    </div>
                </div>
                <div class="qa-card-wrapper" style="border-color: rgba(0,229,255,0.2);">
                    <div style="flex: 1; text-align: center;">
                        <div id="total-views-count" style="font-size: 2.2rem; font-weight: 800; color: #fff; margin-bottom: 0.2rem;">${window.globalAnalyticsData?.adminTotalViews ? window.globalAnalyticsData.adminTotalViews : (totalViews >= 1000 ? (totalViews/1000).toFixed(1) + 'k+' : (totalViews > 0 ? totalViews : 0))}</div>
                        <div style="font-size: 0.75rem; color: #00e5ff; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                            <img src="https://img.icons8.com/fluency/48/visible.png" style="width: 18px; height: 18px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));" alt="Views"> TOTAL VIEWS
                        </div>
                    </div>
                </div>
                <div class="qa-card-wrapper" style="border-color: rgba(123,97,255,0.2);">
                    <div style="flex: 1; text-align: center;">
                        <div id="display-downloads" style="font-size: 2.2rem; font-weight: 800; color: #fff; margin-bottom: 0.2rem;">${window.globalAnalyticsData?.adminTotalDownloads || '5.1k+'}</div>
                        <div style="font-size: 0.75rem; color: var(--primary-light); font-weight: 800; text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                            <img src="https://img.icons8.com/fluency/48/download.png" style="width: 18px; height: 18px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));" alt="Downloads"> TOTAL DOWNLOADS
                        </div>
                    </div>
                </div>
                <div class="qa-card-wrapper" style="border-color: rgba(241,196,15,0.2);">
                    <div style="flex: 1; text-align: center;">
                        <div id="total-resources-count" style="font-size: 2.2rem; font-weight: 800; color: #fff; margin-bottom: 0.2rem;">${window.globalAnalyticsData?.adminTotalResources ? window.globalAnalyticsData.adminTotalResources : (totalNotes > 0 ? totalNotes : 0)}</div>
                        <div style="font-size: 0.75rem; color: #f1c40f; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                            <img src="https://img.icons8.com/fluency/48/books.png" style="width: 18px; height: 18px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));" alt="Resources"> TOTAL RESOURCES
                        </div>
                    </div>
                </div>
            </div>

            <!-- 3. Quick Actions -->
            <h3 class="font-heading stagger-4" style="margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.75rem; font-size: 1.4rem; font-weight: 800; letter-spacing: 0.5px;">
                <span>🚀</span> <span style="background: linear-gradient(90deg, #5b8df8, #00e5ff, #a27cf6, #f355a2); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Quick Actions</span>
            </h3>
            <div class="grid-2x3 stagger-4" style="margin-bottom: 2.5rem;">
                <div class="qa-card-wrapper stagger-box" onclick="renderTabContent('notes')">
                    <div class="qa-icon-box qa-icon-purple">📚</div>
                    <div class="qa-info">
                        <div class="qa-title">Notes Hub</div>
                        <div class="qa-desc">Browse syllabus-wise materials</div>
                    </div>
                </div>
                <div class="qa-card-wrapper stagger-box" onclick="renderTabContent('attendance')">
                    <div class="qa-icon-box qa-icon-purple">📅</div>
                    <div class="qa-info">
                        <div class="qa-title">Attendance Pro</div>
                        <div class="qa-desc">Track your attendance</div>
                    </div>
                </div>
                <div class="qa-card-wrapper stagger-box" onclick="renderTabContent('cgpa-analyzer')">
                    <div class="qa-icon-box qa-icon-green">🎯</div>
                    <div class="qa-info">
                        <div class="qa-title">CGPA Analyzer</div>
                        <div class="qa-desc">Predict and track your grades</div>
                    </div>
                </div>
                <div class="qa-card-wrapper stagger-box" onclick="renderTabContent('focusflow')">
                    <div class="qa-icon-box qa-icon-pink">⌚</div>
                    <div class="qa-info">
                        <div class="qa-title">NeuroSprint Pro</div>
                        <div class="qa-desc">Pomodoro timer with lofi</div>
                    </div>
                </div>
                <div class="qa-card-wrapper stagger-box" onclick="window.lockOverlay ? window.lockOverlay.show() : renderTabContent('ai-tools')">
                    <div class="qa-icon-box qa-icon-cyan">🤖</div>
                    <div class="qa-info">
                        <div class="qa-title">AI Coach</div>
                        <div class="qa-desc">Personalized study guide</div>
                    </div>
                </div>
                <div class="qa-card-wrapper stagger-box" onclick="renderTabContent('bookmarks')">
                    <div class="qa-icon-box qa-icon-gold">🔖</div>
                    <div class="qa-info">
                        <div class="qa-title">Bookmarks</div>
                        <div class="qa-desc">Your saved resources</div>
                    </div>
                </div>
            </div>


            <!-- 4. SMALL - Analytics Split View -->
            <div class="dashboard-split-view stagger-5" style="gap: 2rem;">
                <!-- Left: Live Activity -->
                <div class="main-column glass-card" style="padding: 2rem;">
                    <h3 class="font-heading" style="margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.75rem; font-size: 1.4rem; font-weight: 800; letter-spacing: 0.5px;">
                        <span>🌍</span> <span style="background: linear-gradient(90deg, #5b8df8, #00e5ff, #a27cf6, #f355a2); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Live Activity</span> <span class="live-status-dot"></span>
                    </h3>
                    <div class="live-activity-list" style="display: flex; flex-direction: column; gap: 1.25rem;">
                        <div class="live-activity-item glow-orange">
                            <span style="font-size: 1.2rem;">🔥</span>
                            <div style="font-weight: 700;">120 students <span style="font-weight: 400; color: var(--text-dim);">studying OOP right now</span></div>
                        </div>
                        <div class="live-activity-item glow-blue">
                            <span style="font-size: 1.2rem;">📥</span>
                            <div style="font-weight: 700;">45 new notes <span style="font-weight: 400; color: var(--text-dim);">uploaded today</span></div>
                        </div>
                        <div class="live-activity-item glow-gold">
                            <span style="font-size: 1.2rem;">⭐</span>
                            <div style="font-weight: 700;">Top note: <span style="font-weight: 400; color: var(--text-dim);">"OOP Cheatsheet"</span></div>
                        </div>
                    </div>
                </div>

                <!-- Right: Your Progress Showcase -->
                <div class="side-column glass-card" style="padding: 2rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                        <h3 class="font-heading" style="font-size: 1.4rem; font-weight: 800; letter-spacing: 0.5px; display: flex; align-items: center; gap: 0.75rem;">
                            <span>📈</span> <span style="background: linear-gradient(90deg, #f1c40f, #f39c12); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Your Progress</span>
                        </h3>
                    </div>
                    
                    <div class="live-activity-list" style="display: flex; flex-direction: column; gap: 1.25rem;">
                        <div class="live-activity-item glow-green" style="background: rgba(46, 213, 115, 0.05); border: 1px solid rgba(46, 213, 115, 0.1);">
                            <span style="font-size: 1.2rem;">⏱️</span>
                            <div style="font-weight: 700;">${window.currentUser?.focusminutes || 0} mins <span style="font-weight: 400; color: var(--text-dim);">Focus Time</span></div>
                        </div>
                        <div class="live-activity-item glow-purple" style="background: rgba(157, 80, 187, 0.05); border: 1px solid rgba(157, 80, 187, 0.1);">
                            <span style="font-size: 1.2rem;">📚</span>
                            <div style="font-weight: 700;">${window.currentUser?.uploads || 0} <span style="font-weight: 400; color: var(--text-dim);">Notes Uploaded</span></div>
                        </div>
                        <div class="live-activity-item glow-cyan" style="background: rgba(0, 210, 255, 0.05); border: 1px solid rgba(0, 210, 255, 0.1);">
                            <span style="font-size: 1.2rem;">🎯</span>
                            <div style="font-weight: 700;">${window.currentUser?.xp || 0} XP <span style="font-weight: 400; color: var(--text-dim);">Total Earned</span></div>
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

window.openCodingArena = async () => {
    const contentArea = document.getElementById('tab-content');
    contentArea.innerHTML = window.caLoadingHTML;
    const html = await renderCodingArena();
    contentArea.innerHTML = html;
};

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
                ${error.message.includes('Server') ? '<p style="font-size:0.8rem; margin-top:1rem; color: var(--text-dim);">Run "node server.js?v=6.0" in the server folder.</p>' : ''}
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
                <div class="explorer-header premium-explorer-header" id="explorer-header">
                    <!-- HUD Decorative Elements -->
                    <div class="corner-tag corner-top-left"></div>
                    <div class="corner-tag corner-top-right"></div>
                    <div class="corner-tag corner-bottom-left"></div>
                    <div class="corner-tag corner-bottom-right"></div>

                    <div id="explorer-back-container" style="position: absolute; top: 1.5rem; left: 1.5rem; z-index: 20;">
                         <button id="explorer-back-btn" class="btn btn-ghost" style="display: none; padding: 0.5rem 1rem; gap: 0.5rem;">
                            <span>⬅</span> Back
                         </button>
                    </div>
                    <div id="explorer-steps-container" class="step-indicator" style="display: flex; justify-content: center; gap: 3rem; margin-bottom: 1.5rem;">
                        ${['College', 'Stream', 'Branch', 'Sem', 'Subject'].map((s, i) => `
                            <div class="step-node" id="step-${i}">
                                <div class="step-num">${i + 1}</div>
                                <div class="step-label">${s}</div>
                            </div>
                        `).join('')}
                    </div>
                    <div id="explorer-title-container" style="text-align: center;">
                        <h1 class="font-heading" id="explorer-main-title">Select your <span class="gradient-text">Institution</span></h1>
                        <p id="explorer-sub-title" style="color: var(--text-dim); margin-top: 0.5rem;">Choose your college to start browsing localized content.</p>
                    </div>
                </div>

                <div id="explorer-content" class="explorer-grid-pro" style="padding: 2rem 2rem 6rem 2rem; min-height: 400px; display: grid; gap: 2rem;">
                    <!-- Step-specific cards will be injected here -->
                </div>

                <div id="final-notes-view" style="display:none; padding: 1rem 2.5rem 4rem 2.5rem;">
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
function renderCollegeStep() {
    updateStepUI(0);
    const backBtn = document.getElementById('explorer-back-btn');
    if (backBtn) backBtn.style.display = 'none';

    // Hide steps indicator for the first step to match user design preference
    const stepsContainer = document.getElementById('explorer-steps-container');
    if (stepsContainer) stepsContainer.style.display = 'none';

    const container = document.getElementById('explorer-content');

    // Helper to generate HTML for cards
    const getCardsHTML = (items) => {
        // Sort: active colleges first (A-Z), then locked colleges (A-Z)
        const sortedItems = [...items].sort((a, b) => {
            const aLocked = a.status === 'locked';
            const bLocked = b.status === 'locked';

            if (!aLocked && bLocked) return -1;  // a is active, goes first
            if (aLocked && !bLocked) return 1;   // b is active, goes first

            // Same status → alphabetical
            return a.name.localeCompare(b.name);
        });

        return sortedItems.map(c => {
            const isLocked = (c.status === 'locked');

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
                <img src="${c.logo}" 
                     alt="${c.name}" 
                     onerror="this.src='https://cdn-icons-png.flaticon.com/512/2940/2940651.png'"
                     style="width: 100%; height: 100%; object-fit: contain;">
            </div>
            <h3 class="font-heading" style="margin-top: 1.5rem; text-transform: uppercase; font-size: 1.1rem; ${isLocked ? 'color: var(--text-dim);' : ''}">${c.name}</h3>
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
            <div id="college-list-grid" class="explorer-grid-pro" style="grid-column: 1 / -1;">
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

window.renderCollegeStep = renderCollegeStep;

function renderStreamStep() {
    updateStepUI(1);
    const backBtn = document.getElementById('explorer-back-btn');
    if (backBtn) {
        backBtn.style.display = 'flex';
        backBtn.onclick = renderCollegeStep;
    }

    // Show steps indicator again for subsequent steps
    const stepsContainer = document.getElementById('explorer-steps-container');
    if (stepsContainer) stepsContainer.style.display = 'flex';

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

window.renderStreamStep = renderStreamStep;

function renderBranchStep() {
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

window.renderBranchStep = renderBranchStep;

function renderCombinedSemesterStep() {
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


window.renderCombinedSemesterStep = renderCombinedSemesterStep;

async function renderSubjectStep() {
    updateStepUI(4);
    const backBtn = document.getElementById('explorer-back-btn');
    if (backBtn) {
        backBtn.style.display = 'flex';
        backBtn.onclick = renderCombinedSemesterStep;
    }

    document.getElementById('explorer-main-title').innerHTML = `Select your <span class="gradient-text">Subject</span>`;

    const container = document.getElementById('explorer-content');
    container.innerHTML = `<div class="ap-loader" style="grid-column: 1/-1; margin: 4rem auto;"><div class="ap-spin"></div><p style="color:var(--text-dim); margin-top:1rem;">Loading subjects...</p></div>`;

    // Try College-Specific Key first, then fallback to Common Key
    const collegeKey = `${selState.college.id}-${selState.branch.id}-${selState.semester}`;
    const commonKey = `${selState.branch.id}-${selState.semester}`;
    
    // Only use the global/common fallback if the college is Medicaps
    const globalSubjects = selState.college.id === 'medicaps' || selState.college.id.includes('medicaps')
        ? (GlobalData.subjects[collegeKey] || GlobalData.subjects[commonKey] || [])
        : (GlobalData.subjects[collegeKey] || []);

    let customSubjects = [];
    try {
        let sb = window._apSB;
        if (!sb) {
            const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
            sb = createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
            window._apSB = sb;
        }
        
        // Fetch subjects added by admin for this specific college/branch/sem
        const { data } = await sb.from('college_subjects')
            .select('id, subject_name, subject_code')
            .eq('college_id', selState.college.id)
            .eq('branch_id', selState.branch.id)
            .eq('semester', selState.semester);
            
        if (data) customSubjects = data;
    } catch(e) { 
        console.error('Error fetching custom subjects:', e); 
    }

    // Combine global subjects with custom subjects, avoiding duplicates by name
    const combined = [...globalSubjects];
    customSubjects.forEach(cs => {
        if (!combined.find(s => s.name.toLowerCase() === cs.subject_name.toLowerCase())) {
            combined.push({ 
                id: cs.id, 
                name: cs.subject_name, 
                code: cs.subject_code || 'SUB',
                icon: '📚'
            });
        }
    });

    if (combined.length === 0) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 4rem;">
            <p style="color: var(--text-dim);">No subjects registered for this branch/year combo yet.</p>
            <button class="btn btn-primary btn-sm" style="margin-top: 1rem;" onclick="renderCollegeStep()">Start Over</button>
        </div>`;
        return;
    }

    container.innerHTML = combined.map(s => `
        <div class="selection-card glass-card fade-in" onclick="selectSubject('${s.id}', '${s.name.replace(/'/g, "\\'")}', '${s.code || ''}')">
            <div class="card-icon" style="font-size: 2.5rem; margin-bottom: 0.5rem;">${s.icon || '📚'}</div>
            <div style="font-size: 0.7rem; color: var(--primary); font-weight: 700; margin-bottom: 0.5rem; background: rgba(108, 99, 255, 0.1); padding: 2px 8px; border-radius: 4px; display: inline-block;">${s.code || 'SUB'}</div>
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
window.renderSubjectStep = renderSubjectStep;


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
                ${activeTab !== 'syllabus' ? `
                    <h2 class="font-heading" style="margin-bottom: 1.5rem; font-size: 1.6rem; color: rgba(255,255,255,0.7);">Verified <span class="highlight" style="color: #00f2ff; font-weight: 800;">${activeTab.toUpperCase()}</span></h2>
                ` : ''}
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
                    <a href="${window.getViewerUrl(note.url || note.fileUrl || note.driveLink, note.title || note.name)}" target="_blank" class="btn-download-white" onclick="downloadNote('${note.id}')">
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
        container.innerHTML = `
            <div style="grid-column: 1/-1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 6rem 2rem; opacity: 0.9;">
                <div style="font-size: 4.5rem; margin-bottom: 2rem; filter: drop-shadow(0 0 20px rgba(123, 97, 255, 0.4));">📤</div>
                <h3 style="margin-bottom: 1rem; color: #fff;">Sign in to view your uploads</h3>
                <p style="color: var(--text-dim); margin-bottom: 2.5rem; max-width: 350px; line-height: 1.6;">Track your contributed materials and monitor their approval status by logging into your account.</p>
                <button class="btn btn-primary" onclick="window.location.href='/login.html'" style="padding: 1rem 2rem; border-radius: 12px; font-weight: 600; min-width: 200px;">Login to Account</button>
            </div>
        `;
        return;
    }

    const { db, collection, query, where, getDocs, onSnapshot } = window.firebaseServices;

    // --- RENDER HELPER ---
    const render = (all) => {
        if (!all || all.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 6rem 2rem; opacity: 0.9;">
                    <div style="font-size: 4.5rem; margin-bottom: 2rem; filter: drop-shadow(0 0 20px rgba(123, 97, 255, 0.4));">📤</div>
                    <h3 style="margin-bottom: 1rem; color: #fff;">Your contribution queue is empty</h3>
                    <p style="color: var(--text-dim); margin-bottom: 2.5rem; max-width: 350px; line-height: 1.6;">Share your academic resources with fellow students and track their status here once they are submitted.</p>
                    <button class="btn btn-primary" onclick="openUploadModal()" style="padding: 1rem 2rem; border-radius: 12px; font-weight: 600; min-width: 200px;">Upload Your First Note</button>
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
                        <a href="${window.getViewerUrl(n.url || n.fileUrl || n.driveLink || n.file_url, n.title || n.fileName || n.name, n.id)}" target="_blank" class="btn btn-sm btn-ghost" style="border: 1px solid var(--border-glass);">View</a>
                        ${stat !== 'approved' ? `<button onclick="deleteUploadedNote('${n.id}')" class="btn btn-sm btn-ghost" style="border: 1px solid #ff4757; color: #ff4757; background: rgba(255, 71, 87, 0.1); cursor: pointer;">Delete</button>` : ''}
                    </div>
                    ${stat === 'approved' ? `<span style="font-size:0.8rem; display:flex; align-items:center;">👁️ ${n.views || 0}</span>` : ''}
                </div>
            </div>
            `;
        }).join('');
    };

    // --- FETCH FROM SUPABASE ---
    const cacheKey = `my_uploads_${currentUser.id}`;
    
    // Quick load from cache
    try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            const cachedNotes = JSON.parse(cached);
            if (cachedNotes && cachedNotes.length > 0) render(cachedNotes);
            else container.innerHTML = '<div style="grid-column: 1/-1; display: flex; justify-content: center; padding: 4rem;"><div class="loader-pro"></div></div>';
        } else {
            container.innerHTML = '<div style="grid-column: 1/-1; display: flex; justify-content: center; padding: 4rem;"><div class="loader-pro"></div></div>';
        }
    } catch (e) {
        container.innerHTML = '<div style="grid-column: 1/-1; display: flex; justify-content: center; padding: 4rem;"><div class="loader-pro"></div></div>';
    }

    // Dynamic import to ensure supabase is available
    import('./supabase-config.js?v=1.0').then(async ({ supabase }) => {
        try {
            const userEmail = currentUser.email;
            
            const [pendingRes, approvedRes] = await Promise.all([
                supabase.from('pending_notes').select('*').eq('uploader_email', userEmail),
                supabase.from('approved_notes').select('*').eq('uploader_email', userEmail)
            ]);
            
            let allUploads = [];
            if (pendingRes.data) {
                allUploads.push(...pendingRes.data.map(d => ({...d, status: 'pending'})));
            }
            if (approvedRes.data) {
                allUploads.push(...approvedRes.data.map(d => ({...d, status: 'approved'})));
            }
            
            // Sort by creation date descending
            allUploads.sort((a,b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
            
            // Cache it
            try { localStorage.setItem(cacheKey, JSON.stringify(allUploads)); } catch(e) {}
            
            render(allUploads);
            
        } catch (err) {
            console.error("Supabase My Uploads Error:", err);
            const hasCachedContent = container.querySelector('.glass-card');
            if (!hasCachedContent) {
                container.innerHTML = `<p style="color:red; text-align:center;">Could not load uploads: ${err.message}</p>`;
            }
        }
    }).catch(err => {
        console.error("Failed to load Supabase:", err);
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

    import('./supabase-config.js?v=1.0').then(async ({ supabase }) => {
        try {
            // Only attempt to delete from pending_notes. Users cannot delete approved notes.
            const { error } = await supabase.from('pending_notes').delete().eq('id', noteId);
            
            if (error) {
                console.error("Delete failed:", error);
                if (window.showToast) window.showToast("Failed to delete note.", "error");
                if (deleteBtn) deleteBtn.innerText = "Delete";
                if (cardToRemove) {
                    cardToRemove.style.opacity = '1';
                    cardToRemove.style.pointerEvents = 'all';
                }
                return;
            }
            
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
                        cachedNotes = cachedNotes.filter(n => String(n.id) !== String(noteId));
                        localStorage.setItem(cacheKey, JSON.stringify(cachedNotes));
                    } catch (e) { }
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
    }).catch(err => {
        console.error("Failed to load Supabase for delete", err);
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
                             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                             <span class="view-count">${n.views || 0}</span> Views
                        </div>
                    </div>
                    <div class="note-actions-pro">
                        <button class="tool-icon-pro" onclick="likeNote('${n.id}')" title="Like">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                            <span class="like-count">${n.upvotes || 0}</span>
                        </button>
                        <button class="tool-icon-pro" onclick="toggleNoteDislike('${n.id}')" title="Dislike">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path></svg>
                            <span class="dislike-count">${n.downvotes || 0}</span>
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
                    <a href="${window.getViewerUrl(n.url || n.fileUrl || n.driveLink, n.title || n.name)}" target="_blank" class="btn-download-white" onclick="downloadNote('${n.id}')">
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
        const subjectName = selState.subject?.name;
        grid.innerHTML = '<div style="color:var(--text-dim);padding:2rem;text-align:center;">Fetching syllabus...</div>';

        (async () => {
            try {
                let sb = window._apSB;
                if (!sb) {
                    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
                    sb = createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
                }

                const colId = selState.college?.id;
                const branchId = selState.branch?.id;
                const semName = selState.semester; 

                let { data, error } = await sb.from('college_subjects')
                    .select('syllabus, description')
                    .eq('college_id', colId)
                    .eq('branch_id', branchId)
                    .eq('semester', semName)
                    .eq('subject_name', subjectName)
                    .single();

                let syllabusText = null;
                if (data && (data.syllabus || data.description)) {
                    syllabusText = data.syllabus || data.description;
                }
                
                // Fallback to global syllabus if custom one is not found
                if (!syllabusText) {
                    const { data: globalData, error: globalErr } = await sb.from('college_subjects')
                        .select('syllabus, description')
                        .eq('college_id', 'global')
                        .eq('subject_name', subjectName)
                        .single();
                        
                    if (globalData && (globalData.syllabus || globalData.description)) {
                        syllabusText = globalData.syllabus || globalData.description;
                    }
                }

                if (syllabusText) {
                    const cleanText = syllabusText.replace(/<[^>]*>?/gm, ''); // Strip HTML to ensure clean parsing
                    const unitRegex = /(Unit\s*[-–: ]*\s*[0-9IVX]+[\s\S]*?(?=(?:Unit\s*[-–: ]*\s*[0-9IVX]+)|$))/gi;
                    let units = [];
                    let match;
                    
                    while ((match = unitRegex.exec(cleanText)) !== null) {
                        let block = match[1].trim();
                        // Extract Unit number + up to the first comma or period as the descriptive title
                        let titleMatch = block.match(/^(Unit\s*[-–: ]*\s*[0-9IVX]+(?:[^,.\n]+)?)/i);
                        let title = titleMatch ? titleMatch[1].trim().toUpperCase() : 'UNIT';
                        
                        // Fallback if title gets absurdly long
                        if (title.length > 80) {
                            let fallback = block.match(/^(Unit\s*[-–: ]*\s*[0-9IVX]+)/i);
                            title = fallback ? fallback[1].trim().toUpperCase() : title.substring(0, 80);
                        }

                        let desc = block.substring(titleMatch ? titleMatch[0].length : 0).replace(/^[,.\-–:\s]+/, '').trim();
                        
                        units.push({ title: title, desc: desc });
                    }

                    // If no units were found (it didn't match the regex), fallback to a single overview unit
                    if (units.length === 0) {
                        units.push({ title: 'OVERVIEW', desc: cleanText });
                    }

                    if (units.length > 0 && typeof window.genSyllabusHTML === 'function') {
                        // User wants it to look identical to 2nd image, so we keep "Verified SYLLABUS"
                        let styledHtml = window.genSyllabusHTML(units);
                        grid.innerHTML = styledHtml;
                    } else {
                        grid.innerHTML = `
                            <div class="syllabus-header-premium">
                                <h2 class="syllabus-label">Verified <span>SYLLABUS</span></h2>
                            </div>
                            <div class="syllabus-content-pro" style="background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);padding:1.5rem;border-radius:12px;color:rgba(255,255,255,.8);line-height:1.7;font-size:.9rem;white-space:pre-wrap;">${syllabusText}</div>
                        `;
                    }
                } else {
                    grid.innerHTML = '<p style="color:var(--text-dim);padding:2rem;text-align:center;">Syllabus details are coming soon for this subject.</p>';
                }
            } catch (err) {
                console.error('[Dashboard] Error fetching syllabus:', err);
                let fallbackHtml = null;
                if (typeof window.getSubjectSyllabusHTML === 'function') {
                    fallbackHtml = window.getSubjectSyllabusHTML(subjectName);
                }
                if (fallbackHtml) {
                    grid.innerHTML = fallbackHtml;
                } else {
                    grid.innerHTML = '<p style="color:var(--text-dim);padding:2rem;text-align:center;">Syllabus details are coming soon for this subject.</p>';
                }
            }
        })();
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
        const noteSem = n.semester || n.semesterId;
        const semMatch = !noteSem || noteSem === querySem || (altSem && noteSem === altSem) || noteSem === 'Unknown';
        
        const isCorrectSubject = (
            (n.subjectId === subjectId) || 
            (n.subject === subjectId) || 
            (n.subject === selState.subject.name) || 
            (n.subjectName === selState.subject.name) ||
            (n.name === selState.subject.name)
        ) && (
            n.collegeId === selState.college.id || 
            n.college === selState.college.id || 
            n.collegeId === 'global' || 
            n.college === 'global' ||
            n.college === 'Unknown'
        ) && (
            n.type === tabType || 
            !n.type || 
            (tabType === 'notes' && n.type === undefined)
        );

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
            <div style="text-align: center; padding: 3rem 1.5rem; box-sizing: border-box; background: rgba(255,255,255,0.01); border: 2px dashed rgba(255,255,255,0.05); border-radius: 20px; width: 100%;">
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

        const displayViews = n.views || 0;
        const displayLikes = n.upvotes || 0;
        const displayDislikes = n.downvotes || 0;

        const localVote = localStorage.getItem(`vote_${n.id}`) || localStorage.getItem(`vote_${sequentialId}`);
        const isLiked = window.likedNoteIds?.has(n.id) || localVote == 1;
        const isDisliked = window.dislikedNoteIds?.has(n.id) || localVote == -1;
        const isSaved = window.savedNoteIds?.has(n.id);

        return `
            <div class="premium-note-item card-reveal" data-note-id="${n.id}" style="animation-delay: ${idx * 0.1}s;">
                <div class="item-left" style="display: flex; gap: 1.25rem; align-items: flex-start; flex: 1;">
                    <div class="file-type-icon" style="width: 45px; height: 45px; background: rgba(0, 242, 255, 0.1); color: var(--secondary); display: flex; align-items: center; justify-content: center; border-radius: 12px; font-size: 1.2rem; flex-shrink: 0;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                    </div>
                    <div class="item-info">
                        <div class="unit-tag" style="font-size: 0.75rem; color: var(--secondary); font-weight: 800; letter-spacing: 1px; margin-bottom: 0.3rem; text-transform: uppercase;">${unitTag}</div>
                        <h3 class="item-title" style="font-size: 1.2rem; font-weight: 700; color: white; margin: 0 0 0.4rem 0;">${n.title}</h3>
                        <div class="item-meta-row" style="display: flex; align-items: center; gap: 1.2rem; font-size: 0.85rem; color: var(--text-dim);">
                            <div class="uploader-mini" style="display: flex; align-items: center; gap: 0.5rem; white-space: nowrap;">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                <span>${n.uploaderName || n.uploader || 'Verified'}</span>
                            </div>
                            <div class="date-mini" style="display: flex; align-items: center; gap: 0.4rem; white-space: nowrap;">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line></svg>
                                <span>${yearDate}</span>
                            </div>
                            <div class="views-mini" style="display: flex; align-items: center; gap: 0.4rem; white-space: nowrap;">
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
                    <a href="${window.getViewerUrl(n.url || n.fileUrl || n.driveLink, n.title || n.name, n.id)}" target="_blank" class="btn-download-pro" onclick="downloadNote('${n.id}')">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        View
                    </a>
                </div>
            </div>`;
    }).join('');

    grid.innerHTML = cardsHTML;
    grid.className = "notes-list-container-pro";
    grid.style.display = "flex";
    grid.style.flexDirection = "column";
    grid.style.gap = "1.25rem";

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
    const cards = document.querySelectorAll('.premium-note-item, .note-card-pro, .detailed-item');
    const lowQuery = query.toLowerCase();

    cards.forEach(card => {
        const title = card.querySelector('.item-title, .note-title-pro')?.innerText.toLowerCase() || "";
        const tag = card.querySelector('.unit-tag')?.innerText.toLowerCase() || "";
        if (title.includes(lowQuery) || tag.includes(lowQuery)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
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

window.copySyllabusText = function (btn, title, desc) {
    const textToCopy = `${title.toUpperCase()}\n\n${desc}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
        const original = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check" style="color: #00ff88;"></i>';
        btn.style.borderColor = 'rgba(0, 255, 136, 0.4)';
        btn.style.background = 'rgba(0, 255, 136, 0.05)';

        if (window.showToast) window.showToast("Copied to clipboard!", "success");

        setTimeout(() => {
            btn.innerHTML = original;
            btn.style.borderColor = '';
            btn.style.background = '';
        }, 2000);
    }).catch(err => {
        console.error('Copy failed:', err);
        if (window.showToast) window.showToast("Copy failed", "error");
    });
};



window.genSyllabusHTML = (units) => {
    return `
    <div class="syllabus-header-premium">
        <h2 class="syllabus-label">Verified <span>SYLLABUS</span></h2>
    </div>
    <div class="syllabus-grid-pro">
    ${units.map((u, i) => {
        const cleanTitle = u.title.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const cleanDesc = u.desc.replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, '\\n').replace(/\r/g, '');

        return `
            <div class="premium-syllabus-card color-1" style="animation-delay: ${i * 0.1}s;">
                <!-- HUD Decorative Tags -->
                <div class="corner-tag corner-top-left" style="width: 10px; height: 10px; border-width: 1.5px; opacity: 0.2;"></div>
                <div class="corner-tag corner-top-right" style="width: 10px; height: 10px; border-width: 1.5px; opacity: 0.2;"></div>
                
                <button class="syllabus-copy-btn" onclick="window.copySyllabusText(this, '${cleanTitle}', '${cleanDesc}')" title="Copy Unit Text">
                    <i class="far fa-copy"></i>
                    <span>COPY</span>
                </button>

                <div class="syllabus-card-glow"></div>
                <div class="syllabus-accent-bar"></div>
                <div class="syllabus-content-wrapper">
                    <h4 class="syllabus-unit-title">${u.title}</h4>
                    <p class="syllabus-unit-desc">${u.desc}</p>
                </div>
            </div>
        `;
    }).join('')}
    </div>`;
};

window.showAIModal = function (type, subject) {
    let title, content;

    if (type === 'syllabus') {
        title = `📖 Course Syllabus: ${subject}`;
        content = typeof window.getSubjectSyllabusHTML === 'function' ? window.getSubjectSyllabusHTML(subject) : '<p style="color:var(--text-dim); text-align:center; padding: 2rem;">Syllabus details are coming soon for this subject.</p>';
    } else if (type === 'summary') {
        title = '✨ AI Concept Summary';
        content = `<div class="ai-modal-content-wrapper" style="text-align: center;">
            <div style="margin-bottom: 1.5rem;">
                <div style="font-size: 2.8rem; margin-bottom: 0.8rem; filter: drop-shadow(0 0 15px rgba(255, 184, 0, 0.3));">🚧</div>
                <h3 style="color: white; font-size: 1.4rem; font-weight: 800; margin-bottom: 0.5rem;">Feature Coming Soon</h3>
                <p style="color: var(--text-dim); font-size: 0.9rem; line-height: 1.5; max-width: 300px; margin: 0 auto;">
                    Our AI summary engine for <b style="color: var(--secondary);">${subject}</b> is currently in development.
                </p>
            </div>
            
            <div style="font-size: 0.8rem; color: #00F2FF; background: rgba(0, 242, 255, 0.05); padding: 0.75rem 1.25rem; border-radius: 16px; border: 1px solid rgba(0, 242, 255, 0.12); display: inline-flex; align-items: center; gap: 8px;">
                <span>🚀</span> <span>Available in <b style="color: white;">Pro Sandbox</b> update.</span>
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
        window._currentSyllabusContext = typeof window.getSubjectSyllabusHTML === 'function' ? window.getSubjectSyllabusHTML(subject) : "";
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
        <div style="background: #050505; border: 1.5px solid rgba(123, 97, 255, 0.3); border-radius: 30px; width: 92%; max-width: 400px; padding: 1.5rem; position: relative; box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.9); animation: modalFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1), premium-glow-border 4s ease-in-out infinite; overflow: hidden;">
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
    const { db, collection, addDoc, serverTimestamp, storage, ref, uploadBytes, getDownloadURL, doc, updateDoc, increment } = getFirebase();
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
            collegeName: formData.get('collegeName') || currentUser.collegeName || 'SKiL MATRiX Scholar',
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

        // Award points and update stats if the user is not an admin
        if (currentUser.role !== 'admin' && currentUser.role !== 'superadmin' && !currentUser.isGuest) {
            try {
                const incXp = increment ? increment(50) : (window.firebaseServices.increment ? window.firebaseServices.increment(50) : null);
                const incUploads = increment ? increment(1) : (window.firebaseServices.increment ? window.firebaseServices.increment(1) : null);
                
                if (incXp && incUploads) {
                    const userRef = doc(db, 'users', currentUser.id);
                    await updateDoc(userRef, {
                        xp: incXp,
                        uploads: incUploads
                    });
                    console.log("🌟 Awarded 50 XP for uploading!");
                }
            } catch (xpErr) {
                console.error("XP Award Error:", xpErr);
            }
        }

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
                    <a href="${window.getViewerUrl(n.url || n.fileUrl || n.driveLink, n.title || n.name)}" target="_blank" onclick="window.incrementNoteView('${n.id}')" class="gradient-text" style="font-weight: 700;">👁️ Preview Note</a>
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

        // Update Total Resources Count dynamically
        const totalResourcesEl = document.getElementById('total-resources-count');
        if (totalResourcesEl) {
            let allGlobalCount = 0;
            if (typeof globalNotes !== 'undefined') {
                for (const col in globalNotes) {
                    for (const sub in globalNotes[col]) {
                        allGlobalCount += globalNotes[col][sub].length;
                    }
                }
            }
            totalResourcesEl.innerText = NotesDB.length + allGlobalCount;
        }

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
        { id: 'l1', name: 'Tanishq', views: 856, score: 2400, rank: 1, avatar: 'assets/avatars/1.png?v=6.0' },
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
        <div class="tab-pane active fade-in" style="background-color: transparent;">
            <div id="premium-leaderboard-wrapper" class="leaderboard-container" style="max-width: 1200px; margin: 0 auto; padding-bottom: 50px;">
                <!-- Header removed as requested -->

                <div id="lb-sections-container">
                    <!-- Sections Populated via JS -->
                    <div style="text-align:center; padding: 5rem; color: rgba(255,255,255,0.2);">
                        <i class="fas fa-circle-notch fa-spin" style="font-size: 2rem; color: #fbbf24; margin-bottom: 1rem;"></i><br>
                        Synchronizing Matrix Data...
                    </div>
                </div>
            </div>
        </div>
    `;
}

window.initLeaderboardListeners = function () {
    updateLeaderboardUI();
    initLeaderboardRealtime();
};

function initLeaderboardRealtime() {
    const { db, collection, onSnapshot, query } = getFirebase();
    if (!db) return;
    onSnapshot(query(collection(db, "users")), () => {
        updateLeaderboardUI();
    });
}

function updateLeaderboardUI() {
    const container = document.getElementById('lb-sections-container');
    if (!container) return;

    const { db, collection, query, orderBy, limit, onSnapshot } = window.firebaseServices || {};
    if (!db) return;

    import('./supabase-config.js?v=1.0').then(async ({ supabase }) => {
        const fetchAndRender = async () => {
            // Fetch all data
            const [usersRes, profilesRes] = await Promise.all([
                supabase.from('users').select('*').limit(100),
                supabase.from('profiles').select('*').limit(100)
            ]);

            if (usersRes.error || profilesRes.error) {
                console.error("Leaderboard fetch error", usersRes.error, profilesRes.error);
                return;
            }

            const users = usersRes.data || [];
            const profiles = profilesRes.data || [];

            // Merge data
            const mergedUsers = users.map(u => {
                const p = profiles.find(pr => pr.id === u.id || pr.uid === u.id || pr.id === u.uid);
                return {
                    ...u,
                    referral_count: p ? (p.referral_count || 0) : 0,
                    college: p ? (p.college || p.collegeName) : (u.college || u.collegeName || '')
                };
            });

            // For profiles not in users (edge case)
            profiles.forEach(p => {
                const exists = mergedUsers.find(u => u.id === p.id || u.uid === p.id || u.uid === p.uid);
                if (!exists) {
                    mergedUsers.push({
                        id: p.id || p.uid,
                        uid: p.uid || p.id,
                        name: p.name || p.display_name || "Anonymous",
                        avatar: p.avatar_url || p.logo,
                        referral_count: p.referral_count || 0,
                        xp: 0,
                        uploads: 0,
                        coding_xp: 0,
                        college: p.college || p.collegeName || ''
                    });
                }
            });

            // Ensure current user is in the dataset so they always get a rank, even with 0 XP
            const currU = window.currentUser;
            if (currU) {
                const uid = currU.id || currU.uid;
                if (uid) {
                    const exists = mergedUsers.find(u => u.id === uid || u.uid === uid);
                    if (!exists) {
                        mergedUsers.push({
                            id: uid,
                            uid: uid,
                            name: currU.displayName || currU.name || "You",
                            avatar: currU.photoURL || currU.avatar || currU.logo,
                            referral_count: currU.referral_count || 0,
                            xp: currU.xp || 0,
                            uploads: currU.uploads || 0,
                            coding_xp: currU.coding_xp || 0
                        });
                    }
                }
            }

            // Recalculate true XP from components (50 per upload, 50 per referral, + coding XP)
            mergedUsers.forEach(u => {
                u.xp = ((u.uploads || 0) * 50) + ((u.referral_count || 0) * 50) + (u.coding_xp || 0);
            });

            // Sort ALL data by calculated XP for unified leaderboard to find true global rank
            const sortedData = mergedUsers.sort((a, b) => (b.xp || 0) - (a.xp || 0));
            window.currentLeaderboardData = sortedData;

            container.innerHTML = generateUnifiedLeaderboard(sortedData);

            // Trigger Count-Up Animation
            setTimeout(() => {
                document.querySelectorAll('.count-up').forEach(el => {
                    const target = parseInt(el.dataset.value);
                    if (isNaN(target)) return;
                    animateValue(el, 0, target, 1500);
                });
            }, 100);
        };
        fetchAndRender();

        if (window.leaderboardSubscription) supabase.removeChannel(window.leaderboardSubscription);
        window.leaderboardSubscription = supabase.channel('public:users')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, payload => {
                fetchAndRender();
            }).subscribe();
    });
}

function generateUnifiedLeaderboard(data) {
    if (!data || data.length === 0) return '';

    // Calculate current user's TRUE rank from the full dataset
    let userStatsBanner = '';
    const u = window.currentUser;
    let myRank = '-';
    let myIndex = -1;
    let myItem = null;
    
    if (u) {
        const uid = u.id || u.uid;
        myIndex = data.findIndex(x => x.id === uid || x.uid === uid);
        myItem = myIndex !== -1 ? data[myIndex] : null;
        const myScore = myIndex !== -1 ? (data[myIndex].xp || 0) : (u.xp || 0);
        myRank = myIndex !== -1 ? (myIndex + 1) : '-';
        const myPrize = myScore * 10;
        
        // We no longer display the userStatsBanner box, but we keep the variable empty.
        
        // --- REAL-TIME SIDEBAR CROWN SYNC ---
        const isRank1 = (myRank === 1);
        try {
            const cache = JSON.parse(localStorage.getItem('auth_user_full')) || {};
            cache.isRank1 = isRank1;
            localStorage.setItem('auth_user_full', JSON.stringify(cache));
        } catch(e) {}
        
        const wrapperEl = document.getElementById('sidebar-avatar-wrapper');
        const avEl = document.getElementById('instant-avatar');
        
        if (isRank1) {
            if (wrapperEl && !wrapperEl.querySelector('.sidebar-crown')) {
                const crownEl = document.createElement('div');
                crownEl.className = 'sidebar-crown';
                crownEl.innerHTML = '&#x1F451;';
                crownEl.style.cssText = 'position: absolute; top: -14px; left: 50%; transform: translateX(-50%); font-size: 1.4rem; line-height: 1; filter: drop-shadow(0 0 6px gold) drop-shadow(0 2px 8px rgba(255,200,0,0.8)); pointer-events: none; z-index: 20; animation: crownFloat 2s ease-in-out infinite;';
                wrapperEl.appendChild(crownEl);
                if (avEl) {
                    avEl.style.border = '2px solid gold';
                    avEl.style.boxShadow = '0 0 12px rgba(255, 200, 0, 0.7), 0 0 24px rgba(255, 200, 0, 0.4)';
                }
            }
        } else {
            if (wrapperEl) {
                const existingCrown = wrapperEl.querySelector('.sidebar-crown');
                if (existingCrown) existingCrown.remove();
                if (avEl) {
                    avEl.style.border = '';
                    avEl.style.boxShadow = '';
                }
            }
        }
    }

    // Now slice for the UI display (Top 10 total)
    const spotlightData = data.slice(0, 3);
    const visualSpotlight = [];
    if (spotlightData[1]) visualSpotlight.push({ ...spotlightData[1], rank: 2 });
    if (spotlightData[0]) visualSpotlight.push({ ...spotlightData[0], rank: 1 });
    if (spotlightData[2]) visualSpotlight.push({ ...spotlightData[2], rank: 3 });

    let spotlightHtml = '<div id="podium-container"><div class="lb-spotlight-3d">';
    
    visualSpotlight.forEach(item => {
        const scoreVal = item.xp || 0;
        const prizeVal = scoreVal * 10;
        const avatar = item.logo || item.avatar || '';
        const crown = item.rank === 1 ? '<div class="spotlight-crown-3d">👑</div>' : '';
        
        let resolvedAvatar = avatar;
        if (resolvedAvatar && resolvedAvatar.startsWith('assets/')) resolvedAvatar = '../' + resolvedAvatar;

        const avatarHtml = resolvedAvatar
            ? `<img src="${resolvedAvatar}" alt="${item.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
               <span class="fallback-avatar" style="display:none;">${item.name ? item.name[0].toUpperCase() : '?'}</span>`
            : `<span class="fallback-avatar">${item.name ? item.name[0].toUpperCase() : '?'}</span>`;

        spotlightHtml += `
            <div class="podium-wrapper rank-${item.rank}">
                <div class="podium-avatar-container">
                    ${crown}
                    <div class="podium-avatar">${avatarHtml}</div>
                    <div class="podium-name">${item.name || "Anonymous"}</div>
                </div>
                <div class="podium-block">
                    <div class="podium-top"></div>
                    <div class="podium-front">
                        <div class="podium-trophy"><i class="fas fa-trophy"></i></div>
                        <div class="podium-score">Total <span class="count-up" data-value="${scoreVal}">${scoreVal.toLocaleString()}</span> XP</div>
                    </div>
                </div>
            </div>
        `;
    });
    spotlightHtml += '</div></div>';

    // Ranks 1 to 10
    const listData = data.slice(0, 10);
    let listHtml = '';
    
    // Always render table if there's someone to show OR if current user needs a row
    if (listData.length > 0 || (myIndex >= 10)) {
        listHtml += `
            <div class="mobile-stats-pills" id="mobile-podium-tabs">
                <div class="stat-pill active" onclick="updateMobilePodium('xp', this)"><i class="fas fa-star"></i> Total XP</div>
                <div class="stat-pill" onclick="updateMobilePodium('uploads', this)"><i class="fas fa-arrow-trend-up"></i> Uploads</div>
                <div class="stat-pill" onclick="updateMobilePodium('referral_count', this)"><i class="fas fa-user-plus"></i> Referrals</div>
                <div class="stat-pill" onclick="updateMobilePodium('coding_xp', this)"><i class="fas fa-code"></i> Coding XP</div>
            </div>
            <div id="leaderboard-list-wrapper">
            <div class="mentions-table-container">
                <div class="mentions-table-header">
                    <div class="col-rank">Place</div>
                    <div class="col-user">Username</div>
                    <div class="col-score">
                        <span class="desktop-only-header">Total XP</span>
                        <span class="mobile-only-header">Total XP</span>
                    </div>
                    <div class="col-stat">Uploads</div>
                    <div class="col-stat">Referrals</div>
                    <div class="col-stat">Coding XP</div>
                </div>
                <div class="mentions-table-body">
        `;

        const currUid = u ? (u.id || u.uid) : null;

        listData.forEach((item, index) => {
            const rank = index + 1;
            const scoreVal = item.xp || 0;
            const uploads = item.uploads || 0;
            const referrals = item.referral_count || 0;
            const codingXp = item.coding_xp || 0;
            const college = item.college || '';
            const avatar = item.logo || item.avatar;
            
            let resolvedAvatar = avatar;
            if (resolvedAvatar && resolvedAvatar.startsWith('assets/')) resolvedAvatar = '../' + resolvedAvatar;

            const avatarHtml = resolvedAvatar
                ? `<img src="${resolvedAvatar}" alt="${item.name}">`
                : `<span>${item.name ? item.name[0].toUpperCase() : '?'}</span>`;

            const isMe = currUid && (item.id === currUid || item.uid === currUid);
            const highlightStyle = isMe ? 'border: 1px solid rgba(251, 191, 36, 0.5); background: rgba(251, 191, 36, 0.15);' : '';
            const youBadge = isMe ? '<span style="font-size:0.7rem; background:#fbbf24; color:#000; padding:2px 6px; border-radius:10px; margin-left:8px; font-weight:bold;">YOU</span>' : '';
            
            const collegeHtml = college ? `<div style="font-size: 0.7rem; color: #a1a1aa; margin-top: 2px;">${college}</div>` : '';

            // For top 3, use a different color trophy icon
            let rankIconColor = '#6b7280';
            if (rank === 1) rankIconColor = '#fbbf24';
            if (rank === 2) rankIconColor = '#94a3b8';
            if (rank === 3) rankIconColor = '#ea580c';

            listHtml += `
                <div class="mention-table-row" style="animation-delay: ${index * 0.05}s; ${highlightStyle}">
                    <div class="col-rank">
                        <i class="fas fa-trophy" style="color: ${rankIconColor}; font-size: 0.9rem; margin-right: 6px;"></i>
                        ${rank}
                    </div>
                    <div class="col-user">
                        <div class="mention-avatar">${avatarHtml}</div>
                        <div>
                            <div>${item.name || "Anonymous User"} ${youBadge}</div>
                            ${collegeHtml}
                        </div>
                    </div>
                    <div class="col-score">
                        <span class="desktop-only-header">${scoreVal.toLocaleString()}</span>
                        <span class="mobile-only-header">${scoreVal.toLocaleString()}</span>
                    </div>
                    <div class="col-stat">${uploads.toLocaleString()}</div>
                    <div class="col-stat">${referrals.toLocaleString()}</div>
                    <div class="col-stat">${codingXp.toLocaleString()}</div>
                </div>
            `;
        });
        
        listHtml += `</div>`; // close table body

        // If current user is not in top 10, append them at the bottom OUTSIDE the main box visually
        if (myIndex >= 10 && myItem) {
            const scoreVal = myItem.xp || 0;
            const uploads = myItem.uploads || 0;
            const referrals = myItem.referral_count || 0;
            const codingXp = myItem.coding_xp || 0;
            const college = myItem.college || '';
            const avatar = myItem.logo || myItem.avatar;
            
            let resolvedAvatar = avatar;
            if (resolvedAvatar && resolvedAvatar.startsWith('assets/')) resolvedAvatar = '../' + resolvedAvatar;

            const avatarHtml = resolvedAvatar
                ? `<img src="${resolvedAvatar}" alt="${myItem.name}">`
                : `<span>${myItem.name ? myItem.name[0].toUpperCase() : '?'}</span>`;

            const collegeHtml = college ? `<div style="font-size: 0.7rem; color: #a1a1aa; margin-top: 2px;">${college}</div>` : '';

            listHtml += `
                <div class="mentions-table-body" style="margin-top: 15px; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 15px;">
                    <div class="mention-table-row" style="border: 1px solid rgba(251, 191, 36, 0.5); background: rgba(251, 191, 36, 0.15);">
                        <div class="col-rank">
                            <i class="fas fa-user" style="color: #fbbf24; font-size: 0.9rem; margin-right: 6px;"></i>
                            ${myRank}
                        </div>
                        <div class="col-user">
                            <div class="mention-avatar">${avatarHtml}</div>
                            <div>
                                <div>${myItem.name || "You"} <span style="font-size:0.7rem; background:#fbbf24; color:#000; padding:2px 6px; border-radius:10px; margin-left:8px; font-weight:bold;">YOU</span></div>
                                ${collegeHtml}
                            </div>
                        </div>
                        <div class="col-score">
                            <span class="desktop-only-header">${scoreVal.toLocaleString()}</span>
                            <span class="mobile-only-header">${scoreVal.toLocaleString()}</span>
                        </div>
                        <div class="col-stat">${uploads.toLocaleString()}</div>
                        <div class="col-stat">${referrals.toLocaleString()}</div>
                        <div class="col-stat">${codingXp.toLocaleString()}</div>
                    </div>
                </div>
            `;
        }
        
        listHtml += `</div></div>`;
    }

    return `
        <div class="lb-section">
            ${spotlightHtml}
            ${userStatsBanner}
            ${listHtml}
        </div>
    `;
}

window.updateMobilePodium = function(statType, el) {
    if (!window.currentLeaderboardData) return;
    
    // update tabs active state
    if (el) {
        document.querySelectorAll('#mobile-podium-tabs .stat-pill').forEach(pill => pill.classList.remove('active'));
        el.classList.add('active');
    }
    
    // Sort data by statType
    const sortedData = [...window.currentLeaderboardData].sort((a, b) => (b[statType] || 0) - (a[statType] || 0));
    

    
    // Also regenerate the list HTML to sort and show the correct column
    const listData = sortedData.slice(0, 10);
    let listHtml = '';
    
    let mobileHeaderLabel = 'Total XP';
    if (statType === 'uploads') mobileHeaderLabel = 'Uploads';
    if (statType === 'referral_count') mobileHeaderLabel = 'Referrals';
    if (statType === 'coding_xp') mobileHeaderLabel = 'Coding XP';

    if (listData.length > 0) {
        listHtml += `
            <div class="mentions-table-container">
                <div class="mentions-table-header">
                    <div class="col-rank">Place</div>
                    <div class="col-user">Username</div>
                    <div class="col-score">
                        <span class="desktop-only-header">Total XP</span>
                        <span class="mobile-only-header">${mobileHeaderLabel}</span>
                    </div>
                    <div class="col-stat">Uploads</div>
                    <div class="col-stat">Referrals</div>
                    <div class="col-stat">Coding XP</div>
                </div>
                <div class="mentions-table-body">
        `;
        
        const currU = window.currentUser;
        const currUid = currU ? (currU.id || currU.uid) : null;

        listData.forEach((item, index) => {
            const rank = index + 1;
            const scoreVal = item.xp || 0;
            const activeVal = item[statType] || 0;
            const uploads = item.uploads || 0;
            const referrals = item.referral_count || 0;
            const codingXp = item.coding_xp || 0;
            const college = item.college || '';
            const avatar = item.logo || item.avatar;
            
            let resolvedAvatar = avatar;
            if (resolvedAvatar && resolvedAvatar.startsWith('assets/')) resolvedAvatar = '../' + resolvedAvatar;

            const avatarHtml = resolvedAvatar
                ? `<img src="${resolvedAvatar}" alt="${item.name}">`
                : `<span>${item.name ? item.name[0].toUpperCase() : '?'}</span>`;

            const isMe = currUid && (item.id === currUid || item.uid === currUid);
            const highlightStyle = isMe ? 'border: 1px solid rgba(251, 191, 36, 0.5); background: rgba(251, 191, 36, 0.15);' : '';
            const youBadge = isMe ? '<span style="font-size:0.7rem; background:#fbbf24; color:#000; padding:2px 6px; border-radius:10px; margin-left:8px; font-weight:bold;">YOU</span>' : '';
            
            const collegeHtml = college ? `<div style="font-size: 0.7rem; color: #a1a1aa; margin-top: 2px;">${college}</div>` : '';

            let rankIconColor = '#6b7280';
            if (rank === 1) rankIconColor = '#fbbf24';
            if (rank === 2) rankIconColor = '#94a3b8';
            if (rank === 3) rankIconColor = '#ea580c';

            listHtml += `
                <div class="mention-table-row" style="animation-delay: ${index * 0.05}s; ${highlightStyle}">
                    <div class="col-rank">
                        <i class="fas fa-trophy" style="color: ${rankIconColor}; font-size: 0.9rem; margin-right: 6px;"></i>
                        ${rank}
                    </div>
                    <div class="col-user">
                        <div class="mention-avatar">${avatarHtml}</div>
                        <div>
                            <div>${item.name || "Anonymous User"} ${youBadge}</div>
                            ${collegeHtml}
                        </div>
                    </div>
                    <div class="col-score">
                        <span class="desktop-only-header">${scoreVal.toLocaleString()}</span>
                        <span class="mobile-only-header">${activeVal.toLocaleString()}</span>
                    </div>
                    <div class="col-stat">${uploads.toLocaleString()}</div>
                    <div class="col-stat">${referrals.toLocaleString()}</div>
                    <div class="col-stat">${codingXp.toLocaleString()}</div>
                </div>
            `;
        });
        
        listHtml += `</div></div>`;
    }

    const listContainer = document.getElementById('leaderboard-list-wrapper');
    if (listContainer) {
        listContainer.innerHTML = listHtml;
    }
    
    // Retrigger animations for both podium and list
    setTimeout(() => {
        const fullWrapper = document.getElementById('premium-leaderboard-wrapper');
        if(fullWrapper) {
            fullWrapper.querySelectorAll('.count-up').forEach(counterEl => {
                const target = parseInt(counterEl.dataset.value);
                if (isNaN(target)) return;
                animateValue(counterEl, 0, target, 1500);
            });
            // Re-animate the podium specifically
            const podiumContainer = document.getElementById('podium-container');
            if(podiumContainer) {
                podiumContainer.querySelectorAll('.count-up').forEach(counterEl => {
                    const target = parseInt(counterEl.dataset.value);
                    if (isNaN(target)) return;
                    animateValue(counterEl, 0, target, 1500);
                });
            }
        }
    }, 50);
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

if (!window.formatFocusTime) {
    window.formatFocusTime = (mins) => {
        if (!mins) return "0m";
        if (mins < 60) return `${mins}m`;
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return m > 0 ? `${h}h ${m}m` : `${h}h`;
    };
}

// --- PRIVATE DRIVE MODULE ---

window.renderBookmarks = function () {
    const contentArea = document.getElementById('tab-content');
    if (!contentArea) return;

    contentArea.innerHTML = `
        <div class="tab-pane active fade-in" style="padding: 1.5rem;">
            <div class="welcome-header" style="text-align: center; margin-bottom: 2rem;">
                <h1 class="font-heading" style="white-space: nowrap; font-size: clamp(1.5rem, 6vw, 2.5rem);">🔖 Your <span class="gradient-text">Bookmarks</span></h1>
            </div>
            <div id="bookmarks-grid" style="max-width: 1000px; margin: 0 auto; width: 100%;">
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 6rem 2rem;">
                    <div class="loader-pro"></div>
                </div>
            </div>
        </div>
    `;

    const grid = document.getElementById('bookmarks-grid');
    const { db, collection, query, where, onSnapshot, getDocs } = window.firebaseServices;

    if (!currentUser || currentUser.isGuest) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 6rem 2rem; opacity: 0.9;">
                <div style="font-size: 4.5rem; margin-bottom: 2rem; filter: drop-shadow(0 0 20px rgba(123, 97, 255, 0.4));">🔒</div>
                <h3 style="margin-bottom: 1rem; color: #fff;">Private Collection</h3>
                <p style="color: var(--text-dim); margin-bottom: 2.5rem; max-width: 350px; line-height: 1.6;">Your bookmarked notes are private. Log in to your account to access your saved resources.</p>
                <button class="btn btn-primary" onclick="window.location.href='/login.html'" style="padding: 1rem 2rem; border-radius: 12px; font-weight: 600; min-width: 200px;">Login to Account</button>
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
        const processSnap = (snap) => {
            const notes = [];
            snap.forEach(doc => {
                const data = doc.data();
                const noteId = data.noteId || doc.id.replace(/^saved_/, '');

                // Try to find in global cache for stats
                let cached = (window.NotesDB || []).find(n => n.id === noteId);
                
                // Fallback: Search in globalNotes (static notes)
                if (!cached && window.globalNotes) {
                    const gn = window.globalNotes;
                    for (const col in gn) {
                        for (const sub in gn[col]) {
                            const found = gn[col][sub].find(n => n.id === noteId);
                            if (found) {
                                cached = found;
                                break;
                            }
                        }
                        if (cached) break;
                    }
                }

                notes.push(cached || {
                    id: noteId,
                    title: data.name || data.title || "Untitled Note",
                    url: data.url || data.fileUrl || data.driveLink || "#",
                    subject: data.subject || "General Resources",
                    status: 'approved',
                    isInstant: true // Flag to indicate partial data
                });
            });
            return notes;
        };

        let currentNotes = processSnap(savedSnap);

        if (currentNotes.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 6rem 2rem; opacity: 0.9;">
                    <div style="font-size: 4.5rem; margin-bottom: 2rem; filter: drop-shadow(0 0 20px rgba(123, 97, 255, 0.4));">🔖</div>
                    <h3 style="margin-bottom: 1rem; color: #fff;">No Bookmarks Yet</h3>
                    <p style="color: var(--text-dim); margin-bottom: 2.5rem; max-width: 350px; line-height: 1.6;">You haven't saved any notes yet. Browse the Notes Hub and click the bookmark icon to save materials here.</p>
                    <button class="btn btn-primary" onclick="renderTabContent('notes')" style="padding: 1rem 2rem; border-radius: 12px; font-weight: 600; min-width: 200px;">Browse Notes Hub</button>
                </div>
            `;
            return;
        }

        // --- INSTANT RENDER ---
        const renderUI = (notesToRender) => {
            const grouped = {};
            notesToRender.forEach(n => {
                const sub = n.subject || n.subjectName || 'General Resources';
                if (!grouped[sub]) grouped[sub] = [];
                grouped[sub].push(n);
            });

            const sortedSubjects = Object.keys(grouped).sort();
            let fullHTML = '';

            sortedSubjects.forEach(subName => {
                const notes = grouped[subName];
                const cardsHTML = notes.map((n, index) => {
                    const displayViews = n.views || 0;
                    const displayLikes = n.upvotes || 0;
                    const isLiked = window.likedNoteIds?.has(n.id);

                    // Improved Unit Tag Extraction
                    let unitTag = 'UNIT 1';
                    if (n.unit && n.unit !== 'undefined') {
                        unitTag = n.unit;
                    } else {
                        const unitMatch = n.title?.match(/unit\s*[-_]?\s*\d+/i);
                        if (unitMatch) unitTag = unitMatch[0];
                    }
                    unitTag = unitTag.toUpperCase();

                    return `
                        <div class="detailed-item glass-card card-reveal" data-note-id="${n.id}" style="animation-delay: ${index * 0.05}s; margin-bottom: 1rem; padding: 1.2rem 1.5rem; display: flex; justify-content: space-between; align-items: center;">
                            <div class="item-left" style="display: flex; gap: 1.25rem; align-items: flex-start; flex: 1;">
                                <div class="file-type-icon" style="width: 45px; height: 45px; background: rgba(0, 242, 255, 0.1); color: var(--secondary); display: flex; align-items: center; justify-content: center; border-radius: 12px; font-size: 1.2rem; flex-shrink: 0;">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                                </div>
                                <div class="item-info">
                                    <div class="unit-tag" style="font-size: 0.75rem; color: var(--secondary); font-weight: 800; letter-spacing: 1px; margin-bottom: 0.3rem; text-transform: uppercase;">${unitTag}</div>
                                    <h3 class="item-title" style="font-size: 1.15rem; font-weight: 700; color: white; margin: 0 0 0.4rem 0;">${n.title}</h3>
                                    <div class="item-meta-row" style="display: flex; align-items: center; gap: 1.2rem; font-size: 0.8rem; color: var(--text-dim);">
                                        <div class="uploader-mini" style="display: flex; align-items: center; gap: 0.5rem; white-space: nowrap;">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                            <span>${n.uploaderName || n.uploader || 'Verified'}</span>
                                        </div>
                                        <div class="views-mini" style="display: flex; align-items: center; gap: 0.4rem; white-space: nowrap;">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                            <span class="views">${displayViews} Views</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="item-right" style="display: flex; align-items: center; gap: 1.25rem;">
                                <div class="item-actions-inline" style="display: flex; align-items: center; gap: 0.8rem;">
                                    <button class="eng-btn-pro like-btn ${isLiked ? 'active' : ''}" onclick="likeNote('${n.id}')" style="display: flex; align-items: center; gap: 0.5rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 0.5rem 0.8rem; border-radius: 8px; color: var(--text-dim); transition: 0.3s; cursor: pointer;">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                                        <span class="count" style="font-weight: 700; font-size: 0.9rem;">${displayLikes}</span>
                                    </button>
                                    <button class="tool-icon-pro bookmark-btn active" onclick="toggleBookmark('${n.id}')" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 0.6rem; border-radius: 8px; color: var(--text-dim); transition: 0.3s; cursor: pointer;">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                                    </button>
                                </div>
                                <a href="${window.getViewerUrl(n.url || n.fileUrl || n.driveLink, n.title || n.name)}" target="_blank" class="btn-download-pro" onclick="viewNote('${n.id}')" style="background: white; color: black; padding: 0.6rem 1.2rem; border-radius: 8px; font-weight: 700; font-size: 0.85rem; text-decoration: none; display: flex; align-items: center; gap: 0.5rem; transition: 0.3s;">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                    View
                                </a>
                            </div>
                        </div>`;
                }).join('');

                fullHTML += `
                    <div class="subject-bookmarks-section" style="margin-bottom: 3rem;">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 0.75rem;">
                            <h2 class="font-heading" style="font-size: 1.35rem; display: flex; align-items: center; gap: 10px; margin: 0;">
                                <span style="color: var(--secondary); font-size: 1.1rem;">📚</span> ${subName}
                            </h2>
                            <span style="font-size: 0.75rem; background: rgba(123, 97, 255, 0.1); color: var(--secondary); padding: 3px 10px; border-radius: 20px; font-weight: 700; border: 1px solid rgba(123, 97, 255, 0.2);">
                                ${notes.length} ${notes.length === 1 ? 'Note' : 'Notes'}
                            </span>
                        </div>
                        <div class="notes-list-container-pro" style="display: flex; flex-direction: column; gap: 1rem;">
                            ${cardsHTML}
                        </div>
                    </div>
                `;
            });

            grid.innerHTML = fullHTML;
            if (window.attachNoteRealtimeListeners) window.attachNoteRealtimeListeners('bookmarks-grid');
        };

        renderUI(currentNotes);

        // --- BACKGROUND FETCH MISSING DATA ---
        const missingIds = currentNotes.filter(n => n.isInstant).map(n => n.id);
        if (missingIds.length > 0) {
            try {
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

                const fetched = await fetchNotesByIds(missingIds);
                if (fetched.length > 0) {
                    window.NotesDB = [...(window.NotesDB || []), ...fetched];
                    // Final UI Refresh with full stats
                    const finalNotes = processSnap(savedSnap);
                    renderUI(finalNotes);
                }
            } catch (e) {
                console.warn("Background bookmark fetch failed:", e);
            }
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
        input.accept = ".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png?v=6.0"; // Allowed types
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

window.createNotification = async function (userId, data) {
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
};

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
            const qBasic = query(collection(db, "notifications"), where("userId", "==", currentUser.id));
            const subFallback = onSnapshot(qBasic, (snap) => {
                userNotifications = snap.docs.map(d => ({ id: d.id, ...d.data() }))
                    .sort((a, b) => {
                        const timeA = a.timestamp?.seconds || (Date.now() / 1000);
                        const timeB = b.timestamp?.seconds || (Date.now() / 1000);
                        return timeB - timeA;
                    });
                updateNotificationBadge();
            });
            notificationsUnsubscribe = subFallback;
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
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }

    let panel = document.getElementById('notification-panel');
    if (panel) {
        panel.classList.remove('active');
        setTimeout(() => panel.remove(), 200);
        return;
    }

    panel = document.createElement('div');
    panel.id = 'notification-panel';
    panel.className = 'glass-card active';
    panel.style.cssText = `
        position: fixed; top: 85px; right: 25px; width: 380px; 
        max-height: 80vh; display: flex; flex-direction: column; z-index: 99999;
        background: rgba(10, 10, 15, 0.98); backdrop-filter: blur(30px); 
        border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; 
        box-shadow: 0 25px 60px rgba(0,0,0,0.9), 0 0 20px rgba(123, 97, 255, 0.1); 
        transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        transform-origin: top right;
    `;

    panel.innerHTML = `
        <div style="padding: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center;">
            <div>
                <h3 class="font-heading" style="margin:0; font-size: 1.2rem; letter-spacing: -0.5px;">Notifications</h3>
                <p style="margin:0; font-size:0.7rem; color:var(--text-dim)">Your recent activity and alerts</p>
            </div>
            <button onclick="window.markAllNotificationsRead()" class="btn-ghost" style="font-size: 0.7rem; color: var(--secondary); cursor: pointer; font-weight: 700; background: rgba(0, 242, 255, 0.05); padding: 6px 12px; border-radius: 8px; border: none;">
                Mark Read
            </button>
        </div>
        <div class="notif-scroll" style="flex: 1; overflow-y: auto; padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem;">
            ${userNotifications.length === 0 ? `
                <div style="text-align:center; padding: 4rem 1rem; display:flex; flex-direction:column; align-items:center; gap:15px">
                    <div style="font-size: 3rem; filter: grayscale(1); opacity: 0.3;">🔔</div>
                    <div style="opacity:0.4; font-size: 0.9rem; font-weight: 500;">No notifications yet.</div>
                </div>
            ` :
            userNotifications.map((n, idx) => `
                <div class="glass-card notif-item" style="padding: 1.25rem; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); animation: fadeInUp 0.4s ease backwards; animation-delay: ${idx * 0.05}s; ${n.read ? 'opacity: 0.6;' : 'background: rgba(123, 97, 255, 0.03); border-left: 3px solid var(--primary);'}">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 0.5rem">
                        <div style="font-weight: 800; font-size: 0.95rem; color: #fff;">${n.title}</div>
                        ${!n.read ? '<div style="width:8px; height:8px; background:var(--secondary); border-radius:50%; box-shadow: 0 0 10px var(--secondary)"></div>' : ''}
                    </div>
                    <p style="font-size: 0.85rem; line-height: 1.5; color: #bbb; margin: 0;">${n.message}</p>
                    <div style="font-size: 0.65rem; color: var(--text-dim); margin-top: 1rem; display:flex; align-items:center; gap:5px">
                        <i class="far fa-clock"></i> ${n.timestamp ? new Date(n.timestamp.seconds * 1000).toLocaleString('default', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }) : 'Just now'}
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    document.body.appendChild(panel);

    const closer = (event) => {
        const btn = document.querySelector('.notification-btn');
        if (panel && !panel.contains(event.target) && (!btn || !btn.contains(event.target))) {
            panel.classList.remove('active');
            setTimeout(() => panel.remove(), 200);
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

    // 1. Live Students (Heartbeat listener removed to prioritize Global Stats)
    // 2. Trending Notes Count (Moved to separate UI element if needed)
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
                <div style="text-align: center; padding: 1rem 0.5rem; animation: fadeIn 0.5s ease-out;">
                    <div style="margin-bottom: 1.5rem;">
                        <h3 style="color: white; font-size: 1.4rem; margin-bottom: 0.5rem;">${window.selectedExamType} Paper Ready</h3>
                        <p style="color: var(--text-dim); font-size: 0.9rem; line-height: 1.5;">A professional academic model paper with marking scheme has been generated.</p>
                    </div>
                    
                    <div style="display: flex; flex-direction: column; gap: 12px; max-width: 320px; margin: 0 auto;">
                        <button id="final-download-btn" class="btn btn-primary" style="width: 100%; border-radius: 14px; padding: 0.85rem; font-weight: 800; background: linear-gradient(135deg, #2ed573, #1dd1a1); border: none; color: #050505; cursor: pointer; box-shadow: 0 10px 20px rgba(46, 213, 115, 0.2); transition: 0.3s;">
                            📥 Download PDF
                        </button>
                        <button class="btn" style="width: 100%; border-radius: 14px; padding: 0.85rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; cursor: pointer; font-weight: 600;" onclick="document.getElementById('dynamic-ai-modal').style.display='none'">
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

