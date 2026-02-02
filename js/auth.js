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
    browserLocalPersistence
} from './firebase-config.js';

console.log("🚀 Auth Script Loaded (Lazy Mode)");

// Expose status
window.authStatus = { ready: false, data: null };

function dispatchAuthReady(data) {
    window.authStatus.ready = true;
    window.authStatus.data = data;
    console.log("🚀 Dispatching auth-ready for:", data.currentUser.role);
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

            const { db, doc, getDoc, setDoc, serverTimestamp, updateDoc } = window.firebaseServices || {};
            const isSuperAdmin = SUPER_ADMINS.includes(user.email);

            let userData = {
                id: user.uid,
                name: user.displayName || user.email.split('@')[0],
                email: user.email,
                photo: user.photoURL,
                role: isSuperAdmin ? 'superadmin' : 'user',
                college: 'medicaps' // default
            };

            // DB Sync (Non-blocking usually, but awaits here for ensuring role correctness if needed)
            if (db) {
                try {
                    const userRef = doc(db, 'users', user.uid);
                    // We don't await this for the UI dispatch unless critical?
                    // Better to dispatch fast, then update. 
                    // But we need the ROLE for the dashboard redirect/render logic.
                    // We will assume LocalStorage is correct first, then update.

                    getDoc(userRef).then(async (userSnap) => {
                        if (userSnap.exists()) {
                            const params = userSnap.data();
                            const finalRole = isSuperAdmin ? 'superadmin' : params.role;
                            userData = { ...userData, ...params, role: finalRole };

                            // Force update role only if mismatch
                            if (isSuperAdmin && params.role !== 'superadmin') {
                                updateDoc(userRef, { role: 'superadmin' });
                            }
                        } else {
                            if (isSuperAdmin) userData.role = 'superadmin';
                            setDoc(userRef, {
                                ...userData,
                                createdAt: serverTimestamp()
                            });
                        }

                        // Update Cache
                        localStorage.setItem('auth_user_full', JSON.stringify(userData));
                        localStorage.setItem('auth_user', JSON.stringify({
                            uid: userData.id,
                            email: userData.email,
                            role: userData.role
                        }));

                        // Redispatch with latest data if role changed significantly?
                        // For now, simpler: just dispatch
                    });

                } catch (err) {
                    console.error("Firestore Identity Sync Error:", err);
                }
            }

            // --- REDIRECTION LOGIC ---
            const isInPagesDir = path.includes('/pages/');
            const prefix = isInPagesDir ? '' : 'pages/';

            if (isAuthPage || path === '/' || path.endsWith('index.html')) {
                // If redundant, already handled by inline script or simple redirect
                // Avoid infinite reload
                const role = userData.role;
                if (role === 'admin' || role === 'superadmin') window.location.href = prefix + 'admin-dashboard.html';
                else if (role === 'coadmin') window.location.href = prefix + 'coadmin-dashboard.html';
                else window.location.href = prefix + 'dashboard.html';
                return;
            }

            // --- ACCESS GUARD ---
            if (isAdminDashboard && userData.role !== 'admin' && userData.role !== 'superadmin') {
                alert("⛔ Access Denied: Admins Only");
                window.location.href = 'dashboard.html';
                return;
            }

            if (isCoAdminDashboard && userData.role !== 'coadmin' && userData.role !== 'superadmin') {
                alert("⛔ Access Denied: Co-Admins Only");
                window.location.href = 'dashboard.html';
                return;
            }

            dispatchAuthReady({ user, currentUser: userData });

        } else {
            console.log("🔓 Auth Guard: No active Firebase session.");

            // CHECK FOR GUEST SESSION
            const guestData = localStorage.getItem('guest_session');
            if (guestData) {
                console.log("👤 Guest session detected.");
                const guest = JSON.parse(guestData);
                dispatchAuthReady({
                    user: { uid: guest.id, email: guest.email, displayName: guest.name },
                    currentUser: guest
                });
                // Ensure we are on the dashboard
                if (isAuthPage || path === '/' || path.endsWith('index.html')) {
                    const isInPagesDir = path.includes('/pages/');
                    const prefix = isInPagesDir ? '' : 'pages/';
                    window.location.href = prefix + 'dashboard.html';
                }
            }
            else if ((isUserDashboard || isAdminDashboard || isCoAdminDashboard)) {
                // No user, no guest, but on protected page -> Redirect
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
