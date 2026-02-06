
// Co-Admin Module (Logic Only)
// Exports global window.CoAdminModule for use by dashboard.js

window.CoAdminModule = {
    isInitialized: false,
    pendingNotes: [],
    myCollege: null,
    unsubscribe: null,

    init: function (user) {
        if (this.isInitialized) return;
        this.myCollege = user.college;
        if (!this.myCollege) {
            console.error("CoAdmin Module: No assigned college found in user profile.");
            return;
        }

        console.log("🛡️ CoAdmin Module Initialized for:", this.myCollege);
        this.initLiveFeed();
        this.isInitialized = true;
    },

    render: function () {
        // Just return the inner HTML for the tab
        // Use logic from coadmin-dashboard.js
        if (!this.isInitialized && window.currentUser) this.init(window.currentUser);

        return `
            <div class="tab-pane active fade-in" style="padding: 2rem;">
                <div style="margin-bottom: 2rem;">
                    <h1 class="font-heading">🛡️ ${this.myCollege ? this.myCollege.toUpperCase() : 'MY'} <span class="gradient-text">Moderation</span></h1>
                    <p style="color: var(--text-dim);">Review pending notes submitted to your college.</p>
                </div>
                
                <!-- Queue Container -->
                <div id="coadmin-queue-list" class="grid-1-col" style="display: grid; gap: 1.5rem;">
                     ${this.renderQueueItems()}
                </div>
            </div>
        `;
    },

    renderQueueItems: function () {
        if (this.pendingNotes.length === 0) {
            return `
                <div class="glass-card" style="padding: 4rem; text-align: center; border: 1px dashed rgba(255,255,255,0.1);">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">✅</div>
                    <h3>All Caught Up!</h3>
                    <p style="color: var(--text-dim);">No pending notes for ${this.myCollege}.</p>
                </div>
            `;
        }

        return this.pendingNotes.map(note => `
            <div class="glass-card" style="padding: 1.5rem; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid var(--primary);">
                <div>
                    <h3 style="margin-bottom: 0.5rem;">${note.title || 'Untitled'}</h3>
                    <div style="font-size: 0.85rem; color: var(--text-dim);">
                        Uploaded by <strong>${note.uploader || 'Unknown'}</strong> • ${note.subject || note.branchId} • ${note.date}
                    </div>
                </div>
                <div style="display: flex; gap: 1rem;">
                    <button class="btn btn-sm btn-ghost" style="color: #ff4757; border-color: rgba(255,71,87,0.3);" onclick="CoAdminModule.rejectNote('${note.id}')">❌ Reject</button>
                    <button class="btn btn-sm btn-primary" onclick="CoAdminModule.approveNote('${note.id}')">✅ Approve</button>
                </div>
            </div>
        `).join('');
    },

    initLiveFeed: function () {
        const { db, collection, query, where, onSnapshot } = window.firebaseServices || {};
        if (!db) return;

        const currentColl = this.myCollege;
        // Requirement: Filter by 'college' field exactly as stored in user.college
        const q = query(
            collection(db, 'notes'),
            where('college', '==', currentColl),
            where('status', '==', 'pending')
        );

        this.unsubscribe = onSnapshot(q, (snapshot) => {
            const notes = [];
            snapshot.forEach(doc => {
                notes.push({ id: doc.id, ...doc.data() });
            });
            this.pendingNotes = notes;

            // Re-render if active
            const container = document.getElementById('coadmin-queue-list');
            if (container) container.innerHTML = this.renderQueueItems();
        });
    },

    approveNote: async function (noteId) {
        const { db, doc, runTransaction, serverTimestamp } = window.firebaseServices;
        const note = this.pendingNotes.find(n => n.id === noteId);
        if (!note) return;

        if (!confirm(`Approve "${note.title}"?`)) return;

        try {
            await runTransaction(db, async (transaction) => {
                const noteRef = doc(db, 'notes', noteId);
                const noteDoc = await transaction.get(noteRef);
                if (!noteDoc.exists()) throw "Note missing";

                transaction.update(noteRef, {
                    status: 'approved',
                    approvedBy: window.currentUser.id,
                    approvedAt: serverTimestamp()
                });
            });
            alert("✅ Approved!");
        } catch (e) {
            console.error(e);
            alert("Error: " + e.message);
        }
    },

    rejectNote: async function (noteId) {
        if (!confirm("Reject this note?")) return;
        const { db, doc, updateDoc } = window.firebaseServices;
        try {
            await updateDoc(doc(db, 'notes', noteId), { status: 'rejected' });
            alert("🚫 Rejected.");
        } catch (e) {
            alert("Error: " + e.message);
        }
    }
};
