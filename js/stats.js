// Production-Ready Stats Script (LocalStorage Growth Simulation)

const START_STATS = {
    views: 1500,
    downloads: 200,
    students: 45
};

const DAILY_GROWTH = {
    views: 30,
    downloads: 10,
    students: 2
};

function formatNumber(num) {
    if (num >= 1000) return (num / 1000).toFixed(1) + "K+";
    return num + "+";
}

function getStats() {
    const today = new Date().toDateString();
    let data = JSON.parse(localStorage.getItem("skillMatrixStats"));

    if (!data) {
        data = {
            date: today,
            ...START_STATS
        };
    }

    if (data.date !== today) {
        data.date = today;
        data.views += DAILY_GROWTH.views;
        data.downloads += DAILY_GROWTH.downloads;
        data.students += DAILY_GROWTH.students;
    }

    localStorage.setItem("skillMatrixStats", JSON.stringify(data));
    return data;
}

function countUp(id, target) {
    let el = document.getElementById(id);
    if (!el) return;

    let current = 0;
    let step = Math.ceil(target / 80);

    const timer = setInterval(() => {
        current += step;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        el.innerText = formatNumber(current);
    }, 20);
}

// --- MAIN INIT FUNCTION ---
export async function initRealtimeStats() {
    console.log("🚀 Initializing Production Stats (Organic Growth)...");

    const stats = getStats();

    // Map the stats to all possible UI element IDs used across the site
    const idMap = {
        'stat-views': stats.views,
        'stat-downloads': stats.downloads,
        'stat-active': stats.students,
        'stat-notes': 120,
        'liveStudents': stats.students,
        'globalDownloads': stats.downloads,
        'trendingNow': 12,
        'views': stats.views,
        'downloads': stats.downloads,
        'students': stats.students
    };

    for (const [id, value] of Object.entries(idMap)) {
        countUp(id, value);
    }
}

// --- BACKWARD COMPATIBILITY STUBS ---
// These ensure that existing calls in main.js and other files don't break.

export function trackPageView() {
    // Simulated: Logic could increment localStorage views if desired, 
    // but the user wants linear growth based on daily visits.
}

export function trackDownload() {
    // Optional: Increment local counter per-session
}

export function trackGlobalLike(amount = 1) {
    // No-op or handle via separate local storage key if persistent likes are needed
}

export function trackNoteDownload(noteId) {
    if (typeof gtag === 'function') {
        gtag('event', 'notes_download', { note_id: noteId });
    }
}

export function trackNoteView(noteId) {
    if (typeof gtag === 'function') {
        gtag('event', 'notes_view', { note_id: noteId });
    }
}

window.statServices = {
    initRealtimeStats,
    trackPageView,
    trackDownload,
    trackGlobalLike,
    trackNoteDownload,
    trackNoteView,
    updateUI: () => { }
};
