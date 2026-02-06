/**
 * note-actions.js
 * Shared interaction logic for both Dashboard and Notes Hub
 */

window.incrementNoteView = async function (noteId) {
    const { db, doc, updateDoc, increment } = getFirebase();
    if (!db || !noteId) return;

    // session-based unique view check
    const sessionKey = `viewed_${noteId}`;
    if (sessionStorage.getItem(sessionKey)) {
        return; // Already counted this session
    }

    try {
        const noteRef = doc(db, "notes", noteId);
        await updateDoc(noteRef, {
            views: increment(1)
        });
        sessionStorage.setItem(sessionKey, 'true');
    } catch (e) {
        console.warn("View increment failed:", e);
    }
};

window.toggleNoteLike = async function (noteId) {
    if (!currentUser) {
        if (typeof showToast === 'function') showToast("Please login to like notes", "info");
        return;
    }

    const { db, doc, updateDoc, increment, arrayUnion, arrayRemove, getDoc } = getFirebase();
    if (!db || !noteId) return;

    try {
        const noteRef = doc(db, "notes", noteId);
        const noteSnap = await getDoc(noteRef);
        if (!noteSnap.exists()) return;

        const data = noteSnap.data();
        const likedBy = data.likedBy || [];
        const isCurrentlyLiked = likedBy.includes(currentUser.id);

        if (isCurrentlyLiked) {
            await updateDoc(noteRef, {
                likes: increment(-1),
                likedBy: arrayRemove(currentUser.id)
            });
            if (typeof showToast === 'function') showToast("Note unliked");
        } else {
            await updateDoc(noteRef, {
                likes: increment(1),
                likedBy: arrayUnion(currentUser.id)
            });
            if (typeof showToast === 'function') showToast("Note liked!");
        }
    } catch (e) {
        console.error("Like toggle failed:", e);
        if (typeof showToast === 'function') showToast("Action failed", "error");
    }
};

window.updateNoteStat = async function (noteId, type) {
    const { db, doc, updateDoc, increment } = getFirebase();
    if (!db || !noteId) return;

    try {
        const noteRef = doc(db, "notes", noteId);
        if (type === 'download') {
            await updateDoc(noteRef, {
                downloads: increment(1)
            });
            if (window.statServices) window.statServices.trackDownload();
        } else if (type === 'save') {
            // Future: Save to private drive logic here
            if (typeof showToast === 'function') showToast("Saved to Private Drive");
        }
    } catch (e) {
        console.warn("Stat update failed:", e);
    }
};

window.toggleNoteBookmark = async function (noteId) {
    // Basic bookmark placeholder or implementation
    if (typeof showToast === 'function') showToast("Bookmarked successfully");
};
