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
    const basePath = isPagesDir ? '/' : ''; // Use absolute paths mostly now

    let pathParts = window.location.pathname.split('/').filter(p => p);
    let currentPage = window.location.pathname;
    if (currentPage === '/' || currentPage === '/index.html') currentPage = '/index.html';
    if (window.location.pathname.includes('/notes/')) currentPage = '/pages/notes/';

    // Helper to get correct relative path for nav links
    const getLinkPath = (page) => {
        if (page.startsWith('index.html')) return '/index.html';
        if (page.startsWith('/pages/')) return page;
        if (page.startsWith('pages/')) return '/' + page;
        return page;
    };

    container.innerHTML = `
        <nav class="glass-nav">
            <div class="container nav-content">
                <div class="logo" onclick="window.location.href='/index.html'"
                    style="cursor: pointer; display: flex; align-items: center; gap: 10px;">
                    <img src="/assets/logo.jpg" alt="SKiL MATRiX" style="height: 40px; border-radius: 50%;">
                    <span class="logo-text">SKiL MATRiX <span class="highlight"
                            style="font-weight: 800;">NOTES</span></span>
                </div>
                <div class="nav-links" id="nav-links">
                    <a href="${getLinkPath('index.html#features')}" class="${currentPage === '/index.html' ? 'active' : ''}">Features</a>
                    <a href="${getLinkPath('/pages/dashboard/')}?tab=notes" class="${currentPage === '/pages/dashboard/' && window.location.search.includes('tab=notes') ? 'active' : ''}">Notes Hub</a>
                    <a href="${getLinkPath('/pages/dashboard/')}?tab=leaderboard" class="${currentPage === '/pages/dashboard/' && window.location.search.includes('tab=leaderboard') ? 'active' : ''}">Leaderboard</a>
                    <a href="${getLinkPath('/pages/dashboard/')}" class="${currentPage === '/pages/dashboard/' && !window.location.search.includes('tab=notes') && !window.location.search.includes('tab=leaderboard') ? 'active' : ''}">Dashboard</a>
                    <a href="https://chat.whatsapp.com/JRfWjBhzkALJHPgeMAnNvT" target="_blank" rel="noopener noreferrer">Community</a>
                    <button class="btn btn-primary" id="navbar-auth-btn">Get Started</button>
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
    const authBtn = document.getElementById('navbar-auth-btn');
    if (!authBtn) return;

    const checkAuth = () => {
        const fullUser = localStorage.getItem('auth_user_full');
        const guestUser = localStorage.getItem('guest_session');

        if (fullUser || (window.firebaseServices && window.firebaseServices.auth.currentUser)) {
            authBtn.textContent = 'Get Started';
            authBtn.onclick = () => {
                window.location.href = `/pages/dashboard/`;
            };
        } else if (guestUser) {
            authBtn.textContent = 'Get Started';
            authBtn.onclick = () => {
                window.location.href = `/pages/dashboard/`;
            };
        } else {
            authBtn.textContent = 'Get Started';
            authBtn.onclick = () => {
                window.location.href = `/pages/auth/`;
            };
        }
    };

    checkAuth();
    if (window.firebaseServices && window.firebaseServices.auth) {
        window.firebaseServices.auth.onAuthStateChanged(() => checkAuth());
    }
}

function initNavbarLogic() {
    const nav = document.querySelector('.glass-nav');
    if (!nav) return;

    // Scroll Effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.style.background = 'rgba(11, 15, 25, 0.95)';
            nav.style.padding = '0.75rem 0';
        } else {
            nav.style.background = 'rgba(11, 15, 25, 0.7)';
            nav.style.padding = '1rem 0';
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
        if (overlay) overlay.addEventListener('click', toggleMenu);

        // Close menu on link click
        links.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (links.classList.contains('active')) toggleMenu();
            });
        });
    }
}
