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

    // Simulated "Live" Data
    const stats = {
        notes: 12482,
        students: 3190,
        downloads: 1200000
    };

    // Format numbers
    const fmt = (n) => {
        if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
        if (n >= 1000) return (n / 1000).toLocaleString();
        return n;
    };

    statsContainer.innerHTML = `
        <span>📚 ${fmt(stats.notes)} notes</span> &bull; 
        <span>👥 ${fmt(stats.students)} students</span> &bull; 
        <span>⬇️ ${fmt(stats.downloads)} downloads</span>
    `;
}

function initRoleAwareLinks() {
    const linksContainer = document.getElementById('footer-role-links');
    if (!linksContainer) return;

    // Determine Role (Check localStorage or default to Student)
    const userRole = localStorage.getItem('user_role') || 'user';

    let links = [];

    // Check if we are in pages/ or root to adjust links
    const inPages = window.location.pathname.includes('/pages/');
    const p = (path) => inPages ? path : 'pages/' + path;
    const r = (path) => inPages ? '../' + path : path; // root link

    if (userRole === 'admin' || userRole === 'superadmin' || userRole === 'coadmin') {
        links = [
            { txt: 'Admin Console', url: p('dashboard.html?tab=admin') },
            { txt: 'Manage Content', url: p('dashboard.html?tab=verification') },
            { txt: 'System Status', url: '#' }
        ];
    } else if (userRole === 'uploader' || userRole === 'contributor') {
        links = [
            { txt: 'My Uploads', url: p('dashboard.html?tab=profile') },
            { txt: 'Upload New Note', url: '#', onclick: "openUploadModal()" },
            { txt: 'Contributor Guidelines', url: '#' }
        ];
    } else {
        // Default: Student
        links = [
            { txt: 'Notes Hub', url: p('notes.html') },
            { txt: 'AI Study Planner', url: p('dashboard.html?tab=planner') },
            { txt: 'Exam Strategist', url: p('dashboard.html?tab=ai-tools') }
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
