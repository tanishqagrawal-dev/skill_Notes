// Refactored to use lazy-loaded Firebase Services
function getFirebase() {
    return window.firebaseServices || {};
}

const STATS_DOC_PATH = 'stats/global';
let lastStatsData = null;

export async function initRealtimeStats() {
    console.log("🚀 Initializing Real-time Stats...");

    // 0. Load from Cache IMMEDIATELY
    const cached = localStorage.getItem('global_stats_cache');
    if (cached) {
        try {
            lastStatsData = JSON.parse(cached);
            updateUICounters(lastStatsData);
        } catch (e) { }
    }

    // Lazy load services
    const { db, doc, onSnapshot } = getFirebase();
    if (!db) {
        console.warn("⚠️ Firestore not ready for stats yet. Retrying shortly...");
        setTimeout(initRealtimeStats, 2000);
        return;
    }

    const statsRef = doc(db, STATS_DOC_PATH);

    try {
        onSnapshot(statsRef, (snapshot) => {
            if (snapshot.exists()) {
                lastStatsData = snapshot.data();
                localStorage.setItem('global_stats_cache', JSON.stringify(lastStatsData));
                updateUICounters(lastStatsData);
            }
        }, (error) => {
            console.error("❌ Firestore Snapshot Error:", error);
        });

        trackPageView();

    } catch (error) {
        console.error("❌ Error initializing stats logic:", error);
    }
}

export async function trackPageView() {
    const { db, doc, updateDoc, increment, analytics, logEvent } = getFirebase();
    if (!db) return;

    const statsRef = doc(db, STATS_DOC_PATH);
    try {
        await updateDoc(statsRef, {
            views: increment(1)
        });
        if (analytics && logEvent) logEvent(analytics, 'page_view_increment');
    } catch (error) {
        console.warn("⚠️ View increment skipped");
    }
}

async function refreshLiveCounts() {
    const { db, collection, getDocs, updateDoc, doc } = getFirebase();
    if (!db) return;

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

export async function trackDownload() {
    const { db, doc, updateDoc, increment, analytics, logEvent } = getFirebase();
    if (!db) return;

    const statsRef = doc(db, STATS_DOC_PATH);
    try {
        await updateDoc(statsRef, {
            downloads: increment(1)
        });
        if (analytics && logEvent) logEvent(analytics, 'file_download_increment');
    } catch (error) {
        console.warn("⚠️ Download increment skipped");
    }
}

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

export function trackNoteView(noteId, collegeName, subjectName) {
    if (typeof gtag === 'function') {
        gtag('event', 'note_view', {
            note_id: noteId,
            college: collegeName,
            subject: subjectName
        });
        console.log(`📊 GA4 Note View tracked: ${noteId}`);
    }
    trackPageView();
}

export function trackNoteDownload(noteId, fileType = 'pdf') {
    if (typeof gtag === 'function') {
        gtag('event', 'note_download', {
            note_id: noteId,
            file_type: fileType
        });
        console.log(`📊 GA4 Note Download tracked: ${noteId}`);
    }
    trackDownload();
}

export function trackSignUp(method = 'email') {
    if (typeof gtag === 'function') {
        gtag('event', 'sign_up', {
            method: method
        });
        console.log("📊 GA4 Sign-up tracked.");
    }
}

export function trackNoteUpload(collegeName) {
    if (typeof gtag === 'function') {
        gtag('event', 'note_upload', {
            college: collegeName
        });
        console.log("📊 GA4 Note Upload tracked.");
    }
}

function updateUICounters(data) {
    const stats = data || lastStatsData || { views: 0, downloads: 0, students: 0, notes: 0 };
    lastStatsData = stats;

    const fmt = (val) => formatStatValue(val);

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

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initRealtimeStats, 1000); // Delayed slightly more to allow delayed firebase init
        trackGA4PageView();
    });
} else {
    setTimeout(initRealtimeStats, 1000);
    trackGA4PageView();
}
