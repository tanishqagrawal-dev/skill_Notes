// Phase-1 Static Notes Hub Wizard Script
// Handles the "Select Institution -> Branch -> Year -> Notes" flow using static data

import { globalNotes } from "../data/globalNotes.js";
import { RoutingSystem } from "./routing.js";

// --- GLOBAL CONSTANTS ---
const LocalData = {
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
        ]
    }
};

// Use Dashboard's GlobalData if available, otherwise fallback to local
const GlobalData = window.GlobalData || LocalData;

// Use Dashboard's selState if available, otherwise fallback to local
let selState = window.selState || { college: null, branch: null, year: null, subject: null, semester: null };
if (!window.selState) window.selState = selState;

// --- GLOBAL SHOWCASE LOGIC ---
function renderGlobalShowcase() {
    const list = document.getElementById('global-notes-list');
    if (!list) return;

    // Aggregate top notes from NotesDB (Firestore)
    const topNotes = (window.NotesDB || [])
        .filter(n => n.status === 'approved')
        .sort((a, b) => ((b.likes || 0) + (b.views || 0)) - ((a.likes || 0) + (a.views || 0)))
        .slice(0, 5);

    if (topNotes.length === 0) {
        list.innerHTML = '<p style="text-align:center; padding: 2rem; color: var(--text-dim);">Fetching global hub resources...</p>';
    } else {
        list.innerHTML = renderStaticNotes(topNotes);
    }
}

// --- SHARE LOGIC ---
window.copyShareLink = async function () {
    const btn = document.getElementById('share-btn');
    const success = await RoutingSystem.copyShareLink(selState);
    if (success) {
        const originalText = btn.innerText;
        btn.innerText = '✅ Link Copied!';
        btn.style.background = 'rgba(0, 255, 127, 0.2)';
        setTimeout(() => {
            btn.innerText = originalText;
            btn.style.background = 'rgba(0, 242, 255, 0.1)';
        }, 2000);
    }
};

// --- INITIALIZATION ---

document.addEventListener('DOMContentLoaded', () => {
    // Initialize from URL if deep link exists
    const nextStep = RoutingSystem.initFromURL(
        GlobalData,
        (key, val) => { selState[key] = val; },
        (step) => { /* navigation is handled by the return value below */ }
    );

    if (nextStep === "SHOW_NOTES") {
        showNotes();
    } else if (nextStep === "SUBJECT_STEP") {
        renderSubjectStep();
    } else if (nextStep === "SEMESTER_STEP") {
        renderSemesterStep();
    } else if (nextStep === "YEAR_STEP") {
        renderYearStep();
    } else if (nextStep === "BRANCH_STEP") {
        renderBranchStep();
    } else {
        renderCollegeStep();
    }

    // Render Global Showcase
    renderGlobalShowcase();
});

// Handle browser back/forward buttons
window.addEventListener('popstate', (event) => {
    const route = RoutingSystem.parseRoute();
    if (!route.college) {
        renderCollegeStep();
    } else {
        // Simple re-run of init to restore state
        const nextStep = RoutingSystem.initFromURL(
            GlobalData,
            (key, val) => { selState[key] = val; },
            () => { }
        );
        if (nextStep === "SHOW_NOTES") showNotes();
        else if (nextStep === "SUBJECT_STEP") renderSubjectStep();
        else if (nextStep === "SEMESTER_STEP") renderSemesterStep();
        else if (nextStep === "YEAR_STEP") renderYearStep();
        else if (nextStep === "BRANCH_STEP") renderBranchStep();
        else renderCollegeStep();
    }
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
    // Reset properties to maintain reference
    selState.college = null;
    selState.branch = null;
    selState.year = null;
    selState.subject = null;
    selState.semester = null;
    RoutingSystem.updateURL(selState);
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
    RoutingSystem.updateURL(selState);
    renderBranchStep();
};

// STEP 2: Branch
window.renderBranchStep = function () {
    selState.branch = null; selState.year = null; selState.semester = null; selState.subject = null;
    RoutingSystem.updateURL(selState);
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
    RoutingSystem.updateURL(selState);
    renderYearStep();
};

// STEP 3: Year
window.renderYearStep = function () {
    selState.year = null; selState.semester = null; selState.subject = null;
    RoutingSystem.updateURL(selState);
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
    RoutingSystem.updateURL(selState);
    renderSemesterStep();
};

// STEP 4: Semester
window.renderSemesterStep = function () {
    selState.semester = null; selState.subject = null;
    RoutingSystem.updateURL(selState);
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
    RoutingSystem.updateURL(selState);
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
    selState.subject = null;
    RoutingSystem.updateURL(selState);
    ensureWizardVisible();
    updateStepUI(4);
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
        <div class="selection-card glass-card" onclick="selectSubject('${s.id}', '${s.name}')">
            <div class="card-icon" style="font-size: 2.5rem;">${s.icon}</div>
            <h3 class="font-heading" style="margin-top: 1rem;">${s.name}</h3>
        </div>
    `).join('');
};

window.selectSubject = function (id, name) {
    selState.subject = { id, name };
    RoutingSystem.updateURL(selState);
    showNotes();
};

// --- FINAL VIEW: NOTES LIST ---

window.showNotes = function (activeTab = 'notes') {
    const explorer = document.getElementById('explorer-steps-container');
    if (explorer) explorer.style.display = 'none';

    const view = document.getElementById('final-notes-view');
    view.style.display = 'block';

    const key = `${selState.branch.id}-${selState.semester}`;
    const subjectData = (GlobalData.subjects[key] || []).find(s => s.id === selState.subject.id) || {
        name: selState.subject.name,
        code: 'GEN101',
        description: 'Comprehensive study materials and verified academic resources.'
    };

    // Filter from NotesDB (Firestore)
    const subjectId = selState.subject.id;
    const collegeId = selState.college.id;

    // Hardcoded static fallback based on chosen subject
    let staticNotes = globalNotes[selState.college.id]?.[selState.subject.name];
    if (!staticNotes || staticNotes.length === 0) {
        staticNotes = globalNotes['global']?.[selState.subject.name] || [];
    }

    // Merge genuine DB nodes securely with formatted static nodes
    const combinedNotes = [...(window.NotesDB || []), ...staticNotes];

    // Remove duplicates by ID nately to prioritize DB copies and prevent duplicate key crashes
    const uniqueMap = new Map();
    combinedNotes.forEach(n => { if (n.id) uniqueMap.set(n.id, n); });
    const deduplicatedNotes = Array.from(uniqueMap.values());

    const dynamicNotes = deduplicatedNotes.filter(n =>
        n.status === 'approved' &&
        (n.type === activeTab || !n.type) &&
        ((n.subjectId === subjectId) || (n.subject === subjectId) || (n.subjectName === selState.subject.name)) &&
        ((n.collegeId === collegeId) || (n.college === collegeId) || !n.collegeId || n.collegeId === 'global')
    );
    window.currentStaticNotes = dynamicNotes;

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
                    <div style="display: flex; gap: 0.8rem;">
                        <button class="btn btn-ghost" onclick="copyShareLink()" id="share-btn" style="white-space:nowrap; background: rgba(0, 242, 255, 0.1); color: var(--secondary); padding: 0.6rem 1.2rem; border-radius: 8px;">🔗 Share Subject</button>
                        <button class="btn btn-ghost" onclick="renderCollegeStep()" style="white-space:nowrap; background: rgba(255,255,255,0.05); padding: 0.6rem 1.2rem; border-radius: 8px;">↺ Switch</button>
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
                <h2 class="font-heading" style="margin-bottom: 1.5rem; font-size: 1.6rem; color: rgba(255,255,255,0.7); display: flex; align-items: center; gap: 8px;">
                    Verified <span class="highlight" style="color: #00f2ff; font-weight: 800; text-transform: uppercase;">${activeTab}</span>
                </h2>
                <div class="notes-list-container-pro" id="resource-list-container">
                    ${(activeTab === 'notes' && dynamicNotes.length > 0) ? renderStaticNotes(dynamicNotes) : `
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
    const cards = notes.map((n, idx) => {
        const createNoteCard = (unit, title, url, likes = 8, views = 124, id = '') => {
            const noteId = id || 'undefined';
            return `
            <div class="note-card-pro card-reveal" data-note-id="${noteId}" style="animation-delay: ${idx * 0.1}s;">
                <div class="note-icon-pro">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                </div>
                
                <div class="note-info-pro">
                    <span class="unit-tag-pro">${unit}</span>
                    <h3 class="note-title-pro">${title}</h3>
                    <div class="note-actions-pro">
                        <span class="meta-pill-pro uploader">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                            Tanishq Agrawal
                        </span>
                        <span class="meta-pill-pro">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line></svg>
                            6 Feb 2026
                        </span>
                        <span class="meta-pill-pro">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            <span class="view-count">${views}</span> Views
                        </span>
                    </div>
                </div>

                <div class="note-tools-pro">
                    <button class="tool-icon-pro" onclick="toggleNoteLike('${noteId}'); event.stopPropagation();" title="Like">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                        <span class="like-count">${likes}</span>
                    </button>
                    <button class="tool-icon-pro" onclick="toggleNoteDislike('${noteId}'); event.stopPropagation();" title="Dislike">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path></svg>
                        <span class="dislike-count">0</span>
                    </button>
                    <button class="tool-icon-pro" onclick="toggleBookmark('${noteId}'); event.stopPropagation();" title="Bookmark">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                    </button>
                    <button class="tool-icon-pro" title="Share" onclick="alert('Share feature coming soon!'); event.stopPropagation();">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                    </button>
                </div>

                <a href="${url}" target="_blank" class="btn-download-white" onclick="updateNoteStat('${noteId}', 'download');">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    Download
                </a>
            </div>`;
        };

        return createNoteCard(n.unit || `UNIT ${idx + 1}`, n.title || n.subjectName, n.url || n.fileUrl || n.driveLink, n.likes || 12, n.views || 48, n.id);
    }).join('');

    setTimeout(() => {
        if (typeof attachNoteRealtimeListeners === 'function') attachNoteRealtimeListeners('final-notes-view');
        notes.forEach(n => {
            if (n.id && typeof window.incrementNoteView === 'function') window.incrementNoteView(n.id);
        });
    }, 150);

    return cards;
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
