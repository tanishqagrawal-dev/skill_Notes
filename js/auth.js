// Auth Logic Module
const { auth, provider, signInWithPopup, signOut, onAuthStateChanged } = window.firebaseServices;

// Robust page detection using body classes or fallback
const isLoginPage = document.body.classList.contains('login-page') || window.location.pathname.includes('login.html');
const isDashboardPage = document.body.classList.contains('dashboard-body') || window.location.pathname.includes('dashboard.html');

// --- AUTH STATE OBSERVER & ROUTE GUARD ---
function initAuthGuard() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("AuthGuard: User is logged in.", user.email);

            // Redirect to dashboard if on login page
            if (isLoginPage) {
                window.location.href = 'dashboard.html';
                return;
            }

            // Dispatch event globally so any listening script matching this user can react
            // We do this ALWAYS if logged in, not just on dashboard, in case other pages need generic user info
            window.dispatchEvent(new CustomEvent('auth-ready', { detail: { user } }));

        } else {
            console.log("AuthGuard: User is logged out.");

            // Redirect to login if on dashboard
            if (isDashboardPage) {
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
