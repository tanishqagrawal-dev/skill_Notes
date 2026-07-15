/**
 * SKiL MATRiX - Advanced Profile System
 * Handles data persistence, real-time sync, and interactive UI logic.
 */

class ProfileManager {
    constructor() {
        this.userData = null;
        this.saveTimeout = null;
        this.radarChart = null;
        this.isInitialized = false;
        this.parallaxInitialized = false;
        this._isSaving = false; // Guard flag to block re-renders during save
        this.init();
    }

    render() {
        // Auth Guard: Check for either an active Firebase user or a cached session
        const hasActiveAuth = window.firebaseServices?.auth?.currentUser;
        const hasCachedSession = localStorage.getItem('auth_user_full') || localStorage.getItem('guest_session');

        if (!hasActiveAuth && !hasCachedSession) {
            return this.renderAuthGuard();
        }

        // If data is still loading
        if (!this.userData) {
            return `
                <div class="profile-loader-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: calc(100vh - 200px); gap: 1.5rem;">
                    <div class="loader-pro"></div>
                    <p style="color: var(--accent-blue); font-weight: 500; font-family: 'JetBrains Mono', monospace; letter-spacing: 2px;">SYNCING MATRiX DATA...</p>
                </div>
            `;
        }

        return `
            <div class="profile-wrapper fade-in" id="profile-wrapper-root">
                <!-- Header Card -->
                <div class="profile-header-card" data-tilt>
                    <div class="completion-container">
                        <div style="position: relative; width: fit-content; height: fit-content; display: flex; align-items: center; justify-content: center;">
                            <svg class="ring-svg" width="100" height="100" viewBox="0 0 100 100">
                                <circle class="ring-bg" cx="50" cy="50" r="45"></circle>
                                <circle class="ring-progress" id="completion-progress" cx="50" cy="50" r="45" stroke-dasharray="283" stroke-dashoffset="283"></circle>
                                <defs>
                                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stop-color="#00d2ff" />
                                        <stop offset="100%" stop-color="#9d50bb" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <span id="completion-text" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-weight:800; font-size:1.2rem; pointer-events: none;">0%</span>
                        </div>
                        <span style="font-size:0.6rem; color:var(--text-secondary); margin-top:0.4rem; font-weight: 600; letter-spacing: 1px;">COMPLETION</span>
                    </div>

                    <div class="profile-avatar-container" id="avatar-click-zone" onclick="window.profileManager.onAvatarClick()" style="cursor: default; position: relative;">
                        <input type="file" id="profile-photo-upload" accept="image/*" style="display: none;" onchange="window.profileManager.handlePhotoUpload(event)">
                        <div class="avatar-glow"></div>
                        <div id="avatar-fallback" class="avatar-fallback" style="${this.userData?.photo ? 'display:none' : 'display:flex'}">
                            ${this.userData?.name?.charAt(0) || 'S'}
                        </div>
                        <img src="${this.userData?.photo || ''}" class="avatar-main" id="profile-avatar-img" 
                             style="${this.userData?.photo ? 'display:block' : 'display:none'}"
                             onerror="this.style.display='none'; document.getElementById('avatar-fallback').style.display='flex'">
                        <div style="position: absolute; bottom: 0; right: 0; background: var(--primary); padding: 5px; border-radius: 50%; width: 25px; height: 25px; display: flex; align-items: center; justify-content: center; border: 2px solid #050505;">
                            <i class="fas fa-camera" style="font-size: 10px; color: white;"></i>
                        </div>
                    </div>

                    <div class="profile-info">
                        <div class="greeting-row">
                            <div class="greeting-text" id="dynamic-greeting">${this.getGreeting()}</div>
                        </div>
                        <h1 class="user-name" id="profile-name">${(this.userData?.name || 'Scholar').toUpperCase()}</h1>
                        <p class="user-email" id="profile-email">${this.userData?.email || 'Student ID'}</p>
                        <div class="profile-header-btns" style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 10px;">
                            <button class="btn btn-primary btn-sm" id="edit-profile-btn" onclick="window.profileManager.enterEditMode()" style="padding: 0.4rem 1rem; font-weight: 600;">
                                <i class="fas fa-edit"></i> Edit Profile
                            </button>
                            <button class="btn btn-primary btn-sm" id="save-profile-btn" onclick="window.profileManager.saveData()" style="padding: 0.4rem 1rem; font-weight: 600; display:none; background: linear-gradient(135deg, #00ff88, #00d2ff); color: #000;">
                                <i class="fas fa-save"></i> Save Changes
                            </button>
                            <button class="btn btn-ghost btn-sm" id="cancel-edit-btn" onclick="window.profileManager.cancelEditMode()" style="padding: 0.4rem 1rem; display:none;">
                                <i class="fas fa-times"></i> Cancel
                            </button>
                            <button class="btn btn-ghost btn-sm" onclick="handleLogout()" style="padding: 0.4rem 1rem;">
                                <i class="fas fa-sign-out-alt"></i> Logout
                            </button>
                        </div>
                    </div>
                </div>

                <div class="profile-grid">
                    <!-- ══════ SUBSCRIPTION STATUS ══════ -->
                    ${this.renderSubscriptionCard()}

                    <!-- Contact Info -->
                    <div class="glass-card">
                        <div class="section-title"><i class="fas fa-id-card"></i> Personal & Contact Info</div>
                        <div class="form-row">
                            <div class="input-group" style="flex: 1;">
                                <label class="input-label">Full Name</label>
                                <input type="text" id="name-input" class="cyber-input" placeholder="Your Name" value="${this.userData?.name || ''}">
                            </div>
                        </div>
                        <div class="form-row contact-row">
                            <div class="input-group country-group">
                                <label class="input-label">Country Code</label>
                                <select id="country-code" class="cyber-input cyber-select">
                                    <option value="" disabled selected>Code</option>
                                    <option value="+91">🇮🇳 +91 (India)</option>
                                    <option value="+1">🇺🇸 +1 (USA)</option>
                                    <option value="+44">🇬🇧 +44 (UK)</option>
                                    <option value="+61">🇦🇺 +61 (Australia)</option>
                                    <option value="+1">🇨🇦 +1 (Canada)</option>
                                    <option value="+971">🇦🇪 +971 (UAE)</option>
                                    <option value="+86">🇨🇳 +86 (China)</option>
                                    <option value="+49">🇩🇪 +49 (Germany)</option>
                                    <option value="+33">🇫🇷 +33 (France)</option>
                                    <option value="+81">🇯🇵 +81 (Japan)</option>
                                    <option value="+7">🇷🇺 +7 (Russia)</option>
                                    <option value="+65">🇸🇬 +65 (Singapore)</option>
                                    <option value="+27">🇿🇦 +27 (South Africa)</option>
                                    <option value="+82">🇰🇷 +82 (South Korea)</option>
                                    <option value="+55">🇧🇷 +55 (Brazil)</option>
                                    <option value="+52">🇲🇽 +52 (Mexico)</option>
                                    <option value="+34">🇪🇸 +34 (Spain)</option>
                                    <option value="+39">🇮🇹 +39 (Italy)</option>
                                    <option value="+92">🇵🇰 +92 (Pakistan)</option>
                                    <option value="+880">🇧🇩 +880 (Bangladesh)</option>
                                </select>
                            </div>
                            <div class="input-group">
                                <label class="input-label">Phone Number</label>
                                <input type="text" id="phone-input" class="cyber-input" placeholder="Enter number" oninput="window.profileManager.handleAutoSave()">
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="input-group">
                                <label class="input-label">Gender</label>
                                <select id="gender-select" class="cyber-input cyber-select">
                                    <option value="" disabled selected>Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- Academic Info -->
                    <div class="glass-card">
                        <div class="section-title"><i class="fas fa-graduation-cap"></i> Academic Info</div>
                        <div class="form-row">
                            <div class="input-group">
                                <label class="input-label">Institution</label>
                                <input type="text" id="college-input" class="cyber-input" placeholder="College Name" oninput="window.profileManager.handleAutoSave()">
                            </div>
                        </div>
                        <div class="form-row academic-details">
                            <div class="input-group">
                                <label class="input-label">Program</label>
                                <select id="program-select" class="cyber-input cyber-select">
                                    <option value="" disabled selected>Program</option>
                                    <option value="B.Tech">B.Tech</option>
                                    <option value="BCA">BCA</option>
                                    <option value="MCA">MCA</option>
                                    <option value="MBA">MBA</option>
                                </select>
                            </div>
                            <div class="input-group">
                                <label class="input-label">Year of Study</label>
                                <select id="year-select" class="cyber-input cyber-select">
                                    <option value="" disabled selected>Year</option>
                                    <option value="1">1st Year</option>
                                    <option value="2">2nd Year</option>
                                    <option value="3">3rd Year</option>
                                    <option value="4">4th Year</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row academic-details">
                            <div class="input-group">
                                <label class="input-label">Branch/Degree</label>
                                <input type="text" id="branch-input" class="cyber-input" placeholder="e.g. CSE" oninput="window.profileManager.handleAutoSave()">
                            </div>
                            <div class="input-group">
                                <label class="input-label">Semester</label>
                                <select id="semester-select" class="cyber-input cyber-select">
                                    <option value="" disabled selected>Semester</option>
                                    <option value="Sem 1">Sem 1</option>
                                    <option value="Sem 2">Sem 2</option>
                                    <option value="Sem 3">Sem 3</option>
                                    <option value="Sem 4">Sem 4</option>
                                    <option value="Sem 5">Sem 5</option>
                                    <option value="Sem 6">Sem 6</option>
                                    <option value="Sem 7">Sem 7</option>
                                    <option value="Sem 8">Sem 8</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- Skill Matrix -->
                    <div class="glass-card skill-matrix-container">
                        <div class="section-title"><i class="fas fa-brain"></i> Skill Matrix</div>
                        <div class="skills-layout">
                            <div class="radar-wrapper">
                                <canvas id="skills-radar"></canvas>
                            </div>
                            <div class="skills-manager">
                                <div class="skill-tags" id="skill-tags-container">
                                    <!-- Dynamic -->
                                </div>
                                <div class="skill-input-row">
                                    <div class="input-group">
                                        <label class="input-label">Add Skill</label>
                                        <div class="skills-entry">
                                            <input type="text" id="skill-input" class="cyber-input" placeholder="Add a skill (e.g. Python, AI)">
                                            <button class="btn btn-ghost" onclick="window.profileManager.addSkill()">Add</button>
                                        </div>
                                    </div>
                                    <div class="input-group skill-level-group">
                                        <label class="input-label">Level: <span id="skill-level-label">Intermediate</span></label>
                                        <input type="range" id="skill-level" min="1" max="5" value="3" style="width:100%;">
                                    </div>
                                    <button class="btn btn-primary btn-add-skill-mobile" onclick="window.profileManager.addSkill()">
                                        <i class="fas fa-plus"></i>
                                    </button>
                                </div>
                                <p style="font-size:0.7rem; color:var(--text-secondary); margin-top:1rem;">AI Pro Tip: Add at least 5 skills for a better radar chart visualization.</p>
                            </div>
                        </div>
                    </div>

                    <!-- ══════ REFERRAL CARD ══════ -->
                    ${this.renderReferralCard()}

                    <!-- ══════ BADGES SHOWCASE ══════ -->
                    ${this.renderBadgesCard()}

                    <!-- ══════ CERTIFICATE SECTION ══════ -->
                    ${this.renderCertificateSection()}

                    <!-- Activity Hub -->
                    <div class="glass-card" style="grid-column: span 2;">
                        <div class="section-title"><i class="fas fa-chart-line"></i> Notes &amp; Activity Hub</div>
                        <div class="stats-grid">
                            <div class="stat-card">
                                <div class="stat-value" id="stat-uploads">0</div>
                                <div class="stat-label">Notes Uploaded</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value" id="stat-downloads">0</div>
                                <div class="stat-label">Total Downloads</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value" id="stat-saved">0</div>
                                <div class="stat-label">Saved Notes</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value" id="stat-level">LVL ${Math.floor((this.userData?.xp || 0) / 100) + 1}</div>
                                <div class="stat-label" id="stat-rank">Scholar Rank</div>
                            </div>
                        </div>
                    </div>

                </div>
                </div>

                <!-- Save Toast -->
                <div id="saved-indicator" class="saved-indicator">
                    <i class="fas fa-check-circle"></i> Profile Auto-Saved
                </div>
            </div>
        `;
    }

    // ────────────────────────────────────────────────────
    //  SUBSCRIPTION STATUS CARD
    // ────────────────────────────────────────────────────
    renderSubscriptionCard() {
        const planData = this._userPlanData || null;
        const planId = planData?.plan_id || 'free';
        const expiry = planData?.plan_expiry ? new Date(planData.plan_expiry) : null;
        const isExpired = expiry && expiry < new Date();
        const isActive = planId !== 'free' && !isExpired;

        const planNames = {
            'pro': 'Scholar PRO',
            'codetantra': 'CodeTantra Solutions',
            'free': 'Free Tier'
        };
        const planIcons = { 'pro': 'fa-crown', 'codetantra': 'fa-code', 'free': 'fa-layer-group' };
        const planName = planNames[planId] || planId;
        const planIcon = planIcons[planId] || 'fa-crown';

        const formatDate = (d) => {
            if (!d) return '—';
            return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        };

        if (isActive) {
            const now = new Date();
            const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
            const totalDays = planId === 'pro' ? 180 : 60; // estimated max for progress
            const progressPct = Math.max(0, Math.min(100, Math.round((daysLeft / totalDays) * 100)));
            const urgentColor = daysLeft <= 7 ? '#ff6b6b' : daysLeft <= 30 ? '#ffa502' : '#00ff88';

            return `
            <div class="glass-card" style="grid-column: span 2; background: linear-gradient(135deg, rgba(0,255,136,0.06), rgba(123,97,255,0.1)); border: 1px solid rgba(0,255,136,0.3); position: relative; overflow: hidden;">
                <div style="position: absolute; top: -40px; right: -40px; width: 150px; height: 150px; background: radial-gradient(circle, rgba(0,255,136,0.1), transparent 70%); border-radius: 50%; pointer-events:none;"></div>
                <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1.5rem;">
                    <div style="display: flex; align-items: center; gap: 18px;">
                        <div style="width: 58px; height: 58px; background: linear-gradient(135deg, #00ff88, #00d2ff); border-radius: 16px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 20px rgba(0,255,136,0.35); flex-shrink: 0;">
                            <i class="fas ${planIcon}" style="font-size: 1.5rem; color: #000;"></i>
                        </div>
                        <div>
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px; flex-wrap: wrap;">
                                <span style="font-size: 0.65rem; font-weight: 800; letter-spacing: 1.5px; color: #000; background: linear-gradient(135deg, #00ff88, #00d2ff); padding: 3px 10px; border-radius: 20px; text-transform: uppercase;">✦ ACTIVE SUBSCRIPTION</span>
                            </div>
                            <h3 style="font-size: 1.35rem; font-weight: 800; color: #fff; margin: 0 0 4px 0; font-family: 'Poppins', sans-serif;">${planName}</h3>
                            <p style="color: var(--text-secondary); font-size: 0.85rem; margin: 0;">
                                Expires <strong style="color: #fff;">${formatDate(expiry)}</strong> &nbsp;·&nbsp;
                                <strong style="color: ${urgentColor};">${daysLeft} days left</strong>
                            </p>
                            <div style="margin-top: 10px; width: 220px; max-width: 100%;">
                                <div style="height: 4px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden;">
                                    <div style="height: 100%; width: ${progressPct}%; background: linear-gradient(90deg, ${urgentColor}, #00d2ff); border-radius: 4px; transition: width 0.5s ease;"></div>
                                </div>
                                <p style="font-size: 0.7rem; color: var(--text-secondary); margin: 4px 0 0 0;">${progressPct}% time remaining</p>
                            </div>
                        </div>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 8px; align-items: flex-end;">
                        ${planId === 'codetantra' ? `<button class="btn btn-primary btn-sm" onclick="window.handlePayment && window.handlePayment('pro_1mo')" style="padding: 0.5rem 1.2rem; font-weight: 600;"><i class="fas fa-arrow-up"></i> Upgrade to PRO</button>` : ''}
                        <span style="font-size: 0.75rem; color: var(--text-secondary);">Plan: <strong style="color: #fff;">${planId.toUpperCase()}</strong></span>
                    </div>
                </div>
            </div>`;
        } else {
            // Free / Expired
            return `
            <div class="glass-card" style="grid-column: span 2; background: linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01)); border: 1px solid rgba(255,255,255,0.08); position: relative; overflow: hidden;">
                <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <div style="width: 56px; height: 56px; background: rgba(255,255,255,0.06); border-radius: 14px; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.1); flex-shrink: 0;">
                            <i class="fas fa-layer-group" style="font-size: 1.4rem; color: var(--text-secondary);"></i>
                        </div>
                        <div>
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                                <span style="font-size: 0.7rem; font-weight: 700; letter-spacing: 1.5px; color: var(--text-secondary); text-transform: uppercase;">SUBSCRIPTION</span>
                            </div>
                            <h3 style="font-size: 1.3rem; font-weight: 700; color: var(--text-dim); margin: 0; font-family: 'Poppins', sans-serif;">Free Tier</h3>
                            <p style="color: var(--text-secondary); font-size: 0.85rem; margin: 4px 0 0 0;">${isExpired ? `<span style="color:#ff6b6b;">Your ${planName} plan expired on ${formatDate(expiry)}.</span>` : 'Unlock premium features with Scholar PRO.'}</p>
                        </div>
                    </div>
                    <button class="btn btn-primary btn-sm" onclick="window.handlePayment && window.handlePayment('pro_1mo')" style="padding: 0.5rem 1.2rem; font-weight: 600; background: linear-gradient(135deg, #7b61ff, #9d50bb); border: none;">
                        <i class="fas fa-bolt"></i> Upgrade Now
                    </button>
                </div>
            </div>`;
        }
    }


    // ────────────────────────────────────────────────────
    //  FETCH USER PLAN FROM SUPABASE
    // ────────────────────────────────────────────────────
    async fetchUserPlan(uid) {
        if (!uid || uid === 'guest') return;
        try {
            const { supabase } = await import('./supabase-config.js?v=1.0');
            const { data, error } = await supabase
                .from('user_plans')
                .select('*')
                .eq('firebase_uid', uid)
                .single();

            if (!error && data) {
                // Check expiry
                if (data.plan_expiry && new Date(data.plan_expiry) < new Date()) {
                    data.plan_id = 'free';
                }
                this._userPlanData = data;
            } else {
                this._userPlanData = { plan_id: 'free' };
            }
        } catch (err) {
            console.warn('Could not fetch user plan:', err);
            this._userPlanData = { plan_id: 'free' };
        }
        // Re-render the subscription card if visible
        this.updateActiveTabUI();
        // Update the sidebar nav Profile badge
        this.updateProfileNavBadge();
    }

    updateProfileNavBadge() {
        const planData = this._userPlanData || null;
        const planId = planData?.plan_id || 'free';
        const expiry = planData?.plan_expiry ? new Date(planData.plan_expiry) : null;
        const isExpired = expiry && expiry < new Date();
        const isActive = planId !== 'free' && !isExpired;

        // 1. Remove from nav item if it exists
        const profileNavItem = document.querySelector('.nav-item[data-tab="profile"]');
        if (profileNavItem) {
            const existingNavBadge = profileNavItem.querySelector('.sub-badge');
            if (existingNavBadge) existingNavBadge.remove();
        }

        // 2. Add to user info box at the bottom of sidebar
        const userInfoBox = document.querySelector('.sidebar .user-info');
        if (!userInfoBox) return;

        // Remove any existing subscription badge in user info
        const existingInfoBadge = userInfoBox.querySelector('.sub-badge');
        if (existingInfoBadge) existingInfoBadge.remove();

        if (isActive) {
            const planLabels = { 'pro': 'PRO', 'codetantra': 'CT' };
            const label = planLabels[planId] || 'PRO';

            const badge = document.createElement('span');
            badge.className = 'sub-badge';
            badge.innerText = `✦ ${label}`;
            badge.style.cssText = `
                margin-left: 6px;
                font-size: 0.55rem;
                font-weight: 800;
                letter-spacing: 0.8px;
                color: #000;
                background: linear-gradient(135deg, #00ff88, #00d2ff);
                padding: 1px 6px;
                border-radius: 20px;
                text-transform: uppercase;
                box-shadow: 0 0 8px rgba(0, 255, 136, 0.4);
                animation: pulseBadge 2s ease-in-out infinite;
                display: inline-block;
                vertical-align: middle;
            `;

            // Add pulseBadge animation if not already present
            if (!document.getElementById('sub-badge-style')) {
                const style = document.createElement('style');
                style.id = 'sub-badge-style';
                style.textContent = `
                    @keyframes pulseBadge {
                        0%, 100% { box-shadow: 0 0 6px rgba(0,255,136,0.4); }
                        50% { box-shadow: 0 0 14px rgba(0,255,136,0.8); }
                    }
                `;
                document.head.appendChild(style);
            }

            const roleEl = userInfoBox.querySelector('#instant-role');
            if (roleEl) {
                roleEl.style.display = 'inline-flex';
                roleEl.style.alignItems = 'center';
                roleEl.appendChild(badge);
            } else {
                userInfoBox.appendChild(badge);
            }
        }
    }


    // ────────────────────────────────────────────────────
    //  CERTIFICATE SECTION (non-admin only)
    // ────────────────────────────────────────────────────
    renderCertificateSection() {
        const adminEmails = ['tanishqagrawal1103@gmail.com', 'skilmatrix3@gmail.com'];
        const userEmail = (this.userData?.email || this.userData?.user_metadata?.email || '').toLowerCase();
        const userName = (this.userData?.name || this.userData?.displayName || '').toLowerCase();
        const isAdmin = this.userData?.role?.toLowerCase() === 'admin'
            || this.userData?.role?.toLowerCase() === 'co-admin'
            || adminEmails.includes(userEmail);

        const codingLevel = this.userData?.coding_level || 0;
        const problemsDone = Math.min(codingLevel - 1, 365);  // level 1 = 0 done, level 366 = 365 done
        const totalProblems = 365;
        const hasCompleted = problemsDone >= totalProblems || isAdmin;
        const pct = Math.min(Math.round((problemsDone / totalProblems) * 100), 100);

        if (hasCompleted) {
            // ── UNLOCKED ──────────────────────────────────────────
            return `
            <div class="glass-card" style="grid-column: span 2; display: flex; align-items: center; justify-content: space-between;
                background: linear-gradient(135deg, rgba(255,215,0,0.08), rgba(218,165,32,0.15));
                border: 1px solid rgba(255,215,0,0.3); border-radius: 16px; padding: 1.5rem 2rem;">
                <div style="display: flex; align-items: center; gap: 20px;">
                    <div style="width:65px;height:65px;background:radial-gradient(circle,#e6c27a,#c5a059);
                        border-radius:50%;display:flex;align-items:center;justify-content:center;
                        box-shadow:0 4px 15px rgba(218,165,32,0.4);border:2px solid rgba(255,255,255,0.2);">
                        <i class="fa-solid fa-award" style="font-size:2rem;color:#fff;"></i>
                    </div>
                    <div>
                        <h2 style="font-family:'Georgia',serif;font-size:1.5rem;color:#ffd700;
                            margin-bottom:5px;text-shadow:0 2px 10px rgba(255,215,0,0.2);">
                            🏆 365-Day Elite Certificate
                        </h2>
                        <p style="color:var(--text-dim);font-size:0.95rem;margin:0;">
                            You conquered the Coding Arena! Your official certificate is ready.
                        </p>
                    </div>
                </div>
                <button onclick="if(window.showCertificate) window.showCertificate(); else alert('Certificate engine is loading. Try again in a moment.');" 
                    class="btn btn-primary"
                    style="background:linear-gradient(90deg,#f39c12,#d35400);border:none;font-weight:bold;
                        box-shadow:0 4px 15px rgba(243,156,18,0.4);padding:0.7rem 1.5rem;font-size:1.1rem;gap:8px;">
                    <i class="fa-solid fa-expand"></i> View Certificate
                </button>
            </div>`;
        } else {
            // ── LOCKED – show progress ─────────────────────────────
            return `
            <div class="glass-card" style="grid-column: span 2; display: flex; align-items: center; justify-content: space-between;
                background: linear-gradient(135deg, rgba(40,44,55,0.7), rgba(20,23,31,0.9));
                border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 1.5rem 2rem;
                opacity: 0.85;">
                <div style="display: flex; align-items: center; gap: 20px; flex: 1;">
                    <div style="width:65px;height:65px;background:rgba(255,255,255,0.05);
                        border-radius:50%;display:flex;align-items:center;justify-content:center;
                        border:2px solid rgba(255,255,255,0.1);filter:grayscale(1);flex-shrink:0;">
                        <i class="fa-solid fa-lock" style="font-size:1.8rem;color:rgba(255,255,255,0.3);"></i>
                    </div>
                    <div style="flex:1;">
                        <h2 style="font-size:1.3rem;color:rgba(255,255,255,0.5);margin-bottom:4px;">
                            🔒 365-Day Elite Certificate
                        </h2>
                        <p style="color:var(--text-dim);font-size:0.85rem;margin:0 0 10px;">
                            Complete all <strong style="color:rgba(255,255,255,0.6);">365 Coding Arena problems</strong> to unlock your certificate.
                        </p>
                        <!-- Progress bar -->
                        <div style="display:flex;align-items:center;gap:10px;">
                            <div style="flex:1;background:rgba(0,0,0,0.4);height:6px;border-radius:10px;overflow:hidden;">
                                <div style="width:${pct}%;height:100%;background:linear-gradient(90deg,#7b61ff,#00d2ff);
                                    border-radius:10px;transition:width 1s ease;"></div>
                            </div>
                            <span style="font-size:0.8rem;color:var(--text-dim);white-space:nowrap;">
                                ${problemsDone} / ${totalProblems} solved (${pct}%)
                            </span>
                        </div>
                    </div>
                </div>
                <button disabled style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);
                    color:rgba(255,255,255,0.3);font-weight:bold;padding:0.7rem 1.5rem;border-radius:10px;
                    cursor:not-allowed;font-size:0.95rem;white-space:nowrap;margin-left:1.5rem;">
                    <i class="fa-solid fa-lock"></i> Locked
                </button>
            </div>`;
        }
    }

    // ────────────────────────────────────────────────────
    //  REFERRAL CODE GENERATOR
    // ────────────────────────────────────────────────────
    generateReferralCode(email) {
        if (!email) return '';
        if (window.generateReferralCode) return window.generateReferralCode(email);
        const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        const cleaned = email.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        let code = '';
        for (let i = 0; i < 8; i++) {
            const idx = (cleaned.charCodeAt(i % cleaned.length) ^ (i * 37)) % charset.length;
            code += charset[Math.abs(idx)];
        }
        return code;
    }

    getReferralLink() {
        const code = this.userData?.referral_code || '';
        if (!code) return '';
        const origin = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1') ? window.location.origin : 'https://skillnotes.netlify.app';
        return `${origin}/?ref=${code}`;
    }

    // ────────────────────────────────────────────────────
    //  RENDER REFERRAL CARD
    // ────────────────────────────────────────────────────
    renderReferralCard() {
        const code = this.userData?.referral_code || '—';
        const link = this.getReferralLink();
        const count = this.userData?.referral_count || 0;
        const pts = this.userData?.referral_points || 0;
        const msg = encodeURIComponent('🎓 Join me on SKiL MATRiX — the ultimate student study hub! Use my referral link to get started: ' + link);
        const waLink = `https://wa.me/?text=${msg}`;
        const tgLink = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent('🎓 Join me on SKiL MATRiX — the ultimate student study hub!')}`;
        const twLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent('📚 Studying smarter with SKiL MATRiX! Join using my link and unlock exclusive resources 🚀')}&url=${encodeURIComponent(link)}`;
        const liLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`;
        const mailLink = `mailto:?subject=${encodeURIComponent('Join me on SKiL MATRiX!')}&body=${encodeURIComponent('Hey! 👋\n\nI\'ve been using SKiL MATRiX for my studies and it\'s amazing! Sign up using my referral link and we both earn bonus XP:\n\n' + link + '\n\nSee you inside! 🚀')}`;

        return `
        <div class="referral-card" style="grid-column: span 2;">
            <div class="referral-card-glow"></div>
            <div class="referral-card-inner">
                <div class="referral-header">
                    <div class="referral-icon-wrap">
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                            <circle cx="16" cy="16" r="15" stroke="url(#rg1)" stroke-width="1.5"/>
                            <path d="M10 16 L16 10 L22 16" stroke="#00d2ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M16 10 L16 24" stroke="#00d2ff" stroke-width="2" stroke-linecap="round"/>
                            <circle cx="10" cy="22" r="3" fill="#9d50bb"/>
                            <circle cx="22" cy="22" r="3" fill="#00d2ff"/>
                            <defs><linearGradient id="rg1" x1="0" y1="0" x2="32" y2="32"><stop offset="0%" stop-color="#00d2ff"/><stop offset="100%" stop-color="#9d50bb"/></linearGradient></defs>
                        </svg>
                    </div>
                    <div>
                        <div class="section-title" style="margin-bottom:0.2rem"><i class="fas fa-link"></i> Your Referral Hub</div>
                        <p style="color:var(--text-secondary);font-size:0.8rem;margin:0">Invite friends &amp; earn +50 XP per successful referral</p>
                    </div>
                </div>

                <div class="referral-stats-row">
                    <div class="ref-stat-pill">
                        <span class="ref-stat-num" style="color:#00d2ff">${count}</span>
                        <span class="ref-stat-lbl">Friends Referred</span>
                    </div>
                    <div class="ref-stat-pill">
                        <span class="ref-stat-num" style="color:#9d50bb">+${pts}</span>
                        <span class="ref-stat-lbl">Referral XP</span>
                    </div>
                    <div class="ref-stat-pill">
                        <span class="ref-stat-num" style="color:#ffd700">${Math.floor(pts / 50) * 50}</span>
                        <span class="ref-stat-lbl">Total Earned</span>
                    </div>
                </div>

                <div class="referral-code-section">
                    <div class="referral-code-label">YOUR UNIQUE CODE</div>
                    <div class="referral-code-display" id="ref-code-display">${code}</div>
                </div>

                <div class="referral-link-section">
                    <div class="referral-code-label">SHARE LINK</div>
                    <div class="referral-link-row">
                        <input type="text" class="referral-link-input" id="ref-link-input" value="${link}" readonly onclick="this.select()">
                        <button class="ref-copy-btn" id="ref-copy-btn" onclick="window.profileManager.copyReferralCode()" title="Copy link">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </div>

                <div class="referral-share-btns">
                    <a href="${waLink}" target="_blank" rel="noopener" class="ref-share-btn ref-wa" title="Share on WhatsApp">
                        <i class="fa-brands fa-whatsapp"></i> WhatsApp
                    </a>
                    <a href="${tgLink}" target="_blank" rel="noopener" class="ref-share-btn ref-tg" title="Share on Telegram">
                        <i class="fa-brands fa-telegram"></i> Telegram
                    </a>
                    <a href="${twLink}" target="_blank" rel="noopener" class="ref-share-btn ref-tw" title="Share on X">
                        <i class="fa-brands fa-x-twitter"></i> X
                    </a>
                    <a href="${liLink}" target="_blank" rel="noopener" class="ref-share-btn ref-li" title="Share on LinkedIn">
                        <i class="fa-brands fa-linkedin-in"></i> LinkedIn
                    </a>
                    <a href="${mailLink}" class="ref-share-btn ref-mail" title="Share via Email">
                        <i class="fas fa-envelope"></i> Email
                    </a>
                    <button class="ref-share-btn ref-native" onclick="window.profileManager.nativeShare()" id="ref-native-share" style="display:none" title="More options">
                        <i class="fas fa-share-alt"></i> More
                    </button>
                </div>
            </div>
        </div>`;
    }

    copyReferralCode() {
        const input = document.getElementById('ref-link-input');
        const btn = document.getElementById('ref-copy-btn');
        if (!input) return;
        navigator.clipboard.writeText(input.value).then(() => {
            if (btn) {
                btn.innerHTML = '<i class="fas fa-check"></i>';
                btn.style.background = '#00ff88';
                btn.style.color = '#000';
                setTimeout(() => {
                    btn.innerHTML = '<i class="fas fa-copy"></i>';
                    btn.style.background = '';
                    btn.style.color = '';
                }, 2000);
            }
            this.showSavedIndicator('Link copied! ✓');
        }).catch(() => {
            if (input) { input.select(); document.execCommand('copy'); }
        });
    }

    nativeShare() {
        const link = this.getReferralLink();
        if (navigator.share) {
            navigator.share({
                title: 'Join me on SKiL MATRiX',
                text: '🎓 The ultimate student study platform! Use my referral link:',
                url: link
            }).catch(() => { });
        }
    }

    // ────────────────────────────────────────────────────
    //  BADGE DEFINITIONS & LOGIC
    // ────────────────────────────────────────────────────
    getBadgeDefinitions() {
        return [
            // ── BASIC TIER (Blue) ──
            {
                id: 'early_bird', tier: 'basic', name: 'Early Adopter', desc: 'Joined the SKiL MATRiX revolution',
                condition: (u) => true,
                svg: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs><radialGradient id="bg_eb" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#1a3a5c"/><stop offset="100%" stop-color="#0a1628"/></radialGradient></defs>
                    <circle cx="28" cy="28" r="27" fill="url(#bg_eb)" stroke="#00d2ff" stroke-width="1.5"/>
                    <path d="M28 12 L32 24 L44 24 L34 32 L38 44 L28 36 L18 44 L22 32 L12 24 L24 24 Z" fill="#00d2ff" opacity="0.9"/>
                    <circle cx="28" cy="28" r="6" fill="#fff" opacity="0.15"/>
                </svg>`
            },
            {
                id: 'scholar_50', tier: 'basic', name: 'Scholar', desc: 'Earned 50+ XP on the platform',
                condition: (u) => (u.xp || 0) >= 50,
                svg: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs><linearGradient id="bg_s50" x1="0" y1="0" x2="56" y2="56"><stop offset="0%" stop-color="#0d2137"/><stop offset="100%" stop-color="#0a1628"/></linearGradient></defs>
                    <circle cx="28" cy="28" r="27" fill="url(#bg_s50)" stroke="#60a5fa" stroke-width="1.5"/>
                    <path d="M28 15 L34 22 H44 L36 29 L39 40 L28 33 L17 40 L20 29 L12 22 H22 Z" fill="none" stroke="#60a5fa" stroke-width="2" stroke-linejoin="round"/>
                    <circle cx="28" cy="28" r="5" fill="#60a5fa" opacity="0.8"/>
                </svg>`
            },
            {
                id: 'uploader_1', tier: 'basic', name: 'First Upload', desc: 'Uploaded your first note to the hub',
                condition: (u) => (u.uploads || 0) >= 1,
                svg: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs><linearGradient id="bg_u1" x1="0" y1="0" x2="56" y2="56"><stop offset="0%" stop-color="#0d2a1f"/><stop offset="100%" stop-color="#0a1628"/></linearGradient></defs>
                    <circle cx="28" cy="28" r="27" fill="url(#bg_u1)" stroke="#34d399" stroke-width="1.5"/>
                    <rect x="18" y="22" width="20" height="16" rx="3" fill="none" stroke="#34d399" stroke-width="2"/>
                    <path d="M28 18 L28 30 M24 22 L28 18 L32 22" stroke="#34d399" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M22 34 H34" stroke="#34d399" stroke-width="1.5" stroke-linecap="round"/>
                </svg>`
            },
            {
                id: 'referral_1', tier: 'basic', name: 'Connector', desc: 'Successfully referred your first friend',
                condition: (u) => (u.referral_count || 0) >= 1,
                svg: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs><linearGradient id="bg_r1" x1="0" y1="0" x2="56" y2="56"><stop offset="0%" stop-color="#1a1a3e"/><stop offset="100%" stop-color="#0a1628"/></linearGradient></defs>
                    <circle cx="28" cy="28" r="27" fill="url(#bg_r1)" stroke="#a78bfa" stroke-width="1.5"/>
                    <circle cx="20" cy="24" r="5" fill="none" stroke="#a78bfa" stroke-width="2"/>
                    <circle cx="36" cy="24" r="5" fill="none" stroke="#a78bfa" stroke-width="2"/>
                    <circle cx="28" cy="36" r="5" fill="#a78bfa" opacity="0.9"/>
                    <path d="M24 26 L26 32 M32 26 L30 32" stroke="#a78bfa" stroke-width="1.5" stroke-linecap="round"/>
                </svg>`
            },
            {
                id: 'focus_60', tier: 'basic', name: 'Focus Monk', desc: 'Logged 60+ minutes of deep focus',
                condition: (u) => (u.focusminutes || 0) >= 60,
                svg: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs><linearGradient id="bg_f60" x1="0" y1="0" x2="56" y2="56"><stop offset="0%" stop-color="#1a2a1a"/><stop offset="100%" stop-color="#0a1628"/></linearGradient></defs>
                    <circle cx="28" cy="28" r="27" fill="url(#bg_f60)" stroke="#4ade80" stroke-width="1.5"/>
                    <circle cx="28" cy="28" r="12" fill="none" stroke="#4ade80" stroke-width="2"/>
                    <path d="M28 20 L28 28 L33 31" stroke="#4ade80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <circle cx="28" cy="15" r="2" fill="#4ade80"/>
                    <circle cx="28" cy="41" r="2" fill="#4ade80"/>
                </svg>`
            },
            {
                id: 'coder_novice', tier: 'basic', name: 'Code Novice', desc: 'Earned 100+ Coding XP in the Arena',
                condition: (u) => (u.coding_xp || 0) >= 100,
                svg: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs><linearGradient id="bg_cn" x1="0" y1="0" x2="56" y2="56"><stop offset="0%" stop-color="#1e3a8a"/><stop offset="100%" stop-color="#0a1628"/></linearGradient></defs>
                    <circle cx="28" cy="28" r="27" fill="url(#bg_cn)" stroke="#3b82f6" stroke-width="1.5"/>
                    <path d="M22 20 L16 28 L22 36 M34 20 L40 28 L34 36" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M30 18 L26 38" stroke="#3b82f6" stroke-width="2" stroke-linecap="round"/>
                </svg>`
            },
            // ── PREMIUM TIER (Purple) ──
            {
                id: 'uploader_5', tier: 'premium', name: 'Note Guru', desc: 'Uploaded 5+ notes — a true knowledge sharer',
                condition: (u) => (u.uploads || 0) >= 5,
                svg: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs><linearGradient id="bg_u5" x1="0" y1="0" x2="56" y2="56"><stop offset="0%" stop-color="#2a1a3e"/><stop offset="100%" stop-color="#1a0a28"/></linearGradient><linearGradient id="grad_u5" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#c084fc"/><stop offset="100%" stop-color="#9d50bb"/></linearGradient></defs>
                    <circle cx="28" cy="28" r="27" fill="url(#bg_u5)" stroke="url(#grad_u5)" stroke-width="2"/>
                    <path d="M18 20 H38 V38 H18 Z" fill="none" stroke="url(#grad_u5)" stroke-width="1.5" rx="3"/>
                    <path d="M22 26 H34 M22 30 H34 M22 34 H30" stroke="#c084fc" stroke-width="1.5" stroke-linecap="round"/>
                    <circle cx="38" cy="18" r="6" fill="#9d50bb"/>
                    <path d="M35 18 L37 20 L41 16" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`
            },
            {
                id: 'referral_5', tier: 'premium', name: 'Recruiter', desc: 'Referred 5 friends to SKiL MATRiX',
                condition: (u) => (u.referral_count || 0) >= 5,
                svg: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs><linearGradient id="bg_r5" x1="0" y1="0" x2="56" y2="56"><stop offset="0%" stop-color="#2a1a3e"/><stop offset="100%" stop-color="#1a0a28"/></linearGradient><linearGradient id="gr_r5" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f0abfc"/><stop offset="100%" stop-color="#a855f7"/></linearGradient></defs>
                    <circle cx="28" cy="28" r="27" fill="url(#bg_r5)" stroke="url(#gr_r5)" stroke-width="2"/>
                    <circle cx="28" cy="22" r="7" fill="none" stroke="url(#gr_r5)" stroke-width="2"/>
                    <path d="M16 40 C16 34 21 30 28 30 C35 30 40 34 40 40" stroke="url(#gr_r5)" stroke-width="2" stroke-linecap="round"/>
                    <circle cx="18" cy="24" r="4" fill="none" stroke="#c084fc" stroke-width="1.5"/>
                    <circle cx="38" cy="24" r="4" fill="none" stroke="#c084fc" stroke-width="1.5"/>
                </svg>`
            },
            {
                id: 'scholar_500', tier: 'premium', name: 'Pro Scholar', desc: 'Reached 500+ XP — a dedicated learner',
                condition: (u) => (u.xp || 0) >= 500,
                svg: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs><linearGradient id="bg_s500" x1="0" y1="56" x2="56" y2="0"><stop offset="0%" stop-color="#1a0a28"/><stop offset="100%" stop-color="#2a1a3e"/></linearGradient><linearGradient id="g_s500" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#e879f9"/><stop offset="100%" stop-color="#9333ea"/></linearGradient></defs>
                    <circle cx="28" cy="28" r="27" fill="url(#bg_s500)" stroke="url(#g_s500)" stroke-width="2"/>
                    <path d="M28 14 L31.5 22 L40 22 L33.5 27.5 L36 36 L28 31 L20 36 L22.5 27.5 L16 22 L24.5 22 Z" fill="url(#g_s500)" opacity="0.9"/>
                    <circle cx="28" cy="24" r="3" fill="#fff" opacity="0.3"/>
                </svg>`
            },
            {
                id: 'focus_300', tier: 'premium', name: 'Deep Worker', desc: 'Logged 5+ hours of focused study sessions',
                condition: (u) => (u.focusminutes || 0) >= 300,
                svg: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs><linearGradient id="bg_f300" x1="0" y1="0" x2="56" y2="56"><stop offset="0%" stop-color="#2a1a0a"/><stop offset="100%" stop-color="#1a0a28"/></linearGradient><linearGradient id="g_f300" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fb923c"/><stop offset="100%" stop-color="#ea580c"/></linearGradient></defs>
                    <circle cx="28" cy="28" r="27" fill="url(#bg_f300)" stroke="url(#g_f300)" stroke-width="2"/>
                    <path d="M28 14 C19 14 13 20 13 28 C13 36 19 42 28 42" stroke="url(#g_f300)" stroke-width="2" stroke-linecap="round"/>
                    <path d="M28 14 C37 14 43 20 43 28 C43 36 37 42 28 42" stroke="#fb923c" stroke-width="2" stroke-linecap="round" opacity="0.5"/>
                    <path d="M28 20 L28 30 L34 34" stroke="url(#g_f300)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <circle cx="28" cy="28" r="3" fill="#fb923c"/>
                </svg>`
            },
            {
                id: 'coder_ninja', tier: 'premium', name: 'Code Ninja', desc: 'Maintained a 7-day coding streak',
                condition: (u) => (u.max_coding_streak || u.coding_streak || 0) >= 7,
                svg: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs><linearGradient id="bg_cni" x1="0" y1="0" x2="56" y2="56"><stop offset="0%" stop-color="#3b0764"/><stop offset="100%" stop-color="#1a0a28"/></linearGradient><linearGradient id="g_cni" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#d946ef"/><stop offset="100%" stop-color="#9333ea"/></linearGradient></defs>
                    <circle cx="28" cy="28" r="27" fill="url(#bg_cni)" stroke="url(#g_cni)" stroke-width="2"/>
                    <path d="M28 14 L34 24 L44 26 L36 34 L38 44 L28 38 L18 44 L20 34 L12 26 L22 24 Z" fill="url(#g_cni)" opacity="0.8"/>
                    <path d="M28 20 L30 26 L36 28 L30 30 L28 36 L26 30 L20 28 L26 26 Z" fill="#fff" opacity="0.9"/>
                </svg>`
            },
            // ── ADVANCED TIER (Gold) ──
            {
                id: 'uploader_10', tier: 'advanced', name: 'Knowledge Titan', desc: 'Uploaded 10+ notes — a pillar of the community',
                condition: (u) => (u.uploads || 0) >= 10,
                svg: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs><linearGradient id="bg_u10" x1="0" y1="56" x2="56" y2="0"><stop offset="0%" stop-color="#1a1200"/><stop offset="100%" stop-color="#2a2000"/></linearGradient><linearGradient id="g_u10" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fde68a"/><stop offset="50%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#d97706"/></linearGradient></defs>
                    <circle cx="28" cy="28" r="27" fill="url(#bg_u10)" stroke="url(#g_u10)" stroke-width="2"/>
                    <circle cx="28" cy="28" r="14" fill="none" stroke="url(#g_u10)" stroke-width="1.5" opacity="0.4"/>
                    <path d="M28 13 L31 22 H42 L33 28 L36 39 L28 33 L20 39 L23 28 L14 22 H25 Z" fill="url(#g_u10)"/>
                    <circle cx="28" cy="28" r="4" fill="#fff" opacity="0.2"/>
                </svg>`
            },
            {
                id: 'referral_10', tier: 'advanced', name: 'Ambassador', desc: 'Referred 10 friends — a true SKiL MATRiX ambassador',
                condition: (u) => (u.referral_count || 0) >= 10,
                svg: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs><linearGradient id="bg_r10" x1="0" y1="56" x2="56" y2="0"><stop offset="0%" stop-color="#1a1200"/><stop offset="100%" stop-color="#2a2000"/></linearGradient><linearGradient id="g_r10" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fcd34d"/><stop offset="100%" stop-color="#f59e0b"/></linearGradient></defs>
                    <circle cx="28" cy="28" r="27" fill="url(#bg_r10)" stroke="url(#g_r10)" stroke-width="2"/>
                    <path d="M28 12 L28 22 M20 16 L24 24 M12 22 L22 26 M14 32 L24 30 M20 40 L26 32 M28 42 L28 32 M36 40 L30 32 M42 32 L32 30 M44 22 L34 26 M36 16 L32 24" stroke="url(#g_r10)" stroke-width="1.5" stroke-linecap="round"/>
                    <circle cx="28" cy="28" r="7" fill="url(#g_r10)"/>
                    <circle cx="28" cy="28" r="3" fill="#fff"/>
                </svg>`
            },
            {
                id: 'scholar_1000', tier: 'advanced', name: 'Elite Scholar', desc: 'Reached 1000+ XP — you are at the apex',
                condition: (u) => (u.xp || 0) >= 1000,
                svg: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs><linearGradient id="bg_s1k" x1="0" y1="56" x2="56" y2="0"><stop offset="0%" stop-color="#1a1200"/><stop offset="100%" stop-color="#2a2a00"/></linearGradient><linearGradient id="g_s1k" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fef08a"/><stop offset="40%" stop-color="#fbbf24"/><stop offset="100%" stop-color="#b45309"/></linearGradient></defs>
                    <circle cx="28" cy="28" r="27" fill="url(#bg_s1k)" stroke="url(#g_s1k)" stroke-width="2"/>
                    <path d="M18 32 L22 20 L28 14 L34 20 L38 32 L28 36 Z" fill="url(#g_s1k)"/>
                    <path d="M20 36 L28 40 L36 36" fill="url(#g_s1k)" opacity="0.7"/>
                    <path d="M20 36 L20 42 L28 46 L36 42 L36 36" fill="url(#g_s1k)" opacity="0.4"/>
                    <circle cx="28" cy="25" r="4" fill="#fff" opacity="0.25"/>
                </svg>`
            },
            {
                id: 'focus_1000', tier: 'advanced', name: 'NeuroSprint Pro', desc: 'Logged 1000+ focus minutes — a true deep work master',
                condition: (u) => (u.focusminutes || 0) >= 1000,
                svg: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs><linearGradient id="bg_f1k" x1="0" y1="56" x2="56" y2="0"><stop offset="0%" stop-color="#001a1a"/><stop offset="100%" stop-color="#1a2a00"/></linearGradient><linearGradient id="g_f1k" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#6ee7b7"/><stop offset="50%" stop-color="#fbbf24"/><stop offset="100%" stop-color="#f59e0b"/></linearGradient></defs>
                    <circle cx="28" cy="28" r="27" fill="url(#bg_f1k)" stroke="url(#g_f1k)" stroke-width="2"/>
                    <path d="M28 10 C20 14 16 20 18 26 C20 32 16 36 20 40 C24 44 32 44 36 40 C40 36 36 32 38 26 C40 20 36 14 28 10 Z" fill="url(#g_f1k)" opacity="0.8"/>
                    <path d="M24 28 L27 24 L30 28 L33 22" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`
            },
            {
                id: 'coder_master', tier: 'advanced', name: 'Code Master', desc: 'Earned 1000+ Coding XP in the Arena',
                condition: (u) => (u.coding_xp || 0) >= 1000,
                svg: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs><linearGradient id="bg_cma" x1="0" y1="56" x2="56" y2="0"><stop offset="0%" stop-color="#1a1200"/><stop offset="100%" stop-color="#2a2a00"/></linearGradient><linearGradient id="g_cma" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fde047"/><stop offset="50%" stop-color="#eab308"/><stop offset="100%" stop-color="#ca8a04"/></linearGradient></defs>
                    <circle cx="28" cy="28" r="27" fill="url(#bg_cma)" stroke="url(#g_cma)" stroke-width="2"/>
                    <path d="M28 12 L33 22 L44 22 L35 28 L38 38 L28 32 L18 38 L21 28 L12 22 L23 22 Z" fill="url(#g_cma)" opacity="0.9"/>
                    <path d="M23 26 L19 32 L23 38 M33 26 L37 32 L33 38" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.8"/>
                    <path d="M29 24 L27 40" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0.8"/>
                </svg>`
            },
            // ── CODING ARENA EXCLUSIVE ──
            {
                id: 'coder_500xp', tier: 'premium', name: 'Arena Climber', desc: 'Earned 500+ Coding XP — halfway to mastery',
                condition: (u) => (u.coding_xp || 0) >= 500,
                svg: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs><linearGradient id="bg_c5" x1="0" y1="0" x2="56" y2="56"><stop offset="0%" stop-color="#1a0040"/><stop offset="100%" stop-color="#0a1a28"/></linearGradient><linearGradient id="g_c5" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#a78bfa"/><stop offset="100%" stop-color="#6366f1"/></linearGradient></defs>
                    <circle cx="28" cy="28" r="27" fill="url(#bg_c5)" stroke="url(#g_c5)" stroke-width="2"/>
                    <path d="M14 38 L20 26 L28 14 L36 26 L42 38" stroke="url(#g_c5)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M24 26 L32 26" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
                </svg>`
            },
            {
                id: 'coder_365_elite', tier: 'advanced', name: '365 Days Elite', desc: 'Conquered the 365 Days of Code Challenge',
                condition: (u) => {
                    const userEmail = (u?.email || u?.user_metadata?.email || '').toLowerCase();
                    const adminEmails = ['tanishqagrawal1103@gmail.com', 'skilmatrix3@gmail.com'];
                    const isAdmin = u?.role?.toLowerCase() === 'admin' || u?.role?.toLowerCase() === 'co-admin' || adminEmails.includes(userEmail);
                    return (u?.coding_level || 0) > 365 || isAdmin;
                },
                svg: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs><linearGradient id="bg_365" x1="0" y1="0" x2="56" y2="56"><stop offset="0%" stop-color="#1a1200"/><stop offset="100%" stop-color="#2a2000"/></linearGradient><linearGradient id="g_365" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#d97706"/></linearGradient></defs>
                    <circle cx="28" cy="28" r="27" fill="url(#bg_365)" stroke="url(#g_365)" stroke-width="2"/>
                    <path d="M14 36 L18 16 L28 26 L38 16 L42 36 Z" fill="url(#g_365)"/>
                    <path d="M16 40 L40 40 L38 36 L18 36 Z" fill="url(#g_365)" opacity="0.8"/>
                    <circle cx="18" cy="14" r="3" fill="#fff" opacity="0.5"/>
                    <circle cx="28" cy="22" r="3" fill="#fff" opacity="0.5"/>
                    <circle cx="38" cy="14" r="3" fill="#fff" opacity="0.5"/>
                </svg>`
            },
            {
                id: 'coder_2500xp', tier: 'advanced', name: 'Code Legend', desc: 'Earned 2500+ Coding XP — a true Arena Legend',
                condition: (u) => (u.coding_xp || 0) >= 2500,
                svg: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs><linearGradient id="bg_cl" x1="0" y1="56" x2="56" y2="0"><stop offset="0%" stop-color="#0a0a00"/><stop offset="100%" stop-color="#1a1a00"/></linearGradient><linearGradient id="g_cl" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fef9c3"/><stop offset="50%" stop-color="#fde047"/><stop offset="100%" stop-color="#f59e0b"/></linearGradient></defs>
                    <circle cx="28" cy="28" r="27" fill="url(#bg_cl)" stroke="url(#g_cl)" stroke-width="2.5"/>
                    <circle cx="28" cy="28" r="20" fill="none" stroke="url(#g_cl)" stroke-width="0.8" opacity="0.3"/>
                    <path d="M28 12 L31 22 H41 L33 28 L36 38 L28 32 L20 38 L23 28 L15 22 H25 Z" fill="url(#g_cl)"/>
                    <path d="M23 26 L20 32 L23 37 M33 26 L36 32 L33 37" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>
                    <path d="M29 23 L27 37" stroke="#fff" stroke-width="1.5" stroke-linecap="round" opacity="0.9"/>
                </svg>`
            },
            {
                id: 'streak_3', tier: 'basic', name: 'On a Roll', desc: 'Maintained a 3-day coding streak',
                condition: (u) => (u.max_coding_streak || u.coding_streak || 0) >= 3,
                svg: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs><linearGradient id="bg_s3" x1="0" y1="0" x2="56" y2="56"><stop offset="0%" stop-color="#1a1000"/><stop offset="100%" stop-color="#200a00"/></linearGradient></defs>
                    <circle cx="28" cy="28" r="27" fill="url(#bg_s3)" stroke="#fb923c" stroke-width="1.5"/>
                    <path d="M28 12 C24 18 18 22 20 30 C22 36 26 34 26 30 C26 27 28 24 30 28 C32 32 30 38 34 40 C40 36 42 26 36 18 C34 14 30 12 28 12Z" fill="#fb923c" opacity="0.85"/>
                    <circle cx="28" cy="38" r="3" fill="#fff" opacity="0.6"/>
                </svg>`
            },
            {
                id: 'streak_30', tier: 'advanced', name: 'Iron Coder', desc: 'Maintained a 30-day coding streak — unstoppable!',
                condition: (u) => (u.max_coding_streak || u.coding_streak || 0) >= 30,
                svg: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs><linearGradient id="bg_s30" x1="0" y1="56" x2="56" y2="0"><stop offset="0%" stop-color="#1a0400"/><stop offset="100%" stop-color="#2a0800"/></linearGradient><linearGradient id="g_s30" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fde68a"/><stop offset="50%" stop-color="#f97316"/><stop offset="100%" stop-color="#ef4444"/></linearGradient></defs>
                    <circle cx="28" cy="28" r="27" fill="url(#bg_s30)" stroke="url(#g_s30)" stroke-width="2"/>
                    <path d="M28 8 C20 16 14 22 16 32 C18 40 22 38 22 32 C22 28 24 24 26 28 C28 32 26 40 30 42 C38 38 42 26 36 16 C33 10 30 8 28 8Z" fill="url(#g_s30)" opacity="0.9"/>
                    <path d="M22 36 C22 40 28 44 32 42 C28 40 26 36 28 32 C29 36 32 38 34 36 C36 32 34 26 30 22 C32 28 28 30 26 28 C24 24 24 18 28 12 C20 20 18 30 22 36Z" fill="#fff" opacity="0.2"/>
                    <circle cx="28" cy="40" r="3" fill="#fff" opacity="0.7"/>
                </svg>`
            },
            {
                id: 'coder_level5', tier: 'premium', name: 'Level 5 Coder', desc: 'Reached Level 5 in the Coding Arena',
                condition: (u) => (u.current_coding_level || 0) >= 5,
                svg: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs><linearGradient id="bg_lv5" x1="0" y1="0" x2="56" y2="56"><stop offset="0%" stop-color="#0a1a2a"/><stop offset="100%" stop-color="#0a0a20"/></linearGradient><linearGradient id="g_lv5" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#38bdf8"/><stop offset="100%" stop-color="#818cf8"/></linearGradient></defs>
                    <circle cx="28" cy="28" r="27" fill="url(#bg_lv5)" stroke="url(#g_lv5)" stroke-width="2"/>
                    <text x="28" y="34" text-anchor="middle" font-family="monospace" font-size="16" font-weight="bold" fill="url(#g_lv5)">LV5</text>
                    <path d="M14 42 L28 14 L42 42" fill="none" stroke="url(#g_lv5)" stroke-width="1.5" opacity="0.3"/>
                    <path d="M18 36 L38 36" stroke="url(#g_lv5)" stroke-width="1.5" opacity="0.3"/>
                </svg>`
            },
            {
                id: 'coder_level10', tier: 'advanced', name: 'Level 10 Legend', desc: 'Reached Level 10 in the Coding Arena — elite tier!',
                condition: (u) => (u.current_coding_level || 0) >= 10,
                svg: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs><linearGradient id="bg_lv10" x1="0" y1="56" x2="56" y2="0"><stop offset="0%" stop-color="#0a0808"/><stop offset="100%" stop-color="#1a0a0a"/></linearGradient><linearGradient id="g_lv10" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f9a8d4"/><stop offset="50%" stop-color="#fb7185"/><stop offset="100%" stop-color="#e11d48"/></linearGradient></defs>
                    <circle cx="28" cy="28" r="27" fill="url(#bg_lv10)" stroke="url(#g_lv10)" stroke-width="2.5"/>
                    <circle cx="28" cy="28" r="20" fill="none" stroke="url(#g_lv10)" stroke-width="0.8" opacity="0.25"/>
                    <text x="28" y="34" text-anchor="middle" font-family="monospace" font-size="13" font-weight="bold" fill="url(#g_lv10)">LV10</text>
                    <path d="M28 10 L31 18 L40 18 L33 23 L36 32 L28 27 L20 32 L23 23 L16 18 L25 18 Z" fill="url(#g_lv10)" opacity="0.25"/>
                </svg>`
            }
        ];
    }

    computeEarnedBadges() {
        const u = this.userData || {};
        return this.getBadgeDefinitions()
            .filter(b => b.condition(u))
            .map(b => b.id);
    }

    async saveEarnedBadges(earnedIds) {
        if (!this.userData || !earnedIds.length) return;
        const uid = this.userData.uid || this.getCurrentUid();
        if (!uid || uid === 'guest') return;
        try {
            this.userData.badges = earnedIds;
            const { supabase } = await import('./supabase-config.js?v=1.0');
            await supabase.from('profiles').update({ badges: earnedIds }).eq('id', uid);
        } catch (e) { console.warn('Badge save skipped:', e); }
    }

    // ────────────────────────────────────────────────────
    //  RENDER BADGES CARD
    // ────────────────────────────────────────────────────
    renderBadgesCard() {
        const definitions = this.getBadgeDefinitions();
        const earnedIds = this.computeEarnedBadges();
        const storedBadges = this.userData?.badges || [];
        // Merge earned with previously stored (badges never removed)
        const allEarned = new Set([...earnedIds, ...storedBadges]);

        // Save any newly earned
        if (earnedIds.length > storedBadges.length) {
            setTimeout(() => this.saveEarnedBadges([...allEarned]), 500);
        }

        const tierColors = {
            basic: { border: '#00d2ff', glow: 'rgba(0,210,255,0.35)', label: 'BASIC', labelColor: '#00d2ff' },
            premium: { border: '#c084fc', glow: 'rgba(192,132,252,0.35)', label: 'PREMIUM', labelColor: '#c084fc' },
            advanced: { border: '#fbbf24', glow: 'rgba(251,191,36,0.4)', label: 'ADVANCED', labelColor: '#fbbf24' }
        };

        const tiersOrder = ['basic', 'premium', 'advanced'];
        let html = `<div class="badges-card" style="grid-column: span 2;"><div class="section-title"><i class="fas fa-certificate"></i> Achievement Badges <span style="font-size:0.75rem;color:var(--text-secondary);font-weight:400;margin-left:0.5rem">${allEarned.size}/${definitions.length} earned</span></div>`;

        for (const tier of tiersOrder) {
            const tc = tierColors[tier];
            const tierBadges = definitions
                .filter(b => b.tier === tier)
                .sort((a, b) => {
                    const aEarned = allEarned.has(a.id) ? 0 : 1;
                    const bEarned = allEarned.has(b.id) ? 0 : 1;
                    return aEarned - bEarned;
                });
            html += `<div class="badges-tier-section">`;
            html += `<div class="badges-tier-label" style="color:${tc.labelColor}">`;
            const tierIcon = tier === 'basic' ? '◆' : tier === 'premium' ? '◈' : '✦';
            html += `<span>${tierIcon}</span> ${tc.label} TIER</div>`;
            html += `<div class="badges-grid">`;
            for (const badge of tierBadges) {
                const earned = allEarned.has(badge.id);
                const cls = earned ? 'badge-tile earned' : 'badge-tile locked';
                const glowStyle = earned ? `box-shadow: 0 0 20px ${tc.glow}, 0 4px 16px rgba(0,0,0,0.5); border-color: ${tc.border};` : '';
                html += `<div class="${cls}" style="${glowStyle}" title="${badge.name}: ${badge.desc}">`;
                html += `<div class="badge-svg-wrap">${badge.svg}</div>`;
                if (!earned) html += `<div class="badge-lock-overlay"><i class="fas fa-lock"></i></div>`;
                html += `<div class="badge-name">${badge.name}</div>`;
                html += `<div class="badge-tier-pill" style="color:${tc.labelColor};border-color:${tc.border}">${tc.label}</div>`;
                if (earned) html += `<div class="badge-earned-check" style="background:${tc.border}"><i class="fas fa-check"></i></div>`;
                html += `<div class="badge-tooltip"><strong>${badge.name}</strong><span>${badge.desc}</span></div>`;
                html += `</div>`;
            }
            html += `</div></div>`;
        }
        html += `</div>`;
        return html;
    }

    async init() {
        if (this.isInitialized) return;
        console.log("👤 Initializing Profile System...");
        this.setupEventListeners();

        // Instant Load from Cache (Before Auth)
        this.loadProfileFromCache();

        // Wait for Auth
        if (window.firebaseServices && window.firebaseServices.auth) {
            window.firebaseServices.auth.onAuthStateChanged(user => {
                if (user) {
                    this.loadProfile(user.uid);
                } else {
                    this.loadGuestProfile();
                }
            });
        } else {
            this.loadGuestProfile();
        }
        this.createParticles();
        this.isInitialized = true;
    }

    setupEventListeners() {
        // Auto-save on any input change
        document.addEventListener('input', (e) => {
            if (e.target.closest('.profile-wrapper') && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) {
                this.handleAutoSave();
            }
        });

        // Skill level slider sync
        document.addEventListener('input', (e) => {
            if (e.target.id === 'skill-level') {
                const label = document.getElementById('skill-level-label');
                const levels = ["Beginner", "Elementary", "Intermediate", "Advanced", "Expert"];
                if (label) label.innerText = levels[e.target.value - 1];
            }
        });

        // Enter key for adding skills
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.id === 'skill-input') {
                this.addSkill();
            }
        });

        // Auth Sync: Re-load whenever authentication is ready
        window.addEventListener('auth-ready', (e) => {
            console.log("🔐 Profile System: Auth-Ready signal received. Re-syncing cache...");
            this.loadProfileFromCache();
            const uid = e.detail?.user?.uid || e.detail?.id;
            if (uid) {
                this.loadProfile(uid);
            }
        });
    }

    renderAuthGuard() {
        return `
            <div class="auth-guard-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: calc(100vh - 200px); text-align: center; padding: 2rem;">
                <div class="lock-icon" style="font-size: 4rem; color: var(--accent-blue); margin-bottom: 2rem; filter: drop-shadow(0 0 15px var(--accent-blue));">
                    <i class="fas fa-user-shield"></i>
                </div>
                <h1 class="gradient-text" style="font-size: 2.5rem; margin-bottom: 1rem;">SECURE MATRiX AREA</h1>
                <p style="color: var(--text-dim); max-width: 400px; margin-bottom: 2.5rem; line-height: 1.6;">Access to student profiles is restricted to authenticated scholars. Please synchronize your identity to continue.</p>
                <div style="display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center;">
                    <button class="btn btn-primary" onclick="window.authModule?.showLogin?.() || location.reload()">
                        <i class="fas fa-sign-in-alt"></i> Access Matrix
                    </button>
                    <button class="btn btn-ghost" onclick="profileManager.loadGuestProfile()">
                        <i class="fas fa-user-secret"></i> Continue as Guest
                    </button>
                </div>
            </div>
        `;
    }

    getCacheKey() {
        const uid = this.getCurrentUid();
        return uid ? `profile_cache_${uid}` : 'profile_cache_guest';
    }

    loadProfileFromCache() {
        const cacheKey = this.getCacheKey();
        const cached = localStorage.getItem(cacheKey);

        if (cached) {
            try {
                this.userData = JSON.parse(cached);
                console.log("⚡ Profile loaded from cache:", cacheKey);
            } catch (e) {
                console.error("Cache parse error:", e);
                localStorage.removeItem(cacheKey);
            }
        }

        // If no profile specific cache, try to pull basic info from auth session
        if (!this.userData || (!this.userData.phone && !this.userData.college)) {
            const lastAuth = JSON.parse(localStorage.getItem('auth_user_full')) || {};
            if (lastAuth.uid || lastAuth.id) {
                const initial = this.getInitialData(lastAuth.uid || lastAuth.id);
                // Merge but DON'T overwrite existing fields if we had a partial cache
                this.userData = { ...initial, ...this.userData, ...lastAuth };
            }
        }

        if (this.userData) {
            this.updateActiveTabUI();
        }
    }

    loadGuestProfile() {
        console.log("👤 Loading Guest Profile...");
        const cacheKey = 'profile_cache_guest';
        const cached = localStorage.getItem(cacheKey);

        if (cached) {
            try {
                this.userData = JSON.parse(cached);
            } catch (e) {
                console.error("Guest cache error:", e);
                this.userData = this.getInitialData('guest');
            }
        } else {
            const guestFromSession = JSON.parse(localStorage.getItem('guest_session'));
            if (guestFromSession) {
                this.userData = { ...this.getInitialData(guestFromSession.id), ...guestFromSession };
            } else {
                this.userData = this.getInitialData('guest');
            }
        }
        this.updateActiveTabUI();
    }

    getCurrentUid() {
        if (window.firebaseServices?.auth?.currentUser) {
            return window.firebaseServices.auth.currentUser.uid;
        }
        try {
            const lastUser = JSON.parse(localStorage.getItem('auth_user_full')) || JSON.parse(localStorage.getItem('guest_session')) || {};
            return lastUser.id || lastUser.uid || (lastUser.id ? lastUser.id : null);
        } catch (e) {
            return null;
        }
    }

    updateActiveTabUI() {
        // Don't re-render while a save is in progress (prevents photo wipe race condition)
        if (this._isSaving) {
            console.log('⏸ updateActiveTabUI blocked during save');
            return;
        }
        const activeTab = document.querySelector('.nav-item.active')?.dataset.tab;
        console.log('🎯 Profile UI Update Triggered. Active Tab:', activeTab);

        if (activeTab === 'profile') {
            const contentArea = document.getElementById('tab-content');
            if (contentArea) {
                contentArea.innerHTML = this.render();
                if (this.userData) {
                    this.hydrateUI(this.userData);
                }
            } else {
                console.warn('⚠️ Profile UI Update failed: #tab-content not found in DOM');
            }
        }
    }

    async loadProfile(uid) {
        if (this._isSaving) {
            console.log('⏸ loadProfile blocked during save');
            return;
        }

        // PRIMARY: Load from Supabase profiles table
        try {
            const { supabase } = await import('./supabase-config.js?v=1.0');
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', uid)
                .single();

            if (!error && data) {
                // Auto-generate referral code if missing
                let refCode = data.referral_code || '';
                if (!refCode && data.email) {
                    refCode = this.generateReferralCode(data.email);
                    // Save it back
                    try {
                        const { supabase: sb2 } = await import('./supabase-config.js?v=1.0');
                        await sb2.from('profiles').update({ referral_code: refCode }).eq('id', data.id);
                    } catch (e) { }
                }
                // Map Supabase column names to userData fields
                const profileData = {
                    uid: data.id,
                    name: data.name || '',
                    email: data.email || '',
                    photo: data.avatar || '',
                    phone: data.phone || '',
                    countryCode: data.country_code || '',
                    gender: data.gender || '',
                    college: data.college || '',
                    program: data.program || '',
                    year: data.year || '',
                    branch: data.branch || '',
                    semester: data.semester || '',
                    skills: data.skills || [],
                    xp: data.xp || 0,
                    uploads: data.uploads || 0,
                    focusminutes: data.focusminutes || 0,
                    referral_code: refCode,
                    referral_count: data.referral_count || 0,
                    referral_points: data.referral_points || 0,
                    badges: data.badges || [],
                    stats: { notesUploaded: data.uploads || 0, downloads: 0, saved: 0 }
                };

                this.userData = profileData;
                localStorage.setItem(`profile_cache_${uid}`, JSON.stringify(profileData));

                // Sync avatar to sidebar immediately after loading
                if (profileData.photo) this.updateSidebarAvatar(profileData.photo);

                this.updateActiveTabUI();
                this.checkRankAndApplyCrown();
                this.fetchUserPlan(uid);
                console.log('✅ Profile loaded from Supabase');
                return;
            }
        } catch (sbErr) {
            console.warn('Supabase profile load failed, trying Firestore:', sbErr);
        }

        // FALLBACK: Load from Firestore
        try {
            if (!window.firebaseServices) return;
            const { db, doc, getDoc } = window.firebaseServices;
            const docRef = doc(db, 'users', uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const freshData = docSnap.data();
                const mergedData = { ...this.getInitialData(uid), ...freshData };
                if (!mergedData.photo && this.userData?.photo) mergedData.photo = this.userData.photo;
                this.userData = mergedData;
                localStorage.setItem(`profile_cache_${uid}`, JSON.stringify(this.userData));

                // Sync avatar to sidebar immediately after loading
                if (this.userData.photo) this.updateSidebarAvatar(this.userData.photo);

                this.updateActiveTabUI();
            } else {
                this.userData = this.getInitialData(uid);
            }
            this.hydrateUI(this.userData);
            this.checkRankAndApplyCrown();
            this.fetchUserPlan(uid);
        } catch (err) {
            console.error('Error loading profile:', err);
            if (!this.userData) this.loadGuestProfile();
        }
    }


    async checkRankAndApplyCrown() {
        if (!this.userData || !this.userData.email) return;
        try {
            if (!window.firebaseServices) return;
            const { db, collection, query, orderBy, limit, getDocs } = window.firebaseServices;

            const q = query(collection(db, 'users'), orderBy('xp', 'desc'), limit(1));
            const snapshot = await getDocs(q);

            let isRank1 = false;
            if (!snapshot.empty) {
                const topUser = snapshot.docs[0].data();
                isRank1 = (topUser.email === this.userData.email);
            }

            // ✅ PERSIST rank status in localStorage so crown survives refresh
            try {
                const cache = JSON.parse(localStorage.getItem('auth_user_full')) || {};
                cache.isRank1 = isRank1;
                localStorage.setItem('auth_user_full', JSON.stringify(cache));
            } catch (e) { }

            if (isRank1) {
                // --- Sidebar Crown (via new wrapper structure) ---
                const wrapperEl = document.getElementById('sidebar-avatar-wrapper');
                const avEl = document.getElementById('instant-avatar');
                if (wrapperEl && !wrapperEl.querySelector('.sidebar-crown')) {
                    const crownEl = document.createElement('div');
                    crownEl.className = 'sidebar-crown';
                    crownEl.innerText = '\uD83D\uDC51'; // 👑
                    wrapperEl.appendChild(crownEl);
                    // Gold glow ring on avatar
                    if (avEl) {
                        avEl.style.border = '2px solid gold';
                        avEl.style.boxShadow = '0 0 12px rgba(255,200,0,0.7), 0 0 24px rgba(255,200,0,0.4)';
                    }
                }

                // --- Profile Page Crown ---
                const profileImgContainer = document.querySelector('.profile-photo-container');
                if (profileImgContainer && !profileImgContainer.querySelector('.premium-crown')) {
                    const profileCrown = document.createElement('div');
                    profileCrown.className = 'premium-crown';
                    profileCrown.innerText = '\uD83D\uDC51';
                    profileCrown.style.cssText = [
                        'position: absolute',
                        'top: -18px',
                        'left: 50%',
                        'transform: translateX(-50%)',
                        'font-size: 2.2rem',
                        'line-height: 1',
                        'filter: drop-shadow(0 0 10px gold) drop-shadow(0 2px 12px rgba(255,200,0,0.9))',
                        'z-index: 10',
                        'pointer-events: none',
                        'animation: crownFloat 2.5s ease-in-out infinite'
                    ].join('; ');
                    profileImgContainer.style.position = 'relative';
                    profileImgContainer.style.overflow = 'visible';
                    profileImgContainer.appendChild(profileCrown);
                }
            }
        } catch (e) {
            console.warn('Crown check failed', e);
        }
    }


    getInitialData(uid) {
        const authData = JSON.parse(localStorage.getItem('auth_user_full')) || {};
        const email = authData.email || '';
        return {
            uid: uid,
            name: authData.name || '',
            email: email,
            countryCode: '',
            phone: '',
            gender: '',
            college: '',
            program: '',
            year: '',
            branch: '',
            semester: '',
            skills: [],
            xp: 0,
            uploads: 0,
            focusminutes: 0,
            referral_code: email ? this.generateReferralCode(email) : '',
            referral_count: 0,
            referral_points: 0,
            badges: [],
            stats: {
                notesUploaded: 0,
                downloads: 0,
                saved: 0
            }
        };
    }

    hydrateUI(data) {
        if (!data) return;

        // Header
        const greetingEl = document.getElementById('dynamic-greeting');
        if (greetingEl) greetingEl.innerText = this.getGreeting();

        const nameEl = document.getElementById('profile-name');
        if (nameEl) nameEl.innerText = data.name || 'Scholar';

        const emailEl = document.getElementById('profile-email');
        if (emailEl) emailEl.innerText = data.email || 'Email Address';

        const avatarImg = document.getElementById('profile-avatar-img');
        const fallback = document.getElementById('avatar-fallback');
        if (avatarImg && data.photo) {
            avatarImg.src = data.photo;
            avatarImg.style.display = 'block';
            if (fallback) fallback.style.display = 'none';
        } else if (fallback) {
            fallback.style.display = 'flex';
            fallback.innerText = (data.name || 'S').charAt(0);
            if (avatarImg) avatarImg.style.display = 'none';
        }

        // Form Fields
        this.setFieldValue('name-input', data.name);
        this.setFieldValue('country-code', data.countryCode);
        this.setFieldValue('phone-input', data.phone);
        this.setFieldValue('gender-select', data.gender);
        this.setFieldValue('college-input', data.college);
        this.setFieldValue('program-select', data.program);
        this.setFieldValue('year-select', data.year);
        this.setFieldValue('branch-input', data.branch);
        this.setFieldValue('semester-select', data.semester);

        // Skills
        this.renderSkills();
        this.updateRadarChart();

        // Completion
        this.updateCompletionRing();

        // Parallax Effect
        this.initParallax();

        // Load Activity Stats
        this.loadActivityStats();
    }

    async handlePhotoUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        this.showSavedIndicator('Uploading photo...');

        const reader = new FileReader();
        reader.onload = async (e) => {
            const img = new Image();
            img.onload = async () => {
                const canvas = document.createElement('canvas');
                const MAX_SIZE = 300;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
                } else {
                    if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
                }

                canvas.width = width;
                canvas.height = height;
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

                // Show preview immediately
                const avatarImg = document.getElementById('profile-avatar-img');
                const fallback = document.getElementById('avatar-fallback');
                if (avatarImg) { avatarImg.src = dataUrl; avatarImg.style.display = 'block'; }
                if (fallback) fallback.style.display = 'none';

                // Try to upload to Supabase Storage for a permanent URL
                try {
                    const uid = this.getCurrentUid() || 'guest';
                    const publicUrl = await this.uploadToSupabase(dataUrl, uid);
                    this.userData.photo = publicUrl;
                    // Also update sidebar avatar immediately
                    this.updateSidebarAvatar(publicUrl);
                    this.showSavedIndicator('Photo uploaded ✓ Click Save Changes');
                } catch (uploadErr) {
                    console.warn('Supabase upload failed, using base64 locally:', uploadErr);
                    // Fallback: store base64 locally until save
                    this.userData.photo = dataUrl;
                    this.showSavedIndicator('Photo ready – Click Save Changes');
                }

                // Ensure edit mode UI is active because we require clicking Save
                this.enterEditMode();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    async uploadToSupabase(dataUrl, uid) {
        const { supabase } = await import('./supabase-config.js?v=1.0');

        // Convert base64 data URL to blob
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const fileName = `avatar_${uid}_${Date.now()}.jpg`;

        const { data, error } = await supabase.storage
            .from('avatars')
            .upload(fileName, blob, {
                contentType: 'image/jpeg',
                upsert: true
            });

        if (error) throw error;

        // Get permanent public URL
        const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);

        return urlData.publicUrl;
    }

    updateSidebarAvatar(photoUrl) {
        // Update sidebar user avatar (handles both class-based and id-based avatars)
        const sidebarAvatars = document.querySelectorAll('.user-avatar, .sidebar-avatar, [data-user-avatar]');
        sidebarAvatars.forEach(el => {
            if (el.tagName === 'IMG') el.src = photoUrl;
            else el.style.backgroundImage = `url('${photoUrl}')`;
        });

        // Update any avatar in the bottom sidebar user card
        const sidebarUserImg = document.querySelector('.sidebar-user-info img, .user-card img, .nav-user img');
        if (sidebarUserImg) sidebarUserImg.src = photoUrl;

        // NEW: Update instant-avatar used in pro dashboard
        const instantAvatar = document.getElementById('instant-avatar');
        if (instantAvatar) {
            const fallbackChar = (this.userData?.name || 'U').charAt(0).toUpperCase();
            instantAvatar.innerHTML = `<img src="${photoUrl}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;" onerror="this.style.display='none'; this.parentElement.innerText='${fallbackChar}'">`;
        }

        // Store in auth cache so it persists on reload
        try {
            const authCache = JSON.parse(localStorage.getItem('auth_user_full')) || {};
            authCache.photo = photoUrl;
            authCache.photoURL = photoUrl;
            localStorage.setItem('auth_user_full', JSON.stringify(authCache));
        } catch (e) { }
    }

    async loadActivityStats() {
        if (!this.userData || !window.firebaseServices) return;
        const { db, collection, query, where, getDocs } = window.firebaseServices;

        try {
            const q = query(collection(db, 'notes'), where('uploadedBy', '==', this.userData.uid));
            const snapshot = await getDocs(q);
            let uploads = 0;
            let downloads = 0;
            snapshot.forEach(doc => {
                uploads++;
                downloads += (doc.data().downloads || 0);
            });

            const uploadEl = document.getElementById('stat-uploads');
            const downloadEl = document.getElementById('stat-downloads');
            const savedEl = document.getElementById('stat-saved');

            if (uploadEl) uploadEl.innerText = uploads;
            if (downloadEl) downloadEl.innerText = downloads;
            if (savedEl) savedEl.innerText = window.savedNoteIds ? window.savedNoteIds.size : (this.userData.stats?.saved || 0);

            // Calculate rank dynamically based on xp
            const xp = this.userData.xp || 0;
            const level = Math.floor(xp / 100) + 1;
            const levelEl = document.getElementById('stat-level');
            const rankEl = document.getElementById('stat-rank');

            if (levelEl) levelEl.innerText = `LVL ${level}`;
            if (rankEl) rankEl.innerText = level > 10 ? 'Elite Scholar' : (level > 5 ? 'Pro Scholar' : 'Scholar Rank');

        } catch (e) {
            console.error("Error loading stats:", e);
        }
    }

    setFieldValue(id, value) {
        const el = document.getElementById(id);
        if (el) el.value = value || '';
    }

    getGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return "GOOD MORNING 🌅";
        if (hour < 17) return "GOOD AFTERNOON 🌤️";
        if (hour < 21) return "GOOD EVENING 🌆";
        return "GOOD NIGHT 🌙";
    }

    renderSkills() {
        const container = document.getElementById('skill-tags-container');
        if (!container) return;

        container.innerHTML = this.userData.skills.map((s, idx) => `
            <div class="skill-tag" data-idx="${idx}">
                <span>${s.name}</span>
                <span style="font-size: 0.7rem; opacity: 0.7;">Lvl ${s.level}</span>
                <i class="fas fa-times" onclick="window.profileManager.removeSkill(${idx})"></i>
            </div>
        `).join('');
    }

    addSkill() {
        const nameInput = document.getElementById('skill-input');
        const levelInput = document.getElementById('skill-level');

        if (!nameInput || !nameInput.value.trim()) return;

        this.userData.skills.push({
            name: nameInput.value.trim(),
            level: parseInt(levelInput.value)
        });

        nameInput.value = '';
        this.renderSkills();
        this.updateRadarChart();
        this.handleAutoSave();
    }

    removeSkill(idx) {
        this.userData.skills.splice(idx, 1);
        this.renderSkills();
        this.updateRadarChart();
        this.saveData();
    }

    updateRadarChart() {
        const canvas = document.getElementById('skills-radar');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const labels = this.userData.skills.map(s => s.name);
        const values = this.userData.skills.map(s => s.level);

        // If no skills, show a placeholder triangle
        const chartLabels = labels.length > 0 ? labels : ['Skill A', 'Skill B', 'Skill C'];
        const chartValues = values.length > 0 ? values : [3, 3, 3];

        // PRO FIX: Destroy old chart to avoid rendering artifacts or invisible canvases
        if (this.radarChart) {
            this.radarChart.destroy();
            this.radarChart = null;
        }

        this.radarChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: chartLabels,
                datasets: [{
                    label: 'Skill Level',
                    data: chartValues,
                    backgroundColor: 'rgba(0, 210, 255, 0.2)',
                    borderColor: '#00d2ff',
                    pointBackgroundColor: '#00d2ff',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#00d2ff',
                    borderWidth: 3,
                    tension: 0.2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        min: 0,
                        max: 5,
                        ticks: { display: false, stepSize: 1 },
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        angleLines: { color: 'rgba(255,255,255,0.1)' },
                        pointLabels: {
                            color: 'rgba(255,255,255,0.8)',
                            font: {
                                size: 12,
                                family: 'Inter, sans-serif',
                                weight: 'bold'
                            }
                        }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(10, 15, 20, 0.95)',
                        titleColor: '#00d2ff',
                        bodyColor: '#fff',
                        borderColor: 'rgba(0, 210, 255, 0.5)',
                        borderWidth: 1
                    }
                }
            }
        });
    }

    enterEditMode() {
        const wrapper = document.getElementById('profile-wrapper-root');
        if (wrapper) wrapper.classList.add('mode-editing');
        const editBtn = document.getElementById('edit-profile-btn');
        const saveBtn = document.getElementById('save-profile-btn');
        const cancelBtn = document.getElementById('cancel-edit-btn');
        if (editBtn) editBtn.style.display = 'none';
        if (saveBtn) saveBtn.style.display = 'inline-flex';
        if (cancelBtn) cancelBtn.style.display = 'inline-flex';
        // Allow avatar click in edit mode
        const avatarZone = document.getElementById('avatar-click-zone');
        if (avatarZone) avatarZone.style.cursor = 'pointer';
        // Store snapshot for cancel
        this._editSnapshot = JSON.stringify(this.userData);
    }

    cancelEditMode() {
        // Restore snapshot only if user clicked Cancel (not after save)
        if (this._editSnapshot) {
            this.userData = JSON.parse(this._editSnapshot);
            this.hydrateUI(this.userData);
        }
        this._exitEditModeUI();
    }

    _exitEditModeUI() {
        const wrapper = document.getElementById('profile-wrapper-root');
        if (wrapper) wrapper.classList.remove('mode-editing');
        const editBtn = document.getElementById('edit-profile-btn');
        const saveBtn = document.getElementById('save-profile-btn');
        const cancelBtn = document.getElementById('cancel-edit-btn');
        if (editBtn) editBtn.style.display = 'inline-flex';
        if (saveBtn) saveBtn.style.display = 'none';
        if (cancelBtn) cancelBtn.style.display = 'none';
        const avatarZone = document.getElementById('avatar-click-zone');
        if (avatarZone) avatarZone.style.cursor = 'default';
    }

    onAvatarClick() {
        const wrapper = document.getElementById('profile-wrapper-root');
        if (wrapper && wrapper.classList.contains('mode-editing')) {
            document.getElementById('profile-photo-upload').click();
        }
    }

    handleAutoSave() {
        // Auto-save disabled per request. Manual save button handles it.
        this.updateCompletionRing();
    }

    async saveData() {
        const form = document.querySelector('.profile-wrapper');
        if (!form || !this.userData) return;

        this._isSaving = true;
        this.showSavedIndicator('Saving...');

        // Collect fresh values from form fields
        this.userData.name = document.getElementById('name-input')?.value || this.userData.name;
        this.userData.countryCode = document.getElementById('country-code')?.value ?? this.userData.countryCode;
        this.userData.phone = document.getElementById('phone-input')?.value ?? this.userData.phone;
        this.userData.gender = document.getElementById('gender-select')?.value ?? this.userData.gender;
        this.userData.college = document.getElementById('college-input')?.value ?? this.userData.college;
        this.userData.program = document.getElementById('program-select')?.value ?? this.userData.program;
        this.userData.year = document.getElementById('year-select')?.value ?? this.userData.year;
        this.userData.branch = document.getElementById('branch-input')?.value ?? this.userData.branch;
        this.userData.semester = document.getElementById('semester-select')?.value ?? this.userData.semester;
        this.userData.skills = this.userData.skills || [];

        const uid = this.userData.uid || this.getCurrentUid();
        const photo = this.userData.photo || '';

        try {
            // PRIMARY SAVE: Supabase profiles table
            const { supabase } = await import('./supabase-config.js?v=1.0');

            // Ensure referral code is generated before save
            if (!this.userData.referral_code && this.userData.email) {
                this.userData.referral_code = this.generateReferralCode(this.userData.email);
            }

            const profileRow = {
                id: uid,
                email: this.userData.email || '',
                name: this.userData.name || '',
                avatar: photo,
                phone: this.userData.phone || '',
                country_code: this.userData.countryCode || '',
                gender: this.userData.gender || '',
                college: this.userData.college || '',
                program: this.userData.program || '',
                year: this.userData.year || '',
                branch: this.userData.branch || '',
                semester: this.userData.semester || '',
                skills: this.userData.skills || [],
                xp: this.userData.xp || 0,
                uploads: this.userData.uploads || 0,
                focusminutes: this.userData.focusminutes || 0,
                referral_code: this.userData.referral_code || '',
                badges: this.computeEarnedBadges()
            };

            const { error: upsertError } = await supabase
                .from('profiles')
                .upsert(profileRow, { onConflict: 'id' });

            if (upsertError) {
                console.error('Supabase profiles upsert error:', upsertError);
                throw upsertError;
            }
            console.log('✅ Supabase profiles saved');

            // Also update the leaderboard users table
            try {
                const isBase64 = photo.startsWith('data:');
                const lbUpdate = {
                    name: this.userData.name || '',
                    collegename: this.userData.college || 'Unknown'
                };
                if (photo && !isBase64) lbUpdate.avatar = photo;
                await supabase.from('users').update(lbUpdate).eq('email', this.userData.email);
            } catch (e) { console.warn('Leaderboard users sync skipped:', e); }

            // Secondary backup: Firestore
            try {
                if (window.firebaseServices?.auth?.currentUser) {
                    const { db, doc, setDoc } = window.firebaseServices;
                    const fsData = {
                        name: this.userData.name, email: this.userData.email,
                        photo, college: this.userData.college, phone: this.userData.phone,
                        gender: this.userData.gender, program: this.userData.program,
                        year: this.userData.year, branch: this.userData.branch,
                        semester: this.userData.semester, skills: this.userData.skills,
                        countryCode: this.userData.countryCode
                    };
                    await setDoc(doc(db, 'users', uid), fsData, { merge: true });
                }
            } catch (e) { console.warn('Firestore backup skipped:', e); }

            // Update local cache
            localStorage.setItem(`profile_cache_${uid}`, JSON.stringify(this.userData));
            // Persist photo in auth cache so sidebar reflects it
            if (photo) this.updateSidebarAvatar(photo);

            this.showSavedIndicator('Saved ✓');
            this._editSnapshot = null;
            this._exitEditModeUI();

            // Re-render avatar
            const avatarImg = document.getElementById('profile-avatar-img');
            const fallback = document.getElementById('avatar-fallback');
            if (avatarImg && photo) {
                avatarImg.src = photo;
                avatarImg.style.display = 'block';
                if (fallback) fallback.style.display = 'none';
            }

        } catch (err) {
            console.error('🔥 Save Error:', err);
            this.showSavedIndicator('Save Failed – ' + (err.message || 'Check console'), 'error');
        } finally {
            setTimeout(() => { this._isSaving = false; }, 3000);
        }

        this.updateCompletionRing();
    }

    showSavedIndicator(text, mode = "success") {
        const el = document.getElementById('saved-indicator');
        if (el) {
            el.innerHTML = `<i class="fas ${mode === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${text}`;
            el.style.background = mode === 'success' ? '#00ff88' : '#ff4757';
            el.classList.add('active');
            if (text.includes('✓')) {
                setTimeout(() => el.classList.remove('active'), 2000);
            }
        }
    }

    updateCompletionRing() {
        const fields = ['phone', 'gender', 'college', 'program', 'year', 'branch', 'semester'];
        let filled = fields.filter(f => this.userData[f]).length;
        if (this.userData.skills.length > 0) filled++;

        const percentage = Math.round((filled / (fields.length + 1)) * 100);
        const ring = document.getElementById('completion-progress');
        const text = document.getElementById('completion-text');

        if (ring) {
            const computedStyle = window.getComputedStyle(ring);
            const r = parseFloat(computedStyle.r) || parseFloat(ring.getAttribute('r')) || 45;
            const circumference = 2 * Math.PI * r;
            const offset = circumference - (percentage / 100) * circumference;
            ring.style.strokeDasharray = `${circumference} ${circumference}`;
            ring.style.strokeDashoffset = offset;
        }
        if (text) text.innerText = `${percentage}%`;
    }

    initParallax() {
        if (this.parallaxInitialized) return;

        const cards = document.querySelectorAll('.glass-card, .profile-header-card');
        document.addEventListener('mousemove', (e) => {
            // Only update if profile wrapper is in view to save CPU
            if (!document.querySelector('.profile-wrapper')) return;

            const x = (window.innerWidth / 2 - e.pageX) / 80; // Subtle movement
            const y = (window.innerHeight / 2 - e.pageY) / 80;

            const activeCards = document.querySelectorAll('.glass-card, .profile-header-card');
            activeCards.forEach(card => {
                card.style.transform = `translateX(${x}px) translateY(${y}px)`;
            });
        });

        // Vanilla Tilt Integration
        this.initTilt();
        this.parallaxInitialized = true;
    }

    initTilt() {
        if (window.VanillaTilt) {
            VanillaTilt.init(document.querySelectorAll("[data-tilt]"), {
                max: 5,
                speed: 400,
                glare: true,
                "max-glare": 0.2,
            });
        }
    }

    createParticles() {
        if (document.querySelector('.particle')) return; // Already exists

        const wrapper = document.querySelector('.profile-wrapper');
        const particleCount = 20;
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            Object.assign(particle.style, {
                position: 'fixed',
                background: Math.random() > 0.5 ? 'var(--accent-blue)' : 'var(--accent-purple)',
                width: Math.random() * 4 + 'px',
                height: Math.random() * 4 + 'px',
                borderRadius: '50%',
                top: Math.random() * 100 + 'vh',
                left: Math.random() * 100 + 'vw',
                opacity: Math.random() * 0.5,
                pointerEvents: 'none',
                zIndex: -1,
                filter: 'blur(1px)'
            });
            document.body.appendChild(particle);

            this.animateParticle(particle);
        }
    }

    animateParticle(p) {
        const duration = Math.random() * 20000 + 10000;
        const xDir = Math.random() > 0.5 ? 1 : -1;
        const yDir = Math.random() > 0.5 ? 1 : -1;

        p.animate([
            { transform: 'translate(0, 0)' },
            { transform: `translate(${xDir * 100}px, ${yDir * 100}px)` },
            { transform: 'translate(0, 0)' }
        ], {
            duration: duration,
            iterations: Infinity
        });
    }

    renderAuthGuard() {
        return `
            <div class="profile-auth-guard">
                <div class="guard-card glass-card">
                    <div class="guard-icon">
                        <i class="fas fa-lock-open"></i>
                    </div>
                    <h1>Unlock Your <span class="accent-text">SKiL MATRiX</span></h1>
                    <p class="guard-subtitle">Sign in to track your progress, build your skill radar, and sync your data across all devices.</p>
                    
                    <div class="feature-highlights">
                        <div class="feature-item">
                            <i class="fas fa-microchip"></i>
                            <div>
                                <h4>AI-Powered Skill Radar</h4>
                                <p>Visualize your technical growth in real-time.</p>
                            </div>
                        </div>
                        <div class="feature-item">
                            <i class="fas fa-cloud-upload-alt"></i>
                            <div>
                                <h4>Lifetime Cloud Sync</h4>
                                <p>Never lose your profile data or achievements.</p>
                            </div>
                        </div>
                        <div class="feature-item">
                            <i class="fas fa-certificate"></i>
                            <div>
                                <h4>Verified Scholar Profile</h4>
                                <p>Showcase your expertise with a premium dashboard.</p>
                            </div>
                        </div>
                    </div>

                    <button class="btn btn-primary guard-btn" onclick="window.profileManager.triggerLogin()">
                        <i class="fas fa-sign-in-alt"></i> Access My Profile
                    </button>
                    
                    <p class="guard-footer">Join thousands of scholars already leveling up.</p>
                </div>
            </div>
        `;
    }

    triggerLogin() {
        // Redirect to the auth page (auth.html is located in the pages/ directory)
        window.location.href = 'auth.html';
    }
}

// Global instance
window.profileManager = new ProfileManager();
