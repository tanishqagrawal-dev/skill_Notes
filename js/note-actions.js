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
window.savedNoteIds = new Set();
let savedUnsubscribe = null;

/**
 * Initialize Bookmark Synchronizer
 * Listens to privateDrive/saved collection to keep UI icons in sync
 */
window.initBookmarkListener = function () {
    const { db, auth, collection, query, where, onSnapshot } = getFirebase();
    if (!db) return;

    const user = auth?.currentUser || window.currentUser;
    if (!user || user.isGuest) {
        window.savedNoteIds.clear();
        updateBookmarkIcons();
        return;
    }

    if (savedUnsubscribe) savedUnsubscribe();

    const driveRef = collection(db, "privateDrive", user.uid || user.id, "files");
    const q = query(driveRef, where("type", "==", "saved"));

    savedUnsubscribe = onSnapshot(q, (snapshot) => {
        window.savedNoteIds.clear();
        snapshot.forEach(doc => {
            // fileId is "saved_" + noteId.replace(/[^a-zA-Z0-9]/g, '_')
            // We store the original noteId in noteData or try to reverse it, 
            // but the most reliable way is to store the noteId as a field.
            // For now, we use the doc ID matching logic.
            const noteId = doc.data().noteId || doc.id.replace(/^saved_/, '');
            window.savedNoteIds.add(noteId);
        });
        updateBookmarkIcons();
    });
};

function updateBookmarkIcons() {
    document.querySelectorAll('[data-note-id]').forEach(card => {
        const id = card.getAttribute('data-note-id');
        const btn = card.querySelector('[title="Bookmark"]');
        if (btn) {
            if (window.savedNoteIds.has(id)) btn.classList.add('active');
            else btn.classList.remove('active');
        }
    });
}

// Auto-init when auth state is ready
(function autoInit() {
    const { auth, onAuthStateChanged } = getFirebase();
    if (auth) {
        onAuthStateChanged(auth, () => window.initBookmarkListener());
    } else {
        setTimeout(autoInit, 1000);
    }
})();

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
    if (!user || user.isGuest) {
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
                transaction.set(noteRef, { views: 0, likes: 0, dislikes: 0, downloads: 0, createdAt: Date.now() });
            }

            if (!likeSnap.exists()) {
                transaction.set(likeRef, { liked: true, timestamp: Date.now() });
                transaction.update(noteRef, { likes: increment(1) });
                delta = 1;
            } else {
                transaction.delete(likeRef);
                transaction.update(noteRef, { likes: increment(-1) });
                delta = -1;
            }
        });

        if (typeof showToast === 'function') {
            showToast(delta === 1 ? "Added to your favorites ❤️" : "Removed from favorites");
        }

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
 * Toggle Note Dislike
 */
window.toggleNoteDislike = async function (noteId) {
    const { db, doc, updateDoc, increment, setDoc, getDoc } = getFirebase();
    if (!db || !noteId) return;

    try {
        const noteRef = doc(db, "notes", noteId);
        const snap = await getDoc(noteRef);

        if (!snap.exists()) {
            await setDoc(noteRef, { views: 0, likes: 0, dislikes: 1, downloads: 0, createdAt: Date.now() });
        } else {
            await updateDoc(noteRef, { dislikes: increment(1) });
        }

        if (typeof showToast === 'function') showToast("Note disliked 👎", "info");

        if (typeof gtag === 'function') {
            gtag('event', 'notes_dislike', { note_id: noteId });
        }
    } catch (e) {
        console.error("Dislike fail:", e);
    }
};

/**
 * Update Note Stat (Downloads & Saves)
 */
window.updateNoteStat = async function (noteId, type) {
    const { db, doc, setDoc, updateDoc, increment, getDoc } = getFirebase();
    if (!db || !noteId) return;

    const user = window.currentUser || {};
    const noteRef = doc(db, "notes", noteId);

    // Dashboard Compatibility Tracking
    try {
        if (window.trackStudyProgress) {
            const foundNote = (window.NotesDB || []).find(n => n.id === noteId);
            const subId = foundNote ? (foundNote.subjectId || foundNote.subject) : 'general';
            window.trackStudyProgress(subId, type);
        }
    } catch (e) { }

    try {
        if (type === 'download' || type === 'view') {
            const snap = await getDoc(noteRef);
            if (!snap.exists()) {
                await setDoc(noteRef, {
                    views: type === 'view' ? 1 : 0,
                    likes: 0,
                    dislikes: 0,
                    downloads: type === 'download' ? 1 : 0,
                    createdAt: Date.now()
                });
            } else {
                await updateDoc(noteRef, { [type + (type.endsWith('s') ? '' : 's')]: increment(1) });
            }

            if (typeof gtag === 'function') gtag('event', `notes_${type}`, { note_id: noteId });

            if (user.id) {
                const userRef = doc(db, "users", user.id);
                const updates = { xp: increment(type === 'download' ? 5 : 1) };
                if (type === 'download') updates.downloads = increment(1);
                if (type === 'view') updates.views_activity = increment(1);
                await updateDoc(userRef, updates).catch(() => { });
            }

            if (window.statServices) {
                if (type === 'download' && window.statServices.trackDownload) window.statServices.trackDownload();
                if (type === 'download' && window.statServices.trackNoteDownload) window.statServices.trackNoteDownload(noteId);
                if (type === 'view' && window.statServices.trackNoteView) window.statServices.trackNoteView(noteId);
            }
        }

        if (type === 'save' || type === 'bookmark') {
            if (!user.id || user.isGuest) {
                showToast("Please login to save to Drive", "info");
                return;
            }

            const fileId = "saved_" + noteId.replace(/[^a-zA-Z0-9]/g, '_');
            const fileRef = doc(db, "privateDrive", user.id, "files", fileId);

            // Check if already bookmarked to toggle
            if (window.savedNoteIds.has(noteId)) {
                const { deleteDoc } = getFirebase();
                await deleteDoc(fileRef);
                if (typeof showToast === 'function') showToast("Removed from Private Drive", "info");
                return;
            }

            // Find note data to save
            let noteData = { title: noteId, url: "#", id: noteId };
            if (window.NotesDB) {
                const found = window.NotesDB.find(n => n.id === noteId);
                if (found) noteData = found;
            }

            await setDoc(fileRef, {
                noteId: noteId,
                name: noteData.title || noteData.name || noteId,
                url: noteData.url || noteData.fileUrl || noteData.driveLink || "#",
                size: 0,
                mimeType: "application/pdf",
                type: "saved",
                subject: noteData.subject || "General",
                semester: noteData.semester || "Unknown",
                updatedAt: Date.now(),
                uploaderUid: user.id
            }, { merge: true });

            if (typeof showToast === 'function') showToast("🔖 Saved to Private Drive!", "success");
        }
    } catch (e) {
        console.warn("Stat update failed:", e);
    }
};

/**
 * Toggle Bookmark (Alias for save)
 */
window.toggleBookmark = async function (noteId) {
    return window.updateNoteStat(noteId, 'save');
};

/**
 * Report Note
 */
window.reportNote = async function (noteId) {
    const { db, doc, setDoc, serverTimestamp } = getFirebase();
    if (!db) return;

    try {
        const reportId = `report_${Date.now()}_${noteId}`;
        await setDoc(doc(db, "reports", reportId), {
            noteId,
            reportedBy: window.currentUser?.id || "anonymous",
            timestamp: serverTimestamp(),
            status: "pending"
        });

        if (typeof showToast === 'function') showToast("Note reported to moderation 🚩", "warning");
    } catch (e) {
        console.error("Report fail:", e);
    }
};

/**
 * Attaches Real-time Listeners
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
            const data = snap.exists() ? snap.data() : { views: 0, likes: 0, dislikes: 0, downloads: 0 };

            const allInstances = document.querySelectorAll(`[data-note-id="${noteId}"]`);

            allInstances.forEach(instance => {
                // 1. Sync Views
                let viewEl = instance.querySelector('.view-count');
                if (!viewEl) viewEl = instance.querySelector('.views-pro');
                if (viewEl) {
                    const icon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
                    viewEl.innerHTML = (viewEl.classList.contains('views-pro')) ? `${icon} ${data.views || 0}` : (data.views || 0);
                }

                // 2. Sync Likes
                const likeEl = instance.querySelector('.like-count');
                if (likeEl) likeEl.innerText = data.likes || 0;

                // 3. Sync Dislikes
                const dislikeEl = instance.querySelector('.dislike-count');
                if (dislikeEl) dislikeEl.innerText = data.dislikes || 0;

                // 4. Sync Downloads
                const downEl = instance.querySelector('.download-count');
                if (downEl) downEl.innerText = data.downloads || 0;

                // 5. Sync Bookmark state (Local user specific)
                const bookmarkBtn = instance.querySelector('[title="Bookmark"]');
                if (bookmarkBtn) {
                    if (window.savedNoteIds.has(noteId)) bookmarkBtn.classList.add('active');
                    else bookmarkBtn.classList.remove('active');
                }
            });

        }, (err) => { });
    });
};
