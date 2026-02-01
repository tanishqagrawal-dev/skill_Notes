
// Admin Console Module
// Advanced system management for Super Admins

window.AdminConsole = {
    isInitialized: false,
    unsubscribe: null,

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
                    <div style="text-align: right;">
                        <div class="status-indicator online">
                            <span class="dot"></span> System Operational
                        </div>
                        <div style="font-size: 0.8rem; color: var(--text-dim); margin-top: 0.5rem;" id="admin-clock">--:--:--</div>
                    </div>
                </div>

                <!-- KPI Grid -->
                <div class="admin-grid-kpi" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; margin-bottom: 2rem;">
                    ${this.renderKPI('👥 Total Users', '1,248', '+12% this week', '#7B61FF')}
                    ${this.renderKPI('📚 Total Notes', window.NotesDB ? window.NotesDB.length : 0, 'across 5 colleges', '#00F2FF')}
                    ${this.renderKPI('⚡ AI Requests', '854', 'last 24 hours', '#FF2D95')}
                    ${this.renderKPI('🛡️ Pending Reviews', window.NotesDB ? window.NotesDB.filter(n => n.status === 'pending').length : 0, 'requires attention', '#F1C40F')}
                </div>

                <div class="grid-2-col" style="display: grid; grid-template-columns: 2fr 1fr; gap: 2rem;">
                    
                    <!-- Main Column: User Management -->
                    <div class="glass-card" style="padding: 0; overflow: hidden; display: flex; flex-direction: column; max-height: 600px;">
                        <div style="padding: 1.5rem; border-bottom: 1px solid var(--border-glass); display: flex; justify-content: space-between; align-items: center;">
                            <h3 class="font-heading">👥 User Directory</h3>
                            <div class="search-bar-mini" style="width: 200px;">
                                <input type="text" placeholder="Search users..." style="width: 100%; background: rgba(0,0,0,0.2); border: 1px solid var(--border-glass); padding: 0.5rem; border-radius: 6px; color: white;">
                            </div>
                        </div>
                        
                        <div class="table-container custom-scroll" style="overflow-y: auto; flex: 1;">
                            <table class="admin-table" style="width: 100%; border-collapse: collapse;">
                                <thead style="background: rgba(255,255,255,0.02); position: sticky; top: 0;">
                                    <tr>
                                        <th style="text-align: left; padding: 1rem; color: var(--text-dim);">User</th>
                                        <th style="text-align: left; padding: 1rem; color: var(--text-dim);">Role</th>
                                        <th style="text-align: left; padding: 1rem; color: var(--text-dim);">College</th>
                                        <th style="text-align: right; padding: 1rem; color: var(--text-dim);">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${this.renderUserRows()}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Side Column: System Health & Logs -->
                    <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                        
                        <!-- System Health -->
                        <div class="glass-card" style="padding: 1.5rem;">
                             <h3 class="font-heading" style="margin-bottom: 1.5rem;">❤️ System Health</h3>
                             
                             <div class="health-item" style="margin-bottom: 1rem;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.9rem;">
                                    <span>Database Latency</span>
                                    <span style="color: var(--success);">12ms</span>
                                </div>
                                <div class="progress-bar" style="width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px;">
                                    <div style="width: 15%; height: 100%; background: var(--success); border-radius: 3px;"></div>
                                </div>
                             </div>

                             <div class="health-item" style="margin-bottom: 1rem;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.9rem;">
                                    <span>Storage Usage</span>
                                    <span style="color: var(--primary);">45%</span>
                                </div>
                                <div class="progress-bar" style="width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px;">
                                    <div style="width: 45%; height: 100%; background: var(--primary); border-radius: 3px;"></div>
                                </div>
                             </div>

                             <div class="health-item">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.9rem;">
                                    <span>AI API Quota</span>
                                    <span style="color: #F1C40F;">82%</span>
                                </div>
                                <div class="progress-bar" style="width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px;">
                                    <div style="width: 82%; height: 100%; background: #F1C40F; border-radius: 3px;"></div>
                                </div>
                             </div>
                        </div>

                         <!-- Quick Actions -->
                        <div class="glass-card" style="padding: 1.5rem;">
                             <h3 class="font-heading" style="margin-bottom: 1rem;">⚡ Control Panel</h3>
                             <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                                <button class="btn btn-sm btn-ghost" onclick="AdminConsole.flushCache()">🧹 Flush Cache</button>
                                <button class="btn btn-sm btn-ghost" onclick="renderTabContent('verification-hub')">🛡️ Moderation</button>
                                <button class="btn btn-sm btn-ghost" onclick="AdminConsole.generateReport()">📊 Audit Log</button>
                                <button class="btn btn-sm btn-ghost" style="color: #ff4757; border-color: rgba(255, 71, 87, 0.3);" onclick="AdminConsole.maintenanceMode()">⚠️ Lockdown</button>
                             </div>
                        </div>

                    </div>
                </div>
            </div>
        `;
    },

    init: function () {
        if (this.isInitialized) return;

        // Start Clock
        setInterval(() => {
            const el = document.getElementById('admin-clock');
            if (el) el.innerText = new Date().toLocaleTimeString();
        }, 1000);

        this.isInitialized = true;
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

    renderUserRows: function () {
        // Use MockUsers or fetch from window
        const users = [
            { id: '1', name: 'Rohan Sharma', email: 'rohan@example.com', role: 'user', college: 'Medi-Caps', status: 'active' },
            { id: '2', name: 'Prof. Jain', email: 'jain@medicaps.ac.in', role: 'coadmin', college: 'Medi-Caps', status: 'active' },
            { id: '3', name: 'Amit Patel', email: 'amit@lpu.in', role: 'user', college: 'LPU', status: 'flagged' },
            { id: '4', name: 'Sarah Lee', email: 'sarah@iit.ac.in', role: 'admin', college: 'IIT Delhi', status: 'active' },
            { id: '5', name: 'Guest User', email: 'guest@temp', role: 'user', college: 'Unknown', status: 'inactive' }
        ];

        return users.map(u => `
            <tr style="border-bottom: 1px solid var(--border-glass); transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
                <td style="padding: 1rem;">
                    <div style="font-weight: 600;">${u.name}</div>
                    <div style="font-size: 0.8rem; color: var(--text-dim);">${u.email}</div>
                </td>
                <td style="padding: 1rem;">
                    <span class="role-badge ${u.role}">${u.role.toUpperCase()}</span>
                </td>
                <td style="padding: 1rem; color: var(--text-muted); font-size: 0.9rem;">
                    ${u.college}
                </td>
                <td style="padding: 1rem; text-align: right;">
                    <button class="btn-icon" title="Edit" onclick="AdminConsole.editUser('${u.id}')">✏️</button>
                    ${u.status === 'active' ?
                `<button class="btn-icon" title="Ban" style="color: #ff4757;" onclick="AdminConsole.banUser('${u.id}')">🚫</button>` :
                `<button class="btn-icon" title="Activate" style="color: var(--success);" onclick="AdminConsole.activateUser('${u.id}')">✅</button>`
            }
                </td>
            </tr>
        `).join('');
    },

    // Actions
    flushCache: function () {
        if (confirm("Are you sure you want to clear system cache?")) {
            setTimeout(() => alert("Cache cleared successfully!"), 500);
        }
    },

    maintenanceMode: function () {
        const password = prompt("Enter Super Admin Password to enable Lockdown:");
        if (password === 'admin123') {
            alert("⚠️ MAINTENANCE MODE ENABLED. All user sessions terminated.");
        } else {
            alert("❌ Access Denied.");
        }
    },

    generateReport: function () {
        alert("Downloading Audit Logs (CSV)...");
    },

    banUser: function (uid) {
        if (confirm(`Ban this user (ID: ${uid})?`)) {
            alert(`User ${uid} has been restricted.`);
        }
    },

    editUser: function (uid) {
        alert("Edit User Modal placeholder for " + uid);
    }
};
