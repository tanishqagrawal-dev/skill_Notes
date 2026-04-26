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
    serverTimestamp,
    onSnapshot
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
const lastUser = localStorage.getItem('auth_user_full') || localStorage.getItem('guest_session');
const path = window.location.pathname;
const isUserDashboard = (path.includes('dashboard') || path.endsWith('dashboard')) && 
                       !path.includes('admin-dashboard') && 
                       !path.includes('coadmin-dashboard') &&
                       !path.includes('admin_dashboard') && 
                       !path.includes('coadmin_dashboard');
const isAdminDashboard = path.includes('admin-dashboard') || path.includes('admin_dashboard');
const isCoAdminDashboard = path.includes('coadmin-dashboard') || path.includes('coadmin_dashboard');

if (lastUser && (isUserDashboard || isAdminDashboard || isCoAdminDashboard)) {
    try {
        const parsed = JSON.parse(lastUser);
        console.log("⚡ Instant reload: Restoring session from cache [", parsed.role, "]");
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

    const isAuthPage = path.endsWith('auth') || path.endsWith('auth') || path.endsWith('login') || path.endsWith('login');

    // Handle Redirect Result
    getRedirectResult(auth).catch((error) => {
        console.error("Redirect Sign-in Error:", error);
        if (isAuthPage) alert("Login Failed: " + error.message);
    });

    const SUPER_ADMINS = ['tanishqagrawal1103@gmail.com', 'skilmatrix3@gmail.com'];

    // --- REDIRECTION & ACCESS CONTROL ENGINE ---
    const triggerRedirect = (currentRole) => {
        const isInPagesDir = path.includes('/pages/');
        const prefix = isInPagesDir ? '' : 'pages/';

        console.log(`🛡️ Nav Check: Role=[${currentRole}] Path=[${path}]`);

        // 0. STOP: Already on correct dashboard? No more redirects.
        if (isAdminDashboard && (currentRole === 'admin' || currentRole === 'superadmin')) return false;
        if (isCoAdminDashboard && currentRole === 'coadmin') return false;
        if (isUserDashboard && currentRole === 'user') return false;

        // 1. Landing/Auth Page Redirects
        if (isAuthPage || path === '/' || path.endsWith('index') || path.endsWith('index')) {
            console.log("🚀 Initial Redirect Logic:", currentRole);
            if (currentRole === 'admin' || currentRole === 'superadmin') window.location.href = prefix + 'admin-dashboard';
            else if (currentRole === 'coadmin') window.location.href = prefix + 'coadmin-dashboard';
            else window.location.href = prefix + 'dashboard';
            return true;
        }

        // 2. Cross-Dashboard Enforcement (Wrong Role Check)
        if (isUserDashboard && (currentRole === 'admin' || currentRole === 'superadmin')) {
            console.log("🔄 Redirecting Admin to Admin Dashboard...");
            window.location.href='admin-dashboard';
        }
        else if (isUserDashboard && currentRole === 'coadmin') {
            console.log("🔄 Redirecting Co-Admin to Co-Admin Dashboard...");
            window.location.href = 'coadmin-dashboard';
        }
        else if (isCoAdminDashboard && currentRole !== 'coadmin' && currentRole !== 'superadmin' && currentRole !== 'admin') {
            console.log("🔄 Redirecting unauthorized from Co-Admin Dashboard...");
            window.location.href='dashboard';
        }
        else if (isAdminDashboard && currentRole !== 'admin' && currentRole !== 'superadmin') {
            console.log("🔄 Redirecting unauthorized from Admin Dashboard...");
            window.location.href='dashboard';
        }

        return false;
    };

    // --- REALTIME USER LISTENER ---
    let userUnsubscribe = null;

    onAuthStateChanged(auth, async (user) => {
        if (userUnsubscribe) {
            userUnsubscribe();
            userUnsubscribe = null;
        }

        if (user) {
            console.log("🔐 Auth Active:", user.email, "UID:", user.uid);

            userUnsubscribe = onSnapshot(doc(db, "users", user.uid), async (docSnap) => {
                let userData;

                if (docSnap.exists()) {
                    userData = { id: user.uid, ...docSnap.data() };
                    
                    // FORCED SYNC: Always prioritize current Google Auth photo over stale DB photo
                    if (user.photoURL && userData.photo !== user.photoURL) {
                        userData.photo = user.photoURL;
                        setDoc(doc(db, "users", user.uid), { photo: user.photoURL }, { merge: true });
                    }
                    console.log("📄 Firestore Profile Found:", userData.role);
                } else {
                    console.warn("⚠️ No Firestore Profile found for UID:", user.uid);
                    userData = {
                        id: user.uid,
                        email: user.email.toLowerCase(),
                        role: "user",
                        college: "medicaps", // Default
                        collegeId: "medicaps",
                        collegeName: "Medicaps University",
                        name: user.displayName || user.email.split('@')[0],
                        photo: user.photoURL
                    };
                    setDoc(doc(db, "users", user.uid), {
                        ...userData,
                        createdAt: serverTimestamp()
                    });
                }

                // Global SUPER ADMIN check override
                if (SUPER_ADMINS.includes(user.email)) {
                    userData.role = 'superadmin';
                    console.log("👑 Super Admin Override Active for:", user.email);
                }

                // Update Session & Local Storage
                window.currentUser = userData;
                localStorage.setItem('auth_user_full', JSON.stringify(userData));

                // Dispatch event for other scripts
                dispatchAuthReady({ user, currentUser: userData });

                // Execute Redirection logic
                triggerRedirect(userData.role);

                // Flush pending interactions that happened during boot
                if (window._pendingInteractions && window._pendingInteractions.length > 0) {
                    console.log("⚡ Executing " + window._pendingInteractions.length + " pending queued interactions natively...");
                    const queue = [...window._pendingInteractions];
                    window._pendingInteractions = [];
                    queue.forEach(action => action());
                }
            }, (err) => {
                console.error("User Snapshot Error:", err);
            });

        } else {
            console.log("🔓 No Session. Guest check...");
            const guestData = localStorage.getItem('guest_session');
            if (guestData) {
                try {
                    const guest = JSON.parse(guestData);
                    dispatchAuthReady({ user: { uid: guest.id }, currentUser: guest });
                    return;
                } catch (e) { localStorage.removeItem('guest_session'); }
            }

            dispatchAuthReady({ user: null, currentUser: null });

            // SECURITY GATE: Redirect to auth only if NOT logged in AND NOT a guest
            const isGuest = localStorage.getItem('guest_session');
            if (isGuest) {
                console.log("🎟️ Guest detected in non-auth state. Proceeding...");
                return;
            }

            if (isAdminDashboard || isCoAdminDashboard || isUserDashboard) {
                console.log("🛑 Unauthorized access attempt. Redirecting to login...");
                const prefix = path.includes('/pages/') ? '' : 'pages/';
                window.location.href = prefix + 'auth';
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
                console.log("🖱️ Google Button Clicked");
                const result = await signInWithPopup(auth, provider);
                const user = result.user;
                console.log("✅ Google Login Success:", user.email);

                const optimisticData = {
                    id: user.uid,
                    name: user.displayName || user.email.split('@')[0],
                    email: user.email,
                    photo: user.photoURL,
                    role: 'user',
                    collegeId: 'medicaps',
                    collegeName: 'Medicaps University',
                    isOptimistic: true
                };

                localStorage.setItem('auth_user_full', JSON.stringify(optimisticData));
                localStorage.setItem('auth_user', JSON.stringify({
                    uid: user.uid,
                    email: user.email,
                    role: 'user'
                }));

                if (window.statServices?.trackSignUp) window.statServices.trackSignUp('google');
                if (typeof gtag === 'function') gtag('event', 'login', { method: 'Google' });

                const isInPagesDir = window.location.pathname.includes('/pages/');
                window.location.href = (isInPagesDir ? '' : 'pages/') + 'dashboard';

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
        collegeId: 'medicaps',
        collegeName: 'Medicaps University',
        isGuest: true
    };
    localStorage.setItem('guest_session', JSON.stringify(guest));

    const path = window.location.pathname;
    const isInPagesDir = path.includes('/pages/');
    const prefix = isInPagesDir ? '' : 'pages/';
    window.location.href = prefix + 'dashboard';
};

window.handleLogout = async function () {
    console.log("🔓 Initializing Secure Logout...");
    
    // 1. Clear session cache to prevent "Ghost Session" bug on reload
    localStorage.removeItem('auth_user_full');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('guest_session');
    
    // 2. Actually sign out from Firebase
    try {
        await signOut(auth);
    } catch (e) {
        console.warn("Signout error:", e);
    }

    // 3. Clear status
    window.authStatus = { ready: true, data: { user: null, currentUser: null } };

    // 4. Redirect to landing page (root index.html)
    const pagesIndex = path.indexOf('/pages/');
    if (pagesIndex !== -1) {
        window.location.href = path.substring(0, pagesIndex) + '/index.html';
    } else {
        // If not in pages dir, we're likely in root or some other top-level dir
        window.location.href = 'index.html';
    }
};
