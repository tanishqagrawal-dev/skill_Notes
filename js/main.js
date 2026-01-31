// Sample Data
const notesData = [
    {
        id: "N101",
        title: "Unit 2 – Digital Electronics Short Notes",
        college: "medicaps",
        branch: "cse",
        sem: "4",
        subject: "Digital Electronics",
        likes: 1200,
        views: 8500,
        downloads: 640,
        pages: 12,
        readTime: "20 min",
        tag: "High Exam Priority",
        fileUrl: "#"
    },
    {
        id: "N102",
        title: "Database Management Systems - Full Course",
        college: "medicaps",
        branch: "cse",
        sem: "4",
        subject: "DBMS",
        likes: 950,
        views: 7200,
        downloads: 580,
        pages: 45,
        readTime: "90 min",
        tag: "Detailed Notes",
        fileUrl: "#"
    },
    {
        id: "N103",
        title: "Operating Systems - Unit 1 & 2",
        college: "svvv",
        branch: "it",
        sem: "3",
        subject: "OS",
        likes: 800,
        views: 5400,
        downloads: 320,
        pages: 18,
        readTime: "30 min",
        tag: "Quick Revision",
        fileUrl: "#"
    },
    {
        id: "N104",
        title: "Data Structures & Algorithms - Cheat Sheet",
        college: "all",
        branch: "cse",
        sem: "3",
        subject: "DSA",
        likes: 2500,
        views: 15400,
        downloads: 1200,
        pages: 5,
        readTime: "10 min",
        tag: "Must Read",
        fileUrl: "#"
    }
];

// Initialize UI
document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initFilters();
    renderNotes(notesData);
    animateCounters();
    initFAQ();
});

// Animate Stats Counters (Disabled as stats are now handled by stats.js real-time listener)
function animateCounters() {
    // Left empty: stats.js handles real-time updates now.
}

// Navigation Scroll Effect
function initNav() {
    const nav = document.querySelector('.glass-nav');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.style.background = 'rgba(11, 15, 25, 0.95)';
            nav.style.padding = '0.75rem 0';
        } else {
            nav.style.background = 'rgba(11, 15, 25, 0.7)';
            nav.style.padding = '1rem 0';
        }
    });
}

// FAQ Logic
function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const header = item.querySelector('.faq-header');
        if (!header) return;

        header.addEventListener('click', () => {
            // Close other items
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                    const otherBody = otherItem.querySelector('.faq-body');
                    if (otherBody) otherBody.style.maxHeight = null;
                }
            });

            // Toggle current
            item.classList.toggle('active');
            const body = item.querySelector('.faq-body');
            if (item.classList.contains('active')) {
                body.style.maxHeight = body.scrollHeight + "px";
            } else {
                body.style.maxHeight = null;
            }
        });
    });
}

// Filter Logic
function initFilters() {
    const collegeSelect = document.getElementById('college-select');
    const branchSelect = document.getElementById('branch-select');
    const semSelect = document.getElementById('sem-select');
    const searchInput = document.getElementById('notes-search');

    if (!collegeSelect || !searchInput) return;

    const updateFilters = () => {
        const searchTerm = searchInput.value.toLowerCase();
        const filtered = notesData.filter(note => {
            const matchesSearch = note.title.toLowerCase().includes(searchTerm) ||
                note.subject.toLowerCase().includes(searchTerm);
            const matchesCollege = collegeSelect.value === 'all' || note.college === collegeSelect.value;
            const matchesBranch = branchSelect.value === 'all' || note.branch === branchSelect.value;
            const matchesSem = semSelect.value === 'all' || note.sem === semSelect.value;

            return matchesSearch && matchesCollege && matchesBranch && matchesSem;
        });

        // Sort by "Best for Exam" algorithm
        const sorted = filtered.sort((a, b) => calculateExamScore(b) - calculateExamScore(a));
        renderNotes(sorted);
    };

    [collegeSelect, branchSelect, semSelect].forEach(select => {
        if (select) select.addEventListener('change', updateFilters);
    });

    searchInput.addEventListener('input', updateFilters);
}

// Algorithm: ExamScore = (views * 0.3) + (downloads * 0.5) + (likes * 0.2)
function calculateExamScore(note) {
    return (note.views * 0.3) + (note.downloads * 0.5) + (note.likes * 0.2);
}

// Render Notes to grid
function renderNotes(notes) {
    const grid = document.getElementById('notes-grid');
    if (!grid) return;
    grid.innerHTML = '';

    if (notes.length === 0) {
        grid.innerHTML = `<div class="no-results">No notes found for these filters. Try another combination!</div>`;
        return;
    }

    notes.forEach(note => {
        const card = document.createElement('div');
        card.className = 'glass-card note-card';
        card.setAttribute('data-aos', 'fade-up');
        card.setAttribute('data-tilt', '');

        card.innerHTML = `
            <div class="note-tag">${note.tag}</div>
            <div class="note-subject-icon">📘</div>
            <h3>${note.title}</h3>
            <div class="note-meta">
                <span>📄 ${note.pages} Pages</span>
                <span>⏱️ ${note.readTime} read</span>
            </div>
            <div class="note-stats">
                <div class="stat">
                    <span class="stat-icon-label">👍</span>
                    <span class="stat-value">${formatNumber(note.likes)}</span>
                </div>
                <div class="stat">
                    <span class="stat-icon-label">👁️</span>
                    <span class="stat-value">${formatNumber(note.views)}</span>
                </div>
                <div class="stat">
                    <span class="stat-icon-label">⬇️</span>
                    <span class="stat-value">${formatNumber(note.downloads)}</span>
                </div>
            </div>
            <div class="note-actions">
                <button class="btn btn-primary" onclick="handleView('${note.id}')">View PDF</button>
                <button class="btn btn-ghost" onclick="handleDownload('${note.id}')">Download</button>
            </div>
        `;
        grid.appendChild(card);
    });

    // Re-initialize VanillaTilt for new elements
    if (window.VanillaTilt) {
        VanillaTilt.init(document.querySelectorAll("[data-tilt]"), {
            max: 15,
            speed: 400,
            glare: true,
            "max-glare": 0.2
        });
    }
}

// Helper: Format Numbers (e.g. 1200 -> 1.2k)
function formatNumber(num) {
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'k';
    }
    return num;
}

// Analytics Handlers
async function handleView(id) {
    console.log(`Viewing note: ${id}`);
    const note = notesData.find(n => n.id === id);
    if (note) {
        note.views++;
        renderNotes(notesData); // Local update

        // Real-time tracking (lazy import to wait for module system if needed)
        try {
            const { trackPageView } = await import('./stats.js');
            trackPageView();
        } catch (e) {
            console.error("Tracking failed", e);
        }
    }
}

async function handleDownload(id) {
    console.log(`Downloading note: ${id}`);
    const note = notesData.find(n => n.id === id);
    if (note) {
        note.downloads++;
        renderNotes(notesData); // Local update

        // Real-time tracking
        try {
            const { trackDownload } = await import('./stats.js');
            trackDownload();
        } catch (e) {
            console.error("Tracking failed", e);
        }
    }
}

// --- PAYMENT LOGIC ---
window.handlePayment = function () {
    alert("🚀 Redirecting to SKiL MATRiX Premium Gateway...\n\n(This makes a placeholder request as no Payment API Key was provided.)");
};

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
    // NOTE: This is UI-only. Security is handled by backend rules.
    const userRole = localStorage.getItem('user_role') || 'student';
    // If complex auth object is stored:
    // const user = JSON.parse(localStorage.getItem('auth_user') || '{}');
    // const role = user.role || 'student';

    let links = [];

    if (userRole === 'admin' || userRole === 'super_admin' || userRole === 'college_admin') {
        links = [
            { txt: 'Admin Console', url: 'pages/dashboard.html?tab=admin' },
            { txt: 'Manage Content', url: 'pages/dashboard.html?tab=verification' },
            { txt: 'System Status', url: '#' }
        ];
    } else if (userRole === 'uploader' || userRole === 'contributor') {
        links = [
            { txt: 'My Uploads', url: 'pages/dashboard.html?tab=profile' },
            { txt: 'Upload New Note', url: '#', onclick: "openUploadModal()" },
            { txt: 'Contributor Guidelines', url: '#' }
        ];
    } else {
        // Default: Student
        links = [
            { txt: 'Notes Hub', url: 'pages/notes.html' },
            { txt: 'AI Study Planner', url: 'pages/dashboard.html?tab=planner' },
            { txt: 'Exam Strategist', url: 'pages/dashboard.html?tab=ai-tools' }
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
