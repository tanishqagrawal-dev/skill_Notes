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
                <div class="ct-week-group ct-week-locked" onclick="window.location.href='../index.html#pricing'">
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
                <div class="ct-unit-group ct-week-locked" onclick="window.location.href='../index.html#pricing'">
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
