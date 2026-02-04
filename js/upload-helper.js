// Firebase Upload Logic
window.uploadNoteToFirebase = async function (file, metadata) {
    const { storage, db, ref, uploadBytesResumable, getDownloadURL, addDoc, collection, serverTimestamp } = window.firebaseServices;

    if (!file) return;

    try {
        // 1. Create Storage Path logic matching user request:
        // medicaps university/b.tech/cse/sem-4/operating-system

        const clean = (val) => val ? val.toString().toLowerCase().trim().replace(/\s+/g, '-') : 'misc';

        const college = clean(metadata.collegeId || metadata.college);
        const subject = clean(metadata.subjectId || metadata.subject);

        const storagePath = `notes_uploads/${college}/${subject}/${Date.now()}_${file.name}`;
        console.log("📂 Storage Path:", storagePath);
        const storageRef = ref(storage, storagePath);

        // 2. Upload File
        console.log("📤 Starting upload Bytes...");
        const uploadTask = uploadBytesResumable(storageRef, file);

        return new Promise((resolve, reject) => {
            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log('📊 Upload progress: ' + progress.toFixed(2) + '%');
                    // Update UI if needed
                    const progressBar = document.getElementById('upload-progress');
                    if (progressBar) progressBar.style.width = progress + '%';
                },
                (error) => {
                    console.error("❌ Upload failed:", error);
                    reject(error);
                },
                async () => {
                    try {
                        // 3. Get Download URL
                        console.log("🔗 Upload complete. Fetching download URL...");
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        console.log("📍 Download URL:", downloadURL);

                        // 4. Save Metadata to Firestore
                        const statusEl = document.getElementById('upload-status-text');
                        if (statusEl) statusEl.innerText = "Finalizing: Saving to Database...";

                        const targetColl = metadata.targetCollection || 'notes';
                        const docData = {
                            ...metadata,
                            fileUrl: downloadURL,
                            driveLink: downloadURL,
                            fileType: file.type || 'application/pdf',
                            fileName: file.name,
                            status: metadata.status || 'pending',
                            views: 0,
                            downloads: 0,
                            likes: 0,
                            createdAt: serverTimestamp ? serverTimestamp() : new Date().toISOString()
                        };

                        delete docData.targetCollection;

                        console.log("📝 Saving metadata to Firestore...", targetColl);
                        console.table(docData);
                        await addDoc(collection(db, targetColl), docData);
                        console.log("✅ Firestore save successful!");
                        resolve(docData);
                    } catch (err) {
                        console.error("❌ Error in Firestore save phase:", err);
                        reject(err);
                    }
                }
            );
        });
    } catch (err) {
        console.error("Error in upload flow:", err);
        throw err;
    }
};
