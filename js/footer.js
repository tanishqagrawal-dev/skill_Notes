// --- ADVANCED FOOTER LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
    initAdvancedFooter();
});

function initAdvancedFooter() {
    initRoleAwareLinks();
    
    // Initialize icons for any dynamically added content
    if (window.lucide) {
        lucide.createIcons();
    }
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
            { txt: 'Admin Console', url: p('dashboard?tab=admin-console') },
            { txt: 'Manage Content', url: p('dashboard?tab=verification-hub') },
            { txt: 'System Status', url: '#' }
        ];
    } else if (userRole === 'uploader' || userRole === 'contributor') {
        links = [
            { txt: 'My Uploads', url: p('dashboard?tab=my-uploads') },
            { txt: 'Upload New Note', url: '#', onclick: "openUploadModal()" },
            { txt: 'Contributor Guidelines', url: '#' }
        ];
    } else {
        // Default: Student
        links = [
            { txt: 'Notes Hub', url: p('dashboard?tab=notes') },
            { txt: 'Leaderboard', url: p('dashboard?tab=leaderboard') },
            { txt: 'AI Study Planner', url: p('dashboard?tab=planner') },
            { txt: 'Exam Strategist', url: p('dashboard?tab=ai-tools') }
        ];
    }

    linksContainer.innerHTML = links.map(l =>
        `<a href="${l.url}" ${l.onclick ? `onclick="${l.onclick}"` : ''}>${l.txt}</a>`
    ).join('');
}

