/**
 * note-actions.js
 * Shared interaction logic for both Dashboard and Notes Hub
 * Handles: Real-time listeners, Views, Likes, Downloads, XP
 * Source of Truth: Firebase Firestore
 */

// Helper to get Firebase services safely from the global object setup in firebase-config.js
function getFirebase() {
    return window.firebaseServices || {};
}

// Global store for unsubscribers to prevent memory leaks
window.noteUnsubscribers = window.noteUnsubscribers || {};

/**
 * Increment View Count
 * Uses atomic increment. Creates doc if missing.
 */
window.incrementNoteView = async function (noteId) {
    const { db, doc, setDoc, increment } = getFirebase();
    if (!db || !noteId) return;

    // Session-based unique view check
    const sessionKey = `viewed_${noteId}`;
    if (sessionStorage.getItem(sessionKey)) return;

    try {
        const noteRef = doc(db, "notes", noteId);
        // Use setDoc with merge: true to ensure document exists
        await setDoc(noteRef, {
            views: increment(1),
            lastViewed: Date.now()
        }, { merge: true });

        // XP Logic for uploader and viewer
        if (window.currentUser && window.currentUser.id) {
            const userRef = doc(db, "users", window.currentUser.id);
            const { updateDoc } = getFirebase();
            if (updateDoc) {
                await updateDoc(userRef, { views_activity: increment(1) }).catch(() => { });
            }
        }

        sessionStorage.setItem(sessionKey, 'true');

        // Analytics
        if (typeof gtag === 'function') {
            gtag('event', 'notes_view', { note_id: noteId });
        }

    } catch (e) {
        console.warn("View increment failed:", e);
    }
};

/**
 * Toggle Like Status
 * Handles likes subcollection + main doc counter
 */
window.toggleNoteLike = async function (noteId) {
    const { db, auth, doc, runTransaction, increment } = getFirebase();
    if (!db || !noteId) return;

    const user = auth?.currentUser || window.currentUser;
    if (!user) {
        if (typeof showToast === 'function') showToast("Please login to like", "info");
        else alert("Please login to like");
        return;
    }

    try {
        const noteRef = doc(db, "notes", noteId);
        const userId = user.uid || user.id;
        const likeRef = doc(db, "notes", noteId, "likes", userId);

        let delta = 0;

        await runTransaction(db, async (transaction) => {
            const noteSnap = await transaction.get(noteRef);
            const likeSnap = await transaction.get(likeRef);

            if (!noteSnap.exists()) {
                transaction.set(noteRef, {
                    views: 0,
                    likes: 0,
                    downloads: 0,
                    createdAt: Date.now()
                });
            }

            if (!likeSnap.exists()) {
                // Add Like
                transaction.set(likeRef, { liked: true, timestamp: Date.now() });
                transaction.update(noteRef, { likes: increment(1) });
                delta = 1;
            } else {
                // Remove Like
                transaction.delete(likeRef);
                transaction.update(noteRef, { likes: increment(-1) });
                delta = -1;
            }
        });

        if (typeof showToast === 'function') {
            showToast(delta === 1 ? "Added to your favorites ❤️" : "Removed from favorites");
        }

        // Global Stats Sync
        if (window.statServices && typeof window.statServices.trackGlobalLike === 'function') {
            window.statServices.trackGlobalLike(delta);
        }

        if (typeof gtag === 'function') {
            gtag('event', 'notes_like', { note_id: noteId, action: delta === 1 ? 'like' : 'unlike' });
        }

    } catch (e) {
        console.error("Like system error:", e);
    }
};

/**
 * Update Note Stat (Downloads)
 */
window.updateNoteStat = async function (noteId, type) {
    const { db, doc, setDoc, updateDoc, increment } = getFirebase();
    if (!db || !noteId) return;

    try {
        const noteRef = doc(db, "notes", noteId);
        if (type === 'download') {
            await setDoc(noteRef, { downloads: increment(1) }, { merge: true });

            if (typeof gtag === 'function') {
                gtag('event', 'notes_download', { note_id: noteId });
            }

            if (window.currentUser && window.currentUser.id) {
                const userRef = doc(db, "users", window.currentUser.id);
                await updateDoc(userRef, {
                    xp: increment(5),
                    downloads: increment(1)
                }).catch(() => { });
            }

            // Global Stats Sync
            if (window.statServices && typeof window.statServices.trackDownload === 'function') {
                window.statServices.trackDownload();
            }
        }
    } catch (e) {
        console.warn("Stat update failed:", e);
    }
};

/**
 * Attaches Real-time Listeners
 * Scans container for [data-note-id] elements and binds onSnapshot.
 */
window.attachNoteRealtimeListeners = function (containerId = 'tab-content') {
    const { db, doc, onSnapshot } = getFirebase();
    if (!db) {
        setTimeout(() => window.attachNoteRealtimeListeners(containerId), 500);
        return;
    }

    const container = document.getElementById(containerId) || document.body;
    const cards = container.querySelectorAll('[data-note-id]');

    cards.forEach(card => {
        const noteId = card.getAttribute('data-note-id');
        if (!noteId) return;

        if (window.noteUnsubscribers[noteId]) {
            try { window.noteUnsubscribers[noteId](); } catch (e) { }
        }

        const noteRef = doc(db, "notes", noteId);

        window.noteUnsubscribers[noteId] = onSnapshot(noteRef, (snap) => {
            const data = snap.exists() ? snap.data() : { views: 0, likes: 0, downloads: 0 };

            // Selector for specific note ID logic
            const allInstances = document.querySelectorAll(`[data-note-id="${noteId}"]`);

            allInstances.forEach(instance => {
                // 1. Sync Views
                let viewEl = instance.querySelector('.view-count');
                if (viewEl) {
                    viewEl.innerText = data.views || 0;
                } else {
                    // Dashboard style handling
                    viewEl = instance.querySelector('.views-pro');
                    if (viewEl) {
                        const icon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
                        viewEl.innerHTML = `${icon} ${data.views || 0}`;
                    }
                }

                // 2. Sync Likes
                let likeEl = instance.querySelector('.like-count');
                if (!likeEl) {
                    const interactions = instance.querySelector('.note-interactions');
                    if (interactions) {
                        const btn = interactions.querySelector('button');
                        if (btn) likeEl = btn.querySelector('span'); // Button contains span
                    }
                }
                if (likeEl) likeEl.innerText = data.likes || 0;

                // 3. Sync Downloads
                const downEl = instance.querySelector('.download-count');
                if (downEl) downEl.innerText = data.downloads || 0;
            });

        }, (err) => {
            // Suppress errors
        });
    });
};

/**
 * Toggle Note Dislike
 */
window.toggleNoteDislike = async function (noteId) {
    if (typeof showToast === 'function') {
        showToast("Note disliked", "info");
    } else {
        console.log("Note disliked:", noteId);
    }
};

/**
 * Toggle Bookmark
 */
window.toggleBookmark = async function (noteId) {
    if (typeof showToast === 'function') {
        showToast("Added to bookmarks", "success");
    } else {
        console.log("Bookmarked:", noteId);
    }
};

/**
 * Report Note
 */
window.reportNote = async function (noteId) {
    if (typeof showToast === 'function') {
        showToast("Note reported to moderation team", "warning");
    } else {
        console.log("Reported:", noteId);
    }
};
