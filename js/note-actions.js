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

function getSeedStats(noteId) {
    let seeds = { views: 0, likes: 0, dislikes: 0, downloads: 0 };
    const allCards = document.querySelectorAll(`[data-note-id="${noteId}"]`);
    if (allCards.length > 0) {
        const card = allCards[0];

        let viewEl = card.querySelector('.view-count');
        if (!viewEl) viewEl = card.querySelector('.views-pro');
        if (viewEl) seeds.views = parseInt(viewEl.innerText.replace(/[^0-9]/g, '')) || 0;

        let likeEl = card.querySelector('.like-count');
        if (likeEl) seeds.likes = parseInt(likeEl.innerText.replace(/[^0-9]/g, '')) || 0;

        let dislikeEl = card.querySelector('.dislike-count');
        if (dislikeEl) seeds.dislikes = parseInt(dislikeEl.innerText.replace(/[^0-9]/g, '')) || 0;

        let downEl = card.querySelector('.download-count');
        if (downEl) seeds.downloads = parseInt(downEl.innerText.replace(/[^0-9]/g, '')) || 0;
    }
    return seeds;
}
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

    // 1. Listen to All Engagements (Saved, Likes, Dislikes) in Private Drive
    if (savedUnsubscribe) savedUnsubscribe();
    const driveRef = collection(db, "privateDrive", userId, "files");
    
    // We listen to everything in one go to minimize reads
    savedUnsubscribe = onSnapshot(driveRef, (snap) => {
        window.savedNoteIds.clear();
        window.likedNoteIds.clear();
        window.dislikedNoteIds.clear();
        
        snap.forEach(doc => {
            const data = doc.data();
            const noteId = data.noteId || doc.id.replace(/^(saved_|like_|dislike_)/, '');
            if (data.type === 'saved') window.savedNoteIds.add(noteId);
            else if (data.type === 'like') window.likedNoteIds.add(noteId);
            else if (data.type === 'dislike') window.dislikedNoteIds.add(noteId);
        });
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
        const idClean = id.replace(/^unit\d+_/, ''); // handle sequential IDs

        const update = (selector, set, localVoteType) => {
            const btn = card.querySelector(selector);
            if (btn) {
                const localVote = localStorage.getItem(`vote_${id}`) || localStorage.getItem(`vote_${idClean}`);
                if (set.has(id) || set.has(idClean) || (localVoteType && localVote == localVoteType)) btn.classList.add('active');
                else btn.classList.remove('active');
            }
        };

        // Universal selectors for different UI versions
        update('.like-btn, [title="Like"], .eng-btn-pro.like', window.likedNoteIds, 1);
        update('.dislike-btn, [title="Dislike"]', window.dislikedNoteIds, -1);
        update('.bookmark-btn, .save-btn, [title="Bookmark"], [title="Save"], [onclick*="toggleBookmark"]', window.savedNoteIds);
        update('.report-btn, [title="Report"]', window.reportedNoteIds);
    });
}

/**
 * Share Subject Deep Link
 */
window.copyShareLink = async function (btnElement) {
    const btn = btnElement || document.getElementById('share-btn');
    const state = window.selState || {};
    
    if (!state.subject) {
        if (window.showToast) window.showToast("Please select a subject to share", "info");
        return;
    }

    if (!window.RoutingSystem) {
        console.error("RoutingSystem not loaded.");
        return;
    }

    const success = await window.RoutingSystem.copyShareLink(state);
    if (success && btn) {
        const originalText = btn.innerHTML;
        const originalBg = btn.style.background;
        
        btn.innerHTML = '✅ Link Copied!';
        btn.style.background = 'rgba(0, 255, 127, 0.2)';
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = originalBg;
        }, 2000);
    }
};

/**
 * Share Specific Resource deep link
 */
window.shareResource = function (id) {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const baseUrl = isLocal ? window.location.origin : 'https://skilmatrix.site';
    const url = baseUrl + '/pages/view?id=' + id;
    
    if (navigator.share) {
        navigator.share({
            title: 'Study Resource | SKiL MATRiX',
            text: 'Check out this study resource on SKiL MATRiX!',
            url: url
        }).catch(console.error);
    } else {
        navigator.clipboard.writeText(url).then(() => {
            alert("Link copied to clipboard!");
        });
    }
};

// Attach to window for HTML onclicks
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
    const { db, doc, setDoc, getDoc, increment } = getFirebase();
    if (!db || !noteId) return;

    // Session-based unique view check
    const sessionKey = `viewed_${noteId}`;
    if (sessionStorage.getItem(sessionKey)) return;

    // --- SYNCHRONIZE WITH SUPABASE POSTGRESQL ---
    if (window.supabase) {
        window.supabase.rpc('increment_note_view', { p_note_id: noteId }).catch(e => console.warn('Supabase view sync error:', e));
    }

    try {
        const noteRef = doc(db, "notes", noteId);

        const snap = await getDoc(noteRef);
        if (!snap.exists()) {
            const seeds = getSeedStats(noteId);
            await setDoc(noteRef, {
                views: seeds.views + 1,
                likes: seeds.likes,
                dislikes: seeds.dislikes,
                downloads: seeds.downloads,
                lastViewed: Date.now(),
                createdAt: Date.now()
            });
        } else {
            await setDoc(noteRef, {
                views: increment(1),
                lastViewed: Date.now()
            }, { merge: true });
        }

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
window.likeNote = async function (noteId) {
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
    if (isActive) {
        localStorage.setItem(`vote_${noteId}`, 1);
    } else {
        localStorage.removeItem(`vote_${noteId}`);
    }

    document.querySelectorAll(`[data-note-id="${noteId}"]`).forEach(card => {
        const likeBtn = card.querySelector('.like-btn, [title="Like"], [onclick*="likeNote"]');
        if (likeBtn) {
            const countSpan = likeBtn.querySelector('.like-count, .count');
            if (isActive) {
                likeBtn.classList.add('active');
                if (countSpan && !isCurrentlyLiked) countSpan.innerText = (parseInt(countSpan.innerText) || 0) + 1;
            } else {
                likeBtn.classList.remove('active');
                if (countSpan && isCurrentlyLiked) countSpan.innerText = Math.max(0, (parseInt(countSpan.innerText) || 1) - 1);
            }
        }

        if (dislikeDelta === -1) {
            const dislikeBtn = card.querySelector('.dislike-btn, [title="Dislike"]');
            if (dislikeBtn) {
                dislikeBtn.classList.remove('active');
                const disCountSpan = dislikeBtn.querySelector('.dislike-count, .count');
                if (disCountSpan) disCountSpan.innerText = Math.max(0, (parseInt(disCountSpan.innerText) || 1) - 1);
            }
        }
    });

    if (typeof showToast === 'function') {
        showToast(delta === 1 ? "Added to your favorites ❤️" : "Removed from favorites");
    }

    if (typeof gtag === 'function') {
        gtag('event', 'notes_like', { note_id: noteId, action: delta === 1 ? 'like' : 'unlike' });
    }

    // --- SYNCHRONIZE WITH SUPABASE POSTGRESQL ---
    if (window.supabase) {
        try {
            let voteId = user?.uid || user?.id || localStorage.getItem('anon_vote_id') || 'anon_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('anon_vote_id', voteId);
            window.supabase.rpc('vote_note', { 
                p_note_id: noteId, 
                p_user_id: voteId, 
                p_vote_type: 1 
            }).catch(e => console.warn("Supabase like sync error:", e));
        } catch(e) {}
    }

    try {
        // Halt network transmission until Firebase Auth fully establishes a secure token payload
        if (!auth || !auth.currentUser) {
            console.log("⏳ Queueing like for " + noteId + " pending secure auth resolution...");
            window._pendingInteractions = window._pendingInteractions || [];
            window._pendingInteractions.push(() => likeNote(noteId));
            return; // Abort this execution flow, it will run again automatically
        }

        const noteRef = doc(db, "notes", noteId);
        const userId = user.uid || user.id;
        const likeRef = doc(db, "notes", noteId, "likes", userId);

        await runTransaction(db, async (transaction) => {
            const noteSnap = await transaction.get(noteRef);

            if (!noteSnap.exists()) {
                const seeds = getSeedStats(noteId);
                transaction.set(noteRef, {
                    views: seeds.views,
                    likes: seeds.likes,
                    dislikes: seeds.dislikes,
                    downloads: seeds.downloads,
                    createdAt: Date.now()
                });
                if (isActive) {
                    transaction.set(likeRef, { liked: true, timestamp: Date.now() });
                }
            } else {
                let updates = {};

                // --- CENTRALIZED PERSISTENCE (Private Drive Hydration) ---
                const privLikeRef = doc(db, "privateDrive", userId, "files", "like_" + noteId.replace(/[^a-zA-Z0-9]/g, '_'));
                const privDislikeRef = doc(db, "privateDrive", userId, "files", "dislike_" + noteId.replace(/[^a-zA-Z0-9]/g, '_'));

                if (!isActive) { // We toggled it off
                    transaction.delete(likeRef);
                    transaction.delete(privLikeRef);
                    updates.likes = increment(-1);
                } else { // We toggled it on
                    transaction.set(likeRef, { liked: true, timestamp: Date.now() });
                    transaction.set(privLikeRef, { noteId, type: 'like', timestamp: Date.now() });
                    updates.likes = increment(1);
                    // Clean up mutually exclusive dislikes in Private Drive
                    if (dislikeDelta === -1) transaction.delete(privDislikeRef);
                }

                // Clean up mutually exclusive dislikes natively via transaction
                if (dislikeDelta === -1) {
                    const dislikeRef = doc(db, "notes", noteId, "dislikes", userId);
                    transaction.delete(dislikeRef);
                    updates.dislikes = increment(-1);
                }

                transaction.update(noteRef, updates);
            }
        });

        if (typeof syncAllInteractionIcons === 'function') syncAllInteractionIcons();
    } catch (e) {
        console.warn("Transaction failed, executing graceful fallback:", e);
        try {
            const { setDoc, deleteDoc } = getFirebase();
            const noteRef = doc(db, "notes", noteId);
            const likeRef = doc(db, "notes", noteId, "likes", user.uid || user.id);

            if (isActive) {
                await setDoc(likeRef, { liked: true, timestamp: Date.now() });
                await setDoc(noteRef, { likes: increment(1) }, { merge: true });
            } else {
                await deleteDoc(likeRef);
                await setDoc(noteRef, { likes: increment(-1) }, { merge: true });
            }
            if (typeof syncAllInteractionIcons === 'function') syncAllInteractionIcons();
        } catch (fallbackError) {
            console.error("Like sync critical failure:", fallbackError);
            if (typeof showToast === 'function') showToast("Failed to sync like. Please try again.", "error");
        }
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
    if (isActive) {
        localStorage.setItem(`vote_${noteId}`, -1);
    } else {
        localStorage.removeItem(`vote_${noteId}`);
    }

    document.querySelectorAll(`[data-note-id="${noteId}"]`).forEach(card => {
        const dislikeBtn = card.querySelector('.dislike-btn, [title="Dislike"]');
        if (dislikeBtn) {
            const countSpan = dislikeBtn.querySelector('.dislike-count, .count');
            if (isActive) {
                dislikeBtn.classList.add('active');
                if (countSpan && !isCurrentlyDisliked) countSpan.innerText = (parseInt(countSpan.innerText) || 0) + 1;
            } else {
                dislikeBtn.classList.remove('active');
                if (countSpan && isCurrentlyDisliked) countSpan.innerText = Math.max(0, (parseInt(countSpan.innerText) || 1) - 1);
            }
        }

        if (likeDelta === -1) {
            const likeBtn = card.querySelector('.like-btn, [title="Like"], [onclick*="likeNote"]');
            if (likeBtn) {
                likeBtn.classList.remove('active');
                const likeCountSpan = likeBtn.querySelector('.like-count, .count');
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

    // --- SYNCHRONIZE WITH SUPABASE POSTGRESQL ---
    if (window.supabase) {
        try {
            let voteId = user?.uid || user?.id || localStorage.getItem('anon_vote_id') || 'anon_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('anon_vote_id', voteId);
            window.supabase.rpc('vote_note', { 
                p_note_id: noteId, 
                p_user_id: voteId, 
                p_vote_type: -1 
            }).catch(e => console.warn("Supabase dislike sync error:", e));
        } catch(e) {}
    }

    try {
        // Halt network transmission until Firebase Auth fully establishes a secure token payload
        if (!auth || !auth.currentUser) {
            console.log("⏳ Queueing dislike for " + noteId + " pending secure auth resolution...");
            window._pendingInteractions = window._pendingInteractions || [];
            window._pendingInteractions.push(() => toggleNoteDislike(noteId));
            return; // Abort this execution flow, it will run again automatically
        }

        const noteRef = doc(db, "notes", noteId);
        const userId = user.uid || user.id;
        const dislikeRef = doc(db, "notes", noteId, "dislikes", userId);

        await runTransaction(db, async (transaction) => {
            const noteSnap = await transaction.get(noteRef);

            if (!noteSnap.exists()) {
                const seeds = getSeedStats(noteId);
                transaction.set(noteRef, {
                    views: seeds.views,
                    likes: seeds.likes,
                    dislikes: seeds.dislikes,
                    downloads: seeds.downloads,
                    createdAt: Date.now()
                });
                if (isActive) {
                    transaction.set(dislikeRef, { disliked: true, timestamp: Date.now() });
                }
            } else {
                let updates = {};

                // --- CENTRALIZED PERSISTENCE (Private Drive Hydration) ---
                const privDislikeRef = doc(db, "privateDrive", userId, "files", "dislike_" + noteId.replace(/[^a-zA-Z0-9]/g, '_'));
                const privLikeRef = doc(db, "privateDrive", userId, "files", "like_" + noteId.replace(/[^a-zA-Z0-9]/g, '_'));

                if (!isActive) { // We toggled it off
                    transaction.delete(dislikeRef);
                    transaction.delete(privDislikeRef);
                    updates.dislikes = increment(-1);
                } else { // We toggled it on
                    transaction.set(dislikeRef, { disliked: true, timestamp: Date.now() });
                    transaction.set(privDislikeRef, { noteId, type: 'dislike', timestamp: Date.now() });
                    updates.dislikes = increment(1);
                    // Clean up mutually exclusive likes in Private Drive
                    if (likeDelta === -1) transaction.delete(privLikeRef);
                }

                // Clean up mutually exclusive likes natively via transaction
                if (likeDelta === -1) {
                    const likeRef = doc(db, "notes", noteId, "likes", userId);
                    transaction.delete(likeRef);
                    updates.likes = increment(-1);
                }

                transaction.update(noteRef, updates);
            }
        });

        if (typeof syncAllInteractionIcons === 'function') syncAllInteractionIcons();
    } catch (e) {
        console.warn("Transaction failed, executing graceful fallback:", e);
        try {
            const { setDoc, deleteDoc } = getFirebase();
            const noteRef = doc(db, "notes", noteId);
            const dislikeRef = doc(db, "notes", noteId, "dislikes", user.uid || user.id);

            if (isActive) {
                await setDoc(dislikeRef, { disliked: true, timestamp: Date.now() });
                // We cautiously initialize/update the parent doc
                await setDoc(noteRef, { dislikes: increment(1) }, { merge: true });
            } else {
                await deleteDoc(dislikeRef);
                await setDoc(noteRef, { dislikes: increment(-1) }, { merge: true });
            }
            if (typeof syncAllInteractionIcons === 'function') syncAllInteractionIcons();
        } catch (fallbackError) {
            console.error("Dislike sync critical failure:", fallbackError);
            if (typeof showToast === 'function') showToast("Failed to sync dislike. Please try again.", "error");
        }
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
    // REMOVED to allow global scaling

    try {
        if (type === 'download' || type === 'view') {
            const snap = await getDoc(noteRef);
            if (!snap.exists()) {
                const seeds = getSeedStats(noteId);
                await setDoc(noteRef, {
                    views: seeds.views,
                    likes: seeds.likes,
                    dislikes: seeds.dislikes,
                    downloads: seeds.downloads,
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
            
            // Fallback: Search in globalNotes (static notes)
            if (noteData.url === "#" && window.GlobalData) {
                const gn = window.globalNotes || {};
                for (const college in gn) {
                    for (const subject in gn[college]) {
                        const found = gn[college][subject].find(n => n.id === noteId);
                        if (found) {
                            noteData = found;
                            break;
                        }
                    }
                    if (noteData.url !== "#") break;
                }
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

        // Note: Individual hydration of personal states (likes/dislikes) is now handled 
        // globally by initInteractionsListeners for better performance and reliability.
        // We only need to attach the real-time listener for public stats here.

        window.noteUnsubscribers[noteId] = onSnapshot(noteRef, (snap) => {
            if (!snap.exists()) return; // Preserve hardcoded UI placeholders until a real Firebase interaction occurs

            const data = snap.data();
            const allInstances = document.querySelectorAll(`[data-note-id="${noteId}"]`);

            allInstances.forEach(instance => {
                // 1. Sync Views
                let viewEl = instance.querySelector('.view-count');
                if (!viewEl) viewEl = instance.querySelector('.views-pro');
                if (viewEl && data.views !== undefined) {
                    const icon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
                    viewEl.innerHTML = (viewEl.classList.contains('views-pro')) ? `${icon} ${data.views}` : (data.views);
                }

                // 2. Sync Likes
                const likeEl = instance.querySelector('.like-count');
                if (likeEl && data.likes !== undefined) likeEl.innerText = data.likes;

                // 3. Sync Dislikes
                const dislikeEl = instance.querySelector('.dislike-count');
                if (dislikeEl && data.dislikes !== undefined) dislikeEl.innerText = data.dislikes;

                // 4. Sync Downloads
                const downEl = instance.querySelector('.download-count');
                if (downEl && data.downloads !== undefined) downEl.innerText = data.downloads;

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
