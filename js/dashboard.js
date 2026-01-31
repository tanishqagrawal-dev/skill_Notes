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

// --- RBAC & USER SYSTEM ---
const Roles = {
    SUPER_ADMIN: 'super_admin',
    COLLEGE_ADMIN: 'college_admin',
    UPLOADER: 'uploader',
    STUDENT: 'student'
};

const MockUsers = [
    { id: 'u_student', name: 'Tanishq Agrawal', role: 'student', college: 'medicaps', email: 'student@example.com', year: '2nd Year', branch: 'CSE' },
    { id: 'u_admin', name: 'Dev Admin', role: 'super_admin', college: 'medicaps', email: 'admin@skillmatrix.com' },
    { id: 'u_faculty', name: 'Dr. Mehta', role: 'uploader', college: 'medicaps', email: 'faculty@medicaps.ac.in' }
];

// Current session
let currentUser = null;

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
        { id: 'mtech', name: 'M.Tech', icon: '🔬', branches: ['cse', 'vlsi'] }, // Example branches for now
        { id: 'mba', name: 'MBA', icon: '📊', branches: ['finance', 'marketing'] } // Example branches
    ],
    years: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
    subjects: {
        'cse-2nd Year': [
            { id: 'os', name: 'Operating Systems', icon: '💾', code: 'CS402', description: 'Medi-Caps Core Syllabus: Process scheduling, memory management, and disk algorithms.' },
            { id: 'dbms', name: 'DBMS', icon: '🗄️', code: 'CS403', description: 'Relational models, SQL query optimization, and transaction control for CSE students.' },
            { id: 'dsa', name: 'Data Structures', icon: '🌳', code: 'CS404', description: 'Trees, Graphs, and Advanced Algorithms. Core competitive programming base.' }
        ],
        'aiml-2nd Year': [
            { id: 'python', name: 'Python for AI', icon: '🐍', code: 'AL201', description: 'Numerical computing with NumPy and Data Science foundations.' }
        ],
        'cse-1st Year': [
            { id: 'phy', name: 'Engineering Physics', icon: '⚛️', code: 'PH101', description: 'Quantum mechanics, Optics, and Semiconductors syllabus for Medi-Caps Engineering.' }
        ]
    }
};

let NotesDB = [];
let unsubscribeNotes = null;

// --- APP STATE ---
let selState = { college: null, branch: null, year: null, subject: null };

// --- RE-INIT SERVICES ON DEMAND ---
// Smart Ranking Logic: (views*0.25) + (downloads*0.5) + (likes*0.25)
function calculateSmartScore(note) {
    const viewsWeight = 0.25;
    const downloadsWeight = 0.5;
    const likesWeight = 0.25;
    return (note.views * viewsWeight) + (note.downloads * downloadsWeight) + (note.likes * likesWeight);
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
        trackAnalytics(`note_${type}`, { id: noteId, title: note ? note.title : 'Unknown' });
    } catch (error) {
        console.error("Error updating stats:", error);
    }
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


window.openUploadModal = async function () {
    if (!currentUser) {
        alert("Please login first.");
        return;
    }

    // Check permission (Admin/Uploader only)
    const allowedRoles = [Roles.SUPER_ADMIN, Roles.COLLEGE_ADMIN, Roles.UPLOADER];
    if (!allowedRoles.includes(currentUser.role)) {
        alert("🔒 Student accounts cannot upload directly. Please ask a representative.");
        return;
    }

    const title = prompt("Enter Note Title (e.g. OS Unit 3 Process Sync):");
    if (!title) return;

    const newNote = {
        title: title,
        collegeId: selState.college ? selState.college.id : 'medicaps',
        branchId: selState.branch ? selState.branch.id : 'cse',
        year: selState.year || '2nd Year',
        subject: selState.subject ? selState.subject.id : 'os',
        type: 'notes',
        views: 0, downloads: 0, likes: 0,
        uploader: currentUser.name,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        badge: '✨ NEW',
        driveLink: 'https://drive.google.com/', // In a real app, this would be a file input -> Storage upload
        status: 'pending',
        uploaded_by: currentUser.id,
        approved_by: null,
        created_at: new Date().toISOString() // for sorting
    };

    try {
        await addDoc(collection(db, "notes"), newNote);
        alert("🚀 Note submitted for review! It will appear once approved.");
    } catch (e) {
        console.error("Upload error:", e);
        alert("Error uploading note. See console.");
    }
};

function initTabs() {
    const navItems = document.querySelectorAll('.nav-item');
    const sidebarNav = document.querySelector('.sidebar-nav');

    // Clear dynamic tabs before re-rendering to avoid duplicates
    const dynamicTabs = document.querySelectorAll('[data-tab="verification"], [data-tab="admin-console"]');
    dynamicTabs.forEach(t => t.remove());

    if (sidebarNav) {
        if (currentUser.role === Roles.SUPER_ADMIN || currentUser.role === Roles.COLLEGE_ADMIN) {
            const adminTab = document.createElement('a');
            adminTab.href = "#";
            adminTab.className = "nav-item";
            adminTab.setAttribute('data-tab', 'verification');
            adminTab.innerHTML = `<span class="icon">🛡️</span> Verification Hub`;
            sidebarNav.insertBefore(adminTab, sidebarNav.querySelector('.nav-divider'));
        }

        if (currentUser.role === Roles.SUPER_ADMIN) {
            const devTab = document.createElement('a');
            devTab.href = "#";
            devTab.className = "nav-item";
            devTab.setAttribute('data-tab', 'admin-console');
            devTab.innerHTML = `<span class="icon">💻</span> Admin Console`;
            sidebarNav.insertBefore(devTab, sidebarNav.querySelector('.nav-divider'));
        }
    }

    // Refresh nav items after dynamic addition
    const allNavItems = document.querySelectorAll('.nav-item[data-tab]');
    allNavItems.forEach(item => {
        item.onclick = (e) => {
            e.preventDefault();
            const tabId = item.getAttribute('data-tab');
            allNavItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            renderTabContent(tabId);
            trackAnalytics('tab_switch', { name: tabId });
        };
    });

    updateUserProfileUI();

    // Deep Linking Check
    if (window.pendingTab) {
        const target = document.querySelector(`.nav-item[data-tab="${window.pendingTab}"]`);
        if (target) {
            target.click();
            window.pendingTab = null;
        }
    }
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

    // Hide extra meta text if it exists
    if (meta) {
        meta.style.display = 'none';
    }

    // Ensure logout button is NOT added here (it's in Settings now)
    const existingLogout = document.getElementById('logout-btn');
    if (existingLogout) existingLogout.remove();
}

window.switchRole = function (userId) {
    const user = MockUsers.find(u => u.id === userId);
    if (!user) return;

    // Simulate auth-ready event data structure
    handleAuthReady({
        user: { uid: user.id, email: user.email },
        currentUser: { ...user }
    });

    // Switch to Overview
    const overviewTab = document.querySelector('.nav-item[data-tab="overview"]');
    if (overviewTab) overviewTab.click();
};

function renderTabContent(tabId) {
    const contentArea = document.getElementById('tab-content');
    if (!contentArea) return;

    if (tabId === 'overview') {
        contentArea.innerHTML = renderOverview();
    } else if (tabId === 'verification') {
        contentArea.innerHTML = renderVerificationHub();
    } else if (tabId === 'admin-console') {
        contentArea.innerHTML = renderAdminConsole();
    } else if (tabId === 'notes') {
        selState = { college: null, branch: null, year: null, subject: null };
        contentArea.innerHTML = renderNotesHub();
        renderCollegeStep();
    } else if (tabId === 'planner') {
        contentArea.innerHTML = renderPlanner();
    } else if (tabId === 'ai-tools') {
        contentArea.innerHTML = renderAITools();
        setTimeout(window.checkServer, 100); // Check server status after render
    } else if (tabId === 'analytics') {
        contentArea.innerHTML = renderAnalytics();
    } else if (tabId === 'settings') {
        contentArea.innerHTML = window.renderSettings ? window.renderSettings() : 'Loading settings...';
    } else if (tabId === 'leaderboard') {
        contentArea.innerHTML = renderLeaderboard();
        setTimeout(initLeaderboardListeners, 100);
    } else {
        contentArea.innerHTML = `<div class="tab-pane active"><h1 class="font-heading">${tabId}</h1><p>Coming soon...</p></div>`;
    }
}


function renderPlanner() {
    // 1. Get Subjects
    const mySubjects = GlobalData.subjects['cse-2nd Year'].map(s => s.name);

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
    const subjects = GlobalData.subjects['cse-2nd Year'].map(s => s.name);

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

    // Mock Readiness Data (Phase 1)
    const subjects = [
        { name: 'Digital Electronics', progress: 85, color: '#2ecc71' },
        { name: 'Data Structures', progress: 60, color: '#f1c40f' },
        { name: 'Mathematics-III', progress: 30, color: '#e74c3c' }
    ];

    // Mock Users for Role Switcher (Demo Mode)
    const mockUsers = [
        { id: 'u_student', name: 'Rohan (Student)', role: 'student' },
        { id: 'u_uploader', name: 'Faculty (Uploader)', role: 'uploader' },
        { id: 'u_admin', name: 'Dean (Admin)', role: 'college_admin' }
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
                    <div style="font-size: 2rem; font-weight: 700;">18 Notes</div>
                </div>
                <div class="glass-card wobble-hover" style="padding: 1.5rem; border-left: 4px solid #9b59b6;">
                    <div style="font-size: 0.9rem; color: var(--text-dim); margin-bottom: 0.5rem;">⬇️ Global Downloads</div>
                    <div class="live-counter" id="global-downloads" style="font-size: 2rem; font-weight: 700;">2,340</div>
                </div>
            </div>

            <div class="grid-2-col" style="display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; align-items: start;">
                
                <!-- Main Content: Quick Actions & Recently Viewed -->
                <div style="display: flex; flex-direction: column; gap: 2rem;">
                    
                    <!-- 4. "What Next?" AI Card -->
                    <div class="glass-card" style="background: linear-gradient(135deg, rgba(108, 99, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%); border: 1px solid rgba(108, 99, 255, 0.3); padding: 2rem; position: relative; overflow: hidden;">
                        <div style="position: absolute; top: -10px; right: -10px; font-size: 8rem; opacity: 0.05; transform: rotate(15deg);">🤖</div>
                        <h3 class="font-heading">🤖 AI Recommendation</h3>
                        <p style="margin-bottom: 1.5rem; max-width: 80%;">Your retention in <strong>Mathematics-III</strong> is dropping. We recommend solving a model paper to boost confidence.</p>
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

            <!-- Role Switcher (Restored) -->
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
        </div>
    `;
}

// Live Counter Animation logic
window.initLiveCounters = function () {
    // 1. Live Students (Fluctuate)
    const liveEl = document.getElementById('live-students');
    if (liveEl) {
        let count = 124;
        setInterval(() => {
            const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
            count += change;
            if (count < 100) count = 100;
            liveEl.innerText = count;
        }, 3000);
    }

    // 2. Global Downloads (Count up)
    const dlEl = document.getElementById('global-downloads');
    if (dlEl) {
        let dlCount = 2340;
        setInterval(() => {
            if (Math.random() > 0.7) { // 30% chance to increment
                dlCount++;
                dlEl.innerText = dlCount.toLocaleString();
                // Flash effect
                dlEl.style.color = '#fff';
                setTimeout(() => dlEl.style.color = '', 200);
            }
        }, 2000);
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
    return `
        <div class="tab-pane active fade-in" style="padding: 2rem;">
            <h1 class="font-heading">📈 Performance <span class="gradient-text">Analytics</span></h1>
            <div class="glass-card" style="margin-top: 2rem; padding: 3rem; text-align: center;">
                <div style="font-size: 4rem; margin-bottom: 1rem;">📊</div>
                <h3>Gathering Data...</h3>
                <p>Interact with more notes to generate your learning insights map.</p>
            </div>
        </div>
    `;
}



function renderVerificationHub() {
    const pending = NotesDB.filter(n => {
        if (currentUser.role === Roles.SUPER_ADMIN) return n.status === 'pending';
        return n.status === 'pending' && n.collegeId === currentUser.college;
    });

    return `
        <div class="tab-pane active fade-in" style="padding: 2rem;">
            <div style="margin-bottom: 2rem;">
                <h1 class="font-heading">🛡️ Verification <span class="gradient-text">Hub</span></h1>
                <p style="color: var(--text-dim);">Quality control center for moderated academic content.</p>
            </div>

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

window.processNote = function (noteId, newStatus) {
    const note = NotesDB.find(n => n.id === noteId);
    if (!note) return;

    note.status = newStatus;
    note.approved_by = currentUser.id;

    trackAnalytics('note_moderation', { id: noteId, status: newStatus });
    alert(`Note ${newStatus.toUpperCase()} successfully!`);
    renderTabContent('verification');
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
    document.querySelectorAll('.step-node').forEach((node, i) => {
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
    const key = `${selState.branch.id}-${selState.year}`;
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
            <div class="card-icon" style="font-size: 2.5rem;">${s.icon}</div>
            <h3 class="font-heading" style="margin-top: 1rem;">${s.name}</h3>
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

    const key = `${selState.branch.id}-${selState.year}`;
    const subjectData = (GlobalData.subjects[key] || []).find(s => s.id === selState.subject.id) || {
        name: selState.subject.name,
        code: 'GEN101',
        description: 'Comprehensive study materials and verified academic resources for final exam preparation.'
    };

    view.innerHTML = `
        <div class="subject-page-container fade-in">
            <div class="breadcrumb-pro">
                🏠 <span>›</span> ${selState.branch.name} <span>›</span> ... <span>›</span> ${selState.subject.name}
            </div>

            <div class="subject-page-hero">
                <div style="display:flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <h1 class="font-heading" style="font-size: 3rem; margin: 0; line-height: 1.1;">${selState.subject.name}</h1>
                        <div class="sub-badges">
                            <span class="meta-badge">${selState.branch.id}</span>
                            <span class="meta-badge">${selState.year}</span>
                            <span class="meta-badge">${subjectData.code}</span>
                        </div>
                        <p class="subject-description">${subjectData.description}</p>
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

    return filtered.map(n => {
        const canModerate = (currentUser.role === Roles.SUPER_ADMIN) ||
            (currentUser.role === Roles.COLLEGE_ADMIN && currentUser.college === n.collegeId);

        return `
            <div class="detailed-item glass-card card-reveal" style="${n.status === 'pending' ? 'border: 1px dashed var(--secondary); background: rgba(108, 99, 255, 0.05);' : ''}">
                <div class="item-left">
                    <div class="file-type-icon">📄</div>
                    <div class="item-info-block">
                        <div class="item-title" style="display:flex; align-items:center; gap: 0.5rem;">
                            ${n.title}
                            ${n.status === 'pending' ? '<span class="meta-badge" style="background:var(--secondary); color:#000; font-size:0.6rem;">PENDING REVIEW</span>' : ''}
                        </div>
                        <div class="item-meta-row" style="margin-top: 5px;">
                            <span>📅 ${n.date}</span>
                            <div class="uploader-mini">
                                <div class="uploader-avatar">${n.uploader.charAt(0)}</div>
                                <span>Uploaded by ${n.uploader}</span>
                            </div>
                        </div>
                        <div class="item-meta-row" style="font-size: 0.7rem; color: var(--success); opacity: 0.9; margin-top: 2px;">
                            ${n.status === 'approved' ? `<span>✓ Verified by ${n.approved_by || 'Admin'}</span>` : ''}
                        </div>
                        <div class="item-engagement-row" style="margin-top: 10px;">
                            <span class="eng-icon" onclick="updateNoteStat('${n.id}', 'like')">👍 ${n.likes}</span>
                            <span class="eng-icon">�️ ${n.views}</span>
                            <span class="eng-icon">⬇️ ${n.downloads}</span>
                            <span class="eng-icon" style="background: rgba(108, 99, 255, 0.1); color: var(--primary);">⭐ Score: ${calculateSmartScore(n).toFixed(1)}</span>
                        </div>
                    </div>
                </div>
                <div class="item-right" style="display:flex; flex-direction:column; gap:0.5rem; justify-content:center;">
                    ${n.status === 'pending' && canModerate ? `
                        <button class="btn btn-sm btn-primary" style="background: var(--success); font-size: 0.7rem; padding: 0.4rem 0.8rem;" onclick="processNote('${n.id}', 'approved')">✅ Approve</button>
                        <button class="btn btn-sm btn-ghost" style="color: #ff4757; font-size: 0.7rem;" onclick="processNote('${n.id}', 'rejected')">❌ Reject</button>
                    ` : `
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="btn btn-ghost" style="font-size: 0.8rem;" onclick="window.open('${convertDriveLink(n.driveLink, 'preview')}', '_blank'); updateNoteStat('${n.id}', 'view')">📄 Preview</button>
                            <button class="btn-download-pro" onclick="window.open('${convertDriveLink(n.driveLink, 'download')}', '_blank'); updateNoteStat('${n.id}', 'download')">📥 Download</button>
                        </div>
                    `}
                </div>
            </div>
        `;
    }).join('');
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

window.addEventListener('auth-ready', (event) => {
    handleAuthReady(event.detail);
});

function handleAuthReady(data) {
    if (!data) return;
    const { user, currentUser: appCurrentUser } = data;
    if (user && appCurrentUser) {
        console.log("🚀 Dashboard Session Active:", (user.email || "Guest"));
        if (currentUser && currentUser.id === appCurrentUser.id) {
            // Already initialized, but ensure UI is synced
            updateUserProfileUI();
            return;
        }
        currentUser = appCurrentUser;
        updateUserProfileUI();
        initRealTimeDB();
        initTabs();

        // Initialize Settings Module
        if (window.SettingsModule && window.SettingsModule.init) {
            window.SettingsModule.init();
        }

        renderTabContent('overview');
    } else {
        console.log("🔓 Dashboard: No active session. Waiting for auth...");
    }
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

// Check for already dispatched auth
if (window.authStatus && window.authStatus.ready) {
    handleAuthReady(window.authStatus.data);
}

window.loginAsGuest = function () {
    console.log("Logging in as Guest...");
    currentUser = {
        id: 'guest_' + Math.random().toString(36).substr(2, 9),
        name: 'Guest Tester',
        email: 'guest@example.com',
        photo: null,
        role: Roles.STUDENT,
        college: 'medicaps',
        isGuest: true
    };

    updateUserProfileUI();
    initRealTimeDB();
    initTabs();
    renderTabContent('overview');
};

function initRealTimeDB() {
    const { db, query, collection, orderBy, onSnapshot } = getFirebase();
    if (!db) {
        console.warn("⏳ Real-time DB: Waiting for Firebase services...");
        setTimeout(initRealTimeDB, 500);
        return;
    }

    if (unsubscribeNotes) unsubscribeNotes();

    const q = query(collection(db, "notes"), orderBy("created_at", "desc"));
    unsubscribeNotes = onSnapshot(q, (snapshot) => {
        NotesDB = [];
        snapshot.forEach((doc) => {
            NotesDB.push({ id: doc.id, ...doc.data() });
        });
        console.log(`Synced ${NotesDB.length} notes from Firestore`);
    });
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
};

function updateLeaderboardUI(type, timeframe) {
    const list = document.getElementById('lb-list-container');
    if (!list) return;

    // Get Data
    let data = LeaderboardData[type] || [];

    // Simulate Score Variation based on time filter
    if (timeframe === 'today') data = data.map(d => ({ ...d, score: Math.round(d.score * 0.1) }));
    if (timeframe === 'week') data = data.map(d => ({ ...d, score: Math.round(d.score * 0.5) }));

    // Sort
    data.sort((a, b) => b.score - a.score);

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

    const activities = [
        { icon: '👁️', text: '<strong>Riya</strong> viewed Digital Electronics', time: 'Just now' },
        { icon: '📤', text: '<strong>Ankit</strong> uploaded a new note', time: '2 mins ago' },
        { icon: '🏆', text: '<strong>Tanishq</strong> reached Rank #1', time: '5 mins ago' },
        { icon: '⬇️', text: '<strong>Rahul</strong> downloaded OS Unit 4', time: '12 mins ago' },
        { icon: '🔥', text: 'New streak started by <strong>Sneha</strong>', time: '15 mins ago' }
    ];

    // Initial fill
    feed.innerHTML = activities.map(act => createActivityHTML(act)).join('');

    // Add new activity every few seconds
    setInterval(() => {
        const randomAct = activities[Math.floor(Math.random() * activities.length)];
        const el = document.createElement('div');
        el.className = 'activity-item';
        el.innerHTML = `
            <div class="activity-icon">${randomAct.icon}</div>
            <div class="activity-text">
                ${randomAct.text}
                <span class="activity-meta">Just now</span>
            </div>
        `;
        feed.insertBefore(el, feed.firstChild);
        if (feed.children.length > 6) feed.lastChild.remove();
    }, 4000);
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
