<<<<<<< Updated upstream
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
=======
const _0xb315d1=_0xcfb0;function _0xcfb0(_0x1f5584,_0x3a6e25){_0x1f5584=_0x1f5584-(-0x124d*-0x2+0x1994+-0x3d47);const _0x3248e4=_0x5075();let _0x11a361=_0x3248e4[_0x1f5584];if(_0xcfb0['oNDboH']===undefined){var _0x49c6af=function(_0x9e863f){const _0x312321='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=';let _0x46fc9a='',_0x4ee903='',_0x502145=_0x46fc9a+_0x49c6af;for(let _0x357735=0x7b*0x1a+-0xb8e+0xf*-0x10,_0x512fa4,_0x21570a,_0x514935=0x13*0x1c9+-0x9ca+-0x1821;_0x21570a=_0x9e863f['charAt'](_0x514935++);~_0x21570a&&(_0x512fa4=_0x357735%(0x1cb0+0x22d0+0x22*-0x1de)?_0x512fa4*(-0x10*0x3b+-0x2547*-0x1+-0x239*0xf)+_0x21570a:_0x21570a,_0x357735++%(0x849*0x2+-0xbe3+-0x4ab))?_0x46fc9a+=_0x502145['charCodeAt'](_0x514935+(0x1ec1+-0x2*0x9ff+-0x5*0x225))-(0x37*0x62+0x1dbd+-0x32c1)!==0x1*-0x180+-0x2557*0x1+0x26d7?String['fromCharCode'](-0x1*-0x251d+-0x57*0x35+-0x67*0x2d&_0x512fa4>>(-(-0x1cb3+-0x5*-0x517+0x342)*_0x357735&-0x1dd*0x1+-0x1*-0x9ca+-0x11*0x77)):_0x357735:-0x245b*-0x1+-0x122c+0x5f*-0x31){_0x21570a=_0x312321['indexOf'](_0x21570a);}for(let _0x16dc41=0x8*0x3fd+0x104e+-0xb*0x462,_0x22a943=_0x46fc9a['length'];_0x16dc41<_0x22a943;_0x16dc41++){_0x4ee903+='%'+('00'+_0x46fc9a['charCodeAt'](_0x16dc41)['toString'](0x1788+-0x1800+0x88*0x1))['slice'](-(-0xa6*-0xc+0x1*-0x15f6+-0x4*-0x38c));}return decodeURIComponent(_0x4ee903);};_0xcfb0['PqLqAh']=_0x49c6af,_0xcfb0['bxbfyy']={},_0xcfb0['oNDboH']=!![];}const _0x3a1705=_0x3248e4[0x1a41+-0x1105*-0x1+0x1d*-0x17e],_0x185a45=_0x1f5584+_0x3a1705,_0x5c03ff=_0xcfb0['bxbfyy'][_0x185a45];if(!_0x5c03ff){const _0x451099=function(_0x1158e6){this['yeviCA']=_0x1158e6,this['bWyFfq']=[0x1d6*0x4+0xe0f+-0x1566,-0x15df+0x7*-0x6b+0x18cc,-0x241*0x9+-0x23b*-0x10+-0xf67],this['YUjIde']=function(){return'newState';},this['iYnFRK']='\x5cw+\x20*\x5c(\x5c)\x20*{\x5cw+\x20*',this['bCEPDH']='[\x27|\x22].+[\x27|\x22];?\x20*}';};_0x451099['prototype']['TrCrID']=function(){const _0xce5390=new RegExp(this['iYnFRK']+this['bCEPDH']),_0x48496d=_0xce5390['test'](this['YUjIde']['toString']())?--this['bWyFfq'][-0x268e+0x1*-0x1526+0x3bb5]:--this['bWyFfq'][-0x246b+0xde9+-0x56*-0x43];return this['hxvelu'](_0x48496d);},_0x451099['prototype']['hxvelu']=function(_0x13e6b6){if(!Boolean(~_0x13e6b6))return _0x13e6b6;return this['SluUUx'](this['yeviCA']);},_0x451099['prototype']['SluUUx']=function(_0x2381f8){for(let _0xbfca38=0x2*-0xe51+-0x32d*0x9+0x3937,_0x27dea6=this['bWyFfq']['length'];_0xbfca38<_0x27dea6;_0xbfca38++){this['bWyFfq']['push'](Math['round'](Math['random']())),_0x27dea6=this['bWyFfq']['length'];}return _0x2381f8(this['bWyFfq'][0x2331+-0x2f6+-0x25*0xdf]);},new _0x451099(_0xcfb0)['TrCrID'](),_0x11a361=_0xcfb0['PqLqAh'](_0x11a361),_0xcfb0['bxbfyy'][_0x185a45]=_0x11a361;}else _0x11a361=_0x5c03ff;return _0x11a361;}function _0x5075(){const _0x25a2ca=['s1HHwKS','y29SB3i','uMPyAMi','Axb0ieXVywrLza','zu5JCMy','D2jsEwm','BMCGysbWCM92Aq','wgLozLm','y29UC3rYDwn0BW','sw14uwq','ChjVy2vZC1jLzG','Awzdtu0','D29Yza','8j+uKcbtDgfYDgLUzW','thzpAg8','BM9Ulwf1DgGGCW','CwH4v04','EfLZyxy','AKXRz2u','CM91BMq6igXPBG','8j+BOE+4JYboyxyGq2HLyW','B2DPyZO','zs5KAxnWBgf5pq','rfDdEvK','EgLZDhmGD2L0Aa','zxjYywXpBKXVzW','ignVCNj1ChrLza','EKzRsK8','mJyWugXKwuzL','Aw5KzxHpzG','tM8GywnJB3vUDa','igvTywLSlIbqBa','D2fYBG','uMvKAxjLy3qGuW','qM1RC0C','iIbVBMvYCM9Ypq','D2vSy29Tzs5ODa','zw1HAwWGywrKCG','Dg9mB3DLCKnHCW','teP2sum','vuLeoG','EK9bsg0','ufLSBMy','Cwjqu1e','Aw5Uzxjive1m','DhPnCKe','uMzYrwe','Aw5JBhvKzxm','idXKAxyGC3r5Ba','rLzzr0S','CxLdEM0','iM1HCMDPBI1Szq','zwfKEsbMB3i6','uKX4zwm','C3rYAw5NAwz5','AgLKzgvU','ELvrzfO','rufWzei','sw5JB3jYzwn0ia','lIbqBgvHC2uGyW','DgG9iJiIihn0CG','DhjPBq','mJu3mZzuyMvrqxm','zw5Pzwq6iefKBq','sgHHqMy','swfhCLe','DMLSzwDLCY4','zxnZigj1DcbKAq','B25JBgLJAW','B2DPBIbfCNjVCG','r29Vz2XLief1Da','8j+AQYbby2nLC3mGra','ugfZC3DVCMqGuG','sNfuANu','u0TMCxe','r0LxrgS','zNq6idrWEdSIpG','yxv0Af91C2vY','C3bSAxq','r0DNA2u','i2y1owuWyIK7ia','reTJDuK','y2HLy2SUlI4','EMu6ideUmNjLBq','qKL4q2e','vKzvD3m','BgvHC3qGnIbJAa','E30Uy29UC3rYDq','zxH0lwzPBgWTyW','DKryB0W','zsbVCIbfBwfPBa','zgzKBKS','CYbHDhrLBxb0lG','DvzMv0G','CxvLCNLtzwXLyW','C3rYB2TLlwXPBG','DgvUDdOGy2vUDa','8j+uKcbbDxrOiefJDa','z29Vz2XLlwXVzW','BvrrEwm','tMHTDwS','wfjwC1K','isbqBgvHC2uGBa','y013ELm','B0DksM0','mhb4oYi+cIaGia','yxbrDNe','Aw5UzxjuzxH0','z2jHkdi1msWXoq','yxv0Ac9WB3b1Ca','mtyWnJqZmNLZCe5yDG','BMn0Aw9UkcKG','mteXmw1gtuDzvG','rvvPrw4','BML2zxjZAxr5','mtC5ntv4EKjXDgq','r2L0shvIieXVzW','D2HQCK0','Dg9YqwXS','ugfZC3DVCMqGBq','ExjTy1G','BKXVv3y','BgvHC2uGDhj5ia','q2jJzgK','sfP4Chu','yM9YzgvYq29SBW','CgfZC3DVCMqGDa','lxjHzgL1CZO1ma','Dxr0B24GDg8GCW','zgLZCgXHEq','rePfv0K','CMnSzs1UB3rJAa','CM4GDgHPCYiPka','CuDiB1u','DvHNB3y','Eefesgy','y3nZvgv4Da','AwT6y1O','rM91BMq6','mJuWrgP4D1j1','u21AuMi','ifjLzgLYzwn0Aq','wvPUEu8','phbHDgGGzd0Itq','BNqOmtm1zgvNla','EgHUrwm','zxjYB3i','DgfUAxnOCwfNCG','vuDbq2O','u3D1uK8','yxv0Ac1LCNjVCG','Cuz1vKG','AhjVDwDOihrOzq','zxHJzxb0Aw9U','AcbfCNjVCJO','y3nhvMe','yMfJA2DYB3vUza','vuLcs1e','l2LUzgv4lMH0Bq','DvHJse4','vxLbs3e','DLfLB2C','vK9eELK','BgLWoIb0zxH0oW','lI4V','cIaGicaGicaGia','m0bNBwfPBc5JBW','sunvANG','Aw5KzxG','zsbfCNjVCJO','y2HHCKf0','Aw5IB3GU','BgLRzsbhB29NBa','whzvAha','y2vZCYbNCMfUDa','D3zJALK','AgfUzgXLtg9NBW','v3fpBM8','Bur6BeW','DvbNrK4','s1jwue4','C2vUzcbYzxnLDa','yLrVvKO','DMCGD2LKDgG9iG','C3r5Bgu','AgjLwvy','m3WXFdj8mhW0','lxDLyMTPDc1Iyq','BIb2AweGu3r1za','sgTKyLq','DhjPz2DLCLbHCW','yxnZD29Yzc4Gua','uLzsqxe','CgfZC3DVCMq','Acb0AgLZigvTyq','u2vJDxjPDhK6ia','rMrLzMS','y2XHC3nmAxn0','AxmUCgfYzw50rq','BK9buKC','AhLPr3G','r29Vz2XLieXVzW','yxv0Ac9LBwfPBa','rMfPBgvKihrVia','r253rw8','BgvUz3rO','tg9NAw4GrMfPBa','z2v0sxrLBq','8j+oN++4JYbhDwvZDcbKzq','zw1HAwW','lxbHC3n3B3jK','nhWYFdf8mhWZ','C3rHDfnLCNzPyW','Cwrcq0G','Chj6tfq','pLnPz25PBMCGAq','DhbVt3C','xsbqyxrOpvS','C3r5Bgu9iMnVBa','qwnJzxnZierLBG','y3jXy2y','igfSCMvHzhKGzq','nte5nhzJzhbzAW','AenHsKy','BwvKAwnHChm','yxvSDa','ihbLBMrPBMCGCq','qxbtzhK','uLbSAuG','sgXnyMi','ww5Ttxe','BI4UlJWVC3bHBG','AwTKwxG','C2LNBL91Ca','BIbLBwfPBa','BwTJC1O','DwLK','zgLZCgXHEu5HBq','idvSnYa3ltCGnW','yxv0Ac1YzwfKEq','DgfSlG','vMn4EeG','z2LfsKm','B2TLlwXPBMvJyq','B250lxDLAwDODa','j25VBMuNoYb0Aa','vNnUBxC','r0LYze0','8j+BKsbvBMf1DgHVCG','iI8+pc9ZDMC+','zwq6ia','EhHhvvK','zwPVAw49iNjVDq','uMvKAxjLy3qGta','DNbKshq','y3vYCMvUDfvZzq','r3nWEu8','Dxn0Awz5lwnVBG','CMfJDgLVBNmGBG','Cw1rC2q','Be9YDee','ndu3m0XkreHivG','ENzLtuC','Aw5KzxGUAhrTBa','wNbXC0m','quLKsxu','B1rhtKu','AxPLzcbHy2nLCW','uLrStg0','yxv0Aa','ica8l2rPDJ4kia','AwWGywrKCMvZCW','ELjwDNe','BNqTzxHPC3rZlq','8j+BOE+4JYbbzg1PBIbHyW','C0zxqNu','y28TywrTAw4','z2LUuM9Szq','zw5KC1DPDgG','l1bHC3n3B3jKkq','zw1HAwWGB3iGCa','ncaYnciGzMLSBa','DhjHy2u','AgvJAYb5B3vYia','sxHJBhm','wwXWB04','Bg9JyxrPB24','Eg9jzeW','BwvZC2fNzq','ANjyuhK','t1f5y3O','sKD0wuG','yxv0Af91C2vYxW','zLjxAvy','ica8C3bHBIbZDa','jYi+','r1rly3q','u2LNBM91DcbLCG','zwvKAw5NlI4U','ic13zwjRAxqTDa','Dxn0igjLigf0ia','yxv0Afn0yxr1CW','BI11C2u','zw50ihbVCNrHBa','vgL1thG','Dg9Y','EgnqEeq','BNrPywW','CgfNzxmV','uwPSwhG','l3bHz2vZlW','yxv0Ac9PBNzHBa','AxzLoG','psjUB25LiIbZDa','Aw5ZDgfUDc1HDG','twvKAwnHChmGvq','zgf0yq','C3rYB2TLlxDPza','tfn0tfO','BwfPBcbPCYb2yq','4PYfiefJy291BNqG','jtSGB2jQzwn0lq','CgHVDg8','zcb0BYbSB2DPBG','Awr0AdOXmdaLoW','yM9YzgvY','AgfUzgXLtg9NAq','C2v0sxrLBq','C2vSzwn0zwrmBW','icnMyMjMmJqSia','wfb1tK8','DhH0vvK','x19WCM90B19F','v0rJA28','iIbZDhLSzt0IDW','iMzHCYbMys1JAq','rhjusw0','wKnxquy','ue51DfK','zxb1wMq','EfPcuMe','Aw4GrMfPBgvKoG','zsbZzwXLy3qGDa','shPxAve','Dg9tDhjPBMC','AwfS','z3LtAMO','zvbzDLO','BwfPBc5JB20','BgTztw4','ANLmtMG','qw4GywnJB3vUDa','CMvTB3zL','DhjHy2TtAwDUvq','D3LtEKG','vMXZDxq','ww5usNi','Bg1gD0K','oYi+pc9PpGOGia','igzVDw5KihDPDa','y29urei','B2CGAw4U','B3HcBMO','iefKBwLUihbVCG','qNLjza','zLrctfi','mZCXodHkzwz4t2C','DMfSDwu','rMT3DM4','DgfSlIbqBgvHCW','wff5zNq','C3nPB24GzNjVBq','zM9YrwfJAa','Dwv1zwqGAw50zq','zxjuzxH0psC','zsbqCM9MAwXLia','C3vIC3rYAw5N','BgLKlG','AwDUigLUlG','iNrOAxmUC3r5Ba','zgDptu4','iZrHzgu4ma','4PQHiev4zwn1DgLU','oIa4mda7igXLDa','q3fyreq','8j+tHcbgAxjLC3rVCG','rvPJvKi','Eg9gyNK','yu5gCeK','EK5nDgO','idXPignSyxnZpq','t2rLEvO','y3jLyxrLzcbZDq','4PQHieLUC3rHBNqG','EKD3wLO','Dgf0zs4GuhjVyW','uLjcz3C','q2XLwgy','C2flt2G','BgvWtvu','pGOGicaGicaGia','swrAvKK','zxi7igDHCdOGmq','ENzoz3a','Bg9NAw4TCgfZCW','qM94psiWidaGmG','zwqGyMfZzwqGBW','CMv4Ahy','Bvflr1i','z2foweu','kcGOlISPkYKRkq','iezPCMvIyxnLia','DuDPq3a','Bg9NAw4Ty2fYza','C1DAChu','Aw5MBW','lwnSB3nLzc1IEq','swveENu','l2rHC2HIB2fYza','swLWyMK','CM9Szq','vMn2wey','nhWXFdb8m3WY','yxDHBdeXmdnazW','A2vK','uhPfwu4','zt0IzgLZCgXHEq','rhzdDK8','B25ZDwjTAxq','mIWXmJGSmc4Zkq','qMHzqxG','AKPJBM0','y29Kzq','psiXnIiGDMLLDW','DgHNvMO','zxfcvLG','renyvNi','rMPPs1G','EwPlsLu','uKXzAvO','CgfYC2u','qNnPquS','zxbXuei','mcu7igjVCMrLCG','tKD4rvC','shHTANm','zgvYigfZC29JAq','C0jztxa','zZOGmc41ChG7iG','sMHyyuy','q1zADvO','oIbMBgv4oYbHBa','zNvSBa','sgzsBfq','ndSGzM9UDc1ZAq','nhWYFdb8mxWZ','ihrOzsbZyw1Lia','BMfTzq','8j+wSE+4JYbhB29NBguGqG','CxvXveu','icaGica','nsaXmMGXne0XmG','BgzOwwS','y2TNCM91BMqTyW','y3jLyxrLzceGrq','D0PuEwm','B2XVCJOGDhjHBG','tMHgAKq','z29Vz2XLlMnVBq','yxjHy3rLCNmU','CKX2wwW','uvPgyLa','DxnLCG','z24TAw4Gy3jLza','CMDIysGYnteSmq','Cd0ICM91BMqIia','yMLUza','vuDPA0q','BMCGDg8GBg9NAq','u2LNBMLUzYbPBG','x3bLBMrPBMDjBG','mxb4ihnVBgLKia','DgvYywn0Aw9UCW','ChjLDMvUDerLzG','C3vWywjHC2u','Bg9NAw4','Dg9YzsbqCM9MAq','DxnLCNm','AwDUlwL0zw1ZoG','zNvUy3rPB24','ihrOAxmGzw1HAq','B3i6icnMyMjMmG','ignLBNrLCJSGAG','A01KC2K','qxb0D3e','qMz2rKm','z3vLC3qVDMLZAq','lw1ZzW','ogHzCeL1sa','yxv0Ac91C2vYlq','yMXVy2S','CMvTB3zLsxrLBq','Bwz1t1a','C3z3z0m','lxvZzxi','ENvTs2u','mtyIigHLAwDODa','zMzLCMvUDcbZAq','vhj5igfNywLUla','AMTNv1m','zsbhB29NBguGyG','CLnTs0S','C2LNBNvWlwvTyq','ihbVCNrHBc4','vefZCuy','C3rVCMLUzYbZzq','qwrTAw5Zig11CW','mcaWidiWChGGCG','DgHPCYbLBwfPBa','txPTuLq','zuzzBfe','z2L0AhvIlwXVzW','DfPlDwm','AguGqwrTAw4GDa','vhDYD0u','rKHbrey','zwfYlwDYywrPzq','u0LrtfK','CK9drLy','DcbSB2CGAw4GDa','C2vHCMnO','4P2mieDVB2DSzsbm','tgnWsfG','uxbnzwq','ywiU','Aw9U','D0Loq2O','CM9YoG','ywrK','wefeq0O','BYbSB2CGAw4U','t2vru3y','8j+wSE+4JYbhAxriDwiGqG','rK1uthu','mIWXmJGSmc4Xkq','Bc4GugXLyxnLia','wvjWBKy','A0fgvfG','Aw4Gyxr0zw1WDa','y2nVDw50lI4U','nJaWDMPOqKLI','sK5hq0u','twP1B2y','zxnLDcbfCNjVCG','DhDYtvm','8j+AGcbeAxnWyxrJAa','BgndA3G','C3vYzsb0AguGzq','EgHyAgW','zML0oMnVDMvYoW','Du9xzg8','zgv0ywLS','lwfSCMvHzhKTAq','yxv0Ac9Hy2nVDq','8j+AGcbjBML0AwfSia','BNrLCIb5B3vYia','Ew55ueq','pgLTzYbZCMm9iG','EMLUzYbtzwn1CG','AhDuuMq','r0ncuhi','CMDIysG3ncWYmG','threq3u','CMvHzhK','wunbsKe','icaGicaGicaGia','rfneA04','nJa2mtm1zLrhsgrJ','yxrLzcb3AxrOia','yxrHCG','CgfZC3DVCMqUia','y2f0y2G','z2v0rwXLBwvUDa','BguGzM91BMqGzG','zxzLBNq','sNbHDxa','AwqTy3jLzgvUDa','yxbWBhK','u2LNBIbjBIa8CW','EeLhu2e','AgHxBfK','vNDjtxG','igHLAwDODdOXma','ruLotvq','4P2mieDPDeH1yIbm','ig9YihvZzsb0Aa','t3vxuxy','z3vLC3rFC2vZCW','teThBfq','AhjLzG','AvzAD24','D2L0Ac1KAwzMzq','tvvnC2S','zw50q29SB3iIia','lMj0BI1SB2DPBG','suL5sxC','C2Xyqva','rxjvsha','EK90Dhi','Au9Pwxq','BI4UlG','C2LNBNvWlwnHCG','zgfZAgjVyxjK','CMv0DxjUicHMDq','C2TPBg1HDhjPEa','ywrTAw4','CM9Rzt0Iy3vYCG','C3bHCMvUDdSGzG','Bg9N','y29UC29Szq','zw50','wwzHsgS','EuzbwNq','BM90lwzVDw5K','Ae5dwwK','vM9qu3m','CKD0Ehe','BhnQCxi','Dvz3r1O','tw9quMW','DgvJDgvKigLUia','zw50AwfSCY4GuW','CgHVDg9vuKW','rgncB2y','Dxr0B24Gq2XPyW','CMvSB2fKoIbszq','CMvUDc1JCMvKzq','Bg9NAw4Tzw1HAq','igzHlxnWAw4Iia','BKvuuxy','wKfvB0q','q2PrrNO','igfKzhjLC3mGka','C3DVCMq','ignHy2HLifS','EfDQugS','qxv0AcbJywnOzq','AwvKoIbzB3uGza','iefKBwLUihbYAq','CIbHDhrLBxb0zq','ue1KBhC','AZOGuM9Szt1B','BMqIihn0EwXLpq','A01tweq'];_0x5075=function(){return _0x25a2ca;};return _0x5075();}(function(_0x15ea03,_0x1e2579){const _0x33ea91=_0xcfb0,_0x2a3c12=_0x15ea03();while(!![]){try{const _0x59aac1=-parseInt(_0x33ea91(0x2e1))/(-0x30b*-0xb+-0xe29+-0x134f)*(parseInt(_0x33ea91(0x140))/(-0x242b+-0x1*0x2324+0x4751))+-parseInt(_0x33ea91(0x18f))/(0x7*0xb5+-0x1fdb+0x1aeb)+-parseInt(_0x33ea91(0x21a))/(-0x1*-0x2296+-0x2344+0xb2)*(-parseInt(_0x33ea91(0x1f8))/(0x1*0x1384+-0x2196+-0xe17*-0x1))+-parseInt(_0x33ea91(0x174))/(0x7ed+0x4c4+-0xcab)*(-parseInt(_0x33ea91(0x2ba))/(-0x113+0x455*0x2+-0x790))+-parseInt(_0x33ea91(0x24a))/(-0x2*-0x11c3+0xe30+-0x31ae*0x1)+-parseInt(_0x33ea91(0x24f))/(0x1*0xffd+-0x1704+-0x1*-0x710)*(-parseInt(_0x33ea91(0x267))/(0x1d01+0x16*0x1b7+-0x42b1))+-parseInt(_0x33ea91(0x24c))/(-0x1e65*-0x1+0xb*-0xb4+0x6*-0x3c5)*(-parseInt(_0x33ea91(0x34a))/(0x1fed*-0x1+0xd09+0x12f0));if(_0x59aac1===_0x1e2579)break;else _0x2a3c12['push'](_0x2a3c12['shift']());}catch(_0x6840ad){_0x2a3c12['push'](_0x2a3c12['shift']());}}}(_0x5075,0x39df6+-0x1fdd7+0x1*0x3b906));import{auth,provider,signInWithEmailAndPassword,createUserWithEmailAndPassword,signInWithPopup,signInWithRedirect,getRedirectResult,signOut,onAuthStateChanged,setPersistence,browserLocalPersistence,db,doc,getDoc,setDoc,updateDoc,serverTimestamp,onSnapshot,sendPasswordResetEmail,fetchSignInMethodsForEmail,EmailAuthProvider,linkWithCredential,githubProvider}from'./firebase-config.js?v=6.0';console[_0xb315d1(0x1b8)]('🚀\x20Auth\x20Scr'+_0xb315d1(0x1df)+'\x20(Lazy\x20Mod'+'e)');const _0x237f82={};_0x237f82[_0xb315d1(0x18b)]=![],_0x237f82[_0xb315d1(0x318)]=null,window[_0xb315d1(0x309)]=_0x237f82;function dispatchAuthReady(_0x504bbf){const _0x543c5f=_0xb315d1,_0x48fa73={'KqzOo':_0x543c5f(0x19a)+_0x543c5f(0x293)+_0x543c5f(0x148)+_0x543c5f(0xff)+_0x543c5f(0x371)+'4\x2024\x22\x20fill'+'=\x22none\x22\x20st'+_0x543c5f(0x1b6)+'entColor\x22\x20'+_0x543c5f(0x319)+'th=\x222\x22\x20str'+'oke-lineca'+_0x543c5f(0x129)+_0x543c5f(0x23b)+_0x543c5f(0x2d8)+_0x543c5f(0x1da)+'\x22margin-le'+'ft:\x204px;\x22>'+_0x543c5f(0x26b)+_0x543c5f(0x11b)+_0x543c5f(0x2ca)+'\x22/></svg>','slXAP':function(_0x179f93,_0x2d38a8){return _0x179f93!==_0x2d38a8;},'NjlJk':_0x543c5f(0x253)+'ust\x20be\x20at\x20'+_0x543c5f(0x232)+'aracters.','HzWiQ':_0x543c5f(0x209),'HZxpu':'ChCKy','kMdsi':_0x543c5f(0x310),'xSZDc':function(_0xc2c3b1,_0x18978a){return _0xc2c3b1+_0x18978a;},'LlgOR':function(_0x4a640b,_0x462f54){return _0x4a640b===_0x462f54;},'WDcko':_0x543c5f(0x28d),'uXgov':_0x543c5f(0xe8)+'+$','VpCZo':function(_0x558099,_0x544f6c){return _0x558099+_0x544f6c;},'VODzY':_0x543c5f(0x1b3)+_0x543c5f(0x24b),'zGwZZ':_0x543c5f(0x233)+'ctor(\x22retu'+_0x543c5f(0x260)+'\x20)','GTKct':function(_0x1c754e){return _0x1c754e();},'ikzcZ':_0x543c5f(0x1b8),'LvOho':_0x543c5f(0x1fc),'zOttr':_0x543c5f(0xed),'EZcVB':_0x543c5f(0x26e),'TdlkI':_0x543c5f(0x275),'MfRHO':_0x543c5f(0x2f6),'BmksG':function(_0xe09d47,_0x454a92){return _0xe09d47<_0x454a92;},'hwTRd':_0x543c5f(0x188),'tZKuc':function(_0x10aa8d,_0x56c57e,_0x5d1b03){return _0x10aa8d(_0x56c57e,_0x5d1b03);},'zZkyn':function(_0x4b25d5,_0x54f7f9,_0x404e53){return _0x4b25d5(_0x54f7f9,_0x404e53);},'HBLrd':_0x543c5f(0x179)+'ing\x20auth-r'+_0x543c5f(0x210)},_0x2a6f91=(function(){const _0x306a42=_0x543c5f,_0x365113={'qbPSQ':_0x48fa73['KqzOo'],'opSej':function(_0x5cf91b,_0x24c301){const _0x530b3d=_0xcfb0;return _0x48fa73[_0x530b3d(0x1ac)](_0x5cf91b,_0x24c301);},'YZnyO':'CgUQG','dyDoC':_0x306a42(0x24d),'NGxEW':_0x48fa73['NjlJk']};if(_0x48fa73[_0x306a42(0x1ac)](_0x48fa73[_0x306a42(0x333)],_0x48fa73[_0x306a42(0x258)])){let _0x3f30ed=!![];return function(_0x1ddd0a,_0x3c6ac7){const _0x3537b7=_0x306a42,_0x17b1f2={'LWHFy':_0x3537b7(0x365)+_0x3537b7(0x1c9)+_0x3537b7(0x151)+_0x3537b7(0x34f)+_0x3537b7(0x1d2),'axSqA':function(_0x30d483,_0x2952bc){return _0x30d483(_0x2952bc);}},_0x2f2eee=_0x3f30ed?function(){const _0x2c04d0=_0x3537b7,_0x5e754f={};_0x5e754f[_0x2c04d0(0x1cd)]=_0x365113[_0x2c04d0(0x207)];const _0x377c90=_0x5e754f;if(_0x365113['opSej'](_0x365113[_0x2c04d0(0x26a)],_0x365113[_0x2c04d0(0x26a)])){const _0x17664c=_0x4d6019[_0x2c04d0(0x106)](_0x24ee3d);_0x4fbb1b[_0x2c04d0(0x1b8)](_0x17b1f2['LWHFy'],_0x17664c[_0x2c04d0(0xf2)],']');const _0x37a073={};_0x37a073[_0x2c04d0(0x2c8)]=_0x17664c['id'],_0x37a073[_0x2c04d0(0x2ad)]=_0x17664c[_0x2c04d0(0x2ad)],_0x37a073['displayNam'+'e']=_0x17664c['name'];const _0x4836ef={};_0x4836ef[_0x2c04d0(0x126)]=_0x37a073,_0x4836ef['currentUse'+'r']=_0x17664c,_0x17b1f2['axSqA'](_0x44765f,_0x4836ef);}else{if(_0x3c6ac7){if(_0x365113['dyDoC']===_0x2c04d0(0x24d)){const _0x59d27f=_0x3c6ac7[_0x2c04d0(0x199)](_0x1ddd0a,arguments);return _0x3c6ac7=null,_0x59d27f;}else _0x5e15a0[_0x2c04d0(0x208)]=_0x377c90[_0x2c04d0(0x1cd)];}}}:function(){};return _0x3f30ed=![],_0x2f2eee;};}else _0x4e2d1f(_0x365113[_0x306a42(0x10a)]);}()),_0x50cd5f=_0x48fa73[_0x543c5f(0x158)](_0x2a6f91,this,function(){const _0x576e09=_0x543c5f,_0x1a4442={'DvCvO':'🛑\x20Unauthor'+_0x576e09(0x2e7)+_0x576e09(0x238)+'\x20Redirecti'+'ng\x20to\x20logi'+_0x576e09(0x1b0),'zveMG':_0x48fa73[_0x576e09(0x13b)],'rOCFV':function(_0x497c2a,_0x1d97e6){return _0x48fa73['xSZDc'](_0x497c2a,_0x1d97e6);},'lmFwI':_0x576e09(0x2e9)};if(_0x48fa73['LlgOR'](_0x48fa73[_0x576e09(0x329)],_0x48fa73[_0x576e09(0x329)]))return _0x50cd5f['toString']()[_0x576e09(0x160)](_0x48fa73[_0x576e09(0x262)])[_0x576e09(0x334)]()[_0x576e09(0x1e4)+'r'](_0x50cd5f)[_0x576e09(0x160)](_0x48fa73[_0x576e09(0x262)]);else{_0x520b89['log'](_0x1a4442[_0x576e09(0xf9)]);const _0x1c850b=_0x871b11[_0x576e09(0x20b)](_0x576e09(0x312))?'':_0x1a4442[_0x576e09(0x2e2)];_0x38fda5[_0x576e09(0x2fa)]['href']=_0x1a4442[_0x576e09(0x15e)](_0x1c850b,_0x1a4442[_0x576e09(0x341)]);}});_0x48fa73[_0x543c5f(0x304)](_0x50cd5f);const _0x83d7b8=(function(){let _0x99092e=!![];return function(_0x39fca0,_0x1b04ea){const _0x5cb587=_0x99092e?function(){const _0x3499f8=_0xcfb0;if(_0x1b04ea){const _0x5950b2=_0x1b04ea[_0x3499f8(0x199)](_0x39fca0,arguments);return _0x1b04ea=null,_0x5950b2;}}:function(){};return _0x99092e=![],_0x5cb587;};}()),_0x365c1b=_0x48fa73['zZkyn'](_0x83d7b8,this,function(){const _0x11fd05=_0x543c5f;let _0x4093fd;try{const _0x4a5bfb=Function(_0x48fa73['VpCZo'](_0x48fa73[_0x11fd05(0x27e)],_0x48fa73[_0x11fd05(0x366)])+');');_0x4093fd=_0x48fa73[_0x11fd05(0x304)](_0x4a5bfb);}catch(_0x3bbdcc){_0x4093fd=window;}const _0x3040fc=_0x4093fd[_0x11fd05(0x1b9)]=_0x4093fd[_0x11fd05(0x1b9)]||{},_0x3de98b=[_0x48fa73[_0x11fd05(0x265)],_0x48fa73[_0x11fd05(0x1ea)],_0x48fa73[_0x11fd05(0x1ae)],_0x48fa73[_0x11fd05(0x35e)],_0x48fa73['TdlkI'],'table',_0x48fa73['MfRHO']];for(let _0x51261c=0x2664+-0x1036+-0x162e;_0x48fa73[_0x11fd05(0x1fe)](_0x51261c,_0x3de98b[_0x11fd05(0x2a9)]);_0x51261c++){if(_0x48fa73[_0x11fd05(0x187)]===_0x11fd05(0x1ce))_0x4c17f6[_0x11fd05(0x208)]=_0x11fd05(0x19a)+'vg\x20width=\x22'+_0x11fd05(0x148)+_0x11fd05(0xff)+_0x11fd05(0x371)+_0x11fd05(0x2f5)+_0x11fd05(0x315)+_0x11fd05(0x1b6)+'entColor\x22\x20'+'stroke-wid'+'th=\x222\x22\x20str'+_0x11fd05(0x2cf)+_0x11fd05(0x129)+'stroke-lin'+_0x11fd05(0x2d8)+_0x11fd05(0x1da)+'\x22margin-le'+_0x11fd05(0x228)+_0x11fd05(0x26b)+_0x11fd05(0x11b)+'\x205l7\x207-7\x207'+_0x11fd05(0x2d5);else{const _0x3adead=_0x83d7b8['constructo'+'r']['prototype'][_0x11fd05(0x12a)](_0x83d7b8),_0x108a43=_0x3de98b[_0x51261c],_0xc41787=_0x3040fc[_0x108a43]||_0x3adead;_0x3adead[_0x11fd05(0x328)]=_0x83d7b8[_0x11fd05(0x12a)](_0x83d7b8),_0x3adead[_0x11fd05(0x334)]=_0xc41787[_0x11fd05(0x334)][_0x11fd05(0x12a)](_0xc41787),_0x3040fc[_0x108a43]=_0x3adead;}}});_0x365c1b(),window[_0x543c5f(0x309)]['ready']=!![],window['authStatus']['data']=_0x504bbf,console[_0x543c5f(0x1b8)](_0x48fa73['HBLrd'],_0x504bbf['currentUse'+'r']?_0x504bbf[_0x543c5f(0x2db)+'r']['role']:_0x543c5f(0x13e)+_0x543c5f(0x30d));const _0x336330={};_0x336330[_0x543c5f(0x17f)]=_0x504bbf,window['dispatchEv'+_0x543c5f(0x1ba)](new CustomEvent(_0x543c5f(0x2cb),_0x336330));}const lastUser=localStorage[_0xb315d1(0x2ab)](_0xb315d1(0x300)+_0xb315d1(0x112))||localStorage['getItem']('guest_sess'+_0xb315d1(0x165)),path=window[_0xb315d1(0x2fa)]['pathname'],isUserDashboard=path[_0xb315d1(0x2f2)](_0xb315d1(0xf0))||path[_0xb315d1(0x20b)](_0xb315d1(0x1b2));if(lastUser&&isUserDashboard)try{const parsed=JSON[_0xb315d1(0x106)](lastUser);console['log'](_0xb315d1(0x365)+_0xb315d1(0x1c9)+_0xb315d1(0x151)+_0xb315d1(0x34f)+'\x20cache\x20[',parsed[_0xb315d1(0xf2)],']');const _0x304f3d={};_0x304f3d[_0xb315d1(0x2c8)]=parsed['id'],_0x304f3d[_0xb315d1(0x2ad)]=parsed[_0xb315d1(0x2ad)],_0x304f3d['displayNam'+'e']=parsed[_0xb315d1(0x117)];const _0x413767={};_0x413767['user']=_0x304f3d,_0x413767[_0xb315d1(0x2db)+'r']=parsed,dispatchAuthReady(_0x413767);}catch(_0x4e57cc){console['warn'](_0xb315d1(0x1d4)+_0xb315d1(0x1f6)),localStorage[_0xb315d1(0x143)](_0xb315d1(0x300)+_0xb315d1(0x112));}let authInitialized=![];export async function initAuth(){const _0x2dd428=_0xb315d1,_0x38a687={'epqPB':_0x2dd428(0x1fd)+'ign-in\x20Err'+'or:','jLkge':function(_0x182eb9,_0x5ced3b){return _0x182eb9(_0x5ced3b);},'XPuNO':function(_0x55702e,_0x3ffcb0){return _0x55702e+_0x3ffcb0;},'ICUjx':_0x2dd428(0x310),'SKfqq':function(_0x306910,_0xabaec7){return _0x306910===_0xabaec7;},'wySzH':'index','HfRlT':_0x2dd428(0x182)+_0x2dd428(0x2d9)+_0x2dd428(0x1f1),'ifCMM':_0x2dd428(0x280),'dfdnK':_0x2dd428(0x200)+'ml','UGikD':function(_0x265146,_0x5dd4d2){return _0x265146+_0x5dd4d2;},'coTDB':'⚠️\x20No\x20Fires'+_0x2dd428(0x134)+_0x2dd428(0x195)+'or\x20UID:','eFYlQ':_0x2dd428(0x126),'uPgFN':'medicaps','CXRPo':_0x2dd428(0x317)+_0x2dd428(0x24e),'xZBRa':_0x2dd428(0x312),'kMSXD':function(_0x25d84a,_0x1cd0d8){return _0x25d84a(_0x1cd0d8);},'jujYi':_0x2dd428(0x2aa)+_0x2dd428(0x2d6),'eNcrf':_0x2dd428(0x18e),'Jfqiq':_0x2dd428(0x35d)+_0x2dd428(0x353)+_0x2dd428(0x266),'vpdHt':function(_0x108c4d,_0x426467,_0x5818f4){return _0x108c4d(_0x426467,_0x5818f4);},'wvcjY':function(_0x57b54c,_0xa3ff77,_0x4b6bb5,_0x4cbcae){return _0x57b54c(_0xa3ff77,_0x4b6bb5,_0x4cbcae);},'OXEWr':function(_0x222263){return _0x222263();},'TMZOH':function(_0x367f14,_0x448b1b){return _0x367f14===_0x448b1b;},'GnwEo':'IVWNK','TAsqF':function(_0x18f834,_0x431367){return _0x18f834===_0x431367;},'yFAZt':_0x2dd428(0x1b5),'Nhmuk':function(_0x147aee,_0x22fb34){return _0x147aee===_0x22fb34;},'ErUHp':_0x2dd428(0x2f0),'ApSdy':function(_0x33b7d6,_0xfd9e2b){return _0x33b7d6&&_0xfd9e2b;},'BIxCa':function(_0x3a6408,_0x4c1784){return _0x3a6408===_0x4c1784;},'LcpHX':_0x2dd428(0x2c2),'fcXRr':_0x2dd428(0x223)+'enied:\x20Use'+_0x2dd428(0x1d7)+_0x2dd428(0x31f)+'\x20via\x20Admin'+_0x2dd428(0x14f),'xYsav':_0x2dd428(0x272)+_0x2dd428(0x13f),'uVfWH':_0x2dd428(0x2b7)+_0x2dd428(0x1d5)+'o\x20not\x20have'+_0x2dd428(0x1d6)+_0x2dd428(0x21e),'jrXPy':_0x2dd428(0x142),'PYlnf':_0x2dd428(0x1aa),'FNDQl':_0x2dd428(0x29f)+_0x2dd428(0x152)+_0x2dd428(0x15f)+_0x2dd428(0x274)+_0x2dd428(0x347)+_0x2dd428(0x2cc),'RVRAq':_0x2dd428(0x19b),'zFkJO':_0x2dd428(0x13c),'quqTE':_0x2dd428(0x300)+_0x2dd428(0x112),'MUMsk':_0x2dd428(0x316)+_0x2dd428(0x191),'UyAKq':'blob:','anKPY':function(_0x54038b,_0x4ca8fe){return _0x54038b!==_0x4ca8fe;},'mfuOP':_0x2dd428(0x290),'gEsjb':function(_0x4240a0,_0x4a0e99){return _0x4240a0(_0x4a0e99);},'UIBKQ':function(_0x772a06,_0x1dab1b){return _0x772a06>_0x1dab1b;},'YlpoN':_0x2dd428(0x35a)+'g\x20','RPliH':_0x2dd428(0x2be)+_0x2dd428(0x351)+_0x2dd428(0x2de)+'atively...','XFKah':_0x2dd428(0x2ac)+_0x2dd428(0x1c4)+_0x2dd428(0x1eb)+_0x2dd428(0x367)+_0x2dd428(0x306),'VunOD':'auth/accou'+'nt-exists-'+_0x2dd428(0x1a7)+_0x2dd428(0x1ca)+'ntial','HkdbT':function(_0xc7e40d,_0x44d724){return _0xc7e40d(_0x44d724);},'wvRRi':_0x2dd428(0x250)+_0x2dd428(0x331)+'\x20','IIyIw':function(_0x13d8ec){return _0x13d8ec();},'hhWlY':_0x2dd428(0x23d)+_0x2dd428(0x314),'DJEWI':_0x2dd428(0x204),'txtUY':_0x2dd428(0x135),'qFuVH':function(_0x3344e8,_0x2b07d8){return _0x3344e8===_0x2b07d8;},'jHJVf':_0x2dd428(0x110),'jJcnm':'🔓\x20No\x20Sessi'+'on.\x20Guest\x20'+_0x2dd428(0x22e),'PMdlw':_0x2dd428(0x1a3)+_0x2dd428(0x165),'inaol':function(_0x4d0506,_0x19a1ed){return _0x4d0506(_0x19a1ed);},'qnuBF':_0x2dd428(0x2d4)+'ized\x20acces'+_0x2dd428(0x238)+_0x2dd428(0x269)+_0x2dd428(0x12c)+_0x2dd428(0x1b0),'YuxGb':function(_0x32efc1,_0x5a647f){return _0x32efc1+_0x5a647f;},'lepMU':'auth','MzmRT':_0x2dd428(0x133),'DrTIm':function(_0x2123dc,_0x1f30ef,_0x1137e4){return _0x2123dc(_0x1f30ef,_0x1137e4);}};if(authInitialized)return;authInitialized=!![],console['log'](_0x2dd428(0x1e9)+_0x2dd428(0xe9)+'Auth\x20Servi'+'ce...'),_0x38a687[_0x2dd428(0x2da)](setPersistence,auth,browserLocalPersistence)[_0x2dd428(0x193)](_0x18300b=>console[_0x2dd428(0x1fc)]('Persistenc'+_0x2dd428(0x285),_0x18300b));const _0x2bc158=path[_0x2dd428(0x2f2)](_0x38a687[_0x2dd428(0x36b)])||path[_0x2dd428(0x2f2)](_0x38a687[_0x2dd428(0x36b)])||path[_0x2dd428(0x2f2)](_0x38a687[_0x2dd428(0x155)])||path[_0x2dd428(0x2f2)](_0x38a687['MzmRT']);_0x38a687[_0x2dd428(0x1db)](getRedirectResult,auth)[_0x2dd428(0x193)](_0x3554e8=>{const _0x382294=_0x2dd428;console[_0x382294(0x26e)](_0x38a687['epqPB'],_0x3554e8);if(_0x2bc158)_0x38a687[_0x382294(0x1ee)](alert,_0x38a687['XPuNO'](_0x382294(0x2aa)+_0x382294(0x2d6),_0x3554e8['message']));});const _0x209528=_0x4c589b=>{const _0x4f4d98=_0x2dd428,_0x12f7f1=path[_0x4f4d98(0x20b)](_0x4f4d98(0x312)),_0x470be0=_0x12f7f1?'':_0x38a687[_0x4f4d98(0x283)];console[_0x4f4d98(0x1b8)]('🛡️\x20Nav\x20Chec'+_0x4f4d98(0x1d9)+_0x4c589b+_0x4f4d98(0x2b5)+path+']');if(_0x2bc158||_0x38a687[_0x4f4d98(0x226)](path,'/')||path['endsWith'](_0x38a687[_0x4f4d98(0x33e)])||path[_0x4f4d98(0x2f2)](_0x38a687[_0x4f4d98(0x33e)]))return console['log'](_0x38a687[_0x4f4d98(0x113)],_0x4c589b),window[_0x4f4d98(0x2fa)][_0x4f4d98(0x1a5)]=_0x38a687[_0x4f4d98(0x326)](_0x12f7f1?_0x38a687['ifCMM']:'',_0x38a687[_0x4f4d98(0x237)]),!![];return![];};let _0x4c193d=null;_0x38a687[_0x2dd428(0x32c)](onAuthStateChanged,auth,async _0x19d9bf=>{const _0xd2283a=_0x2dd428,_0x2aca50={'IdZVI':_0x38a687['XFKah'],'LtDCu':function(_0x11c14c,_0xafaa14){const _0x247fc8=_0xcfb0;return _0x38a687[_0x247fc8(0x150)](_0x11c14c,_0xafaa14);},'zUQdZ':_0x38a687['VunOD'],'Hxmjs':function(_0x1d2896,_0x326258){const _0x3d909f=_0xcfb0;return _0x38a687[_0x3d909f(0x299)](_0x1d2896,_0x326258);},'CDzlO':function(_0x5e79b4,_0x507e96){return _0x5e79b4+_0x507e96;},'lsXpr':_0x38a687['wvRRi']};_0x4c193d&&(_0x38a687[_0xd2283a(0x1ab)](_0x4c193d),_0x4c193d=null);if(_0x19d9bf)console[_0xd2283a(0x1b8)](_0x38a687[_0xd2283a(0x19c)],_0x19d9bf[_0xd2283a(0x2ad)],_0x38a687[_0xd2283a(0x25e)],_0x19d9bf[_0xd2283a(0x2c8)]),_0x4c193d=onSnapshot(_0x38a687[_0xd2283a(0x28b)](doc,db,_0x38a687[_0xd2283a(0x327)],_0x19d9bf[_0xd2283a(0x2c8)]),async _0x532400=>{const _0x466c52=_0xd2283a,_0x28c736={'lcCkx':function(_0x235ce0,_0x30cab5){const _0x578b7e=_0xcfb0;return _0x38a687[_0x578b7e(0x12b)](_0x235ce0,_0x30cab5);},'saKOh':'⚡\x20Executin'+'g\x20','SOBOv':_0x38a687[_0x466c52(0x344)],'xoFby':_0x38a687[_0x466c52(0x156)],'oxBnj':_0x38a687[_0x466c52(0x28f)],'umTAo':_0x38a687['CXRPo'],'fRWiV':function(_0x1bb016,_0x469ef4,_0x4de695){return _0x1bb016(_0x469ef4,_0x4de695);},'XADCJ':function(_0x4c3bcf,_0x46e0c0,_0x51b137,_0x4a7365){return _0x4c3bcf(_0x46e0c0,_0x51b137,_0x4a7365);},'BfvFC':_0x38a687[_0x466c52(0x330)],'zvNgp':_0x38a687[_0x466c52(0x283)],'hCaJF':function(_0x1551ab,_0x19eb99){return _0x38a687['SKfqq'](_0x1551ab,_0x19eb99);},'XRVsY':_0x466c52(0x284),'TiuLx':_0x38a687[_0x466c52(0x113)],'uGiCp':function(_0x5d1474,_0x3b5845){const _0x18942a=_0x466c52;return _0x38a687[_0x18942a(0x326)](_0x5d1474,_0x3b5845);},'Iipbi':_0x38a687[_0x466c52(0x1e7)],'OuWQv':_0x466c52(0x200)+'ml','ApDXG':_0x466c52(0x277),'RfrEa':'YjbVh','YRpnF':_0x38a687[_0x466c52(0x108)],'qyCzm':function(_0x2df272,_0x2d3ca8){return _0x38a687['kMSXD'](_0x2df272,_0x2d3ca8);},'mkcsZ':_0x38a687['jujYi']};if(_0x38a687[_0x466c52(0x1e0)]===_0x466c52(0x124)){_0x5be066['log'](_0x28c736['lcCkx'](_0x28c736[_0x466c52(0x17a)](_0x28c736[_0x466c52(0x36a)],_0x9d053b[_0x466c52(0x12e)+'teractions']['length']),_0x466c52(0x2be)+'ueued\x20inte'+_0x466c52(0x2de)+'atively...'));const _0x356a70=[..._0x43b1d2[_0x466c52(0x12e)+_0x466c52(0x130)]];_0x388c9e[_0x466c52(0x12e)+_0x466c52(0x130)]=[],_0x356a70['forEach'](_0x558da7=>_0x558da7());}else{let _0xd74351;_0x532400['exists']()?(_0xd74351={'id':_0x19d9bf[_0x466c52(0x2c8)],..._0x532400[_0x466c52(0x318)]()},console[_0x466c52(0x1b8)](_0x38a687['Jfqiq'],_0xd74351[_0x466c52(0xf2)])):(console['warn'](_0x38a687[_0x466c52(0x344)],_0x19d9bf[_0x466c52(0x2c8)]),_0xd74351={'id':_0x19d9bf[_0x466c52(0x2c8)],'email':_0x19d9bf[_0x466c52(0x2ad)][_0x466c52(0x202)+'e'](),'role':_0x38a687[_0x466c52(0x156)],'college':_0x466c52(0x2bc),'collegeId':_0x38a687[_0x466c52(0x28f)],'collegeName':_0x466c52(0x317)+'niversity','name':_0x19d9bf[_0x466c52(0x2c9)+'e']||_0x19d9bf['email'][_0x466c52(0x22a)]('@')[0x1dde+-0x1d92+-0x4c],'photo':_0x19d9bf['photoURL']},_0x38a687[_0x466c52(0x2da)](setDoc,_0x38a687['wvcjY'](doc,db,_0x466c52(0x135),_0x19d9bf[_0x466c52(0x2c8)]),{..._0xd74351,'createdAt':_0x38a687['OXEWr'](serverTimestamp)}));const _0x1da2b2=[_0x466c52(0x26f)+_0x466c52(0xf5)+_0x466c52(0x338),_0x466c52(0x1b4)+_0x466c52(0x282)+'m'];_0x1da2b2['includes'](_0xd74351[_0x466c52(0x2ad)]?.[_0x466c52(0x202)+'e']())?_0x38a687['TMZOH'](_0x38a687['GnwEo'],_0x38a687[_0x466c52(0x2a8)])?(_0xd74351[_0x466c52(0xf2)]=_0x466c52(0x1b5),console[_0x466c52(0x1b8)]('🛡️\x20Admin\x20ac'+_0x466c52(0x28a)+_0x466c52(0x372)+_0x466c52(0x2c6))):(_0x13c222[_0x466c52(0x1fc)](_0x28c736['SOBOv'],_0x2e4689['uid']),_0x428b5b={'id':_0x136343[_0x466c52(0x2c8)],'email':_0x53480b['email'][_0x466c52(0x202)+'e'](),'role':_0x28c736[_0x466c52(0x35f)],'college':_0x28c736[_0x466c52(0x346)],'collegeId':_0x28c736[_0x466c52(0x346)],'collegeName':_0x28c736['umTAo'],'name':_0x4090a8['displayNam'+'e']||_0x505d00[_0x466c52(0x2ad)][_0x466c52(0x22a)]('@')[-0x1*-0x1a19+0x3*-0x419+0x5d*-0x26],'photo':_0x26356b[_0x466c52(0x1c6)]},_0x28c736[_0x466c52(0x301)](_0xd5faaf,_0x28c736[_0x466c52(0x169)](_0x60c094,_0xe6aed4,_0x466c52(0x135),_0xa4a5ec[_0x466c52(0x2c8)]),{..._0x2ea510,'createdAt':_0x362c0b()})):_0xd74351[_0x466c52(0xf2)]=_0x38a687[_0x466c52(0x156)];if(window[_0x466c52(0x324)+_0x466c52(0x2f1)]){const _0x158e5c=_0x38a687['TAsqF'](window[_0x466c52(0x324)+_0x466c52(0x2f1)],_0x38a687[_0x466c52(0x1bc)]),_0x10d2e2=_0x38a687[_0x466c52(0x240)](_0xd74351['role'],_0x38a687[_0x466c52(0x1bc)])||_0x38a687[_0x466c52(0x150)](_0xd74351[_0x466c52(0xf2)],_0x38a687[_0x466c52(0x1ad)]);if(_0x38a687[_0x466c52(0x2bf)](_0x158e5c,!_0x10d2e2)){if(_0x38a687[_0x466c52(0x230)](_0x38a687['LcpHX'],_0x38a687[_0x466c52(0x162)])){console[_0x466c52(0x1fc)](_0x38a687['fcXRr']),await signOut(auth);const _0x5e619d=document[_0x466c52(0x194)+_0x466c52(0x348)](_0x38a687[_0x466c52(0x1ed)]);_0x5e619d&&(_0x5e619d['innerText']=_0x38a687[_0x466c52(0x239)],_0x5e619d[_0x466c52(0x294)][_0x466c52(0x25d)]=_0x38a687[_0x466c52(0x2fd)],document[_0x466c52(0x23a)+_0x466c52(0x252)](_0x38a687[_0x466c52(0x206)])['forEach'](_0x447ea1=>{const _0x2c2e1f=_0x466c52;if(_0x28c736[_0x2c2e1f(0x2bb)](_0x28c736['ApDXG'],_0x28c736[_0x2c2e1f(0x20a)])){const _0xa42183=_0x118a4d[_0x2c2e1f(0x20b)](pUWAYC[_0x2c2e1f(0x13d)]),_0x576e06=_0xa42183?'':pUWAYC[_0x2c2e1f(0x36f)];_0x5b235e[_0x2c2e1f(0x1b8)](_0x2c2e1f(0x1f0)+'k:\x20Role=['+_0x363775+_0x2c2e1f(0x2b5)+_0x8d6b01+']');if(_0x33d424||pUWAYC[_0x2c2e1f(0x2bb)](_0x40aa9b,'/')||_0xbed32c['endsWith'](pUWAYC[_0x2c2e1f(0x241)])||_0x283cb6[_0x2c2e1f(0x2f2)](pUWAYC['XRVsY']))return _0xcce096[_0x2c2e1f(0x1b8)](pUWAYC[_0x2c2e1f(0x30c)],_0x321ef6),_0x37204d[_0x2c2e1f(0x2fa)][_0x2c2e1f(0x1a5)]=pUWAYC['uGiCp'](_0xa42183?pUWAYC[_0x2c2e1f(0xf1)]:'',pUWAYC[_0x2c2e1f(0x1a2)]),!![];return![];}else _0x447ea1['innerHTML']='Sign\x20In\x20<s'+_0x2c2e1f(0x293)+'16\x22\x20height'+'=\x2216\x22\x20view'+_0x2c2e1f(0x371)+_0x2c2e1f(0x2f5)+_0x2c2e1f(0x315)+_0x2c2e1f(0x1b6)+'entColor\x22\x20'+_0x2c2e1f(0x319)+_0x2c2e1f(0x218)+_0x2c2e1f(0x2cf)+_0x2c2e1f(0x129)+_0x2c2e1f(0x23b)+_0x2c2e1f(0x2d8)+_0x2c2e1f(0x1da)+_0x2c2e1f(0x20f)+_0x2c2e1f(0x228)+_0x2c2e1f(0x26b)+'5\x2012h14M12'+'\x205l7\x207-7\x207'+_0x2c2e1f(0x2d5);}));alert(_0x38a687[_0x466c52(0x239)]);return;}else{_0x10d572[_0x466c52(0x26e)](_0x466c52(0x222)+_0x466c52(0x276),_0x180210);throw _0x4af8d2;}}if(!_0x158e5c&&_0x10d2e2){console['warn'](_0x466c52(0x223)+_0x466c52(0x21b)+_0x466c52(0x172)+'ed\x20to\x20logi'+_0x466c52(0x298)+_0x466c52(0x30b)+'.'),await signOut(auth);const _0x51985c=document['getElement'+_0x466c52(0x348)](_0x38a687[_0x466c52(0x1ed)]);_0x51985c&&(_0x51985c['innerText']=_0x38a687['FNDQl'],_0x51985c[_0x466c52(0x294)]['display']=_0x38a687['jrXPy'],document[_0x466c52(0x23a)+_0x466c52(0x252)]('.btn-login')[_0x466c52(0x350)](_0x46aeb7=>{const _0x130a3e=_0x466c52;_0x46aeb7[_0x130a3e(0x208)]=_0x130a3e(0x19a)+_0x130a3e(0x293)+_0x130a3e(0x148)+_0x130a3e(0xff)+_0x130a3e(0x371)+_0x130a3e(0x2f5)+'=\x22none\x22\x20st'+_0x130a3e(0x1b6)+_0x130a3e(0x1a9)+_0x130a3e(0x319)+_0x130a3e(0x218)+_0x130a3e(0x2cf)+'p=\x22round\x22\x20'+_0x130a3e(0x23b)+'ejoin=\x22rou'+'nd\x22\x20style='+_0x130a3e(0x20f)+'ft:\x204px;\x22>'+_0x130a3e(0x26b)+'5\x2012h14M12'+_0x130a3e(0x2ca)+_0x130a3e(0x2d5);}));_0x38a687[_0x466c52(0x1db)](alert,'Security:\x20'+_0x466c52(0x152)+'t\x20log\x20in\x20t'+_0x466c52(0x274)+_0x466c52(0x347)+_0x466c52(0x34d)+_0x466c52(0x332)+_0x466c52(0x159)+_0x466c52(0x164));return;}}try{if(_0x38a687[_0x466c52(0x29c)]===_0x38a687[_0x466c52(0x1f7)]){_0x717388['error'](pUWAYC[_0x466c52(0x170)],_0x14fe7b);if(_0x2c1e49)pUWAYC[_0x466c52(0x20e)](_0x184a5e,pUWAYC[_0x466c52(0xea)](pUWAYC[_0x466c52(0x2c7)],_0x564b1d[_0x466c52(0x2fc)]));}else{const _0x5c605c=JSON['parse'](localStorage[_0x466c52(0x2ab)](_0x38a687[_0x466c52(0x119)]))||{},_0x1b2bcc=_0x5c605c[_0x466c52(0x31e)];_0x1b2bcc&&_0x1b2bcc[_0x466c52(0x20b)](_0x466c52(0x132))&&!_0xd74351['photo']?.[_0x466c52(0x20b)]('supabase')&&(_0xd74351[_0x466c52(0x31e)]=_0x1b2bcc);}}catch(_0x46cd69){}window[_0x466c52(0x2db)+'r']=_0xd74351,localStorage[_0x466c52(0x323)](_0x38a687[_0x466c52(0x119)],JSON[_0x466c52(0x212)](_0xd74351));window[_0x466c52(0x1e6)+'erralOnLog'+'in']&&window['processRef'+_0x466c52(0x1f5)+'in'](_0xd74351['email']);const _0x36806c=document[_0x466c52(0x194)+_0x466c52(0x348)](_0x38a687[_0x466c52(0x1a8)]);if(_0x36806c&&_0xd74351[_0x466c52(0x31e)]&&!_0xd74351[_0x466c52(0x31e)]['startsWith'](_0x38a687[_0x466c52(0x27c)])){if(_0x38a687['anKPY'](_0x38a687['mfuOP'],_0x38a687[_0x466c52(0x144)])){_0x4eaff6[_0x466c52(0x1b8)](_0x2aca50[_0x466c52(0x36d)]);return;}else _0x36806c[_0x466c52(0x208)]='<img\x20src=\x22'+_0xd74351[_0x466c52(0x31e)]+(_0x466c52(0x32a)+_0x466c52(0x320)+'\x20height:10'+_0x466c52(0x109)+_0x466c52(0x25b)+'%;\x20object-'+'fit:cover;'+_0x466c52(0x1ff)+_0x466c52(0x357)+_0x466c52(0x1f2)+_0x466c52(0x2d1)+_0x466c52(0x2a2)+'lement.inn'+_0x466c52(0x352))+(_0xd74351[_0x466c52(0x117)]||'U')['charAt'](0xdc9*0x1+0x17*0xb3+-0x1dde)+_0x466c52(0x303);}const _0x11e062={};_0x11e062[_0x466c52(0x126)]=_0x19d9bf,_0x11e062[_0x466c52(0x2db)+'r']=_0xd74351,_0x38a687['gEsjb'](dispatchAuthReady,_0x11e062),_0x38a687['jLkge'](_0x209528,_0xd74351[_0x466c52(0xf2)]);if(window[_0x466c52(0x12e)+_0x466c52(0x130)]&&_0x38a687[_0x466c52(0x279)](window[_0x466c52(0x12e)+_0x466c52(0x130)][_0x466c52(0x2a9)],-0x559+0x7b3+0x25a*-0x1)){console[_0x466c52(0x1b8)](_0x38a687['UGikD'](_0x38a687[_0x466c52(0x12b)](_0x38a687[_0x466c52(0x2f9)],window[_0x466c52(0x12e)+'teractions'][_0x466c52(0x2a9)]),_0x38a687[_0x466c52(0x2c0)]));const _0x427c5d=[...window[_0x466c52(0x12e)+_0x466c52(0x130)]];window[_0x466c52(0x12e)+'teractions']=[],_0x427c5d[_0x466c52(0x350)](_0x321535=>_0x321535());}}},_0x3bad44=>{const _0x55fb96=_0xd2283a;console[_0x55fb96(0x26e)]('User\x20Snaps'+'hot\x20Error:',_0x3bad44);});else{if(_0x38a687[_0xd2283a(0x273)](_0x38a687['jHJVf'],_0xd2283a(0x110))){console[_0xd2283a(0x1b8)](_0x38a687[_0xd2283a(0xfd)]);const _0x4e7f2e=localStorage[_0xd2283a(0x2ab)](_0x38a687[_0xd2283a(0x1d8)]);if(_0x4e7f2e)try{const _0x1c228d=JSON[_0xd2283a(0x106)](_0x4e7f2e),_0x4cdcc4={};_0x4cdcc4[_0xd2283a(0x2c8)]=_0x1c228d['id'];const _0x46899e={};_0x46899e[_0xd2283a(0x126)]=_0x4cdcc4,_0x46899e['currentUse'+'r']=_0x1c228d,_0x38a687[_0xd2283a(0x299)](dispatchAuthReady,_0x46899e);return;}catch(_0x2f0637){localStorage[_0xd2283a(0x143)](_0x38a687[_0xd2283a(0x1d8)]);}const _0x2bcae2={};_0x2bcae2['user']=null,_0x2bcae2[_0xd2283a(0x2db)+'r']=null,_0x38a687['inaol'](dispatchAuthReady,_0x2bcae2);const _0x4dd1e1=localStorage[_0xd2283a(0x2ab)](_0x38a687['PMdlw']);if(_0x4dd1e1){console['log'](_0xd2283a(0x2ac)+_0xd2283a(0x1c4)+_0xd2283a(0x1eb)+'tate.\x20Proc'+_0xd2283a(0x306));return;}if(isUserDashboard){console['log'](_0x38a687['qnuBF']);const _0x50ef46=path['includes'](_0x38a687[_0xd2283a(0x330)])?'':_0x38a687[_0xd2283a(0x283)];window[_0xd2283a(0x2fa)][_0xd2283a(0x1a5)]=_0x38a687['YuxGb'](_0x50ef46,_0x38a687[_0xd2283a(0x36b)]);}}else _0x2aca50[_0xd2283a(0x18a)](_0x3bff48[_0xd2283a(0xfe)],_0x2aca50[_0xd2283a(0x214)])?_0x2aca50[_0xd2283a(0x10b)](_0x244ffc,_0xd2283a(0x33b)+_0xd2283a(0x2b9)+'xists\x20with'+'\x20the\x20same\x20'+_0xd2283a(0x201)+_0xd2283a(0x21f)+_0xd2283a(0x149)+_0xd2283a(0x127)+'entials.\x20S'+'ign\x20in\x20usi'+_0xd2283a(0x1e2)+'der\x20associ'+_0xd2283a(0x190)+_0xd2283a(0x154)+_0xd2283a(0x1d0)+_0xd2283a(0x288)+_0xd2283a(0x236)+_0xd2283a(0x2f3)+'.'):_0x48a7f4(_0x2aca50['CDzlO'](_0x2aca50['lsXpr'],_0x5cf52f[_0xd2283a(0x2fc)]));}}),_0x2bc158&&initAuthForms();}function initAuthForms(){const _0x1a97a4=_0xb315d1,_0x104cb7={'Ixcls':_0x1a97a4(0x213),'qhxWN':_0x1a97a4(0x272)+'-msg','EINMT':_0x1a97a4(0x359),'svwgC':_0x1a97a4(0x142),'gySjj':_0x1a97a4(0x189)+_0x1a97a4(0xfb),'ePYvZ':_0x1a97a4(0x31c)+_0x1a97a4(0x11e)+_0x1a97a4(0x183)+_0x1a97a4(0x25a)+_0x1a97a4(0x16a),'rGtxq':function(_0x315930,_0x316abe){return _0x315930+_0x316abe;},'qEcaL':_0x1a97a4(0x27a)+'l','cMwzS':_0x1a97a4(0x224)+_0x1a97a4(0x177)+':','qdBCH':function(_0x10d454,_0x80310d){return _0x10d454===_0x80310d;},'zumKe':_0x1a97a4(0x141)+_0x1a97a4(0x1bd),'LKGlT':function(_0x3f371b,_0x2e57ad){return _0x3f371b(_0x2e57ad);},'rSmKK':_0x1a97a4(0x1fa)+_0x1a97a4(0x343)+_0x1a97a4(0x29e)+'il\x20address'+'.','BhYAx':_0x1a97a4(0x2a7)+_0x1a97a4(0x291)+_0x1a97a4(0x1fb)+'ease\x20make\x20'+_0x1a97a4(0x17b)+_0x1a97a4(0x31b)+_0x1a97a4(0x355),'PziYY':_0x1a97a4(0x2b7)+_0x1a97a4(0x1d5)+'o\x20not\x20have'+_0x1a97a4(0x1d6)+_0x1a97a4(0x21e),'BQpDt':_0x1a97a4(0x1cb)+'l','IafDc':_0x1a97a4(0x370)+_0x1a97a4(0x1e8),'tpoOw':_0x1a97a4(0x1aa),'FHADF':_0x1a97a4(0x12d)+'...','YfaHk':function(_0x487061,_0xd0f7f4){return _0x487061!==_0xd0f7f4;},'zOAHm':_0x1a97a4(0x21c),'XQyft':function(_0x4cdee8,_0x3f0cbe,_0x4fbb4f,_0x1721b9){return _0x4cdee8(_0x3f0cbe,_0x4fbb4f,_0x1721b9);},'xxGUY':function(_0x4feaf5,_0x3c7bfd){return _0x4feaf5===_0x3c7bfd;},'OdeyZ':_0x1a97a4(0x137),'JGtYH':function(_0x39f947,_0x13c9fa,_0x2bca31,_0xb06990){return _0x39f947(_0x13c9fa,_0x2bca31,_0xb06990);},'wINCj':_0x1a97a4(0x196),'yrmcX':'login','NhFjD':'Email','RLYiZ':_0x1a97a4(0x313)+_0x1a97a4(0x198)+_0x1a97a4(0x335),'ImxQd':'auth/wrong'+_0x1a97a4(0x2ae),'nLoWv':function(_0xf8b242,_0x45c6a7){return _0xf8b242===_0x45c6a7;},'LStLZ':_0x1a97a4(0x197),'ZCWAF':_0x1a97a4(0x225),'YnTJr':function(_0x46a3f3,_0x5c71ff,_0x4ebe3d){return _0x46a3f3(_0x5c71ff,_0x4ebe3d);},'wsPaA':_0x1a97a4(0x29d),'GGgke':'VRypG','IeDzu':_0x1a97a4(0x374),'przLT':function(_0x2ae4df,_0x1e5994,_0x4b3d9a){return _0x2ae4df(_0x1e5994,_0x4b3d9a);},'rcZHS':function(_0x5018c9,_0x502022,_0x3a782e){return _0x5018c9(_0x502022,_0x3a782e);},'VoPSs':function(_0x44b4f9,_0x349ba1){return _0x44b4f9===_0x349ba1;},'Cbcdi':_0x1a97a4(0x103),'CjQFz':_0x1a97a4(0x107),'sWZpu':'Password\x20m'+_0x1a97a4(0x308)+'least\x206\x20ch'+_0x1a97a4(0x123),'DWCyY':function(_0x2de6a3,_0x3ce46b){return _0x2de6a3===_0x3ce46b;},'xhnEc':_0x1a97a4(0x1be),'UGACj':function(_0x363683,_0x516bf5){return _0x363683(_0x516bf5);},'uVwGZ':_0x1a97a4(0x216)+_0x1a97a4(0x192)+_0x1a97a4(0x14a)+_0x1a97a4(0x1a1)+_0x1a97a4(0x14c)+_0x1a97a4(0x25c)+_0x1a97a4(0x356),'jkgWS':function(_0x4dcce6,_0x18fc67){return _0x4dcce6(_0x18fc67);},'kOLHz':_0x1a97a4(0x216)+_0x1a97a4(0x2f4)+_0x1a97a4(0x29b)+_0x1a97a4(0x256)+'again.','thgVj':function(_0xbf98c6,_0x48e329){return _0xbf98c6!==_0x48e329;},'DKcuI':_0x1a97a4(0x368),'VFUws':_0x1a97a4(0x2aa)+'ed:\x20','wqySa':function(_0xf39d7d,_0x42bc85){return _0xf39d7d(_0x42bc85);},'RLxec':'Signup\x20Fai'+'led:\x20','zRVvq':_0x1a97a4(0xeb),'aNFpI':_0x1a97a4(0x1b1)+'d','avpWK':'signup-nam'+'e','YpcAP':_0x1a97a4(0x14e)+'il','DCXVr':'signup-pas'+_0x1a97a4(0x1d1),'lOrtA':'Creating\x20A'+_0x1a97a4(0x173),'GYCdY':_0x1a97a4(0x2ad),'QpMed':function(_0x2ff87a,_0x1e8058,_0x54f76d,_0x50da1a){return _0x2ff87a(_0x1e8058,_0x54f76d,_0x50da1a);},'RjXjb':_0x1a97a4(0x2c5),'xADHf':_0x1a97a4(0xf4),'kqmiP':_0x1a97a4(0x189)+_0x1a97a4(0x16e),'xXtIu':_0x1a97a4(0x31c)+_0x1a97a4(0x364)+'ccessfully'+_0x1a97a4(0x242)+_0x1a97a4(0x345),'epuZd':function(_0x55dc67,_0x176228){return _0x55dc67===_0x176228;},'ZpqsC':function(_0x349360,_0x13fbb8){return _0x349360(_0x13fbb8);},'OQycz':'An\x20account'+_0x1a97a4(0x2b9)+_0x1a97a4(0x1f4)+_0x1a97a4(0x138)+_0x1a97a4(0x16f)+'log\x20in.','iOiYt':function(_0x10820c,_0x447d33){return _0x10820c&&_0x447d33;},'VcvXF':_0x1a97a4(0x20d),'giEJC':_0x1a97a4(0x10d),'Mjuof':function(_0x1a4f31,_0x51243e){return _0x1a4f31(_0x51243e);},'iVZwn':function(_0x3a47b8,_0x208db2){return _0x3a47b8+_0x208db2;},'FMTLu':_0x1a97a4(0x249)+_0x1a97a4(0xee)+_0x1a97a4(0x146),'mWcuw':_0x1a97a4(0x181)+_0x1a97a4(0x2ed)+_0x1a97a4(0x1a7)+_0x1a97a4(0x1ca)+'ntial','XDQjN':_0x1a97a4(0x33b)+_0x1a97a4(0x2b9)+_0x1a97a4(0x1f4)+_0x1a97a4(0x116)+_0x1a97a4(0x201)+_0x1a97a4(0x21f)+_0x1a97a4(0x149)+_0x1a97a4(0x127)+_0x1a97a4(0x1c5)+'ign\x20in\x20usi'+_0x1a97a4(0x1e2)+_0x1a97a4(0x10c)+_0x1a97a4(0x190)+_0x1a97a4(0x154)+_0x1a97a4(0x1d0)+_0x1a97a4(0x288)+_0x1a97a4(0x236)+'/Password)'+'.','whjrM':function(_0x231d49,_0x3e4111){return _0x231d49(_0x3e4111);},'eqBVX':function(_0x34a19f,_0x3e2e34){return _0x34a19f===_0x3e2e34;},'dRoSo':_0x1a97a4(0xe7),'jrSZa':_0x1a97a4(0x222)+_0x1a97a4(0x276),'AIdIu':_0x1a97a4(0x2ee)+_0x1a97a4(0x28a)+_0x1a97a4(0x372)+_0x1a97a4(0x2c6),'crqcf':_0x1a97a4(0x33a),'Fkwvn':_0x1a97a4(0x271),'CleXf':function(_0x1935ed,_0x129fa9){return _0x1935ed(_0x129fa9);},'lshbX':function(_0x45f2a7,_0x3aee76){return _0x45f2a7(_0x3aee76);},'lrKEz':function(_0x32f54d,_0x434ba1){return _0x32f54d+_0x434ba1;},'OeQSv':_0x1a97a4(0x250)+_0x1a97a4(0x331)+'\x20','hyiGx':_0x1a97a4(0x300)+_0x1a97a4(0x112),'JNGCE':_0x1a97a4(0x12f)+_0x1a97a4(0x128)+'91,36,0.5)','qGHoU':_0x1a97a4(0x153)+_0x1a97a4(0x248)+'1,36,0.2)','zNMtj':function(_0xe22949,_0x1b50f0){return _0xe22949!==_0x1b50f0;},'xhXhl':'EoRdQ','MoPRl':_0x1a97a4(0x161)+_0x1a97a4(0x221)+':','CVtng':function(_0x4b3c4b,_0x3a23dc){return _0x4b3c4b===_0x3a23dc;},'xoIdL':_0x1a97a4(0x125),'VwIMx':_0x1a97a4(0x365)+_0x1a97a4(0x1c9)+_0x1a97a4(0x151)+_0x1a97a4(0x34f)+_0x1a97a4(0x1d2),'oGJJm':_0x1a97a4(0x296),'VyUci':_0x1a97a4(0x16c)+_0x1a97a4(0x1c8)+'ked','YCAJA':'❌\x20GitHub\x20L'+_0x1a97a4(0x221)+':','VcxxH':function(_0x18b265,_0x1deb0c){return _0x18b265!==_0x1deb0c;},'dgOMN':_0x1a97a4(0x2c4),'lfhYk':_0x1a97a4(0x1dc),'DcBof':function(_0x1e4591,_0x199abe){return _0x1e4591(_0x199abe);},'HlMbb':function(_0x3fd951,_0x2776e2){return _0x3fd951!==_0x2776e2;},'XiNfS':'uQTIN','PzEYN':_0x1a97a4(0x203),'vQeog':function(_0x4e2fd9,_0x21dfb0){return _0x4e2fd9(_0x21dfb0);},'mDzlL':'signup-for'+'m','nOARG':_0x1a97a4(0x23e)+'in','bkOuh':_0x1a97a4(0x157)+'in'},_0x338c90=document[_0x1a97a4(0x194)+'ById']('login-form');_0x338c90&&(_0x104cb7[_0x1a97a4(0x100)](_0x1a97a4(0x171),_0x1a97a4(0x215))?_0x338c90[_0x1a97a4(0xfa)]=async _0x17cf38=>{const _0x201eb5=_0x1a97a4,_0x522ecc={'lkYMn':_0x104cb7['PziYY'],'QtmaB':_0x201eb5(0x142),'oTGNE':function(_0x1300b5){return _0x1300b5();},'Vlsut':function(_0xfbcbe9,_0x1be0b8){return _0x104cb7['LKGlT'](_0xfbcbe9,_0x1be0b8);}};_0x17cf38[_0x201eb5(0x131)+_0x201eb5(0x2bd)]();const _0x3c7774=document['getElement'+_0x201eb5(0x348)](_0x104cb7['BQpDt'])['value'][_0x201eb5(0x219)](),_0x4aa00c=document[_0x201eb5(0x194)+_0x201eb5(0x348)](_0x104cb7['IafDc'])['value'],_0x3ed893=_0x338c90[_0x201eb5(0x23a)+_0x201eb5(0x30d)](_0x104cb7[_0x201eb5(0x2b4)]),_0x4f3c7d=_0x3ed893?_0x3ed893[_0x201eb5(0x208)]:'';if(_0x3ed893)_0x3ed893['innerHTML']=_0x104cb7[_0x201eb5(0x15b)];try{if(_0x104cb7[_0x201eb5(0x1bb)](_0x104cb7['zOAHm'],_0x104cb7[_0x201eb5(0x205)])){_0x2f1d70['classList']['add'](_0x104cb7['Ixcls']),_0x1c14ce[_0x201eb5(0x2a1)]['remove'](_0x104cb7[_0x201eb5(0x2f8)]);const _0x373631=_0x4932fd[_0x201eb5(0x194)+_0x201eb5(0x348)](_0x104cb7[_0x201eb5(0x1ec)]);if(_0x373631){const _0x9635e9=_0x201eb5(0x2af)[_0x201eb5(0x22a)]('|');let _0x5a8c76=-0x4*-0x4d2+0x1b57+-0x2e9f;while(!![]){switch(_0x9635e9[_0x5a8c76++]){case'0':_0x373631[_0x201eb5(0x294)][_0x201eb5(0x278)]=_0x201eb5(0x189)+_0x201eb5(0x16e);continue;case'1':_0x373631['style'][_0x201eb5(0x1dd)]=_0x104cb7['EINMT'];continue;case'2':_0x373631[_0x201eb5(0x294)][_0x201eb5(0x25d)]=_0x104cb7[_0x201eb5(0x145)];continue;case'3':_0x373631['style']['borderColo'+'r']=_0x104cb7[_0x201eb5(0x336)];continue;case'4':_0x373631[_0x201eb5(0x247)]=_0x104cb7[_0x201eb5(0x337)];continue;}break;}}}else{await _0x104cb7[_0x201eb5(0x34e)](signInWithEmailAndPassword,auth,_0x3c7774,_0x4aa00c);if(_0x104cb7['xxGUY'](typeof gtag,_0x104cb7[_0x201eb5(0x363)]))_0x104cb7[_0x201eb5(0x2ff)](gtag,_0x104cb7[_0x201eb5(0x166)],_0x104cb7['yrmcX'],{'method':_0x104cb7[_0x201eb5(0x121)]});}}catch(_0x1d98a3){if(_0x3ed893)_0x3ed893[_0x201eb5(0x208)]=_0x4f3c7d;if(_0x104cb7['qdBCH'](_0x1d98a3['code'],_0x104cb7[_0x201eb5(0x105)])||_0x1d98a3[_0x201eb5(0xfe)]===_0x104cb7[_0x201eb5(0x1e5)]||_0x104cb7[_0x201eb5(0x255)](_0x1d98a3['code'],_0x201eb5(0x141)+_0x201eb5(0x1bd))){try{if(_0x104cb7[_0x201eb5(0x1bb)](_0x104cb7[_0x201eb5(0x31a)],_0x104cb7[_0x201eb5(0x32d)])){const _0x33bede=await _0x104cb7[_0x201eb5(0x340)](fetchSignInMethodsForEmail,auth,_0x3c7774);if(_0x33bede['includes'](_0x201eb5(0x122))&&!_0x33bede[_0x201eb5(0x20b)](_0x104cb7['wsPaA'])){if(_0x104cb7['YfaHk'](_0x104cb7[_0x201eb5(0x22b)],_0x104cb7[_0x201eb5(0xef)])){const _0x10a933=await _0x104cb7[_0x201eb5(0x2b2)](signInWithPopup,auth,provider),_0x5113f2=EmailAuthProvider['credential'](_0x3c7774,_0x4aa00c);await _0x104cb7['rcZHS'](linkWithCredential,_0x10a933['user'],_0x5113f2);if(typeof gtag===_0x201eb5(0x137))gtag('event',_0x104cb7[_0x201eb5(0x254)],{'method':_0x104cb7['NhFjD']});return;}else{const _0x1bbee5={};_0x1bbee5[_0x201eb5(0x373)]=_0x201eb5(0x19a)+_0x201eb5(0x293)+'16\x22\x20height'+_0x201eb5(0xff)+'Box=\x220\x200\x202'+_0x201eb5(0x2f5)+_0x201eb5(0x315)+_0x201eb5(0x1b6)+_0x201eb5(0x1a9)+_0x201eb5(0x319)+'th=\x222\x22\x20str'+_0x201eb5(0x2cf)+_0x201eb5(0x129)+'stroke-lin'+_0x201eb5(0x2d8)+_0x201eb5(0x1da)+'\x22margin-le'+'ft:\x204px;\x22>'+_0x201eb5(0x26b)+_0x201eb5(0x11b)+_0x201eb5(0x2ca)+'\x22/></svg>';const _0x26fc74=_0x1bbee5;_0x7fa0f6[_0x201eb5(0x247)]=jBoYFp[_0x201eb5(0x339)],_0x306660[_0x201eb5(0x294)][_0x201eb5(0x25d)]=jBoYFp['QtmaB'],_0x3c8dca[_0x201eb5(0x23a)+'torAll'](_0x201eb5(0x1aa))['forEach'](_0xb9b3f=>{const _0x25aaad=_0x201eb5;_0xb9b3f[_0x25aaad(0x208)]=_0x26fc74[_0x25aaad(0x373)];});}}}else _0x3ca84e['location'][_0x201eb5(0x1a5)]=_0x104cb7[_0x201eb5(0x1c0)](_0x574a28['substring'](-0x1dff+-0x4*-0x1e4+0x166f,_0xe96f48),_0x104cb7['qEcaL']);}catch(_0x141aa2){_0x141aa2[_0x201eb5(0xfe)]==='auth/weak-'+_0x201eb5(0x29d)?_0x104cb7[_0x201eb5(0x1bf)](_0x104cb7[_0x201eb5(0x257)],_0x104cb7[_0x201eb5(0x1cf)])?(jBoYFp[_0x201eb5(0x2e6)](_0x11a361),_0x49c6af=null):alert(_0x104cb7[_0x201eb5(0xec)]):_0x104cb7[_0x201eb5(0x1f3)](_0x201eb5(0x235),_0x104cb7[_0x201eb5(0x26d)])?(_0x487408['error'](_0x104cb7[_0x201eb5(0x243)],_0x3eb788),_0x104cb7[_0x201eb5(0x2b1)](_0x3295dc[_0x201eb5(0xfe)],_0x104cb7[_0x201eb5(0x147)])?_0x104cb7[_0x201eb5(0x1a4)](_0x825ff8,_0x104cb7[_0x201eb5(0x14d)]):_0x104cb7[_0x201eb5(0x1a4)](_0x8b4bc7,_0x104cb7[_0x201eb5(0xfc)])):_0x104cb7['UGACj'](alert,_0x104cb7[_0x201eb5(0x1c2)]);return;}_0x104cb7[_0x201eb5(0x14b)](alert,_0x104cb7['kOLHz']);}else{if(_0x104cb7[_0x201eb5(0x100)](_0x104cb7['DKcuI'],_0x104cb7[_0x201eb5(0x22d)])){const _0x540a7e=_0x44bd3d[_0x201eb5(0x106)](_0x48c872),_0x4c0c1a={};_0x4c0c1a[_0x201eb5(0x2c8)]=_0x540a7e['id'];const _0x2cd7cd={};_0x2cd7cd[_0x201eb5(0x126)]=_0x4c0c1a,_0x2cd7cd[_0x201eb5(0x2db)+'r']=_0x540a7e,jBoYFp[_0x201eb5(0x33f)](_0x2101ed,_0x2cd7cd);return;}else _0x104cb7[_0x201eb5(0x14b)](alert,_0x104cb7[_0x201eb5(0x231)]+_0x1d98a3[_0x201eb5(0x2fc)]);}}}:_0x104cb7['wqySa'](_0x2cfbf8,_0x104cb7['rGtxq'](_0x104cb7[_0x1a97a4(0x211)],_0x3aa1ca['message'])));const _0x3964bb=document[_0x1a97a4(0x194)+'ById'](_0x104cb7[_0x1a97a4(0x28e)]);_0x3964bb&&(_0x3964bb['onsubmit']=async _0x77f635=>{const _0x31e473=_0x1a97a4,_0x1f195d={};_0x1f195d[_0x31e473(0x11f)]=_0x104cb7[_0x31e473(0x2ec)],_0x1f195d[_0x31e473(0x2d2)]=_0x104cb7[_0x31e473(0x360)],_0x1f195d['wbRyc']=function(_0x234d75,_0x1c558d){return _0x234d75&&_0x1c558d;},_0x1f195d[_0x31e473(0x246)]=_0x31e473(0x213),_0x1f195d[_0x31e473(0x2e8)]='✅\x20Account\x20'+_0x31e473(0x11e)+'nter\x20your\x20'+'password\x20t'+_0x31e473(0x16a),_0x1f195d[_0x31e473(0x289)]=_0x104cb7['EINMT'],_0x1f195d[_0x31e473(0x27b)]=_0x31e473(0x189)+_0x31e473(0x16e),_0x1f195d[_0x31e473(0x227)]=_0x104cb7[_0x31e473(0x336)];const _0x2aa205=_0x1f195d;_0x77f635[_0x31e473(0x131)+_0x31e473(0x2bd)]();const _0x45332e=document['getElement'+_0x31e473(0x348)](_0x104cb7['avpWK'])?.[_0x31e473(0x34b)]?.[_0x31e473(0x219)](),_0x48062f=document[_0x31e473(0x194)+_0x31e473(0x348)](_0x104cb7['YpcAP'])[_0x31e473(0x34b)][_0x31e473(0x219)](),_0x488e93=document[_0x31e473(0x194)+'ById'](_0x104cb7[_0x31e473(0x102)])[_0x31e473(0x34b)],_0x13570a=_0x3964bb['querySelec'+'tor'](_0x104cb7[_0x31e473(0x2b4)]),_0x58d856=_0x13570a?_0x13570a[_0x31e473(0x208)]:'';if(_0x13570a)_0x13570a[_0x31e473(0x208)]=_0x104cb7[_0x31e473(0x2e0)];try{const _0x55cbcb=await _0x104cb7['XQyft'](createUserWithEmailAndPassword,auth,_0x48062f,_0x488e93);await signOut(auth);if(window[_0x31e473(0x2b0)+'es']?.[_0x31e473(0x33d)+'p'])window[_0x31e473(0x2b0)+'es']['trackSignU'+'p'](_0x104cb7['GYCdY']);if(typeof gtag===_0x104cb7['OdeyZ'])_0x104cb7[_0x31e473(0x163)](gtag,_0x31e473(0x196),_0x104cb7[_0x31e473(0x1de)],{'method':_0x104cb7[_0x31e473(0x121)]});const _0x29d282=document[_0x31e473(0x194)+_0x31e473(0x348)](_0x104cb7[_0x31e473(0x1ec)]);if(_0x29d282){const _0x1cc655=_0x104cb7[_0x31e473(0x263)][_0x31e473(0x22a)]('|');let _0x212d4b=-0x1779+-0x107e+0x313*0xd;while(!![]){switch(_0x1cc655[_0x212d4b++]){case'0':_0x29d282[_0x31e473(0x294)]['color']=_0x104cb7[_0x31e473(0x19f)];continue;case'1':_0x29d282['style'][_0x31e473(0x25d)]=_0x104cb7[_0x31e473(0x145)];continue;case'2':_0x29d282[_0x31e473(0x294)][_0x31e473(0x259)+'r']=_0x31e473(0x189)+'2,128,0.3)';continue;case'3':_0x29d282[_0x31e473(0x294)][_0x31e473(0x278)]=_0x104cb7['kqmiP'];continue;case'4':_0x29d282[_0x31e473(0x247)]=_0x104cb7['xXtIu'];continue;}break;}}const _0x3a30e6=document[_0x31e473(0x194)+_0x31e473(0x348)](_0x104cb7['BQpDt']);if(_0x3a30e6)_0x3a30e6['value']=_0x48062f;_0x104cb7['rcZHS'](setTimeout,()=>{const _0x5732c3=_0x31e473,_0xa58b85=document[_0x5732c3(0x194)+'ById'](_0x2aa205[_0x5732c3(0x11f)]),_0x264396=document[_0x5732c3(0x194)+'ById'](_0x2aa205[_0x5732c3(0x2d2)]);if(_0x2aa205[_0x5732c3(0x1e1)](_0xa58b85,_0x264396)){_0x264396[_0x5732c3(0x2a1)][_0x5732c3(0x168)](_0x2aa205[_0x5732c3(0x246)]),_0xa58b85['classList']['remove'](_0x2aa205[_0x5732c3(0x246)]);const _0x221841=document[_0x5732c3(0x194)+_0x5732c3(0x348)](_0x5732c3(0x272)+_0x5732c3(0x13f));_0x221841&&(_0x221841[_0x5732c3(0x247)]=_0x2aa205[_0x5732c3(0x2e8)],_0x221841[_0x5732c3(0x294)]['display']=_0x5732c3(0x142),_0x221841[_0x5732c3(0x294)][_0x5732c3(0x1dd)]=_0x2aa205[_0x5732c3(0x289)],_0x221841['style'][_0x5732c3(0x278)]=_0x2aa205[_0x5732c3(0x27b)],_0x221841[_0x5732c3(0x294)][_0x5732c3(0x259)+'r']=_0x2aa205[_0x5732c3(0x227)]);}if(_0x13570a)_0x13570a['innerHTML']=_0x58d856;},-0x7bd*-0x2+0x17e3+-0x3*0xb2b);}catch(_0x361932){if(_0x13570a)_0x13570a[_0x31e473(0x208)]=_0x58d856;if(_0x104cb7['epuZd'](_0x361932[_0x31e473(0xfe)],_0x31e473(0x2a6)+_0x31e473(0x180)+_0x31e473(0x30a))){_0x104cb7[_0x31e473(0x2e4)](alert,_0x104cb7[_0x31e473(0x2fe)]);const _0x211fb1=document[_0x31e473(0x194)+_0x31e473(0x348)](_0x104cb7['zRVvq']),_0xcc7193=document[_0x31e473(0x194)+_0x31e473(0x348)]('signup-car'+'d'),_0x4bd13d=document[_0x31e473(0x194)+_0x31e473(0x348)](_0x104cb7['BQpDt']);_0x104cb7[_0x31e473(0x1af)](_0x211fb1,_0xcc7193)&&(_0x104cb7[_0x31e473(0xf3)]===_0x104cb7[_0x31e473(0x2ce)]?_0x49cde9['innerHTML']=_0x31e473(0x185)+_0x3e041c[_0x31e473(0x31e)]+(_0x31e473(0x32a)+_0x31e473(0x320)+_0x31e473(0x19e)+_0x31e473(0x109)+_0x31e473(0x25b)+_0x31e473(0x31d)+_0x31e473(0x17d)+_0x31e473(0x1ff)+_0x31e473(0x357)+_0x31e473(0x1f2)+_0x31e473(0x2d1)+_0x31e473(0x2a2)+'lement.inn'+_0x31e473(0x352))+(_0x559056[_0x31e473(0x117)]||'U')[_0x31e473(0x286)](0x1541+-0xc*-0x1d3+-0x1*0x2b25)+_0x31e473(0x303):(_0xcc7193[_0x31e473(0x2a1)][_0x31e473(0x168)](_0x104cb7[_0x31e473(0x2f8)]),_0x211fb1[_0x31e473(0x2a1)][_0x31e473(0x33c)](_0x31e473(0x213))));if(_0x4bd13d)_0x4bd13d[_0x31e473(0x34b)]=_0x48062f;}else _0x361932[_0x31e473(0xfe)]==='auth/weak-'+_0x31e473(0x29d)?_0x104cb7[_0x31e473(0x2e4)](alert,_0x104cb7['sWZpu']):_0x104cb7['Mjuof'](alert,_0x104cb7[_0x31e473(0x1a6)](_0x104cb7[_0x31e473(0x211)],_0x361932[_0x31e473(0x2fc)]));}});const _0x23a37f=document[_0x1a97a4(0x194)+_0x1a97a4(0x348)](_0x104cb7[_0x1a97a4(0x2a3)]);_0x23a37f&&(window[_0x1a97a4(0x322)+'n']=async()=>{const _0x5ad2ca=_0x1a97a4;if(_0x104cb7[_0x5ad2ca(0x101)](_0x104cb7['dRoSo'],_0x5ad2ca(0xe7)))try{const _0x219154=await _0x104cb7['przLT'](signInWithPopup,auth,provider);}catch(_0x5b9887){console[_0x5ad2ca(0x26e)](_0x104cb7['jrSZa'],_0x5b9887);throw _0x5b9887;}else _0x469e4f[_0x5ad2ca(0x26e)](_0x5ad2ca(0x1a0)+_0x5ad2ca(0x221)+':',_0x8a3e50),_0x5137e0[_0x5ad2ca(0x208)]=_0x70d537,_0x1d2c54[_0x5ad2ca(0x294)][_0x5ad2ca(0x264)]=_0x4e6891,_0xd2f08f[_0x5ad2ca(0xfe)]!==_0x104cb7['FMTLu']&&(_0x104cb7[_0x5ad2ca(0x2d7)](_0x3ce50f[_0x5ad2ca(0xfe)],_0x104cb7['mWcuw'])?_0x104cb7[_0x5ad2ca(0x1a4)](_0x3bc546,_0x104cb7['XDQjN']):_0x104cb7[_0x5ad2ca(0x251)](_0x301acd,_0x104cb7[_0x5ad2ca(0x1a6)](_0x5ad2ca(0x250)+_0x5ad2ca(0x331)+'\x20',_0x2a6758[_0x5ad2ca(0x2fc)])));},window[_0x1a97a4(0x29a)+'swordReset']=async _0x5af1e1=>{const _0x12a54f=_0x1a97a4,_0x161a37={};_0x161a37[_0x12a54f(0x17e)]=_0x104cb7[_0x12a54f(0x2e5)];const _0x2b7557=_0x161a37;try{_0x104cb7[_0x12a54f(0x2b8)]===_0x104cb7[_0x12a54f(0x34c)]?(_0x1c907c[_0x12a54f(0xf2)]=_0x12a54f(0x1b5),_0x4cb9b6[_0x12a54f(0x1b8)](ekzBHu[_0x12a54f(0x17e)])):(await sendPasswordResetEmail(auth,_0x5af1e1),_0x104cb7[_0x12a54f(0x369)](alert,'Password\x20r'+'eset\x20link\x20'+'sent\x20to\x20'+_0x5af1e1+(_0x12a54f(0x217)+_0x12a54f(0x2f7)+_0x12a54f(0x287))));}catch(_0xd5c589){console['error'](_0x104cb7[_0x12a54f(0x243)],_0xd5c589),_0x104cb7['eqBVX'](_0xd5c589[_0x12a54f(0xfe)],_0x104cb7['zumKe'])?_0x104cb7['lshbX'](alert,_0x12a54f(0x1fa)+_0x12a54f(0x343)+_0x12a54f(0x29e)+_0x12a54f(0x2eb)+'.'):_0x104cb7[_0x12a54f(0x270)](alert,_0x104cb7[_0x12a54f(0xfc)]);}},_0x23a37f[_0x1a97a4(0x220)]=async()=>{const _0x54675f=_0x1a97a4,_0x13b6b0={};_0x13b6b0[_0x54675f(0x184)]=_0x104cb7['hyiGx'];const _0x15ce26=_0x13b6b0,_0x2bf97d=_0x23a37f[_0x54675f(0x208)],_0x2a62f7=_0x23a37f[_0x54675f(0x294)]['cssText'];try{const _0x535bd5=_0x54675f(0x115)[_0x54675f(0x22a)]('|');let _0x1176ad=-0xc*0x256+0x1ec9+0xf*-0x2f;while(!![]){switch(_0x535bd5[_0x1176ad++]){case'0':_0x23a37f['style'][_0x54675f(0x321)]=_0x104cb7[_0x54675f(0x175)];continue;case'1':_0x23a37f[_0x54675f(0x294)]['boxShadow']=_0x104cb7[_0x54675f(0x261)];continue;case'2':_0x23a37f['innerHTML']=_0x54675f(0x281)+_0x54675f(0x18d)+_0x54675f(0x20c)+_0x54675f(0xf8)+_0x54675f(0x111)+_0x54675f(0x136)+_0x54675f(0x13a)+_0x54675f(0x2dd)+_0x54675f(0x23c)+_0x54675f(0x36e)+_0x54675f(0x245)+_0x54675f(0x18d)+_0x54675f(0x18d)+_0x54675f(0x362)+_0x54675f(0x32b)+_0x54675f(0x25f)+_0x54675f(0x1cc)+_0x54675f(0x2b6)+_0x54675f(0x139)+_0x54675f(0x114)+'ze:\x201.2rem'+';\x22></i>\x0a\x20\x20'+'\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20'+_0x54675f(0x18d)+_0x54675f(0x302)+'yle=\x22backg'+_0x54675f(0x1ef)+_0x54675f(0x15c)+_0x54675f(0x26c)+_0x54675f(0x325)+_0x54675f(0x22c)+_0x54675f(0x297)+_0x54675f(0x11d)+_0x54675f(0x27f)+_0x54675f(0x307)+_0x54675f(0x234)+_0x54675f(0x120)+_0x54675f(0x1b7)+_0x54675f(0x2d0)+_0x54675f(0x35b)+'ter-spacin'+_0x54675f(0x10e)+_0x54675f(0x2b3)+_0x54675f(0x2c3)+_0x54675f(0x36c)+'\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20'+_0x54675f(0x2ea)+'\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20'+_0x54675f(0x11a);continue;case'3':await signInWithPopup(auth,provider);continue;case'4':console[_0x54675f(0x1b8)](_0x54675f(0x118)+_0x54675f(0x1c8)+_0x54675f(0xf6));continue;}break;}}catch(_0x3c6cc8){_0x104cb7[_0x54675f(0x361)]('EoRdQ',_0x104cb7[_0x54675f(0x17c)])?(_0x3fdc3d['warn'](_0x54675f(0x1d4)+_0x54675f(0x1f6)),_0x3fcdd4[_0x54675f(0x143)](xaBRMo[_0x54675f(0x184)])):(console[_0x54675f(0x26e)](_0x104cb7[_0x54675f(0x1c3)],_0x3c6cc8),_0x23a37f['innerHTML']=_0x2bf97d,_0x23a37f[_0x54675f(0x294)]['cssText']=_0x2a62f7,_0x104cb7['zNMtj'](_0x3c6cc8[_0x54675f(0xfe)],_0x104cb7[_0x54675f(0x16d)])&&(_0x104cb7['CVtng'](_0x104cb7[_0x54675f(0x2fb)],_0x54675f(0x125))?_0x104cb7[_0x54675f(0x14b)](alert,_0x54675f(0x2a5)+_0x54675f(0x331)+'\x20'+_0x3c6cc8['message']):_0x3a621a(_0x104cb7['lrKEz'](_0x104cb7[_0x54675f(0x16b)],_0x1b155e['message']))));}});const _0x5937f6=document['getElement'+_0x1a97a4(0x348)](_0x104cb7['bkOuh']);_0x5937f6&&(_0x5937f6[_0x1a97a4(0x220)]=async()=>{const _0x4a97d2=_0x1a97a4,_0x32f3f7={'GspyO':_0x104cb7[_0x4a97d2(0x19d)],'SmZRb':function(_0x3e0c98,_0x144583){const _0x458449=_0x4a97d2;return _0x104cb7[_0x458449(0x176)](_0x3e0c98,_0x144583);},'yjKJU':_0x4a97d2(0x1d4)+_0x4a97d2(0x1f6),'xWjPk':_0x104cb7[_0x4a97d2(0x2a4)]},_0x2185ef=_0x5937f6[_0x4a97d2(0x208)],_0x5e0b45=_0x5937f6[_0x4a97d2(0x294)]['cssText'];try{const _0x348a7d=_0x104cb7[_0x4a97d2(0x244)][_0x4a97d2(0x22a)]('|');let _0x3cdaf8=0x78d*-0x1+0x91*0x28+-0x1*0xf1b;while(!![]){switch(_0x348a7d[_0x3cdaf8++]){case'0':_0x5937f6[_0x4a97d2(0x294)]['boxShadow']=_0x104cb7[_0x4a97d2(0x261)];continue;case'1':_0x5937f6[_0x4a97d2(0x208)]=_0x4a97d2(0x281)+_0x4a97d2(0x18d)+'\x20<div\x20styl'+_0x4a97d2(0xf8)+':\x20flex;\x20al'+'ign-items:'+_0x4a97d2(0x13a)+_0x4a97d2(0x2dd)+'tent:\x20cent'+'er;\x20gap:\x201'+'0px;\x22>\x0a\x20\x20\x20'+_0x4a97d2(0x18d)+_0x4a97d2(0x18d)+_0x4a97d2(0x362)+_0x4a97d2(0x32b)+_0x4a97d2(0x25f)+_0x4a97d2(0x1cc)+'style=\x22col'+_0x4a97d2(0x139)+_0x4a97d2(0x114)+_0x4a97d2(0x22f)+_0x4a97d2(0x342)+_0x4a97d2(0x18d)+_0x4a97d2(0x18d)+'\x20\x20<span\x20st'+'yle=\x22backg'+'round:\x20lin'+'ear-gradie'+'nt(135deg,'+_0x4a97d2(0x325)+_0x4a97d2(0x22c)+'-webkit-ba'+_0x4a97d2(0x11d)+_0x4a97d2(0x27f)+'\x20-webkit-t'+_0x4a97d2(0x234)+_0x4a97d2(0x120)+_0x4a97d2(0x1b7)+'ont-weight'+_0x4a97d2(0x35b)+'ter-spacin'+_0x4a97d2(0x10e)+_0x4a97d2(0x2b3)+_0x4a97d2(0x2c3)+'>\x0a\x20\x20\x20\x20\x20\x20\x20\x20'+_0x4a97d2(0x18d)+_0x4a97d2(0x2ea)+_0x4a97d2(0x18d)+'\x20\x20\x20\x20\x20';continue;case'2':_0x5937f6['style'][_0x4a97d2(0x321)]=_0x104cb7['JNGCE'];continue;case'3':console['log'](_0x104cb7['VyUci']);continue;case'4':await _0x104cb7['rcZHS'](signInWithPopup,auth,githubProvider);continue;}break;}}catch(_0x42c0a8){console[_0x4a97d2(0x26e)](_0x104cb7[_0x4a97d2(0x18c)],_0x42c0a8),_0x5937f6[_0x4a97d2(0x208)]=_0x2185ef,_0x5937f6[_0x4a97d2(0x294)][_0x4a97d2(0x264)]=_0x5e0b45;if(_0x42c0a8[_0x4a97d2(0xfe)]!==_0x4a97d2(0x249)+_0x4a97d2(0xee)+'-user'){if(_0x104cb7[_0x4a97d2(0x2cd)](_0x104cb7[_0x4a97d2(0x358)],_0x104cb7[_0x4a97d2(0x11c)]))_0x104cb7[_0x4a97d2(0x32f)](_0x42c0a8['code'],_0x4a97d2(0x181)+'nt-exists-'+_0x4a97d2(0x1a7)+_0x4a97d2(0x1ca)+_0x4a97d2(0x30f))?_0x104cb7[_0x4a97d2(0x1c7)](alert,_0x4a97d2(0x33b)+_0x4a97d2(0x2b9)+_0x4a97d2(0x1f4)+'\x20the\x20same\x20'+'email\x20addr'+_0x4a97d2(0x21f)+_0x4a97d2(0x149)+_0x4a97d2(0x127)+_0x4a97d2(0x1c5)+'ign\x20in\x20usi'+_0x4a97d2(0x1e2)+_0x4a97d2(0x10c)+'ated\x20with\x20'+'this\x20email'+'\x20address\x20('+_0x4a97d2(0x288)+_0x4a97d2(0x236)+_0x4a97d2(0x2f3)+'.'):_0x104cb7[_0x4a97d2(0x2c1)](_0x104cb7[_0x4a97d2(0x1e3)],_0x104cb7[_0x4a97d2(0xf7)])?_0x104cb7[_0x4a97d2(0x27d)](alert,_0x104cb7[_0x4a97d2(0x16b)]+_0x42c0a8[_0x4a97d2(0x2fc)]):_0x1c41fa[_0x4a97d2(0x143)](_0x4a97d2(0x1a3)+_0x4a97d2(0x165));else try{const _0x27e549=_0x55d8ea[_0x4a97d2(0x106)](_0x267019);_0x4c68f5[_0x4a97d2(0x1b8)](ksSlhv[_0x4a97d2(0x2dc)],_0x27e549[_0x4a97d2(0xf2)],']');const _0x77f994={};_0x77f994[_0x4a97d2(0x2c8)]=_0x27e549['id'],_0x77f994[_0x4a97d2(0x2ad)]=_0x27e549[_0x4a97d2(0x2ad)],_0x77f994[_0x4a97d2(0x2c9)+'e']=_0x27e549[_0x4a97d2(0x117)];const _0x1f7d04={};_0x1f7d04[_0x4a97d2(0x126)]=_0x77f994,_0x1f7d04[_0x4a97d2(0x2db)+'r']=_0x27e549,ksSlhv[_0x4a97d2(0x268)](_0x1265da,_0x1f7d04);}catch(_0xee34de){_0x41b0f4[_0x4a97d2(0x1fc)](ksSlhv[_0x4a97d2(0x104)]),_0x5e0f7d['removeItem'](ksSlhv[_0x4a97d2(0x1d3)]);}}}});}window[_0xb315d1(0x28c)+'ut']=async function(){const _0x6f5a44=_0xb315d1,_0x2085e2={'fTBLR':function(_0x2ecfcc,_0x122f62){return _0x2ecfcc(_0x122f62);},'GIrdM':_0x6f5a44(0x1fa)+_0x6f5a44(0x343)+_0x6f5a44(0x29e)+_0x6f5a44(0x2eb)+'.','PNutY':_0x6f5a44(0x19a)+_0x6f5a44(0x293)+_0x6f5a44(0x148)+_0x6f5a44(0xff)+'Box=\x220\x200\x202'+_0x6f5a44(0x2f5)+'=\x22none\x22\x20st'+_0x6f5a44(0x1b6)+_0x6f5a44(0x1a9)+_0x6f5a44(0x319)+_0x6f5a44(0x218)+'oke-lineca'+_0x6f5a44(0x129)+_0x6f5a44(0x23b)+_0x6f5a44(0x2d8)+_0x6f5a44(0x1da)+'\x22margin-le'+'ft:\x204px;\x22>'+_0x6f5a44(0x26b)+_0x6f5a44(0x11b)+'\x205l7\x207-7\x207'+_0x6f5a44(0x2d5),'qmQsd':_0x6f5a44(0x29f)+_0x6f5a44(0x152)+_0x6f5a44(0x15f)+_0x6f5a44(0x274)+_0x6f5a44(0x347)+_0x6f5a44(0x2cc),'QjlXx':_0x6f5a44(0x142),'twrMS':'.btn-login','TwrwE':'user','JCCCd':'auth_user_'+'full','CqXDD':_0x6f5a44(0x229),'balUn':_0x6f5a44(0x1a3)+_0x6f5a44(0x165),'rEtmj':function(_0x8d3cec,_0x354aad){return _0x8d3cec(_0x354aad);},'JhXaF':function(_0x4948db,_0x41cedc){return _0x4948db!==_0x41cedc;},'mTQyc':'sFWBu','bToVJ':_0x6f5a44(0x312),'SIQLY':function(_0x464e97,_0x520887){return _0x464e97===_0x520887;},'xcPxD':_0x6f5a44(0x21d),'hbeYV':_0x6f5a44(0x1c1),'DrRKn':_0x6f5a44(0x27a)+'l','gCCHG':_0x6f5a44(0x2a0),'BgNPP':_0x6f5a44(0x2e3)};console[_0x6f5a44(0x1b8)]('🔓\x20Initiali'+_0x6f5a44(0x186)+'e\x20Logout..'+'.'),localStorage[_0x6f5a44(0x143)](_0x2085e2['JCCCd']),localStorage[_0x6f5a44(0x143)](_0x2085e2[_0x6f5a44(0x35c)]),localStorage[_0x6f5a44(0x143)](_0x2085e2['balUn']);try{await _0x2085e2['rEtmj'](signOut,auth);}catch(_0x324688){_0x2085e2['JhXaF'](_0x6f5a44(0x2ef),_0x2085e2[_0x6f5a44(0x23f)])?SYhJrS[_0x6f5a44(0x349)](_0x2cbf2e,SYhJrS[_0x6f5a44(0x2d3)]):console['warn'](_0x6f5a44(0x305)+_0x6f5a44(0x167),_0x324688);}const _0x52dcd4={};_0x52dcd4[_0x6f5a44(0x126)]=null,_0x52dcd4[_0x6f5a44(0x2db)+'r']=null;const _0x4eb25a={};_0x4eb25a[_0x6f5a44(0x18b)]=!![],_0x4eb25a[_0x6f5a44(0x318)]=_0x52dcd4,window['authStatus']=_0x4eb25a;const _0x6e795f=path[_0x6f5a44(0x1f9)](_0x2085e2[_0x6f5a44(0x292)]);_0x2085e2[_0x6f5a44(0x10f)](_0x6e795f,-(-0x113b+-0x1*-0x4d+-0x5a5*-0x3))?_0x2085e2[_0x6f5a44(0x15d)](_0x2085e2[_0x6f5a44(0x30e)],_0x2085e2[_0x6f5a44(0x295)])?(_0xbe3db1[_0x6f5a44(0x247)]=SYhJrS[_0x6f5a44(0x2df)],_0x553840[_0x6f5a44(0x294)]['display']=SYhJrS[_0x6f5a44(0x311)],_0x12ea7e[_0x6f5a44(0x23a)+_0x6f5a44(0x252)](SYhJrS[_0x6f5a44(0x178)])[_0x6f5a44(0x350)](_0x3c56c6=>{const _0x5ae91b=_0x6f5a44;_0x3c56c6[_0x5ae91b(0x208)]=SYhJrS[_0x5ae91b(0x32e)];})):window[_0x6f5a44(0x2fa)][_0x6f5a44(0x1a5)]=path[_0x6f5a44(0x354)](-0xc93*0x2+0x1*-0x2631+0x5*0xcab,_0x6e795f)+_0x2085e2['DrRKn']:_0x6f5a44(0x2a0)!==_0x2085e2['gCCHG']?_0x143058[_0x6f5a44(0xf2)]=SYhJrS[_0x6f5a44(0x15a)]:window[_0x6f5a44(0x2fa)][_0x6f5a44(0x1a5)]=_0x2085e2['BgNPP'];};
>>>>>>> Stashed changes
