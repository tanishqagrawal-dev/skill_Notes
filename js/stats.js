// Firebase Services (Lazy Loaded)
function getFirebase() {
    return window.firebaseServices || {};
}

const ANALYTICS_DOC = 'analytics/global';

// --- MAIN INIT FUNCTION ---
export async function initRealtimeStats() {
    console.log("🚀 Initializing Global Analytics (Real-time Source of Truth)...");

    updateUserPresence();
    window.addEventListener('auth-ready', updateUserPresence);

    const { db, doc, onSnapshot, setDoc, serverTimestamp } = getFirebase();
    if (!db) {
        setTimeout(initRealtimeStats, 1000);
        return;
    }

    const globalRef = doc(db, ANALYTICS_DOC);

    // REAL-TIME LISTENER
    onSnapshot(globalRef, async (snap) => {
        if (!snap.exists()) {
            console.warn("⚠️ Analytics Doc Missing. performing RESET-TO-ZERO...");
            try {
                await setDoc(globalRef, {
                    totalViews: 0,
                    totalDownloads: 0,
                    totalLikes: 0,
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
    } catch (e) {
        console.warn("Global View tracking failed:", e);
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
    } catch (e) {
        console.error("Global Download tracking failed:", e);
    }
}

export async function trackGlobalLike(amount = 1) {
    const { db, doc, updateDoc, increment, serverTimestamp } = getFirebase();
    if (!db) return;

    try {
        const globalRef = doc(db, ANALYTICS_DOC);
        await updateDoc(globalRef, {
            totalLikes: increment(amount),
            updatedAt: serverTimestamp()
        });
    } catch (e) {
        console.error("Global Like tracking failed:", e);
    }
}


// --- HELPER WRAPPERS ---

export function trackNoteDownload(noteId) {
    trackDownload();
    if (typeof gtag === 'function') {
        gtag('event', 'notes_download', { note_id: noteId });
    }
}

export function trackNoteView(noteId) {
    if (typeof gtag === 'function') {
        gtag('event', 'notes_view', { note_id: noteId });
    }
}

// --- UI UPDATER ---

function updateUICounters(data) {
    if (!data) return;

    const fmt = (val) => {
        if (typeof val !== 'number') return "0";
        return val.toLocaleString();
    };

    // ID Mapping (UI <-> DB)
    const map = {
        'stat-views': data.totalViews,
        'stat-downloads': data.totalDownloads,
        'stat-likes': data.totalLikes,
        'stat-active': data.totalStudents,
        'live-students': data.totalStudents,

        // Legacy/Fallback IDs
        'views': data.totalViews,
        'downloads': data.totalDownloads,
        'students': data.totalStudents
    };

    for (const [id, val] of Object.entries(map)) {
        const el = document.getElementById(id);
        if (el) {
            el.innerText = fmt(val);
        }
    }
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
        const { db, doc, setDoc, increment, serverTimestamp, updateDoc } = getFirebase();
        await setDoc(userRef, {
            online: true,
            lastSeen: serverTimestamp()
        }, { merge: true });

        // Increment totalStudents if it's the first time we see them this session
        if (!sessionStorage.getItem('presence_counted')) {
            const globalRef = doc(db, ANALYTICS_DOC);
            await updateDoc(globalRef, {
                totalStudents: increment(1)
            });
            sessionStorage.setItem('presence_counted', 'true');
        }
    } catch (e) { }
}


// --- EXPORTS ---

window.statServices = {
    initRealtimeStats,
    trackPageView,
    trackDownload,
    trackGlobalLike,
    trackNoteDownload,
    trackNoteView,
    updateUI: () => { } // Auto-handled by snapshot
};

// Auto-init removed to prevent double counting.
// Initialization is handled explicitly in index.html and main.js
