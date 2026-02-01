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

    const isSubPage = window.location.pathname.includes('/pages/');
    const basePath = isSubPage ? '../' : '';

    // Improved detection: handles trailing slashes, local files, and server paths
    let pathParts = window.location.pathname.split('/');
    let currentPage = pathParts.pop() || 'index.html';
    if (currentPage === '') currentPage = 'index.html';

    // Helper to get correct path for nav links
    const getLinkPath = (page) => {
        if (page === 'index.html#features') {
            return isSubPage ? '../index.html#features' : '#features';
        }
        if (isSubPage) {
            return page === 'index.html' ? '../index.html' : page;
        } else {
            return page === 'index.html' ? 'index.html' : `pages/${page}`;
        }
    };

    container.innerHTML = `
        <nav class="glass-nav">
            <div class="container nav-content">
                <div class="logo" onclick="window.location.href='${isSubPage ? '../index.html' : 'index.html'}'"
                    style="cursor: pointer; display: flex; align-items: center; gap: 10px;">
                    <img src="${basePath}assets/logo.jpg" alt="SKiL MATRiX" style="height: 40px; border-radius: 50%;">
                    <span class="logo-text">SKiL MATRiX <span class="highlight"
                            style="font-weight: 800;">NOTES</span></span>
                </div>
                <div class="nav-links" id="nav-links">
                    <a href="${getLinkPath('index.html#features')}" class="${currentPage === 'index.html' ? 'active' : ''}">Features</a>
                    <a href="${getLinkPath('dashboard.html?tab=notes')}" class="${currentPage === 'dashboard.html' && window.location.search.includes('tab=notes') ? 'active' : ''}">Notes Hub</a>
                    <a href="${getLinkPath('dashboard.html?tab=leaderboard')}" class="${currentPage === 'dashboard.html' && window.location.search.includes('tab=leaderboard') ? 'active' : ''}">Leaderboard</a>
                    <a href="${getLinkPath('dashboard.html')}" class="${currentPage === 'dashboard.html' && !window.location.search.includes('tab=notes') && !window.location.search.includes('tab=leaderboard') ? 'active' : ''}">Dashboard</a>
                    <a href="https://chat.whatsapp.com/JRfWjBhzkALJHPgeMAnNvT" target="_blank" rel="noopener noreferrer">Community</a>
                    <button class="btn btn-primary" id="navbar-auth-btn">Get Started</button>
                </div>
                <div class="mobile-toggle" id="mobile-toggle">
                    <span></span>
                </div>
            </div>
        </nav>
    `;

    // Initialize Auth State for Button
    updateNavbarAuthButton(isSubPage ? '../' : '');
}

function updateNavbarAuthButton(basePath) {
    const authBtn = document.getElementById('navbar-auth-btn');
    if (!authBtn) return;

    const checkAuth = () => {
        const user = localStorage.getItem('auth_user') || (window.firebaseServices && window.firebaseServices.auth.currentUser);
        if (user) {
            authBtn.textContent = 'Get Started';
            authBtn.onclick = () => {
                window.location.href = `${basePath}pages/dashboard.html`;
            };
        } else {
            authBtn.textContent = 'Get Started';
            authBtn.onclick = () => {
                window.location.href = `${basePath}pages/auth.html`;
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
    if (toggle && links) {
        toggle.addEventListener('click', () => {
            links.classList.toggle('active');
            toggle.classList.toggle('active');
        });
    }
}
