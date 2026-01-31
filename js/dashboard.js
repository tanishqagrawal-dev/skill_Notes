let initialOverviewHTML = '';

document.addEventListener('DOMContentLoaded', () => {
    // Capture the initial overview HTML to restore it later without reload
    const overviewPane = document.getElementById('overview');
    if (overviewPane) {
        initialOverviewHTML = overviewPane.innerHTML;
    }
    initTabs();
});

// --- Tab Switching Logic ---
function initTabs() {
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = item.getAttribute('data-tab');

            // Update Nav UI
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            renderTabContent(tabId);
        });
    });
}

function renderTabContent(tabId) {
    const contentArea = document.getElementById('tab-content');
    if (!contentArea) return;

    let html = '';
    switch (tabId) {
        case 'overview':
            html = `<div class="tab-pane active" id="overview">${initialOverviewHTML}</div>`;
            contentArea.innerHTML = html;
            break;

        case 'notes':
            html = `
                <div class="tab-pane active" style="padding:0;">
                    <div class="notes-hub-wrapper">
                        <aside class="notes-sidebar-tree">
                            <div class="tree-header-pro">
                                <h3>Resources Explorer</h3>
                            </div>
                            <div class="tree-browser" id="notes-tree-container">
                                <!-- Tree rendered via JS -->
                            </div>
                        </aside>
                        <main class="notes-main-hub" id="notes-hub-main">
                            <!-- Hub Home will be rendered here by default -->
                        </main>
                    </div>
                </div>

                <!-- Shared Upload Modal -->
                <div id="upload-modal" class="modal-overlay" style="display:none;">
                    <div class="glass-card modal-content" style="background: rgba(15, 20, 30, 0.95); border: 1px solid var(--border-glass);">
                        <h3>Upload New Resource</h3>
                        <div id="upload-context" class="upload-context-badge">
                            <!-- Injected context -->
                        </div>
                        <p class="meta" style="margin-bottom: 1.5rem; color: var(--text-dim); font-size: 0.9rem;">
                            Your contribution will empower thousands of students. Resources appear after verification.
                        </p>
                        
                        <div class="input-group">
                            <label>Resource Title</label>
                            <input type="text" id="upload-title" placeholder="e.g. Unit 3 - Operating Systems (Full Notes)">
                        </div>
                        <div class="input-group" style="margin-top: 1rem;">
                            <label>Select Document (PDF/PPT)</label>
                            <input type="file" id="upload-file">
                        </div>
                        <div class="modal-actions" style="margin-top: 2rem;">
                            <button class="btn btn-ghost" onclick="closeUploadModal()">Cancel</button>
                            <button class="btn btn-primary" onclick="submitNote()">Submit for Approval</button>
                        </div>
                    </div>
                </div>
            `;
            contentArea.innerHTML = html;
            setTimeout(() => {
                initNotesHub();
                renderHubHome(); // Render the featured home by default
            }, 0);
            break;

        case 'planner':
            html = `
                <div class="tab-pane active">
                    <div class="welcome-header">
                        <h1>Study <span class="gradient-text">Planner</span></h1>
                        <p>Generate a custom roadmap for your upcoming exams.</p>
                    </div>
                    <div class="planner-tool glass-card" style="padding: 2.5rem; margin-top: 2rem;">
                        <h3>Create New Roadmap</h3>
                        <p style="color: var(--text-dim); margin-top: 0.5rem; font-size: 0.95rem;">Enter your exam subject and our AI will build a day-by-day study schedule.</p>
                        <div style="display: flex; gap: 1rem; margin-top: 2rem;">
                            <input type="text" id="planner-subject" placeholder="Enter Subject (e.g. Operating Systems)" class="btn btn-ghost" style="flex: 1; text-align: left; background: rgba(255,255,255,0.05); padding: 1.2rem;">
                            <button class="btn btn-primary" onclick="generateRoadmap()">Generate with AI</button>
                        </div>
                    </div>
                    <div id="planner-results" style="margin-top: 2rem; min-height: 200px;">
                        <!-- Results injected here -->
                    </div>
                </div>
            `;
            contentArea.innerHTML = html;
            break;

        case 'ai-tools':
            html = `
                <div class="tab-pane active">
                    <div class="welcome-header">
                        <h1>AI <span class="gradient-text">Tools</span></h1>
                        <p>Elite academic assistance powered by artificial intelligence.</p>
                    </div>
                    <div class="dashboard-grid" style="margin-top: 2rem;">
                        <div class="glass-card">
                            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
                                <div style="font-size: 1.5rem;">⏱️</div>
                                <h3 style="margin:0;">Focus Studio</h3>
                            </div>
                            <div id="pomodoro-timer" style="text-align: center;">
                                <div id="timer-display" style="font-size: 4rem; font-weight: 800; margin: 2rem 0; letter-spacing: 2px; color: var(--primary-light);">25:00</div>
                                <div style="display: flex; gap: 1.5rem; justify-content: center;">
                                    <button class="btn btn-primary" id="pomo-start" style="padding: 1rem 2rem;">Start session</button>
                                    <button class="btn btn-ghost" id="pomo-reset">Reset</button>
                                </div>
                            </div>
                        </div>
                        <div class="glass-card">
                            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
                                <div style="font-size: 1.5rem;">💎</div>
                                <h3 style="margin:0;">Smart Doubt Solver</h3>
                            </div>
                            <textarea id="ai-doubt-input" placeholder="Paste complex problems, code, or theories here..." style="width:100%; height:140px; background:rgba(0,0,0,0.2); border:1px solid var(--border-glass); border-radius:12px; color:white; padding:1.2rem; margin-top:0.5rem; resize:none; font-size: 1rem;"></textarea>
                            <button class="btn btn-primary" style="width:100%; margin-top:1.5rem; padding: 1rem;" onclick="solveDoubt()">Ask AI Assistant</button>
                            <div id="ai-doubt-result" style="margin-top: 1.5rem; font-size: 0.95rem; color: var(--text-muted); line-height: 1.6;"></div>
                        </div>
                    </div>
                </div>
            `;
            contentArea.innerHTML = html;
            setTimeout(initPomodoro, 0);
            break;

        case 'analytics':
            html = `
                <div class="tab-pane active">
                    <div class="welcome-header">
                        <h1>Academic <span class="gradient-text">Insights</span></h1>
                        <p>Detailed breakdown of your learning performance and consistency.</p>
                    </div>
                    <div class="dashboard-grid" style="margin-top:2rem;">
                        <div class="glass-card">
                            <h3>Skill Proficiency</h3>
                            <div style="margin-top: 2rem; display: flex; flex-direction: column; gap: 1.5rem;">
                                ${renderSkillBar('Logical Reasoning', 85, '#6c63ff')}
                                ${renderSkillBar('Memory Retention', 70, '#00e5ff')}
                                ${renderSkillBar('Speed & Accuracy', 92, '#ff007a')}
                            </div>
                        </div>
                        <div class="glass-card">
                            <h3>Activity Heatmap</h3>
                            <div style="height: 200px; display: flex; gap: 4px; align-items: flex-end; padding-bottom: 20px;">
                                ${Array.from({ length: 20 }).map((_, i) => `<div style="flex:1; background: ${i > 10 ? 'var(--primary)' : 'rgba(108, 99, 255, 0.2)'}; height: ${Math.random() * 80 + 20}%; border-radius: 4px;"></div>`).join('')}
                            </div>
                            <p style="text-align: center; color: var(--text-dim); font-size: 0.8rem;">Consistency over the last 20 days</p>
                        </div>
                    </div>
                </div>
            `;
            contentArea.innerHTML = html;
            break;

        case 'settings':
            html = `
                <div class="tab-pane active">
                    <div class="welcome-header">
                        <h1>Account <span class="gradient-text">Settings</span></h1>
                        <p>Manage your profile and platform preferences.</p>
                    </div>
                    <div class="glass-card" style="margin-top: 2rem; max-width: 600px;">
                        <div style="display:flex; gap: 2rem; align-items: center; padding-bottom: 2rem; border-bottom: 1px solid var(--border-glass);">
                            <div class="avatar" style="width: 80px; height: 80px; font-size: 2rem;">T</div>
                            <div>
                                <h3 style="margin:0;">Tanishq Agrawal</h3>
                                <p style="color: var(--text-dim);">tanishq@example.com</p>
                                <button class="btn btn-sm btn-ghost" style="margin-top: 0.5rem;">Change Avatar</button>
                            </div>
                        </div>
                        <div style="margin-top: 2rem; display: grid; gap: 1.5rem;">
                            <div class="input-group">
                                <label>Display Name</label>
                                <input type="text" value="Tanishq" class="btn btn-ghost" style="text-align:left; width:100%; cursor: text;">
                            </div>
                            <div class="input-group">
                                <label>Preferred Institution</label>
                                <input type="text" value="Institute of Technology" class="btn btn-ghost" style="text-align:left; width:100%; cursor: text;">
                            </div>
                            <button class="btn btn-primary" onclick="alert('Settings Saved!')">Save Changes</button>
                        </div>
                    </div>
                </div>
            `;
            contentArea.innerHTML = html;
            break;

        default:
            html = `<div class="tab-pane active"><h1>${tabId}</h1><p>Module integration in progress.</p></div>`;
            contentArea.innerHTML = html;
    }
}

function renderSkillBar(label, percent, color) {
    return `
        <div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.9rem;">
                <span style="color: var(--text-muted);">${label}</span>
                <span style="font-weight: 700; color: ${color};">${percent}%</span>
            </div>
            <div style="height: 8px; background: rgba(255,255,255,0.05); border-radius: 10px; overflow: hidden;">
                <div style="height: 100%; width: ${percent}%; background: ${color}; border-radius: 10px;"></div>
            </div>
        </div>
    `;
}

// --- Planner Implementation ---
window.generateRoadmap = function () {
    const subject = document.getElementById('planner-subject').value;
    const results = document.getElementById('planner-results');
    if (!subject) return alert('Please enter a subject!');

    results.innerHTML = `<div class="glass-card" style="display:flex; align-items:center; justify-content:center; padding: 3rem;">
        <div class="loader-pro">🚀 Generating your roadmap for ${subject}...</div>
    </div>`;

    setTimeout(() => {
        results.innerHTML = `
            <div class="glass-card" style="padding: 2.5rem; animation: fadeIn 0.5s ease;">
                <h3 style="margin-bottom: 2rem; display: flex; align-items: center; gap: 1rem;">
                    <span style="color: var(--primary-light);">✨</span> AI Generated Roadmap: ${subject}
                </h3>
                <div style="display: grid; gap: 1rem;">
                    ${renderRoadmapStep(1, 'Foundations & Core Concepts', 'Focus on terminology and basic architecture.')}
                    ${renderRoadmapStep(2, 'In-depth Study (Unit 1 & 2)', 'Focus on process management and memory allocation.')}
                    ${renderRoadmapStep(3, 'Advanced Topics (Unit 3 & 4)', 'File systems, Security and Distributed OS.')}
                    ${renderRoadmapStep(4, 'Revision & Mock Tests', 'Solve last 5 years PYQs and time yourself.')}
                </div>
                <button class="btn btn-primary" style="margin-top: 2rem; width: 100%;" onclick="alert('Roadmap added to your mobile calendar!')">Add to My Calendar</button>
            </div>
        `;
    }, 1500);
};

function renderRoadmapStep(day, title, desc) {
    return `
        <div style="display: flex; gap: 1.5rem; padding: 1.5rem; background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px solid rgba(108, 99, 255, 0.1);">
            <div style="width: 40px; height: 40px; background: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; flex-shrink: 0;">${day}</div>
            <div>
                <h4 style="margin:0 0 0.5rem 0;">${title}</h4>
                <p style="margin:0; font-size: 0.9rem; color: var(--text-dim);">${desc}</p>
            </div>
        </div>
    `;
}

// --- AI Doubt Solver ---
window.solveDoubt = function () {
    const input = document.getElementById('ai-doubt-input');
    const result = document.getElementById('ai-doubt-result');
    if (!input.value) return alert('Please type your doubt!');

    result.innerHTML = '✨ Analyzing your query...';
    setTimeout(() => {
        result.innerHTML = `
            <div style="background: rgba(108, 99, 255, 0.05); padding: 1.5rem; border-radius: 12px; border: 1px solid rgba(108, 99, 255, 0.2);">
                <strong style="color: var(--primary-light); display: block; margin-bottom: 0.5rem;">AI Solution:</strong>
                Based on current syllabus standards, the answer involves three main pillars: modular scalability, low-latency execution, and atomic state transitions. I recommend reviewing **Chapter 4** of the Standard Reference for a deeper proof of this concept.
            </div>
        `;
        input.value = '';
    }, 1200);
};

// --- Smart Notes Hub Rendering ---
const hubTreeData = [
    {
        name: 'B.Tech (Engineering)',
        children: [
            {
                name: 'CSE & IT',
                children: [
                    {
                        name: '2nd Year',
                        children: ['Operating Systems', 'DBMS', 'Data Structures', 'Discrete Maths', 'Computer Architecture']
                    },
                    {
                        name: '3rd Year',
                        children: ['Computer Networks', 'Software Engineering', 'Compiler Design', 'AI & ML', 'Cloud Computing']
                    },
                    {
                        name: '4th Year',
                        children: ['Cyber Security', 'Big Data', 'Distributed Systems']
                    }
                ]
            },
            {
                name: 'Mechanical',
                children: ['Thermodynamics', 'Fluid Mechanics', 'CAD/CAM']
            },
            {
                name: 'Electronics',
                children: ['Digital Electronics', 'VLSI Design', 'Signal Processing']
            }
        ]
    },
    {
        name: 'M.Tech / Masters',
        children: ['Advanced Algorithms', 'Distributed Database', 'Soft Computing']
    },
    {
        name: 'Test Preparation',
        children: [
            {
                name: 'GATE 2026',
                children: ['GATE CSE', 'GATE ECE', 'GATE ME']
            },
            {
                name: 'UPSC / SSC',
                children: ['General Studies', 'Aptitude', 'English']
            }
        ]
    }
];

function initNotesHub() {
    const container = document.getElementById('notes-tree-container');
    if (container) container.innerHTML = renderTreeUI(hubTreeData);
}

// --- Hub Home / Featured Section ---
window.renderHubHome = function () {
    const mainArea = document.getElementById('notes-hub-main');
    if (!mainArea) return;

    mainArea.innerHTML = `
        <div class="hub-home-container" style="padding: 3rem 4rem; animation: fadeIn 0.5s ease;">
            <div class="hub-hero-pro">
                <div class="hero-left">
                    <span class="hub-badge-glow">COMMUNITY HUB</span>
                    <h1 style="font-size: 3.5rem; margin-top: 1rem; line-height: 1.1;">Academic <span class="gradient-text">Excellence</span> Shared.</h1>
                    <p style="color: var(--text-dim); font-size: 1.15rem; margin-top: 1.5rem; max-width: 550px; line-height: 1.6;">
                        Browse over 12,000+ curated notes, previous year papers, and study guides contributed by students from top institutions.
                    </p>
                    <div class="hub-search-container" style="margin-top: 2.5rem; position: relative; max-width: 500px;">
                        <input type="text" placeholder="Search by subject, topic or uploader..." style="width:100%; padding: 1.2rem 1.5rem 1.2rem 3rem; background: rgba(255,255,255,0.05); border: 1px solid var(--border-glass); border-radius: 12px; color: white; outline: none;">
                        <span style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); opacity: 0.5;">🔍</span>
                    </div>
                    <div class="hub-stats-row" style="display: flex; gap: 3rem; margin-top: 2.5rem;">
                        <div class="h-stat">
                            <span class="val">12K+</span>
                            <span class="lbl">Resources</span>
                        </div>
                        <div class="h-stat">
                            <span class="val">450+</span>
                            <span class="lbl">Contributors</span>
                        </div>
                        <div class="h-stat">
                            <span class="val">85K+</span>
                            <span class="lbl">Downloads</span>
                        </div>
                    </div>
                </div>
                <div class="hero-right">
                    <!-- Illustrated or empty space for visual balance -->
                </div>
            </div>

            <section class="featured-section" style="margin-top: 5rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h2 style="font-size: 1.8rem;">Featured <span class="highlight">Resources</span></h2>
                    <button class="btn btn-sm btn-ghost">View All Trending</button>
                </div>
                <div class="featured-grid-hub" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 2rem;">
                    ${renderFeaturedCard('Operating Systems', 'Complete Kernel Guide', 'Tanishq A.', '980', '🔥 HOT')}
                    ${renderFeaturedCard('DBMS', 'SQL Mastery Notes', 'Priya S.', '1.2k', '⭐ TOP')}
                    ${renderFeaturedCard('Computer Networks', 'OSI Model Deep Dive', 'Rahul K.', '650', '✨ NEW')}
                </div>
            </section>

            <section class="community-champions" style="margin-top: 5rem; padding: 3rem; background: rgba(108, 99, 255, 0.05); border-radius: 20px; border: 1px solid rgba(108, 99, 255, 0.1);">
                <div style="display: flex; gap: 4rem; align-items: center;">
                    <div style="flex: 1;">
                        <h2 style="margin-bottom: 1rem;">Community <span class="gradient-text">Champions</span></h2>
                        <p style="color: var(--text-dim); line-height: 1.6;">Join our league of elite contributors. Every document you upload helps thousands of students across the globe. Start contributing today and earn badges.</p>
                        <button class="btn btn-primary" style="margin-top: 1.5rem;" onclick="handleGlobalUpload()">Become a Contributor</button>
                    </div>
                    <div class="champions-list" style="flex: 1.2; display: flex; gap: 1rem; justify-content: flex-end;">
                        ${renderChampionSlot('T', 'Tanishq A.', '125 Uploads')}
                        ${renderChampionSlot('P', 'Priya S.', '84 Uploads')}
                        ${renderChampionSlot('R', 'Rahul K.', '62 Uploads')}
                    </div>
                </div>
            </section>
        </div>
    `;
};

function renderFeaturedCard(subject, title, author, views, badge) {
    return `
        <div class="featured-card-hub glass-card">
            <div class="card-badge-top">${badge}</div>
            <span class="subject-tag-pro">${subject}</span>
            <h3 style="margin: 0.5rem 0 1.5rem 0; font-size: 1.3rem;">${title}</h3>
            <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 1.5rem; border-top: 1px solid var(--border-glass);">
                <div style="display: flex; align-items: center; gap: 0.8rem;">
                    <div class="mini-avatar">${author.charAt(0)}</div>
                    <span style="font-size: 0.85rem; color: var(--text-muted);">${author}</span>
                </div>
                <div style="font-size: 0.85rem; color: var(--text-dim);">👁️ ${views}</div>
            </div>
        </div>
    `;
}

function renderChampionSlot(initial, name, stats) {
    return `
        <div class="champion-item" style="text-align: center; padding: 1.5rem; background: rgba(255,255,255,0.03); border-radius: 16px; min-width: 140px; border: 1px solid rgba(255,255,255,0.05);">
            <div class="avatar" style="margin: 0 auto 1rem auto; width: 50px; height: 50px; font-size: 1.2rem; background: var(--primary);">${initial}</div>
            <h4 style="margin: 0; font-size: 0.95rem;">${name}</h4>
            <p style="margin: 0.4rem 0 0 0; font-size: 0.8rem; color: var(--text-dim);">${stats}</p>
        </div>
    `;
}

function renderTreeUI(data) {
    return data.map(node => {
        const hasChildren = node.children && node.children.length > 0;
        const name = typeof node === 'string' ? node : node.name;

        return `
            <div class="tree-node-item">
                <div class="node-header ${!hasChildren ? 'leaf-node' : ''}" 
                     onclick="${hasChildren ? 'this.parentElement.classList.toggle(\'expanded\')' : `renderHubSubject('${name}')`}">
                    ${hasChildren ? '<span class="node-arrow">▶</span>' : '📘'}
                    <span class="node-text">${name}</span>
                </div>
                ${hasChildren ? `
                    <div class="node-children-container">
                        ${renderTreeUI(node.children)}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

window.renderHubSubject = function (subject) {
    const mainArea = document.getElementById('notes-hub-main');
    if (!mainArea) return;

    // Highlight active leaf in tree
    document.querySelectorAll('.node-header').forEach(h => h.classList.remove('active'));
    if (event && event.currentTarget) event.currentTarget.classList.add('active');

    mainArea.innerHTML = `
        <div class="subject-hub-page">
            <div class="hub-breadcrumb">
                <span>Dashboard</span> <span>Resources</span> <span>Explorer</span> <span>${subject}</span>
            </div>
            
            <div class="subject-hero-section">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
                    <div>
                        <h1>${subject}</h1>
                        <div class="subject-badges">
                            <span class="sub-badge accent">UNIVERSITY CORE</span>
                            <span class="sub-badge">VERIFIED</span>
                        </div>
                    </div>
                    <button class="btn btn-primary" onclick="showUploadModal('${subject}')">+ Contribute Note</button>
                </div>
                <p class="subject-description-pro">Elite study materials for ${subject}. These resources have been curated and verified by academic leaders to ensure the highest quality of learning.</p>
            </div>

            <div class="hub-tab-bar">
                <div class="hub-tab active" onclick="switchResourceTab(this)">Curated Notes</div>
                <div class="hub-tab" onclick="switchResourceTab(this)">PYQ Explorer</div>
                <div class="hub-tab" onclick="switchResourceTab(this)">Review Hub</div>
            </div>

            <div class="resource-list-pro">
                ${renderMockResource(subject, 'Comprehensive Unit 1 Study Guide')}
                ${renderMockResource(subject, 'Exam Focused: Important Questions')}
                ${renderMockResource(subject, 'Last Minute Revision Sheet')}
            </div>
        </div>
    `;
};

function renderMockResource(subject, title) {
    return `
        <div class="hub-resource-item">
            <div class="item-left-content">
                <div class="item-type-icon">📄</div>
                <div class="item-details-text">
                    <h4>${title}</h4>
                    <div class="item-meta-info">
                        <span>📅 Jan 2026</span>
                        <span>👤 Admin Choice</span>
                        <span>📥 ${Math.floor(Math.random() * 2000 + 500)} downloads</span>
                    </div>
                </div>
            </div>
            <div class="item-right-actions">
                <div class="item-engagement">
                    <span class="eng-stat">👍 ${Math.floor(Math.random() * 200 + 40)}</span>
                </div>
                <button class="btn btn-primary btn-sm" onclick="alert('Download started...')">View / Download</button>
            </div>
        </div>
    `;
}

window.switchResourceTab = function (el) {
    document.querySelectorAll('.hub-tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
};

// --- Upload Modal Logic ---
window.showUploadModal = function (subject) {
    const modal = document.getElementById('upload-modal');
    const contextEl = document.getElementById('upload-context');
    if (contextEl && subject) {
        contextEl.innerHTML = `<span>📗 ${subject}</span>`;
    }
    if (modal) modal.style.display = 'flex';
};

window.closeUploadModal = function () {
    const modal = document.getElementById('upload-modal');
    if (modal) modal.style.display = 'none';
};

window.submitNote = function () {
    const title = document.getElementById('upload-title').value;
    if (!title) return alert('Please enter a title');
    alert('Resource submitted! It will appear once verified by the community leaders.');
    closeUploadModal();
};

window.handleGlobalUpload = function () {
    const notesTabBtn = document.querySelector('[data-tab="notes"]');
    if (notesTabBtn) {
        notesTabBtn.click();
        alert("Select a subject from the Explorer to upload content precisely.");
    }
};

// --- Pomodoro Implementation ---
function initPomodoro() {
    let timeLeft = 25 * 60;
    let timerId = null;
    const display = document.getElementById('timer-display');
    const startBtn = document.getElementById('pomo-start');
    const resetBtn = document.getElementById('pomo-reset');

    if (!display) return;

    function update() {
        const m = Math.floor(timeLeft / 60);
        const s = timeLeft % 60;
        display.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    if (startBtn) {
        startBtn.onclick = () => {
            if (timerId) {
                clearInterval(timerId);
                timerId = null;
                startBtn.textContent = 'Resume session';
                startBtn.classList.remove('btn-primary');
                startBtn.classList.add('btn-ghost');
            } else {
                timerId = setInterval(() => {
                    timeLeft--;
                    update();
                    if (timeLeft <= 0) {
                        clearInterval(timerId);
                        alert("Session complete! Time for a short break.");
                        timeLeft = 5 * 60;
                        update();
                    }
                }, 1000);
                startBtn.textContent = 'Pause session';
                startBtn.classList.add('btn-primary');
                startBtn.classList.remove('btn-ghost');
            }
        };
    }
    if (resetBtn) {
        resetBtn.onclick = () => {
            clearInterval(timerId);
            timerId = null;
            timeLeft = 25 * 60;
            update();
            if (startBtn) {
                startBtn.textContent = 'Start session';
                startBtn.classList.add('btn-primary');
                startBtn.classList.remove('btn-ghost');
            }
        };
    }
}
