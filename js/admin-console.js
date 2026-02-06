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
                        <p style="color: var(--text-dim); display: flex; align-items: center; gap: 0.5rem;">
                            System oversight, user management, and global configurations.
                            <span id="db-health-badge" style="font-size: 0.7rem; padding: 2px 8px; border-radius: 12px; background: rgba(255,255,255,0.05); color: var(--text-dim); border: 1px solid var(--border-glass); cursor: pointer;" onclick="AdminConsole.forceReconnect()" title="Click to force reconnect">
                                📡 Checking Connection...
                            </span>
                        </p>
                    </div>
                    <button class="btn btn-ghost" onclick="AdminConsole.refresh()" style="border: 1px solid var(--border-glass);">🔄 Sync Database</button>
                </div>

                <div class="glass-card" style="padding: 1rem; margin-bottom: 2rem; display: flex; gap: 1rem;">
                    <button class="btn btn-sm btn-primary" onclick="AdminConsole.switchView('overview')">📊 Overview</button>
                    <button class="btn btn-sm btn-ghost" onclick="AdminConsole.switchView('coadmins')">👥 Manage Co-Admins</button>
                    <button class="btn btn-sm btn-ghost" onclick="AdminConsole.switchView('colleges')">🏫 College Analytics</button>
                    <button class="btn btn-sm btn-ghost" onclick="AdminConsole.switchView('support')">📨 Support Inbox</button>
                    <button class="btn btn-sm btn-ghost" onclick="AdminConsole.switchView('debug')" id="debug-tab-btn">🧪 Debug Console</button>
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
        else if (viewId === 'debug') {
            container.innerHTML = this.renderDebugConsole();
        }
    },

    renderDebugConsole: function () {
        return `
            <div class="glass-card" style="padding: 2rem;">
                <h3 class="font-heading" style="margin-bottom:1rem;">🧪 System Debug Console</h3>
                <p style="color: var(--text-dim); margin-bottom: 2rem;">Real-time diagnostics for database and authentication services.</p>
                
                <div id="admin-debug-logs" style="background: rgba(0,0,0,0.5); padding: 1.5rem; border-radius: 12px; font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; height: 400px; overflow-y: auto; border: 1px solid var(--border-glass);">
                    <div style="color: #666;">[${new Date().toLocaleTimeString()}] Diagnostics Initialized...</div>
                </div>
                
                <div style="margin-top: 2rem; display: flex; flex-wrap: wrap; gap: 1rem;">
                    <button class="btn btn-primary" onclick="AdminConsole.forceReconnect()">⚡ Reconnect Firestore</button>
                    <button class="btn btn-secondary" style="background: rgba(255, 71, 87, 0.1); border-color: rgba(255, 71, 87, 0.2); color: #ff4757;" onclick="AdminConsole.hardResetFirestore()">🚨 Hard Reset (Cloud Sync)</button>
                    <button class="btn btn-ghost" onclick="AdminConsole.clearLogs()">🧹 Clear Logs</button>
                </div>
            </div>
        `;
    },

    logDebug: function (msg, type = 'info') {
        const logContainer = document.getElementById('admin-debug-logs');
        if (logContainer) {
            const time = new Date().toLocaleTimeString();
            const color = type === 'error' ? '#ff4757' : type === 'success' ? '#2ecc71' : type === 'warn' ? '#f1c40f' : '#fff';
            const div = document.createElement('div');
            div.style.marginBottom = '0.5rem';
            div.style.color = color;
            div.innerHTML = `<span style="color: #666;">[${time}]</span> ${msg}`;
            logContainer.appendChild(div);
            logContainer.scrollTop = logContainer.scrollHeight;
        }
    },

    clearLogs: function () {
        const logContainer = document.getElementById('admin-debug-logs');
        if (logContainer) logContainer.innerHTML = `<div style="color: #666;">[${new Date().toLocaleTimeString()}] Logs Cleared.</div>`;
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
                        <input type="text" id="ca-email" class="admin-input" placeholder="User Email OR Firebase UID (if lookup fails)">
                    </div>
                    
                    <div class="admin-input-group" style="margin-bottom: 1.2rem;">
                        <label>Assign University</label>
                        <select id="ca-college" class="admin-input" style="background: rgba(0,0,0,0.3); color: white;">
                             <option value="" disabled selected>Select a college...</option>
                             ${colleges.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                        </select>
                    </div>

                    <button id="grant-access-btn" class="btn btn-primary" onclick="AdminConsole.addCoAdmin()" style="width:100%; padding: 1rem; font-weight: 600; margin-top: 1rem;">
                        Grant Access Level
                    </button>
                    
                    <p style="margin-top: 1.5rem; font-size: 0.8rem; color: var(--text-dim); border-top: 1px solid var(--border-glass); padding-top: 1rem;">
                        <strong style="color:var(--F1C40F);">Note:</strong> User must have logged in at least once to be assigned.
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
                                ${this.state.coadmins.map(c => {
            return `
                                        <tr style="border-bottom: 1px solid var(--border-glass);">
                                            <td style="padding: 1rem 2rem;">
                                                <div style="display: flex; align-items: center; gap: 1rem;">
                                                    <div style="width: 36px; height: 36px; background: rgba(255,255,255,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white;">
                                                        ${c.email ? c.email.charAt(0).toUpperCase() : 'U'}
                                                    </div>
                                                    <div>
                                                        <div style="font-weight: 600; color: white;">
                                                            ${c.email || 'Unknown User'}
                                                            <span class="status-badge" style="background:rgba(46, 204, 113, 0.2); color:#2ECC71; font-size:0.6rem; padding:2px 6px; margin-left:8px;">ACTIVE</span>
                                                        </div>
                                                        <div style="font-size: 0.8rem; color: var(--text-dim);">${c.uid}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style="padding: 1rem;">
                                                <span class="role-badge coadmin" style="background: rgba(123, 97, 255, 0.1); color: #7B61FF; padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600;">
                                                    ${c.college ? c.college.toUpperCase() : 'UNASSIGNED'}
                                                </span>
                                            </td>
                                            <td style="text-align: right; padding: 1rem 2rem;">
                                                <button class="btn-icon danger" onclick="AdminConsole.revokeAccess('${c.id}', '${c.college}')" style="color: #ff4757; transition: 0.2s;">
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

        // Ensure window.firebaseServices is ready before proceeding
        if (!window.firebaseServices || !window.firebaseServices.db) {
            console.log("⏳ Admin Console: Waiting for Firebase Services...");
            setTimeout(() => this.init(), 500);
            return;
        }

        const { db, collection, onSnapshot, query, where, getDocs, getDocsFromServer, limit, doc } = window.firebaseServices;
        console.log("📡 Admin Console: Connecting to Live DB...");

        // Monitor Connection Health (Heartbeat every 30s)
        const checkHealth = async () => {
            const badge = document.getElementById('db-health-badge');
            if (!badge) return;
            try {
                // Try a small server-side fetch to verify real connectivity
                // USE getDocsFromServer to bypass cache and force network check
                const q = query(collection(db, "colleges"), limit(1));
                await getDocsFromServer(q);
                badge.innerHTML = "🟢 System Online";
                badge.style.color = "#2ecc71";
                badge.style.borderColor = "rgba(46, 204, 113, 0.3)";
                this.logDebug("Cloud Heartbeat: Success (Connection Stable)", "success");
            } catch (e) {
                console.warn("💓 Heartbeat Fail:", e.message);
                badge.innerHTML = "🔴 System Offline";
                badge.style.color = "#ff4757";
                badge.style.borderColor = "rgba(255, 71, 87, 0.3)";
                this.logDebug(`Cloud Heartbeat Fail: ${e.message}`, "error");
            }
        };

        checkHealth();
        this.healthInterval = setInterval(checkHealth, 10000); // 10s for faster debug

        // 3. ADMIN DASHBOARD - FIX LISTING (SHARED DB + ROLE QUERY)
        // Query users where role == 'coadmin' directly
        const qCoAdmins = query(collection(db, "users"), where("role", "==", "coadmin"));

        this.unsubscribeCoAdmins = onSnapshot(qCoAdmins, (snap) => {
            this.state.coadmins = snap.docs.map(d => ({
                id: d.id,
                uid: d.id,
                ...d.data()
            }));

            const viewContent = document.getElementById('admin-view-content');
            const activeBtn = document.querySelector('.glass-card button.btn-primary');
            if (viewContent && activeBtn && activeBtn.innerText.includes('Co-Admins')) {
                viewContent.innerHTML = this.renderCoAdminManager();
            } else if (viewContent && activeBtn && activeBtn.innerText.includes('Overview')) {
                viewContent.innerHTML = this.renderOverview();
            }
        }, (error) => {
            this.logDebug(`Co-Admin Listener Error: ${error.message} (Code: ${error.code})`, "error");
        });

        this.unsubscribeColleges = onSnapshot(collection(db, 'colleges'), (snap) => {
            this.state.colleges = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        });

        // Note: we might still want users list for metrics, but NOT for coadmin logic.
        // Keeping it separate.
        onSnapshot(collection(db, 'users'), (snap) => {
            this.state.users = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            console.log("📊 Admin Debug: Loaded Users:", this.state.users.map(u => `${u.email} (${u.role})`));
            this.refreshViewIfActive('Overview');
        });

        onSnapshot(collection(db, 'notes'), (snap) => {
            const all = [];
            snap.forEach(doc => all.push({ id: doc.id, ...doc.data() }));
            this.state.allNotes = all;
            this.state.pendingNotes = all.filter(n => n.status === 'pending');
            this.refreshViewIfActive('Overview');
            this.refreshViewIfActive('Analytics');
        });

        this.bootstrapDefaultColleges();
        this.isInitialized = true;
    },

    refreshViewIfActive: function (viewName) {
        const viewContent = document.getElementById('admin-view-content');
        const activeBtn = document.querySelector('.glass-card button.btn-primary');
        if (viewContent && activeBtn && activeBtn.innerText.includes(viewName)) {
            // simple re-render triggers
            if (viewName === 'Overview') viewContent.innerHTML = this.renderOverview();
            if (viewName === 'Analytics') viewContent.innerHTML = this.renderCollegeAnalytics();
        }
    },



    bootstrapDefaultColleges: async function () {
        const { db, collection, getDocs, doc, setDoc, serverTimestamp } = window.firebaseServices || {};
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
        const inputVal = document.getElementById("ca-email").value.trim();
        const collegeId = document.getElementById("ca-college").value;
        const btn = document.getElementById("grant-access-btn");

        if (!inputVal || !collegeId) return alert("Fill all fields");

        // Throttle Button
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="loading-spinner"></span> Processing...';
        }

        const { db, collection, query, where, getDocs, doc, updateDoc, getDoc, setDoc } = window.firebaseServices;

        try {
            let uid;
            let emailFound = "";

            // DETECT INPUT TYPE: Email vs UID
            if (!inputVal.includes('@') && inputVal.length > 20) {
                // assume UID (long string without @)
                console.log("🆔 Attempting lookup by UID:", inputVal);
                const userRef = doc(db, "users", inputVal);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    uid = inputVal;
                    emailFound = userSnap.data().email || "Unknown Email";
                } else {
                    alert(`❌ User not found in database by UID: ${inputVal}\n\nMake sure the user has logged in at least once.`);
                    return;
                }
            } else {
                // Treat as Email (search case-insensitively)
                const searchEmail = inputVal.toLowerCase();
                console.log("📧 Attempting lookup by Email:", searchEmail);

                // 1. Try Cache First (Efficient)
                let userDocStub = this.state.users.find(u =>
                    (u.email && u.email.toLowerCase() === searchEmail) ||
                    (u.id === inputVal) // also try matching as a short ID/UID just in case
                );

                if (userDocStub) {
                    console.log("✅ Found in local cache");
                    uid = userDocStub.uid || userDocStub.id;
                    emailFound = userDocStub.email;
                } else {
                    // 2. Network Query Fallback (Reliable)
                    console.log("⚠️ User not in cache, querying network for:", searchEmail);
                    const q = query(collection(db, "users"), where("email", "==", searchEmail));
                    const snap = await getDocs(q);

                    if (snap.empty) {
                        // 3. Last Ditch: If they passed a UID as the email field
                        const userRef = doc(db, "users", inputVal);
                        const userSnap = await getDoc(userRef);

                        if (userSnap.exists()) {
                            uid = inputVal;
                            emailFound = userSnap.data().email;
                        } else {
                            alert(`❌ User '${inputVal}' not found.\n\nTroubleshooting:\n1. Verify the email is correct.\n2. Ensure the user has logged in once.\n3. Try using their Firebase UID directly.`);
                            return;
                        }
                    } else {
                        uid = snap.docs[0].id;
                        emailFound = snap.docs[0].data().email;
                    }
                }
            }

            // 2. College Lock Check (Optional, but keeping for business logic)
            const collegeRef = doc(db, "colleges", collegeId);
            const collegeSnap = await getDoc(collegeRef);

            // 3. Assign Role & College
            console.log("🚀 Granting Co-Admin permissions to:", emailFound);
            await updateDoc(doc(db, "users", uid), {
                role: "coadmin",
                college: collegeId
            });

            // 4. Update College record with Co-Admin reference
            await setDoc(collegeRef, {
                coadminUid: uid,
                coadminEmail: emailFound // Helpful for quick lookup
            }, { merge: true });

            alert(`✅ Success: ${emailFound} is now Co-Admin for ${collegeId}`);
            document.getElementById("ca-email").value = "";
            document.getElementById("ca-college").value = "";

        } catch (e) {
            console.error("Co-Admin Assignment Error:", e);

            let errorMsg = e.message || "Unknown Error";
            if (e.code === 'unavailable' || errorMsg.toLowerCase().includes('offline')) {
                errorMsg = "Database Connection Lost. This usually happens if the backend is waking up or your internet flickered.\n\nTry clicking 'Grant Access Level' again in a few seconds, or reload the page.";
            } else if (e.code === 'permission-denied') {
                errorMsg = "Security Denied: You don't have permission to modify this user. Try logging out and back in.";
            }

            alert("Assignment Failed: " + errorMsg);
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = 'Grant Access Level';
            }
        }
    },

    revokeAccess: async function (uid, collegeId) {
        if (!confirm("Revoke Co-Admin access? This will unlock the college.")) return;
        const { db, updateDoc, doc } = window.firebaseServices;
        try {
            // 1. Reset user
            await updateDoc(doc(db, "users", uid), {
                role: "user",
                college: null
            });

            // 2. Unlock college
            if (collegeId && collegeId !== 'null' && collegeId !== 'undefined') {
                await updateDoc(doc(db, "colleges", collegeId), {
                    coadminUid: null
                });
            }

            alert("✅ Revoked & College Unlocked.");
        } catch (e) {
            console.error(e);
            alert("Revoke Error: " + e.message);
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
        // Force full reload to clear all caches and listeners
        // This is the most robust way to 'Sync' if things get stuck
        if (confirm("Reload Admin Console to sync latest data?")) {
            window.location.reload();
        }
    },

    forceReconnect: async function () {
        if (!window.firebaseServices || !window.firebaseServices.db) return;
        const { db, enableNetwork, disableNetwork } = window.firebaseServices;
        const badge = document.getElementById('db-health-badge');

        console.log("🔄 Admin Console: Manually forcing network recovery...");
        if (badge) {
            badge.innerHTML = "🔄 Reconnecting...";
            badge.style.color = "#f1c40f";
        }

        try {
            await disableNetwork(db);
            // Wait a moment for cleanup
            await new Promise(r => setTimeout(r, 1000));
            await enableNetwork(db);
            console.log("✅ Admin Console: Network enabled successfully.");

            if (badge) badge.innerHTML = "📡 Querying Cloud...";

            // Trigger a fresh health check immediately
            setTimeout(() => {
                const currentBadge = document.getElementById('db-health-badge');
                if (currentBadge && currentBadge.innerHTML.includes("Querying")) {
                    alert("Sync taking longer than expected. Please reload the page if it doesn't turn green soon.");
                }
            }, 8000);

            // Re-run init logic to refresh listeners
            this.init();
        } catch (e) {
            console.error("❌ Reconnect Failed:", e);
            alert("Force Reconnect Failed: " + (e.message || e));
        }
    },

    hardResetFirestore: async function () {
        if (!confirm("🚨 WARNING: This will force-close the database connection and clear your local cache to fix status issues.\n\nThe page will reload automatically. Proceed?")) return;

        if (!window.firebaseServices || !window.firebaseServices.db) return;
        const { db, terminate, clearIndexedDbPersistence } = window.firebaseServices;

        console.log("🧨 Admin Console: STARTING HARD RESET...");
        this.logDebug("🧨 Initializing Hard Reset (Cloud Sync Override)...", "warn");

        try {
            await terminate(db);
            console.log("🛑 Database terminated.");
            await clearIndexedDbPersistence(db);
            console.log("🧹 Cache cleared.");
            this.logDebug("✅ Database reset successful. Reloading...", "success");

            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (e) {
            console.error("❌ Hard Reset Failed:", e);
            alert("Hard Reset Failed: " + e.message + "\n\nPlease try reloading manually.");
        }
    }
};

// Auto-init for instant open
AdminConsole.init();
