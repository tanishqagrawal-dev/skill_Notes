// --- RBAC & USER SYSTEM ---
const Roles = {
    SUPER_ADMIN: 'super_admin',
    COLLEGE_ADMIN: 'college_admin',
    UPLOADER: 'uploader',
    STUDENT: 'student'
};

const MockUsers = [
    { id: 'u1', name: 'Tanishq (Dev)', role: Roles.SUPER_ADMIN, college: 'all', email: 'admin@skillhub.com' },
    { id: 'u2', name: 'Ankit Sharma', role: Roles.COLLEGE_ADMIN, college: 'medicaps', email: 'ankit@medicaps.ac.in' },
    { id: 'u3', name: 'Rahul Uploader', role: Roles.UPLOADER, college: 'medicaps', email: 'rahul@example.com' },
    { id: 'u4', name: 'Generic Student', role: Roles.STUDENT, college: 'medicaps', email: 'student@example.com' }
];

// Current session (Defaulting to Super Admin for development experience)
let currentUser = MockUsers[0];

const GlobalData = {
    colleges: [
        { id: 'medicaps', name: 'Medi-Caps University', logo: '🏛️' },
        { id: 'lpu', name: 'LPU University', logo: '🏰' },
        { id: 'iitd', name: 'IIT Delhi', logo: '🎓' }
    ],
    branches: [
        { id: 'cse', name: 'Computer Science', icon: '💻' },
        { id: 'ece', name: 'Electronics', icon: '⚡' },
        { id: 'me', name: 'Mechanical', icon: '⚙️' },
        { id: 'aiml', name: 'AI & Machine Learning', icon: '🧠' }
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

const NotesDB = [
    // Approved resources (Initial seed)
    {
        id: 'mc1', title: 'OS Unit 1-5: Complete Official Notes',
        collegeId: 'medicaps', branchId: 'cse', year: '2nd Year', subject: 'os',
        type: 'notes', views: 4200, downloads: 1200, likes: 450, uploader: 'Arjun M.',
        date: 'Jan 28, 2026', badge: '🔥 HOT', driveLink: 'https://drive.google.com/drive/folders/1BN6ytHOWPdpLTG1v3A2CoPw8lbluoG5L',
        status: 'approved', uploaded_by: 'u1', approved_by: 'u1'
    },
    {
        id: 'mc1b', title: 'OS Mid-Sem PYQs (2024-25)',
        collegeId: 'medicaps', branchId: 'cse', year: '2nd Year', subject: 'os',
        type: 'pyq', views: 1500, downloads: 400, likes: 80, uploader: 'Admin',
        date: 'Dec 15, 2025', badge: '', driveLink: 'https://drive.google.com/drive/folders/1BN6ytHOWPdpLTG1v3A2CoPw8lbluoG5L',
        status: 'approved', uploaded_by: 'u1', approved_by: 'u1'
    },
    {
        id: 'mc2', title: 'DBMS Full SQL & Normalization Notes',
        collegeId: 'medicaps', branchId: 'cse', year: '2nd Year', subject: 'dbms',
        type: 'notes', views: 2800, downloads: 950, likes: 310, uploader: 'Sakshi V.',
        date: 'Jan 15, 2026', badge: '⭐ TOP', driveLink: 'https://drive.google.com/drive/folders/1OyZWpofSNatDdXt7KxSQNBE_F5NtucPn',
        status: 'approved', uploaded_by: 'u1', approved_by: 'u1'
    },
    {
        id: 'mc4', title: 'Eng. Physics - Unit 1: Optics & Lasers',
        collegeId: 'medicaps', branchId: 'cse', year: '1st Year', subject: 'phy',
        type: 'notes', views: 3500, downloads: 820, likes: 210, uploader: 'Admin',
        date: 'Feb 02, 2026', badge: '🌟 BEST', driveLink: 'https://drive.google.com/drive/folders/1WXcUBjlR-57DsuI3Fgi03Bks--n1jtwC',
        status: 'approved', uploaded_by: 'u1', approved_by: 'u1'
    }
];

// --- APP STATE ---
let selState = { college: null, branch: null, year: null, subject: null };

// --- ANALYTICS ENGINE ---
function trackAnalytics(eventType, data) {
    console.log(`[Analytics] ${eventType}:`, data);
    if (typeof gtag === 'function') {
        gtag('event', eventType, { 'event_category': 'Explorer', 'event_label': data.id || data.name });
    }
}

// --- CORE DASHBOARD LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    renderTabContent('overview');

    // Global listener for + Upload Note button in sidebar/header
    const uploadBtns = document.querySelectorAll('.upload-btn');
    uploadBtns.forEach(btn => {
        btn.onclick = () => openUploadModal();
    });
});

window.openUploadModal = function () {
    // Simple prompt-based mock for upload (since we are in dashboard.js)
    if (currentUser.role === Roles.STUDENT) {
        alert("🔒 Only verified Uploaders or Admins can submit notes. Please update your role in the 'Overview' page for this demo.");
        return;
    }

    const title = prompt("Enter Note Title (e.g. OS Unit 3 Process Sync):");
    if (!title) return;

    const newNote = {
        id: 'new_' + Date.now(),
        title: title,
        collegeId: selState.college ? selState.college.id : currentUser.college,
        branchId: selState.branch ? selState.branch.id : 'cse',
        year: selState.year || '2nd Year',
        subject: selState.subject ? selState.subject.id : 'os',
        type: 'notes',
        views: 0, downloads: 0, likes: 0,
        uploader: currentUser.name,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        badge: '✨ NEW',
        driveLink: 'https://drive.google.com/',
        status: 'pending',
        uploaded_by: currentUser.id
    };

    NotesDB.unshift(newNote);
    alert("🚀 Note submitted for review! Check 'Verification Hub' if you are an Admin, or wait for approval.");

    // Refresh current view if we are on notes hub
    if (document.getElementById('final-notes-view').style.display === 'block') {
        showNotes();
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
    const allNavItems = document.querySelectorAll('.nav-item');
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
}

function updateUserProfileUI() {
    const avatar = document.querySelector('.user-profile-mini .avatar');
    const name = document.querySelector('.user-profile-mini .name');
    const meta = document.querySelector('.user-profile-mini .meta');

    if (avatar) avatar.innerText = currentUser.name.charAt(0);
    if (name) name.innerText = currentUser.name;
    if (meta) meta.innerText = `${currentUser.role.replace('_', ' ').toUpperCase()} • ${currentUser.college.toUpperCase()}`;
}

window.switchRole = function (userId) {
    currentUser = MockUsers.find(u => u.id === userId);
    console.log("Logged in as:", currentUser.name);
    initTabs();
    renderTabContent('overview');
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
    } else {
        contentArea.innerHTML = `<div class="tab-pane active"><h1 class="font-heading">${tabId}</h1><p>Coming soon...</p></div>`;
    }
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

function renderOverview() {
    return `
        <div class="tab-pane active fade-in">
            <div class="hub-hero-section-pro glass-card">
                <div class="hero-content">
                    <span class="badge-accent">DASHBOARD HOME</span>
                    <h1 class="font-heading" style="font-size: 3rem; margin: 1rem 0;">Ready to <span class="gradient-text">Excel?</span></h1>
                    <p style="color: var(--text-muted); font-size: 1.1rem; max-width: 600px;">Access systematic notes by college, branch, and year. Explore the Library to start.</p>
                </div>
            </div>
            
            <!-- Developer Role Selection - Explained -->
            <div style="margin-top: 3rem; padding: 2rem; background: rgba(108, 99, 255, 0.05); border-radius: 20px; border: 1px solid var(--border-glass);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem;">
                    <h3 class="font-heading">🛠️ Developer Sandbox (Role Switcher)</h3>
                    <span style="font-size: 0.7rem; color: var(--text-dim);">PROTOTYPE MODE: This bar allows you to test the UI as different users.</span>
                </div>
                <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                    ${MockUsers.map(u => `
                        <button class="btn ${currentUser.id === u.id ? 'btn-primary' : 'btn-ghost'}" 
                                onclick="switchRole('${u.id}')" 
                                style="font-size: 0.8rem;">
                            👤 ${u.name} (${u.role.replace('_', ' ')})
                        </button>
                    `).join('')}
                </div>
                <p style="margin-top:1rem; font-size: 0.8rem; color: var(--text-dim);">
                    <strong>💡 Difference:</strong> <u>Students</u> can only view approved content. <u>Developers/Admins</u> have access to 
                    the <strong>Verification Hub</strong> and <strong>System Analytics</strong> which are hidden from regular users.
                </p>
            </div>
        </div>
    `;
}

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
            <div class="notes-hub-wrapper" style="flex-direction: column; overflow-y: auto;">
                <div class="explorer-header" id="explorer-header" style="padding: 4rem 2rem; border-bottom: 1px solid var(--border-glass); background: rgba(108, 99, 255, 0.02);">
                    <div class="step-indicator" style="display: flex; justify-content: center; gap: 4rem; margin-bottom: 3rem;">
                        ${['College', 'Branch', 'Year', 'Subject'].map((s, i) => `
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

                <div id="explorer-content" style="padding: 4rem; min-height: 400px; display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 2rem;">
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
    const container = document.getElementById('explorer-content');
    container.innerHTML = GlobalData.colleges.map(c => `
        <div class="selection-card glass-card fade-in" onclick="selectCollege('${c.id}', '${c.name}')">
            <div class="card-icon" style="font-size: 3rem;">${c.logo}</div>
            <h3 class="font-heading" style="margin-top: 1.5rem;">${c.name}</h3>
            <p style="color: var(--text-dim); margin-top: 0.5rem;">Verified Academic Partner</p>
        </div>
    `).join('');
};

window.selectCollege = function (id, name) {
    selState.college = { id, name };
    trackAnalytics('select_college', { id, name });
    renderBranchStep();
};

window.renderBranchStep = function () {
    updateStepUI(1);
    document.getElementById('explorer-main-title').innerHTML = `Select your <span class="gradient-text">Branch</span>`;
    document.getElementById('explorer-sub-title').innerText = `What's your field of study at ${selState.college.name}?`;

    const container = document.getElementById('explorer-content');
    container.innerHTML = GlobalData.branches.map(b => `
        <div class="selection-card glass-card fade-in" onclick="selectBranch('${b.id}', '${b.name}')">
            <div class="card-icon" style="background: rgba(108, 99, 255, 0.1); color: var(--primary); width: 60px; height: 60px; display: flex; align-items:center; justify-content:center; border-radius: 12px; margin: 0 auto; font-size: 1.5rem;">${b.icon}</div>
            <h3 class="font-heading" style="margin-top: 1.5rem;">${b.name}</h3>
        </div>
    `).join('');
};

window.selectBranch = function (id, name) {
    selState.branch = { id, name };
    trackAnalytics('select_branch', { id, name });
    renderYearStep();
};

window.renderYearStep = function () {
    updateStepUI(2);
    document.getElementById('explorer-main-title').innerHTML = `Select your <span class="gradient-text">Academic Year</span>`;

    const container = document.getElementById('explorer-content');
    container.innerHTML = GlobalData.years.map(y => `
        <div class="selection-card glass-card fade-in" onclick="selectYear('${y}')">
            <div class="card-icon" style="font-size: 2rem; font-weight: 800; color: var(--secondary);">${y.split(' ')[0]}</div>
            <h3 class="font-heading" style="margin-top: 0.5rem;">${y}</h3>
        </div>
    `).join('');
};

window.selectYear = function (year) {
    selState.year = year;
    trackAnalytics('select_year', { year });
    renderSubjectStep();
};

window.renderSubjectStep = function () {
    updateStepUI(3);
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
                    <button class="btn btn-ghost" onclick="backToExplorer()" style="white-space:nowrap; background: rgba(255,255,255,0.05); padding: 0.6rem 1.2rem; border-radius: 8px;">↺ Restart Explorer</button>
                </div>
            </div>

            <div class="subject-content-tabs">
                <div class="sub-tab ${activeTab === 'notes' ? 'active' : ''}" onclick="switchSubjectTab('notes')">Notes</div>
                <div class="sub-tab ${activeTab === 'pyq' ? 'active' : ''}" onclick="switchSubjectTab('pyq')">PYQs</div>
                <div class="sub-tab ${activeTab === 'formula' ? 'active' : ''}" onclick="switchSubjectTab('formula')">Formula Sheets</div>
                <div class="sub-tab">✨ AI Tutor</div>
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
    // Permission-based selection
    // Students only see approved notes
    // Admins see pending + approved for their college
    const filtered = NotesDB.filter(n => {
        const isCorrectSubject = n.subject === subjectId && n.collegeId === selState.college.id && n.type === tabType;
        if (!isCorrectSubject) return false;

        const isApproved = n.status === 'approved';
        const isAdminOfCollege = (currentUser.role === Roles.SUPER_ADMIN) ||
            (currentUser.role === Roles.COLLEGE_ADMIN && currentUser.college === n.collegeId);

        if (isAdminOfCollege) return n.status !== 'rejected'; // Show everything except rejected to admins
        return isApproved; // Only approved to students/uploaders
    });

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
                        <div class="item-meta-row">
                            <span>📅 ${n.date}</span>
                            <div class="uploader-mini">
                                <div class="uploader-avatar">${n.uploader.charAt(0)}</div>
                                <span>Uploaded by ${n.uploader}</span>
                            </div>
                            <span>• ${n.downloads} downloads</span>
                        </div>
                        <div class="item-meta-row" style="font-size: 0.7rem; color: var(--success); opacity: 0.9;">
                            ${n.status === 'approved' ? `<span>✓ Verified by ${MockUsers.find(u => u.id === n.approved_by)?.name || 'Central Admin'}</span>` : ''}
                        </div>
                        <div class="item-engagement-row">
                            <span class="eng-icon">👍 ${n.likes}</span>
                            <span class="eng-icon">👎 0</span>
                            <span class="eng-icon">🔖 Save</span>
                        </div>
                    </div>
                </div>
                <div class="item-right" style="display:flex; flex-direction:column; gap:0.5rem; justify-content:center;">
                    ${n.status === 'pending' && canModerate ? `
                        <button class="btn btn-sm btn-primary" style="background: var(--success); font-size: 0.7rem; padding: 0.4rem 0.8rem;" onclick="processNote('${n.id}', 'approved')">✅ Approve</button>
                        <button class="btn btn-sm btn-ghost" style="color: #ff4757; font-size: 0.7rem;" onclick="processNote('${n.id}', 'rejected')">❌ Reject</button>
                    ` : `
                        <button class="btn-download-pro" onclick="window.open('${n.driveLink}', '_blank')">
                            📥 Download
                        </button>
                    `}
                </div>
            </div>
        `;
    }).join('');
}

window.backToExplorer = function () {
    location.reload();
};
