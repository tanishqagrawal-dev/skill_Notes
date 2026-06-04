window.getViewerUrl = function(url, title, id) { if (id) return '../pages/view?id=' + id; if (!url) return '#'; try { return '../pages/view?u=' + btoa(encodeURIComponent(url)) + '&t=' + btoa(encodeURIComponent(title || 'Document')); } catch(e) { return url; } };
/**
 * admin-panel.js — Premium Admin Control Center v3
 * - Superadmin: manages everything + assigns Co-Admins per college
 * - Co-Admin: sees only their assigned college's notes
 * window.initAdminPanel(containerEl?) is called by dashboard.js renderTabContent
 */

(function () {
    const SUPABASE_URL = 'https://begbdglouistmaughmot.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlZ2JkZ2xvdWlzdG1hdWdobW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyODMxMDEsImV4cCI6MjA5NDg1OTEwMX0.sKOHb6jifGH4P8ZFrc5tkPPkButNtfx1mJj9o-zC-rs';
    const SUPER_ADMIN_EMAILS = ['tanishqagrawal1103@gmail.com', 'skilmatrix3@gmail.com'];

    // ── Inject CSS once ─────────────────────────────────────────────────────
    if (!document.getElementById('ap-styles')) {
        const s = document.createElement('style');
        s.id = 'ap-styles';
        s.textContent = `
        #ap-content { box-sizing: border-box; }
        .ap { padding: 2rem; min-height: 80vh; }
        .ap-head { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:1rem; margin-bottom:2.5rem; }
        .ap-head h1 { margin:0; font-size:clamp(1.5rem,4vw,2.2rem); font-weight:800;
            background:linear-gradient(135deg,#a78bfa,#60a5fa,#34d399);
            -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .ap-head p { margin:.3rem 0 0; color:rgba(255,255,255,.4); font-size:.9rem; }
        .ap-badge { display:inline-flex; align-items:center; gap:.4rem;
            background:linear-gradient(135deg,rgba(167,139,250,.18),rgba(96,165,250,.18));
            border:1px solid rgba(167,139,250,.4); color:#a78bfa;
            font-size:.72rem; font-weight:700; padding:.35rem .85rem; border-radius:20px;
            text-transform:uppercase; letter-spacing:.06em; }
        .ap-badge .dot { width:7px;height:7px;border-radius:50%;background:#a78bfa;
            box-shadow:0 0 8px #a78bfa; animation:ap-blink 2s infinite; }
        @keyframes ap-blink { 0%,100%{opacity:1} 50%{opacity:.3} }

        .ap-stats { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:1rem; margin-bottom:2.5rem; }
        .ap-stat { background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.07);
            border-radius:16px; padding:1.4rem 1.5rem; position:relative; overflow:hidden;
            transition:transform .2s,border-color .2s; }
        .ap-stat:hover { transform:translateY(-2px); border-color:rgba(255,255,255,.14); }
        .ap-stat::after { content:''; position:absolute; top:0;left:0;right:0; height:2px; border-radius:16px 16px 0 0; }
        .ap-stat.c1::after { background:linear-gradient(90deg,#a78bfa,#7c3aed); }
        .ap-stat.c2::after { background:linear-gradient(90deg,#34d399,#059669); }
        .ap-stat.c3::after { background:linear-gradient(90deg,#60a5fa,#2563eb); }
        .ap-stat.c4::after { background:linear-gradient(90deg,#fb923c,#ea580c); }
        .ap-stat-ico { font-size:1.5rem; margin-bottom:.6rem; }
        .ap-stat-n { font-size:2rem; font-weight:800; color:#fff; line-height:1; }
        .ap-stat-lbl { font-size:.78rem; color:rgba(255,255,255,.4); margin-top:.25rem; }

        .ap-box { background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.07); border-radius:18px; overflow:hidden; margin-bottom:1.5rem; }
        .ap-box-head { display:flex; align-items:center; justify-content:space-between;
            padding:1.3rem 1.75rem; border-bottom:1px solid rgba(255,255,255,.06); }
        .ap-box-title { display:flex; align-items:center; gap:.7rem; font-size:1rem;
            font-weight:700; color:#fff; }
        .ap-live-dot { width:8px;height:8px;border-radius:50%;background:#f59e0b;
            box-shadow:0 0 10px #f59e0b88; animation:ap-blink 2s infinite; }
        .ap-ref-btn { background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1);
            color:rgba(255,255,255,.55); font-size:.78rem; padding:.45rem .9rem;
            border-radius:9px; cursor:pointer; transition:all .2s; }
        .ap-ref-btn:hover { background:rgba(255,255,255,.12); color:#fff; }

        .ap-list { padding:1.25rem 1.5rem; display:flex; flex-direction:column; gap:.85rem; }
        .ap-item { background:rgba(255,255,255,.025); border:1px solid rgba(255,255,255,.07);
            border-radius:13px; padding:1.1rem 1.4rem;
            display:grid; grid-template-columns:1fr auto; gap:1rem; align-items:center;
            transition:all .25s; }
        .ap-item:hover { background:rgba(255,255,255,.05); border-color:rgba(167,139,250,.22); }
        .ap-item.removing { opacity:0; transform:translateX(30px); pointer-events:none; }

        .ap-tags { display:flex; flex-wrap:wrap; gap:.4rem; margin-bottom:.55rem; }
        .ap-tag { font-size:.67rem; font-weight:700; padding:.2rem .55rem; border-radius:6px;
            text-transform:uppercase; letter-spacing:.04em; }
        .ap-tag.subject { background:rgba(167,139,250,.14); color:#a78bfa; border:1px solid rgba(167,139,250,.22); }
        .ap-tag.college { background:rgba(96,165,250,.12); color:#60a5fa; border:1px solid rgba(96,165,250,.2); }
        .ap-tag.branch  { background:rgba(52,211,153,.12); color:#34d399; border:1px solid rgba(52,211,153,.2); }
        .ap-tag.sem     { background:rgba(251,146,60,.12); color:#fb923c; border:1px solid rgba(251,146,60,.2); }

        .ap-title { font-size:.95rem; font-weight:700; color:#fff; white-space:nowrap;
            overflow:hidden; text-overflow:ellipsis; margin-bottom:.25rem; }
        .ap-meta  { font-size:.75rem; color:rgba(255,255,255,.38); }
        .ap-meta span { color:rgba(255,255,255,.6); }
        .ap-time  { font-size:.7rem; color:rgba(255,255,255,.28); margin-top:.15rem; }

        .ap-actions { display:flex; gap:.5rem; flex-shrink:0; flex-wrap:wrap; }
        .apb { display:inline-flex; align-items:center; gap:.35rem; padding:.5rem 1rem;
            border-radius:9px; font-size:.8rem; font-weight:700; cursor:pointer;
            border:none; transition:all .2s; white-space:nowrap; }
        .apb-view { background:rgba(255,255,255,.07); color:rgba(255,255,255,.65);
            border:1px solid rgba(255,255,255,.12); text-decoration:none; }
        .apb-view:hover { background:rgba(255,255,255,.13); color:#fff; }
        .apb-ok { background:linear-gradient(135deg,#10b981,#059669); color:#fff;
            box-shadow:0 4px 14px rgba(16,185,129,.28); }
        .apb-ok:hover { box-shadow:0 6px 20px rgba(16,185,129,.45); transform:translateY(-1px); }
        .apb-no { background:rgba(239,68,68,.1); color:#f87171;
            border:1px solid rgba(239,68,68,.22); }
        .apb-no:hover { background:rgba(239,68,68,.2); transform:translateY(-1px); }
        .apb:disabled { opacity:.45; cursor:not-allowed; transform:none !important; }

        .ap-empty { text-align:center; padding:4rem 2rem; }
        .ap-empty-ico { font-size:3rem; margin-bottom:.75rem;
            filter:drop-shadow(0 0 18px rgba(52,211,153,.4)); }
        .ap-empty h3 { color:#fff; font-size:1.15rem; font-weight:700; margin:.5rem 0; }
        .ap-empty p  { color:rgba(255,255,255,.38); font-size:.88rem; }

        .ap-loader { text-align:center; padding:3.5rem 2rem; color:rgba(255,255,255,.38); }
        .ap-spin { width:38px;height:38px;border:3px solid rgba(167,139,250,.2);
            border-top-color:#a78bfa; border-radius:50%;
            animation:ap-spin .75s linear infinite; margin:0 auto .9rem; }
        @keyframes ap-spin { to { transform:rotate(360deg); } }
        .ap-err { text-align:center; padding:3rem; color:#f87171; font-size:.9rem; }

        /* Top-level page toolbar */
        .ap-page-toolbar { display:flex; gap:.5rem; margin-bottom:1.5rem; flex-wrap:wrap; 
            background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.07);
            border-radius:14px; padding:.5rem; }
        .ap-page-tab { flex:1; min-width:130px; display:flex; align-items:center; justify-content:center;
            gap:.45rem; padding:.65rem 1.1rem; border-radius:10px; font-size:.85rem; font-weight:700;
            cursor:pointer; border:none; background:transparent; color:rgba(255,255,255,.4);
            transition:all .22s; }
        .ap-page-tab:hover { background:rgba(255,255,255,.06); color:rgba(255,255,255,.75); }
        .ap-page-tab.active { background:linear-gradient(135deg,rgba(167,139,250,.22),rgba(96,165,250,.15));
            color:#fff; border:1px solid rgba(167,139,250,.35);
            box-shadow:0 2px 12px rgba(167,139,250,.18); }
        .ap-page-tab.active span { filter:drop-shadow(0 0 6px rgba(167,139,250,.8)); }
        .ap-page { display:none; }
        .ap-page.active { display:block; }


        /* Co-Admin Manager */
        .ca-form { display:grid; grid-template-columns:1fr 1fr auto; gap:.75rem; align-items:end; padding:1.25rem 1.5rem; border-bottom:1px solid rgba(255,255,255,.06); }
        .ca-form input, .ca-form select { background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.12);
            color:#fff; border-radius:9px; padding:.55rem 1rem; font-size:.85rem; outline:none; }
        .ca-form input::placeholder { color:rgba(255,255,255,.3); }
        .ca-form input:focus, .ca-form select:focus { border-color:#a78bfa; }
        .ca-form select option { background:#1a1a2e; }
        .ca-form .apb-ok { height:38px; }
        .ca-row { display:grid; grid-template-columns:1fr 1fr auto; gap:.75rem; align-items:center;
            background:rgba(255,255,255,.025); border:1px solid rgba(255,255,255,.07); border-radius:11px;
            padding:.85rem 1.2rem; transition:all .2s; }
        .ca-row:hover { border-color:rgba(167,139,250,.25); }
        .ca-email { font-size:.88rem; font-weight:600; color:#fff; }
        .ca-college { font-size:.78rem; color:#60a5fa; background:rgba(96,165,250,.1); padding:.2rem .6rem; border-radius:6px; }
        .ca-badge { font-size:.68rem; font-weight:700; background:rgba(167,139,250,.15); color:#a78bfa;
            border:1px solid rgba(167,139,250,.3); padding:.2rem .55rem; border-radius:5px; text-transform:uppercase; }
        .ca-notice { background:linear-gradient(135deg,rgba(167,139,250,.06),rgba(96,165,250,.04));
            border:1px solid rgba(167,139,250,.15); border-radius:12px; padding:1rem 1.5rem;
            font-size:.82rem; color:rgba(255,255,255,.5); margin-bottom:1.5rem; line-height:1.6; }

        /* Content Manager */
        .cm-tabs { display:flex; gap:.5rem; padding:1.25rem 1.5rem 0; border-bottom:1px solid rgba(255,255,255,.06); }
        .cm-tab { padding:.5rem 1.1rem; border-radius:8px 8px 0 0; font-size:.8rem; font-weight:700;
            cursor:pointer; border:none; background:transparent; color:rgba(255,255,255,.4); transition:all .2s;
            border-bottom:2px solid transparent; }
        .cm-tab.active { color:#a78bfa; border-bottom-color:#a78bfa; background:rgba(167,139,250,.07); }
        .cm-tab:hover:not(.active) { color:rgba(255,255,255,.7); }
        .cm-panel { padding:1.25rem 1.5rem; display:none; flex-direction:column; gap:.75rem; }
        .cm-panel.active { display:flex; }
        .cm-row { display:grid; grid-template-columns:1fr auto; gap:.75rem; align-items:center;
            background:rgba(255,255,255,.025); border:1px solid rgba(255,255,255,.07);
            border-radius:11px; padding:.85rem 1.2rem; transition:all .2s; }
        .cm-row:hover { border-color:rgba(167,139,250,.25); }
        .cm-name { font-size:.9rem; font-weight:600; color:#fff; }
        .cm-meta { font-size:.75rem; color:rgba(255,255,255,.4); margin-top:.15rem; }
        .cm-actions { display:flex; gap:.4rem; }
        .cm-filter { display:flex; gap:.6rem; flex-wrap:wrap; margin-bottom:.5rem; }
        .cm-filter select, .cm-filter input { flex:1; min-width:120px;
            background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.12);
            color:#fff; border-radius:9px; padding:.45rem .8rem; font-size:.82rem; outline:none; }
        .cm-filter select option { background:#1a1a2e; }
        .cm-add-form { background:rgba(167,139,250,.04); border:1px solid rgba(167,139,250,.15);
            border-radius:12px; padding:1.1rem 1.25rem; display:flex; flex-direction:column; gap:.65rem; }
        .cm-add-form input, .cm-add-form select, .cm-add-form textarea { 
            background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.12);
            color:#fff; border-radius:9px; padding:.5rem .9rem; font-size:.83rem; outline:none; width:100%; box-sizing:border-box; }
        .cm-add-form textarea { min-height:80px; resize:vertical; font-family:inherit; }
        .cm-add-form input::placeholder, .cm-add-form textarea::placeholder { color:rgba(255,255,255,.3); }
        .cm-add-form input:focus, .cm-add-form select:focus, .cm-add-form textarea:focus { border-color:#a78bfa; }
        .cm-add-form select option { background:#1a1a2e; }
        .cm-row-grid { display:grid; grid-template-columns:1fr 1fr; gap:.6rem; }
        .cm-syllabus-area { background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08);
            border-radius:9px; padding:.75rem; color:rgba(255,255,255,.65); font-size:.82rem; line-height:1.6;
            min-height:60px; white-space:pre-wrap; }

        @media(max-width:600px){
            .ap-item { grid-template-columns:1fr; }
            .ap-stats { grid-template-columns:repeat(2,1fr); }
            .ca-form { grid-template-columns:1fr; }
            .ca-row { grid-template-columns:1fr auto; }
            .cm-row-grid { grid-template-columns:1fr; }
        }
        `;
        document.head.appendChild(s);
    }

    // ── Get or lazy-init Supabase ────────────────────────────────────────────
    function getSB() {
        if (window._apSB) return Promise.resolve(window._apSB);
        return import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm').then(({ createClient }) => {
            window._apSB = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            return window._apSB;
        });
    }

    // ── Helpers ──────────────────────────────────────────────────────────────
    function animNum(el, target, dur = 600) {
        if (!el) return;
        let start = null;
        const step = (ts) => {
            if (!start) start = ts;
            const p = Math.min((ts - start) / dur, 1);
            el.textContent = Math.round(p * target);
            if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }

    function fmtDate(iso) {
        if (!iso) return '';
        return new Date(iso).toLocaleString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }

    function getCurrentUser() {
        return window.currentUser
            || window.authStatus?.data?.currentUser
            || JSON.parse(localStorage.getItem('auth_user_full') || '{}');
    }

    function isSuperAdmin(u) {
        return u?.email && SUPER_ADMIN_EMAILS.includes(u.email.toLowerCase());
    }

    function isCoAdmin(u) {
        return u?.role === 'coadmin' && u?.assignedCollege;
    }

    function canAccessPanel(u) {
        return isSuperAdmin(u) || isCoAdmin(u);
    }

    // ── Core init ────────────────────────────────────────────────────────────
    async function initAdminPanel(container) {
        const wrap = container
            || document.getElementById('ap-content')
            || document.getElementById('admin-panel');

        if (!wrap) { console.error('[AdminPanel] No container found'); return; }

        const u = getCurrentUser();
        const superAdmin = isSuperAdmin(u);
        const coAdmin = isCoAdmin(u);

        // Check if co-admin via Supabase if not already set
        let assignedCollege = u?.assignedCollege || null;
        let assignedCollegeName = u?.assignedCollegeName || '';

        if (!superAdmin && !coAdmin) {
            // Check Supabase co_admins table
            try {
                const sb = await getSB();
                const { data: caList } = await sb.from('co_admins').select('*').eq('email', u?.email?.toLowerCase()).limit(1);
                const caData = caList && caList.length > 0 ? caList[0] : null;
                if (caData) {
                    assignedCollege = caData.college_id;
                    assignedCollegeName = caData.college_name;
                    // Update user object
                    if (window.currentUser) {
                        window.currentUser.role = 'coadmin';
                        window.currentUser.assignedCollege = assignedCollege;
                        window.currentUser.assignedCollegeName = assignedCollegeName;
                    }
                } else {
                    wrap.innerHTML = `<div style="text-align:center;padding:4rem;color:#f87171">
                        <div style="font-size:3rem">🚫</div>
                        <h2 style="margin:1rem 0">Access Denied</h2>
                        <p style="color:rgba(255,255,255,.4)">You do not have admin privileges.</p>
                    </div>`;
                    return;
                }
            } catch(e) {
                wrap.innerHTML = `<div style="text-align:center;padding:4rem;color:#f87171">
                    <div style="font-size:3rem">🚫</div>
                    <h2>Access Denied</h2>
                    <p style="color:rgba(255,255,255,.4)">Could not verify permissions.</p>
                </div>`;
                return;
            }
        }

        const roleLabel = superAdmin ? 'Super Admin' : `Co-Admin · ${assignedCollegeName || assignedCollege}`;

        wrap.innerHTML = `
          <div class="ap">
            <div class="ap-head">
              <div>
                <h1>${superAdmin ? '🛡️ Admin Control Center' : '🏫 College Admin Panel'}</h1>
                <p>${superAdmin ? 'Manage everything across all colleges' : `Managing notes for: ${assignedCollegeName || assignedCollege}`}</p>
              </div>
              <div class="ap-badge"><span class="dot"></span>${roleLabel}</div>
            </div>

            ${!superAdmin ? `<div class="ca-notice">
              ℹ️ You have been assigned as <strong>Co-Admin</strong> for <strong>${assignedCollegeName || assignedCollege}</strong>.
              You can approve or reject notes submitted for your college only.
            </div>` : ''}

            <!-- Stats always visible -->
            <div class="ap-stats">
              <div class="ap-stat c1">
                <div class="ap-stat-ico">📥</div>
                <div class="ap-stat-n" id="ap-s-pending">—</div>
                <div class="ap-stat-lbl">Pending${!superAdmin ? ' (Your College)' : ''}</div>
              </div>
              <div class="ap-stat c2">
                <div class="ap-stat-ico">✅</div>
                <div class="ap-stat-n" id="ap-s-approved">—</div>
                <div class="ap-stat-lbl">Approved${!superAdmin ? ' (Your College)' : ''}</div>
              </div>
              <div class="ap-stat c3">
                <div class="ap-stat-ico">📚</div>
                <div class="ap-stat-n" id="ap-s-total">—</div>
                <div class="ap-stat-lbl">Total Submissions</div>
              </div>
              <div class="ap-stat c4">
                <div class="ap-stat-ico">${superAdmin ? '👥' : '🏫'}</div>
                <div class="ap-stat-n" id="ap-s-colleges">—</div>
                <div class="ap-stat-lbl">${superAdmin ? 'Co-Admins' : 'College'}</div>
              </div>
            </div>

            <!-- ── TOP-LEVEL PAGE TOOLBAR ── -->
            <div class="ap-page-toolbar">
              <button class="ap-page-tab active" id="aptab-notes" onclick="window._apPage('notes',this)">
                <span>📋</span> Notes Review
              </button>
              <button class="ap-page-tab" id="aptab-content" onclick="window._apPage('content',this)">
                <span>🗂️</span> Content Manager
              </button>
              ${superAdmin ? `<button class="ap-page-tab" id="aptab-coadmin" onclick="window._apPage('coadmin',this)">
                <span>👥</span> Co-Admin Management
              </button>` : ''}
              <button class="ap-page-tab" id="aptab-referrals" onclick="window._apPage('referrals',this)">
                <span>🔗</span> Referrals
              </button>
              <button class="ap-page-tab" id="aptab-coders" onclick="window._apPage('coders',this)">
                <span>💻</span> Elite Coders
              </button>
              <button class="ap-page-tab" id="aptab-academic" onclick="window._apPage('academic',this)">
                <span>🎓</span> Academic Elite
              </button>
              <button class="ap-page-tab" id="aptab-neurosprint" onclick="window._apPage('neurosprint',this)">
                <span>🧠</span> NeuroSprint
              </button>
              <button class="ap-page-tab" id="aptab-timetable" onclick="window._apPage('timetable',this)">
                <span>⏰</span> Timetable
              </button>
            </div>

            <!-- ── PAGE: NOTES REVIEW ── -->
            <div class="ap-page active" id="appage-notes">
              <div class="ap-box">
                <div class="ap-box-head">
                  <div class="ap-box-title">
                    <span class="ap-live-dot"></span>
                    Pending Submissions${!superAdmin ? ` — ${assignedCollegeName}` : ''}
                  </div>
                  <button class="ap-ref-btn" id="ap-refresh-btn">↻ Refresh</button>
                </div>
                <div class="ap-list" id="ap-list">
                  <div class="ap-loader"><div class="ap-spin"></div><p>Fetching pending submissions…</p></div>
                </div>
              </div>

              <div class="ap-box">
                <div class="ap-box-head">
                  <div class="ap-box-title">
                    <span style="width:8px;height:8px;border-radius:50%;background:#34d399;box-shadow:0 0 10px #34d39988;display:inline-block"></span>
                    Approved Notes${!superAdmin ? ` — ${assignedCollegeName}` : ''}
                  </div>
                  <span style="font-size:.75rem;color:rgba(255,255,255,.35);">Admin can delete any note</span>
                </div>
                <div class="ap-list" id="ap-approved-list">
                  <div class="ap-loader"><div class="ap-spin"></div><p>Fetching approved notes…</p></div>
                </div>
              </div>
            </div>

            <!-- ── PAGE: CONTENT MANAGER ── -->
            <div class="ap-page" id="appage-content">
              <div class="ap-box" id="ap-content-mgr">
                <div class="ap-box-head">
                  <div class="ap-box-title">
                    <span style="width:8px;height:8px;border-radius:50%;background:#60a5fa;box-shadow:0 0 10px #60a5fa88;display:inline-block"></span>
                    Content Manager${!superAdmin ? ` — ${assignedCollegeName}` : ''}
                  </div>
                  <span style="font-size:.75rem;color:rgba(255,255,255,.35);">Manage subjects, syllabus &amp; note titles</span>
                </div>
                <div class="cm-tabs">
                  <button class="cm-tab active" onclick="window._cmTab('subjects',this)">📚 Subjects</button>
                  <button class="cm-tab" onclick="window._cmTab('syllabus',this)">📋 Syllabus</button>
                  <button class="cm-tab" onclick="window._cmTab('notes-titles',this)">✏️ Edit Note Titles</button>
                </div>

                <!-- Subjects Panel -->
                <div class="cm-panel active" id="cm-subjects">
                  <div class="cm-filter">
                    ${superAdmin ? `<select id="cm-s-college" onchange="window._cmLoadSubjects()">
                      <option value="">All Colleges</option>
                      <option value="global" style="color:#a78bfa;font-weight:bold;">🌐 Global (Default for all)</option>
                      ${(window.GlobalData?.colleges || []).map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                    </select>` : `<input type="text" value="${assignedCollegeName || assignedCollege}" disabled style="opacity:.6" />`}
                    <select id="cm-s-branch" onchange="window._cmLoadSubjects()">
                      <option value="">All Branches</option>
                      <option value="global" style="color:#a78bfa;font-weight:bold;">🌐 Global / All Branches</option>
                      ${(window.GlobalData?.branches || []).map(b => `<option value="${b.id}">${b.name}</option>`).join('')}
                    </select>
                    <select id="cm-s-sem" onchange="window._cmLoadSubjects()">
                      <option value="">All Semesters</option>
                      <option value="global" style="color:#a78bfa;font-weight:bold;">🌐 Global / All Semesters</option>
                      ${[1,2,3,4,5,6,7,8].map(s => `<option value="Semester ${s}">Semester ${s}</option>`).join('')}
                    </select>
                  </div>
                  <div class="cm-add-form">
                    <div style="font-size:.8rem;font-weight:700;color:#a78bfa;margin-bottom:.25rem">➕ Add New Subject</div>
                    <div class="cm-row-grid">
                      <input type="text" id="cm-new-subject-name" placeholder="Subject Name (e.g. Data Structures)" />
                      <input type="text" id="cm-new-subject-code" placeholder="Code (e.g. CS301)" />
                    </div>
                    <div class="cm-row-grid">
                      <select id="cm-new-subject-college">
                        ${superAdmin ? `<option value="">Select College</option><option value="global" style="color:#a78bfa;font-weight:bold;">🌐 Global (Default for all)</option>${(window.GlobalData?.colleges || []).map(c => `<option value="${c.id}">${c.name}</option>`).join('')}` : `<option value="${assignedCollege}">${assignedCollegeName}</option>`}
                      </select>
                      <select id="cm-new-subject-branch">
                        <option value="">Select Branch</option>
                        <option value="global" style="color:#a78bfa;font-weight:bold;">🌐 Global / All Branches</option>
                        ${(window.GlobalData?.branches || []).map(b => `<option value="${b.id}">${b.name}</option>`).join('')}
                      </select>
                    </div>
                    <select id="cm-new-subject-sem">
                      <option value="">Select Semester</option>
                      <option value="global" style="color:#a78bfa;font-weight:bold;">🌐 Global / All Semesters</option>
                      ${[1,2,3,4,5,6,7,8].map(s => `<option value="Semester ${s}">Semester ${s}</option>`).join('')}
                    </select>
                    <textarea id="cm-new-subject-desc" placeholder="Short description (optional)"></textarea>
                    <button class="apb apb-ok" style="align-self:flex-start" onclick="window._cmAddSubject()">+ Add Subject</button>
                  </div>
                  <div id="cm-subjects-list"><div class="ap-loader"><div class="ap-spin"></div><p>Loading subjects…</p></div></div>
                </div>

                <!-- Syllabus Panel -->
                <div class="cm-panel" id="cm-syllabus">
                  <div style="font-size:.82rem;color:rgba(255,255,255,.4);margin-bottom:.5rem">Select college, branch and semester to view or edit syllabus</div>
                  <div class="cm-filter">
                    ${superAdmin ? `<select id="cm-syl-college" onchange="window._cmLoadSyllabusList()">
                      <option value="">Select College</option>
                      <option value="global" style="color:#a78bfa;font-weight:bold;">🌐 Global (Default for all)</option>
                      ${(window.GlobalData?.colleges || []).map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                    </select>` : `<input type="text" value="${assignedCollegeName || assignedCollege}" disabled style="opacity:.6" />`}
                    <select id="cm-syl-branch" onchange="window._cmLoadSyllabusList()">
                      <option value="">Select Branch</option>
                      <option value="global" style="color:#a78bfa;font-weight:bold;">🌐 Global / All Branches</option>
                      ${(window.GlobalData?.branches || []).map(b => `<option value="${b.id}">${b.name}</option>`).join('')}
                    </select>
                    <select id="cm-syl-sem" onchange="window._cmLoadSyllabusList()">
                      <option value="">Select Semester</option>
                      <option value="global" style="color:#a78bfa;font-weight:bold;">🌐 Global / All Semesters</option>
                      ${[1,2,3,4,5,6,7,8].map(s => `<option value="Semester ${s}">Semester ${s}</option>`).join('')}
                    </select>
                  </div>
                  <div id="cm-syllabus-list"><div style="color:rgba(255,255,255,.3);font-size:.85rem;padding:1rem">← Use the filters above to load subjects</div></div>
                </div>

                <!-- Edit Note Titles Panel -->
                <div class="cm-panel" id="cm-notes-titles">
                  <div style="font-size:.82rem;color:rgba(255,255,255,.4);margin-bottom:.5rem">Rename or delete approved notes directly</div>
                  <div id="cm-notes-title-list"><div class="ap-loader"><div class="ap-spin"></div><p>Loading approved notes…</p></div></div>
                </div>
              </div>
            </div>

            <!-- ── PAGE: CO-ADMIN MANAGEMENT (superadmin only) ── -->
            ${superAdmin ? `
            <div class="ap-page" id="appage-coadmin">
              <div class="ap-box" id="ap-coadmin-box">
                <div class="ap-box-head">
                  <div class="ap-box-title">
                    <span style="width:8px;height:8px;border-radius:50%;background:#a78bfa;box-shadow:0 0 10px #a78bfa88;display:inline-block"></span>
                    Co-Admin Management
                  </div>
                  <span style="font-size:.75rem;color:rgba(255,255,255,.35);">Assign moderators per college</span>
                </div>
                <div class="ca-form">
                  <input type="email" id="ca-email-input" placeholder="Enter user email (e.g. john@college.edu)" />
                  <select id="ca-college-select">
                    <option value="">— Select College —</option>
                    ${(window.GlobalData?.colleges || []).map(c => `<option value="${c.id}" data-name="${c.name}">${c.name}</option>`).join('')}
                  </select>
                  <button class="apb apb-ok" onclick="window._apAssignCoAdmin()">+ Assign</button>
                </div>
                <div class="ap-list" id="ap-coadmin-list">
                  <div class="ap-loader"><div class="ap-spin"></div><p>Loading co-admins…</p></div>
                </div>
              </div>
            </div>` : ''}

            <!-- ── PAGE: REFERRALS ── -->
            <div class="ap-page" id="appage-referrals">
              <div class="ap-box">
                <div class="ap-box-head">
                  <div class="ap-box-title">
                    <span style="width:8px;height:8px;border-radius:50%;background:#00d2ff;box-shadow:0 0 10px #00d2ff88;display:inline-block"></span>
                    Referral Tracker
                  </div>
                  <button class="ap-ref-btn" onclick="window._apLoadReferrals()">↻ Refresh</button>
                </div>
                <div class="ap-list" id="ap-referrals-list">
                  <div class="ap-loader"><div class="ap-spin"></div><p>Loading referrals…</p></div>
                </div>
              </div>
            </div>

            <!-- ── PAGE: CODERS ── -->
            <div class="ap-page" id="appage-coders">
              <div class="ap-box">
                <div class="ap-box-head">
                  <div class="ap-box-title">
                    <span style="width:8px;height:8px;border-radius:50%;background:#fb923c;box-shadow:0 0 10px #fb923c88;display:inline-block"></span>
                    Elite Coders Activity
                  </div>
                  <button class="ap-ref-btn" onclick="window._apLoadCoders()">↻ Refresh</button>
                </div>
                <div class="ap-list" id="ap-coders-list">
                  <div class="ap-loader"><div class="ap-spin"></div><p>Loading coders data…</p></div>
                </div>
              </div>
            </div>

            <!-- ── PAGE: ACADEMIC ── -->
            <div class="ap-page" id="appage-academic">
              <div class="ap-box">
                <div class="ap-box-head">
                  <div class="ap-box-title">
                    <span style="width:8px;height:8px;border-radius:50%;background:#7B61FF;box-shadow:0 0 10px #7B61FF88;display:inline-block"></span>
                    Academic Elite Activity
                  </div>
                  <button class="ap-ref-btn" onclick="window._apLoadAcademic()">↻ Refresh</button>
                </div>
                <div class="ap-list" id="ap-academic-list">
                  <div class="ap-loader"><div class="ap-spin"></div><p>Loading academic data…</p></div>
                </div>
              </div>
            </div>

            <!-- ── PAGE: NEUROSPRINT ── -->
            <div class="ap-page" id="appage-neurosprint">
              <div class="ap-box">
                <div class="ap-box-head">
                  <div class="ap-box-title">
                    <span style="width:8px;height:8px;border-radius:50%;background:#00F2FF;box-shadow:0 0 10px #00F2FF88;display:inline-block"></span>
                    NeuroSprint Pro Activity
                  </div>
                  <button class="ap-ref-btn" onclick="window._apLoadNeuroSprint()">↻ Refresh</button>
                </div>
                <div class="ap-list" id="ap-neurosprint-list">
                  <div class="ap-loader"><div class="ap-spin"></div><p>Loading NeuroSprint data…</p></div>
                </div>
              </div>
            </div>

            <!-- ── PAGE: TIMETABLE ── -->
            <div class="ap-page" id="appage-timetable">
              <div class="ap-box">
                <div class="ap-box-head">
                  <div class="ap-box-title">
                    <span style="width:8px;height:8px;border-radius:50%;background:#f43f5e;box-shadow:0 0 10px #f43f5e88;display:inline-block"></span>
                    Exam Timetable Manager
                  </div>
                  <span style="font-size:.75rem;color:rgba(255,255,255,.35);">Add and manage upcoming exams</span>
                </div>
                
                <div class="cm-add-form" style="border-radius: 0; border-left: none; border-right: none; border-top: none;">
                    <div style="font-size:.8rem;font-weight:700;color:#f43f5e;margin-bottom:.25rem">➕ Schedule Exam</div>
                    <div class="cm-row-grid">
                      <select id="tt-college">
                        ${superAdmin ? `<option value="">Select College</option><option value="global" style="color:#a78bfa;font-weight:bold;">🌐 Global (Default for all)</option>${(window.GlobalData?.colleges || []).map(c => `<option value="${c.id}">${c.name}</option>`).join('')}` : `<option value="${assignedCollege}">${assignedCollegeName}</option>`}
                      </select>
                      <select id="tt-branch" onchange="if(window._ttUpdateSubjects) window._ttUpdateSubjects()">
                        <option value="">Select Branch</option>
                        <option value="global" style="color:#a78bfa;font-weight:bold;">🌐 Global / All Branches</option>
                        ${(window.GlobalData?.branches || []).map(b => `<option value="${b.id}">${b.name}</option>`).join('')}
                      </select>
                    </div>
                    <div class="cm-row-grid">
                        <select id="tt-sem" onchange="if(window._ttUpdateSubjects) window._ttUpdateSubjects()">
                        <option value="">Select Semester</option>
                        <option value="global" style="color:#a78bfa;font-weight:bold;">🌐 Global / All Semesters</option>
                        ${[1,2,3,4,5,6,7,8].map(s => `<option value="Semester ${s}">Semester ${s}</option>`).join('')}
                        </select>
                        <select id="tt-subject-select">
                            <option value="">Select Subject</option>
                        </select>
                    </div>
                    <div class="cm-row-grid" style="margin-top: 10px;">
                        <input type="text" id="tt-subject-manual" placeholder="Or enter Custom Subject manually" />
                        <input type="datetime-local" id="tt-date" style="color: white; color-scheme: dark; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.12); padding: .5rem .9rem; border-radius: 9px;" />
                    </div>
                    <div style="margin-top: 10px;">
                        <button class="apb apb-ok" onclick="window._ttAddExam()" style="width: 100%;">+ Schedule Exam</button>
                    </div>
                </div>
                
                <div class="ap-list" id="tt-list">
                  <div class="ap-loader"><div class="ap-spin"></div><p>Loading timetable…</p></div>
                </div>
              </div>
            </div>

          </div>`;


        // ── Page switcher ─────────────────────────────────────────────────────
        window._apPage = function (name, btn) {
            document.querySelectorAll('.ap-page-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.ap-page').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            const page = document.getElementById('appage-' + name);
            if (page) page.classList.add('active');
        };


        document.getElementById('ap-refresh-btn').onclick = () => refresh(assignedCollege);

        // Store assignedCollege for content manager
        window._apCurrentCollege = assignedCollege;
        window._apCurrentCollegeName = assignedCollegeName;
        window._apIsSuperAdmin = superAdmin;

        try {
            const sb = await getSB();
            await Promise.all([
                loadStats(sb, assignedCollege),
                loadList(sb, assignedCollege),
                loadApproved(sb, assignedCollege),
                superAdmin ? loadCoAdmins(sb) : Promise.resolve(),
                loadCmSubjects(sb, assignedCollege),
                loadCmNoteTitles(sb, assignedCollege),
                loadReferrals(sb),
                loadCoders(sb),
                loadAcademic(sb),
                loadNeuroSprint(sb),
                window._ttLoadExams()
            ]);
        } catch (e) {
            console.error('[AdminPanel] Init error:', e);
            const list = document.getElementById('ap-list');
            if (list) list.innerHTML = `<div class="ap-err">⚠️ ${e.message}</div>`;
        }
    }

    // ── Refresh ──────────────────────────────────────────────────────────────
    async function refresh(assignedCollege) {
        const list = document.getElementById('ap-list');
        if (list) list.innerHTML = `<div class="ap-loader"><div class="ap-spin"></div><p>Refreshing…</p></div>`;
        const aList = document.getElementById('ap-approved-list');
        if (aList) aList.innerHTML = `<div class="ap-loader"><div class="ap-spin"></div><p>Refreshing…</p></div>`;
        try {
            const sb = await getSB();
            const u = getCurrentUser();
            const col = assignedCollege || (isCoAdmin(u) ? u.assignedCollege : null);
            await Promise.all([loadStats(sb, col), loadList(sb, col), loadApproved(sb, col)]);
        } catch (e) {
            if (list) list.innerHTML = `<div class="ap-err">⚠️ ${e.message}</div>`;
        }
    }

    // ── Stats ────────────────────────────────────────────────────────────────
    async function loadStats(sb, college = null) {
        let pQuery = sb.from('pending_notes').select('*', { count: 'exact', head: true });
        let aQuery = sb.from('approved_notes').select('*', { count: 'exact', head: true });
        if (college) { pQuery = pQuery.eq('college', college); aQuery = aQuery.eq('college', college); }

        const [{ count: pending }, { count: approved }] = await Promise.all([pQuery, aQuery]);

        const u = getCurrentUser();
        const superAdmin = isSuperAdmin(u);
        let extraCount;

        if (superAdmin) {
            const { data: caList } = await sb.from('co_admins').select('email');
            extraCount = caList?.length || 0;
        } else {
            extraCount = 1; // 1 college for co-admin
        }

        animNum(document.getElementById('ap-s-pending'), pending || 0);
        animNum(document.getElementById('ap-s-approved'), approved || 0);
        animNum(document.getElementById('ap-s-total'), (pending || 0) + (approved || 0));
        animNum(document.getElementById('ap-s-colleges'), extraCount);
    }

    // ── Pending List ─────────────────────────────────────────────────────────
    async function loadList(sb, college = null) {
        const list = document.getElementById('ap-list');
        if (!list) return;

        let q = sb.from('pending_notes').select('*').order('created_at', { ascending: false });
        if (college) q = q.eq('college', college);

        const { data, error } = await q;
        if (error) throw error;

        if (!data || data.length === 0) {
            list.innerHTML = `
              <div class="ap-empty">
                <div class="ap-empty-ico">🎉</div>
                <h3>All caught up!</h3>
                <p>No pending submissions${college ? ` for ${college}` : ''} right now.</p>
              </div>`;
            return;
        }

        list.innerHTML = data.map((n, i) => `
          <div class="ap-item" id="ap-n-${n.id}" style="animation-delay:${i * 40}ms">
            <div>
              <div class="ap-tags">
                ${n.subject ? `<span class="ap-tag subject">${n.subject}</span>` : ''}
                ${n.college ? `<span class="ap-tag college">${n.college}</span>` : ''}
                ${n.branch  ? `<span class="ap-tag branch">${n.branch}</span>`  : ''}
                ${n.semester? `<span class="ap-tag sem">Sem ${n.semester}</span>`:''}
                ${n.type && n.type !== 'notes' ? `<span class="ap-tag" style="background:rgba(251,191,36,.1);color:#fbbf24;border:1px solid rgba(251,191,36,.2)">${n.type.toUpperCase()}</span>` : ''}
              </div>
              <div class="ap-title" title="${n.title || ''}">${n.title || 'Untitled Note'}</div>
              <div class="ap-meta">Uploaded by <span>${n.uploader_name || (n.uploader_email ? n.uploader_email.split('@')[0] : 'Unknown')}</span></div>
              ${n.created_at ? `<div class="ap-time">${fmtDate(n.created_at)}</div>` : ''}
            </div>
              <div style="margin-top: 10px; display: flex; align-items: center; gap: 8px;">
                <input type="checkbox" id="ap-dl-${n.id}" checked style="accent-color: var(--primary); cursor: pointer; width: 16px; height: 16px;">
                <label for="ap-dl-${n.id}" style="color: var(--text-dim); font-size: 0.85rem; cursor: pointer;">Allow users to download this file</label>
              </div>
            </div>
            <div class="ap-actions" style="margin-top: 15px;">
              ${n.file_url ? `<a href="${window.getViewerUrl(n.file_url, n.title)}" target="_blank" class="apb apb-view">👁 View</a>` : ''}
              <button class="apb apb-ok" onclick="window._apApprove('${n.id}')">✓ Approve</button>
              <button class="apb apb-no" onclick="window._apReject('${n.id}')">✕ Reject</button>
            </div>
          </div>`).join('');
    }

    // ── Approved List ────────────────────────────────────────────────────────
    async function loadApproved(sb, college = null) {
        const list = document.getElementById('ap-approved-list');
        if (!list) return;

        let q = sb.from('approved_notes').select('*').order('created_at', { ascending: false });
        if (college) q = q.eq('college', college);

        const { data, error } = await q;
        if (error) { list.innerHTML = `<div class="ap-err">⚠️ ${error.message}</div>`; return; }

        if (!data || data.length === 0) {
            list.innerHTML = `
              <div class="ap-empty">
                <div class="ap-empty-ico">📭</div>
                <h3>No approved notes yet</h3>
                <p>Notes approved above will appear here.</p>
              </div>`;
            return;
        }

        list.innerHTML = data.map((n, i) => `
          <div class="ap-item" id="ap-a-${n.id}" style="animation-delay:${i * 40}ms">
            <div>
              <div class="ap-tags">
                ${n.subject ? `<span class="ap-tag subject">${n.subject}</span>` : ''}
                ${n.college ? `<span class="ap-tag college">${n.college}</span>` : ''}
                ${n.branch  ? `<span class="ap-tag branch">${n.branch}</span>`  : ''}
                ${n.semester? `<span class="ap-tag sem">Sem ${n.semester}</span>`:''}
                ${n.type && n.type !== 'notes' ? `<span class="ap-tag" style="background:rgba(251,191,36,.1);color:#fbbf24;border:1px solid rgba(251,191,36,.2)">${n.type.toUpperCase()}</span>` : ''}
                <span class="ap-tag" style="background:rgba(52,211,153,.1);color:#34d399;border:1px solid rgba(52,211,153,.2)">✓ LIVE</span>
              </div>
              <div class="ap-title" title="${n.title || ''}">${n.title || 'Untitled Note'}</div>
              <div class="ap-meta">By <span>${n.uploader_name || (n.uploader_email ? n.uploader_email.split('@')[0] : 'Unknown')}</span></div>
              ${n.created_at ? `<div class="ap-time">${fmtDate(n.created_at)}</div>` : ''}
            </div>
              <div style="margin-top: 10px;">
                <span class="ap-tag" style="background: ${n.allow_download !== false ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 107, 107, 0.1)'}; color: ${n.allow_download !== false ? '#00ff88' : '#ff6b6b'}; border: 1px solid ${n.allow_download !== false ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 107, 107, 0.2)'};">
                  ${n.allow_download !== false ? '✅ Downloadable' : '❌ View Only'}
                </span>
              </div>
            </div>
            <div class="ap-actions" style="margin-top: 15px;">
              ${n.file_url ? `<a href="${window.getViewerUrl(n.file_url, n.title, n.id)}" target="_blank" class="apb apb-view">👁 View</a>` : ''}
              <button class="apb" style="background: rgba(255,255,255,0.05); color: var(--text-main);" onclick="window._apToggleDownload('${n.id}', ${n.allow_download !== false})">
                ${n.allow_download !== false ? 'Disable DL' : 'Enable DL'}
              </button>
              <button class="apb apb-no" onclick="window._apDeleteApproved('${n.id}')">🗑 Delete</button>
            </div>
          </div>`).join('');
    }

    // ── Co-Admin List (superadmin only) ──────────────────────────────────────
    async function loadCoAdmins(sb) {
        const list = document.getElementById('ap-coadmin-list');
        if (!list) return;

        const { data, error } = await sb.from('co_admins').select('*').order('created_at', { ascending: false });
        if (error) { list.innerHTML = `<div class="ap-err">⚠️ ${error.message}</div>`; return; }

        if (!data || data.length === 0) {
            list.innerHTML = `
              <div class="ap-empty">
                <div class="ap-empty-ico">👥</div>
                <h3>No Co-Admins assigned</h3>
                <p>Use the form above to assign a co-admin to a college.</p>
              </div>`;
            return;
        }

        list.innerHTML = data.map(ca => `
          <div class="ca-row" id="ca-${ca.id}">
            <div class="ca-email">📧 ${ca.email}</div>
            <div class="ca-college">🏫 ${ca.college_name || ca.college_id}</div>
            <button class="apb apb-no" style="padding:.4rem .8rem;font-size:.75rem;" onclick="window._apRemoveCoAdmin('${ca.id}', '${ca.email}')">✕ Remove</button>
          </div>`).join('');
    }

    // ── Actions: Approve ─────────────────────────────────────────────────────
    window._apApprove = async function (id) {
        const el = document.getElementById(`ap-n-${id}`);
        const btns = el ? el.querySelectorAll('.apb') : [];
        btns.forEach(b => { b.disabled = true; });

        try {
            const sb = await getSB();
            const { data: notes, error: fe } = await sb.from('pending_notes').select('*').eq('id', id).limit(1);
            if (fe) throw fe;
            if (!notes || notes.length === 0) throw new Error("Note not found or already processed.");
            const note = notes[0];

            const dlCheck = document.getElementById(`ap-dl-${id}`);
            const allowDl = dlCheck ? dlCheck.checked : true;

            const { error: ie } = await sb.from('approved_notes').insert([{
                college: note.college, stream: note.stream, branch: note.branch,
                semester: note.semester, subject: note.subject, title: note.title,
                file_url: note.file_url, uploader_email: note.uploader_email,
                uploader_name: note.uploader_name || (note.uploader_email ? note.uploader_email.split('@')[0] : 'Scholar'),
                type: note.type || 'notes',
                status: 'approved',
                allow_download: allowDl
            }]);
            if (ie) throw ie;

            const { error: de } = await sb.from('pending_notes').delete().eq('id', id);
            if (de) throw de;

            if (el) { el.classList.add('removing'); setTimeout(() => el.remove(), 300); }
            if (window.showToast) window.showToast('✅ Note approved and published!');

            const u = getCurrentUser();
            const col = isSuperAdmin(u) ? null : (u.assignedCollege || null);
            const sb2 = await getSB();
            await Promise.all([loadStats(sb2, col), loadApproved(sb2, col)]);

        } catch (e) {
            console.error('[AP] Approve error:', e);
            btns.forEach(b => { b.disabled = false; });
            if (window.showToast) window.showToast('❌ Approve failed: ' + e.message, 'error');
        }
    };

    // ── Actions: Reject ──────────────────────────────────────────────────────
    window._apReject = async function (id) {
        if (!confirm('Reject and permanently delete this submission?')) return;
        const el = document.getElementById(`ap-n-${id}`);
        const btns = el ? el.querySelectorAll('.apb') : [];
        btns.forEach(b => { b.disabled = true; });

        try {
            const sb = await getSB();
            const { error } = await sb.from('pending_notes').delete().eq('id', id);
            if (error) throw error;

            if (el) { el.classList.add('removing'); setTimeout(() => el.remove(), 300); }
            if (window.showToast) window.showToast('🗑 Submission rejected.');

            const u = getCurrentUser();
            const col = isSuperAdmin(u) ? null : (u.assignedCollege || null);
            await loadStats(await getSB(), col);

        } catch (e) {
            console.error('[AP] Reject error:', e);
            btns.forEach(b => { b.disabled = false; });
            if (window.showToast) window.showToast('❌ Reject failed: ' + e.message, 'error');
        }
    };

    // ── Actions: Delete Approved ─────────────────────────────────────────────
    window._apDeleteApproved = async function (id) {
        if (!confirm('Permanently delete this approved note? It will be removed for all users.')) return;
        const el = document.getElementById(`ap-a-${id}`);
        const btns = el ? el.querySelectorAll('.apb') : [];
        btns.forEach(b => { b.disabled = true; });

        try {
            const sb = await getSB();
            const { error } = await sb.from('approved_notes').delete().eq('id', id);
            if (error) throw error;

            if (el) { el.classList.add('removing'); setTimeout(() => el.remove(), 300); }
            if (window.showToast) window.showToast('🗑 Note removed from public library.');

            const u = getCurrentUser();
            const col = isSuperAdmin(u) ? null : (u.assignedCollege || null);
            await loadStats(await getSB(), col);

        } catch (e) {
            console.error('[AP] Delete approved error:', e);
            btns.forEach(b => { b.disabled = false; });
            if (window.showToast) window.showToast('❌ Delete failed: ' + e.message, 'error');
        }
    };

    // ── Actions: Assign Co-Admin (superadmin only) ───────────────────────────
    window._apAssignCoAdmin = async function () {
        const emailInput = document.getElementById('ca-email-input');
        const collegeSelect = document.getElementById('ca-college-select');
        const email = emailInput?.value?.trim().toLowerCase();
        const collegeId = collegeSelect?.value;
        const collegeName = collegeSelect?.options[collegeSelect.selectedIndex]?.dataset?.name || collegeId;

        if (!email || !email.includes('@')) {
            if (window.showToast) window.showToast('❌ Please enter a valid email.', 'error');
            return;
        }
        if (!collegeId) {
            if (window.showToast) window.showToast('❌ Please select a college.', 'error');
            return;
        }

        const u = getCurrentUser();
        try {
            const sb = await getSB();

            // Check if already exists
            const { data: existing } = await sb.from('co_admins').select('id').eq('email', email);
            if (existing && existing.length > 0) {
                // Update college assignment
                const { error } = await sb.from('co_admins').update({ college_id: collegeId, college_name: collegeName }).eq('email', email);
                if (error) throw error;
                if (window.showToast) window.showToast(`✅ Co-Admin updated: ${email} → ${collegeName}`);
            } else {
                const { error } = await sb.from('co_admins').insert([{
                    email,
                    college_id: collegeId,
                    college_name: collegeName,
                    assigned_by: u?.email || 'admin'
                }]);
                if (error) throw error;
                if (window.showToast) window.showToast(`✅ ${email} assigned as Co-Admin for ${collegeName}`);
            }

            emailInput.value = '';
            collegeSelect.value = '';
            await loadCoAdmins(await getSB());
            await loadStats(await getSB(), null);

        } catch (e) {
            console.error('[AP] Assign co-admin error:', e);
            if (window.showToast) window.showToast('❌ Failed: ' + e.message, 'error');
        }
    };

    window._apToggleDownload = async function (id, currentStatus) {
        if (!confirm(`Are you sure you want to ${currentStatus ? 'disable' : 'enable'} downloading for this note?`)) return;
        const sb = await getSB();
        const { error } = await sb.from('approved_notes').update({ allow_download: !currentStatus }).eq('id', id);
        if (error) {
            if (window.showToast) window.showToast('❌ Update failed: ' + error.message, 'error');
        } else {
            if (window.showToast) window.showToast('✅ Download status updated!');
            const u = getCurrentUser();
            const col = isSuperAdmin(u) ? null : (u.assignedCollege || null);
            loadApproved(sb, col);
        }
    };

    // ── Actions: Remove Co-Admin ─────────────────────────────────────────────
    window._apRemoveCoAdmin = async function (id, email) {
        if (!confirm(`Remove co-admin access for ${email}?`)) return;
        try {
            const sb = await getSB();
            const { error } = await sb.from('co_admins').delete().eq('id', id);
            if (error) throw error;

            const el = document.getElementById(`ca-${id}`);
            if (el) { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }
            if (window.showToast) window.showToast(`🗑 Co-admin removed: ${email}`);
            await loadStats(await getSB(), null);
        } catch (e) {
            console.error('[AP] Remove co-admin error:', e);
            if (window.showToast) window.showToast('❌ Failed: ' + e.message, 'error');
        }
    };

    // ══════════════════════════════════════════════════════════════════════════
    // CONTENT MANAGER FUNCTIONS
    // ══════════════════════════════════════════════════════════════════════════

    // Tab switcher
    window._cmTab = function (panel, btn) {
        document.querySelectorAll('.cm-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.cm-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const el = document.getElementById(`cm-${panel}`);
        if (el) el.classList.add('active');
    };

    // ── Subjects ─────────────────────────────────────────────────────────────
    async function loadCmSubjects(sb, college = null) {
        const list = document.getElementById('cm-subjects-list');
        if (!list) return;

        let q = sb.from('college_subjects').select('*').order('created_at', { ascending: false });
        if (college) q = q.eq('college_id', college);

        const { data, error } = await q;
        if (error) { list.innerHTML = `<div class="ap-err">⚠️ ${error.message}</div>`; return; }

        if (!data || data.length === 0) {
            list.innerHTML = `<div class="ap-empty" style="padding:2rem">
              <div class="ap-empty-ico">📚</div>
              <h3>No custom subjects yet</h3>
              <p>Use the form above to add subjects for a college.</p>
            </div>`;
            return;
        }

        list.innerHTML = data.map(s => `
          <div class="cm-row" id="cms-${s.id}">
            <div>
              <div class="cm-name">${s.subject_name} ${s.subject_code ? `<span style="font-size:.72rem;color:#60a5fa;margin-left:.4rem">${s.subject_code}</span>` : ''}</div>
              <div class="cm-meta">${s.college_id} · ${s.branch_id || 'All Branches'} · ${s.semester || 'All Sems'}</div>
            </div>
            <div class="cm-actions">
              <button class="apb apb-no" style="padding:.35rem .7rem;font-size:.75rem" onclick="window._cmDeleteSubject('${s.id}')">🗑</button>
            </div>
          </div>`).join('');
    }

    window._cmLoadSubjects = async function () {
        const college = document.getElementById('cm-s-college')?.value || window._apCurrentCollege || null;
        const branch = document.getElementById('cm-s-branch')?.value || null;
        const sem = document.getElementById('cm-s-sem')?.value || null;
        const list = document.getElementById('cm-subjects-list');
        if (list) list.innerHTML = `<div class="ap-loader"><div class="ap-spin"></div><p>Loading…</p></div>`;
        try {
            const sb = await getSB();
            let q = sb.from('college_subjects').select('*').order('created_at', { ascending: false });
            if (college) q = q.eq('college_id', college);
            if (branch) q = q.eq('branch_id', branch);
            if (sem) q = q.eq('semester', sem);
            const { data, error } = await q;
            if (error) throw error;
            if (!data || data.length === 0) {
                list.innerHTML = `<div style="color:rgba(255,255,255,.4);padding:1.5rem;text-align:center">No subjects found for this filter.</div>`;
                return;
            }
            list.innerHTML = data.map(s => `
              <div class="cm-row" id="cms-${s.id}">
                <div>
                  <div class="cm-name">${s.subject_name} ${s.subject_code ? `<span style="font-size:.72rem;color:#60a5fa;margin-left:.4rem">${s.subject_code}</span>` : ''}</div>
                  <div class="cm-meta">${s.college_id} · ${s.branch_id || '—'} · ${s.semester || '—'}</div>
                  ${s.description ? `<div class="cm-meta" style="margin-top:.2rem">${s.description}</div>` : ''}
                </div>
                <div class="cm-actions">
                  <button class="apb apb-no" style="padding:.35rem .7rem;font-size:.75rem" onclick="window._cmDeleteSubject('${s.id}')">🗑 Delete</button>
                </div>
              </div>`).join('');
        } catch (e) {
            if (list) list.innerHTML = `<div class="ap-err">⚠️ ${e.message}</div>`;
        }
    };

    window._cmAddSubject = async function () {
        const name = document.getElementById('cm-new-subject-name')?.value?.trim();
        const code = document.getElementById('cm-new-subject-code')?.value?.trim();
        const college = document.getElementById('cm-new-subject-college')?.value || window._apCurrentCollege;
        const branch = document.getElementById('cm-new-subject-branch')?.value;
        const sem = document.getElementById('cm-new-subject-sem')?.value;
        const desc = document.getElementById('cm-new-subject-desc')?.value?.trim();

        if (!name) { if (window.showToast) window.showToast('❌ Subject name is required.', 'error'); return; }
        if (!college) { if (window.showToast) window.showToast('❌ Please select a college.', 'error'); return; }
        if (!branch) { if (window.showToast) window.showToast('❌ Please select a branch.', 'error'); return; }
        if (!sem) { if (window.showToast) window.showToast('❌ Please select a semester.', 'error'); return; }

        const u = getCurrentUser();
        try {
            const sb = await getSB();
            const { error } = await sb.from('college_subjects').insert([{
                college_id: college,
                branch_id: branch,
                semester: sem,
                subject_name: name,
                subject_code: code || null,
                description: desc || null,
                created_by: u?.email || 'admin'
            }]);
            if (error) throw error;
            if (window.showToast) window.showToast(`✅ Subject "${name}" added!`);
            // Clear form
            ['cm-new-subject-name','cm-new-subject-code','cm-new-subject-desc'].forEach(id => {
                const el = document.getElementById(id); if (el) el.value = '';
            });
            await loadCmSubjects(await getSB(), window._apCurrentCollege || null);
        } catch (e) {
            if (window.showToast) window.showToast('❌ Failed: ' + e.message, 'error');
        }
    };

    window._cmDeleteSubject = async function (id) {
        if (!confirm('Delete this custom subject?')) return;
        try {
            const sb = await getSB();
            const { error } = await sb.from('college_subjects').delete().eq('id', id);
            if (error) throw error;
            const el = document.getElementById(`cms-${id}`);
            if (el) { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }
            if (window.showToast) window.showToast('🗑 Subject deleted.');
        } catch (e) {
            if (window.showToast) window.showToast('❌ Failed: ' + e.message, 'error');
        }
    };

    // ── Syllabus ─────────────────────────────────────────────────────────────
    window._cmLoadSyllabusList = async function () {
        const college = document.getElementById('cm-syl-college')?.value || window._apCurrentCollege || null;
        const branch = document.getElementById('cm-syl-branch')?.value || null;
        const sem = document.getElementById('cm-syl-sem')?.value || null;
        const list = document.getElementById('cm-syllabus-list');
        if (!college || !branch || !sem) {
            if (list) list.innerHTML = `<div style="color:rgba(255,255,255,.3);font-size:.85rem;padding:1rem">← Select college, branch and semester</div>`;
            return;
        }
        if (list) list.innerHTML = `<div class="ap-loader"><div class="ap-spin"></div><p>Loading subjects…</p></div>`;
        try {
            const sb = await getSB();
            const { data, error } = await sb.from('college_subjects').select('*')
                .eq('college_id', college).eq('branch_id', branch).eq('semester', sem);
            if (error) throw error;

            // Also show GlobalData subjects for this branch/semester
            const gdKey = `${branch}-${sem}`;
            const gdSubjects = (window.GlobalData?.subjects?.[gdKey] || []).map(s => ({
                id: `gd_${s.id}`, subject_name: s.name, subject_code: s.code,
                description: s.description || '', syllabus: s.description || '', _isGlobal: true
            }));
            
            // Filter out global subjects that have been overridden by custom ones
            const customNames = new Set((data || []).map(s => (s.subject_name || '').toLowerCase()));
            const filteredGd = gdSubjects.filter(s => !customNames.has((s.subject_name || '').toLowerCase()));

            const combined = [...filteredGd, ...(data || [])];

            if (combined.length === 0) {
                list.innerHTML = `<div style="color:rgba(255,255,255,.3);padding:1.5rem;text-align:center">No subjects found. Add subjects in the Subjects tab first.</div>`;
                return;
            }

            list.innerHTML = combined.map(s => `
              <div class="cm-row" style="flex-direction:column;align-items:stretch;grid-template-columns:1fr" id="syl-${s.id}">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.6rem">
                  <div>
                    <div class="cm-name">${s.subject_name} ${s.subject_code ? `<span style="font-size:.7rem;color:#60a5fa">(${s.subject_code})</span>` : ''}</div>
                    ${s._isGlobal ? '<span style="font-size:.65rem;color:#34d399">Built-in subject</span>' : '<span style="font-size:.65rem;color:#a78bfa">Custom subject</span>'}
                  </div>
                  <button class="apb apb-ok" style="padding:.35rem .8rem;font-size:.75rem" onclick="window._cmEditSyllabus('${s.id}','${encodeURIComponent(s.subject_name)}')">✏️ Edit Syllabus</button>
                </div>
                <div class="cm-syllabus-area" id="syl-text-${s.id}">${s.syllabus || s.description || '<span style="color:rgba(255,255,255,.25)">No syllabus added yet</span>'}</div>
              </div>`).join('');
        } catch (e) {
            if (list) list.innerHTML = `<div class="ap-err">⚠️ ${e.message}</div>`;
        }
    };

    window._cmEditSyllabus = async function (id, nameEncoded) {
        const name = decodeURIComponent(nameEncoded);
        const currentText = document.getElementById(`syl-text-${id}`)?.innerText || '';
        const newSyllabus = prompt(`Edit syllabus for "${name}":\n(You can use plain text or HTML)`, currentText === 'No syllabus added yet' ? '' : currentText);
        if (newSyllabus === null) return; // cancelled

        try {
            const sb = await getSB();
            if (id.startsWith('gd_')) {
                // Store as a custom subject syllabus override
                const realId = id.replace('gd_', '');
                const college = document.getElementById('cm-syl-college')?.value || window._apCurrentCollege;
                const branch = document.getElementById('cm-syl-branch')?.value;
                const sem = document.getElementById('cm-syl-sem')?.value;
                const { error } = await sb.from('college_subjects').upsert([{
                    college_id: college, branch_id: branch, semester: sem,
                    subject_name: name, subject_code: '', syllabus: newSyllabus,
                    created_by: getCurrentUser()?.email || 'admin'
                }], { onConflict: 'college_id,branch_id,semester,subject_name' });
                if (error) throw error;
            } else {
                const { error } = await sb.from('college_subjects').update({ syllabus: newSyllabus }).eq('id', id);
                if (error) throw error;
            }
            const el = document.getElementById(`syl-text-${id}`);
            if (el) el.innerText = newSyllabus || 'No syllabus added yet';
            if (window.showToast) window.showToast('✅ Syllabus updated!');
        } catch (e) {
            if (window.showToast) window.showToast('❌ Failed: ' + e.message, 'error');
        }
    };

    // ── Note Titles ───────────────────────────────────────────────────────────
    async function loadCmNoteTitles(sb, college = null) {
        const list = document.getElementById('cm-notes-title-list');
        if (!list) return;

        let q = sb.from('approved_notes').select('id, title, subject, college, type').order('created_at', { ascending: false });
        if (college) q = q.eq('college', college);

        const { data, error } = await q;
        if (error) { list.innerHTML = `<div class="ap-err">⚠️ ${error.message}</div>`; return; }

        if (!data || data.length === 0) {
            list.innerHTML = `<div class="ap-empty" style="padding:2rem"><div class="ap-empty-ico">📝</div><h3>No approved notes</h3><p>Notes appear here once approved.</p></div>`;
            return;
        }

        list.innerHTML = data.map(n => `
          <div class="cm-row" id="cnt-${n.id}">
            <div>
              <div class="cm-name" id="cnt-title-${n.id}">${n.title}</div>
              <div class="cm-meta">${n.subject || ''} · ${n.college || ''} ${n.type && n.type !== 'notes' ? `· ${n.type}` : ''}</div>
            </div>
            <div class="cm-actions">
              <button class="apb apb-view" style="padding:.35rem .7rem;font-size:.75rem" onclick="window._cmRenameNote('${n.id}')">✏️ Rename</button>
              <button class="apb apb-no" style="padding:.35rem .7rem;font-size:.75rem" onclick="window._apDeleteApproved('${n.id}')">🗑</button>
            </div>
          </div>`).join('');
    }

    window._cmRenameNote = async function (id) {
        const currentTitle = document.getElementById(`cnt-title-${id}`)?.innerText || '';
        const newTitle = prompt(`Rename note:`, currentTitle);
        if (!newTitle || newTitle.trim() === currentTitle) return;

        try {
            const sb = await getSB();
            const { error } = await sb.from('approved_notes').update({ title: newTitle.trim() }).eq('id', id);
            if (error) throw error;
            const el = document.getElementById(`cnt-title-${id}`);
            if (el) el.innerText = newTitle.trim();
            if (window.showToast) window.showToast('✅ Note renamed successfully!');
        } catch (e) {
            if (window.showToast) window.showToast('❌ Rename failed: ' + e.message, 'error');
        }
    };

    // ── Referrals Tracker ───────────────────────────────────────────────────
    async function loadReferrals(sb) {
        const list = document.getElementById('ap-referrals-list');
        if (!list) return;

        const { data, error } = await sb.from('profiles')
            .select('id, name, email, referral_count, referral_points')
            .gt('referral_count', 0)
            .order('referral_count', { ascending: false });

        if (error) { list.innerHTML = `<div class="ap-err">⚠️ ${error.message}</div>`; return; }
        if (!data || data.length === 0) {
            list.innerHTML = `<div class="ap-empty"><div class="ap-empty-ico">🔗</div><h3>No Referrals Yet</h3><p>Users haven't referred anyone yet.</p></div>`;
            return;
        }

        list.innerHTML = data.map((u, i) => `
          <div class="ap-item" style="animation-delay:${i * 40}ms; display:grid; grid-template-columns: 1fr auto; gap: 1rem; align-items:center">
            <div>
              <div class="ap-title" style="margin-bottom:0.25rem">${u.name || 'Scholar'}</div>
              <div class="ap-meta">${u.email}</div>
            </div>
            <div style="text-align:right">
              <div style="font-weight:bold; color:#00d2ff; font-size:1.1rem">${u.referral_count} <span style="font-size:0.75rem; font-weight:normal; color:rgba(255,255,255,0.5)">Refs</span></div>
              <div style="color:#9d50bb; font-size:0.85rem">+${u.referral_points} XP</div>
            </div>
          </div>
        `).join('');
    }

    window._apLoadReferrals = async function() {
        const list = document.getElementById('ap-referrals-list');
        if (list) list.innerHTML = `<div class="ap-loader"><div class="ap-spin"></div><p>Refreshing…</p></div>`;
        try {
            const sb = await getSB();
            await loadReferrals(sb);
        } catch(e) {}
    };

    // ── Coders Tracker ───────────────────────────────────────────────────
    async function loadCoders(sb) {
        const list = document.getElementById('ap-coders-list');
        if (!list) return;

        const { data, error } = await sb.from('users')
            .select('id, name, email, coding_xp, coding_streak')
            .gt('coding_xp', 0)
            .order('coding_xp', { ascending: false });

        if (error) { list.innerHTML = `<div class="ap-err">⚠️ ${error.message}</div>`; return; }
        if (!data || data.length === 0) {
            list.innerHTML = `<div class="ap-empty"><div class="ap-empty-ico">💻</div><h3>No Coders Yet</h3><p>Users haven't earned any Coding XP.</p></div>`;
            return;
        }

        list.innerHTML = data.map((u, i) => `
          <div class="ap-item" style="animation-delay:${i * 40}ms; display:grid; grid-template-columns: 1fr auto; gap: 1rem; align-items:center">
            <div>
              <div class="ap-title" style="margin-bottom:0.25rem">${u.name || 'Scholar'}</div>
              <div class="ap-meta">${u.email}</div>
            </div>
            <div style="text-align:right">
              <div style="font-weight:bold; color:#fb923c; font-size:1.1rem">${u.coding_xp || 0} <span style="font-size:0.75rem; font-weight:normal; color:rgba(255,255,255,0.5)">XP</span></div>
              <div style="color:#34d399; font-size:0.85rem">🔥 ${u.coding_streak || 0} Day Streak</div>
            </div>
          </div>
        `).join('');
    }

    window._apLoadCoders = async function() {
        const list = document.getElementById('ap-coders-list');
        if (list) list.innerHTML = `<div class="ap-loader"><div class="ap-spin"></div><p>Refreshing…</p></div>`;
        try {
            const sb = await getSB();
            await loadCoders(sb);
        } catch(e) {}
    };

    // ── Academic Elite Tracker ───────────────────────────────────────────
    async function loadAcademic(sb) {
        const list = document.getElementById('ap-academic-list');
        if (!list) return;

        const { data, error } = await sb.from('users')
            .select('id, name, email, xp')
            .gt('xp', 0)
            .order('xp', { ascending: false });

        if (error) { list.innerHTML = `<div class="ap-err">⚠️ ${error.message}</div>`; return; }
        if (!data || data.length === 0) {
            list.innerHTML = `<div class="ap-empty"><div class="ap-empty-ico">🎓</div><h3>No Academic Data</h3></div>`;
            return;
        }

        list.innerHTML = data.map((u, i) => `
          <div class="ap-item" style="animation-delay:${i * 40}ms; display:grid; grid-template-columns: 1fr auto; gap: 1rem; align-items:center">
            <div>
              <div class="ap-title" style="margin-bottom:0.25rem">${u.name || 'Scholar'}</div>
              <div class="ap-meta">${u.email}</div>
            </div>
            <div style="text-align:right">
              <div style="font-weight:bold; color:#7B61FF; font-size:1.1rem">${(u.xp || 0).toLocaleString()} <span style="font-size:0.75rem; font-weight:normal; color:rgba(255,255,255,0.5)">XP</span></div>
            </div>
          </div>
        `).join('');
    }

    window._apLoadAcademic = async function() {
        const list = document.getElementById('ap-academic-list');
        if (list) list.innerHTML = `<div class="ap-loader"><div class="ap-spin"></div><p>Refreshing…</p></div>`;
        try {
            const sb = await getSB();
            await loadAcademic(sb);
        } catch(e) {}
    };

    // ── NeuroSprint Pro Tracker ──────────────────────────────────────────
    async function loadNeuroSprint(sb) {
        const list = document.getElementById('ap-neurosprint-list');
        if (!list) return;

        const { data, error } = await sb.from('users')
            .select('id, name, email, focusminutes')
            .gt('focusminutes', 0)
            .order('focusminutes', { ascending: false });

        if (error) { list.innerHTML = `<div class="ap-err">⚠️ ${error.message}</div>`; return; }
        if (!data || data.length === 0) {
            list.innerHTML = `<div class="ap-empty"><div class="ap-empty-ico">🧠</div><h3>No Focus Data</h3></div>`;
            return;
        }

        list.innerHTML = data.map((u, i) => `
          <div class="ap-item" style="animation-delay:${i * 40}ms; display:grid; grid-template-columns: 1fr auto; gap: 1rem; align-items:center">
            <div>
              <div class="ap-title" style="margin-bottom:0.25rem">${u.name || 'Scholar'}</div>
              <div class="ap-meta">${u.email}</div>
            </div>
            <div style="text-align:right">
              <div style="font-weight:bold; color:#00F2FF; font-size:1.1rem">${(u.focusminutes || 0).toLocaleString()} <span style="font-size:0.75rem; font-weight:normal; color:rgba(255,255,255,0.5)">Minutes</span></div>
            </div>
          </div>
        `).join('');
    }

    window._apLoadNeuroSprint = async function() {
        const list = document.getElementById('ap-neurosprint-list');
        if (list) list.innerHTML = `<div class="ap-loader"><div class="ap-spin"></div><p>Refreshing…</p></div>`;
        try {
            const sb = await getSB();
            await loadNeuroSprint(sb);
        } catch(e) {}
    };

    // ── Admin button visibility ───────────────────────────────────────────────
    async function syncAdminBtn() {
        const btn = document.getElementById('admin-panel-btn');
        if (!btn) return;
        const u = getCurrentUser();
        if (isSuperAdmin(u)) { btn.style.display = 'flex'; return; }

        // Check co-admin table
        try {
            const sb = await getSB();
            const { data } = await sb.from('co_admins').select('email').eq('email', u?.email?.toLowerCase()).single();
            btn.style.display = data ? 'flex' : 'none';
            if (data && window.currentUser) {
                window.currentUser.role = 'coadmin';
            }
        } catch(e) {
            btn.style.display = 'none';
        }
    }

    syncAdminBtn();
    window.addEventListener('auth-ready', syncAdminBtn);
    setTimeout(syncAdminBtn, 2000);

    // ── Expose globally ───────────────────────────────────────────────────────
    window.initAdminPanel = initAdminPanel;
    console.log('[AdminPanel] ✅ v3 Registered with Co-Admin Support');
    // ── Timetable Manager ──────────────────────────────────────────────────
    window._ttLoadExams = async function() {
        const list = document.getElementById('tt-list');
        if(!list) return;
        list.innerHTML = `<div class="ap-loader"><div class="ap-spin"></div><p>Loading timetable…</p></div>`;
        try {
            const sb = await getSB();
            let q = sb.from('exam_timetable').select('*').order('exam_date', { ascending: true });
            if (!window._apIsSuperAdmin) q = q.eq('college', window._apCurrentCollege);
            const { data, error } = await q;
            if (error) throw error;
            if (!data || data.length === 0) {
                list.innerHTML = `<div class="ap-empty"><h3>No exams scheduled</h3></div>`;
                return;
            }
            list.innerHTML = data.map(ex => `
                <div class="cm-row" id="tt-ex-${ex.id}">
                    <div>
                        <div class="cm-name">${ex.subject}</div>
                        <div class="ap-tags" style="margin-top: 5px;">
                            <span class="ap-tag college">${ex.college}</span>
                            <span class="ap-tag branch">${ex.branch}</span>
                            <span class="ap-tag sem">${ex.semester}</span>
                        </div>
                        <div class="cm-meta" style="color: #34d399; font-weight: bold; font-size: 0.85rem; margin-top: 4px;">${new Date(ex.exam_date).toLocaleString('en-US', {dateStyle: 'medium', timeStyle: 'short'})}</div>
                    </div>
                    <div class="cm-actions">
                        <button class="apb apb-no" onclick="window._ttDeleteExam('${ex.id}')">Delete</button>
                    </div>
                </div>
            `).join('');
        } catch(e) {
            list.innerHTML = `<div class="ap-err">⚠️ ${e.message}</div>`;
        }
    };

    window._ttUpdateSubjects = function() {
        const branch = document.getElementById('tt-branch')?.value;
        const sem = document.getElementById('tt-sem')?.value;
        const sel = document.getElementById('tt-subject-select');
        if(!sel) return;
        
        let opts = [`<option value="">Select Subject</option>`];
        if (branch && sem && window.GlobalData && window.GlobalData.subjects) {
            const key = `${branch}-${sem}`;
            if (window.GlobalData.subjects[key]) {
                const addOpts = window.GlobalData.subjects[key].map(s => {
                    const code = s.code ? ` (${s.code})` : '';
                    return `<option value="${s.name}${code}">${s.name}${code}</option>`;
                });
                opts = opts.concat(addOpts);
            }
        }
        sel.innerHTML = opts.join('');
    };

    window._ttAddExam = async function() {
        const college = document.getElementById('tt-college').value;
        const branch = document.getElementById('tt-branch').value;
        const semester = document.getElementById('tt-sem').value;
        const selSubj = document.getElementById('tt-subject-select').value.trim();
        const manSubj = document.getElementById('tt-subject-manual').value.trim();
        const subject = manSubj || selSubj;
        const dateVal = document.getElementById('tt-date').value;
        
        if (!college || !branch || !semester || !subject || !dateVal) return alert('Fill all required fields');
        
        try {
            const sb = await getSB();
            const { error } = await sb.from('exam_timetable').insert([{
                college, branch, semester, subject, exam_date: new Date(dateVal).toISOString()
            }]);
            if (error) throw error;
            document.getElementById('tt-subject-select').value = '';
            document.getElementById('tt-subject-manual').value = '';
            document.getElementById('tt-date').value = '';
            window._ttLoadExams();
        } catch(e) {
            alert('Error: ' + e.message);
        }
    };
    
    window._ttDeleteExam = async function(id) {
        if(!confirm('Delete this exam?')) return;
        try {
            const sb = await getSB();
            const { error } = await sb.from('exam_timetable').delete().eq('id', id);
            if (error) throw error;
            document.getElementById('tt-ex-'+id).remove();
        } catch(e) {
            alert('Error: ' + e.message);
        }
    };

})();
