document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initPomodoro();
});

// Tab Switching Logic
function initTabs() {
    const navItems = document.querySelectorAll('.nav-item');
    const tabPanes = document.querySelectorAll('.tab-pane');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = item.getAttribute('data-tab');

            // Update Nav focus
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            // Update Content Visibility
            // For now we only have 'overview' implemented, so we mock others
            if (tabId === 'overview') {
                tabPanes.forEach(p => p.classList.add('active'));
            } else {
                renderMockTab(tabId);
            }
        });
    });
}

function renderMockTab(tabId) {
    const contentArea = document.getElementById('tab-content');
    let html = '';

    switch (tabId) {
        case 'notes':
            html = `
                <div class="tab-pane active">
                    <div class="welcome-header">
                        <h1>Smart <span class="gradient-text">Notes Explorer</span></h1>
                        <p>Complete the selection to view relevant study materials.</p>
                    </div>

                    <div id="selection-flow" class="selection-flow-container">
                        <!-- Step 1: College Selection -->
                        <div id="step-1" class="selection-step active">
                            <h3 class="step-title">1. Select Your College</h3>
                            <div class="selection-grid">
                                <div class="glass-card sel-card" onclick="handleNoteSelection('college', 'medicaps')">
                                    <div class="sel-icon">🏫</div>
                                    <h4>Medicaps University</h4>
                                </div>
                                <div class="glass-card sel-card" onclick="handleNoteSelection('college', 'svvv')">
                                    <div class="sel-icon">🏫</div>
                                    <h4>SVVV Indore</h4>
                                </div>
                            </div>
                        </div>

                        <!-- Step 2: Branch Selection -->
                        <div id="step-2" class="selection-step">
                            <h3 class="step-title">2. Select Your Branch</h3>
                            <div class="selection-grid">
                                <div class="glass-card sel-card" onclick="handleNoteSelection('branch', 'cse')">
                                    <h4>CSE</h4>
                                </div>
                                <div class="glass-card sel-card" onclick="handleNoteSelection('branch', 'it')">
                                    <h4>IT</h4>
                                </div>
                                <div class="glass-card sel-card" onclick="handleNoteSelection('branch', 'ece')">
                                    <h4>ECE</h4>
                                </div>
                            </div>
                        </div>

                        <!-- Step 3: Year Selection -->
                        <div id="step-3" class="selection-step">
                            <h3 class="step-title">3. Select Academic Year</h3>
                            <div class="selection-grid">
                                <div class="glass-card sel-card" onclick="handleNoteSelection('year', '1')">
                                    <h4>1st Year</h4>
                                </div>
                                <div class="glass-card sel-card" onclick="handleNoteSelection('year', '2')">
                                    <h4>2nd Year</h4>
                                </div>
                                <div class="glass-card sel-card" onclick="handleNoteSelection('year', '3')">
                                    <h4>3rd Year</h4>
                                </div>
                                <div class="glass-card sel-card" onclick="handleNoteSelection('year', '4')">
                                    <h4>4th Year</h4>
                                </div>
                            </div>
                        </div>

                        <!-- Step 4: Notes Grid -->
                        <div id="step-4" class="selection-step">
                            <div class="flex-header">
                                <h3 class="step-title">Relevant Notes</h3>
                                <button class="btn btn-primary btn-sm" onclick="showUploadModal()">+ Upload New Note</button>
                            </div>
                            <div class="notes-grid" id="dashboard-notes-grid">
                                <!-- Notes will be injected here -->
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Upload Modal Mock -->
                <div id="upload-modal" class="modal-overlay" style="display:none;">
                    <div class="glass-card modal-content">
                        <h3>Upload Your Notes</h3>
                        <p class="meta">Your notes will be visible after admin approval.</p>
                        <div class="input-group">
                            <label>Note Title</label>
                            <input type="text" id="upload-title" placeholder="e.g. Unit 3 - Operating Systems">
                        </div>
                        <div class="input-group">
                            <label>File (PDF only)</label>
                            <input type="file" id="upload-file">
                        </div>
                        <div class="modal-actions">
                            <button class="btn btn-ghost" onclick="closeUploadModal()">Cancel</button>
                            <button class="btn btn-primary" onclick="submitNote()">Submit for Approval</button>
                        </div>
                    </div>
                </div>
            `;
            break;
        case 'planner':
            html = `
                <div class="tab-pane active">
                    <div class="welcome-header">
                        <h1>Study <span class="gradient-text">Planner</span></h1>
                        <p>Generate a custom roadmap for your upcoming exams.</p>
                    </div>
                    <div class="planner-tool glass-card" style="padding: 2rem; margin-top: 1rem;">
                        <h3>Create New Plan</h3>
                        <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                            <input type="text" placeholder="Subject Name" class="btn btn-ghost" style="flex: 1; text-align: left;">
                            <button class="btn btn-primary">Generate Roadmap</button>
                        </div>
                    </div>
                </div>
            `;
            break;
        case 'ai-tools':
            html = `
                <div class="tab-pane active">
                    <div class="welcome-header">
                        <h1>AI <span class="gradient-text">Tools</span></h1>
                        <p>Advanced academic assistance at your fingertips.</p>
                    </div>
                    <div class="dashboard-grid" style="margin-top: 2rem;">
                        <div class="glass-card">
                            <h3>Doubt Solver</h3>
                            <textarea placeholder="Paste your question here..." style="width: 100%; height: 100px; background: rgba(0,0,0,0.2); border: 1px solid var(--border-glass); border-radius: 8px; color: white; padding: 1rem; margin-bottom: 1rem;"></textarea>
                            <button class="btn btn-primary">Solve with AI</button>
                        </div>
                        <div class="glass-card">
                            <h3>Pomodoro Focus</h3>
                            <div id="pomodoro-timer" style="text-align: center;">
                                <div style="font-size: 3rem; font-weight: 700; margin: 1rem 0;" id="timer-display">25:00</div>
                                <div style="display: flex; gap: 1rem; justify-content: center;">
                                    <button class="btn btn-primary" id="pomo-start">Start</button>
                                    <button class="btn btn-ghost" id="pomo-reset">Reset</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            break;
        default:
            html = `<div class="tab-pane active"><h1>${tabId.charAt(0).toUpperCase() + tabId.slice(1)}</h1><p>Coming Soon...</p></div>`;
    }

    contentArea.innerHTML = html;
    if (tabId === 'ai-tools') initPomodoro();
}

// Pomodoro Timer Logic
function initPomodoro() {
    let timeLeft = 25 * 60;
    let timerId = null;
    const display = document.getElementById('timer-display');
    const startBtn = document.getElementById('pomo-start');
    const resetBtn = document.getElementById('pomo-reset');

    if (!display) return;

    function updateDisplay() {
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        display.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    if (startBtn) {
        startBtn.onclick = () => {
            if (timerId) {
                clearInterval(timerId);
                timerId = null;
                startBtn.textContent = 'Start';
            } else {
                timerId = setInterval(() => {
                    timeLeft--;
                    updateDisplay();
                    if (timeLeft <= 0) {
                        clearInterval(timerId);
                        alert("Time's up! Take a break.");
                    }
                }, 1000);
                startBtn.textContent = 'Pause';
            }
        };
    }

    if (resetBtn) {
        resetBtn.onclick = () => {
            clearInterval(timerId);
            timerId = null;
            timeLeft = 25 * 60;
            updateDisplay();
            if (startBtn) startBtn.textContent = 'Start';
        };
    }
}

// Note Selection State
let noteFilters = {
    college: '',
    branch: '',
    year: ''
};

window.handleNoteSelection = function (type, value) {
    noteFilters[type] = value;

    if (type === 'college') {
        document.getElementById('step-1').classList.remove('active');
        document.getElementById('step-2').classList.add('active');
    } else if (type === 'branch') {
        document.getElementById('step-2').classList.remove('active');
        document.getElementById('step-3').classList.add('active');
    } else if (type === 'year') {
        document.getElementById('step-3').classList.remove('active');
        document.getElementById('step-4').classList.add('active');
        renderDashboardNotes();
    }
};

function renderDashboardNotes() {
    const grid = document.getElementById('dashboard-notes-grid');
    // Using global notesData from main.js if accessible, or mock
    const mockNotes = [
        { id: 'dn1', title: 'Data Structures Units 1-5', subject: 'DSA', likes: 120, pages: 30 },
        { id: 'dn2', title: 'Calculus Advanced', subject: 'Mathematics', likes: 85, pages: 15 }
    ];

    grid.innerHTML = mockNotes.map(note => `
        <div class="glass-card note-card-mini">
            <span class="subject-tag">${note.subject}</span>
            <h4>${note.title}</h4>
            <div class="note-info-mini">
                <span>📄 ${note.pages} Pages</span>
                <span class="like-btn" onclick="toggleLike(this)">👍 ${note.likes}</span>
            </div>
            <button class="btn btn-sm btn-ghost" style="width:100%; margin-top:1rem;">View PDF</button>
        </div>
    `).join('');
}

window.toggleLike = function (el) {
    el.classList.toggle('liked');
    // Simple mock toggle
    let text = el.innerText;
    let count = parseInt(text.split(' ')[1]);
    if (el.classList.contains('liked')) {
        el.innerText = `❤️ ${count + 1}`;
    } else {
        el.innerText = `👍 ${count}`;
    }
};

window.showUploadModal = function () {
    document.getElementById('upload-modal').style.display = 'flex';
};

window.closeUploadModal = function () {
    document.getElementById('upload-modal').style.display = 'none';
};

window.submitNote = function () {
    const title = document.getElementById('upload-title').value;
    if (!title) return alert('Please enter a title');

    alert('Note submitted! It will appear once approved by the admin.');
    closeUploadModal();
};
