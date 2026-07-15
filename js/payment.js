// js/payment.js

window.handlePayment = async function(planId) {
    if (!window.auth || !window.auth.currentUser) {
        alert("Please login to upgrade your plan.");
        window.location.href = window.location.pathname.includes('/pages/') ? '../index.html' : 'index.html';
        return;
    }

    const uid = window.auth.currentUser.uid;
    const email = window.auth.currentUser.email || "";

    try {
        // Show loading state (can use SweetAlert if available)
        const loadingBtn = document.activeElement;
        const originalText = loadingBtn.innerText;
        loadingBtn.innerText = "Processing...";
        loadingBtn.disabled = true;

        // 1. Create Order
        const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://skil-matrix-server.onrender.com';
        
        const response = await fetch(`${apiUrl}/api/create-order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ planId, uid })
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || "Failed to create order");
        }

        // 2. Open Razorpay Checkout
        const options = {
            key: data.keyId,
            amount: data.order.amount,
            currency: "INR",
            name: "SKiL MATRiX Notes",
            description: `Subscription for ${planId}`,
            order_id: data.order.id,
            handler: async function (response) {
                try {
                    // 3. Verify Payment
                    const verifyRes = await fetch(`${apiUrl}/api/verify-payment`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            planId,
                            uid
                        })
                    });

                    const verifyData = await verifyRes.json();
                    
                    if (verifyData.success) {
                        alert(`Payment successful! Welcome to the ${verifyData.plan} plan.`);
                        window.location.reload();
                    } else {
                        alert("Payment verification failed. If money was deducted, please contact support.");
                    }
                } catch (error) {
                    console.error("Verification Error:", error);
                    alert("Something went wrong during verification.");
                }
            },
            prefill: {
                email: email
            },
            theme: {
                color: "#7b61ff"
            },
            modal: {
                ondismiss: function() {
                    loadingBtn.innerText = originalText;
                    loadingBtn.disabled = false;
                }
            }
        };

        const rzp = new Razorpay(options);
        rzp.on('payment.failed', function (response){
            console.error(response.error);
            alert("Payment failed: " + response.error.description);
            loadingBtn.innerText = originalText;
            loadingBtn.disabled = false;
        });
        
        rzp.open();

    } catch (error) {
        console.error("Checkout Error:", error);
        alert(error.message || "Could not initialize checkout.");
        const loadingBtn = document.activeElement;
        if(loadingBtn) {
            loadingBtn.innerText = "Try Again";
            loadingBtn.disabled = false;
        }
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
