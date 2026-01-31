const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Path to service account key
const serviceAccountPath = path.join(__dirname, '..', 'server', 'service-account.json');
const serviceAccount = require(serviceAccountPath);

// Initialize Admin SDK with the TYPO-CORRECTED bucket
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "skil-notes"
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

async function uploadNote() {
    const filePath = path.join(__dirname, '..', 'OS unit 3.pdf');
    const fileName = 'OS unit 3.pdf';

    if (!fs.existsSync(filePath)) {
        console.error("File not found:", filePath);
        return;
    }

    console.log("🚀 Starting upload for:", fileName);

    try {
        // 1. Upload to Storage
        const timestamp = Date.now();
        const destination = `notes/medicaps/cse/os/${timestamp}_${fileName}`;
        await bucket.upload(filePath, {
            destination: destination,
            metadata: {
                contentType: 'application/pdf',
            }
        });

        // 2. Construct public URL (assuming bucket is or will be public)
        // Note: For Uniform Bucket-Level Access, public access is managed at bucket level.
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${encodeURIComponent(destination)}`;

        console.log("✅ File uploaded to Storage. URL:", publicUrl);

        // 3. Add to Firestore
        const metadata = {
            title: "unit 3",
            collegeId: "medicaps",
            branchId: "cse",
            year: "2nd Year",
            semester: "Semester 4",
            subject: "os",
            type: "notes",
            uploader: "Dev Admin",
            uploaded_by: "u_admin",
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            driveLink: publicUrl,
            status: "approved",
            created_at: new Date().toISOString(),
            views: 0,
            downloads: 0,
            likes: 0,
            dislikes: 0,
            fileName: fileName,
            fileType: "application/pdf"
        };

        const docRef = await db.collection('notes').add(metadata);
        console.log("✅ Metadata added to Firestore. Doc ID:", docRef.id);
        console.log("🎉 Successfully added OS unit 3.pdf to Notes Hub!");

    } catch (error) {
        console.error("❌ Upload failed:", error);
    }
}

uploadNote();
