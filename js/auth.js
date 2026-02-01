import { auth, provider, db } from './firebase-config.js';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// --- AUTH ROUTER/GUARD ---
const path = window.location.pathname;
const isAuthPage = path.endsWith('auth.html') || path.endsWith('auth') || path.endsWith('login.html') || path.endsWith('login');
const isDashboardPage = path.endsWith('dashboard.html') || path.endsWith('dashboard') || path.includes('dashboard#');

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
    console.log("🚀 Dispatching auth-ready:", data.currentUser.name);
    window.dispatchEvent(new CustomEvent('auth-ready', { detail: data }));
}

// Check for Guest Session (Local Storage) immediately
if (isDashboardPage) {
    const guestData = localStorage.getItem('guest_session');
    if (guestData) {
        const guest = JSON.parse(guestData);
        dispatchAuthReady({
            user: { uid: guest.id, email: guest.email, displayName: guest.name },
            currentUser: guest
        });
    }
}

const SUPER_ADMIN_EMAIL = 'tanishqagrawal1103@gmail.com';

onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("🔐 Auth Guard: Firebase session active for", user.email);

        const { db, doc, getDoc, setDoc, serverTimestamp } = window.firebaseServices || {};
        let userData = {
            id: user.uid,
            name: user.displayName || user.email.split('@')[0],
            email: user.email,
            photo: user.photoURL,
            role: (user.email === SUPER_ADMIN_EMAIL) ? 'superadmin' : 'user',
            college: 'medicaps' // Global default for now
        };

        if (db) {
            try {
                const userRef = doc(db, 'users', user.uid);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    const storedData = userSnap.data();
                    userData = { ...userData, ...storedData };
                } else {
                    // Initialize new user in Firestore
                    if (user.email === SUPER_ADMIN_EMAIL) {
                        userData.role = 'superadmin';
                    }
                    await setDoc(userRef, {
                        ...userData,
                        createdAt: serverTimestamp()
                    });
                    console.log("🆕 New User Registered in Firestore");
                }

                // Hard-security override for Super Admin email even if DB is tampered
                if (user.email === SUPER_ADMIN_EMAIL) {
                    userData.role = 'superadmin';
                }

            } catch (err) {
                console.error("Firestore Identity Sync Error:", err);
            }
        }

        if (isAuthPage) {
            window.location.href = 'dashboard.html';
            return;
        }

        if (isDashboardPage) {
            dispatchAuthReady({
                user: user,
                currentUser: userData
            });
        }
    } else {
        console.log("🔓 Auth Guard: No active Firebase session.");
        const hasGuestSession = localStorage.getItem('guest_session');
        if (!hasGuestSession && isDashboardPage) {
            window.location.href = 'auth.html';
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
            const name = document.getElementById('signup-name').value;
            try {
                await createUserWithEmailAndPassword(auth, email, pass);
            } catch (err) {
                alert("Signup Failed: " + err.message);
            }
        };
    }

    const googleBtn = document.getElementById('google-login');
    if (googleBtn) {
        googleBtn.onclick = async () => {
            try {
                await signInWithRedirect(auth, provider);
            } catch (err) {
                alert("Google Login Failed: " + err.message);
            }
        };
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
    window.location.href = 'dashboard.html';
};

window.handleLogout = async function () {
    localStorage.removeItem('guest_session');
    await signOut(auth);
    window.location.href = '../index.html';
};
