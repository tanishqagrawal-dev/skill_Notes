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
    onSnapshot,
    sendPasswordResetEmail,
    fetchSignInMethodsForEmail,
    EmailAuthProvider,
    linkWithCredential,
    githubProvider
} from './firebase-config.js?v=6.0';

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
const isUserDashboard = path.endsWith('/dashboard') || path.includes('dashboard');

if (lastUser && isUserDashboard) {
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

    // --- REDIRECTION & ACCESS CONTROL ENGINE ---
    const triggerRedirect = (currentRole) => {
        const isInPagesDir = path.includes('/pages/');
        const prefix = isInPagesDir ? '' : 'pages/';

        console.log(`🛡️ Nav Check: Role=[${currentRole}] Path=[${path}]`);

        // 1. Landing/Auth Page Redirects
        if (isAuthPage || path === '/' || path.endsWith('index') || path.endsWith('index')) {
            console.log("🚀 Initial Redirect Logic:", currentRole);
            window.location.href = (isInPagesDir ? '../' : '') + 'welcome.html';
            return true;
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

                    // Removed forced Google photo sync so custom avatars are preserved

                    console.log("📄 Firestore Profile Found:", userData.role);
                } else {
                    console.warn("⚠️ No Firestore Profile found for UID:", user.uid);
                    userData = {
                        id: user.uid,
                        email: user.email.toLowerCase(),
                        role: "user",
                        college: "",
                        collegeId: "",
                        collegeName: "",
                        name: user.displayName || user.email.split('@')[0],
                        photo: user.photoURL
                    };
                    setDoc(doc(db, "users", user.uid), {
                        ...userData,
                        createdAt: serverTimestamp()
                    });
                }
                // Email-based admin check
                const adminEmails = ['tanishqagrawal1103@gmail.com', 'skilmatrix3@gmail.com'];
                if (adminEmails.includes(userData.email?.toLowerCase())) {
                    userData.role = 'admin';
                    console.log("🛡️ Admin access granted based on email");
                } else {
                    userData.role = 'user';
                }

                // 🛡️ Strict Role-Based Access Control (RBAC)
                if (window.selectedLoginRole) {
                    const isTryingAdmin = window.selectedLoginRole === 'admin';
                    const isAdmin = userData.role === 'admin' || userData.role === 'co-admin';

                    if (isTryingAdmin && !isAdmin) {
                        console.warn("🚫 Access Denied: User attempted to login via Admin portal.");
                        await signOut(auth);
                        const err = document.getElementById('auth-error-msg');
                        if (err) {
                            err.innerText = "Access Denied: You do not have Admin privileges.";
                            err.style.display = 'block';
                            document.querySelectorAll('.btn-login').forEach(b => {
                                b.innerHTML = 'Sign In <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 4px;"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
                            });
                        }
                        alert("Access Denied: You do not have Admin privileges.");
                        return; // Halt execution
                    }
                    if (!isTryingAdmin && isAdmin) {
                        console.warn("🚫 Access Denied: Admin attempted to login via Student portal.");
                        await signOut(auth);
                        const err = document.getElementById('auth-error-msg');
                        if (err) {
                            err.innerText = "Security: Admins must log in through the Admin portal.";
                            err.style.display = 'block';
                            document.querySelectorAll('.btn-login').forEach(b => {
                                b.innerHTML = 'Sign In <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 4px;"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
                            });
                        }
                        alert("Security: Admins must log in through the Admin portal. Please select the Admin tab.");
                        return; // Halt execution
                    }
                }

                // Update Session & Local Storage
                // Preserve the custom avatar from Supabase (stored in cache) if Firestore doesn't have one
                try {
                    const existingCache = JSON.parse(localStorage.getItem('auth_user_full')) || {};
                    const supabasePhoto = existingCache.photo;
                    // If the existing cache has a Supabase storage URL, keep it
                    if (supabasePhoto && supabasePhoto.includes('supabase') && !userData.photo?.includes('supabase')) {
                        userData.photo = supabasePhoto;
                    }
                } catch(e) {}
                window.currentUser = userData;
                localStorage.setItem('auth_user_full', JSON.stringify(userData));
                // Sync basic profile and local XP to Supabase automatically on login
                try {
                    const sb = window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
                    if (sb) {
                        const localSolvedStr = localStorage.getItem('ca_solved_problems_' + userData.id);
                        let localSolved = [];
                        if (localSolvedStr) { try { localSolved = JSON.parse(localSolvedStr); } catch(e) {} }
                        const localXp = localSolved.length * 25;
                        const localLevel = localSolved.length > 0 ? localSolved.length + 1 : 1;

                        sb.from('users').select('*').eq('id', userData.id).single().then(({ data: sbUser }) => {
                            const sbXp = sbUser ? (sbUser.coding_xp || 0) : 0;
                            const finalXp = Math.max(localXp, sbXp);
                            const finalLevel = Math.max(localLevel, sbUser ? (sbUser.current_coding_level || 1) : 1);
                            const finalSolved = (localXp >= sbXp) ? (localSolvedStr || '[]') : (sbUser?.ca_solved_problems || '[]');

                            sb.from('users').upsert({
                                id: userData.id,
                                email: userData.email,
                                name: userData.name || userData.email.split('@')[0],
                                collegename: userData.collegeName || userData.college || '',
                                avatar: userData.photo || '',
                                coding_xp: finalXp,
                                current_coding_level: finalLevel,
                                ca_solved_problems: finalSolved
                            }, { onConflict: 'id' }).then().catch(e => console.warn("Supabase auto-sync failed:", e));
                        }).catch(() => {
                            // If select fails (e.g. user doesn't exist), insert local data
                            sb.from('users').upsert({
                                id: userData.id,
                                email: userData.email,
                                name: userData.name || userData.email.split('@')[0],
                                collegename: userData.collegeName || userData.college || '',
                                avatar: userData.photo || '',
                                coding_xp: localXp,
                                current_coding_level: localLevel,
                                ca_solved_problems: localSolvedStr || '[]'
                            }, { onConflict: 'id' }).then().catch(e => console.warn("Supabase auto-sync failed:", e));
                        });
                    }
                } catch(e) {}

                // ✅ Process any pending referral on successful login
                if (window.processReferralOnLogin) {
                    window.processReferralOnLogin(userData.email);
                }

                // Refresh sidebar avatar with the saved photo
                const instantAvatar = document.getElementById('instant-avatar');
                if (instantAvatar && userData.photo && !userData.photo.startsWith('blob:')) {
                    instantAvatar.innerHTML = `<img src="${userData.photo}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;" onerror="this.style.display='none'; this.parentElement.innerText='${(userData.name || 'U').charAt(0)}'">`;
                }

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

            if (isUserDashboard) {
                const isBot = /bot|googlebot|crawler|spider|robot|crawling/i.test(navigator.userAgent);
                if (!isBot) {
                    console.log("🛑 Unauthorized access attempt. Redirecting to login...");
                    const prefix = path.includes('/pages/') ? '' : 'pages/';
                    window.location.href = prefix + 'auth';
                } else {
                    console.log("🤖 Bot detected. Bypassing redirect for SEO indexing.");
                }
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
            const email = document.getElementById('login-email').value.trim();
            const pass = document.getElementById('login-password').value;
            const submitBtn = loginForm.querySelector('.btn-login');
            const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';
            if (submitBtn) submitBtn.innerHTML = 'Signing in...';
            try {
                await signInWithEmailAndPassword(auth, email, pass);
                if (typeof gtag === 'function') gtag('event', 'login', { method: 'Email' });
            } catch (err) {
                if (submitBtn) submitBtn.innerHTML = originalBtnHtml;

                // Handle the case where user signed up with Google but tries email/password
                if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
                    try {
                        // Check if this email has Google sign-in linked
                        const methods = await fetchSignInMethodsForEmail(auth, email);
                        if (methods.includes('google.com') && !methods.includes('password')) {
                            // Silently sign in with Google, then link email/password
                            const result = await signInWithPopup(auth, provider);
                            const credential = EmailAuthProvider.credential(email, pass);
                            await linkWithCredential(result.user, credential);
                            // Now they can use both methods — no error shown
                            if (typeof gtag === 'function') gtag('event', 'login', { method: 'Email' });
                            return;
                        }
                    } catch (linkErr) {
                        // If linking fails (wrong pass after Google), show a clear message
                        if (linkErr.code === 'auth/weak-password') {
                            alert('Password must be at least 6 characters.');
                        } else {
                            alert('Incorrect password. Try again, or use the Google button to sign in.');
                        }
                        return;
                    }
                    alert('Incorrect email or password. Please try again.');
                } else {
                    alert('Login Failed: ' + err.message);
                }
            }
        };
    }

    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.onsubmit = async (e) => {
            e.preventDefault();
            const name = document.getElementById('signup-name')?.value?.trim();
            const email = document.getElementById('signup-email').value.trim();
            const pass = document.getElementById('signup-password').value;
            const submitBtn = signupForm.querySelector('.btn-login');
            const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';
            if (submitBtn) submitBtn.innerHTML = 'Creating Account...';
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
                // Also immediately sign out so user must log in fresh
                await signOut(auth);
                if (window.statServices?.trackSignUp) window.statServices.trackSignUp('email');
                if (typeof gtag === 'function') gtag('event', 'sign_up', { method: 'Email' });

                // Show success message and switch to login
                const errorMsg = document.getElementById('auth-error-msg');
                if (errorMsg) {
                    errorMsg.innerText = '✅ Account created successfully! Please log in.';
                    errorMsg.style.display = 'block';
                    errorMsg.style.color = '#4ade80';
                    errorMsg.style.background = 'rgba(74,222,128,0.1)';
                    errorMsg.style.borderColor = 'rgba(74,222,128,0.3)';
                }
                // Pre-fill email in login form and switch back to login card
                const loginEmailInput = document.getElementById('login-email');
                if (loginEmailInput) loginEmailInput.value = email;

                // Switch to login card after 1.5s
                setTimeout(() => {
                    const loginCard = document.getElementById('login-card');
                    const signupCard = document.getElementById('signup-card');
                    if (loginCard && signupCard) {
                        signupCard.classList.add('hidden');
                        loginCard.classList.remove('hidden');
                        // Show success in login error box
                        const loginErr = document.getElementById('auth-error-msg');
                        if (loginErr) {
                            loginErr.innerText = '✅ Account created! Enter your password to log in.';
                            loginErr.style.display = 'block';
                            loginErr.style.color = '#4ade80';
                            loginErr.style.background = 'rgba(74,222,128,0.1)';
                            loginErr.style.borderColor = 'rgba(74,222,128,0.3)';
                        }
                    }
                    if (submitBtn) submitBtn.innerHTML = originalBtnHtml;
                }, 1500);

            } catch (err) {
                if (submitBtn) submitBtn.innerHTML = originalBtnHtml;
                if (err.code === 'auth/email-already-in-use') {
                    // Account already exists — switch to login
                    alert('An account already exists with this email. Please log in.');
                    const loginCard = document.getElementById('login-card');
                    const signupCard = document.getElementById('signup-card');
                    const loginEmailInput = document.getElementById('login-email');
                    if (loginCard && signupCard) {
                        signupCard.classList.add('hidden');
                        loginCard.classList.remove('hidden');
                    }
                    if (loginEmailInput) loginEmailInput.value = email;
                } else if (err.code === 'auth/weak-password') {
                    alert('Password must be at least 6 characters.');
                } else {
                    alert('Signup Failed: ' + err.message);
                }
            }
        };
    }

    const googleBtn = document.getElementById('google-login');
    if (googleBtn) {
        window.handleLogin = async () => {
            try {
                const result = await signInWithPopup(auth, provider);
                // Handling is done in onSnapshot listener
            } catch (error) {
                console.error("Google Auth Error:", error);
                throw error;
            }
        };

        window.triggerPasswordReset = async (email) => {
            try {
                await sendPasswordResetEmail(auth, email);
                alert(`Password reset link sent to ${email}. Please check your inbox.`);
            } catch (error) {
                console.error("Password Reset Error:", error);
                if (error.code === 'auth/user-not-found') {
                    alert("No account found with this email address.");
                } else {
                    alert("Failed to send reset email. Please make sure the email is valid.");
                }
            }
        };

        googleBtn.onclick = async () => {
            const originalHtml = googleBtn.innerHTML;
            const originalStyle = googleBtn.style.cssText;
            try {
                console.log("🖱️ Google Button Clicked");
                googleBtn.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                        <i class="fas fa-circle-notch fa-spin" style="color: #fbbf24; font-size: 1.2rem;"></i>
                        <span style="background: linear-gradient(135deg, #fbbf24, #f59e0b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 800; letter-spacing: 0.5px;">Signing in...</span>
                    </div>
                `;
                googleBtn.style.border = "1px solid rgba(251,191,36,0.5)";
                googleBtn.style.boxShadow = "0 0 20px rgba(251,191,36,0.2)";
                
                await signInWithPopup(auth, provider);
                // The page will redirect via onAuthStateChanged, so we leave the premium animation running!
            } catch (err) {
                console.error("❌ Google Login Error:", err);
                googleBtn.innerHTML = originalHtml;
                googleBtn.style.cssText = originalStyle;
                if (err.code !== 'auth/popup-closed-by-user') {
                    alert("Google Login Failed: " + err.message);
                }
            }
        };
    }

    const githubBtn = document.getElementById('github-login');
    if (githubBtn) {
        githubBtn.onclick = async () => {
            const originalHtml = githubBtn.innerHTML;
            const originalStyle = githubBtn.style.cssText;
            try {
                console.log("🖱️ GitHub Button Clicked");
                githubBtn.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                        <i class="fas fa-circle-notch fa-spin" style="color: #fbbf24; font-size: 1.2rem;"></i>
                        <span style="background: linear-gradient(135deg, #fbbf24, #f59e0b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 800; letter-spacing: 0.5px;">Signing in...</span>
                    </div>
                `;
                githubBtn.style.border = "1px solid rgba(251,191,36,0.5)";
                githubBtn.style.boxShadow = "0 0 20px rgba(251,191,36,0.2)";
                
                await signInWithPopup(auth, githubProvider);
                // The page will redirect via onAuthStateChanged, leaving the premium animation running!
            } catch (err) {
                console.error("❌ GitHub Login Error:", err);
                githubBtn.innerHTML = originalHtml;
                githubBtn.style.cssText = originalStyle;
                if (err.code !== 'auth/popup-closed-by-user') {
                    if (err.code === 'auth/account-exists-with-different-credential') {
                        alert("An account already exists with the same email address but different sign-in credentials. Sign in using a provider associated with this email address (like Google or Email/Password).");
                    } else {
                        alert("GitHub Login Failed: " + err.message);
                    }
                }
            }
        };
    }
}

// Global Exports

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
