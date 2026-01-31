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
});

// Animate Stats Counters
function animateCounters() {
    const stats = [
        { id: 'stat-views', end: 1245670 },
        { id: 'stat-downloads', end: 85432 },
        { id: 'stat-active', end: 12890 }
    ];

    stats.forEach(stat => {
        const el = document.getElementById(stat.id);
        if (!el) return;

        let start = 0;
        const duration = 2000;
        const stepTime = 20;
        const totalSteps = duration / stepTime;
        const increment = stat.end / totalSteps;

        const timer = setInterval(() => {
            start += increment;
            if (start >= stat.end) {
                el.innerText = stat.end.toLocaleString();
                clearInterval(timer);
            } else {
                el.innerText = Math.floor(start).toLocaleString();
            }
        }, stepTime);
    });
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

// Filter Logic
function initFilters() {
    const collegeSelect = document.getElementById('college-select');
    const branchSelect = document.getElementById('branch-select');
    const semSelect = document.getElementById('sem-select');
    const subjectSelect = document.getElementById('subject-select');

    const updateFilters = () => {
        const filtered = notesData.filter(note => {
            return (collegeSelect.value === 'all' || note.college === collegeSelect.value) &&
                (branchSelect.value === 'all' || note.branch === branchSelect.value) &&
                (semSelect.value === 'all' || note.sem === semSelect.value);
        });

        // Sort by "Best for Exam" algorithm
        const sorted = filtered.sort((a, b) => calculateExamScore(b) - calculateExamScore(a));
        renderNotes(sorted);
    };

    [collegeSelect, branchSelect, semSelect].forEach(select => {
        select.addEventListener('change', updateFilters);
    });
}

// Algorithm: ExamScore = (views * 0.3) + (downloads * 0.5) + (likes * 0.2)
function calculateExamScore(note) {
    return (note.views * 0.3) + (note.downloads * 0.5) + (note.likes * 0.2);
}

// Render Notes to Grid
function renderNotes(notes) {
    const grid = document.getElementById('notes-grid');
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
            <span class="note-tag">${note.tag}</span>
            <h3>${note.title}</h3>
            <div class="note-stats">
                <div class="stat">👍 <span>${formatNumber(note.likes)}</span></div>
                <div class="stat">👁️ <span>${formatNumber(note.views)}</span></div>
                <div class="stat">⬇️ <span>${formatNumber(note.downloads)}</span></div>
            </div>
            <div class="note-meta">
                <span>📄 ${note.pages} Pages</span> | <span>⏱️ ${note.readTime} read</span>
            </div>
            <div class="note-actions">
                <button class="btn btn-primary" onclick="handleView('${note.id}')">View</button>
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

// Analytics Handlers (Mock)
function handleView(id) {
    console.log(`Viewing note: ${id}`);
    const note = notesData.find(n => n.id === id);
    if (note) {
        note.views++;
        renderNotes(notesData); // Re-render to show updated stats
    }
}

function handleDownload(id) {
    console.log(`Downloading note: ${id}`);
    const note = notesData.find(n => n.id === id);
    if (note) {
        note.downloads++;
        renderNotes(notesData);
    }
}
