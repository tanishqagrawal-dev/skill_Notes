
// Co-Admin Dashboard Script
// Restricted to College-Specific Data

if (!window.firebaseServices) {
    console.error("Critical: window.firebaseServices is undefined.");
    setTimeout(() => {
        if (!window.firebaseServices) document.body.innerHTML = "<h1 style='color:red; text-align:center; padding:2rem;'>Firebase Connection Failed</h1>";
    }, 2000);
}

function getFirebase() { return window.firebaseServices || {}; }

let currentUser = null;
let pendingNotes = [];
let myCollege = null;

// --- INITIALIZATION ---
function handleAuthReady(data) {
    if (!data) return;
    const { user, currentUser: appCurrentUser } = data;

    if (user && appCurrentUser) {
        console.log("🚀 Co-Admin Session Active:", appCurrentUser.role);
        currentUser = appCurrentUser;

        // STRICT ROLE CHECK
        if (currentUser.role !== 'coadmin' && currentUser.role !== 'superadmin') {
            alert("⛔ Access Denied. Redirecting...");
            window.location.href = 'dashboard.html';
            return;
        }

        // Identify College
        // Support 'college' string or 'assignedCollege' field
        myCollege = currentUser.college || currentUser.assignedCollege;
        if (!myCollege) {
            alert("⚠️ Configuration Error: No college assigned to your account. Contact Super Admin.");
            return;
        }

        updateDashboardUI();
        initCoAdminTabs();

        // Start Real-time Listeners
        initLiveFeed();

        // Default View
        renderTabContent('verification-hub');

        // Settings Init
        if (window.SettingsModule) {
            window.SettingsModule.state.user = { ...currentUser };
            window.SettingsModule.init();
        }
    }
}

function updateDashboardUI() {
    // Update Sidebar / Header info
    const nameEl = document.querySelector('.user-info .name');
    const metaEl = document.querySelector('.user-info .meta');

    if (nameEl) nameEl.innerText = currentUser.name;
    if (metaEl) metaEl.innerText = `${myCollege.toUpperCase()} ADMIN`;

    // Disable irrelevant sidebar items if any exist
}

function initCoAdminTabs() {
    const sidebarNav = document.querySelector('.sidebar-nav');
    if (!sidebarNav) return;
    sidebarNav.innerHTML = ''; // Clean slate

    const items = [
        { id: 'verification-hub', icon: '🛡️', label: 'Moderation Hub' },
        { id: 'my-college-stats', icon: '📊', label: 'My College Stats' },
        { id: 'settings', icon: '⚙️', label: 'Settings' }
    ];

    items.forEach(item => {
        const a = document.createElement('a');
        a.href = '#';
        a.className = `nav-item ${item.id === 'verification-hub' ? 'active' : ''}`;
        a.dataset.tab = item.id;
        a.innerHTML = `<span class="icon">${item.icon}</span> ${item.label}`;
        a.onclick = (e) => {
            e.preventDefault();
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            a.classList.add('active');
            renderTabContent(item.id);
        };
        sidebarNav.appendChild(a);
    });
}

function renderTabContent(tabId) {
    const contentArea = document.getElementById('tab-content');
    if (!contentArea) return;

    if (tabId === 'verification-hub') {
        contentArea.innerHTML = `
            <div class="tab-pane active fade-in" style="padding: 2rem;">
                <div style="margin-bottom: 2rem;">
                    <h1 class="font-heading">🛡️ ${myCollege.toUpperCase()} <span class="gradient-text">Moderation</span></h1>
                    <p style="color: var(--text-dim);">Review pending notes submitted to your college.</p>
                </div>
                
                <!-- Queue Container -->
                <div id="coadmin-queue-list" class="grid-1-col" style="display: grid; gap: 1.5rem;">
                    <div style="text-align:center; padding: 2rem; color: var(--text-dim);">
                        Loading pending submissions...
                    </div>
                </div>
            </div>
        `;
        renderQueueList();
    }
    else if (tabId === 'my-college-stats') {
        contentArea.innerHTML = renderCollegeStats();
        initCollegeStatListeners();
    }
    else if (tabId === 'settings') {
        contentArea.innerHTML = window.renderSettings ? window.renderSettings() : 'Loading settings...';
    }
}

// --- REAL-TIME DATA ---

function initLiveFeed() {
    const { db, collection, query, where, onSnapshot } = getFirebase();
    if (!db) return;

    // Listen ONLY for notes_pending where collegeId == myCollege
    // Note: We check both 'collegeId' and 'college' fields to be safe with data schema legacy
    // Actually, let's assume 'collegeId' is standard

    // Create a composite query if possible, or client-side filter if not indexed yet
    // For strictness, let's try a query.
    // NOTE: Firestore requires an index for this. If it fails, I'll fallback to client-side filter of a larger set? No, that's insecure.
    // I will assume simple query works.

    const q = query(collection(db, 'notes_pending'), where('collegeId', '==', myCollege));

    onSnapshot(q, (snapshot) => {
        const notes = [];
        snapshot.forEach(doc => {
            notes.push({ id: doc.id, ...doc.data() });
        });
        pendingNotes = notes;

        // If current tab is verification-hub, re-render
        if (document.querySelector('.nav-item[data-tab="verification-hub"].active')) {
            renderQueueList();
        }
    }, (error) => {
        console.error("CoAdmin Listener Error:", error);
        // Fallback: This might fail if user doesn't have permissions (Rules enforcement)
        if (error.code === 'permission-denied') {
            alert("❌ Permission Error: You do not have access to this college's data.");
        }
    });
}

function renderQueueList() {
    const container = document.getElementById('coadmin-queue-list');
    if (!container) return;

    if (pendingNotes.length === 0) {
        container.innerHTML = `
            <div class="glass-card" style="padding: 4rem; text-align: center; border: 1px dashed rgba(255,255,255,0.1);">
                <div style="font-size: 3rem; margin-bottom: 1rem;">✅</div>
                <h3>All Caught Up!</h3>
                <p style="color: var(--text-dim);">No pending notes for ${myCollege}.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = pendingNotes.map(note => `
        <div class="glass-card" style="padding: 1.5rem; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid var(--primary);">
            <div>
                <h3 style="margin-bottom: 0.5rem;">${note.title || 'Untitled'}</h3>
                <div style="font-size: 0.85rem; color: var(--text-dim);">
                    Uploaded by <strong>${note.uploader || 'Unknown'}</strong> • ${note.subject || note.branchId} • ${note.date}
                </div>
                <div style="margin-top: 0.5rem; display: flex; gap: 0.5rem;">
                     <span class="badge-mini-text" style="background:rgba(255,255,255,0.1); padding:2px 6px; border-radius:4px; font-size:0.7rem;">${note.type}</span>
                     ${note.driveLink ? `<a href="${note.driveLink}" target="_blank" style="font-size:0.8rem; color:var(--secondary);">View File ↗</a>` : ''}
                </div>
            </div>
            <div style="display: flex; gap: 1rem;">
                <button class="btn btn-sm btn-ghost" style="color: #ff4757; border-color: rgba(255,71,87,0.3);" onclick="rejectNote('${note.id}')">❌ Reject</button>
                <button class="btn btn-sm btn-primary" onclick="approveNote('${note.id}')">✅ Approve</button>
            </div>
        </div>
    `).join('');
}

// --- ACTIONS ---

window.approveNote = async function (noteId) {
    const { db, doc, runTransaction, serverTimestamp } = getFirebase();
    const note = pendingNotes.find(n => n.id === noteId);
    if (!note) return;

    // Strict College Match Check (Client Side Double Check)
    if (note.collegeId !== myCollege) {
        alert("⚠️ Security Alert: You cannot approve notes for other colleges.");
        return;
    }

    if (!confirm(`Approve "${note.title}"? It will be live for all ${note.collegeId} students.`)) return;

    try {
        await runTransaction(db, async (transaction) => {
            // 1. Read Note (Verify existence and status)
            const noteRef = doc(db, 'notes_pending', noteId);
            const noteDoc = await transaction.get(noteRef);
            if (!noteDoc.exists()) throw "Note does not exist!";

            // 2. Prepare Approved Data
            const newNoteData = {
                ...noteDoc.data(),
                status: 'approved',
                approvedBy: currentUser.id,
                approvedByRole: 'coadmin',
                approvedAt: serverTimestamp(),
                views: 0,
                saves: 0,
                likes: 0
            };

            // 3. Create in notes_approved
            // We use the same ID or a new one? New ID is safer to avoid collision, but same ID is cleaner for tracking.
            // Let's use a new doc reference in notes_approved
            const approvedRef = doc(db, 'notes_approved', noteId); // Using same ID
            transaction.set(approvedRef, newNoteData);

            // 4. Delete from pending
            transaction.delete(noteRef);

            // 5. Update Co-Admin Stats (Optional)
            const coAdminRef = doc(db, 'coadmins', currentUser.id);
            transaction.set(coAdminRef, {
                email: currentUser.email,
                college: myCollege,
                lastActive: serverTimestamp()
            }, { merge: true });
        });

        alert("✅ Note Approved Successfully!");
        // UI will update automatically via listener

    } catch (e) {
        console.error("Approval Error:", e);
        alert("Approval Failed: " + e.message);
    }
};

window.rejectNote = async function (noteId) {
    const reason = prompt("Enter rejection reason (optional):");
    if (reason === null) return; // Cancelled

    const { db, doc, deleteDoc } = getFirebase();
    try {
        await deleteDoc(doc(db, 'notes_pending', noteId));
        alert("🚫 Note Rejected and Removed.");
    } catch (e) {
        alert("Error: " + e.message);
    }
}


// --- STATS VIEW ---
function renderCollegeStats() {
    return `
        <div class="tab-pane active fade-in" style="padding: 2rem;">
            <h1 class="font-heading">📊 ${myCollege.toUpperCase()} <span class="gradient-text">Analytics</span></h1>
            <div id="coadmin-stats-container" style="margin-top: 2rem;">
                Loading live stats...
            </div>
        </div>
    `;
}

function initCollegeStatListeners() {
    // Logic to count approved notes by this college
    const container = document.getElementById('coadmin-stats-container');
    const { db, collection, query, where, getCountFromServer } = getFirebase();

    // We can't use getCountFromServer easily in v9 modular without async wrapper, 
    // better to use onSnapshot on query if dataset is small, or just mock for now as realtime count is expensive
    // Let's use getDocs for now or a simpler approach.

    // For production, we should listen to a 'stats' document.
    // Let's assume there is a stats document for the college.

    container.innerHTML = `
        <div class="glass-card" style="padding: 2rem;">
            <h3>Stats Module Coming Soon</h3>
            <p>Real-time tracking of approvals and student engagement for ${myCollege}.</p>
        </div>
    `;
}

// Global Event Listener
window.addEventListener('auth-ready', (event) => handleAuthReady(event.detail));
if (window.authStatus && window.authStatus.ready) {
    handleAuthReady(window.authStatus.data);
}

// Global Toast Reuse
window.showToast = function (message) {
    // ... same toast logic
    console.log(message);
    alert(message); // Fallback
};
