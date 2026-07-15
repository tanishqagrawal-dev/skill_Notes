/**
 * SKiL MATRiX — Referral Handler v3
 *
 * Strategy:
 *   1) On visit with ?ref=CODE → save code to localStorage, show welcome toast
 *   2) On ANY login (new or existing user) → check referral_visits by email
 *      - If this email is NOT in referral_visits for this code → count it, award XP
 *      - If already recorded → skip (prevents double-counting)
 *   3) Real-time: profile updates instantly reflect in leaderboard
 */
(function () {
    'use strict';

    const SUPABASE_URL = 'https://begbdglouistmaughmot.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlZ2JkZ2xvdWlzdG1hdWdobW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyODMxMDEsImV4cCI6MjA5NDg1OTEwMX0.sKOHb6jifGH4P8ZFrc5tkPPkButNtfx1mJj9o-zC-rs';
    const REFERRAL_XP = 50;
    const PENDING_REF_KEY = 'skilmatrix_pending_ref';

    // --- Supabase Client ---
    function getSB() {
        if (window._refSB) return Promise.resolve(window._refSB);
        return import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm')
            .then(({ createClient }) => {
                window._refSB = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                return window._refSB;
            });
    }

    function getRefCode() {
        const params = new URLSearchParams(window.location.search);
        return (params.get('ref') || '').toUpperCase().trim();
    }

    // --- Welcome Toast ---
    function showWelcomeToast(referrerName) {
        if (!document.getElementById('ref-toast-style')) {
            const s = document.createElement('style');
            s.id = 'ref-toast-style';
            s.textContent = `
            #ref-welcome-toast {
                position: fixed; bottom: 2rem; left: 50%;
                transform: translateX(-50%) translateY(120px);
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border: 1px solid rgba(0,210,255,0.4);
                box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 40px rgba(0,210,255,0.15);
                color: #fff; padding: 1rem 1.5rem; border-radius: 16px;
                font-family: 'Inter', sans-serif; font-size: 0.9rem;
                display: flex; align-items: center; gap: 0.75rem;
                z-index: 99999; min-width: 280px; max-width: 420px;
                transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
            #ref-welcome-toast.show { transform: translateX(-50%) translateY(0); }
            .ref-toast-icon { font-size: 1.8rem; flex-shrink: 0; }
            .ref-toast-text strong { color: #00d2ff; display: block; font-size: 1rem; margin-bottom: 0.15rem; }
            .ref-toast-text span { color: rgba(255,255,255,0.65); font-size: 0.82rem; }
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
                <span>You were invited${byName}. Log in or sign up to activate this referral!</span>
            </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 600); }, 6000);
    }

    function showReferralAwardedToast() {
        const s = document.createElement('style');
        s.textContent = `
        #ref-awarded-toast {
            position: fixed; bottom: 2rem; right: 2rem;
            background: linear-gradient(135deg, rgba(0,210,255,0.15), rgba(157,80,187,0.15));
            border: 1px solid rgba(0,210,255,0.5);
            box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 30px rgba(0,210,255,0.2);
            color: #fff; padding: 1rem 1.5rem; border-radius: 16px;
            font-family: 'Inter', sans-serif; font-size: 0.88rem;
            display: flex; align-items: center; gap: 0.75rem;
            z-index: 99999; min-width: 250px;
            animation: refAwardIn 0.5s cubic-bezier(0.175,0.885,0.32,1.275) forwards;
        }
        @keyframes refAwardIn {
            from { opacity: 0; transform: translateY(30px); }
            to   { opacity: 1; transform: translateY(0); }
        }
        `;
        document.head.appendChild(s);

        const toast = document.createElement('div');
        toast.id = 'ref-awarded-toast';
        toast.innerHTML = `
            <div style="font-size:1.5rem">🏆</div>
            <div>
                <strong style="color:#00d2ff; display:block">Referral Counted!</strong>
                <span style="color:rgba(255,255,255,0.6)">Your friend's referrer just earned +${REFERRAL_XP} XP</span>
            </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 5000);
    }

    // --- STEP 1: On page visit with ?ref=CODE, save and show toast ---
    async function handleRefVisit(refCode) {
        try {
            const sb = await getSB();

            // Don't overwrite an already-stored code from same referrer
            const already = localStorage.getItem(PENDING_REF_KEY);
            if (already) {
                try {
                    const parsed = JSON.parse(already);
                    if (parsed.code === refCode) return; // Same code, already saved
                } catch(_) {}
            }

            // Validate the code exists in DB
            const { data: owner, error } = await sb
                .from('profiles')
                .select('id, name, email, referral_code')
                .eq('referral_code', refCode)
                .single();

            if (error || !owner) {
                console.warn('[Referral] Code not found:', refCode);
                return;
            }

            // Save pending referral
            localStorage.setItem(PENDING_REF_KEY, JSON.stringify({
                code: refCode,
                name: owner.name,
                referrerEmail: owner.email,
                referrerId: owner.id,
                savedAt: Date.now()
            }));

            console.log(`[Referral] 📌 Pending referral saved from: ${owner.name} (${refCode})`);
            showWelcomeToast(owner.name);

            // Clean up ?ref= from URL
            const url = new URL(window.location.href);
            url.searchParams.delete('ref');
            window.history.replaceState({}, '', url.toString());

        } catch (e) {
            console.warn('[Referral] Visit handling error:', e);
        }
    }

    // --- STEP 2: On ANY login, check and process pending referral ---
    // Called from auth.js after successful login/signup with the logged-in user's email
    window.processReferralOnLogin = async function (visitorEmail) {
        if (!visitorEmail) return;

        const pendingRaw = localStorage.getItem(PENDING_REF_KEY);
        if (!pendingRaw) return;

        let pending;
        try { pending = JSON.parse(pendingRaw); } catch (e) { return; }

        const { code: refCode, referrerEmail, referrerId } = pending;

        // Don't count if the visitor IS the referrer
        if (visitorEmail.toLowerCase() === (referrerEmail || '').toLowerCase()) {
            console.log('[Referral] Skipping — visitor is the referrer');
            localStorage.removeItem(PENDING_REF_KEY);
            return;
        }

        try {
            const sb = await getSB();

            // Key check: has this email already been counted for this referral code?
            const { data: existingVisit } = await sb
                .from('referral_visits')
                .select('id')
                .eq('referral_code', refCode)
                .eq('visitor_fingerprint', visitorEmail.toLowerCase())
                .limit(1);

            if (existingVisit && existingVisit.length > 0) {
                console.log('[Referral] Already counted for this email, skipping.');
                localStorage.removeItem(PENDING_REF_KEY);
                return;
            }

            // Get referrer's latest stats
            const { data: owner, error: ownerErr } = await sb
                .from('profiles')
                .select('id, name, email, xp, referral_count, referral_points')
                .eq('referral_code', refCode)
                .single();

            if (ownerErr || !owner) {
                console.warn('[Referral] Referrer not found in profiles');
                localStorage.removeItem(PENDING_REF_KEY);
                return;
            }

            // Record the visit (use email as the unique fingerprint for accuracy)
            const { error: insertErr } = await sb.from('referral_visits').insert([{
                referral_code: refCode,
                visitor_fingerprint: visitorEmail.toLowerCase()
            }]);

            if (insertErr) {
                alert('[Referral Debug] Insert failed: ' + insertErr.message);
                return;
            }

            // Award XP to referrer
            const newCount   = (owner.referral_count || 0) + 1;
            const newPoints  = (owner.referral_points || 0) + REFERRAL_XP;
            const newXp      = (owner.xp || 0) + REFERRAL_XP;

            const { error: updateErr } = await sb.from('profiles').update({
                referral_count:   newCount,
                referral_points:  newPoints,
                xp:               newXp
            }).eq('id', owner.id);

            if (updateErr) {
                alert('[Referral Debug] Profile update failed: ' + updateErr.message);
            }

            // Also sync to users table for leaderboard XP
            try {
                await sb.from('users').update({ xp: newXp })
                    .eq('email', owner.email);
            } catch (_) { /* non-critical */ }

            console.log(`[Referral] ✅ ${visitorEmail} via ${refCode} → +${REFERRAL_XP}XP to ${owner.name}`);

            // Clear pending referral
            localStorage.removeItem(PENDING_REF_KEY);

            // Show award toast to the new visitor
            showReferralAwardedToast();

        } catch (e) {
            console.warn('[Referral] Login award error:', e);
        }
    };

    // Keep backward-compat alias
    window.processReferralOnSignup = window.processReferralOnLogin;

    // --- Boot: detect ?ref= in URL ---
    function boot() {
        const refCode = getRefCode();
        if (!refCode) return;
        setTimeout(() => handleRefVisit(refCode), 600);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

    // --- Referral code generator ---
    window.generateReferralCode = function (email) {
        if (!email) return '';
        const cleaned = email.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        let code = '';
        const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        for (let i = 0; i < 8; i++) {
            const charIdx = (cleaned.charCodeAt(i % cleaned.length) ^ (i * 37)) % charset.length;
            code += charset[Math.abs(charIdx)];
        }
        return code;
    };

})();
