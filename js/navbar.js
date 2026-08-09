/**
 * SKiL MATRiX Centralized Navigation Hub
 * Ensures consistent UI across all pages.
 */

document.addEventListener('DOMContentLoaded', () => {
    renderNavbar();
    initNavbarLogic();
});

function renderNavbar() {
    const container = document.getElementById('navbar-container');
    if (!container) return;

    // Detect if we are in a subdirectory (e.g. /pages/) or root
    // Simplest check: does the path contain '/pages/'?
    const isPagesDir = window.location.pathname.includes('/pages/');
    const basePath = isPagesDir ? '../' : '';

    let pathParts = window.location.pathname.split('/');
    let currentPage = pathParts.pop() || 'index';
    if (currentPage === '' || window.location.pathname.startsWith('/notes')) currentPage = 'notes';

    // Helper to get correct relative path for nav links
    const getLinkPath = (page) => {
        // If we are at root and link is index, it's just index (or ./index)
        // If we are at pages/ and link is index, it's ../index
        if (page.startsWith('index')) {
            return basePath + page;
        }
        // If we are at root and link is pages/something, it's pages/something
        // If we are at pages/ and link is pages/something, it's something (sibling)
        if (page.startsWith('pages/')) {
            const targetPage = page.split('/')[1];
            return isPagesDir ? targetPage : page;
        }
        // Fallback for other assets if needed
        return basePath + page;
    };

    container.innerHTML = `
        <nav class="glass-nav">
            <div class="container nav-content">
                <!-- LEFT ZONE: Logo pinned to left corner -->
                <div class="logo" onclick="window.location.href='${basePath}'"
                    style="cursor: pointer; display: flex; align-items: center; gap: 12px; flex-shrink: 0;">
                    <div style="position: relative; display: flex; align-items: center; justify-content: center; padding: 2px; border-radius: 50%; background: linear-gradient(135deg, #7b61ff, #00f2ff); box-shadow: 0 0 15px rgba(123, 97, 255, 0.4);">
                        <img src="${basePath}assets/logo.jpg?v=7.0" alt="SKiL MATRiX" style="height: 40px; width: 40px; border-radius: 50%; object-fit: cover; border: 2px solid #0b0f19; display: block;">
                    </div>
                    <div class="logo-text-wrapper" style="display: flex; align-items: center; gap: 6px;">
                        <span class="logo-text" style="font-size: 1.3rem; font-weight: 800; line-height: 1; color: #ffffff; letter-spacing: -0.5px;">SKiL MATRiX</span>
                        <span class="highlight-badge" style="font-size: 0.62rem; font-weight: 800; background: linear-gradient(135deg, #a78bfa, #00f2ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: 0.8px; padding: 1.5px 5px; border-radius: 4px; background-color: rgba(167, 139, 250, 0.08); border: 1px solid rgba(167, 139, 250, 0.25); text-transform: uppercase; margin-left: 1px;">NOTES</span>
                    </div>
                </div>
                <!-- CENTER ZONE: Nav links truly centered -->
                <div class="nav-links" id="nav-links">
                    <div class="mobile-sidebar-branding" style="display: none; align-items: flex-start; justify-content: space-between; width: 100%; box-sizing: border-box; margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.08);">
                        <div id="mobile-profile-container" style="flex: 1; margin-bottom: 0; display: flex; flex-direction: column;"></div>
                        <div class="mobile-close-btn" id="mobile-close-btn" style="font-size: 2.2rem; color: rgba(255, 255, 255, 0.6); text-shadow: none; font-weight: 300; cursor: pointer; padding: 0; line-height: 1; margin-left: 15px; margin-top: 5px;">&times;</div>
                    </div>
                    <div class="nav-menu-items">
                        <a href="${getLinkPath('pages/dashboard')}#/notes" class="${currentPage === 'dashboard' && window.location.hash.includes('notes') ? 'active' : ''}">Notes Hub</a>
                        <div class="nav-dropdown" id="tools-dropdown-container">
                            <a href="javascript:void(0)" class="dropdown-toggle" id="tools-dropdown-toggle">Tools <span class="dropdown-arrow">▼</span></a>
                            <div class="dropdown-menu">
                                <a href="${getLinkPath('pages/dashboard')}?tab=ai-tools" class="dropdown-item">
                                    <div class="dropdown-text">
                                        <div class="dropdown-title">AI Coach / Doubt Solver</div>
                                        <div class="dropdown-desc">Instant academic explanations & exam guidance</div>
                                    </div>
                                </a>
                                <a href="${getLinkPath('pages/dashboard')}?tab=codetantra" class="dropdown-item">
                                    <div class="dropdown-text">
                                        <div class="dropdown-title">CodeTantra</div>
                                        <div class="dropdown-desc">Access lab solutions and programming tools</div>
                                    </div>
                                </a>
                                <a href="${getLinkPath('pages/dashboard')}?tab=cgpa-analyzer" class="dropdown-item">
                                    <div class="dropdown-text">
                                        <div class="dropdown-title">CGPA Analyzer</div>
                                        <div class="dropdown-desc">Track semester grades & predict future CGPA</div>
                                    </div>
                                </a>
                                <a href="${getLinkPath('pages/dashboard')}?tab=focusflow" class="dropdown-item">
                                    <div class="dropdown-text">
                                        <div class="dropdown-title">NeuroSprint Pro</div>
                                        <div class="dropdown-desc">Deep work focus timer with ambient beats</div>
                                    </div>
                                </a>
                                <a href="${getLinkPath('pages/dashboard')}?tab=attendance" class="dropdown-item">
                                    <div class="dropdown-text">
                                        <div class="dropdown-title">Attendance Pro</div>
                                        <div class="dropdown-desc">Monitor class attendance & keep 75% on track</div>
                                    </div>
                                </a>
                                <a href="${getLinkPath('pages/dashboard')}?tab=coding-arena" class="dropdown-item">
                                    <div class="dropdown-text">
                                        <div class="dropdown-title">Coding Arena</div>
                                        <div class="dropdown-desc">Interactive programming practice & coding challenges</div>
                                    </div>
                                </a>
                                <a href="${getLinkPath('pages/dashboard')}?tab=timetable" class="dropdown-item">
                                    <div class="dropdown-text">
                                        <div class="dropdown-title">Timetable & Exams</div>
                                        <div class="dropdown-desc">Manage academic schedule & upcoming deadlines</div>
                                    </div>
                                </a>
                                <a href="${getLinkPath('pages/dashboard')}?tab=qr-generator" class="dropdown-item">
                                    <div class="dropdown-text">
                                        <div class="dropdown-title">QR Generator</div>
                                        <div class="dropdown-desc">Create custom QR codes for your resources</div>
                                    </div>
                                </a>
                            </div>
                        </div>
                        <a href="${getLinkPath('pages/dashboard')}?tab=leaderboard" class="${currentPage === 'dashboard' && window.location.search.includes('tab=leaderboard') ? 'active' : ''}">Leaderboard</a>
                        <a href="${getLinkPath('pages/dashboard')}" class="${currentPage === 'dashboard' && window.location.search === '' && window.location.hash === '' ? 'active' : ''}">Dashboard</a>
                        <a href="https://chat.whatsapp.com/JRfWjBhzkALJHPgeMAnNvT" target="_blank" rel="noopener noreferrer">Community</a>
                    </div>
                </div>
                <!-- RIGHT ZONE: Actions pinned to right corner -->
                <div class="nav-actions" id="nav-actions">
                    <a href="${getLinkPath('pages/dashboard')}?tab=subscription" id="nav-subscription-link" class="btn-go-premium">
                        <span style="color: #ffd700; font-size: 1.1em; margin-right: 4px;">👑</span> <span class="premium-text">Go Premium</span>
                    </a>
                    
                    <!-- Profile Icon Dropdown -->
                    <div class="profile-dropdown-container" id="profile-dropdown-container" style="position: relative;">
                        <!-- Premium gradient ring wrapper -->
                        <div id="profile-ring" style="display: inline-flex; padding: 2.5px; border-radius: 50%; background: linear-gradient(135deg, #7b61ff, #a855f7, #00f2ff); box-shadow: 0 0 6px rgba(123, 97, 255, 0.2), 0 0 12px rgba(0, 242, 255, 0.08); transition: box-shadow 0.35s ease, background 0.35s ease; cursor: pointer;">
                            <button class="profile-icon-btn" id="profile-icon-btn" aria-label="User Profile" style="width: 38px; height: 38px; border-radius: 50%; background: #0b0f19; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); padding: 0; overflow: hidden; position: relative;">
                                <span id="profile-avatar-icon" style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="url(#default-avatar-grad)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><defs><linearGradient id="default-avatar-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#a78bfa" /><stop offset="100%" stop-color="#00f2ff" /></linearGradient></defs><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                </span>
                            </button>
                        </div>
                        <div class="profile-dropdown-menu" id="profile-dropdown-menu" style="visibility: hidden; opacity: 0; transform: translateY(10px) scale(0.95); position: absolute; right: 0; top: calc(100% + 14px); width: 240px; background: rgba(13, 17, 28, 0.96); backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px); border: 1px solid rgba(123, 97, 255, 0.3); border-radius: 16px; box-shadow: 0 15px 35px rgba(0, 0, 0, 0.8), 0 0 25px rgba(123, 97, 255, 0.15); padding: 0.5rem; z-index: 1001; transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);">
                            <!-- Dynamically populated by JS -->
                        </div>
                    </div>
                </div>
                <div class="mobile-toggle" id="mobile-toggle">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        </nav>

        <!-- Navbar Overlay -->
        <div class="nav-overlay" id="nav-overlay" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:999; backdrop-filter:blur(5px);"></div>
    `;

    // Initialize Auth State for Button
    updateNavbarAuthButton(basePath);
}

function updateNavbarAuthButton(basePath) {
    const profileBtn = document.getElementById('profile-icon-btn');
    const profileMenu = document.getElementById('profile-dropdown-menu');
    if (!profileBtn || !profileMenu) return;

    // Compute correct auth page path — cleanUrls:true strips .html extensions on the local server
    const authPath = basePath + 'pages/auth';

    const defaultSvg = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="url(#nav-avatar-grad)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><defs><linearGradient id="nav-avatar-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#a78bfa" /><stop offset="100%" stop-color="#00f2ff" /></linearGradient></defs><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;

    // Helper: set avatar photo or fallback SVG inside the button
    const setAvatar = (photoUrl, altText) => {
        const ring = document.getElementById('profile-ring');
        if (photoUrl) {
            // Use position:absolute fill so flex/display mode of button doesn't affect cropping
            profileBtn.innerHTML = `<img src="${photoUrl}" alt="${altText || 'User'}" referrerpolicy="no-referrer" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;" onerror="this.parentElement.innerHTML=\`${defaultSvg}\`;">`;
            // Switch button from flex to block+relative so the absolute img fills it
            profileBtn.style.display = 'block';
            profileBtn.style.position = 'relative';
            profileBtn.style.background = 'transparent';
            // Brighten ring glow when photo is set (reduced)
            if (ring) ring.style.boxShadow = '0 0 10px rgba(123, 97, 255, 0.3), 0 0 18px rgba(0, 242, 255, 0.12)';
        } else {
            profileBtn.innerHTML = defaultSvg;
            // Restore flex for SVG centering
            profileBtn.style.display = 'flex';
            profileBtn.style.position = 'relative';
            profileBtn.style.background = '#0b0f19';
            if (ring) ring.style.boxShadow = '0 0 6px rgba(123, 97, 255, 0.2), 0 0 12px rgba(0, 242, 255, 0.08)';
        }
    };

    const checkAuth = () => {
        const fullUserStr = localStorage.getItem('auth_user_full');
        const guestUserStr = localStorage.getItem('guest_session');
        const fbUser = window.firebaseServices && window.firebaseServices.auth && window.firebaseServices.auth.currentUser;

        let isLoggedIn = false;
        let userName = 'Student';
        let userEmail = '';
        let userPhoto = '';

        if (fullUserStr) {
            try {
                const u = JSON.parse(fullUserStr);
                isLoggedIn = true;
                userName = u.name || u.displayName || u.email || 'Student';
                userEmail = u.email || '';
                // Check all possible photo keys saved by auth/profile/dashboard
                userPhoto = u.photoURL || u.photo || u.photoUrl || u.avatar || u.profileImage || u.profilePicture || '';
            } catch(e) {}
        } else if (fbUser) {
            isLoggedIn = true;
            userName = fbUser.displayName || fbUser.email || 'Student';
            userEmail = fbUser.email || '';
            userPhoto = fbUser.photoURL || '';
        } else if (guestUserStr) {
            isLoggedIn = true;
            userName = 'Guest Student';
            userEmail = 'Guest Session';
        }

        // Fallback to any standalone photo keys in localStorage
        if (!userPhoto) {
            userPhoto = localStorage.getItem('user_avatar') || localStorage.getItem('user_photo') || localStorage.getItem('profile_image') || '';
        }

        if (isLoggedIn) {
            setAvatar(userPhoto, userName);

            // Inject premium animation styles globally if not present
            if (!document.getElementById('nav-premium-styles')) {
                const pStyle = document.createElement('style');
                pStyle.id = 'nav-premium-styles';
                pStyle.textContent = `
                    @keyframes premiumBorderPulse {
                        0%, 100% { border-color: rgba(255, 215, 0, 0.3); box-shadow: 0 0 8px rgba(255, 215, 0, 0.1); }
                        50% { border-color: rgba(255, 215, 0, 0.8); box-shadow: 0 0 15px rgba(255, 215, 0, 0.4); }
                    }
                    .premium-dropdown-header {
                        animation: premiumBorderPulse 3s ease-in-out infinite !important;
                        border: 1px solid rgba(255, 215, 0, 0.3) !important;
                        border-radius: 12px;
                        margin: 0.2rem;
                    }
                `;
                document.head.appendChild(pStyle);
            }

            const dropdownHtml = `
                <div class="dropdown-profile-header" onclick="window.location.href='${basePath}pages/dashboard?tab=profile'" style="cursor: pointer; position: relative; padding: 0.65rem 0.8rem; border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 0.3rem; display: flex; align-items: center; gap: 10px; border: 1px solid transparent; transition: all 0.2s ease;">
                    <div style="width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,0.05); border: 1px solid rgba(123, 97, 255, 0.4); display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; position: relative;">
                        ${userPhoto ? `<img src="${userPhoto}" referrerpolicy="no-referrer" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block;" onerror="this.parentElement.innerHTML=\`${defaultSvg}\`">` : defaultSvg}
                    </div>
                    <div style="overflow: hidden;">
                        <div style="font-weight: 700; color: #ffffff; font-size: 0.88rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${userName}</div>
                        ${userEmail ? `<div style="font-size: 0.72rem; color: #8f9bb3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${userEmail}</div>` : ''}
                    </div>
                </div>
                <a href="${basePath}pages/dashboard?tab=profile" class="profile-dropdown-link" style="display: flex; align-items: center; gap: 10px; padding: 0.6rem 0.8rem; color: #e2e8f0; text-decoration: none; font-size: 0.88rem; font-weight: 600; border-radius: 10px; transition: all 0.2s ease;">
                    <i class="fa-regular fa-user" style="font-size: 0.95rem; width: 20px; text-align: center; color: rgba(255, 255, 255, 0.5);"></i> Profile
                </a>
                <a href="${basePath}pages/dashboard" class="profile-dropdown-link" style="display: flex; align-items: center; gap: 10px; padding: 0.6rem 0.8rem; color: #e2e8f0; text-decoration: none; font-size: 0.88rem; font-weight: 600; border-radius: 10px; transition: all 0.2s ease;">
                    <i class="fa-solid fa-chart-line" style="font-size: 0.95rem; width: 20px; text-align: center; color: rgba(255, 255, 255, 0.5);"></i> Dashboard
                </a>
                <div style="height: 1px; background: rgba(255,255,255,0.08); margin: 0.3rem 0;"></div>
                <a href="javascript:void(0)" class="profile-dropdown-link logout-btn" style="display: flex; align-items: center; gap: 10px; padding: 0.6rem 0.8rem; color: #ff4757; text-decoration: none; font-size: 0.88rem; font-weight: 700; border-radius: 10px; transition: all 0.2s ease;">
                    <i class="fa-solid fa-power-off" style="font-size: 0.95rem; width: 20px; text-align: center; color: rgba(255, 71, 87, 0.7);"></i> Logout
                </a>
            `;

            profileMenu.innerHTML = dropdownHtml;
            const mobileProfileContainer = document.getElementById('mobile-profile-container');
            if (mobileProfileContainer) {
                mobileProfileContainer.innerHTML = dropdownHtml;
            }

            // Async check for active plan to add PRO badge
            try {
                let uid = null;
                if (fbUser && fbUser.uid) {
                    uid = fbUser.uid;
                } else if (fullUserStr) {
                    const u = JSON.parse(fullUserStr);
                    uid = u.uid || u.localId || u.id;
                }

                if (uid) {
                    import('./supabase-config.js?v=1.0').then(({ supabase }) => {
                        supabase.from('user_plans').select('*').eq('firebase_uid', uid).single().then(({ data, error }) => {
                            if (!error && data) {
                                const expiry = data.plan_expiry ? new Date(data.plan_expiry) : null;
                                const isActive = data.plan_id !== 'free' && (!expiry || expiry > new Date());
                                if (isActive) {
                                    // Update desktop dropdown
                                    const dHeader = profileMenu.querySelector('.dropdown-profile-header');
                                    if (dHeader) {
                                        dHeader.classList.add('premium-dropdown-header');
                                        const badge = document.createElement('span');
                                        badge.innerHTML = `<i class="fa-solid fa-crown" style="margin-right: 3px; font-size: 0.55rem;"></i>${data.plan_id === 'pro' ? 'PRO' : data.plan_id.toUpperCase()}`;
                                        badge.style.cssText = 'position: absolute; top: 0; left: 50%; transform: translate(-50%, -50%); font-size: 0.55rem; font-weight: 800; letter-spacing: 0.5px; color: #2d3748; background: linear-gradient(135deg, #FFD700 0%, #F59E0B 100%); padding: 2px 6px; border-radius: 6px; text-transform: uppercase; box-shadow: 0 0 10px rgba(245, 158, 11, 0.4); z-index: 10; display: inline-flex; align-items: center;';
                                        dHeader.appendChild(badge);
                                    }
                                    // Update mobile dropdown
                                    if (mobileProfileContainer) {
                                        const mHeader = mobileProfileContainer.querySelector('.dropdown-profile-header');
                                        if (mHeader) {
                                            mHeader.classList.add('premium-dropdown-header');
                                            const badge2 = document.createElement('span');
                                            badge2.innerHTML = `<i class="fa-solid fa-crown" style="margin-right: 3px; font-size: 0.55rem;"></i>${data.plan_id === 'pro' ? 'PRO' : data.plan_id.toUpperCase()}`;
                                            badge2.style.cssText = 'position: absolute; top: 0; left: 50%; transform: translate(-50%, -50%); font-size: 0.55rem; font-weight: 800; letter-spacing: 0.5px; color: #2d3748; background: linear-gradient(135deg, #FFD700 0%, #F59E0B 100%); padding: 2px 6px; border-radius: 6px; text-transform: uppercase; box-shadow: 0 0 10px rgba(245, 158, 11, 0.4); z-index: 10; display: inline-flex; align-items: center;';
                                            mHeader.appendChild(badge2);
                                        }
                                    }
                                    
                                    // Update navbar avatar ring to premium gold
                                    const ring = document.getElementById('profile-ring');
                                    if (ring) {
                                        ring.style.background = 'linear-gradient(135deg, #FFD700 0%, #F59E0B 100%)';
                                        ring.style.boxShadow = '0 0 10px rgba(255, 215, 0, 0.4), 0 0 20px rgba(245, 158, 11, 0.2)';
                                    }
                                }
                            }
                        }).catch(()=>{});
                    }).catch(()=>{});
                }
            } catch(e) {}

            document.querySelectorAll('.logout-btn').forEach(btn => {
                btn.onclick = (e) => {
                    e.preventDefault();
                    localStorage.removeItem('auth_user_full');
                    localStorage.removeItem('guest_session');
                    localStorage.removeItem('auth_token');
                    if (window.firebaseServices && window.firebaseServices.auth) {
                        window.firebaseServices.auth.signOut().catch(()=>{});
                    }
                    window.location.href = authPath;
                };
            });
        } else {
            setAvatar('', '');
            profileBtn.style.background = 'linear-gradient(135deg, #1e293b, #0f172a)';
            profileBtn.style.borderColor = 'rgba(123, 97, 255, 0.4)';
            profileBtn.style.boxShadow = '0 0 15px rgba(123, 97, 255, 0.15)';

            const loginHtml = `
                <div class="dropdown-profile-header guest-header" style="position: relative; padding: 0.65rem 0.8rem; border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 0.8rem; display: flex; align-items: center; gap: 12px; border: 1px solid transparent;">
                    <div style="width: 42px; height: 42px; border-radius: 50%; background: linear-gradient(135deg, rgba(123,97,255,0.15), rgba(0,242,255,0.15)); border: 1px solid rgba(0,242,255,0.3); display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 0 12px rgba(0,242,255,0.15);">
                        <i class="fa-solid fa-user-astronaut" style="font-size: 1.1rem; color: #00f2ff;"></i>
                    </div>
                    <div style="overflow: hidden; display: flex; flex-direction: column; gap: 2px;">
                        <div style="font-weight: 800; font-size: 1.05rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                            <span style="color: #ffffff;">Welcome,</span> <span style="background: linear-gradient(135deg, #a78bfa, #00f2ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Student</span>
                        </div>
                        <div style="font-size: 0.72rem; color: #8f9bb3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 500;">Log in to access your tools</div>
                    </div>
                </div>
                <a href="${authPath}" class="profile-dropdown-link login-btn" style="display: flex; align-items: center; gap: 10px; padding: 0.6rem 0.8rem; color: #00f2ff; text-decoration: none; font-size: 0.88rem; font-weight: 700; border-radius: 10px; transition: all 0.2s ease; background: rgba(0, 242, 255, 0.08);">
                    <i class="fa-solid fa-right-to-bracket" style="font-size: 0.95rem; width: 20px; text-align: center; color: #00f2ff;"></i> Sign Up / Login
                </a>
            `;
            
            profileMenu.innerHTML = loginHtml;
            const mobileProfileContainer = document.getElementById('mobile-profile-container');
            if (mobileProfileContainer) {
                mobileProfileContainer.innerHTML = loginHtml;
            }
        }

        // Add hover effects for profile links
        document.querySelectorAll('.profile-dropdown-link').forEach(link => {
            link.addEventListener('mouseenter', () => {
                link.style.background = 'rgba(255, 255, 255, 0.08)';
                link.style.transform = 'translateX(4px)';
            });
            link.addEventListener('mouseleave', () => {
                link.style.background = 'transparent';
                if (link.style.color.includes('#00f2ff')) {
                    link.style.background = 'rgba(0, 242, 255, 0.08)';
                }
                link.style.transform = 'translateX(0)';
            });
        });
    };

    checkAuth();

    // Re-run checkAuth whenever Firebase auth state changes
    if (window.firebaseServices && window.firebaseServices.auth) {
        window.firebaseServices.auth.onAuthStateChanged(() => checkAuth());
    }

    // Re-run checkAuth whenever localStorage changes (e.g., user updates profile photo)
    // 'storage' fires in OTHER tabs; for SAME tab we use a custom event
    window.addEventListener('storage', (e) => {
        if (e.key === 'auth_user_full' || e.key === 'user_avatar' || e.key === 'user_photo' || e.key === 'profile_image') {
            checkAuth();
        }
    });
    // Custom event dispatched by profile.js after photo upload on the SAME tab
    window.addEventListener('navbar:refresh', () => checkAuth());

    // Expose globally so any script can trigger a navbar avatar refresh
    window.refreshNavbarAuth = () => checkAuth();

    // Toggle Profile Dropdown
    profileBtn.onclick = (e) => {
        e.stopPropagation();
        const isClosed = profileMenu.style.visibility !== 'visible';
        
        // close any open tools dropdown
        const toolsMenu = document.querySelector('#tools-dropdown-container .dropdown-menu');
        if (toolsMenu) toolsMenu.classList.remove('show');
        const toolsContainer = document.getElementById('tools-dropdown-container');
        if (toolsContainer) toolsContainer.classList.remove('active');

        if (isClosed) {
            profileMenu.style.visibility = 'visible';
            profileMenu.style.opacity = '1';
            profileMenu.style.transform = 'translateY(0) scale(1)';
        } else {
            profileMenu.style.visibility = 'hidden';
            profileMenu.style.opacity = '0';
            profileMenu.style.transform = 'translateY(10px) scale(0.95)';
        }
    };

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!profileBtn.contains(e.target) && !profileMenu.contains(e.target)) {
            profileMenu.style.visibility = 'hidden';
            profileMenu.style.opacity = '0';
            profileMenu.style.transform = 'translateY(10px) scale(0.95)';
        }
    });
}

function initNavbarLogic() {
    const nav = document.querySelector('.glass-nav');
    if (!nav) return;

    // Scroll Effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });

    // Mobile Toggle
    const toggle = document.getElementById('mobile-toggle');
    const links = document.getElementById('nav-links');
    const overlay = document.getElementById('nav-overlay');

    if (toggle && links) {
        const toggleMenu = () => {
            links.classList.toggle('active');
            toggle.classList.toggle('active');
            if (overlay) {
                overlay.style.display = links.classList.contains('active') ? 'block' : 'none';
                document.body.style.overflow = links.classList.contains('active') ? 'hidden' : '';
            }
        };

        toggle.addEventListener('click', toggleMenu);
        const closeBtn = document.getElementById('mobile-close-btn');
        if (closeBtn) closeBtn.addEventListener('click', toggleMenu);
        if (overlay) overlay.addEventListener('click', toggleMenu);

        // Close menu on link click (except dropdown toggle and dropdown items)
        links.querySelectorAll('a:not(.dropdown-toggle)').forEach(link => {
            link.addEventListener('click', () => {
                if (links.classList.contains('active')) toggleMenu();
            });
        });
    }

    // Dropdown toggle logic
    const dropdownToggle = document.getElementById('tools-dropdown-toggle');
    const dropdownContainer = document.getElementById('tools-dropdown-container');
    if (dropdownToggle && dropdownContainer) {
        dropdownToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownContainer.classList.toggle('active');
            const arrow = dropdownToggle.querySelector('.dropdown-arrow');
            if (arrow) {
                arrow.style.transform = dropdownContainer.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0deg)';
            }
        });
    }

    document.addEventListener('click', (e) => {
        const dropdownContainer = document.getElementById('tools-dropdown-container');
        if (dropdownContainer && !dropdownContainer.contains(e.target)) {
            dropdownContainer.classList.remove('active');
            const arrow = dropdownContainer ? dropdownContainer.querySelector('.dropdown-arrow') : null;
            if (arrow) arrow.style.transform = 'rotate(0deg)';
        }
    });

    // Global Protection: Prevent dragging any image or image-link across the website
    document.addEventListener('dragstart', (e) => {
        if (e.target && (
            e.target.tagName === 'IMG' ||
            (e.target.querySelector && e.target.querySelector('img')) ||
            e.target.closest('img') ||
            e.target.closest('.founder-card, .founder-inner, .founder-img-wrapper, .modal-profile-img, .logo, .footer-logo-area')
        )) {
            e.preventDefault();
            return false;
        }
    }, false);

    // Global Protection: Prevent right-click (context menu) on images to prevent opening in new tab
    document.addEventListener('contextmenu', (e) => {
        if (e.target && (
            e.target.tagName === 'IMG' ||
            e.target.closest('img') ||
            e.target.closest('.founder-card, .founder-inner, .founder-img-wrapper, .modal-profile-img, .logo, .footer-logo-area')
        )) {
            e.preventDefault();
            return false;
        }
    }, false);
}
