/**
 * LockOverlay Component
 * Handles the "Coming Soon" locked feature overlay with SaaS quality.
 */

class LockOverlay {
    constructor() {
        this.container = null;
        this.isVisible = false;
        this.init();
        this.checkAutoLoad();
    }

    init() {
        if (document.getElementById('comingSoonOverlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'comingSoonOverlay';

        overlay.innerHTML = `
            <div class="lockCard">
                <div class="lock-icon-container">
                    <svg class="lock-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="lock-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style="stop-color:#00F2FF;stop-opacity:1" />
                                <stop offset="100%" style="stop-color:#7B61FF;stop-opacity:1" />
                            </linearGradient>
                        </defs>
                        <path d="M12 2C9.243 2 7 4.243 7 7V10C5.895 10 5 10.895 5 12V19C5 20.105 5.895 21 7 21H17C18.105 21 19 20.105 19 19V12C19 10.895 18.105 10 17 10V7C17 4.243 14.757 2 12 2ZM9 7C9 5.346 10.346 4 12 4C13.654 4 15 5.346 15 7V10H9V7ZM12 16C11.172 16 10.5 15.328 10.5 14.5C10.5 13.672 11.172 13 12 13C12.828 13 13.5 13.672 13.5 14.5C13.5 15.328 12.828 16 12 16Z"/>
                    </svg>
                </div>
                <h1 class="coming-soon-title">COMING<br>SOON</h1>
                <p class="development-caption">This feature is currently under development</p>
                <div style="margin-top:24px; font-size: 0.7rem; color: rgba(255,255,255,0.3); letter-spacing: 2px;">PRESS ESC TO RETURN</div>
            </div>
        `;

        document.body.appendChild(overlay);
        this.container = overlay;

        // Listen for ESC key
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }

    checkAutoLoad() {
        const path = window.location.pathname.toLowerCase();
        if (path.includes('ai') || path.includes('study')) {
            // Delay slightly to ensure content is there to blur
            setTimeout(() => this.show(), 100);
        }
    }

    show() {
        if (!this.container) this.init();
        this.isVisible = true;

        // Blur relevant content boxes (Main Content or Dashboard Container)
        const content = document.querySelector('.main-content') ||
            document.querySelector('.dashboard-container') ||
            document.querySelector('.content-area') ||
            Array.from(document.body.children).find(c => c.id !== 'comingSoonOverlay' && c.tagName !== 'SCRIPT');

        if (content) content.classList.add('content-blurred');

        this.container.classList.add('active');
        // Allow background scroll but disable interactions via class logic
        // Background scroll is already allowed as per requirements
    }

    hide() {
        if (!this.container) return;
        this.isVisible = false;

        const content = document.querySelector('.content-blurred');
        if (content) content.classList.remove('content-blurred');

        this.container.classList.remove('active');

        // Redirect back for standalone pages
        const isStandalone = window.location.pathname.includes('ai-tools.html') || window.location.pathname.includes('study-planner.html');
        if (isStandalone) {
            window.location.href = 'dashboard.html';
        }
    }
}

// Global instance
window.lockOverlay = new LockOverlay();
