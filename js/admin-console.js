
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
                </div>

                <!-- Navigation Tabs Internal -->
                <div class="glass-card" style="padding: 1rem; margin-bottom: 2rem; display: flex; gap: 1rem;">
                    <button class="btn btn-sm btn-primary" onclick="AdminConsole.switchView('overview')">📊 Overview</button>
                    <button class="btn btn-sm btn-ghost" onclick="AdminConsole.switchView('coadmins')">👥 Manage Co-Admins</button>
                    <button class="btn btn-sm btn-ghost" onclick="AdminConsole.switchView('colleges')">🏫 College Analytics</button>
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
        // (Simplified button toggle logic for now)

        if (viewId === 'overview') container.innerHTML = this.renderOverview();
        else if (viewId === 'coadmins') container.innerHTML = this.renderCoAdminManager();
        else if (viewId === 'colleges') container.innerHTML = this.renderCollegeAnalytics();
    },

    renderOverview: function () {
        return `
            <div class="admin-grid-kpi" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; margin-bottom: 2rem;">
                ${this.renderKPI('👥 Total Users', this.state.users.length || 'Loading...', 'Active in DB', '#7B61FF')}
                ${this.renderKPI('👨‍💼 Co-Admins', this.state.coadmins.length || 0, 'Assigned', '#00F2FF')}
                ${this.renderKPI('🛡️ Pending Reviews', this.state.pendingNotes.length || 0, 'Global Queue', '#F1C40F')}
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
        return `
            <div class="grid-2-col" style="display: grid; grid-template-columns: 1fr 2fr; gap: 2rem;">
                <!-- Add Form -->
                <div class="glass-card" style="padding: 2rem;">
                    <h3 class="font-heading">➕ Assign Co-Admin</h3>
                    <p style="color: var(--text-dim); margin-bottom: 1.5rem; font-size: 0.9rem;">Grant college-level moderation rights.</p>
                    
                    <div class="form-group">
                        <label>User Email</label>
                        <input type="email" id="ca-email" class="input-field" placeholder="user@example.com" style="width:100%; margin-bottom: 1rem;">
                    </div>
                    
                    <div class="form-group">
                        <label>Assign College</label>
                        <select id="ca-college" class="input-field" style="width:100%; margin-bottom: 1.5rem; background:#000;">
                            ${GlobalData.colleges.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                        </select>
                    </div>

                    <button class="btn btn-primary" onclick="AdminConsole.addCoAdmin()" style="width:100%;">Grant Access</button>
                </div>

                <!-- List -->
                <div class="glass-card" style="padding: 0; overflow: hidden;">
                    <div style="padding: 1.5rem; border-bottom: 1px solid var(--border-glass);">
                        <h3 class="font-heading">Current Co-Admins</h3>
                    </div>
                    <div class="table-container header-fixed" style="max-height: 500px; overflow-y: auto;">
                        <table class="admin-table" style="width: 100%; border-collapse: collapse;">
                            <thead style="background: rgba(255,255,255,0.05);">
                                <tr>
                                    <th style="padding: 1rem; text-align: left;">Name / Email</th>
                                    <th style="padding: 1rem; text-align: left;">Assigned College</th>
                                    <th style="padding: 1rem; text-align: right;">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.state.coadmins.map(admin => `
                                    <tr style="border-bottom: 1px solid var(--border-glass);">
                                        <td style="padding: 1rem;">
                                            <div><strong>${admin.name}</strong></div>
                                            <div style="font-size: 0.8rem; color: var(--text-dim);">${admin.email}</div>
                                        </td>
                                        <td style="padding: 1rem;">
                                            <span class="role-badge coadmin">${admin.college?.toUpperCase() || 'UNASSIGNED'}</span>
                                        </td>
                                        <td style="padding: 1rem; text-align: right;">
                                            <button class="btn-icon" style="color: #ff4757;" onclick="AdminConsole.removeCoAdmin('${admin.id}')">🗑️ Revoke</button>
                                        </td>
                                    </tr>
                                `).join('')}
                                ${this.state.coadmins.length === 0 ? '<tr><td colspan="3" style="padding:2rem; text-align:center; color: var(--text-dim);">No Co-Admins assigned yet.</td></tr>' : ''}
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

        // 1. Listen to Users (for Co-Admin list and Total Users)
        this.unsubscribeUsers = onSnapshot(collection(db, 'users'), (snap) => {
            const users = [];
            const coadmins = [];
            snap.forEach(doc => {
                const u = { id: doc.id, ...doc.data() };
                users.push(u);
                if (u.role === 'coadmin') coadmins.push(u);
            });
            this.state.users = users;
            this.state.coadmins = coadmins;

            // Refresh current view if needed
            const container = document.getElementById('admin-view-content');
            if (container) {
                // Determine current view or default to overview? 
                // We'll simplisticly re-render if we are in coadmins tab
                // Better implementation would maintain active tab state.
            }
            // Trigger global refresh for now to update counts
            const kpiGrid = document.querySelector('.admin-grid-kpi');
            if (kpiGrid) kpiGrid.innerHTML = `
                ${this.renderKPI('👥 Total Users', users.length, 'Active in DB', '#7B61FF')}
                ${this.renderKPI('👨‍💼 Co-Admins', coadmins.length, 'Assigned', '#00F2FF')}
                ${this.renderKPI('🛡️ Pending Reviews', this.state.pendingNotes.length, 'Global Queue', '#F1C40F')}
                ${this.renderKPI('🏫 Colleges', GlobalData.colleges.length, 'Supported', '#2ECC71')}
            `;

            // If viewing list, update it
            // Only re-render full logic if we implement state-based React-like updates. 
            // For vanilla JS, we often just do targeted DOM updates or full re-renders on demand.
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
        const email = document.getElementById('ca-email').value;
        const collegeId = document.getElementById('ca-college').value;

        if (!email) return alert("Please enter an email.");

        const { db, collection, getDocs, query, where, updateDoc, doc } = window.firebaseServices;
        const confirmMsg = `Are you sure you want to promote ${email} to CO-ADMIN for ${collegeId.toUpperCase()}?`;
        if (!confirm(confirmMsg)) return;

        try {
            // Find user by email
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where("email", "==", email));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                alert("❌ User not found! They must sign up first.");
                return;
            }

            let uid;
            querySnapshot.forEach((d) => { uid = d.id; });

            // Update Role
            const userRef = doc(db, 'users', uid);
            await updateDoc(userRef, {
                role: 'coadmin',
                college: collegeId, // Assigned college
                collegeId: collegeId, // Support both naming conventions
                promotedAt: new Date().toISOString()
            });

            alert("✅ Success! User is now a Co-Admin.");
            this.switchView('coadmins'); // Refresh

        } catch (e) {
            console.error(e);
            alert("Error: " + e.message);
        }
    },

    removeCoAdmin: async function (uid) {
        if (!confirm("⚠️ Revoke Co-Admin status? They will become a regular user.")) return;
        const { db, updateDoc, doc } = window.firebaseServices;

        try {
            await updateDoc(doc(db, 'users', uid), {
                role: 'user',
                collegeId: null, // Clear assignment
                demotedAt: new Date().toISOString()
            });
            alert("✅ Co-Admin rights revoked.");
            this.switchView('coadmins');
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
    }
};
