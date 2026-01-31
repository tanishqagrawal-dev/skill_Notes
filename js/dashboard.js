/**
 * Smart Academic Notes Hub - Data Engine v3 (Hierarchical Explorer)
 * Selection Flow: College -> Branch -> Year -> Subject -> Notes
 */

// --- HIERARCHICAL MOCK DATABASE ---
// --- HIERARCHICAL MOCK DATABASE ---
// --- HIERARCHICAL MOCK DATABASE ---
const GlobalData = {
    colleges: [
        { id: 'medicaps', name: 'Medi-Caps University', logo: '�️' },
        { id: 'lpu', name: 'LPU University', logo: '�' },
        { id: 'iitd', name: 'IIT Delhi', logo: '�' }
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
            { id: 'python', name: 'Python for AI', icon: '�', code: 'AL201', description: 'Numerical computing with NumPy and Data Science foundations.' }
        ]
    }
};

const NotesDB = [
    {
        id: 'mc1',
        title: 'Operating Systems - Complete Handwritten Notes (Unit 1-5)',
        collegeId: 'medicaps',
        branchId: 'cse',
        year: '2nd Year',
        subject: 'os',
        views: 4200,
        downloads: 1200,
        likes: 450,
        uploader: 'Arjun M.',
        approved: true,
        date: 'Jan 28, 2026',
        badge: '🔥 HOT',
        driveLink: 'https://drive.google.com/drive/folders/1BN6ytHOWPdpLTG1v3A2CoPw8lbluoG5L'
    },
    {
        id: 'mc2',
        title: 'DBMS SQL & Normalization Mastery',
        collegeId: 'medicaps',
        branchId: 'cse',
        year: '2nd Year',
        subject: 'dbms',
        views: 2800,
        downloads: 950,
        likes: 310,
        uploader: 'Sakshi V.',
        approved: true,
        date: 'Jan 15, 2026',
        badge: '⭐ TOP',
        driveLink: 'https://drive.google.com/drive/folders/1OyZWpofSNatDdXt7KxSQNBE_F5NtucPn'
    },
    {
        id: 'mc3',
        title: 'Data Structures & Algorithms - Practical File',
        collegeId: 'medicaps',
        branchId: 'cse',
        year: '2nd Year',
        subject: 'dsa',
        views: 1900,
        downloads: 640,
        likes: 180,
        uploader: 'Rohit S.',
        approved: true,
        date: 'Feb 01, 2026',
        badge: '✨ NEW',
        driveLink: 'https://drive.google.com/drive/folders/1k8JeCex-KnS82jRrAjMvkojlNVjXI81k'
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
});

function initTabs() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = item.getAttribute('data-tab');
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            renderTabContent(tabId);
            trackAnalytics('tab_switch', { name: tabId });
        });
    });
}

function renderTabContent(tabId) {
    const contentArea = document.getElementById('tab-content');
    if (!contentArea) return;

    if (tabId === 'overview') {
        contentArea.innerHTML = renderOverview();
    } else if (tabId === 'notes') {
        selState = { college: null, branch: null, year: null, subject: null };
        contentArea.innerHTML = renderNotesHub();
        renderCollegeStep();
    } else {
        contentArea.innerHTML = `<div class="tab-pane active"><h1 class="font-heading">${tabId}</h1><p>Coming soon...</p></div>`;
    }
}

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
            <!-- Stats omitted for brevity, can be re-added as per previous build -->
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

function showNotes() {
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
                <div class="sub-tab active">Notes</div>
                <div class="sub-tab">PYQs</div>
                <div class="sub-tab">Formula Sheets</div>
                <div class="sub-tab">✨ AI Tutor</div>
            </div>

            <div class="resource-section">
                <h3 class="font-heading" style="margin-bottom: 2rem;">Verified <span class="highlight">Notes</span></h3>
                <div class="resource-list-detailed">
                    ${renderDetailedNotes(selState.subject.id)}
                </div>
            </div>
        </div>
    `;
}

function renderDetailedNotes(subjectId) {
    const filtered = NotesDB.filter(n => n.subject === subjectId && n.collegeId === selState.college.id);

    if (filtered.length === 0) {
        return `
            <div style="text-align: center; padding: 5rem; background: rgba(255,255,255,0.01); border: 2px dashed rgba(255,255,255,0.05); border-radius: 20px;">
                <div style="font-size: 4rem; margin-bottom: 2rem;">📂</div>
                <h2 class="font-heading">No premium notes for this subject found yet.</h2>
                <p style="color: var(--text-dim); margin-bottom: 2.5rem;">Be the first contributor and earn academic credit!</p>
                <button class="btn btn-primary" style="padding: 1rem 2.5rem; font-weight: 700;">+ Upload Note</button>
            </div>
        `;
    }

    return filtered.map(n => `
        <div class="detailed-item glass-card card-reveal">
            <div class="item-left">
                <div class="file-type-icon">📄</div>
                <div class="item-info-block">
                    <div class="item-title">${n.title}</div>
                    <div class="item-meta-row">
                        <span>📅 ${n.date}</span>
                        <div class="uploader-mini">
                            <div class="uploader-avatar">${n.uploader.charAt(0)}</div>
                            <span>${n.uploader}</span>
                        </div>
                        <span>• ${n.downloads} downloads</span>
                    </div>
                    <div class="item-engagement-row">
                        <span class="eng-icon">� ${n.likes}</span>
                        <span class="eng-icon">👎 0</span>
                        <span class="eng-icon">� Save</span>
                    </div>
                </div>
            </div>
            <div class="item-right">
                <button class="btn-download-pro" onclick="alert('Preparing high-quality PDF...')">
                    📥 Download
                </button>
            </div>
        </div>
    `).join('');
}

window.backToExplorer = function () {
    location.reload();
};
