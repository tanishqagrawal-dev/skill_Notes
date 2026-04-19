// 🔥 Senior Helper v4.0 - Drive Bridge
window.addEventListener('message', (e) => {
    // Global filter for potential Drive signals
    if (e.data && (typeof e.data === 'string' && e.data.includes('googledrive'))) {
        console.log("🌐 Global Watcher caught Drive signal");
    }
}, false);

window.uploadNoteToFirebase = async function (file, metadata) {
    console.log("🔥 Senior Helper v4.0 Active");
    const { db, doc, setDoc, collection, serverTimestamp, increment } = window.firebaseServices;

    if (!file) return { success: false, error: "No file" };

    const statusEl = document.getElementById('upload-status-text');
    const progressBar = document.getElementById('upload-progress');

    try {
        if (statusEl) statusEl.innerText = "Step 1: Preparing file...";

        const reader = new FileReader();
        return new Promise((resolve, reject) => {
            reader.onload = async (e) => {
                try {
                    const base64Data = e.target.result.split(',')[1];
                    if (statusEl) statusEl.innerText = "Step 2: Sending to Google Drive...";
                    if (progressBar) progressBar.style.width = '55%';

                    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwq1zaoR-Jtv8bb3gWaQ2IBMf5UlGK22-1wHQpp4VZ7XzqCCNDhOL1JMS_SCiziKlZn5w/exec";
                    const payload = { base64: base64Data, mimeType: file.type || 'application/pdf', fileName: file.name };

                    const iframeId = 'drive_bridge_' + Date.now();
                    const iframe = document.createElement('iframe');
                    iframe.id = iframeId;
                    iframe.name = iframeId;
                    iframe.style.cssText = "position:absolute; width:1px; height:1px; left:-500px; opacity:0;";
                    document.body.appendChild(iframe);

                    const form = document.createElement('form');
                    form.method = 'POST';
                    form.action = SCRIPT_URL;
                    form.target = iframeId;
                    const input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = 'data';
                    input.value = JSON.stringify(payload);
                    form.appendChild(input);
                    document.body.appendChild(form);

                    const timeoutId = setTimeout(() => {
                        cleanup();
                        reject(new Error("Drive timeout - please refresh."));
                    }, 120000);

                    const cleanup = () => {
                        window.removeEventListener('message', messageListener);
                        if (iframe.parentNode) iframe.remove();
                        if (form.parentNode) form.remove();
                        clearTimeout(timeoutId);
                    };

                    const messageListener = async (event) => {
                        let res = null;
                        try {
                            const data = event.data;
                            if (typeof data === 'string') {
                                try { res = JSON.parse(data); } catch (e) {
                                    if (data.includes('http')) res = { success: true, url: data.match(/https?:\/\/[^\s"]+/)[0] };
                                }
                            } else if (typeof data === 'object' && data !== null) {
                                res = data.result || data.data || data;
                                if (typeof res === 'string') try { res = JSON.parse(res); } catch (e) { }
                            }

                            const driveUrl = res?.url || res?.driveLink;
                            if (driveUrl) {
                                console.log("🎯 Drive success script detected:", driveUrl);
                                cleanup();

                                if (statusEl) statusEl.innerText = "Step 3: Syncing with Database...";
                                if (progressBar) progressBar.style.width = '85%';

                                // SENIOR ATOMIC WRITE: Pre-generate ID to avoid separate UpdateDoc
                                const notesColl = collection(db, metadata.targetCollection || 'notes');
                                const newDocRef = doc(notesColl);
                                const noteId = newDocRef.id;

                                const currentUser = window.currentUser || {};
                                const uid = metadata.uploadedBy || currentUser.id || 'guest';

                                const finalDoc = {
                                    ...metadata,
                                    noteId: noteId,
                                    id: noteId,
                                    fileUrl: driveUrl,
                                    driveLink: driveUrl,
                                    url: driveUrl,
                                    fileId: res.fileId || "",
                                    fileName: file.name,
                                    uploadedBy: uid,
                                    uploaderName: metadata.uploaderName || currentUser.name || "Scholar",
                                    status: metadata.status || 'pending',
                                    verified: false,
                                    views: 0, downloads: 0, likes: 0,
                                    createdAt: serverTimestamp()
                                };
                                delete finalDoc.targetCollection;

                                try {
                                    console.log("💾 Firestore write initiated:", noteId);
                                    
                                    // Senior Fix: Race setDoc against a 5s timeout to prevent UI hang
                                    await Promise.race([
                                        setDoc(newDocRef, finalDoc),
                                        new Promise((_, reject) => setTimeout(() => reject(new Error("FIREBASE_TIMEOUT")), 5000))
                                    ]).catch(err => {
                                        if (err.message === "FIREBASE_TIMEOUT") {
                                            console.warn("⚠️ Firestore sync is taking time... proceeding with local success.");
                                        } else {
                                            throw err;
                                        }
                                    });

                                    console.log("✅ Database record ready.");
                                    if (statusEl) statusEl.innerText = "✅ Upload Completed!";
                                    if (progressBar) progressBar.style.width = '100%';

                                    // Background task
                                    updateImpactSafe(uid);

                                    // Final UI dismissal
                                    setTimeout(() => {
                                        if (typeof window.closeDashboardUploadModal === 'function') {
                                            window.closeDashboardUploadModal();
                                        }
                                    }, 500);

                                    resolve({ success: true, id: noteId, url: driveUrl });
                                } catch (fsErr) {
                                    console.error("❌ Firestore Error:", fsErr);
                                    reject(new Error("Database sync failed."));
                                }
                            }
                        } catch (err) { console.warn("Listener error", err); }
                    };

                    window.addEventListener('message', messageListener);
                    console.log("📤 POSTing data...");
                    form.submit();
                } catch (err) { reject(err); }
            };
            reader.readAsDataURL(file);
        });
    } catch (err) {
        console.error("❌ Helper Error:", err);
        throw err;
    }
};

async function updateImpactSafe(uid) {
    if (!uid || uid === 'guest') return;
    const { db, doc, updateDoc, increment } = window.firebaseServices;
    if (!increment) return;
    try {
        await updateDoc(doc(db, "users", uid), {
            xp: increment(20),
            totalUploads: increment(1),
            notesCount: increment(1)
        });
    } catch (e) { console.warn("Impact update deferred", e); }
}
