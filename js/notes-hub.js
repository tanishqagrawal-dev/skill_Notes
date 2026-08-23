// Phase-1 Static Notes Hub Wizard Script
// Handles the "Select Institution -> Branch -> Year -> Notes" flow using static data

import { globalNotes } from "../data/globalNotes.js?v=6.0";
import { RoutingSystem } from "./routing.js?v=6.0";

// --- GLOBAL CONSTANTS ---
const LocalData = {
    colleges: [
        { id: 'medicaps', name: 'Medicaps University', logo: 'assets/logos/medicaps.png' },
        { id: 'ips', name: 'IPS Academy', logo: 'assets/logos/ips.png' },
        { id: 'lnct', name: 'LNCT COLLEGE BHOPAL', logo: 'assets/logos/lnct.jpg' },
        { id: 'cdgi', name: 'CDGI University', logo: 'assets/logos/cdgi.png' }
    ],
    branches: [
        { id: 'cse', name: 'Computer Science', icon: '💻' },
        { id: 'ece', name: 'Electronics', icon: '⚡' },
        { id: 'me', name: 'Mechanical', icon: '⚙️' },
        { id: 'aiml', name: 'AI & Machine Learning', icon: '🧠' },
        { id: 'advanced-ai-ibm', name: 'ADVANCED AI-IBM', icon: '🤖' }
    ],
    years: ['1st Year', '2nd Year', '3rd Year', '4th Year']
};

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

// --- SHARE LOGIC REMOVED (Now in note-actions.js) ---

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

    // Listen for real-time college updates from dashboard.js
    window.addEventListener('collegesUpdated', (e) => {
        console.log("♻️ Notes Hub: Colleges Updated, refreshing UI...");
        const route = RoutingSystem.parseRoute();
        if (!route.college) {
            renderCollegeStep();
        }
    });
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

    // Handle empty state (Loading from Firestore)
    if (!GlobalData.colleges || GlobalData.colleges.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 4rem; opacity: 0.7;">
                <div class="loader-ripple" style="margin: 0 auto 1.5rem;"><div></div><div></div></div>
                <h3>Syncing Institutions...</h3>
                <p>Establishing connection to Academic Cloud.</p>
            </div>`;
        return;
    }

    container.innerHTML = GlobalData.colleges.map(c => `
        <div class="selection-card glass-card" 
             onclick="selectCollege('${c.id}', '${c.name}')">
            <div class="card-icon" style="font-size: 3rem;">${c.logo || '🏛️'}</div>
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
window.renderSubjectStep = async function () {
    selState.subject = null;
    RoutingSystem.updateURL(selState);
    ensureWizardVisible();
    updateStepUI(4);
    document.getElementById('explorer-main-title').innerHTML = `Select your <span class="gradient-text">Subject</span>`;

    const container = document.getElementById('explorer-content');
    container.innerHTML = `<div class="ap-loader" style="grid-column: 1/-1; margin: 4rem auto;"><div class="ap-spin"></div><p style="color:var(--text-dim); margin-top:1rem;">Loading subjects...</p></div>`;

    try {
        let sb = window.supabase;
        if (!sb) {
            const module = await import('./supabase-config.js?v=1.0');
            sb = module.supabase;
            window.supabase = sb;
        }

        const { data: subjects, error } = await sb.from('college_subjects')
            .select('id, subject_name, subject_code, icon')
            .eq('college_id', selState.college.id)
            .eq('branch_id', selState.branch.id)
            .eq('semester', selState.semester);

        if (error) throw error;

        if (!subjects || subjects.length === 0) {
            container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 4rem;">
                <p style="color: var(--text-dim);">No subjects registered for this branch/year combo yet.</p>
                <button class="btn btn-primary btn-sm" style="margin-top: 1rem;" onclick="renderCollegeStep()">Start Over</button>
            </div>`;
            return;
        }

        container.innerHTML = subjects.map(s => `
            <div class="selection-card glass-card" onclick="selectSubject('${s.id}', '${s.subject_name.replace(/'/g, "\\'")}')">
                <div class="card-icon" style="font-size: 2.5rem;">${s.icon || '📚'}</div>
                <h3 class="font-heading" style="margin-top: 1rem;">${s.subject_name}</h3>
                <div style="font-size: 0.75rem; color: var(--text-dim); margin-top: 0.5rem; font-weight: 500;">${selState.college?.name || 'Academic'}</div>
            </div>
        `).join('');
    } catch (e) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 4rem;">
            <p style="color: #ef4444;">Error loading subjects: ${e.message}</p>
        </div>`;
    }
};

window.selectSubject = function (id, name) {
    selState.subject = { id, name };
    RoutingSystem.updateURL(selState);
    showNotes();
};

// --- FINAL VIEW: NOTES LIST ---

function getUnitNumber(n) {
    if (!n) return Infinity;
    const rawUnit = n.unit || n.unit_number || n.unitTag || n.unit_tag;
    let str = '';
    
    if (rawUnit !== undefined && rawUnit !== null && rawUnit !== '') {
        str = String(rawUnit).trim().toLowerCase();
    } else {
        const title = n.title || n.subjectName || '';
        str = String(title).trim().toLowerCase();
    }

    if (!str) return Infinity;

    const romanMap = {
        'i': 1, 'ii': 2, 'iii': 3, 'iv': 4, 'v': 5,
        'vi': 6, 'vii': 7, 'viii': 8, 'ix': 9, 'x': 10
    };

    const unitDigitMatch = str.match(/unit\s*[-–: ]*\s*(\d+)/i);
    if (unitDigitMatch) {
        return parseInt(unitDigitMatch[1], 10);
    }
    
    const digitMatch = str.match(/\b\d+\b/) || str.match(/\d+/);
    if (digitMatch) {
        return parseInt(digitMatch[0], 10);
    }

    const unitRomanMatch = str.match(/unit\s*[-–: ]*\s*\b(ix|iv|v?i{0,3})\b/i);
    if (unitRomanMatch && romanMap[unitRomanMatch[1].toLowerCase()]) {
        return romanMap[unitRomanMatch[1].toLowerCase()];
    }

    const romanMatch = str.match(/\b(ix|iv|v?i{0,3})\b/);
    if (romanMatch && romanMap[romanMatch[1]]) {
        return romanMap[romanMatch[1]];
    }

    for (const key in romanMap) {
        if (str === key || str.includes('unit ' + key) || str.includes('unit-' + key) || str.includes('unit' + key)) {
            return romanMap[key];
        }
    }

    return Infinity;
}

function sortNotesUnitWise(notesList) {
    return [...notesList].sort((a, b) => {
        const unitA = getUnitNumber(a);
        const unitB = getUnitNumber(b);
        
        if (unitA !== unitB) {
            return unitA - unitB;
        }
        
        const titleA = (a.title || a.subjectName || '').toLowerCase();
        const titleB = (b.title || b.subjectName || '').toLowerCase();
        return titleA.localeCompare(titleB);
    });
}

window.lastVisibleNote = null;

window.showNotes = async function (activeTab = 'notes', loadMore = false) {
    if (!loadMore) {
        // Hide explorer components
        ['explorer-steps-container', 'explorer-header', 'explorer-content', 'explorer-back-container'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });

        const view = document.getElementById('final-notes-view');
        if (view) {
            view.style.display = 'block';
            if (!view.innerHTML.trim() || view.innerHTML.includes('explorer-steps')) {
                view.innerHTML = `
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px; gap: 1.5rem;">
                        <span class="loader-pro" style="width: 40px; height: 40px; border-width: 3px;"></span>
                        <p style="color: var(--text-dim); font-size: 1.1rem; animate: pulse 1.5s infinite;">Opening <b>${selState.subject?.name || 'Subject'}</b> Hub...</p>
                    </div>
                `;
            }
        }
    }

    if (!selState.branch || !selState.semester || !selState.subject) {
        console.warn("🚫 showNotes: Incomplete state, reverting to explorer.");
        if (window.backToExplorer) window.backToExplorer();
        return;
    }

    // No longer using GlobalData.subjects for subject details; this static check was for the MVP anyway.
    // We just rely on selState.subject.name for the title.
    const subjectData = { name: selState.subject.name, description: '' };

    const subjectId = selState.subject.id;
    const collegeId = selState.college.id;

    // Hardcoded static fallback based on chosen subject
    let staticNotes = globalNotes[selState.college.id]?.[selState.subject.name];
    if (!staticNotes || staticNotes.length === 0) {
        staticNotes = globalNotes['global']?.[selState.subject.name] || [];
    }

    // FETCH FROM FIREBASE WITH PAGINATION
    if (!loadMore) {
        window.lastVisibleNote = null;
    }
    let firestoreNotes = [];
    if (window.firebaseServices && window.firebaseServices.db) {
        try {
            const { db, collection, query, where, getDocs, limit, startAfter } = window.firebaseServices;
            // Simple query to avoid composite index errors. We fetch notes matching subjectId and filter the rest locally.
            let q;
            if (loadMore && window.lastVisibleNote) {
                q = query(collection(db, 'notes'), where('subjectId', '==', subjectId), startAfter(window.lastVisibleNote), limit(12));
            } else {
                q = query(collection(db, 'notes'), where('subjectId', '==', subjectId), limit(12));
            }
            
            const snap = await getDocs(q);
            if (!snap.empty) {
                window.lastVisibleNote = snap.docs[snap.docs.length - 1]; // Store cursor
                firestoreNotes = snap.docs.map(d => ({id: d.id, ...d.data()}));
            } else {
                window.lastVisibleNote = null; // No more
            }
        } catch(e) {
            console.error("Pagination fetch error:", e);
        }
    }

    // --- SUPABASE NOTES ---
    // Pull from window.NotesDB (populated by dashboard.js initNotesSync) if available.
    // If not yet loaded, fetch directly from Supabase approved_notes table.
    let supabaseNotes = [];
    const subjectName = selState.subject.name;
    if (window.NotesDB && window.NotesDB.length > 0) {
        // Filter the cached NotesDB for this subject
        supabaseNotes = window.NotesDB.filter(n => {
            const matchesSubject =
                n.subjectId === subjectId ||
                n.subject === subjectId ||
                n.subject === subjectName ||
                n.subjectName === subjectName ||
                n.name === subjectName;
            const matchesCollege =
                n.collegeId === collegeId ||
                n.college === collegeId ||
                n.collegeId === 'global' ||
                n.college === 'global' ||
                !n.collegeId;
            return matchesSubject && matchesCollege;
        });
        console.log(`📦 notes-hub: pulled ${supabaseNotes.length} notes from NotesDB cache for "${subjectName}"`);
    } else {
        // NotesDB not loaded yet — fetch directly from Supabase
        try {
            const sb = window.supabase || (await import('./supabase-config.js').then(m => m.supabase).catch(() => null));
            if (sb) {
                let query = sb.from('approved_notes')
                    .select('*')
                    .or(`subjectId.eq.${subjectId},subject.eq.${subjectId},subjectName.eq."${subjectName}"`)
                    .limit(50);
                const { data, error } = await query;
                if (!error && data && data.length > 0) {
                    supabaseNotes = data.map(d => ({
                        ...d,
                        url: d.file_url || d.url,
                        fileUrl: d.file_url || d.url,
                        uploaderName: d.uploader_name || (d.uploader_email ? d.uploader_email.split('@')[0] : 'Scholar'),
                        name: d.title,
                        status: 'approved' // rows in approved_notes are already approved
                    }));
                    console.log(`✅ notes-hub: fetched ${supabaseNotes.length} notes directly from Supabase for "${subjectName}"`);
                } else if (error) {
                    console.warn('notes-hub Supabase fetch error:', error.message);
                    // Fallback: fetch all and filter locally
                    const { data: allData } = await sb.from('approved_notes').select('*').limit(200);
                    if (allData) {
                        supabaseNotes = allData
                            .filter(n => {
                                const matchesSubject =
                                    n.subjectId === subjectId ||
                                    n.subject === subjectId ||
                                    n.subject === subjectName ||
                                    n.subjectName === subjectName;
                                const matchesCollege =
                                    n.collegeId === collegeId ||
                                    n.college === collegeId ||
                                    n.collegeId === 'global' ||
                                    n.college === 'global' ||
                                    !n.collegeId;
                                return matchesSubject && matchesCollege;
                            })
                            .map(d => ({
                                ...d,
                                url: d.file_url || d.url,
                                fileUrl: d.file_url || d.url,
                                uploaderName: d.uploader_name || (d.uploader_email ? d.uploader_email.split('@')[0] : 'Scholar'),
                                name: d.title,
                                status: 'approved'
                            }));
                        console.log(`✅ notes-hub: fallback fetch got ${supabaseNotes.length} Supabase notes for "${subjectName}"`);
                    }
                }
            }
        } catch(e) {
            console.error('notes-hub: Direct Supabase fetch failed:', e);
        }
    }

    // Merge: Firestore + Supabase + Static notes
    const combinedNotes = [...firestoreNotes, ...supabaseNotes, ...staticNotes];
    
    // Deduplicate (prefer DB copies over static)
    const uniqueMap = new Map();
    combinedNotes.forEach(n => { if (n.id) uniqueMap.set(n.id, n); });
    const deduplicatedNotes = Array.from(uniqueMap.values());

    const dynamicNotes = deduplicatedNotes.filter(n => {
        // Notes from approved_notes (Supabase) may not have a status field — they are already approved by being in that table
        const isApproved = !n.status || n.status === 'approved';
        const typeMatch = (n.type === activeTab) || !n.type || (activeTab === 'notes' && n.type === undefined);
        const collegeMatch = (n.collegeId === collegeId) || (n.college === collegeId) || !n.collegeId || n.collegeId === 'global' || n.college === 'global';
        return isApproved && typeMatch && collegeMatch;
    });
    
    // Accumulate if loading more
    if (loadMore) {
        window.currentStaticNotes = [...(window.currentStaticNotes || []), ...dynamicNotes];
    } else {
        window.currentStaticNotes = dynamicNotes;
    }

    // Sort unit-wise
    window.currentStaticNotes = sortNotesUnitWise(window.currentStaticNotes);

    const loadMoreBtnHtml = window.lastVisibleNote ? 
        `<div id="load-more-btn-container" style="text-align: center; margin-top: 2rem; width: 100%;">
            <button class="btn btn-ghost" onclick="showNotes('${activeTab}', true)">Load More Notes ⬇️</button>
         </div>` : '';

    if (loadMore) {
        const container = document.getElementById('resource-list-container');
        if (container) {
            const oldBtn = document.getElementById('load-more-btn-container');
            if (oldBtn) oldBtn.remove();
            
            if (window.currentStaticNotes.length > 0) {
                 container.innerHTML = renderStaticNotes(window.currentStaticNotes);
            }
            if (window.lastVisibleNote) {
                 container.innerHTML += loadMoreBtnHtml;
            }
        }
        return;
    }

    const view = document.getElementById('final-notes-view');
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
                            <span class="meta-badge">${selState.college?.name || 'Academic'}</span>
                            <span class="meta-badge">${selState.branch.id}</span>
                            <span class="meta-badge">${selState.year}</span>
                            <span class="meta-badge">${subjectData.code}</span>
                        </div>
                        <p class="subject-description">${subjectData.description}</p>
                    </div>
                    <div style="display: flex; gap: 0.8rem;">
                        <button class="btn btn-ghost" onclick="copyShareLink(this)" id="share-btn" style="white-space:nowrap; background: rgba(0, 242, 255, 0.1); color: var(--secondary); padding: 0.6rem 1.2rem; border-radius: 8px;">🔗 Share Subject</button>
                        <button class="btn btn-ghost" onclick="renderCollegeStep()" style="white-space:nowrap; background: rgba(255,255,255,0.05); padding: 0.6rem 1.2rem; border-radius: 8px;">↺ Switch</button>
                    </div>
                </div>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
                <div class="subject-tabs-nav" style="margin-bottom: 0;">
                    <div class="subject-tab ${activeTab === 'notes' ? 'active' : ''}" onclick="window.switchSubjectTab('notes')">Notes</div>
                    <div class="subject-tab ${activeTab === 'pyqs' ? 'active' : ''}" onclick="window.switchSubjectTab('pyqs')">PYQs</div>
                    <div class="subject-tab ${activeTab === 'formula' ? 'active' : ''}" onclick="window.switchSubjectTab('formula')">Formula Sheets</div>
                    <div class="subject-tab ${activeTab === 'practicals' ? 'active' : ''}" onclick="window.switchSubjectTab('practicals')">Practicals</div>
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
                    ${(window.currentStaticNotes.length > 0) ? renderStaticNotes(window.currentStaticNotes) + loadMoreBtnHtml : `
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
        const createNoteCard = (unit, title, url, likes = 0, views = 0, id = '', downloads = 0, dislikes = 0) => {
            const noteId = id || 'undefined';        const fallbackName = n.uploaderName || n.uploader || 'U';
        const initial = fallbackName.charAt(0).toUpperCase();
        const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#ff6b00"/><text x="50" y="50" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="45" font-weight="bold" text-anchor="middle" dominant-baseline="central">${initial}</text></svg>`;
        const fallbackUri = `data:image/svg+xml;utf8,${encodeURIComponent(fallbackSvg)}`;

        return `
            <div class="note-card-pro card-reveal" data-note-id="${noteId}" style="animation-delay: ${idx * 0.1}s;">
                <div class="note-icon-pro">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                </div>
                
                <div class="note-info-pro">
                    <span class="unit-tag-pro">${unit}</span>
                    <h3 class="note-title-pro">${title}</h3>
                    <div class="note-actions-pro">
                        <span class="meta-pill-pro uploader" style="color: var(--secondary); font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
                            ${((n.uploaderName || n.uploader || '').toLowerCase().includes('skil matrix') || (!n.uploaderName && !n.uploader)) ? 
                                '<img src="../assets/logo_transparent.png" style="width:14px;height:14px;border-radius:50%;object-fit:contain;background:rgba(0,242,255,0.1);padding:1px;">' :
                                (n.uploaderAvatar || n.avatar) ? `<img src="${n.uploaderAvatar || n.avatar}" style="width:14px;height:14px;border-radius:50%;object-fit:cover;">` :
                                `<img src="${fallbackUri}" style="width:14px;height:14px;border-radius:50%;background:rgba(255,255,255,0.05);" onload="if(!this.dataset.loaded){ this.dataset.loaded=true; window.loadUserAvatar('${n.uploadedBy}', this, '${fallbackName.replace(/'/g, "\\'")}'); }">`
                            }
                            ${n.uploaderName || n.uploader || 'SKiL MATRiX'}
                        </span>
                        <span class="meta-pill-pro verified" style="background: linear-gradient(135deg, rgba(46, 204, 113, 0.1), rgba(39, 174, 96, 0.1)); color: #2ecc71; border: 1px solid rgba(46, 204, 113, 0.2); padding: 2px 6px; border-radius: 4px; font-weight: 800; font-size: 0.7rem; letter-spacing: 0.5px; box-shadow: 0 0 8px rgba(46, 204, 113, 0.15); display: inline-flex; align-items: center; gap: 3px;">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" /></svg>
                            VERIFIED
                        </span>
                    </div>
                </div>

                <div class="note-tools-pro">
                    <div style="display: flex; align-items: center; gap: 0.4rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 0.3rem 0.6rem; border-radius: 6px; color: var(--text-dim); font-size: 0.8rem; font-weight: 700; cursor: default; margin-right: 0.5rem;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        <span>${views} Views</span>
                    </div>
                    <button class="tool-icon-pro" onclick="toggleBookmark('${noteId}'); event.stopPropagation();" title="Bookmark">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                    </button>
                    <button class="tool-icon-pro share-btn" title="Share" onclick="window.shareResource('${noteId}'); event.stopPropagation();">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                    </button>
                </div>

                <a href="${window.getViewerUrl(url || n.url || n.fileUrl || n.driveLink, title || n.title, noteId)}" target="_blank" class="btn-download-white" onclick="updateNoteStat('${noteId}', 'view');">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    View
                </a>
            </div>`;
        };

        const rawUnit = n.unit || n.unit_number || n.unitTag || n.unit_tag;
        const rawUnitStr = rawUnit ? String(rawUnit).trim().toLowerCase() : '';
        let safeUnit = '';
        if (rawUnitStr && rawUnitStr !== 'undefined' && rawUnitStr !== 'null' && rawUnitStr !== 'n/a') {
            safeUnit = String(rawUnit).trim().toUpperCase();
        } else {
            const titleMatch = (n.title || '').match(/unit\s*[-–]?\s*(\d+)/i);
            if (titleMatch) {
                safeUnit = `UNIT ${titleMatch[1]}`;
            } else {
                safeUnit = `UNIT ${idx + 1}`;
            }
        }
        return createNoteCard(safeUnit, n.title || n.subjectName, n.url || n.fileUrl || n.driveLink, n.upvotes || 0, n.views || 0, n.id, n.downloads || 0, n.downvotes || 0);
    }).join('');

    setTimeout(() => {
        if (typeof attachNoteRealtimeListeners === 'function') attachNoteRealtimeListeners('final-notes-view');
        if (typeof syncAllInteractionIcons === 'function') syncAllInteractionIcons();
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
