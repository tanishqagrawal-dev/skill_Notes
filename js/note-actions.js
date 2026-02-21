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
window.likedNoteIds = new Set();
window.dislikedNoteIds = new Set();
window.reportedNoteIds = new Set();

let savedUnsubscribe = null;
let interactionsUnsubscribe = {};

/**
 * Initialize All User Interaction Listeners
 */
window.initInteractionsListeners = function () {
    const { db, auth, collection, query, where, onSnapshot } = getFirebase();
    if (!db) return;

    const user = auth?.currentUser || window.currentUser;
    if (!user || user.isGuest) {
        window.savedNoteIds.clear();
        window.likedNoteIds.clear();
        window.dislikedNoteIds.clear();
        window.reportedNoteIds.clear();
        syncAllInteractionIcons();
        return;
    }

    const userId = user.uid || user.id;

    // 1. Listen to Saved/Bookmarks
    if (savedUnsubscribe) savedUnsubscribe();
    const savedRef = collection(db, "privateDrive", userId, "files");
    const qSaved = query(savedRef, where("type", "==", "saved"));
    savedUnsubscribe = onSnapshot(qSaved, (snap) => {
        window.savedNoteIds.clear();
        snap.forEach(doc => window.savedNoteIds.add(doc.data().noteId || doc.id.replace(/^saved_/, '')));
        syncAllInteractionIcons();
    });

    // 2. Listen to Reports
    const reportsRef = collection(db, "reports");
    const qReports = query(reportsRef, where("reportedBy", "==", userId));
    if (interactionsUnsubscribe.reports) interactionsUnsubscribe.reports();
    interactionsUnsubscribe.reports = onSnapshot(qReports, (snap) => {
        window.reportedNoteIds.clear();
        snap.forEach(doc => window.reportedNoteIds.add(doc.data().noteId));
        syncAllInteractionIcons();
    });
};

function syncAllInteractionIcons() {
    document.querySelectorAll('[data-note-id]').forEach(card => {
        const id = card.getAttribute('data-note-id');
        const update = (title, set) => {
            const btn = card.querySelector(`[title="${title}"]`);
            if (btn) {
                if (set.has(id)) btn.classList.add('active');
                else btn.classList.remove('active');
            }
        };
        update('Bookmark', window.savedNoteIds);
        update('Like', window.likedNoteIds);
        update('Dislike', window.dislikedNoteIds);
        update('Report', window.reportedNoteIds);
    });
}

// Auto-init when auth state is ready
(function autoInit() {
    const { auth, onAuthStateChanged } = getFirebase();
    if (auth) {
        onAuthStateChanged(auth, () => window.initInteractionsListeners());
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

    const isCurrentlyLiked = window.likedNoteIds.has(noteId);
    const isCurrentlyDisliked = window.dislikedNoteIds.has(noteId);

    let delta = 1;
    let isActive = true;
    let dislikeDelta = 0;

    if (isCurrentlyLiked) {
        window.likedNoteIds.delete(noteId);
        delta = -1;
        isActive = false;
    } else {
        window.likedNoteIds.add(noteId);
        delta = 1;
        isActive = true;
        // Enforce Mutual Exclusivity
        if (isCurrentlyDisliked) {
            window.dislikedNoteIds.delete(noteId);
            dislikeDelta = -1;
        }
    }

    // --- OPTIMISTIC UI UPDATE ---
    document.querySelectorAll(`[data-note-id="${noteId}"]`).forEach(card => {
        const likeBtn = card.querySelector('.like-btn, [title="Like"], [onclick="likeNote(\'' + noteId + '\')"]');
        if (likeBtn) {
            const countSpan = likeBtn.querySelector('.like-count');
            if (isActive) {
                likeBtn.classList.add('active');
                if (countSpan && !isCurrentlyLiked) countSpan.innerText = (parseInt(countSpan.innerText) || 0) + 1;
            } else {
                likeBtn.classList.remove('active');
                if (countSpan && isCurrentlyLiked) countSpan.innerText = Math.max(0, (parseInt(countSpan.innerText) || 1) - 1);
            }
        }

        if (dislikeDelta === -1) {
            const dislikeBtn = card.querySelector('[title="Dislike"]');
            if (dislikeBtn) {
                dislikeBtn.classList.remove('active');
                const disCountSpan = dislikeBtn.querySelector('.dislike-count');
                if (disCountSpan) disCountSpan.innerText = Math.max(0, (parseInt(disCountSpan.innerText) || 1) - 1);
            }
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

    // --- BYPASS FIRESTORE IF HARDCODED STATIC NOTE ---
    if (noteId.startsWith('static-')) return;

    try {
        const noteRef = doc(db, "notes", noteId);
        const userId = user.uid || user.id;
        const likeRef = doc(db, "notes", noteId, "likes", userId);

        await runTransaction(db, async (transaction) => {
            const noteSnap = await transaction.get(noteRef);
            const likeSnap = await transaction.get(likeRef);

            if (!noteSnap.exists()) {
                transaction.set(noteRef, { views: 0, likes: 0, dislikes: 0, downloads: 0, createdAt: Date.now() });
            }

            if (!isActive) { // We toggled it off
                transaction.delete(likeRef);
                transaction.update(noteRef, { likes: increment(-1) });
            } else { // We toggled it on
                transaction.set(likeRef, { liked: true, timestamp: Date.now() });
                transaction.update(noteRef, { likes: increment(1) });
            }

            // Clean up mutually exclusive dislikes natively via transaction
            if (dislikeDelta === -1) {
                const dislikeRef = doc(db, "notes", noteId, "dislikes", userId);
                transaction.delete(dislikeRef);
                transaction.update(noteRef, { dislikes: increment(-1) });
            }
        });
    } catch (e) {
        console.error("Like system error:", e);
    }
};

/**
 * Toggle Note Dislike
 */
window.toggleNoteDislike = async function (noteId) {
    const { db, auth, doc, runTransaction, increment } = getFirebase();
    if (!db || !noteId) return;

    const user = auth?.currentUser || window.currentUser;
    if (!user || user.isGuest) {
        if (typeof showToast === 'function') showToast("Please login to dislike", "info");
        else alert("Please login to dislike");
        return;
    }

    const isCurrentlyDisliked = window.dislikedNoteIds.has(noteId);
    const isCurrentlyLiked = window.likedNoteIds.has(noteId);

    let delta = 1;
    let isActive = true;
    let likeDelta = 0;

    if (isCurrentlyDisliked) {
        window.dislikedNoteIds.delete(noteId);
        delta = -1;
        isActive = false;
    } else {
        window.dislikedNoteIds.add(noteId);
        delta = 1;
        isActive = true;
        // Enforce Mutual Exclusivity
        if (isCurrentlyLiked) {
            window.likedNoteIds.delete(noteId);
            likeDelta = -1;
        }
    }

    // --- OPTIMISTIC UI UPDATE ---
    document.querySelectorAll(`[data-note-id="${noteId}"]`).forEach(card => {
        const dislikeBtn = card.querySelector('[title="Dislike"]');
        if (dislikeBtn) {
            const countSpan = dislikeBtn.querySelector('.dislike-count');
            if (isActive) {
                dislikeBtn.classList.add('active');
                if (countSpan && !isCurrentlyDisliked) countSpan.innerText = (parseInt(countSpan.innerText) || 0) + 1;
            } else {
                dislikeBtn.classList.remove('active');
                if (countSpan && isCurrentlyDisliked) countSpan.innerText = Math.max(0, (parseInt(countSpan.innerText) || 1) - 1);
            }
        }

        if (likeDelta === -1) {
            const likeBtn = card.querySelector('.like-btn, [title="Like"], [onclick="likeNote(\'' + noteId + '\')"]');
            if (likeBtn) {
                likeBtn.classList.remove('active');
                const likeCountSpan = likeBtn.querySelector('.like-count');
                if (likeCountSpan) likeCountSpan.innerText = Math.max(0, (parseInt(likeCountSpan.innerText) || 1) - 1);
            }
        }
    });

    if (typeof showToast === 'function') {
        showToast(isActive ? "Note disliked 👎" : "Dislike removed", "info");
    }

    if (typeof gtag === 'function') {
        gtag('event', 'notes_dislike', { note_id: noteId, action: isActive ? 'dislike' : 'undislike' });
    }

    // --- BYPASS FIRESTORE IF HARDCODED STATIC NOTE ---
    if (noteId.startsWith('static-')) return;

    try {
        const noteRef = doc(db, "notes", noteId);
        const userId = user.uid || user.id;
        const dislikeRef = doc(db, "notes", noteId, "dislikes", userId);

        await runTransaction(db, async (transaction) => {
            const noteSnap = await transaction.get(noteRef);
            const dislikeSnap = await transaction.get(dislikeRef);

            if (!noteSnap.exists()) {
                transaction.set(noteRef, { views: 0, likes: 0, dislikes: 0, downloads: 0, createdAt: Date.now() });
            }

            if (!isActive) { // We toggled it off
                transaction.delete(dislikeRef);
                transaction.update(noteRef, { dislikes: increment(-1) });
            } else { // We toggled it on
                transaction.set(dislikeRef, { disliked: true, timestamp: Date.now() });
                transaction.update(noteRef, { dislikes: increment(1) });
            }

            // Clean up mutually exclusive likes natively via transaction
            if (likeDelta === -1) {
                const likeRef = doc(db, "notes", noteId, "likes", userId);
                transaction.delete(likeRef);
                transaction.update(noteRef, { likes: increment(-1) });
            }
        });
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

    // --- OPTIMISTIC UI UPDATE ---
    document.querySelectorAll(`[data-note-id="${noteId}"]`).forEach(card => {
        const countSpan = card.querySelector(type === 'view' ? '.view-count' : '.download-count, .views-pro'); // covers both hub and dashboard layouts
        if (countSpan) {
            let currentStr = countSpan.innerText.replace(/[^0-9]/g, '');
            let current = parseInt(currentStr) || 0;
            // Best effort extraction & update while maintaining text formatting (e.g. "12 downloads")
            countSpan.innerText = countSpan.innerText.replace(currentStr, (current + 1).toString());
        }
    });

    // Dashboard Compatibility Tracking
    try {
        if (window.trackStudyProgress) {
            const foundNote = (window.NotesDB || []).find(n => n.id === noteId);
            const subId = foundNote ? (foundNote.subjectId || foundNote.subject) : 'general';
            window.trackStudyProgress(subId, type);
        }
    } catch (e) { }

    // --- GLOBAL STAT TRACKING ---
    if (type === 'download' || type === 'view') {
        if (typeof gtag === 'function') gtag('event', `notes_${type}`, { note_id: noteId });

        if (window.statServices) {
            if (type === 'download' && window.statServices.trackDownload) window.statServices.trackDownload();
            if (type === 'download' && window.statServices.trackNoteDownload) window.statServices.trackNoteDownload(noteId);
            if (type === 'view' && window.statServices.trackNoteView) window.statServices.trackNoteView(noteId);
        }
    }

    // --- BYPASS FIRESTORE IF HARDCODED STATIC NOTE ---
    if (noteId.startsWith('static-')) return;

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

            if (user.id) {
                const userRef = doc(db, "users", user.id);
                const updates = { xp: increment(type === 'download' ? 5 : 1) };
                if (type === 'download') updates.downloads = increment(1);
                if (type === 'view') updates.views_activity = increment(1);
                await updateDoc(userRef, updates).catch(() => { });
            }
        } // Restore missing brace

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

            window.savedNoteIds.add(noteId);
            syncAllInteractionIcons();
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

        window.reportedNoteIds.add(noteId);
        syncAllInteractionIcons();
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
        const { auth, getDoc } = getFirebase();
        const user = auth?.currentUser || window.currentUser;
        const userId = user && !user.isGuest ? (user.uid || user.id) : null;

        // Asynchronously hydrate Personal Engagement states directly from subcollections
        if (userId && !noteId.startsWith('static-')) {
            getDoc(doc(db, "notes", noteId, "likes", userId)).then(snap => {
                if (snap.exists()) window.likedNoteIds.add(noteId);
                else window.likedNoteIds.delete(noteId);
                if (typeof syncAllInteractionIcons === 'function') syncAllInteractionIcons();
            }).catch(() => { });

            getDoc(doc(db, "notes", noteId, "dislikes", userId)).then(snap => {
                if (snap.exists()) window.dislikedNoteIds.add(noteId);
                else window.dislikedNoteIds.delete(noteId);
                if (typeof syncAllInteractionIcons === 'function') syncAllInteractionIcons();
            }).catch(() => { });
        }

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

                // 5. Sync Interaction states (Local user specific)
                const sync = (title, set) => {
                    const btn = instance.querySelector(`[title="${title}"]`);
                    if (btn) {
                        if (set.has(noteId)) btn.classList.add('active');
                        else btn.classList.remove('active');
                    }
                };
                sync('Bookmark', window.savedNoteIds);
                sync('Like', window.likedNoteIds);
                sync('Dislike', window.dislikedNoteIds);
                sync('Report', window.reportedNoteIds);
            });

        }, (err) => { });
    });
};
