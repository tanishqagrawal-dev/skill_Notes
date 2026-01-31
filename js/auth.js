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
const isAuthPage = path.includes('auth.html') || path.includes('login.html');
const isDashboardPage = path.includes('dashboard.html');

// --- IMMEDIATE GUEST CHECK (FOR INSTANT LOADING) ---
if (isDashboardPage) {
    const guestData = localStorage.getItem('guest_session');
    if (guestData) {
        const guest = JSON.parse(guestData);
        console.log("🚀 Auth Guard: Immediate guest session detected. Dispatching event...");
        const event = new CustomEvent('auth-ready', {
            detail: {
                user: { uid: guest.id, email: guest.email, displayName: guest.name },
                currentUser: guest
            }
        });
        window.dispatchEvent(event);
    }
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("🔐 Auth Guard: User is logged in as", user.email);

        // If we're on the auth page, redirect to dashboard
        if (isAuthPage) {
            window.location.href = 'dashboard.html';
            return;
        }

        // Signal dashboard that auth is ready
        if (isDashboardPage) {
            console.log("🚀 Signaling Dashboard: User is authenticated.");
            // Removed timeout for instant loading
            const event = new CustomEvent('auth-ready', {
                detail: {
                    user: user,
                    currentUser: {
                        id: user.uid,
                        name: user.displayName || user.email.split('@')[0],
                        email: user.email,
                        photo: user.photoURL,
                        role: 'student', // Default, would be fetched from Firestore in a real app
                        college: 'medicaps'
                    }
                }
            });
            window.dispatchEvent(event);
        }
    } else {
        console.log("🔓 Auth Guard: No active Firebase session.");

        // Check for Guest Session (Local Storage)
        let guestData = localStorage.getItem('guest_session');

        // AUTO-INITIALIZE GUEST for the dashboard if no user is found
        if (isDashboardPage && !guestData) {
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
            guestData = JSON.stringify(guest);
        }

        // If we haven't already dispatched the event via immediate check, or if session just changed
        if (guestData && isDashboardPage) {
            const guest = JSON.parse(guestData);
            console.log("🚀 Signaling Dashboard: Guest session active.");
            // Removed timeout for instant loading
            const event = new CustomEvent('auth-ready', {
                detail: {
                    user: { uid: guest.id, email: guest.email, displayName: guest.name },
                    currentUser: guest
                }
            });
            window.dispatchEvent(event);
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
    window.location.href = 'auth.html';
};
