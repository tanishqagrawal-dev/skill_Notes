import {
    auth,
    provider,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    signOut,
    onAuthStateChanged,
    setPersistence,
    browserLocalPersistence,
    db,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    serverTimestamp
} from './firebase-config.js';

console.log("🚀 Auth Script Loaded (Lazy Mode)");

// Expose status
window.authStatus = { ready: false, data: null };

function dispatchAuthReady(data) {
    window.authStatus.ready = true;
    window.authStatus.data = data;
    console.log("🚀 Dispatching auth-ready for:", data.currentUser ? data.currentUser.role : 'guest/visitor');
    window.dispatchEvent(new CustomEvent('auth-ready', { detail: data }));
}

// 1. Instant Session Restoration (Guest or Regular)
// This runs immediately to check LocalStorage so UI can optimistically render
const lastUser = localStorage.getItem('auth_user_full') || localStorage.getItem('guest_session');
const path = window.location.pathname;
const isUserDashboard = path.endsWith('dashboard.html');
const isAdminDashboard = path.endsWith('admin-dashboard.html');
const isCoAdminDashboard = path.endsWith('coadmin-dashboard.html');

if (lastUser && (isUserDashboard || isAdminDashboard || isCoAdminDashboard)) {
    try {
        const parsed = JSON.parse(lastUser);
        console.log("⚡ Instant reload: Restoring session from cache");
        dispatchAuthReady({
            user: { uid: parsed.id, email: parsed.email, displayName: parsed.name },
            currentUser: parsed
        });
    } catch (e) {
        console.warn("Auth cache corrupted");
        localStorage.removeItem('auth_user_full');
    }
}

// --- LAZY INIT FUNCTION ---
let authInitialized = false;

export async function initAuth() {
    if (authInitialized) return;
    authInitialized = true;

    console.log("🔐 Starting Firebase Auth Service...");

    // Persistence
    setPersistence(auth, browserLocalPersistence).catch(e => console.warn("Persistence Error:", e));

    const isAuthPage = path.endsWith('auth.html') || path.endsWith('auth') || path.endsWith('login.html') || path.endsWith('login');

    // Handle Redirect Result
    getRedirectResult(auth).catch((error) => {
        console.error("Redirect Sign-in Error:", error);
        if (isAuthPage) alert("Login Failed: " + error.message);
    });

    const SUPER_ADMINS = ['tanishqagrawal1103@gmail.com', 'skilmatrix3@gmail.com'];

    // Listener
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log("🔐 Auth Guard: Firebase session active for", user.email);

            // const { db, doc, getDoc, setDoc, serverTimestamp, updateDoc } = window.firebaseServices || {}; // REMOVED: Using direct imports
            const isSuperAdmin = SUPER_ADMINS.includes(user.email);

            let userData = {
                id: user.uid,
                name: user.displayName || user.email.split('@')[0],
                email: user.email,
                photo: user.photoURL,
                role: isSuperAdmin ? 'superadmin' : 'user',
                college: 'medicaps' // default
            };

            // 1. Instant Dispatch (Optimistic)
            // We dispatch immediately with basic/cached data so the dashboard opens instantly.
            dispatchAuthReady({ user, currentUser: userData });

            // --- REDIRECTION & ACCESS CONTROL ---
            const triggerRedirect = (data) => {
                if (!data) return false;
                const currentRole = data.role;
                const isInPagesDir = path.includes('/pages/');
                const prefix = isInPagesDir ? '' : 'pages/';

                if (isAuthPage || path === '/' || path.endsWith('index.html')) {
                    console.log("🚀 Role-based Redirect:", currentRole);
                    if (currentRole === 'admin' || currentRole === 'superadmin') window.location.href = prefix + 'admin-dashboard.html';
                    else if (currentRole === 'coadmin') window.location.href = prefix + 'coadmin-dashboard.html';
                    else window.location.href = prefix + 'dashboard.html';
                    return true;
                }
                return false;
            };

            // 1. Optimistic Redirect (If we have cached data, go now!)
            // We DO NOT return here anymore. We must let the DB sync logic (below) run even if we encourage a redirect.
            // The browser will handle the race, but this gives the async op a chance to queue.
            const wasRedirected = triggerRedirect(userData);
            // if (wasRedirected) return; // REMOVED to force DB sync

            // 2. Background Sync & Auto-Creation (CRITICAL FIX)
            // Using direct imports for robustness
            if (db) {
                (async () => {
                    try {
                        const userRef = doc(db, "users", user.uid);
                        const userSnap = await getDoc(userRef);

                        if (!userSnap.exists()) {
                            console.log("🆕 [AUTH FIX] creating Firestore profile for:", user.email);
                            await setDoc(userRef, {
                                email: user.email.toLowerCase(),
                                role: "user",          // default role
                                college: null,         // Explicitly null as requested
                                createdAt: serverTimestamp(),
                                name: user.displayName || user.email.split('@')[0],
                                photo: user.photoURL
                            });
                            // Update local cache to match what we just created
                            userData.role = 'user';
                            userData.college = null;
                            localStorage.setItem('auth_user_full', JSON.stringify(userData));
                        } else {
                            // Existing user: Sync logic if needed
                            const params = userSnap.data();
                            // We don't overwrite role from DB unless it's a superadmin forcing a downgrade/upgrade? 
                            // safe to just trust DB for everything except superadmin override in memory
                        }
                    } catch (err) {
                        console.error("Background Identity Sync Error:", err);
                    }
                })();
            }

            // --- ACCESS GUARD (Fallback for direct URL access) ---
            if (isAdminDashboard && userData.role !== 'admin' && userData.role !== 'superadmin') {
                window.location.href = 'dashboard.html';
                return;
            }
        } else {
            console.log("🔓 Auth Guard: No active session. Checking for guest session...");

            const guestData = localStorage.getItem('guest_session');
            if (guestData) {
                try {
                    const guest = JSON.parse(guestData);
                    console.log("👤 Restoring guest session:", guest.name);
                    dispatchAuthReady({
                        user: { uid: guest.id, email: guest.email, displayName: guest.name },
                        currentUser: guest
                    });
                    return;
                } catch (e) {
                    localStorage.removeItem('guest_session');
                }
            }

            // Signal readiness with null user for public/visitor mode
            dispatchAuthReady({ user: null, currentUser: null });

            // Only redirect if on strictly protected pages
            if (isAdminDashboard || isCoAdminDashboard) {
                const isInPagesDir = path.includes('/pages/');
                const prefix = isInPagesDir ? '' : 'pages/';
                window.location.href = prefix + 'auth.html';
            }
        }
    });

    // --- FORM HANDLERS ---
    if (isAuthPage) {
        initAuthForms();
    }
}

function initAuthForms() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const pass = document.getElementById('login-password').value;
            try {
                await signInWithEmailAndPassword(auth, email, pass);
                if (typeof gtag === 'function') gtag('event', 'login', { method: 'Email' });
            } catch (err) {
                alert("Login Failed: " + err.message);
            }
        };
    }

    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById('signup-email').value;
            const pass = document.getElementById('signup-password').value;
            // const name = document.getElementById('signup-name').value;
            try {
                await createUserWithEmailAndPassword(auth, email, pass);
                if (window.statServices?.trackSignUp) window.statServices.trackSignUp('email');
                if (typeof gtag === 'function') gtag('event', 'sign_up', { method: 'Email' });
            } catch (err) {
                alert("Signup Failed: " + err.message);
            }
        };
    }

    const googleBtn = document.getElementById('google-login');
    if (googleBtn) {
        googleBtn.onclick = async () => {
            try {
                // 1. Trigger Popup
                console.log("🖱️ Google Button Clicked");
                const result = await signInWithPopup(auth, provider);
                const user = result.user;
                console.log("✅ Google Login Success:", user.email);

                // 2. Optimistic Storage Update (INSTANT FEEL)
                // We don't wait for DB. We trust Google's data for the immediate UI.
                const optimisticData = {
                    id: user.uid,
                    name: user.displayName || user.email.split('@')[0],
                    email: user.email,
                    photo: user.photoURL,
                    role: 'user', // Default, will update from DB in background later
                    college: 'medicaps',
                    isOptimistic: true
                };

                localStorage.setItem('auth_user_full', JSON.stringify(optimisticData));
                localStorage.setItem('auth_user', JSON.stringify({
                    uid: user.uid,
                    email: user.email,
                    role: 'user'
                }));

                // 3. Track (Non-blocking)
                if (window.statServices?.trackSignUp) window.statServices.trackSignUp('google');
                if (typeof gtag === 'function') gtag('event', 'login', { method: 'Google' });

                // 4. INSTANT REDIRECT
                console.log("🚀 Instant Redirect to Dashboard...");
                const isInPagesDir = window.location.pathname.includes('/pages/');
                window.location.href = (isInPagesDir ? '' : 'pages/') + 'dashboard.html';

            } catch (err) {
                console.error("❌ Google Login Error:", err);
                alert("Google Login Failed: " + err.message);
            }
        };
    }
}

// Global Exports
window.loginAsGuest = function () {
    const guest = {
        id: 'guest_' + Math.random().toString(36).substr(2, 9),
        name: 'Guest Tester',
        email: 'guest@example.com',
        role: 'student',
        college: 'medicaps',
        isGuest: true
    };
    localStorage.setItem('guest_session', JSON.stringify(guest));

    // Immediate redirect logic
    const path = window.location.pathname;
    const isInPagesDir = path.includes('/pages/');
    const prefix = isInPagesDir ? '' : 'pages/';
    window.location.href = prefix + 'dashboard.html';
};

window.handleLogout = async function () {
    localStorage.removeItem('guest_session');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_user_full');
    localStorage.removeItem('global_stats_cache');
    await signOut(auth);
    window.location.href = '../index.html';
};
