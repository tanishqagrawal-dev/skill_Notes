import { auth, provider, db } from './firebase-config.js';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// --- AUTH ROUTER/GUARD ---
const path = window.location.pathname;
const isAuthPage = path.endsWith('auth.html') || path.endsWith('auth') || path.endsWith('login.html') || path.endsWith('login');
const isDashboardPage = path.endsWith('dashboard.html') || path.endsWith('dashboard') || path.includes('dashboard#');

// --- IMMEDIATE GUEST INITIALIZATION ---
// If on dashboard and no session exists, create a guest session immediately
// This ensures the dashboard always has "someone" to show data for.
if (isDashboardPage && !localStorage.getItem('guest_session')) {
    console.log("👤 Auto-initializing Guest Session for direct access...");
    const guest = {
        id: 'guest_' + Math.random().toString(36).substr(2, 9),
        name: 'Guest Tester',
        email: 'guest@example.com',
        role: 'student',
        college: 'medicaps',
        isGuest: true
    };
    localStorage.setItem('guest_session', JSON.stringify(guest));
}

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

onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("🔐 Auth Guard: User is logged in as", user.email);

        if (isAuthPage) {
            window.location.href = 'dashboard.html';
            return;
        }

        if (isDashboardPage) {
            dispatchAuthReady({
                user: user,
                currentUser: {
                    id: user.uid,
                    name: user.displayName || user.email.split('@')[0],
                    email: user.email,
                    photo: user.photoURL,
                    photo: user.photoURL,
                    role: (user.email === 'yeashjain2006@gmail.com') ? 'super_admin' : 'student',
                    college: 'medicaps'
                }
            });
        }
    } else {
        console.log("🔓 Auth Guard: No active Firebase session.");
        // If we are on dashboard, the immediate guest check above already handled the UI
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
                await signInWithPopup(auth, provider);
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
