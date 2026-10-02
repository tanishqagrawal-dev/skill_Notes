/**
 * SKiL MATRiX - Real Student Reviews & Ratings Engine
 * Deep Obsidian & Indigo Theme • Unique Cards (Strict Deduplication) • Seamless Auth & Verified Reviews
 * Dual Real-Time Sync with Supabase and Firebase Firestore.
 */

const SUPABASE_URL = 'https://begbdglouistmaughmot.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlZ2JkZ2xvdWlzdG1hdWdobW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyODMxMDEsImV4cCI6MjA5NDg1OTEwMX0.sKOHb6jifGH4P8ZFrc5tkPPkButNtfx1mJj9o-zC-rs';

class SKiLReviewsEngine {
    constructor() {
        this.reviews = [];
        this.selectedRating = 0; // Starts at 0 by default (unselected)
        this.likedReviewIds = new Set(JSON.parse(localStorage.getItem('skm_liked_reviews') || '[]'));
        this.myReviewKeys = new Set(JSON.parse(localStorage.getItem('skm_my_review_keys') || '[]'));
        this.deletedSignatures = new Set(JSON.parse(localStorage.getItem('skm_deleted_signatures') || '[]'));
        this.animFrameId = null;
        this.isUserInteracting = false;
        this.scrollPos = 0;
        this._pauseTimer = null;
        this._isSubmitting = false;
        this.broadcastChannel = null;
        
        // 1. Load locally cached real reviews and purge any previous fake/demo reviews
        try {
            const localSaved = JSON.parse(localStorage.getItem('skm_user_reviews_cache') || '[]');
            if (Array.isArray(localSaved) && localSaved.length > 0) {
                const realReviews = localSaved.filter(r => r && !String(r.id).startsWith('demo_'));
                this.reviews = this.deduplicateReviews(realReviews);
            } else {
                this.reviews = [];
            }
        } catch (e) {
            this.reviews = [];
        }

        // Clean local cache with real entries only
        localStorage.setItem('skm_user_reviews_cache', JSON.stringify(this.reviews));

        // 2. Initialize UI immediately
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupRatingSelector();
        this.setupCarouselControls();
        this.setupAuthObserver();
        this.setupCrossTabSync();
        
        // Render UI immediately
        this.renderStats();
        this.renderReviews();
        this.startInfiniteLoop();

        // 3. Connect live database in background
        this.connectLiveDatabase();
    }

    escapeHTML(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    getCurrentUser() {
        let currentUser = null;
        if (window.firebaseServices && window.firebaseServices.auth) {
            currentUser = window.firebaseServices.auth.currentUser;
        }
        if (!currentUser) {
            try {
                currentUser = JSON.parse(localStorage.getItem('auth_user_full') || localStorage.getItem('user') || 'null');
            } catch (err) {}
        }
        return currentUser;
    }

    isMyReview(r) {
        if (!r) return false;
        if (r.id && String(r.id).startsWith('demo_')) return false;

        const user = this.getCurrentUser();
        // If not logged in, visitors/guests can NEVER delete any review
        if (!user || user.isGuest) return false;

        // Admin override (Admin can delete/moderate reviews)
        if (user.role === 'admin' || user.role === 'superadmin' || user.isAdmin || 
            (user.email && (user.email.toLowerCase() === 'skilmatrix3@gmail.com' || user.email.toLowerCase() === 'tanishqagrawal1103@gmail.com'))) {
            return true;
        }

        // 1. Strict match by verified user email
        if (r.email && user.email && r.email.trim().toLowerCase() === user.email.trim().toLowerCase()) {
            return true;
        }

        // 2. Strict match by stored session submission keys
        const myKeys = this.myReviewKeys;
        if (myKeys && myKeys.size > 0) {
            if (r.id && myKeys.has(String(r.id))) return true;
            const sig = this.getReviewSignature(r);
            if (sig && myKeys.has(sig)) return true;
        }

        return false;
    }

    /**
     * Generate unique signature for a review to prevent duplicate cards
     */
    getReviewSignature(r) {
        if (!r) return '';
        if (r.id && String(r.id).startsWith('demo_')) return String(r.id);
        const normReview = (r.review || '').trim().toLowerCase().replace(/\s+/g, ' ');
        const normName = (r.name || '').trim().toLowerCase();
        if (normReview) {
            return `${normName}::${normReview}`;
        }
        return String(r.id || Math.random());
    }

    /**
     * Deduplicate an array of reviews keeping the most authoritative version
     * Filters out any reviews marked as deleted
     */
    deduplicateReviews(list) {
        if (!Array.isArray(list)) return [];
        const seen = new Map();
        
        for (const item of list) {
            if (!item) continue;
            if (item.id && String(item.id).startsWith('demo_')) continue;
            const sig = this.getReviewSignature(item);
            if (!sig) continue;
            
            // If marked as deleted by user, skip it everywhere
            if (this.deletedSignatures.has(sig) || (item.id && this.deletedSignatures.has(String(item.id)))) {
                continue;
            }

            const itemLikes = typeof item.likes === 'number' ? item.likes : (parseInt(item.likes, 10) || 0);
            const isItemUUID = item.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(item.id));
            const itemSbId = item.supabaseId || (isItemUUID ? String(item.id) : null);
            const itemFsId = item.firestoreId || (!isItemUUID && item.id && !String(item.id).startsWith('rev_') && !String(item.id).startsWith('sb_') && !String(item.id).startsWith('demo_') ? String(item.id) : null);
            
            if (seen.has(sig)) {
                const existing = seen.get(sig);
                const existingLikes = typeof existing.likes === 'number' ? existing.likes : (parseInt(existing.likes, 10) || 0);
                const isItemDB = item.id && !String(item.id).startsWith('rev_') && !String(item.id).startsWith('temp_');
                const isExistingDB = existing.id && !String(existing.id).startsWith('rev_') && !String(existing.id).startsWith('temp_');
                
                const combinedLikes = Math.max(existingLikes, itemLikes);

                const merged = {
                    ...existing,
                    ...item,
                    supabaseId: itemSbId || existing.supabaseId || null,
                    firestoreId: itemFsId || existing.firestoreId || null,
                    id: (isItemDB ? String(item.id) : (isExistingDB ? String(existing.id) : String(item.id || existing.id))),
                    likes: combinedLikes,
                    isNew: existing.isNew && !isItemDB
                };
                seen.set(sig, merged);
            } else {
                seen.set(sig, {
                    ...item,
                    id: String(item.id || 'rev_' + Date.now()),
                    supabaseId: itemSbId,
                    firestoreId: itemFsId,
                    likes: itemLikes
                });
            }
        }
        
        return Array.from(seen.values()).sort((a, b) => {
            const timeA = new Date(a.createdAt || a.created_at || 0).getTime();
            const timeB = new Date(b.createdAt || b.created_at || 0).getTime();
            return timeB - timeA;
        });
    }

    mergeReviews(newReviews) {
        const combined = [...this.reviews];
        if (Array.isArray(newReviews)) {
            combined.push(...newReviews);
        }

        this.reviews = this.deduplicateReviews(combined);
    }

    setupCrossTabSync() {
        // 1. Zero-latency BroadcastChannel sync across all open tabs
        if (typeof BroadcastChannel !== 'undefined') {
            try {
                this.broadcastChannel = new BroadcastChannel('skil_reviews_sync_bus');
                this.broadcastChannel.onmessage = (event) => {
                    this.handleIncomingBroadcast(event.data);
                };
            } catch (e) {}
        }

        // 2. Storage event listener (fallback multi-window sync)
        window.addEventListener('storage', (e) => {
            if (e.key === 'skm_user_reviews_cache' && e.newValue) {
                try {
                    const updated = JSON.parse(e.newValue);
                    if (Array.isArray(updated)) {
                        this.reviews = this.deduplicateReviews(updated);
                        this.renderStats();
                        this.renderReviews();
                    }
                } catch (err) {}
            }
            if (e.key === 'skm_liked_reviews' && e.newValue) {
                try {
                    this.likedReviewIds = new Set(JSON.parse(e.newValue));
                    this.renderReviews();
                } catch (err) {}
            }
            if (e.key === 'skm_deleted_signatures' && e.newValue) {
                try {
                    this.deletedSignatures = new Set(JSON.parse(e.newValue));
                    this.reviews = this.deduplicateReviews(this.reviews);
                    this.renderStats();
                    this.renderReviews();
                } catch (err) {}
            }
        });
    }

    broadcastReviewEvent(data) {
        if (this.broadcastChannel) {
            try {
                this.broadcastChannel.postMessage(data);
            } catch (e) {}
        }
    }

    handleIncomingBroadcast(msg) {
        if (!msg || typeof msg !== 'object') return;
        if (msg.type === 'DELETE') {
            const { reviewId, signature } = msg;
            if (reviewId) this.deletedSignatures.add(String(reviewId));
            if (signature) this.deletedSignatures.add(signature);
            this.reviews = this.reviews.filter(r => String(r.id) !== String(reviewId) && (!signature || this.getReviewSignature(r) !== signature));
            this.renderStats();
            this.renderReviews();
        } else if (msg.type === 'LIKE') {
            const { reviewId, signature, likes } = msg;
            const target = this.reviews.find(r => (reviewId && String(r.id) === String(reviewId)) || (signature && this.getReviewSignature(r) === signature));
            if (target) {
                target.likes = likes;
            }
            const isThisUserLiked = (reviewId && this.likedReviewIds.has(String(reviewId))) || (signature && this.likedReviewIds.has(signature));
            this.updateLikeButtonDOM(reviewId, likes, isThisUserLiked);
            localStorage.setItem('skm_user_reviews_cache', JSON.stringify(this.reviews));
        } else if (msg.type === 'NEW_REVIEW' && msg.review) {
            this.mergeReviews([msg.review]);
            this.renderStats();
            this.renderReviews();
        }
    }

    updateLikeButtonDOM(reviewId, count, isLiked) {
        const stringId = String(reviewId);
        const allMatchingBtns = document.querySelectorAll(`[data-like-id="${stringId}"]`);
        allMatchingBtns.forEach(btn => {
            if (isLiked !== undefined) {
                btn.classList.toggle('liked', !!isLiked);
                btn.setAttribute('title', isLiked ? 'Upvoted (Locked)' : 'Upvote Review');
            }
            const countSpan = btn.querySelector('.like-count');
            if (countSpan) {
                countSpan.textContent = typeof count === 'number' ? count : (parseInt(count, 10) || 0);
            }
            const icon = btn.querySelector('i');
            if (icon) {
                icon.classList.remove('heart-popping');
                void icon.offsetWidth; // Trigger reflow
                icon.classList.add('heart-popping');
            }
        });
    }

    setupAuthObserver() {
        const updateAuthUI = (user) => {
            const authBar = document.getElementById('user-auth-state-bar');
            const submitBtn = document.getElementById('btn-submit-review-action');
            const nameInput = document.getElementById('rv-input-name');

            if (user && !user.isGuest) {
                let rawName = user.displayName || user.name || '';
                if (!rawName) {
                    if (user.email) {
                        const prefix = user.email.split('@')[0];
                        rawName = prefix.charAt(0).toUpperCase() + prefix.slice(1);
                    } else {
                        rawName = 'Verified Student';
                    }
                }
                const name = this.escapeHTML(rawName);
                const photo = user.photoURL || user.photo || '';
                const email = this.escapeHTML(user.email || '');
                const initial = (name || 'S').charAt(0).toUpperCase();

                // Prefill custom name field if not manually modified
                if (nameInput) {
                    if (!nameInput.value || nameInput.value === 'Student Reviewer') {
                        nameInput.value = rawName;
                    }
                    nameInput.placeholder = `Your Name (e.g. ${name})`;
                }
                
                if (authBar) {
                    authBar.innerHTML = `
                        <div class="auth-user-preview-compact">
                            ${photo 
                                ? `<img src="${photo}" alt="${name}" class="auth-user-img-compact" referrerpolicy="no-referrer" onerror="this.outerHTML='<div class=\\'auth-user-avatar-initial-compact\\'>${initial}</div>'">` 
                                : `<div class="auth-user-avatar-initial-compact">${initial}</div>`
                            }
                            <div class="rc-name-col">
                                <div class="auth-user-name-compact">${name}</div>
                                <div class="rc-sub-compact">${email || 'Engineering Student'}</div>
                            </div>
                        </div>
                        <div class="auth-verified-badge-pill">
                            <i class="fas fa-check-circle"></i> Verified ✓
                        </div>
                    `;
                }

                if (submitBtn && !this._isSubmitting) {
                    submitBtn.classList.remove('needs-auth');
                    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> <span>Submit Review</span>';
                }
            } else {
                if (nameInput) {
                    nameInput.placeholder = 'Your Name (Sign in with Google)';
                }

                if (authBar) {
                    authBar.innerHTML = `
                        <div class="auth-user-preview-compact">
                            <div class="auth-user-avatar-initial-compact"><i class="fas fa-user-graduate"></i></div>
                            <div class="rc-name-col">
                                <div class="auth-user-name-compact">Student Reviewer</div>
                                <div class="rc-sub-compact"><span style="color: #fbbf24;"><i class="fas fa-lock" style="font-size:0.6rem;"></i> Sign in required to post</span></div>
                            </div>
                        </div>
                        <button type="button" class="btn-google-auth-micro" id="rv-google-login-btn">
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google">
                            <span>Sign in</span>
                        </button>
                    `;

                    const googleBtn = document.getElementById('rv-google-login-btn');
                    if (googleBtn) {
                        googleBtn.addEventListener('click', () => this.handleGoogleLogin());
                    }
                }

                if (submitBtn && !this._isSubmitting) {
                    submitBtn.classList.add('needs-auth');
                    submitBtn.innerHTML = '<i class="fab fa-google"></i> <span>Sign In with Google to Submit</span>';
                }
            }
        };

        // 1. Firebase Auth state listener
        if (window.firebaseServices && window.firebaseServices.auth) {
            window.firebaseServices.onAuthStateChanged(window.firebaseServices.auth, (user) => {
                updateAuthUI(user);
                this.renderReviews();
            });
        }

        // 2. Custom global auth-ready listener
        window.addEventListener('auth-ready', (e) => {
            if (e.detail && (e.detail.currentUser || e.detail.user)) {
                updateAuthUI(e.detail.currentUser || e.detail.user);
                this.renderReviews();
            }
        });
        
        // 3. Fallback from local storage caches
        try {
            const cached = JSON.parse(localStorage.getItem('auth_user_full') || localStorage.getItem('user') || 'null');
            if (cached) updateAuthUI(cached);
            else updateAuthUI(null);
        } catch (e) {
            updateAuthUI(null);
        }
    }

    async handleGoogleLogin() {
        try {
            if (window.firebaseServices && window.firebaseServices.auth) {
                const { auth, provider, signInWithPopup } = window.firebaseServices;
                const result = await signInWithPopup(auth, provider);
                if (result && result.user) {
                    const user = result.user;
                    const userData = {
                        id: user.uid,
                        uid: user.uid,
                        name: user.displayName || 'Verified Student',
                        displayName: user.displayName || 'Verified Student',
                        email: user.email,
                        photo: user.photoURL || '',
                        photoURL: user.photoURL || '',
                        isGuest: false
                    };
                    localStorage.setItem('auth_user_full', JSON.stringify(userData));
                    this.showToast(`✅ Welcome ${user.displayName || 'Student'}! You are now verified.`);
                    
                    const authBar = document.getElementById('user-auth-state-bar');
                    if (authBar) {
                        const name = this.escapeHTML(userData.name);
                        const initial = (name || 'S').charAt(0).toUpperCase();
                        authBar.innerHTML = `
                            <div class="auth-user-preview-compact">
                                ${userData.photo 
                                    ? `<img src="${userData.photo}" alt="${name}" class="auth-user-img-compact" referrerpolicy="no-referrer" onerror="this.outerHTML='<div class=\\'auth-user-avatar-initial-compact\\'>${initial}</div>'">` 
                                    : `<div class="auth-user-avatar-initial-compact">${initial}</div>`
                                }
                                <div class="rc-name-col">
                                    <div class="auth-user-name-compact">${name}</div>
                                    <div class="rc-sub-compact">${userData.email || 'Engineering Student'}</div>
                                </div>
                            </div>
                            <div class="auth-verified-badge-pill">
                                <i class="fas fa-check-circle"></i> Verified ✓
                            </div>
                        `;
                    }
                    const submitBtn = document.getElementById('btn-submit-review-action');
                    if (submitBtn) {
                        submitBtn.classList.remove('needs-auth');
                        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> <span>Submit Review</span>';
                    }
                    return userData;
                }
            } else {
                window.location.href = 'pages/login.html';
            }
        } catch (err) {
            console.warn('Google sign-in status:', err);
            if (err && err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
                this.showToast('⚠️ Could not complete Google sign in.');
            }
        }
        return null;
    }

    setupRatingSelector() {
        const starContainer = document.getElementById('rv-star-container');
        const feedbackText = document.getElementById('rv-star-feedback');
        if (!starContainer || !feedbackText) return;

        const starLabels = {
            1: '★ 1.0 (Needs Work)',
            2: '★★ 2.0 (Fair)',
            3: '★★★ 3.0 (Good)',
            4: '★★★★ 4.0 (Great)',
            5: '★★★★★ 5.0 (Excellent)'
        };

        const updateStarsUI = (rating) => {
            const stars = starContainer.querySelectorAll('.interactive-star-v2');
            stars.forEach((star, index) => {
                const starVal = index + 1;
                const isFilled = rating > 0 && starVal <= rating;
                star.classList.toggle('active', isFilled);
                star.classList.toggle('fas', isFilled);
                star.classList.toggle('far', !isFilled);
            });

            if (rating > 0) {
                feedbackText.textContent = starLabels[rating] || `${rating}.0 Stars`;
            } else {
                feedbackText.textContent = 'Tap to rate (1–5 Stars)';
            }
        };

        // Start at 0 by default
        updateStarsUI(this.selectedRating);

        const stars = starContainer.querySelectorAll('.interactive-star-v2');
        stars.forEach((star) => {
            star.addEventListener('mouseenter', () => {
                const hoverVal = parseInt(star.getAttribute('data-val'), 10);
                stars.forEach((s, idx) => {
                    const isHovered = idx + 1 <= hoverVal;
                    s.classList.toggle('hovered', isHovered);
                    s.classList.toggle('fas', isHovered);
                    s.classList.toggle('far', !isHovered);
                });
                feedbackText.textContent = starLabels[hoverVal];
            });

            star.addEventListener('mouseleave', () => {
                stars.forEach(s => s.classList.remove('hovered'));
                updateStarsUI(this.selectedRating);
            });

            const selectStar = (e) => {
                this.selectedRating = parseInt(star.getAttribute('data-val'), 10);
                updateStarsUI(this.selectedRating);
            };

            star.addEventListener('click', selectStar);
            star.addEventListener('touchstart', selectStar, { passive: true });
        });
    }

    setupCarouselControls() {
        const track = document.getElementById('reviews-grid-container');
        const trackContainer = document.getElementById('reviews-track-container') || track;
        const btnLeft = document.getElementById('btn-carousel-left');
        const btnRight = document.getElementById('btn-carousel-right');

        if (btnLeft && track) {
            btnLeft.addEventListener('click', () => {
                this.pauseAutoScrollBriefly(3000);
                track.scrollBy({ left: -290, behavior: 'smooth' });
                setTimeout(() => { if (track) this.scrollPos = track.scrollLeft; }, 350);
            });
        }

        if (btnRight && track) {
            btnRight.addEventListener('click', () => {
                this.pauseAutoScrollBriefly(3000);
                track.scrollBy({ left: 290, behavior: 'smooth' });
                setTimeout(() => { if (track) this.scrollPos = track.scrollLeft; }, 350);
            });
        }

        const handleEnter = () => {
            clearTimeout(this._pauseTimer);
            this.isUserInteracting = true;
            if (track) this.scrollPos = track.scrollLeft;
        };

        const handleLeave = () => {
            clearTimeout(this._pauseTimer);
            this._pauseTimer = setTimeout(() => {
                if (track) this.scrollPos = track.scrollLeft;
                this.isUserInteracting = false;
            }, 250);
        };

        if (trackContainer) {
            trackContainer.addEventListener('mouseenter', handleEnter);
            trackContainer.addEventListener('mouseleave', handleLeave);
            trackContainer.addEventListener('pointerenter', handleEnter);
            trackContainer.addEventListener('pointerleave', handleLeave);
            
            trackContainer.addEventListener('touchstart', handleEnter, { passive: true });
            trackContainer.addEventListener('touchend', () => {
                this.pauseAutoScrollBriefly(1500);
            }, { passive: true });
            trackContainer.addEventListener('touchcancel', () => {
                this.pauseAutoScrollBriefly(1000);
            }, { passive: true });
        }

        if (track) {
            track.addEventListener('mouseenter', handleEnter);
            track.addEventListener('mouseleave', handleLeave);
            
            track.addEventListener('scroll', () => {
                if (this.isUserInteracting) {
                    this.scrollPos = track.scrollLeft;
                }
            }, { passive: true });
        }
    }

    startInfiniteLoop() {
        if (this.animFrameId) {
            cancelAnimationFrame(this.animFrameId);
        }

        const track = document.getElementById('reviews-grid-container');
        if (!track) return;

        const loopTicker = () => {
            if (track && track.children.length > 1 && !this.isUserInteracting) {
                const maxScroll = track.scrollWidth - track.clientWidth;
                if (maxScroll > 10) {
                    if (track.scrollLeft >= maxScroll - 2) {
                        track.scrollTo({ left: 0, behavior: 'smooth' });
                        this.scrollPos = 0;
                        this.pauseAutoScrollBriefly(2500);
                    } else {
                        this.scrollPos = track.scrollLeft + 0.6;
                        track.scrollLeft = this.scrollPos;
                    }
                }
            }

            this.animFrameId = requestAnimationFrame(loopTicker);
        };

        this.animFrameId = requestAnimationFrame(loopTicker);
    }

    pauseAutoScrollBriefly(delayMs = 2500) {
        this.isUserInteracting = true;
        clearTimeout(this._pauseTimer);
        this._pauseTimer = setTimeout(() => {
            const track = document.getElementById('reviews-grid-container');
            if (track) {
                this.scrollPos = track.scrollLeft;
            }
            this.isUserInteracting = false;
        }, delayMs);
    }

    setupEventListeners() {
        const textarea = document.getElementById('rv-textarea');
        const charCounter = document.getElementById('rv-char-count');
        if (textarea && charCounter) {
            textarea.addEventListener('input', () => {
                charCounter.textContent = `${textarea.value.length} / 500`;
            });
        }

        const form = document.getElementById('rv-submit-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleReviewSubmit(e));
        }
    }

    async fetchSupabaseReviewsREST() {
        try {
            const res = await fetch(`${SUPABASE_URL}/rest/v1/student_reviews?select=*&order=created_at.desc&limit=50`, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    return data;
                }
            }
        } catch (e) {
            console.warn('Supabase REST fetch note:', e);
        }
        return null;
    }

    async updateSupabaseLikesREST(reviewId, supabaseId, reviewText, newCount) {
        const headers = {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        };
        const payload = JSON.stringify({ likes: newCount });

        // 1. If we have a valid Supabase UUID / numeric ID
        const targetId = supabaseId || (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(reviewId)) || /^\d+$/.test(String(reviewId)) ? String(reviewId) : null);
        if (targetId) {
            try {
                await fetch(`${SUPABASE_URL}/rest/v1/student_reviews?id=eq.${targetId}`, {
                    method: 'PATCH',
                    headers,
                    body: payload
                });
            } catch (e) {}
        }

        // 2. Also update by exact review text as a fail-safe
        if (reviewText && reviewText.trim()) {
            try {
                await fetch(`${SUPABASE_URL}/rest/v1/student_reviews?review=eq.${encodeURIComponent(reviewText.trim())}`, {
                    method: 'PATCH',
                    headers,
                    body: payload
                });
            } catch (e) {}
        }
    }

    async deleteSupabaseReviewREST(reviewId, supabaseId, reviewText) {
        const headers = {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        };

        const targetId = supabaseId || (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(reviewId)) || /^\d+$/.test(String(reviewId)) ? String(reviewId) : null);
        if (targetId) {
            try {
                await fetch(`${SUPABASE_URL}/rest/v1/student_reviews?id=eq.${targetId}`, {
                    method: 'DELETE',
                    headers
                });
            } catch (e) {}
        }

        if (reviewText && reviewText.trim()) {
            try {
                await fetch(`${SUPABASE_URL}/rest/v1/student_reviews?review=eq.${encodeURIComponent(reviewText.trim())}`, {
                    method: 'DELETE',
                    headers
                });
            } catch (e) {}
        }
    }

    async getSupabaseClient() {
        if (window.supabase && typeof window.supabase.from === 'function') return window.supabase;
        
        if (window.supabase && typeof window.supabase.createClient === 'function') {
            window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            return window.supabase;
        }

        try {
            const m = await import('./supabase-config.js').catch(() => null) 
                   || await import('../js/supabase-config.js').catch(() => null);
            if (m && m.supabase) {
                window.supabase = m.supabase;
                return m.supabase;
            }
        } catch (e) {}
        return null;
    }

    /**
     * Reconcile database reviews with local cache (authoritative sync from Supabase)
     */
    syncDatabaseReviewsList(dbList) {
        if (!Array.isArray(dbList)) return;

        const formattedDbReviews = dbList.map(item => {
            const isUUID = item.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(item.id));
            return {
                id: item.id ? String(item.id) : ('sb_' + (item.created_at || Date.now())),
                supabaseId: item.supabaseId || (isUUID ? String(item.id) : null),
                firestoreId: item.firestoreId || (!isUUID && item.id && !String(item.id).startsWith('rev_') && !String(item.id).startsWith('sb_') && !String(item.id).startsWith('demo_') ? String(item.id) : null),
                name: item.name || 'Verified Student',
                photo: item.photo || '',
                email: item.email || '',
                branch: item.branch || item.college || 'Engineering Student',
                rating: parseFloat(item.rating) || 5.0,
                review: item.review || '',
                likes: (item.likes !== undefined && item.likes !== null && !isNaN(parseInt(item.likes, 10))) ? parseInt(item.likes, 10) : 0,
                verified: item.verified !== false,
                createdAt: item.created_at || item.createdAt || new Date().toISOString()
            };
        }).filter(item => {
            const sig = this.getReviewSignature(item);
            return !this.deletedSignatures.has(sig) && !this.deletedSignatures.has(String(item.id));
        });

        // Retain only genuinely pending local submissions (created less than 20s ago that have not landed in DB yet)
        const now = Date.now();
        const pendingLocal = this.reviews.filter(r => {
            if (r.id && String(r.id).startsWith('rev_') && !r.supabaseId && !r.firestoreId) {
                const ts = parseInt(String(r.id).replace('rev_', ''), 10);
                if (!isNaN(ts) && now - ts < 20000) return true;
            }
            return false;
        });

        // Database is authoritative: replace cached reviews with live database list + pending
        const combined = [...pendingLocal, ...formattedDbReviews];
        this.reviews = this.deduplicateReviews(combined);
        localStorage.setItem('skm_user_reviews_cache', JSON.stringify(this.reviews));
        this.renderStats();
        this.renderReviews();
    }

    handleRemoteDelete(deletedId, oldData) {
        const idStr = deletedId ? String(deletedId) : '';
        const oldSig = oldData ? this.getReviewSignature(oldData) : '';

        if (idStr) this.deletedSignatures.add(idStr);
        if (oldSig) this.deletedSignatures.add(oldSig);
        localStorage.setItem('skm_deleted_signatures', JSON.stringify(Array.from(this.deletedSignatures)));

        this.reviews = this.reviews.filter(r => {
            if (idStr && String(r.id) === idStr) return false;
            if (oldSig && this.getReviewSignature(r) === oldSig) return false;
            return true;
        });

        localStorage.setItem('skm_user_reviews_cache', JSON.stringify(this.reviews));
        this.renderStats();
        this.renderReviews();
    }

    handleRemoteUpdate(item) {
        if (!item) return;
        const formatted = {
            id: item.id ? String(item.id) : '',
            name: item.name || 'Verified Student',
            photo: item.photo || '',
            email: item.email || '',
            branch: item.branch || item.college || 'Engineering Student',
            rating: parseFloat(item.rating) || 5.0,
            review: item.review || '',
            likes: (item.likes !== undefined && item.likes !== null && !isNaN(parseInt(item.likes, 10))) ? parseInt(item.likes, 10) : 0,
            verified: item.verified !== false,
            createdAt: item.created_at || item.createdAt || new Date().toISOString()
        };

        const targetSig = this.getReviewSignature(formatted);
        if (this.deletedSignatures.has(targetSig) || (formatted.id && this.deletedSignatures.has(formatted.id))) {
            return;
        }

        let found = false;
        this.reviews = this.reviews.map(r => {
            if ((formatted.id && String(r.id) === formatted.id) || (targetSig && this.getReviewSignature(r) === targetSig)) {
                found = true;
                return { ...r, ...formatted, isNew: false };
            }
            return r;
        });

        if (!found) {
            this.reviews.unshift(formatted);
            this.reviews = this.deduplicateReviews(this.reviews);
        }

        localStorage.setItem('skm_user_reviews_cache', JSON.stringify(this.reviews));
        this.renderStats();
        this.renderReviews();

        if (formatted.id) {
            this.updateLikeButtonDOM(formatted.id, formatted.likes, this.likedReviewIds.has(formatted.id));
        }
    }

    handleRemoteInsert(item) {
        if (!item) return;
        const formatted = {
            id: item.id ? String(item.id) : ('rev_' + Date.now()),
            name: item.name || 'Verified Student',
            photo: item.photo || '',
            email: item.email || '',
            branch: item.branch || item.college || 'Engineering Student',
            rating: parseFloat(item.rating) || 5.0,
            review: item.review || '',
            likes: (item.likes !== undefined && item.likes !== null && !isNaN(parseInt(item.likes, 10))) ? parseInt(item.likes, 10) : 0,
            verified: item.verified !== false,
            createdAt: item.created_at || item.createdAt || new Date().toISOString(),
            isNew: false
        };

        const sig = this.getReviewSignature(formatted);
        if (this.deletedSignatures.has(sig) || (formatted.id && this.deletedSignatures.has(formatted.id))) {
            return;
        }

        this.reviews = this.deduplicateReviews([formatted, ...this.reviews]);
        localStorage.setItem('skm_user_reviews_cache', JSON.stringify(this.reviews));
        this.renderStats();
        this.renderReviews();
    }

    async connectLiveDatabase() {
        // 1. Initial Load via REST API (Instant, guaranteed, authoritative)
        this.fetchSupabaseReviewsREST().then(restData => {
            if (Array.isArray(restData)) {
                this.syncDatabaseReviewsList(restData);
            }
        });

        // 2. Fetch from Supabase SDK & Subscribe to Real-Time Postgres Changes
        try {
            const sb = await this.getSupabaseClient();
            if (sb) {
                const { data, error } = await sb
                    .from('student_reviews')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (!error && Array.isArray(data)) {
                    this.syncDatabaseReviewsList(data);
                }

                // Real-Time Subscription for Supabase
                try {
                    sb.channel('realtime_student_reviews')
                        .on(
                            'postgres_changes',
                            { event: '*', schema: 'public', table: 'student_reviews' },
                            (payload) => {
                                if (payload.eventType === 'DELETE') {
                                    this.handleRemoteDelete(payload.old?.id, payload.old);
                                    this.refreshDatabaseReviews();
                                } else if (payload.eventType === 'UPDATE') {
                                    this.handleRemoteUpdate(payload.new);
                                } else if (payload.eventType === 'INSERT') {
                                    this.handleRemoteInsert(payload.new);
                                }
                            }
                        )
                        .subscribe();
                } catch (chErr) {
                    console.warn('Supabase Realtime subscription note:', chErr);
                }
            }
        } catch (sbErr) {
            console.warn('Supabase reviews load note:', sbErr);
        }

        // 3. Tab focus & visibility change listener (Auto-refresh instantly when returning from Supabase dashboard)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.refreshDatabaseReviews();
            }
        });
        window.addEventListener('focus', () => {
            this.refreshDatabaseReviews();
        });

        // 4. Periodic lightweight cloud refresh (every 8s) to guarantee real-time sync with Supabase
        if (!this._pollInterval) {
            this._pollInterval = setInterval(() => {
                this.refreshDatabaseReviews();
            }, 8000);
        }
    }

    async refreshDatabaseReviews() {
        const restData = await this.fetchSupabaseReviewsREST();
        if (Array.isArray(restData)) {
            this.syncDatabaseReviewsList(restData);
        }
    }

    /**
     * Grand Confetti / Party Popper celebration animation with multi-cannons & rich particle shapes
     */
    triggerPartyPopper() {
        try {
            let canvas = document.getElementById('rv-confetti-canvas');
            if (!canvas) {
                canvas = document.createElement('canvas');
                canvas.id = 'rv-confetti-canvas';
                document.body.appendChild(canvas);
            }
            
            const ctx = canvas.getContext('2d');
            const width = (canvas.width = window.innerWidth);
            const height = (canvas.height = window.innerHeight);

            const colors = [
                '#fbbf24', '#f59e0b', // Gold / Amber
                '#6366f1', '#818cf8', // Indigo
                '#06b6d4', '#38bdf8', // Cyan / Sky
                '#10b981', '#34d399', // Emerald
                '#ec4899', '#f43f5e', // Pink / Rose
                '#a855f7', '#c084fc', // Violet / Purple
                '#ffffff'             // Sparkle White
            ];

            const particles = [];
            // Cannon positions: Left corner, Right corner, and Center
            const cannons = [
                { x: width * 0.12, y: height * 0.85, angleMin: -75, angleMax: -25, speed: 20 },
                { x: width * 0.88, y: height * 0.85, angleMin: -155, angleMax: -105, speed: 20 },
                { x: width * 0.50, y: height * 0.70, angleMin: -120, angleMax: -60, speed: 18 }
            ];

            const shapes = ['ribbon', 'star', 'circle', 'diamond'];

            cannons.forEach(cannon => {
                const count = Math.min(65, Math.max(35, Math.floor(width / 32)));
                for (let i = 0; i < count; i++) {
                    const angleDeg = cannon.angleMin + Math.random() * (cannon.angleMax - cannon.angleMin);
                    const angleRad = (angleDeg * Math.PI) / 180;
                    const speed = cannon.speed * (0.65 + Math.random() * 0.7);
                    const shape = shapes[Math.floor(Math.random() * shapes.length)];
                    
                    particles.push({
                        x: cannon.x + (Math.random() - 0.5) * 30,
                        y: cannon.y + (Math.random() - 0.5) * 20,
                        vx: Math.cos(angleRad) * speed,
                        vy: Math.sin(angleRad) * speed,
                        gravity: 0.32 + Math.random() * 0.12,
                        drag: 0.975,
                        size: shape === 'star' ? (Math.random() * 7 + 7) : (Math.random() * 8 + 5),
                        color: colors[Math.floor(Math.random() * colors.length)],
                        rotation: Math.random() * 360,
                        rotationSpeed: (Math.random() - 0.5) * 16,
                        wobble: Math.random() * 10,
                        wobbleSpeed: Math.random() * 0.1 + 0.05,
                        alpha: 1,
                        decay: Math.random() * 0.008 + 0.006,
                        shape: shape
                    });
                }
            });

            const drawStar = (cx, cy, spikes, outerRadius, innerRadius, fill) => {
                let rot = (Math.PI / 2) * 3;
                let x = cx;
                let y = cy;
                const step = Math.PI / spikes;

                ctx.beginPath();
                ctx.moveTo(cx, cy - outerRadius);
                for (let i = 0; i < spikes; i++) {
                    x = cx + Math.cos(rot) * outerRadius;
                    y = cy + Math.sin(rot) * outerRadius;
                    ctx.lineTo(x, y);
                    rot += step;

                    x = cx + Math.cos(rot) * innerRadius;
                    y = cy + Math.sin(rot) * innerRadius;
                    ctx.lineTo(x, y);
                    rot += step;
                }
                ctx.lineTo(cx, cy - outerRadius);
                ctx.closePath();
                ctx.fillStyle = fill;
                ctx.fill();
            };

            let animationId;
            const startTime = Date.now();

            const render = () => {
                const elapsed = Date.now() - startTime;
                ctx.clearRect(0, 0, width, height);

                let aliveCount = 0;
                for (let i = 0; i < particles.length; i++) {
                    const p = particles[i];
                    if (p.alpha <= 0) continue;
                    aliveCount++;

                    p.x += p.vx;
                    p.y += p.vy;
                    p.vy += p.gravity;
                    p.vx *= p.drag;
                    p.rotation += p.rotationSpeed;
                    p.wobble += p.wobbleSpeed;
                    p.alpha -= p.decay;

                    const wobbleScale = Math.cos(p.wobble);

                    ctx.save();
                    ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
                    ctx.translate(p.x, p.y);
                    ctx.rotate((p.rotation * Math.PI) / 180);

                    if (p.shape === 'star') {
                        drawStar(0, 0, 5, p.size, p.size * 0.45, p.color);
                    } else if (p.shape === 'ribbon') {
                        ctx.scale(1, wobbleScale);
                        ctx.fillStyle = p.color;
                        ctx.fillRect(-p.size / 2, -p.size * 1.6 / 2, p.size, p.size * 1.6);
                    } else if (p.shape === 'diamond') {
                        ctx.scale(wobbleScale, 1);
                        ctx.beginPath();
                        ctx.moveTo(0, -p.size);
                        ctx.lineTo(p.size * 0.7, 0);
                        ctx.lineTo(0, p.size);
                        ctx.lineTo(-p.size * 0.7, 0);
                        ctx.closePath();
                        ctx.fillStyle = p.color;
                        ctx.fill();
                    } else {
                        // Circle
                        ctx.beginPath();
                        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                        ctx.fillStyle = p.color;
                        ctx.fill();
                    }

                    ctx.restore();
                }

                if (aliveCount > 0 && elapsed < 4200) {
                    animationId = requestAnimationFrame(render);
                } else {
                    ctx.clearRect(0, 0, width, height);
                    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
                }
            };

            animationId = requestAnimationFrame(render);
        } catch (e) {
            console.warn('Popper animation note:', e);
        }
    }

    async handleReviewSubmit(e) {
        if (e && e.preventDefault) e.preventDefault();

        const submitBtn = document.getElementById('btn-submit-review-action');
        const textarea = document.getElementById('rv-textarea');
        const nameInput = document.getElementById('rv-input-name');
        const branchInput = document.getElementById('rv-input-branch');

        // Check authentication: ONLY signed-in users can submit
        let currentUser = this.getCurrentUser();
        if (!currentUser || currentUser.isGuest) {
            this.showToast('🔒 Please sign in with Google to publish your review.');
            const loggedIn = await this.handleGoogleLogin();
            if (!loggedIn) {
                return;
            }
            currentUser = loggedIn;
        }

        if (this.selectedRating === 0) {
            this.showToast('⚠️ Please tap a star to give a rating (1 to 5 stars).');
            return;
        }

        if (!textarea || !textarea.value.trim()) {
            this.showToast('⚠️ Please write your review experience.');
            return;
        }

        const reviewText = textarea.value.trim();
        if (reviewText.length < 8) {
            this.showToast('⚠️ Please write at least 8 characters.');
            return;
        }

        // Guard against duplicate simultaneous clicks
        if (this._isSubmitting) return;
        this._isSubmitting = true;

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.classList.add('is-loading');
            submitBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> <span>Publishing Review...</span>';
        }

        try {
            const customName = nameInput ? nameInput.value.trim() : '';
            const studentName = customName || currentUser?.displayName || currentUser?.name || 'Verified Student';
            const studentPhoto = currentUser?.photoURL || currentUser?.photo || '';
            const studentEmail = currentUser?.email || '';
            const branch = branchInput?.value.trim() || 'B.Tech / Engineering';
            const isVerified = true;

            const newReview = {
                id: 'rev_' + Date.now(),
                name: studentName,
                photo: studentPhoto,
                email: studentEmail,
                branch: branch,
                rating: this.selectedRating,
                review: reviewText,
                likes: 0,
                verified: isVerified,
                isNew: true,
                createdAt: new Date().toISOString()
            };

            // Clean any prior deleted signatures for this new review
            const newSig = this.getReviewSignature(newReview);
            if (this.deletedSignatures.has(newReview.id)) this.deletedSignatures.delete(newReview.id);
            if (newSig && this.deletedSignatures.has(newSig)) this.deletedSignatures.delete(newSig);
            localStorage.setItem('skm_deleted_signatures', JSON.stringify(Array.from(this.deletedSignatures)));

            // Track ownership so user can delete their review
            this.myReviewKeys.add(newReview.id);
            this.myReviewKeys.add(newSig);
            localStorage.setItem('skm_my_review_keys', JSON.stringify(Array.from(this.myReviewKeys)));

            // 1. Instant Optimistic UI update with Strict Deduplication
            this.reviews = this.deduplicateReviews([newReview, ...this.reviews]);
            this.scrollPos = 0;
            this.renderStats();
            this.renderReviews();

            // Smooth scroll horizontal track to the front
            const track = document.getElementById('reviews-grid-container');
            if (track) track.scrollTo({ left: 0, behavior: 'smooth' });

            // 2. Persist to local cache immediately
            localStorage.setItem('skm_user_reviews_cache', JSON.stringify(this.reviews));

            // Reset inputs
            textarea.value = '';
            const charCounter = document.getElementById('rv-char-count');
            if (charCounter) charCounter.textContent = '0 / 500';

            // 🎉 Trigger grand celebratory party popper confetti
            this.triggerPartyPopper();
            this.showToast('🎉 Review Live! Thank you for rating SKiL MATRiX!');

            // 3. Asynchronously sync to Supabase & Firestore in background (Non-blocking)
            this.syncReviewToDatabases(newReview);

        } catch (err) {
            console.error('Review submit error:', err);
            this.showToast('⚠️ Review saved locally on your wall.');
        } finally {
            // Reset submit button state
            this._isSubmitting = false;
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.classList.remove('is-loading');
                submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> <span>Submit Review</span>';
            }
        }
    }

    async syncReviewToDatabases(reviewData) {
        // 1. Supabase Insert via Direct REST API (with 4s timeout protection)
        try {
            const res = await fetch(`${SUPABASE_URL}/rest/v1/student_reviews`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    name: reviewData.name,
                    photo: reviewData.photo,
                    email: reviewData.email,
                    branch: reviewData.branch,
                    rating: reviewData.rating,
                    review: reviewData.review,
                    likes: reviewData.likes || 0,
                    verified: reviewData.verified,
                    created_at: reviewData.createdAt
                })
            });

            if (res.ok) {
                const sbData = await res.json();
                if (Array.isArray(sbData) && sbData[0]?.id) {
                    const cloudId = String(sbData[0].id);
                    reviewData.supabaseId = cloudId;
                    reviewData.id = cloudId;
                    this.myReviewKeys.add(cloudId);
                    localStorage.setItem('skm_my_review_keys', JSON.stringify(Array.from(this.myReviewKeys)));
                    localStorage.setItem('skm_user_reviews_cache', JSON.stringify(this.reviews));
                    this.renderReviews();
                }
            }
        } catch (sbErr) {
            console.warn('Supabase review insert note:', sbErr);
        }

        // 2. Firestore Insert (with 4s timeout protection)
        try {
            if (window.firebaseServices && window.firebaseServices.db) {
                const { db, collection, addDoc, serverTimestamp } = window.firebaseServices;
                const addPromise = addDoc(collection(db, 'student_reviews'), {
                    name: reviewData.name,
                    photo: reviewData.photo,
                    email: reviewData.email,
                    branch: reviewData.branch,
                    rating: reviewData.rating,
                    review: reviewData.review,
                    likes: reviewData.likes || 0,
                    verified: reviewData.verified,
                    createdAt: reviewData.createdAt,
                    serverTime: serverTimestamp()
                });

                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Firestore insert timeout')), 4000)
                );

                const docRef = await Promise.race([addPromise, timeoutPromise]);
                if (docRef && docRef.id) {
                    reviewData.firestoreId = docRef.id;
                    this.myReviewKeys.add(docRef.id);
                    localStorage.setItem('skm_my_review_keys', JSON.stringify(Array.from(this.myReviewKeys)));
                    localStorage.setItem('skm_user_reviews_cache', JSON.stringify(this.reviews));
                    this.renderReviews();
                }
            }
        } catch (dbErr) {
            console.warn('Firestore review save note:', dbErr.message || dbErr);
        }

        // Broadcast to other open tabs
        this.broadcastReviewEvent({ type: 'NEW_REVIEW', review: reviewData });

        // 3. Analytics event
        try {
            if (typeof gtag === 'function') {
                gtag('event', 'student_review_submitted', {
                    rating: reviewData.rating,
                    branch: reviewData.branch
                });
            }
        } catch (e) {}
    }

    /**
     * Permanent Locked Like / Upvote System (1 Upvote per student, strictly locked)
     * Synchronizes live to Supabase & Firestore so all students worldwide see the exact same count
     */
    async handleLike(reviewId, btnEl) {
        if (!reviewId) return;

        const stringId = String(reviewId);
        const target = this.reviews.find(r => String(r.id) === stringId);
        const targetSig = target ? this.getReviewSignature(target) : '';
        
        // Locked: If already upvoted, do not allow removing or decreasing
        if (this.likedReviewIds.has(stringId) || (targetSig && this.likedReviewIds.has(targetSig))) {
            this.showToast('🔒 You already upvoted this review. Upvotes are locked!');
            return;
        }

        // 1. Lock the upvote permanently for this user
        this.likedReviewIds.add(stringId);
        if (targetSig) this.likedReviewIds.add(targetSig);
        localStorage.setItem('skm_liked_reviews', JSON.stringify(Array.from(this.likedReviewIds)));

        const currentLikes = target && typeof target.likes === 'number' ? target.likes : (parseInt(target?.likes, 10) || 0);
        const newLikeCount = currentLikes + 1;

        if (target) {
            target.likes = newLikeCount;
        }

        // 2. Persist to local cache immediately
        localStorage.setItem('skm_user_reviews_cache', JSON.stringify(this.reviews));

        // 3. Update all matching buttons across the DOM with locked liked status
        this.updateLikeButtonDOM(stringId, newLikeCount, true);

        // 4. Broadcast across all open browser tabs
        this.broadcastReviewEvent({ type: 'LIKE', reviewId: stringId, signature: targetSig, likes: newLikeCount });

        // 5. Sync to Supabase via Direct REST API (Guaranteed delivery)
        if (!stringId.startsWith('demo_')) {
            this.updateSupabaseLikesREST(stringId, target?.supabaseId, target?.review, newLikeCount);
        }

        // 6. Also sync via Supabase SDK if loaded
        try {
            const sb = await this.getSupabaseClient();
            if (sb && !stringId.startsWith('demo_')) {
                const sbId = target?.supabaseId || (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(stringId) || /^\d+$/.test(stringId) ? stringId : null);
                if (sbId) {
                    await sb.from('student_reviews').update({ likes: newLikeCount }).eq('id', sbId).catch(() => {});
                }
                if (target && target.review) {
                    await sb.from('student_reviews').update({ likes: newLikeCount }).eq('review', target.review.trim()).catch(() => {});
                }
            }
        } catch (e) {}

        // 7. Sync to Firestore in background
        try {
            if (window.firebaseServices && window.firebaseServices.db && !stringId.startsWith('demo_')) {
                const { db, doc, updateDoc, increment, collection, query, where, getDocs } = window.firebaseServices;
                const fsId = target?.firestoreId || (!stringId.startsWith('rev_') && !stringId.startsWith('sb_') && !/^[0-9a-f]{8}-/i.test(stringId) ? stringId : null);
                if (fsId) {
                    try {
                        const docRef = doc(db, 'student_reviews', fsId);
                        await updateDoc(docRef, { likes: increment(1) });
                    } catch (err) {}
                }
                if (target && target.review && query && where && getDocs) {
                    try {
                        const q = query(collection(db, 'student_reviews'), where('review', '==', target.review.trim()));
                        const snap = await getDocs(q);
                        snap.forEach(async (d) => {
                            await updateDoc(d.ref, { likes: increment(1) }).catch(() => {});
                        });
                    } catch (err) {}
                }
            }
        } catch (e) {}

        this.showToast('❤️ Upvoted & Locked! Thank you!');
    }

    async handleDelete(reviewId, event) {
        if (event && event.stopPropagation) event.stopPropagation();

        const currentUser = this.getCurrentUser();
        if (!currentUser || currentUser.isGuest) {
            this.showToast('🔒 Please sign in to manage your review.');
            return;
        }

        const target = this.reviews.find(r => String(r.id) === String(reviewId));
        if (!target) return;

        if (!this.isMyReview(target)) {
            this.showToast('⚠️ You can only delete your own review.');
            return;
        }

        if (!confirm('Are you sure you want to remove your review from the wall?')) {
            return;
        }

        const targetSig = this.getReviewSignature(target);
        const reviewText = (target?.review || '').trim();
        const reviewEmail = (target?.email || '').trim();
        const supabaseId = target?.supabaseId || (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(reviewId)) || /^\d+$/.test(String(reviewId)) ? String(reviewId) : null);
        const firestoreId = target?.firestoreId || (!String(reviewId).startsWith('demo_') && !String(reviewId).startsWith('rev_') && !String(reviewId).startsWith('sb_') && !/^[0-9a-f]{8}-/i.test(String(reviewId)) ? String(reviewId) : null);

        // 1. Record in deleted signatures so it never re-appears locally
        if (reviewId) this.deletedSignatures.add(String(reviewId));
        if (targetSig) this.deletedSignatures.add(targetSig);
        if (supabaseId) this.deletedSignatures.add(supabaseId);
        if (firestoreId) this.deletedSignatures.add(firestoreId);
        localStorage.setItem('skm_deleted_signatures', JSON.stringify(Array.from(this.deletedSignatures)));

        // 2. Instant local removal
        this.reviews = this.reviews.filter(r => String(r.id) !== String(reviewId) && (!targetSig || this.getReviewSignature(r) !== targetSig));
        if (reviewId) this.myReviewKeys.delete(String(reviewId));
        if (targetSig) this.myReviewKeys.delete(targetSig);
        if (supabaseId) this.myReviewKeys.delete(supabaseId);
        if (firestoreId) this.myReviewKeys.delete(firestoreId);
        localStorage.setItem('skm_my_review_keys', JSON.stringify(Array.from(this.myReviewKeys)));
        localStorage.setItem('skm_user_reviews_cache', JSON.stringify(this.reviews));

        this.renderStats();
        this.renderReviews();
        this.showToast('🗑️ Review removed from the wall.');

        // 3. Broadcast deletion to all open browser tabs
        this.broadcastReviewEvent({ type: 'DELETE', reviewId: String(reviewId), signature: targetSig });

        // 4. Supabase Cloud Delete (Direct REST API + SDK)
        this.deleteSupabaseReviewREST(reviewId, supabaseId, reviewText);
        try {
            const sb = await this.getSupabaseClient();
            if (sb) {
                if (reviewText) await sb.from('student_reviews').delete().eq('review', reviewText).catch(() => {});
                if (supabaseId) await sb.from('student_reviews').delete().eq('id', supabaseId).catch(() => {});
            }
        } catch (e) {}

        // 5. Firestore Cloud Delete
        try {
            if (window.firebaseServices && window.firebaseServices.db) {
                const { db, doc, deleteDoc, collection, query, where, getDocs } = window.firebaseServices;
                if (firestoreId) {
                    try {
                        await deleteDoc(doc(db, 'student_reviews', firestoreId));
                    } catch (err) {}
                }
                if (reviewText && query && where && getDocs) {
                    try {
                        const q = query(collection(db, 'student_reviews'), where('review', '==', reviewText));
                        const snap = await getDocs(q);
                        snap.forEach(async (d) => {
                            await deleteDoc(d.ref).catch(() => {});
                        });
                    } catch (err) {}
                }
            }
        } catch (e) {
            console.warn('Firestore review delete note:', e);
        }
    }

    toggleExpand(btn) {
        if (!btn) return;
        const textWrapper = btn.closest('.rc-text-wrapper');
        if (!textWrapper) return;
        const p = textWrapper.querySelector('.rc-text-v2');
        if (!p) return;

        const isExpanded = p.classList.toggle('expanded');
        p.classList.toggle('is-clamped', !isExpanded);

        const span = btn.querySelector('span');
        const icon = btn.querySelector('i');
        if (span) span.textContent = isExpanded ? 'See Less' : 'See More';
        if (icon) {
            icon.className = isExpanded ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
        }

        this.pauseAutoScrollBriefly(4000);
    }

    renderStats() {
        let sumRatings = 0;
        let validCount = 0;

        for (const r of this.reviews) {
            const val = parseFloat(r.rating);
            if (!isNaN(val) && val > 0) {
                sumRatings += val;
                validCount++;
            }
        }

        const totalReviews = this.reviews.length;
        const avgNum = validCount > 0 ? (sumRatings / validCount) : 0;
        const avgScore = validCount > 0 ? (Math.round(avgNum * 10) / 10).toFixed(1) : '0.0';

        const avgEl = document.getElementById('stat-avg-score');
        const countEl = document.getElementById('stat-total-voices');
        const ribbonStarsEl = document.getElementById('stat-ribbon-stars');
        const filterCountEl = document.getElementById('filter-results-count');

        if (avgEl) avgEl.textContent = avgScore;
        if (countEl) countEl.textContent = totalReviews.toString();
        if (filterCountEl) filterCountEl.textContent = `${totalReviews} Reviews`;

        if (ribbonStarsEl) {
            if (validCount > 0) {
                ribbonStarsEl.innerHTML = this.renderStarsHTML(avgNum);
            } else {
                ribbonStarsEl.innerHTML = '<i class="far fa-star"></i><i class="far fa-star"></i><i class="far fa-star"></i><i class="far fa-star"></i><i class="far fa-star"></i>';
            }
        }
    }

    renderCardHTML(review) {
        const sig = this.getReviewSignature(review);
        const isLiked = this.likedReviewIds.has(String(review.id)) || (sig && this.likedReviewIds.has(sig));
        const timeAgo = this.formatRelativeTime(review.createdAt || review.created_at);
        const safeName = this.escapeHTML(review.name || 'Verified Student');
        const safeBranch = this.escapeHTML(review.branch || 'Engineering Student');
        const safeReview = this.escapeHTML(review.review || '');
        const initial = (safeName || 'S').charAt(0).toUpperCase();
        const ratingNum = parseFloat(review.rating) || 5.0;
        const isLong = safeReview.length > 110;
        const isOwner = this.isMyReview(review);
        const displayLikes = typeof review.likes === 'number' ? review.likes : (parseInt(review.likes, 10) || 0);

        return `
            <div class="review-card-h-v2 ${review.isNew ? 'newly-submitted' : ''}">
                <div>
                    <div class="rc-header-v2">
                        <div class="rc-author-v2">
                            ${review.photo 
                                ? `<img src="${review.photo}" alt="${safeName}" class="rc-avatar-v2" referrerpolicy="no-referrer" onerror="this.outerHTML='<div class=\\'rc-avatar-initial-v2\\'>${initial}</div>'">`
                                : `<div class="rc-avatar-initial-v2">${initial}</div>`
                            }
                            <div class="rc-name-col-v2">
                                <div class="rc-name-v2">
                                    <span>${safeName}</span>
                                    ${review.verified !== false ? `<span title="Verified Student"><i class="fas fa-check-circle" style="color:#10b981; font-size:0.68rem;"></i></span>` : ''}
                                </div>
                                <div class="rc-sub-v2">
                                    ${safeBranch}
                                </div>
                            </div>
                        </div>
                        <div class="rc-score-badge-v2">
                            <i class="fas fa-star" style="color: #fbbf24;"></i> ${ratingNum.toFixed(1)}
                        </div>
                    </div>

                    <div class="rc-stars-v2">
                        ${this.renderStarsHTML(ratingNum)}
                    </div>

                    <div class="rc-text-wrapper">
                        <p class="rc-text-v2 ${isLong ? 'is-clamped' : ''}">
                            "${safeReview}"
                        </p>
                        ${isLong ? `
                            <button type="button" class="rc-see-more-btn" onclick="window.skilReviews.toggleExpand(this)">
                                <span>See More</span> <i class="fas fa-chevron-down"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>

                <div class="rc-footer-v2">
                    <span class="rc-time-v2"><i class="far fa-clock"></i> ${timeAgo}</span>
                    <div class="rc-actions-group">
                        ${isOwner ? `
                            <button type="button" class="rc-delete-btn-v2" onclick="window.skilReviews.handleDelete('${review.id}', event)" title="Delete my review" aria-label="Delete Review">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        ` : ''}
                        <button type="button" class="rc-like-btn-v2 ${isLiked ? 'liked' : ''}" data-like-id="${review.id}" onclick="window.skilReviews.handleLike('${review.id}', this)" aria-label="Like Review" title="${isLiked ? 'Upvoted (Locked)' : 'Upvote Review'}">
                            <i class="fas fa-heart"></i>
                            <span class="like-count">${displayLikes}</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderReviews() {
        const grid = document.getElementById('reviews-grid-container');
        if (!grid) return;

        const countInfo = document.getElementById('filter-results-count');
        if (countInfo) {
            countInfo.textContent = `${this.reviews.length} Reviews`;
        }

        if (this.reviews.length === 0) {
            grid.innerHTML = `
                <div style="flex: 0 0 100%; text-align: center; padding: 1.5rem 1rem; background: #070b14; border: 1px dashed rgba(255,255,255,0.1); border-radius: 12px;">
                    <i class="fas fa-comment-dots" style="font-size: 1.4rem; color: #6366f1; margin-bottom: 0.3rem;"></i>
                    <h4 style="color:#f8fafc; margin-bottom:0.2rem; font-size: 0.85rem;">No reviews yet</h4>
                    <p style="color:#94a3b8; font-size:0.75rem; margin:0;">Be the first student to rate SKiL MATRiX in the composer box above!</p>
                </div>
            `;
            return;
        }

        // Render each card uniquely (no duplicate batches)
        grid.innerHTML = this.reviews.map(r => this.renderCardHTML(r)).join('');
    }

    renderStarsHTML(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            if (rating >= i) {
                stars += '<i class="fas fa-star"></i>';
            } else if (rating >= i - 0.5) {
                stars += '<i class="fas fa-star-half-alt"></i>';
            } else {
                stars += '<i class="far fa-star"></i>';
            }
        }
        return stars;
    }

    formatRelativeTime(isoString) {
        if (!isoString) return 'Recently';
        try {
            const date = new Date(isoString);
            const now = new Date();
            const diffSeconds = Math.floor((now - date) / 1000);

            if (diffSeconds < 60) return 'Just now';
            if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
            if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
            if (diffSeconds < 2592000) return `${Math.floor(diffSeconds / 86400)}d ago`;
            return `${Math.floor(diffSeconds / 2592000)}mo ago`;
        } catch (e) {
            return 'Recently';
        }
    }

    showToast(message) {
        let toast = document.getElementById('rv-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'rv-toast';
            toast.className = 'rv-toast-notification';
            document.body.appendChild(toast);
        }

        toast.innerHTML = `<i class="fas fa-sparkles" style="color:#fbbf24;"></i> <span>${message}</span>`;
        toast.classList.add('show');
        clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => {
            toast.classList.remove('show');
        }, 3200);
    }
}

// Global initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.skilReviews = new SKiLReviewsEngine();
    });
} else {
    window.skilReviews = new SKiLReviewsEngine();
}


