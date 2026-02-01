import { db, analytics, logEvent } from './firebase-config.js';
import {
    doc,
    setDoc,
    onSnapshot,
    increment,
    updateDoc,
    getDoc,
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


const STATS_DOC_PATH = 'stats/global';
let lastStatsData = null;

/**
 * Initializes the statistics document in Firestore.
 * Starts a real-time listener to update UI counters.
 * Uses localStorage for instant initial display on reload.
 */
export async function initRealtimeStats() {
    console.log("🚀 Initializing Real-time Stats...");

    // 0. Load from Cache IMMEDIATELY for zero-latency reload
    const cached = localStorage.getItem('global_stats_cache');
    if (cached) {
        try {
            lastStatsData = JSON.parse(cached);
            updateUICounters(lastStatsData);
        } catch (e) { }
    }

    const statsRef = doc(db, STATS_DOC_PATH);

    try {
        onSnapshot(statsRef, (doc) => {
            if (doc.exists()) {
                lastStatsData = doc.data();
                localStorage.setItem('global_stats_cache', JSON.stringify(lastStatsData));
                console.log("📡 Received real-time stats update:", lastStatsData);
                updateUICounters(lastStatsData);
            }
        }, (error) => {
            console.error("❌ Firestore Snapshot Error:", error);
        });

        // 2. Track a page view (Non-blocking)
        trackPageView();

        // 4. Update counts (Only run background sync if specifically requested or for admins)
        // refreshLiveCounts(); 

    } catch (error) {
        console.error("❌ Error initializing stats logic:", error);
    }
}

/**
 * Increments the view counter in Firestore.
 */
export async function trackPageView() {
    const statsRef = doc(db, STATS_DOC_PATH);
    try {
        await updateDoc(statsRef, {
            views: increment(1)
        });
        if (analytics) logEvent(analytics, 'page_view_increment');
    } catch (error) {
        console.warn("⚠️ View increment skipped");
    }
}

/**
 * Syncs student and note counts.
 */
async function refreshLiveCounts() {
    try {
        const usersRef = collection(db, 'users');
        const notesRef = collection(db, 'notes_approved');

        const [userSnap, notesSnap] = await Promise.all([
            getDocs(usersRef).catch(() => null),
            getDocs(notesRef).catch(() => null)
        ]);

        if (userSnap && notesSnap) {
            const statsRef = doc(db, STATS_DOC_PATH);
            await updateDoc(statsRef, {
                students: userSnap.size,
                notes: notesSnap.size
            });
            console.log("📈 Collection counts synced.");
        }
    } catch (error) { }
}

/**
 * Increments the download counter in Firestore.
 */
export async function trackDownload() {
    const statsRef = doc(db, STATS_DOC_PATH);
    try {
        await updateDoc(statsRef, {
            downloads: increment(1)
        });
        if (analytics) logEvent(analytics, 'file_download_increment');
    } catch (error) {
        console.warn("⚠️ Download increment skipped");
    }
}

/**
 * REFINED TRACKING FUNCTIONS (GA4 + Firebase)
 */

/**
 * Tracks a page view manually (for SPAs / Tab switching)
 */
export function trackGA4PageView(title = document.title, path = window.location.pathname) {
    if (typeof gtag === 'function') {
        gtag('event', 'page_view', {
            page_title: title,
            page_location: window.location.href,
            page_path: path
        });
        console.log(`📊 GA4 Page View tracked: ${path}`);
    }
}

/**
 * Tracks a Note View event
 */
export function trackNoteView(noteId, collegeName, subjectName) {
    if (typeof gtag === 'function') {
        gtag('event', 'note_view', {
            note_id: noteId,
            college: collegeName,
            subject: subjectName
        });
        console.log(`📊 GA4 Note View tracked: ${noteId}`);
    }
    // Also increment Firestore view counter
    trackPageView();
}

/**
 * Tracks a Note Download event
 */
export function trackNoteDownload(noteId, fileType = 'pdf') {
    if (typeof gtag === 'function') {
        gtag('event', 'note_download', {
            note_id: noteId,
            file_type: fileType
        });
        console.log(`📊 GA4 Note Download tracked: ${noteId}`);
    }
    // Also increment Firestore download counter
    trackDownload();
}

/**
 * Tracks User Sign-up
 */
export function trackSignUp(method = 'email') {
    if (typeof gtag === 'function') {
        gtag('event', 'sign_up', {
            method: method
        });
        console.log("📊 GA4 Sign-up tracked.");
    }
}

/**
 * Tracks Note Upload
 */
export function trackNoteUpload(collegeName) {
    if (typeof gtag === 'function') {
        gtag('event', 'note_upload', {
            college: collegeName
        });
        console.log("📊 GA4 Note Upload tracked.");
    }
}

/**
 * Updates ALL UI elements matching stat keywords.
 */
function updateUICounters(data) {
    // defaults if data is missing
    const stats = data || lastStatsData || { views: 0, downloads: 0, students: 0, notes: 0 };
    lastStatsData = stats;

    const fmt = (val) => formatStatValue(val);

    // 1. Target specifically by ID
    const mapping = {
        'stat-views': stats.views,
        'stat-downloads': stats.downloads,
        'global-downloads': stats.downloads,
        'stat-active': stats.students,
        'live-students': stats.students,
        'stat-notes': stats.notes
    };

    for (const [id, value] of Object.entries(mapping)) {
        const el = document.getElementById(id);
        if (el) el.innerText = fmt(value);
    }

    // 2. Target by class AND container context
    const containers = document.querySelectorAll('.stat-item, .stat-box, .footer-stats-block');
    containers.forEach(container => {
        const valEl = container.querySelector('.stat-val, h3, .value, span, b');
        const labelEl = container.querySelector('.stat-label, p, .label');
        if (!valEl || !labelEl) return;

        const label = labelEl.innerText.toLowerCase();
        if (label.includes('view')) valEl.innerText = fmt(stats.views);
        else if (label.includes('download')) valEl.innerText = fmt(stats.downloads);
        else if (label.includes('student')) valEl.innerText = fmt(stats.students);
        else if (label.includes('note')) valEl.innerText = fmt(stats.notes);
    });
}

function formatStatValue(num, usePlus = true) {
    if (!num || num < 1) return '0';
    if (num < 1000) {
        if (num >= 50) {
            const floored = Math.floor(num / 50) * 50;
            return floored + (usePlus ? '+' : '');
        }
        return num.toString();
    }
    if (num < 1000000) return (num / 1000).toFixed(1) + 'K' + (usePlus ? '+' : '');
    return (num / 1000000).toFixed(1) + 'M' + (usePlus ? '+' : '');
}

export { formatStatValue };

window.statServices = {
    initRealtimeStats,
    trackPageView,
    trackDownload,
    trackGA4PageView,
    trackNoteView,
    trackNoteDownload,
    trackSignUp,
    trackNoteUpload,
    updateUI: () => updateUICounters(lastStatsData)
};

// Start logic
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initRealtimeStats, 500);
        trackGA4PageView(); // Initial page load track
    });
} else {
    setTimeout(initRealtimeStats, 500);
    trackGA4PageView();
}
