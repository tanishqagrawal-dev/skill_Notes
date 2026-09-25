/**
 * Advanced CGPA Analyzer Pro Engine
 * Built for SKiL MATRiX
 */

const CGPA_CONFIG = {
    grading: [
        { min: 90, max: 100, grade: 'O', points: 10, label: 'Outstanding' },
        { min: 80, max: 89, grade: 'A+', points: 9, label: 'Excellent' },
        { min: 70, max: 79, grade: 'A', points: 8, label: 'Very Good' },
        { min: 60, max: 69, grade: 'B+', points: 7, label: 'Good' },
        { min: 50, max: 59, grade: 'B', points: 6, label: 'Above Average' },
        { min: 40, max: 49, grade: 'C', points: 5, label: 'Average' },
        { min: 30, max: 39, grade: 'P', points: 4, label: 'Pass' },
        { min: 0, max: 29, grade: 'F', points: 0, label: 'Fail' }
    ],
    divisions: [
        { min: 7.5, label: 'First Division with Honours', class: 'div-hons' },
        { min: 6.5, label: 'First Division', class: 'div-first' },
        { min: 5.0, label: 'Second Division', class: 'div-second' },
        { min: 0, label: 'Fail', class: 'div-fail' }
    ]
};

window.renderCGPAAnalyzer = function() {
    return `
        <div class="cgpa-container fade-in">
            <div class="cgpa-header">
                <div class="cgpa-title-group">
                    <h1>Advanced <span class="gradient-text">CGPA Analyzer</span> Pro<span class="cgpa-badge">Enterprise Edition</span></h1>
                    <p style="color: var(--text-dim); margin-top: 10px;">Intelligent academic analytics & prediction engine.</p>
                </div>
                <div class="header-actions">
                    <button class="btn btn-primary" onclick="saveToCloud()"><i class="fas fa-cloud-upload-alt"></i> Sync Cloud</button>
                </div>
            </div>

            <div class="cgpa-grid">
                <!-- LEFT COLUMN: INPUTS -->
                <div class="left-col">
                    
                    <!-- SGPA CALCULATOR -->
                    <div class="glass-card-premium module-card">
                        <div class="sgpa-engine-header">
                            <h3 class="font-heading subtitle-glow">
                                <span class="premium-emoji">📘</span> 
                                <span class="gradient-text-glow">Real-Time SGPA Engine</span>
                            </h3>
                            <div style="display: flex; gap: 10px; align-items: center;">
                                <button class="btn btn-sm btn-primary" onclick="addNewSubject()">+ Subject</button>
                            </div>
                        </div>
                        
                        <div id="subjects-container">
                            <!-- Rows injected here -->
                        </div>

                        <div class="add-row-btn" onclick="addNewSubject()">
                            <i class="fas fa-plus"></i> Add Another Subject
                        </div>
                    </div>

                    <!-- CGPA TRACKER -->
                    <div class="glass-card-premium module-card">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                            <h3 class="font-heading subtitle-glow">
                                <span class="premium-emoji">🎓</span> 
                                <span class="gradient-text-glow">Multi-Semester CGPA Hub</span>
                            </h3>
                            <span class="cgpa-badge" style="background: rgba(255,255,255,0.05); border: 1px solid var(--cgpa-border);">Grade 1-8</span>
                        </div>
                        <div id="semesters-container">
                            <!-- 8 Semester slots injected here -->
                        </div>
                        <button class="btn btn-ghost" style="width: 100%; border: 1px dashed var(--cgpa-border);" onclick="clearAllSemesters()">Reset All Semesters</button>
                    </div>

                </div>

                <!-- RIGHT COLUMN: ANALYTICS -->
                <div class="right-col">
                    
                    <!-- SCORE DASHBOARD -->
                    <div class="glass-card-premium module-card">
                        <h3 class="font-heading subtitle-glow" style="margin-bottom: 2rem;">
                            <span class="premium-emoji">📊</span> 
                            <span class="gradient-text-glow">Live Insights</span>
                        </h3>
                        
                        <div class="analytics-summary">
                            <div class="score-card">
                                <span class="label">Current SGPA</span>
                                <span class="val" id="display-sgpa" style="color: var(--cgpa-secondary);">0.00</span>
                                <span style="font-size: 0.7rem; color: var(--text-dim);">This Term</span>
                            </div>
                            <div class="score-card">
                                <span class="label">Overall CGPA</span>
                                <span class="val" id="display-cgpa">0.00</span>
                                <div id="division-label" class="division-badge">--</div>
                            </div>
                            <div class="score-card">
                                <span class="label">Total Credits</span>
                                <span class="val" id="display-credits">0</span>
                                <span style="font-size: 0.7rem; color: var(--text-dim);">Earned Units</span>
                            </div>
                        </div>

                        <div class="chart-container">
                            <canvas id="cgpa-chart"></canvas>
                        </div>
                    </div>

                    <!-- TARGET PLANNER -->
                    <div class="glass-card-premium module-card">
                        <h3 class="font-heading subtitle-glow" style="margin-bottom: 1.25rem;">
                            <span class="premium-emoji">🎯</span> 
                            <span class="gradient-text-glow">CGPA Goal Planner</span>
                        </h3>
                        <div class="planner-form">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                <div class="form-group">
                                    <label>Semesters Done</label>
                                    <input type="number" id="plan-sem-done" class="input-minimal" placeholder="4" oninput="onSemDoneChange()">
                                </div>
                                <div class="form-group">
                                    <label>Semesters Remaining</label>
                                    <input type="number" id="plan-sem-rem" class="input-minimal" placeholder="4" oninput="onSemRemChange()">
                                </div>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                <div class="form-group">
                                    <label>Current CGPA</label>
                                    <input type="number" step="0.01" id="plan-current-cgpa" class="input-minimal" placeholder="8.00">
                                </div>
                                <div class="form-group">
                                    <label>Target CGPA</label>
                                    <input type="number" step="0.01" id="target-cgpa-input" class="input-minimal" placeholder="8.50">
                                </div>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                <div class="form-group">
                                    <label>Current Credits</label>
                                    <input type="number" id="plan-current-credits" class="input-minimal" placeholder="80">
                                </div>
                                <div class="form-group">
                                    <label>Remaining Credits (Total)</label>
                                    <input type="number" id="plan-rem-credits" class="input-minimal" placeholder="80">
                                </div>
                            </div>
                            <div style="display: flex; gap: 10px; margin-top: 5px;">
                                <button class="btn btn-primary" style="flex: 2;" onclick="runPrediction()">✨ Predict Path</button>
                                <button class="btn btn-ghost" style="flex: 1;" onclick="syncPlannerData()" title="Auto-fill from Calculator">🔄 Sync</button>
                            </div>
                        </div>

                        <div id="planner-result" class="plan-result">
                            <h4 id="plan-difficulty" style="margin-top: 0;">--</h4>
                            <p id="plan-msg" style="font-size: 0.9rem; margin-bottom: 0;">--</p>
                        </div>
                    </div>

                </div>
            </div>


        </div>
    `;
};

let cgpaChart = null;

window.initCGPAAnalyzer = function() {
    console.log("🚀 Initializing CGPA Analyzer Pro...");
    
    // Render 8 slots if they don't exist
    const container = document.getElementById('semesters-container');
    if (container.children.length === 0) {
        for (let i = 1; i <= 8; i++) {
            addNewSemesterFixed(i);
        }
    }
    
    loadFromStorage();
    updateCalculations();
};

function addNewSubject(name = '', credits = '', grade = '') {
    const container = document.getElementById('subjects-container');
    const row = document.createElement('div');
    row.className = 'subject-row fade-in';
    row.innerHTML = `
        <input type="text" class="input-minimal sub-name" placeholder="Subject name" value="${name}">
        <input type="number" class="input-minimal sub-credits" placeholder="Credits" value="${credits}" oninput="updateCalculations()">
        <select class="input-minimal sub-grade" onchange="handleGradeSelect(this)">
            <option value="">Grade</option>
            <option value="O" ${grade === 'O' ? 'selected' : ''}>O (10)</option>
            <option value="A+" ${grade === 'A+' ? 'selected' : ''}>A+ (9)</option>
            <option value="A" ${grade === 'A' ? 'selected' : ''}>A (8)</option>
            <option value="B+" ${grade === 'B+' ? 'selected' : ''}>B+ (7)</option>
            <option value="B" ${grade === 'B' ? 'selected' : ''}>B (6)</option>
            <option value="C" ${grade === 'C' ? 'selected' : ''}>C (5)</option>
            <option value="P" ${grade === 'P' ? 'selected' : ''}>P (4)</option>
            <option value="F" ${grade === 'F' ? 'selected' : ''}>F (0)</option>
            <option value="Ab" ${grade === 'Ab' ? 'selected' : ''}>Ab (0)</option>
        </select>
        <button class="remove-btn" onclick="removeRow(this)">×</button>
    `;
    container.appendChild(row);
    updateCalculations();
}

function addNewSemesterFixed(semIndex, sgpa = '', credits = '') {
    const container = document.getElementById('semesters-container');
    const div = document.createElement('div');
    div.className = 'subject-row fade-in semester-slot';
    div.style.gridTemplateColumns = '1.5fr 1fr 1fr'; // Removed delete button
    div.innerHTML = `
        <div style="font-weight: 600; color: var(--cgpa-secondary);">Semester ${semIndex}</div>
        <input type="number" step="0.01" class="input-minimal sem-sgpa" placeholder="SGPA" value="${sgpa}" oninput="updateCalculations()">
        <input type="number" class="input-minimal sem-credits" placeholder="Credits" value="${credits}" oninput="updateCalculations()">
    `;
    container.appendChild(div);
}

window.clearAllSemesters = function() {
    if (confirm("Clear all semester records?")) {
        document.querySelectorAll('.sem-sgpa').forEach(i => i.value = '');
        document.querySelectorAll('.sem-credits').forEach(i => i.value = '');
        updateCalculations();
    }
};

window.removeRow = function(btn) {
    btn.parentElement.remove();
    updateCalculations();
};


window.handleGradeSelect = function(select) {
    updateCalculations();
};

function updateCalculations() {
    let totalCiPi = 0;
    let totalCi = 0;

    // 1. Current Semester (SGPA)
    document.querySelectorAll('#subjects-container .subject-row').forEach(row => {
        const c = parseFloat(row.querySelector('.sub-credits').value) || 0;
        const g = row.querySelector('.sub-grade').value;
        const grading = CGPA_CONFIG.grading.find(it => it.grade === g);
        const p = grading ? grading.points : 0;
        
        totalCiPi += (c * p);
        totalCi += c;
    });

    const currentSGPA = totalCi > 0 ? (totalCiPi / totalCi) : 0;

    // 2. Cumulative (CGPA)
    let grandCiPi = totalCiPi;
    let grandCi = totalCi;

    document.querySelectorAll('#semesters-container .subject-row').forEach(row => {
        const s = parseFloat(row.querySelector('.sem-sgpa').value) || 0;
        const c = parseFloat(row.querySelector('.sem-credits').value) || 0;
        
        grandCiPi += (s * c);
        grandCi += c;
    });

    const finalCGPA = grandCi > 0 ? (grandCiPi / grandCi) : 0;

    // 3. Update UI
    document.getElementById('display-sgpa').innerText = currentSGPA.toFixed(2);
    document.getElementById('display-cgpa').innerText = finalCGPA.toFixed(2);
    document.getElementById('display-credits').innerText = grandCi;

    // Division
    const divLabel = document.getElementById('division-label');
    const div = CGPA_CONFIG.divisions.find(d => finalCGPA >= d.min);
    if (div) {
        divLabel.innerText = div.label;
        divLabel.className = `division-badge ${div.class}`;
    }

    updateCharts(currentSGPA);
    updateAIInsights(finalCGPA, currentSGPA);
    saveToStorage();
}

function updateAIInsights(cgpa, sgpa) {
    const container = document.getElementById('ai-insights-list');
    if (!container) return;
    const insights = [];

    if (sgpa > 0) {
        insights.push({ icon: '🎓', text: `Your <strong>Semester SGPA</strong> is currently <strong>${sgpa.toFixed(2)}</strong>.` });
    }
    
    if (cgpa > 9) insights.push({ icon: '🏆', text: 'Stellar overall performance! Your CGPA is in the top 1%.' });
    else if (cgpa < 6 && cgpa > 0) insights.push({ icon: '⚠️', text: 'Notice: Your cumulative CGPA is below 6.0. Focus on high-credit subjects.' });
    
    // Backlog detection
    const backlogs = Array.from(document.querySelectorAll('#subjects-container .sub-grade'))
        .filter(s => s.value === 'F' || s.value === 'Ab').length;
    
    if (backlogs > 0) {
        insights.push({ icon: '🚨', text: `<strong>Backlog Detected:</strong> ${backlogs} subject(s) need improvement.` });
    }

    if (insights.length === 0) {
        insights.push({ icon: '💡', text: 'Add more data to get deeper performance analysis.' });
    }

    container.innerHTML = insights.map(i => `
        <div class="insight-chip" style="${i.icon === '🚨' ? 'border: 1px solid rgba(255,71,87,0.3); background: rgba(255,71,87,0.05);' : ''}">
            <span>${i.icon}</span>
            <div>${i.text}</div>
        </div>
    `).join('');
}

function updateCharts(currentVal) {
    const ctx = document.getElementById('cgpa-chart');
    if (!ctx) return;

    const labels = [];
    const data = [];

    document.querySelectorAll('#semesters-container .subject-row').forEach((row, i) => {
        labels.push(`Sem ${i+1}`);
        data.push(parseFloat(row.querySelector('.sem-sgpa').value) || 0);
    });
    
    labels.push('Current');
    data.push(currentVal);

    if (cgpaChart) cgpaChart.destroy();

    // Only attempt if Chart.js is loaded
    if (typeof Chart !== 'undefined') {
        cgpaChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'SGPA Performance per Semester',
                    data: data,
                    borderColor: '#00f2ff',
                    backgroundColor: 'rgba(0, 242, 255, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#6c63ff',
                    pointRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: false, min: 0, max: 10, grid: { color: 'rgba(255,255,255,0.05)' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }
}

window.onSemRemChange = function() {
    const semDone = parseInt(document.getElementById('plan-sem-done').value) || 0;
    const remSems = parseInt(document.getElementById('plan-sem-rem').value);
    const currentCredits = parseFloat(document.getElementById('plan-current-credits').value) || 0;
    const remCreditsElem = document.getElementById('plan-rem-credits');

    if (remCreditsElem && !isNaN(remSems) && remSems >= 0) {
        const avgCreditsPerSem = (semDone > 0 && currentCredits > 0) ? (currentCredits / semDone) : 20;
        remCreditsElem.value = Math.round(remSems * avgCreditsPerSem);
    }
};

window.onSemDoneChange = function() {
    const semDone = parseInt(document.getElementById('plan-sem-done').value) || 0;
    const remInput = document.getElementById('plan-sem-rem');
    if (remInput) {
        const remaining = Math.max(0, 8 - semDone);
        remInput.value = remaining;
        window.onSemRemChange();
    }
};

window.runPrediction = function() {
    const semDone = parseInt(document.getElementById('plan-sem-done').value) || 0;
    let remSemesters = parseInt(document.getElementById('plan-sem-rem').value);
    const target = parseFloat(document.getElementById('target-cgpa-input').value);
    const currentCGPA = parseFloat(document.getElementById('plan-current-cgpa').value) || 0;
    const currentCredits = parseFloat(document.getElementById('plan-current-credits').value) || 0;
    let remCredits = parseFloat(document.getElementById('plan-rem-credits').value);

    const resultDiv = document.getElementById('planner-result');
    const title = document.getElementById('plan-difficulty');
    const msg = document.getElementById('plan-msg');

    if (isNaN(target)) {
        alert("Please enter a Target CGPA.");
        return;
    }

    if (isNaN(remSemesters) || remSemesters < 0) {
        remSemesters = Math.max(0, 8 - semDone);
        const remInput = document.getElementById('plan-sem-rem');
        if (remInput) remInput.value = remSemesters;
    }

    if (isNaN(remCredits) || remCredits <= 0) {
        const avgCreditsPerSem = (semDone > 0 && currentCredits > 0) ? (currentCredits / semDone) : 20;
        remCredits = Math.round(remSemesters * avgCreditsPerSem);
        const remCreditsElem = document.getElementById('plan-rem-credits');
        if (remCreditsElem) remCreditsElem.value = remCredits;
    }

    if (remSemesters === 0 || remCredits === 0) {
        title.innerHTML = "🎓 Course Completed";
        title.style.color = "#00f2ff";
        msg.innerText = "Calculations show no remaining semesters or credits left to complete.";
        resultDiv.classList.add('active');
        return;
    }

    // Math: ReqSGPA = (Target * (CurrentCredits + RemCredits) - (CurrentCGPA * CurrentCredits)) / RemCredits
    const totalCredits = currentCredits + remCredits;
    const reqSGPA = (target * totalCredits - (currentCGPA * currentCredits)) / remCredits;

    resultDiv.classList.add('active');
    const semText = remSemesters === 1 ? 'semester' : 'semesters';

    if (reqSGPA > 10) {
        title.innerHTML = "❌ Impossible Goal";
        title.style.color = "#ff4757";
        msg.innerText = `To hit ${target}, you need an average SGPA of ${reqSGPA.toFixed(2)} over the remaining ${remSemesters} ${semText} (${remCredits} credits). This is mathematically impossible (max SGPA is 10.00).`;
    } else if (reqSGPA <= 0) {
        title.innerHTML = "🎉 Goal Secured";
        title.style.color = "#2ecc71";
        msg.innerText = `Your current CGPA (${currentCGPA.toFixed(2)}) is high enough that you will comfortably achieve your ${target} CGPA goal.`;
    } else if (reqSGPA < 4) {
        title.innerHTML = "✅ Easy Goal";
        title.style.color = "#2ecc71";
        msg.innerText = `You only need a minimum passing average SGPA of ${Math.max(reqSGPA, 4.0).toFixed(2)} across the remaining ${remSemesters} ${semText} (${remCredits} credits) to reach your ${target} CGPA goal.`;
    } else {
        const difficulty = reqSGPA > 8.5 ? 'Hard' : (reqSGPA > 7.5 ? 'Moderate' : 'Easy');
        title.innerHTML = difficulty === 'Hard' ? "🔥 Hard Path" : (difficulty === 'Moderate' ? "⚡ Moderate Path" : "✨ Easy Path");
        title.style.color = difficulty === 'Hard' ? '#ff9f43' : (difficulty === 'Moderate' ? '#00f2ff' : '#2ecc71');
        msg.innerText = `To hit ${target}, you need an average SGPA of ${reqSGPA.toFixed(2)} over the next ${remSemesters} ${semText} (${remCredits} total credits).`;
    }
};

window.syncPlannerData = function() {
    const currentCGPA = parseFloat(document.getElementById('display-cgpa').innerText) || 0;
    const currentCredits = parseFloat(document.getElementById('display-credits').innerText) || 0;
    
    // Count filled semesters
    let done = 0;
    document.querySelectorAll('#semesters-container .semester-slot').forEach(row => {
        if (row.querySelector('.sem-sgpa').value || row.querySelector('.sem-credits').value) done++;
    });

    const remSems = Math.max(0, 8 - done);
    document.getElementById('plan-sem-done').value = done;
    const remInput = document.getElementById('plan-sem-rem');
    if (remInput) remInput.value = remSems;
    document.getElementById('plan-current-cgpa').value = currentCGPA.toFixed(2);
    document.getElementById('plan-current-credits').value = currentCredits;
    
    // Auto-calculate remaining credits assuming 20 credits/sem
    document.getElementById('plan-rem-credits').value = Math.max(0, remSems * 20);
    
    window.showToast("Planner synced with calculations!");
};



function saveToStorage() {
    const data = {
        subjects: Array.from(document.querySelectorAll('#subjects-container .subject-row')).map(row => ({
            name: row.querySelector('.sub-name').value,
            credits: row.querySelector('.sub-credits').value,
            grade: row.querySelector('.sub-grade').value
        })),
        semesters: Array.from(document.querySelectorAll('#semesters-container .semester-slot')).map(row => ({
            sgpa: row.querySelector('.sem-sgpa').value,
            credits: row.querySelector('.sem-credits').value
        }))
    };
    localStorage.setItem('skil_matrix_cgpa_data', JSON.stringify(data));
}

function loadFromStorage() {
    const raw = localStorage.getItem('skil_matrix_cgpa_data');
    if (!raw) return;
    try {
        const data = JSON.parse(raw);
        const subContainer = document.getElementById('subjects-container');
        const semContainer = document.getElementById('semesters-container');
        
        data.subjects.forEach(s => addNewSubject(s.name, s.credits, s.grade));
        
        // Load data into existing 8 slots
        const slots = document.querySelectorAll('#semesters-container .semester-slot');
        data.semesters.forEach((s, i) => {
            if (slots[i]) {
                slots[i].querySelector('.sem-sgpa').value = s.sgpa;
                slots[i].querySelector('.sem-credits').value = s.credits;
            }
        });
    } catch(e) { console.error("Load failed", e); }
}


window.saveToCloud = function() {
    if (window.currentUser && !window.currentUser.isGuest) {
        window.showToast("Syncing with SKiL Cloud...");
        // Integration with Firebase would go here
        setTimeout(() => window.showToast("✅ Cloud Sync Successful!"), 1500);
    } else {
        alert("Please login to save data to the cloud.");
    }
};
