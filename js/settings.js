
// Settings Module for SKiL MATRiX Notes
// Handles rendering and logic for the Settings Tab

window.SettingsModule = {
    state: {
        activeTab: 'account',
        user: {},
        settings: {
            notifications: { email: true, push: true, exam_alerts: true, ai_suggestions: true },
            appearance: { theme: 'dark', compact: false, reduceMotion: false },
            privacy: { leaderboard: true },
            study: { target_hours: 4, show_verified_only: true, auto_save_activity: true },
            ai: { model: 'flash-2.0', auto_summarize: true, explain_concepts: true, smart_search: false }
        },
        isSyncing: true
    },
    isInitialized: false,
    unsubscribe: null,

    init: function () {
        if (this.isInitialized) return;

        const { db, doc, onSnapshot } = window.firebaseServices || {};
        if (!db || !window.currentUser) {
            this.state.isSyncing = false;
            return;
        }

        this.state.user = { ...window.currentUser };

        // Real-time Settings Listener
        const settingsRef = doc(db, 'users', window.currentUser.id || window.currentUser.uid, 'settings', 'general');
        this.unsubscribe = onSnapshot(settingsRef, (docSnap) => {
            this.state.isSyncing = false;
            if (docSnap.exists()) {
                // deeply merge settings to preserve defaults
                this.state.settings = this.deepMerge(this.state.settings, docSnap.data());
                this.refreshContent();
            } else {
                // Initialize default settings in Firebase
                this.saveAllSettings(this.state.settings);
            }
        }, (err) => {
            console.error("Settings listener error:", err);
            this.state.isSyncing = false;
            this.refreshContent();
        });

        // Listen for internal navigation clicks
        document.addEventListener('click', (e) => {
            const navItem = e.target.closest('.settings-nav-item');
            if (navItem && navItem.dataset.setTab) {
                this.switchTab(navItem.dataset.setTab);
            }
        });

        // Create hidden file input for avatar
        if (!document.getElementById('settings-avatar-input')) {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.id = 'settings-avatar-input';
            fileInput.accept = 'image/*';
            fileInput.style.display = 'none';
            fileInput.onchange = (e) => this.handleAvatarChange(e);
            document.body.appendChild(fileInput);
        }

        this.isInitialized = true;
    },

    deepMerge: function (target, source) {
        for (const key in source) {
            if (source[key] instanceof Object && key in target) {
                Object.assign(source[key], this.deepMerge(target[key], source[key]));
            }
        }
        Object.assign(target || {}, source);
        return target;
    },

    saveAllSettings: async function (data) {
        const { db, doc, setDoc } = window.firebaseServices;
        const ref = doc(db, 'users', (window.currentUser.id || window.currentUser.uid), 'settings', 'general');
        try {
            await setDoc(ref, data, { merge: true });
        } catch (e) {
            console.error("Error saving settings:", e);
        }
    },

    updateSetting: async function (category, key, value) {
        const { db, doc, updateDoc } = window.firebaseServices;
        const ref = doc(db, 'users', (window.currentUser.id || window.currentUser.uid), 'settings', 'general');

        // Optimistic UI update
        if (!this.state.settings[category]) this.state.settings[category] = {};
        this.state.settings[category][key] = value;

        try {
            const updatePath = `${category}.${key}`;
            await updateDoc(ref, { [updatePath]: value });

            // Show toast only for explicit user actions
            if (window.showToast) window.showToast('Setting synced to Matrix', 'success');

        } catch (e) {
            console.error("Failed to update setting:", e);
            if (window.showToast) window.showToast('Matrix sync failed', 'error');
        }
    },

    refreshContent: function () {
        const content = document.getElementById('settings-content-area');
        if (content) {
            content.innerHTML = this.renderActiveTab();
        }
        this.updateSidebar();
    },

    updateSidebar: function () {
        const sidebar = document.querySelector('.settings-sidebar');
        if (sidebar) {
            const headerHtml = `
            <div class="settings-sidebar-header">
                <h2>Settings</h2>
            </div>`;
            const syncStatus = this.state.isSyncing ? 
                `<div style="margin-top: 1rem; font-size: 0.7rem; color: var(--settings-accent); display: flex; align-items: center; gap: 5px; padding: 0 1rem;">
                    <i class="fa-solid fa-circle-notch fa-spin"></i> SYNCING DATA...
                </div>` : 
                `<div style="margin-top: 1rem; font-size: 0.7rem; color: #2ecc71; display: flex; align-items: center; gap: 5px; padding: 0 1rem;">
                    <i class="fa-solid fa-check-double"></i> DATA SYNCED
                </div>`;
            const logoutHtml = `
            <div style="margin-top: auto; padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.05);">
                 ${syncStatus}
                 <div class="settings-nav-item" style="color: #ff4757; margin-top: 1rem;" onclick="handleLogout()">
                    <i class="fa-solid fa-arrow-right-from-bracket"></i> Log Out
                </div>
            </div>`;
            sidebar.innerHTML = headerHtml + this.renderNavItems() + logoutHtml;
        }
    },

    render: function () {
        return `
            <div class="settings-container">
                <!-- Internal Sidebar -->
                <aside class="settings-sidebar custom-scroll">
                    <!-- Updated via updateSidebar() -->
                    <div class="settings-sidebar-header">
                        <h2>Settings</h2>
                    </div>
                    ${this.renderNavItems()}
                    <div style="margin-top: auto; padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.05);">
                         <div class="settings-nav-item" style="color: #ff4757;" onclick="handleLogout()">
                            <i class="fa-solid fa-arrow-right-from-bracket"></i> Log Out
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
            { id: 'account', icon: 'fa-user-gear', label: 'Account & Security' },
            { id: 'notifications', icon: 'fa-bell', label: 'Notifications' },
            { id: 'appearance', icon: 'fa-palette', label: 'Appearance' },
            { id: 'study', icon: 'fa-book-open', label: 'Study Preferences' },
            { id: 'privacy', icon: 'fa-shield-halved', label: 'Privacy & Data' },
            { id: 'ai', icon: 'fa-robot', label: 'AI Features' },
            { id: 'contributor', icon: 'fa-medal', label: 'Contributor' }
        ];

        if (this.state.user.role === 'superadmin' || this.state.user.role === 'coadmin') {
            tabs.push({ id: 'admin', icon: 'fa-bolt-lightning', label: 'Admin Controls' });
        }

        return tabs.map(t => `
            <div class="settings-nav-item ${this.state.activeTab === t.id ? 'active' : ''}" data-set-tab="${t.id}">
                <i class="fa-solid ${t.icon}"></i> ${t.label}
            </div>
        `).join('');
    },

    switchTab: function (tabId) {
        this.state.activeTab = tabId;
        this.updateSidebar();
        const content = document.getElementById('settings-content-area');
        if (content) {
            content.innerHTML = this.renderActiveTab();
            content.classList.remove('fade-in');
            void content.offsetWidth;
            content.classList.add('fade-in');
        }
    },

    renderActiveTab: function () {
        const tab = this.state.activeTab;
        const user = this.state.user || {};
        const s = this.state.settings;

        if (this.state.isSyncing) {
            return `
                <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:1.5rem;">
                    <i class="fa-solid fa-circle-notch fa-spin" style="font-size:3rem; color:var(--settings-accent);"></i>
                    <p style="color:var(--text-dim); font-weight:500; letter-spacing:1px;">SYNCING MATRiX DATA...</p>
                </div>
            `;
        }

        switch (tab) {
            case 'account':
                return `
                    <div class="settings-header">
                        <div class="settings-section-title"><i class="fa-solid fa-user-gear" style="color: var(--settings-accent);"></i> Account & Security</div>
                        <p class="settings-section-desc">Manage your identity, security credentials, and active sessions.</p>
                    </div>

                    <div class="settings-group">
                        <h3><i class="fa-solid fa-id-card"></i> Personal Information</h3>
                        <div class="settings-row" style="border:none; padding-bottom:0.5rem;">
                             <div class="profile-edit-header" style="width:100%; gap: 1.5rem;">
                                <div class="profile-avatar-large" id="avatar-preview">
                                    ${user.photo ? `<img src="${user.photo}" style="width:100%; height:100%; object-fit:cover;">` : user.name?.charAt(0) || 'S'}
                                </div>
                                <div style="flex:1;">
                                    <h4 style="margin:0; font-size:1.1rem;">${user.name || 'Scholar'}</h4>
                                    <p style="color:var(--text-dim); font-size:0.85rem; margin:0.2rem 0;">${user.email}</p>
                                    <button class="btn-sm-ghost" style="margin-top:0.75rem;" onclick="SettingsModule.triggerAvatarUpload()" id="avatar-upload-btn">
                                        <i class="fa-solid fa-camera"></i> Change Photo
                                    </button>
                                </div>
                             </div>
                        </div>
                    </div>

                    <div class="settings-group">
                        <h3><i class="fa-solid fa-key"></i> Login & Recovery</h3>
                         <div class="settings-row">
                            <div class="settings-label"><strong>Primary Email</strong><span>Used for all platform communications</span></div>
                            <input class="settings-input" type="email" value="${user.email || ''}" disabled>
                        </div>
                         <div class="settings-row">
                            <div class="settings-label"><strong>Security Password</strong><span>Update your password regularly</span></div>
                            <button class="btn-sm-ghost" onclick="SettingsModule.triggerPasswordReset('${user.email}')">
                                <i class="fa-solid fa-envelope-circle-check"></i> Send Reset Link
                            </button>
                        </div>
                    </div>

                    <div class="settings-group">
                        <h3><i class="fa-solid fa-desktop"></i> Device Sessions</h3>
                        <div class="settings-row">
                             <div class="settings-label">
                                <strong>Current Browser Session</strong>
                                <span style="color:#2ecc71;">● Authorized & Active Now</span>
                             </div>
                             <div style="display:flex; align-items:center; gap:0.5rem;">
                                <span class="badge" style="background:rgba(46,204,113,0.1); color:#2ecc71; font-size:0.7rem; padding:2px 8px; border-radius:4px;">PRIMARY</span>
                                <button class="btn-sm-ghost" disabled>Current</button>
                             </div>
                        </div>
                    </div>

                     <div class="settings-group danger-zone" style="margin-top: 3rem;">
                        <h3><i class="fa-solid fa-triangle-exclamation"></i> Security Danger Zone</h3>
                        <div class="settings-row">
                            <div class="settings-label"><strong>Deactivate Access</strong><span>Temporary lock your Matrix identity</span></div>
                            <button class="btn-sm-ghost" style="color:#ff4757; border-color:rgba(255,71,87,0.3);" onclick="handleLogout()">Deactivate</button>
                        </div>
                        <div class="settings-row">
                            <div class="settings-label"><strong>Erase Matrix Profile</strong><span>Permanently delete all notes, analytics, and data</span></div>
                            <button class="btn-sm-ghost" style="background:#ff4757; color:white; border:none;" onclick="alert('Contact skilmatrix3@gmail.com for data erasure requests.')">Delete Identity</button>
                        </div>
                    </div>
                `;

            case 'notifications':
                return `
                    <div class="settings-header">
                        <div class="settings-section-title"><i class="fa-solid fa-bell" style="color: #54a0ff;"></i> Notifications</div>
                        <p class="settings-section-desc">Manage how and when you receive Matrix updates.</p>
                    </div>

                    <div class="settings-group">
                        <h3><i class="fa-solid fa-envelope"></i> Email Subscriptions</h3>
                        ${this.toggleRow('notifications', 'email', 'Resource Updates', s.notifications.email)}
                        ${this.toggleRow('notifications', 'weekly_summary', 'Academic Performance Weekly', s.notifications.weekly_summary !== false)}
                        ${this.toggleRow('notifications', 'promo', 'Feature Announcements', s.notifications.promo === true)}
                    </div>

                     <div class="settings-group">
                        <h3><i class="fa-solid fa-bolt"></i> Real-time Alerts</h3>
                        ${this.toggleRow('notifications', 'leaderboard', 'Leaderboard Status Changes', s.notifications.push)}
                        ${this.toggleRow('notifications', 'exam_alerts', 'Exam Schedule Reminders', s.notifications.exam_alerts)}
                        ${this.toggleRow('notifications', 'ai_suggestions', 'AI Personal Learning Tips', s.notifications.ai_suggestions)}
                    </div>
                `;

            case 'appearance':
                const theme = s.appearance && s.appearance.theme ? s.appearance.theme : (localStorage.getItem('theme') || 'dark');
                return `
                    <div class="settings-header">
                        <div class="settings-section-title"><i class="fa-solid fa-palette" style="color: #ff9f43;"></i> Appearance</div>
                        <p class="settings-section-desc">Tailor the visual environment to your learning style.</p>
                    </div>

                    <div class="settings-group">
                         <h3>Theme Atmosphere</h3>
                         <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem; margin-top:0.5rem;">
                            <div class="theme-card ${theme === 'dark' ? 'active' : ''}" 
                                 style="background:#0f0f0f; border:1px solid ${theme === 'dark' ? 'var(--settings-accent)' : 'var(--settings-border)'}; padding:1.5rem; border-radius:12px; cursor:pointer; text-align:center;"
                                 onclick="SettingsModule.updateSetting('appearance', 'theme', 'dark').then(() => window.toggleTheme(false)); SettingsModule.refreshContent();">
                                <i class="fa-solid fa-moon" style="font-size:2rem; margin-bottom:0.5rem;"></i>
                                <div style="font-weight:600;">Deep Matrix</div>
                                <div style="font-size:0.7rem; color:var(--text-dim);">Optimized for focus</div>
                            </div>
                            <div class="theme-card ${theme === 'light' ? 'active' : ''}" 
                                 style="background:#f8f9fa; color:#333; border:1px solid ${theme === 'light' ? 'var(--settings-accent)' : 'var(--settings-border)'}; padding:1.5rem; border-radius:12px; cursor:pointer; text-align:center;"
                                 onclick="SettingsModule.updateSetting('appearance', 'theme', 'light').then(() => window.toggleTheme(true)); SettingsModule.refreshContent();">
                                <i class="fa-solid fa-sun" style="font-size:2rem; margin-bottom:0.5rem;"></i>
                                <div style="font-weight:600;">Light Aurora</div>
                                <div style="font-size:0.7rem; opacity:0.7;">High clarity</div>
                            </div>
                         </div>
                    </div>

                    <div class="settings-group">
                         <h3>Motion & Effects</h3>
                         ${this.toggleRow('appearance', 'reduceMotion', 'Optimize for Low Performance (Reduce Motion)', s.appearance.reduceMotion)}
                         ${this.toggleRow('appearance', 'compact', 'Compact Interface Mode', s.appearance.compact)}
                    </div>
                `;

            case 'study':
                const hours = (s.study && s.study.target_hours) || 4;
                return `
                    <div class="settings-header">
                        <div class="settings-section-title"><i class="fa-solid fa-book-open" style="color: #48dbfb;"></i> Study Preferences</div>
                        <p class="settings-section-desc">Optimize your learning flow and resource filtering.</p>
                    </div>

                    <div class="settings-group">
                        <h3><i class="fa-solid fa-bullseye"></i> Productivity Targets</h3>
                         <div class="settings-row">
                            <div class="settings-label"><strong>Daily Study Goal</strong><span>Target hours for AI strategist recommendations</span></div>
                            <select class="settings-input" style="width: auto;" onchange="SettingsModule.updateSetting('study', 'target_hours', this.value)">
                                <option value="2" ${hours == 2 ? 'selected' : ''}>2 Hours / Day</option>
                                <option value="4" ${hours == 4 ? 'selected' : ''}>4 Hours / Day</option>
                                <option value="6" ${hours == 6 ? 'selected' : ''}>6 Hours / Day</option>
                                <option value="8" ${hours == 8 ? 'selected' : ''}>8 Hours / Day</option>
                            </select>
                        </div>
                    </div>

                    <div class="settings-group">
                        <h3><i class="fa-solid fa-magnifying-glass-chart"></i> Search & Discovery</h3>
                        ${this.toggleRow('study', 'show_verified_only', 'Show Verified Resources Only', s.study && s.study.show_verified_only)}
                        ${this.toggleRow('study', 'auto_save_activity', 'Auto-log Study Sessions', s.study && s.study.auto_save_activity)}
                    </div>
                `;

            case 'ai':
                const model = (s.ai && s.ai.model) || 'flash-2.0';
                return `
                    <div class="settings-header">
                        <div class="settings-section-title"><i class="fa-solid fa-robot" style="color: #1dd1a1;"></i> AI Features</div>
                        <p class="settings-section-desc">Configure Gemini Intelligence for your academic journey.</p>
                    </div>

                    <div class="settings-group">
                        <h3><i class="fa-solid fa-brain"></i> Neural Core Selection</h3>
                        <div class="settings-row">
                            <div class="settings-label"><strong>Active Academic Model</strong><span>Flash 2.0 is recommended for rapid summarization</span></div>
                            <div style="display:flex; gap:0.5rem;">
                                <button class="btn-sm-ghost ${model === 'flash-2.0' ? 'active' : ''}" 
                                        onclick="SettingsModule.updateSetting('ai', 'model', 'flash-2.0').then(() => SettingsModule.refreshContent())">Gemini Flash</button>
                                <button class="btn-sm-ghost ${model === 'pro-1.5' ? 'active' : ''}" 
                                        onclick="SettingsModule.updateSetting('ai', 'model', 'pro-1.5').then(() => SettingsModule.refreshContent())">Gemini Pro</button>
                            </div>
                        </div>
                    </div>

                    <div class="settings-group">
                        <h3><i class="fa-solid fa-microchip"></i> AI Toolset</h3>
                        ${this.toggleRow('ai', 'auto_summarize', 'Intelligent Resource Summarization', s.ai && s.ai.auto_summarize)}
                        ${this.toggleRow('ai', 'explain_concepts', 'Contextual Concept Explanation', s.ai && s.ai.explain_concepts)}
                        ${this.toggleRow('ai', 'smart_search', 'Deep Semantic Searching', s.ai && s.ai.smart_search)}
                    </div>
                `;

            case 'privacy':
                return `
                    <div class="settings-header">
                        <div class="settings-section-title"><i class="fa-solid fa-shield-halved" style="color: #ff6b6b;"></i> Privacy & Data</div>
                        <p class="settings-section-desc">Take control of your data and personal visibility.</p>
                    </div>

                    <div class="settings-group">
                        <h3><i class="fa-solid fa-eye-slash"></i> Visibility Control</h3>
                        ${this.toggleRow('privacy', 'leaderboard', 'Public Rank (Leaderboard Visibility)', s.privacy.leaderboard)}
                        <div class="settings-row">
                            <div class="settings-label"><strong>Incognito Study Mode</strong><span>Temporarily pause activity tracking</span></div>
                            <label class="toggle-switch">
                                <input type="checkbox" onchange="window.showToast('Incognito active for this session')">
                                <span class="slider"></span>
                            </label>
                        </div>
                    </div>

                    <div class="settings-group">
                        <h3><i class="fa-solid fa-download"></i> Data Management</h3>
                        <div class="settings-row">
                            <div class="settings-label"><strong>Export My Matrix Data</strong><span>Download a portable JSON archive of your activity</span></div>
                            <button class="btn-sm-ghost" onclick="SettingsModule.exportData()">
                                <i class="fa-solid fa-file-export"></i> Download JSON
                            </button>
                        </div>
                    </div>
                `;

            case 'contributor':
                return `
                    <div class="settings-header">
                        <div class="settings-section-title"><i class="fa-solid fa-medal" style="color: #f1c40f;"></i> Contributor Program</div>
                        <p class="settings-section-desc">Manage your campus impact and community contributions.</p>
                    </div>

                    <div class="settings-group" style="background: linear-gradient(135deg, rgba(46, 204, 113, 0.08) 0%, transparent 100%); border-color: rgba(46, 204, 113, 0.2);">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <h3 style="margin:0; color: #2ecc71;">Status: Verified Contributor</h3>
                                <p style="color:var(--text-dim); font-size:0.9rem; margin-top:0.5rem;">Thank you for helping your peers! Your notes are helping students every day.</p>
                            </div>
                            <div style="font-size:3rem; opacity: 0.8;">🌟</div>
                        </div>
                    </div>

                    <div class="settings-group">
                        <h3><i class="fa-solid fa-earth-americas"></i> Public Reach</h3>
                        <div class="settings-row">
                            <div class="settings-label"><strong>Public Contribution Hub</strong><span>Display your shared notes on your public profile</span></div>
                            <label class="toggle-switch">
                                <input type="checkbox" checked onchange="window.showToast('Visibility updated')">
                                <span class="slider"></span>
                            </label>
                        </div>
                         <div class="settings-row">
                            <div class="settings-label"><strong>Enable Student Tips</strong><span>Allow peers to support your work (Coming Soon)</span></div>
                            <label class="toggle-switch">
                                <input type="checkbox" disabled>
                                <span class="slider" style="opacity: 0.5;"></span>
                            </label>
                        </div>
                    </div>

                    <div class="settings-group">
                        <h3><i class="fa-solid fa-sliders"></i> Preferences</h3>
                        ${this.toggleRow('contributor', 'anonymous', 'Upload anonymously', false)}
                        ${this.toggleRow('contributor', 'notify_likes', 'Notify on new likes', true)}
                    </div>
                `;

            default:
                return `
                    <div style="text-align:center; padding: 6rem 2rem;">
                        <h1 style="font-size:4rem; margin-bottom:1rem;">⚡</h1>
                        <h2>Module in Transit</h2>
                        <p style="color:var(--text-dim);">The <strong>${tab}</strong> module is being optimized for the Matrix.</p>
                        <button class="btn-sm-ghost" style="margin-top:2rem;" onclick="SettingsModule.switchTab('account')">Back to Identity</button>
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
        const branch = document.getElementById('prof-branch').value;

        // Guest Fallback
        if (window.currentUser && window.currentUser.isGuest) {
            window.currentUser.name = name;
            window.currentUser.college = college;
            window.currentUser.branch = branch;
            const localData = JSON.parse(localStorage.getItem('guest_session') || '{}');
            localData.name = name;
            localData.college = college;
            localData.branch = branch;
            localStorage.setItem('guest_session', JSON.stringify(localData));
            if (window.showToast) window.showToast('Guest profile updated locally!', 'success');
            this.toggleProfileEdit();
            this.refreshContent();
            if (window.updateUserProfileUI) window.updateUserProfileUI();
            return;
        }

        const { db, doc, updateDoc } = window.firebaseServices;

        try {
            const userRef = doc(db, 'users', (window.currentUser.id || window.currentUser.uid));
            await updateDoc(userRef, { name, college, branch });

            // Update global state
            window.currentUser.name = name;
            window.currentUser.college = college;
            window.currentUser.branch = branch;

            // Sync local storage cache
            const localCache = JSON.parse(localStorage.getItem('auth_user_full') || '{}');
            localCache.name = name;
            localCache.college = college;
            localCache.branch = branch;
            localStorage.setItem('auth_user_full', JSON.stringify(localCache));

            if (window.showToast) window.showToast('Profile updated successfully!', 'success');

            this.toggleProfileEdit();
            this.refreshContent();

            // Sync mini-profile in sidebar
            if (window.updateUserProfileUI) window.updateUserProfileUI();

        } catch (e) {
            console.error("Save profile error", e);
            alert('Failed to save profile: ' + e.message);
        }
    },

    triggerAvatarUpload: function () {
        const input = document.getElementById('settings-avatar-input');
        if (input) input.click();
    },

    handleAvatarChange: async function (e) {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            alert("Image is too large. Please choose an image under 2MB.");
            return;
        }

        const btn = document.getElementById('avatar-upload-btn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> SYNCING...';
        }

        // Guest Fallback
        if (window.currentUser && window.currentUser.isGuest) {
            const reader = new FileReader();
            reader.onload = async (event) => {
                const base64String = event.target.result;
                this.state.user.photo = base64String;
                this.refreshContent();
                if (window.updateUserProfileUI) {
                    window.currentUser.photo = base64String;
                    window.updateUserProfileUI();
                }
                const localData = JSON.parse(localStorage.getItem('guest_session') || '{}');
                localData.photo = base64String;
                localStorage.setItem('guest_session', JSON.stringify(localData));
                if (window.showToast) window.showToast('Guest Avatar updated locally!');
                if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-camera"></i> Change Photo'; }
            };
            reader.readAsDataURL(file);
            return;
        }

        const { db, doc, updateDoc, storage, ref, uploadBytesResumable, getDownloadURL } = window.firebaseServices;

        try {
            // Upload to Firebase Storage
            const metadata = { contentType: file.type };
            const storageRef = ref(storage, 'profile_photos/' + (window.currentUser.id || window.currentUser.uid) + '_' + Date.now());
            const uploadTask = uploadBytesResumable(storageRef, file, metadata);

            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    if (btn) btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> ${Math.round(progress)}%`;
                },
                (error) => {
                    console.error("Storage upload error details:", error);
                    if (window.showToast) window.showToast('Upload failed: ' + error.message, 'error');
                    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-camera"></i> Change Photo'; }
                },
                async () => {
                    try {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

                        this.state.user.photo = downloadURL;
                        this.refreshContent();
                        if (window.updateUserProfileUI) {
                            window.currentUser.photo = downloadURL;
                            window.updateUserProfileUI();
                        }

                        const userRef = doc(db, 'users', (window.currentUser.id || window.currentUser.uid));
                        await updateDoc(userRef, { photo: downloadURL });

                        const localCache = JSON.parse(localStorage.getItem('auth_user_full') || '{}');
                        localCache.photo = downloadURL;
                        localStorage.setItem('auth_user_full', JSON.stringify(localCache));

                        if (window.showToast) window.showToast('Avatar updated successfully!');
                    } catch (dbErr) {
                        console.error("Database update failed:", dbErr);
                        if (window.showToast) window.showToast('Database sync failed', 'error');
                    } finally {
                        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-camera"></i> Change Photo'; }
                    }
                }
            );
        } catch (err) {
            console.error("Failed to process avatar", err);
            if (window.showToast) window.showToast('Unexpected err: ' + err.message, 'error');
            if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-camera"></i> Change Photo'; }
        }
    },

    triggerPasswordReset: async function (email) {
        if (!email) return;
        if (confirm(`Send password reset email to ${email}?`)) {
            // Dynamic import to use Auth functions since we can't top-level import
            import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js").then(async ({ sendPasswordResetEmail, getAuth }) => {
                const auth = getAuth();
                try {
                    await sendPasswordResetEmail(auth, email);
                    if (window.showToast) window.showToast('Reset email dispatched', 'success');
                    else alert(`Reset email sent to ${email}. Check your inbox.`);
                } catch (e) {
                    alert('Error: ' + e.message);
                }
            });
        }
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
        a.download = `skill-matrix-data-${(window.currentUser.id || window.currentUser.uid)}.json`;
        a.click();
    }
};

// Global Exposure for Dashboard.js
window.renderSettings = function () {
    // Re-init state to ensure freshness
    SettingsModule.init();
    return SettingsModule.render();
};
