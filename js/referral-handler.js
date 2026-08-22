/**
 * SKiL MATRiX — Referral Handler v4
 *
 * Strategy:
 *   1) On ANY page visit with ?ref=CODE:
 *      → Validate code in Supabase
 *      → Save to sessionStorage (works in incognito) AND localStorage (normal browser)
 *      → Show "You were invited" toast
 *
 *   2) On login/signup — auth.js calls:
 *      processReferralOnLogin(email, uid, refCode, isNewUser)
 *      where isNewUser = Firebase creationTime === lastSignInTime (brand new account)
 *
 *   3) Guards (all must pass to award XP):
 *      (a) isNewUser === true — existing users logging in get nothing
 *      (b) Supabase profiles age check — profile older than 3min = existing user
 *      (c) visitor email != referrer email (no self-referral)
 *      (d) referral_visits UNIQUE(referral_code, visitor_email) — no double-count
 *      (e) one referral bonus per email ever (visitor can't be referred twice)
 *
 *   4) On success:
 *      → referral_visits row saved with visitor email + uid + referrer id
 *      → +50 XP to referrer | +20 XP welcome bonus to new user
 */
(function () {
    'use strict';

    const SUPABASE_URL      = 'https://begbdglouistmaughmot.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlZ2JkZ2xvdWlzdG1hdWdobW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyODMxMDEsImV4cCI6MjA5NDg1OTEwMX0.sKOHb6jifGH4P8ZFrc5tkPPkButNtfx1mJj9o-zC-rs';
    const REFERRAL_XP       = 50;
    const WELCOME_XP        = 20;
    const PENDING_REF_KEY   = 'skilmatrix_pending_ref';

    // ─────────────────────────────────────────────
    //  Supabase client (lazy, singleton)
    // ─────────────────────────────────────────────
    function getSB() {
        if (window._refSB) return Promise.resolve(window._refSB);
        return import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm')
            .then(({ createClient }) => {
                window._refSB = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                return window._refSB;
            });
    }

    // ─────────────────────────────────────────────
    //  Dual storage helpers
    //  sessionStorage → works in incognito (same tab)
    //  localStorage   → works in normal browser (survives navigation)
    // ─────────────────────────────────────────────
    function savePending(data) {
        const str = JSON.stringify(data);
        try { sessionStorage.setItem(PENDING_REF_KEY, str); } catch (_) {}
        try { localStorage.setItem(PENDING_REF_KEY, str);   } catch (_) {}
    }

    function loadPending() {
        let raw = null;
        try { raw = sessionStorage.getItem(PENDING_REF_KEY); } catch (_) {}
        if (!raw) { try { raw = localStorage.getItem(PENDING_REF_KEY); } catch (_) {} }
        if (!raw) return null;
        try { return JSON.parse(raw); } catch (_) { return null; }
    }

    function clearPending() {
        try { sessionStorage.removeItem(PENDING_REF_KEY); } catch (_) {}
        try { localStorage.removeItem(PENDING_REF_KEY);   } catch (_) {}
    }

    // ─────────────────────────────────────────────
    //  URL helper
    // ─────────────────────────────────────────────
    function getRefCodeFromURL() {
        const params = new URLSearchParams(window.location.search);
        return (params.get('ref') || '').toUpperCase().trim();
    }

    // Exposed so auth.js can call this to get the active ref code
    window.getPendingRefCode = function () {
        const urlCode = getRefCodeFromURL();
        if (urlCode) return urlCode;
        const pending = loadPending();
        return pending ? (pending.code || '') : '';
    };

    // ─────────────────────────────────────────────
    //  Welcome Toast (shown when ?ref= link opened)
    // ─────────────────────────────────────────────
    function showWelcomeToast(referrerName) {
        if (!document.getElementById('ref-toast-style')) {
            const s = document.createElement('style');
            s.id = 'ref-toast-style';
            s.textContent = `
            #ref-welcome-toast {
                position:fixed;bottom:2rem;left:50%;
                transform:translateX(-50%) translateY(120px);
                background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);
                border:1px solid rgba(0,210,255,0.4);
                box-shadow:0 8px 32px rgba(0,0,0,0.5),0 0 40px rgba(0,210,255,0.15);
                color:#fff;padding:1rem 1.5rem;border-radius:16px;
                font-family:'Inter',sans-serif;font-size:0.9rem;
                display:flex;align-items:center;gap:0.75rem;
                z-index:99999;min-width:280px;max-width:420px;
                transition:transform 0.5s cubic-bezier(0.175,0.885,0.32,1.275);
            }
            #ref-welcome-toast.show{transform:translateX(-50%) translateY(0);}
            .ref-toast-icon{font-size:1.8rem;flex-shrink:0;}
            .ref-toast-text strong{color:#00d2ff;display:block;font-size:1rem;margin-bottom:0.15rem;}
            .ref-toast-text span{color:rgba(255,255,255,0.65);font-size:0.82rem;}
            `;
            document.head.appendChild(s);
        }
        const existing = document.getElementById('ref-welcome-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.id = 'ref-welcome-toast';
        const byName = referrerName ? ` by <strong style="color:#9d50bb">${referrerName}</strong>` : '';
        toast.innerHTML = `
            <div class="ref-toast-icon">🎉</div>
            <div class="ref-toast-text">
                <strong>Welcome to SKiL MATRiX!</strong>
                <span>Invited${byName}. Sign up to get +${WELCOME_XP} XP welcome bonus!</span>
            </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 600); }, 8000);
    }

    // ─────────────────────────────────────────────
    //  Award Toast (shown after XP is awarded)
    // ─────────────────────────────────────────────
    function showReferralAwardedToast() {
        const s = document.createElement('style');
        s.textContent = `
        #ref-awarded-toast{
            position:fixed;bottom:2rem;right:2rem;
            background:linear-gradient(135deg,rgba(0,210,255,0.15),rgba(157,80,187,0.15));
            border:1px solid rgba(0,210,255,0.5);
            box-shadow:0 8px 32px rgba(0,0,0,0.5),0 0 30px rgba(0,210,255,0.2);
            color:#fff;padding:1rem 1.5rem;border-radius:16px;
            font-family:'Inter',sans-serif;font-size:0.88rem;
            display:flex;align-items:center;gap:0.75rem;
            z-index:99999;min-width:260px;
            animation:refAwardIn 0.5s cubic-bezier(0.175,0.885,0.32,1.275) forwards;
        }
        @keyframes refAwardIn{from{opacity:0;transform:translateY(30px);}to{opacity:1;transform:translateY(0);}}
        `;
        document.head.appendChild(s);
        const toast = document.createElement('div');
        toast.id = 'ref-awarded-toast';
        toast.innerHTML = `
            <div style="font-size:1.5rem">🏆</div>
            <div>
                <strong style="color:#00d2ff;display:block">Referral Activated!</strong>
                <span style="color:rgba(255,255,255,0.6)">Your referrer earned +${REFERRAL_XP} XP · You earned +${WELCOME_XP} XP welcome bonus!</span>
            </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 6000);
    }

    // ─────────────────────────────────────────────
    //  STEP 1: Handle ?ref= on page visit
    // ─────────────────────────────────────────────
    async function handleRefVisit(refCode) {
        try {
            const sb = await getSB();

            // Don't overwrite if same code already pending
            const existing = loadPending();
            if (existing && existing.code === refCode) {
                showWelcomeToast(existing.name);
                return;
            }

            // Validate code in DB
            const { data: owner, error } = await sb
                .from('profiles')
                .select('id, name, email, referral_code')
                .eq('referral_code', refCode)
                .single();

            if (error || !owner) {
                console.warn('[Referral] Code not found:', refCode);
                return;
            }

            // Dual-save
            savePending({
                code:          refCode,
                name:          owner.name,
                referrerEmail: owner.email,
                referrerId:    owner.id,
                savedAt:       Date.now()
            });

            console.log(`[Referral] 📌 Saved pending ref from: ${owner.name} (${refCode})`);
            showWelcomeToast(owner.name);

            // Clean ?ref= from URL
            const url = new URL(window.location.href);
            url.searchParams.delete('ref');
            window.history.replaceState({}, '', url.toString());

        } catch (e) {
            console.warn('[Referral] Visit error:', e);
        }
    }

    // ─────────────────────────────────────────────
    //  STEP 2: Called from auth.js after login/signup
    //
    //  visitorEmail — logged-in user's email
    //  visitorUid   — Firebase UID of the logged-in user
    //  refCode      — explicit code (passed from auth.js; falls back to storage)
    //  isNewUser    — TRUE if Firebase creationTime ≈ lastSignInTime (brand new account)
    // ─────────────────────────────────────────────
    window.processReferralOnLogin = async function (visitorEmail, visitorUid, refCode, isNewUser) {
        if (!visitorEmail) return;

        // Resolve code: explicit arg → URL param → storage
        const code = (refCode || getRefCodeFromURL() || (loadPending()?.code) || '').toUpperCase().trim();
        if (!code) return;

        // ── GUARD 1: Only brand-new users get referral credit ─────────────────
        if (!isNewUser) {
            console.log('[Referral] Skipping — not a new user (existing account login)');
            clearPending();
            return;
        }

        try {
            const sb = await getSB();

            // ── GUARD 2: Double-check via Supabase profiles age ───────────────
            // Even if Firebase says new, check if Supabase profile pre-existed
            const { data: existingProfile } = await sb
                .from('profiles')
                .select('id, created_at')
                .eq('email', visitorEmail.toLowerCase())
                .maybeSingle();

            if (existingProfile) {
                const ageMs = Date.now() - new Date(existingProfile.created_at).getTime();
                if (ageMs > 3 * 60 * 1000) { // older than 3 minutes = pre-existing user
                    console.log('[Referral] Skipping — Supabase profile pre-existed');
                    clearPending();
                    return;
                }
            }

            // ── GUARD 3: No self-referral ─────────────────────────────────────
            const pending = loadPending();
            const referrerEmail = pending?.referrerEmail || '';
            if (visitorEmail.toLowerCase() === referrerEmail.toLowerCase()) {
                console.log('[Referral] Skipping — self-referral');
                clearPending();
                return;
            }

            // ── GUARD 4: This visitor email hasn't been referred before (by anyone) ─
            const { data: anyPriorVisit } = await sb
                .from('referral_visits')
                .select('id')
                .eq('visitor_email', visitorEmail.toLowerCase())
                .limit(1);

            if (anyPriorVisit && anyPriorVisit.length > 0) {
                console.log('[Referral] Skipping — visitor email already used a referral');
                clearPending();
                return;
            }

            // ── Get referrer's latest stats ───────────────────────────────────
            const { data: owner, error: ownerErr } = await sb
                .from('profiles')
                .select('id, name, email, xp, referral_count, referral_points')
                .eq('referral_code', code)
                .single();

            if (ownerErr || !owner) {
                console.warn('[Referral] Referrer not found for code:', code);
                clearPending();
                return;
            }

            // ── INSERT into referral_visits (email + uid + referrer_id) ───────
            const { error: insertErr } = await sb.from('referral_visits').insert([{
                referral_code:       code,
                visitor_email:       visitorEmail.toLowerCase(),
                visitor_fingerprint: visitorEmail.toLowerCase(), // backward compat
                visitor_uid:         visitorUid || null,
                referrer_id:         owner.id,
                created_at:          new Date().toISOString()
            }]);

            if (insertErr) {
                if (insertErr.code === '23505') { // unique constraint violation
                    console.log('[Referral] Blocked by DB unique constraint (already counted)');
                    clearPending();
                    return;
                }
                console.error('[Referral] Insert failed:', insertErr.message);
                return;
            }

            // ── Award +50 XP to referrer ──────────────────────────────────────
            const newCount  = (owner.referral_count  || 0) + 1;
            const newPoints = (owner.referral_points || 0) + REFERRAL_XP;
            const newXp     = (owner.xp              || 0) + REFERRAL_XP;

            await sb.from('profiles').update({
                referral_count:  newCount,
                referral_points: newPoints,
                xp:              newXp
            }).eq('id', owner.id);

            // Sync referrer XP to users table (leaderboard)
            try { await sb.from('users').update({ xp: newXp }).eq('email', owner.email); } catch (_) {}

            // ── Award +20 XP welcome bonus to new user ────────────────────────
            try {
                if (visitorUid) {
                    const { data: vProfile } = await sb
                        .from('profiles')
                        .select('id, xp')
                        .eq('id', visitorUid)
                        .maybeSingle();

                    if (vProfile) {
                        const vNewXp = (vProfile.xp || 0) + WELCOME_XP;
                        await sb.from('profiles').update({ xp: vNewXp }).eq('id', visitorUid);
                        try { await sb.from('users').update({ xp: vNewXp }).eq('id', visitorUid); } catch (_) {}
                    } else {
                        // Profile not created in Supabase yet — store for profile.js to pick up
                        try { sessionStorage.setItem('skilmatrix_welcome_xp', String(WELCOME_XP)); } catch (_) {}
                        try { localStorage.setItem('skilmatrix_welcome_xp',   String(WELCOME_XP)); } catch (_) {}
                    }
                }
            } catch (e) {
                console.warn('[Referral] Welcome XP award failed (non-critical):', e);
            }

            console.log(`[Referral] ✅ ${visitorEmail} via ${code} → +${REFERRAL_XP}XP to ${owner.name}, +${WELCOME_XP}XP to visitor`);
            clearPending();
            showReferralAwardedToast();

        } catch (e) {
            console.warn('[Referral] Login award error:', e);
        }
    };

    // Backward compat alias
    window.processReferralOnSignup = window.processReferralOnLogin;

    // ─────────────────────────────────────────────
    //  BOOT — detect ?ref= on any page
    // ─────────────────────────────────────────────
    function boot() {
        const refCode = getRefCodeFromURL();
        if (!refCode) return;
        setTimeout(() => handleRefVisit(refCode), 500);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

    // ─────────────────────────────────────────────
    //  Referral code generator (deterministic from email)
    // ─────────────────────────────────────────────
    window.generateReferralCode = function (email) {
        if (!email) return '';
        const cleaned = email.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            const charIdx = (cleaned.charCodeAt(i % cleaned.length) ^ (i * 37)) % charset.length;
            code += charset[Math.abs(charIdx)];
        }
        return code;
    };

})();

