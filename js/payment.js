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
    if (planId === 'codetantra') targetCardIndex = 1;
    if (planId === 'pro') targetCardIndex = 2;

    if (targetCardIndex !== -1 && pricingCards[targetCardIndex]) {
        const activeCard = pricingCards[targetCardIndex].querySelector('.premium-pricing-card');
        
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

        // Change the action buttons to "Go to Dashboard"
        const buttonContainer = activeCard.querySelector('div[style*="display: flex"]') || activeCard.querySelector('button')?.parentElement;
        
        if (buttonContainer && buttonContainer.tagName.toLowerCase() === 'div') {
             buttonContainer.innerHTML = `
                <button class="btn btn-primary btn-full" onclick="window.location.href='pages/dashboard#/notes'">Go to Dashboard</button>
            `;
        } else {
             // If there's no flex container, just replace the single button
             const oldBtn = activeCard.querySelector('button');
             if (oldBtn) {
                 const newBtn = document.createElement('button');
                 newBtn.className = 'btn btn-primary btn-full';
                 newBtn.onclick = () => window.location.href = 'pages/dashboard#/notes';
                 newBtn.innerText = 'Go to Dashboard';
                 oldBtn.replaceWith(newBtn);
             }
        }
    }
}
