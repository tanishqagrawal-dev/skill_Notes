import { auth, provider, db } from './firebase-config.js';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// --- AUTH ROUTER/GUARD ---
// Check if we are on a page that requires login (like dashboard.html)
const path = window.location.pathname;
const isAuthPage = path.includes('auth.html');
const isDashboardPage = path.includes('dashboard.html');

onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("🔐 Auth Guard: User is logged in as", user.email);

        // If we're on the auth page, redirect to dashboard
        if (isAuthPage) {
            window.location.href = 'dashboard.html';
            return;
        }

        // If we're on dashboard, signal the dashboard engine
        if (isDashboardPage) {
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
            document.dispatchEvent(event);
        }
    } else {
        console.log("🔓 Auth Guard: No active session.");

        // Check for Guest Session (Local Storage)
        let guestData = localStorage.getItem('guest_session');

        // If on dashboard and NO session (Firebase or Guest), AUTO-INITIALIZE GUEST
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

        if (guestData && isDashboardPage) {
            const guest = JSON.parse(guestData);
            const event = new CustomEvent('auth-ready', {
                detail: {
                    user: { uid: guest.id, email: guest.email, displayName: guest.name },
                    currentUser: guest
                }
            });
            document.dispatchEvent(event);
        }
    }
});

// --- FORM HANDLERS (Only if on auth.html) ---
if (isAuthPage) {
    // Login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const pass = document.getElementById('login-password').value;
            try {
                await signInWithEmailAndPassword(auth, email, pass);
                // Redirect handled by onAuthStateChanged
            } catch (err) {
                alert("Login Failed: " + err.message);
            }
        };
    }

    // Signup
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById('signup-email').value;
            const pass = document.getElementById('signup-password').value;
            const name = document.getElementById('signup-name').value;
            try {
                await createUserWithEmailAndPassword(auth, email, pass);
                // In a real app, you'd update profile and create a user doc in Firestore here
            } catch (err) {
                alert("Signup Failed: " + err.message);
            }
        };
    }

    // Google
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
