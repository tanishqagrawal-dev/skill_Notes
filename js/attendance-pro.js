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
        activeTab: 'today',
        selectedDates: [new Date().toLocaleDateString('sv').split(' ')[0]],
        viewMonth: new Date().getMonth(),
        viewYear: new Date().getFullYear(),
        isEditingTimetable: false,
        lastSync: null
    },

    init() {
        this.loadData();
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
    },

    render() {
        const overall = this.getOverallStats();
        const container = document.createElement('div');
        container.className = 'attendance-container fade-in';
        
        container.innerHTML = `
            <div class="atpro-top-section">
                <div class="atpro-header-row">
                    <div class="atpro-title">
                        <h2 class="font-heading">Attendance <span class="gradient-text">Pro</span></h2>
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
        switch(this.state.activeTab) {
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
            <div class="section-header" style="margin-bottom: 2.5rem; display: flex; justify-content: space-between; align-items: flex-end;">
                <div>
                    <h3 class="font-heading" style="font-size: 1.8rem; margin: 0">${dayName}'s <span class="gradient-text">Schedule</span></h3>
                    <p style="color:var(--text-dim); margin-top: 5px">Mark your attendance for today's sessions.</p>
                </div>
                <div style="font-family: var(--font-mono); font-size: 0.9rem; color: var(--atpro-purple); font-weight: 700; background: rgba(123, 97, 255, 0.1); padding: 5px 15px; border-radius: 10px; border: 1px solid rgba(123, 97, 255, 0.2);">
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
        const displayDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const isEditing = this.state.isEditingTimetable;

        return `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2.5rem; flex-wrap:wrap; gap:15px; animation: atproFadeIn 0.5s ease;">
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
                <div class="atpro-cal-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 2rem; background: rgba(255,255,255,0.03); padding: 15px 20px; border-radius: 20px; border: 1px solid var(--atpro-border);">
                    <button class="atpro-btn-icon" style="width:36px; height:36px; background: rgba(255,255,255,0.05); border-radius: 10px;" onclick="AttendancePro.changeMonth(-1)"><i class="fas fa-chevron-left"></i></button>
                    <h3 class="font-heading" style="font-size:1.3rem; margin:0; font-weight:800; letter-spacing: -0.5px;">${monthName} <span style="color: var(--atpro-purple)">${year}</span></h3>
                    <button class="atpro-btn-icon" style="width:36px; height:36px; background: rgba(255,255,255,0.05); border-radius: 10px;" onclick="AttendancePro.changeMonth(1)"><i class="fas fa-chevron-right"></i></button>
                </div>

                <div class="atpro-stats-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 2rem;">
                    <div class="atpro-stat-card premium" style="background: linear-gradient(135deg, rgba(123, 97, 255, 0.1), rgba(0, 242, 255, 0.05)); border-radius: 20px; padding: 1.2rem; border: 1px solid rgba(123, 97, 255, 0.2); text-align: center;">
                        <div style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; color: var(--text-dim); margin-bottom: 5px;">Month Score</div>
                        <div style="font-size: 1.8rem; font-weight: 800; color: white;">${monthPercent}%</div>
                        <div style="font-size: 0.75rem; color: var(--atpro-cyan); font-weight: 600;">${monthStats.attended} / ${monthStats.total} Sessions</div>
                    </div>
                    <div class="atpro-mini-stats" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                        <div style="background: rgba(0, 255, 148, 0.05); border: 1px solid rgba(0, 255, 148, 0.1); border-radius: 14px; padding: 10px; text-align: center;">
                            <div style="font-size: 1rem; font-weight: 800; color: var(--atpro-success);">${monthStats.attended}</div>
                            <div style="font-size: 0.6rem; color: var(--text-dim); text-transform: uppercase;">Attended</div>
                        </div>
                        <div style="background: rgba(255, 71, 87, 0.05); border: 1px solid rgba(255, 71, 87, 0.1); border-radius: 14px; padding: 10px; text-align: center;">
                            <div style="font-size: 1rem; font-weight: 800; color: var(--atpro-error);">${monthStats.missed}</div>
                            <div style="font-size: 0.6rem; color: var(--text-dim); text-transform: uppercase;">Missed</div>
                        </div>
                        <div style="background: rgba(255, 184, 0, 0.05); border: 1px solid rgba(255, 184, 0, 0.1); border-radius: 14px; padding: 10px; text-align: center;">
                            <div style="font-size: 1rem; font-weight: 800; color: var(--atpro-warning);">${monthStats.off}</div>
                            <div style="font-size: 0.6rem; color: var(--text-dim); text-transform: uppercase;">Off Days</div>
                        </div>
                        <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 14px; padding: 10px; text-align: center;">
                            <div style="font-size: 1rem; font-weight: 800; color: white;">${monthStats.total}</div>
                            <div style="font-size: 0.6rem; color: var(--text-dim); text-transform: uppercase;">Total</div>
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

        return `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem">
                <h4 class="font-heading" style="font-size:1.2rem">${d.toLocaleDateString('default', { day: 'numeric', month: 'long', weekday: 'short' })}</h4>
            </div>

            <!-- Bulk Action Bar -->
            <div class="atpro-bulk-bar">
                <div style="display:flex; align-items:center; gap:10px; font-size:0.85rem">
                    <div style="width:12px; height:12px; border-radius:50%; background:var(--atpro-success)"></div>
                    <span>Day status: <strong id="day-status-text">Mixed</strong></span>
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
                <div class="atpro-sub-circle ${stats.status}" style="width:55px; height:55px; flex-shrink:0; border-radius:15px; display:flex; flex-direction:column; align-items:center; justify-content:center; background: rgba(255,255,255,0.03);">
                    <div style="font-size:0.95rem; font-weight:800">${Math.round(stats.percent)}%</div>
                    <div style="font-size:0.5rem; opacity:0.5; text-transform:uppercase">Goal</div>
                </div>
                
                <div style="flex:1; min-width: 150px;">
                    <h4 class="font-heading" style="margin:0; font-size:1.1rem; letter-spacing:-0.3px">${sub.name}</h4>
                    <div style="font-size:0.75rem; margin-top:4px; font-weight:600">
                        ${stats.status === 'safe' 
                            ? `<span style="color:var(--atpro-success)">✅ Can miss ${stats.canMiss}</span>` 
                            : `<span style="color:var(--atpro-error)">⚠️ Need ${stats.need} more</span>`}
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
                ${this.state.subjects.map(sub => {
                    const stats = this.calculateStats(sub.id);
                    return `
                        <div class="atpro-sub-item">
                            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 1.5rem">
                                <div class="atpro-sub-circle ${stats.status}" style="width: 60px; height: 60px; border-radius: 16px; display:flex; flex-direction:column; align-items:center; justify-content:center">
                                    <div style="font-size:1rem; font-weight:800">${Math.round(stats.percent)}%</div>
                                    <div style="font-size:0.5rem; opacity:0.6; font-weight:600; text-transform:uppercase">Score</div>
                                </div>
                                <button class="atpro-btn-icon" style="background: rgba(255, 71, 87, 0.05); color: var(--atpro-error); border-color: rgba(255, 71, 87, 0.1);" 
                                        onclick="AttendancePro.deleteSubject('${sub.id}')" title="Delete Subject">
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                            </div>
                            
                            <div class="atpro-sub-info">
                                <h3 class="font-heading" style="font-size: 1.2rem; margin: 0 0 0.4rem 0; letter-spacing: -0.5px;">${sub.name}</h3>
                                
                                <div style="font-size:0.8rem; padding: 8px 12px; background: rgba(255,255,255,0.03); border-radius: 10px; margin-bottom: 1.2rem; border: 1px solid rgba(255,255,255,0.05)">
                                    ${stats.status === 'safe' 
                                        ? `<span style="color:var(--atpro-success); font-weight:600"><i class="fas fa-check-circle" style="margin-right:6px"></i> Can miss ${stats.canMiss} lectures</span>` 
                                        : `<span style="color:var(--atpro-error); font-weight:600"><i class="fas fa-exclamation-circle" style="margin-right:6px"></i> Need ${stats.need} more lectures</span>`}
                                </div>

                                <div class="atpro-sub-meta" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
                                    <div style="background: rgba(255,255,255,0.02); padding: 8px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.03)">
                                        <div style="font-size: 0.55rem; color: var(--text-dim); text-transform: uppercase; letter-spacing: 1px;">Attended</div>
                                        <div style="font-size: 1rem; font-weight: 800; color: white;">${stats.attended}</div>
                                    </div>
                                    <div style="background: rgba(255,255,255,0.02); padding: 8px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.03)">
                                        <div style="font-size: 0.55rem; color: var(--text-dim); text-transform: uppercase; letter-spacing: 1px;">Missed</div>
                                        <div style="font-size: 1rem; font-weight: 800; color: var(--atpro-error);">${stats.missed}</div>
                                    </div>
                                    <div style="background: rgba(255,255,255,0.02); padding: 8px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.03)">
                                        <div style="font-size: 0.55rem; color: var(--text-dim); text-transform: uppercase; letter-spacing: 1px;">Off Days</div>
                                        <div style="font-size: 1rem; font-weight: 800; color: var(--atpro-warning);">${stats.off}</div>
                                    </div>
                                    <div style="background: rgba(255,255,255,0.02); padding: 8px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.03)">
                                        <div style="font-size: 0.55rem; color: var(--text-dim); text-transform: uppercase; letter-spacing: 1px;">Total</div>
                                        <div style="font-size: 1rem; font-weight: 800; color: var(--atpro-cyan);">${stats.total}</div>
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
            <div style="max-width: 550px; animation: atproFadeIn 0.5s ease;">
                <h2 class="font-heading" style="margin-bottom: 2rem; font-size: 1.8rem">System Preferences</h2>
                
                <div class="atpro-field primary" style="margin-bottom: 2rem">
                    <div class="atpro-field-border">
                        <span class="atpro-field-label">Attendance Target Percentage (%)</span>
                        <div style="display:flex; gap:15px; align-items:center">
                            <input type="number" id="atpro-target-input" class="atpro-field-input" value="${this.state.target}" style="font-size: 1.4rem; width: 100px">
                            <button class="atpro-btn-large" style="margin-top:0; padding: 10px 30px" onclick="AttendancePro.updateTarget(document.getElementById('atpro-target-input').value)">Save Changes</button>
                        </div>
                    </div>
                    <p class="atpro-hint">Most universities require 75% attendance for exam eligibility.</p>
                </div>

                <div style="margin-top:4rem; background: rgba(255, 71, 87, 0.05); border: 1px solid rgba(255, 71, 87, 0.1); border-radius: 24px; padding: 2rem">
                    <div style="display:flex; align-items:center; gap:15px; margin-bottom: 1.2rem; color: var(--atpro-error)">
                        <i class="fas fa-exclamation-triangle" style="font-size: 1.4rem"></i>
                        <h4 class="font-heading" style="margin:0; font-size: 1.1rem">Danger Zone</h4>
                    </div>
                    <p style="font-size: 0.9rem; color: var(--text-dim); line-height: 1.6; margin-bottom: 1.5rem">
                        Performing a factory reset will permanently clear all your subjects, timetable data, and attendance history. This action cannot be undone.
                    </p>
                    <button class="atpro-btn-icon" onclick="AttendancePro.resetAllData()" style="width:auto; padding: 12px 24px; border-radius: 12px; border-color: rgba(255, 71, 87, 0.3); color: var(--atpro-error); background: rgba(255, 71, 87, 0.1)">
                        <i class="fas fa-trash-alt" style="margin-right: 10px"></i> Reset All Data
                    </button>
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

        if (prevStatus === 'present') subject.attended--;
        if (prevStatus === 'absent') subject.missed--;
        if (prevStatus === 'off') subject.off--;

        if (status === 'none' || (!forceSet && prevStatus === status)) {
            delete this.state.history[dateStr][lectureId];
        } else {
            this.state.history[dateStr][lectureId] = status;
            if (status === 'present') subject.attended++;
            if (status === 'absent') subject.missed++;
            if (status === 'off') subject.off++;
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
        
        const attended = parseInt(document.getElementById('new-sub-att').value) || 0;
        const missed = parseInt(document.getElementById('new-sub-miss').value) || 0;
        const off = parseInt(document.getElementById('new-sub-off').value) || 0;

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
        if(confirm('Delete subject and all related attendance history?')) {
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
        if(confirm('CRITICAL: Wipe all attendance data?')) {
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
