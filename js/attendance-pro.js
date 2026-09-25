/**
 * SKiL MATRiX – Attendance Pro (v2.1)
 * Systematic UI Refinement
 */

const AttendancePro = {
    state: {
        subjects: [],
        target: 75,
        history: {},
        timetable: {
            'Mon': [], 'Tue': [], 'Wed': [], 'Thu': [], 'Fri': [], 'Sat': [], 'Sun': []
        },
        activeTab: 'calendar',
        selectedDates: [(() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`; })()],
        viewMonth: new Date().getMonth(),
        viewYear: new Date().getFullYear(),
        isEditingTimetable: false,
        notifiedSubjects: {},
        lastSync: null
    },

    toggleWeeklyEmail(isEnabled) {
        localStorage.setItem('setting_notifications_weekly_attendance', isEnabled ? 'true' : 'false');
        if (window.showToast) {
            window.showToast(isEnabled ? 'Weekly attendance email enabled!' : 'Weekly attendance email disabled.', 'success');
        }
    },

    async init() {
        await this.loadData();
        const now = new Date();
        this.state.viewMonth = now.getMonth();
        this.state.viewYear = now.getFullYear();
        this.state.selectedDates = [`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`];
        this.state.activeTab = 'calendar';
        this.refreshUI();
        console.log('🚀 Attendance Pro Systematic UI Initialized');
        
        // Handle late auth initialization
        if (!window.currentUser) {
            document.addEventListener('userStateChanged', () => {
                console.log("👤 User detected, re-syncing cloud data...");
                this.loadData();
            });
        }
    },

    getStorageKey() {
        try {
            let user = JSON.parse(localStorage.getItem('auth_user_full'));
            if (!user) user = JSON.parse(localStorage.getItem('guest_session'));
            
            const userId = user ? (user.email || user.uid || user.id || 'guest') : 'guest';
            const safeId = userId.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
            return `atpro_data_v2_${safeId}`;
        } catch (e) {
            return 'atpro_data_v2_guest';
        }
    },

    async loadData() {
        const key = this.getStorageKey();
        
        // 1. Try Local Storage first
        const saved = localStorage.getItem(key);
        if (saved) {
            const parsed = JSON.parse(saved);
            delete parsed.viewMonth;
            delete parsed.viewYear;
            delete parsed.activeTab;
            delete parsed.selectedDates;
            this.state = { ...this.state, ...parsed };
        }

        // 2. Try Cloud Sync (Firestore)
        if (window.db && window.currentUser && !window.currentUser.isGuest) {
            try {
                const docRef = window.doc(window.db, "attendance", window.currentUser.uid);
                const docSnap = await window.getDoc(docRef);
                if (docSnap.exists()) {
                    const cloudData = docSnap.data();
                    delete cloudData.viewMonth;
                    delete cloudData.viewYear;
                    delete cloudData.activeTab;
                    delete cloudData.selectedDates;
                    // Merge cloud data (priority)
                    this.state = { ...this.state, ...cloudData };
                    localStorage.setItem(key, JSON.stringify(this.state));
                    this.refreshUI();
                }
            } catch (e) {
                console.warn("☁️ Cloud load failed, using local fallback", e);
            }
        }

        if (this.state.subjects.length === 0 && !saved) {
            this.state.subjects = [];
            this.saveData();
        }
    },

    async saveData() {
        const key = this.getStorageKey();
        this.state.lastSync = new Date().toISOString();
        
        // 1. Local Save
        localStorage.setItem(key, JSON.stringify(this.state));
        
        // 2. Cloud Save
        if (window.db && window.currentUser && !window.currentUser.isGuest) {
            try {
                const docRef = window.doc(window.db, "attendance", window.currentUser.uid);
                await window.setDoc(docRef, this.state);
            } catch (e) {
                console.error("☁️ Cloud save failed:", e);
            }
        }
        
        this.checkAttendanceThresholds();
        
        // Trigger weekly mail evaluation ONLY on interaction
        if (typeof window.sendWeeklyMailIfEligible === 'function') {
            window.sendWeeklyMailIfEligible();
        }
    },

    checkAttendanceThresholds() {
        if (!window.createNotification || !window.currentUser || window.currentUser.isGuest) return;

        if (!this.state.notifiedSubjects) this.state.notifiedSubjects = {};

        this.state.subjects.forEach(sub => {
            const stats = this.calculateStats(sub.id);
            if (!stats) return;
            const percent = parseFloat(stats.percent);
            
            if (percent < 75 && stats.total > 0) {
                const lastNotifiedPercent = this.state.notifiedSubjects[sub.id] || 100;
                
                if (lastNotifiedPercent >= 75 || (lastNotifiedPercent - percent) >= 1) {
                    window.createNotification(window.currentUser.id || window.currentUser.uid, {
                        title: "Low Attendance Alert ⚠️",
                        message: `Your attendance in ${sub.name} has dropped to ${percent}%. Keep it above 75%!`,
                        type: "warning",
                        category: "academic"
                    });
                    this.state.notifiedSubjects[sub.id] = percent;
                    // Note: No saveData() here to avoid recursion, it's called after this
                }
            } else if (percent >= 75) {
                delete this.state.notifiedSubjects[sub.id];
            }
        });
    },

    calculateStats(subjectId) {
        const sub = this.state.subjects.find(s => s.id === subjectId);
        if (!sub) return null;

        // Ensure counts aren't negative
        const attended = Math.max(0, sub.attended);
        const missed = Math.max(0, sub.missed);
        const off = Math.max(0, sub.off);

        const total = attended + missed;
        let percent = total === 0 ? 0 : (attended / total) * 100;

        // Clamp percentage
        percent = Math.min(100, Math.max(0, percent));

        const target = this.state.target / 100;
        let canMiss = 0, need = 0;
        if (percent >= this.state.target) {
            canMiss = Math.floor((attended / target) - total);
        } else {
            need = Math.ceil((target * total - attended) / (1 - target));
        }

        return {
            percent: (percent % 1 === 0) ? percent.toFixed(0) : percent.toFixed(2),
            rawPercent: percent,
            attended, missed, off, total,
            canMiss: Math.max(0, canMiss), need: Math.max(0, need),
            status: percent >= this.state.target ? 'safe' : (percent >= this.state.target - 5 ? 'warning' : 'critical')
        };
    },

    getOverallStats() {
        let att = 0, miss = 0;
        this.state.subjects.forEach(s => {
            att += Math.max(0, s.attended);
            miss += Math.max(0, s.missed);
        });
        const total = att + miss;
        let percent = total === 0 ? 0 : (att / total) * 100;
        percent = Math.min(100, Math.max(0, percent));
        const formattedPercent = (percent % 1 === 0) ? percent.toFixed(0) : percent.toFixed(2);
        return { percent: formattedPercent, rawPercent: percent, total };
    },

    setTab(tabId) {
        this.state.activeTab = tabId;
        if (tabId === 'calendar') {
            const now = new Date();
            this.state.viewMonth = now.getMonth();
            this.state.viewYear = now.getFullYear();
        }
        this.refreshUI();
        
        // Ensure the active tab is visible and centered on mobile
        setTimeout(() => {
            const activeItem = document.querySelector('.atpro-nav-item.active');
            if (activeItem) {
                activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }, 50);
    },

    render() {
        const overall = this.getOverallStats();
        const isTimetable = this.state.activeTab === 'timetable';
        const container = document.createElement('div');
        container.className = `attendance-container fade-in ${isTimetable ? 'timetable-active' : ''}`;

        container.innerHTML = `
            <div class="atpro-top-section">
                <div class="atpro-header-row">
                    <div class="atpro-title">
                        <h2 class="font-heading atpro-premium-title">Attendance <span class="atpro-glow-text">Pro</span></h2>
                        <p style="font-size:0.75rem; color:var(--text-dim); margin-top:4px">Sync: ${new Date(this.state.lastSync).toLocaleTimeString()}</p>
                    </div>
                    <div class="atpro-header-actions">
                        <div class="atpro-stat-pill">
                            ${overall.percent}% | Target: ${this.state.target}%
                        </div>
                        <button class="atpro-btn-icon" onclick="AttendancePro.openSubjectModal()" title="Add Subject">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>

                <div class="atpro-nav-wrapper" style="width:100%; display:flex; flex-direction:column; gap:8px">
                    <div class="atpro-nav" onscroll="AttendancePro.syncScroll(this)">
                        ${this.renderNavItem('today', 'fas fa-calendar-day', 'Today')}
                        ${this.renderNavItem('timetable', 'fas fa-th', 'Timetable')}
                        ${this.renderNavItem('calendar', 'fas fa-calendar-alt', 'Calendar')}
                        ${this.renderNavItem('subjects', 'fas fa-list', 'Subjects')}
                        ${this.renderNavItem('settings', 'fas fa-cog', 'Settings')}
                    </div>
                    <div class="atpro-scroll-indicator" style="width:100px; height:4px; background:rgba(0,0,0,0.3); border-radius:10px; align-self:center; display:none; position:relative; overflow:hidden;">
                        <div id="atpro-nav-thumb" style="position:absolute; top:0; left:0; height:100%; width:30px; background:rgba(255,255,255,0.8); border-radius:10px; transition: left 0.1s ease;"></div>
                    </div>
                </div>
            </div>

            <div class="atpro-view-card">
                ${this.renderView()}
            </div>

            <div class="atpro-overlay" id="atpro-overlay" onclick="AttendancePro.closeModal()"></div>
            <div class="atpro-sheet" id="atpro-sheet"></div>
        `;
        return container.outerHTML;
    },

    renderNavItem(id, icon, label) {
        return `
            <div class="atpro-nav-item ${this.state.activeTab === id ? 'active' : ''}" onclick="AttendancePro.setTab('${id}')">
                <i class="${icon}"></i> ${label}
            </div>
        `;
    },

    renderView() {
        switch (this.state.activeTab) {
            case 'today': return this.renderToday();
            case 'timetable': return this.renderTimetable();
            case 'calendar': return this.renderCalendar();
            case 'subjects': return this.renderSubjects();
            case 'settings': return this.renderSettings();
            default: return this.renderToday();
        }
    },

    renderToday() {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const now = new Date();
        const dayName = days[now.getDay()];
        const lectures = this.state.timetable[dayName] || [];
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        if (lectures.length === 0) {
            return `
                <div class="atpro-today-hero" style="padding: 4rem 1rem; text-align: center; animation: atproFadeIn 0.8s ease;">
                    <div class="atpro-today-icon" style="font-size: 5rem; margin-bottom: 1.5rem; filter: drop-shadow(0 0 20px rgba(0, 242, 255, 0.2));">🏝️</div>
                    <h2 class="font-heading" style="font-size: 2rem; margin-bottom: 1rem">It's your day off!</h2>
                    <p style="color:var(--text-dim); max-width: 450px; margin: 0 auto; line-height: 1.6">No lectures scheduled for today. Take a well-deserved break or organize your upcoming week in the <strong>Timetable</strong> tab.</p>
                </div>
            `;
        }

        return `
            <div class="atpro-today-header">
                <div class="atpro-today-titles">
                    <h3 class="font-heading">${dayName}'s <span class="gradient-text">Schedule</span></h3>
                    <p>Mark your attendance for today's sessions.</p>
                </div>
                <div class="atpro-today-date">
                    ${now.toLocaleDateString('default', { day: 'numeric', month: 'short' })}
                </div>
            </div>
            <div class="atpro-day-lectures-list" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:15px">
                ${lectures.map(lec => this.renderLectureCardDetail(lec, dateStr)).join('')}
            </div>
        `;
    },

    getSubjectShortcode(name) {
        if (!name) return 'SUB';
        const clean = name.trim();
        const words = clean.split(/[\s,&/-]+/).filter(w => w.length > 0);
        if (words.length === 1) {
            return words[0].substring(0, 3).toUpperCase();
        }
        if (words.length === 2) {
            return (words[0][0] + words[1][0]).toUpperCase();
        }
        return words.slice(0, 4).map(w => w[0]).join('').toUpperCase();
    },

    setTimetableMode(mode) {
        this.state.timetableMode = mode;
        this.refreshUI();
    },

    renderTimetable() {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const todayIndex = new Date().getDay();
        const todayName = days[todayIndex];
        const displayDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const isEditing = this.state.isEditingTimetable;
        const mode = this.state.timetableMode || 'matrix';

        // Calculate maximum lecture slots across days for matrix grid framing
        let maxSlots = 4;
        displayDays.forEach(day => {
            const lecs = this.state.timetable[day] || [];
            if (lecs.length > maxSlots) maxSlots = lecs.length;
        });

        return `
            <div class="atpro-timetable-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem; flex-wrap:wrap; gap:8px">
                <div>
                    <h2 class="font-heading" style="margin:0; font-size: 1.25rem">Weekly <span class="gradient-text">Timetable & Routine</span></h2>
                    <p style="font-size:0.72rem; color:var(--text-dim); margin-top:1px">${isEditing ? 'Manage your lecture slots for each day.' : 'Systematically framed academic timetable grid.'}</p>
                </div>
                <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
                    <div style="display:flex; background: rgba(0,0,0,0.3); padding: 2px; border-radius: 8px; border: 1px solid var(--atpro-border);">
                        <button class="atpro-btn-sm" style="padding: 3px 8px; border-radius: 6px; border: none; background: ${mode === 'matrix' ? 'var(--atpro-purple)' : 'transparent'}; color: white; font-weight: 600; font-size: 0.7rem; cursor: pointer; transition: all 0.2s ease;" onclick="AttendancePro.setTimetableMode('matrix')">
                            <i class="fas fa-th-large" style="margin-right: 3px;"></i> Grid Table
                        </button>
                        <button class="atpro-btn-sm" style="padding: 3px 8px; border-radius: 6px; border: none; background: ${mode === 'cards' ? 'var(--atpro-purple)' : 'transparent'}; color: white; font-weight: 600; font-size: 0.7rem; cursor: pointer; transition: all 0.2s ease;" onclick="AttendancePro.setTimetableMode('cards')">
                            <i class="fas fa-stream" style="margin-right: 3px;"></i> Day Cards
                        </button>
                    </div>
                    <button class="atpro-btn-icon" style="width:auto; padding: 4px 12px; border-radius: 8px; font-size: 0.75rem; background: ${isEditing ? 'var(--atpro-success)' : 'rgba(255,255,255,0.05)'}; color: ${isEditing ? '#000' : 'white'}; border: 1px solid ${isEditing ? 'var(--atpro-success)' : 'rgba(255,255,255,0.1)'}" onclick="AttendancePro.toggleTimetableEdit()">
                        <i class="fas ${isEditing ? 'fa-check' : 'fa-edit'}" style="margin-right:4px"></i> ${isEditing ? 'Done Editing' : 'Edit Routine'}
                    </button>
                </div>
            </div>

            ${mode === 'matrix' ? `
                <!-- FRAMED TIMETABLE MATRIX TABLE GRID (COMPACT SINGLE SCREEN FIT) -->
                <div class="atpro-timetable-frame-wrapper" style="overflow-x: auto; background: rgba(0, 0, 0, 0.25); border: 1px solid var(--atpro-border); border-radius: 12px; padding: 4px; margin-bottom: 0.2rem; box-shadow: inset 0 0 15px rgba(0,0,0,0.5);">
                    <table class="atpro-timetable-matrix" style="width: 100%; border-collapse: separate; border-spacing: 2px; min-width: 750px; table-layout: fixed;">
                        <thead>
                            <tr>
                                <th style="padding: 4px 2px; background: rgba(255,255,255,0.03); border: 1px solid var(--atpro-border); border-radius: 8px; color: var(--text-dim); font-size: 0.65rem; text-transform: uppercase; width: 65px; text-align: center; font-weight: 800;">
                                    <i class="fas fa-clock" style="color: var(--atpro-cyan); margin-right: 2px;"></i> Slot
                                </th>
                                ${displayDays.map(day => {
                                    const isToday = day === todayName;
                                    const lectureCount = (this.state.timetable[day] || []).length;
                                    return `
                                        <th style="padding: 4px 2px; background: ${isToday ? 'linear-gradient(135deg, rgba(0, 242, 255, 0.15), rgba(123, 97, 255, 0.15))' : 'rgba(255,255,255,0.03)'}; border: 1px solid ${isToday ? 'var(--atpro-cyan)' : 'var(--atpro-border)'}; border-radius: 8px; color: ${isToday ? 'var(--atpro-cyan)' : '#fff'}; font-size: 0.72rem; text-align: center;">
                                            ${isToday ? '<span style="font-size:0.48rem; background:var(--atpro-cyan); color:#000; padding:1px 4px; border-radius:4px; font-weight:800; display:inline-block; margin-bottom:1px;">TODAY</span><br>' : ''}
                                            ${day}
                                            <div style="font-size:0.55rem; color:var(--text-dim); font-weight: normal; margin-top:0px">${lectureCount} ${lectureCount === 1 ? 'class' : 'classes'}</div>
                                        </th>
                                    `;
                                }).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${Array.from({ length: maxSlots }, (_, slotIdx) => `
                                <tr>
                                    <td style="padding: 3px 2px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; text-align: center; vertical-align: middle;">
                                        <div style="font-size: 0.68rem; font-weight: 800; color: #fff;">Slot ${slotIdx + 1}</div>
                                    </td>
                                    ${displayDays.map(day => {
                                        const isToday = day === todayName;
                                        const lectures = this.state.timetable[day] || [];
                                        const lec = lectures[slotIdx];
                                        const sub = lec ? this.state.subjects.find(s => s.id === lec.subjectId) : null;
                                        const shortCode = sub ? this.getSubjectShortcode(sub.name) : '';
                                        const stats = sub ? this.calculateStats(sub.id) : null;
                                        
                                        return `
                                            <td style="padding: 1px; background: ${isToday ? 'rgba(0, 242, 255, 0.02)' : 'transparent'}; vertical-align: middle;">
                                                ${sub ? `
                                                    <div class="atpro-matrix-cell ${isEditing ? 'editable' : ''}" style="padding: 4px 4px; background: linear-gradient(135deg, rgba(123, 97, 255, 0.08), rgba(0, 242, 255, 0.04)); border: 1px solid rgba(123, 97, 255, 0.25); border-radius: 8px; text-align: center; cursor: ${isEditing ? 'pointer' : 'default'}; transition: all 0.2s ease;" title="${sub.name}" onclick="${isEditing ? `AttendancePro.editLecture('${day}', '${lec.id}')` : ''}">
                                                        <div style="display:flex; justify-content:center; align-items:center; gap:3px; margin-bottom: 2px;">
                                                            <span style="font-size: 0.5rem; background: rgba(0, 242, 255, 0.15); color: var(--atpro-cyan); border: 1px solid rgba(0, 242, 255, 0.3); padding: 0px 4px; border-radius: 4px; font-weight: 800; white-space: nowrap;">${shortCode}</span>
                                                            ${stats ? `<span style="font-size: 0.52rem; color: ${stats.status === 'safe' ? '#00FF94' : '#FF4757'}; font-weight: 700; white-space: nowrap;">${stats.percent}%</span>` : ''}
                                                        </div>
                                                        <div style="font-size: 0.65rem; font-weight: 700; color: #fff; line-height: 1.15; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; max-height: 1.5rem; text-align: center;">${sub.name}</div>
                                                        ${isEditing ? '<div style="font-size: 0.52rem; color: var(--atpro-purple); margin-top: 1px; font-weight:700;"><i class="fas fa-edit"></i> Edit</div>' : ''}
                                                    </div>
                                                ` : (isEditing ? `
                                                    <div style="padding: 4px 4px; border: 1px dashed rgba(123, 97, 255, 0.3); background: rgba(123, 97, 255, 0.03); border-radius: 8px; text-align: center; cursor: pointer; color: var(--atpro-purple); font-size: 0.65rem; font-weight:600;" onclick="AttendancePro.addLecture('${day}')">
                                                        <i class="fas fa-plus" style="font-size: 0.55rem; margin-right: 2px;"></i> Add
                                                    </div>
                                                ` : `
                                                    <div style="padding: 4px 4px; border: 1px solid rgba(255,255,255,0.02); border-radius: 8px; text-align: center; color: rgba(255,255,255,0.15); font-size: 0.65rem;">
                                                        —
                                                    </div>
                                                `)}
                                            </td>
                                        `;
                                    }).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : `
                <!-- DAY CARDS VIEW -->
                <div class="atpro-timetable-grid">
                    ${displayDays.map(day => {
                        const isToday = day === todayName;
                        const lectures = this.state.timetable[day] || [];

                        return `
                            <div class="atpro-day-card ${isToday ? 'today' : ''}">
                                <div class="atpro-day-name">
                                    ${isToday ? '<span class="atpro-today-tag">Today</span>' : ''}
                                    ${day}
                                </div>
                                <div class="atpro-day-lectures">
                                    ${lectures.length > 0 ? lectures.map(lec => {
                                        const sub = this.state.subjects.find(s => s.id === lec.subjectId);
                                        return `
                                            <div class="atpro-lecture-cell ${isEditing ? 'editable' : ''}" onclick="${isEditing ? `AttendancePro.editLecture('${day}', '${lec.id}')` : ''}">
                                                <div class="lec-subject-name">${sub ? sub.name : 'Unknown'}</div>
                                                ${isEditing ? '<i class="fas fa-pencil-alt" style="font-size:0.6rem; opacity:0.4"></i>' : ''}
                                            </div>
                                        `;
                                    }).join('') : '<p style="text-align:center; font-size:0.75rem; color:var(--text-dim); margin: 3rem 0; opacity:0.3; font-style: italic;">No classes</p>'}
                                </div>
                                ${isEditing ? `
                                    <button class="atpro-btn-sm" style="width:100%; margin-top:1rem; border: 1px dashed var(--atpro-purple); background:rgba(123,97,255,0.05); color:var(--atpro-purple); border-radius: 12px; padding: 12px" onclick="AttendancePro.addLecture('${day}')">
                                        <i class="fas fa-plus" style="margin-right:8px; font-size:0.7rem"></i> Add Slot
                                    </button>
                                ` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
            `}
        `;
    },

    renderCalendar() {
        const year = this.state.viewYear;
        const month = this.state.viewMonth;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;

        const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });

        // Calculate Month Stats
        let monthStats = { attended: 0, missed: 0, off: 0, total: 0 };
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const dayActivity = this.state.history[dateStr] || {};
            Object.values(dayActivity).forEach(status => {
                if (status === 'present') monthStats.attended++;
                else if (status === 'absent') monthStats.missed++;
                else if (status === 'off') monthStats.off++;
                monthStats.total++;
            });
        }
        const monthPercentVal = monthStats.total === 0 ? 0 : ((monthStats.attended / monthStats.total) * 100);
        const monthPercent = (monthPercentVal % 1 === 0) ? monthPercentVal.toFixed(0) : monthPercentVal.toFixed(2);
        const monthDates = Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        });
        const allMonthSelected = monthDates.length > 0 && monthDates.every(d => this.state.selectedDates.includes(d));

        return `
            <div class="atpro-cal-view">
                <div class="atpro-cal-header glass-card">
                    <button class="atpro-cal-nav-btn" onclick="AttendancePro.changeMonth(-1)"><i class="fas fa-chevron-left"></i></button>
                    <div style="display:flex; flex-direction:column; align-items:center;">
                        <h3 class="font-heading atpro-month-title" style="margin:0">${monthName} <span class="year-text">${year}</span></h3>
                        <button class="atpro-select-month-btn ${allMonthSelected ? 'active' : ''}" onclick="AttendancePro.selectAllMonthDates()" title="Toggle Select All Month Dates">
                            <i class="fas fa-tasks"></i> <span>${allMonthSelected ? 'Deselect Month' : 'Select Month'}</span>
                        </button>
                    </div>
                    <button class="atpro-cal-nav-btn" onclick="AttendancePro.changeMonth(1)"><i class="fas fa-chevron-right"></i></button>
                </div>

                <div class="atpro-stats-grid">
                    <div class="atpro-cal-card-main">
                        <div class="stat-label">Month Score</div>
                        <div class="stat-value highlight">${monthPercent}%</div>
                        <div class="stat-sub">${monthStats.attended} / ${monthStats.total} Sessions</div>
                    </div>
                    <div class="atpro-mini-stats">
                        <div class="atpro-cal-stat-box success">
                            <div class="val">${monthStats.attended}</div>
                            <div class="lab">Attended</div>
                        </div>
                        <div class="atpro-cal-stat-box error">
                            <div class="val">${monthStats.missed}</div>
                            <div class="lab">Missed</div>
                        </div>
                        <div class="atpro-cal-stat-box warning">
                            <div class="val">${monthStats.off}</div>
                            <div class="lab">Off Days</div>
                        </div>
                        <div class="atpro-cal-stat-box total">
                            <div class="val">${monthStats.total}</div>
                            <div class="lab">Total</div>
                        </div>
                    </div>
                </div>
                
                <div class="atpro-cal-grid-wrapper" 
                     ontouchstart="AttendancePro.handleTouchStart(event)" 
                     ontouchend="AttendancePro.handleTouchEnd(event)"
                     style="width:100%; overflow:hidden; background: rgba(0,0,0,0.15); padding: 15px 10px; border-radius: 24px; border: 1px solid var(--atpro-border); touch-action: pan-y;">
                    <div class="atpro-cal-grid" style="gap: 6px">
                        ${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => `<div class="atpro-cal-label">${d}</div>`).join('')}
                        ${Array(firstDay).fill('<div class="atpro-cal-day empty" style="background:transparent; border:none"></div>').join('')}
                        ${(() => {
                const now = new Date();
                const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

                return Array.from({ length: daysInMonth }, (_, i) => {
                    const day = i + 1;
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const isSelected = this.state.selectedDates.includes(dateStr);
                    const isToday = todayStr === dateStr;
                    const dayActivity = this.state.history[dateStr] || {};
                    const statuses = Object.values(dayActivity);

                    return `
                                    <div class="atpro-cal-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}" 
                                         onclick="AttendancePro.selectDate('${dateStr}')">
                                        <span style="font-size:0.8rem">${day}</span>
                                        <div class="atpro-cal-dots">
                                            ${statuses.slice(0, 3).map(s => `<div class="atpro-cal-dot ${s}"></div>`).join('')}
                                        </div>
                                    </div>`;
                }).join('');
            })()}
                    </div>
                </div>

                <!-- Bulk Selection Bar -->
                ${this.state.selectedDates.length > 0 ? `
                    <div class="atpro-bulk-select-bar active">
                        <div style="font-size:0.95rem; font-weight:800; color:white;">
                            ${this.state.selectedDates.length} ${this.state.selectedDates.length === 1 ? 'day' : 'days'}
                        </div>
                        <div style="display:flex; gap:8px; align-items: center;">
                            <button class="atpro-action-btn present" onclick="AttendancePro.markSelectedDates('present')" title="Attended"><i class="fas fa-check"></i></button>
                            <button class="atpro-action-btn absent" onclick="AttendancePro.markSelectedDates('absent')" title="Missed"><i class="fas fa-times"></i></button>
                            <button class="atpro-action-btn warning" onclick="AttendancePro.markSelectedDates('off')" title="Off"><i class="far fa-circle"></i></button>
                            <button class="atpro-action-btn close" onclick="AttendancePro.markSelectedDates('none')" title="Clear Attendance"><i class="fas fa-ban"></i></button>
                            <div style="width:1px; background: rgba(255,255,255,0.2); margin: 0 5px;"></div>
                            <button class="atpro-action-btn" onclick="AttendancePro.clearSelection()" title="Cancel Selection" style="background: rgba(0,0,0,0.2); border:none"><i class="fas fa-minus-circle"></i></button>
                        </div>
                    </div>
                ` : ''}
                
                <div class="atpro-date-panel" id="atpro-date-panel" style="margin-top:2rem; border-top: 1px solid var(--atpro-border); padding-top: 2rem">
                    ${this.state.selectedDates.length === 1 ? this.renderDateDetails(this.state.selectedDates[0]) :
                (this.state.selectedDates.length > 1 ? '<p style="text-align:center; color:var(--text-dim); padding:2rem; background: rgba(255,255,255,0.02); border-radius: 16px;">Multiple dates selected. Use the action bar above.</p>' :
                    '<p style="text-align:center; color:var(--text-dim); padding:2rem; background: rgba(255,255,255,0.02); border-radius: 16px;">Select a date to see details or multiple dates to bulk mark.</p>')}
                </div>
            </div>
        `;
    },

    changeMonth(dir) {
        this.state.viewMonth += dir;
        if (this.state.viewMonth > 11) {
            this.state.viewMonth = 0;
            this.state.viewYear++;
        } else if (this.state.viewMonth < 0) {
            this.state.viewMonth = 11;
            this.state.viewYear--;
        }
        this.refreshUI();
    },

    renderDateDetails(dateStr) {
        const parts = dateStr.split('-');
        let d = new Date();
        if (parts.length === 3) {
            d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        }
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayName = days[d.getDay()];
        const lectures = this.state.timetable[dayName] || [];
        const history = this.state.history[dateStr] || {};

        let overallStatus = "No Lectures";
        let statusColor = "rgba(255, 255, 255, 0.2)";

        if (lectures.length > 0) {
            const statuses = lectures.map(l => history[l.id] || 'none');
            const allPresent = statuses.every(s => s === 'present');
            const allAbsent = statuses.every(s => s === 'absent');
            const allOff = statuses.every(s => s === 'off');
            const allNone = statuses.every(s => s === 'none');

            if (allPresent) { overallStatus = "Attended All"; statusColor = "var(--atpro-success)"; }
            else if (allAbsent) { overallStatus = "Missed All"; statusColor = "var(--atpro-error)"; }
            else if (allOff) { overallStatus = "Off Day"; statusColor = "var(--atpro-warning)"; }
            else if (allNone) { overallStatus = "Unmarked"; statusColor = "rgba(255, 255, 255, 0.5)"; }
            else { overallStatus = "Mixed"; statusColor = "var(--atpro-cyan)"; }
        }

        return `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem">
                <h4 class="font-heading" style="font-size:1.2rem">${d.toLocaleDateString('default', { day: 'numeric', month: 'long', weekday: 'short' })}</h4>
            </div>

            <!-- Bulk Action Bar -->
            <div class="atpro-bulk-bar">
                <div style="display:flex; align-items:center; gap:10px; font-size:0.85rem">
                    <div style="width:12px; height:12px; border-radius:50%; background:${statusColor}; box-shadow: 0 0 10px ${statusColor}"></div>
                    <span>Day status: <strong id="day-status-text">${overallStatus}</strong></span>
                </div>
                <div class="atpro-bulk-bar-actions" style="font-size:0.65rem; color:var(--text-dim); font-weight:700; text-transform:uppercase">
                    <div class="atpro-action-btn close" style="width:auto; padding:0 10px; height:32px; font-size:0.7rem" onclick="AttendancePro.markDay('${dateStr}', 'none')"><i class="fas fa-ban" style="margin-right:5px"></i> Clear</div>
                    <div class="atpro-action-btn warning" style="width:auto; padding:0 10px; height:32px; font-size:0.7rem" onclick="AttendancePro.markDay('${dateStr}', 'off')"><i class="far fa-circle" style="margin-right:5px"></i> Off</div>
                    <div class="atpro-action-btn absent" style="width:auto; padding:0 10px; height:32px; font-size:0.7rem" onclick="AttendancePro.markDay('${dateStr}', 'absent')"><i class="fas fa-times" style="margin-right:5px"></i> Miss</div>
                    <div class="atpro-action-btn present" style="width:auto; padding:0 10px; height:32px; font-size:0.7rem" onclick="AttendancePro.markDay('${dateStr}', 'present')"><i class="fas fa-check" style="margin-right:5px"></i> Att</div>
                </div>
            </div>

            <div class="atpro-day-lectures-list" style="display:flex; flex-direction:column; gap:12px">
                ${lectures.map(lec => this.renderLectureCardDetail(lec, dateStr)).join('')}
                ${lectures.length === 0 ? '<p style="color:var(--text-dim); text-align:center; padding: 3rem; background:rgba(255,255,255,0.02); border-radius:12px">No lectures scheduled for this day.</p>' : ''}
            </div>
        `;
    },

    renderLectureCardDetail(lec, dateStr) {
        const sub = this.state.subjects.find(s => s.id === lec.subjectId);
        if (!sub) return '';
        const stats = this.calculateStats(sub.id);
        const history = this.state.history[dateStr] || {};
        const status = history[lec.id] || 'none';

        return `
            <div class="atpro-sub-item lecture-detail-card" style="padding: 1.2rem; display:flex; gap: 15px; align-items:center; flex-wrap: wrap;">
                <div class="atpro-sub-circle premium-badge ${stats.status}" style="width:55px; height:55px;">
                    <div class="val" style="font-size:0.85rem;">${stats.percent}%</div>
                    <div class="lab">Goal</div>
                </div>
                
                <div style="flex:1; min-width: 150px;">
                    <h4 class="font-heading" style="margin:0 0 0.4rem 0; font-size:1.2rem; letter-spacing:-0.3px">${sub.name}</h4>
                    <div class="atpro-sub-status-badge ${stats.status === 'safe' ? 'safe' : 'danger'}" style="margin-bottom: 0; padding: 4px 8px; font-size: 0.7rem;">
                        ${stats.status === 'safe'
                ? `<i class="fas fa-check-circle"></i> Can miss ${stats.canMiss}`
                : `<i class="fas fa-exclamation-circle"></i> Need ${stats.need} more`}
                    </div>
                </div>
                
                <div class="atpro-card-actions" style="display:flex; gap:10px; margin-left:auto;">
                    <button class="atpro-action-btn close ${status === 'none' ? 'active' : ''}" onclick="AttendancePro.markAttendance('${dateStr}', '${lec.id}', 'none')" title="Clear"><i class="fas fa-ban"></i></button>
                    <button class="atpro-action-btn warning ${status === 'off' ? 'active' : ''}" onclick="AttendancePro.markAttendance('${dateStr}', '${lec.id}', 'off')" title="Off"><i class="far fa-circle"></i></button>
                    <button class="atpro-action-btn absent ${status === 'absent' ? 'active' : ''}" onclick="AttendancePro.markAttendance('${dateStr}', '${lec.id}', 'absent')" title="Missed"><i class="fas fa-times"></i></button>
                    <button class="atpro-action-btn present ${status === 'present' ? 'active' : ''}" onclick="AttendancePro.markAttendance('${dateStr}', '${lec.id}', 'present')" title="Attended"><i class="fas fa-check"></i></button>
                </div>
            </div>
        `;
    },

    renderSubjects() {
        return `
            <div class="atpro-sub-list" style="animation: atproFadeIn 0.5s ease;">
                ${this.state.subjects.map((sub, index) => {
            const stats = this.calculateStats(sub.id);
            return `
                        <div class="atpro-sub-item" style="padding: 0.8rem 1rem; border-radius: 16px; animation: atproFadeInUp 0.4s ease backwards; animation-delay: ${index * 0.1}s">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 0.6rem">
                                <div class="atpro-sub-circle premium-badge ${stats.status}" style="width: 44px; height: 44px; border-radius: 10px;">
                                    <div class="val" style="font-size:0.75rem; font-weight:800">${stats.percent}%</div>
                                    <div class="lab" style="font-size:0.45rem;">Score</div>
                                </div>
                                <div style="display:flex; gap:6px">
                                    <button class="atpro-action-icon edit" style="width: 28px; height: 28px; font-size: 0.72rem; border-radius: 8px;" onclick="AttendancePro.openEditSubjectModal('${sub.id}')" title="Edit Subject">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="atpro-action-icon delete" style="width: 28px; height: 28px; font-size: 0.72rem; border-radius: 8px;" onclick="AttendancePro.deleteSubject('${sub.id}')" title="Delete Subject">
                                        <i class="fas fa-trash-alt"></i>
                                    </button>
                                </div>
                            </div>
                            
                            <div class="atpro-sub-info">
                                <h3 class="font-heading atpro-sub-name" style="font-size: 1.15rem; margin: 0 0 0.3rem 0; letter-spacing: -0.3px;">${sub.name}</h3>
                                
                                <div class="atpro-sub-status-badge ${stats.status === 'safe' ? 'safe' : 'danger'}" style="font-size: 0.68rem; padding: 3px 8px; border-radius: 6px; margin-bottom: 0.6rem;">
                                    ${stats.status === 'safe'
                    ? `<i class="fas fa-check-circle"></i> Can miss ${stats.canMiss} lectures`
                    : `<i class="fas fa-exclamation-circle"></i> Need ${stats.need} more lectures`}
                                </div>

                                <div class="atpro-sub-meta" style="gap: 0.4rem;">
                                    <div class="atpro-cal-stat-box success" style="padding: 0.35rem 0.4rem; border-radius: 10px;">
                                        <div class="lab" style="font-size: 0.55rem;">Attended</div>
                                        <div class="val" style="font-size: 0.95rem; font-weight: 800;">${stats.attended}</div>
                                    </div>
                                    <div class="atpro-cal-stat-box error" style="padding: 0.35rem 0.4rem; border-radius: 10px;">
                                        <div class="lab" style="font-size: 0.55rem;">Missed</div>
                                        <div class="val" style="font-size: 0.95rem; font-weight: 800;">${stats.missed}</div>
                                    </div>
                                    <div class="atpro-cal-stat-box warning" style="padding: 0.35rem 0.4rem; border-radius: 10px;">
                                        <div class="lab" style="font-size: 0.55rem;">Off Days</div>
                                        <div class="val" style="font-size: 0.95rem; font-weight: 800;">${stats.off}</div>
                                    </div>
                                    <div class="atpro-cal-stat-box total" style="padding: 0.35rem 0.4rem; border-radius: 10px;">
                                        <div class="lab" style="font-size: 0.55rem;">Total</div>
                                        <div class="val" style="font-size: 0.95rem; font-weight: 800;">${stats.total}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
        }).join('')}
            </div>
        `;
    },

    renderSettings() {
        return `
            <div style="max-width: 600px; animation: atproFadeIn 0.5s ease;">
                <h2 class="font-heading atpro-premium-title" style="font-size: 2rem; margin-bottom: 2.5rem">System <span class="atpro-glow-text">Preferences</span></h2>
                
                <div class="atpro-settings-card">
                    <div class="atpro-settings-header">
                        <i class="fas fa-bullseye" style="color: var(--atpro-cyan)"></i>
                        <h4 class="font-heading">Attendance Goal</h4>
                    </div>
                    <div class="atpro-settings-body">
                        <p class="atpro-settings-desc">Set your minimum required attendance percentage. Most universities require 75% for eligibility.</p>
                        <div class="atpro-target-control">
                            <div class="atpro-input-wrapper">
                                <input type="number" id="atpro-target-input" class="atpro-glass-input" value="${this.state.target}" min="1" max="100">
                                <span class="atpro-input-suffix">%</span>
                            </div>
                            <button class="atpro-btn-premium" onclick="AttendancePro.updateTarget(document.getElementById('atpro-target-input').value)">
                                <span>Save Changes</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div class="atpro-settings-card" style="margin-top: 1.5rem;">
                    <div class="atpro-settings-header">
                        <i class="fas fa-envelope-open-text" style="color: var(--atpro-primary)"></i>
                        <h4 class="font-heading">Weekly Attendance Email</h4>
                    </div>
                    <div class="atpro-settings-body">
                        <p class="atpro-settings-desc">Receive a weekly summary of your attendance to keep you on track. We'll only send this if you have attendance data.</p>
                        <div class="atpro-target-control" style="justify-content: space-between; align-items: center; margin-top: 1rem;">
                            <span style="font-size: 0.95rem; font-weight: 600; color: #fff;">Enable Weekly Report</span>
                            <label class="atpro-toggle-switch" style="position: relative; display: inline-block; width: 50px; height: 26px;">
                                <input type="checkbox" id="atpro-weekly-email-toggle" style="opacity: 0; width: 0; height: 0;" ${localStorage.getItem('setting_notifications_weekly_attendance') === 'true' ? 'checked' : ''} onchange="AttendancePro.toggleWeeklyEmail(this.checked)">
                                <span class="atpro-slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(255, 255, 255, 0.1); transition: .4s; border-radius: 34px; border: 1px solid rgba(255, 255, 255, 0.2);"></span>
                            </label>
                        </div>
                    </div>
                </div>

                <style>
                    /* Inline style for the toggle switch in Attendance Pro */
                    .atpro-toggle-switch input:checked + .atpro-slider {
                        background-color: var(--atpro-primary);
                        border-color: var(--atpro-primary);
                        box-shadow: 0 0 10px rgba(123, 97, 255, 0.5);
                    }
                    .atpro-toggle-switch input:focus + .atpro-slider {
                        box-shadow: 0 0 1px var(--atpro-primary);
                    }
                    .atpro-toggle-switch .atpro-slider:before {
                        position: absolute;
                        content: "";
                        height: 18px;
                        width: 18px;
                        left: 4px;
                        bottom: 3px;
                        background-color: white;
                        transition: .4s;
                        border-radius: 50%;
                    }
                    .atpro-toggle-switch input:checked + .atpro-slider:before {
                        transform: translateX(24px);
                    }
                </style>

                <div class="atpro-settings-card" style="margin-top: 1.5rem;">
                    <div class="atpro-settings-header">
                        <i class="fas fa-file-csv" style="color: var(--atpro-success)"></i>
                        <h4 class="font-heading">Data Import & Export</h4>
                    </div>
                    <div class="atpro-settings-body">
                        <p class="atpro-settings-desc">Transfer your attendance records, timetable, and subjects between devices or platforms using CSV (Excel/Google Sheets format) or JSON backup files. All processing is 100% client-side without storing data on external servers.</p>
                        
                        <div style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1.2rem;">
                            <!-- Import Option Box -->
                            <div style="padding: 1.2rem; background: rgba(0, 255, 148, 0.04); border: 1px dashed rgba(0, 255, 148, 0.25); border-radius: 16px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
                                <div style="flex: 1; min-width: 200px;">
                                    <h5 style="margin: 0 0 4px 0; font-size: 0.95rem; color: #fff; font-weight: 700;">
                                        <i class="fas fa-file-import" style="color: var(--atpro-success); margin-right: 6px;"></i> Import Data File(s)
                                    </h5>
                                    <p style="margin: 0; font-size: 0.78rem; color: var(--text-dim);">Upload records.csv, subjects.csv, timetable.csv, a ZIP package, or a JSON backup file.</p>
                                </div>
                                <button class="atpro-btn-premium" style="background: linear-gradient(135deg, var(--atpro-success), #00b894); border: none; padding: 10px 20px; font-size: 0.85rem; font-weight: 700; color: #000; box-shadow: 0 4px 15px rgba(0, 255, 148, 0.2);" onclick="AttendancePro.openImportModal()">
                                    <i class="fas fa-upload" style="margin-right: 6px;"></i> Upload & Import
                                </button>
                            </div>

                            <!-- Export Option Box -->
                            <div style="padding: 1.2rem; background: rgba(123, 97, 255, 0.04); border: 1px solid rgba(123, 97, 255, 0.2); border-radius: 16px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
                                <div style="flex: 1; min-width: 200px;">
                                    <h5 style="margin: 0 0 4px 0; font-size: 0.95rem; color: #fff; font-weight: 700;">
                                        <i class="fas fa-file-export" style="color: var(--atpro-purple); margin-right: 6px;"></i> Export Data Snapshot
                                    </h5>
                                    <p style="margin: 0; font-size: 0.78rem; color: var(--text-dim);">Download records.csv, subjects.csv, and timetable.csv in a single ZIP package or JSON file.</p>
                                </div>
                                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                                    <button class="atpro-btn-premium" style="background: var(--atpro-purple); border: none; padding: 10px 14px; font-size: 0.85rem; font-weight: 600; box-shadow: 0 4px 15px rgba(123, 97, 255, 0.3);" onclick="AttendancePro.exportAsCSV()">
                                        <i class="fas fa-file-archive" style="margin-right: 5px;"></i> CSV ZIP
                                    </button>
                                    <button class="atpro-btn-premium" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); padding: 10px 14px; font-size: 0.85rem; font-weight: 600;" onclick="AttendancePro.exportAsJSON()">
                                        <i class="fas fa-code" style="margin-right: 5px;"></i> JSON
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="atpro-settings-card danger" style="margin-top: 1.5rem;">
                    <div class="atpro-settings-header">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h4 class="font-heading">Danger Zone</h4>
                    </div>
                    <div class="atpro-settings-body">
                        <p class="atpro-settings-desc">Resetting will permanently wipe all your subjects, timetable, and history. This cannot be undone.</p>
                        <button class="atpro-btn-danger-premium" onclick="AttendancePro.resetAllData()">
                            <i class="fas fa-trash-alt"></i>
                            <span>Factory Reset</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    },


    // --- LOGIC FUNCTIONS ---
    touchStartX: 0,
    touchStartY: 0,

    handleTouchStart(e) {
        if (e.touches && e.touches.length > 0) {
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
        }
    },

    handleTouchEnd(e) {
        if (!e.changedTouches || e.changedTouches.length === 0) return;
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const deltaX = touchEndX - this.touchStartX;
        const deltaY = touchEndY - this.touchStartY;

        // Swipe threshold check
        if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
            if (deltaX < 0) {
                this.changeMonth(1); // Swipe left -> next month
            } else {
                this.changeMonth(-1); // Swipe right -> prev month
            }
        }
    },

    selectDate(dateStr) {
        const index = this.state.selectedDates.indexOf(dateStr);
        if (index > -1) {
            this.state.selectedDates.splice(index, 1);
        } else {
            this.state.selectedDates.push(dateStr);
        }
        this.refreshUI();

        // Auto-scroll to panel if dates selected
        if (this.state.selectedDates.length > 0) {
            setTimeout(() => {
                const panel = document.getElementById('atpro-date-panel');
                if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
        }
    },

    selectAllMonthDates() {
        const year = this.state.viewYear;
        const month = this.state.viewMonth;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const monthDates = Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        });

        const allSelected = monthDates.every(d => this.state.selectedDates.includes(d));
        if (allSelected) {
            this.state.selectedDates = this.state.selectedDates.filter(d => !monthDates.includes(d));
        } else {
            const set = new Set([...this.state.selectedDates, ...monthDates]);
            this.state.selectedDates = Array.from(set);
        }
        this.refreshUI();
    },

    clearSelection() {
        this.state.selectedDates = [];
        this.refreshUI();
    },

    markSelectedDates(status) {
        this.state.selectedDates.forEach(dateStr => {
            this.markDay(dateStr, status);
        });
        this.state.selectedDates = [];
        this.refreshUI();
    },

    markAttendance(dateStr, lectureId, status, forceSet = false) {
        // Robust lecture search across timetable days
        let lecture = null;
        for (const day of Object.keys(this.state.timetable)) {
            const found = (this.state.timetable[day] || []).find(l => l.id === lectureId);
            if (found) {
                lecture = found;
                break;
            }
        }
        if (!lecture) return;
        const subject = this.state.subjects.find(s => s.id === lecture.subjectId);
        if (!subject) return;

        if (!this.state.history[dateStr]) this.state.history[dateStr] = {};
        const prevStatus = this.state.history[dateStr][lectureId];

        // Safely decrement with Math.max to prevent negative values
        if (prevStatus === 'present') subject.attended = Math.max(0, (subject.attended || 0) - 1);
        if (prevStatus === 'absent') subject.missed = Math.max(0, (subject.missed || 0) - 1);
        if (prevStatus === 'off') subject.off = Math.max(0, (subject.off || 0) - 1);

        if (status === 'none' || (!forceSet && prevStatus === status)) {
            delete this.state.history[dateStr][lectureId];
        } else {
            this.state.history[dateStr][lectureId] = status;
            if (status === 'present') subject.attended = (subject.attended || 0) + 1;
            if (status === 'absent') subject.missed = (subject.missed || 0) + 1;
            if (status === 'off') subject.off = (subject.off || 0) + 1;
        }
        this.saveData();
        this.refreshUI();
    },

    markDay(dateStr, status) {
        const parts = dateStr.split('-');
        let dayName = '';
        if (parts.length === 3) {
            const localDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
            dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][localDate.getDay()];
        }
        const lectures = (dayName && this.state.timetable[dayName]) ? this.state.timetable[dayName] : [];

        lectures.forEach(lec => {
            this.markAttendance(dateStr, lec.id, status, true);
        });
    },

    openSubjectModal() {
        const sheet = document.getElementById('atpro-sheet');
        sheet.innerHTML = `
            <div class="atpro-modal-close" onclick="AttendancePro.closeModal()"><i class="fas fa-times"></i></div>
            <div class="atpro-modal-header" style="margin-bottom: 2rem">
                <h3 class="font-heading" style="font-size: 1.8rem">Add Subject</h3>
                <p style="font-size:0.85rem; color:var(--text-dim); margin-top:5px">Create a new subject to track</p>
            </div>
            
            <div class="atpro-field primary" style="animation-delay: 0.1s">
                <div class="atpro-field-border">
                    <span class="atpro-field-label">Subject name (required)</span>
                    <input type="text" id="new-sub-name" class="atpro-field-input" placeholder="e.g. Mathematics" style="font-size:1.2rem">
                </div>
            </div>

            <p style="font-size: 0.75rem; color: var(--text-dim); margin-top: 1.5rem; margin-bottom: 1rem; text-transform:uppercase; letter-spacing:1px; font-weight:800; animation: atproFadeInUp 0.4s ease backwards; animation-delay: 0.2s">Initial Attendance Count</p>
            
            <div class="atpro-count-row" style="display:grid; grid-template-columns: repeat(3, 1fr); gap:12px; margin-bottom: 2rem">
                <div class="atpro-field" style="margin-bottom:0; animation-delay: 0.3s">
                    <div class="atpro-field-border" style="padding: 10px 15px">
                        <span class="atpro-field-label">Attended</span>
                        <input type="number" id="new-sub-att" class="atpro-field-input" value="0" style="text-align:center; font-size:1.2rem">
                    </div>
                </div>
                <div class="atpro-field" style="margin-bottom:0; animation-delay: 0.4s">
                    <div class="atpro-field-border" style="padding: 10px 15px">
                        <span class="atpro-field-label">Missed</span>
                        <input type="number" id="new-sub-miss" class="atpro-field-input" value="0" style="text-align:center; font-size:1.2rem">
                    </div>
                </div>
                <div class="atpro-field" style="margin-bottom:0; animation-delay: 0.5s">
                    <div class="atpro-field-border" style="padding: 10px 15px">
                        <span class="atpro-field-label">Off</span>
                        <input type="number" id="new-sub-off" class="atpro-field-input" value="0" style="text-align:center; font-size:1.2rem">
                    </div>
                </div>
            </div>

            <p class="atpro-hint" style="animation: atproFadeInUp 0.4s ease backwards; animation-delay: 0.6s">Starting mid-semester? You can enter your current attendance count above.</p>

            <button class="atpro-btn-large" style="width:100%; margin-top: 1.5rem; height:55px; animation: atproFadeInUp 0.4s ease backwards; animation-delay: 0.7s" onclick="AttendancePro.saveSubject()">
                <i class="fas fa-save" style="margin-right:10px"></i> Create Subject
            </button>
        `;
        this.openModal();
    },

    saveSubject() {
        const name = document.getElementById('new-sub-name').value;
        if (!name) return;

        const attended = Math.max(0, parseInt(document.getElementById('new-sub-att').value) || 0);
        const missed = Math.max(0, parseInt(document.getElementById('new-sub-miss').value) || 0);
        const off = Math.max(0, parseInt(document.getElementById('new-sub-off').value) || 0);

        this.state.subjects.push({
            id: 'sub-' + Date.now(),
            name,
            attended,
            missed,
            off
        });

        this.saveData(); this.closeModal(); this.refreshUI();
    },

    addLecture(day) {
        const sheet = document.getElementById('atpro-sheet');
        sheet.innerHTML = `
            <div class="atpro-modal-close" onclick="AttendancePro.closeModal()"><i class="fas fa-times"></i></div>
            <div class="atpro-modal-header" style="margin-bottom: 1.5rem">
                <h3 class="font-heading" style="font-size:1.5rem">Add to ${day}</h3>
                <p style="font-size:0.85rem; color:var(--text-dim); margin-top:5px">Select subjects to schedule for this day</p>
            </div>
            
            <div class="atpro-multi-select" style="max-height: 350px; overflow-y: auto; margin-bottom: 2rem; padding: 5px">
                ${this.state.subjects.map((s, idx) => `
                    <label class="atpro-multi-item" style="animation-delay: ${idx * 0.05}s">
                        <input type="checkbox" class="lec-multi-check" value="${s.id}" onchange="this.parentElement.classList.toggle('active', this.checked)">
                        <div style="flex:1">
                            <div style="font-weight:700; font-size:1rem">${s.name}</div>
                            <div style="font-size:0.7rem; color:var(--text-dim); text-transform:uppercase; letter-spacing:0.5px">Lecture Slot</div>
                        </div>
                    </label>
                `).join('')}
            </div>
            
            <button class="atpro-btn-large" style="width:100%; height:55px; font-size:1rem" onclick="AttendancePro.saveMultiLectures('${day}')">
                <i class="fas fa-plus-circle" style="margin-right:10px"></i> Schedule Selected
            </button>
        `;
        this.openModal();
    },

    saveMultiLectures(day) {
        const checks = document.querySelectorAll('.lec-multi-check:checked');
        checks.forEach(check => {
            this.state.timetable[day].push({ id: 'lec-' + Math.random().toString(36).substr(2, 9), subjectId: check.value });
        });
        this.saveData(); this.closeModal(); this.refreshUI();
    },

    openEditSubjectModal(id) {
        const sub = this.state.subjects.find(s => s.id === id);
        if (!sub) return;

        const historyList = [];
        Object.entries(this.state.history).forEach(([date, lectures]) => {
            Object.entries(lectures).forEach(([lecId, status]) => {
                const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(date).getDay()];
                const lecture = (this.state.timetable[dayName] || []).find(l => l.id === lecId);
                if (lecture && lecture.subjectId === id) {
                    historyList.push({ date, lecId, status });
                }
            });
        });
        historyList.sort((a, b) => new Date(b.date) - new Date(a.date));

        const sheet = document.getElementById('atpro-sheet');
        sheet.innerHTML = `
            <div class="atpro-modal-close" onclick="AttendancePro.closeModal()"><i class="fas fa-times"></i></div>
            <div class="atpro-modal-header" style="margin-bottom: 2rem">
                <h3 class="font-heading" style="font-size:1.6rem">Edit <span class="gradient-text">Subject</span></h3>
                <p style="font-size:0.85rem; color:var(--text-dim); margin-top:5px">Refine counts or modify individual records.</p>
            </div>

            <div class="atpro-form-scroll" style="max-height: 60vh; overflow-y: auto; padding-right: 5px; margin-bottom: 1.5rem">
                <div class="atpro-field" style="margin-bottom: 1.5rem">
                    <div class="atpro-field-border">
                        <span class="atpro-field-label">Subject Name</span>
                        <input type="text" id="edit-sub-name" class="atpro-field-input" value="${sub.name}">
                    </div>
                </div>

                <div class="atpro-edit-stats-grid">
                    <div class="atpro-field">
                        <div class="atpro-field-border">
                            <span class="atpro-field-label">Attended</span>
                            <input type="number" id="edit-sub-att" class="atpro-field-input" value="${sub.attended}" style="text-align:center" min="0">
                        </div>
                    </div>
                    <div class="atpro-field">
                        <div class="atpro-field-border">
                            <span class="atpro-field-label">Missed</span>
                            <input type="number" id="edit-sub-miss" class="atpro-field-input" value="${sub.missed}" style="text-align:center" min="0">
                        </div>
                    </div>
                    <div class="atpro-field">
                        <div class="atpro-field-border">
                            <span class="atpro-field-label">Off</span>
                            <input type="number" id="edit-sub-off" class="atpro-field-input" value="${sub.off}" style="text-align:center" min="0">
                        </div>
                    </div>
                </div>

                <h4 class="font-heading" style="font-size: 1.1rem; margin-bottom: 1rem">Attendance History</h4>
                <div class="atpro-history-list">
                    ${historyList.length > 0 ? historyList.map(h => `
                        <div class="atpro-history-item">
                            <div class="atpro-history-date">${new Date(h.date).toLocaleDateString('default', { day: 'numeric', month: 'short', weekday: 'short' })}</div>
                            <div class="atpro-history-actions">
                                <button class="atpro-action-btn present ${h.status === 'present' ? 'active' : ''}" onclick="AttendancePro.markAttendance('${h.date}', '${h.lecId}', 'present', true); AttendancePro.openEditSubjectModal('${id}')"><i class="fas fa-check"></i></button>
                                <button class="atpro-action-btn absent ${h.status === 'absent' ? 'active' : ''}" onclick="AttendancePro.markAttendance('${h.date}', '${h.lecId}', 'absent', true); AttendancePro.openEditSubjectModal('${id}')"><i class="fas fa-times"></i></button>
                                <button class="atpro-action-btn warning ${h.status === 'off' ? 'active' : ''}" onclick="AttendancePro.markAttendance('${h.date}', '${h.lecId}', 'off', true); AttendancePro.openEditSubjectModal('${id}')"><i class="far fa-circle"></i></button>
                            </div>
                        </div>
                    `).join('') : '<p style="text-align:center; padding: 20px; color: var(--text-dim); font-size: 0.8rem">No individual records found.</p>'}
                </div>
            </div>

            <button class="atpro-btn-large" style="width:100%; height:55px" onclick="AttendancePro.updateSubject('${id}')">
                <i class="fas fa-save" style="margin-right:10px"></i> Save All Changes
            </button>
        `;
        this.openModal();
    },

    updateSubject(id) {
        const sub = this.state.subjects.find(s => s.id === id);
        if (!sub) return;
        sub.name = document.getElementById('edit-sub-name').value;
        sub.attended = Math.max(0, parseInt(document.getElementById('edit-sub-att').value) || 0);
        sub.missed = Math.max(0, parseInt(document.getElementById('edit-sub-miss').value) || 0);
        sub.off = Math.max(0, parseInt(document.getElementById('edit-sub-off').value) || 0);
        this.saveData(); this.closeModal(); this.refreshUI();
    },

    editLecture(day, lectureId) {
        const lecture = this.state.timetable[day].find(l => l.id === lectureId);
        if (!lecture) return;

        const sheet = document.getElementById('atpro-sheet');
        sheet.innerHTML = `
            <div class="atpro-modal-close" onclick="AttendancePro.closeModal()"><i class="fas fa-times"></i></div>
            <h3 class="font-heading" style="margin-bottom: 1.5rem">Edit Slot</h3>
            <div class="atpro-form-group">
                <label style="display:block; margin-bottom:8px; color:var(--text-dim)">Change Subject</label>
                <select id="edit-lec-sub-id" class="atpro-input">
                    ${this.state.subjects.map(s => `<option value="${s.id}" ${s.id === lecture.subjectId ? 'selected' : ''}>${s.name}</option>`).join('')}
                </select>
            </div>
            <div style="display:flex; gap:10px; margin-top:2rem">
                <button class="btn btn-primary" style="flex:2" onclick="AttendancePro.updateLecture('${day}', '${lectureId}')">Update</button>
                <button class="btn btn-ghost" style="flex:1; border-color:var(--atpro-error); color:var(--atpro-error)" onclick="AttendancePro.removeLecture('${day}', '${lectureId}')">Remove</button>
            </div>
        `;
        this.openModal();
    },

    updateLecture(day, lectureId) {
        const lecture = this.state.timetable[day].find(l => l.id === lectureId);
        if (lecture) {
            lecture.subjectId = document.getElementById('edit-lec-sub-id').value;
            this.saveData(); this.closeModal(); this.refreshUI();
        }
    },

    removeLecture(day, lectureId) {
        if (confirm('Remove this lecture slot from the timetable?')) {
            this.state.timetable[day] = this.state.timetable[day].filter(l => l.id !== lectureId);
            this.saveData(); this.closeModal(); this.refreshUI();
        }
    },

    deleteSubject(id) {
        if (confirm('Delete subject and all related attendance history?')) {
            this.state.subjects = this.state.subjects.filter(s => s.id !== id);
            // Clear from timetable
            Object.keys(this.state.timetable).forEach(day => {
                this.state.timetable[day] = this.state.timetable[day].filter(l => l.subjectId !== id);
            });
            this.saveData(); this.refreshUI();
        }
    },

    updateTarget(val) {
        this.state.target = parseInt(val) || 75;
        this.saveData(); this.refreshUI();
    },

    async resetAllData() {
        if (confirm('CRITICAL: Factory reset will permanently wipe all your subjects, timetable, and attendance history. Proceed?')) {
            const key = this.getStorageKey();
            
            // 1. Clear user-specific and all atpro keys from localStorage
            localStorage.removeItem(key);
            localStorage.removeItem('atpro_data_v2');
            Object.keys(localStorage).forEach(k => {
                if (k.startsWith('atpro_data_v2')) {
                    localStorage.removeItem(k);
                }
            });

            // 2. Reset state object to clean empty slate
            const cleanState = {
                subjects: [],
                target: 75,
                history: {},
                timetable: {
                    'Mon': [], 'Tue': [], 'Wed': [], 'Thu': [], 'Fri': [], 'Sat': [], 'Sun': []
                },
                activeTab: 'calendar',
                selectedDates: [(() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`; })()],
                viewMonth: new Date().getMonth(),
                viewYear: new Date().getFullYear(),
                isEditingTimetable: false,
                notifiedSubjects: {},
                lastSync: new Date().toISOString()
            };

            this.state = cleanState;

            // 3. Wipe cloud data in Firestore if synced
            if (window.db && window.currentUser && !window.currentUser.isGuest) {
                try {
                    const docRef = window.doc(window.db, "attendance", window.currentUser.uid);
                    await window.setDoc(docRef, cleanState);
                } catch (e) {
                    console.error("☁️ Cloud wipe error during factory reset:", e);
                }
            }

            // 4. Save clean state & reload page
            localStorage.setItem(key, JSON.stringify(cleanState));
            location.reload();
        }
    },

    openModal() {
        document.getElementById('atpro-overlay').classList.add('active');
        document.getElementById('atpro-sheet').classList.add('active');
    },

    closeModal() {
        document.getElementById('atpro-overlay').classList.remove('active');
        document.getElementById('atpro-sheet').classList.remove('active');
    },

    toggleTimetableEdit() {
        this.state.isEditingTimetable = !this.state.isEditingTimetable;
        this.refreshUI();
    },

    // --- DATA IMPORT & EXPORT ENGINE ---
    openImportModal() {
        const sheet = document.getElementById('atpro-sheet');
        sheet.innerHTML = `
            <div class="atpro-modal-close" onclick="AttendancePro.closeModal()"><i class="fas fa-times"></i></div>
            <div class="atpro-modal-header" style="margin-bottom: 1.5rem">
                <h3 class="font-heading" style="font-size:1.6rem">Import <span class="gradient-text">Attendance Data</span></h3>
                <p style="font-size:0.85rem; color:var(--text-dim); margin-top:5px">Upload CSV files (records.csv, subjects.csv, timetable.csv), a ZIP package, or a JSON backup.</p>
            </div>

            <div class="atpro-import-dropzone" id="atpro-dropzone" style="border: 2px dashed var(--atpro-border); border-radius: 18px; padding: 2rem 1rem; text-align: center; background: rgba(0,0,0,0.2); cursor: pointer; transition: all 0.3s ease; margin-bottom: 1.5rem;">
                <i class="fas fa-cloud-upload-alt" style="font-size: 3rem; color: var(--atpro-cyan); margin-bottom: 1rem; display: block;"></i>
                <h4 style="margin: 0 0 0.5rem 0; font-size: 1.1rem; color: #fff;">Drag & Drop files here or <span style="color: var(--atpro-cyan); text-decoration: underline;">Browse</span></h4>
                <p style="font-size: 0.8rem; color: var(--text-dim); margin: 0;">Supports .csv (subjects, timetable, records), .zip, and .json files</p>
                <input type="file" id="atpro-file-input" multiple accept=".csv,.zip,.json" style="display: none;">
            </div>

            <div style="margin-bottom: 1.5rem;">
                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 0.9rem; color: #fff;">
                    <input type="checkbox" id="atpro-import-merge" style="width: 18px; height: 18px; accent-color: var(--atpro-purple);">
                    <span>Merge with existing attendance data (instead of replacing)</span>
                </label>
            </div>

            <div id="atpro-import-preview" style="display: none; margin-bottom: 1.5rem; padding: 1rem; background: rgba(0, 255, 148, 0.05); border: 1px solid rgba(0, 255, 148, 0.2); border-radius: 12px; font-size: 0.85rem; color: #fff;">
            </div>

            <button class="atpro-btn-large" id="atpro-import-btn" style="width:100%; height:55px;" disabled onclick="AttendancePro.executeImport()">
                <i class="fas fa-file-import" style="margin-right:10px"></i> Import Attendance Data
            </button>
        `;
        this.openModal();

        const dropzone = document.getElementById('atpro-dropzone');
        const fileInput = document.getElementById('atpro-file-input');

        dropzone.onclick = () => fileInput.click();

        dropzone.ondragover = (e) => {
            e.preventDefault();
            dropzone.style.borderColor = 'var(--atpro-cyan)';
            dropzone.style.background = 'rgba(0, 242, 255, 0.05)';
        };

        dropzone.ondragleave = () => {
            dropzone.style.borderColor = 'var(--atpro-border)';
            dropzone.style.background = 'rgba(0,0,0,0.2)';
        };

        dropzone.ondrop = (e) => {
            e.preventDefault();
            dropzone.style.borderColor = 'var(--atpro-border)';
            dropzone.style.background = 'rgba(0,0,0,0.2)';
            if (e.dataTransfer.files.length > 0) {
                fileInput.files = e.dataTransfer.files;
                this.handleFilesSelected(e.dataTransfer.files);
            }
        };

        fileInput.onchange = () => {
            if (fileInput.files.length > 0) {
                this.handleFilesSelected(fileInput.files);
            }
        };
    },

    handleFilesSelected(files) {
        this.selectedImportFiles = Array.from(files);
        const preview = document.getElementById('atpro-import-preview');
        const btn = document.getElementById('atpro-import-btn');

        if (this.selectedImportFiles.length > 0) {
            const names = this.selectedImportFiles.map(f => f.name).join(', ');
            preview.style.display = 'block';
            preview.innerHTML = `<strong>Selected ${this.selectedImportFiles.length} file(s):</strong> ${names}`;
            btn.removeAttribute('disabled');
        } else {
            preview.style.display = 'none';
            btn.setAttribute('disabled', 'true');
        }
    },

    async executeImport() {
        if (!this.selectedImportFiles || this.selectedImportFiles.length === 0) return;
        const isMerge = document.getElementById('atpro-import-merge')?.checked || false;
        const btn = document.getElementById('atpro-import-btn');
        btn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right:10px"></i> Importing Data...';
        btn.disabled = true;

        try {
            await this.parseAndImportFiles(this.selectedImportFiles, isMerge);
        } catch (e) {
            console.error('Import failed:', e);
            alert('Failed to import file. Please check format. Error: ' + e.message);
            btn.innerHTML = '<i class="fas fa-file-import" style="margin-right:10px"></i> Import Attendance Data';
            btn.disabled = false;
        }
    },

    async parseAndImportFiles(fileList, isMerge = false) {
        let csvContents = [];
        let jsonContent = null;

        for (const file of fileList) {
            if (file.name.endsWith('.json')) {
                const text = await file.text();
                jsonContent = JSON.parse(text);
            } else if (file.name.endsWith('.zip')) {
                const jszip = await this.loadJSZip();
                const zip = await jszip.loadAsync(file);
                for (const filename of Object.keys(zip.files)) {
                    if (!zip.files[filename].dir && filename.endsWith('.csv')) {
                        const text = await zip.files[filename].async('text');
                        csvContents.push({ filename: filename.split('/').pop(), text });
                    } else if (!zip.files[filename].dir && filename.endsWith('.json')) {
                        const text = await zip.files[filename].async('text');
                        jsonContent = JSON.parse(text);
                    }
                }
            } else if (file.name.endsWith('.csv') || file.type.includes('csv') || file.type.includes('excel')) {
                const text = await file.text();
                csvContents.push({ filename: file.name, text });
            }
        }

        if (jsonContent) {
            if (isMerge) {
                this.state.subjects = [...(this.state.subjects || []), ...(jsonContent.subjects || [])];
                this.state.history = { ...(this.state.history || {}), ...(jsonContent.history || {}) };
                if (jsonContent.timetable) {
                    Object.keys(jsonContent.timetable).forEach(day => {
                        this.state.timetable[day] = [...(this.state.timetable[day] || []), ...(jsonContent.timetable[day] || [])];
                    });
                }
            } else {
                this.state = { ...this.state, ...jsonContent };
            }
            await this.saveData();
            this.closeModal();
            this.refreshUI();
            if (window.showToast) window.showToast('Attendance data imported from JSON!', 'success');
            else alert('Attendance data imported from JSON successfully!');
            return;
        }

        if (csvContents.length === 0) {
            alert('No valid CSV or JSON files found in selection.');
            return;
        }

        let importedSubjects = [];
        let importedTimetable = { 'Mon': [], 'Tue': [], 'Wed': [], 'Thu': [], 'Fri': [], 'Sat': [], 'Sun': [] };
        let importedHistory = {};
        const subjectMap = new Map();

        const getOrCreateSubject = (name, att = -1, miss = -1, off = -1) => {
            const cleanName = name.trim();
            if (!cleanName) return null;
            const normKey = cleanName.toLowerCase();
            if (subjectMap.has(normKey)) {
                const existing = subjectMap.get(normKey);
                if (att >= 0) existing.attended = att;
                if (miss >= 0) existing.missed = miss;
                if (off >= 0) existing.off = off;
                return existing;
            }
            const sub = {
                id: 'sub-' + Math.random().toString(36).substr(2, 9),
                name: cleanName,
                attended: Math.max(0, att),
                missed: Math.max(0, miss),
                off: Math.max(0, off)
            };
            subjectMap.set(normKey, sub);
            importedSubjects.push(sub);
            return sub;
        };

        // Sort files so subjects.csv is parsed first, timetable second, records third
        csvContents.sort((a, b) => {
            const score = (f) => {
                const name = (f.filename || '').toLowerCase();
                if (name.includes('subject')) return 1;
                if (name.includes('timetable') || name.includes('routine')) return 2;
                if (name.includes('record') || name.includes('history')) return 3;
                return 4;
            };
            return score(a) - score(b);
        });

        csvContents.forEach(({ filename, text }) => {
            const rows = this.parseCSV(text);
            if (rows.length === 0) return;

            const firstRow = rows[0];
            const keys = Object.keys(firstRow);
            const fname = (filename || '').toLowerCase();

            const isSubjects = fname.includes('subject') || (keys.some(k => k.includes('subject') || k.includes('attended') || k.includes('criteria')) && !keys.includes('date') && !keys.includes('dayofweek'));
            const isTimetable = fname.includes('timetable') || fname.includes('routine') || (keys.some(k => k.includes('day')) && keys.some(k => k.includes('subject')) && !keys.includes('date'));
            const isRecords = fname.includes('record') || fname.includes('history') || (keys.some(k => k.includes('date')) && keys.some(k => k.includes('attendance') || k.includes('type') || k.includes('status')));

            if (isSubjects && !isTimetable && !isRecords) {
                rows.forEach(r => {
                    const name = r.subject || r.subjectname || r.name || r.subject_name || r.coursename || r.course;
                    if (!name || name.toLowerCase().includes('total')) return;
                    const att = parseInt(r.attended || r.attendedlectures || r.present || r.presentcount || r.present_count) || 0;
                    const miss = parseInt(r.missed || r.missedlectures || r.absent || r.absentcount || r.absent_count) || 0;
                    const off = parseInt(r.off || r.offdays || r.leave) || 0;
                    getOrCreateSubject(name, att, miss, off);
                });
            } else if (isTimetable) {
                rows.forEach(r => {
                    const dayRaw = r.dayofweek || r.dayofwe || r.day || r.weekday || '';
                    const day = this.normalizeDayOfWeek(dayRaw);
                    const subName = r.subject || r.subjectname || r.name || r.subject_name;
                    if (day && subName) {
                        const sub = getOrCreateSubject(subName);
                        if (sub) {
                            importedTimetable[day].push({
                                id: 'lec-' + Math.random().toString(36).substr(2, 9),
                                subjectId: sub.id
                            });
                        }
                    }
                });
            } else if (isRecords) {
                rows.forEach(r => {
                    const dateRaw = r.date || r.recorddate || r.sessiondate;
                    const subName = r.subject || r.subjectname || r.name || r.subject_name;
                    const attRaw = r.attendance || r.type || r.status || r.attstatus || r.record;
                    if (dateRaw && subName) {
                        const dateStr = this.normalizeDateStr(dateRaw);
                        const sub = getOrCreateSubject(subName);
                        if (dateStr && sub) {
                            const status = this.normalizeAttendanceStatus(attRaw);
                            if (status) {
                                if (!importedHistory[dateStr]) importedHistory[dateStr] = {};
                                const [y, m, d] = dateStr.split('-').map(Number);
                                const dateObj = new Date(y, m - 1, d);
                                const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dateObj.getDay()];
                                let lecSlot = importedTimetable[dayName].find(l => l.subjectId === sub.id);
                                if (!lecSlot) {
                                    lecSlot = { id: 'lec-' + Math.random().toString(36).substr(2, 9), subjectId: sub.id };
                                    importedTimetable[dayName].push(lecSlot);
                                }
                                importedHistory[dateStr][lecSlot.id] = status;
                            }
                        }
                    }
                });
            } else {
                rows.forEach(r => {
                    const subName = r.subject || r.subjectname || r.name || r.subject_name;
                    if (subName && !subName.toLowerCase().includes('total')) {
                        const att = parseInt(r.attended || r.present || r.attendedlectures) || 0;
                        const miss = parseInt(r.missed || r.absent || r.missedlectures) || 0;
                        const off = parseInt(r.off || r.offdays) || 0;
                        getOrCreateSubject(subName, att, miss, off);
                    }
                });
            }
        });

        if (importedSubjects.length === 0) {
            alert('Could not parse any subjects from the CSV files. Please check header column names.');
            return;
        }

        if (isMerge) {
            importedSubjects.forEach(newSub => {
                const existing = this.state.subjects.find(s => s.name.toLowerCase() === newSub.name.toLowerCase());
                if (existing) {
                    existing.attended += newSub.attended;
                    existing.missed += newSub.missed;
                    existing.off += newSub.off;
                } else {
                    this.state.subjects.push(newSub);
                }
            });
            Object.keys(importedTimetable).forEach(day => {
                this.state.timetable[day] = [...(this.state.timetable[day] || []), ...importedTimetable[day]];
            });
            this.state.history = { ...this.state.history, ...importedHistory };
        } else {
            this.state.subjects = importedSubjects;
            this.state.timetable = importedTimetable;
            this.state.history = importedHistory;
        }

        await this.saveData();
        this.closeModal();
        this.refreshUI();
        if (window.showToast) {
            window.showToast(`Imported ${importedSubjects.length} subjects & records successfully!`, 'success');
        } else {
            alert(`Successfully imported ${importedSubjects.length} subjects & records!`);
        }
    },

    openExportModal() {
        const sheet = document.getElementById('atpro-sheet');
        sheet.innerHTML = `
            <div class="atpro-modal-close" onclick="AttendancePro.closeModal()"><i class="fas fa-times"></i></div>
            <div class="atpro-modal-header" style="margin-bottom: 1.5rem">
                <h3 class="font-heading" style="font-size:1.6rem">Export <span class="gradient-text">Attendance Data</span></h3>
                <p style="font-size:0.85rem; color:var(--text-dim); margin-top:5px">Download your attendance records, timetable, and subjects.</p>
            </div>

            <div style="display: flex; flex-direction: column; gap: 15px; margin-bottom: 2rem;">
                <div style="padding: 1.2rem; background: rgba(255,255,255,0.03); border: 1px solid var(--atpro-border); border-radius: 16px; display: flex; align-items: center; justify-content: space-between;">
                    <div>
                        <h4 style="margin: 0 0 4px 0; color: #fff; font-size: 1rem;"><i class="fas fa-file-excel" style="color: #00FF94; margin-right: 8px;"></i> Export Excel / CSV ZIP Package</h4>
                        <p style="margin: 0; font-size: 0.8rem; color: var(--text-dim);">Contains records.csv, subjects.csv, and timetable.csv</p>
                    </div>
                    <button class="atpro-btn-sm" style="padding: 10px 18px; border-radius: 12px; background: var(--atpro-purple); color: #fff; border: none; font-weight: 600;" onclick="AttendancePro.exportAsCSV()">
                        Download ZIP
                    </button>
                </div>

                <div style="padding: 1.2rem; background: rgba(255,255,255,0.03); border: 1px solid var(--atpro-border); border-radius: 16px; display: flex; align-items: center; justify-content: space-between;">
                    <div>
                        <h4 style="margin: 0 0 4px 0; color: #fff; font-size: 1rem;"><i class="fas fa-code" style="color: var(--atpro-cyan); margin-right: 8px;"></i> Export JSON Backup File</h4>
                        <p style="margin: 0; font-size: 0.8rem; color: var(--text-dim);">Complete client-side data snapshot (.json)</p>
                    </div>
                    <button class="atpro-btn-sm" style="padding: 10px 18px; border-radius: 12px; background: rgba(255,255,255,0.1); color: #fff; border: 1px solid rgba(255,255,255,0.2); font-weight: 600;" onclick="AttendancePro.exportAsJSON()">
                        Download JSON
                    </button>
                </div>
            </div>
        `;
        this.openModal();
    },

    async exportAsCSV() {
        try {
            const subjectsCSV = this.generateSubjectsCSV();
            const timetableCSV = this.generateTimetableCSV();
            const recordsCSV = this.generateRecordsCSV();

            const jszip = await this.loadJSZip();
            const zip = new jszip();
            zip.file('subjects.csv', subjectsCSV);
            zip.file('timetable.csv', timetableCSV);
            zip.file('records.csv', recordsCSV);

            const content = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Attendance_Pro_Data_${new Date().toISOString().split('T')[0]}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error('ZIP export failed, downloading CSV files individually:', e);
            this.downloadTextFile('subjects.csv', this.generateSubjectsCSV());
            this.downloadTextFile('timetable.csv', this.generateTimetableCSV());
            this.downloadTextFile('records.csv', this.generateRecordsCSV());
        }
    },

    exportAsJSON() {
        const jsonStr = JSON.stringify(this.state, null, 2);
        this.downloadTextFile(`Attendance_Pro_Backup_${new Date().toISOString().split('T')[0]}.json`, jsonStr);
    },

    generateSubjectsCSV() {
        let csv = 'Sr. No.,Subject,Attended,Missed,Off,Total,Percentage,Criteria\n';
        this.state.subjects.forEach((sub, idx) => {
            const stats = this.calculateStats(sub.id) || { percent: 0, total: 0 };
            csv += `${idx + 1},"${sub.name.replace(/"/g, '""')}",${sub.attended},${sub.missed},${sub.off},${stats.total},${stats.percent}%,${this.state.target}%\n`;
        });
        return csv;
    },

    generateTimetableCSV() {
        let csv = 'Sr. No.,Day of Week,Lecture No.,Subject\n';
        let srNo = 1;
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        days.forEach(day => {
            const lectures = this.state.timetable[day] || [];
            lectures.forEach((lec, idx) => {
                const sub = this.state.subjects.find(s => s.id === lec.subjectId);
                if (sub) {
                    csv += `${srNo++},${day},${idx + 1},"${sub.name.replace(/"/g, '""')}"\n`;
                }
            });
        });
        return csv;
    },

    generateRecordsCSV() {
        let csv = 'Sr. No.,Date,Type,Lecture No.,Subject,Attendance,Att Modified,Miss Modified,Off Modified\n';
        let recSr = 1;
        Object.entries(this.state.history).sort((a, b) => a[0].localeCompare(b[0])).forEach(([dateStr, lectures]) => {
            const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(dateStr).getDay()];
            Object.entries(lectures).forEach(([lecId, status]) => {
                const lecList = this.state.timetable[dayName] || [];
                const lecIdx = lecList.findIndex(l => l.id === lecId);
                const lec = lecList[lecIdx];
                const sub = lec ? this.state.subjects.find(s => s.id === lec.subjectId) : null;
                const subName = sub ? sub.name : 'General';
                const statusLabel = status === 'present' ? 'Attended' : (status === 'absent' ? 'Missed' : 'Off');
                csv += `${recSr++},${dateStr},Timetable,${lecIdx !== -1 ? lecIdx + 1 : 1},"${subName.replace(/"/g, '""')}",${statusLabel},Off,Off,Off\n`;
            });
        });
        return csv;
    },

    parseCSV(text) {
        if (!text) return [];
        // Strip Byte Order Mark (\uFEFF) if present (common in Excel CSV exports)
        const cleanText = text.replace(/^\uFEFF/, '');

        // Auto-detect delimiter (comma vs semicolon vs tab)
        const firstLine = cleanText.split(/\r?\n/)[0] || '';
        let delimiter = ',';
        const commaCount = (firstLine.match(/,/g) || []).length;
        const semiCount = (firstLine.match(/;/g) || []).length;
        const tabCount = (firstLine.match(/\t/g) || []).length;
        if (semiCount > commaCount && semiCount > tabCount) delimiter = ';';
        else if (tabCount > commaCount && tabCount > semiCount) delimiter = '\t';

        const rows = [];
        let currentRow = [];
        let currentCell = '';
        let inQuotes = false;

        for (let i = 0; i < cleanText.length; i++) {
            const char = cleanText[i];
            const nextChar = cleanText[i + 1];

            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    currentCell += '"';
                    i++; // skip escaped quote
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === delimiter && !inQuotes) {
                currentRow.push(currentCell.trim().replace(/^"|"$/g, ''));
                currentCell = '';
            } else if ((char === '\r' || char === '\n') && !inQuotes) {
                if (char === '\r' && nextChar === '\n') i++;
                currentRow.push(currentCell.trim().replace(/^"|"$/g, ''));
                currentCell = '';
                if (currentRow.some(c => c.length > 0)) {
                    rows.push(currentRow);
                }
                currentRow = [];
            } else {
                currentCell += char;
            }
        }
        if (currentCell.length > 0 || currentRow.length > 0) {
            currentRow.push(currentCell.trim().replace(/^"|"$/g, ''));
            if (currentRow.some(c => c.length > 0)) {
                rows.push(currentRow);
            }
        }

        if (rows.length === 0) return [];

        const rawHeaders = rows[0];
        const headers = rawHeaders.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

        const data = [];
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row.length === 0 || (row.length === 1 && !row[0])) continue;
            const obj = {};
            headers.forEach((h, idx) => {
                let val = row[idx] || '';
                if (typeof val === 'string') {
                    val = val.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
                }
                obj[h] = val;
            });
            data.push(obj);
        }
        return data;
    },

    async loadJSZip() {
        if (window.JSZip) return window.JSZip;
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
            script.onload = () => resolve(window.JSZip);
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },

    downloadTextFile(filename, text) {
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    normalizeDateStr(str) {
        if (!str) return '';
        const clean = str.trim().replace(/^"|"$/g, '');

        // YYYY-MM-DD or YYYY/MM/DD
        const ymd = clean.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
        if (ymd) {
            const y = ymd[1];
            const m = ymd[2].padStart(2, '0');
            const d = ymd[3].padStart(2, '0');
            return `${y}-${m}-${d}`;
        }

        // DD/MM/YYYY or MM/DD/YYYY or DD-MM-YYYY
        const dmy = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
        if (dmy) {
            let p1 = parseInt(dmy[1], 10);
            let p2 = parseInt(dmy[2], 10);
            let year = dmy[3];
            let day, month;
            if (p1 > 12) {
                day = p1;
                month = p2;
            } else if (p2 > 12) {
                day = p2;
                month = p1;
            } else {
                day = p1;
                month = p2;
            }
            return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }

        // Fallback local date parsing (avoids UTC timezone shift)
        const parsed = new Date(clean);
        if (!isNaN(parsed.getTime())) {
            const y = parsed.getFullYear();
            const m = String(parsed.getMonth() + 1).padStart(2, '0');
            const d = String(parsed.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        }
        return '';
    },

    normalizeDayOfWeek(str) {
        if (!str) return 'Mon';
        const s = str.trim().toLowerCase();
        if (s.startsWith('mon')) return 'Mon';
        if (s.startsWith('tue')) return 'Tue';
        if (s.startsWith('wed')) return 'Wed';
        if (s.startsWith('thu')) return 'Thu';
        if (s.startsWith('fri')) return 'Fri';
        if (s.startsWith('sat')) return 'Sat';
        if (s.startsWith('sun')) return 'Sun';
        return 'Mon';
    },

    normalizeAttendanceStatus(str) {
        if (!str) return 'present';
        const s = str.trim().toLowerCase();
        if (s.includes('off')) return 'off';
        if (s.includes('miss') || s.includes('absent')) return 'absent';
        if (s.includes('att') || s.includes('present')) return 'present';
        return 'present';
    },

    syncScroll(el) {
        const thumb = document.getElementById('atpro-nav-thumb');
        if (!thumb) return;
        const scrollWidth = el.scrollWidth - el.clientWidth;
        if (scrollWidth <= 0) return;
        const scrollPercent = el.scrollLeft / scrollWidth;
        const trackWidth = thumb.parentElement.clientWidth;
        const thumbWidth = thumb.clientWidth;
        const maxLeft = trackWidth - thumbWidth;
        thumb.style.left = (scrollPercent * maxLeft) + 'px';
    },

    refreshUI() {
        const content = document.getElementById('tab-content');
        if (content) content.innerHTML = this.render();
    }
};

window.AttendancePro = AttendancePro;
AttendancePro.init();
