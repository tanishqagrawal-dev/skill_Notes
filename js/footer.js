// --- ADVANCED FOOTER LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
    initAdvancedFooter();
});

function initAdvancedFooter() {
    initFooterStats();
    initRoleAwareLinks();
    initBackToTop();
}

function initFooterStats() {
    const statsContainer = document.getElementById('footer-stats');
    if (!statsContainer) return;

    // Provide the skeleton with IDs that stats.js can target
    statsContainer.innerHTML = `
        <span class="footer-stats-block">📚 <span id="stat-notes">...</span> notes</span> &bull; 
        <span class="footer-stats-block">👥 <span id="stat-active">...</span> students</span> &bull; 
        <span class="footer-stats-block">⬇️ <span id="stat-downloads">...</span> downloads</span>
    `;
}

function initRoleAwareLinks() {
    const linksContainer = document.getElementById('footer-role-links');
    if (!linksContainer) return;

    // Determine Role (Check localStorage or default to Student)
    const userRole = localStorage.getItem('user_role') || 'user';

    let links = [];

    // Use absolute paths for everything
    const p = (path) => path;
    const r = (path) => path;

    if (userRole === 'admin' || userRole === 'superadmin' || userRole === 'coadmin') {
        links = [
            { txt: 'Admin Console', url: '/pages/dashboard/?tab=admin' },
            { txt: 'Manage Content', url: '/pages/dashboard/?tab=verification' },
            { txt: 'System Status', url: '#' }
        ];
    } else if (userRole === 'uploader' || userRole === 'contributor') {
        links = [
            { txt: 'My Uploads', url: '/pages/dashboard/?tab=profile' },
            { txt: 'Upload New Note', url: '#', onclick: "openUploadModal()" },
            { txt: 'Contributor Guidelines', url: '#' }
        ];
    } else {
        // Default: Student
        links = [
            { txt: 'Notes Hub', url: '/pages/dashboard/?tab=notes' },
            { txt: 'Leaderboard', url: '/pages/dashboard/?tab=leaderboard' },
            { txt: 'AI Study Planner', url: '/pages/dashboard/?tab=planner' },
            { txt: 'Exam Strategist', url: '/pages/dashboard/?tab=ai-tools' }
        ];
    }

    linksContainer.innerHTML = links.map(l =>
        `<a href="${l.url}" ${l.onclick ? `onclick="${l.onclick}"` : ''}>${l.txt}</a>`
    ).join('');
}

function initBackToTop() {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    });

    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}
