/**
 * SKiL MATRiX - Advanced Profile System
 * Handles data persistence, real-time sync, and interactive UI logic.
 */

class ProfileManager {
    constructor() {
        this.userData = null;
        this.saveTimeout = null;
        this.radarChart = null;
        this.userData = null;
        this.saveTimeout = null;
        this.radarChart = null;
        this.isInitialized = false; 
        this.parallaxInitialized = false;
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
            <div class="profile-wrapper fade-in mode-editing">
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

                    <div class="profile-avatar-container">
                        <div class="avatar-glow"></div>
                        <div id="avatar-fallback" class="avatar-fallback" style="${this.userData?.photo ? 'display:none' : 'display:flex'}">
                            ${this.userData?.name?.charAt(0) || 'S'}
                        </div>
                        <img src="${this.userData?.photo || ''}" class="avatar-main" id="profile-avatar-img" 
                             style="${this.userData?.photo ? 'display:block' : 'display:none'}"
                             onerror="this.style.display='none'; document.getElementById('avatar-fallback').style.display='flex'">
                    </div>

                    <div class="profile-info">
                        <div class="greeting-row">
                            <div class="greeting-text" id="dynamic-greeting">${this.getGreeting()}</div>
                        </div>
                        <h1 class="user-name" id="profile-name">${(this.userData?.name || 'Scholar').toUpperCase()}</h1>
                        <p class="user-email" id="profile-email">${this.userData?.email || 'Student ID'}</p>
                        <div class="profile-header-btns">
                            <button class="btn btn-ghost btn-sm" onclick="handleLogout()">
                                <i class="fas fa-sign-out-alt"></i> Logout
                            </button>
                        </div>
                    </div>
                </div>

                <div class="profile-grid">
                    <!-- Contact Info -->
                    <div class="glass-card">
                        <div class="section-title"><i class="fas fa-id-card"></i> Contact Info</div>
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

                    <!-- Activity Hub -->
                    <div class="glass-card" style="grid-column: span 2;">
                        <div class="section-title"><i class="fas fa-chart-line"></i> Notes & Activity Hub</div>
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
                                <div class="stat-value">LVL 12</div>
                                <div class="stat-label">Scholar Rank</div>
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
        const activeTab = document.querySelector('.nav-item.active')?.dataset.tab;
        console.log("🎯 Profile UI Update Triggered. Active Tab:", activeTab);
        
        if (activeTab === 'profile') {
            const contentArea = document.getElementById('tab-content');
            if (contentArea) {
                contentArea.innerHTML = this.render();
                if (this.userData) {
                    this.hydrateUI(this.userData);
                }
            } else {
                console.warn("⚠️ Profile UI Update failed: #tab-content not found in DOM");
            }
        }
    }

    async loadProfile(uid) {
        const { db, doc, getDoc } = window.firebaseServices;
        try {
            const docRef = doc(db, 'users', uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const freshData = docSnap.data();
                // Ensure we merge with initial structure to avoid missing fields
                const mergedData = { ...this.getInitialData(uid), ...freshData };
                
                // Only update and re-render if data has actually changed from cache
                // AND we aren't currently in the middle of an upload (to prevent flicker)
                if (!this.userData?.isUploading && JSON.stringify(this.userData) !== JSON.stringify(mergedData)) {
                    this.userData = mergedData;
                    localStorage.setItem(`profile_cache_${uid}`, JSON.stringify(this.userData));
                    this.updateActiveTabUI();
                    console.log("🔄 Profile synced with cloud");
                }
                
                this.hydrateUI(this.userData);
            } else {
                console.log("No profile found, initializing new profile...");
                this.userData = this.getInitialData(uid);
                this.hydrateUI(this.userData);
            }
        } catch (err) {
            console.error("Error loading profile:", err);
            if (!this.userData) this.loadGuestProfile();
        }
    }


    getInitialData(uid) {
        const authData = JSON.parse(localStorage.getItem('auth_user_full')) || {};
        return {
            uid: uid,
            name: authData.name || '',
            email: authData.email || '',
            countryCode: '',
            phone: '',
            gender: '',
            college: '',
            program: '',
            year: '',
            branch: '',
            semester: '',
            skills: [],
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

    handleAutoSave() {
        clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => this.saveData(), 1000);
    }

    async saveData() {
        // Collect fresh data from inputs ONLY if they exist in the DOM
        const form = document.querySelector('.profile-wrapper');
        if (!form || !this.userData) return;

        // CRITICAL: Prevent saving if we are in a 'loader' state or haven't loaded data yet
        const phoneField = document.getElementById('phone-input');
        if (!phoneField) return; 

        // Check if we are accidentally saving empty values while background sync is pending
        // Check if critical fields are empty but we know we have data, abort.
        if (!phoneField.value && this.userData.phone) {
             console.warn("🛑 Aborting save: DOM fields appear empty but userData has values.");
             return;
        }

        this.showSavedIndicator("Syncing...");

        this.userData.countryCode = document.getElementById('country-code')?.value;
        this.userData.phone = document.getElementById('phone-input')?.value;
        this.userData.gender = document.getElementById('gender-select')?.value;
        this.userData.college = document.getElementById('college-input')?.value;
        this.userData.program = document.getElementById('program-select')?.value;
        this.userData.year = document.getElementById('year-select')?.value;
        this.userData.branch = document.getElementById('branch-input')?.value;
        this.userData.semester = document.getElementById('semester-select')?.value;

        // Collect skills from DOM if necessary or keep existing
        this.userData.skills = this.userData.skills || [];

        // Persist
        try {
            if (window.firebaseServices && window.firebaseServices.auth.currentUser) {
                const { db, doc, setDoc } = window.firebaseServices;
                const uid = window.firebaseServices.auth.currentUser.uid;
                
                // STRICT LOGIC: Only save real database fields
                const firestoreData = {
                    name: this.userData.name || '',
                    email: this.userData.email || '',
                    countryCode: this.userData.countryCode || '',
                    phone: this.userData.phone || '',
                    gender: this.userData.gender || '',
                    college: this.userData.college || '',
                    program: this.userData.program || '',
                    year: this.userData.year || '',
                    branch: this.userData.branch || '',
                    semester: this.userData.semester || '',
                    skills: this.userData.skills || [],
                    stats: this.userData.stats || { uploads: 0, downloads: 0, saved: 0 }
                };

                // Add photo only if it's a permanent link
                if (this.userData.photo && !this.userData.photo.startsWith('blob:')) {
                    firestoreData.photo = this.userData.photo;
                }

                await setDoc(doc(db, 'users', uid), firestoreData, { merge: true });
                // Update local specific cache too
                localStorage.setItem(`profile_cache_${uid}`, JSON.stringify(this.userData));
                console.log("✅ Firestore Sync Success");
            } else {
                localStorage.setItem('profile_cache_guest', JSON.stringify(this.userData));
            }
            this.showSavedIndicator("Saved ✓");
        } catch (err) {
            console.error("🔥 Firestore Sync Error:", err);
            this.showSavedIndicator("Save Failed", "error");
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
