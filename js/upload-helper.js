// Firebase Upload Logic
window.uploadNoteToFirebase = async function (file, metadata) {
    const { storage, db, ref, uploadBytesResumable, getDownloadURL, addDoc, collection } = window.firebaseServices;

    if (!file) return;

    try {
        // 1. Create Storage Path: notes/{college}/{branch}/{subject}/{filename}
        const storagePath = `notes/${metadata.collegeId}/${metadata.branchId}/${metadata.subjectId}/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, storagePath);

        // 2. Upload File
        const uploadTask = uploadBytesResumable(storageRef, file);

        return new Promise((resolve, reject) => {
            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log('Upload is ' + progress + '% done');
                    // Update UI if needed
                    const progressBar = document.getElementById('upload-progress');
                    if (progressBar) progressBar.style.width = progress + '%';
                },
                (error) => {
                    console.error("Upload failed:", error);
                    reject(error);
                },
                async () => {
                    // 3. Get Download URL
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

                    // 4. Save Metadata to Firestore
                    const docData = {
                        ...metadata,
                        driveLink: downloadURL,
                        fileType: file.type,
                        fileName: file.name,
                        uploadedAt: new Date().toISOString(),
                        status: 'approved', // Direct admin uploads are auto-approved
                        views: 0,
                        downloads: 0,
                        likes: 0
                    };

                    await addDoc(collection(db, "notes"), docData);
                    resolve(docData);
                }
            );
        });
    } catch (err) {
        console.error("Error in upload flow:", err);
        throw err;
    }
};
