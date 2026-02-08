/**
 * note-actions.js
 * Shared interaction logic for both Dashboard and Notes Hub
 */

// Helper to get Firebase services safely
function getFirebase() {
    return window.firebaseServices || {};
}

// Global store for unsubscribers to prevent memory leaks
window.noteUnsubscribers = window.noteUnsubscribers || {};

window.incrementNoteView = async function (noteId) {
    const { db, doc, updateDoc, increment } = getFirebase();
    if (!db || !noteId) return;

    // session-based unique view check
    const sessionKey = `viewed_${noteId}`;
    if (sessionStorage.getItem(sessionKey)) return;

    try {
        const noteRef = doc(db, "notes", noteId);
        await updateDoc(noteRef, { views: increment(1) });

        // XP Logic for uploader and viewer
        if (window.currentUser && window.currentUser.id) {
            const userRef = doc(db, "users", window.currentUser.id);
            await updateDoc(userRef, { views_activity: increment(1) });
        }

        sessionStorage.setItem(sessionKey, 'true');
    } catch (e) {
        console.warn("View increment failed:", e);
    }
};

window.toggleNoteLike = async function (noteId) {
    const { db, auth, doc, runTransaction, increment } = getFirebase();
    if (!db || !noteId) return;

    const user = auth?.currentUser || window.currentUser;
    if (!user) {
        if (typeof showToast === 'function') showToast("Please login to like", "info");
        return;
    }

    try {
        const noteRef = doc(db, "notes", noteId);
        const likeRef = doc(db, "notes", noteId, "likes", user.uid || user.id);

        await runTransaction(db, async (transaction) => {
            const likeSnap = await transaction.get(likeRef);

            if (!likeSnap.exists()) {
                transaction.set(likeRef, { liked: true, timestamp: Date.now() });
                transaction.update(noteRef, { likes: increment(1) });
                if (typeof showToast === 'function') showToast("Added to your favorites ❤️");
            } else {
                transaction.delete(likeRef);
                transaction.update(noteRef, { likes: increment(-1) });
                if (typeof showToast === 'function') showToast("Removed from favorites");
            }
        });
    } catch (e) {
        console.error("Like system error:", e);
    }
};

window.updateNoteStat = async function (noteId, type) {
    const { db, doc, updateDoc, increment } = getFirebase();
    if (!db || !noteId) return;

    try {
        const noteRef = doc(db, "notes", noteId);
        if (type === 'download') {
            await updateDoc(noteRef, { downloads: increment(1) });

            if (window.currentUser && window.currentUser.id) {
                const userRef = doc(db, "users", window.currentUser.id);
                await updateDoc(userRef, { xp: increment(5), downloads: increment(1) });
            }
        }
    } catch (e) {
        console.warn("Stat update failed:", e);
    }
};

/**
 * Attaches real-time listeners to note cards in the current view
 * Each note card MUST have data-note-id active.
 */
window.attachNoteRealtimeListeners = function (containerId = 'tab-content') {
    const { db, doc, onSnapshot } = getFirebase();
    if (!db) return;

    const container = document.getElementById(containerId) || document.body;
    const cards = container.querySelectorAll('.note-card[data-note-id]');

    // Clear old listeners if needed (optional based on app structure)
    // for(let id in window.noteUnsubscribers) window.noteUnsubscribers[id]();

    cards.forEach(card => {
        const noteId = card.getAttribute('data-note-id');
        if (!noteId) return;

        // Clean up old listener if exists (to handle re-renders)
        if (window.noteUnsubscribers[noteId]) {
            try { window.noteUnsubscribers[noteId](); } catch (e) { }
            delete window.noteUnsubscribers[noteId];
        }

        const noteRef = doc(db, "notes", noteId);

        window.noteUnsubscribers[noteId] = onSnapshot(noteRef, (snap) => {
            if (!snap.exists()) return;
            const data = snap.data();

            // Sync Views
            const viewEl = card.querySelector('.views .count');
            if (viewEl) viewEl.innerText = data.views || 0;

            // Sync Likes
            const likeEl = card.querySelector('.like-btn .count');
            if (likeEl) likeEl.innerText = data.likes || 0;

            // Sync Downloads (if UI shows it)
            const downEl = card.querySelector('.downloads-count');
            if (downEl) downEl.innerText = data.downloads || 0;

            // console.log(`📡 Real-time sync: Note ${noteId}`);
        }, (err) => console.warn(`Listener error for ${noteId}:`, err));
    });
};
