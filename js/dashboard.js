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
                        <h1>My <span class="gradient-text">Saved Notes</span></h1>
                        <p>Keep track of your study materials and revisions.</p>
                    </div>
                    <div class="notes-grid" id="dashboard-notes-grid">
                        <!-- Reusing the logic from main.js here if needed -->
                        <div class="glass-card">Your saved notes will appear here.</div>
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
