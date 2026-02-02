// Firebase Upload Logic
window.uploadNoteToFirebase = async function (file, metadata) {
    const { storage, db, ref, uploadBytesResumable, getDownloadURL, addDoc, collection } = window.firebaseServices;

    if (!file) return;

    try {
        // 1. Create Storage Path logic matching user request:
        // medicaps university/b.tech/cse/sem-4/operating-system

        const clean = (val) => val ? val.toString().toLowerCase().trim().replace(/ /g, ' ') : 'misc';

        const college = clean(metadata.collegeName || metadata.collegeId);
        const stream = clean(metadata.stream).replace(' undergraduate', 'b.tech').replace(' postgraduate', 'm.tech'); // Handle legacy values
        const branch = clean(metadata.branchId || metadata.branch);
        const sem = metadata.semester ? (metadata.semester.toString().toLowerCase().startsWith('sem') ? metadata.semester : `sem-${metadata.semester}`) : 'misc';
        const subject = clean(metadata.subjectName || metadata.subject);

        const storagePath = `notes/${college}/${stream}/${branch}/${sem}/${subject}/${Date.now()}_${file.name}`;
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
                    const targetColl = metadata.targetCollection || 'notes_pending';
                    const docData = {
                        ...metadata,
                        driveLink: downloadURL,
                        fileType: file.type,
                        fileName: file.name,
                        status: metadata.status || (targetColl === 'notes_approved' ? 'approved' : 'pending'),
                        views: 0,
                        downloads: 0,
                        likes: 0
                    };

                    delete docData.targetCollection; // Clean up before saving

                    await addDoc(collection(db, targetColl), docData);
                    resolve(docData);
                }
            );
        });
    } catch (err) {
        console.error("Error in upload flow:", err);
        throw err;
    }
};
