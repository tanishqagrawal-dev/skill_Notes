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

console.log("🚀 Auth Script Loaded");

// --- STEP 4: LAZY AUTH INITIALIZATION ---
setPersistence(auth, browserLocalPersistence).catch(e => console.warn("Persistence Error:", e));

// --- AUTH ROUTER/GUARD ---
const path = window.location.pathname;
const isAuthPage = path.endsWith('auth.html') || path.endsWith('auth') || path.endsWith('login.html') || path.endsWith('login');
const isUserDashboard = path.endsWith('dashboard.html');
const isAdminDashboard = path.endsWith('admin-dashboard.html');
const isCoAdminDashboard = path.endsWith('coadmin-dashboard.html');

// --- AUTH REDIRECT HANDLING ---
// Handle the result of the redirect sign-in flow
getRedirectResult(auth).catch((error) => {
    console.error("Redirect Sign-in Error:", error);
    if (isAuthPage) alert("Login Failed: " + error.message);
});

// Expose a way to check if auth is already handled
window.authStatus = { ready: false, data: null };

function dispatchAuthReady(data) {
    window.authStatus.ready = true;
    window.authStatus.data = data;
    console.log("🚀 Dispatching auth-ready for:", data.currentUser.role);
    window.dispatchEvent(new CustomEvent('auth-ready', { detail: data }));
}

// 1. Instant Session Restoration (Guest or Regular)
const lastUser = localStorage.getItem('auth_user_full') || localStorage.getItem('guest_session');
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

const SUPER_ADMINS = ['tanishqagrawal1103@gmail.com', 'skilmatrix3@gmail.com'];

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

        if (db) {
            try {
                const userRef = doc(db, 'users', user.uid);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    userData = { ...userData, ...userSnap.data() };
                    // Force update role for hardcoded superadmins if not already set
                    if (isSuperAdmin && userData.role !== 'superadmin') {
                        userData.role = 'superadmin';
                        await updateDoc(userRef, { role: 'superadmin' });
                    }
                } else {
                    // Initialize new user
                    if (isSuperAdmin) userData.role = 'superadmin';
                    await setDoc(userRef, {
                        ...userData,
                        createdAt: serverTimestamp()
                    });
                }

                // Hard-security override (client-side only, DB is auth of truth)
                if (isSuperAdmin) userData.role = 'superadmin';

                // Sync to localStorage for instant reload
                localStorage.setItem('auth_user_full', JSON.stringify(userData));
                localStorage.setItem('auth_user', JSON.stringify({
                    uid: userData.id,
                    email: userData.email,
                    role: userData.role
                }));
            } catch (err) {
                console.error("Firestore Identity Sync Error:", err);
            }
        }

        const role = userData.role;

        // --- REDIRECTION LOGIC ---
        const isInPagesDir = path.includes('/pages/');
        const prefix = isInPagesDir ? '' : 'pages/';

        if (isAuthPage || path === '/' || path.endsWith('index.html')) {
            if (role === 'admin' || role === 'superadmin') window.location.href = prefix + 'admin-dashboard.html';
            else if (role === 'coadmin') window.location.href = prefix + 'coadmin-dashboard.html';
            else window.location.href = prefix + 'dashboard.html';
            return;
        }

        // --- ACCESS GUARD ---
        if (isAdminDashboard && role !== 'admin' && role !== 'superadmin') {
            alert("⛔ Access Denied: Admins Only");
            window.location.href = 'dashboard.html';
            return;
        }

        if (isCoAdminDashboard && role !== 'coadmin' && role !== 'superadmin') {
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
            console.log("👤 Guest session detected in Auth State Change.");
            const guest = JSON.parse(guestData);
            dispatchAuthReady({
                user: { uid: guest.id, email: guest.email, displayName: guest.name },
                currentUser: guest
            });
            // Ensure we are on the dashboard
            if (isAuthPage || path === '/' || path.endsWith('index.html')) {
                window.location.href = prefix + 'dashboard.html';
            }
        }
        else if ((isUserDashboard || isAdminDashboard || isCoAdminDashboard)) {
            // No user, no guest, but on protected page -> Redirect
            window.location.href = prefix + 'auth.html';
        }
    }
});

// --- FORM HANDLERS (Only if on auth.html) ---
if (isAuthPage) {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const pass = document.getElementById('login-password').value;
            console.log("Attempting email login...");
            try {
                await signInWithEmailAndPassword(auth, email, pass);
                console.log("Email login success");
            } catch (err) {
                console.error("Login Failed:", err);
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
            const name = document.getElementById('signup-name').value;
            console.log("Attempting signup...");
            try {
                await createUserWithEmailAndPassword(auth, email, pass);
                console.log("Signup success");
                if (window.statServices && window.statServices.trackSignUp) {
                    window.statServices.trackSignUp('email');
                }
            } catch (err) {
                console.error("Signup Failed:", err);
                alert("Signup Failed: " + err.message);
            }
        };
    }

    const googleBtn = document.getElementById('google-login');
    if (googleBtn) {
        console.log("✅ Google Button Found");
        googleBtn.onclick = async () => {
            console.log("🖱️ Google Button Clicked");
            try {
                // Use Popup instead of Redirect for better local compatibility
                const result = await signInWithPopup(auth, provider);
                console.log("Google Login Success:", result.user.email);
                if (window.statServices && window.statServices.trackSignUp) {
                    window.statServices.trackSignUp('google');
                }
            } catch (err) {
                console.error("❌ Google Login Error:", err);
                alert("Google Login Failed: " + err.message);
            }
        };
    } else {
        console.error("❌ Google Button NOT Found");
    }
}

// --- GLOBAL UTILITIES ---
window.loginAsGuest = function () {
    console.log("Logging in as Guest...");
    const guest = {
        id: 'guest_' + Math.random().toString(36).substr(2, 9),
        name: 'Guest Tester',
        email: 'guest@example.com',
        role: 'student',
        college: 'medicaps',
        isGuest: true
    };
    localStorage.setItem('guest_session', JSON.stringify(guest));

    // Dynamic Redirect
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
