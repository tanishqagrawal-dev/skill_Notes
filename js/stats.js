// Firebase Services (Lazy Loaded)
function getFirebase() {
    return window.firebaseServices || {};
}

const ANALYTICS_DOC = 'analytics/global';

// --- MAIN INIT FUNCTION ---
export async function initRealtimeStats() {
    console.log("🚀 Initializing Global Analytics (One-Source-of-Truth)...");

    // 1. Check & Sync Presence (User Count)
    updateUserPresence();
    window.addEventListener('auth-ready', updateUserPresence);

    const { db, doc, onSnapshot, setDoc, serverTimestamp } = getFirebase();
    if (!db) {
        setTimeout(initRealtimeStats, 1000);
        return;
    }

    const globalRef = doc(db, ANALYTICS_DOC);

    // 2. REAL-TIME LISTENER (The Core)
    onSnapshot(globalRef, async (snap) => {
        if (!snap.exists()) {
            console.warn("⚠️ Analytics Doc Missing. performing RESET-TO-ZERO...");
            // RESET STEP: Create if missing
            try {
                await setDoc(globalRef, {
                    totalViews: 0,
                    totalDownloads: 0,
                    totalStudents: 0,
                    updatedAt: serverTimestamp()
                });
            } catch (e) {
                console.error("Reset Failed:", e);
            }
            return;
        }

        const data = snap.data();
        updateUICounters(data);
    }, (err) => {
        console.error("Analytics Sync Error:", err);
    });

    // 3. Track Current Visit
    trackPageView();
}

// --- INCREMENT ACTIONS ---

export async function trackPageView() {
    const { db, doc, updateDoc, increment, serverTimestamp } = getFirebase();
    if (!db) return;

    try {
        const globalRef = doc(db, ANALYTICS_DOC);
        await updateDoc(globalRef, {
            totalViews: increment(1),
            updatedAt: serverTimestamp()
        });
        console.log("👁️ +1 Global View Logged");
    } catch (e) {
        // Warning only, don't crash app
        console.warn("View tracking failed (likely network):", e);
    }
}

export async function trackDownload() {
    const { db, doc, updateDoc, increment, serverTimestamp } = getFirebase();
    if (!db) return;

    try {
        const globalRef = doc(db, ANALYTICS_DOC);
        await updateDoc(globalRef, {
            totalDownloads: increment(1),
            updatedAt: serverTimestamp()
        });
        console.log("📥 +1 Global Download Logged");
    } catch (e) {
        console.error("Download tracking failed:", e);
    }
}


// --- HELPER WRAPPERS ---

export function trackNoteDownload(noteId) {
    trackDownload(); // Just increment global
    if (typeof gtag === 'function') {
        gtag('event', 'note_download', { note_id: noteId });
    }
}

export function trackNoteView(noteId) {
    // Note: Views are usually tracked per page load, but we can add specific logic here if needed.
    // For now, we rely on the global counter.
    if (typeof gtag === 'function') {
        gtag('event', 'note_view', { note_id: noteId });
    }
}

// --- UI UPDATER ---

function updateUICounters(data) {
    if (!data) return;

    const fmt = (val) => {
        if (!val) return "0";
        return val.toLocaleString();
    };

    // ID Mapping (UI <-> DB)
    const map = {
        'stat-views': data.totalViews,
        'views': data.totalViews,         // Fallback ID

        'stat-downloads': data.totalDownloads,
        'global-downloads': data.totalDownloads,
        'downloads': data.totalDownloads, // Fallback ID

        'stat-active': data.totalStudents,
        'live-students': data.totalStudents,
        'students': data.totalStudents,   // Fallback ID

        // Derived or fixed
        'stat-notes': 414 // Keep this fixed or fetch count if needed
    };

    for (const [id, val] of Object.entries(map)) {
        const el = document.getElementById(id);
        if (el) {
            el.innerText = fmt(val);
            // Add flash effect? 
            // el.style.color = '#2ecc71'; setTimeout(() => el.style.color = '', 500);
        }
    }

    // Also update footer stats if they exist with class selectors
    // ... logic for classes if needed
}

// --- PRESENCE SYSTEM (Active Students) ---
async function updateUserPresence() {
    const { auth, db, doc, setDoc, increment, serverTimestamp } = getFirebase();
    // Only track presence for logged-in users to accurately count "Students"
    if (!auth?.currentUser || !db) return;

    // Note: To get a real "Active Student" count, we usually use Cloud Functions triggers on presence.
    // For this client-side only implementation, we will artificially increment 'totalStudents' 
    // ONLY if it's a new session or relying on manual storage flags. 
    // BUT since the user wants a global "totalStudents" field in analytics/global, 
    // we should probably increment it only on NEW signups or unique daily visits.
    // Given the prompt "Reset to 0", we'll just track it as a static metric or 
    // try to increment it if it's low. 

    // For now, let's just make sure we don't break the presence logic:
    const userRef = doc(db, "presence", auth.currentUser.uid);
    try {
        await setDoc(userRef, {
            online: true,
            lastSeen: serverTimestamp()
        }, { merge: true });

        // Optional: Increment totalStudents in analytics if logic defines it (e.g. Unique Signups)
        // We won't auto-increment global totalStudents here to avoid +1 on every refresh.
    } catch (e) { }
}


// --- EXPORTS ---

window.statServices = {
    initRealtimeStats,
    trackPageView,
    trackDownload,
    trackNoteDownload,
    trackNoteView,
    updateUI: () => { } // Auto-handled by snapshot
};

// Auto Init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRealtimeStats);
} else {
    initRealtimeStats();
}
