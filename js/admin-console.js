// Admin Console Module
// Advanced system management for Super Admins

window.AdminConsole = {
    isInitialized: false,
    state: {
        users: [],
        coadmins: [],
        colleges: [],
        pendingNotes: [],
        allNotes: [],
        _showAddColForm: false
    },

    render: function () {
        if (!this.isInitialized) {
            this.init();
        }

        // Render skeleton or cached state immediately
        const initialContent = this.isInitialized ? this.renderOverview() : '<p style="padding: 2rem; color: var(--text-dim);">⚡ Warming up systems...</p>';

        return `
            <div class="tab-pane active fade-in" style="padding: 2rem;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 3rem;">
                    <div>
                        <h1 class="font-heading" style="font-size: 2.5rem;">🚨 Admin <span class="gradient-text">Command Center</span></h1>
                        <p style="color: var(--text-dim);">System oversight, user management, and global configurations.</p>
                    </div>
                    <button class="btn btn-ghost" onclick="AdminConsole.refresh()" style="border: 1px solid var(--border-glass);">🔄 Sync Database</button>
                </div>

                <div class="glass-card" style="padding: 1rem; margin-bottom: 2rem; display: flex; gap: 1rem;">
                    <button class="btn btn-sm btn-primary" onclick="AdminConsole.switchView('overview')">📊 Overview</button>
                    <button class="btn btn-sm btn-ghost" onclick="AdminConsole.switchView('coadmins')">👥 Manage Co-Admins</button>
                    <button class="btn btn-sm btn-ghost" onclick="AdminConsole.switchView('colleges')">🏫 College Analytics</button>
                    <button class="btn btn-sm btn-ghost" onclick="AdminConsole.switchView('support')">📨 Support Inbox</button>
                </div>

                <div id="admin-view-content">
                    ${initialContent}
                </div>
            </div>
        `;
    },

    switchView: function (viewId) {
        const container = document.getElementById('admin-view-content');
        if (!container) return;

        // Toggle buttons style
        const btns = document.querySelectorAll('.glass-card button.btn-sm');
        btns.forEach(b => b.classList.replace('btn-primary', 'btn-ghost'));

        const map = { 'overview': 0, 'coadmins': 1, 'colleges': 2, 'support': 3 };
        if (btns[map[viewId]]) {
            btns[map[viewId]].classList.replace('btn-ghost', 'btn-primary');
        }

        if (viewId === 'overview') container.innerHTML = this.renderOverview();
        else if (viewId === 'coadmins') container.innerHTML = this.renderCoAdminManager();
        else if (viewId === 'colleges') container.innerHTML = this.renderCollegeAnalytics();
        else if (viewId === 'support') {
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
                ${this.renderKPI('🏫 Colleges', this.state.colleges.length, 'Supported', '#2ECC71')}
            </div>

            <div class="glass-card" style="padding: 2rem;">
                <h3 class="font-heading" style="margin-bottom:1rem;">Recent Activity Log (Global)</h3>
                <p style="color: var(--text-dim);">Real-time feed of uploads, approvals, and user registrations.</p>
                <div id="global-activity-feed" style="margin-top: 1rem; max-height: 300px; overflow-y: auto;">
                    <div style="padding: 1rem; border-bottom: 1px solid var(--border-glass);">System Initialized. Viewing live dashboard.</div>
                </div>
            </div>
        `;
    },

    renderCoAdminManager: function () {
        const colleges = this.state.colleges;
        return `
            <div class="grid-2-col" style="display: grid; grid-template-columns: 1fr 2fr; gap: 2rem; align-items: start;">
                <!-- Add Form -->
                <div class="glass-card" style="padding: 2rem;">
                    <div style="margin-bottom: 2rem;">
                         <h3 class="font-heading" style="color:white; display:flex; align-items:center; gap:0.5rem;">
                            <span class="icon">👤</span> + Assign Co-Admin
                         </h3>
                         <p style="color: var(--text-dim); font-size: 0.9rem; margin-top:0.5rem;">Grant restricted moderation rights for a specific college.</p>
                    </div>
                    
                    <div class="admin-input-group" style="margin-bottom: 1.2rem;">
                        <label>User Email address</label>
                        <input type="email" id="ca-email" class="admin-input" placeholder="e.g. professor.j@college.edu">
                    </div>
                    
                    <div class="admin-input-group" style="margin-bottom: 1.2rem;">
                        <label>Assign University</label>
                        <select id="ca-college" class="admin-input" style="background: rgba(0,0,0,0.3); color: white;">
                             <option value="" disabled selected>Select a college...</option>
                             ${colleges.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                        </select>
                    </div>

                    <button class="btn btn-primary" onclick="AdminConsole.addCoAdmin()" style="width:100%; padding: 1rem; font-weight: 600; margin-top: 1rem;">
                        Grant Access Level
                    </button>
                    
                    <p style="margin-top: 1.5rem; font-size: 0.8rem; color: var(--text-dim); border-top: 1px solid var(--border-glass); padding-top: 1rem;">
                        <strong style="color:var(--F1C40F);">Note:</strong> If the user is not found, an invite will be created. They will receive Co-Admin rights automatically upon their first sign-in.
                    </p>
                </div>

                <!-- Existing Admins List -->
                <div class="glass-card" style="padding: 0; overflow: hidden;">
                    <div style="padding: 1.5rem; border-bottom: 1px solid var(--border-glass); display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h3 class="font-heading">Active Co-Admins</h3>
                            <p style="font-size: 0.85rem; color: var(--text-dim);">Manage existing access rights.</p>
                        </div>
                        <div class="status-badge active" style="font-size: 0.7rem; border-radius: 20px; padding: 4px 12px; background: rgba(46, 204, 113, 0.1); border: 1px solid rgba(46, 204, 113, 0.2); color: #2ECC71;">
                           ● ${this.state.coadmins.length} Active
                        </div>
                    </div>
                    
                    <div style="max-height: 500px; overflow-y: auto;">
                        <table style="width: 100%; border-collapse: collapse; text-align: left;">
                            <thead>
                                <tr style="border-bottom: 1px solid var(--border-glass); background: rgba(255,255,255,0.02);">
                                    <th style="padding: 1rem 2rem; color: var(--text-dim); font-size: 0.75rem; text-transform: uppercase;">Administrator</th>
                                    <th style="padding: 1rem; color: var(--text-dim); font-size: 0.75rem; text-transform: uppercase;">Assigned College</th>
                                    <th style="padding: 1rem 2rem; color: var(--text-dim); font-size: 0.75rem; text-transform: uppercase; text-align: right;">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.state.coadmins.map(admin => {
            const statusLabel = admin.isInvite ?
                '<span class="status-badge" style="background:rgba(241, 196, 15, 0.2); color:#F1C40F; font-size:0.6rem; padding:2px 6px; margin-left:8px;">PENDING INVITE</span>' :
                '<span class="status-badge" style="background:rgba(46, 204, 113, 0.2); color:#2ECC71; font-size:0.6rem; padding:2px 6px; margin-left:8px;">ACTIVE</span>';

            return `
                                        <tr style="border-bottom: 1px solid var(--border-glass);">
                                            <td style="padding: 1rem 2rem;">
                                                <div style="display: flex; align-items: center; gap: 1rem;">
                                                    <div style="width: 36px; height: 36px; background: rgba(255,255,255,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white;">
                                                        ${admin.name ? admin.name.charAt(0).toUpperCase() : 'U'}
                                                    </div>
                                                    <div>
                                                        <div style="font-weight: 600; color: white;">
                                                            ${admin.name || 'Unknown User'}
                                                            ${statusLabel}
                                                        </div>
                                                        <div style="font-size: 0.8rem; color: var(--text-dim);">${admin.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style="padding: 1rem;">
                                                <span class="role-badge coadmin" style="background: rgba(123, 97, 255, 0.1); color: #7B61FF; padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600;">
                                                    ${admin.college ? admin.college.toUpperCase() : 'UNASSIGNED'}
                                                </span>
                                            </td>
                                            <td style="text-align: right; padding: 1rem 2rem;">
                                                <button class="btn-icon danger" onclick="AdminConsole.removeCoAdmin('${admin.id}', ${admin.isInvite})" style="color: #ff4757; transition: 0.2s;">
                                                    🗑️ Revoke
                                                </button>
                                            </td>
                                        </tr>
                                    `;
        }).join('')}
                                
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
            <div class="fade-in">
                <!-- Header -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <div>
                        <h3 class="font-heading" style="display: flex; align-items: center; gap: 0.75rem;">
                            🏫 College Performance
                        </h3>
                        <p style="color: var(--text-dim); font-size: 0.9rem;">Content distribution and analytics across active institutions.</p>
                    </div>
                </div>

                <!-- Performance Grid -->
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem;">
                    ${this.state.colleges.map(c => {
            const allForColl = this.state.allNotes.filter(n => n.college === c.id || n.collegeId === c.id);
            const published = allForColl.filter(n => n.status === 'approved').length;
            const pending = allForColl.filter(n => n.status === 'pending').length;

            return `
                            <div class="glass-card" style="padding: 2rem; position: relative; border: 1px solid var(--border-glass); transition: 0.3s transform;">
                                <div style="display: flex; align-items: center; gap: 1.25rem; margin-bottom: 1.5rem;">
                                    <div style="width: 52px; height: 52px; background: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; padding: 6px; box-shadow: 0 4px 15px rgba(0,0,0,0.15);">
                                        <img src="${c.logo || 'https://cdn-icons-png.flaticon.com/512/2602/2602414.png'}" style="width: 100%; height: 100%; object-fit: contain;">
                                    </div>
                                    <div>
                                        <h4 style="margin: 0; font-size: 1.1rem; color: white;">${c.name}</h4>
                                        <div style="font-size: 0.8rem; color: var(--text-dim);">#${c.id} • ${c.city || ''}</div>
                                    </div>
                                </div>

                                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <span style="font-size: 0.9rem; color: var(--text-dim);">Published Notes</span>
                                        <span style="font-weight: 700; color: var(--primary); font-size: 1.1rem;">${published}</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <span style="font-size: 0.9rem; color: var(--text-dim);">Pending Approval</span>
                                        <span style="font-weight: 700; color: #F1C40F; font-size: 1.1rem;">${pending}</span>
                                    </div>
                                </div>
                            </div>
                        `;
        }).join('')}
                    
                    ${this.state.colleges.length === 0 ? `
                        <div style="grid-column: 1 / -1; padding: 5rem; text-align: center; color: var(--text-dim);">
                            No colleges active in database.
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    },

    init: function () {
        if (this.isInitialized) return;

        const { db, collection, onSnapshot, query, where } = window.firebaseServices || {};
        if (!db) return;

        console.log("📡 Admin Console: Connecting to Live DB...");

        const processLists = () => {
            const users = this._snapUsers || [];
            const invites = this._snapInvites || [];
            this.state.users = users;

            const realCoAdmins = users.filter(u => u.role === 'coadmin');
            const invitedCoAdmins = invites.map(i => ({
                id: 'invite_' + i.email,
                name: i.email.split('@')[0],
                email: i.email,
                role: 'coadmin',
                isInvite: true,
                college: i.college,
                status: 'pending'
            }));

            this.state.coadmins = [...realCoAdmins, ...invitedCoAdmins];

            const viewContent = document.getElementById('admin-view-content');
            const activeBtn = document.querySelector('.glass-card button.btn-primary');
            if (viewContent && activeBtn && activeBtn.innerText.includes('Co-Admins')) {
                viewContent.innerHTML = this.renderCoAdminManager();
            } else if (viewContent && activeBtn && activeBtn.innerText.includes('Overview')) {
                viewContent.innerHTML = this.renderOverview();
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

        this.unsubscribeColleges = onSnapshot(collection(db, 'colleges'), (snap) => {
            this.state.colleges = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            this.logActivity(`📡 Database Sync: ${this.state.colleges.length} colleges detected.`);
            const viewContent = document.getElementById('admin-view-content');
            const activeBtn = document.querySelector('.glass-card button.btn-primary');
            if (viewContent && activeBtn && activeBtn.innerText.includes('Analytics')) {
                viewContent.innerHTML = this.renderCollegeAnalytics();
            }
        });

        onSnapshot(collection(db, 'notes'), (snap) => {
            const all = [];
            snap.forEach(doc => all.push({ id: doc.id, ...doc.data() }));
            this.state.allNotes = all;
            this.state.pendingNotes = all.filter(n => n.status === 'pending');

            const viewContent = document.getElementById('admin-view-content');
            const activeBtn = document.querySelector('.glass-card button.btn-primary');
            if (viewContent && activeBtn && activeBtn.innerText.includes('Analytics')) {
                viewContent.innerHTML = this.renderCollegeAnalytics();
            } else if (viewContent && activeBtn && activeBtn.innerText.includes('Overview')) {
                viewContent.innerHTML = this.renderOverview();
            }
        });

        this.bootstrapDefaultColleges();
        this.isInitialized = true;
    },



    bootstrapDefaultColleges: async function () {
        const { db, collection, getDocs, doc, setDoc, serverTimestamp } = window.firebaseServices;
        try {
            this.logActivity("🚀 System Seeding: Ensuring core universities are synchronized...");
            const defaults = [
                { id: 'medicaps', name: 'Medicaps University', city: 'Indore', state: 'MP', logo: '../assets/logos/medicaps.png' },
                { id: 'ips', name: 'IPS Academy', city: 'Indore', state: 'MP', logo: '../assets/logos/ips.png' },
                { id: 'lpu', name: 'LPU University', city: 'Phagwara', state: 'Punjab', logo: '../assets/logos/lpu.png' },
                { id: 'cdgi', name: 'CDGI University', city: 'Indore', state: 'MP', logo: '../assets/logos/cdgi.png' },
                { id: 'iitd', name: 'IIT Delhi', city: 'Delhi', state: 'Delhi', logo: '../assets/logos/iitd.png' },
                { id: 'sgsits', name: 'SGSITS Indore', city: 'Indore', state: 'MP', logo: '../assets/logos/sgsits.png' },
                { id: 'davv', name: 'DAVV Indore', city: 'Indore', state: 'MP', logo: '../assets/logos/davv.png' },
                { id: 'vit', name: 'VIT Vellore', city: 'Vellore', state: 'Tamil Nadu', logo: '../assets/logos/vit.png' },
                { id: 'srm', name: 'SRM University', city: 'Chennai', state: 'Tamil Nadu', logo: '../assets/logos/srm.png' },
                { id: 'manipal', name: 'Manipal University', city: 'Manipal', state: 'Karnataka', logo: '../assets/logos/manipal.png' }
            ];

            await Promise.all(defaults.map(c =>
                setDoc(doc(db, 'colleges', c.id), {
                    ...c,
                    status: 'active',
                    updatedAt: serverTimestamp()
                }, { merge: true })
            ));

            this.logActivity("✅ Verification Complete: All core institutions are live.");
        } catch (e) {
            console.warn("Bootstrap Skip:", e.message);
            this.logActivity("⚠️ Bootstrap Alert: " + e.message);
        }
    },

    logActivity: function (msg) {
        const feed = document.getElementById('global-activity-feed');
        if (feed) {
            const time = new Date().toLocaleTimeString();
            const div = document.createElement('div');
            div.style.cssText = 'padding: 1rem; border-bottom: 1px solid var(--border-glass); animation: fadeIn 0.3s ease;';
            div.innerHTML = `<span style="color: var(--text-dim); font-size: 0.8rem;">[${time}]</span> ${msg}`;
            feed.prepend(div);
        }
    },

    addCoAdmin: async function () {
        const emailInput = document.getElementById('ca-email');
        const collegeSelect = document.getElementById('ca-college');
        const email = emailInput?.value;
        const collegeId = collegeSelect?.value;

        if (!email) return alert("Please enter an email.");
        if (!collegeId) return alert("Please select a college.");

        const { db, collection, getDocs, getDoc, query, where, updateDoc, doc, setDoc, serverTimestamp } = window.firebaseServices;
        const cleanEmail = email.trim().toLowerCase();

        if (!confirm(`Grant CO-ADMIN access to ${cleanEmail} for ${collegeId.toUpperCase()}?`)) return;

        try {
            const caMapRef = doc(db, 'college_admins', collegeId);
            const caMapSnap = await getDoc(caMapRef);
            if (caMapSnap.exists()) {
                const existing = caMapSnap.data();
                return alert(`⚠️ Error: ${collegeId.toUpperCase()} already has a Co-Admin (${existing.email}).`);
            }

            const userRef = query(collection(db, 'users'), where('email', '==', cleanEmail));
            const userSnap = await getDocs(userRef);

            if (!userSnap.empty) {
                const targetUser = userSnap.docs[0];
                const targetUid = targetUser.id;
                await updateDoc(doc(db, 'users', targetUid), { role: 'coadmin', college: collegeId });
                await setDoc(caMapRef, { coadminUid: targetUid, email: cleanEmail, assignedAt: serverTimestamp() });
                alert("✅ Success! User promoted directly.");
            } else {
                await setDoc(doc(db, 'role_invites', cleanEmail), { email: cleanEmail, role: 'coadmin', college: collegeId, status: 'pending', invitedAt: serverTimestamp() });
                await setDoc(caMapRef, { email: cleanEmail, status: 'pending_invite', assignedAt: serverTimestamp() });
                alert(`📩 Pre-Authorized ${cleanEmail}.`);
            }
            if (emailInput) emailInput.value = '';
        } catch (e) {
            alert("Error: " + e.message);
        }
    },

    removeCoAdmin: async function (uid, isInvite = false) {
        if (!confirm("Revoke access?")) return;
        const { db, updateDoc, deleteDoc, doc } = window.firebaseServices;
        try {
            const admin = this.state.coadmins.find(a => a.id === uid);
            const collegeId = admin ? admin.college : null;
            if (isInvite) {
                const email = uid.replace('invite_', '');
                await deleteDoc(doc(db, 'role_invites', email));
                if (collegeId) await deleteDoc(doc(db, 'college_admins', collegeId));
            } else {
                await updateDoc(doc(db, 'users', uid), { role: 'user', college: null });
                if (collegeId) await deleteDoc(doc(db, 'college_admins', collegeId));
            }
            alert("✅ Revoked.");
        } catch (e) {
            alert("Error: " + e.message);
        }
    },



    renderKPI: function (label, value, sub, color) {
        return `
            <div class="glass-card kpi-card" style="padding: 1.5rem; border-top: 4px solid ${color};">
                <div style="color: var(--text-dim); font-size: 0.85rem; margin-bottom: 0.5rem; text-transform: uppercase;">${label}</div>
                <div style="font-size: 2rem; font-weight: 700;">${value}</div>
                <div style="font-size: 0.75rem; color: ${color};">${sub}</div>
            </div>
        `;
    },

    refresh: function () {
        this.isInitialized = false;
        const container = document.getElementById('tab-content');
        if (container) container.innerHTML = this.render();
    }
};

// Auto-init for instant open
AdminConsole.init();
