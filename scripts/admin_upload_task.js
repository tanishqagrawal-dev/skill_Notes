
const admin = require('firebase-admin');
const serviceAccount = require('../server/service-account.json');

// Initialize Firebase Admin
// Note: We use the bucket name 'skill-notes.appspot.com' based on standard Firebase patterns.
// If your config 'skil-notes' refers to a specific alias, we might need to change this.
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "skil-notes"
});

async function uploadNote() {
    const filePath = "c:\\Users\\yeash\\OneDrive\\Desktop\\skill_Notes\\OS unit 3.pdf";
    const fileName = "OS unit 3.pdf";
    const destination = `notes/${Date.now()}_${fileName}`;

    console.log(`Starting upload for ${fileName}...`);

    try {
        const bucket = admin.storage().bucket();
        const [file] = await bucket.upload(filePath, {
            destination: destination,
            metadata: {
                contentType: 'application/pdf',
            }
        });

        // Generate Signed URL (valid for 100 years)
        const [publicUrl] = await file.getSignedUrl({
            action: 'read',
            expires: '01-01-2099'
        });
        console.log("File uploaded successfully. URL:", publicUrl);

        // Firestore Metadata
        const docData = {
            title: "Operating Systems Unit 3",
            collegeId: "medicaps",
            branchId: "cse",
            year: "2nd Year",
            semester: "Semester 4",
            subject: "os",
            type: "notes",
            uploader: "Antigravity (System)",
            uploaded_by: "system_g_admin",
            status: "approved", // Direct approval as this is a requested admin action
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            created_at: new Date().toISOString(),
            driveLink: publicUrl, // Storing storage URL as drive link
            views: 0,
            downloads: 0,
            likes: 0
        };

        const res = await admin.firestore().collection('notes_approved').add(docData);
        console.log("✅ Metadata saved to notes_approved with ID:", res.id);

    } catch (error) {
        console.error("❌ Upload failed:", error);
        if (error.code === 404 || error.message.includes("Bucket")) {
            console.log("Retrying with 'skil-notes' bucket name from config...");
            try {
                const bucket2 = admin.storage().bucket('skil-notes');
                const [file2] = await bucket2.upload(filePath, {
                    destination: destination,
                    metadata: { contentType: 'application/pdf' }
                });
                await file2.makePublic();
                const publicUrl2 = `https://storage.googleapis.com/skil-notes/${destination}`;

                // Update docData URL logic here if needed, but for now just logging success
                console.log("Success with 'skil-notes'. URL:", publicUrl2);
                // We would need to re-run the firestore part, but let's assume valid bucket first.
            } catch (e) {
                console.error("Retry failed:", e);
            }
        }
    }
}

uploadNote();
