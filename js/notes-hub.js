// Phase-1 Static Notes Hub Wizard Script
// Handles the "Select Institution -> Branch -> Year -> Notes" flow using static data

import { globalNotes } from "../data/globalNotes.js";

// --- GLOBAL CONSTANTS ---
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
            { id: 'Advanced Java Programming', name: 'Advanced Java Programming', icon: '☕', code: 'CS402', description: 'Core Advanced Java concepts: Collections, Multithreading, and Networking.' },
            { id: 'dbms', name: 'DBMS', icon: '🗄️', code: 'CS403', description: 'Relational models, SQL query optimization, and transaction control.' },
            { id: 'dsa', name: 'Data Structures', icon: '🌳', code: 'CS404', description: 'Trees, Graphs, and Advanced Algorithms.' }
        ],
        'aiml-2nd Year': [
            { id: 'python', name: 'Python for AI', icon: '🐍', code: 'AL201', description: 'Numerical computing with NumPy and Data Science foundations.' }
        ],
        'cse-1st Year': [
            { id: 'phy', name: 'Engineering Physics', icon: '⚛️', code: 'PH101', description: 'Quantum mechanics, Optics, and Semiconductors syllabus.' }
        ]
    }
};

let selState = { college: null, branch: null, year: null, subject: null };

// --- GLOBAL SHOWCASE LOGIC ---
function renderGlobalShowcase() {
    const list = document.getElementById('global-notes-list');
    if (!list) return;

    // Aggregate all notes under 'global' category
    const allGlobalNotes = [];
    if (globalNotes.global) {
        Object.values(globalNotes.global).forEach(notesArray => {
            allGlobalNotes.push(...notesArray);
        });
    }

    if (allGlobalNotes.length === 0) {
        list.innerHTML = '<p style="text-align:center; padding: 2rem; color: var(--text-dim);">Coming soon to the global hub.</p>';
    } else {
        list.innerHTML = renderStaticNotes(allGlobalNotes);
    }
}

// --- WIZARD RENDER LOGIC ---

document.addEventListener('DOMContentLoaded', () => {
    // Start Wizard
    renderCollegeStep();
    // Render Global Showcase
    renderGlobalShowcase();
});

// Helper: Update Step Indicators
function updateStepUI(activeIdx) {
    document.querySelectorAll('.step-node').forEach((node, i) => {
        node.classList.remove('active', 'completed');
        if (i < activeIdx) node.classList.add('completed');
        if (i === activeIdx) node.classList.add('active');
    });
}

// Helper: Ensure Wizard Container is visible
function ensureWizardVisible() {
    const view = document.getElementById('final-notes-view');
    const explorer = document.getElementById('explorer-steps-container');
    if (view) view.style.display = 'none';
    if (explorer) explorer.style.display = 'flex';
}

// STEP 1: College
window.renderCollegeStep = function () {
    ensureWizardVisible();
    updateStepUI(0);
    const container = document.getElementById('explorer-content');
    if (!container) return;

    // Reset Title
    document.getElementById('explorer-main-title').innerHTML = `Select your <span class="gradient-text">Institution</span>`;
    document.getElementById('explorer-sub-title').innerText = `Choose your college to start browsing localized content.`;

    container.innerHTML = GlobalData.colleges.map(c => `
        <div class="selection-card glass-card" onclick="selectCollege('${c.id}', '${c.name}')">
            <div class="card-icon" style="font-size: 3rem;">${c.logo}</div>
            <h3 class="font-heading" style="margin-top: 1.5rem;">${c.name}</h3>
            <p style="color: var(--text-dim); margin-top: 0.5rem;">Verified Academic Partner</p>
        </div>
    `).join('');
};

window.selectCollege = function (id, name) {
    selState.college = { id, name };
    renderBranchStep();
};

// STEP 2: Branch
window.renderBranchStep = function () {
    ensureWizardVisible();
    updateStepUI(1);
    document.getElementById('explorer-main-title').innerHTML = `Select your <span class="gradient-text">Branch</span>`;
    document.getElementById('explorer-sub-title').innerText = `What's your field of study at ${selState.college.name}?`;

    const container = document.getElementById('explorer-content');
    container.innerHTML = GlobalData.branches.map(b => `
        <div class="selection-card glass-card" onclick="selectBranch('${b.id}', '${b.name}')">
            <div class="card-icon" style="background: rgba(108, 99, 255, 0.1); color: var(--primary); width: 60px; height: 60px; display: flex; align-items:center; justify-content:center; border-radius: 12px; margin: 0 auto; font-size: 1.5rem;">${b.icon}</div>
            <h3 class="font-heading" style="margin-top: 1.5rem;">${b.name}</h3>
        </div>
    `).join('');
};

window.selectBranch = function (id, name) {
    selState.branch = { id, name };
    renderYearStep();
};

// STEP 3: Year
window.renderYearStep = function () {
    ensureWizardVisible();
    updateStepUI(2);
    document.getElementById('explorer-main-title').innerHTML = `Select your <span class="gradient-text">Academic Year</span>`;
    const container = document.getElementById('explorer-content');
    container.innerHTML = GlobalData.years.map(y => `
        <div class="selection-card glass-card" onclick="selectYear('${y}')">
            <div class="card-icon" style="font-size: 2rem; font-weight: 800; color: var(--secondary);">${y.split(' ')[0]}</div>
            <h3 class="font-heading" style="margin-top: 0.5rem;">${y}</h3>
        </div>
    `).join('');
};

window.selectYear = function (year) {
    selState.year = year;
    renderSemesterStep();
};

// STEP 4: Semester
window.renderSemesterStep = function () {
    ensureWizardVisible();
    updateStepUI(3);
    document.getElementById('explorer-main-title').innerHTML = `Select <span class="gradient-text">Semester</span>`;
    const container = document.getElementById('explorer-content');
    const semesters = ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'];

    container.innerHTML = semesters.map(s => `
        <div class="selection-card glass-card" onclick="selectSemester('${s}')">
            <div class="card-icon" style="font-size: 1.5rem; font-weight: 700; color: var(--primary);">${s.split(' ')[1]}</div>
            <h3 class="font-heading" style="margin-top: 0.5rem;">${s}</h3>
        </div>
    `).join('');
}

window.selectSemester = function (sem) {
    selState.semester = sem;
    renderSubjectStep();
}

window.currentStaticNotes = [];

window.filterNotes = function (query) {
    const container = document.getElementById('resource-list-container');
    if (!container) return;

    const term = query.toLowerCase();
    const filtered = window.currentStaticNotes.filter(n =>
        (n.title && n.title.toLowerCase().includes(term)) ||
        (n.unit && n.unit.toLowerCase().includes(term)) ||
        (n.subjectName && n.subjectName.toLowerCase().includes(term))
    );

    if (filtered.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 4rem; opacity: 0.7;">
                <h3>No matches found</h3>
                <p>Try a different keyword</p>
            </div>`;
    } else {
        container.innerHTML = renderStaticNotes(filtered);
        // Re-attach listeners
        setTimeout(() => {
            if (typeof attachNoteRealtimeListeners === 'function') attachNoteRealtimeListeners('resource-list-container');
        }, 50);
    }
};

// STEP 5: Subject
window.renderSubjectStep = function () {
    ensureWizardVisible();
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
        <div class="selection-card glass-card" onclick="selectSubject('${s.id}', '${s.name}')">
            <div class="card-icon" style="font-size: 2.5rem;">${s.icon}</div>
            <h3 class="font-heading" style="margin-top: 1rem;">${s.name}</h3>
        </div>
    `).join('');
};

window.selectSubject = function (id, name) {
    selState.subject = { id, name };
    showNotes();
};

// --- FINAL VIEW: NOTES LIST ---

window.showNotes = function (activeTab = 'notes') {
    const explorer = document.getElementById('explorer-steps-container');
    if (explorer) explorer.style.display = 'none';

    const view = document.getElementById('final-notes-view');
    view.style.display = 'block';

    const key = `${selState.branch.id}-${selState.year}`;
    const subjectData = (GlobalData.subjects[key] || []).find(s => s.id === selState.subject.id) || {
        name: selState.subject.name,
        code: 'GEN101',
        description: 'Comprehensive study materials and verified academic resources.'
    };

    // Lookup static notes
    const staticNotes = globalNotes[selState.college.id]?.[selState.subject.name] || [];
    window.currentStaticNotes = staticNotes;

    view.innerHTML = `
        <style>
            .breadcrumb-pro {
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 0.95rem;
                font-weight: 600;
                margin-bottom: 2.5rem;
                color: rgba(255, 255, 255, 0.4);
            }
            .breadcrumb-pro span.link {
                color: #4facfe;
                cursor: pointer;
                transition: 0.3s;
                display: flex;
                align-items: center;
                gap: 4px;
            }
            .breadcrumb-pro span.link:hover {
                color: #00f2ff;
                transform: translateX(2px);
            }
            .breadcrumb-pro .sep {
                opacity: 0.3;
                font-weight: 300;
            }
            .breadcrumb-pro .current {
                color: rgba(255, 255, 255, 0.8);
                cursor: default;
            }
        </style>

        <div class="subject-page-container fade-in">
            <div class="breadcrumb-pro">
                <span class="link" onclick="renderCollegeStep()">🏠 Home</span>
                <span class="sep">›</span>
                <span class="link" onclick="renderBranchStep()">${selState.branch.name}</span>
                <span class="sep">›</span>
                <span class="link" onclick="renderSemesterStep()">${selState.semester || 'Semester'}</span>
                <span class="sep">›</span>
                <span class="current">${selState.subject.name}</span>
            </div>

            <div class="subject-page-hero">
                <div style="display:flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <h1 class="font-heading" style="font-size: 3rem; margin: 0; line-height: 1.1;">${selState.subject.name}</h1>
                        <div class="sub-badges" style="margin-top: 0.8rem;">
                            <span class="meta-badge">${selState.branch.id}</span>
                            <span class="meta-badge">${selState.year}</span>
                            <span class="meta-badge">${subjectData.code}</span>
                        </div>
                        <p class="subject-description">${subjectData.description}</p>
                    </div>
                    <div>
                        <button class="btn btn-ghost" onclick="renderCollegeStep()" style="white-space:nowrap; background: rgba(255,255,255,0.05); padding: 0.6rem 1.2rem; border-radius: 8px;">↺ Switch Subject</button>
                    </div>
                </div>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
                <div class="subject-tabs-nav" style="margin-bottom: 0;">
                    <div class="subject-tab ${activeTab === 'notes' ? 'active' : ''}" onclick="window.switchSubjectTab('notes')">Notes</div>
                    <div class="subject-tab ${activeTab === 'pyqs' ? 'active' : ''}" onclick="window.switchSubjectTab('pyqs')">PYQs</div>
                    <div class="subject-tab ${activeTab === 'formula' ? 'active' : ''}" onclick="window.switchSubjectTab('formula')">Formula Sheets</div>
                </div>
                <div style="position: relative; min-width: 250px;">
                    <input type="text" id="search-notes" placeholder="Search in ${selState.subject.name}..." 
                           oninput="window.filterNotes(this.value)"
                           style="width: 100%; padding: 10px 15px; padding-right: 40px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; color: white; outline: none; transition: 0.3s;">
                    <span style="position: absolute; right: 15px; top: 50%; transform: translateY(-50%); opacity: 0.5;">🔍</span>
                </div>
            </div>

            <div class="resource-section">
                <h2 class="font-heading" style="margin-bottom: 1.5rem; font-size: 1.6rem; color: rgba(255,255,255,0.7);">Verified <span class="highlight" style="color: #00f2ff; font-weight: 800;">${activeTab.toUpperCase()}</span></h2>
                <div class="notes-list-container-pro" id="resource-list-container">
                    ${(activeTab === 'notes' && staticNotes.length > 0) ? renderStaticNotes(staticNotes) : `
                        <div style="text-align: center; padding: 5rem; background: rgba(255,255,255,0.01); border: 2px dashed rgba(255,255,255,0.05); border-radius: 20px;">
                            <div style="font-size: 4rem; margin-bottom: 2rem;">📂</div>
                            <h2 class="font-heading">No ${activeTab} found for this subject yet.</h2>
                            <p style="color: var(--text-dim);">Static Phase-1 MVP only includes specific subjects for now.</p>
                            <button class="btn btn-primary" style="margin-top: 1.5rem;" onclick="renderCollegeStep()">Try Another Subject</button>
                        </div>
                    `}
                </div>
            </div>
        </div>
    `;
};

function renderStaticNotes(notes) {
    const futuristicStyles = `
        <style>
            .notes-list-container-pro {
                display: flex;
                flex-direction: column;
                gap: 16px;
                width: 100%;
                padding: 10px 0;
            }

            .note-card {
                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: space-between;
                padding: 16px 28px;
                background: rgba(255, 255, 255, 0.04);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.05);
                border-radius: 18px;
                position: relative;
                transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                overflow: hidden;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            }

            .note-card::before {
                content: '';
                position: absolute;
                left: 0;
                top: 0;
                bottom: 0;
                width: 5px;
                background: linear-gradient(180deg, #00f2ff, #7000ff);
                box-shadow: 3px 0 15px rgba(0, 242, 255, 0.4);
                transition: 0.3s;
            }

            .note-card:hover {
                transform: translateY(-4px) scale(1.01);
                background: rgba(255, 255, 255, 0.06);
                box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
                border-color: rgba(0, 242, 255, 0.2);
            }

            .note-card-left {
                display: flex;
                align-items: center;
                gap: 20px;
                flex-grow: 1;
            }

            .note-icon-box {
                width: 50px;
                height: 50px;
                background: rgba(0, 242, 255, 0.1);
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #00f2ff;
                border: 1px solid rgba(0, 242, 255, 0.2);
                flex-shrink: 0;
                box-shadow: 0 0 20px rgba(0, 242, 255, 0.1);
            }

            .note-info-stack {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .unit-label {
                color: #00f2ff;
                font-weight: 800;
                font-size: 0.65rem;
                text-transform: uppercase;
                letter-spacing: 2px;
                margin: 0;
            }

            .note-card h3 {
                font-size: 1.25rem;
                font-weight: 900;
                color: #FFFFFF;
                margin: 0;
                letter-spacing: 0.5px;
                text-transform: uppercase;
                text-shadow: 0 2px 10px rgba(0,0,0,0.3);
            }

            .note-meta-pills {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
            }

            .meta-pill {
                display: flex;
                align-items: center;
                gap: 6px;
                background: rgba(70, 70, 90, 0.4);
                padding: 4px 12px;
                border-radius: 8px;
                font-size: 0.75rem;
                color: #e0e0f0;
                font-weight: 600;
                border: 1px solid rgba(255, 255, 255, 0.05);
                backdrop-filter: blur(5px);
            }

            .meta-pill.views { color: #00f2ff; background: rgba(0, 242, 255, 0.05); border-color: rgba(0, 242, 255, 0.1); }
            .meta-pill svg { stroke-width: 2.5; }

            .note-interactions {
                display: flex;
                gap: 10px;
            }

            .int-btn {
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid rgba(255, 255, 255, 0.1);
                color: #FFFFFF;
                padding: 4px 10px;
                border-radius: 8px;
                font-size: 0.8rem;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                transition: 0.3s;
                font-weight: 700;
            }

            .int-btn:hover {
                background: rgba(255, 255, 255, 0.1);
                border-color: rgba(255, 255, 255, 0.2);
                transform: translateY(-2px);
            }

            .int-btn.active {
                background: rgba(255, 45, 85, 0.1);
                color: #ff2d55;
                border-color: rgba(255, 45, 85, 0.3);
            }

            .download-btn-premium {
                background: #FFFFFF;
                color: #000000 !important;
                padding: 12px 32px;
                border: none;
                border-radius: 50px;
                font-weight: 900;
                font-size: 0.85rem;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 10px;
                transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.2);
                text-transform: uppercase;
                letter-spacing: 1.5px;
                box-shadow: 0 10px 25px rgba(255, 255, 255, 0.2);
                text-decoration: none;
                white-space: nowrap;
                position: relative;
                overflow: hidden;
                flex-shrink: 0;
            }

            .download-btn-premium:hover {
                transform: translateY(-3px) scale(1.05);
                box-shadow: 0 15px 35px rgba(255, 255, 255, 0.4);
                background: #f0f0f0;
            }

            .download-btn-premium svg { stroke-width: 3.5; }

            @keyframes rowEntrance {
                from { opacity: 0; transform: translateY(30px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .card-reveal {
                animation: rowEntrance 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
            }

            @media (max-width: 900px) {
                .note-card { flex-direction: column; align-items: flex-start; gap: 20px; padding: 20px 24px; }
                .download-btn-premium { width: 100%; justify-content: center; }
            }

            @media (max-width: 480px) {
                .note-card-left { gap: 16px; }
                .note-icon-box { width: 44px; height: 44px; }
                .note-card h3 { font-size: 1.1rem; }
            }
        </style>
    `;

    const cards = notes.map((n, idx) => {
        // Reusable card template logic
        const createNoteCard = (unit, title, url, likes = 8, views = 124, id = '') => {
            const noteId = id || `hub-${unit.replace(/\s+/g, '-').toLowerCase()}-${title.replace(/\s+/g, '-').toLowerCase()}`;
            return `
            <div class="note-card card-reveal" data-note-id="${noteId}" style="animation-delay: ${idx * 0.1}s;">
                <div class="note-card-left">
                    <div class="note-icon-box">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    </div>
                    <div class="note-info-stack">
                        <span class="unit-label">${unit}</span>
                        <h3>${title}</h3>
                        <div class="note-meta-pills">
                            <span class="meta-pill">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                Official Resource
                            </span>
                            <span class="meta-pill">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line></svg>
                                Feb 2026
                            </span>
                            <span class="meta-pill views">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                <span class="count">${views}</span>
                            </span>
                        </div>
                        <div class="note-interactions">
                            <button class="int-btn like-btn" onclick="toggleNoteLike('${noteId}'); event.stopPropagation();">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                                <span class="count">${likes}</span>
                            </button>
                            <button class="int-btn bookmark-btn" onclick="this.classList.toggle('active'); event.stopPropagation();">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                            </button>
                        </div>
                    </div>
                </div>

                <a href="${url}" target="_blank" class="download-btn-premium" onclick="updateNoteStat('${noteId}', 'download');">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    DOWNLOAD
                </a>
            </div>`;
        };

        return createNoteCard(n.unit || `UNIT ${idx + 1}`, n.title || n.subjectName, n.url || n.fileUrl || n.driveLink, n.likes || 12, n.views || 48, n.id);
    }).join('');

    setTimeout(() => {
        if (typeof attachNoteRealtimeListeners === 'function') attachNoteRealtimeListeners('final-notes-view');
        notes.forEach(n => {
            const noteId = n.id || `hub-${(n.unit || 'unit-1').toLowerCase()}-${(n.title || '').toLowerCase()}`;
            if (typeof window.incrementNoteView === 'function') window.incrementNoteView(noteId);
        });
    }, 150);

    return futuristicStyles + cards;
}

window.switchSubjectTab = function (tab) {
    showNotes(tab);
};

// Attach to window for HTML onclicks
window.selectCollege = selectCollege;
window.selectBranch = selectBranch;
window.selectYear = selectYear;
window.selectSemester = selectSemester;
window.selectSubject = selectSubject;
window.renderCollegeStep = renderCollegeStep;
window.showNotes = showNotes;
