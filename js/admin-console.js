
// Admin Console Module
// Advanced system management for Super Admins

window.AdminConsole = {
    isInitialized: false,
    unsubscribeUsers: null,
    state: {
        users: [],
        coadmins: [],
        pendingNotes: []
    },

    // Initial Render
    render: function () {
        this.init();
        return `
            <div class="tab-pane active fade-in" style="padding: 2rem;">
                <!-- Header -->
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 3rem;">
                    <div>
                        <h1 class="font-heading" style="font-size: 2.5rem;">🚨 Admin <span class="gradient-text">Command Center</span></h1>
                        <p style="color: var(--text-dim);">System oversight, user management, and global configurations.</p>
                    </div>
                    <button class="btn btn-ghost" onclick="AdminConsole.refresh()" style="border: 1px solid var(--border-glass);">🔄 Sync Database</button>
                </div>

                <!-- Navigation Tabs Internal -->
                <div class="glass-card" style="padding: 1rem; margin-bottom: 2rem; display: flex; gap: 1rem;">
                    <button class="btn btn-sm btn-primary" onclick="AdminConsole.switchView('overview')">📊 Overview</button>
                    <button class="btn btn-sm btn-ghost" onclick="AdminConsole.switchView('coadmins')">👥 Manage Co-Admins</button>
                    <button class="btn btn-sm btn-ghost" onclick="AdminConsole.switchView('colleges')">🏫 College Analytics</button>
                     <button class="btn btn-sm btn-ghost" onclick="AdminConsole.switchView('support')">📨 Support Inbox</button>
                </div>

                <div id="admin-view-content">
                    ${this.renderOverview()}
                </div>
            </div>
        `;
    },

    switchView: function (viewId) {
        const container = document.getElementById('admin-view-content');
        if (!container) return;

        // Toggle buttons style
        const btns = document.querySelectorAll('.glass-card button');
        btns.forEach(b => b.classList.replace('btn-primary', 'btn-ghost'));

        // Find clicked button and highlight (simple logic based on text content order)
        // For robustness, we won't strictly match index, just relying on visual rebuild or user click
        // But let's verify visual feedback:
        const map = { 'overview': 0, 'coadmins': 1, 'colleges': 2, 'support': 3 };
        if (btns[map[viewId]]) {
            btns[map[viewId]].classList.replace('btn-ghost', 'btn-primary');
        }

        if (viewId === 'overview') container.innerHTML = this.renderOverview();
        else if (viewId === 'coadmins') container.innerHTML = this.renderCoAdminManager();
        else if (viewId === 'colleges') container.innerHTML = this.renderCollegeAnalytics();
        else if (viewId === 'support') {
            // Init support module if needed
            if (window.AdminSupport) {
                if (!window.AdminSupport.unsubscribe) window.AdminSupport.init();
                container.innerHTML = window.AdminSupport.renderInbox();
            } else {
                container.innerHTML = "Support Module Loading...";
            }
        }
    },

    renderOverview: function () {
        return `
            <div class="admin-grid-kpi" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; margin-bottom: 2rem;">
                ${this.renderKPI('👥 Total Users', this.state.users.length, 'Active in DB', '#7B61FF')}
                ${this.renderKPI('👨‍💼 Co-Admins', this.state.coadmins.length, 'Assigned', '#00F2FF')}
                ${this.renderKPI('🛡️ Pending Reviews', this.state.pendingNotes.length, 'Global Queue', '#F1C40F')}
                ${this.renderKPI('🏫 Colleges', GlobalData.colleges.length, 'Supported', '#2ECC71')}
            </div>

            <div class="glass-card" style="padding: 2rem;">
                <h3 class="font-heading" style="margin-bottom:1rem;">Recent Activity Log (Global)</h3>
                <p style="color: var(--text-dim);">Real-time feed of uploads, approvals, and user registrations.</p>
                <div id="global-activity-feed" style="margin-top: 1rem; max-height: 300px; overflow-y: auto;">
                    <!-- Activity items would go here -->
                    <div style="padding: 1rem; border-bottom: 1px solid var(--border-glass);">System Initialized. Listening for events...</div>
                </div>
            </div>
        `;
    },

    renderCoAdminManager: function () {
        const colleges = window.GlobalData ? window.GlobalData.colleges : [];

        return `
            <div class="grid-2-col" style="display: grid; grid-template-columns: 1fr 2fr; gap: 2rem; align-items: start;">
                <!-- Add Form -->
                <div class="glass-card" style="padding: 2rem;">
                    <div style="margin-bottom: 2rem;">
                         <h3 class="font-heading" style="color:white; display:flex; align-items:center; gap:0.5rem;">
                            <span style="background:linear-gradient(135deg, #7B61FF, #00F2FF); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">+ Assign Co-Admin</span>
                         </h3>
                         <p style="color: var(--text-dim); font-size: 0.9rem; margin-top:0.5rem;">Grant restricted moderation rights for a specific college.</p>
                    </div>
                    
                    <div class="admin-input-group" style="margin-bottom: 1.5rem;">
                        <label>User Email address</label>
                        <input type="email" id="ca-email" class="admin-input" placeholder="e.g. professor.j@college.edu">
                    </div>
                    
                    <div class="admin-input-group" style="margin-bottom: 2rem;">
                        <label>Assign University</label>
                        <select id="ca-college" class="admin-input">
                            <option value="" disabled selected>Select a college...</option>
                            ${colleges.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                        </select>
                    </div>

                    <button class="btn btn-primary" onclick="AdminConsole.addCoAdmin()" style="width:100%; padding: 1rem; font-weight: 600; letter-spacing: 0.5px;">
                        Grant Access Level
                    </button>
                    
                    <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border-glass); font-size: 0.8rem; color: var(--text-dim); line-height: 1.5;">
                        <strong style="color: #F1C40F;">Note:</strong> If the user is not found, an invite will be created. They will receive Co-Admin rights automatically upon their first sign-in.
                    </div>
                </div>

                <!-- List -->
                <div class="glass-card" style="padding: 0; overflow: hidden; display: flex; flex-direction: column; height: 100%;">
                    <div style="padding: 1.5rem; border-bottom: 1px solid var(--border-glass); background: rgba(255,255,255,0.02); display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h3 class="font-heading">Active Co-Admins</h3>
                            <p style="font-size: 0.85rem; color: var(--text-dim);">Manage existing access rights.</p>
                        </div>
                        <span class="status-indicator">
                            <span class="dot"></span> ${this.state.coadmins.length} Active
                        </span>
                    </div>
                    
                    <div class="table-container custom-scroll" style="max-height: 600px; overflow-y: auto;">
                        <table class="admin-table" style="width: 100%;">
                            <thead>
                                <tr>
                                    <th style="text-align: left; padding-left: 2rem;">Administrator</th>
                                    <th style="text-align: left;">Assigned College</th>
                                    <th style="text-align: right; padding-right: 2rem;">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.state.coadmins.map(admin => `
                                    <tr>
                                        <td style="padding-left: 2rem;">
                                            <div style="display: flex; align-items: center; gap: 1rem;">
                                                <div style="width: 36px; height: 36px; background: rgba(255,255,255,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white;">
                                                    ${admin.name ? admin.name.charAt(0).toUpperCase() : 'U'}
                                                </div>
                                                <div>
                                                    <div style="font-weight: 600; color: white;">
                                                        ${admin.name || 'Unknown User'}
                                                        ${admin.isInvite ? '<span class="status-badge" style="background:rgba(241, 196, 15, 0.2); color:#F1C40F; font-size:0.6rem; padding:2px 6px; margin-left:8px;">PENDING INVITE</span>' : ''}
                                                    </div>
                                                    <div style="font-size: 0.8rem; color: var(--text-dim);">${admin.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span class="role-badge coadmin">
                                                ${admin.college ? admin.college.toUpperCase() : 'UNASSIGNED'}
                                            </span>
                                        </td>
                                        <td style="text-align: right; padding-right: 2rem;">
                                            <button class="btn-icon danger" onclick="AdminConsole.removeCoAdmin('${admin.id}', ${admin.isInvite})">
                                                🗑️ Revoke
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                                
                                ${this.state.coadmins.length === 0 ? `
                                    <tr>
                                        <td colspan="3" style="padding: 4rem; text-align: center; color: var(--text-dim);">
                                            <div style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;">👻</div>
                                            No Co-Admins assigned yet.<br>Use the form to add one.
                                        </td>
                                    </tr>
                                ` : ''}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },

    renderCollegeAnalytics: function () {
        return `
            <div class="glass-card" style="padding: 2rem;">
                <h3 class="font-heading">🏫 College Performance</h3>
                <p style="margin-bottom: 2rem; color: var(--text-dim);">Content distribution across verified institutions.</p>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem;">
                    ${GlobalData.colleges.map(c => {
            const verifiedCount = (window.NotesDB || []).filter(n => n.collegeId === c.id && n.status === 'approved').length;
            const pendingCount = (window.NotesDB || []).filter(n => n.collegeId === c.id && n.status === 'pending').length;
            return `
                        <div class="glass-card" style="padding: 1.5rem; border: 1px solid var(--border-glass);">
                            <div style="display:flex; align-items:center; gap: 1rem; margin-bottom: 1rem;">
                                <img src="${c.logo}" style="width: 40px; height: 40px; border-radius: 50%; background: white; padding: 5px;">
                                <div>
                                    <h4 style="margin:0;">${c.name}</h4>
                                    <div style="font-size: 0.75rem; color: var(--text-dim);">ID: ${c.id}</div>
                                </div>
                            </div>
                            <div style="display:flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.9rem;">
                                <span>Published Notes</span>
                                <span style="font-weight: 700; color: var(--success);">${verifiedCount}</span>
                            </div>
                            <div style="display:flex; justify-content: space-between; font-size: 0.9rem;">
                                <span>Pending Approval</span>
                                <span style="font-weight: 700; color: var(--F1C40F);">${pendingCount}</span>
                            </div>
                        </div>
                        `;
        }).join('')}
                </div>
            </div>
        `;
    },

    init: function () {
        if (this.isInitialized) return;

        const { db, collection, onSnapshot, query, where } = window.firebaseServices || {};
        if (!db) return;

        console.log("📡 Admin Console: Connecting to Live DB...");

        // 1. Listen to Users AND Invites
        const processLists = () => {
            const users = this._snapUsers || [];
            const invites = this._snapInvites || [];

            this.state.users = users;

            // Merge Real Co-Admins + Pending Invites
            const realCoAdmins = users.filter(u => u.role === 'coadmin');
            const invitedCoAdmins = invites.map(i => ({
                id: 'invite_' + i.email, // Temporary ID
                name: i.email.split('@')[0],
                email: i.email,
                role: 'coadmin',
                isInvite: true,
                college: i.collegeId,
                status: 'pending'
            }));

            this.state.coadmins = [...realCoAdmins, ...invitedCoAdmins];

            // Trigger global refresh for now to update counts (if UI is visible)
            // Ideally we'd have a render() call here, but for now we rely on user navigation or manual refresh
            // Just updating the KPI counters if they exist
            // If the co-admin table is visible, force a re-render of just the relevant content area
            const viewContent = document.getElementById('admin-view-content');
            // We check if the current active button is the 'Manage Co-Admins' one (the 2nd button in the nav)
            const activeBtn = document.querySelector('.glass-card button.btn-primary');
            if (viewContent && activeBtn && activeBtn.innerText.includes('Co-Admins')) {
                console.log("🔄 Reactive UI: Updating Co-Admin Table...");
                viewContent.innerHTML = this.renderCoAdminManager();
            }
        };

        this.unsubscribeUsers = onSnapshot(collection(db, 'users'), (snap) => {
            this._snapUsers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            processLists();
        });

        this.unsubscribeInvites = onSnapshot(collection(db, 'role_invites'), (snap) => {
            this._snapInvites = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            processLists();
        });

        // 2. Listen to ALL Pending Notes (Global)
        // Note: NotesDB in dashboard.js might already have this, but Admin Dashboard needs to be sure.
        // We'll rely on dashboard.js's NotesDB syncing if possible, but for strictness:
        const q = query(collection(db, 'notes_pending')); // fetch all
        onSnapshot(q, (snap) => {
            const notes = [];
            snap.forEach(doc => notes.push({ id: doc.id, ...doc.data() }));
            this.state.pendingNotes = notes;
        });

        this.isInitialized = true;
    },

    // --- ACTIONS ---

    addCoAdmin: async function () {
        const emailInput = document.getElementById('ca-email');
        const collegeSelect = document.getElementById('ca-college');
        const email = emailInput?.value;
        const collegeId = collegeSelect?.value;

        if (!email) return alert("Please enter an email.");
        if (!collegeId) return alert("Please select a college.");

        const { db, collection, getDocs, query, where, updateDoc, doc, setDoc } = window.firebaseServices;
        const cleanEmail = email.trim().toLowerCase();

        const confirmMsg = `Grant CO-ADMIN access to ${cleanEmail} for ${collegeId.toUpperCase()}?`;
        if (!confirm(confirmMsg)) return;

        try {
            console.log("🛠️ Promoting user:", cleanEmail);
            let targetUid = null;

            // 1. Check local state first (fast)
            const localUser = this.state.users.find(u => u.email?.toLowerCase() === cleanEmail);

            if (localUser) {
                targetUid = localUser.id;
            } else {
                // 2. Direct Firestore Query (Robust)
                const q = query(collection(db, 'users'), where("email", "==", cleanEmail));
                const snap = await getDocs(q);
                if (!snap.empty) {
                    targetUid = snap.docs[0].id;
                }
            }

            if (targetUid) {
                // DIRECT PROMOTION
                const userRef = doc(db, 'users', targetUid);
                await updateDoc(userRef, {
                    role: 'coadmin',
                    college: collegeId,
                    collegeId: collegeId,
                    permissions: {
                        approveNotes: true,
                        rejectNotes: true,
                        manageContent: true
                    },
                    assignedBy: (window.currentUser ? window.currentUser.id : 'admin'),
                    assignedByEmail: (window.currentUser ? window.currentUser.email : 'system'),
                    promotedAt: new Date().toISOString()
                });
                alert("✅ Success! User promoted directly to Co-Admin.");
            } else {
                // PRE-AUTHORIZATION (User hasn't signed up yet)
                const inviteRef = doc(db, 'role_invites', cleanEmail);
                await setDoc(inviteRef, {
                    email: cleanEmail,
                    role: 'coadmin',
                    collegeId: collegeId,
                    college: collegeId,
                    status: 'pending',
                    invitedAt: new Date().toISOString()
                });
                alert(`📩 User not found in DB. We've Pre-Authorized ${cleanEmail}.\n\nThey will get Co-Admin rights the moment they first sign in.`);
            }

            // Reset UI
            if (emailInput) emailInput.value = '';
            this.switchView('coadmins');

        } catch (e) {
            console.error("Promotion Error:", e);
            alert("Error: " + e.message);
        }
    },

    removeCoAdmin: async function (uid, isInvite = false) {
        if (!confirm(isInvite ? "🗑️ Cancel this invitation?" : "⚠️ Revoke Co-Admin status? They will become a regular user.")) return;
        const { db, updateDoc, deleteDoc, doc } = window.firebaseServices;

        try {
            if (isInvite) {
                // Determine email from formatting (uid is 'invite_email') or passed directly?
                // uid was passed as 'invite_' + email in processLists.
                const email = uid.replace('invite_', '');
                await deleteDoc(doc(db, 'role_invites', email));
                alert("✅ Invitation cancelled.");
            } else {
                await updateDoc(doc(db, 'users', uid), {
                    role: 'user',
                    collegeId: null, // Clear assignment
                    demotedAt: new Date().toISOString()
                });
                alert("✅ Co-Admin rights revoked.");
            }
            // View auto-updates via onSnapshot
            // this.switchView('coadmins'); // Not strictly needed if snapshot works, but good for focus
        } catch (e) {
            alert("Error: " + e.message);
        }
    },

    renderKPI: function (label, value, sub, color) {
        return `
            <div class="glass-card kpi-card" style="padding: 1.5rem; border-top: 4px solid ${color};">
                <div style="color: var(--text-dim); font-size: 0.85rem; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 1px;">${label}</div>
                <div style="font-size: 2rem; font-weight: 700; margin-bottom: 0.25rem;">${value}</div>
                <div style="font-size: 0.75rem; color: ${color}; opacity: 0.8;">${sub}</div>
            </div>
        `;
    },

    refresh: function () {
        if (this.unsubscribeUsers) this.unsubscribeUsers();
        this.isInitialized = false;
        const container = document.getElementById('tab-content');
        if (container) container.innerHTML = this.render();
        showToast("Database Synced ⚡");
    }
};
