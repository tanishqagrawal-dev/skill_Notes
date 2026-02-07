import { db, doc, onSnapshot, increment, updateDoc, serverTimestamp } from './firebase-config.js';

const ANALYTICS_DOC = 'analytics/global';

export function initGlobalAnalytics() {
    const ref = doc(db, ANALYTICS_DOC);

    onSnapshot(ref, (snap) => {
        if (!snap.exists()) return;
        const d = snap.data();

        // Update UI everywhere
        const viewsEl = document.getElementById("views");
        const downloadsEl = document.getElementById("downloads");

        if (viewsEl) viewsEl.innerText = d.totalViews || 0;
        if (downloadsEl) downloadsEl.innerText = d.totalDownloads || 0;
    });

    // Page View Increment
    incrementViews();
}

export async function incrementViews() {
    const ref = doc(db, ANALYTICS_DOC);
    try {
        await updateDoc(ref, {
            totalViews: increment(1),
            updatedAt: serverTimestamp()
        });
    } catch (e) {
        console.warn("View tracking failed:", e);
    }
}

export async function incrementDownloads() {
    const ref = doc(db, ANALYTICS_DOC);
    try {
        await updateDoc(ref, {
            totalDownloads: increment(1),
            updatedAt: serverTimestamp()
        });
    } catch (e) {
        console.warn("Download tracking failed:", e);
    }
}
