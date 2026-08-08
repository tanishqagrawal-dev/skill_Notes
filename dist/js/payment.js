<<<<<<< Updated upstream
// js/payment.js

// Inject coupon modal CSS
(function injectCouponStyles() {
    if (document.getElementById('coupon-modal-styles')) return;
    const s = document.createElement('style');
    s.id = 'coupon-modal-styles';
    s.textContent = `
    #coupon-modal-overlay {
        position: fixed; inset: 0; z-index: 99999;
        background: rgba(0,0,0,0.75); backdrop-filter: blur(8px);
        display: flex; align-items: center; justify-content: center;
        animation: cpn-fadein 0.2s ease;
    }
    @keyframes cpn-fadein { from { opacity: 0; } to { opacity: 1; } }
    #coupon-modal-box {
        background: linear-gradient(135deg, rgba(20,20,40,0.98), rgba(10,10,30,0.98));
        border: 1px solid rgba(167,139,250,0.3);
        border-radius: 20px; padding: 2rem; width: 90%; max-width: 420px;
        box-shadow: 0 0 60px rgba(123,97,255,0.25);
        animation: cpn-slidein 0.25s ease;
    }
    @keyframes cpn-slidein { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    #coupon-modal-box h3 { margin: 0 0 0.5rem; font-size: 1.3rem; font-weight: 800;
        background: linear-gradient(135deg, #a78bfa, #60a5fa); -webkit-background-clip: text;
        -webkit-text-fill-color: transparent; background-clip: text; }
    #coupon-modal-box p { color: rgba(255,255,255,0.5); font-size: 0.85rem; margin: 0 0 1.25rem; }
    #coupon-modal-box .cpn-plan-badge {
        background: rgba(167,139,250,0.1); border: 1px solid rgba(167,139,250,0.25);
        border-radius: 10px; padding: 0.6rem 1rem; margin-bottom: 1.25rem;
        font-size: 0.85rem; color: #a78bfa; font-weight: 600; }
    #coupon-code-input {
        width: 100%; box-sizing: border-box; padding: 0.75rem 1rem;
        background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15);
        border-radius: 10px; color: #fff; font-size: 0.95rem; outline: none;
        text-transform: uppercase; letter-spacing: 1px; font-family: monospace;
        transition: border-color 0.2s; margin-bottom: 0.5rem; }
    #coupon-code-input:focus { border-color: #a78bfa; }
    #coupon-code-input::placeholder { text-transform: none; letter-spacing: 0; color: rgba(255,255,255,0.3); font-family: inherit; }
    #coupon-feedback { font-size: 0.82rem; min-height: 1.2rem; margin-bottom: 1rem; }
    #coupon-feedback.success { color: #10b981; }
    #coupon-feedback.error { color: #f87171; }
    .cpn-btn-row { display: flex; gap: 0.75rem; }
    .cpn-btn { flex: 1; padding: 0.75rem; border-radius: 10px; font-size: 0.9rem; font-weight: 700;
        cursor: pointer; border: none; transition: all 0.2s; }
    .cpn-btn-skip { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.6);
        border: 1px solid rgba(255,255,255,0.12); }
    .cpn-btn-skip:hover { background: rgba(255,255,255,0.12); color: #fff; }
    .cpn-btn-pay { background: linear-gradient(135deg, #7b61ff, #a78bfa); color: #fff;
        box-shadow: 0 4px 18px rgba(123,97,255,0.35); }
    .cpn-btn-pay:hover { box-shadow: 0 6px 24px rgba(123,97,255,0.55); transform: translateY(-1px); }
    .cpn-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }
    `;
    document.head.appendChild(s);
})();

function showCouponModal(planId, planLabel) {
    return new Promise((resolve) => {
        // Remove existing modal if any
        const existing = document.getElementById('coupon-modal-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'coupon-modal-overlay';
        overlay.innerHTML = `
            <div id="coupon-modal-box">
                <h3>🎟️ Have a Coupon?</h3>
                <p>Enter your coupon code below for a discount, or skip to proceed.</p>
                <div class="cpn-plan-badge">📦 Plan: ${planLabel}</div>
                <input type="text" id="coupon-code-input" placeholder="Enter coupon code (optional)" maxlength="30" />
                <div id="coupon-feedback"></div>
                <div class="cpn-btn-row">
                    <button class="cpn-btn cpn-btn-skip" id="cpn-skip-btn">Skip</button>
                    <button class="cpn-btn cpn-btn-pay" id="cpn-pay-btn">Proceed to Pay</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        const input = document.getElementById('coupon-code-input');
        const feedback = document.getElementById('coupon-feedback');

        document.getElementById('cpn-skip-btn').onclick = () => {
            overlay.remove();
            resolve(null);
        };

        document.getElementById('cpn-pay-btn').onclick = () => {
            const code = input.value.trim().toUpperCase() || null;
            overlay.remove();
            resolve(code);
        };

        // Close on overlay click
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                overlay.remove();
                resolve(null);
            }
        };
        input.focus();
    });
}

const PLAN_LABELS = {
    'codetantra_1mo': 'CodeTantra Hub — 1 Month',
    'codetantra_6mo': 'CodeTantra Hub — 6 Months',
    'pro_1mo': 'Premium Scholar — 1 Month',
    'pro_6mo': 'Premium Scholar — 6 Months',
};

window.handlePayment = async function(planId) {
    if (!window.auth || !window.auth.currentUser) {
        alert("Please login to upgrade your plan.");
        window.location.href = window.location.pathname.includes('/pages/') ? '../index.html' : 'index.html';
        return;
    }

    const uid = window.auth.currentUser.uid;
    const email = window.auth.currentUser.email || "";

    // Show coupon modal first
    const couponCode = await showCouponModal(planId, PLAN_LABELS[planId] || planId);

    try {
        // Show loading state
        const loadingBtn = document.activeElement;
        const originalText = loadingBtn?.innerText;
        if (loadingBtn && loadingBtn.tagName === 'BUTTON') {
            loadingBtn.innerText = "Processing...";
            loadingBtn.disabled = true;
        }

        // 1. Create Order
        const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://skil-matrix-server.onrender.com';
        
        const response = await fetch(`${apiUrl}/api/create-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ planId, uid, couponCode })
        });

        const data = await response.json();

        if (!data.success) {
            if (loadingBtn && loadingBtn.tagName === 'BUTTON') {
                loadingBtn.innerText = originalText;
                loadingBtn.disabled = false;
            }
            throw new Error(data.error || "Failed to create order");
        }

        const discountNote = couponCode ? ` (Coupon: ${couponCode})` : '';

        // 2. Open Razorpay Checkout
        const options = {
            key: data.keyId,
            amount: data.order.amount,
            currency: "INR",
            name: "SKiL MATRiX Notes",
            description: `${PLAN_LABELS[planId] || planId}${discountNote}`,
            order_id: data.order.id,
            handler: async function (response) {
                try {
                    // 3. Verify Payment
                    const verifyRes = await fetch(`${apiUrl}/api/verify-payment`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            planId,
                            uid,
                            couponCode
                        })
                    });

                    const verifyData = await verifyRes.json();
                    
                    if (verifyData.success) {
                        alert(`✅ Payment successful! Welcome to ${PLAN_LABELS[planId] || verifyData.plan} plan.`);
                        window.location.reload();
                    } else {
                        alert("Payment verification failed. If money was deducted, please contact support.");
                    }
                } catch (error) {
                    console.error("Verification Error:", error);
                    alert("Something went wrong during verification.");
                }
            },
            prefill: { email: email },
            theme: { color: "#7b61ff" },
            modal: {
                ondismiss: function() {
                    if (loadingBtn && loadingBtn.tagName === 'BUTTON') {
                        loadingBtn.innerText = originalText;
                        loadingBtn.disabled = false;
                    }
                }
            }
        };

        const rzp = new Razorpay(options);
        rzp.on('payment.failed', function (response){
            console.error(response.error);
            alert("Payment failed: " + response.error.description);
            if (loadingBtn && loadingBtn.tagName === 'BUTTON') {
                loadingBtn.innerText = originalText;
                loadingBtn.disabled = false;
            }
        });
        
        rzp.open();

    } catch (error) {
        console.error("Checkout Error:", error);
        alert(error.message || "Could not initialize checkout.");
    }
};


// --- Check and Update Pricing UI on Home Page ---
function initializePricingUI() {
    const path = window.location.pathname;
    const isHomePage = path.endsWith('index.html') || path === '/' || path.endsWith('/skill_Notes/') || path.endsWith('dist/');
    if (!isHomePage) return;

    const checkCurrentAuth = () => {
        if (window.firebaseServices && window.firebaseServices.auth && window.firebaseServices.auth.currentUser) {
            checkAndRenderSubscription(window.firebaseServices.auth.currentUser.uid);
            return true;
        }
        // Fallback for fullUser in localStorage
        const fullUser = localStorage.getItem('auth_user_full');
        if (fullUser) {
            try {
                const parsed = JSON.parse(fullUser);
                if (parsed && (parsed.uid || parsed.id)) {
                    checkAndRenderSubscription(parsed.uid || parsed.id);
                    return true;
                }
            } catch (e) {}
        }
        return false;
    };

    if (!checkCurrentAuth()) {
        window.addEventListener('auth-ready', (e) => {
            const uid = e.detail?.user?.uid || e.detail?.id;
            if (uid) checkAndRenderSubscription(uid);
        });
    }
}
initializePricingUI();


async function checkAndRenderSubscription(uid) {
    try {
        const { supabase } = await import('./supabase-config.js?v=1.0');
        const { data, error } = await supabase
            .from('user_plans')
            .select('*')
            .eq('firebase_uid', uid)
            .single();

        if (!error && data) {
            let planId = data.plan_id;
            const expiry = data.plan_expiry ? new Date(data.plan_expiry) : null;
            if (expiry && expiry < new Date()) planId = 'free';

            if (planId !== 'free') {
                updatePricingUI(planId, expiry);
            }
        }
    } catch (err) {
        console.warn("Could not fetch user plan for pricing UI", err);
    }
}

function updatePricingUI(planId, expiry) {
    const pricingCards = document.querySelectorAll('.pricing-card-wrapper');
    if (!pricingCards || pricingCards.length === 0) return;

    let targetCardIndex = -1;
    if (planId === 'codetantra' || planId?.startsWith('codetantra')) targetCardIndex = 1;
    if (planId === 'pro' || planId?.startsWith('pro')) targetCardIndex = 2;

    if (targetCardIndex !== -1 && pricingCards[targetCardIndex]) {
        const activeCard = pricingCards[targetCardIndex].querySelector('.premium-pricing-card');
        if (!activeCard) return;
        
        // Remove existing badge if any
        const existingBadge = activeCard.querySelector('.popular-badge');
        if (existingBadge) existingBadge.remove();

        // Add Active Subscription badge
        const badge = document.createElement('div');
        badge.className = 'popular-badge';
        badge.style.background = '#00ff88';
        badge.style.color = '#000';
        badge.innerText = 'ACTIVE SUBSCRIPTION';
        activeCard.insertBefore(badge, activeCard.firstChild);

        // Highlight card border
        activeCard.style.border = '2px solid #00ff88';
        activeCard.style.boxShadow = '0 0 30px rgba(0,255,136,0.2)';

        // Update expiry text in the price section if needed
        const priceSection = activeCard.querySelector('.price');
        if (priceSection) {
            const formatDate = (d) => {
                if (!d) return '—';
                return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            };
            const expiryText = expiry ? `Expires on ${formatDate(expiry)}` : 'Active';
            priceSection.innerHTML += `<div style="font-size: 0.9rem; opacity: 0.9; margin-top: 10px; color: #00ff88;">${expiryText}</div>`;
        }

        // Update card wrapper click destination when subscription is already active
        pricingCards[targetCardIndex].onclick = () => window.location.href = 'pages/dashboard#/notes';

        // Change the action button to "Go to Dashboard"
        const flexContainer = activeCard.querySelector('div[style*="display: flex"]');
        if (flexContainer && flexContainer !== activeCard) {
            flexContainer.innerHTML = `
                <button class="btn btn-primary btn-full" onclick="event.stopPropagation(); window.location.href='pages/dashboard#/notes'">Go to Dashboard</button>
            `;
        } else {
            const oldBtn = activeCard.querySelector('button');
            if (oldBtn) {
                const newBtn = document.createElement('button');
                newBtn.className = 'btn btn-primary btn-full';
                newBtn.onclick = (e) => {
                    if (e) e.stopPropagation();
                    window.location.href = 'pages/dashboard#/notes';
                };
                newBtn.innerText = 'Go to Dashboard';
                oldBtn.replaceWith(newBtn);
            }
        }
    }
}
=======
const _0x1d4e1f=_0x3f32;(function(_0x70611f,_0x124af5){const _0xfce6f4=_0x3f32,_0x3b3072=_0x70611f();while(!![]){try{const _0x11f289=parseInt(_0xfce6f4(0x96))/(-0x1*0x239b+-0x1*-0x53b+-0x4d*-0x65)+-parseInt(_0xfce6f4(0x17a))/(-0x19c1+-0x19ab*0x1+-0xe3*-0x3a)*(-parseInt(_0xfce6f4(0x21a))/(0x25be+0x986+-0x2f41))+parseInt(_0xfce6f4(0x80))/(0x1bb5+-0x503*0x5+0x2a2*-0x1)*(parseInt(_0xfce6f4(0x2b5))/(0x23b3*-0x1+0x204c+-0x124*-0x3))+parseInt(_0xfce6f4(0x2b8))/(-0x19a7*-0x1+-0xeb1+-0xaf0)*(-parseInt(_0xfce6f4(0x2db))/(0xb*-0xbf+0x7*-0x205+0x1*0x165f))+-parseInt(_0xfce6f4(0x26a))/(0x3e9+0x4e+-0x42f)*(-parseInt(_0xfce6f4(0x2a7))/(0xe6c*-0x2+0x2*-0xef1+-0x133*-0x31))+parseInt(_0xfce6f4(0x2c0))/(0xc*0x24e+0x1a*0x96+-0xa*0x449)+-parseInt(_0xfce6f4(0x92))/(0xed6+0x12cc+-0x2197);if(_0x11f289===_0x124af5)break;else _0x3b3072['push'](_0x3b3072['shift']());}catch(_0x2d1387){_0x3b3072['push'](_0x3b3072['shift']());}}}(_0x2a29,-0x10a*0x67f+-0xe71f*-0x4+0x8e*0xcb3),function injectCouponStyles(){const _0x19cab7=_0x3f32,_0x3693a0={'wumqo':function(_0x21fcb4,_0x55720c){return _0x21fcb4(_0x55720c);},'lxCYi':_0x19cab7(0x251),'uvbgT':function(_0x3759c7,_0x1daf6c){return _0x3759c7!==_0x1daf6c;},'YhCLW':_0x19cab7(0x294),'xGATp':function(_0x4e0a3a,_0x13a1f9){return _0x4e0a3a===_0x13a1f9;},'eVQrV':'YCScw','CQdOj':_0x19cab7(0xd1),'QtuZD':'(((.+)+)+)'+'+$','GDkIU':function(_0x33335a,_0x55f8e1,_0x139442){return _0x33335a(_0x55f8e1,_0x139442);},'hUrRh':function(_0xf1400a){return _0xf1400a();},'EZkOs':_0x19cab7(0x29a)+_0x19cab7(0x29b),'vXYUW':'style'},_0x3daad9=(function(){const _0x491d80=_0x19cab7,_0x4d5ea1={'InQva':function(_0x3a0a43,_0x35d9ad){const _0x11c986=_0x3f32;return _0x3693a0[_0x11c986(0xab)](_0x3a0a43,_0x35d9ad);},'JoHew':function(_0x58a9ab,_0x183e21){return _0x58a9ab!==_0x183e21;},'swUol':_0x3693a0[_0x491d80(0x1a4)],'AwBmo':function(_0x5e2971,_0x383491){const _0x2077cd=_0x491d80;return _0x3693a0[_0x2077cd(0xaa)](_0x5e2971,_0x383491);},'xAqTJ':_0x3693a0[_0x491d80(0x141)]};let _0x1b539b=!![];return function(_0xdbcfda,_0x508fb2){const _0xef64ec=_0x1b539b?function(){const _0x98af1a=_0x3f32,_0x1929cc={'TqmaJ':function(_0x3bb927,_0x4a6d91){const _0x4c0435=_0x3f32;return _0x4d5ea1[_0x4c0435(0x1bc)](_0x3bb927,_0x4a6d91);}};if(_0x4d5ea1[_0x98af1a(0x215)]('SZCZv',_0x4d5ea1[_0x98af1a(0x156)])){if(_0x508fb2){if(_0x4d5ea1[_0x98af1a(0x281)]('FDfPM',_0x4d5ea1[_0x98af1a(0x1e3)])){const _0x273d2b=_0x508fb2[_0x98af1a(0x131)](_0xdbcfda,arguments);return _0x508fb2=null,_0x273d2b;}else return _0x1929cc[_0x98af1a(0x8b)](_0x5ec133,_0x8e380b['uid']||_0x17361b['id']),!![];}}else _0x449ad3['remove'](),_0x1929cc[_0x98af1a(0x8b)](_0x141f3b,null);}:function(){};return _0x1b539b=![],_0xef64ec;};}()),_0x489b73=_0x3693a0['GDkIU'](_0x3daad9,this,function(){const _0x2c83b4=_0x19cab7,_0x1373ca={};_0x1373ca['UoJqf']=_0x2c83b4(0x2e9)+'+$';const _0x4512be=_0x1373ca;return _0x3693a0[_0x2c83b4(0x177)](_0x3693a0[_0x2c83b4(0xd0)],_0x3693a0[_0x2c83b4(0x191)])?_0x1fda6b['toString']()[_0x2c83b4(0x289)](HcmLoC['UoJqf'])[_0x2c83b4(0x161)]()[_0x2c83b4(0x2ab)+'r'](_0x1f9572)[_0x2c83b4(0x289)](HcmLoC[_0x2c83b4(0x272)]):_0x489b73[_0x2c83b4(0x161)]()['search'](_0x3693a0[_0x2c83b4(0xf4)])[_0x2c83b4(0x161)]()[_0x2c83b4(0x2ab)+'r'](_0x489b73)[_0x2c83b4(0x289)](_0x3693a0[_0x2c83b4(0xf4)]);});_0x3693a0[_0x19cab7(0x1ee)](_0x489b73);if(document[_0x19cab7(0xbd)+_0x19cab7(0x172)](_0x3693a0[_0x19cab7(0x255)]))return;const _0x35ebbb=document['createElem'+_0x19cab7(0x284)](_0x3693a0[_0x19cab7(0x9d)]);_0x35ebbb['id']=_0x3693a0[_0x19cab7(0x255)],_0x35ebbb[_0x19cab7(0x18f)+'t']=_0x19cab7(0x28c)+_0x19cab7(0x2b9)+_0x19cab7(0xb2)+_0x19cab7(0x2df)+_0x19cab7(0xfd)+_0x19cab7(0x84)+_0x19cab7(0x14e)+'x:\x2099999;\x0a'+_0x19cab7(0x139)+_0x19cab7(0x1e7)+_0x19cab7(0xdc)+',0.75);\x20ba'+'ckdrop-fil'+_0x19cab7(0x229)+'8px);\x0a\x20\x20\x20\x20'+_0x19cab7(0xef)+_0x19cab7(0xcb)+_0x19cab7(0x29e)+_0x19cab7(0xd4)+_0x19cab7(0x1af)+_0x19cab7(0xb5)+_0x19cab7(0x143)+_0x19cab7(0xcc)+'on:\x20cpn-fa'+_0x19cab7(0xa2)+'ease;\x0a\x20\x20\x20\x20'+_0x19cab7(0x136)+_0x19cab7(0xde)+_0x19cab7(0x2a5)+_0x19cab7(0x26c)+_0x19cab7(0x1ca)+_0x19cab7(0x110)+_0x19cab7(0x15f)+_0x19cab7(0x14d)+'pon-modal-'+_0x19cab7(0x2e5)+_0x19cab7(0x14a)+_0x19cab7(0x113)+_0x19cab7(0xa0)+'t(135deg,\x20'+_0x19cab7(0x197)+_0x19cab7(0xaf)+_0x19cab7(0x293)+_0x19cab7(0x1d6)+_0x19cab7(0x230)+_0x19cab7(0x267)+_0x19cab7(0x2d9)+_0x19cab7(0x246)+'9,250,0.3)'+_0x19cab7(0x13a)+_0x19cab7(0x20a)+_0x19cab7(0xe0)+_0x19cab7(0x107)+_0x19cab7(0x190)+'h:\x2090%;\x20ma'+_0x19cab7(0x2c3)+_0x19cab7(0x25d)+_0x19cab7(0xdf)+_0x19cab7(0x196)+_0x19cab7(0x2a2)+'123,97,255'+_0x19cab7(0x257)+_0x19cab7(0x17f)+'ation:\x20cpn'+_0x19cab7(0x201)+_0x19cab7(0x13d)+'\x0a\x20\x20\x20\x20}\x0a\x20\x20\x20'+_0x19cab7(0x19a)+'s\x20cpn-slid'+_0x19cab7(0x1a2)+'\x20{\x20transfo'+_0x19cab7(0x8c)+_0x19cab7(0x1fa)+';\x20opacity:'+_0x19cab7(0xa8)+_0x19cab7(0x2d8)+_0x19cab7(0xa4)+_0x19cab7(0x20b)+_0x19cab7(0xfa)+'\x20}\x0a\x20\x20\x20\x20#co'+_0x19cab7(0x224)+_0x19cab7(0xf8)+_0x19cab7(0x1b9)+'0\x200.5rem;\x20'+'font-size:'+_0x19cab7(0x1e8)+'ont-weight'+_0x19cab7(0x2b7)+'\x20\x20\x20\x20\x20backg'+_0x19cab7(0x103)+_0x19cab7(0x2aa)+_0x19cab7(0x212)+_0x19cab7(0xee)+_0x19cab7(0xe1)+_0x19cab7(0x124)+'ckground-c'+_0x19cab7(0x20d)+_0x19cab7(0x11b)+_0x19cab7(0x27c)+_0x19cab7(0x211)+('or:\x20transp'+_0x19cab7(0x268)+_0x19cab7(0x252)+_0x19cab7(0x133)+_0x19cab7(0x14d)+_0x19cab7(0x1f1)+_0x19cab7(0x1ae)+_0x19cab7(0x1bf)+_0x19cab7(0x116)+_0x19cab7(0x287)+'nt-size:\x200'+_0x19cab7(0x270)+'rgin:\x200\x200\x20'+_0x19cab7(0xc5)+_0x19cab7(0x28c)+_0x19cab7(0x130)+'ox\x20.cpn-pl'+_0x19cab7(0x176)+_0x19cab7(0x1b6)+_0x19cab7(0x185)+_0x19cab7(0xe3)+_0x19cab7(0x2a9)+_0x19cab7(0x1a7)+_0x19cab7(0xba)+'d\x20rgba(167'+_0x19cab7(0x2b2)+'.25);\x0a\x20\x20\x20\x20'+_0x19cab7(0x150)+_0x19cab7(0xc1)+_0x19cab7(0xae)+_0x19cab7(0x105)+_0x19cab7(0x292)+_0x19cab7(0x85)+_0x19cab7(0xbe)+_0x19cab7(0xc6)+'ont-size:\x20'+_0x19cab7(0x89)+_0x19cab7(0x93)+'bfa;\x20font-'+_0x19cab7(0x2ca)+_0x19cab7(0x214)+'coupon-cod'+'e-input\x20{\x0a'+'\x20\x20\x20\x20\x20\x20\x20\x20wi'+_0x19cab7(0x25f)+_0x19cab7(0x22e)+_0x19cab7(0x25a)+_0x19cab7(0x1b7)+_0x19cab7(0x207)+_0x19cab7(0x254)+_0x19cab7(0x203)+_0x19cab7(0x1ea)+_0x19cab7(0x231)+_0x19cab7(0x216)+_0x19cab7(0x218)+_0x19cab7(0xe8)+_0x19cab7(0xa6)+_0x19cab7(0x235)+_0x19cab7(0x98)+'\x20\x20border-r'+_0x19cab7(0x209)+_0x19cab7(0x21d)+'#fff;\x20font'+'-size:\x200.9'+_0x19cab7(0x193)+_0x19cab7(0x2bf)+_0x19cab7(0x2d0)+_0x19cab7(0x17e)+_0x19cab7(0x1b4)+_0x19cab7(0x175)+_0x19cab7(0x219)+':\x201px;\x20fon'+'t-family:\x20'+_0x19cab7(0x12d)+_0x19cab7(0x2d0)+_0x19cab7(0x2cf)+_0x19cab7(0x21c)+_0x19cab7(0x29f)+_0x19cab7(0xf1)+_0x19cab7(0x1da)+'m;\x20}\x0a\x20\x20\x20\x20#'+'coupon-cod'+_0x19cab7(0x20e)+_0x19cab7(0x28b)+'er-color:\x20'+_0x19cab7(0x291)+_0x19cab7(0x28c)+_0x19cab7(0x265)+_0x19cab7(0x299)+_0x19cab7(0xf2)+_0x19cab7(0x17e)+'orm:\x20none;'+'\x20letter-sp'+_0x19cab7(0x240)+'color:\x20rgb'+_0x19cab7(0x16c)+'255,0.3);\x20'+'font-famil'+'y:\x20inherit'+_0x19cab7(0x106))+(_0x19cab7(0x26e)+_0x19cab7(0xc7)+_0x19cab7(0x2af)+_0x19cab7(0x115)+_0x19cab7(0x1aa)+_0x19cab7(0x192)+_0x19cab7(0x85)+_0x19cab7(0x2d5)+'\x20\x20\x20\x20#coupo'+_0x19cab7(0x1dd)+_0x19cab7(0x2dd)+_0x19cab7(0x1a9)+_0x19cab7(0x24d)+_0x19cab7(0x15d)+'-feedback.'+'error\x20{\x20co'+_0x19cab7(0x12b)+_0x19cab7(0x81)+'.cpn-btn-r'+_0x19cab7(0x120)+_0x19cab7(0x1e4)+_0x19cab7(0x162)+'em;\x20}\x0a\x20\x20\x20\x20'+_0x19cab7(0x1d8)+_0x19cab7(0x147)+_0x19cab7(0x259)+_0x19cab7(0x28f)+_0x19cab7(0x21f)+'s:\x2010px;\x20f'+_0x19cab7(0x233)+_0x19cab7(0x200)+_0x19cab7(0xad)+_0x19cab7(0x140)+_0x19cab7(0x16e)+_0x19cab7(0xb1)+_0x19cab7(0x285)+_0x19cab7(0x1f9)+'ition:\x20all'+'\x200.2s;\x20}\x0a\x20'+_0x19cab7(0x1de)+_0x19cab7(0x2d4)+'ackground:'+_0x19cab7(0x183)+_0x19cab7(0x1d1)+_0x19cab7(0x1b0)+_0x19cab7(0x111)+',255,255,0'+_0x19cab7(0x181)+_0x19cab7(0x237)+_0x19cab7(0xc2)+_0x19cab7(0x183)+_0x19cab7(0x1d1)+_0x19cab7(0x262)+_0x19cab7(0x184)+_0x19cab7(0x173)+'\x20{\x20backgro'+'und:\x20rgba('+'255,255,25'+_0x19cab7(0x121)+_0x19cab7(0x1b1)+_0x19cab7(0x2d2)+_0x19cab7(0x104)+_0x19cab7(0xc9)+_0x19cab7(0x125)+_0x19cab7(0xe7)+_0x19cab7(0x148)+_0x19cab7(0xa7)+_0x19cab7(0x290)+_0x19cab7(0x253)+_0x19cab7(0x1b6)+'ox-shadow:'+_0x19cab7(0x296)+_0x19cab7(0x1a3)+',97,255,0.'+_0x19cab7(0x2a1)+_0x19cab7(0x184)+_0x19cab7(0x19c)+_0x19cab7(0xd6)+_0x19cab7(0x22d)+_0x19cab7(0x24c)+'123,97,255'+',0.55);\x20tr'+'ansform:\x20t'+'ranslateY('+_0x19cab7(0x2e3)+_0x19cab7(0x1de)+'n:disabled'+_0x19cab7(0x17d)+_0x19cab7(0x145)+_0x19cab7(0x2a3)+'llowed;\x20tr'+'ansform:\x20n'+'one\x20!impor'+_0x19cab7(0x2c5)+'\x20\x20'),document[_0x19cab7(0x7f)]['appendChil'+'d'](_0x35ebbb);}());function showCouponModal(_0x207bd1,_0x1ebcf4){const _0x14c1a3=_0x3f32,_0x5a0da4={'DbFZv':function(_0x861ea1,_0x37032a){return _0x861ea1!==_0x37032a;},'DChsN':_0x14c1a3(0x138),'WjNni':function(_0x1a09ce,_0x14dd65){return _0x1a09ce===_0x14dd65;},'pILRS':function(_0x3add74,_0x229a39){return _0x3add74(_0x229a39);},'OmGZY':'coupon-mod'+_0x14c1a3(0x174),'AsXKv':_0x14c1a3(0x83)+_0x14c1a3(0x2e1),'cObpf':_0x14c1a3(0x2a6)+_0x14c1a3(0x282)};return new Promise(_0x407d6e=>{const _0x126443=_0x14c1a3,_0x371d0b={'XhYxV':function(_0x21b59d,_0x47238c){const _0x5932da=_0x3f32;return _0x5a0da4[_0x5932da(0x2c7)](_0x21b59d,_0x47238c);}},_0x1c5030=document['getElement'+_0x126443(0x172)](_0x5a0da4[_0x126443(0x1e0)]);if(_0x1c5030)_0x1c5030['remove']();const _0x1dc4dc=document[_0x126443(0xb0)+_0x126443(0x284)](_0x126443(0x217));_0x1dc4dc['id']=_0x5a0da4[_0x126443(0x1e0)],_0x1dc4dc[_0x126443(0x220)]='\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20'+'\x20\x20\x20<div\x20id'+_0x126443(0x24f)+_0x126443(0x13f)+_0x126443(0x2b0)+'\x20\x20\x20\x20\x20\x20\x20<h3'+_0x126443(0x8f)+_0x126443(0x91)+_0x126443(0x245)+_0x126443(0x2da)+_0x126443(0x206)+_0x126443(0x2a8)+_0x126443(0x1ec)+_0x126443(0xe5)+_0x126443(0x2ce)+_0x126443(0x23f)+_0x126443(0x128)+'\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20'+_0x126443(0x1c1)+_0x126443(0x152)+'pn-plan-ba'+_0x126443(0x13b)+_0x126443(0xb6)+_0x1ebcf4+(_0x126443(0x273)+_0x126443(0x1c5)+'\x20\x20\x20<input\x20'+_0x126443(0x155)+_0x126443(0x15c)+_0x126443(0x265)+_0x126443(0x2c6)+_0x126443(0x1ac)+_0x126443(0x119)+'\x20code\x20(opt'+_0x126443(0x19b)+_0x126443(0xf5)+'0\x22\x20/>\x0a\x20\x20\x20\x20'+'\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20'+_0x126443(0x2a0)+_0x126443(0x142)+_0x126443(0x227)+_0x126443(0x167)+'\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20'+_0x126443(0x2bd)+_0x126443(0x2e4)+_0x126443(0xe2)+_0x126443(0x1c5)+_0x126443(0x1ba)+_0x126443(0x258)+_0x126443(0x135)+_0x126443(0x1fc)+_0x126443(0x2de)+'n-skip-btn'+_0x126443(0x210)+_0x126443(0x114)+_0x126443(0x1c5)+'\x20\x20\x20\x20\x20\x20<but'+'ton\x20class='+_0x126443(0x23d)+_0x126443(0x104)+_0x126443(0x29c)+'pay-btn\x22>P'+_0x126443(0xbf)+_0x126443(0x260)+_0x126443(0xb3)+_0x126443(0x2da)+_0x126443(0x28a)+_0x126443(0x2e6)+_0x126443(0x167)+'\x20\x20\x20'),document['body'][_0x126443(0x24b)+'d'](_0x1dc4dc);const _0x4b78db=document[_0x126443(0xbd)+_0x126443(0x172)](_0x5a0da4['AsXKv']),_0x1ed748=document[_0x126443(0xbd)+_0x126443(0x172)](_0x5a0da4['cObpf']);document['getElement'+_0x126443(0x172)](_0x126443(0x97)+'tn')[_0x126443(0x164)]=()=>{_0x1dc4dc['remove'](),_0x407d6e(null);},document[_0x126443(0xbd)+'ById']('cpn-pay-bt'+'n')[_0x126443(0x164)]=()=>{const _0x496a02=_0x126443,_0x263da0=_0x4b78db[_0x496a02(0x8d)][_0x496a02(0x27d)]()[_0x496a02(0x1b5)+'e']()||null;_0x1dc4dc[_0x496a02(0x1cf)](),_0x371d0b[_0x496a02(0x151)](_0x407d6e,_0x263da0);},_0x1dc4dc['onclick']=_0x18ede6=>{const _0x135735=_0x126443;_0x5a0da4[_0x135735(0x11a)]('nBdqD',_0x5a0da4[_0x135735(0x1e1)])?_0x5a0da4[_0x135735(0x24e)](_0x18ede6[_0x135735(0x1a0)],_0x1dc4dc)&&(_0x1dc4dc[_0x135735(0x1cf)](),_0x407d6e(null)):(_0x338ffc[_0x135735(0x16f)]=_0x47b45d,_0x1943ac[_0x135735(0x1cc)]=![]);},_0x4b78db['focus']();});}const _0x5e908d={};_0x5e908d['codetantra'+_0x1d4e1f(0x228)]='CodeTantra'+_0x1d4e1f(0x22c)+'onth',_0x5e908d[_0x1d4e1f(0xe9)+_0x1d4e1f(0x261)]=_0x1d4e1f(0x205)+'\x20Hub\x20—\x206\x20M'+_0x1d4e1f(0x100),_0x5e908d[_0x1d4e1f(0x1e6)]=_0x1d4e1f(0x12c)+'holar\x20—\x201\x20'+_0x1d4e1f(0x25e),_0x5e908d[_0x1d4e1f(0x275)]=_0x1d4e1f(0x12c)+_0x1d4e1f(0x14f)+_0x1d4e1f(0x23a);function _0x3f32(_0x141bb1,_0x2494ec){_0x141bb1=_0x141bb1-(0x4*0x6fc+-0xae9+-0x53*0x33);const _0x3fc728=_0x2a29();let _0x1bebca=_0x3fc728[_0x141bb1];if(_0x3f32['XoxvEk']===undefined){var _0xbd23a=function(_0x5f0ede){const _0x47c70c='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=';let _0x463fd6='',_0x5013a8='',_0x367d19=_0x463fd6+_0xbd23a;for(let _0x479b26=-0x171b+-0x1b21*-0x1+-0x203*0x2,_0x18eb2d,_0x2c9f58,_0x5db2d7=-0x25ac+0xb38+-0x2*-0xd3a;_0x2c9f58=_0x5f0ede['charAt'](_0x5db2d7++);~_0x2c9f58&&(_0x18eb2d=_0x479b26%(0x699*-0x2+0x12c2+-0x58c)?_0x18eb2d*(-0xa08+-0x1a*-0xa9+-0x6e2*0x1)+_0x2c9f58:_0x2c9f58,_0x479b26++%(-0x2*0x634+-0x3*-0x62f+-0x3*0x20b))?_0x463fd6+=_0x367d19['charCodeAt'](_0x5db2d7+(-0x13cc+-0x2520+0x38f6))-(0x182*0x17+0xc5a+-0x2efe)!==0x19*-0x163+-0x2320+0x45cb?String['fromCharCode'](-0x1d92+0xee6+0x3*0x539&_0x18eb2d>>(-(0x940+-0x175a+-0x3*-0x4b4)*_0x479b26&-0x2088+-0x7cf*0x4+0x3fca)):_0x479b26:-0x13e4+0x212+0x11d2){_0x2c9f58=_0x47c70c['indexOf'](_0x2c9f58);}for(let _0x46be37=-0x1d14+-0x1316+0x302a,_0x2ee55d=_0x463fd6['length'];_0x46be37<_0x2ee55d;_0x46be37++){_0x5013a8+='%'+('00'+_0x463fd6['charCodeAt'](_0x46be37)['toString'](-0x125*-0x1+0x8ab*0x2+-0x126b))['slice'](-(0x713+0x13ea+-0x1afb));}return decodeURIComponent(_0x5013a8);};_0x3f32['vrtnBI']=_0xbd23a,_0x3f32['iahryl']={},_0x3f32['XoxvEk']=!![];}const _0xc26188=_0x3fc728[-0x6*0xaa+-0x2*-0xfda+-0x1bb8],_0x4649b6=_0x141bb1+_0xc26188,_0x16085d=_0x3f32['iahryl'][_0x4649b6];if(!_0x16085d){const _0xfaa068=function(_0x37944a){this['QUWvGa']=_0x37944a,this['KGlEgm']=[-0x849*0x1+0x1cfd*0x1+-0x1*0x14b3,0xc*-0xc5+0x555+0x3e7,-0x6f9+0x23f8+-0x1cff],this['fDFsSI']=function(){return'newState';},this['XDcNfx']='\x5cw+\x20*\x5c(\x5c)\x20*{\x5cw+\x20*',this['ohjwIn']='[\x27|\x22].+[\x27|\x22];?\x20*}';};_0xfaa068['prototype']['NFSdeG']=function(){const _0x35c1f1=new RegExp(this['XDcNfx']+this['ohjwIn']),_0x29a892=_0x35c1f1['test'](this['fDFsSI']['toString']())?--this['KGlEgm'][0xe*-0x22c+-0x2f3+0x215c]:--this['KGlEgm'][0x7*-0x4dd+0x3*0xab5+-0xa4*-0x3];return this['JuCknY'](_0x29a892);},_0xfaa068['prototype']['JuCknY']=function(_0x3937a4){if(!Boolean(~_0x3937a4))return _0x3937a4;return this['CBcWKF'](this['QUWvGa']);},_0xfaa068['prototype']['CBcWKF']=function(_0x492702){for(let _0x50c4a3=0xb3*-0x9+0x1b89+-0x153e,_0x547a0d=this['KGlEgm']['length'];_0x50c4a3<_0x547a0d;_0x50c4a3++){this['KGlEgm']['push'](Math['round'](Math['random']())),_0x547a0d=this['KGlEgm']['length'];}return _0x492702(this['KGlEgm'][0x14fb+-0x1a3a+0x53f]);},new _0xfaa068(_0x3f32)['NFSdeG'](),_0x1bebca=_0x3f32['vrtnBI'](_0x1bebca),_0x3f32['iahryl'][_0x4649b6]=_0x1bebca;}else _0x1bebca=_0x16085d;return _0x1bebca;}const PLAN_LABELS=_0x5e908d;window[_0x1d4e1f(0x149)+_0x1d4e1f(0x284)]=async function(_0x4fa2d6){const _0x1edd50=_0x1d4e1f,_0x48e4d4={'DDJPU':function(_0x440b0b,_0x3b83e8){return _0x440b0b(_0x3b83e8);},'CYgaW':function(_0xada10f,_0x29a217){return _0xada10f+_0x29a217;},'sAyCm':function(_0x67e3eb,_0x165331){return _0x67e3eb===_0x165331;},'dJxWl':_0x1edd50(0x9c),'qTqJp':function(_0x48a92b,_0x2ef268,_0x4d64c3){return _0x48a92b(_0x2ef268,_0x4d64c3);},'HSCet':function(_0x28de26,_0x263d4e){return _0x28de26(_0x263d4e);},'Ptvhr':function(_0x1fe10f,_0x18d8fe){return _0x1fe10f!==_0x18d8fe;},'ALIIm':_0x1edd50(0xb7),'ibRTS':_0x1edd50(0xd9),'uxTNG':_0x1edd50(0x1b2)+_0x1edd50(0x1c9),'AxDxH':function(_0x3f010c,_0x49c3d1){return _0x3f010c!==_0x49c3d1;},'vlFqP':_0x1edd50(0x154),'lHsfN':_0x1edd50(0x11f)+_0x1edd50(0x102)+_0x1edd50(0x2e7)+_0x1edd50(0x1f7)+_0x1edd50(0x1fe)+_0x1edd50(0x171)+_0x1edd50(0x199)+_0x1edd50(0xa1),'Bndog':function(_0x140aa3,_0x40d153){return _0x140aa3(_0x40d153);},'ASSCd':_0x1edd50(0x22b)+_0x1edd50(0x1ff)+'\x20during\x20ve'+_0x1edd50(0x102)+'.','rFMfo':function(_0x307e8a,_0x2507d8){return _0x307e8a===_0x2507d8;},'kfoFK':function(_0x11c12e,_0xcc400f){return _0x11c12e(_0xcc400f);},'AaRfc':_0x1edd50(0x168)+_0x1edd50(0x2e0),'TZxKP':function(_0x46765c,_0x5e2d99){return _0x46765c===_0x5e2d99;},'lqyra':function(_0xb9c951,_0x12ef28){return _0xb9c951(_0x12ef28);},'FEplH':_0x1edd50(0x2be)+_0x1edd50(0x12a)+_0x1edd50(0x1c6)+_0x1edd50(0x18a),'JfzTp':_0x1edd50(0x1bb),'IAWwk':_0x1edd50(0xeb)+_0x1edd50(0x1d4),'uxWgs':function(_0x568eb4,_0x1ba997){return _0x568eb4!==_0x1ba997;},'GBmZV':_0x1edd50(0x146),'WweAS':'Processing'+_0x1edd50(0x1f4),'omNWV':_0x1edd50(0x2b1),'EUJzy':_0x1edd50(0xfe)+_0x1edd50(0xd3)+_0x1edd50(0x1bd)+'ender.com','Ionyd':_0x1edd50(0x26b),'APsgO':_0x1edd50(0xd7),'klnEX':_0x1edd50(0x1d9),'aaZhf':_0x1edd50(0x242)+_0x1edd50(0x1a8),'MBgxM':_0x1edd50(0x137),'qZrMY':'payment.fa'+_0x1edd50(0x123),'AkWYN':_0x1edd50(0x20f)+_0x1edd50(0x127),'oIHhc':_0x1edd50(0x1d0)+_0x1edd50(0x8e)+_0x1edd50(0x18b)};if(!window['auth']||!window['auth'][_0x1edd50(0x295)+'r']){_0x48e4d4[_0x1edd50(0x15a)](alert,_0x48e4d4['FEplH']),window['location'][_0x1edd50(0x188)]=window[_0x1edd50(0xce)][_0x1edd50(0x27f)][_0x1edd50(0x25c)](_0x48e4d4[_0x1edd50(0x122)])?_0x48e4d4[_0x1edd50(0x11e)]:_0x1edd50(0xc4);return;}const _0x1c2d20=window[_0x1edd50(0x222)]['currentUse'+'r']['uid'],_0x635d83=window[_0x1edd50(0x222)]['currentUse'+'r']['email']||'',_0x42b9e7=await showCouponModal(_0x4fa2d6,PLAN_LABELS[_0x4fa2d6]||_0x4fa2d6);try{const _0x1caa62=document['activeElem'+_0x1edd50(0x284)],_0x363cde=_0x1caa62?.[_0x1edd50(0x16f)];_0x1caa62&&_0x48e4d4['TZxKP'](_0x1caa62[_0x1edd50(0x118)],_0x48e4d4[_0x1edd50(0x2ae)])&&(_0x48e4d4[_0x1edd50(0x132)](_0x1edd50(0x146),_0x48e4d4[_0x1edd50(0x2cc)])?(_0x2c16f4[_0x1edd50(0x101)](_0x487f92[_0x1edd50(0x101)]),_0x48e4d4[_0x1edd50(0x159)](_0x410c6a,_0x48e4d4[_0x1edd50(0x18c)]('Payment\x20fa'+_0x1edd50(0x2e0),_0x113373[_0x1edd50(0x101)][_0x1edd50(0xd8)+'n'])),_0x1f1c49&&_0x48e4d4[_0x1edd50(0x157)](_0x6232d8[_0x1edd50(0x118)],_0x48e4d4[_0x1edd50(0x2ae)])&&(_0x5a2ae2[_0x1edd50(0x16f)]=_0x403352,_0x3342eb['disabled']=![])):(_0x1caa62['innerText']=_0x48e4d4[_0x1edd50(0x223)],_0x1caa62[_0x1edd50(0x1cc)]=!![]));const _0x22e046=_0x48e4d4[_0x1edd50(0x1f8)](window[_0x1edd50(0xce)]['hostname'],_0x48e4d4[_0x1edd50(0x1d3)])?'http://loc'+_0x1edd50(0x15e)+'0':_0x48e4d4['EUJzy'],_0x355d9f={};_0x355d9f[_0x1edd50(0xa3)+'pe']='applicatio'+_0x1edd50(0x1c9);const _0x47e453={};_0x47e453['planId']=_0x4fa2d6,_0x47e453[_0x1edd50(0x208)]=_0x1c2d20,_0x47e453[_0x1edd50(0x1b8)]=_0x42b9e7;const _0x183234=await fetch(_0x22e046+('/api/creat'+_0x1edd50(0x10a)),{'method':_0x48e4d4['ibRTS'],'headers':_0x355d9f,'body':JSON['stringify'](_0x47e453)}),_0x2b6ca1=await _0x183234['json']();if(!_0x2b6ca1['success']){_0x1caa62&&_0x48e4d4[_0x1edd50(0x157)](_0x1caa62[_0x1edd50(0x118)],_0x48e4d4[_0x1edd50(0x2ae)])&&(_0x48e4d4[_0x1edd50(0x157)](_0x48e4d4[_0x1edd50(0x129)],_0x48e4d4[_0x1edd50(0x1f3)])?_0x48e4d4['qTqJp'](_0x3e0f59,_0x2825e5,_0x2a08bc):(_0x1caa62[_0x1edd50(0x16f)]=_0x363cde,_0x1caa62['disabled']=![]));throw new Error(_0x2b6ca1['error']||_0x1edd50(0x10f)+_0x1edd50(0x165)+'er');}const _0x1654a8=_0x42b9e7?_0x1edd50(0x170)+_0x42b9e7+')':'',_0x2110e9={};_0x2110e9[_0x1edd50(0x2bc)]=_0x635d83;const _0xfd17e6={'key':_0x2b6ca1[_0x1edd50(0x126)],'amount':_0x2b6ca1[_0x1edd50(0x189)][_0x1edd50(0x1c7)],'currency':_0x48e4d4['klnEX'],'name':_0x48e4d4[_0x1edd50(0x28e)],'description':''+(PLAN_LABELS[_0x4fa2d6]||_0x4fa2d6)+_0x1654a8,'order_id':_0x2b6ca1['order']['id'],'handler':async function(_0xe5bd06){const _0x230cbb=_0x1edd50,_0x4c2e47={'oPgqI':function(_0xe6d593,_0x1827fa){const _0x5cb301=_0x3f32;return _0x48e4d4[_0x5cb301(0x95)](_0xe6d593,_0x1827fa);}};if(_0x48e4d4[_0x230cbb(0x9e)](_0x48e4d4[_0x230cbb(0x2cb)],_0x48e4d4[_0x230cbb(0x2cb)]))_0x3e8a4e[_0x230cbb(0x220)]='\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20'+_0x230cbb(0x1ba)+_0x230cbb(0x258)+_0x230cbb(0xbb)+_0x230cbb(0x88)+'n-full\x22\x20on'+_0x230cbb(0x13e)+_0x230cbb(0xdd)+_0x230cbb(0x271)+_0x230cbb(0x10c)+'ocation.hr'+_0x230cbb(0x153)+_0x230cbb(0xd5)+_0x230cbb(0x10e)+_0x230cbb(0x9b)+_0x230cbb(0x10d)+_0x230cbb(0xec)+_0x230cbb(0x1ad);else try{const _0x386f96={};_0x386f96[_0x230cbb(0xc8)+'rder_id']=_0xe5bd06[_0x230cbb(0xc8)+_0x230cbb(0x23b)],_0x386f96[_0x230cbb(0xda)+_0x230cbb(0x16a)]=_0xe5bd06[_0x230cbb(0xda)+_0x230cbb(0x16a)],_0x386f96[_0x230cbb(0x2d3)+'ignature']=_0xe5bd06[_0x230cbb(0x2d3)+_0x230cbb(0x283)],_0x386f96[_0x230cbb(0x1df)]=_0x4fa2d6,_0x386f96[_0x230cbb(0x208)]=_0x1c2d20,_0x386f96[_0x230cbb(0x1b8)]=_0x42b9e7;const _0x15a562=await _0x48e4d4[_0x230cbb(0x279)](fetch,_0x22e046+(_0x230cbb(0x243)+_0x230cbb(0x2c4)),{'method':_0x48e4d4['ibRTS'],'headers':{'Content-Type':_0x48e4d4[_0x230cbb(0x1f5)]},'body':JSON[_0x230cbb(0x14c)](_0x386f96)}),_0x2b40b1=await _0x15a562[_0x230cbb(0x20c)]();_0x2b40b1[_0x230cbb(0x247)]?_0x48e4d4['AxDxH'](_0x48e4d4[_0x230cbb(0x1c8)],_0x48e4d4[_0x230cbb(0x1c8)])?_0x36f2fa[_0x230cbb(0x1f2)+_0x230cbb(0xf6)](_0x230cbb(0x19f),_0xa824c9=>{const _0x102a1e=_0x230cbb,_0x400f2a=_0xa824c9[_0x102a1e(0x2b6)]?.[_0x102a1e(0xf9)]?.[_0x102a1e(0x208)]||_0xa824c9[_0x102a1e(0x2b6)]?.['id'];if(_0x400f2a)_0x4c2e47[_0x102a1e(0x2a4)](_0xe0180f,_0x400f2a);}):(_0x48e4d4['HSCet'](alert,_0x230cbb(0x18d)+_0x230cbb(0x144)+_0x230cbb(0x269)+_0x230cbb(0x277)+(PLAN_LABELS[_0x4fa2d6]||_0x2b40b1[_0x230cbb(0xa5)])+_0x230cbb(0xed)),window['location'][_0x230cbb(0x29d)]()):_0x48e4d4['DDJPU'](alert,_0x48e4d4[_0x230cbb(0x2d6)]);}catch(_0x26ff93){console['error'](_0x230cbb(0x1f0)+_0x230cbb(0x179),_0x26ff93),_0x48e4d4['Bndog'](alert,_0x48e4d4[_0x230cbb(0x82)]);}},'prefill':_0x2110e9,'theme':{'color':_0x48e4d4[_0x1edd50(0x1eb)]},'modal':{'ondismiss':function(){const _0x413445=_0x1edd50;_0x1caa62&&_0x48e4d4[_0x413445(0x1f8)](_0x1caa62['tagName'],_0x48e4d4['dJxWl'])&&(_0x1caa62[_0x413445(0x16f)]=_0x363cde,_0x1caa62['disabled']=![]);}}},_0x154483=new Razorpay(_0xfd17e6);_0x154483['on'](_0x48e4d4['qZrMY'],function(_0x559cd0){const _0x5e8447=_0x1edd50;console[_0x5e8447(0x101)](_0x559cd0[_0x5e8447(0x101)]),_0x48e4d4['kfoFK'](alert,_0x48e4d4['CYgaW'](_0x48e4d4[_0x5e8447(0xcf)],_0x559cd0[_0x5e8447(0x101)]['descriptio'+'n'])),_0x1caa62&&_0x48e4d4[_0x5e8447(0x12e)](_0x1caa62[_0x5e8447(0x118)],_0x48e4d4['dJxWl'])&&(_0x1caa62['innerText']=_0x363cde,_0x1caa62[_0x5e8447(0x1cc)]=![]);}),_0x154483['open']();}catch(_0x565ec0){console[_0x1edd50(0x101)](_0x48e4d4[_0x1edd50(0x1fb)],_0x565ec0),_0x48e4d4[_0x1edd50(0x108)](alert,_0x565ec0[_0x1edd50(0x2dc)]||_0x48e4d4[_0x1edd50(0x13c)]);}};function initializePricingUI(){const _0x168e0e=_0x1d4e1f,_0x44d113={'Edlad':_0x168e0e(0x14b),'CxcVd':function(_0x237582,_0x23760b){return _0x237582(_0x23760b);},'YsDNx':function(_0x236553,_0x1d74df){return _0x236553+_0x1d74df;},'PMwyj':_0x168e0e(0x94)+_0x168e0e(0x280),'VkFXR':_0x168e0e(0x182)+_0x168e0e(0x250)+_0x168e0e(0x1f6)+'\x20)','xwCoQ':function(_0xa494b8){return _0xa494b8();},'OJvIV':_0x168e0e(0x2c2),'emtep':_0x168e0e(0x234),'MYdHG':_0x168e0e(0x101),'nRItj':'exception','WFnzU':_0x168e0e(0xa9),'bQARa':function(_0x1e5ffe,_0x5d11c1){return _0x1e5ffe<_0x5d11c1;},'eluQm':_0x168e0e(0x2ba),'eQQdE':_0x168e0e(0x1c3)+_0x168e0e(0x178)+_0x168e0e(0x21e),'NPwjC':_0x168e0e(0x169)+_0x168e0e(0x1ab),'uZRVo':_0x168e0e(0x1d0)+_0x168e0e(0x225)+'\x20plan\x20for\x20'+_0x168e0e(0x28d),'FjKOo':function(_0x1f9530,_0x5d5538){return _0x1f9530===_0x5d5538;},'KrmDC':_0x168e0e(0xe6),'bDbcC':function(_0x2c883d,_0x480c4b){return _0x2c883d(_0x480c4b);},'MckBr':'TACRg','LcNyH':_0x168e0e(0x226),'icAZe':function(_0x5e62ca,_0x176cb9){return _0x5e62ca===_0x176cb9;},'QUYOx':function(_0x134e14,_0x1df749,_0x19a82b){return _0x134e14(_0x1df749,_0x19a82b);},'SxGwS':'index.html','LOVLJ':function(_0x599c84,_0x59a787){return _0x599c84===_0x59a787;},'rpiEn':_0x168e0e(0x256),'jeBlG':function(_0x364463,_0x157944){return _0x364463===_0x157944;},'DdTTa':'Pupcr','SPUdk':'kxpCx','CLkJI':_0x168e0e(0x19f)},_0x351d0a=(function(){let _0x23b95e=!![];return function(_0x4b2e2d,_0x593f10){const _0x538a03=_0x23b95e?function(){const _0x4ac50=_0x3f32;if(_0x593f10){const _0x3a8a25=_0x593f10[_0x4ac50(0x131)](_0x4b2e2d,arguments);return _0x593f10=null,_0x3a8a25;}}:function(){};return _0x23b95e=![],_0x538a03;};}()),_0x323b68=_0x44d113[_0x168e0e(0x27b)](_0x351d0a,this,function(){const _0x1bc7d6=_0x168e0e,_0x1dd5bd={'gnPnt':function(_0x489e2c,_0xf4876b){return _0x489e2c(_0xf4876b);}},_0x4969d1=function(){const _0x3b47cd=_0x3f32;if(_0x3b47cd(0x198)!==_0x44d113[_0x3b47cd(0x1e5)]){let _0x5ca851;try{_0x5ca851=_0x44d113[_0x3b47cd(0x17b)](Function,_0x44d113['YsDNx'](_0x44d113[_0x3b47cd(0x109)](_0x44d113[_0x3b47cd(0xac)],_0x44d113['VkFXR']),');'))();}catch(_0x4ed2fa){_0x5ca851=window;}return _0x5ca851;}else{const _0x4387e6=_0x261583[_0x3b47cd(0x8d)][_0x3b47cd(0x27d)]()[_0x3b47cd(0x1b5)+'e']()||null;_0x479ad9[_0x3b47cd(0x1cf)](),HgtfEK[_0x3b47cd(0x1a1)](_0x1b2ab0,_0x4387e6);}},_0xe5c207=_0x44d113[_0x1bc7d6(0x180)](_0x4969d1),_0x1ab77e=_0xe5c207['console']=_0xe5c207['console']||{},_0x8c6500=[_0x44d113[_0x1bc7d6(0x11d)],_0x1bc7d6(0xca),_0x44d113[_0x1bc7d6(0x248)],_0x44d113[_0x1bc7d6(0xc0)],_0x44d113[_0x1bc7d6(0x1ce)],_0x44d113['WFnzU'],'trace'];for(let _0x17a928=0x1f77+0x116*0x4+-0x67*0x59;_0x44d113[_0x1bc7d6(0xb4)](_0x17a928,_0x8c6500[_0x1bc7d6(0x8a)]);_0x17a928++){const _0x54deb2=_0x351d0a[_0x1bc7d6(0x2ab)+'r'][_0x1bc7d6(0x2bb)][_0x1bc7d6(0x2c9)](_0x351d0a),_0x4a6bbd=_0x8c6500[_0x17a928],_0x5b2217=_0x1ab77e[_0x4a6bbd]||_0x54deb2;_0x54deb2[_0x1bc7d6(0x232)]=_0x351d0a[_0x1bc7d6(0x2c9)](_0x351d0a),_0x54deb2[_0x1bc7d6(0x161)]=_0x5b2217[_0x1bc7d6(0x161)][_0x1bc7d6(0x2c9)](_0x5b2217),_0x1ab77e[_0x4a6bbd]=_0x54deb2;}});_0x44d113[_0x168e0e(0x180)](_0x323b68);const _0x1d2641=window[_0x168e0e(0xce)][_0x168e0e(0x27f)],_0x2ba2b1=_0x1d2641[_0x168e0e(0x7e)](_0x44d113[_0x168e0e(0x163)])||_0x44d113[_0x168e0e(0x249)](_0x1d2641,'/')||_0x1d2641['endsWith'](_0x168e0e(0x2ac)+'es/')||_0x1d2641[_0x168e0e(0x7e)](_0x44d113[_0x168e0e(0x26f)]);if(!_0x2ba2b1)return;const _0x21655b=()=>{const _0x3a8ce7=_0x168e0e,_0x48d023={};_0x48d023[_0x3a8ce7(0x298)]=_0x3a8ce7(0x194)+'board#/not'+'es';const _0x153265=_0x48d023;if(_0x44d113[_0x3a8ce7(0xf3)](_0x44d113['KrmDC'],_0x3a8ce7(0xe4))){if(_0x3a9739)_0x48c2f0['stopPropag'+_0x3a8ce7(0x1a6)]();_0x258640[_0x3a8ce7(0xce)][_0x3a8ce7(0x188)]=_0x153265[_0x3a8ce7(0x298)];}else{if(window['firebaseSe'+'rvices']&&window[_0x3a8ce7(0x117)+'rvices'][_0x3a8ce7(0x222)]&&window[_0x3a8ce7(0x117)+_0x3a8ce7(0x26d)][_0x3a8ce7(0x222)]['currentUse'+'r'])return _0x44d113[_0x3a8ce7(0x2e8)](checkAndRenderSubscription,window[_0x3a8ce7(0x117)+_0x3a8ce7(0x26d)][_0x3a8ce7(0x222)][_0x3a8ce7(0x295)+'r'][_0x3a8ce7(0x208)]),!![];const _0x16174a=localStorage['getItem'](_0x3a8ce7(0x2d1)+_0x3a8ce7(0x21e));if(_0x16174a){if(_0x44d113[_0x3a8ce7(0xf3)](_0x44d113[_0x3a8ce7(0x263)],_0x44d113[_0x3a8ce7(0x202)])){const _0x390237=_0x571dc4[_0x3a8ce7(0x22f)+'tor'](_0x3a8ce7(0x2ba));if(_0x390237){const _0x2173ff=_0x2cd151['createElem'+_0x3a8ce7(0x284)](_0x44d113['eluQm']);_0x2173ff[_0x3a8ce7(0x1cd)]=_0x44d113[_0x3a8ce7(0x2cd)],_0x2173ff[_0x3a8ce7(0x164)]=_0x892185=>{const _0x51cd31=_0x3a8ce7;if(_0x892185)_0x892185['stopPropag'+_0x51cd31(0x1a6)]();_0x4a775c[_0x51cd31(0xce)][_0x51cd31(0x188)]=_0x153265[_0x51cd31(0x298)];},_0x2173ff[_0x3a8ce7(0x16f)]=_0x44d113[_0x3a8ce7(0xfc)],_0x390237[_0x3a8ce7(0x160)+'h'](_0x2173ff);}}else try{if(_0x44d113[_0x3a8ce7(0x1dc)](_0x3a8ce7(0x1c2),_0x3a8ce7(0xbc)))_0x3dc714['warn'](_0x44d113[_0x3a8ce7(0x286)],_0x39a501);else{const _0x51b26e=JSON['parse'](_0x16174a);if(_0x51b26e&&(_0x51b26e[_0x3a8ce7(0x208)]||_0x51b26e['id']))return _0x44d113[_0x3a8ce7(0x17b)](checkAndRenderSubscription,_0x51b26e[_0x3a8ce7(0x208)]||_0x51b26e['id']),!![];}}catch(_0x1f705f){}}return![];}};!_0x21655b()&&(_0x44d113['jeBlG'](_0x44d113[_0x168e0e(0x2b4)],_0x44d113[_0x168e0e(0x17c)])?(_0x246a7c[_0x168e0e(0x16f)]=_0x363235,_0x5cb408[_0x168e0e(0x1cc)]=![]):window[_0x168e0e(0x1f2)+_0x168e0e(0xf6)](_0x44d113[_0x168e0e(0x158)],_0x1fc753=>{const _0x5c230f=_0x168e0e,_0x3d2cef=_0x1fc753[_0x5c230f(0x2b6)]?.[_0x5c230f(0xf9)]?.[_0x5c230f(0x208)]||_0x1fc753['detail']?.['id'];if(_0x3d2cef)_0x44d113['bDbcC'](checkAndRenderSubscription,_0x3d2cef);}));}initializePricingUI();async function checkAndRenderSubscription(_0x8815ef){const _0x301e53=_0x1d4e1f,_0x44789f={'OyHKT':_0x301e53(0x1ed),'MhkRW':_0x301e53(0x1d5)+'id','TQjcq':function(_0xab0a8c,_0x53ece5){return _0xab0a8c&&_0x53ece5;},'HMLrG':function(_0x11dc0b,_0x5b5225){return _0x11dc0b<_0x5b5225;},'kToVt':function(_0x1153d7,_0x280a26){return _0x1153d7!==_0x280a26;},'dBYUT':function(_0x1b3644,_0x30e825,_0x2b7066){return _0x1b3644(_0x30e825,_0x2b7066);}};try{const {supabase:_0x11960f}=await import(_0x301e53(0xff)+_0x301e53(0x2c1)+'?v=1.0'),{data:_0x46fa2c,error:_0x1eee02}=await _0x11960f[_0x301e53(0x23e)](_0x44789f[_0x301e53(0x1ef)])['select']('*')['eq'](_0x44789f[_0x301e53(0x16d)],_0x8815ef)[_0x301e53(0xdb)]();if(_0x44789f[_0x301e53(0x1db)](!_0x1eee02,_0x46fa2c)){let _0x33bde9=_0x46fa2c['plan_id'];const _0x385c6f=_0x46fa2c[_0x301e53(0x239)+'y']?new Date(_0x46fa2c[_0x301e53(0x239)+'y']):null;if(_0x385c6f&&_0x44789f[_0x301e53(0x23c)](_0x385c6f,new Date()))_0x33bde9=_0x301e53(0x25b);_0x44789f[_0x301e53(0x15b)](_0x33bde9,_0x301e53(0x25b))&&_0x44789f[_0x301e53(0x2ad)](updatePricingUI,_0x33bde9,_0x385c6f);}}catch(_0x45645e){console[_0x301e53(0xca)](_0x301e53(0x1d0)+_0x301e53(0x225)+_0x301e53(0xfb)+_0x301e53(0x28d),_0x45645e);}}function updatePricingUI(_0x3ff770,_0x1722e9){const _0x372a24=_0x1d4e1f,_0x5538fd={'ceAeR':'en-IN','ExWNx':'numeric','FIzEt':'short','bvOXd':_0x372a24(0x20f)+'rror:','MzZRV':function(_0x4a65c6,_0x150b67){return _0x4a65c6(_0x150b67);},'KYhIH':_0x372a24(0xb9)+'ard-wrappe'+'r','dFSNi':function(_0x260e87,_0x16b4ec){return _0x260e87===_0x16b4ec;},'DAhRD':function(_0x221e3a,_0x1030ed){return _0x221e3a===_0x1030ed;},'bmEso':'codetantra','Zkzlw':_0x372a24(0x213),'MIwvj':function(_0x331be5,_0x203832){return _0x331be5!==_0x203832;},'wzjkf':function(_0x1389c9,_0x1ce233){return _0x1389c9!==_0x1ce233;},'ZICjI':_0x372a24(0x221),'qhUfq':'TfVCA','xqHJd':_0x372a24(0x10b)+_0x372a24(0x238)+'d','hOvaC':_0x372a24(0x204)+_0x372a24(0xea),'Zubzf':'div','MfnMk':'popular-ba'+_0x372a24(0x12f),'IUFUi':_0x372a24(0x27e),'CFkwS':'ACTIVE\x20SUB'+'SCRIPTION','ngDop':'2px\x20solid\x20'+'#00ff88','QuSML':_0x372a24(0x195)+_0x372a24(0x19d)+_0x372a24(0x1d7),'rFvMC':function(_0x12d426,_0x219e5f){return _0x12d426(_0x219e5f);},'vvJZp':_0x372a24(0x21b),'tZqpq':'button'},_0x59d953=document['querySelec'+_0x372a24(0x274)](_0x5538fd[_0x372a24(0x87)]);if(!_0x59d953||_0x5538fd['dFSNi'](_0x59d953[_0x372a24(0x8a)],0x7e3*-0x4+-0x1e62*-0x1+0x95*0x2))return;let _0x4b40b9=-(0x109*-0x22+0x889+-0x2*-0xd55);if(_0x5538fd[_0x372a24(0x27a)](_0x3ff770,_0x5538fd[_0x372a24(0x86)])||_0x3ff770?.[_0x372a24(0x1cb)](_0x5538fd[_0x372a24(0x86)]))_0x4b40b9=-0xb64+0x2fa+-0x1af*-0x5;if(_0x5538fd[_0x372a24(0x27a)](_0x3ff770,_0x372a24(0x213))||_0x3ff770?.[_0x372a24(0x1cb)](_0x5538fd[_0x372a24(0x276)]))_0x4b40b9=0x483+-0x12bf*-0x2+-0x29ff;if(_0x5538fd['MIwvj'](_0x4b40b9,-(-0x9*-0x1+0xae5*0x3+-0x20b7))&&_0x59d953[_0x4b40b9]){if(_0x5538fd[_0x372a24(0x19e)](_0x5538fd['ZICjI'],_0x5538fd[_0x372a24(0x1c0)])){const _0x5be64a=_0x59d953[_0x4b40b9][_0x372a24(0x22f)+_0x372a24(0xf7)](_0x5538fd[_0x372a24(0x266)]);if(!_0x5be64a)return;const _0x2d9803=_0x5be64a['querySelec'+_0x372a24(0xf7)](_0x5538fd[_0x372a24(0x2b3)]);if(_0x2d9803)_0x2d9803[_0x372a24(0x1cf)]();const _0x2d5fad=document[_0x372a24(0xb0)+'ent'](_0x5538fd[_0x372a24(0x2c8)]);_0x2d5fad['className']=_0x5538fd[_0x372a24(0x18e)],_0x2d5fad[_0x372a24(0x264)][_0x372a24(0x24a)]=_0x5538fd[_0x372a24(0x9f)],_0x2d5fad[_0x372a24(0x264)]['color']=_0x372a24(0x1a5),_0x2d5fad[_0x372a24(0x16f)]=_0x5538fd[_0x372a24(0xf0)],_0x5be64a[_0x372a24(0x1e2)+'re'](_0x2d5fad,_0x5be64a[_0x372a24(0x297)]),_0x5be64a['style'][_0x372a24(0x1fd)]=_0x5538fd[_0x372a24(0xd2)],_0x5be64a[_0x372a24(0x264)][_0x372a24(0x1c4)]=_0x5538fd[_0x372a24(0x22a)];const _0x1b4f8e=_0x5be64a[_0x372a24(0x22f)+_0x372a24(0xf7)](_0x372a24(0x9a));if(_0x1b4f8e){const _0x463660=_0x2778cf=>{const _0x39d77d=_0x372a24;if(!_0x2778cf)return'—';return _0x2778cf[_0x39d77d(0x244)+_0x39d77d(0x16b)](_0x5538fd[_0x39d77d(0x236)],{'day':_0x5538fd[_0x39d77d(0x186)],'month':_0x5538fd[_0x39d77d(0x2d7)],'year':_0x5538fd[_0x39d77d(0x186)]});},_0x14a587=_0x1722e9?_0x372a24(0xcd)+'\x20'+_0x5538fd[_0x372a24(0x11c)](_0x463660,_0x1722e9):_0x5538fd[_0x372a24(0x99)];_0x1b4f8e[_0x372a24(0x220)]+=_0x372a24(0x1e9)+_0x372a24(0x166)+_0x372a24(0x187)+_0x372a24(0x288)+'0.9;\x20margi'+_0x372a24(0x1b3)+_0x372a24(0x21d)+'#00ff88;\x22>'+_0x14a587+_0x372a24(0x278);}_0x59d953[_0x4b40b9]['onclick']=()=>window[_0x372a24(0xce)]['href']=_0x372a24(0x194)+_0x372a24(0x134)+'es';const _0x4b2683=_0x5be64a[_0x372a24(0x22f)+_0x372a24(0xf7)]('div[style*'+_0x372a24(0x90)+_0x372a24(0x112));if(_0x4b2683&&_0x5538fd[_0x372a24(0x19e)](_0x4b2683,_0x5be64a))_0x4b2683[_0x372a24(0x220)]=_0x372a24(0x2b0)+_0x372a24(0x1ba)+_0x372a24(0x258)+_0x372a24(0xbb)+_0x372a24(0x88)+_0x372a24(0x1be)+_0x372a24(0x13e)+_0x372a24(0xdd)+'pagation()'+_0x372a24(0x10c)+_0x372a24(0x2e2)+_0x372a24(0x153)+'dashboard#'+_0x372a24(0x10e)+'o\x20to\x20Dashb'+'oard</butt'+'on>\x0a\x20\x20\x20\x20\x20\x20'+_0x372a24(0x1ad);else{const _0x15acdd=_0x5be64a[_0x372a24(0x22f)+_0x372a24(0xf7)](_0x372a24(0x2ba));if(_0x15acdd){const _0x3b9e77=document[_0x372a24(0xb0)+_0x372a24(0x284)](_0x5538fd[_0x372a24(0xc3)]);_0x3b9e77['className']=_0x372a24(0x1c3)+_0x372a24(0x178)+_0x372a24(0x21e),_0x3b9e77[_0x372a24(0x164)]=_0x23e410=>{const _0x35a3f6=_0x372a24;if(_0x23e410)_0x23e410[_0x35a3f6(0x241)+_0x35a3f6(0x1a6)]();window['location']['href']=_0x35a3f6(0x194)+_0x35a3f6(0x134)+'es';},_0x3b9e77['innerText']=_0x372a24(0x169)+_0x372a24(0x1ab),_0x15acdd['replaceWit'+'h'](_0x3b9e77);}}}else _0x3b07e3['error'](EUncjk[_0x372a24(0xb8)],_0x1c11fd),EUncjk[_0x372a24(0x1d2)](_0x141bb1,_0x2494ec[_0x372a24(0x2dc)]||_0x372a24(0x1d0)+_0x372a24(0x8e)+'\x20checkout.');}}function _0x2a29(){const _0x3ac944=['AwDUyxr1CMu','zw50','igjVCMrLCJOGBG','DvPsvM8','nsWWlJuPoYbMBW','ig9WywnPDhK6ia','C2vHCMnO','l2rPDJ4kicaGia','y3vZihSGyM9Yza','cIaGicaJy291Ca','ChjPy2LUzYbvsq','ywfAAgy','lJC1CMvToYbIBW','nZHIzMePoYbJBW','i2e3ogjMytSGFq','idfYzw07ig1HCG','ihjNyMeOmtaSmq','ANL1r3O','y3vYCMvUDfvZzq','idaGnhb4ide4Ca','zMLYC3rdAgLSza','Efn1DMG','Chv0oJPWBgfJzq','y291Cg9Ulw1Vza','ywWTC3r5BgvZ','iIbPzd0Iy3bUlq','CMvSB2fK','BgLNBI1PDgvTCW','Bg9YidaUmNm7ia','ica8zgL2igLKpq','mZuPoYb9cIaGia','nJbWEcbYz2jHka','C29YoIbUB3qTyq','B1bNCuK','lwzHzgvPBIb7ia','y291Cg9UlwzLzq','mtq3oda3owv5zgzkta','DxiGy291Cg9Uia','mtm5ldi1mcWWlG','zwfYlwDYywrPzq','y29UC3rYDwn0BW','l3nRAwXSx05VDa','zejzvvq','zeP4v2W','Dc1ZAxPLoIaWlG','cIaGicaGicaGia','Bg9JywXOB3n0','ldeZosWYntaSma','Ae92yum','rgruvge','nZq3mJiWtKffAhfn','zgv0ywLS','oIa4mda7cIaGia','mteWnta4uMrMugTf','B24TBw9KywWTBW','yNv0Dg9U','ChjVDg90ExbL','zw1HAwW','idXKAxyGy2XHCW','ugXLyxnLigXVzW','Aw5LoIbUB25LoW','ndm1mZGWBvbVzMjj','lwnVBMzPzY5QCW','Bg9N','Ec13Awr0AdOGna','Es1WyxLTzw50','DgfUDdSGFqOGia','Chv0iIbWBgfJzq','CeLmuLm','wNvIEMy','yMLUza','D2vPz2H0oIa2ma','quXjsw0','r0jTwLy','zvfrzeu','y291BNqSig9Yia','CMfUC2L0Aw9UoG','cIaGicaGicaGDa','yxv0Af91C2vYxW','oYb9cIaGicaUyW','CMf6B3jWyxLFCW','BI1ZA2LWihSGyG','oIaXCMvToYb9cG','BeHZzK4','rKL6rxq','ihrYyw5ZzM9YBq','ChGGC29SAwqGCG','icaGicaGicaGpa','mtyXrKf1C2Hx','BwvZC2fNzq','lNn1y2nLC3mGEW','AxaIigLKpsjJCa','icaGicaGihbVCW','AwXLzdOG','zs1PBNb1Da','B2nHDgLVBI5OCG','ltfWEcK7ih0kia','CZ0Iy3bUlwj0BG','yM94ihSkicaGia','icaGicaGica8lW','igzHAwXLzc4Gsq','yKrIy0m','kcGOlISPkYKRkq','zw5KC1DPDgG','AgvHza','ohrSCKfTBa','nZe7ih0kicaGia','qvntq2q','y291Cg9UlwnVza','zwq7igLUC2v0oG','z2LUlwjVDhrVBq','yM1fC28','s1LOsuG','ChjPBwfYEsbIDa','mc44nxjLBtSGyW','BgvUz3rO','vhfTyuO','CM06ihrYyw5ZBa','DMfSDwu','Aw5PDgLHBgL6zq','pVcFJP/VUi8Gsgf2zsbHia','psjKAxnWBgf5oG','q291Cg9UpZWVAa','ndC1mdu3mfrYwKnsza','B2XVCJOGi2e3oa','CMv0DxjUicHMDq','sfndzxq','mZe3odi2yKTHCgDU','y3bUlxnRAxaTyG','nsK7cIaGicaGia','DNzkwNa','lNbYAwnL','BYb0BYbeyxnOyG','qLvuve9o','DLHzvvC','uhr2Ahi','svvgvwK','yxiTz3jHzgLLBG','Cg9YDc4','zgvPBIaWlJjZia','q29UDgvUDc1uEq','oIb0CMfUC2XHDa','CgXHBG','CMDIysGYntuSmG','n2i2mwzMlcaJyq','ida7ih0GDg8GEW','DgfIBgu','DxzIz1q','D3vTCw8','ue13EwO','BNqTD2vPz2H0oG','mhb4oYbWywrKAq','ldqWldaUotGPla','y3jLyxrLrwXLBq','oIbWB2LUDgvYoW','DMvYBgf5ihSkia','BJ4kicaGicaGia','yLfbuMe','BNrLBNq6ignLBG','BJOG','EgHdA04','yNzpwgq','lNbYAwnPBMCTyW','oIaXChGGC29SAq','psjIDg4GyNrUlq','DxbOwuC','z2v0rwXLBwvUDa','oIaXlJi1CMvToW','CM9JzwvKihrVia','tvLKseC','lxjHzgL1CZOGmq','idfWEcbZB2XPza','DfPXChe','Aw5KzxGUAhrTBa','ms4YnxjLBtSGFq','cIaGicaGicaGzG','yMfJAYb7igzVBG','CMf6B3jWyxLFBW','ihSGyMfJA2DYBW','D2fYBG','EtOGzMXLEdSGyq','icaGyw5PBwf0Aq','rxHWAxjLCYbVBG','Bg9JyxrPB24','qwfszMm','zvzrCLy','vMrcAxq','BMDeB3a','AwWTBwf0CML4lq','oIbJzw50zxi7ia','zgfZAgjVyxjKiW','EYbIB3GTC2HHza','sxfxC3e','zgvZy3jPChrPBW','ue9tva','CMf6B3jWyxLFCa','C2LUz2XL','CMDIysGWldaSma','BNqUC3rVCfbYBW','zNjHBwvZignWBG','icaGigjVEc1ZAa','AxvZoIaYmhb4oW','iZyWytvMysK7ia','lxjVDYi+cIaGia','ihjNyMeOmty3la','B2zpBfm','igzVCIbHigrPCW','vwLXrK4','CI1NCMfKAwvUDa','mxb4ihnVBgLKia','y29KzxrHBNrYyq','ywrNzq','lI4VAw5KzxGUAa','B24+cIaGicaGia','ihbSyw4U','icnHnZHIzMeSia','icaGigrPC3bSyq','q0zRD1m','BwfYz2LUlwjVDa','Ag9SzgvYihSGDa','rMPlt28','uxr1wKq','EgXLBMD0Ad0ImW','C3rLBMvY','Dg9Y','lwjVEcbOmYb7ia','DxnLCG','y2L0EtOGmtSGFq','ihbSyw4GzM9Yia','tLb3AKm','AxrPB246igzPEa','Ahr0Chm6lY9ZAW','lI9ZDxbHyMfZzq','B250Ahm','zxjYB3i','CMLMAwnHDgLVBG','CM91BMq6igXPBG','Cg4TyNrUlxbHEq','BMC6idaUnNjLBq','oYb9cIaGicaJyW','ihbHzgrPBMC6ia','A2zVrKS','wxnetNG','zs1VCMrLCG','lNbYzw1PDw0TCa','oYb3Aw5KB3CUBa','B2fYzdWVyNv0Da','l25VDgvZjYi+rW','rMfPBgvKihrVia','ihrVihSGB3bHyW','oIbYz2jHkdi1nq','igzSzxGIxq','B3vUzdOGBgLUzq','DhrVBJ4kicaGia','odjYzw07ig1PBG','mJu1ldi1nsWYnq','zMLYzwjHC2vtzq','DgfNtMfTzq','DgvYignVDxbVBG','rgjgwNy','cIaGicaGicaGlq','CKz2tum','t0P2svy','sufxD2S','ugf5BwvUDcb2zq','B3CGEYbKAxnWBa','nsWWlJeYktSGyW','sMz6vha','AwXLza','lxDLyMTPDc1Iyq','Dw5KoIbSAw5Lyq','A2v5swq','CNjVCJO','B2nLzwqUpc9WpG','sw9UEwq','Aw4GDg8GDxbNCG','Bg9YoIaJzJG3mq','uhjLBwL1BsbtyW','Bw9UB3nWywnLoW','vfP4s1a','zgDL','B24TBw9KywWTyG','yxbWBhK','DxHxz3m','Axa6ihrLEhq7ia','yM9HCMqJl25VDa','psjJCg4TyNrUia','FqOGicaGqgTLEq','iZDInJfMzG','ywr4Aui','icaGicaGicbIyq','oWOGicaGicaGia','zgDLiJ7WN5oMifbSyq','B0LiAgm','lJi1CYbLyxnLoW','y2XPy2S9iMv2zq','B2rHBc1IB3GIpG','idCWmdSkicaGia','wwHdtfC','iMnVDxbVBI1Mzq','DgvYoWOGicaGia','C3vJy2vZC2z1Ba','oIaWlJu7ign1CG','zerSvwO','igzSzxG6ide7ia','kdeZnwrLzYWGiW','AgfUzgXLugf5Bq','icaGigjHy2TNCG','yunTCKW','C3rYAw5NAwz5','FqOGicaGi2nVDq','ida7ihOTAw5Kzq','Ag9SyxiG4OcuidyG','icaGigjVCMrLCG','wgHzEfy','DIbJBgfZCZ0IyW','zwy9j3bHz2vZlW','qMrfzxu','DhLWzt0IDgv4Da','C3DvB2W','C0f5q20','q0XRsKK','rerkufu','Bhf5CMe','A1rVvNq','iIbPzd0Iy291Ca','icaGi2nVDxbVBG','ywXOB3n0oJmWma','Axr5oIaXoYb9ia','CMvWBgfJzvDPDa','Dg9tDhjPBMC','z2fWoIaWlJC1CG','u3HhD1m','B25JBgLJAW','y3jLyxrLig9Yza','psjMB250lxnPEG','zgL2pGOGicaGia','ugf5BwvUDcbMyq','r28GDg8GrgfZAa','yxLTzw50x2LK','DgvtDhjPBMC','ysGYntuSmJu1la','twHRuLC','icaGign1CNnVCG','Aw5UzxjuzxH0','icHdB3vWB246ia','lcbWBgvHC2uGyW','qNLjza','C2TPCdPOB3zLCG','ywWTB3zLCMXHEq','y2fZztSGBgv0Da','yw4TyMfKz2uGEW','EeDbvha','Aw1HCNKGyNrUlq','B24GrxjYB3i6','nMfvuLnzqW','q3HJvMq','u1bvzgS','ihSGB3bHy2L0Eq','zxH0lxrYyw5ZzG','icaGicaGyw5PBq','EhDdB1e','lJyPoWOGicaGia','E30Uy29UC3rYDq','ihjNyMeOmJu1la','ic5JCg4TyNrUlq','ywnRz3jVDw5KoG','rxHxtNG','ztOGmc45CMvToW','AhjLzG','B3jKzxi','BgfUlG','ignOzwnRB3v0lG','q1LNyvC','4PYfifbHEw1LBNqG','twzUtwS','Dgv4DenVBNrLBG','mNjLBtSGD2LKDa','q1fKt2O','lJjYzw07ig1HCG','nxjLBtSGB3v0Ba','CgfNzxmVzgfZAa','mcaWidmWChGGCG','ywrVDZOGmcaWia','CMDIysGYmcWYma','qLvLDMK','B250ywn0ihn1Ca','iebRzxLMCMfTzq','Aw9UywWPiIbTyq','Cgf5oMHVDMvYia','z2jHkdaSmJu1la','D3PQA2y','yxv0Ac1YzwfKEq','DgfYz2v0','z25qBNq','zwLUihSGzNjVBq','EcbYz2jHkdeYmW','BhHdwwK','iZaWma','yxrPB24','msK7igjVCMrLCG','wcboB3rLCW','ignVBg9YoIaJmq','lwHLAwDODdOGmq','yM9HCMq','Ag9SzgvYpsjfBG','icaGicaG','yM94ihaGEYbJBW','ANvZDgLMEs1JBW','mdCPoYbJB2XVCG','B2XVCJOGi2zMzG','yxbWBgLJyxrPBW','BI10B3a6ideWCa','B3jToIb1ChbLCG','Dg9vChbLCKnHCW','cIaGicaGicaGyG','yM94oYbWywrKAq','y291Cg9Uq29Kzq','BwfYz2LUoIaWia','icaGicaGidXIDq','l3bHz2vZlW','sw5rDMe','C2vYDMvYlM9UCG','BI1MDwXSiIbVBG','Bg9YoIbYz2jHka','CwHvzNe','icaGicaGidXKAq','rKrsyKi','yNrUigj0BI1WCG','yM94u2HHzg93','icaGicaGicaGia','ywrLihLVDxiGCa','yw1VDw50','DMXgCva','BI9QC29U','y2L0EtOGmdSGFq','C3rHCNrZv2L0Aa','zgLZywjSzwq','y2XHC3noyw1L','BLjjDgO','CMvTB3zL','q291BgqGBM90ia','mJu1ldi1nsWWlG','txPAuLy','B21ov1y','Dg1S','zMLYzwjHC2vFDq','mcWZmcWWlJK4kq','mtm2ldaUmIK','lMnWBI1IDg4GEW','su5s','Dg9ToIaWlJvYzq','vffQy3e','AwnbwMu','BI1MzwvKyMfJAW','icaGlMnWBI1IDa','CgXHBKLK','t21hwLK','renOC04','Aw5Zzxj0qMvMBW','EefXveO','yxK6igzSzxG7ia','rwrSywq','ChjVxZfTBW','y2TNCM91BMq6ia','ideUm3jLBtSGzG','pgrPDIbZDhLSzq','z3jVDw5KoIbYzW','tujNEe0','y29KzsbIzwXVDW','DxnLCL9WBgfUCW','AfvYuMG','t3Lis1q','vMvYAwzPy2f0Aq','Cg9Ulw1VzgfSlq','ywrKrxzLBNrmAq','qvbZz08','lI4U','DxHutKC','CM4GDgHPCYiPka','zIbTB25LEsb3yq','CKznzM8','B25LoYb0CMfUCW','yxrLwsGYmhb4kq','qwTxwu4','y3bUlwj0BI1ZAW','yM9YzgvY','CYbKzwr1y3rLza','D2vUDcb3CM9UzW','mc45CMvToYbMBW','lxnSAwrLAw4Gma','tgnoEuG','icaGicaGyMfJAW','lNbVChvSyxiTyG','q29KzvrHBNrYyq','Cd5fBNrLCIb5BW','BMC6idaUnZvYzq','DwLK','ywrPDxm6ideWCa','yM9YzgvYlxjHza','zvKOmcK7ig9Wyq','ANnVBG','BgLWoIb0zxH0oW','zs1PBNb1DdPMBW','q2HLy2TVDxqGrq','iJ5tA2LWpc9IDq','Dc1MAwXSlwnVBa','BNqOmtm1zgvNla','ChjV','mdSGFqOGicaGiW','sM9izxC','ldi1nsWWlJa1kq','zgL2','oYbIB3jKzxi6ia','zxiTC3bHy2LUzW','mJG2otuZr3fvwuXv','qwn0AxzL','igjVCMrLCI1JBW','EdSGy29SB3i6ia','zNvSBa','CMrLCI1YywrPDq','Aw5Uzxjive1m','sLzrEhq','yxv0Aa','v3DLqvm','DxbVBI1TB2rHBa','zMv0y2GGDxnLCG','z3ngCNu','zwrIywnRiJ48lW','xZfTBW','DgvYoIbIBhvYka','uxvttuW','u29TzxrOAw5Nia','ieH1yIdIGjqGmsbn','B3C6idaGnNb4ia','igjVEc1ZAxPPBG','CxvLCNLtzwXLyW','ktSkicaGicaGia','yMeOmJu1ldi1nq','x19WCM90B19F','B250lxnPEMu6ia','Aw5MBW','ntuSmJu1ldaUmq','y2vbzvi','icaGyM9YzgvYoG','CMLJAw5NlwnHCG','CgXHBL9LEhbPCG','tw9UDgHZ','CMrLCL9Pza','se1mCKC','iMnWBI1IDg4GyW','zNjVBq','C2TPCcb0BYbWCG','ywnPBMC6ida7ia','C3rVCfbYB3bHzW','u0TPtcbnqvrsAq','l2fWAs92zxjPzG','Dg9mB2nHBgveyq','mZ4kicaGicaGia','z2jHkde2nYWXmW','C3vJy2vZCW','zw10zxa','te9wteO','yMfJA2DYB3vUza','yxbWzw5Kq2HPBa','mJrWEcbYz2jHka','mgi5ode7ih0kia','v2PoBMK','psjJB3vWB24TBq','y3rVCIGICMv0Dq','y2PUEMS','A2DYB3vUzc1JBa','Bg9YoIaJzMzMoW','BsaXCMvToWOGia','rvPRt3m','zgLZDc8','ldaUmJuPoWOGia','DhrVBIbJBgfZCW','CgfKzgLUzZOGma','zZOGyM9YzgvYlq','zNjLzq','Aw5JBhvKzxm','mJbWEdSkicaGia','tw9UDgG','zhrOoIaXmdaLoW','ugf5pc9IDxr0BW','xZzTBW','mtiPoYb9cIaGia','twnRqNi','C3r5Bgu','B24Ty29Kzs1PBG','EhfisMq','igjVCMrLCJOGmq','yxjLBNq7igjHyW','isbxzwXJB21Lia','ogrJBMD2BG','Bxvfsgy','zNjVBsb7ig9Wyq','CNzPy2vZ','B3vWB24TzMvLza','CNbPrw4','lJG1CMvToYbTyq','CgfNyxrPB24Okq','vw9kCwy','pc9KAxy+cIaGia','Dg9YqwXS','ChjVxZzTBW','wMT6BhC','Dg8G','pc9KAxy+','CvrXsNa','refOuKq','uvvzt3G','D2vIA2L0lxrLEa','DhjPBq','iZaWzMy4oa','Cgf0Ag5HBwu','BMn0Aw9UkcKG','qxDcBw8','zgjHy2S'];_0x2a29=function(){return _0x3ac944;};return _0x2a29();}
>>>>>>> Stashed changes
