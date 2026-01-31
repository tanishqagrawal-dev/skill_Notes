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

/**
 * Initializes the statistics document in Firestore if it doesn't exist.
 * Then starts a real-time listener to update the UI counters.
 */
export async function initRealtimeStats() {
    console.log("🚀 Initializing Real-time Stats...");
    const statsRef = doc(db, STATS_DOC_PATH);

    try {
        const docSnap = await getDoc(statsRef);

        // If document doesn't exist, OR if it contains the old test dummy data, reset to zero
        if (!docSnap.exists() || docSnap.data().views === 1210000) {
            await setDoc(statsRef, {
                views: 0,
                downloads: 0,
                students: 0
            });
            console.log("📊 Production stats initialized at zero.");
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

        // Also track a page view
        trackPageView();

        // Periodically check student count
        updateStudentCount();

    } catch (error) {
        console.error("❌ Error initializing stats:", error);
    }
}

/**
 * Increments the view counter in Firestore and logs to GA4.
 */
export async function trackPageView() {
    console.log("📈 Tracking Page View...");
    const statsRef = doc(db, STATS_DOC_PATH);
    try {
        await updateDoc(statsRef, {
            views: increment(1)
        });
        logEvent(analytics, 'page_view_increment');
    } catch (error) {
        console.warn("⚠️ Could not increment page views:", error);
    }
}

/**
 * Increments the download counter in Firestore and logs to GA4.
 */
export async function trackDownload() {
    console.log("📥 Tracking Download...");
    const statsRef = doc(db, STATS_DOC_PATH);
    try {
        await updateDoc(statsRef, {
            downloads: increment(1)
        });
        logEvent(analytics, 'file_download_increment');
    } catch (error) {
        console.warn("⚠️ Could not increment downloads:", error);
    }
}

/**
 * Updates UI elements based on Firestore data.
 */
function updateUICounters(data) {
    // 1. Update items in the Hero section (stat-item class)
    document.querySelectorAll('.stat-item').forEach(item => {
        const valEl = item.querySelector('.stat-val');
        const labelEl = item.querySelector('.stat-label');
        if (!labelEl || !valEl) return;

        const label = labelEl.innerText.toLowerCase();

        if (label.includes('views')) valEl.innerText = formatStatValue(data.views);
        if (label.includes('downloads')) valEl.innerText = formatStatValue(data.downloads);
        if (label.includes('students')) valEl.innerText = formatStatValue(data.students);
    });

    // 2. Update items in the Live Stats section (by explicit IDs)
    const elViews = document.getElementById('stat-views');
    const elDownloads = document.getElementById('stat-downloads') || document.getElementById('global-downloads');
    const elActive = document.getElementById('stat-active') || document.getElementById('live-students');

    if (elViews) elViews.innerText = (data.views || 0).toLocaleString();
    if (elDownloads) elDownloads.innerText = (data.downloads || 0).toLocaleString();
    if (elActive) elActive.innerText = (data.students || 0).toLocaleString();
}

/**
 * Attempts to count documents in the 'users' collection to update student count.
 */
async function updateStudentCount() {
    try {
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);
        const count = snapshot.size;

        if (count > 0) {
            console.log(`👨‍🎓 Total students found: ${count}`);
            const statsRef = doc(db, STATS_DOC_PATH);
            await updateDoc(statsRef, {
                students: count
            });
        }
    } catch (error) {
        // Silently fail if 'users' collection or permissions are missing
    }
}

// Expose to window for non-module scripts
window.statServices = {
    initRealtimeStats,
    trackPageView,
    trackDownload
};

// Auto-init if on dashboard or notes hub
if (document.querySelector('.dashboard-body') || document.querySelector('.notes-page-container')) {
    setTimeout(initRealtimeStats, 1000); // Small delay to ensure Firebase is ready
}

/**
 * Helper to format numbers like 1.2M+ or 85K+
 */
function formatStatValue(num) {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M+';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K+';
    return num.toString();
}
