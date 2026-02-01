
// Settings Module for SKiL MATRIX Notes
// Handles rendering and logic for the Settings Tab

window.SettingsModule = {
    state: {
        activeTab: 'profile',
        user: {},
        settings: {
            notifications: { email: true, push: true, exam_alerts: true, ai_suggestions: true },
            appearance: { theme: 'dark', compact: false, reduceMotion: false },
            privacy: { leaderboard: true }
        }
    },
    isInitialized: false,
    unsubscribe: null,

    init: function () {
        if (this.isInitialized) return;

        const { db, doc, onSnapshot } = window.firebaseServices || {};
        if (!db || !window.currentUser) return;

        this.state.user = { ...window.currentUser };

        // Real-time Settings Listener
        const settingsRef = doc(db, 'users', window.currentUser.id, 'settings', 'general');
        this.unsubscribe = onSnapshot(settingsRef, (docSnap) => {
            if (docSnap.exists()) {
                this.state.settings = docSnap.data();
                if (this.state.activeTab !== 'profile') { // Don't refresh if editing profile
                    this.refreshContent();
                }
            } else {
                // Initialize default settings in Firebase
                this.saveAllSettings(this.state.settings);
            }
        });

        // Listen for internal navigation clicks
        document.addEventListener('click', (e) => {
            const navItem = e.target.closest('.settings-nav-item');
            if (navItem && navItem.dataset.setTab) {
                this.switchTab(navItem.dataset.setTab);
            }
        });

        this.isInitialized = true;
    },

    saveAllSettings: async function (data) {
        const { db, doc, setDoc } = window.firebaseServices;
        const ref = doc(db, 'users', window.currentUser.id, 'settings', 'general');
        try {
            await setDoc(ref, data, { merge: true });
        } catch (e) {
            console.error("Error saving settings:", e);
        }
    },

    updateSetting: async function (category, key, value) {
        const { db, doc, updateDoc } = window.firebaseServices;
        const ref = doc(db, 'users', window.currentUser.id, 'settings', 'general');

        // Optimistic UI update
        this.state.settings[category][key] = value;

        try {
            const updatePath = `${category}.${key}`;
            await updateDoc(ref, { [updatePath]: value });
        } catch (e) {
            console.error("Failed to update setting:", e);
        }
    },

    refreshContent: function () {
        const content = document.getElementById('settings-content-area');
        if (content) {
            content.innerHTML = this.renderActiveTab();
        }
    },

    render: function () {
        return `
            <div class="settings-container fade-in">
                <!-- Internal Sidebar -->
                <aside class="settings-sidebar custom-scroll">
                    ${this.renderNavItems()}
                    
                    <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.05);">
                         <div class="settings-nav-item" style="color: #ff4757;" onclick="handleLogout()">
                            <span class="icon">🚪</span> Log Out
                        </div>
                    </div>
                </aside>

                <!-- Main Panel -->
                <main class="settings-panel custom-scroll" id="settings-content-area">
                    ${this.renderActiveTab()}
                </main>
            </div>
        `;
    },

    renderNavItems: function () {
        const tabs = [
            { id: 'profile', icon: '👤', label: 'Profile & Identity' },
            { id: 'account', icon: '🔐', label: 'Account & Security' },
            { id: 'notifications', icon: '🔔', label: 'Notifications' },
            { id: 'appearance', icon: '🎨', label: 'Appearance' },
            { id: 'study', icon: '📚', label: 'Study Preferences' },
            { id: 'privacy', icon: '🛡️', label: 'Privacy & Data' },
            { id: 'ai', icon: '🤖', label: 'AI Features' },
            { id: 'contributor', icon: '🏆', label: 'Contributor' }
        ];

        // Add Admin tab if qualified
        if (this.state.user.role === 'superadmin' || this.state.user.role === 'coadmin') {
            tabs.push({ id: 'admin', icon: '⚡', label: 'Admin Controls' });
        }

        return tabs.map(t => `
            <div class="settings-nav-item ${this.state.activeTab === t.id ? 'active' : ''}" data-set-tab="${t.id}">
                <span class="icon">${t.icon}</span> ${t.label}
            </div>
        `).join('');
    },

    switchTab: function (tabId) {
        this.state.activeTab = tabId;
        // Re-render nav (for active class)
        const sidebar = document.querySelector('.settings-sidebar');
        if (sidebar) sidebar.innerHTML = this.renderNavItems() + `
            <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.05);">
                 <div class="settings-nav-item" style="color: #ff4757;" onclick="handleLogout()">
                    <span class="icon">🚪</span> Log Out
                </div>
            </div>`;

        // Render Content
        const content = document.getElementById('settings-content-area');
        if (content) {
            content.innerHTML = this.renderActiveTab();
            content.classList.remove('fade-in');
            void content.offsetWidth; // trigger reflow
            content.classList.add('fade-in');
        }
    },

    renderActiveTab: function () {
        const tab = this.state.activeTab;
        const user = this.state.user || {};
        const s = this.state.settings;

        switch (tab) {
            case 'profile':
                return `
                    <div class="settings-section-title">👤 Profile & Identity</div>
                    <p class="settings-section-desc">Manage your public presence and academic details.</p>

                    <div class="settings-group">
                        <div class="profile-edit-header">
                            <div class="profile-avatar-large">
                                ${user.photo ? `<img src="${user.photo}" style="width:100%;height:100%;object-fit:cover;">` : (user.name ? user.name[0] : 'U')}
                            </div>
                            <div>
                                <h3 style="margin:0 0 0.5rem 0;">${user.name || 'Student'} <span class="meta-badge" style="font-size:0.6rem; vertical-align:middle;">VERIFIED</span></h3>
                                <p style="color:var(--text-dim); margin-bottom:1rem;">${user.role ? user.role.toUpperCase() : 'USER'}</p>
                                <button class="btn-sm-ghost" onclick="SettingsModule.triggerAvatarUpload()">Change Photo</button>
                                <button class="btn-sm-ghost" style="color:#ff4757;">Remove</button>
                            </div>
                        </div>
                    </div>

                    <div class="settings-group">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
                            <h3>Personal Details</h3>
                            <button class="btn-sm-ghost" id="edit-profile-btn" onclick="SettingsModule.toggleProfileEdit()">Edit Details</button>
                        </div>
                        <div class="settings-row">
                            <div class="settings-label"><strong>Full Name</strong><span>Your name on certificates and leaderboard</span></div>
                            <input class="settings-input profile-field" type="text" id="prof-name" value="${user.name || ''}" disabled>
                        </div>
                         <div class="settings-row">
                            <div class="settings-label"><strong>College</strong><span>Your primary academic institution</span></div>
                            <input class="settings-input profile-field" type="text" id="prof-college" value="${user.college || 'Medi-Caps University'}" disabled>
                        </div>
                        <div class="settings-row">
                            <div class="settings-label"><strong>Branch & Year</strong><span>Used for personalized notes feed</span></div>
                            <input class="settings-input profile-field" type="text" id="prof-branch" value="CSE - 2nd Year" disabled>
                        </div>
                        <div id="profile-save-actions" style="display:none; margin-top:1.5rem; text-align:right;">
                            <button class="btn btn-primary" onclick="SettingsModule.saveProfile()">Save Changes</button>
                        </div>
                    </div>
                `;

            case 'account':
                return `
                    <div class="settings-section-title">🔐 Account & Security</div>
                    <p class="settings-section-desc">Keep your account secure and manage login sessions.</p>

                    <div class="settings-group">
                        <h3>Login & Recovery</h3>
                         <div class="settings-row">
                            <div class="settings-label"><strong>Email Address</strong><span>Used for login and recovery</span></div>
                            <input class="settings-input" type="email" value="${user.email || ''}" disabled style="opacity:0.6;">
                        </div>
                         <div class="settings-row">
                            <div class="settings-label"><strong>Password</strong><span>Last changed 3 months ago</span></div>
                            <button class="btn-sm-ghost" onclick="alert('Password reset email sent!')">Change Password</button>
                        </div>
                    </div>

                    <div class="settings-group">
                        <h3>Active Sessions</h3>
                        <div class="settings-row">
                             <div class="settings-label">
                                <strong>Windows PC (Chrome)</strong>
                                <span style="color:var(--success);">● Active Now • Indore, IN</span>
                             </div>
                             <button class="btn-sm-ghost" disabled>Current</button>
                        </div>
                         <div class="settings-row">
                             <div class="settings-label">
                                <strong>iPhone 13 (Safari)</strong>
                                <span>Last seen 2 hours ago • Delhi, IN</span>
                             </div>
                             <button class="btn-sm-ghost" style="color:#ff4757;" onclick="this.closest('.settings-row').remove()">Revoke</button>
                        </div>
                    </div>

                     <div class="settings-group danger-zone" style="margin-top: 3rem;">
                        <h3 style="color:#ff4757;">Danger Zone</h3>
                        <div class="settings-row">
                            <div class="settings-label"><strong>Deactivate Account</strong><span>Temporarily disable your profile and hide your data</span></div>
                            <button class="btn-sm-ghost" style="color:#ff4757;" onclick="handleLogout()">Deactivate</button>
                        </div>
                        <div class="settings-row">
                            <div class="settings-label"><strong>Delete Account</strong><span>Permanently remove all your notes and scores</span></div>
                            <button class="btn-sm-ghost" style="background:#ff4757; color:white; border:none;" onclick="alert('Critical: Please contact admin to delete account permanently.')">Delete Forever</button>
                        </div>
                    </div>
                `;

            case 'notifications':
                return `
                    <div class="settings-section-title">🔔 Notifications</div>
                    <p class="settings-section-desc">Control what alerts you receive and where.</p>

                    <div class="settings-group">
                        <h3>Email Alerts</h3>
                        ${this.toggleRow('notifications', 'email', 'New notes in my subjects', s.notifications.email)}
                        ${this.toggleRow('notifications', 'weekly_summary', 'Weekly study summary', true)}
                        ${this.toggleRow('notifications', 'promo', 'Promotional emails', false)}
                    </div>

                     <div class="settings-group">
                        <h3>In-App Notifications</h3>
                        ${this.toggleRow('notifications', 'leaderboard', 'Leaderboard rank changes', s.notifications.push)}
                        ${this.toggleRow('notifications', 'exam_alerts', 'Exam reminders', s.notifications.exam_alerts)}
                        ${this.toggleRow('notifications', 'ai_suggestions', 'AI suggestions & tips', s.notifications.ai_suggestions)}
                    </div>
                `;

            case 'appearance':
                return `
                    <div class="settings-section-title">🎨 Appearance</div>
                    <p class="settings-section-desc">Customize your visual experience and performance.</p>

                    <div class="settings-group">
                         <h3>Theme</h3>
                         <div style="display:flex; gap:1rem; margin-top:1rem;">
                            <button class="btn-sm-ghost ${s.appearance.theme === 'dark' ? 'active' : ''}" 
                                    style="${s.appearance.theme === 'dark' ? 'border-color:var(--primary); background:rgba(123,97,255,0.1);' : ''}"
                                    onclick="SettingsModule.updateSetting('appearance', 'theme', 'dark').then(() => window.toggleTheme(false))">🌙 Dark</button>
                            <button class="btn-sm-ghost ${s.appearance.theme === 'light' ? 'active' : ''}" 
                                    style="${s.appearance.theme === 'light' ? 'border-color:var(--primary); background:rgba(123,97,255,0.1);' : ''}"
                                    onclick="SettingsModule.updateSetting('appearance', 'theme', 'light').then(() => window.toggleTheme(true))">☀️ Light</button>
                            <button class="btn-sm-ghost">🌗 Auto</button>
                         </div>
                    </div>

                    <div class="settings-group">
                         <h3>Interface</h3>
                         ${this.toggleRow('appearance', 'reduceMotion', 'Reduce Motion (Accessibility)', s.appearance.reduceMotion)}
                         ${this.toggleRow('appearance', 'compact', 'Compact Mode', s.appearance.compact)}
                    </div>
                `;

            case 'study':
                return `
                    <div class="settings-section-title">📚 Study Preferences</div>
                    <p class="settings-section-desc">Fine-tune your learning environment and goal tracking.</p>

                    <div class="settings-group">
                        <h3>Daily Goals</h3>
                         <div class="settings-row">
                            <div class="settings-label"><strong>Study Target</strong><span>Hours per day</span></div>
                            <select class="settings-input" style="width: auto;" onchange="SettingsModule.updateSetting('study', 'target_hours', this.value)">
                                <option value="2">2 Hours</option>
                                <option value="4" selected>4 Hours</option>
                                <option value="6">6 Hours</option>
                                <option value="8">8 Hours</option>
                            </select>
                        </div>
                    </div>

                    <div class="settings-group">
                        <h3>Content Filters</h3>
                        ${this.toggleRow('study', 'show_verified_only', 'Show only verified notes', true)}
                        ${this.toggleRow('study', 'auto_save_activity', 'Auto-save study activity', true)}
                    </div>
                `;

            case 'contributor':
                return `
                    <div class="settings-section-title">🏆 Contributor Program</div>
                    <p class="settings-section-desc">Manage your contributions and track your impact on campus.</p>

                    <div class="settings-group" style="background: linear-gradient(135deg, rgba(46, 204, 113, 0.1) 0%, rgba(255, 255, 255, 0.02) 100%);">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <h3 style="margin:0;">Contributor Status: <span style="color:#2ecc71;">ACTIVE</span></h3>
                                <p style="color:var(--text-dim); font-size:0.9rem; margin-top:0.5rem;">You have uploaded 12 verified resources.</p>
                            </div>
                            <div style="font-size:2.5rem;">🌟</div>
                        </div>
                    </div>

                    <div class="settings-group">
                        <h3>Monetization & Recognition</h3>
                        <div class="settings-row">
                            <div class="settings-label"><strong>Public Portfolio</strong><span>Showcase your uploads on your profile</span></div>
                            <label class="toggle-switch">
                                <input type="checkbox" checked>
                                <span class="slider"></span>
                            </label>
                        </div>
                         <div class="settings-row">
                            <div class="settings-label"><strong>Enable Tips</strong><span>Allow students to support you (Beta)</span></div>
                            <label class="toggle-switch">
                                <input type="checkbox">
                                <span class="slider"></span>
                            </label>
                        </div>
                    </div>

                    <div class="settings-group">
                        <h3>Preferences</h3>
                        ${this.toggleRow('contributor', 'anonymous', 'Upload anonymously', false)}
                        ${this.toggleRow('contributor', 'notify_likes', 'Notify me when someone likes my note', true)}
                    </div>
                `;

            case 'ai':
                return `
                    <div class="settings-section-title">🤖 AI Features</div>
                    <p class="settings-section-desc">Configure Gemini-powered learning assistance.</p>

                    <div class="settings-group">
                        <h3>Model Selection</h3>
                        <div class="settings-row">
                            <div class="settings-label"><strong>Default AI Model</strong><span>Gemini 2.0 Flash is recommended for speed</span></div>
                            <div style="display:flex; gap:0.5rem;">
                                <button class="btn-sm-ghost active" style="border-color:var(--primary);">Flash 2.0</button>
                                <button class="btn-sm-ghost">Pro 1.5</button>
                            </div>
                        </div>
                    </div>

                    <div class="settings-group">
                        <h3>AI Capabilities</h3>
                        ${this.toggleRow('ai', 'auto_summarize', 'Auto-summarize long notes', true)}
                        ${this.toggleRow('ai', 'explain_concepts', 'Inline concept explanation', true)}
                        ${this.toggleRow('ai', 'smart_search', 'Enable Semantic Search', false)}
                    </div>
                `;

            case 'privacy':
                return `
                    <div class="settings-section-title">🛡️ Privacy & Data</div>
                    <p class="settings-section-desc">Manage your data visibility and export preferences.</p>

                    <div class="settings-group">
                        <h3>Visibility</h3>
                        ${this.toggleRow('privacy', 'leaderboard', 'Leaderboard Privacy (Show my rank)', s.privacy.leaderboard)}
                        <div class="settings-row">
                            <div class="settings-label"><strong>Incognito Study Mode</strong><span>Don't track my views for next 24h</span></div>
                            <label class="toggle-switch">
                                <input type="checkbox">
                                <span class="slider"></span>
                            </label>
                        </div>
                    </div>

                    <div class="settings-group">
                        <h3>Your Data</h3>
                        <div class="settings-row">
                            <div class="settings-label"><strong>Download My Activity</strong><span>JSON format of all your uploads and downloads</span></div>
                            <button class="btn-sm-ghost" onclick="SettingsModule.exportData()">Export JSON</button>
                        </div>
                         <div class="settings-row">
                            <div class="settings-label"><strong>Connected Apps</strong><span>Google, Calendar, Drive</span></div>
                            <button class="btn-sm-ghost">Manage Links</button>
                        </div>
                    </div>
                `;

            default:
                return `
                    <div style="text-align:center; padding: 6rem 2rem;">
                        <h1 style="font-size:4rem; margin-bottom:1rem;">🚀</h1>
                        <h2>Coming Soon</h2>
                        <p style="color:var(--text-dim);">The <strong>${tab}</strong> configuration is being optimized for your campus.</p>
                        <button class="btn btn-ghost" style="margin-top:2rem;" onclick="SettingsModule.switchTab('profile')">Back to Profile</button>
                    </div>
                `;
        }
    },

    toggleRow: function (category, key, label, checked) {
        return `
            <div class="settings-row">
                <div class="settings-label"><strong>${label}</strong></div>
                <label class="toggle-switch">
                    <input type="checkbox" ${checked ? 'checked' : ''} 
                           onchange="SettingsModule.updateSetting('${category}', '${key}', this.checked)">
                    <span class="slider"></span>
                </label>
            </div>
        `;
    },

    // --- Profile Logic ---
    toggleProfileEdit: function () {
        const fields = document.querySelectorAll('.profile-field');
        const actions = document.getElementById('profile-save-actions');
        const btn = document.getElementById('edit-profile-btn');

        const isEditing = btn.innerText === 'Cancel';

        fields.forEach(f => f.disabled = isEditing);
        actions.style.display = isEditing ? 'none' : 'block';
        btn.innerText = isEditing ? 'Edit Details' : 'Cancel';
        btn.style.color = isEditing ? 'var(--text-main)' : '#ff4757';
    },

    saveProfile: async function () {
        const name = document.getElementById('prof-name').value;
        const college = document.getElementById('prof-college').value;
        const { db, doc, updateDoc } = window.firebaseServices;

        try {
            const userRef = doc(db, 'users', window.currentUser.id);
            await updateDoc(userRef, { name, college });

            // Update global state
            window.currentUser.name = name;
            window.currentUser.college = college;

            alert('Profile updated successfully!');
            this.toggleProfileEdit();
            this.refreshContent();

            // Sync mini-profile in sidebar
            if (window.updateUserProfileUI) window.updateUserProfileUI();

        } catch (e) {
            alert('Failed to save: ' + e.message);
        }
    },

    triggerAvatarUpload: function () {
        alert('Photo upload service starting... (Mock: File picker opened)');
    },

    exportData: function () {
        const data = {
            user: this.state.user,
            settings: this.state.settings,
            exportDate: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `skill-matrix-data-${window.currentUser.id}.json`;
        a.click();
    }
};

// Global Exposure for Dashboard.js
window.renderSettings = function () {
    // Re-init state to ensure freshness
    SettingsModule.init();
    return SettingsModule.render();
};
