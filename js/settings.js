
// Settings Module for SKiL MATRIX Notes
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
                // deeply merge settings to preserve defaults
                this.state.settings = this.deepMerge(this.state.settings, docSnap.data());
                if (this.state.activeTab !== 'profile') { // Don't refresh if editing profile to avoid input loss
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
        if (!this.state.settings[category]) this.state.settings[category] = {};
        this.state.settings[category][key] = value;

        try {
            const updatePath = `${category}.${key}`;
            await updateDoc(ref, { [updatePath]: value });

            // Show toast only for explicit user actions (not internal logic)
            if (window.showToast) window.showToast('Setting saved', 'success');

        } catch (e) {
            console.error("Failed to update setting:", e);
            if (window.showToast) window.showToast('Failed to save setting', 'error');
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
        if (sidebar) {
            // Keep the logout button at the bottom
            const logoutHtml = `
            <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.05);">
                 <div class="settings-nav-item" style="color: #ff4757;" onclick="handleLogout()">
                    <span class="icon">🚪</span> Log Out
                </div>
            </div>`;
            sidebar.innerHTML = this.renderNavItems() + logoutHtml;
        }

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
                            <div class="settings-label"><strong>Password</strong><span>Prevent unauthorized access</span></div>
                            <button class="btn-sm-ghost" onclick="SettingsModule.triggerPasswordReset('${user.email}')">Reset Password</button>
                        </div>
                    </div>

                    <div class="settings-group">
                        <h3>Active Sessions</h3>
                        <div class="settings-row">
                             <div class="settings-label">
                                <strong>Generic Session</strong>
                                <span style="color:var(--success);">● Active Now</span>
                             </div>
                             <button class="btn-sm-ghost" disabled>Current</button>
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
                            <button class="btn-sm-ghost" style="background:#ff4757; color:white; border:none;" onclick="alert('Please contact skilmatrix3@gmail.com to request permanent deletion.')">Delete Forever</button>
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
                        ${this.toggleRow('notifications', 'weekly_summary', 'Weekly study summary', s.notifications.weekly_summary !== false)}
                        ${this.toggleRow('notifications', 'promo', 'Promotional emails', s.notifications.promo === true)}
                    </div>

                     <div class="settings-group">
                        <h3>In-App Notifications</h3>
                        ${this.toggleRow('notifications', 'leaderboard', 'Leaderboard rank changes', s.notifications.push)}
                        ${this.toggleRow('notifications', 'exam_alerts', 'Exam reminders', s.notifications.exam_alerts)}
                        ${this.toggleRow('notifications', 'ai_suggestions', 'AI suggestions & tips', s.notifications.ai_suggestions)}
                    </div>
                `;

            case 'appearance':
                const theme = s.appearance && s.appearance.theme ? s.appearance.theme : (localStorage.getItem('theme') || 'dark');

                return `
                    <div class="settings-section-title">🎨 Appearance</div>
                    <p class="settings-section-desc">Customize your visual experience and performance.</p>

                    <div class="settings-group">
                         <h3>Theme</h3>
                         <div style="display:flex; gap:1rem; margin-top:1rem;">
                            <button class="btn-sm-ghost ${theme === 'dark' ? 'active' : ''}" 
                                    style="${theme === 'dark' ? 'border-color:var(--primary); background:rgba(123,97,255,0.1);' : ''}"
                                    onclick="SettingsModule.updateSetting('appearance', 'theme', 'dark').then(() => window.toggleTheme(false))">🌙 Dark</button>
                            <button class="btn-sm-ghost ${theme === 'light' ? 'active' : ''}" 
                                    style="${theme === 'light' ? 'border-color:var(--primary); background:rgba(123,97,255,0.1);' : ''}"
                                    onclick="SettingsModule.updateSetting('appearance', 'theme', 'light').then(() => window.toggleTheme(true))">☀️ Light</button>
                         </div>
                    </div>

                    <div class="settings-group">
                         <h3>Interface</h3>
                         ${this.toggleRow('appearance', 'reduceMotion', 'Reduce Motion (Accessibility)', s.appearance.reduceMotion)}
                         ${this.toggleRow('appearance', 'compact', 'Compact Mode', s.appearance.compact)}
                    </div>
                `;

            case 'study':
                const hours = (s.study && s.study.target_hours) || 4;
                return `
                    <div class="settings-section-title">📚 Study Preferences</div>
                    <p class="settings-section-desc">Fine-tune your learning environment and goal tracking.</p>

                    <div class="settings-group">
                        <h3>Daily Goals</h3>
                         <div class="settings-row">
                            <div class="settings-label"><strong>Study Target</strong><span>Hours per day</span></div>
                            <select class="settings-input" style="width: auto;" onchange="SettingsModule.updateSetting('study', 'target_hours', this.value)">
                                <option value="2" ${hours == 2 ? 'selected' : ''}>2 Hours</option>
                                <option value="4" ${hours == 4 ? 'selected' : ''}>4 Hours</option>
                                <option value="6" ${hours == 6 ? 'selected' : ''}>6 Hours</option>
                                <option value="8" ${hours == 8 ? 'selected' : ''}>8 Hours</option>
                            </select>
                        </div>
                    </div>

                    <div class="settings-group">
                        <h3>Content Filters</h3>
                        ${this.toggleRow('study', 'show_verified_only', 'Show only verified notes', s.study && s.study.show_verified_only)}
                        ${this.toggleRow('study', 'auto_save_activity', 'Auto-save study activity', s.study && s.study.auto_save_activity)}
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
                                <p style="color:var(--text-dim); font-size:0.9rem; margin-top:0.5rem;">You have uploaded shared resources.</p>
                            </div>
                            <div style="font-size:2.5rem;">🌟</div>
                        </div>
                    </div>

                    <div class="settings-group">
                        <h3>Monetization & Recognition</h3>
                        <div class="settings-row">
                            <div class="settings-label"><strong>Public Portfolio</strong><span>Showcase your uploads on your profile</span></div>
                            <label class="toggle-switch">
                                <input type="checkbox" checked onchange="window.showToast('Portfolio visibility updated')">
                                <span class="slider"></span>
                            </label>
                        </div>
                         <div class="settings-row">
                            <div class="settings-label"><strong>Enable Tips</strong><span>Allow students to support you (Beta)</span></div>
                            <label class="toggle-switch">
                                <input type="checkbox" onchange="window.showToast('Note: This feature is in beta')">
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
                const model = (s.ai && s.ai.model) || 'flash-2.0';
                return `
                    <div class="settings-section-title">🤖 AI Features</div>
                    <p class="settings-section-desc">Configure Gemini-powered learning assistance.</p>

                    <div class="settings-group">
                        <h3>Model Selection</h3>
                        <div class="settings-row">
                            <div class="settings-label"><strong>Default AI Model</strong><span>Gemini 2.0 Flash is recommended for speed</span></div>
                            <div style="display:flex; gap:0.5rem;">
                                <button class="btn-sm-ghost ${model === 'flash-2.0' ? 'active' : ''}" 
                                        style="${model === 'flash-2.0' ? 'border-color:var(--primary);' : ''}"
                                        onclick="SettingsModule.updateSetting('ai', 'model', 'flash-2.0').then(() => SettingsModule.refreshContent())">Flash 2.0</button>
                                <button class="btn-sm-ghost ${model === 'pro-1.5' ? 'active' : ''}" 
                                        style="${model === 'pro-1.5' ? 'border-color:var(--primary);' : ''}"
                                        onclick="SettingsModule.updateSetting('ai', 'model', 'pro-1.5').then(() => SettingsModule.refreshContent())">Pro 1.5</button>
                            </div>
                        </div>
                    </div>

                    <div class="settings-group">
                        <h3>AI Capabilities</h3>
                        ${this.toggleRow('ai', 'auto_summarize', 'Auto-summarize long notes', s.ai && s.ai.auto_summarize)}
                        ${this.toggleRow('ai', 'explain_concepts', 'Inline concept explanation', s.ai && s.ai.explain_concepts)}
                        ${this.toggleRow('ai', 'smart_search', 'Enable Semantic Search', s.ai && s.ai.smart_search)}
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
                                <input type="checkbox" onchange="window.showToast('Incognito mode active for 24h')">
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
            const userRef = doc(db, 'users', window.currentUser.id);
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
            btn.innerText = 'Uploading...';
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
                if (btn) { btn.disabled = false; btn.innerText = 'Change Photo'; }
            };
            reader.readAsDataURL(file);
            return;
        }

        const { db, doc, updateDoc, storage, ref, uploadBytesResumable, getDownloadURL } = window.firebaseServices;

        try {
            // Upload to Firebase Storage
            const metadata = { contentType: file.type };
            const storageRef = ref(storage, 'profile_photos/' + window.currentUser.id + '_' + Date.now());
            const uploadTask = uploadBytesResumable(storageRef, file, metadata);

            uploadTask.on('state_changed',
                (snapshot) => {
                    // Progress can be handled here if needed
                },
                (error) => {
                    console.error("Storage upload error details:", error);
                    if (window.showToast) window.showToast('Upload failed: ' + error.message, 'error');
                    if (btn) { btn.disabled = false; btn.innerText = 'Change Photo'; }
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

                        const userRef = doc(db, 'users', window.currentUser.id);
                        await updateDoc(userRef, { photo: downloadURL });

                        const localCache = JSON.parse(localStorage.getItem('auth_user_full') || '{}');
                        localCache.photo = downloadURL;
                        localStorage.setItem('auth_user_full', JSON.stringify(localCache));

                        if (window.showToast) window.showToast('Avatar updated successfully!');
                    } catch (dbErr) {
                        console.error("Database update failed:", dbErr);
                        if (window.showToast) window.showToast('Database sync failed', 'error');
                    } finally {
                        if (btn) { btn.disabled = false; btn.innerText = 'Change Photo'; }
                    }
                }
            );
        } catch (err) {
            console.error("Failed to process avatar", err);
            if (window.showToast) window.showToast('Unexpected err: ' + err.message, 'error');
            if (btn) { btn.disabled = false; btn.innerText = 'Change Photo'; }
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
                    alert(`Reset email sent to ${email}. Check your inbox.`);
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
