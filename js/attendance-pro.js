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
        const total = sub.attended + sub.missed;
        const percent = total === 0 ? 0 : (sub.attended / total) * 100;
        const target = this.state.target / 100;
        let canMiss = 0, need = 0;
        if (percent >= this.state.target) {
            canMiss = Math.floor((sub.attended / target) - total);
        } else {
            need = Math.ceil((target * total - sub.attended) / (1 - target));
        }
        return {
            percent: percent.toFixed(2),
            attended: sub.attended, missed: sub.missed, off: sub.off, total,
            canMiss: Math.max(0, canMiss), need: Math.max(0, need),
            status: percent >= this.state.target ? 'safe' : (percent >= this.state.target - 5 ? 'warning' : 'critical')
        };
    },

    getOverallStats() {
        let att = 0, miss = 0;
        this.state.subjects.forEach(s => { att += s.attended; miss += s.missed; });
        const total = att + miss;
        const percent = total === 0 ? 0 : (att / total) * 100;
        return { percent: percent.toFixed(2), total };
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

                <div class="atpro-nav">
                    ${this.renderNavItem('today', 'fas fa-calendar-day', 'Today')}
                    ${this.renderNavItem('timetable', 'fas fa-th', 'Timetable')}
                    ${this.renderNavItem('calendar', 'fas fa-calendar-alt', 'Calendar')}
                    ${this.renderNavItem('subjects', 'fas fa-list', 'Subjects')}
                    ${this.renderNavItem('settings', 'fas fa-cog', 'Settings')}
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
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        if (lectures.length === 0) {
            return `
                <div class="atpro-today-hero" style="padding-top: 2rem">
                    <div class="atpro-today-icon">🏝️</div>
                    <h2 class="font-heading">It's your day off!</h2>
                    <p style="color:var(--text-dim); max-width: 400px; margin: 1rem auto">No lectures scheduled for today. Take a break or plan your week in the <strong>Timetable</strong> tab.</p>
                </div>
            `;
        }

        return `
            <div class="section-header" style="margin-bottom: 2rem">
                <h3 class="font-heading">${dayName}'s Schedule</h3>
                <p style="color:var(--text-dim)">Mark your attendance for today's lectures.</p>
            </div>
            <div class="atpro-day-lectures-list" style="display:flex; flex-direction:column; gap:12px">
                ${lectures.map(lec => this.renderLectureCardDetail(lec, dateStr)).join('')}
            </div>
        `;
    },

    renderTimetable() {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return `
            <div class="atpro-timetable-grid">
                ${days.map(day => `
                    <div class="atpro-day-card">
                        <div class="atpro-day-name">${day}</div>
                        <div class="atpro-day-lectures">
                            ${this.state.timetable[day].map(lec => {
                                const sub = this.state.subjects.find(s => s.id === lec.subjectId);
                                return `
                                    <div class="atpro-lecture-cell" onclick="AttendancePro.editLecture('${day}', '${lec.id}')">
                                        <div style="font-weight:700">${sub ? sub.name : 'Unknown'}</div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                        <button class="atpro-btn-sm" style="width:100%; margin-top:10px; border: 1px dashed rgba(255,255,255,0.1); background:transparent" onclick="AttendancePro.addLecture('${day}')">+ Add</button>
                    </div>
                `).join('')}
            </div>
        `;
    },

    renderCalendar() {
        const year = this.state.viewYear;
        const month = this.state.viewMonth;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDay = (new Date(year, month, 1).getDay() + 6) % 7; 

        const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });

        return `
            <div class="atpro-cal-view">
                <div class="atpro-cal-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem; padding: 0 10px">
                    <button class="atpro-btn-icon" style="width:32px; height:32px" onclick="AttendancePro.changeMonth(-1)"><i class="fas fa-chevron-left"></i></button>
                    <h3 class="font-heading" style="font-size:1.1rem; margin:0; font-weight:700">${monthName} ${year}</h3>
                    <button class="atpro-btn-icon" style="width:32px; height:32px" onclick="AttendancePro.changeMonth(1)"><i class="fas fa-chevron-right"></i></button>
                </div>
                
                <div class="atpro-cal-grid-wrapper" style="width:100%; overflow:hidden">
                    <div class="atpro-cal-grid" style="max-width: none; gap: 8px">
                        ${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => `<div class="atpro-cal-label">${d[0]}</div>`).join('')}
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
                                        <span style="font-size:0.75rem">${day}</span>
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
                    <div class="atpro-bulk-select-bar active" style="margin-top: 1.5rem; background: var(--atpro-purple); border-radius: 20px; padding: 10px 20px; display:flex; justify-content:space-between; align-items:center; animation: slideUp 0.3s ease; box-shadow: 0 10px 30px rgba(123, 97, 255, 0.3)">
                        <div style="font-size:0.95rem; font-weight:700; color:white; padding-left: 10px">
                            ${this.state.selectedDates.length} ${this.state.selectedDates.length === 1 ? 'day' : 'days'} selected
                        </div>
                        <div style="display:flex; gap:8px">
                            <button class="atpro-action-btn" onclick="AttendancePro.markSelectedDates('present')" title="Attended"><i class="fas fa-check"></i></button>
                            <button class="atpro-action-btn" onclick="AttendancePro.markSelectedDates('absent')" title="Missed"><i class="fas fa-times"></i></button>
                            <button class="atpro-action-btn" onclick="AttendancePro.markSelectedDates('off')" title="Off"><i class="far fa-circle"></i></button>
                            <button class="atpro-action-btn" onclick="AttendancePro.markSelectedDates('none')" title="Clear"><i class="fas fa-ban"></i></button>
                            <div style="width:1px; height:24px; background:rgba(255,255,255,0.2); margin: 0 5px"></div>
                            <button class="atpro-action-btn close" onclick="AttendancePro.clearSelection()" title="Cancel"><i class="fas fa-times"></i></button>
                        </div>
                    </div>
                ` : ''}
                
                <div class="atpro-date-panel" id="atpro-date-panel" style="margin-top:2rem; border-top: 1px solid var(--atpro-border); padding-top: 1.5rem">
                    ${this.state.selectedDates.length === 1 ? this.renderDateDetails(this.state.selectedDates[0]) : 
                      (this.state.selectedDates.length > 1 ? '<p style="text-align:center; color:var(--text-dim); padding:1rem">Multiple dates selected. Use the bar above to mark attendance.</p>' : 
                      '<p style="text-align:center; color:var(--text-dim); padding:1rem">Select a date to see details or multiple dates to bulk mark.</p>')}
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
            <div class="atpro-bulk-bar" style="background:rgba(255,255,255,0.05); border-radius:16px; padding:12px 20px; display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; border:1px solid var(--atpro-border)">
                <div style="display:flex; align-items:center; gap:10px; font-size:0.85rem">
                    <div style="width:12px; height:12px; border-radius:50%; background:var(--atpro-success)"></div>
                    <span>Day status: <strong id="day-status-text">Mixed</strong></span>
                </div>
                <div style="display:flex; gap:15px; font-size:0.65rem; color:var(--text-dim); font-weight:700; text-transform:uppercase">
                    <div style="text-align:center; cursor:pointer" onclick="AttendancePro.markDay('${dateStr}', 'none')"><i class="fas fa-ban" style="display:block; margin-bottom:4px; font-size:1rem"></i> Clear</div>
                    <div style="text-align:center; cursor:pointer" onclick="AttendancePro.markDay('${dateStr}', 'off')"><i class="far fa-circle" style="display:block; margin-bottom:4px; font-size:1rem"></i> Off</div>
                    <div style="text-align:center; cursor:pointer" onclick="AttendancePro.markDay('${dateStr}', 'absent')"><i class="fas fa-times" style="display:block; margin-bottom:4px; font-size:1rem"></i> Miss</div>
                    <div style="text-align:center; cursor:pointer" onclick="AttendancePro.markDay('${dateStr}', 'present')"><i class="fas fa-check" style="display:block; margin-bottom:4px; font-size:1rem"></i> Att</div>
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
            <div class="atpro-sub-item" style="padding: 1.2rem; align-items: flex-start; display:flex">
                <div class="atpro-sub-circle ${stats.status}" style="width:48px; height:48px; flex-shrink:0; border-radius:12px">
                    <div style="font-size:0.85rem">${Math.round(stats.percent)}%</div>
                </div>
                <div class="atpro-sub-info" style="margin-left: 1.2rem; flex:1">
                    <h3 class="font-heading" style="font-size:0.95rem; margin:0">${sub.name}</h3>
                    <div style="font-size:0.75rem; margin-top:4px; color:var(--text-dim); font-weight:500">
                         ${stats.status === 'safe' 
                            ? `Can miss ${stats.canMiss} lectures` 
                            : `Need to attend ${stats.need} lectures`}
                    </div>
                    
                    <div style="display:flex; justify-content:flex-end; gap:20px; margin-top:1rem">
                        <i class="fas fa-ban" style="cursor:pointer; opacity:${status === 'none' ? '1' : '0.2'}; font-size:1rem" onclick="AttendancePro.markAttendance('${dateStr}', '${lec.id}', 'none')"></i>
                        <i class="far fa-circle" style="cursor:pointer; color:var(--atpro-warning); opacity:${status === 'off' ? '1' : '0.2'}; font-size:1rem" onclick="AttendancePro.markAttendance('${dateStr}', '${lec.id}', 'off')"></i>
                        <i class="fas fa-times" style="cursor:pointer; color:var(--atpro-error); opacity:${status === 'absent' ? '1' : '0.2'}; font-size:1rem" onclick="AttendancePro.markAttendance('${dateStr}', '${lec.id}', 'absent')"></i>
                        <i class="fas fa-check-circle" style="cursor:pointer; color:var(--atpro-success); opacity:${status === 'present' ? '1' : '0.2'}; font-size:1rem" onclick="AttendancePro.markAttendance('${dateStr}', '${lec.id}', 'present')"></i>
                    </div>
                </div>
            </div>
        `;
    },

    renderSubjects() {
        return `
            <div class="atpro-sub-list">
                ${this.state.subjects.map(sub => {
                    const stats = this.calculateStats(sub.id);
                    return `
                        <div class="atpro-sub-item">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem">
                                <div class="atpro-sub-circle ${stats.status}">
                                    <div style="font-size:1rem">${stats.percent}%</div>
                                    <div style="font-size:0.6rem; opacity:0.6">/ ${this.state.target}%</div>
                                </div>
                                <i class="fas fa-trash-alt" style="color:var(--atpro-error); cursor:pointer; opacity:0.4" 
                                   onclick="AttendancePro.deleteSubject('${sub.id}')"></i>
                            </div>
                            <div class="atpro-sub-info">
                                <h3 class="font-heading">${sub.name}</h3>
                                <div style="font-size:0.85rem; margin: 0.8rem 0; font-weight: 500">
                                    ${stats.status === 'safe' 
                                        ? `<span style="color:var(--atpro-success)">✅ Can miss ${stats.canMiss} lectures</span>` 
                                        : `<span style="color:var(--atpro-error)">⚠️ Need to attend ${stats.need} lectures</span>`}
                                </div>
                                <div class="atpro-sub-meta">
                                    <span>Att: <strong style="color:white">${stats.attended}</strong></span>
                                    <span>Miss: <strong style="color:var(--atpro-error)">${stats.missed}</strong></span>
                                    <span>Off: <strong style="color:var(--atpro-warning)">${stats.off}</strong></span>
                                    <span>Tot: <strong>${stats.total}</strong></span>
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
            <div style="max-width: 500px">
                <h3 class="font-heading" style="margin-bottom: 2rem">System Preferences</h3>
                <div class="atpro-form-group">
                    <label style="display:block; margin-bottom: 10px; font-size: 0.9rem; color: var(--text-dim)">Attendance Target Percentage</label>
                    <div style="display:flex; gap:10px">
                        <input type="number" class="atpro-input" id="atpro-target-input" value="${this.state.target}" style="flex:1">
                        <button class="btn btn-primary" onclick="AttendancePro.updateTarget(document.getElementById('atpro-target-input').value)">Update</button>
                    </div>
                </div>
                <div style="margin-top:3rem; border-top: 1px solid var(--atpro-border); padding-top: 2rem">
                    <p style="font-size: 0.85rem; color: var(--atpro-error); margin-bottom: 1rem">Warning: This will clear all subjects, timetable, and history.</p>
                    <button class="btn btn-ghost" onclick="AttendancePro.resetAllData()" style="color:var(--atpro-error); border-color:var(--atpro-error)">Wipe All Data</button>
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

    markAttendance(dateStr, lectureId, status) {
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

        if (prevStatus === status || status === 'none') {
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
            this.markAttendance(dateStr, lec.id, status);
        });
    },

    openSubjectModal() {
        const sheet = document.getElementById('atpro-sheet');
        sheet.innerHTML = `
            <h3 class="font-heading" style="margin-bottom: 2rem; font-size: 1.8rem">Add Subject</h3>
            
            <div class="atpro-field primary">
                <div class="atpro-field-border">
                    <span class="atpro-field-label">Subject name (required)</span>
                    <input type="text" id="new-sub-name" class="atpro-field-input" placeholder="">
                </div>
            </div>

            <p style="font-size: 0.9rem; color: var(--text-dim); margin-top: 2rem">Attendance count:</p>
            <div class="atpro-count-row">
                <div class="atpro-field">
                    <div class="atpro-field-border">
                        <span class="atpro-field-label">Attended</span>
                        <input type="number" id="new-sub-att" class="atpro-field-input center" value="0">
                    </div>
                </div>
                <div class="atpro-field">
                    <div class="atpro-field-border">
                        <span class="atpro-field-label">Missed</span>
                        <input type="number" id="new-sub-miss" class="atpro-field-input center" value="0">
                    </div>
                </div>
                <div class="atpro-field">
                    <div class="atpro-field-border">
                        <span class="atpro-field-label">Off</span>
                        <input type="number" id="new-sub-off" class="atpro-field-input center" value="0">
                    </div>
                </div>
            </div>

            <p class="atpro-hint">Starting mid-semester? You can enter your current attendance count above.</p>

            <button class="atpro-btn-large" onclick="AttendancePro.saveSubject()">Save</button>
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
            <h3 class="font-heading" style="margin-bottom: 1.5rem">Add to ${day}</h3>
            <p style="font-size:0.85rem; color:var(--text-dim); margin-bottom: 1rem">Select subjects to add to this day:</p>
            <div class="atpro-multi-select" style="max-height: 250px; overflow-y: auto; margin-bottom: 2rem; border: 1px solid var(--atpro-border); border-radius: 12px; padding: 10px">
                ${this.state.subjects.map(s => `
                    <label style="display:flex; align-items:center; gap:12px; padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.05); cursor:pointer">
                        <input type="checkbox" class="lec-multi-check" value="${s.id}">
                        <span style="font-size:0.9rem">${s.name}</span>
                    </label>
                `).join('')}
            </div>
            <button class="atpro-btn-large" onclick="AttendancePro.saveMultiLectures('${day}')">Add Selected</button>
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

    refreshUI() {
        const content = document.getElementById('tab-content');
        if (content) content.innerHTML = this.render();
    }
};

window.AttendancePro = AttendancePro;
AttendancePro.init();
