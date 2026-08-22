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


        /* Real-Time Analytics Styles */
        .ap-real-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem; margin-bottom: 2rem; }
        .ap-real-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 14px; padding: 1.2rem; position: relative; }
        .ap-real-card-val { font-size: 1.8rem; font-weight: 800; color: #fff; margin-top: 0.4rem; }
        .ap-real-card-lbl { font-size: 0.75rem; color: rgba(255,255,255,0.45); text-transform: uppercase; letter-spacing: 0.05em; }
        .ap-real-flex-sections { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem; }
        @media(max-width: 900px) { .ap-real-flex-sections { grid-template-columns: 1fr; } }
        .ap-progress-item { margin-bottom: 1rem; }
        .ap-progress-lbl { display: flex; justify-content: space-between; font-size: 0.8rem; color: rgba(255,255,255,0.7); margin-bottom: 0.35rem; }
        .ap-progress-lbl span:nth-child(2) { color: #a78bfa; font-weight: bold; }
        .ap-progress-track { background: rgba(255,255,255,0.05); height: 8px; border-radius: 4px; overflow: hidden; }
        .ap-progress-fill { background: linear-gradient(90deg, #7c3aed, #a78bfa); height: 100%; border-radius: 4px; width: 0%; transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1); }
        .ap-progress-fill.c2 { background: linear-gradient(90deg, #059669, #34d399); }
        .ap-progress-fill.c3 { background: linear-gradient(90deg, #2563eb, #60a5fa); }
        .ap-progress-fill.c4 { background: linear-gradient(90deg, #ea580c, #fb923c); }
        .ap-table-wrap { overflow-x: auto; background: rgba(0, 0, 0, 0.15); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; margin-bottom: 1.5rem; }
        .ap-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem; }
        .ap-table th { padding: 0.9rem 1.2rem; background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.5); font-weight: 700; border-bottom: 1px solid rgba(255,255,255,0.08); text-transform: uppercase; font-size: 0.72rem; letter-spacing: 0.05em; }
        .ap-table td { padding: 0.9rem 1.2rem; color: rgba(255,255,255,0.85); border-bottom: 1px solid rgba(255,255,255,0.04); }
        .ap-table tr:last-child td { border-bottom: none; }
        .ap-table tr:hover td { background: rgba(255,255,255,0.015); }

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

    async function getAllSBs() {
        if (window._apAllSBs) return window._apAllSBs;
        
        let clients = [await getSB()]; // default primary
        
        try {
           // Fetch dynamic storage configuration (federated)
        const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
            ? '' 
            : 'https://skil-matrix-server.onrender.com';
        const res = await fetch(`${API_BASE}/api/storage-config`);
            if (res.ok) {
                const configs = await res.json();
                if (configs.databases && configs.databases.length > 0) {
                    // Only load createClient if not already loaded, but getSB does it.
                    // Wait for import since we might need it.
                    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
                    clients = configs.databases.map(dbConfig => 
                        createClient(dbConfig.url, dbConfig.key)
                    );
                }
            }
        } catch(e) {
            console.error("Failed to fetch storage configs for admin panel:", e);
        }
        
        window._apAllSBs = clients;
        return clients;
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
              </button>
              <button class="ap-page-tab" id="aptab-pricing" onclick="window._apPage('pricing',this)">
                <span>💰</span> Pricing & Coupons
              </button>
              <button class="ap-page-tab" id="aptab-subscriptions" onclick="window._apPage('subscriptions',this)">
                <span>💎</span> Subscriptions
              </button>` : ''}
              <button class="ap-page-tab" id="aptab-analytics" onclick="window._apPage('analytics',this)">
                <span>📊</span> Analytics
              </button>
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
                <div class="ap-box-head" style="flex-wrap:wrap; gap:1rem;">
                  <div class="ap-box-title">
                    <span style="width:8px;height:8px;border-radius:50%;background:#34d399;box-shadow:0 0 10px #34d39988;display:inline-block"></span>
                    Approved Notes${!superAdmin ? ` — ${assignedCollegeName}` : ''}
                  </div>
                  <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
                    ${superAdmin ? `
                    <select id="ap-app-filter-college" style="padding:0.35rem 1.8rem 0.35rem 0.75rem; border-radius:6px; border:1px solid rgba(255,255,255,0.12); background:rgba(255,255,255,0.03) url(&quot;data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='50' fill='%23ffffff'><polygon points='0,0 100,0 50,50'/></svg>&quot;) no-repeat; background-position: right 0.75rem center; background-size: 8px 6px; appearance:none; -webkit-appearance:none; -moz-appearance:none; color:#fff; font-size:0.8rem; cursor:pointer; outline:none; transition: border-color 0.2s;" onchange="window._apFilterApprovedNotes()">
                      <option value="" style="background:#1a1a1a;color:#fff;">All Colleges</option>
                    </select>
                    ` : ''}
                    <select id="ap-app-filter-branch" style="padding:0.35rem 1.8rem 0.35rem 0.75rem; border-radius:6px; border:1px solid rgba(255,255,255,0.12); background:rgba(255,255,255,0.03) url(&quot;data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='50' fill='%23ffffff'><polygon points='0,0 100,0 50,50'/></svg>&quot;) no-repeat; background-position: right 0.75rem center; background-size: 8px 6px; appearance:none; -webkit-appearance:none; -moz-appearance:none; color:#fff; font-size:0.8rem; cursor:pointer; outline:none; transition: border-color 0.2s;" onchange="window._apFilterApprovedNotes()">
                      <option value="" style="background:#1a1a1a;color:#fff;">All Branches</option>
                    </select>
                    <select id="ap-app-filter-sem" style="padding:0.35rem 1.8rem 0.35rem 0.75rem; border-radius:6px; border:1px solid rgba(255,255,255,0.12); background:rgba(255,255,255,0.03) url(&quot;data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='50' fill='%23ffffff'><polygon points='0,0 100,0 50,50'/></svg>&quot;) no-repeat; background-position: right 0.75rem center; background-size: 8px 6px; appearance:none; -webkit-appearance:none; -moz-appearance:none; color:#fff; font-size:0.8rem; cursor:pointer; outline:none; transition: border-color 0.2s;" onchange="window._apFilterApprovedNotes()">
                      <option value="" style="background:#1a1a1a;color:#fff;">All Semesters</option>
                    </select>
                    <input type="text" id="ap-app-filter-subject" placeholder="Filter by Subject..." style="padding:0.35rem 0.75rem; border-radius:6px; border:1px solid rgba(255,255,255,0.12); background:rgba(255,255,255,0.03); color:#fff; font-size:0.8rem; min-width:160px; outline:none; transition: border-color 0.2s;" onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='rgba(255,255,255,0.12)'" onkeyup="window._apFilterApprovedNotes()" />
                  </div>
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
                  ${superAdmin ? `<button class="cm-tab" onclick="window._cmTab('colleges',this)">🏫 Colleges</button>` : ''}
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
                
                ${superAdmin ? `
                <!-- Colleges Panel -->
                <div class="cm-panel" id="cm-colleges">
                  <div class="cm-add-form">
                    <div style="font-size:.8rem;font-weight:700;color:#a78bfa;margin-bottom:.25rem">➕ Add New College</div>
                    <div class="cm-row-grid">
                      <input type="text" id="cm-new-college-id" placeholder="College ID (e.g. mit-pune, no spaces)" />
                      <input type="text" id="cm-new-college-name" placeholder="College Name (e.g. MIT Pune)" />
                    </div>
                    
                    <div id="cm-logo-dropzone" style="margin-top: .6rem; border: 2px dashed rgba(255,255,255,.2); border-radius: 9px; padding: 1.5rem; text-align: center; cursor: pointer; background: rgba(255,255,255,.02); transition: all 0.2s;" ondragover="event.preventDefault(); this.style.borderColor='#a78bfa'; this.style.background='rgba(167,139,250,.05)';" ondragleave="this.style.borderColor='rgba(255,255,255,.2)'; this.style.background='rgba(255,255,255,.02)';" ondrop="window._cmHandleLogoDrop(event)" onclick="if(event.target.id !== 'cm-new-college-logo-file') document.getElementById('cm-new-college-logo-file')?.click()">
                        <div style="font-size: 2rem; margin-bottom: 0.5rem; color: rgba(255,255,255,.5);" id="cm-logo-preview">🖼️</div>
                        <div style="font-size: 0.85rem; color: rgba(255,255,255,.7);">Drag & drop logo image here or click to browse</div>
                        <input type="file" id="cm-new-college-logo-file" accept="image/*" style="display: none;" onchange="window._cmHandleLogoFile(this.files[0])" />
                    </div>
                    <div style="text-align: center; font-size: 0.75rem; color: rgba(255,255,255,.4); margin: 0.5rem 0;">OR</div>
                    <input type="text" id="cm-new-college-logo-url" placeholder="Paste College Logo URL or Emoji" style="background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.12); color:#fff; border-radius:9px; padding:.5rem .9rem; font-size:.83rem; outline:none; width:100%; box-sizing:border-box;" />
                    
                    <button id="cm-add-college-btn" class="btn-action" style="margin-top:.75rem;width:100%" onclick="window._cmAddCollege()">
                      <i class="fas fa-plus"></i> Add College
                    </button>
                  </div>
                  <div style="font-size:.82rem;color:rgba(255,255,255,.4);margin-top:1rem;margin-bottom:.5rem">Existing Colleges</div>
                  <div id="cm-colleges-list" style="display:flex;flex-direction:column;gap:.5rem;max-height:400px;overflow-y:auto;padding-right:.25rem">
                    <div class="ap-loader"><div class="ap-spin"></div><p>Loading colleges…</p></div>
                  </div>
                </div>
                ` : ''}
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
            </div>

            <!-- ── PAGE: PRICING & COUPONS (superadmin only) ── -->
            <div class="ap-page" id="appage-pricing">
              <div class="ap-box">
                <div class="ap-box-head">
                  <div class="ap-box-title">
                    <span style="width:8px;height:8px;border-radius:50%;background:#eab308;box-shadow:0 0 10px #eab30888;display:inline-block"></span>
                    Dynamic Pricing Config
                  </div>
                  <button class="ap-ref-btn" onclick="window._apSavePricing()">💾 Save Pricing</button>
                </div>
                <div class="ap-list" id="ap-pricing-list">
                  <div class="ap-loader"><div class="ap-spin"></div><p>Loading pricing…</p></div>
                </div>
              </div>
              <div class="ap-box">
                <div class="ap-box-head">
                  <div class="ap-box-title">
                    <span style="width:8px;height:8px;border-radius:50%;background:#10b981;box-shadow:0 0 10px #10b98188;display:inline-block"></span>
                    Custom Coupons
                  </div>
                </div>
                <div class="ca-form">
                  <input type="text" id="cpn-code-input" placeholder="Coupon Code (e.g. SKILL50)" style="text-transform: uppercase;" />
                  <input type="number" id="cpn-discount-input" placeholder="Discount % (e.g. 50)" min="1" max="100" />
                  <input type="number" id="cpn-maxuses-input" placeholder="Max Uses (optional)" min="1" />
                  <button class="apb apb-ok" onclick="window._apAddCoupon()">+ Add Coupon</button>
                </div>
                <div class="ap-list" id="ap-coupons-list">
                  <div class="ap-loader"><div class="ap-spin"></div><p>Loading coupons…</p></div>
                </div>
              </div>
            </div>
            
            <!-- ── PAGE: SUBSCRIPTIONS & PAYMENTS (superadmin only) ── -->
            <div class="ap-page" id="appage-subscriptions">
              <div class="ap-box">
                <div class="ap-box-head">
                  <div class="ap-box-title">
                    <span style="width:8px;height:8px;border-radius:50%;background:#8b5cf6;box-shadow:0 0 10px #8b5cf688;display:inline-block"></span>
                    User Subscriptions & Payments
                  </div>
                  <div style="display:flex;gap:0.5rem">
                    <input type="text" id="ap-sub-search" placeholder="Search by Name, Email or UID..." style="padding:0.35rem 0.5rem;border-radius:6px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.05);color:#fff;font-size:0.85rem;min-width:240px;" onkeyup="window._apSearchSubs(this.value)" />
                    <button class="ap-ref-btn" onclick="window._apLoadSubscriptions()">↻ Refresh</button>
                  </div>
                </div>
                <div class="ap-list" id="ap-subs-list">
                  <div class="ap-loader"><div class="ap-spin"></div><p>Loading subscriptions…</p></div>
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

            <!-- ── PAGE: ANALYTICS ── -->
            <div class="ap-page" id="appage-analytics">
              ${superAdmin ? `
              <div class="ap-box">
                <div class="ap-box-head">
                  <div class="ap-box-title">
                    <span style="width:8px;height:8px;border-radius:50%;background:#00e5ff;box-shadow:0 0 10px #00e5ff88;display:inline-block"></span>
                    Dashboard Stats Configuration (Overrides)
                  </div>
                  <span style="font-size:.75rem;color:rgba(255,255,255,.35);">Override the 4 stats boxes on the main dashboard</span>
                </div>
                
                <div class="cm-add-form" style="border-radius: 0; border: none; padding: 2rem;">
                  <p style="margin-bottom: 1.5rem; color: rgba(255,255,255,0.6); font-size: 0.9rem;">
                    Enter the display value you want for each stat (e.g. <code>5.5k+</code>, <code>200</code>). Leave blank to use the automatically calculated default.
                  </p>
                  
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
                    <div>
                      <label style="display: block; font-size: 0.8rem; font-weight: bold; color: #00ff94; margin-bottom: 0.5rem; text-transform: uppercase;">🎓 Total Students</label>
                      <input type="text" id="admin-stat-students" placeholder="e.g. 561+" style="width: 100%; padding: 0.8rem; border-radius: 8px; background: rgba(0,0,0,0.2); border: 1px solid rgba(0,255,148,0.3); color: white;" />
                    </div>
                    <div>
                      <label style="display: block; font-size: 0.8rem; font-weight: bold; color: #00e5ff; margin-bottom: 0.5rem; text-transform: uppercase;">👁️ Total Views</label>
                      <input type="text" id="admin-stat-views" placeholder="e.g. 10k+" style="width: 100%; padding: 0.8rem; border-radius: 8px; background: rgba(0,0,0,0.2); border: 1px solid rgba(0,229,255,0.3); color: white;" />
                    </div>
                  </div>
                  
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem;">
                    <div>
                      <label style="display: block; font-size: 0.8rem; font-weight: bold; color: #7b61ff; margin-bottom: 0.5rem; text-transform: uppercase;">📥 Total Downloads</label>
                      <input type="text" id="admin-stat-downloads" placeholder="e.g. 5.1k+" style="width: 100%; padding: 0.8rem; border-radius: 8px; background: rgba(0,0,0,0.2); border: 1px solid rgba(123,97,255,0.3); color: white;" />
                    </div>
                    <div>
                      <label style="display: block; font-size: 0.8rem; font-weight: bold; color: #f1c40f; margin-bottom: 0.5rem; text-transform: uppercase;">📚 Total Resources</label>
                      <input type="text" id="admin-stat-resources" placeholder="e.g. 300+" style="width: 100%; padding: 0.8rem; border-radius: 8px; background: rgba(0,0,0,0.2); border: 1px solid rgba(241,196,15,0.3); color: white;" />
                    </div>
                  </div>
                  
                  <button class="apb apb-ok" onclick="window._apSaveAnalyticsConfig()" style="width: 100%; padding: 1rem; font-size: 1rem; font-weight: bold;">💾 Save Configuration</button>
                </div>
              </div>
              ` : ''}

              <!-- Real-time Database Analytics -->
              <div class="ap-box" style="margin-top: 1.5rem;">
                <div class="ap-box-head" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
                  <div class="ap-box-title">
                    <span style="width:8px;height:8px;border-radius:50%;background:#10b981;box-shadow:0 0 10px #10b98188;display:inline-block"></span>
                    📊 Real-Time Database Analytics
                  </div>
                  <button class="ap-ref-btn" onclick="window._apLoadRealAnalytics()" id="ap-real-refresh-btn">↻ Refresh Metrics</button>
                </div>
                <div id="ap-real-analytics-container" style="padding: 2rem; background: rgba(255,255,255,0.01);">
                  <div class="ap-loader"><div class="ap-spin"></div><p>Fetching database metrics...</p></div>
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
            
            if (name === 'analytics') {
                if (typeof window._apPopulateAnalytics === 'function') {
                    window._apPopulateAnalytics();
                }
                if (typeof window._apLoadRealAnalytics === 'function') {
                    window._apLoadRealAnalytics();
                }
            }
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
                window._ttLoadExams(),
                superAdmin ? window._apLoadPricing() : Promise.resolve()
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
    async function loadStats(ignoredSb, college = null) {
        const clients = await getAllSBs();
        
        let pending = 0;
        let approved = 0;
        
        for (const client of clients) {
            let pQuery = client.from('pending_notes').select('*', { count: 'exact', head: true });
            let aQuery = client.from('approved_notes').select('*', { count: 'exact', head: true });
            if (college) { pQuery = pQuery.eq('college', college); aQuery = aQuery.eq('college', college); }
            
            const [{ count: pCount }, { count: aCount }] = await Promise.all([pQuery, aQuery]);
            if (pCount) pending += pCount;
            if (aCount) approved += aCount;
        }

        const primarySb = await getSB();
        const u = getCurrentUser();
        const superAdmin = isSuperAdmin(u);
        let extraCount;

        if (superAdmin) {
            const { data: caList } = await primarySb.from('co_admins').select('email');
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
    async function loadList(ignoredSb, college = null) {
        const list = document.getElementById('ap-list');
        if (!list) return;

        try {
            const clients = await getAllSBs();
            const promises = clients.map((client, idx) => {
                let q = client.from('pending_notes').select('*').order('created_at', { ascending: false });
                if (college) q = q.eq('college', college);
                return q.then(res => ({ ...res, dbIndex: idx })); // Keep track of which db it came from
            });

            const results = await Promise.all(promises);
            let data = [];
            let hasError = false;
            let errMsg = '';
            results.forEach(res => {
                if (res.error) {
                    hasError = true;
                    errMsg = res.error.message;
                } else if (res.data) {
                    res.data.forEach(item => { item._dbIndex = res.dbIndex; });
                    data = data.concat(res.data);
                }
            });

            if (hasError && data.length === 0) throw new Error(errMsg);

            // Sort combined results
            data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

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
              <div class="ap-item" id="ap-n-${n.id}" data-dbindex="${n._dbIndex}" style="animation-delay:${i * 40}ms">
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
                  <button class="apb apb-ok" onclick="window._apApprove('${n.id}', ${n._dbIndex})">✓ Approve</button>
                  <button class="apb apb-no" onclick="window._apReject('${n.id}', ${n._dbIndex})">✕ Reject</button>
                </div>
              </div>`).join('');
        } catch(e) {
            console.error("loadList err", e);
            list.innerHTML = `<div class="ap-err">⚠️ ${e.message}</div>`;
        }
    }

    // ── Approved List ────────────────────────────────────────────────────────
    let loadedApprovedNotes = [];

    window._apFilterApprovedNotes = function() {
        const collegeVal = document.getElementById('ap-app-filter-college')?.value || '';
        const branchVal = document.getElementById('ap-app-filter-branch')?.value || '';
        const semVal = document.getElementById('ap-app-filter-sem')?.value || '';
        const subjectVal = document.getElementById('ap-app-filter-subject')?.value?.toLowerCase() || '';

        const filtered = loadedApprovedNotes.filter(n => {
            if (collegeVal && n.college !== collegeVal) return false;
            if (branchVal && n.branch !== branchVal) return false;
            if (semVal && !n.semester.toLowerCase().includes(semVal.toLowerCase())) return false;
            if (subjectVal && (!n.subject || !n.subject.toLowerCase().includes(subjectVal))) return false;
            return true;
        });

        renderApprovedListItems(filtered);
    };

    function renderApprovedListItems(data) {
        const list = document.getElementById('ap-approved-list');
        if (!list) return;

        if (!data || data.length === 0) {
            list.innerHTML = `
              <div class="ap-empty" style="padding:2rem">
                <div class="ap-empty-ico">📭</div>
                <h3>No matching approved notes</h3>
                <p>Try modifying your filters.</p>
              </div>`;
            return;
        }

        list.innerHTML = data.map((n, i) => {
            const colObj = window.GlobalData?.colleges?.find(c => c.id === n.college) || { name: n.college ? n.college.toUpperCase() : '' };
            const collegeLabel = colObj.name;
            const semLabel = n.semester ? (n.semester.toLowerCase().includes('sem') ? n.semester : `Sem ${n.semester}`) : '';

            return `
              <div class="ap-item" id="ap-a-${n.id}" data-dbindex="${n._dbIndex}" style="animation-delay:${i * 40}ms">
                <div>
                  <div class="ap-tags">
                    ${n.subject ? `<span class="ap-tag subject">${n.subject}</span>` : ''}
                    ${collegeLabel ? `<span class="ap-tag college">${collegeLabel}</span>` : ''}
                    ${n.branch  ? `<span class="ap-tag branch">${n.branch.toUpperCase()}</span>`  : ''}
                    ${semLabel ? `<span class="ap-tag sem">${semLabel}</span>` : ''}
                    ${n.type && n.type !== 'notes' ? `<span class="ap-tag" style="background:rgba(251,191,36,.1);color:#fbbf24;border:1px solid rgba(251,191,36,.2)">${n.type.toUpperCase()}</span>` : ''}
                    <span class="ap-tag" style="background:rgba(52,211,153,.1);color:#34d399;border:1px solid rgba(52,211,153,.2)">✓ LIVE</span>
                  </div>
                  <div class="ap-title" title="${n.title || ''}">${n.title || 'Untitled Note'}</div>
                  <div class="ap-meta">By <span>${n.uploader_name || (n.uploader_email ? n.uploader_email.split('@')[0] : 'Unknown')}</span></div>
                  ${n.created_at ? `<div class="ap-time">${fmtDate(n.created_at)}</div>` : ''}
                </div>
                <div style="margin-top: 10px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                  <div>
                    <span class="ap-tag" style="background: ${n.allow_download !== false ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 107, 107, 0.1)'}; color: ${n.allow_download !== false ? '#00ff88' : '#ff6b6b'}; border: 1px solid ${n.allow_download !== false ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 107, 107, 0.2)'};">
                      ${n.allow_download !== false ? '✅ Downloadable' : '❌ View Only'}
                    </span>
                  </div>
                  <div class="ap-actions" style="margin-top: 0;">
                    ${n.file_url ? `<a href="${window.getViewerUrl(n.file_url, n.title, n.id)}" target="_blank" class="apb apb-view">👁 View</a>` : ''}
                    <button class="apb" style="background: rgba(255,255,255,0.05); color: var(--text-main);" onclick="window._apToggleDownload('${n.id}', ${n.allow_download !== false}, ${n._dbIndex})">
                      ${n.allow_download !== false ? 'Disable DL' : 'Enable DL'}
                    </button>
                    <button class="apb apb-no" onclick="window._apDeleteApproved('${n.id}', ${n._dbIndex})">🗑 Delete</button>
                  </div>
                </div>
              </div>`;
        }).join('');
    }

    function populateFilterDropdowns(data) {
        const collegeSelect = document.getElementById('ap-app-filter-college');
        const branchSelect = document.getElementById('ap-app-filter-branch');
        const semSelect = document.getElementById('ap-app-filter-sem');

        const prevCollege = collegeSelect?.value || '';
        const prevBranch = branchSelect?.value || '';
        const prevSem = semSelect?.value || '';

        if (collegeSelect) {
            const uniqueColleges = [...new Set(data.map(n => n.college).filter(Boolean))];
            let html = '<option value="" style="background:#1a1a1a;color:#fff;">All Colleges</option>';
            uniqueColleges.forEach(colId => {
                const colObj = window.GlobalData?.colleges?.find(c => c.id === colId) || { name: colId.toUpperCase() };
                html += `<option value="${colId}" style="background:#1a1a1a;color:#fff;">${colObj.name}</option>`;
            });
            collegeSelect.innerHTML = html;
            collegeSelect.value = prevCollege;
        }

        if (branchSelect) {
            const uniqueBranches = [...new Set(data.map(n => n.branch).filter(Boolean))];
            let html = '<option value="" style="background:#1a1a1a;color:#fff;">All Branches</option>';
            uniqueBranches.forEach(branch => {
                html += `<option value="${branch}" style="background:#1a1a1a;color:#fff;">${branch.toUpperCase()}</option>`;
            });
            branchSelect.innerHTML = html;
            branchSelect.value = prevBranch;
        }

        if (semSelect) {
            const uniqueSemesters = [...new Set(data.map(n => n.semester).filter(Boolean))];
            uniqueSemesters.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
            
            let html = '<option value="" style="background:#1a1a1a;color:#fff;">All Semesters</option>';
            uniqueSemesters.forEach(sem => {
                const semLabel = sem.toLowerCase().includes('sem') ? sem : `Sem ${sem}`;
                html += `<option value="${sem}" style="background:#1a1a1a;color:#fff;">${semLabel}</option>`;
            });
            semSelect.innerHTML = html;
            semSelect.value = prevSem;
        }
    }

    async function loadApproved(ignoredSb, college = null) {
        const list = document.getElementById('ap-approved-list');
        if (!list) return;

        try {
            const clients = await getAllSBs();
            const promises = clients.map((client, idx) => {
                let q = client.from('approved_notes').select('*').order('created_at', { ascending: false });
                if (college) q = q.eq('college', college);
                return q.then(res => ({ ...res, dbIndex: idx }));
            });

            const results = await Promise.all(promises);
            let data = [];
            let hasError = false;
            let errMsg = '';
            results.forEach(res => {
                if (res.error) {
                    hasError = true;
                    errMsg = res.error.message;
                } else if (res.data) {
                    res.data.forEach(item => { item._dbIndex = res.dbIndex; });
                    data = data.concat(res.data);
                }
            });

            if (hasError && data.length === 0) throw new Error(errMsg);

            data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            loadedApprovedNotes = data;
            populateFilterDropdowns(data);
            renderApprovedListItems(data);
        } catch(e) {
            console.error("loadApproved err", e);
            list.innerHTML = `<div class="ap-err">⚠️ ${e.message}</div>`;
        }
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
    window._apApprove = async function (id, dbIndex = 0) {
        const el = document.getElementById(`ap-n-${id}`);
        const btns = el ? el.querySelectorAll('.apb') : [];
        btns.forEach(b => { b.disabled = true; });

        try {
            const clients = await getAllSBs();
            const sb = clients[dbIndex] || clients[0];
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
            await Promise.all([loadStats(null, col), loadApproved(null, col)]);

        } catch (e) {
            console.error('[AP] Approve error:', e);
            btns.forEach(b => { b.disabled = false; });
            if (window.showToast) window.showToast('❌ Approve failed: ' + e.message, 'error');
        }
    };

    // ── Actions: Reject ──────────────────────────────────────────────────────
    window._apReject = async function (id, dbIndex = 0) {
        if (!confirm('Reject and permanently delete this submission?')) return;
        const el = document.getElementById(`ap-n-${id}`);
        const btns = el ? el.querySelectorAll('.apb') : [];
        btns.forEach(b => { b.disabled = true; });

        try {
            const clients = await getAllSBs();
            const sb = clients[dbIndex] || clients[0];
            const { error } = await sb.from('pending_notes').delete().eq('id', id);
            if (error) throw error;

            if (el) { el.classList.add('removing'); setTimeout(() => el.remove(), 300); }
            if (window.showToast) window.showToast('🗑 Submission rejected.');

            const u = getCurrentUser();
            const col = isSuperAdmin(u) ? null : (u.assignedCollege || null);
            await loadStats(null, col);

        } catch (e) {
            console.error('[AP] Reject error:', e);
            btns.forEach(b => { b.disabled = false; });
            if (window.showToast) window.showToast('❌ Reject failed: ' + e.message, 'error');
        }
    };

    // ── Actions: Delete Approved ─────────────────────────────────────────────
    window._apDeleteApproved = async function (id, dbIndex = 0) {
        if (!confirm('Permanently delete this approved note? It will be removed for all users.')) return;
        const el = document.getElementById(`ap-a-${id}`);
        const btns = el ? el.querySelectorAll('.apb') : [];
        btns.forEach(b => { b.disabled = true; });

        try {
            const clients = await getAllSBs();
            const sb = clients[dbIndex] || clients[0];
            const { error } = await sb.from('approved_notes').delete().eq('id', id);
            if (error) throw error;

            if (el) { el.classList.add('removing'); setTimeout(() => el.remove(), 300); }
            if (window.showToast) window.showToast('🗑 Note removed from public library.');

            const u = getCurrentUser();
            const col = isSuperAdmin(u) ? null : (u.assignedCollege || null);
            await loadStats(null, col);

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

    window._apToggleDownload = async function (id, currentStatus, dbIndex = 0) {
        if (!confirm(`Are you sure you want to ${currentStatus ? 'disable' : 'enable'} downloading for this note?`)) return;
        const clients = await getAllSBs();
        const sb = clients[dbIndex] || clients[0];
        const { error } = await sb.from('approved_notes').update({ allow_download: !currentStatus }).eq('id', id);
        if (error) {
            if (window.showToast) window.showToast('❌ Update failed: ' + error.message, 'error');
        } else {
            if (window.showToast) window.showToast('✅ Download status updated!');
            const u = getCurrentUser();
            const col = isSuperAdmin(u) ? null : (u.assignedCollege || null);
            loadApproved(null, col);
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
        
        if (panel === 'colleges' && window._cmLoadColleges) {
            window._cmLoadColleges();
        }
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

        list.innerHTML = data.map(s => {
            const colObj = window.GlobalData?.colleges?.find(c => c.id === s.college_id) || { name: s.college_id.toUpperCase() };
            return `
              <div class="cm-row" id="cms-${s.id}">
                <div>
                  <div class="cm-name">${s.subject_name} ${s.subject_code ? `<span style="font-size:.72rem;color:#60a5fa;margin-left:.4rem">${s.subject_code}</span>` : ''}</div>
                  <div class="cm-meta">${colObj.name} · ${s.branch_id || 'All Branches'} · ${s.semester || 'All Sems'}</div>
                </div>
                <div class="cm-actions">
                  <button class="apb apb-no" style="padding:.35rem .7rem;font-size:.75rem" onclick="window._cmDeleteSubject('${s.id}')">🗑</button>
                </div>
              </div>`;
        }).join('');
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
            list.innerHTML = data.map(s => {
                const colObj = window.GlobalData?.colleges?.find(c => c.id === s.college_id) || { name: s.college_id.toUpperCase() };
                return `
                  <div class="cm-row" id="cms-${s.id}">
                    <div>
                      <div class="cm-name">${s.subject_name} ${s.subject_code ? `<span style="font-size:.72rem;color:#60a5fa;margin-left:.4rem">${s.subject_code}</span>` : ''}</div>
                      <div class="cm-meta">${colObj.name} · ${s.branch_id || '—'} · ${s.semester || '—'}</div>
                      ${s.description ? `<div class="cm-meta" style="margin-top:.2rem">${s.description}</div>` : ''}
                    </div>
                    <div class="cm-actions">
                      <button class="apb apb-no" style="padding:.35rem .7rem;font-size:.75rem" onclick="window._cmDeleteSubject('${s.id}')">🗑 Delete</button>
                    </div>
                  </div>`;
            }).join('');
        } catch (e) {
            if (list) list.innerHTML = `<div class="ap-err">⚠️ ${e.message}</div>`;
        }
    };

    // ── Colleges (Super Admin Only) ───────────────────────────────────────────
    window._cmLoadColleges = function() {
        const list = document.getElementById('cm-colleges-list');
        if (!list) return;
        
        const colleges = window.GlobalData?.colleges || [];
        if (colleges.length === 0) {
            list.innerHTML = `<div style="color:rgba(255,255,255,.4);padding:1.5rem;text-align:center">No colleges found.</div>`;
            return;
        }
        
        // One-time cleanup of unwanted colleges
        if (window.firebaseServices && !localStorage.getItem('colleges_cleaned_v2')) {
            const allowed = ['medicaps', 'ips', 'lnct', 'cdgi'];
            const { db, doc, deleteDoc } = window.firebaseServices;
            let deletedAny = false;
            colleges.forEach(c => {
                if (!allowed.includes(c.id)) {
                    deleteDoc(doc(db, 'colleges', c.id)).catch(console.error);
                    deletedAny = true;
                }
            });
            if (deletedAny) {
                console.log('Cleaned up extra colleges from DB.');
                // Remove them from local array so UI updates immediately
                for (let i = colleges.length - 1; i >= 0; i--) {
                    if (!allowed.includes(colleges[i].id)) colleges.splice(i, 1);
                }
            }
            localStorage.setItem('colleges_cleaned_v2', 'true');
        }

        list.innerHTML = colleges.map(c => {
            const logoHtml = c.logo 
                ? (c.logo.startsWith('http') || c.logo.startsWith('assets') || c.logo.startsWith('../') || c.logo.startsWith('data:'))
                    ? `<img src="${c.logo}" style="width: 32px; height: 32px; object-fit: contain; border-radius: 4px; margin-right: 12px; background: white; padding: 2px;" />`
                    : `<span style="font-size: 1.5rem; margin-right: 12px;">${c.logo}</span>`
                : `<span style="font-size: 1.5rem; margin-right: 12px;">🏛️</span>`;
            
            return `
            <div class="cm-row" id="cm-col-${c.id}">
                <div style="display: flex; align-items: center;">
                  ${logoHtml}
                  <div>
                    <div class="cm-name">${c.name}</div>
                    <div class="cm-meta">ID: ${c.id}</div>
                  </div>
                </div>
                <div class="cm-actions">
                  <!-- Delete option removed by request -->
                </div>
            </div>
        `}).join('');
    };

    let pendingLogoFile = null;

    window._cmHandleLogoDrop = function(e) {
        e.preventDefault();
        const dropzone = document.getElementById('cm-logo-dropzone');
        if (dropzone) {
            dropzone.style.borderColor = 'rgba(255,255,255,.2)';
            dropzone.style.background = 'rgba(255,255,255,.02)';
        }
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            window._cmHandleLogoFile(e.dataTransfer.files[0]);
        }
    };

    window._cmHandleLogoFile = function(file) {
        if (!file || !file.type.startsWith('image/')) {
            if (window.showToast) window.showToast('❌ Please select a valid image file.', 'error');
            return;
        }
        pendingLogoFile = file;
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('cm-logo-preview');
            if (preview) {
                preview.innerHTML = `<img src="${e.target.result}" style="max-height: 60px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);" />`;
            }
        };
        reader.readAsDataURL(file);
    };

    window._cmAddCollege = async function() {
        const idInput = document.getElementById('cm-new-college-id');
        const nameInput = document.getElementById('cm-new-college-name');
        const urlInput = document.getElementById('cm-new-college-logo-url');
        const btn = document.getElementById('cm-add-college-btn');
        
        const id = idInput?.value?.trim().toLowerCase().replace(/[^a-z0-9\-]/g, '-');
        const name = nameInput?.value?.trim();
        let logo = urlInput?.value?.trim() || '';

        if (!id || !name) {
            if (window.showToast) window.showToast('❌ Both ID and Name are required.', 'error');
            return;
        }
        
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = `<span class="ap-spin" style="width:16px;height:16px;margin:0;display:inline-block;"></span> Adding...`;
        }

        try {
            if (!window.firebaseServices) throw new Error("Firebase services not loaded.");
            const { db, doc, setDoc, storage, ref, uploadBytes, getDownloadURL } = window.firebaseServices;
            
            // Upload local file if provided
            if (pendingLogoFile && storage) {
                const logoRef = ref(storage, `college_logos/${id}_${Date.now()}_${pendingLogoFile.name.replace(/[^a-zA-Z0-9.\-]/g, '_')}`);
                await uploadBytes(logoRef, pendingLogoFile);
                logo = await getDownloadURL(logoRef);
            }
            
            const dataToSave = { name };
            if (logo) dataToSave.logo = logo;
            
            await setDoc(doc(db, 'colleges', id), dataToSave);
            if (window.showToast) window.showToast('✅ College added successfully!', 'success');
            
            if (idInput) idInput.value = '';
            if (nameInput) nameInput.value = '';
            if (urlInput) urlInput.value = '';
            
            pendingLogoFile = null;
            const preview = document.getElementById('cm-logo-preview');
            if (preview) preview.innerHTML = '🖼️';
            
            // GlobalData updates automatically via onSnapshot, reload UI after delay
            setTimeout(() => { if (window._cmLoadColleges) window._cmLoadColleges(); }, 800);
        } catch (e) {
            console.error(e);
            if (window.showToast) window.showToast('❌ Failed: ' + e.message, 'error');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = `<i class="fas fa-plus"></i> Add College`;
            }
        }
    };

    // Listen for colleges update to refresh UI automatically
    window.addEventListener('collegesUpdated', () => {
        if (document.getElementById('cm-colleges')?.classList.contains('active')) {
            if (window._cmLoadColleges) window._cmLoadColleges();
        }
    });

    // ── Add Subject ─────────────────────────────────────────────────────────
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
            if (typeof window.refreshCustomSubjectsForSearch === 'function') {
                await window.refreshCustomSubjectsForSearch();
            }
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
            if (typeof window.refreshCustomSubjectsForSearch === 'function') {
                await window.refreshCustomSubjectsForSearch();
            }
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
    async function loadCmNoteTitles(ignoredSb, college = null) {
        const list = document.getElementById('cm-notes-title-list');
        if (!list) return;

        try {
            const clients = await getAllSBs();
            const promises = clients.map((client, idx) => {
                let q = client.from('approved_notes').select('id, title, subject, college, type').order('created_at', { ascending: false });
                if (college) q = q.eq('college', college);
                return q.then(res => ({ ...res, dbIndex: idx })); // Keep track of which db it came from
            });

            const results = await Promise.all(promises);
            let data = [];
            let hasError = false;
            let errMsg = '';
            results.forEach(res => {
                if (res.error) {
                    hasError = true;
                    errMsg = res.error.message;
                } else if (res.data) {
                    res.data.forEach(item => { item._dbIndex = res.dbIndex; });
                    data = data.concat(res.data);
                }
            });

            if (hasError && data.length === 0) throw new Error(errMsg);

            // Sort combined results
            data.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

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
                  <button class="apb apb-view" style="padding:.35rem .7rem;font-size:.75rem" onclick="window._cmRenameNote('${n.id}', ${n._dbIndex})">✏️ Rename</button>
                  <button class="apb apb-no" style="padding:.35rem .7rem;font-size:.75rem" onclick="window._apDeleteApproved('${n.id}', ${n._dbIndex})">🗑</button>
                </div>
              </div>`).join('');
        } catch(e) {
            list.innerHTML = `<div class="ap-err">⚠️ ${e.message}</div>`;
        }
    }

    window._cmRenameNote = async function (id, dbIndex = 0) {
        const currentTitle = document.getElementById(`cnt-title-${id}`)?.innerText || '';
        const newTitle = prompt(`Rename note:`, currentTitle);
        if (!newTitle || newTitle.trim() === currentTitle) return;

        try {
            const clients = await getAllSBs();
            const sb = clients[dbIndex] || clients[0];
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

    // ── Dynamic Pricing Config ───────────────────────────────────────────────
    let localPricingConfig = { plans: {}, coupons: {} };

    window._apLoadPricing = async function() {
        try {
            const sb = await getSB();
            const { data, error } = await sb.from('pricing_config').select('*').eq('id', 1).single();
            if (error) throw error;
            if (data) {
                localPricingConfig = { plans: data.plans || {}, coupons: data.coupons || {} };
                renderPricingConfig();
            } else {
                throw new Error("Could not load pricing");
            }
        } catch (e) {
            console.error("Pricing error:", e);
            const list = document.getElementById('ap-pricing-list');
            if (list) list.innerHTML = `<div class="ap-err">⚠️ Failed to load pricing config. Make sure the server is running.</div>`;
        }
    };

    function renderPricingConfig() {
        const pList = document.getElementById('ap-pricing-list');
        const cList = document.getElementById('ap-coupons-list');
        if (!pList || !cList) return;

        // Render Plans
        let pHTML = '';
        for (const [planId, plan] of Object.entries(localPricingConfig.plans)) {
            pHTML += `
            <div class="ap-item" style="display:grid; grid-template-columns: 1fr auto; gap: 1rem; align-items:center">
                <div>
                    <div class="ap-title" style="margin-bottom:0.25rem">${plan.name} <span style="font-size:0.75rem; color:rgba(255,255,255,0.4)">(${planId})</span></div>
                    <div class="ap-meta">Duration: ${plan.durationDays} Days</div>
                </div>
                <div style="display:flex; align-items:center; gap:0.5rem">
                    <span style="color:rgba(255,255,255,0.5)">₹</span>
                    <input type="number" id="price-input-${planId}" value="${plan.amount / 100}" 
                           style="background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.12); color:#fff; border-radius:6px; padding:.3rem .5rem; font-size:.9rem; width:80px; text-align:right" />
                </div>
            </div>`;
        }
        pList.innerHTML = pHTML;

        let cHTML = '';
        const coupons = Object.entries(localPricingConfig.coupons || {});
        if (coupons.length === 0) {
            cHTML = `<div class="ap-empty" style="padding: 2rem;"><div class="ap-empty-ico" style="font-size: 2rem;">🎫</div><p>No custom coupons added yet.</p></div>`;
        } else {
            for (const [code, val] of coupons) {
                const isObj = typeof val === 'object';
                const discount = isObj ? val.discount : val;
                const usesStr = isObj && val.maxUses ? ` <span style="color:#fbbf24; font-size:0.75rem; margin-left:8px;">(Uses: ${val.uses || 0}/${val.maxUses})</span>` : '';
                
                cHTML += `
                <div class="ap-item" style="display:grid; grid-template-columns: 1fr auto; gap: 1rem; align-items:center">
                    <div>
                        <div class="ap-title" style="margin-bottom:0.25rem; font-family: monospace; letter-spacing: 1px; color: #10b981;">${code}</div>
                        <div class="ap-meta">${discount}% Discount${usesStr}</div>
                    </div>
                    <div>
                        <button class="apb apb-no" style="padding:.35rem .7rem;font-size:.75rem" onclick="window._apRemoveCoupon('${code}')">🗑 Remove</button>
                    </div>
                </div>`;
            }
        }
        cList.innerHTML = cHTML;
    }

    window._apSavePricing = async function() {
        // Collect updated prices
        for (const planId of Object.keys(localPricingConfig.plans)) {
            const el = document.getElementById(`price-input-${planId}`);
            if (el) {
                localPricingConfig.plans[planId].amount = parseFloat(el.value) * 100; // convert back to paise
            }
        }

        try {
            const u = getCurrentUser();
            const sb = await getSB();
            const { error } = await sb.from('pricing_config').upsert({
                id: 1,
                plans: localPricingConfig.plans,
                coupons: localPricingConfig.coupons
            });

            if (!error) {
                if (window.showToast) window.showToast('✅ Pricing configuration saved!');
                else alert('✅ Pricing configuration saved!');
            } else {
                throw new Error(error.message || 'Failed to save');
            }
        } catch (e) {
            console.error("Save Pricing Error:", e);
            alert('❌ ' + e.message);
        }
    };

    window._apAddCoupon = function() {
        const codeInput = document.getElementById('cpn-code-input');
        const discountInput = document.getElementById('cpn-discount-input');
        const maxUsesInput = document.getElementById('cpn-maxuses-input');
        if (!codeInput || !discountInput) return;
        
        const code = codeInput.value.trim().toUpperCase();
        const discount = parseFloat(discountInput.value);
        const maxUses = maxUsesInput ? parseInt(maxUsesInput.value) : NaN;

        if (!code || isNaN(discount) || discount <= 0 || discount > 100) {
            alert('Please enter a valid code and a discount between 1 and 100.');
            return;
        }

        if (!localPricingConfig.coupons) localPricingConfig.coupons = {};
        
        if (!isNaN(maxUses) && maxUses > 0) {
            localPricingConfig.coupons[code] = { discount, maxUses, uses: 0 };
        } else {
            localPricingConfig.coupons[code] = discount;
        }
        
        codeInput.value = '';
        discountInput.value = '';
        if (maxUsesInput) maxUsesInput.value = '';
        
        // Auto save
        window._apSavePricing();
        renderPricingConfig();
    };

    window._apRemoveCoupon = function(code) {
        if (!confirm(`Are you sure you want to remove coupon ${code}?`)) return;
        if (localPricingConfig.coupons && localPricingConfig.coupons[code]) {
            delete localPricingConfig.coupons[code];
            // Auto save
            window._apSavePricing();
            renderPricingConfig();
        }
    };

    let allSubs = [];
    window._apLoadSubscriptions = async function() {
        const list = document.getElementById('ap-subs-list');
        if (!list) return;
        list.innerHTML = `<div class="ap-loader"><div class="ap-spin"></div><p>Loading subscriptions…</p></div>`;
        try {
            const u = getCurrentUser();
            const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://skil-matrix-server.onrender.com';
            const res = await fetch(`${apiUrl}/api/admin/subscriptions?uid=${u.uid || u.id}`);
            const data = await res.json();
            if (!data.success) throw new Error(data.error);
            allSubs = data.users;
            window._apRenderSubs(allSubs);
        } catch(e) {
            list.innerHTML = `<div class="ap-err">⚠️ ${e.message}</div>`;
        }
    };

    window._apSearchSubs = function(q) {
        if (!q) return window._apRenderSubs(allSubs);
        q = q.toLowerCase();
        const filtered = allSubs.filter(u => 
            u.uid.toLowerCase().includes(q) || 
            (u.name && u.name.toLowerCase().includes(q)) || 
            (u.email && u.email.toLowerCase().includes(q)) || 
            (u.plan_id && u.plan_id.toLowerCase().includes(q)) ||
            (u.active_plan_id && u.active_plan_id.toLowerCase().includes(q))
        );
        window._apRenderSubs(filtered);
    };

    window._apRenderSubs = function(rows) {
        const list = document.getElementById('ap-subs-list');
        if (!list) return;
        if (rows.length === 0) {
            list.innerHTML = `<div class="ap-empty">No subscriptions found</div>`;
            return;
        }

        let html = `
        <div style="overflow-x:auto; margin-top: 1rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.01);">
            <table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.82rem; color: rgba(255,255,255,0.85);">
                <thead>
                    <tr style="border-bottom:1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.02); color:rgba(255,255,255,0.5); font-weight:600;">
                        <th style="padding:0.9rem 1.25rem;">User Details</th>
                        <th style="padding:0.9rem 1.25rem;">Active Plan Status</th>
                        <th style="padding:0.9rem 1.25rem;">Transaction</th>
                        <th style="padding:0.9rem 1.25rem;">Date & Time</th>
                        <th style="padding:0.9rem 1.25rem; text-align:right;">Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;

        html += rows.map(r => {
            const isActive = r.active_plan_id !== 'free' && (!r.plan_expiry || new Date(r.plan_expiry) > new Date());
            const statusBadge = isActive 
                ? `<span class="ap-tag" style="background:rgba(16,185,129,0.15);color:#10b981;border:1px solid rgba(16,185,129,0.3);font-size:0.65rem;padding:2px 6px;border-radius:4px;font-weight:600;">ACTIVE</span>` 
                : `<span class="ap-tag" style="background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.4);border:1px solid rgba(255,255,255,0.1);font-size:0.65rem;padding:2px 6px;border-radius:4px;font-weight:600;">INACTIVE</span>`;

            const planDisplay = `<strong style="color:#a78bfa; font-weight:700;">${r.active_plan_id.toUpperCase()}</strong> ${statusBadge}`;
            const expiryDisplay = r.plan_expiry && isActive 
                ? `<div style="font-size:0.7rem;color:rgba(255,255,255,0.4);margin-top:0.25rem;">📅 ${new Date(r.plan_expiry).toLocaleDateString()} ${new Date(r.plan_expiry).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>` 
                : '';

            const transactionText = r.type === 'payment' 
                ? `<span style="color:#34d399;font-weight:700;font-size:0.9rem;">₹${r.amount}</span> <span style="font-size:0.75rem;opacity:0.75;">(Paid: ${r.plan_id.toUpperCase()})</span>` 
                : `<span style="color:rgba(255,255,255,0.35);font-size:0.75rem;">🎁 System Grant</span>`;

            return `
                <tr style="border-bottom:1px solid rgba(255,255,255,0.05); transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.015)'" onmouseout="this.style.background='transparent'">
                    <td style="padding:0.9rem 1.25rem;">
                        <div class="ap-title" id="ap-name-${r.uid}" style="font-size:0.95rem;font-weight:700;color:#fff;margin-bottom:0.25rem">${r.name || 'Unknown User'}</div>
                        <div style="font-size:0.75rem;color:rgba(255,255,255,0.4);display:flex;flex-wrap:wrap;gap:0.4rem;align-items:center;">
                            <span id="ap-email-${r.uid}">📧 ${r.email || 'N/A'}</span>
                            <span style="opacity:0.3;">|</span>
                            <span style="font-family:monospace;font-size:0.7rem;opacity:0.75;">🔑 ${r.uid}</span>
                        </div>
                    </td>
                    <td style="padding:0.9rem 1.25rem;">
                        <div>${planDisplay}</div>
                        ${expiryDisplay}
                    </td>
                    <td style="padding:0.9rem 1.25rem;">
                        ${transactionText}
                    </td>
                    <td style="padding:0.9rem 1.25rem; color:rgba(255,255,255,0.6); font-size:0.78rem;">
                        🕒 ${new Date(r.date).toLocaleString()}
                    </td>
                    <td style="padding:0.9rem 1.25rem; text-align:right;">
                        ${isActive ? `
                            <button class="apb apb-no" style="padding:0.35rem 0.7rem;font-size:0.72rem;border-radius:6px;font-weight:600;" onclick="window._apUpdateSub('${r.uid}','cancel')">Cancel</button>
                        ` : '<span style="color:rgba(255,255,255,0.25);font-size:0.75rem;">—</span>'}
                    </td>
                </tr>
            `;
        }).join('');

        html += `
                </tbody>
            </table>
        </div>
        `;

        list.innerHTML = html;

        // Asynchronously check and load fallback info from client-side Firestore for any unknown users
        rows.forEach(async r => {
            if ((!r.name || r.name === 'Unknown User' || !r.email || r.email === 'N/A') && window.firebaseServices) {
                try {
                    const { db, doc, getDoc } = window.firebaseServices;
                    const docSnap = await getDoc(doc(db, 'users', r.uid));
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        const name = data.name || data.displayName || '';
                        const email = data.email || '';
                        if (name) {
                            r.name = name;
                            const nameEls = document.querySelectorAll(`[id="ap-name-${r.uid}"]`);
                            nameEls.forEach(el => el.textContent = name);
                        }
                        if (email) {
                            r.email = email;
                            const emailEls = document.querySelectorAll(`[id="ap-email-${r.uid}"]`);
                            emailEls.forEach(el => el.innerHTML = `📧 ${email}`);
                        }
                    }
                } catch (err) {
                    console.warn("Client-side fallback profile load failed for:", r.uid, err);
                }
            }
        });
    };

    window._apUpdateSub = async function(uid, action) {
        if (action === 'cancel') {
            if (!confirm(`Are you sure you want to cancel the active plan for ${uid}?`)) return;
            await _executeSubUpdate({ targetUid: uid, action: 'cancel' });
        } else if (action === 'grant') {
            const planId = prompt("Enter plan ID (e.g. 'pro' or 'codetantra'):", "pro");
            if (!planId) return;
            const days = prompt("Enter duration in days:", "30");
            if (!days || isNaN(days)) return;
            await _executeSubUpdate({ targetUid: uid, action: 'grant', planId, durationDays: days });
        }
    };

    async function _executeSubUpdate(payload) {
        try {
            const u = getCurrentUser();
            payload.adminUid = u.uid || u.id;
            const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://skil-matrix-server.onrender.com';
            const res = await fetch(`${apiUrl}/api/admin/update-subscription`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                alert("✅ Success: " + data.message);
                window._apLoadSubscriptions(); // Refresh
            } else {
                alert("❌ Failed: " + data.error);
            }
        } catch(e) {
            alert("Error: " + e.message);
        }
    }

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

    window._apSaveAnalyticsConfig = async function() {
        const students = document.getElementById('admin-stat-students').value.trim();
        const views = document.getElementById('admin-stat-views').value.trim();
        const downloads = document.getElementById('admin-stat-downloads').value.trim();
        const resources = document.getElementById('admin-stat-resources').value.trim();

        const btn = document.querySelector('#appage-analytics .apb-ok');
        const originalText = btn.innerText;
        btn.innerText = 'Saving...';
        btn.disabled = true;

        try {
            const sb = await getSB();
            const { error } = await sb.from('dashboard_stats').upsert({
                id: 1,
                students: students,
                views: views,
                downloads: downloads,
                resources: resources
            });

            if (error) throw error;

            // Update local cache so Dashboard tab shows changes instantly
            if (!window.globalAnalyticsData) window.globalAnalyticsData = {};
            window.globalAnalyticsData.adminTotalStudents = students;
            window.globalAnalyticsData.adminTotalViews = views;
            window.globalAnalyticsData.adminTotalDownloads = downloads;
            window.globalAnalyticsData.adminTotalResources = resources;

            if (window.showToast) window.showToast('✅ Analytics configuration saved! Check your dashboard.');
            else alert('✅ Analytics configuration saved! Check your dashboard.');
        } catch (e) {
            console.error("Failed to save analytics config:", e);
            alert('❌ Failed: ' + e.message);
        } finally {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    };

    window._apPopulateAnalytics = async function() {
        try {
            const sb = await getSB();
            const { data, error } = await sb.from('dashboard_stats').select('*').eq('id', 1).single();
            if (error) {
                console.warn("Could not fetch dashboard stats from Supabase:", error);
                return;
            }
            
            if (data) {
                const studentsEl = document.getElementById('admin-stat-students');
                const viewsEl = document.getElementById('admin-stat-views');
                const downloadsEl = document.getElementById('admin-stat-downloads');
                const resourcesEl = document.getElementById('admin-stat-resources');
                
                if(studentsEl && data.students) studentsEl.value = data.students;
                if(viewsEl && data.views) viewsEl.value = data.views;
                if(downloadsEl && data.downloads) downloadsEl.value = data.downloads;
                if(resourcesEl && data.resources) resourcesEl.value = data.resources;
            }
        } catch (e) {
            console.error("Error populating analytics config:", e);
        }
    };

    // ── Real-Time Database Analytics ─────────────────────────────────────────
    window._apLoadRealAnalytics = async function () {
        const container = document.getElementById('ap-real-analytics-container');
        if (!container) return;

        container.innerHTML = `<div class="ap-loader"><div class="ap-spin"></div><p>Compiling live database metrics…</p></div>`;

        try {
            const clients = await getAllSBs();
            const results = await Promise.all(
                clients.map(c => c.from('approved_notes').select('*'))
            );

            let allNotes = [];
            results.forEach(res => { if (res.data) allNotes = allNotes.concat(res.data); });

            // ── Merge pre-existing Drive/Global notes ────────────────────────
            // These are hardcoded in globalNotes.js and never reach approved_notes
            const gn = window.globalNotes || {};
            let driveCount = 0;
            for (const collegeKey in gn) {
                const subjectsObj = gn[collegeKey];
                if (!subjectsObj || typeof subjectsObj !== 'object') continue;
                for (const subjectKey in subjectsObj) {
                    const items = subjectsObj[subjectKey];
                    if (!Array.isArray(items)) continue;
                    items.forEach(item => {
                        // Normalize to same shape used by approved_notes
                        allNotes.push({
                            id: item.id || `drive-${driveCount}`,
                            type: item.type || 'notes',
                            college: item.collegeId || item.college || collegeKey || 'unknown',
                            semester: item.semester || null,
                            branch: item.branch || null,
                            uploader_email: '__drive__',
                            uploader_name: 'Drive (Pre-existing)',
                            created_at: null,
                            _isDrive: true
                        });
                        driveCount++;
                    });
                }
            }

            // Scope to assigned college if Co-Admin
            const isSuper = window._apIsSuperAdmin;
            const col = window._apCurrentCollege;
            if (!isSuper && col) allNotes = allNotes.filter(n => n.college === col);

            if (allNotes.length === 0) {
                container.innerHTML = `
                    <div class="ap-empty" style="padding:2rem;">
                        <div class="ap-empty-ico">📊</div>
                        <h3>No Approved Notes Yet</h3>
                        <p>Real-time metrics will appear as soon as notes are approved.</p>
                    </div>`;
                return;
            }

            const total = allNotes.length;
            const supabaseCount = allNotes.filter(n => !n._isDrive).length;
            const driveTotal = allNotes.filter(n => n._isDrive).length;

            // Helpers
            const getColName = id => (window.GlobalData?.colleges?.find(c => c.id === id)?.name) || id || 'Unknown';
            const typify = t => {
                const s = (t || '').toLowerCase();
                if (s === 'notes') return 'notes';
                if (s === 'pyqs') return 'pyqs';
                if (s === 'practicals' || s === 'practical' || s.includes('lab')) return 'practicals';
                if (s === 'formula' || s.includes('formula')) return 'formula';
                return 'others';
            };

            // Counts
            const typeCounts = { notes: 0, pyqs: 0, practicals: 0, formula: 0, others: 0 };
            const collegeMap = {};  // { name: { notes,pyqs,practicals,formula,others,total } }
            const semMap = {};
            const branchMap = {};
            const uploaderMap = {};

            allNotes.forEach(n => {
                const t = typify(n.type);
                typeCounts[t]++;

                // College
                const cName = getColName(n.college);
                if (!collegeMap[cName]) collegeMap[cName] = { notes: 0, pyqs: 0, practicals: 0, formula: 0, others: 0, total: 0 };
                collegeMap[cName][t]++;
                collegeMap[cName].total++;

                // Semester (Drive notes have no semester — skip from sem chart)
                if (!n._isDrive) {
                    const sem = n.semester || 'Unspecified';
                    semMap[sem] = (semMap[sem] || 0) + 1;
                }

                // Branch (Drive notes have no branch — skip from branch chart)
                if (!n._isDrive) {
                    const br = (n.branch || 'Unspecified').toUpperCase();
                    branchMap[br] = (branchMap[br] || 0) + 1;
                }

                // Uploaders — skip the drive pseudo-uploader from leaderboard
                if (!n._isDrive) {
                    const email = (n.uploader_email || 'anonymous').toLowerCase();
                    const name  = n.uploader_name || email.split('@')[0];
                    if (!uploaderMap[email]) uploaderMap[email] = { name, count: 0 };
                    uploaderMap[email].count++;
                }
            });

            // Newest upload
            const dates = allNotes.map(n => new Date(n.created_at)).filter(d => !isNaN(d));
            const newestStr = dates.length
                ? new Date(Math.max(...dates)).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                : '—';

            // Most popular type
            const mostPopular = Object.entries(typeCounts)
                .sort((a, b) => b[1] - a[1])[0][0].toUpperCase();

            // Unique uploaders
            const uniqueUploaders = Object.keys(uploaderMap).length;

            // Top contributors
            const topUploaders = Object.entries(uploaderMap)
                .map(([email, info]) => ({ email, ...info }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 8);

            // Pct helper
            const pct = n => total > 0 ? ((n / total) * 100).toFixed(1) : '0.0';

            // Type labels
            const typeLabels = {
                notes: '📄 Notes',
                pyqs: '📝 PYQs (Previous Year Questions)',
                practicals: '⚗️ Practical / Lab Work',
                formula: '🔢 Formula Sheets',
                others: '❓ Others'
            };
            const typeFills = ['', 'c2', 'c3', 'c4', ''];

            container.innerHTML = `
                <!-- Summary Cards -->
                <div class="ap-real-grid">
                  <div class="ap-real-card" style="border-left:3px solid #10b981;">
                    <div class="ap-real-card-lbl">Total Documents (Real)</div>
                    <div class="ap-real-card-val">${total}</div>
                    <div style="margin-top:.6rem;display:flex;gap:.5rem;flex-wrap:wrap;">
                      <span style="font-size:.72rem;background:rgba(16,185,129,.15);color:#10b981;padding:.2rem .5rem;border-radius:4px;">📁 Drive: ${driveTotal}</span>
                      <span style="font-size:.72rem;background:rgba(167,139,250,.15);color:#a78bfa;padding:.2rem .5rem;border-radius:4px;">☁️ Supabase: ${supabaseCount}</span>
                    </div>
                  </div>
                  <div class="ap-real-card" style="border-left:3px solid #a78bfa;">
                    <div class="ap-real-card-lbl">Unique Contributors</div>
                    <div class="ap-real-card-val">${uniqueUploaders}</div>
                    <div style="margin-top:.6rem;font-size:.72rem;color:rgba(255,255,255,.35);">+ Drive pre-existing</div>
                  </div>
                  <div class="ap-real-card" style="border-left:3px solid #00e5ff;">
                    <div class="ap-real-card-lbl">Most Uploaded Type</div>
                    <div class="ap-real-card-val" style="font-size:1.2rem;margin-top:.6rem;">${mostPopular}</div>
                  </div>
                  <div class="ap-real-card" style="border-left:3px solid #f1c40f;">
                    <div class="ap-real-card-lbl">Latest Upload</div>
                    <div class="ap-real-card-val" style="font-size:1.2rem;margin-top:.6rem;">${newestStr}</div>
                  </div>
                </div>

                <div class="ap-real-flex-sections">
                  <!-- Type distribution -->
                  <div>
                    <h3 style="font-size:.95rem;color:#fff;font-weight:700;margin-bottom:1.25rem;">📁 Document Type Distribution</h3>
                    ${Object.entries(typeCounts).map(([key, cnt], i) => `
                      <div class="ap-progress-item">
                        <div class="ap-progress-lbl">
                          <span>${typeLabels[key]}</span>
                          <span>${cnt} (${pct(cnt)}%)</span>
                        </div>
                        <div class="ap-progress-track">
                          <div class="ap-progress-fill ${typeFills[i]}" style="width:${pct(cnt)}%"></div>
                        </div>
                      </div>
                    `).join('')}
                  </div>

                  <!-- Top contributors -->
                  <div>
                    <h3 style="font-size:.95rem;color:#fff;font-weight:700;margin-bottom:1.25rem;">🏆 Top Contributors</h3>
                    <div class="ap-table-wrap">
                      <table class="ap-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Scholar</th>
                            <th>Email</th>
                            <th style="text-align:right;">Uploads</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${topUploaders.map((u, i) => `
                            <tr>
                              <td style="font-weight:bold;color:${i===0?'#f1c40f':i===1?'#e1e1e1':i===2?'#cd7f32':'rgba(255,255,255,.4)'};">${i+1}</td>
                              <td style="font-weight:600;color:#fff;">${u.name}</td>
                              <td style="color:rgba(255,255,255,.5);font-size:.78rem;">${u.email}</td>
                              <td style="text-align:right;font-weight:800;color:#10b981;">${u.count}</td>
                            </tr>
                          `).join('')}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <!-- College-wise breakdown -->
                <h3 style="font-size:.95rem;color:#fff;font-weight:700;margin:2rem 0 1.25rem;display:flex;align-items:center;gap:.5rem;">🏫 College-Wise Breakdown</h3>
                <div class="ap-table-wrap">
                  <table class="ap-table">
                    <thead>
                      <tr>
                        <th>College / Institution</th>
                        <th style="text-align:center;">Notes</th>
                        <th style="text-align:center;">PYQs</th>
                        <th style="text-align:center;">Practicals</th>
                        <th style="text-align:center;">Formula</th>
                        <th style="text-align:center;">Others</th>
                        <th style="text-align:right;color:#a78bfa;">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${Object.entries(collegeMap)
                        .sort((a, b) => b[1].total - a[1].total)
                        .map(([name, s]) => `
                          <tr>
                            <td style="font-weight:700;color:#fff;max-width:220px;white-space:normal;">${name}</td>
                            <td style="text-align:center;">${s.notes}</td>
                            <td style="text-align:center;">${s.pyqs}</td>
                            <td style="text-align:center;">${s.practicals}</td>
                            <td style="text-align:center;">${s.formula}</td>
                            <td style="text-align:center;color:rgba(255,255,255,.4);">${s.others}</td>
                            <td style="text-align:right;font-weight:800;color:#a78bfa;">${s.total}</td>
                          </tr>
                        `).join('')}
                    </tbody>
                  </table>
                </div>

                <!-- Semester & Branch -->
                <div class="ap-real-flex-sections" style="margin-top:2rem;">
                  <div>
                    <h3 style="font-size:.95rem;color:#fff;font-weight:700;margin-bottom:1.25rem;">📅 Semester Distribution</h3>
                    <div class="ap-table-wrap">
                      <table class="ap-table">
                        <thead><tr><th>Semester</th><th style="text-align:right;">Count</th></tr></thead>
                        <tbody>
                          ${Object.entries(semMap).sort((a,b)=>b[1]-a[1]).map(([sem, cnt]) => `
                            <tr>
                              <td style="font-weight:600;color:#fff;">${sem}</td>
                              <td style="text-align:right;font-weight:800;color:#34d399;">${cnt}</td>
                            </tr>
                          `).join('')}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div>
                    <h3 style="font-size:.95rem;color:#fff;font-weight:700;margin-bottom:1.25rem;">🔬 Branch Distribution</h3>
                    <div class="ap-table-wrap">
                      <table class="ap-table">
                        <thead><tr><th>Branch / Dept</th><th style="text-align:right;">Count</th></tr></thead>
                        <tbody>
                          ${Object.entries(branchMap).sort((a,b)=>b[1]-a[1]).map(([br, cnt]) => `
                            <tr>
                              <td style="font-weight:600;color:#fff;">${br}</td>
                              <td style="text-align:right;font-weight:800;color:#60a5fa;">${cnt}</td>
                            </tr>
                          `).join('')}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <p style="font-size:.72rem;color:rgba(255,255,255,.25);margin-top:1rem;text-align:right;">
                  Last refreshed: ${new Date().toLocaleString('en-IN')} · ${total} total records pulled live from database
                </p>
            `;

            // Animate progress bars after render
            requestAnimationFrame(() => {
                document.querySelectorAll('.ap-progress-fill').forEach(el => {
                    const w = el.style.width;
                    el.style.width = '0%';
                    requestAnimationFrame(() => { el.style.width = w; });
                });
            });

        } catch (e) {
            console.error('[AdminPanel] _apLoadRealAnalytics error:', e);
            container.innerHTML = `<div class="ap-err">⚠️ Failed to load real analytics: ${e.message}</div>`;
        }
    };

})();
