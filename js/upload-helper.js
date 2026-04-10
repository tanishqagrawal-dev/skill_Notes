// Firebase Upload Logic
window.uploadNoteToFirebase = async function (file, metadata) {
    const { storage, db, ref, uploadBytesResumable, getDownloadURL, addDoc, collection, serverTimestamp, doc, updateDoc } = window.firebaseServices;

    if (!file) return;

    try {
        console.log("🔗 Connecting to Google Apps Script (Bypassing Firebase Storage Bound)");
        const statusEl = document.getElementById('upload-status-text');
        const progressBar = document.getElementById('upload-progress');
        if (statusEl) statusEl.innerText = "Encoding file securely...";
        if (progressBar) progressBar.style.width = '30%';

        const reader = new FileReader();
        return new Promise((resolve, reject) => {
            reader.onload = async (e) => {
                try {
                    const base64Data = e.target.result.split(',')[1];
                    if (statusEl) statusEl.innerText = "Transmitting to Google Drive (Please wait)...";
                    if (progressBar) progressBar.style.width = '60%';

                    // 1. Send via Form/Iframe (Absolute CORS Bypass)
                    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwq1zaoR-Jtv8bb3gWaQ2IBMf5UlGK22-1wHQpp4VZ7XzqCCNDhOL1JMS_SCiziKlZn5w/exec";

                    const payload = {
                        base64: base64Data,
                        mimeType: file.type || 'application/pdf',
                        fileName: file.name
                    };

                    const iframeName = 'upload_iframe_' + Date.now();
                    const iframe = document.createElement('iframe');
                    iframe.name = iframeName;
                    iframe.style.display = 'none';
                    document.body.appendChild(iframe);

                    const form = document.createElement('form');
                    form.method = 'POST';
                    form.action = SCRIPT_URL;
                    form.target = iframeName;

                    const input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = 'data';
                    input.value = JSON.stringify(payload);
                    form.appendChild(input);

                    document.body.appendChild(form);

                    // Prevent permanent freezing natively
                    const timeoutId = setTimeout(() => {
                        window.removeEventListener('message', messageListener);
                        iframe.remove();
                        form.remove();
                        reject(new Error("Google Drive timed out! Please try again."));
                    }, 45000);

                    const messageListener = async (event) => {
                        if (event.data && typeof event.data.success !== 'undefined') {
                            clearTimeout(timeoutId);
                            window.removeEventListener('message', messageListener);
                            
                            try {
                                iframe.remove();
                                form.remove();

                                if (!event.data.success) {
                                    reject(new Error(event.data.error || "Unknown Apps Script Error"));
                                    return;
                                }

                                const downloadURL = event.data.url;
                                if (progressBar) progressBar.style.width = '90%';
                                
                                // Toast fires immediately when Drive storage is confirmed
                                if (window.showToast) window.showToast("✅ File uploaded to Drive successfully!");
                                if (statusEl) statusEl.innerText = "✅ Saved to Drive! Finishing up...";

                                // Build Firestore document data
                                const targetColl = metadata.targetCollection || 'notes';
                                const currentUser = window.currentUser || (window.authStatus?.data?.currentUser) || {};
                                const docData = {
                                    ...metadata,
                                    fileUrl: downloadURL,
                                    driveLink: downloadURL,
                                    url: downloadURL,
                                    fileType: file.type || 'application/pdf',
                                    fileName: file.name,
                                    status: metadata.status || 'pending',
                                    uploadedBy: currentUser.id || window.firebaseServices?.auth?.currentUser?.uid || 'guest',
                                    uploaderName: metadata.uploaderName || metadata.uploader || currentUser.name || "Scholar",
                                    verified: false,
                                    approvedBy: 'pending',
                                    views: 0, downloads: 0, likes: 0,
                                    createdAt: serverTimestamp ? serverTimestamp() : new Date().toISOString()
                                };
                                delete docData.targetCollection;

                                // ✅ RESOLVE IMMEDIATELY — do NOT await Firestore (it's slow)
                                // Firestore writes fire in background — modal closes right away
                                if (progressBar) progressBar.style.width = '100%';
                                console.log("Drive upload sequence completed. Firestore saving in background...");
                                resolve({ success: true, url: downloadURL });

                                // Background: Save metadata to Firestore (non-blocking)
                                addDoc(collection(db, targetColl), docData).then((docRef) => {
                                    console.log("✅ Note metadata saved to Firestore:", docRef.id);

                                    // Background: XP update (non-blocking)
                                    if (docData.uploadedBy && docData.uploadedBy !== "guest") {
                                        const fireIncrement = window.increment || window.firebaseServices?.increment;
                                        if (fireIncrement) {
                                            const userRef = doc(db, "users", docData.uploadedBy);
                                            updateDoc(userRef, {
                                                xp: fireIncrement(20),
                                                uploads: fireIncrement(1),
                                                notesCount: fireIncrement(1)
                                            }).catch(xpErr => {
                                                const fireSetDoc = window.firebaseServices?.setDoc;
                                                if (fireSetDoc) {
                                                    fireSetDoc(userRef, { xp: fireIncrement(20), uploads: fireIncrement(1), notesCount: fireIncrement(1) }, { merge: true }).catch(() => {});
                                                }
                                            });
                                        }
                                    }
                                }).catch(firestoreErr => {
                                    console.error("Firestore metadata save failed:", firestoreErr);
                                    if (window.showToast) {
                                        window.showToast("⚠️ Drive upload succeeded, but Database rejected metadata. Please re-login.");
                                    }
                                });
                            } catch (listenerError) {
                                console.error("Message Handler Error:", listenerError);
                                reject(listenerError);
                            }
                        }
                    };

                    window.addEventListener('message', messageListener);
                    form.submit(); // Automatically submit the POST trigger!

                } catch (err) {
                    console.error("❌ Apps Script Upload Error:", err);
                    reject(err);
                }
            };
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(file);
        });
    } catch (err) {
        console.error("Error in upload flow:", err);
        throw err;
    }
};
