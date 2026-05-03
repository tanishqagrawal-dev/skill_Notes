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
        selectedDates: [new Date().toLocaleDateString('sv').split(' ')[0]],
        viewMonth: new Date().getMonth(),
        viewYear: new Date().getFullYear(),
        isEditingTimetable: false,
        notifiedSubjects: {},
        lastSync: null
    },

    init() {
        this.loadData();
        this.state.activeTab = 'calendar';
        console.log('🚀 Attendance Pro Systematic UI Initialized');
    },

    loadData() {
        const saved = localStorage.getItem('atpro_data_v2');
        if (saved) {
            const parsed = JSON.parse(saved);
            this.state = { ...this.state, ...parsed };
        } else {
            this.state.subjects = [
                { id: 'sub-1', name: 'Mathematics-III', attended: 0, missed: 0, off: 0 },
                { id: 'sub-2', name: 'Operating Systems', attended: 0, missed: 0, off: 0 },
                { id: 'sub-3', name: 'DBMS', attended: 0, missed: 0, off: 0 }
            ];
            this.saveData();
        }
    },

    saveData() {
        this.state.lastSync = new Date().toISOString();
        localStorage.setItem('atpro_data_v2', JSON.stringify(this.state));
        this.checkAttendanceThresholds();
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
            percent: percent.toFixed(1),
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
        return { percent: percent.toFixed(1), total };
    },

    setTab(tabId) {
        this.state.activeTab = tabId;
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
        const container = document.createElement('div');
        container.className = 'attendance-container fade-in';

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
        const dateStr = now.toISOString().split('T')[0];

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

    renderTimetable() {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const todayIndex = new Date().getDay();
        const todayName = days[todayIndex];
        const displayDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const isEditing = this.state.isEditingTimetable;

        return `
            <div class="atpro-timetable-header">
                <div>
                    <h2 class="font-heading" style="margin:0; font-size: 1.8rem">Weekly <span class="gradient-text">Schedule</span></h2>
                    <p style="font-size:0.85rem; color:var(--text-dim); margin-top:5px">${isEditing ? 'Manage your lecture slots for each day.' : 'Your weekly academic routine.'}</p>
                </div>
                <button class="atpro-btn-icon" style="width:auto; padding: 10px 20px; border-radius: 12px; font-size: 0.9rem; background: ${isEditing ? 'var(--atpro-success)' : 'rgba(255,255,255,0.05)'}; color: ${isEditing ? '#000' : 'white'}; border: 1px solid ${isEditing ? 'var(--atpro-success)' : 'rgba(255,255,255,0.1)'}" onclick="AttendancePro.toggleTimetableEdit()">
                    <i class="fas ${isEditing ? 'fa-check' : 'fa-edit'}" style="margin-right:8px"></i> ${isEditing ? 'Done Editing' : 'Edit Routine'}
                </button>
            </div>

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
        const monthPercent = monthStats.total === 0 ? 0 : ((monthStats.attended / monthStats.total) * 100).toFixed(1);

        return `
            <div class="atpro-cal-view">
                <div class="atpro-cal-header glass-card">
                    <button class="atpro-cal-nav-btn" onclick="AttendancePro.changeMonth(-1)"><i class="fas fa-chevron-left"></i></button>
                    <h3 class="font-heading atpro-month-title">${monthName} <span class="year-text">${year}</span></h3>
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
                
                <div class="atpro-cal-grid-wrapper" style="width:100%; overflow:hidden; background: rgba(0,0,0,0.15); padding: 15px 10px; border-radius: 24px; border: 1px solid var(--atpro-border);">
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
        const d = new Date(dateStr);
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
                    <div class="val" style="font-size:0.95rem;">${Math.round(stats.percent)}%</div>
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
                        <div class="atpro-sub-item" style="animation: atproFadeInUp 0.4s ease backwards; animation-delay: ${index * 0.1}s">
                            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 1.5rem">
                                <div class="atpro-sub-circle premium-badge ${stats.status}">
                                    <div class="val">${Math.round(stats.percent)}%</div>
                                    <div class="lab">Score</div>
                                </div>
                                <div style="display:flex; gap:8px">
                                    <button class="atpro-action-icon edit" onclick="AttendancePro.openEditSubjectModal('${sub.id}')" title="Edit Subject">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="atpro-action-icon delete" onclick="AttendancePro.deleteSubject('${sub.id}')" title="Delete Subject">
                                        <i class="fas fa-trash-alt"></i>
                                    </button>
                                </div>
                            </div>
                            
                            <div class="atpro-sub-info">
                                <h3 class="font-heading atpro-sub-name">${sub.name}</h3>
                                
                                <div class="atpro-sub-status-badge ${stats.status === 'safe' ? 'safe' : 'danger'}">
                                    ${stats.status === 'safe'
                    ? `<i class="fas fa-check-circle"></i> Can miss ${stats.canMiss} lectures`
                    : `<i class="fas fa-exclamation-circle"></i> Need ${stats.need} more lectures`}
                                </div>

                                <div class="atpro-sub-meta">
                                    <div class="atpro-cal-stat-box success">
                                        <div class="lab">Attended</div>
                                        <div class="val">${stats.attended}</div>
                                    </div>
                                    <div class="atpro-cal-stat-box error">
                                        <div class="lab">Missed</div>
                                        <div class="val">${stats.missed}</div>
                                    </div>
                                    <div class="atpro-cal-stat-box warning">
                                        <div class="lab">Off Days</div>
                                        <div class="val">${stats.off}</div>
                                    </div>
                                    <div class="atpro-cal-stat-box total">
                                        <div class="lab">Total</div>
                                        <div class="val">${stats.total}</div>
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

                <div class="atpro-settings-card danger">
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
    selectDate(dateStr) {
        if (this.state.selectedDates.includes(dateStr)) {
            this.state.selectedDates = this.state.selectedDates.filter(d => d !== dateStr);
        } else {
            this.state.selectedDates.push(dateStr);
        }
        this.refreshUI();

        // Auto-scroll to details if only one selected
        if (this.state.selectedDates.length === 1) {
            setTimeout(() => {
                const panel = document.getElementById('atpro-date-panel');
                if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
        }
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
        const d = new Date(dateStr);
        const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
        const lecture = this.state.timetable[dayName].find(l => l.id === lectureId);
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
        this.saveData(); this.refreshUI();
    },

    markDay(dateStr, status) {
        const d = new Date(dateStr);
        const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
        const lectures = this.state.timetable[dayName] || [];

        lectures.forEach(lec => {
            this.markAttendance(dateStr, lec.id, status, true); // Use forceSet=true for bulk actions
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

    resetAllData() {
        if (confirm('CRITICAL: Wipe all attendance data?')) {
            localStorage.removeItem('atpro_data_v2');
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
