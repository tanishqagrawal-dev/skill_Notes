import { db, analytics } from './firebase-config.js';
import {
    doc,
    setDoc,
    onSnapshot,
    increment,
    updateDoc,
    getDoc,
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { logEvent } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";

const STATS_DOC_PATH = 'stats/global';
let lastStatsData = null;

/**
 * Initializes the statistics document in Firestore if it doesn't exist.
 * Then starts a real-time listener to update the UI counters.
 */
export async function initRealtimeStats() {
    console.log("🚀 Initializing Real-time Stats...");
    const statsRef = doc(db, STATS_DOC_PATH);

    try {
        const docSnap = await getDoc(statsRef);

        // If document doesn't exist, OR if it contains the old test dummy data, reset to production start
        if (!docSnap.exists() || docSnap.data().views === 1210000) {
            await setDoc(statsRef, {
                views: 5, // Start with small numbers for realism
                downloads: 2,
                students: 0,
                notes: 0
            });
            console.log("📊 Production stats initialized.");
        }

        // Real-time listener
        onSnapshot(statsRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                console.log("📡 Received real-time stats update:", data);
                updateUICounters(data);
            }
        }, (error) => {
            console.error("❌ Firestore Snapshot Error:", error);
        });

        // Track a page view
        trackPageView();

        // Periodically refresh collection counts
        refreshLiveCounts();

    } catch (error) {
        console.error("❌ Error initializing stats:", error);
    }
}

/**
 * Syncs student and note counts from their respective collections.
 */
async function refreshLiveCounts() {
    try {
        // 1. Sync Students (Users)
        const usersRef = collection(db, 'users');
        const userSnap = await getDocs(usersRef);
        const userCount = userSnap.size;

        // 2. Sync Notes
        const notesRef = collection(db, 'notes_approved');
        const notesSnap = await getDocs(notesRef);
        const notesCount = notesSnap.size;

        const statsRef = doc(db, STATS_DOC_PATH);
        await updateDoc(statsRef, {
            students: userCount,
            notes: notesCount
        });

        console.log(`📈 Synced live counts: ${userCount} students, ${notesCount} notes.`);
    } catch (error) {
        console.warn("⚠️ Counter sync failed:", error);
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
        logEvent(analytics, 'page_view_increment');
    } catch (error) {
        console.warn("⚠️ View tracking failed.");
    }
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
        logEvent(analytics, 'file_download_increment');
    } catch (error) {
        console.warn("⚠️ Download tracking failed.");
    }
}

/**
 * Updates UI elements based on Firestore data.
 */
function updateUICounters(data) {
    if (data) lastStatsData = data;
    const stats = data || lastStatsData;
    if (!stats) return;

    // 1. Update Hero section & Global stat blocks
    document.querySelectorAll('.stat-item, .footer-stats-block').forEach(item => {
        const valEl = item.querySelector('.stat-val, #stat-views, #stat-downloads, #stat-active');
        const labelEl = item.querySelector('.stat-label');
        if (!valEl) return;

        // Use ID for specific targeting if available
        if (valEl.id === 'stat-views') { valEl.innerText = formatStatValue(stats.views, true); return; }
        if (valEl.id === 'stat-downloads') { valEl.innerText = formatStatValue(stats.downloads, true); return; }
        if (valEl.id === 'stat-active' || (labelEl && labelEl.innerText.toLowerCase().includes('student'))) {
            valEl.innerText = formatStatValue(stats.students, true);
            return;
        }

        // Otherwise target by label text
        if (!labelEl) return;
        const label = labelEl.innerText.toLowerCase();
        if (label.includes('view')) valEl.innerText = formatStatValue(stats.views, true);
        if (label.includes('download')) valEl.innerText = formatStatValue(stats.downloads, true);
        if (label.includes('student')) valEl.innerText = formatStatValue(stats.students, true);
        if (label.includes('note')) valEl.innerText = formatStatValue(stats.notes, true);
    });

    // 2. Specific IDs (Fallback/Direct)
    const elViews = document.getElementById('stat-views');
    const elDownloads = document.getElementById('stat-downloads') || document.getElementById('global-downloads');
    const elActive = document.getElementById('stat-active') || document.getElementById('live-students');
    const elNotes = document.getElementById('stat-notes');

    if (elViews) elViews.innerText = formatStatValue(stats.views, true);
    if (elDownloads) elDownloads.innerText = formatStatValue(stats.downloads, true);
    if (elActive) elActive.innerText = formatStatValue(stats.students, true);
    if (elNotes) elNotes.innerText = formatStatValue(stats.notes, true);
}

/**
 * Helper to format numbers with smart thresholds (50+, 100+, 1.2M+, etc.)
 */
function formatStatValue(num, usePlus = true) {
    if (!num || num < 1) return '0';

    // Requirements: 50+, 100+, 150+ logic for smaller numbers
    if (num < 1000) {
        if (num >= 50) {
            // Floor to nearest 50
            const floored = Math.floor(num / 50) * 50;
            return floored + (usePlus ? '+' : '');
        }
        return num.toString();
    }

    // K+ logic for medium numbers (1000 to 1M)
    if (num < 1000000) {
        return (num / 1000).toFixed(1) + 'K' + (usePlus ? '+' : '');
    }

    // M+ logic for large numbers
    return (num / 1000000).toFixed(1) + 'M' + (usePlus ? '+' : '');
}

// Expose to window for non-module scripts
window.statServices = {
    initRealtimeStats,
    trackPageView,
    trackDownload,
    updateUI: updateUICounters
};

// Automatic initialization
setTimeout(initRealtimeStats, 500); 
