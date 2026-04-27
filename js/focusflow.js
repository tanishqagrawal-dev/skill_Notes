/* FocusFlow Pro - Advanced Productivity Engine */

window.renderFocusFlow = function() {
    return `
        <div class="focusflow-container" id="focusflow-app">
            <!-- ALARM OVERLAY -->
            <div id="session-complete-overlay" class="session-overlay" style="display: none;">
                <div class="session-modal glass">
                    <div class="celebration-icon">🎉</div>
                    <h2 id="overlay-title">Session Complete!</h2>
                    <p id="overlay-msg">Great job on staying focused. Take a well-deserved break.</p>
                    <button class="btn btn-primary btn-stop-alarm" onclick="stopAlarmSound()">
                        <i class="fa-solid fa-bell-slash"></i> Stop Alarm & Continue
                    </button>
                </div>
            </div>

            <div class="timer-hub">
                <!-- SETUP VIEW (Selection) -->
                <div id="timer-setup-view" class="timer-setup-container">
                    <h2 class="setup-title">Ready for a Deep Study?</h2>
                    <p class="setup-subtitle">Select your focus goal to begin</p>
                    <div class="duration-presets">
                        <button class="preset-chip" onclick="selectStudyTime(30)">
                            <span class="preset-label">Smart Sprint</span>
                            <span class="preset-val">30m</span>
                        </button>
                        <button class="preset-chip secondary" onclick="selectStudyTime(60)">
                            <span class="preset-label">Power Hour</span>
                            <span class="preset-val">1h</span>
                        </button>
                        <button class="preset-chip premium" onclick="selectStudyTime(120)">
                            <span class="preset-label">Deep Dive</span>
                            <span class="preset-val">2h</span>
                        </button>
                        <button class="preset-chip pulse" onclick="selectStudyTime(240)">
                            <span class="preset-label">Marathon</span>
                            <span class="preset-val">4h</span>
                        </button>
                    </div>
                    <div class="custom-time-input">
                        <input type="number" id="custom-min-input" placeholder="Custom mins..." min="1" max="180">
                        <button onclick="selectStudyTime(document.getElementById('custom-min-input').value)">Go</button>
                    </div>
                </div>

                <!-- ACTIVE VIEW (Timer) -->
                <div id="timer-active-view" class="timer-active-container" style="display: none;">
                    <div class="timer-ring-container">
                        <svg class="timer-svg" viewBox="0 0 100 100">
                            <circle class="timer-bg-circle" cx="50" cy="50" r="45"></circle>
                            <circle id="timer-progress" class="timer-progress-circle" cx="50" cy="50" r="45" 
                                stroke-dasharray="283" stroke-dashoffset="0"></circle>
                        </svg>
                        <div class="timer-display">
                            <div id="timer-clock" class="timer-time">00:00</div>
                            <div id="timer-status-text" class="timer-status">STAYING FOCUSED</div>
                        </div>
                    </div>

                    <div class="timer-controls">
                        <button class="btn-ctrl" title="Reset" onclick="resetToSetup()"><i class="fa-solid fa-rotate-left"></i></button>
                        <button id="main-play-btn" class="btn-ctrl btn-main-ctrl" title="Start/Pause" onclick="toggleTimer()">
                            <i class="fa-solid fa-play"></i>
                        </button>
                        <button class="btn-ctrl" title="Settings" onclick="toggleFocusSettings()"><i class="fa-solid fa-gear"></i></button>
                    </div>
                </div>
            </div>

            <!-- Settings Overlay -->
            <div id="focus-settings-panel" class="focus-settings-overlay" style="display: none;">
                <div class="focus-settings-card backdrop-blur">
                    <div class="settings-header">
                        <h4>Settings</h4>
                        <button class="close-settings" onclick="toggleFocusSettings()">&times;</button>
                    </div>
                    <div class="settings-grid">
                        <div class="setting-item full">
                            <label>Default Presets</label>
                            <div style="font-size: 0.75rem; color: var(--text-dim);">Configure these in future updates</div>
                        </div>
                        <div class="setting-item full">
                            <label>Alert Sound</label>
                            <div style="display: flex; gap: 10px;">
                                <select id="set-alert-sound" onchange="updateSettings()" style="flex: 1; background: rgba(255,255,255,0.05); border: 1px solid var(--focus-border); color: white; padding: 8px; border-radius: 8px;">
                                    <option value="bell">Digital Bell</option>
                                    <option value="beep">Electronic Beep</option>
                                    <option value="chime">Calm Chime</option>
                                </select>
                                <button class="btn btn-sm btn-ghost" onclick="playAlertSound(true)">Test</button>
                            </div>
                        </div>
                        <div class="setting-item full" style="flex-direction: row; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.03); padding: 10px; border-radius: 12px; border: 1px solid var(--focus-border);">
                            <label style="margin-bottom: 0;">Mute Alert Sound</label>
                            <input type="checkbox" id="set-audio-mute" onchange="updateSettings()" style="width: 20px; height: 20px; cursor: pointer; accent-color: var(--focus-primary);">
                        </div>
                    </div>
                </div>
            </div>

            <div class="focus-dashboard">
                <div class="focus-card">
                    <h3>🎯 Tasks <span id="task-progress-badge" style="font-size: 0.75rem; background: var(--focus-primary); padding: 2px 8px; border-radius: 10px;">0/0</span></h3>
                    <div class="task-input-group">
                        <input type="text" id="task-name-input" class="task-input" placeholder="New goal...">
                        <button class="btn btn-primary" onclick="addFocusTask()">Add</button>
                    </div>
                    <div id="focus-tasks-list" class="task-list"></div>
                </div>

                <div class="focus-card">
                    <h3>📈 Analytics</h3>
                    <div class="stats-mini-grid" style="margin-bottom: 1.5rem;">
                        <div class="stat-box">
                            <span id="stat-sessions" class="stat-val">0</span>
                            <span class="stat-label">Sessions</span>
                        </div>
                        <div class="stat-box">
                            <span id="stat-focus-time" class="stat-val">0h</span>
                            <span class="stat-label">Hours</span>
                        </div>
                    </div>
                    <canvas id="focus-analytics-chart" style="max-height: 200px; width: 100%;"></canvas>
                </div>
            </div>

        </div>
    `;
};

// --- CORE ENGINE ---
let timerState = {
    mode: 'focus', 
    timeLeft: 25 * 60,
    totalTime: 25 * 60,
    isRunning: false,
    timer: null,
    sessionsToday: 0,
    totalFocusSeconds: 0,
    tasks: [],
    activeAlarm: null,
    settings: {
        focus: 25,
        short: 5,
        long: 15,
        sound: 'bell',
        mute: false
    }
};

window.selectStudyTime = function(mins) {
    mins = parseInt(mins);
    if (!mins || mins < 1) return;
    
    // Stop any current timer
    clearInterval(timerState.timer);
    timerState.isRunning = false;
    
    // Set time
    timerState.timeLeft = mins * 60;
    timerState.totalTime = mins * 60;
    timerState.mode = 'focus';
    
    // Transition UI
    const setupView = document.getElementById('timer-setup-view');
    const activeView = document.getElementById('timer-active-view');
    
    setupView.style.opacity = '0';
    setTimeout(() => {
        setupView.style.display = 'none';
        activeView.style.display = 'block';
        setTimeout(() => activeView.style.opacity = '1', 50);
        updateDisplay();
        startTimer();
    }, 400);
};

window.resetToSetup = function() {
    clearInterval(timerState.timer);
    timerState.isRunning = false;
    
    const setupView = document.getElementById('timer-setup-view');
    const activeView = document.getElementById('timer-active-view');
    
    activeView.style.opacity = '0';
    setTimeout(() => {
        activeView.style.display = 'none';
        setupView.style.display = 'block';
        setTimeout(() => setupView.style.opacity = '1', 50);
        updatePlayIcon();
    }, 400);
};

window.initFocusFlow = function() {
    console.log("⌚ FocusFlow Pro Initializing...");
    loadFocusData();
    renderFocusTasks();
    initFocusChart();
    preloadFocusSounds();
    
    // Auth-sync check for notifications
    if (Notification.permission === 'default') {
        Notification.requestPermission();
    }
};

function switchMode(mode) {
    if (timerState.isRunning && !confirm("Switching mode will reset the current timer. Proceed?")) return;
    
    clearInterval(timerState.timer);
    timerState.isRunning = false;
    timerState.mode = mode;
    
    const durationMins = timerState.settings[mode] || 25;
    timerState.timeLeft = durationMins * 60;
    timerState.totalTime = durationMins * 60;
    
    // UI Update
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.mode-btn[onclick="switchMode('${mode}')"]`)?.classList.add('active');
    
    const colors = { focus: '#7B61FF', short: '#00F2FF', long: '#FF2D95' };
    document.documentElement.style.setProperty('--focus-primary', colors[mode]);
    document.getElementById('timer-status-text').innerText = mode === 'focus' ? 'STAYING FOCUSED' : 'TAKING A BREAK';
    
    updateDisplay();
    updatePlayIcon();
}

function toggleTimer() {
    if (timerState.isRunning) {
        pauseTimer();
    } else {
        startTimer();
    }
}

function startTimer() {
    timerState.isRunning = true;
    updatePlayIcon();
    
    timerState.timer = setInterval(() => {
        timerState.timeLeft--;
        if (timerState.mode === 'focus') timerState.totalFocusSeconds++;
        
        if (timerState.timeLeft <= 0) {
            handleSessionEnd();
        } else {
            updateDisplay();
        }
        
        if (timerState.timeLeft % 30 === 0) saveFocusData(); // Save every 30s
    }, 1000);
}

function pauseTimer() {
    clearInterval(timerState.timer);
    timerState.isRunning = false;
    updatePlayIcon();
    saveFocusData();
}

function resetTimer() {
    pauseTimer();
    const durationMins = timerState.settings[timerState.mode] || 25;
    timerState.timeLeft = durationMins * 60;
    updateDisplay();
}

function skipSession() {
    if (timerState.mode === 'focus') {
        switchMode('short');
    } else {
        switchMode('focus');
    }
}

function updateDisplay() {
    const mins = Math.floor(timerState.timeLeft / 60);
    const secs = timerState.timeLeft % 60;
    const clock = document.getElementById('timer-clock');
    if (clock) clock.innerText = `${mins}:${secs.toString().padStart(2, '0')}`;
    
    const total = timerState.totalTime;
    const current = timerState.timeLeft;
    const percentage = current / total;
    
    const progressCircle = document.getElementById('timer-progress');
    
    if (progressCircle) {
        const offset = 283 - (percentage * 283);
        progressCircle.style.strokeDashoffset = offset;
    }
    
    // Update Browser Tab Title
    document.title = `${mins}:${secs.toString().padStart(2, '0')} - FocusFlow`;
}

function updatePlayIcon() {
    const btn = document.getElementById('main-play-btn');
    if (!btn) return;
    btn.innerHTML = timerState.isRunning ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
}

function handleSessionEnd() {
    pauseTimer();
    playAlertSound();
    
    const overlay = document.getElementById('session-complete-overlay');
    const title = document.getElementById('overlay-title');
    const msg = document.getElementById('overlay-msg');
    
    if (timerState.mode === 'focus') {
        timerState.sessionsToday++;
        if (title) title.innerText = "Focus Session Complete!";
        if (msg) msg.innerText = "Great job! Time for a well-deserved break.";
        switchMode('short');
    } else {
        if (title) title.innerText = "Break Over!";
        if (msg) msg.innerText = "Ready to dive back into deep work?";
        switchMode('focus');
    }
    
    if (overlay) {
        overlay.style.display = 'flex';
        setTimeout(() => overlay.style.opacity = '1', 50);
    }
    
    updateStatsUI();
    saveFocusData();
}

window.stopAlarmSound = function() {
    if (timerState.activeAlarm) {
        timerState.activeAlarm.pause();
        timerState.activeAlarm.currentTime = 0;
        timerState.activeAlarm = null;
    }
    
    const overlay = document.getElementById('session-complete-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.style.display = 'none', 400);
    }
};

// --- TASK MANAGEMENT ---
window.addFocusTask = function() {
    const input = document.getElementById('task-name-input');
    const name = input.value.trim();
    if (!name) return;
    
    timerState.tasks.push({
        id: Date.now(),
        name,
        done: false
    });
    
    input.value = '';
    renderFocusTasks();
    saveFocusData();
};

window.toggleFocusTask = function(id) {
    const task = timerState.tasks.find(t => t.id === id);
    if (task) {
        task.done = !task.done;
        renderFocusTasks();
        saveFocusData();
    }
};

window.deleteFocusTask = function(id) {
    timerState.tasks = timerState.tasks.filter(t => t.id !== id);
    renderFocusTasks();
    saveFocusData();
};

function renderFocusTasks() {
    const list = document.getElementById('focus-tasks-list');
    if (!list) return;
    
    list.innerHTML = timerState.tasks.map(task => `
        <div class="task-item ${task.done ? 'done' : ''}">
            <div class="task-checkbox" onclick="toggleFocusTask(${task.id})">
                ${task.done ? '<i class="fas fa-check" style="font-size: 10px;"></i>' : ''}
            </div>
            <span class="task-text">${task.name}</span>
            <i class="fas fa-trash task-delete" onclick="deleteFocusTask(${task.id})"></i>
        </div>
    `).join('') || '<p style="text-align: center; opacity: 0.3; padding: 1rem;">No active targets.</p>';
    
    const done = timerState.tasks.filter(t => t.done).length;
    document.getElementById('task-progress-badge').innerText = `${done}/${timerState.tasks.length}`;
}

// --- SETTINGS CONTROLS ---
window.toggleFocusSettings = function() {
    const panel = document.getElementById('focus-settings-panel');
    if (!panel) return;
    panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
    
    if (panel.style.display === 'flex') {
        document.getElementById('set-alert-sound').value = timerState.settings.sound || 'bell';
        document.getElementById('set-audio-mute').checked = timerState.settings.mute || false;
    }
};

window.updateSettings = function() {
    timerState.settings.sound = document.getElementById('set-alert-sound').value;
    timerState.settings.mute = document.getElementById('set-audio-mute').checked;
    
    saveFocusData();
};

const SOUND_BANK = {
    bell: 'https://github.com/rafael-mancini/pomodoro/raw/master/assets/alarm.mp3', // High impact immediate
    beep: 'https://www.soundjay.com/buttons/beep-07.mp3', 
    chime: 'https://www.soundjay.com/clock/alarm-clock-01.mp3'
};

// Pre-load audio to prevent "slow" start
let preloadedSounds = {};
function preloadFocusSounds() {
    Object.keys(SOUND_BANK).forEach(key => {
        const audio = new Audio(SOUND_BANK[key]);
        audio.preload = 'auto';
        audio.load();
        preloadedSounds[key] = audio;
    });
}

window.playAlertSound = function(isTest = false) {
    console.log("🔊 playAlertSound triggered (test:", isTest, ")");
    if (!isTest && timerState.settings.mute) return; 
    
    const soundKey = isTest ? document.getElementById('set-alert-sound').value : timerState.settings.sound;
    const url = SOUND_BANK[soundKey] || SOUND_BANK.bell;
    
    // Stop any current
    if (timerState.activeAlarm) {
        timerState.activeAlarm.pause();
        timerState.activeAlarm.currentTime = 0;
    }

    // Use preloaded or new
    const audio = new Audio(url); 
    audio.volume = 1.0; 
    
    if (!isTest) {
        audio.loop = true; 
        timerState.activeAlarm = audio;
    }
    
    const playPromise = audio.play();
    if (playPromise !== undefined) {
        playPromise.catch(e => {
            console.error("❌ Audio Blocked:", e);
            showFocusNotification("⏰ Session Complete!", "Click to hear your alarm.");
        });
    }
};

function showFocusNotification(title, body) {
    if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '../assets/logo.jpg' });
    }
}


// --- STORAGE & ANALYTICS ---
function saveFocusData() {
    // Map current day (0=Sun, 1=Mon...) to index in ['Mon','Tue',...,'Sun']
    const dayIndex = (new Date().getDay() + 6) % 7;
    
    // Update weekly history
    const history = timerState.weeklyHistory || [0, 0, 0, 0, 0, 0, 0];
    history[dayIndex] = parseFloat((timerState.totalFocusSeconds / 3600).toFixed(2));

    const snapshot = {
        sessionsToday: timerState.sessionsToday,
        totalFocusSeconds: timerState.totalFocusSeconds,
        tasks: timerState.tasks,
        settings: timerState.settings,
        lastDate: new Date().toDateString(),
        weeklyHistory: history
    };
    localStorage.setItem('focusflow_pro_data', JSON.stringify(snapshot));
}

function loadFocusData() {
    const raw = localStorage.getItem('focusflow_pro_data');
    const today = new Date().toDateString();
    
    // Initialize default history
    timerState.weeklyHistory = [0, 0, 0, 0, 0, 0, 0];
    
    if (!raw) return;
    
    const data = JSON.parse(raw);
    
    // Handle daily reset logic
    if (data.lastDate === today) {
        timerState.sessionsToday = data.sessionsToday || 0;
        timerState.totalFocusSeconds = data.totalFocusSeconds || 0;
    } else {
        // It's a new day! Daily counters reset, but history stays.
        timerState.sessionsToday = 0;
        timerState.totalFocusSeconds = 0;
    }
    
    // Restore persistent items
    timerState.tasks = data.tasks || [];
    if (data.settings) timerState.settings = data.settings;
    if (data.weeklyHistory) timerState.weeklyHistory = data.weeklyHistory;
    
    updateStatsUI();
}

function updateStatsUI() {
    const sessEl = document.getElementById('stat-sessions');
    const timeEl = document.getElementById('stat-focus-time');
    
    if (sessEl) sessEl.innerText = timerState.sessionsToday;
    if (timeEl) {
        const hours = (timerState.totalFocusSeconds / 3600).toFixed(1);
        timeEl.innerText = `${hours}h`;
    }
    
    // Refresh chart if it exists
    initFocusChart();
}

let focusChartInstance = null;

function initFocusChart() {
    const canvas = document.getElementById('focus-analytics-chart');
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    
    // Destroy previous instance to prevent overlaps
    if (focusChartInstance) {
        focusChartInstance.destroy();
    }
    
    focusChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Focus Hours',
                data: timerState.weeklyHistory,
                borderColor: '#7B61FF',
                backgroundColor: 'rgba(123, 97, 255, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointBackgroundColor: '#7B61FF',
                pointBorderColor: 'rgba(255,255,255,0.2)',
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(5, 7, 10, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#7B61FF',
                    padding: 10,
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    displayColors: false,
                    callbacks: {
                        label: (context) => ` ${context.parsed.y} Hours`
                    }
                }
            },
            scales: {
                y: { 
                    display: false, 
                    beginAtZero: true,
                    suggestedMax: Math.max(...timerState.weeklyHistory, 1) + 1
                },
                x: {
                    grid: { display: false },
                    border: { display: false },
                    ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 10 } }
                }
            }
        }
    });
}
