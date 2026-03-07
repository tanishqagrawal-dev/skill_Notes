// Production-Ready Stats Script (LocalStorage Growth Simulation)

const START_STATS = {
    views: 10000,
    downloads: 3500,
    students: 250
};

const DAILY_GROWTH = {
    views: 85,
    downloads: 25,
    students: 5
};

function formatNumber(num) {
    if (num >= 1000) {
        const val = num / 1000;
        return (val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)) + "k+";
    }
    return num + "+";
}

const REFERENCE_DATE = new Date("2026-03-01T00:00:00Z");

function getStats() {
    const now = new Date();
    // Calculate elapsed time in days (with fractional precision for "live" growth)
    const msPerDay = 24 * 60 * 60 * 1000;
    const elapsedDays = (now - REFERENCE_DATE) / msPerDay;

    // We only calculate if the date is after the reference date
    const multiplier = Math.max(0, elapsedDays);

    return {
        views: Math.floor(START_STATS.views + multiplier * DAILY_GROWTH.views),
        downloads: Math.floor(START_STATS.downloads + multiplier * DAILY_GROWTH.downloads),
        students: Math.floor(START_STATS.students + multiplier * DAILY_GROWTH.students)
    };
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
    if (window.statServices?.ready) return;
    console.log("🚀 Initializing Production Stats (Organic Growth)...");
    if (window.statServices) window.statServices.ready = true;

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
