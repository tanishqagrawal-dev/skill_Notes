// Auth Logic Module
const { auth, provider, signInWithPopup, signOut, onAuthStateChanged } = window.firebaseServices;

const isLoginPage = window.location.pathname.includes('login.html');
const isDashboardPage = window.location.pathname.includes('dashboard.html');

// --- AUTH STATE OBSERVER & ROUTE GUARD ---
function initAuthGuard() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("AuthGuard: User is logged in.", user.email);

            // Redirect to dashboard if on login page
            if (isLoginPage) {
                window.location.href = 'dashboard.html';
            }

            // If on dashboard, expose user for dashboard.js to pick up
            if (isDashboardPage) {
                // Dispatch event so dashboard.js knows it can start rendering
                window.dispatchEvent(new CustomEvent('auth-ready', { detail: { user } }));
            }
        } else {
            console.log("AuthGuard: User is logged out.");

            // Redirect to login if on protected pages (dashboard)
            if (isDashboardPage) {
                // Store current URL to redirect back after login? (Optional enhancement)
                window.location.href = 'login.html';
            }
        }
    });
}

// --- ACTIONS ---

async function handleLogin() {
    try {
        const result = await signInWithPopup(auth, provider);
        // Successful login will trigger onAuthStateChanged -> redirect
        return result.user;
    } catch (error) {
        throw error;
    }
}

async function handleLogout() {
    try {
        await signOut(auth);
        // Successful logout will trigger onAuthStateChanged -> redirect
    } catch (error) {
        console.error("Logout Error:", error);
    }
}

// Initialize immediately
initAuthGuard();

// Expose functions globally for UI handlers
window.handleLogin = handleLogin;
window.handleLogout = handleLogout;
