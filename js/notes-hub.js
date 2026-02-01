// Standalone Notes Hub Wizard Script
// Handles the "Select Institution -> Branch -> Year -> Notes" flow

// --- GLOBAL CONSTANTS ---
const Roles = {
    SUPER_ADMIN: 'superadmin',
    COLLEGE_ADMIN: 'coadmin',
    UPLOADER: 'uploader',
    STUDENT: 'user'
};

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

let currentUser = null;
let NotesDB = [];
let selState = { college: null, branch: null, year: null, subject: null };

// --- FIREBASE INTEGRATION ---
function getFirebase() {
    return window.firebaseServices || {};
}

function initNotesData() {
    const { db, collection, query, orderBy, onSnapshot } = getFirebase();
    if (!db) {
        console.warn("NotesHub: Firebase not loaded. Using fallback/empty state.");
        return;
    }

    const q = query(collection(db, "notes_approved"), orderBy("created_at", "desc"));
    onSnapshot(q, (snapshot) => {
        NotesDB = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // If we are currently viewing the final list, refresh it to show new/updated notes
        if (document.getElementById('final-notes-view').style.display === 'block') {
            showNotes(document.querySelector('.sub-tab.active')?.innerText.toLowerCase().includes('notes') ? 'notes' : 'notes');
        }
    }, (error) => {
        console.error("NotesHub: Failed to fetch notes:", error);
    });
}

// --- WIZARD RENDER LOGIC ---

document.addEventListener('DOMContentLoaded', () => {
    // Check for auth readiness
    if (window.authStatus && window.authStatus.ready) {
        currentUser = window.authStatus.data.currentUser;
        initNotesData();
    }

    // Start Wizard
    renderCollegeStep();
});

// Auth Listener
window.addEventListener('auth-ready', (e) => {
    if (e.detail) {
        currentUser = e.detail.currentUser;
        initNotesData();
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

// STEP 1: College
window.renderCollegeStep = function () {
    const view = document.getElementById('final-notes-view');
    const explorer = document.getElementById('explorer-steps-container');

    // Reset View
    if (view) view.style.display = 'none';
    if (explorer) explorer.style.display = 'flex'; // show flex container

    updateStepUI(0);
    const container = document.getElementById('explorer-content');
    if (!container) return;

    // Reset Title
    document.getElementById('explorer-main-title').innerHTML = `Select your <span class="gradient-text">Institution</span>`;
    document.getElementById('explorer-sub-title').innerText = `Choose your college to start browsing localized content.`;

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
    renderBranchStep();
};

// STEP 2: Branch
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
    renderYearStep();
};

// STEP 3: Year
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
    renderSemesterStep();
};

// STEP 4: Semester
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
    renderSubjectStep();
}

// STEP 5: Subject
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
    showNotes();
};

// --- MODAL LOGIC ---
function openUploadModal() {
    if (!currentUser) {
        alert("Please login first.");
        return;
    }

    // Messaging updated: Any user can upload, but it goes to approval.
    // We can still show a notice if it will be direct.
    const isAdmin = currentUser.role === Roles.SUPER_ADMIN;
    const isCollegeAdmin = currentUser.role === Roles.COLLEGE_ADMIN && currentUser.college === selState.college.id;

    if (!isAdmin && !isCollegeAdmin) {
        // No restriction here anymore, just let them proceed
    }

    const modal = document.getElementById('add-note-modal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeUploadModal() {
    const modal = document.getElementById('add-note-modal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
    document.getElementById('add-note-form').reset();
}

async function handleNoteSubmit(e) {
    e.preventDefault();
    const { db, collection, addDoc } = getFirebase();
    if (!db) return;

    const btn = document.getElementById('submit-note-btn');
    const title = document.getElementById('note-title').value;
    const type = document.getElementById('note-type').value;
    const driveLink = document.getElementById('drive-link').value;

    btn.disabled = true;
    btn.innerText = "Processing...";

    const isAdmin = currentUser.role === Roles.SUPER_ADMIN;
    const isMatchingCoAdmin = currentUser.role === Roles.COLLEGE_ADMIN && currentUser.college === selState.college.id;
    const targetColl = (isAdmin || isMatchingCoAdmin) ? "notes_approved" : "notes_pending";
    const status = (isAdmin || isMatchingCoAdmin) ? 'approved' : 'pending';

    const newNote = {
        title: title,
        type: type,
        driveLink: driveLink,
        collegeId: selState.college.id,
        branchId: selState.branch.id,
        year: selState.year,
        subject: selState.subject.id,
        uploader: currentUser.name,
        uploaded_by: currentUser.id,
        status: status,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        views: 0,
        downloads: 0,
        likes: 0,
        created_at: new Date().toISOString()
    };

    try {
        await addDoc(collection(db, targetColl), newNote);
        if (status === 'approved') {
            alert("✅ Success! Note added directly to the database.");
        } else {
            alert("📩 Submitted! Your note is pending approval by the " + selState.college.name + " admin.");
        }
        closeUploadModal();
        // UI will auto-refresh via Firebase onSnapshot
    } catch (error) {
        console.error("Error adding note:", error);
        alert("Failed to add note. Check console.");
    } finally {
        btn.disabled = false;
        btn.innerText = "✨ Add Resource Now";
    }
}

// Initializing UI Listeners
document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.querySelector('.close-modal');
    if (closeBtn) closeBtn.onclick = closeUploadModal;

    const form = document.getElementById('add-note-form');
    if (form) form.onsubmit = handleNoteSubmit;
});

// --- FINAL VIEW: NOTES LIST ---

window.showNotes = function (activeTab = 'notes') {
    const explorer = document.getElementById('explorer-steps-container'); // The wrapper for steps
    if (explorer) explorer.style.display = 'none';

    const view = document.getElementById('final-notes-view');
    view.style.display = 'block'; // Show final grid

    const key = `${selState.branch.id}-${selState.year}`;
    const subjectData = (GlobalData.subjects[key] || []).find(s => s.id === selState.subject.id) || {
        name: selState.subject.name,
        code: 'GEN101',
        description: 'Comprehensive study materials and verified academic resources.'
    };

    view.innerHTML = `
        <div class="subject-page-container fade-in">
            <div class="breadcrumb-pro">
                <span onclick="renderCollegeStep()" style="cursor:pointer">🏠 Home</span> <span>›</span> ${selState.branch.name} <span>›</span> ${selState.subject.name}
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
                        ${(currentUser && (currentUser.role === Roles.SUPER_ADMIN || (currentUser.role === Roles.COLLEGE_ADMIN && currentUser.college === selState.college.id)))
            ? `<button class="btn btn-primary" onclick="openUploadModal()"><span style="margin-right:0.5rem;">+</span> Upload Notes</button>`
            : ''}
                        <button class="btn btn-ghost" onclick="renderCollegeStep()" style="white-space:nowrap; background: rgba(255,255,255,0.05); padding: 0.6rem 1.2rem; border-radius: 8px;">↺ Switch Subject</button>
                    </div>
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
};

function renderDetailedNotes(subjectId, tabType = 'notes') {
    // Filter Mock/Real Data
    const filtered = NotesDB.filter(n => {
        const isCorrectSubject = n.subject === subjectId && n.collegeId === selState.college.id && n.type === tabType;
        if (!isCorrectSubject) return false;
        if (n.status !== 'approved') return false; // Only show approved on public page
        return true;
    }).sort((a, b) => calculateSmartScore(b) - calculateSmartScore(a));

    if (filtered.length === 0) {
        const isAdmin = currentUser && (currentUser.role === Roles.SUPER_ADMIN || (currentUser.role === Roles.COLLEGE_ADMIN && currentUser.college === selState.college.id));

        return `
            <div style="text-align: center; padding: 5rem; background: rgba(255,255,255,0.01); border: 2px dashed rgba(255,255,255,0.05); border-radius: 20px;">
                <div style="font-size: 4rem; margin-bottom: 2rem;">📂</div>
                <h2 class="font-heading">No premium ${tabType} for this subject found yet.</h2>
                <p style="color: var(--text-dim); margin-bottom: 2rem;">Be the first contributor and earn academic credit!</p>
                <div style="display:flex; justify-content:center; gap:1rem;">
                    ${isAdmin
                ? `<button class="btn btn-primary" onclick="openUploadModal()">+ Upload notes</button>`
                : `<button class="btn btn-primary" onclick="window.location.href='dashboard.html?tab=notes'">+ Contribute Note</button>`
            }
                </div>
            </div>
        `;
    }

    return filtered.map(n => `
        <div class="detailed-item glass-card card-reveal">
            <div class="item-left">
                <div class="file-type-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                </div>
                <div class="item-info-block">
                    <div class="item-title">${n.title}</div>
                    <div class="item-meta-row">
                        <span title="Upload Date">📅 ${n.date}</span>
                        <div class="uploader-mini">
                            <div class="uploader-avatar">${n.uploader ? n.uploader.charAt(0) : 'U'}</div>
                            <span>${n.uploader || 'Anonymous'}</span>
                        </div>
                        <span title="Total Downloads">${n.downloads || 0} downloads</span>
                    </div>
                    <div class="item-engagement-row">
                        <span class="eng-icon" onclick="updateNoteStat('${n.id}', 'like')">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                            ${n.likes || 0}
                        </span>
                        <span class="eng-icon" onclick="toggleNoteDislike('${n.id}')">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path></svg>
                            ${n.dislikes || 0}
                        </span>
                        <span class="eng-icon" onclick="toggleNoteBookmark('${n.id}')">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                        </span>
                    </div>
                </div>
            </div>
            <div class="item-right">
                <button class="btn-download-pro" onclick="window.open('${convertDriveLink(n.driveLink, 'download')}', '_blank'); updateNoteStat('${n.id}', 'download')">
                    Download
                </button>
            </div>
        </div>
    `).join('');
}

window.toggleNoteDislike = async function (noteId) {
    const { db, doc, updateDoc, increment } = getFirebase();
    if (!db) return;
    try {
        const noteRef = doc(db, "notes", noteId);
        await updateDoc(noteRef, {
            dislikes: increment(1)
        });
    } catch (error) {
        console.error("Error updating stats:", error);
    }
}

window.toggleNoteBookmark = function (noteId) {
    alert("📑 Note added to your bookmarks!");
}


// --- UTILITIES ---

function calculateSmartScore(note) {
    const viewsWeight = 0.25;
    const downloadsWeight = 0.5;
    const likesWeight = 0.25;
    return (note.views * viewsWeight) + (note.downloads * downloadsWeight) + (note.likes * likesWeight);
}

function convertDriveLink(link, format = 'preview') {
    if (!link || !link.includes('drive.google.com')) return link;
    const fileIdMatch = link.match(/\/file\/d\/([^\/]+)/) || link.match(/id=([^\&]+)/);
    if (!fileIdMatch) return link;
    const fileId = fileIdMatch[1];
    if (format === 'preview') return `https://drive.google.com/file/d/${fileId}/preview`;
    if (format === 'download') return `https://drive.google.com/uc?export=download&id=${fileId}`;
    return link;
}

window.updateNoteStat = async function (noteId, type) {
    const { db, doc, updateDoc, increment } = getFirebase();

    // Optimistic Update globally? 
    // We are not maintaining a react state, we rely on re-render.
    // For now just alert and call backend.

    if (type === 'like') alert("💖 Added to your liked resources!");

    if (!db) return;
    try {
        const noteRef = doc(db, "notes_approved", noteId);
        await updateDoc(noteRef, {
            [type + 's']: increment(1)
        });
        if (type === 'download' && window.statServices) window.statServices.trackDownload();
    } catch (error) {
        console.error("Error updating stats:", error);
    }
}
