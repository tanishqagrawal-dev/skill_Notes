// js/codetantra.js
import { CodeTantraDB } from '../data/codetantra-db.js';

const AppState = {
    college: localStorage.getItem('ct_college') || '',
    branch: localStorage.getItem('ct_branch') || '',
    semester: localStorage.getItem('ct_semester') || '',
    currentSubjectId: null
};

// --- Routing & Rendering ---

export async function renderApp() {
    const root = document.getElementById('ct-app-root');
    if (!root) return;

    // Fetch user plan
    if (window.auth && window.auth.currentUser) {
        try {
            const uid = window.auth.currentUser.uid;
            const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://skil-matrix-server.onrender.com';
            const res = await fetch(`${apiUrl}/api/user-plan?uid=${uid}`);
            const data = await res.json();
            if (data.success) {
                AppState.userPlan = data.plan; // 'free', 'codetantra', or 'pro'
            } else {
                AppState.userPlan = 'free';
            }
        } catch (e) {
            AppState.userPlan = 'free';
        }
    } else {
        AppState.userPlan = 'free';
    }

    if (AppState.currentSubjectId) {
        renderSubjectPage(root, AppState.currentSubjectId);
    } else {
        if (!AppState.college || !AppState.branch || !AppState.semester) {
            renderOnboarding(root);
        } else {
            renderSubjectHub(root);
        }
    }
}
window.renderCodeTantraApp = renderApp;

// Global hook for dashboard tab
window.showCodeTantraSubject = function (subjectId) {
    AppState.currentSubjectId = subjectId;
    renderApp();
};

window.goBackToHub = function () {
    AppState.currentSubjectId = null;
    renderApp();
};

// --- Views ---

function renderOnboarding(root) {
    const collegesHtml = CodeTantraDB.colleges.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    const branchesHtml = CodeTantraDB.branches.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
    const semestersHtml = CodeTantraDB.semesters.map(s => `<option value="${s.id}">${s.name}</option>`).join('');

    root.innerHTML = `
        <div class="ct-dashboard-container">
            <div class="ct-onboarding-wrapper">
                <img src="../assets/codetantra.png" onerror="this.style.display='none'" alt="CodeTantra Logo" class="ct-setup-logo">
                <h2 class="ct-onboarding-title">CodeTantra Solutions Hub</h2>
                <p class="ct-onboarding-sub">Select your academic profile to access code solutions</p>
                <form id="ct-onboarding-form" class="ct-onboarding-form">
                    <div class="ct-form-group">
                        <label>🏛️ College</label>
                        <select id="ct-college" class="ct-select" required>
                            <option value="">Select College</option>
                            ${collegesHtml}
                        </select>
                    </div>
                    <div class="ct-form-group">
                        <label>🎓 Branch</label>
                        <select id="ct-branch" class="ct-select" required>
                            <option value="">Select Branch</option>
                            ${branchesHtml}
                        </select>
                    </div>
                    <div class="ct-form-group">
                        <label>📅 Semester</label>
                        <select id="ct-semester" class="ct-select" required>
                            <option value="">Select Semester</option>
                            ${semestersHtml}
                        </select>
                    </div>
                    <button type="submit" class="ct-btn-primary">🚀 Explore Solutions</button>
                </form>
            </div>
        </div>
    `;

    document.getElementById('ct-onboarding-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const col = document.getElementById('ct-college').value;
        const br = document.getElementById('ct-branch').value;
        const sem = document.getElementById('ct-semester').value;

        localStorage.setItem('ct_college', col);
        localStorage.setItem('ct_branch', br);
        localStorage.setItem('ct_semester', sem);

        AppState.college = col;
        AppState.branch = br;
        AppState.semester = sem;

        renderApp();
    });
}

function renderSubjectHub(root) {
    const key = `${AppState.semester}_${AppState.branch}`;
    const subjects = CodeTantraDB.subjects[key] || [];

    const subjectsHtml = subjects.length > 0 ? subjects.map(s => {
        // Determine if icon is text (pill badge) or emoji
        const isTextIcon = s.icon && s.icon.length <= 6 && !/\p{Emoji}/u.test(s.icon);
        const iconHtml = isTextIcon
            ? `<div class="ct-subject-pill-badge">${s.icon}</div>`
            : `<div class="ct-subject-icon-emoji">${s.icon}</div>`;

        return `
        <div class="ct-card ct-subject-card" onclick="window.showCodeTantraSubject('${s.id}')">
            ${iconHtml}
            <div class="ct-subject-title">${s.name}</div>
            <div class="ct-subject-fullname">${s.fullName}</div>
            <div class="ct-subject-meta">${s.questionsCount}+ Questions</div>
            <div class="ct-view-btn">View Solutions →</div>
        </div>
    `}).join('') : `<div class="ct-empty-state"><p>No subjects found for Semester ${AppState.semester} — ${AppState.branch.toUpperCase()}.</p><p style="font-size:0.85rem;margin-top:8px;color:var(--text-dim)">More subjects coming soon!</p></div>`;

    root.innerHTML = `
        <div class="ct-dashboard-container">
            <div class="ct-header">
                <div class="ct-header-info">
                    <h1>📚 Subjects</h1>
                    <p>Semester ${AppState.semester} · ${CodeTantraDB.branches.find(b => b.id === AppState.branch)?.name || AppState.branch}</p>
                </div>
                <button class="ct-btn-outline" onclick="window.resetProfile()">⚙ Change Profile</button>
            </div>

            <div class="ct-subject-grid">
                ${subjectsHtml}
            </div>
        </div>
    `;
}

function renderSubjectPage(root, subjectId) {
    // Find subject across all DB entries
    let subject = null;
    let subjectMeta = null;
    for (const [key, list] of Object.entries(CodeTantraDB.subjects)) {
        const found = list.find(s => s.id === subjectId);
        if (found) {
            subject = found;
            const parts = key.split('_');
            subjectMeta = { sem: parts[0], branch: parts.slice(1).join('_') };
            break;
        }
    }

    if (!subject) {
        root.innerHTML = `
            <div class="ct-dashboard-container">
                <button class="ct-back-btn" onclick="window.goBackToHub()">← Back to Hub</button>
                <p style="color: var(--text-dim); margin-top: 2rem;">Subject not found.</p>
            </div>
        `;
        return;
    }

    if (subject.type === 'theory') {
        renderTheorySubjectPage(root, subject);
        return;
    }

    // Determine if icon is text pill or emoji
    const isTextIcon = subject.icon && subject.icon.length <= 6 && !/\p{Emoji}/u.test(subject.icon);
    const headerIconHtml = isTextIcon
        ? `<span class="ct-subject-pill-badge ct-pill-lg">${subject.icon}</span>`
        : `<span>${subject.icon}</span>`;

    // Determine if user has access
    const hasAccess = AppState.userPlan === 'codetantra' || AppState.userPlan === 'pro';

    // Render weeks
    let weeksHtml = subject.weeks.map((w) => {
        if (w.isPremium && !hasAccess) {
            // Locked week row - crown, not expandable
            return `
                <div class="ct-week-group ct-week-locked" onclick="window.showCodeTantraUpgradeModal()">
                    <div class="ct-week-header ct-week-header-locked" title="Premium content">
                        <span><i class="ct-week-arrow">▶</i> ${w.title}</span>
                        <span class="ct-crown-icon">👑 <span style="font-size:0.7rem; font-weight:normal; opacity:0.8; margin-left:4px;">(Upgrade)</span></span>
                    </div>
                </div>
            `;
        }

        // Free week
        const isEmpty = !w.topics || w.topics.length === 0;
        let questionsHtml = '';

        if (isEmpty) {
            questionsHtml = `<div class="ct-coming-soon">Coming soon...</div>`;
        } else {
            questionsHtml = w.topics.map((q) => {
                const safeCode = q.code.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
                return `
                <div class="ct-question-block" data-searchable="${q.question.toLowerCase()} ${q.number} ${w.title.toLowerCase()}">
                    <div class="ct-question-header">
                        <div class="ct-question-title"><span class="ct-q-num">${q.number}</span> ${q.question}</div>
                        <div class="ct-code-actions">
                            <button class="ct-icon-btn" onclick='window.copyCode(this, \`${safeCode}\`)' title="Copy Code">
                                <i class="fa-regular fa-copy"></i>
                            </button>
                        </div>
                    </div>
                    <div class="ct-code-container">
                        <pre><code>${highlightCode(q.code, q.language)}</code></pre>
                    </div>
                </div>
            `}).join('');
        }

        // All weeks start collapsed by default
        return `
            <div class="ct-week-group">
                <div class="ct-week-header" onclick="this.parentElement.classList.toggle('active')">
                    <span><i class="ct-week-arrow">▶</i> ${w.title}</span>
                </div>
                <div class="ct-week-content">
                    ${questionsHtml}
                </div>
            </div>
        `;
    }).join('');

    root.innerHTML = `
        <div class="ct-dashboard-container" id="ct-subject-container">
            <button class="ct-back-btn" onclick="window.goBackToHub()">← Back</button>

            <div class="ct-subject-page-header">
                <div class="ct-subject-page-title-row">
                    ${headerIconHtml}
                    <div>
                        <h1 class="ct-subject-page-name">${subject.name}</h1>
                        <p class="ct-subject-page-fullname">${subject.fullName} — Code Solutions</p>
                    </div>
                </div>
                <button class="ct-btn-outline ct-download-btn" onclick="window.downloadPDF()">
                    <i class="fa-solid fa-download"></i> PDF
                </button>
            </div>

            <input type="text" id="ct-search" class="ct-search-bar" placeholder="🔍 Search questions, weeks...">

            <div id="ct-weeks-container">
                ${weeksHtml}
            </div>
        </div>
    `;

    // Prism no longer needed - using built-in highlighter

    // Search Logic
    const searchInput = document.getElementById('ct-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            document.querySelectorAll('.ct-question-block').forEach(q => {
                const text = q.getAttribute('data-searchable') || '';
                q.style.display = (query === '' || text.includes(query)) ? '' : 'none';
            });

            document.querySelectorAll('.ct-week-group:not(.ct-week-locked)').forEach(wg => {
                if (query === '') {
                    wg.style.display = '';
                    return;
                }
                const visibleQs = wg.querySelectorAll('.ct-question-block:not([style*="display: none"])');
                wg.style.display = visibleQs.length === 0 ? 'none' : '';
            });
        });
    }
}

// --- Utilities ---

window.resetProfile = function () {
    localStorage.removeItem('ct_college');
    localStorage.removeItem('ct_branch');
    localStorage.removeItem('ct_semester');
    AppState.college = '';
    AppState.branch = '';
    AppState.semester = '';
    AppState.currentSubjectId = null;
    renderApp();
};

window.copyCode = function (btn, code) {
    navigator.clipboard.writeText(code).then(() => {
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-check"></i>';
        btn.style.color = '#00f2ff';
        btn.style.borderColor = '#00f2ff';

        if (window.showToast) {
            window.showToast('Copied!', 'success');
        } else {
            const toast = document.createElement('div');
            toast.className = 'ct-toast';
            toast.innerText = '✓ Copied!';
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 2000);
        }

        setTimeout(() => {
            btn.innerHTML = originalHtml;
            btn.style.color = '';
            btn.style.borderColor = '';
        }, 2000);
    }).catch(() => {
        // Fallback for older browsers
        const ta = document.createElement('textarea');
        ta.value = code;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
    });
};

window.downloadPDF = async function () {
    const hasAccess = typeof AppState !== 'undefined' && (AppState.userPlan === 'codetantra' || AppState.userPlan === 'pro');
    if (!hasAccess) {
        if (typeof window.showCodeTantraUpgradeModal === 'function') {
            window.showCodeTantraUpgradeModal();
        } else {
            alert('Please purchase a premium plan to download CodeTantra solutions.');
        }
        return;
    }

    if (typeof html2pdf === 'undefined') {
        alert('PDF library not loaded. Please refresh and try again.');
        return;
    }

    const element = document.getElementById('ct-subject-container');
    const hideEls = [
        document.getElementById('ct-search'),
        document.querySelector('.ct-back-btn'),
        document.querySelector('.ct-download-btn')
    ];

    hideEls.forEach(el => { if (el) el.style.display = 'none'; });
    
    // Extract subject name (remove 'THEORY' if present)
    const subjNameEl = document.querySelector('.ct-subject-page-name');
    const subjName = subjNameEl ? subjNameEl.innerText.replace('THEORY', '').trim() : 'Subject';

    // Get logo as base64 for jsPDF
    let logoData = null;
    try {
        const logoImg = new Image();
        logoImg.crossOrigin = 'Anonymous';
        logoImg.src = '../assets/logo.jpg';
        await new Promise((resolve) => { 
            logoImg.onload = resolve; 
            logoImg.onerror = resolve; 
        });
        const canvas = document.createElement('canvas');
        canvas.width = logoImg.width;
        canvas.height = logoImg.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(logoImg, 0, 0);
        logoData = canvas.toDataURL('image/jpeg');
    } catch(e) {
        console.error("Could not load logo for PDF", e);
    }

    // Expand all accordions so content is visible in PDF
    document.querySelectorAll('.ct-week-group').forEach(w => w.classList.add('active'));
    document.querySelectorAll('.ct-unit-group').forEach(u => u.classList.add('active'));
    document.querySelectorAll('.ct-section-group').forEach(s => s.classList.add('active'));

    const opt = {
        margin: [30, 10, 10, 10], // Leave 30mm top margin for header
        filename: 'codetantra_solutions.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#0d0d1a' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).toPdf().get('pdf').then(function (pdf) {
        const totalPages = pdf.internal.getNumberOfPages();
        const pageWidth = pdf.internal.pageSize.getWidth();
        
        for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            
            // Fill top area with white to cover any background bleed
            pdf.setFillColor(255, 255, 255);
            pdf.rect(0, 0, pageWidth, 30, 'F');

            // Draw line
            pdf.setDrawColor(220, 220, 220);
            pdf.setLineWidth(0.3);
            pdf.line(10, 28, pageWidth - 10, 28);

            // Calculate widths
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(16);
            const textSM = "SKiL MATRiX ";
            const textSMWidth = pdf.getStringUnitWidth ? (pdf.getStringUnitWidth(textSM) * 16 / pdf.internal.scaleFactor) : 34;
            const textNotesWidth = pdf.getStringUnitWidth ? (pdf.getStringUnitWidth("NOTES") * 16 / pdf.internal.scaleFactor) : 15;
            
            const totalTitleWidth = 10 + 3 + textSMWidth + textNotesWidth;
            const startX = (pageWidth - totalTitleWidth) / 2;
            
            if (logoData && logoData.startsWith('data:image')) {
                pdf.addImage(logoData, 'JPEG', startX, 7, 10, 10);
            }
            
            pdf.setTextColor(17, 17, 17);
            pdf.text(textSM, startX + 13, 14.5);
            
            pdf.setTextColor(0, 188, 212);
            pdf.text("NOTES", startX + 13 + textSMWidth, 14.5);
            
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(11);
            pdf.setTextColor(68, 68, 68);
            const textSub = subjName + " CodeTantra Solutions";
            const textSubWidth = pdf.getStringUnitWidth ? (pdf.getStringUnitWidth(textSub) * 11 / pdf.internal.scaleFactor) : (textSub.length * 2.2);
            
            pdf.text(textSub, (pageWidth - textSubWidth) / 2, 24);
        }
    }).save().then(() => {
        hideEls.forEach(el => { if (el) el.style.display = ''; });
    });
};

// ── Built-in syntax highlighter (no Prism needed) ───────────────
function highlightCode(code, lang) {
    if (lang === 'sql') return highlightSQL(code);
    // For other languages, just escape
    return escapeHtml(code);
}

function highlightSQL(code) {
    // Tokenize the code into segments, preserving order
    const SQL_KEYWORDS = /\b(SELECT|FROM|WHERE|AND|OR|NOT|BETWEEN|IN|IS|NULL|ORDER|GROUP|BY|HAVING|ASC|DESC|AS|DISTINCT|JOIN|INNER|LEFT|RIGHT|OUTER|FULL|ON|UNION|ALL|EXCEPT|INTERSECT|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|DATABASE|DROP|ALTER|ADD|COLUMN|PRIMARY|FOREIGN|KEY|REFERENCES|INDEX|VIEW|TRIGGER|PROCEDURE|FUNCTION|BEGIN|END|COMMIT|ROLLBACK|TRANSACTION|COUNT|SUM|MAX|MIN|AVG|UPPER|LOWER|LENGTH|SUBSTR|TRIM|COALESCE|CASE|WHEN|THEN|ELSE|LIMIT|OFFSET|EXISTS|LIKE|ILIKE|SIMILAR|RETURNING|WITH|RECURSIVE|GRANT|REVOKE|CONSTRAINT|UNIQUE|CHECK|DEFAULT|SEQUENCE|SERIAL|AUTO_INCREMENT|IF|REPLACE|TRUNCATE|EXPLAIN|ANALYZE|VACUUM)\b/gi;

    // Parse tokens in priority order
    const patterns = [
        { re: /--[^\n]*/g, cls: 'ct-t-comment' },  // -- comments
        { re: /\/\*[\s\S]*?\*\//g, cls: 'ct-t-comment' },  // /* block comments */
        { re: /'(?:[^'\\]|\\.)*'/g, cls: 'ct-t-string' },  // 'strings'
        { re: SQL_KEYWORDS, cls: 'ct-t-keyword' },  // SQL keywords
        { re: /\b\d+\.?\d*\b/g, cls: 'ct-t-number' },  // numbers
        { re: /[<>=!]+|[+\-*\/]/g, cls: 'ct-t-operator' },  // operators
    ];

    // Collect all token spans with start/end positions
    let spans = [];
    patterns.forEach(({ re, cls }) => {
        const flags = re.flags.includes('g') ? re.flags : re.flags + 'g';
        const r = new RegExp(re.source, flags);
        let m;
        while ((m = r.exec(code)) !== null) {
            spans.push({ start: m.index, end: m.index + m[0].length, text: m[0], cls });
        }
    });

    // Sort by position, then remove overlapping tokens (first-come wins)
    spans.sort((a, b) => a.start - b.start || a.end - b.end);
    const kept = [];
    let cursor = 0;
    for (const s of spans) {
        if (s.start >= cursor) {
            kept.push(s);
            cursor = s.end;
        }
    }

    // Build highlighted output
    let out = '';
    let pos = 0;
    for (const { start, end, text, cls } of kept) {
        if (pos < start) out += escapeHtml(code.slice(pos, start));
        out += `<span class="${cls}">${escapeHtml(text)}</span>`;
        pos = end;
    }
    if (pos < code.length) out += escapeHtml(code.slice(pos));
    return out;
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function renderTheorySubjectPage(root, subject) {
    const isTextIcon = subject.icon && subject.icon.length <= 6 && !/\p{Emoji}/u.test(subject.icon);
    const headerIconHtml = isTextIcon
        ? `<span class="ct-subject-pill-badge ct-pill-lg">${subject.icon}</span>`
        : `<span>${subject.icon}</span>`;

    const hasAccess = AppState.userPlan === 'codetantra' || AppState.userPlan === 'pro';

    let unitsHtml = subject.units.map((u) => {
        if (u.isPremium && !hasAccess) {
            return `
                <div class="ct-unit-group ct-week-locked" onclick="window.showCodeTantraUpgradeModal()">
                    <div class="ct-unit-header ct-week-header-locked" title="Premium content">
                        <span><i class="fa-solid fa-chevron-right ct-unit-arrow"></i> ${u.title}</span>
                        <span class="ct-crown-icon">👑 <span style="font-size:0.7rem; font-weight:normal; opacity:0.8; margin-left:4px;">(Upgrade)</span></span>
                    </div>
                </div>
            `;
        }

        const sectionsHtml = u.sections.map(sec => {
            const qasHtml = sec.qas.map(qa => {
                const lines = qa.answer.split('\n');
                const listHtml = lines.map(line => `
                    <div class="ct-qa-line">
                        <i class="fa-solid fa-check ct-check-icon"></i>
                        <span>${escapeHtml(line)}</span>
                    </div>
                `).join('');

                return `
                <div class="ct-qa-block">
                    <div class="ct-qa-number-label">${qa.number}</div>
                    <div class="ct-qa-answer-box">
                        ${listHtml}
                    </div>
                </div>
                `;
            }).join('');

            return `
                <div class="ct-section-group">
                    <div class="ct-section-header" onclick="this.parentElement.classList.toggle('active'); event.stopPropagation();">
                        <span><i class="fa-solid fa-chevron-right ct-section-arrow"></i> ${sec.title}</span>
                    </div>
                    <div class="ct-section-content">
                        ${qasHtml}
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="ct-unit-group">
                <div class="ct-unit-header" onclick="this.parentElement.classList.toggle('active')">
                    <span><i class="fa-solid fa-chevron-right ct-unit-arrow"></i> ${u.title}</span>
                </div>
                <div class="ct-unit-content">
                    ${sectionsHtml}
                </div>
            </div>
        `;
    }).join('');

    root.innerHTML = `
        <div class="ct-dashboard-container" id="ct-subject-container">
            <button class="ct-back-btn" onclick="window.goBackToHub()">← Back</button>

            <div class="ct-subject-page-header">
                <div class="ct-subject-page-title-row">
                    ${headerIconHtml}
                    <div>
                        <h1 class="ct-subject-page-name">${subject.name} <span class="ct-theory-badge" style="font-size:0.6rem; background:#fff; color:#000; padding:3px 8px; border-radius:4px; vertical-align:middle; margin-left:8px;">THEORY</span></h1>
                        <p class="ct-subject-page-fullname">${subject.fullName} — Theory Questions</p>
                    </div>
                </div>
                <button class="ct-btn-outline ct-download-btn" onclick="window.downloadPDF()">
                    <i class="fa-solid fa-download"></i> PDF
                </button>
            </div>

            <div id="ct-weeks-container">
                ${unitsHtml}
            </div>
        </div>
    `;
}

// Init when DOM is ready (for first load)
document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('ct-app-root');
    if (root) renderApp();
});

// --- Premium Inline Upgrade Modal ---
window.showCodeTantraUpgradeModal = function() {
    if (!window.auth || !window.auth.currentUser) {
        if (window.showToast) window.showToast("Please login to upgrade", "error");
        else alert("Please login to upgrade.");
        return;
    }

    if (!document.getElementById('ct-upgrade-modal-styles')) {
        const s = document.createElement('style');
        s.id = 'ct-upgrade-modal-styles';
        s.textContent = `
        #ct-upgrade-overlay {
            position: fixed; inset: 0; z-index: 999999;
            background: rgba(10, 10, 20, 0.85); backdrop-filter: blur(12px);
            display: flex; align-items: center; justify-content: center;
            animation: ctUpFadeIn 0.3s ease;
            font-family: 'Inter', sans-serif;
        }
        @keyframes ctUpFadeIn { from { opacity: 0; backdrop-filter: blur(0px); } to { opacity: 1; backdrop-filter: blur(12px); } }
        
        #ct-upgrade-box {
            background: linear-gradient(145deg, rgba(30, 30, 45, 0.95), rgba(15, 15, 25, 0.98));
            border: 1px solid rgba(0, 242, 255, 0.3);
            border-radius: 24px; width: 90%; max-width: 440px;
            box-shadow: 0 0 60px rgba(0, 242, 255, 0.15), inset 0 0 20px rgba(0, 242, 255, 0.05);
            position: relative; overflow: hidden;
            animation: ctUpSlideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            padding: 2rem;
            color: #fff;
        }
        @keyframes ctUpSlideIn { from { transform: translateY(40px) scale(0.95); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
        
        .ct-up-close {
            position: absolute; top: 1rem; right: 1rem;
            width: 32px; height: 32px; border-radius: 50%;
            background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center;
            cursor: pointer; transition: all 0.2s; border: none; color: #fff;
        }
        .ct-up-close:hover { background: rgba(255,255,255,0.2); transform: scale(1.1); }
        
        .ct-up-header { text-align: center; margin-bottom: 1.5rem; }
        .ct-up-header h2 { 
            font-family: 'Poppins', sans-serif; font-size: 1.6rem; font-weight: 800; margin: 0 0 0.5rem; 
            background: linear-gradient(135deg, #00f2ff, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .ct-up-header p { color: rgba(255,255,255,0.6); font-size: 0.9rem; margin: 0; }
        
        /* Plan Selection View */
        #ct-up-plan-view { display: flex; flex-direction: column; gap: 1rem; }
        
        .ct-up-dur-toggle {
            display: flex; gap: 0.5rem; background: rgba(255,255,255,0.05);
            padding: 4px; border-radius: 12px; margin-bottom: 1rem;
        }
        .ct-up-dur-btn {
            flex: 1; padding: 0.6rem; border: none; background: transparent; color: rgba(255,255,255,0.5);
            font-weight: 600; border-radius: 8px; cursor: pointer; transition: all 0.3s; font-family: inherit;
        }
        .ct-up-dur-btn.active {
            background: rgba(0, 242, 255, 0.15); color: #00f2ff; box-shadow: 0 2px 10px rgba(0, 242, 255, 0.1);
        }
        
        .ct-up-features { list-style: none; padding: 0; margin: 0 0 1.5rem; font-size: 0.9rem; }
        .ct-up-features li { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; color: rgba(255,255,255,0.8); }
        .ct-up-features li i { color: #00f2ff; font-size: 1.1rem; }
        
        .ct-up-price-box {
            text-align: center; margin-bottom: 1.5rem;
            background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08);
            border-radius: 16px; padding: 1rem;
        }
        .ct-up-price-val { font-size: 2.5rem; font-weight: 800; font-family: 'Poppins', sans-serif; line-height: 1; margin-bottom: 0.25rem; color: #fff; }
        .ct-up-price-val span { font-size: 1rem; font-weight: 500; color: rgba(255,255,255,0.5); }
        
        .ct-up-btn {
            width: 100%; padding: 1rem; border: none; border-radius: 12px;
            background: linear-gradient(135deg, #00f2ff, #0088ff); color: #fff;
            font-size: 1rem; font-weight: 700; cursor: pointer; font-family: inherit;
            box-shadow: 0 8px 24px rgba(0, 136, 255, 0.3); transition: all 0.3s;
        }
        .ct-up-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(0, 136, 255, 0.4); }
        .ct-up-btn:active { transform: translateY(0); }
        
        /* Checkout View */
        #ct-up-checkout-view { display: none; flex-direction: column; }
        
        .ct-up-summary {
            background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1);
            border-radius: 16px; padding: 1.25rem; margin-bottom: 1.5rem;
        }
        .ct-up-row { display: flex; justify-content: space-between; margin-bottom: 0.75rem; padding-bottom: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .ct-up-row:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
        .ct-up-row-label { color: rgba(255,255,255,0.5); font-size: 0.9rem; }
        .ct-up-row-val { font-weight: 600; font-size: 0.95rem; }
        
        .ct-up-coupon { margin-bottom: 1.5rem; }
        .ct-up-coupon-title { font-size: 0.85rem; font-weight: 600; color: rgba(255,255,255,0.6); margin-bottom: 0.5rem; }
        .ct-up-coupon-input-group { display: flex; gap: 0.5rem; }
        .ct-up-coupon-input {
            flex: 1; padding: 0.75rem 1rem; border-radius: 10px;
            background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.15);
            color: #fff; font-family: monospace; text-transform: uppercase; outline: none;
            transition: border-color 0.2s;
        }
        .ct-up-coupon-input:focus { border-color: #00f2ff; }
        .ct-up-coupon-btn {
            padding: 0 1rem; border: none; border-radius: 10px; font-family: inherit;
            background: rgba(0, 242, 255, 0.1); color: #00f2ff; font-weight: 700;
            cursor: pointer; transition: all 0.2s;
        }
        .ct-up-coupon-btn:hover { background: rgba(0, 242, 255, 0.2); }
        .ct-up-feedback { font-size: 0.8rem; min-height: 1.2rem; margin-top: 0.5rem; }
        
        .ct-up-back {
            display: inline-flex; align-items: center; gap: 0.5rem;
            color: rgba(255,255,255,0.5); font-size: 0.85rem; cursor: pointer;
            margin-bottom: 1.5rem; transition: color 0.2s;
        }
        .ct-up-back:hover { color: #fff; }
        `;
        document.head.appendChild(s);
    }

    let currentDuration = '1mo';
    let prices = { '1mo': 19, '6mo': 89 };
    let activeCoupon = null;
    let activeDiscount = 0;
    
    const overlay = document.createElement('div');
    overlay.id = 'ct-upgrade-overlay';
    
    const buildHTML = () => `
        <div id="ct-upgrade-box">
            <button class="ct-up-close" id="ct-close-btn">&times;</button>
            
            <!-- PLAN VIEW -->
            <div id="ct-up-plan-view">
                <div class="ct-up-header">
                    <h2>CodeTantra <span style="color:#fff">Hub</span></h2>
                    <p>Unlock premium lab solutions instantly</p>
                </div>
                
                <div class="ct-up-dur-toggle">
                    <button class="ct-up-dur-btn active" data-dur="1mo" id="ct-dur-1mo">1 Month</button>
                    <button class="ct-up-dur-btn" data-dur="6mo" id="ct-dur-6mo">6 Months <span style="background:#10b981;color:#fff;font-size:0.6rem;padding:2px 5px;border-radius:4px;margin-left:4px;">Save</span></button>
                </div>
                
                <div class="ct-up-price-box">
                    <div class="ct-up-price-val" id="ct-disp-price">₹19 <span>/ mo</span></div>
                    <div style="font-size: 0.8rem; color: rgba(255,255,255,0.5);" id="ct-disp-sub">Billed ₹19 for 1 month</div>
                </div>
                
                <ul class="ct-up-features">
                    <li><i class="fa-solid fa-check"></i> Instant access to all CodeTantra solutions</li>
                    <li><i class="fa-solid fa-check"></i> Code copy in one click</li>
                    <li><i class="fa-solid fa-check"></i> Error-free verified logic</li>
                </ul>
                
                <button class="ct-up-btn" id="ct-upgrade-now-btn">Upgrade Now 🚀</button>
            </div>
            
            <!-- CHECKOUT VIEW -->
            <div id="ct-up-checkout-view">
                <div class="ct-up-back" id="ct-back-to-plan"><i class="fa-solid fa-arrow-left"></i> Back to Plan</div>
                
                <div class="ct-up-header" style="text-align:left; margin-bottom: 1rem;">
                    <h2 style="font-size: 1.3rem;">Order Summary</h2>
                </div>
                
                <div class="ct-up-summary">
                    <div class="ct-up-row">
                        <span class="ct-up-row-label">Plan</span>
                        <span class="ct-up-row-val">CodeTantra Hub</span>
                    </div>
                    <div class="ct-up-row">
                        <span class="ct-up-row-label">Duration</span>
                        <span class="ct-up-row-val" id="ct-sum-dur">1 Month</span>
                    </div>
                    <div class="ct-up-row" id="ct-discount-row" style="display:none;">
                        <span class="ct-up-row-label">Discount</span>
                        <span class="ct-up-row-val" id="ct-sum-disc" style="color: #10b981;">-₹0</span>
                    </div>
                    <div class="ct-up-row" style="border:none; padding-top: 0.5rem; margin-top: 0.5rem; border-top: 1px solid rgba(255,255,255,0.1);">
                        <span class="ct-up-row-label" style="color:#fff; font-weight:700;">Total</span>
                        <span class="ct-up-row-val" id="ct-sum-total" style="font-size: 1.2rem; color: #00f2ff;">₹19</span>
                    </div>
                </div>
                
                <div class="ct-up-coupon">
                    <div class="ct-up-coupon-title">🎟️ Have a Coupon?</div>
                    <div class="ct-up-coupon-input-group">
                        <input type="text" class="ct-up-coupon-input" id="ct-coupon-input" placeholder="Enter Code" maxlength="30">
                        <button class="ct-up-coupon-btn" id="ct-coupon-apply">Apply</button>
                    </div>
                    <div class="ct-up-feedback" id="ct-coupon-feedback"></div>
                </div>
                
                <button class="ct-up-btn" id="ct-pay-securely-btn" style="display:flex; justify-content:center; align-items:center; gap:0.5rem;">
                    <i class="fa-solid fa-lock"></i> Pay Securely
                </button>
            </div>
            
            <!-- SUCCESS VIEW -->
            <div id="ct-up-success-view" style="display: none; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 2rem 0;">
                <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 1.5rem; box-shadow: 0 0 30px rgba(16,185,129,0.4);">
                    <i class="fa-solid fa-check" style="font-size: 2.5rem; color: #fff;"></i>
                </div>
                <h2 style="font-family: 'Poppins', sans-serif; font-size: 1.8rem; font-weight: 800; margin: 0 0 0.5rem; color: #fff;">Payment Successful!</h2>
                <p style="color: rgba(255,255,255,0.7); font-size: 1rem; margin: 0 0 2rem;">Welcome to CodeTantra Hub Premium.<br>Your account has been upgraded.</p>
                <button class="ct-up-btn" id="ct-success-continue-btn" style="background: linear-gradient(135deg, #10b981, #059669); box-shadow: 0 8px 24px rgba(16,185,129,0.3);">Continue Learning <i class="fa-solid fa-arrow-right" style="margin-left: 8px;"></i></button>
            </div>
            
        </div>
    `;
    overlay.innerHTML = buildHTML();
    document.body.appendChild(overlay);
    
    const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://skil-matrix-server.onrender.com';
    
    // Fetch dynamic pricing
    fetch(apiUrl + '/api/pricing-config').then(r=>r.json()).then(d=>{
        if(d.success && d.config.plans) {
            if(d.config.plans.codetantra_1mo) prices['1mo'] = d.config.plans.codetantra_1mo.amount/100;
            if(d.config.plans.codetantra_6mo) prices['6mo'] = d.config.plans.codetantra_6mo.amount/100;
            updateDispPrice();
        }
    }).catch(()=>{});

    const updateDispPrice = () => {
        const p = prices[currentDuration];
        document.getElementById('ct-disp-price').innerHTML = `₹${p} <span>/ ${currentDuration === '1mo' ? 'mo' : '6mo'}</span>`;
        document.getElementById('ct-disp-sub').innerText = currentDuration === '1mo' ? `Billed ₹${p} for 1 month` : `Billed ₹${p} for 6 months`;
    };
    
    const updateSummary = () => {
        const p = prices[currentDuration];
        document.getElementById('ct-sum-dur').innerText = currentDuration === '1mo' ? '1 Month' : '6 Months';
        
        let finalPrice = p;
        if(activeCoupon && activeDiscount > 0) {
            const discAmt = Math.round(p * activeDiscount / 100);
            finalPrice = p - discAmt;
            document.getElementById('ct-discount-row').style.display = 'flex';
            document.getElementById('ct-sum-disc').innerText = `-₹${discAmt} (${activeDiscount}% off)`;
        } else {
            document.getElementById('ct-discount-row').style.display = 'none';
        }
        
        document.getElementById('ct-sum-total').innerText = `₹${finalPrice}`;
        document.getElementById('ct-pay-securely-btn').innerHTML = `<i class="fa-solid fa-lock"></i> Pay ₹${finalPrice} Securely`;
    };

    document.getElementById('ct-close-btn').onclick = () => overlay.remove();
    
    const ensureConfetti = (cb) => {
        if (window.confetti) return cb();
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
        s.onload = cb;
        document.body.appendChild(s);
    };

    const fireCouponConfetti = () => ensureConfetti(() => {
        const btn = document.getElementById('ct-coupon-apply');
        const rect = btn.getBoundingClientRect();
        const originX = (rect.left + rect.width / 2) / window.innerWidth;
        const originY = (rect.top + rect.height / 2) / window.innerHeight;
        const colors = ['#00f2ff', '#10b981', '#3b82f6'];
        const base = { colors, zIndex: 999999, particleCount: 40, spread: 55 };
        confetti({ ...base, origin: { x: originX, y: originY } });
    });

    const fireSuccessConfetti = () => ensureConfetti(() => {
        const count = 250;
        const colors = ['#00f2ff', '#10b981', '#3b82f6', '#fbbf24', '#f43f5e'];
        const fire = (ratio, opts) => confetti({ particleCount: Math.floor(count * ratio), colors, zIndex: 999999, ...opts });
        fire(0.25, { spread: 26, startVelocity: 55, origin: { x: 0.2, y: 0.8 } });
        fire(0.25, { spread: 26, startVelocity: 55, origin: { x: 0.8, y: 0.8 } });
        fire(0.2, { spread: 60, origin: { x: 0.5, y: 1 } });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2, origin: { x: 0.5, y: 0.5 } });
        fire(0.2, { spread: 120, startVelocity: 45, origin: { x: 0.5, y: 1 } });
    });
    
    // Clicking outside closes modal
    overlay.onclick = (e) => {
        if (e.target === overlay) overlay.remove();
    };
    
    document.getElementById('ct-dur-1mo').onclick = (e) => {
        currentDuration = '1mo';
        e.target.classList.add('active');
        document.getElementById('ct-dur-6mo').classList.remove('active');
        updateDispPrice();
    };
    
    document.getElementById('ct-dur-6mo').onclick = (e) => {
        currentDuration = '6mo';
        e.target.classList.add('active');
        document.getElementById('ct-dur-1mo').classList.remove('active');
        updateDispPrice();
    };
    
    document.getElementById('ct-upgrade-now-btn').onclick = () => {
        document.getElementById('ct-up-plan-view').style.display = 'none';
        document.getElementById('ct-up-checkout-view').style.display = 'flex';
        updateSummary();
    };
    
    document.getElementById('ct-back-to-plan').onclick = () => {
        document.getElementById('ct-up-checkout-view').style.display = 'none';
        document.getElementById('ct-up-plan-view').style.display = 'flex';
        activeCoupon = null; activeDiscount = 0;
        document.getElementById('ct-coupon-input').value = '';
        document.getElementById('ct-coupon-feedback').innerText = '';
    };
    
    document.getElementById('ct-coupon-apply').onclick = async () => {
        const inp = document.getElementById('ct-coupon-input').value.trim().toUpperCase();
        const fb = document.getElementById('ct-coupon-feedback');
        if(!inp) { fb.innerText = 'Enter a code'; fb.style.color = '#f87171'; return; }
        
        const btn = document.getElementById('ct-coupon-apply');
        btn.innerText = '...'; btn.disabled = true;
        
        try {
            const res = await fetch(apiUrl + '/api/pricing-config');
            const data = await res.json();
            if(data.success && data.config.coupons && data.config.coupons[inp] !== undefined) {
                let cv = data.config.coupons[inp];
                activeDiscount = typeof cv === 'object' ? cv.discount : cv;
                activeCoupon = inp;
                fb.innerText = `✅ "${inp}" applied! ${activeDiscount}% off`; fb.style.color = '#10b981';
                updateSummary();
                fireCouponConfetti();
            } else {
                activeCoupon = null; activeDiscount = 0;
                fb.innerText = '❌ Invalid coupon code'; fb.style.color = '#f87171';
                updateSummary();
            }
        } catch(err) {
            fb.innerText = '❌ Verification failed'; fb.style.color = '#f87171';
        }
        btn.innerText = 'Apply'; btn.disabled = false;
    };
    
    document.getElementById('ct-pay-securely-btn').onclick = async () => {
        const uid = window.auth.currentUser.uid;
        const email = window.auth.currentUser.email || '';
        const planId = currentDuration === '1mo' ? 'codetantra_1mo' : 'codetantra_6mo';
        
        const btn = document.getElementById('ct-pay-securely-btn');
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Processing...';
        btn.disabled = true;
        
        try {
            // First check if Razorpay is loaded
            if (typeof Razorpay === 'undefined') {
                throw new Error("Payment gateway is still loading. Please try again in a few seconds.");
            }
            
            const res = await fetch(apiUrl + '/api/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId, uid, couponCode: activeCoupon || null })
            });
            const data = await res.json();
            if(!data.success) throw new Error(data.error || 'Failed to create order');
            
            const showSuccessView = () => {
                document.getElementById('ct-up-checkout-view').style.display = 'none';
                document.getElementById('ct-up-plan-view').style.display = 'none';
                document.getElementById('ct-up-success-view').style.display = 'flex';
                document.getElementById('ct-close-btn').style.display = 'none'; // hide close button
                fireSuccessConfetti();
                document.getElementById('ct-success-continue-btn').onclick = () => window.location.reload();
            };

            if (data.zeroAmount) {
                showSuccessView();
                return;
            }
            
            const options = {
                key: data.keyId,
                amount: data.order.amount,
                currency: "INR",
                name: "SKiL MATRiX Notes",
                description: `CodeTantra Hub — ${currentDuration === '1mo' ? '1 Month' : '6 Months'}`,
                order_id: data.order.id,
                handler: async function (response) {
                    try {
                        const vr = await fetch(apiUrl + '/api/verify-payment', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                planId,
                                uid,
                                couponCode: activeCoupon || null
                            })
                        });
                        const vd = await vr.json();
                        if(vd.success) {
                            showSuccessView();
                        } else {
                            alert("Verification failed. Contact support.");
                        }
                    } catch(e) { alert("Verification error."); }
                },
                prefill: { email },
                theme: { color: "#00f2ff" },
                modal: {
                    ondismiss: function() {
                        updateSummary();
                        btn.disabled = false;
                    }
                }
            };
            const rzp = new Razorpay(options);
            rzp.on('payment.failed', function(response) {
                alert("Payment failed: " + response.error.description);
                updateSummary();
                btn.disabled = false;
            });
            rzp.open();
            
        } catch(err) {
            alert(err.message || 'Error initializing checkout');
            updateSummary();
            btn.disabled = false;
        }
    };
};
