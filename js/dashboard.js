// --- FIREBASE SERVICES ---
const { auth, db, provider, signInWithPopup, signOut, onAuthStateChanged, collection, addDoc, onSnapshot, updateDoc, doc, increment, query, orderBy, where } = window.firebaseServices;

// --- RBAC & USER SYSTEM ---
const Roles = {
    SUPER_ADMIN: 'super_admin',
    COLLEGE_ADMIN: 'college_admin',
    UPLOADER: 'uploader',
    STUDENT: 'student'
};

const MockUsers = []; // Deprecated but kept for refernece if needed

// Current session
let currentUser = null;

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

let NotesDB = [];
let unsubscribeNotes = null;

// --- APP STATE ---
let selState = { college: null, branch: null, year: null, subject: null };

// --- ANALYTICS & SMART RANKING ---
function trackAnalytics(eventType, data) {
    console.log(`[Analytics] ${eventType}:`, data);
    if (typeof gtag === 'function') {
        gtag('event', eventType, { 'event_category': 'Explorer', 'event_label': data.id || data.name });
    }
    // Real-time DB Analytics
    if (currentUser && db) {
        addDoc(collection(db, "analytics_logs"), {
            eventType,
            data,
            userId: currentUser.id,
            timestamp: new Date().toISOString()
        }).catch(e => console.error("Analytics Error:", e));
    }
}

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

// Real-time Database Stat Incrementor
window.updateNoteStat = async function (noteId, type) {
    // Immediate UI Optimistic Update
    const note = NotesDB.find(n => n.id === noteId);
    if (note) {
        if (type === 'view') note.views++;
        if (type === 'download') note.downloads++;
        if (type === 'like') {
            note.likes++;
            alert("💖 Added to your liked resources!");
        }
        // Refresh UI
        if (document.getElementById('final-notes-view').style.display === 'block') {
            const activeTabElement = document.querySelector('.sub-tab.active');
            const activeTab = activeTabElement ? activeTabElement.innerText.toLowerCase().includes('pyq') ? 'pyq' : (activeTabElement.innerText.toLowerCase().includes('formula') ? 'formula' : 'notes') : 'notes';
            // showNotes(activeTab); // Avoid full re-render flickering, just let Firestore listener handle it eventually
        }
    }

    // Firestore Update
    try {
        const noteRef = doc(db, "notes", noteId);
        await updateDoc(noteRef, {
            [type + 's']: increment(1) // views, downloads, likes
        });
        trackAnalytics(`note_${type}`, { id: noteId, title: note ? note.title : 'Unknown' });
    } catch (error) {
        console.error("Error updating stats:", error);
    }
}

// --- CORE DASHBOARD LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
    initAuthSystem();

    // Global listener for + Upload Note button in sidebar/header
    const uploadBtns = document.querySelectorAll('.upload-btn');
    uploadBtns.forEach(btn => {
        btn.onclick = () => openUploadModal();
    });

    // Global Search Engine
    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) {
        searchInput.onkeyup = (e) => {
            const query = e.target.value.toLowerCase();
            if (query.length > 2) {
                performGlobalSearch(query);
            } else if (query.length === 0) {
                renderTabContent('overview'); // Reset to default
            }
        };
    }
});

function performGlobalSearch(query) {
    const contentArea = document.getElementById('tab-content');
    const results = NotesDB.filter(n =>
        n.title.toLowerCase().includes(query) ||
        n.subject.toLowerCase().includes(query) ||
        n.uploader.toLowerCase().includes(query)
    );

    contentArea.innerHTML = `
        <div class="tab-pane active fade-in" style="padding: 2rem;">
            <h2 class="font-heading" style="margin-bottom: 2rem;">Search Results for "<span class="highlight">${query}</span>"</h2>
            <div class="resource-list-detailed">
                ${results.length > 0 ? results.map(n => renderSearchItem(n)).join('') : '<p>No matching notes found.</p>'}
            </div>
        </div>
    `;
}

function renderSearchItem(n) {
    return `
        <div class="detailed-item glass-card" style="margin-bottom: 1rem;">
            <div class="item-left">
                <div class="file-type-icon">🔍</div>
                <div class="item-info-block">
                    <div class="item-title">${n.title}</div>
                    <div class="item-meta-row">
                        <span>${n.collegeId.toUpperCase()} • ${n.subject.toUpperCase()}</span>
                        <span>👤 ${n.uploader}</span>
                    </div>
                </div>
            </div>
            <div class="item-right">
                <button class="btn btn-primary" onclick="jumpToNote('${n.id}')">View Details</button>
            </div>
        </div>
    `;
}

window.jumpToNote = function (id) {
    const note = NotesDB.find(n => n.id === id);
    if (!note) return;

    // Mock navigation state
    selState = {
        college: { id: note.collegeId },
        branch: { id: note.branchId },
        year: note.year,
        subject: { id: note.subject }
    };

    showNotes(note.type);
};

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
    if (meta) {
        let roleDisplay = currentUser.role.replace('_', ' ').toUpperCase();
        meta.innerText = `${roleDisplay} • ${currentUser.college ? currentUser.college.toUpperCase() : 'Guest'}`;
    }

    // Add logout option to user-info if not present
    const userInfo = document.querySelector('.user-info');
    if (userInfo && !document.getElementById('logout-btn')) {
        const logoutBtn = document.createElement('div');
        logoutBtn.id = 'logout-btn';
        logoutBtn.style.fontSize = '0.7rem';
        logoutBtn.style.color = '#ff4757';
        logoutBtn.style.cursor = 'pointer';
        logoutBtn.innerHTML = 'Sign Out';
        logoutBtn.onclick = window.logout;
        userInfo.appendChild(logoutBtn);
    }
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
                    <div class="step-indicator" style="display: flex; justify-content: center; gap: 3rem; margin-bottom: 3rem;">
                        ${['College', 'Branch', 'Year', 'Semester', 'Subject'].map((s, i) => `
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
    renderSemesterStep();
};

window.renderSemesterStep = function () {
    updateStepUI(3);
    document.getElementById('explorer-main-title').innerHTML = `Select <span class="gradient-text">Semester</span>`;
    const container = document.getElementById('explorer-content');
    const semesters = ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'];

    container.innerHTML = semesters.map(s => `
        <div class="selection-card glass-card fade-in" onclick="selectSemester('${s}')">
            <div class="card-icon" style="font-size: 1.5rem; font-weight: 700; color: var(--primary);">${s.split(' ')[1]}</div>
            <h3 class="font-heading" style="margin-top: 0.5rem;">${s}</h3>
        </div>
    `).join('');
}

window.selectSemester = function (sem) {
    selState.semester = sem;
    trackAnalytics('select_semester', { sem });
    renderSubjectStep();
}

window.renderSubjectStep = function () {
    updateStepUI(4);
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

// --- AUTH & DB FUNCTIONS ---

window.initAuthSystem = function () {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("User logged in:", user.email);
            // Enhanced user object
            let mappedRole = Roles.STUDENT;
            // Simple email-based role mapping for demo
            if (user.email.includes('skillhub') || user.email === 'admin@skillhub.com') mappedRole = Roles.SUPER_ADMIN;

            currentUser = {
                id: user.uid,
                name: user.displayName || user.email,
                email: user.email,
                photo: user.photoURL,
                role: mappedRole,
                college: 'medicaps' // Default
            };

            updateUserProfileUI();
            initRealTimeDB();
            initTabs();
            renderTabContent('overview');
        } else {
            console.log("User logged out");
            currentUser = null;
            renderLoginScreen();
        }
    });
};

window.loginWithGoogle = function () {
    signInWithPopup(auth, provider)
        .then((result) => {
            console.log("Login success");
        }).catch((error) => {
            console.error("Login failed", error);
            alert("Login failed: " + error.message);
        });
};

window.logout = function () {
    signOut(auth).then(() => {
        location.reload();
    });
};

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
    if (unsubscribeNotes) unsubscribeNotes();

    // Listen to Notes - Fetching ALL notes for client-side filtering (optimization: use queries per step)
    // For this size of app, fetching all metadata is okay.
    const q = query(collection(db, "notes"), orderBy("created_at", "desc"));
    unsubscribeNotes = onSnapshot(q, (snapshot) => {
        NotesDB = [];
        snapshot.forEach((doc) => {
            NotesDB.push({ id: doc.id, ...doc.data() });
        });
        console.log(`Synced ${NotesDB.length} notes from Firestore`);

        // Refresh specific views if active
        // e.g. if we are on global search or just loaded
        if (document.getElementById('final-notes-view')?.style.display === 'block') {
            // Optional: trigger re-render
        }
    });
}

function renderLoginScreen() {
    const contentArea = document.getElementById('tab-content');
    if (contentArea) {
        contentArea.innerHTML = `
            <div style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;" class="fade-in">
                <div class="glass-card" style="padding: 4rem; max-width: 500px; border: 1px solid var(--primary);">
                    <h1 class="font-heading" style="font-size: 2.5rem; margin-bottom: 1rem;">Welcome to <span class="gradient-text">SmartOS</span></h1>
                    <p style="color: var(--text-dim); margin-bottom: 2rem;">
                        Sign in to access your personalized academic dashboard, real-time notes, and AI tools.
                    </p>
                    <button class="btn btn-primary btn-large" onclick="loginWithGoogle()" style="padding: 1rem 2rem; font-size: 1.1rem; width: 100%;">
                        <span style="margin-right: 10px;">🇬</span> Continue with Google
                    </button>
                    <div style="margin-top: 1rem;">
                        <button class="btn btn-ghost" onclick="loginAsGuest()" style="width: 100%; border: 1px solid rgba(255,255,255,0.1);">
                            👤 Continue as Guest (Testing)
                        </button>
                    </div>
                    <p style="margin-top:1rem; font-size:0.8rem; color:var(--text-dim);">Secure access via Firebase Auth</p>
                </div>
            </div>
        `;
    }
}
